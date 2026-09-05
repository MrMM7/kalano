import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.utils.jwt import create_access_token


def _mock_buyer_auth(user_id: str):
    """Generate a JWT token for a buyer and user database record."""
    token = create_access_token({"user_id": user_id, "user_role": "buyer"})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": "buyer@example.com",
        "display_name": "Test Buyer",
        "user_role": "buyer",
        "address": None,
        "password_hash": "dummyhash",
    }
    return token, record


def _mock_merchant_auth(user_id: str):
    """Generate a JWT token for a merchant and user database record."""
    token = create_access_token({"user_id": user_id, "user_role": "merchant"})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": "merchant@example.com",
        "display_name": "Test Merchant",
        "user_role": "merchant",
        "address": None,
        "password_hash": "dummyhash",
    }
    return token, record


def test_add_item_to_empty_cart_creates_cart_and_item(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    # Table routing
    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "seller_products":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": seller_prod_id, "stock": 10, "price": 49.99}]
            )
        elif table_name == "carts":
            # First select returns empty (no cart yet)
            # Insert returns created cart
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
            mock_query.insert.return_value.execute.return_value = MagicMock(
                data=[{"id": 101, "user_id": user_id, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "cart_items":
            # Check existing item: returns empty
            mock_query.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[])
            )
            # Insert item: returns created cart item
            mock_query.insert.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": 1,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 2,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["cart_id"] == 101
        assert data["seller_product_id"] == seller_prod_id
        assert data["quantity"] == 2
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_increments_existing_item_quantity(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "seller_products":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": seller_prod_id, "stock": 10, "price": 49.99}]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 101, "user_id": user_id, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "cart_items":
            # Existing item with quantity 2
            mock_query.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(
                    data=[
                        {
                            "id": 1,
                            "cart_id": 101,
                            "seller_product_id": seller_prod_id,
                            "quantity": 2,
                            "created_at": "2026-09-05T20:00:00Z",
                        }
                    ]
                )
            )
            # Update returns incremented quantity (2 + 3 = 5)
            mock_query.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": 1,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 5,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 3},
            cookies={"kalano_token": token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["quantity"] == 5
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_exceeds_available_stock_returns_400(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "seller_products":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": seller_prod_id, "stock": 4, "price": 49.99}]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 101, "user_id": user_id, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "cart_items":
            mock_query.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[])
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 5},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "INSUFFICIENT_STOCK"
        assert "4 units" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_prospective_quantity_exceeds_stock_returns_400(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "seller_products":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": seller_prod_id, "stock": 5, "price": 49.99}]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 101, "user_id": user_id, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "cart_items":
            # Already 3 in cart, adding 3 more = 6 > 5
            mock_query.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(
                    data=[
                        {
                            "id": 1,
                            "cart_id": 101,
                            "seller_product_id": seller_prod_id,
                            "quantity": 3,
                            "created_at": "2026-09-05T20:00:00Z",
                        }
                    ]
                )
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 3},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INSUFFICIENT_STOCK"
        assert "5 units" in data["error"]["message"]
        assert "Current in cart: 3" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_nonexistent_seller_product_returns_404(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "seller_products":
            # Empty data -> offer not found
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "SELLER_PRODUCT_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_unauthenticated_returns_401(client: TestClient):
    seller_prod_id = str(uuid.uuid4())
    response = client.post(
        "/api/v1/cart/items",
        json={"seller_product_id": seller_prod_id, "quantity": 1},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "MISSING_TOKEN"


def test_add_item_merchant_role_returns_403(client: TestClient):
    merchant_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[merchant_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN_ROLE"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_invalid_quantity_returns_422(client: TestClient):
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[user_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        # Quantity 0 is rejected by Pydantic gt=0 constraint
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": seller_prod_id, "quantity": 0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_item_invalid_uuid_returns_422(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[user_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/cart/items",
            json={"seller_product_id": "not-a-valid-uuid", "quantity": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def _mock_fluent_query(data=None):
    q = MagicMock()
    q.select.return_value = q
    q.insert.return_value = q
    q.update.return_value = q
    q.delete.return_value = q
    q.eq.return_value = q
    q.in_.return_value = q
    q.gt.return_value = q
    q.order.return_value = q
    q.range.return_value = q
    q.execute.return_value = MagicMock(data=data if data is not None else [])
    return q


def test_get_cart_empty_when_no_cart_exists(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "carts":
            return _mock_fluent_query([])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] is None
        assert data["user_id"] == user_id
        assert data["items"] == []
        assert data["total_items"] == 0
        assert data["total_price"] == 0.0
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_cart_empty_when_cart_has_no_items(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        if table_name == "cart_items":
            return _mock_fluent_query([])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 101
        assert data["user_id"] == user_id
        assert data["items"] == []
        assert data["total_items"] == 0
        assert data["total_price"] == 0.0
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_cart_populated(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    sp_id_1 = str(uuid.uuid4())
    prod_id_1 = str(uuid.uuid4())
    seller_id_1 = str(uuid.uuid4())

    sp_id_2 = str(uuid.uuid4())
    prod_id_2 = str(uuid.uuid4())
    seller_id_2 = str(uuid.uuid4())

    raw_cart_items = [
        {
            "id": 10,
            "cart_id": 101,
            "seller_product_id": sp_id_1,
            "quantity": 2,
            "created_at": "2026-09-05T20:00:00Z",
            "seller_products": {
                "id": sp_id_1,
                "product_id": prod_id_1,
                "seller_id": seller_id_1,
                "price": 199.99,
                "stock": 15,
                "estimated_delivery_days": 3,
                "products": {
                    "id": prod_id_1,
                    "name": "Wireless Noise-Canceling Headphones",
                    "brand": "AudioTech",
                    "image_url": "https://example.com/product.jpg",
                },
                "users": {
                    "id": seller_id_1,
                    "display_name": "BestAudio Official",
                },
            },
        },
        {
            "id": 11,
            "cart_id": 101,
            "seller_product_id": sp_id_2,
            "quantity": 1,
            "created_at": "2026-09-05T20:01:00Z",
            "seller_products": {
                "id": sp_id_2,
                "product_id": prod_id_2,
                "seller_id": seller_id_2,
                "price": 50.0,
                "stock": 5,
                "estimated_delivery_days": 1,
                "products": {
                    "id": prod_id_2,
                    "name": "Bluetooth Speaker",
                    "brand": "SoundBox",
                    "image_url": None,
                },
                "users": {
                    "id": seller_id_2,
                    "display_name": "SoundStore",
                },
            },
        },
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        if table_name == "cart_items":
            return _mock_fluent_query(raw_cart_items)
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 101
        assert data["user_id"] == user_id
        assert len(data["items"]) == 2
        assert data["total_items"] == 3
        assert data["total_price"] == 449.98

        item1 = data["items"][0]
        assert item1["id"] == 10
        assert item1["product_name"] == "Wireless Noise-Canceling Headphones"
        assert item1["product_brand"] == "AudioTech"
        assert item1["product_image_url"] == "https://example.com/product.jpg"
        assert item1["seller_name"] == "BestAudio Official"
        assert item1["unit_price"] == 199.99
        assert item1["quantity"] == 2
        assert item1["subtotal"] == 399.98

        item2 = data["items"][1]
        assert item2["id"] == 11
        assert item2["product_name"] == "Bluetooth Speaker"
        assert item2["product_brand"] == "SoundBox"
        assert item2["product_image_url"] is None
        assert item2["seller_name"] == "SoundStore"
        assert item2["unit_price"] == 50.0
        assert item2["quantity"] == 1
        assert item2["subtotal"] == 50.0
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_cart_unauthenticated_returns_401(client: TestClient):
    response = client.get("/api/v1/cart")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "MISSING_TOKEN"


def test_get_cart_non_buyer_returns_403(client: TestClient):
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = _mock_fluent_query([merchant_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN_ROLE"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_success(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)
    seller_prod_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            q = MagicMock()
            q.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": 10,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 1,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
            q.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": 10,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 3,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
            return q
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        if table_name == "seller_products":
            return _mock_fluent_query([{"id": seller_prod_id, "stock": 10}])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/10",
            json={"quantity": 3},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 10
        assert data["cart_id"] == 101
        assert data["quantity"] == 3
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_insufficient_stock_returns_400(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)
    seller_prod_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query(
                [
                    {
                        "id": 10,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 1,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        if table_name == "seller_products":
            return _mock_fluent_query([{"id": seller_prod_id, "stock": 2}])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/10",
            json={"quantity": 5},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INSUFFICIENT_STOCK"
        assert "2 units" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_zero_quantity_returns_422(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = _mock_fluent_query([user_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/10",
            json={"quantity": 0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_not_found_returns_404(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query([])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/999",
            json={"quantity": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_belonging_to_another_user_returns_404(client: TestClient):
    user_id = str(uuid.uuid4())
    other_user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)
    seller_prod_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query(
                [
                    {
                        "id": 10,
                        "cart_id": 202,
                        "seller_product_id": seller_prod_id,
                        "quantity": 1,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        if table_name == "carts":
            # Belongs to other_user_id
            return _mock_fluent_query([{"id": 202, "user_id": other_user_id}])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/10",
            json={"quantity": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_patch_cart_item_unauthenticated_returns_401(client: TestClient):
    response = client.patch("/api/v1/cart/items/10", json={"quantity": 2})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "MISSING_TOKEN"


def test_patch_cart_item_non_buyer_returns_403(client: TestClient):
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = _mock_fluent_query([merchant_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/cart/items/10",
            json={"quantity": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN_ROLE"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_cart_item_success(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)
    seller_prod_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query(
                [
                    {
                        "id": 10,
                        "cart_id": 101,
                        "seller_product_id": seller_prod_id,
                        "quantity": 1,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.delete(
            "/api/v1/cart/items/10",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Cart item removed successfully."
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_cart_item_not_found_returns_404(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query([])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.delete(
            "/api/v1/cart/items/999",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_cart_item_belonging_to_another_user_returns_404(client: TestClient):
    user_id = str(uuid.uuid4())
    other_user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)
    seller_prod_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            return _mock_fluent_query([user_record])
        if table_name == "cart_items":
            return _mock_fluent_query(
                [
                    {
                        "id": 10,
                        "cart_id": 202,
                        "seller_product_id": seller_prod_id,
                        "quantity": 1,
                        "created_at": "2026-09-05T20:00:00Z",
                    }
                ]
            )
        if table_name == "carts":
            return _mock_fluent_query([{"id": 202, "user_id": other_user_id}])
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.delete(
            "/api/v1/cart/items/10",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "CART_ITEM_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_cart_item_unauthenticated_returns_401(client: TestClient):
    response = client.delete("/api/v1/cart/items/10")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "MISSING_TOKEN"


def test_delete_cart_item_non_buyer_returns_403(client: TestClient):
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = _mock_fluent_query([merchant_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.delete(
            "/api/v1/cart/items/10",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN_ROLE"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_cart_populated_unjoined_fallback(client: TestClient):
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    sp_id_1 = str(uuid.uuid4())
    prod_id_1 = str(uuid.uuid4())
    seller_id_1 = str(uuid.uuid4())

    raw_cart_items = [
        {
            "id": 10,
            "cart_id": 101,
            "seller_product_id": sp_id_1,
            "quantity": 2,
            "created_at": "2026-09-05T20:00:00Z",
        }
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            q = MagicMock()
            q.select.return_value = q
            q.eq.return_value = q

            # Differentiate buyer auth lookup from seller display_name lookup
            def users_execute():
                return MagicMock(data=[user_record])

            q.execute.side_effect = users_execute
            return q
        if table_name == "carts":
            return _mock_fluent_query([{"id": 101, "user_id": user_id}])
        if table_name == "cart_items":
            return _mock_fluent_query(raw_cart_items)
        if table_name == "seller_products":
            return _mock_fluent_query(
                [
                    {
                        "id": sp_id_1,
                        "product_id": prod_id_1,
                        "seller_id": seller_id_1,
                        "price": 199.99,
                        "stock": 15,
                        "estimated_delivery_days": 3,
                    }
                ]
            )
        if table_name == "products":
            return _mock_fluent_query(
                [
                    {
                        "name": "Wireless Noise-Canceling Headphones",
                        "brand": "AudioTech",
                        "image_url": "https://example.com/product.jpg",
                    }
                ]
            )
        return _mock_fluent_query([])

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/cart",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 101
        assert len(data["items"]) == 1
        assert data["items"][0]["product_name"] == "Wireless Noise-Canceling Headphones"
        assert data["items"][0]["subtotal"] == 399.98
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_cart_item_user_not_found_returns_401(client: TestClient):
    user_id = str(uuid.uuid4())
    token = create_access_token({"user_id": user_id, "user_role": "buyer"})

    mock_supabase = MagicMock()
    # Users table returns empty (user no longer exists)
    mock_supabase.table.return_value = _mock_fluent_query([])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.delete(
            "/api/v1/cart/items/10",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "USER_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

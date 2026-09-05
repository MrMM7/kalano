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

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.utils.jwt import create_access_token


def _mock_merchant_auth(user_id: str):
    """Generate a JWT token for a merchant and a mock user database record."""
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


def _mock_buyer_auth(user_id: str):
    """Generate a JWT token for a buyer and a mock user database record."""
    token = create_access_token({"user_id": user_id, "user_role": "buyer"})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": "buyer@example.com",
        "display_name": "Test Buyer",
        "user_role": "buyer",
        "address": "Buyer Street 123",
        "password_hash": "dummyhash",
    }
    return token, record


def _mock_logistics_auth(user_id: str):
    """Generate a JWT token for a logistics user and a mock user database record."""
    token = create_access_token({"user_id": user_id, "user_role": "logistics"})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": "logistics@example.com",
        "display_name": "Test Logistics",
        "user_role": "logistics",
        "address": None,
        "password_hash": "dummyhash",
    }
    return token, record


# ---------------------------------------------------------------------------
# 1. Authentication & Role checks
# ---------------------------------------------------------------------------


def test_list_orders_unauthenticated(client: TestClient):
    """GET /orders without auth token returns HTTP 401."""
    response = client.get("/api/v1/dashboard/orders")
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_update_order_status_unauthenticated(client: TestClient):
    """PATCH /orders/{order_id}/status without auth token returns HTTP 401."""
    response = client.patch(
        "/api/v1/dashboard/orders/101/status",
        json={"status": "confirmed"},
    )
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_list_orders_forbidden_for_buyer(client: TestClient):
    """GET /orders for buyer returns HTTP 403."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[user_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/dashboard/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_order_status_forbidden_for_buyer(client: TestClient):
    """PATCH /orders/{order_id}/status for buyer returns HTTP 403."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[user_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/dashboard/orders/101/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_orders_forbidden_for_logistics(client: TestClient):
    """GET /orders for logistics user returns HTTP 403."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_logistics_auth(user_id)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[user_record])
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/dashboard/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


# ---------------------------------------------------------------------------
# 2. GET /api/v1/dashboard/orders
# ---------------------------------------------------------------------------


def test_list_orders_empty(client: TestClient):
    """Merchant with no incoming orders returns HTTP 200 with an empty list."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            query_mock = mock_table.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[])
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/dashboard/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_orders_success(client: TestClient):
    """Merchant retrieves incoming orders with joined product and buyer details."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    prod_id = str(uuid.uuid4())
    buyer_id = str(uuid.uuid4())
    raw_order = {
        "id": 101,
        "product_id": prod_id,
        "seller_id": user_id,
        "buyer_id": buyer_id,
        "bought_price": 49.99,
        "quantity": 2,
        "delivery_types": "pending",
        "address": "123 Elm Street, City",
        "created_at": "2026-09-06T10:00:00+00:00",
        "products": {
            "id": prod_id,
            "name": "Wireless Mouse",
            "brand": "TechBrand",
            "image_url": "https://example.com/mouse.jpg",
        },
        "users": {
            "id": buyer_id,
            "display_name": "Alice Buyer",
        },
    }

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            query_mock = mock_table.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[raw_order])
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/dashboard/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["id"] == 101
        assert item["product_id"] == prod_id
        assert item["product_name"] == "Wireless Mouse"
        assert item["product_brand"] == "TechBrand"
        assert item["product_image_url"] == "https://example.com/mouse.jpg"
        assert item["bought_price"] == 49.99
        assert item["quantity"] == 2
        assert item["total_price"] == 99.98
        assert item["status"] == "pending"
        assert item["address"] == "123 Elm Street, City"
        assert item["buyer_name"] == "Alice Buyer"
        assert item["created_at"] == "2026-09-06T10:00:00+00:00"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_orders_status_filter(client: TestClient):
    """Merchant filters orders with ?status=pending query parameter."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    mock_supabase = MagicMock()
    captured_status = []

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            sel = mock_table.select.return_value
            eq_seller = sel.eq.return_value

            def eq_filter(field, val):
                if field == "delivery_types":
                    captured_status.append(val)
                res = MagicMock()
                res.order.return_value.execute.return_value = MagicMock(data=[])
                return res

            eq_seller.eq.side_effect = eq_filter
            eq_seller.order.return_value.execute.return_value = MagicMock(data=[])
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/dashboard/orders?status=pending",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert "pending" in captured_status
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


# ---------------------------------------------------------------------------
# 3. PATCH /api/v1/dashboard/orders/{order_id}/status
# ---------------------------------------------------------------------------


def test_update_order_status_success(client: TestClient):
    """Merchant successfully transitions a pending order to confirmed."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    prod_id = str(uuid.uuid4())
    order_id = 105
    existing_order = {
        "id": order_id,
        "product_id": prod_id,
        "seller_id": user_id,
        "buyer_id": str(uuid.uuid4()),
        "bought_price": 25.50,
        "quantity": 3,
        "delivery_types": "pending",
        "address": "456 Oak Avenue",
        "created_at": "2026-09-06T11:00:00+00:00",
        "products": {
            "id": prod_id,
            "name": "USB-C Cable",
            "brand": "FastWire",
            "image_url": None,
        },
        "users": {
            "display_name": "Bob Shopper",
        },
    }

    mock_supabase = MagicMock()
    updated_fields = {}

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            # select by id
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_order]
            )

            # update
            def mock_update(data):
                updated_fields.update(data)
                res = MagicMock()
                res.eq.return_value.execute.return_value = MagicMock(data=[])
                return res

            mock_table.update.side_effect = mock_update
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            f"/api/v1/dashboard/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["status"] == "confirmed"
        assert data["total_price"] == 76.50
        assert data["buyer_name"] == "Bob Shopper"
        assert updated_fields.get("delivery_types") == "confirmed"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_order_status_not_found(client: TestClient):
    """Order ID does not exist returns HTTP 404 ORDER_NOT_FOUND."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/dashboard/orders/999/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "ORDER_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_order_status_forbidden_not_owner(client: TestClient):
    """Attempting to update an order belonging to another seller returns HTTP 403 FORBIDDEN."""
    user_id = str(uuid.uuid4())
    other_seller_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    order_of_other_seller = {
        "id": 105,
        "product_id": str(uuid.uuid4()),
        "seller_id": other_seller_id,
        "buyer_id": str(uuid.uuid4()),
        "bought_price": 10.0,
        "quantity": 1,
        "delivery_types": "pending",
        "address": "456 Oak Ave",
        "created_at": "2026-09-06T11:00:00+00:00",
    }

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order_of_other_seller]
            )
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/dashboard/orders/105/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_order_status_invalid_target_status(client: TestClient):
    """Attempting transition to any status other than confirmed returns HTTP 400."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    existing_order = {
        "id": 105,
        "product_id": str(uuid.uuid4()),
        "seller_id": user_id,
        "delivery_types": "pending",
    }

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_order]
            )
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/dashboard/orders/105/status",
            json={"status": "shipped"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_order_status_already_confirmed(client: TestClient):
    """Attempting to update an order that is already confirmed returns HTTP 400."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    existing_order = {
        "id": 105,
        "product_id": str(uuid.uuid4()),
        "seller_id": user_id,
        "delivery_types": "confirmed",
    }

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_table = MagicMock()
        if name == "users":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif name == "user_orders":
            mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_order]
            )
        return mock_table

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.patch(
            "/api/v1/dashboard/orders/105/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

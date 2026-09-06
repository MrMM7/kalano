import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.utils.jwt import create_access_token


def _mock_user_auth(user_id: str, role: str):
    """Generate a JWT token and mock user database record for a given role."""
    token = create_access_token({"user_id": user_id, "user_role": role})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": f"{role}@example.com",
        "display_name": f"Test {role.capitalize()}",
        "user_role": role,
        "address": "123 Main St",
        "password_hash": "dummyhash",
    }
    return token, record


def test_logistics_orders_unauthenticated(client: TestClient):
    """GET /api/v1/logistics/orders without auth token returns HTTP 401."""
    response = client.get("/api/v1/logistics/orders")
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_logistics_orders_forbidden_for_buyer(client: TestClient):
    """Buyer account receives HTTP 403 Forbidden."""
    buyer_id = str(uuid.uuid4())
    token, buyer_record = _mock_user_auth(buyer_id, "buyer")

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[buyer_record]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_forbidden_for_merchant(client: TestClient):
    """Merchant account receives HTTP 403 Forbidden."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_user_auth(merchant_id, "merchant")

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_empty_list(client: TestClient):
    """Logistics user receives HTTP 200 with empty array when no orders exist."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif table_name == "user_orders":
            mock_t.select.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_successful_retrieval(client: TestClient):
    """Logistics user successfully retrieves enriched orders."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    product_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())
    buyer_id = str(uuid.uuid4())

    mock_orders = [
        {
            "id": 101,
            "product_id": product_id,
            "seller_id": seller_id,
            "buyer_id": buyer_id,
            "bought_price": 99.50,
            "quantity": 2,
            "delivery_types": "pending",
            "address": "789 Logistics Way, City, ST 12345",
            "created_at": "2026-09-06T12:00:00Z",
            "products": {
                "name": "Ergonomic Chair",
                "brand": "ComfortPlus",
                "image_url": "https://example.com/chair.jpg",
            },
            "seller": {"display_name": "Chair Depot"},
            "buyer": {"display_name": "Alice Buyer"},
        }
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif table_name == "user_orders":
            mock_t.select.return_value.order.return_value.execute.return_value = MagicMock(
                data=mock_orders
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["id"] == 101
        assert item["product_id"] == product_id
        assert item["product_name"] == "Ergonomic Chair"
        assert item["product_brand"] == "ComfortPlus"
        assert item["product_image_url"] == "https://example.com/chair.jpg"
        assert item["seller_id"] == seller_id
        assert item["seller_name"] == "Chair Depot"
        assert item["buyer_id"] == buyer_id
        assert item["buyer_name"] == "Alice Buyer"
        assert item["bought_price"] == 99.50
        assert item["quantity"] == 2
        assert item["subtotal"] == 199.00
        assert item["delivery_types"] == "pending"
        assert item["address"] == "789 Logistics Way, City, ST 12345"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_status_filtering(client: TestClient):
    """Querying with ?status=shipped applies the filter."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    mock_orders = [
        {
            "id": 102,
            "product_id": str(uuid.uuid4()),
            "seller_id": str(uuid.uuid4()),
            "buyer_id": str(uuid.uuid4()),
            "bought_price": 50.0,
            "quantity": 1,
            "delivery_types": "shipped",
            "address": "100 Delivery St",
            "created_at": "2026-09-06T12:00:00Z",
            "products": {"name": "Box", "brand": "PackCo", "image_url": None},
            "seller": {"display_name": "Pack Store"},
            "buyer": {"display_name": "Bob"},
        }
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif table_name == "user_orders":
            # select().eq().order().execute()
            mock_t.select.return_value.eq.return_value.order.return_value.execute.return_value = (
                MagicMock(data=mock_orders)
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders?status=shipped",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["delivery_types"] == "shipped"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_invalid_status(client: TestClient):
    """Invalid status query returns HTTP 400 with INVALID_STATUS."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders?status=invalid_status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "INVALID_STATUS"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_fallback_lookups(client: TestClient):
    """Unjoined raw order rows trigger individual fallback lookups."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    product_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())
    buyer_id = str(uuid.uuid4())

    raw_orders = [
        {
            "id": 103,
            "product_id": product_id,
            "seller_id": seller_id,
            "buyer_id": buyer_id,
            "bought_price": 25.0,
            "quantity": 3,
            "delivery_types": "confirmed",
            "address": "Fallback Ave",
            "created_at": "2026-09-06T13:00:00Z",
        }
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":

            def mock_eq(field, val):
                m_exec = MagicMock()
                if val == logistics_id:
                    m_exec.execute.return_value = MagicMock(data=[logistics_record])
                elif val == seller_id:
                    m_exec.execute.return_value = MagicMock(
                        data=[{"display_name": "Fallback Seller"}]
                    )
                elif val == buyer_id:
                    m_exec.execute.return_value = MagicMock(
                        data=[{"display_name": "Fallback Buyer"}]
                    )
                else:
                    m_exec.execute.return_value = MagicMock(data=[])
                return m_exec

            mock_t.select.return_value.eq.side_effect = mock_eq
        elif table_name == "products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"name": "Fallback Item", "brand": "BrandX", "image_url": None}]
            )
        elif table_name == "user_orders":
            mock_t.select.return_value.order.return_value.execute.return_value = MagicMock(
                data=raw_orders
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["product_name"] == "Fallback Item"
        assert item["seller_name"] == "Fallback Seller"
        assert item["buyer_name"] == "Fallback Buyer"
        assert item["subtotal"] == 75.0
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_logistics_orders_null_buyer(client: TestClient):
    """Order with null buyer_id defaults buyer_name to Unknown Buyer."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    product_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())

    raw_orders = [
        {
            "id": 104,
            "product_id": product_id,
            "seller_id": seller_id,
            "buyer_id": None,
            "bought_price": 10.0,
            "quantity": 1,
            "delivery_types": "pending",
            "address": "Guest Address",
            "created_at": "2026-09-06T14:00:00Z",
            "products": {"name": "Guest Item", "brand": "GuestBrand", "image_url": None},
            "seller": {"display_name": "Guest Seller"},
            "buyer": None,
        }
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif table_name == "user_orders":
            mock_t.select.return_value.order.return_value.execute.return_value = MagicMock(
                data=raw_orders
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/logistics/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["buyer_id"] is None
        assert item["buyer_name"] == "Unknown Buyer"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

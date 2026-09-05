import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.utils.jwt import create_access_token


def _mock_buyer_auth(user_id: str):
    """Generate a JWT token for a buyer and a mock user database record."""
    token = create_access_token({"user_id": user_id, "user_role": "buyer"})
    record = {
        "id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email": "buyer@example.com",
        "display_name": "Test Buyer",
        "user_role": "buyer",
        "address": "Original Address 100",
        "password_hash": "dummyhash",
    }
    return token, record


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


def test_orders_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401 with standard error envelope."""
    response = client.get("/api/v1/orders")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "MISSING_TOKEN"


def test_orders_forbidden_for_merchant(client: TestClient):
    """User with role merchant returns HTTP 403 with code FORBIDDEN and expected message."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_merchant_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "FORBIDDEN"
        assert data["error"]["message"] == "Only buyers can view order history."
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_orders_forbidden_for_logistics(client: TestClient):
    """User with role logistics returns HTTP 403 with code FORBIDDEN and expected message."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_logistics_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "FORBIDDEN"
        assert data["error"]["message"] == "Only buyers can view order history."
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_orders_empty_list_for_buyer_with_no_orders(client: TestClient):
    """Buyer with zero orders returns HTTP 200 with {'orders': [], 'total_orders': 0}."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "user_orders":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[])
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data == {"orders": [], "total_orders": 0}
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_orders_success_with_multiple_orders_descending(client: TestClient):
    """Buyer with multiple orders placed at different times:

    - Verify returned sorted newest to oldest.
    - Verify all fields in OrderDetailResponse.
    - Verify subtotal is calculated as bought_price * quantity (e.g. 49.99 * 2 = 99.98).
    """
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    prod1_id = str(uuid.uuid4())
    seller1_id = str(uuid.uuid4())
    prod2_id = str(uuid.uuid4())
    seller2_id = str(uuid.uuid4())

    created_at_new = "2026-09-05T20:00:00+00:00"
    created_at_old = "2026-09-01T10:00:00+00:00"

    mock_orders_data = [
        {
            "id": 102,
            "product_id": prod1_id,
            "bought_price": 49.99,
            "buyer_id": user_id,
            "delivery_types": "pending",
            "address": "456 Market St, San Francisco, CA",
            "seller_id": seller1_id,
            "quantity": 2,
            "created_at": created_at_new,
            "products": {
                "id": prod1_id,
                "name": "Mechanical Keyboard",
                "brand": "KeyTech",
                "image_url": "https://example.com/keyboard.png",
            },
            "users": {
                "id": seller1_id,
                "display_name": "KeyTech Official",
            },
        },
        {
            "id": 101,
            "product_id": prod2_id,
            "bought_price": 25.50,
            "buyer_id": user_id,
            "delivery_types": "delivered",
            "address": "123 Elm St, San Jose, CA",
            "seller_id": seller2_id,
            "quantity": 3,
            "created_at": created_at_old,
            "products": {
                "id": prod2_id,
                "name": "USB-C Hub",
                "brand": "Anker",
                "image_url": "https://example.com/hub.png",
            },
            "users": {
                "id": seller2_id,
                "display_name": "Anker Direct",
            },
        },
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "user_orders":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=mock_orders_data)
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_orders"] == 2
        orders = data["orders"]
        assert len(orders) == 2

        # Verify ordering: newest first (id 102 before 101)
        assert orders[0]["id"] == 102
        assert orders[1]["id"] == 101
        assert orders[0]["created_at"] == created_at_new
        assert orders[1]["created_at"] == created_at_old

        # Verify order 0 fields and subtotal (49.99 * 2 = 99.98)
        assert orders[0]["product_id"] == prod1_id
        assert orders[0]["product_name"] == "Mechanical Keyboard"
        assert orders[0]["product_brand"] == "KeyTech"
        assert orders[0]["product_image_url"] == "https://example.com/keyboard.png"
        assert orders[0]["seller_id"] == seller1_id
        assert orders[0]["seller_name"] == "KeyTech Official"
        assert orders[0]["bought_price"] == 49.99
        assert orders[0]["quantity"] == 2
        assert orders[0]["subtotal"] == 99.98
        assert orders[0]["delivery_types"] == "pending"
        assert orders[0]["address"] == "456 Market St, San Francisco, CA"

        # Verify order 1 fields and subtotal (25.50 * 3 = 76.5)
        assert orders[1]["product_id"] == prod2_id
        assert orders[1]["product_name"] == "USB-C Hub"
        assert orders[1]["product_brand"] == "Anker"
        assert orders[1]["product_image_url"] == "https://example.com/hub.png"
        assert orders[1]["seller_id"] == seller2_id
        assert orders[1]["seller_name"] == "Anker Direct"
        assert orders[1]["bought_price"] == 25.50
        assert orders[1]["quantity"] == 3
        assert orders[1]["subtotal"] == 76.50
        assert orders[1]["delivery_types"] == "delivered"
        assert orders[1]["address"] == "123 Elm St, San Jose, CA"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_orders_fallback_handling(client: TestClient):
    """When joined objects (products, users) are missing:

    Verify fallback queries and safe defaults ('Unknown Product', 'Unknown Brand', etc.).
    """
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    # Order 1: Has product_id and seller_id, but joined products/users are None.
    # Fallback lookup in products table succeeds; fallback lookup in users table succeeds.
    prod1_id = str(uuid.uuid4())
    seller1_id = str(uuid.uuid4())

    # Order 2: Joined objects missing and fallback queries return empty / deleted records.
    # Should use safe defaults ('Unknown Product', 'Unknown Brand', 'Unknown Merchant').
    prod2_id = str(uuid.uuid4())
    seller2_id = str(uuid.uuid4())

    mock_orders_raw = [
        {
            "id": 201,
            "product_id": prod1_id,
            "bought_price": 10.0,
            "buyer_id": user_id,
            "delivery_types": "shipped",
            "address": "Fallback Address 1",
            "seller_id": seller1_id,
            "quantity": 1,
            "created_at": "2026-09-05T12:00:00+00:00",
            # joined fields are None
            "products": None,
            "users": None,
        },
        {
            "id": 202,
            "product_id": prod2_id,
            "bought_price": 15.0,
            "buyer_id": user_id,
            "delivery_types": "confirmed",
            "address": "Fallback Address 2",
            "seller_id": seller2_id,
            "quantity": 2,
            "created_at": "2026-09-04T12:00:00+00:00",
            # joined fields are completely omitted/missing
        },
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":

            def users_select(fields: str = "*"):
                sel_query = MagicMock()

                def users_eq(field: str, value: str):
                    eq_query = MagicMock()
                    if field == "id" and str(value) == user_id:
                        # Auth lookup for current user
                        eq_query.execute.return_value = MagicMock(data=[user_record])
                    elif field == "id" and str(value) == seller1_id:
                        # Fallback lookup for seller 1
                        eq_query.execute.return_value = MagicMock(
                            data=[{"display_name": "Resolved Seller 1"}]
                        )
                    else:
                        # Fallback lookup for seller 2 (not found)
                        eq_query.execute.return_value = MagicMock(data=[])
                    return eq_query

                sel_query.eq.side_effect = users_eq
                return sel_query

            mock_query.select.side_effect = users_select

        elif table_name == "products":

            def products_select(fields: str = "*"):
                sel_query = MagicMock()

                def products_eq(field: str, value: str):
                    eq_query = MagicMock()
                    if field == "id" and str(value) == prod1_id:
                        # Fallback lookup for product 1
                        eq_query.execute.return_value = MagicMock(
                            data=[
                                {
                                    "name": "Resolved Product 1",
                                    "brand": "Resolved Brand 1",
                                    "image_url": "https://example.com/prod1.png",
                                }
                            ]
                        )
                    else:
                        # Fallback lookup for product 2 (not found)
                        eq_query.execute.return_value = MagicMock(data=[])
                    return eq_query

                sel_query.eq.side_effect = products_eq
                return sel_query

            mock_query.select.side_effect = products_select

        elif table_name == "user_orders":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=mock_orders_raw)

        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(
            "/api/v1/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_orders"] == 2
        orders = data["orders"]

        # Order 1 verified with resolved fallback query data
        assert orders[0]["id"] == 201
        assert orders[0]["product_name"] == "Resolved Product 1"
        assert orders[0]["product_brand"] == "Resolved Brand 1"
        assert orders[0]["product_image_url"] == "https://example.com/prod1.png"
        assert orders[0]["seller_name"] == "Resolved Seller 1"
        assert orders[0]["subtotal"] == 10.0

        # Order 2 verified with safe defaults when fallback queries return empty
        assert orders[1]["id"] == 202
        assert orders[1]["product_name"] == "Unknown Product"
        assert orders[1]["product_brand"] == "Unknown Brand"
        assert orders[1]["product_image_url"] is None
        assert orders[1]["seller_name"] == "Unknown Merchant"
        assert orders[1]["subtotal"] == 30.0
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

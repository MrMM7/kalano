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


def _build_mock_order(
    order_id: int = 101,
    delivery_types: str = "pending",
    quantity: int = 2,
    bought_price: float = 49.99,
    product_id: str | None = None,
    seller_id: str | None = None,
    buyer_id: str | None = None,
):
    p_id = product_id or str(uuid.uuid4())
    s_id = seller_id or str(uuid.uuid4())
    b_id = buyer_id or str(uuid.uuid4())
    return {
        "id": order_id,
        "product_id": p_id,
        "seller_id": s_id,
        "buyer_id": b_id,
        "bought_price": bought_price,
        "quantity": quantity,
        "delivery_types": delivery_types,
        "address": "456 Main St, City, ST",
        "created_at": "2026-09-06T12:00:00Z",
        "products": {
            "name": "Test Mechanical Keyboard",
            "brand": "KeyTech",
            "image_url": "https://example.com/kb.png",
        },
        "seller": {"display_name": "KeyTech Official"},
        "buyer": {"display_name": "Jane Buyer"},
    }


def test_update_status_unauthenticated(client: TestClient):
    """PATCH without auth credentials returns HTTP 401 MISSING_TOKEN."""
    response = client.patch(
        "/api/v1/logistics/orders/101",
        json={"status": "confirmed"},
    )
    assert response.status_code == 401
    res = response.json()
    assert "error" in res
    assert res["error"]["code"] == "MISSING_TOKEN"


def test_update_status_forbidden_for_buyer(client: TestClient):
    """PATCH with buyer role returns HTTP 403 FORBIDDEN."""
    buyer_id = str(uuid.uuid4())
    token, buyer_record = _mock_user_auth(buyer_id, "buyer")

    mock_supabase = MagicMock()
    mock_supabase.table(
        "users"
    ).select.return_value.eq.return_value.execute.return_value = MagicMock(data=[buyer_record])

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/101",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "confirmed"},
        )
        assert response.status_code == 403
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_status_forbidden_for_merchant(client: TestClient):
    """PATCH with merchant role returns HTTP 403 FORBIDDEN."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_user_auth(merchant_id, "merchant")

    mock_supabase = MagicMock()
    mock_supabase.table(
        "users"
    ).select.return_value.eq.return_value.execute.return_value = MagicMock(data=[merchant_record])

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/101",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "confirmed"},
        )
        assert response.status_code == 403
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_status_order_not_found(client: TestClient):
    """PATCH with non-existent order ID returns HTTP 404 ORDER_NOT_FOUND."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            # order not found
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/9999",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "confirmed"},
        )
        assert response.status_code == 404
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "ORDER_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_status_invalid_status_enum(client: TestClient):
    """PATCH with unknown status value returns HTTP 400 INVALID_STATUS."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    mock_supabase = MagicMock()
    mock_supabase.table(
        "users"
    ).select.return_value.eq.return_value.execute.return_value = MagicMock(data=[logistics_record])

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/101",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "in_space"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_valid_transition_pending_to_confirmed(client: TestClient):
    """Transition from pending to confirmed succeeds with HTTP 200."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=101, delivery_types="pending")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "confirmed"}]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/101",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "confirmed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 101
        assert data["delivery_types"] == "confirmed"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_valid_transition_confirmed_to_shipped(client: TestClient):
    """Transition from confirmed to shipped succeeds with HTTP 200."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=102, delivery_types="confirmed")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "shipped"}]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/102",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "shipped"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 102
        assert data["delivery_types"] == "shipped"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_valid_transition_shipped_to_delivered(client: TestClient):
    """Transition from shipped to delivered succeeds with HTTP 200 (End Delivery)."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=103, delivery_types="shipped")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "delivered"}]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/103",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "delivered"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 103
        assert data["delivery_types"] == "delivered"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_valid_transition_delivered_to_returned(client: TestClient):
    """Transition from delivered to returned succeeds with HTTP 200."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=104, delivery_types="delivered")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "returned"}]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/104",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "returned"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 104
        assert data["delivery_types"] == "returned"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_cancellation_restores_seller_product_stock(client: TestClient):
    """Transitioning to cancelled restores quantity to seller_products stock."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    product_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())
    seller_product_row_id = str(uuid.uuid4())

    order = _build_mock_order(
        order_id=105,
        delivery_types="shipped",
        quantity=3,
        product_id=product_id,
        seller_id=seller_id,
    )

    sp_record = {
        "id": seller_product_row_id,
        "product_id": product_id,
        "seller_id": seller_id,
        "stock": 10,
    }

    mock_supabase = MagicMock()
    updated_stock = None

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "cancelled"}]
            )
        elif name == "seller_products":
            # select("id, stock").eq("product_id", ...).eq("seller_id", ...).execute()
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[sp_record])
            )

            def mock_update(payload):
                nonlocal updated_stock
                updated_stock = payload.get("stock")
                mock_up_exec = MagicMock()
                mock_up_exec.eq.return_value.execute.return_value = MagicMock(
                    data=[{**sp_record, **payload}]
                )
                return mock_up_exec

            mock_t.update.side_effect = mock_update
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/105",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "cancelled"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 105
        assert data["delivery_types"] == "cancelled"
        # 10 + 3 = 13
        assert updated_stock == 13
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_cancellation_from_pending_restores_stock(client: TestClient):
    """Transitioning pending order to cancelled restores inventory."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")

    product_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())
    order = _build_mock_order(
        order_id=106,
        delivery_types="pending",
        quantity=5,
        product_id=product_id,
        seller_id=seller_id,
    )
    sp_record = {"id": str(uuid.uuid4()), "stock": 2}

    mock_supabase = MagicMock()
    updated_stock = None

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "cancelled"}]
            )
        elif name == "seller_products":
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[sp_record])
            )

            def mock_update(payload):
                nonlocal updated_stock
                updated_stock = payload.get("stock")
                m_exec = MagicMock()
                m_exec.eq.return_value.execute.return_value = MagicMock(data=[payload])
                return m_exec

            mock_t.update.side_effect = mock_update
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/106",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "cancelled"},
        )
        assert response.status_code == 200
        assert updated_stock == 7  # 2 + 5
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_cancellation_when_seller_product_missing_proceeds(client: TestClient):
    """If seller_products row is missing during cancellation, logs warning and
    still cancels order.
    """
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=107, delivery_types="confirmed")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**order, "delivery_types": "cancelled"}]
            )
        elif name == "seller_products":
            # No matching seller product row
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[])
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/107",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "cancelled"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["delivery_types"] == "cancelled"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_illegal_transition_pending_to_delivered(client: TestClient):
    """Skipping status from pending directly to delivered returns 400 INVALID_STATUS_TRANSITION."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=108, delivery_types="pending")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/108",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "delivered"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_illegal_transition_confirmed_to_returned(client: TestClient):
    """Invalid transition confirmed -> returned returns 400 INVALID_STATUS_TRANSITION."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=109, delivery_types="confirmed")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/109",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "returned"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_illegal_transition_delivered_to_shipped(client: TestClient):
    """Backward transition delivered -> shipped returns 400 INVALID_STATUS_TRANSITION."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=110, delivery_types="delivered")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/110",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "shipped"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_terminal_transition_from_cancelled(client: TestClient):
    """Transitioning out of cancelled (terminal) returns 400 INVALID_STATUS_TRANSITION."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=111, delivery_types="cancelled")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/111",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "shipped"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_terminal_transition_from_returned(client: TestClient):
    """Transitioning out of returned (terminal) returns 400 INVALID_STATUS_TRANSITION."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=112, delivery_types="returned")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/112",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "delivered"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_identical_status_transition_rejected(client: TestClient):
    """Attempting identical status transition (e.g. confirmed -> confirmed)
    returns 400 INVALID_STATUS_TRANSITION.
    """
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_user_auth(logistics_id, "logistics")
    order = _build_mock_order(order_id=113, delivery_types="confirmed")

    mock_supabase = MagicMock()

    def table_router(name: str):
        mock_t = MagicMock()
        if name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[logistics_record]
            )
        elif name == "user_orders":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[order]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            "/api/v1/logistics/orders/113",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "confirmed"},
        )
        assert response.status_code == 400
        res = response.json()
        assert "error" in res
        assert res["error"]["code"] == "INVALID_STATUS_TRANSITION"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

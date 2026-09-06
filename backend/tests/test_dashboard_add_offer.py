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


def test_add_offer_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401."""
    payload = {
        "product_id": str(uuid.uuid4()),
        "price": 89.99,
        "stock": 15,
        "estimated_delivery_days": 2,
    }
    response = client.post("/api/v1/dashboard/offers", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "MISSING_TOKEN"


def test_add_offer_forbidden_for_buyer(client: TestClient):
    """Buyer account receives HTTP 403 Forbidden."""
    buyer_id = str(uuid.uuid4())
    token, buyer_record = _mock_buyer_auth(buyer_id)

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
        payload = {
            "product_id": str(uuid.uuid4()),
            "price": 89.99,
            "stock": 15,
            "estimated_delivery_days": 2,
        }
        response = client.post(
            "/api/v1/dashboard/offers",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "FORBIDDEN"
        assert "merchants" in data["error"]["message"].lower()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_offer_validation_errors(client: TestClient):
    """Invalid payload values (price <= 0, stock < 0, delivery < 1) receive HTTP 422."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

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
        # 1. Price <= 0
        res = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": str(uuid.uuid4()),
                "price": 0.0,
                "stock": 10,
                "estimated_delivery_days": 2,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

        # 2. Stock < 0
        res = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": str(uuid.uuid4()),
                "price": 10.0,
                "stock": -1,
                "estimated_delivery_days": 2,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

        # 3. Estimated delivery days < 1
        res = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": str(uuid.uuid4()),
                "price": 10.0,
                "stock": 5,
                "estimated_delivery_days": 0,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_offer_product_not_found(client: TestClient):
    """Non-existent product_id returns HTTP 404 with PRODUCT_NOT_FOUND."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    product_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": product_id,
                "price": 49.99,
                "stock": 20,
                "estimated_delivery_days": 3,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "PRODUCT_NOT_FOUND"
        assert product_id in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_offer_duplicate_offer(client: TestClient):
    """Duplicate offer by the same merchant returns HTTP 409 with DUPLICATE_OFFER."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    product_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": product_id}]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[{"id": str(uuid.uuid4())}])
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": product_id,
                "price": 49.99,
                "stock": 20,
                "estimated_delivery_days": 3,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 409
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "DUPLICATE_OFFER"
        assert "active offer" in data["error"]["message"].lower()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_offer_success(client: TestClient):
    """Merchant successfully creates an offer on an existing product, returns HTTP 201."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    product_id = str(uuid.uuid4())
    created_offer_id = str(uuid.uuid4())
    timestamp = "2026-09-06T12:00:00Z"

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": product_id}]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[])
            )
            mock_t.insert.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": created_offer_id,
                        "product_id": product_id,
                        "seller_id": merchant_id,
                        "price": 89.99,
                        "stock": 15,
                        "estimated_delivery_days": 2,
                        "created_at": timestamp,
                    }
                ]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": product_id,
                "price": 89.99,
                "stock": 15,
                "estimated_delivery_days": 2,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == created_offer_id
        assert data["product_id"] == product_id
        assert data["seller_id"] == merchant_id
        assert data["price"] == 89.99
        assert data["stock"] == 15
        assert data["estimated_delivery_days"] == 2
        assert data["created_at"] is not None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_add_offer_success_without_estimated_delivery_days(client: TestClient):
    """Merchant successfully creates an offer omitting optional estimated_delivery_days."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    product_id = str(uuid.uuid4())
    created_offer_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": product_id}]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
                MagicMock(data=[])
            )
            mock_t.insert.return_value.execute.return_value = MagicMock(
                data=[
                    {
                        "id": created_offer_id,
                        "product_id": product_id,
                        "seller_id": merchant_id,
                        "price": 45.0,
                        "stock": 5,
                        "estimated_delivery_days": None,
                        "created_at": "2026-09-06T12:00:00Z",
                    }
                ]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.post(
            "/api/v1/dashboard/offers",
            json={
                "product_id": product_id,
                "price": 45.0,
                "stock": 5,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == created_offer_id
        assert data["estimated_delivery_days"] is None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

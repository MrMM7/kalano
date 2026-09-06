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


def test_merchant_offers_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401."""
    response = client.get("/api/v1/dashboard/offers")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "MISSING_TOKEN"


def test_merchant_offers_forbidden_for_buyer(client: TestClient):
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
        response = client.get(
            "/api/v1/dashboard/offers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "FORBIDDEN"
        assert "merchants" in data["error"]["message"].lower()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_merchant_offers_forbidden_for_logistics(client: TestClient):
    """Logistics account receives HTTP 403 Forbidden."""
    logistics_id = str(uuid.uuid4())
    token, logistics_record = _mock_logistics_auth(logistics_id)

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
            "/api/v1/dashboard/offers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_merchant_offers_empty_list(client: TestClient):
    """Merchant with no listings receives HTTP 200 with empty array."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.order.return_value.execute.return_value = (
                MagicMock(data=[])
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/dashboard/offers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_merchant_offers_successful_retrieval(client: TestClient):
    """Merchant retrieves their offers joined with product information."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    offer_id_1 = str(uuid.uuid4())
    product_id_1 = str(uuid.uuid4())
    offer_id_2 = str(uuid.uuid4())
    product_id_2 = str(uuid.uuid4())

    mock_offers_data = [
        {
            "id": offer_id_1,
            "product_id": product_id_1,
            "seller_id": merchant_id,
            "price": 149.99,
            "stock": 25,
            "estimated_delivery_days": 3,
            "created_at": "2026-09-01T12:00:00Z",
            "products": {
                "id": product_id_1,
                "name": "Wireless Noise-Cancelling Headphones",
                "brand": "SoundWave",
                "description": "High-fidelity audio with adaptive active noise cancellation.",
                "image_url": "https://example.com/headphones.jpg",
            },
        },
        {
            "id": offer_id_2,
            "product_id": product_id_2,
            "seller_id": merchant_id,
            "price": 29.50,
            "stock": 100,
            "estimated_delivery_days": 1,
            "created_at": "2026-08-31T09:30:00Z",
            "products": {
                "id": product_id_2,
                "name": "USB-C Fast Charging Cable",
                "brand": "PowerLink",
                "description": "Durable braided nylon cable.",
                "image_url": None,
            },
        },
    ]

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.order.return_value.execute.return_value = (
                MagicMock(data=mock_offers_data)
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.get(
            "/api/v1/dashboard/offers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        items = response.json()
        assert len(items) == 2

        assert items[0]["id"] == offer_id_1
        assert items[0]["product_id"] == product_id_1
        assert items[0]["product_name"] == "Wireless Noise-Cancelling Headphones"
        assert items[0]["product_brand"] == "SoundWave"
        assert (
            items[0]["product_description"]
            == "High-fidelity audio with adaptive active noise cancellation."
        )
        assert items[0]["product_image_url"] == "https://example.com/headphones.jpg"
        assert items[0]["price"] == 149.99
        assert items[0]["stock"] == 25
        assert items[0]["estimated_delivery_days"] == 3

        assert items[1]["id"] == offer_id_2
        assert items[1]["product_id"] == product_id_2
        assert items[1]["product_name"] == "USB-C Fast Charging Cable"
        assert items[1]["product_image_url"] is None
        assert items[1]["price"] == 29.50
        assert items[1]["stock"] == 100
        assert items[1]["estimated_delivery_days"] == 1
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

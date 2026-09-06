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


def test_update_offer_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401."""
    offer_id = str(uuid.uuid4())
    response = client.patch(
        f"/api/v1/dashboard/offers/{offer_id}",
        json={"price": 29.99},
    )
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_delete_offer_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401."""
    offer_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/dashboard/offers/{offer_id}")
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_update_offer_forbidden_for_buyer(client: TestClient):
    """Buyer role receives HTTP 403 FORBIDDEN on PATCH."""
    buyer_id = str(uuid.uuid4())
    token, buyer_record = _mock_buyer_auth(buyer_id)
    offer_id = str(uuid.uuid4())

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
        response = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"price": 29.99},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_offer_forbidden_for_buyer(client: TestClient):
    """Buyer role receives HTTP 403 FORBIDDEN on DELETE."""
    buyer_id = str(uuid.uuid4())
    token, buyer_record = _mock_buyer_auth(buyer_id)
    offer_id = str(uuid.uuid4())

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
        response = client.delete(
            f"/api/v1/dashboard/offers/{offer_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_offer_empty_body_returns_400(client: TestClient):
    """Empty JSON payload returns HTTP 400 with EMPTY_UPDATE code."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

    existing_offer = {
        "id": offer_id,
        "product_id": str(uuid.uuid4()),
        "seller_id": merchant_id,
        "price": 100.0,
        "stock": 10,
        "estimated_delivery_days": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "EMPTY_UPDATE"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_offer_invalid_field_values_return_422(client: TestClient):
    """Validation errors for price <= 0, stock < 0, or estimated_delivery_days < 1."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

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
        # Price <= 0
        res1 = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"price": 0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res1.status_code == 422

        # Stock < 0
        res2 = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"stock": -5},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res2.status_code == 422

        # estimated_delivery_days < 1
        res3 = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"estimated_delivery_days": 0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res3.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_offer_not_found(client: TestClient):
    """Attempting to update a non-existent offer returns HTTP 404 OFFER_NOT_FOUND."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"price": 50.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "OFFER_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_offer_cross_merchant_forbidden(client: TestClient):
    """Attempting to update another merchant's offer returns HTTP 403 FORBIDDEN."""
    merchant_id = str(uuid.uuid4())
    other_merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

    existing_offer = {
        "id": offer_id,
        "product_id": str(uuid.uuid4()),
        "seller_id": other_merchant_id,
        "price": 100.0,
        "stock": 10,
        "estimated_delivery_days": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"price": 50.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_update_offer_success(client: TestClient):
    """Successfully updating price and stock returns HTTP 200 with updated fields."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())

    existing_offer = {
        "id": offer_id,
        "product_id": product_id,
        "seller_id": merchant_id,
        "price": 89.99,
        "stock": 15,
        "estimated_delivery_days": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    updated_offer = {
        **existing_offer,
        "price": 79.99,
        "stock": 25,
        "estimated_delivery_days": 2,
    }

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
            mock_t.update.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[updated_offer]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.patch(
            f"/api/v1/dashboard/offers/{offer_id}",
            json={"price": 79.99, "stock": 25, "estimated_delivery_days": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["id"] == offer_id
        assert res_data["price"] == 79.99
        assert res_data["stock"] == 25
        assert res_data["estimated_delivery_days"] == 2
        assert res_data["seller_id"] == merchant_id
        assert res_data["product_id"] == product_id
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_offer_not_found(client: TestClient):
    """Attempting to delete a non-existent offer returns HTTP 404 OFFER_NOT_FOUND."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.delete(
            f"/api/v1/dashboard/offers/{offer_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "OFFER_NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_offer_cross_merchant_forbidden(client: TestClient):
    """Attempting to delete another merchant's offer returns HTTP 403 FORBIDDEN."""
    merchant_id = str(uuid.uuid4())
    other_merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())

    existing_offer = {
        "id": offer_id,
        "product_id": str(uuid.uuid4()),
        "seller_id": other_merchant_id,
        "price": 100.0,
        "stock": 10,
        "estimated_delivery_days": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "seller_products":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.delete(
            f"/api/v1/dashboard/offers/{offer_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_delete_offer_success(client: TestClient):
    """Successfully deleting an owned offer returns HTTP 200 and removes cart items and offer."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)
    offer_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())

    existing_offer = {
        "id": offer_id,
        "product_id": product_id,
        "seller_id": merchant_id,
        "price": 89.99,
        "stock": 15,
        "estimated_delivery_days": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    mock_supabase = MagicMock()
    mock_cart_items = MagicMock()
    mock_seller_prods = MagicMock()

    def table_router(table_name: str):
        if table_name == "users":
            m = MagicMock()
            m.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
            return m
        elif table_name == "seller_products":
            mock_seller_prods.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
            mock_seller_prods.delete.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[existing_offer]
            )
            return mock_seller_prods
        elif table_name == "cart_items":
            mock_cart_items.delete.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[]
            )
            return mock_cart_items
        return MagicMock()

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        response = client.delete(
            f"/api/v1/dashboard/offers/{offer_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["id"] == offer_id
        assert res_data["message"] == "Offer successfully deleted"

        # Verify cart_items was queried for deletion
        mock_cart_items.delete.return_value.eq.assert_called_once_with(
            "seller_product_id", offer_id
        )
        # Verify seller_products was deleted
        mock_seller_prods.delete.return_value.eq.assert_called_once_with("id", offer_id)
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

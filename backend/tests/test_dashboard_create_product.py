import io
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


def test_create_product_unauthenticated(client: TestClient):
    """Request without auth token returns HTTP 401."""
    data = {
        "name": "Coffee Beans",
        "description": "Roasted coffee beans",
        "brand": "Coffee Co",
        "price": "15.99",
        "stock": "20",
    }
    response = client.post("/api/v1/dashboard/products", data=data)
    assert response.status_code == 401
    res_data = response.json()
    assert "error" in res_data
    assert res_data["error"]["code"] == "MISSING_TOKEN"


def test_create_product_forbidden_for_buyer(client: TestClient):
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
        data = {
            "name": "Coffee Beans",
            "description": "Roasted coffee beans",
            "brand": "Coffee Co",
            "price": "15.99",
            "stock": "20",
        }
        response = client.post(
            "/api/v1/dashboard/products",
            data=data,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_create_product_success_without_image(client: TestClient):
    """Merchant successfully creates product without image."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":

            def mock_insert(row):
                m = MagicMock()
                m.execute.return_value = MagicMock(data=[row])
                return m

            mock_t.insert.side_effect = mock_insert
        elif table_name == "seller_products":

            def mock_insert(row):
                m = MagicMock()
                m.execute.return_value = MagicMock(data=[row])
                return m

            mock_t.insert.side_effect = mock_insert
        return mock_t

    mock_supabase.table.side_effect = table_router

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        form_data = {
            "name": "Single Origin Coffee",
            "description": "Artisan dark roast Ethiopian beans",
            "brand": "Ethiopia Direct",
            "price": "18.50",
            "stock": "35",
            "estimated_delivery_days": "3",
        }
        response = client.post(
            "/api/v1/dashboard/products",
            data=form_data,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        res_data = response.json()
        assert "product" in res_data
        assert "offer" in res_data

        product = res_data["product"]
        assert product["name"] == "Single Origin Coffee"
        assert product["description"] == "Artisan dark roast Ethiopian beans"
        assert product["brand"] == "Ethiopia Direct"
        assert product["image_url"] is None
        assert "id" in product

        offer = res_data["offer"]
        assert offer["product_id"] == product["id"]
        assert offer["seller_id"] == merchant_id
        assert offer["price"] == 18.50
        assert offer["stock"] == 35
        assert offer["estimated_delivery_days"] == 3
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_create_product_success_with_image(client: TestClient):
    """Merchant successfully creates product with image upload."""
    merchant_id = str(uuid.uuid4())
    token, merchant_record = _mock_merchant_auth(merchant_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_t = MagicMock()
        if table_name == "users":
            mock_t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[merchant_record]
            )
        elif table_name == "products":

            def mock_insert(row):
                m = MagicMock()
                m.execute.return_value = MagicMock(data=[row])
                return m

            mock_t.insert.side_effect = mock_insert
        elif table_name == "seller_products":

            def mock_insert(row):
                m = MagicMock()
                m.execute.return_value = MagicMock(data=[row])
                return m

            mock_t.insert.side_effect = mock_insert
        return mock_t

    mock_supabase.table.side_effect = table_router

    # Mock Supabase storage
    mock_storage_bucket = MagicMock()
    mock_storage_bucket.get_public_url.return_value = (
        "https://supabase-storage.local/products/test-image.jpg"
    )
    mock_supabase.storage.from_.return_value = mock_storage_bucket

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        form_data = {
            "name": "Single Origin Coffee",
            "description": "Artisan dark roast Ethiopian beans",
            "brand": "Ethiopia Direct",
            "price": "18.50",
            "stock": "35",
            "estimated_delivery_days": "2",
        }
        image_content = b"fake-jpeg-binary-data"
        files = {
            "image": ("coffee.jpg", io.BytesIO(image_content), "image/jpeg"),
        }

        response = client.post(
            "/api/v1/dashboard/products",
            data=form_data,
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        res_data = response.json()
        assert "product" in res_data
        assert "offer" in res_data

        product = res_data["product"]
        assert product["image_url"] == "https://supabase-storage.local/products/test-image.jpg"
        mock_storage_bucket.upload.assert_called_once()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_create_product_storage_upload_failure(client: TestClient):
    """Storage failure triggers HTTP 400 IMAGE_UPLOAD_FAILED."""
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

    mock_storage_bucket = MagicMock()
    mock_storage_bucket.upload.side_effect = Exception("Storage connection error")
    mock_supabase.storage.from_.return_value = mock_storage_bucket

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    try:
        form_data = {
            "name": "Single Origin Coffee",
            "description": "Artisan dark roast Ethiopian beans",
            "brand": "Ethiopia Direct",
            "price": "18.50",
            "stock": "35",
        }
        files = {
            "image": ("coffee.jpg", io.BytesIO(b"fake-bytes"), "image/jpeg"),
        }
        response = client.post(
            "/api/v1/dashboard/products",
            data=form_data,
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400
        res_data = response.json()
        assert "error" in res_data
        assert res_data["error"]["code"] == "IMAGE_UPLOAD_FAILED"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_create_product_validation_errors(client: TestClient):
    """Validation errors for price <= 0, stock < 0, or empty strings."""
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
        # Price <= 0
        res = client.post(
            "/api/v1/dashboard/products",
            data={
                "name": "Coffee",
                "description": "Desc",
                "brand": "Brand",
                "price": "0",
                "stock": "10",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

        # Stock < 0
        res = client.post(
            "/api/v1/dashboard/products",
            data={
                "name": "Coffee",
                "description": "Desc",
                "brand": "Brand",
                "price": "10",
                "stock": "-1",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

        # Empty name
        res = client.post(
            "/api/v1/dashboard/products",
            data={
                "name": "   ",
                "description": "Desc",
                "brand": "Brand",
                "price": "10",
                "stock": "5",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

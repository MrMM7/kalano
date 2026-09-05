import uuid
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app


def test_get_product_detail_success_with_offers(client: TestClient):
    """Test retrieving an existing product with multiple offers returns 200 and sorted offers."""
    prod_id = str(uuid.uuid4())
    seller_1_id = str(uuid.uuid4())
    seller_2_id = str(uuid.uuid4())
    seller_prod_1 = str(uuid.uuid4())
    seller_prod_2 = str(uuid.uuid4())

    product_data = {
        "id": prod_id,
        "name": "Wireless Noise-Cancelling Headphones",
        "description": "High-fidelity audio with adaptive active noise cancellation.",
        "brand": "SoundWave",
        "image_url": "https://example.com/images/headphones.jpg",
        "created_at": "2026-09-01T12:00:00Z",
    }

    # Offer 1: price 159.00, stock 10
    # Offer 2: price 149.99, stock 25 (cheaper)
    offers_data = [
        {
            "id": seller_prod_1,
            "product_id": prod_id,
            "seller_id": seller_1_id,
            "price": 159.00,
            "stock": 10,
            "estimated_delivery_days": 1,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "FastExpress Electronics"},
        },
        {
            "id": seller_prod_2,
            "product_id": prod_id,
            "seller_id": seller_2_id,
            "price": 149.99,
            "stock": 25,
            "estimated_delivery_days": 3,
            "created_at": "2026-09-01T12:05:00Z",
            "users": {"display_name": "AudioTech Store"},
        },
    ]

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[product_data])

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.eq.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=offers_data)

    def mock_table(table_name: str):
        if table_name == "products":
            return mock_products_query
        elif table_name == "seller_products":
            return mock_seller_query
        return MagicMock()

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = mock_table
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["id"] == prod_id
        assert data["name"] == "Wireless Noise-Cancelling Headphones"
        assert data["brand"] == "SoundWave"
        assert data["image_url"] == "https://example.com/images/headphones.jpg"

        # Offers sorted by price ascending: $149.99 before $159.00
        assert len(data["offers"]) == 2
        assert data["offers"][0]["seller_product_id"] == seller_prod_2
        assert data["offers"][0]["price"] == 149.99
        assert data["offers"][0]["seller_name"] == "AudioTech Store"
        assert data["offers"][1]["seller_product_id"] == seller_prod_1
        assert data["offers"][1]["price"] == 159.00
        assert data["offers"][1]["seller_name"] == "FastExpress Electronics"

        # Cheapest in-stock offer check
        assert data["cheapest_offer"] is not None
        assert data["cheapest_offer"]["seller_product_id"] == seller_prod_2
        assert data["cheapest_offer"]["price"] == 149.99
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_offers_sorted_with_tie_break(client: TestClient):
    """Test offers strictly sorted by price, then estimated_delivery_days."""
    prod_id = str(uuid.uuid4())
    product_data = {
        "id": prod_id,
        "name": "Gaming Mouse",
        "description": "RGB Ergonomic Mouse",
        "brand": "GamePro",
        "image_url": None,
        "created_at": "2026-09-01T12:00:00Z",
    }

    id_slow = str(uuid.uuid4())
    id_fast = str(uuid.uuid4())
    id_expensive = str(uuid.uuid4())

    offers_data = [
        {
            "id": id_slow,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 49.99,
            "stock": 5,
            "estimated_delivery_days": 5,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "Slow Seller"},
        },
        {
            "id": id_expensive,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 59.99,
            "stock": 20,
            "estimated_delivery_days": 1,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "Pricey Seller"},
        },
        {
            "id": id_fast,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 49.99,
            "stock": 10,
            "estimated_delivery_days": 2,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "Fast Seller"},
        },
    ]

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[product_data])

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.eq.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=offers_data)

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = lambda t: (
        mock_products_query if t == "products" else mock_seller_query
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 200
        data = response.json()

        # Order should be:
        # 1. 49.99 (delivery 2)
        # 2. 49.99 (delivery 5)
        # 3. 59.99 (delivery 1)
        assert len(data["offers"]) == 3
        assert data["offers"][0]["seller_product_id"] == id_fast
        assert data["offers"][1]["seller_product_id"] == id_slow
        assert data["offers"][2]["seller_product_id"] == id_expensive

        # Cheapest offer should be the fast one
        assert data["cheapest_offer"]["seller_product_id"] == id_fast
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_cheapest_in_stock_skips_zero_stock(client: TestClient):
    """Test that cheapest_offer skips offers with stock == 0 even if they are cheaper."""
    prod_id = str(uuid.uuid4())
    product_data = {
        "id": prod_id,
        "name": "Smart Speaker",
        "description": "Voice controlled smart speaker",
        "brand": "EchoTech",
        "image_url": None,
        "created_at": "2026-09-01T12:00:00Z",
    }

    out_of_stock_id = str(uuid.uuid4())
    in_stock_id = str(uuid.uuid4())

    offers_data = [
        {
            "id": out_of_stock_id,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 29.99,
            "stock": 0,
            "estimated_delivery_days": 2,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "Out Of Stock Merchant"},
        },
        {
            "id": in_stock_id,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 39.99,
            "stock": 15,
            "estimated_delivery_days": 3,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "In Stock Merchant"},
        },
    ]

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[product_data])

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.eq.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=offers_data)

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = lambda t: (
        mock_products_query if t == "products" else mock_seller_query
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 200
        data = response.json()

        # Both offers are present in offers list
        assert len(data["offers"]) == 2
        assert data["offers"][0]["seller_product_id"] == out_of_stock_id
        assert data["offers"][1]["seller_product_id"] == in_stock_id

        # cheapest_offer is the in-stock one ($39.99)
        assert data["cheapest_offer"] is not None
        assert data["cheapest_offer"]["seller_product_id"] == in_stock_id
        assert data["cheapest_offer"]["price"] == 39.99
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_all_out_of_stock(client: TestClient):
    """Test that when all offers have stock == 0, cheapest_offer is null."""
    prod_id = str(uuid.uuid4())
    product_data = {
        "id": prod_id,
        "name": "Vintage Camera",
        "description": "Classic 35mm film camera",
        "brand": "RetroPhoto",
        "image_url": None,
        "created_at": "2026-09-01T12:00:00Z",
    }

    offers_data = [
        {
            "id": str(uuid.uuid4()),
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 199.99,
            "stock": 0,
            "estimated_delivery_days": 4,
            "created_at": "2026-09-01T12:00:00Z",
            "users": {"display_name": "Collector Shop"},
        }
    ]

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[product_data])

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.eq.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=offers_data)

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = lambda t: (
        mock_products_query if t == "products" else mock_seller_query
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 200
        data = response.json()

        assert len(data["offers"]) == 1
        assert data["cheapest_offer"] is None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_no_offers(client: TestClient):
    """Test retrieving product with zero seller offers returns 200 with empty offers array."""
    prod_id = str(uuid.uuid4())
    product_data = {
        "id": prod_id,
        "name": "Unlisted Product",
        "description": "Brand new catalog addition with no sellers yet",
        "brand": "NewBrand",
        "image_url": None,
        "created_at": "2026-09-01T12:00:00Z",
    }

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[product_data])

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.eq.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=[])

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = lambda t: (
        mock_products_query if t == "products" else mock_seller_query
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["id"] == prod_id
        assert data["offers"] == []
        assert data["cheapest_offer"] is None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_not_found(client: TestClient):
    """Test that querying a non-existent UUID returns 404 with RESOURCE_NOT_FOUND."""
    prod_id = str(uuid.uuid4())

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.eq.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[])

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = mock_products_query
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get(f"/api/v1/products/{prod_id}")
        assert response.status_code == 404
        data = response.json()

        assert "error" in data
        assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
        assert f"Product with ID '{prod_id}' was not found." in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_get_product_detail_invalid_uuid(client: TestClient):
    """Test that querying an invalid UUID string format returns 422."""
    response = client.get("/api/v1/products/invalid-uuid-12345")
    assert response.status_code == 422

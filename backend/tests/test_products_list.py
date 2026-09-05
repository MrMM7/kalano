import uuid
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app


def test_list_products_success_pagination(client: TestClient):
    """Test standard list products with limit and offset."""
    prod_1 = {
        "id": str(uuid.uuid4()),
        "name": "Mechanical Keyboard",
        "description": "Tactile switch keyboard",
        "brand": "KeyCraft",
        "image_url": "https://example.com/keyboard.jpg",
        "created_at": "2026-09-05T10:00:00Z",
    }
    prod_2 = {
        "id": str(uuid.uuid4()),
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse",
        "brand": "LogiStyle",
        "image_url": None,
        "created_at": "2026-09-05T09:00:00Z",
    }

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.order.return_value = mock_products_query
    mock_products_query.range.return_value = mock_products_query

    mock_products_result = MagicMock()
    mock_products_result.data = [prod_1, prod_2]
    mock_products_result.count = 2
    mock_products_query.execute.return_value = mock_products_result

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.in_.return_value = mock_seller_query
    mock_seller_query.gt.return_value = mock_seller_query

    # Offer for prod_1 only
    seller_prod_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())
    offer_1 = {
        "id": seller_prod_id,
        "product_id": prod_1["id"],
        "seller_id": seller_id,
        "price": 89.99,
        "stock": 10,
        "estimated_delivery_days": 2,
        "created_at": "2026-09-05T11:00:00Z",
        "users": {"display_name": "BestTech Store"},
    }
    mock_seller_result = MagicMock()
    mock_seller_result.data = [offer_1]
    mock_seller_query.execute.return_value = mock_seller_result

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
        response = client.get("/api/v1/products?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["limit"] == 10
        assert data["offset"] == 0
        assert len(data["items"]) == 2

        # First item has cheapest offer
        item1 = data["items"][0]
        assert item1["id"] == prod_1["id"]
        assert item1["name"] == "Mechanical Keyboard"
        assert item1["cheapest_offer"] is not None
        assert item1["cheapest_offer"]["seller_product_id"] == seller_prod_id
        assert item1["cheapest_offer"]["price"] == 89.99
        assert item1["cheapest_offer"]["seller_name"] == "BestTech Store"

        # Second item has no offers (out of stock)
        item2 = data["items"][1]
        assert item2["id"] == prod_2["id"]
        assert item2["cheapest_offer"] is None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_products_cheapest_offer_selection(client: TestClient):
    """Test lowest price offer selection, breaking tie with delivery days."""
    prod_id = str(uuid.uuid4())
    prod = {
        "id": prod_id,
        "name": "Gaming Monitor",
        "description": "4K 144Hz Monitor",
        "brand": "ViewPro",
        "image_url": None,
        "created_at": "2026-09-05T10:00:00Z",
    }

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.order.return_value = mock_products_query
    mock_products_query.range.return_value = mock_products_query
    mock_products_result = MagicMock(data=[prod], count=1)
    mock_products_query.execute.return_value = mock_products_result

    # Three offers:
    # 1: price 350.0, delivery 5
    # 2: price 300.0, delivery 4 (Winner: cheapest)
    # 3: price 300.0, delivery 6 (Tie on price, but slower)
    cheapest_seller_prod_id = str(uuid.uuid4())
    offers = [
        {
            "id": str(uuid.uuid4()),
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 350.0,
            "stock": 5,
            "estimated_delivery_days": 5,
            "created_at": "2026-09-05T10:00:00Z",
            "users": {"display_name": "Store High"},
        },
        {
            "id": cheapest_seller_prod_id,
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 300.0,
            "stock": 15,
            "estimated_delivery_days": 4,
            "created_at": "2026-09-05T10:05:00Z",
            "users": {"display_name": "Store Cheap Fast"},
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": prod_id,
            "seller_id": str(uuid.uuid4()),
            "price": 300.0,
            "stock": 20,
            "estimated_delivery_days": 6,
            "created_at": "2026-09-05T10:06:00Z",
            "users": {"display_name": "Store Cheap Slow"},
        },
    ]

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.in_.return_value = mock_seller_query
    mock_seller_query.gt.return_value = mock_seller_query
    mock_seller_query.execute.return_value = MagicMock(data=offers)

    def mock_table(table_name: str):
        if table_name == "products":
            return mock_products_query
        return mock_seller_query

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = mock_table
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/products?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["cheapest_offer"]["seller_product_id"] == cheapest_seller_prod_id
        assert item["cheapest_offer"]["price"] == 300.0
        assert item["cheapest_offer"]["seller_name"] == "Store Cheap Fast"
        assert item["cheapest_offer"]["estimated_delivery_days"] == 4
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_products_out_of_stock_null_offer(client: TestClient):
    """Test that if a product has no in-stock offers, cheapest_offer is null."""
    prod_id = str(uuid.uuid4())
    prod = {
        "id": prod_id,
        "name": "Rare Collectible",
        "description": "Antique item",
        "brand": "Vintage",
        "image_url": None,
        "created_at": "2026-09-05T10:00:00Z",
    }

    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.order.return_value = mock_products_query
    mock_products_query.range.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[prod], count=1)

    mock_seller_query = MagicMock()
    mock_seller_query.select.return_value = mock_seller_query
    mock_seller_query.in_.return_value = mock_seller_query
    mock_seller_query.gt.return_value = mock_seller_query
    # Zero in-stock offers returned
    mock_seller_query.execute.return_value = MagicMock(data=[])

    def mock_table(table_name: str):
        if table_name == "products":
            return mock_products_query
        return mock_seller_query

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = mock_table
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/products?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["cheapest_offer"] is None
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_products_search_filter(client: TestClient):
    """Test search query applies or_ ILIKE filter."""
    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.or_.return_value = mock_products_query
    mock_products_query.order.return_value = mock_products_query
    mock_products_query.range.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[], count=0)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = mock_products_query
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/products?limit=10&offset=0&q=wireless")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        mock_products_query.or_.assert_called_once_with(
            "name.ilike.%wireless%,description.ilike.%wireless%"
        )
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_list_products_validation_errors(client: TestClient):
    """Test missing or invalid limit/offset query parameters."""
    # Missing limit
    resp1 = client.get("/api/v1/products?offset=0")
    assert resp1.status_code == 422

    # Missing offset
    resp2 = client.get("/api/v1/products?limit=10")
    assert resp2.status_code == 422

    # limit < 1
    resp3 = client.get("/api/v1/products?limit=0&offset=0")
    assert resp3.status_code == 422

    # limit > 100
    resp4 = client.get("/api/v1/products?limit=101&offset=0")
    assert resp4.status_code == 422

    # offset < 0
    resp5 = client.get("/api/v1/products?limit=10&offset=-1")
    assert resp5.status_code == 422


def test_list_products_search_sanitization(client: TestClient):
    """Test that special characters (wildcards, PostgREST delimiters) are safely sanitized."""
    mock_products_query = MagicMock()
    mock_products_query.select.return_value = mock_products_query
    mock_products_query.or_.return_value = mock_products_query
    mock_products_query.order.return_value = mock_products_query
    mock_products_query.range.return_value = mock_products_query
    mock_products_query.execute.return_value = MagicMock(data=[], count=0)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = mock_products_query
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        # Query with SQL wildcards %, _, and PostgREST delimiters , ( ) "
        malicious_q = 'keyboard%_test,id.eq.hack"()'
        response = client.get(f"/api/v1/products?limit=10&offset=0&q={malicious_q}")
        assert response.status_code == 200

        # Should escape wildcards and strip delimiters
        expected_sanitized = r"keyboard\%\_testid.eq.hack"
        mock_products_query.or_.assert_called_once_with(
            f"name.ilike.%{expected_sanitized}%,description.ilike.%{expected_sanitized}%"
        )
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

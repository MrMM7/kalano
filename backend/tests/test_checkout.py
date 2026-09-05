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


def test_checkout_unauthenticated(client: TestClient):
    """Test checkout rejects unauthenticated requests with HTTP 401."""
    response = client.post(
        "/api/v1/checkout",
        json={"address": "123 Main St, Springfield, IL 62701"},
    )
    assert response.status_code == 401
    assert "error" in response.json()
    assert response.json()["error"]["code"] == "MISSING_TOKEN"


def test_checkout_forbidden_for_merchant(client: TestClient):
    """Test checkout rejects merchant users with HTTP 403."""
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
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "123 Main St, Springfield, IL 62701"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
        assert "Only buyers" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_forbidden_for_logistics(client: TestClient):
    """Test checkout rejects logistics users with HTTP 403."""
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
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "123 Main St, Springfield, IL 62701"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
        assert "Only buyers" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_validation_blank_or_short_address(client: TestClient):
    """Test checkout rejects invalid address formats with HTTP 422."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

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
        # Whitespace-only address
        res1 = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "    "},
        )
        assert res1.status_code == 422

        # Too short (< 5 chars)
        res2 = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "ABC"},
        )
        assert res2.status_code == 422

        # Missing address field
        res3 = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={},
        )
        assert res3.status_code == 422
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_fails_when_user_has_no_cart(client: TestClient):
    """Test checkout returns HTTP 400 EMPTY_CART when user has no cart row in database."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "carts":
            # No cart exists
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "123 Main St, Springfield, IL 62701"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "EMPTY_CART"
        assert "Cannot checkout with an empty cart." in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_fails_when_cart_is_empty(client: TestClient):
    """Test checkout returns HTTP 400 EMPTY_CART when user has a cart with 0 items."""
    user_id = str(uuid.uuid4())
    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 42, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            # Cart has 0 items
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[])
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "123 Main St, Springfield, IL 62701"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "EMPTY_CART"
        assert "Cannot checkout with an empty cart." in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_fails_when_stock_is_insufficient(client: TestClient):
    """Test checkout aborts with HTTP 400 INSUFFICIENT_STOCK if quantity > stock."""
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    prod_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())

    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    user_orders_insert_called = False

    raw_cart_item = {
        "id": 1,
        "cart_id": 10,
        "seller_product_id": seller_prod_id,
        "quantity": 5,
        "seller_products": {
            "id": seller_prod_id,
            "product_id": prod_id,
            "seller_id": seller_id,
            "price": 25.0,
            "stock": 3,  # Available 3, but cart requested 5
            "products": {"id": prod_id, "name": "Mechanical Keyboard"},
            "users": {"id": seller_id, "display_name": "Keyboards Inc"},
        },
    }

    def table_router(table_name: str):
        nonlocal user_orders_insert_called
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 10, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[raw_cart_item])
        elif table_name == "user_orders":
            user_orders_insert_called = True
        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"address": "123 Main St, Springfield, IL 62701"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INSUFFICIENT_STOCK"
        assert "Mechanical Keyboard" in data["error"]["message"]
        assert "Requested 5, but only 3 available" in data["error"]["message"]
        assert not user_orders_insert_called
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_success_single_item(client: TestClient):
    """Test checkout single item creates order, decrements stock, clears cart."""
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    prod_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())

    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    raw_cart_item = {
        "id": 1,
        "cart_id": 10,
        "seller_product_id": seller_prod_id,
        "quantity": 2,
        "seller_products": {
            "id": seller_prod_id,
            "product_id": prod_id,
            "seller_id": seller_id,
            "price": 49.99,
            "stock": 10,
            "products": {"id": prod_id, "name": "Ergonomic Mouse"},
            "users": {"id": seller_id, "display_name": "ErgoStore"},
        },
    }

    inserted_orders = []
    stock_updates = []
    cart_cleared = False

    def table_router(table_name: str):
        nonlocal cart_cleared
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 10, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[raw_cart_item])

            def delete_handler():
                eq_mock = MagicMock()

                def eq_exec(k, v):
                    nonlocal cart_cleared
                    cart_cleared = True
                    return MagicMock(execute=MagicMock(return_value=MagicMock(data=[])))

                eq_mock.eq.side_effect = eq_exec
                return eq_mock

            mock_query.delete.side_effect = delete_handler
        elif table_name == "user_orders":

            def insert_handler(data):
                nonlocal inserted_orders
                inserted_orders.append(data)
                return MagicMock(
                    execute=MagicMock(
                        return_value=MagicMock(
                            data=[
                                {
                                    "id": 101,
                                    "created_at": "2026-09-05T20:00:00Z",
                                    **data,
                                }
                            ]
                        )
                    )
                )

            mock_query.insert.side_effect = insert_handler
        elif table_name == "seller_products":

            def update_handler(update_data):
                eq_mock = MagicMock()

                def eq_exec(col, val):
                    nonlocal stock_updates
                    stock_updates.append((val, update_data))
                    return MagicMock(execute=MagicMock(return_value=MagicMock(data=[])))

                eq_mock.eq.side_effect = eq_exec
                return eq_mock

            mock_query.update.side_effect = update_handler

        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "address": "456 Elm St, Suite 2B, Metropolis, NY 10001",
                "save_address": False,
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["order_ids"] == [101]
        assert data["total_items"] == 2
        assert data["total_price"] == 99.98
        assert data["message"] == "Order placed successfully."
        assert len(data["orders"]) == 1

        order = data["orders"][0]
        assert order["id"] == 101
        assert order["product_id"] == prod_id
        assert order["product_name"] == "Ergonomic Mouse"
        assert order["seller_id"] == seller_id
        assert order["seller_name"] == "ErgoStore"
        assert order["bought_price"] == 49.99
        assert order["quantity"] == 2
        assert order["subtotal"] == 99.98
        assert order["delivery_types"] == "pending"
        assert order["address"] == "456 Elm St, Suite 2B, Metropolis, NY 10001"

        # Check stock decrement
        assert len(stock_updates) == 1
        assert stock_updates[0][0] == seller_prod_id
        assert stock_updates[0][1]["stock"] == 8  # 10 - 2 = 8

        # Check cart cleared
        assert cart_cleared is True
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_success_multiple_items_different_sellers(client: TestClient):
    """Test successful checkout with multiple items from different merchants."""
    user_id = str(uuid.uuid4())
    sp1_id, p1_id, s1_id = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
    sp2_id, p2_id, s2_id = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())

    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()

    raw_cart_items = [
        {
            "id": 1,
            "cart_id": 20,
            "seller_product_id": sp1_id,
            "quantity": 1,
            "seller_products": {
                "id": sp1_id,
                "product_id": p1_id,
                "seller_id": s1_id,
                "price": 100.0,
                "stock": 5,
                "products": {"id": p1_id, "name": "Headphones"},
                "users": {"id": s1_id, "display_name": "AudioStore"},
            },
        },
        {
            "id": 2,
            "cart_id": 20,
            "seller_product_id": sp2_id,
            "quantity": 3,
            "seller_products": {
                "id": sp2_id,
                "product_id": p2_id,
                "seller_id": s2_id,
                "price": 20.0,
                "stock": 10,
                "products": {"id": p2_id, "name": "USB Cable"},
                "users": {"id": s2_id, "display_name": "CableWorld"},
            },
        },
    ]

    order_id_counter = 200

    def table_router(table_name: str):
        nonlocal order_id_counter
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 20, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=raw_cart_items)
            mock_query.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        elif table_name == "user_orders":

            def insert_handler(data):
                nonlocal order_id_counter
                order_id_counter += 1
                return MagicMock(
                    execute=MagicMock(
                        return_value=MagicMock(
                            data=[
                                {
                                    "id": order_id_counter,
                                    "created_at": "2026-09-05T20:00:00Z",
                                    **data,
                                }
                            ]
                        )
                    )
                )

            mock_query.insert.side_effect = insert_handler
        elif table_name == "seller_products":
            mock_query.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "address": "789 Pine Ave, Seattle, WA 98101",
                "save_address": False,
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["order_ids"] == [201, 202]
        assert data["total_items"] == 4  # 1 + 3
        assert data["total_price"] == 160.0  # (100 * 1) + (20 * 3) = 160.0
        assert len(data["orders"]) == 2
        assert data["orders"][0]["seller_name"] == "AudioStore"
        assert data["orders"][1]["seller_name"] == "CableWorld"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_save_address_true_updates_user(client: TestClient):
    """Test checkout updates user profile address when save_address is True."""
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    prod_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())

    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    user_address_updated = False

    raw_cart_item = {
        "id": 1,
        "cart_id": 10,
        "seller_product_id": seller_prod_id,
        "quantity": 1,
        "seller_products": {
            "id": seller_prod_id,
            "product_id": prod_id,
            "seller_id": seller_id,
            "price": 10.0,
            "stock": 5,
            "products": {"id": prod_id, "name": "Notebook"},
            "users": {"id": seller_id, "display_name": "PaperShop"},
        },
    }

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )

            def update_handler(update_data):
                nonlocal user_address_updated
                if update_data.get("address") == "999 New Address Blvd, Austin, TX 78701":
                    user_address_updated = True
                return MagicMock(
                    eq=MagicMock(
                        return_value=MagicMock(execute=MagicMock(return_value=MagicMock(data=[])))
                    )
                )

            mock_query.update.side_effect = update_handler
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 10, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[raw_cart_item])
            mock_query.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        elif table_name == "user_orders":
            mock_query.insert.return_value.execute.return_value = MagicMock(
                data=[{"id": 301, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "seller_products":
            mock_query.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "address": "999 New Address Blvd, Austin, TX 78701",
                "save_address": True,
            },
        )
        assert response.status_code == 200
        assert user_address_updated is True
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_checkout_save_address_false_does_not_update_user(client: TestClient):
    """Test checkout does not update user profile address when save_address is False."""
    user_id = str(uuid.uuid4())
    seller_prod_id = str(uuid.uuid4())
    prod_id = str(uuid.uuid4())
    seller_id = str(uuid.uuid4())

    token, user_record = _mock_buyer_auth(user_id)

    mock_supabase = MagicMock()
    user_update_called = False

    raw_cart_item = {
        "id": 1,
        "cart_id": 10,
        "seller_product_id": seller_prod_id,
        "quantity": 1,
        "seller_products": {
            "id": seller_prod_id,
            "product_id": prod_id,
            "seller_id": seller_id,
            "price": 10.0,
            "stock": 5,
            "products": {"id": prod_id, "name": "Notebook"},
            "users": {"id": seller_id, "display_name": "PaperShop"},
        },
    }

    def table_router(table_name: str):
        mock_query = MagicMock()
        if table_name == "users":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[user_record]
            )

            def update_handler(update_data):
                nonlocal user_update_called
                user_update_called = True
                return MagicMock(
                    eq=MagicMock(
                        return_value=MagicMock(execute=MagicMock(return_value=MagicMock(data=[])))
                    )
                )

            mock_query.update.side_effect = update_handler
        elif table_name == "carts":
            mock_query.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": 10, "user_id": user_id}]
            )
        elif table_name == "cart_items":
            query_mock = mock_query.select.return_value.eq.return_value.order.return_value
            query_mock.execute.return_value = MagicMock(data=[raw_cart_item])
            mock_query.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        elif table_name == "user_orders":
            mock_query.insert.return_value.execute.return_value = MagicMock(
                data=[{"id": 301, "created_at": "2026-09-05T20:00:00Z"}]
            )
        elif table_name == "seller_products":
            mock_query.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        return mock_query

    mock_supabase.table.side_effect = table_router
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "address": "999 New Address Blvd, Austin, TX 78701",
                "save_address": False,
            },
        )
        assert response.status_code == 200
        assert user_update_called is False
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)

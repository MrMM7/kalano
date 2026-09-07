"""End-to-End Multi-Role Integration Smoke Test Suite.

Verifies the complete e-commerce lifecycle across all user roles:
1. Merchant registers, logs in, creates a product with an initial offer.
2. Buyer registers, logs in, searches catalog, views product details, adds to cart.
3. Buyer checks out with shipping address, decrements inventory stock, clears cart.
4. Merchant views incoming orders and marks order ready for pickup (confirmed).
5. Logistics personnel views confirmed orders, updates status to shipped, then delivered.
6. Buyer views order history and verifies final delivered status.
7. Security role boundaries and invalid state transitions are validated.
"""

from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.services.auth_service import hash_password


class StatefulMockSupabase:
    """In-memory stateful Supabase database simulator for end-to-end integration tests."""

    def __init__(self):
        self.tables: dict[str, list[dict[str, Any]]] = {
            "users": [],
            "products": [],
            "seller_products": [],
            "carts": [],
            "cart_items": [],
            "user_orders": [],
        }
        self.order_id_counter = 1000
        self.cart_id_counter = 500
        self.cart_item_id_counter = 100

        # Setup mock storage
        mock_storage = MagicMock()
        mock_bucket = MagicMock()
        mock_bucket.upload.return_value = None
        mock_bucket.get_public_url.return_value = "https://example.com/mock-product.jpg"
        mock_storage.from_.return_value = mock_bucket
        self.storage = mock_storage

    def table(self, table_name: str):
        return MockTableQuery(self, table_name)


class MockTableQuery:
    def __init__(self, db: StatefulMockSupabase, table_name: str):
        self.db = db
        self.table_name = table_name
        self.filters: list[tuple[str, str, Any]] = []
        self.pending_update: dict[str, Any] | None = None
        self.pending_delete: bool = False
        self.count_mode: str | None = None
        self.or_filter: str | None = None

    def select(self, fields: str = "*", count: str | None = None):
        self.count_mode = count
        return self

    def insert(self, data: dict[str, Any] | list[dict[str, Any]]):
        rows = [data] if isinstance(data, dict) else data
        inserted = []
        for row in rows:
            record = dict(row)
            if "id" not in record:
                if self.table_name == "user_orders":
                    self.db.order_id_counter += 1
                    record["id"] = self.db.order_id_counter
                elif self.table_name == "carts":
                    self.db.cart_id_counter += 1
                    record["id"] = self.db.cart_id_counter
                elif self.table_name == "cart_items":
                    self.db.cart_item_id_counter += 1
                    record["id"] = self.db.cart_item_id_counter
                else:
                    record["id"] = str(uuid4())
            if "created_at" not in record:
                record["created_at"] = datetime.now(timezone.utc).isoformat()
            self.db.tables[self.table_name].append(record)
            inserted.append(record)

        mock_res = MagicMock()
        mock_res.data = inserted
        mock_exec = MagicMock()
        mock_exec.execute.return_value = mock_res
        return mock_exec

    def update(self, data: dict[str, Any]):
        self.pending_update = data
        return self

    def delete(self):
        self.pending_delete = True
        return self

    def eq(self, column: str, value: Any):
        self.filters.append(("eq", column, str(value)))
        return self

    def in_(self, column: str, values: list[Any]):
        self.filters.append(("in", column, [str(v) for v in values]))
        return self

    def gt(self, column: str, value: Any):
        self.filters.append(("gt", column, value))
        return self

    def or_(self, filter_expr: str):
        self.or_filter = filter_expr
        return self

    def order(self, column: str, desc: bool = False):
        return self

    def range(self, start: int, end: int):
        return self

    def execute(self):
        table_rows = self.db.tables[self.table_name]

        # Apply filtering
        matching_rows = []
        for row in table_rows:
            matches = True
            for op, col, val in self.filters:
                row_val = str(row.get(col, ""))
                if op == "eq":
                    if row_val != val:
                        matches = False
                        break
                elif op == "in":
                    if row_val not in val:
                        matches = False
                        break
                elif op == "gt":
                    if float(row.get(col, 0)) <= float(val):
                        matches = False
                        break
            if matches:
                matching_rows.append(row)

        # Handle pending updates
        if self.pending_update is not None:
            updated_rows = []
            for row in matching_rows:
                row.update(self.pending_update)
                updated_rows.append(dict(row))
            mock_res = MagicMock()
            mock_res.data = updated_rows
            return mock_res

        # Handle pending deletions
        if self.pending_delete:
            self.db.tables[self.table_name] = [r for r in table_rows if r not in matching_rows]
            mock_res = MagicMock()
            mock_res.data = matching_rows
            return mock_res

        # Handle selects with relational joins
        enriched_rows = []
        for row in matching_rows:
            enriched = dict(row)

            # Joins for seller_products: products & users
            if self.table_name == "seller_products":
                product_id = enriched.get("product_id")
                prod = next(
                    (p for p in self.db.tables["products"] if str(p["id"]) == str(product_id)), None
                )
                if prod:
                    enriched["products"] = dict(prod)

                seller_id = enriched.get("seller_id")
                seller_user = next(
                    (u for u in self.db.tables["users"] if str(u["id"]) == str(seller_id)), None
                )
                if seller_user:
                    enriched["users"] = {
                        "id": seller_user["id"],
                        "display_name": seller_user["display_name"],
                    }

            # Joins for cart_items: seller_products with nested products and users
            elif self.table_name == "cart_items":
                sp_id = enriched.get("seller_product_id")
                sp = next(
                    (s for s in self.db.tables["seller_products"] if str(s["id"]) == str(sp_id)),
                    None,
                )
                if sp:
                    sp_copy = dict(sp)
                    prod = next(
                        (
                            p
                            for p in self.db.tables["products"]
                            if str(p["id"]) == str(sp.get("product_id"))
                        ),
                        None,
                    )
                    if prod:
                        sp_copy["products"] = {"id": prod["id"], "name": prod["name"]}
                    seller_user = next(
                        (
                            u
                            for u in self.db.tables["users"]
                            if str(u["id"]) == str(sp.get("seller_id"))
                        ),
                        None,
                    )
                    if seller_user:
                        sp_copy["users"] = {
                            "id": seller_user["id"],
                            "display_name": seller_user["display_name"],
                        }
                    enriched["seller_products"] = sp_copy

            # Joins for user_orders: products, seller, buyer
            elif self.table_name == "user_orders":
                prod_id = enriched.get("product_id")
                prod = next(
                    (p for p in self.db.tables["products"] if str(p["id"]) == str(prod_id)), None
                )
                if prod:
                    enriched["products"] = dict(prod)

                seller_id = enriched.get("seller_id")
                seller_user = next(
                    (u for u in self.db.tables["users"] if str(u["id"]) == str(seller_id)), None
                )
                if seller_user:
                    seller_dict = {
                        "id": seller_user["id"],
                        "display_name": seller_user["display_name"],
                    }
                    enriched["users"] = seller_dict
                    enriched["seller"] = seller_dict

                buyer_id = enriched.get("buyer_id")
                buyer_user = next(
                    (u for u in self.db.tables["users"] if str(u["id"]) == str(buyer_id)), None
                )
                if buyer_user:
                    buyer_dict = {
                        "id": buyer_user["id"],
                        "display_name": buyer_user["display_name"],
                    }
                    enriched["buyer"] = buyer_dict

            enriched_rows.append(enriched)

        mock_res = MagicMock()
        mock_res.data = enriched_rows
        mock_res.count = len(enriched_rows) if self.count_mode == "exact" else None
        return mock_res


@pytest.fixture
def mock_db():
    db = StatefulMockSupabase()

    # Pre-seed logistics account for logistics fulfillment tests
    logistics_user_id = str(uuid4())
    logistics_record = {
        "id": logistics_user_id,
        "email": "logistics@kalano.internal",
        "password_hash": hash_password("LogisticsPass123!"),
        "display_name": "Kalano Logistics Dispatch",
        "user_role": "logistics",
        "address": "Fulfillment Hub 1",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.tables["users"].append(logistics_record)

    app.dependency_overrides[get_supabase_client] = lambda: db
    try:
        yield db
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_e2e_full_order_lifecycle(client: TestClient, mock_db: StatefulMockSupabase):
    """End-to-End happy path smoke test verifying full multi-role order lifecycle:

    1. Merchant registers, logs in, and lists a product with stock=10, price=29.99.
    2. Buyer registers, logs in, finds the product, and adds 2 items to cart.
    3. Buyer completes checkout; cart clears, stock reduces to 8, order is pending.
    4. Merchant queries incoming orders, marks order ready for pickup (confirmed).
    5. Logistics views confirmed orders, updates to shipped, then delivered.
    6. Buyer views order history and verifies final delivered status.
    """
    # -------------------------------------------------------------------------
    # Step 1: Merchant Registration & Authentication
    # -------------------------------------------------------------------------
    merchant_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e_merchant@example.com",
            "password": "MerchantPassword123!",
            "display_name": "Apex Tech Store",
            "user_role": "merchant",
        },
    )
    assert merchant_reg.status_code == 201, f"Merchant reg failed: {merchant_reg.text}"
    assert "id" in merchant_reg.json()

    merchant_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "e2e_merchant@example.com",
            "password": "MerchantPassword123!",
        },
    )
    assert merchant_login.status_code == 200, f"Merchant login failed: {merchant_login.text}"
    merchant_token = merchant_login.json()["access_token"]
    merchant_headers = {"Authorization": f"Bearer {merchant_token}"}

    # -------------------------------------------------------------------------
    # Step 2: Merchant Lists Product & Initial Offer
    # -------------------------------------------------------------------------
    create_prod_res = client.post(
        "/api/v1/dashboard/products",
        data={
            "name": "Mechanical Gaming Keyboard",
            "description": "RGB backlight mechanical keyboard with hot-swappable switches",
            "brand": "ApexKey",
            "price": "29.99",
            "stock": "10",
            "estimated_delivery_days": "2",
        },
        headers=merchant_headers,
    )
    assert create_prod_res.status_code == 201, f"Product create failed: {create_prod_res.text}"
    product_data = create_prod_res.json()
    product_id = product_data["product"]["id"]
    offer_id = product_data["offer"]["id"]

    # Verify merchant offer listing
    merchant_offers_res = client.get("/api/v1/dashboard/offers", headers=merchant_headers)
    assert merchant_offers_res.status_code == 200
    offers = merchant_offers_res.json()
    assert len(offers) == 1
    assert offers[0]["id"] == offer_id
    assert offers[0]["stock"] == 10
    assert offers[0]["price"] == 29.99

    # -------------------------------------------------------------------------
    # Step 3: Buyer Registration & Authentication
    # -------------------------------------------------------------------------
    buyer_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e_buyer@example.com",
            "password": "BuyerPassword123!",
            "display_name": "Jane Buyer",
            "user_role": "buyer",
        },
    )
    assert buyer_reg.status_code == 201, f"Buyer reg failed: {buyer_reg.text}"

    buyer_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "e2e_buyer@example.com",
            "password": "BuyerPassword123!",
        },
    )
    assert buyer_login.status_code == 200
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # -------------------------------------------------------------------------
    # Step 4: Buyer Searches Catalog & Retrieves Detail
    # -------------------------------------------------------------------------
    search_res = client.get("/api/v1/products?limit=10&offset=0&q=Keyboard")
    assert search_res.status_code == 200
    catalog = search_res.json()
    assert catalog["total"] >= 1
    matched_product = next((p for p in catalog["items"] if p["id"] == product_id), None)
    assert matched_product is not None
    assert matched_product["cheapest_offer"]["price"] == 29.99

    detail_res = client.get(f"/api/v1/products/{product_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["name"] == "Mechanical Gaming Keyboard"
    assert len(detail["offers"]) == 1

    # -------------------------------------------------------------------------
    # Step 5: Buyer Adds 2 Units to Cart & Verifies Cart Subtotal
    # -------------------------------------------------------------------------
    add_cart_res = client.post(
        "/api/v1/cart/items",
        json={"seller_product_id": offer_id, "quantity": 2},
        headers=buyer_headers,
    )
    assert add_cart_res.status_code == 200, f"Add to cart failed: {add_cart_res.text}"

    cart_res = client.get("/api/v1/cart", headers=buyer_headers)
    assert cart_res.status_code == 200
    cart = cart_res.json()
    assert cart["total_items"] == 2
    assert cart["total_price"] == 59.98
    assert len(cart["items"]) == 1

    # -------------------------------------------------------------------------
    # Step 6: Buyer Places Order via Checkout
    # -------------------------------------------------------------------------
    checkout_res = client.post(
        "/api/v1/checkout",
        json={
            "address": "456 Oak Avenue, Apt 2B, Springfield",
            "save_address": True,
        },
        headers=buyer_headers,
    )
    assert checkout_res.status_code == 200, f"Checkout failed: {checkout_res.text}"
    checkout_data = checkout_res.json()
    assert len(checkout_data["orders"]) == 1
    order_id = checkout_data["orders"][0]["id"]
    assert checkout_data["orders"][0]["delivery_types"] == "pending"

    # Verify cart is now empty
    post_checkout_cart = client.get("/api/v1/cart", headers=buyer_headers).json()
    assert post_checkout_cart["total_items"] == 0
    assert len(post_checkout_cart["items"]) == 0

    # Verify inventory was decremented: 10 - 2 = 8
    sp_row = next(s for s in mock_db.tables["seller_products"] if s["id"] == offer_id)
    assert sp_row["stock"] == 8

    # -------------------------------------------------------------------------
    # Step 7: Merchant Inspects Incoming Orders & Confirms for Pickup
    # -------------------------------------------------------------------------
    client.cookies.clear()
    merchant_orders_res = client.get("/api/v1/dashboard/orders", headers=merchant_headers)
    assert merchant_orders_res.status_code == 200
    merchant_orders = merchant_orders_res.json()
    assert len(merchant_orders) == 1
    target_order = merchant_orders[0]
    assert target_order["id"] == order_id
    assert target_order["status"] == "pending"

    # Merchant transitions status: pending -> confirmed
    confirm_res = client.patch(
        f"/api/v1/dashboard/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers=merchant_headers,
    )
    assert confirm_res.status_code == 200, f"Merchant confirm failed: {confirm_res.text}"
    assert confirm_res.json()["status"] == "confirmed"

    # -------------------------------------------------------------------------
    # Step 8: Logistics Personnel Ships & Delivers Order
    # -------------------------------------------------------------------------
    logistics_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "logistics@kalano.internal",
            "password": "LogisticsPass123!",
        },
    )
    assert logistics_login.status_code == 200
    logistics_token = logistics_login.json()["access_token"]
    logistics_headers = {"Authorization": f"Bearer {logistics_token}"}

    # Query confirmed orders
    logistics_orders_res = client.get(
        "/api/v1/logistics/orders?status=confirmed",
        headers=logistics_headers,
    )
    assert logistics_orders_res.status_code == 200
    confirmed_orders = logistics_orders_res.json()
    assert any(o["id"] == order_id for o in confirmed_orders)

    # Transition confirmed -> shipped
    ship_res = client.patch(
        f"/api/v1/logistics/orders/{order_id}",
        json={"status": "shipped"},
        headers=logistics_headers,
    )
    assert ship_res.status_code == 200, f"Logistics ship failed: {ship_res.text}"
    assert ship_res.json()["delivery_types"] == "shipped"

    # Transition shipped -> delivered
    deliver_res = client.patch(
        f"/api/v1/logistics/orders/{order_id}",
        json={"status": "delivered"},
        headers=logistics_headers,
    )
    assert deliver_res.status_code == 200, f"Logistics deliver failed: {deliver_res.text}"
    assert deliver_res.json()["delivery_types"] == "delivered"

    # -------------------------------------------------------------------------
    # Step 9: Buyer Verifies Order History Reflections
    # -------------------------------------------------------------------------
    client.cookies.clear()
    buyer_orders_res = client.get("/api/v1/orders", headers=buyer_headers)
    assert buyer_orders_res.status_code == 200
    buyer_orders_data = buyer_orders_res.json()
    assert buyer_orders_data["total_orders"] == 1
    final_order = buyer_orders_data["orders"][0]
    assert final_order["id"] == order_id
    assert final_order["delivery_types"] == "delivered"
    assert final_order["subtotal"] == 59.98
    assert final_order["quantity"] == 2


def test_e2e_role_boundaries(client: TestClient, mock_db: StatefulMockSupabase):
    """Verify strict role-based access control across endpoints:

    - Buyers receive 403 on merchant dashboard and logistics endpoints.
    - Merchants receive 403 on logistics endpoints and checkout.
    - Logistics users receive 403 on cart and merchant dashboard endpoints.
    """
    # Create Buyer
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "boundary_buyer@example.com",
            "password": "Password123!",
            "display_name": "Boundary Buyer",
            "user_role": "buyer",
        },
    )
    buyer_token = client.post(
        "/api/v1/auth/login",
        json={"email": "boundary_buyer@example.com", "password": "Password123!"},
    ).json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Create Merchant
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "boundary_merchant@example.com",
            "password": "Password123!",
            "display_name": "Boundary Merchant",
            "user_role": "merchant",
        },
    )
    merchant_token = client.post(
        "/api/v1/auth/login",
        json={"email": "boundary_merchant@example.com", "password": "Password123!"},
    ).json()["access_token"]
    merchant_headers = {"Authorization": f"Bearer {merchant_token}"}

    # Logistics Token
    logistics_token = client.post(
        "/api/v1/auth/login",
        json={"email": "logistics@kalano.internal", "password": "LogisticsPass123!"},
    ).json()["access_token"]
    logistics_headers = {"Authorization": f"Bearer {logistics_token}"}

    # Clear session cookies so authorization is strictly driven by the explicit Bearer header
    client.cookies.clear()

    # 1. Buyer cannot access merchant dashboard or logistics orders
    assert client.get("/api/v1/dashboard/orders", headers=buyer_headers).status_code == 403
    assert client.get("/api/v1/dashboard/offers", headers=buyer_headers).status_code == 403
    assert client.get("/api/v1/logistics/orders", headers=buyer_headers).status_code == 403

    # 2. Merchant cannot access logistics orders or checkout
    assert client.get("/api/v1/logistics/orders", headers=merchant_headers).status_code == 403
    assert (
        client.post(
            "/api/v1/checkout",
            json={"address": "123 Street"},
            headers=merchant_headers,
        ).status_code
        == 403
    )

    # 3. Logistics cannot access buyer orders or merchant dashboard
    assert client.get("/api/v1/orders", headers=logistics_headers).status_code == 403
    assert client.get("/api/v1/dashboard/orders", headers=logistics_headers).status_code == 403


def test_e2e_edge_cases_and_error_envelopes(client: TestClient, mock_db: StatefulMockSupabase):
    """Verify standard error envelopes and validations on invalid operations:

    1. Empty cart checkout returns HTTP 400 with code EMPTY_CART.
    2. Adding more items than available stock returns HTTP 400 with code INSUFFICIENT_STOCK.
    3. Disallowed status transition (e.g. pending directly to delivered) returns HTTP 400.
    """
    # Create and login Buyer
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "edge_buyer@example.com",
            "password": "Password123!",
            "display_name": "Edge Buyer",
            "user_role": "buyer",
        },
    )
    buyer_token = client.post(
        "/api/v1/auth/login",
        json={"email": "edge_buyer@example.com", "password": "Password123!"},
    ).json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 1. Empty Cart Checkout
    empty_checkout = client.post(
        "/api/v1/checkout",
        json={"address": "123 Empty Lane"},
        headers=buyer_headers,
    )
    assert empty_checkout.status_code == 400
    err = empty_checkout.json()
    assert "error" in err
    assert err["error"]["code"] == "EMPTY_CART"

    # Seed an offer with stock=3
    seller_id = str(uuid4())
    product_id = str(uuid4())
    offer_id = str(uuid4())

    mock_db.tables["products"].append(
        {
            "id": product_id,
            "name": "Limited Stock Item",
            "description": "Rare item with limited units",
            "brand": "RareCo",
            "image_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    mock_db.tables["seller_products"].append(
        {
            "id": offer_id,
            "product_id": product_id,
            "seller_id": seller_id,
            "price": 100.0,
            "stock": 3,
            "estimated_delivery_days": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    # 2. Exceed Available Stock in Cart
    stock_overflow = client.post(
        "/api/v1/cart/items",
        json={"seller_product_id": offer_id, "quantity": 10},
        headers=buyer_headers,
    )
    assert stock_overflow.status_code == 400
    overflow_err = stock_overflow.json()
    assert "error" in overflow_err
    assert overflow_err["error"]["code"] == "INSUFFICIENT_STOCK"

    # Seed an order in 'pending' status
    order_id = 9999
    mock_db.tables["user_orders"].append(
        {
            "id": order_id,
            "product_id": product_id,
            "seller_id": seller_id,
            "buyer_id": str(uuid4()),
            "bought_price": 100.0,
            "quantity": 1,
            "delivery_types": "pending",
            "address": "100 Test St",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    # Logistics Login
    logistics_token = client.post(
        "/api/v1/auth/login",
        json={"email": "logistics@kalano.internal", "password": "LogisticsPass123!"},
    ).json()["access_token"]
    logistics_headers = {"Authorization": f"Bearer {logistics_token}"}

    # 3. Invalid Status Transition: pending -> delivered directly
    invalid_transition = client.patch(
        f"/api/v1/logistics/orders/{order_id}",
        json={"status": "delivered"},
        headers=logistics_headers,
    )
    assert invalid_transition.status_code == 400
    transition_err = invalid_transition.json()
    assert "error" in transition_err
    assert transition_err["error"]["code"] == "INVALID_STATUS_TRANSITION"

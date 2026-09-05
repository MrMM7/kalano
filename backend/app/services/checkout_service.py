from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.checkout import CheckoutRequest, CheckoutResponse, OrderItemSummary


def process_checkout(
    supabase_client: Client,
    user_id: UUID | str,
    user_role: str,
    payload: CheckoutRequest,
) -> CheckoutResponse:
    user_id_str = str(user_id)

    # 1. Authorization: Only buyers can place orders
    if user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only buyers can place orders.",
                }
            },
        )

    # 2. Fetch active cart for the authenticated user
    cart_res = supabase_client.table("carts").select("*").eq("user_id", user_id_str).execute()
    if not cart_res.data or len(cart_res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "EMPTY_CART",
                    "message": "Cannot checkout with an empty cart.",
                }
            },
        )

    cart = cart_res.data[0]
    cart_id = cart["id"]

    # 3. Fetch all cart items linked to this cart
    select_fields = (
        "id, cart_id, seller_product_id, quantity, created_at, "
        "seller_products(id, product_id, seller_id, price, stock, "
        "products(id, name), users(id, display_name))"
    )
    items_res = (
        supabase_client.table("cart_items")
        .select(select_fields)
        .eq("cart_id", cart_id)
        .order("id")
        .execute()
    )

    raw_items = items_res.data or []
    if not raw_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "EMPTY_CART",
                    "message": "Cannot checkout with an empty cart.",
                }
            },
        )

    # 4. Parse items and inspect inventory stock atomically
    prepared_items = []
    for raw in raw_items:
        sp = raw.get("seller_products")
        if isinstance(sp, dict):
            prod = sp.get("products") or {}
            seller_user = sp.get("users") or {}
            seller_product_id = sp.get("id", raw.get("seller_product_id"))
            product_id = prod.get("id") or sp.get("product_id")
            product_name = prod.get("name") or "Unknown Product"
            seller_id = seller_user.get("id") or sp.get("seller_id")
            seller_name = seller_user.get("display_name") or "Unknown Seller"
            unit_price = float(sp.get("price", 0.0))
            available_stock = int(sp.get("stock", 0))
        else:
            # Fallback if join wasn't expanded
            seller_product_id = raw["seller_product_id"]
            sp_query = (
                supabase_client.table("seller_products")
                .select("id, product_id, seller_id, price, stock")
                .eq("id", str(seller_product_id))
                .execute()
            )
            sp_data = sp_query.data[0] if sp_query.data else {}
            product_id = sp_data.get("product_id")
            seller_id = sp_data.get("seller_id")
            unit_price = float(sp_data.get("price", 0.0))
            available_stock = int(sp_data.get("stock", 0))

            product_name = "Unknown Product"
            if product_id:
                p_query = (
                    supabase_client.table("products")
                    .select("name")
                    .eq("id", str(product_id))
                    .execute()
                )
                if p_query.data:
                    product_name = p_query.data[0].get("name", "Unknown Product")

            seller_name = "Unknown Seller"
            if seller_id:
                u_query = (
                    supabase_client.table("users")
                    .select("display_name")
                    .eq("id", str(seller_id))
                    .execute()
                )
                if u_query.data:
                    seller_name = u_query.data[0].get("display_name", "Unknown Seller")

        requested_qty = int(raw.get("quantity", 1))

        if requested_qty > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INSUFFICIENT_STOCK",
                        "message": (
                            f"Product '{product_name}' has insufficient stock. "
                            f"Requested {requested_qty}, but only {available_stock} available."
                        ),
                    }
                },
            )

        prepared_items.append(
            {
                "seller_product_id": str(seller_product_id),
                "product_id": str(product_id),
                "product_name": product_name,
                "seller_id": str(seller_id),
                "seller_name": seller_name,
                "unit_price": unit_price,
                "quantity": requested_qty,
                "available_stock": available_stock,
            }
        )

    # 5. Insert rows into user_orders table
    order_summaries: list[OrderItemSummary] = []
    order_ids: list[int] = []

    try:
        for item in prepared_items:
            order_data = {
                "product_id": item["product_id"],
                "bought_price": item["unit_price"],
                "buyer_id": user_id_str,
                "delivery_types": "pending",
                "address": payload.address,
                "seller_id": item["seller_id"],
                "quantity": item["quantity"],
            }
            order_res = supabase_client.table("user_orders").insert(order_data).execute()
            if not order_res.data:
                raise RuntimeError("Failed to insert order row.")

            created_order = order_res.data[0]
            order_id = created_order["id"]
            order_ids.append(order_id)

            subtotal = round(item["unit_price"] * item["quantity"], 2)
            order_created_at = (
                created_order.get("created_at") or datetime.now(timezone.utc).isoformat()
            )

            order_summaries.append(
                OrderItemSummary(
                    id=order_id,
                    product_id=UUID(item["product_id"]),
                    product_name=item["product_name"],
                    seller_id=UUID(item["seller_id"]),
                    seller_name=item["seller_name"],
                    bought_price=item["unit_price"],
                    quantity=item["quantity"],
                    subtotal=subtotal,
                    delivery_types="pending",
                    address=payload.address,
                    created_at=order_created_at,
                )
            )

        # 6. Decrement inventory stock in seller_products
        for item in prepared_items:
            new_stock = item["available_stock"] - item["quantity"]
            supabase_client.table("seller_products").update({"stock": new_stock}).eq(
                "id", item["seller_product_id"]
            ).execute()

        # 7. Optionally save shipping address to user profile
        if payload.save_address:
            supabase_client.table("users").update({"address": payload.address}).eq(
                "id", user_id_str
            ).execute()

        # 8. Clear buyer's cart items
        supabase_client.table("cart_items").delete().eq("cart_id", cart_id).execute()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An error occurred while placing your order.",
                }
            },
        ) from exc

    total_items = sum(order.quantity for order in order_summaries)
    total_price = round(sum(order.subtotal for order in order_summaries), 2)

    return CheckoutResponse(
        order_ids=order_ids,
        orders=order_summaries,
        total_items=total_items,
        total_price=total_price,
        message="Order placed successfully.",
    )

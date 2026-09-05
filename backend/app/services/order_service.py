from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.order import OrderDetailResponse, OrderListResponse


def get_buyer_orders(
    supabase_client: Client,
    user_id: UUID | str,
    user_role: str,
) -> OrderListResponse:
    """Fetch all orders placed by the authenticated buyer, chronologically sorted (newest first).

    Validates buyer role, queries user_orders with joins/fallbacks for products and sellers,
    computes item subtotals, and returns an OrderListResponse.
    """
    # 1. Verify user has the 'buyer' role
    if user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only buyers can view order history.",
                }
            },
        )

    user_id_str = str(user_id)

    # 2. Query user_orders table for rows where buyer_id matches user_id_str,
    # sorted by created_at descending
    select_fields = (
        "id, product_id, bought_price, buyer_id, delivery_types, address, "
        "seller_id, quantity, created_at, "
        "products(id, name, brand, image_url), "
        "users!seller_id(id, display_name)"
    )

    try:
        query_res = (
            supabase_client.table("user_orders")
            .select(select_fields)
            .eq("buyer_id", user_id_str)
            .order("created_at", desc=True)
            .execute()
        )
        raw_orders = query_res.data or []
    except Exception:
        # Fallback query without joins if relationship syntax differs or fails
        fallback_fields = (
            "id, product_id, bought_price, buyer_id, delivery_types, address, "
            "seller_id, quantity, created_at"
        )
        query_res = (
            supabase_client.table("user_orders")
            .select(fallback_fields)
            .eq("buyer_id", user_id_str)
            .order("created_at", desc=True)
            .execute()
        )
        raw_orders = query_res.data or []

    # 3. If no orders found, return empty OrderListResponse
    if not raw_orders:
        return OrderListResponse(orders=[], total_orders=0)

    # 4. Process and enrich each order
    order_details: list[OrderDetailResponse] = []

    for row in raw_orders:
        order_id = int(row["id"])
        product_id_raw = row.get("product_id")
        seller_id_raw = row.get("seller_id")
        bought_price = float(row.get("bought_price", 0.0))
        quantity = int(row.get("quantity", 1))
        subtotal = round(bought_price * quantity, 2)
        delivery_types = str(row.get("delivery_types") or "pending")
        address = str(row.get("address") or "")
        created_at = row.get("created_at")

        # Resolve product information (from join or fallback query)
        prod_join = row.get("products")
        if isinstance(prod_join, dict):
            product_name = prod_join.get("name") or "Unknown Product"
            product_brand = prod_join.get("brand") or "Unknown Brand"
            product_image_url = prod_join.get("image_url")
        else:
            product_name = "Unknown Product"
            product_brand = "Unknown Brand"
            product_image_url = None
            if product_id_raw:
                try:
                    p_res = (
                        supabase_client.table("products")
                        .select("name, brand, image_url")
                        .eq("id", str(product_id_raw))
                        .execute()
                    )
                    if p_res.data and len(p_res.data) > 0:
                        p_data = p_res.data[0]
                        product_name = p_data.get("name") or product_name
                        product_brand = p_data.get("brand") or product_brand
                        product_image_url = p_data.get("image_url")
                except Exception:
                    pass

        # Resolve seller information (from join or fallback query)
        seller_join = row.get("users")
        if isinstance(seller_join, dict):
            seller_name = seller_join.get("display_name") or "Unknown Merchant"
        else:
            seller_name = "Unknown Merchant"
            if seller_id_raw:
                try:
                    u_res = (
                        supabase_client.table("users")
                        .select("display_name")
                        .eq("id", str(seller_id_raw))
                        .execute()
                    )
                    if u_res.data and len(u_res.data) > 0:
                        seller_name = u_res.data[0].get("display_name") or seller_name
                except Exception:
                    pass

        # Ensure valid UUIDs for product_id and seller_id
        product_id = UUID(str(product_id_raw))
        seller_id = UUID(str(seller_id_raw))

        order_details.append(
            OrderDetailResponse(
                id=order_id,
                product_id=product_id,
                product_name=product_name,
                product_brand=product_brand,
                product_image_url=product_image_url,
                seller_id=seller_id,
                seller_name=seller_name,
                bought_price=bought_price,
                quantity=quantity,
                subtotal=subtotal,
                delivery_types=delivery_types,
                address=address,
                created_at=created_at,
            )
        )

    # 5. Return OrderListResponse
    return OrderListResponse(orders=order_details, total_orders=len(order_details))

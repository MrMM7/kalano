import logging
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.logistics import LogisticsOrderItemResponse

logger = logging.getLogger(__name__)

ALLOWED_DELIVERY_STATUSES = {
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
}


def get_all_logistics_orders(
    supabase_client: Client,
    status_filter: str | None = None,
) -> list[LogisticsOrderItemResponse]:
    """Retrieve all platform orders for logistics management, enriched with product,
    merchant, and buyer details. Supports optional filtering by delivery status.
    """
    normalized_status: str | None = None
    if status_filter is not None:
        normalized_status = status_filter.strip().lower()
        if normalized_status not in ALLOWED_DELIVERY_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_STATUS",
                        "message": (
                            f"Invalid order status '{status_filter}'. Allowed statuses: "
                            f"{', '.join(sorted(ALLOWED_DELIVERY_STATUSES))}."
                        ),
                    }
                },
            )

    select_fields = (
        "id, product_id, bought_price, buyer_id, delivery_types, address, "
        "seller_id, quantity, created_at, "
        "products(id, name, brand, image_url), "
        "seller:users!seller_id(id, display_name), "
        "buyer:users!buyer_id(id, display_name)"
    )

    try:
        query = supabase_client.table("user_orders").select(select_fields)
        if normalized_status:
            query = query.eq("delivery_types", normalized_status)
        query_res = query.order("created_at", desc=True).execute()
        raw_orders = query_res.data or []
    except Exception:
        # Fallback query without relation aliases if mock or join syntax differs
        fallback_fields = (
            "id, product_id, bought_price, buyer_id, delivery_types, address, "
            "seller_id, quantity, created_at"
        )
        try:
            fallback_query = supabase_client.table("user_orders").select(fallback_fields)
            if normalized_status:
                fallback_query = fallback_query.eq("delivery_types", normalized_status)
            query_res = fallback_query.order("created_at", desc=True).execute()
            raw_orders = query_res.data or []
        except Exception as exc:
            logger.error(f"Failed to query logistics orders: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "Failed to fetch logistics orders.",
                    }
                },
            ) from exc

    orders: list[LogisticsOrderItemResponse] = []
    for row in raw_orders:
        order_id = int(row["id"])
        product_id_raw = row.get("product_id")
        seller_id_raw = row.get("seller_id")
        buyer_id_raw = row.get("buyer_id")
        bought_price = float(row.get("bought_price", 0.0))
        quantity = int(row.get("quantity", 1))
        subtotal = round(bought_price * quantity, 2)
        delivery_types = str(row.get("delivery_types") or "pending")
        address = str(row.get("address") or "")
        created_at = row.get("created_at")

        # Resolve product information
        product_data = row.get("products")
        if isinstance(product_data, dict):
            product_name = product_data.get("name") or "Unknown Product"
            product_brand = product_data.get("brand") or "Unknown Brand"
            product_image_url = product_data.get("image_url")
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
                        p_info = p_res.data[0]
                        product_name = p_info.get("name") or product_name
                        product_brand = p_info.get("brand") or product_brand
                        product_image_url = p_info.get("image_url")
                except Exception:
                    pass

        # Resolve seller information
        seller_data = row.get("seller") or row.get("users")
        if isinstance(seller_data, dict):
            seller_name = seller_data.get("display_name") or "Unknown Merchant"
        else:
            seller_name = "Unknown Merchant"
            if seller_id_raw:
                try:
                    s_res = (
                        supabase_client.table("users")
                        .select("display_name")
                        .eq("id", str(seller_id_raw))
                        .execute()
                    )
                    if s_res.data and len(s_res.data) > 0:
                        seller_name = s_res.data[0].get("display_name") or seller_name
                except Exception:
                    pass

        # Resolve buyer information
        buyer_data = row.get("buyer")
        if isinstance(buyer_data, dict):
            buyer_name = buyer_data.get("display_name") or "Unknown Buyer"
        else:
            buyer_name = "Unknown Buyer"
            if buyer_id_raw:
                try:
                    b_res = (
                        supabase_client.table("users")
                        .select("display_name")
                        .eq("id", str(buyer_id_raw))
                        .execute()
                    )
                    if b_res.data and len(b_res.data) > 0:
                        buyer_name = b_res.data[0].get("display_name") or buyer_name
                except Exception:
                    pass

        orders.append(
            LogisticsOrderItemResponse(
                id=order_id,
                product_id=UUID(str(product_id_raw)),
                product_name=product_name,
                product_brand=product_brand,
                product_image_url=product_image_url,
                seller_id=UUID(str(seller_id_raw)),
                seller_name=seller_name,
                buyer_id=UUID(str(buyer_id_raw)) if buyer_id_raw else None,
                buyer_name=buyer_name,
                address=address,
                bought_price=bought_price,
                quantity=quantity,
                subtotal=subtotal,
                delivery_types=delivery_types,
                created_at=created_at,
            )
        )

    return orders

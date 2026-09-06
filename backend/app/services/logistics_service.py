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

ALLOWED_ORDER_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped": {"delivered", "cancelled"},
    "delivered": {"returned"},
    "cancelled": set(),
    "returned": set(),
}


def _enrich_order_item(supabase_client: Client, row: dict) -> LogisticsOrderItemResponse:
    """Enrich a raw user_orders row into a validated LogisticsOrderItemResponse."""
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

    return LogisticsOrderItemResponse(
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

    return [_enrich_order_item(supabase_client, row) for row in raw_orders]


def update_logistics_order_status(
    supabase_client: Client,
    order_id: int,
    new_status: str,
) -> LogisticsOrderItemResponse:
    """Validate status transition according to state machine rules, restore inventory
    if transitioning to cancelled, update order status, and return enriched order representation.
    """
    normalized_status = new_status.strip().lower() if new_status else ""
    if normalized_status not in ALLOWED_DELIVERY_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_STATUS",
                    "message": (
                        f"Invalid order status '{new_status}'. Allowed statuses: "
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
        query_res = (
            supabase_client.table("user_orders").select(select_fields).eq("id", order_id).execute()
        )
        order_rows = query_res.data or []
    except Exception:
        fallback_fields = (
            "id, product_id, bought_price, buyer_id, delivery_types, address, "
            "seller_id, quantity, created_at"
        )
        try:
            fallback_res = (
                supabase_client.table("user_orders")
                .select(fallback_fields)
                .eq("id", order_id)
                .execute()
            )
            order_rows = fallback_res.data or []
        except Exception as exc:
            logger.error(f"Failed to retrieve order {order_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "Failed to retrieve order details.",
                    }
                },
            ) from exc

    if not order_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "ORDER_NOT_FOUND",
                    "message": f"Order with ID {order_id} was not found.",
                }
            },
        )

    order_row = order_rows[0]
    current_status = str(order_row.get("delivery_types") or "pending").strip().lower()

    allowed_transitions = ALLOWED_ORDER_TRANSITIONS.get(current_status, set())
    if normalized_status not in allowed_transitions:
        allowed_str = (
            ", ".join(sorted(allowed_transitions))
            if allowed_transitions
            else "none (terminal state)"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_STATUS_TRANSITION",
                    "message": (
                        f"Cannot transition order status from '{current_status}' to "
                        f"'{normalized_status}'. Allowed transitions from '{current_status}': "
                        f"{allowed_str}."
                    ),
                }
            },
        )

    # If transitioning to cancelled, restore seller stock
    if normalized_status == "cancelled":
        product_id = order_row.get("product_id")
        seller_id = order_row.get("seller_id")
        quantity = int(order_row.get("quantity") or 0)

        if product_id and seller_id and quantity > 0:
            try:
                sp_res = (
                    supabase_client.table("seller_products")
                    .select("id, stock")
                    .eq("product_id", str(product_id))
                    .eq("seller_id", str(seller_id))
                    .execute()
                )
                sp_data = sp_res.data or []
                if sp_data:
                    sp_item = sp_data[0]
                    current_stock = int(sp_item.get("stock") or 0)
                    new_stock = current_stock + quantity
                    supabase_client.table("seller_products").update({"stock": new_stock}).eq(
                        "id", sp_item["id"]
                    ).execute()
                else:
                    logger.warning(
                        f"No matching seller_products record found for product {product_id} "
                        f"and seller {seller_id} while cancelling order {order_id}. "
                        "Skipping stock restoration."
                    )
            except Exception as exc:
                logger.error(f"Failed to restore stock for order {order_id}: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": "Failed to restore product inventory on order cancellation.",
                        }
                    },
                ) from exc

    # Update delivery_types on user_orders
    try:
        supabase_client.table("user_orders").update({"delivery_types": normalized_status}).eq(
            "id", order_id
        ).execute()
    except Exception as exc:
        logger.error(f"Failed to update delivery_types for order {order_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to update order status.",
                }
            },
        ) from exc

    order_row["delivery_types"] = normalized_status
    return _enrich_order_item(supabase_client, order_row)

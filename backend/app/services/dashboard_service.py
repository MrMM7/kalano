import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from supabase import Client

from app.models.dashboard import (
    MerchantOfferCreateRequest,
    MerchantOfferItemResponse,
    MerchantOfferResponse,
)

logger = logging.getLogger(__name__)


def get_merchant_offers(
    supabase_client: Client,
    seller_id: UUID | str,
) -> list[MerchantOfferItemResponse]:
    """Query seller_products for offers belonging to seller_id, joining product details."""
    seller_id_str = str(seller_id)
    select_fields = (
        "id, product_id, seller_id, price, stock, estimated_delivery_days, created_at, "
        "products(id, name, brand, description, image_url)"
    )

    try:
        query_res = (
            supabase_client.table("seller_products")
            .select(select_fields)
            .eq("seller_id", seller_id_str)
            .order("created_at", desc=True)
            .execute()
        )
        raw_offers = query_res.data or []
    except Exception as exc:
        logger.error(f"Failed to fetch merchant offers: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to fetch merchant offers.",
                }
            },
        ) from exc

    offers: list[MerchantOfferItemResponse] = []
    for row in raw_offers:
        product_data = row.get("products") or {}
        offers.append(
            MerchantOfferItemResponse(
                id=row["id"],
                product_id=row["product_id"],
                product_name=product_data.get("name") or "",
                product_brand=product_data.get("brand") or "",
                product_description=product_data.get("description") or "",
                product_image_url=product_data.get("image_url"),
                price=float(row["price"]),
                stock=int(row["stock"]),
                estimated_delivery_days=row.get("estimated_delivery_days"),
                created_at=row.get("created_at"),
            )
        )

    return offers


def create_merchant_offer(
    supabase_client: Client,
    seller_id: UUID | str,
    payload: MerchantOfferCreateRequest,
) -> MerchantOfferResponse:
    """Create a new seller offer for an existing catalog product."""
    seller_id_str = str(seller_id)
    product_id_str = str(payload.product_id)

    # 1. Verify target product exists
    try:
        product_res = (
            supabase_client.table("products").select("id").eq("id", product_id_str).execute()
        )
        if not product_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "PRODUCT_NOT_FOUND",
                        "message": f"Product with ID '{product_id_str}' was not found.",
                    }
                },
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to verify product existence: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to verify product existence.",
                }
            },
        ) from exc

    # 2. Check for duplicate offer by the same merchant on this product
    try:
        dup_res = (
            supabase_client.table("seller_products")
            .select("id")
            .eq("seller_id", seller_id_str)
            .eq("product_id", product_id_str)
            .execute()
        )
        if dup_res.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "DUPLICATE_OFFER",
                        "message": (
                            "You already have an active offer for this product. "
                            "Update your existing offer instead."
                        ),
                    }
                },
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to check for duplicate offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to check for duplicate offer.",
                }
            },
        ) from exc

    # 3. Insert new offer into seller_products
    offer_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    insert_data = {
        "id": offer_id,
        "product_id": product_id_str,
        "seller_id": seller_id_str,
        "price": payload.price,
        "stock": payload.stock,
        "estimated_delivery_days": payload.estimated_delivery_days,
        "created_at": created_at,
    }

    try:
        insert_res = supabase_client.table("seller_products").insert(insert_data).execute()
        inserted_row = insert_res.data[0] if insert_res.data else insert_data
    except Exception as exc:
        logger.error(f"Failed to create merchant offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to create merchant offer.",
                }
            },
        ) from exc

    return MerchantOfferResponse(
        id=inserted_row["id"],
        product_id=inserted_row["product_id"],
        seller_id=inserted_row["seller_id"],
        price=float(inserted_row["price"]),
        stock=int(inserted_row["stock"]),
        estimated_delivery_days=inserted_row.get("estimated_delivery_days"),
        created_at=inserted_row.get("created_at"),
    )

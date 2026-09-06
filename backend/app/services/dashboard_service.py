import logging
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.dashboard import MerchantOfferItemResponse

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

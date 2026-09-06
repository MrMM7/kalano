import logging
import re
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.product import (
    CatalogOffersMap,
    CheapestOfferResponse,
    ProductDetailResponse,
    ProductListItemResponse,
    ProductRecord,
    ProductsListResponse,
    SellerOfferItem,
    SellerOfferRecord,
)

logger = logging.getLogger(__name__)


def sanitize_search_query(q: str) -> str:
    r"""Sanitize user input for safe PostgREST ILIKE filter interpolation.

    1. Strips leading/trailing whitespace.
    2. Escapes SQL LIKE wildcards (% and _) and escape character (\).
    3. Strips PostgREST filter delimiters (, ( ) ") that could manipulate query logic.
    """
    term = q.strip()
    term = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    term = re.sub(r'[,()"]', "", term)
    return term.strip()


def list_products(
    supabase_client: Client,
    limit: int,
    offset: int,
    q: str | None = None,
) -> ProductsListResponse:
    """Query catalog products with pagination, substring search, and cheapest in-stock offer."""
    query = supabase_client.table("products").select("*", count="exact")

    cleaned_q = sanitize_search_query(q) if q and q.strip() else None
    if cleaned_q:
        # Supabase postgrest filter: name.ilike.%term%,description.ilike.%term%
        query = query.or_(f"name.ilike.%{cleaned_q}%,description.ilike.%{cleaned_q}%")

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    response = query.execute()

    raw_products = response.data or []
    total_count: int = response.count if response.count is not None else len(raw_products)

    if not raw_products:
        return ProductsListResponse(
            items=[],
            total=total_count,
            limit=limit,
            offset=offset,
        )

    product_records: list[ProductRecord] = [
        ProductRecord.model_validate(prod) for prod in raw_products
    ]
    product_ids = [str(prod.id) for prod in product_records]

    # Batch query seller_products for these products with stock > 0, joining users
    select_fields = (
        "id, product_id, seller_id, price, stock, estimated_delivery_days, users(display_name)"
    )
    offers_response = (
        supabase_client.table("seller_products")
        .select(select_fields)
        .in_("product_id", product_ids)
        .gt("stock", 0)
        .execute()
    )

    raw_offers = offers_response.data or []
    offer_records: list[SellerOfferRecord] = [
        SellerOfferRecord.model_validate(offer) for offer in raw_offers
    ]

    # Map product UUID to its offers collection using custom CatalogOffersMap
    offers_map = CatalogOffersMap.from_records(offer_records)

    # Build product response items with calculated cheapest offer
    product_items: list[ProductListItemResponse] = [
        ProductListItemResponse(
            id=prod.id,
            name=prod.name,
            description=prod.description,
            brand=prod.brand,
            image_url=prod.image_url,
            cheapest_offer=offers_map.get_cheapest_for_product(prod.id),
        )
        for prod in product_records
    ]

    return ProductsListResponse(
        items=product_items,
        total=total_count,
        limit=limit,
        offset=offset,
    )


def get_product_by_id(
    supabase_client: Client,
    product_id: UUID,
) -> ProductDetailResponse:
    """Retrieve product detail and all seller offers sorted by price ascending."""
    prod_resp = supabase_client.table("products").select("*").eq("id", str(product_id)).execute()

    if not prod_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "RESOURCE_NOT_FOUND",
                    "message": f"Product with ID '{product_id}' was not found.",
                }
            },
        )

    product_record = ProductRecord.model_validate(prod_resp.data[0])

    select_fields = (
        "id, product_id, seller_id, price, stock, estimated_delivery_days, users(display_name)"
    )
    offers_resp = (
        supabase_client.table("seller_products")
        .select(select_fields)
        .eq("product_id", str(product_id))
        .execute()
    )

    raw_offers = offers_resp.data or []
    offer_records: list[SellerOfferRecord] = [
        SellerOfferRecord.model_validate(offer) for offer in raw_offers
    ]

    # Sort offers: price ascending, then estimated_delivery_days ascending, then id ascending
    def offer_sort_key(item: SellerOfferRecord):
        price = float(item.price)
        delivery = item.estimated_delivery_days
        delivery_val = float("inf") if delivery is None else float(delivery)
        return (price, delivery_val, str(item.id))

    sorted_offers = sorted(offer_records, key=offer_sort_key)

    # Calculate cheapest_offer: lowest priced offer with stock > 0, breaking ties with delivery
    cheapest_offer: CheapestOfferResponse | None = None
    in_stock_offers = [o for o in sorted_offers if int(o.stock) > 0]
    if in_stock_offers:
        best_offer = in_stock_offers[0]
        best_seller_name = (
            best_offer.users.display_name
            if best_offer.users and best_offer.users.display_name
            else "Unknown Seller"
        )
        cheapest_offer = CheapestOfferResponse(
            seller_product_id=best_offer.id,
            seller_id=best_offer.seller_id,
            seller_name=best_seller_name,
            price=float(best_offer.price),
            stock=int(best_offer.stock),
            estimated_delivery_days=best_offer.estimated_delivery_days,
        )

    # Build SellerOfferItem list
    offers_items = [
        SellerOfferItem(
            seller_product_id=offer.id,
            seller_id=offer.seller_id,
            seller_name=(
                offer.users.display_name
                if offer.users and offer.users.display_name
                else "Unknown Seller"
            ),
            price=float(offer.price),
            stock=int(offer.stock),
            estimated_delivery_days=offer.estimated_delivery_days,
        )
        for offer in sorted_offers
    ]

    return ProductDetailResponse(
        id=product_record.id,
        name=product_record.name,
        description=product_record.description,
        brand=product_record.brand,
        image_url=product_record.image_url,
        created_at=product_record.created_at,
        cheapest_offer=cheapest_offer,
        offers=offers_items,
    )

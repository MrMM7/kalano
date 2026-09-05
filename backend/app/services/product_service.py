import logging
import re

from supabase import Client

from app.models.product import (
    CatalogOffersMap,
    ProductListItemResponse,
    ProductRecord,
    ProductsListResponse,
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
        "id, product_id, seller_id, price, stock, "
        "estimated_delivery_days, created_at, users(display_name)"
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

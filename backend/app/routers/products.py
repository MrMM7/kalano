from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query, status
from supabase import Client

from app.dependencies.database import get_supabase_client
from app.models.product import ProductDetailResponse, ProductsListResponse
from app.services.product_service import get_product_by_id, list_products

router = APIRouter(prefix="/api/v1", tags=["Products"])


@router.get(
    "/products",
    response_model=ProductsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List catalog products with cheapest offer",
    description=(
        "Retrieves a paginated list of catalog products. Supports case-insensitive substring "
        "searching on product name and description via query parameter `q`. Each product "
        "includes its cheapest available in-stock seller offer, or null if out of stock. "
        "`limit` and `offset` are required parameters."
    ),
    responses={
        200: {
            "model": ProductsListResponse,
            "description": "Paginated list of catalog products retrieved successfully.",
        },
        422: {
            "description": "Validation error in query parameters.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def get_products(
    limit: int = Query(
        ...,
        ge=1,
        le=100,
        description="Maximum number of items to return (1 to 100).",
        examples=[10],
    ),
    offset: int = Query(
        ...,
        ge=0,
        description="Number of items to skip for pagination (0 or greater).",
        examples=[0],
    ),
    q: str | None = Query(
        default=None,
        description="Optional search keyword to match against product name or description.",
        examples=["headphones"],
    ),
    supabase_client: Client = Depends(get_supabase_client),
) -> ProductsListResponse:
    return list_products(
        supabase_client=supabase_client,
        limit=limit,
        offset=offset,
        q=q,
    )


@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product details and all seller offers",
    description=(
        "Retrieves details for a specific catalog product along with all associated seller "
        "offers sorted by price ascending. Highlights the cheapest in-stock offer if available."
    ),
    responses={
        200: {
            "model": ProductDetailResponse,
            "description": "Product details and seller offers retrieved successfully.",
        },
        404: {
            "description": "Product with the given ID does not exist.",
        },
        422: {
            "description": "Validation error: provided product_id is not a valid UUID.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def get_product(
    product_id: UUID = Path(
        ...,
        description="Unique identifier of the product (UUID string).",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    ),
    supabase_client: Client = Depends(get_supabase_client),
) -> ProductDetailResponse:
    return get_product_by_id(
        supabase_client=supabase_client,
        product_id=product_id,
    )

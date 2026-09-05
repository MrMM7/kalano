from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.dependencies.database import get_supabase_client
from app.models.auth import ErrorResponse
from app.models.product import ProductsListResponse
from app.services.product_service import list_products

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
            "model": ErrorResponse,
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

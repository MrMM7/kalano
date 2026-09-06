from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.logistics import LogisticsOrderItemResponse
from app.services.logistics_service import get_all_logistics_orders

router = APIRouter(prefix="/api/v1/logistics", tags=["Logistics"])


@router.get(
    "/orders",
    response_model=list[LogisticsOrderItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all platform orders for logistics management",
    description=(
        "Returns all customer orders across all merchants and buyers, enriched with seller "
        "information, customer delivery addresses, product details, and fulfillment statuses. "
        "Supports optional filtering by order delivery status. Access is restricted strictly "
        "to users with the logistics role."
    ),
    responses={
        200: {
            "model": list[LogisticsOrderItemResponse],
            "description": "Successfully retrieved logistics orders.",
        },
        400: {
            "description": "Bad Request: status query parameter does not match allowed values.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the logistics role.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
@router.get(
    "/orders/",
    response_model=list[LogisticsOrderItemResponse],
    include_in_schema=False,
)
def list_logistics_orders(
    order_status: str | None = Query(
        default=None,
        alias="status",
        description=(
            "Filter orders by fulfillment status. Allowed values: pending, confirmed, "
            "shipped, delivered, cancelled, returned"
        ),
    ),
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> list[LogisticsOrderItemResponse]:
    if current_user.user_role != "logistics":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only logistics personnel can view platform orders.",
                }
            },
        )

    return get_all_logistics_orders(
        supabase_client=supabase_client,
        status_filter=order_status,
    )

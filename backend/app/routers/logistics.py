from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.logistics import LogisticsOrderItemResponse, LogisticsOrderStatusUpdateRequest
from app.services.logistics_service import (
    get_all_logistics_orders,
    update_logistics_order_status,
)

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


@router.patch(
    "/orders/{order_id}",
    response_model=LogisticsOrderItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update fulfillment delivery status for an order",
    description=(
        "Transitions an order's delivery status according to the logistics state machine rules. "
        "Only logistics personnel may invoke this endpoint. If transitioning an active order "
        "to cancelled, reserved product stock is restored to the seller's inventory."
    ),
    responses={
        200: {
            "model": LogisticsOrderItemResponse,
            "description": "Successfully updated order status.",
        },
        400: {
            "description": "Bad Request: invalid status or disallowed status transition.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the logistics role.",
        },
        404: {
            "description": "Not Found: order ID does not exist.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
@router.patch(
    "/orders/{order_id}/",
    response_model=LogisticsOrderItemResponse,
    include_in_schema=False,
)
def update_order_status(
    order_id: int,
    payload: LogisticsOrderStatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> LogisticsOrderItemResponse:
    if current_user.user_role != "logistics":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only logistics personnel can update order delivery status.",
                }
            },
        )

    return update_logistics_order_status(
        supabase_client=supabase_client,
        order_id=order_id,
        new_status=payload.status,
    )

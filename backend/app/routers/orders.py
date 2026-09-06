from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.order import OrderListResponse
from app.services.order_service import get_buyer_orders

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.get(
    "",
    response_model=OrderListResponse,
    status_code=status.HTTP_200_OK,
    summary="List buyer order history",
    description=(
        "Retrieves all orders placed by the currently authenticated buyer, ordered from most "
        "recent to oldest. Each order entry includes detailed product details, seller identity, "
        "purchase price, quantity, delivery address, and current delivery status."
    ),
    responses={
        200: {
            "model": OrderListResponse,
            "description": "Successfully retrieved order history.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
    },
)
@router.get(
    "/",
    response_model=OrderListResponse,
    include_in_schema=False,
)
def list_orders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> OrderListResponse:
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only buyers can view order history.",
                }
            },
        )

    return get_buyer_orders(
        supabase_client=supabase_client,
        user_id=current_user.id,
        user_role=current_user.user_role,
    )

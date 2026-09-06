from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.checkout import CheckoutRequest, CheckoutResponse
from app.services.checkout_service import process_checkout

router = APIRouter(prefix="/api/v1/checkout", tags=["Checkout"])


@router.post(
    "",
    response_model=CheckoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Process buyer checkout",
    description=(
        "Converts all items in the authenticated buyer's cart into placed orders. "
        "Validates available stock for every item atomically, decrements stock in seller_products, "
        "writes rows into user_orders with initial 'pending' delivery status, optionally updates "
        "the buyer's profile address, and clears the cart upon completion."
    ),
    responses={
        200: {
            "model": CheckoutResponse,
            "description": "Order successfully placed and cart cleared.",
        },
        400: {
            "description": "Empty cart or insufficient inventory stock.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
        422: {
            "description": "Validation error in request payload (e.g. blank address).",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
@router.post(
    "/",
    response_model=CheckoutResponse,
    include_in_schema=False,
)
def checkout_endpoint(
    payload: CheckoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> CheckoutResponse:
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only buyers can place orders.",
                }
            },
        )

    return process_checkout(
        supabase_client=supabase_client,
        user_id=current_user.id,
        user_role=current_user.user_role,
        payload=payload,
    )

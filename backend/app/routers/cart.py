from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser, ErrorResponse
from app.models.cart import CartItemCreate, CartItemResponse
from app.services.cart_service import add_item_to_cart

router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])


@router.post(
    "/items",
    response_model=CartItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Add item to cart",
    description=(
        "Adds a merchant product offer to the authenticated buyer's cart. Creates a cart if "
        "one does not exist. If the offer is already in the cart, increases the quantity. "
        "Validates available inventory stock before persisting."
    ),
    responses={
        200: {
            "model": CartItemResponse,
            "description": "Item successfully added or incremented in the cart.",
        },
        400: {
            "model": ErrorResponse,
            "description": "Insufficient inventory stock for requested quantity.",
        },
        401: {
            "model": ErrorResponse,
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "model": ErrorResponse,
            "description": "Forbidden: user does not have the buyer role.",
        },
        404: {
            "model": ErrorResponse,
            "description": "Seller product offer not found.",
        },
        422: {
            "description": "Validation error in request payload.",
        },
        500: {
            "model": ErrorResponse,
            "description": "Internal server error.",
        },
    },
)
def post_cart_item(
    payload: CartItemCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> CartItemResponse:
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_ROLE",
                    "message": "Only buyers are permitted to add items to the cart.",
                }
            },
        )

    return add_item_to_cart(
        supabase_client=supabase_client,
        user_id=current_user.id,
        seller_product_id=payload.seller_product_id,
        quantity=payload.quantity,
    )

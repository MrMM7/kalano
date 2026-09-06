from fastapi import APIRouter, Depends, HTTPException, Path, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.cart import (
    CartItemCreate,
    CartItemDeleteResponse,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)
from app.services.cart_service import (
    add_item_to_cart,
    delete_cart_item,
    get_user_cart,
    update_cart_item_quantity,
)

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
            "description": "Insufficient inventory stock for requested quantity.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
        404: {
            "description": "Seller product offer not found.",
        },
        422: {
            "description": "Validation error in request payload.",
        },
        500: {
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


@router.get(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user cart",
    description=(
        "Retrieves the active shopping cart for the authenticated buyer, including "
        "detailed item listings, merchant information, subtotals, and total price."
    ),
    responses={
        200: {
            "model": CartResponse,
            "description": "Cart successfully retrieved.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
@router.get(
    "/",
    response_model=CartResponse,
    include_in_schema=False,
)
def get_cart(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> CartResponse:
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_ROLE",
                    "message": "Only buyers are permitted to view the cart.",
                }
            },
        )

    return get_user_cart(
        supabase_client=supabase_client,
        user_id=current_user.id,
    )


@router.patch(
    "/items/{item_id}",
    response_model=CartItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update cart item quantity",
    description=(
        "Modifies the quantity of an existing item in the authenticated buyer's cart. "
        "Validates available stock before applying the update."
    ),
    responses={
        200: {
            "model": CartItemResponse,
            "description": "Cart item quantity updated successfully.",
        },
        400: {
            "description": "Insufficient inventory stock for requested quantity.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
        404: {
            "description": "Cart item not found or does not belong to user.",
        },
        422: {
            "description": "Validation error in request payload.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def patch_cart_item(
    payload: CartItemUpdate,
    item_id: int = Path(description="The primary key ID of the cart item to update", ge=1),
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> CartItemResponse:
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_ROLE",
                    "message": "Only buyers are permitted to update cart items.",
                }
            },
        )

    return update_cart_item_quantity(
        supabase_client=supabase_client,
        user_id=current_user.id,
        item_id=item_id,
        quantity=payload.quantity,
    )


@router.delete(
    "/items/{item_id}",
    response_model=CartItemDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove item from cart",
    description="Deletes a specific item from the authenticated buyer's cart.",
    responses={
        200: {
            "model": CartItemDeleteResponse,
            "description": "Cart item removed successfully.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the buyer role.",
        },
        404: {
            "description": "Cart item not found or does not belong to user.",
        },
        422: {
            "description": "Validation error in path parameters.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def delete_cart_item_endpoint(
    item_id: int = Path(description="The primary key ID of the cart item to remove", ge=1),
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> CartItemDeleteResponse:
    # 1. Verify user role
    if current_user.user_role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_ROLE",
                    "message": "Only buyers are permitted to remove items from the cart.",
                }
            },
        )

    # 2. Check to see if the user is actually the person they claim to be (verify identity in DB)
    user_res = (
        supabase_client.table("users")
        .select("id, user_role")
        .eq("id", str(current_user.id))
        .execute()
    )
    if not user_res.data or len(user_res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "User no longer exists.",
                }
            },
        )
    if user_res.data[0].get("user_role") != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_ROLE",
                    "message": "Only buyers are permitted to remove items from the cart.",
                }
            },
        )

    # 3. Check to see if the user actually has that item in their cart
    item_res = supabase_client.table("cart_items").select("id, cart_id").eq("id", item_id).execute()
    if not item_res.data or len(item_res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "CART_ITEM_NOT_FOUND",
                    "message": "Cart item not found.",
                }
            },
        )

    cart_item = item_res.data[0]
    cart_id = cart_item["cart_id"]

    # Verify that the cart containing this item belongs to the authenticated user
    cart_res = supabase_client.table("carts").select("id, user_id").eq("id", cart_id).execute()
    if not cart_res.data or str(cart_res.data[0].get("user_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "CART_ITEM_NOT_FOUND",
                    "message": "Cart item not found.",
                }
            },
        )

    return delete_cart_item(
        supabase_client=supabase_client,
        user_id=current_user.id,
        item_id=item_id,
    )

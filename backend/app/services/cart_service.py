from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.cart import CartItemResponse


def get_or_create_user_cart(supabase_client: Client, user_id: UUID | str) -> dict:
    user_id_str = str(user_id)
    cart_res = supabase_client.table("carts").select("*").eq("user_id", user_id_str).execute()

    if cart_res.data and len(cart_res.data) > 0:
        return cart_res.data[0]

    new_cart_res = supabase_client.table("carts").insert({"user_id": user_id_str}).execute()

    if not new_cart_res.data:
        # Fallback check in case of race condition / concurrent insert
        cart_res_retry = (
            supabase_client.table("carts").select("*").eq("user_id", user_id_str).execute()
        )
        if cart_res_retry.data and len(cart_res_retry.data) > 0:
            return cart_res_retry.data[0]
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "CART_CREATION_FAILED",
                    "message": "Failed to create shopping cart.",
                }
            },
        )

    return new_cart_res.data[0]


def add_item_to_cart(
    supabase_client: Client,
    user_id: UUID | str,
    seller_product_id: UUID | str,
    quantity: int,
) -> CartItemResponse:
    seller_product_id_str = str(seller_product_id)

    # 1. Check seller product existence and available stock
    sp_res = (
        supabase_client.table("seller_products")
        .select("id, stock, price")
        .eq("id", seller_product_id_str)
        .execute()
    )

    if not sp_res.data or len(sp_res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "SELLER_PRODUCT_NOT_FOUND",
                    "message": "Seller product offer not found.",
                }
            },
        )

    seller_product = sp_res.data[0]
    available_stock = seller_product.get("stock", 0)

    if available_stock < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INSUFFICIENT_STOCK",
                    "message": (
                        f"Only {available_stock} units available in stock. "
                        f"Cannot add {quantity} units."
                    ),
                }
            },
        )

    # 2. Retrieve or create cart for user
    cart = get_or_create_user_cart(supabase_client, user_id)
    cart_id = cart["id"]

    # 3. Check if item is already in cart
    item_res = (
        supabase_client.table("cart_items")
        .select("*")
        .eq("cart_id", cart_id)
        .eq("seller_product_id", seller_product_id_str)
        .execute()
    )

    if item_res.data and len(item_res.data) > 0:
        existing_item = item_res.data[0]
        existing_qty = existing_item["quantity"]
        prospective_qty = existing_qty + quantity

        if prospective_qty > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INSUFFICIENT_STOCK",
                        "message": (
                            f"Only {available_stock} units available in stock. "
                            f"Current in cart: {existing_qty}, attempted to add {quantity} more."
                        ),
                    }
                },
            )

        updated_res = (
            supabase_client.table("cart_items")
            .update({"quantity": prospective_qty})
            .eq("id", existing_item["id"])
            .execute()
        )
        saved_item = (
            updated_res.data[0]
            if updated_res.data
            else {**existing_item, "quantity": prospective_qty}
        )
        return CartItemResponse.model_validate(saved_item)

    # Item not yet in cart
    if quantity > available_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INSUFFICIENT_STOCK",
                    "message": (
                        f"Only {available_stock} units available in stock. "
                        f"Cannot add {quantity} units."
                    ),
                }
            },
        )

    insert_res = (
        supabase_client.table("cart_items")
        .insert(
            {
                "cart_id": cart_id,
                "seller_product_id": seller_product_id_str,
                "quantity": quantity,
            }
        )
        .execute()
    )

    if not insert_res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "CART_ITEM_CREATION_FAILED",
                    "message": "Failed to add item to cart.",
                }
            },
        )

    return CartItemResponse.model_validate(insert_res.data[0])

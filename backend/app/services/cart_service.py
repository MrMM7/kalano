from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.models.cart import (
    CartItemDeleteResponse,
    CartItemDetail,
    CartItemResponse,
    CartResponse,
)


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


def get_user_cart(
    supabase_client: Client,
    user_id: UUID | str,
) -> CartResponse:
    user_id_str = str(user_id)
    cart_res = supabase_client.table("carts").select("*").eq("user_id", user_id_str).execute()

    if not cart_res.data or len(cart_res.data) == 0:
        return CartResponse(
            id=None,
            user_id=UUID(user_id_str),
            items=[],
            total_items=0,
            total_price=0.0,
        )

    cart = cart_res.data[0]
    cart_id = cart["id"]

    select_fields = (
        "id, cart_id, seller_product_id, quantity, created_at, "
        "seller_products(id, product_id, seller_id, price, stock, estimated_delivery_days, "
        "products(id, name, brand, image_url), users(id, display_name))"
    )

    items_res = (
        supabase_client.table("cart_items")
        .select(select_fields)
        .eq("cart_id", cart_id)
        .order("id")
        .execute()
    )

    raw_items = items_res.data or []
    if not raw_items:
        return CartResponse(
            id=cart_id,
            user_id=UUID(user_id_str),
            items=[],
            total_items=0,
            total_price=0.0,
        )

    items: list[CartItemDetail] = []
    for raw in raw_items:
        sp = raw.get("seller_products")
        if isinstance(sp, dict):
            prod = sp.get("products") or {}
            seller_user = sp.get("users") or {}
            seller_prod_id = sp.get("id", raw.get("seller_product_id"))
            product_id = prod.get("id") or sp.get("product_id")
            product_name = prod.get("name", "")
            product_brand = prod.get("brand", "")
            product_image_url = prod.get("image_url")
            seller_id = seller_user.get("id") or sp.get("seller_id")
            seller_name = seller_user.get("display_name", "Unknown Seller")
            unit_price = float(sp.get("price", 0.0))
            stock = int(sp.get("stock", 0))
            estimated_delivery_days = sp.get("estimated_delivery_days")
        else:
            # Fallback if unjoined: fetch seller_products, products, users
            seller_prod_id = raw["seller_product_id"]
            sp_res = (
                supabase_client.table("seller_products")
                .select("id, product_id, seller_id, price, stock, estimated_delivery_days")
                .eq("id", str(seller_prod_id))
                .execute()
            )
            sp_data = sp_res.data[0] if sp_res.data else {}
            product_id = sp_data.get("product_id")
            unit_price = float(sp_data.get("price", 0.0))
            stock = int(sp_data.get("stock", 0))
            estimated_delivery_days = sp_data.get("estimated_delivery_days")
            seller_id = sp_data.get("seller_id")

            prod_name = ""
            prod_brand = ""
            prod_img = None
            if product_id:
                p_res = (
                    supabase_client.table("products")
                    .select("name, brand, image_url")
                    .eq("id", str(product_id))
                    .execute()
                )
                if p_res.data:
                    prod_name = p_res.data[0].get("name", "")
                    prod_brand = p_res.data[0].get("brand", "")
                    prod_img = p_res.data[0].get("image_url")

            s_name = "Unknown Seller"
            if seller_id:
                u_res = (
                    supabase_client.table("users")
                    .select("display_name")
                    .eq("id", str(seller_id))
                    .execute()
                )
                if u_res.data:
                    s_name = u_res.data[0].get("display_name", "Unknown Seller")

            product_name = prod_name
            product_brand = prod_brand
            product_image_url = prod_img
            seller_name = s_name

        qty = int(raw.get("quantity", 1))
        subtotal = round(unit_price * qty, 2)

        items.append(
            CartItemDetail(
                id=raw["id"],
                seller_product_id=UUID(str(seller_prod_id)),
                product_id=UUID(str(product_id)),
                product_name=product_name,
                product_brand=product_brand,
                product_image_url=product_image_url,
                seller_id=UUID(str(seller_id)),
                seller_name=seller_name,
                unit_price=unit_price,
                stock=stock,
                estimated_delivery_days=estimated_delivery_days,
                quantity=qty,
                subtotal=subtotal,
                created_at=raw.get("created_at", ""),
            )
        )

    total_items = sum(item.quantity for item in items)
    total_price = round(sum(item.subtotal for item in items), 2)

    return CartResponse(
        id=cart_id,
        user_id=UUID(user_id_str),
        items=items,
        total_items=total_items,
        total_price=total_price,
    )


def update_cart_item_quantity(
    supabase_client: Client,
    user_id: UUID | str,
    item_id: int,
    quantity: int,
) -> CartItemResponse:
    user_id_str = str(user_id)

    # 1. Fetch the cart item
    item_res = supabase_client.table("cart_items").select("*").eq("id", item_id).execute()
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

    # 2. Verify ownership of the cart
    cart_res = supabase_client.table("carts").select("id, user_id").eq("id", cart_id).execute()
    if not cart_res.data or str(cart_res.data[0].get("user_id")) != user_id_str:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "CART_ITEM_NOT_FOUND",
                    "message": "Cart item not found.",
                }
            },
        )

    # 3. Check live stock in seller_products
    sp_res = (
        supabase_client.table("seller_products")
        .select("id, stock")
        .eq("id", str(cart_item["seller_product_id"]))
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

    available_stock = sp_res.data[0].get("stock", 0)
    if quantity > available_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INSUFFICIENT_STOCK",
                    "message": (
                        f"Only {available_stock} units available in stock. "
                        f"Cannot update quantity to {quantity}."
                    ),
                }
            },
        )

    # 4. Update quantity
    update_res = (
        supabase_client.table("cart_items")
        .update({"quantity": quantity})
        .eq("id", item_id)
        .execute()
    )

    saved_item = update_res.data[0] if update_res.data else {**cart_item, "quantity": quantity}
    return CartItemResponse.model_validate(saved_item)


def delete_cart_item(
    supabase_client: Client,
    user_id: UUID | str,
    item_id: int,
) -> CartItemDeleteResponse:
    user_id_str = str(user_id)

    # 1. Fetch the cart item
    item_res = supabase_client.table("cart_items").select("*").eq("id", item_id).execute()
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

    # 2. Verify ownership of the cart
    cart_res = supabase_client.table("carts").select("id, user_id").eq("id", cart_id).execute()
    if not cart_res.data or str(cart_res.data[0].get("user_id")) != user_id_str:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "CART_ITEM_NOT_FOUND",
                    "message": "Cart item not found.",
                }
            },
        )

    # 3. Delete the item
    supabase_client.table("cart_items").delete().eq("id", item_id).execute()

    return CartItemDeleteResponse(message="Cart item removed successfully.")

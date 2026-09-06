import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile, status
from supabase import Client

from app.models.dashboard import (
    MerchantOfferCreateRequest,
    MerchantOfferDeleteResponse,
    MerchantOfferItemResponse,
    MerchantOfferResponse,
    MerchantOfferUpdateRequest,
    MerchantProductCreateResponse,
    ProductRecordModel,
)

logger = logging.getLogger(__name__)


def get_merchant_offers(
    supabase_client: Client,
    seller_id: UUID | str,
) -> list[MerchantOfferItemResponse]:
    """Query seller_products for offers belonging to seller_id, joining product details."""
    seller_id_str = str(seller_id)
    select_fields = (
        "id, product_id, seller_id, price, stock, estimated_delivery_days, created_at, "
        "products(id, name, brand, description, image_url)"
    )

    try:
        query_res = (
            supabase_client.table("seller_products")
            .select(select_fields)
            .eq("seller_id", seller_id_str)
            .order("created_at", desc=True)
            .execute()
        )
        raw_offers = query_res.data or []
    except Exception as exc:
        logger.error(f"Failed to fetch merchant offers: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to fetch merchant offers.",
                }
            },
        ) from exc

    offers: list[MerchantOfferItemResponse] = []
    for row in raw_offers:
        product_data = row.get("products") or {}
        offers.append(
            MerchantOfferItemResponse(
                id=row["id"],
                product_id=row["product_id"],
                product_name=product_data.get("name") or "",
                product_brand=product_data.get("brand") or "",
                product_description=product_data.get("description") or "",
                product_image_url=product_data.get("image_url"),
                price=float(row["price"]),
                stock=int(row["stock"]),
                estimated_delivery_days=row.get("estimated_delivery_days"),
                created_at=row.get("created_at"),
            )
        )

    return offers


def create_merchant_offer(
    supabase_client: Client,
    seller_id: UUID | str,
    payload: MerchantOfferCreateRequest,
) -> MerchantOfferResponse:
    """Create a new seller offer for an existing catalog product."""
    seller_id_str = str(seller_id)
    product_id_str = str(payload.product_id)

    # 1. Verify target product exists
    try:
        product_res = (
            supabase_client.table("products").select("id").eq("id", product_id_str).execute()
        )
        if not product_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "PRODUCT_NOT_FOUND",
                        "message": f"Product with ID '{product_id_str}' was not found.",
                    }
                },
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to verify product existence: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to verify product existence.",
                }
            },
        ) from exc

    # 2. Check for duplicate offer by the same merchant on this product
    try:
        dup_res = (
            supabase_client.table("seller_products")
            .select("id")
            .eq("seller_id", seller_id_str)
            .eq("product_id", product_id_str)
            .execute()
        )
        if dup_res.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "DUPLICATE_OFFER",
                        "message": (
                            "You already have an active offer for this product. "
                            "Update your existing offer instead."
                        ),
                    }
                },
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to check for duplicate offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to check for duplicate offer.",
                }
            },
        ) from exc

    # 3. Insert new offer into seller_products
    offer_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    insert_data = {
        "id": offer_id,
        "product_id": product_id_str,
        "seller_id": seller_id_str,
        "price": payload.price,
        "stock": payload.stock,
        "estimated_delivery_days": payload.estimated_delivery_days,
        "created_at": created_at,
    }

    try:
        insert_res = supabase_client.table("seller_products").insert(insert_data).execute()
        inserted_row = insert_res.data[0] if insert_res.data else insert_data
    except Exception as exc:
        logger.error(f"Failed to create merchant offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to create merchant offer.",
                }
            },
        ) from exc

    return MerchantOfferResponse(
        id=inserted_row["id"],
        product_id=inserted_row["product_id"],
        seller_id=inserted_row["seller_id"],
        price=float(inserted_row["price"]),
        stock=int(inserted_row["stock"]),
        estimated_delivery_days=inserted_row.get("estimated_delivery_days"),
        created_at=inserted_row.get("created_at"),
    )


def upload_product_image(
    image_file: UploadFile,
    supabase_client: Client,
) -> str:
    """Upload product image file to Supabase Storage products bucket and return public URL."""
    try:
        content_type = image_file.content_type or "application/octet-stream"
        file_bytes = image_file.file.read()
        filename = image_file.filename or "image.jpg"
        file_ext = filename.split(".")[-1] if "." in filename else "jpg"
        unique_name = f"{uuid4()}.{file_ext}"

        # Upload to Supabase Storage 'products' bucket
        storage_bucket = supabase_client.storage.from_("products")
        storage_bucket.upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        return storage_bucket.get_public_url(unique_name)
    except Exception as exc:
        logger.error(f"Failed to upload product image to Supabase Storage: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "IMAGE_UPLOAD_FAILED",
                    "message": "Failed to upload image to Supabase Storage.",
                }
            },
        ) from exc


def create_product_and_offer(
    supabase_client: Client,
    seller_id: UUID | str,
    name: str,
    description: str,
    brand: str,
    price: float,
    stock: int,
    estimated_delivery_days: int | None = None,
    image_file: UploadFile | None = None,
) -> MerchantProductCreateResponse:
    """Create a new catalog product and attach the merchant's initial offer."""
    seller_id_str = str(seller_id)

    # 1. Upload image if provided
    image_url: str | None = None
    if image_file and image_file.filename:
        image_url = upload_product_image(
            image_file=image_file,
            supabase_client=supabase_client,
        )

    # 2. Insert into products table
    product_id = str(uuid4())
    product_created_at = datetime.now(timezone.utc).isoformat()
    product_data = {
        "id": product_id,
        "name": name,
        "description": description,
        "brand": brand,
        "image_url": image_url,
        "created_at": product_created_at,
    }

    try:
        prod_res = supabase_client.table("products").insert(product_data).execute()
        created_prod = prod_res.data[0] if prod_res.data else product_data
    except Exception as exc:
        logger.error(f"Failed to insert product record: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to create product record.",
                }
            },
        ) from exc

    # 3. Insert into seller_products table
    offer_id = str(uuid4())
    offer_created_at = datetime.now(timezone.utc).isoformat()
    offer_data = {
        "id": offer_id,
        "product_id": product_id,
        "seller_id": seller_id_str,
        "price": price,
        "stock": stock,
        "estimated_delivery_days": estimated_delivery_days,
        "created_at": offer_created_at,
    }

    try:
        offer_res = supabase_client.table("seller_products").insert(offer_data).execute()
        created_offer = offer_res.data[0] if offer_res.data else offer_data
    except Exception as exc:
        logger.error(f"Failed to insert seller offer record: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to create seller offer record.",
                }
            },
        ) from exc

    return MerchantProductCreateResponse(
        product=ProductRecordModel(
            id=created_prod["id"],
            name=created_prod["name"],
            description=created_prod["description"],
            brand=created_prod["brand"],
            image_url=created_prod.get("image_url"),
            created_at=created_prod.get("created_at"),
        ),
        offer=MerchantOfferResponse(
            id=created_offer["id"],
            product_id=created_offer["product_id"],
            seller_id=created_offer["seller_id"],
            price=float(created_offer["price"]),
            stock=int(created_offer["stock"]),
            estimated_delivery_days=created_offer.get("estimated_delivery_days"),
            created_at=created_offer.get("created_at"),
        ),
    )


def verify_offer_ownership(
    supabase_client: Client,
    offer_id: UUID | str,
    seller_id: UUID | str,
) -> dict:
    """Verify an offer exists and is owned by the specified seller."""
    offer_id_str = str(offer_id)
    seller_id_str = str(seller_id)

    try:
        res = supabase_client.table("seller_products").select("*").eq("id", offer_id_str).execute()
        rows = res.data or []
    except Exception as exc:
        logger.error(f"Failed to query offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to query offer.",
                }
            },
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "OFFER_NOT_FOUND",
                    "message": f"Offer with ID '{offer_id_str}' was not found.",
                }
            },
        )

    record = rows[0]
    if str(record.get("seller_id")) != seller_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to modify this offer.",
                }
            },
        )

    return record


def update_merchant_offer(
    supabase_client: Client,
    seller_id: UUID | str,
    offer_id: UUID | str,
    payload: MerchantOfferUpdateRequest,
) -> MerchantOfferResponse:
    """Update price, stock, or estimated delivery days for a seller offer."""
    existing_offer = verify_offer_ownership(
        supabase_client=supabase_client,
        offer_id=offer_id,
        seller_id=seller_id,
    )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "EMPTY_UPDATE",
                    "message": "At least one field must be provided for update.",
                }
            },
        )

    try:
        update_res = (
            supabase_client.table("seller_products")
            .update(update_data)
            .eq("id", str(offer_id))
            .execute()
        )
        updated_row = update_res.data[0] if update_res.data else {**existing_offer, **update_data}
    except Exception as exc:
        logger.error(f"Failed to update offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to update offer.",
                }
            },
        ) from exc

    return MerchantOfferResponse(
        id=updated_row["id"],
        product_id=updated_row["product_id"],
        seller_id=updated_row["seller_id"],
        price=float(updated_row["price"]),
        stock=int(updated_row["stock"]),
        estimated_delivery_days=updated_row.get("estimated_delivery_days"),
        created_at=updated_row.get("created_at"),
    )


def delete_merchant_offer(
    supabase_client: Client,
    seller_id: UUID | str,
    offer_id: UUID | str,
) -> MerchantOfferDeleteResponse:
    """Permanently delete a seller offer, clearing cart items first."""
    verify_offer_ownership(
        supabase_client=supabase_client,
        offer_id=offer_id,
        seller_id=seller_id,
    )

    offer_id_str = str(offer_id)
    try:
        supabase_client.table("cart_items").delete().eq("seller_product_id", offer_id_str).execute()
        supabase_client.table("seller_products").delete().eq("id", offer_id_str).execute()
    except Exception as exc:
        logger.error(f"Failed to delete offer: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to delete offer.",
                }
            },
        ) from exc

    return MerchantOfferDeleteResponse(
        message="Offer successfully deleted",
        id=UUID(offer_id_str),
    )

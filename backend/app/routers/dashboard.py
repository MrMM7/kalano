from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.dashboard import (
    MerchantOfferCreateRequest,
    MerchantOfferItemResponse,
    MerchantOfferResponse,
    MerchantProductCreateResponse,
)
from app.services.dashboard_service import (
    create_merchant_offer,
    create_product_and_offer,
    get_merchant_offers,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get(
    "/offers",
    response_model=list[MerchantOfferItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve merchant product offers",
    description=(
        "Returns all product listings and inventory offers created by the authenticated merchant, "
        "joined with catalog product information. Only accessible by users with the merchant role."
    ),
    responses={
        200: {
            "model": list[MerchantOfferItemResponse],
            "description": "Successfully retrieved merchant offers.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the merchant role.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def list_merchant_offers(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> list[MerchantOfferItemResponse]:
    if current_user.user_role != "merchant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only merchants can view their product offers.",
                }
            },
        )

    return get_merchant_offers(
        supabase_client=supabase_client,
        seller_id=current_user.id,
    )


@router.post(
    "/offers",
    response_model=MerchantOfferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add merchant offer to an existing product",
    description=(
        "Creates a new seller product offer linking the authenticated merchant to an existing "
        "catalog product. Rejects duplicate offers by the same seller for the same product. "
        "Only accessible by users with the merchant role."
    ),
    responses={
        201: {
            "model": MerchantOfferResponse,
            "description": "Successfully created merchant offer.",
        },
        400: {
            "description": "Input validation failure.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the merchant role.",
        },
        404: {
            "description": "Specified product_id does not exist in the catalog.",
        },
        409: {
            "description": "Duplicate offer: merchant already has an offer for this product.",
        },
        422: {
            "description": "Validation error: invalid request payload.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def add_merchant_offer(
    payload: MerchantOfferCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> MerchantOfferResponse:
    if current_user.user_role != "merchant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only merchants can create product offers.",
                }
            },
        )

    return create_merchant_offer(
        supabase_client=supabase_client,
        seller_id=current_user.id,
        payload=payload,
    )


@router.post(
    "/products",
    response_model=MerchantProductCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new product and initial seller offer",
    description=(
        "Accepts multipart form data to create a new catalog product, optionally uploads an "
        "image to Supabase Storage, and attaches an initial seller offer owned by the "
        "authenticated merchant. Only accessible by users with the merchant role."
    ),
    responses={
        201: {
            "model": MerchantProductCreateResponse,
            "description": "Successfully created catalog product and merchant offer.",
        },
        400: {
            "description": "Image upload failed or invalid file format.",
        },
        401: {
            "description": "Authentication credentials missing or invalid.",
        },
        403: {
            "description": "Forbidden: user does not have the merchant role.",
        },
        422: {
            "description": "Validation error: invalid request fields.",
        },
        500: {
            "description": "Internal server error.",
        },
    },
)
def create_merchant_product(
    name: str = Form(..., description="Product title / name"),
    description: str = Form(..., description="Detailed description of the product"),
    brand: str = Form(..., description="Brand or manufacturer of the product"),
    price: float = Form(..., gt=0, description="Unit price set by the merchant (strictly > 0)"),
    stock: int = Form(..., ge=0, description="Available inventory stock count (>= 0)"),
    estimated_delivery_days: int | None = Form(
        default=None,
        ge=1,
        description="Estimated transit/delivery time in days (>= 1)",
    ),
    image: UploadFile | None = File(
        default=None,
        description="Optional product image file to upload",
    ),
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
) -> MerchantProductCreateResponse:
    if current_user.user_role != "merchant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only merchants can create products and offers.",
                }
            },
        )

    # Validate non-empty strings
    if not name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Product name cannot be empty.",
                }
            },
        )
    if not description.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Product description cannot be empty.",
                }
            },
        )
    if not brand.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Product brand cannot be empty.",
                }
            },
        )

    return create_product_and_offer(
        supabase_client=supabase_client,
        seller_id=current_user.id,
        name=name.strip(),
        description=description.strip(),
        brand=brand.strip(),
        price=price,
        stock=stock,
        estimated_delivery_days=estimated_delivery_days,
        image_file=image,
    )

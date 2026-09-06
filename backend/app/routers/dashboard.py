from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.models.dashboard import (
    MerchantOfferCreateRequest,
    MerchantOfferItemResponse,
    MerchantOfferResponse,
)
from app.services.dashboard_service import (
    create_merchant_offer,
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

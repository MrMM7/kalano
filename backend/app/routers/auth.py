from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from supabase import Client

from app.dependencies.database import get_supabase_client
from app.models.auth import ErrorDetail, ErrorResponse, UserRegisterRequest, UserResponse
from app.services.auth_service import DuplicateEmailError, register_user

router = APIRouter(prefix="/api/v1", tags=["Auth"])


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Registers a new user account with either 'buyer' or 'merchant' role. "
        "Hashes password with argon2, persists user in Supabase, and returns "
        "the public user profile excluding sensitive password hash data."
    ),
    responses={
        201: {
            "model": UserResponse,
            "description": "User successfully created.",
        },
        409: {
            "model": ErrorResponse,
            "description": "Email address already in use.",
        },
        422: {
            "description": "Validation error in request payload.",
        },
    },
)
def register(
    payload: UserRegisterRequest,
    supabase_client: Client = Depends(get_supabase_client),
) -> UserResponse | JSONResponse:
    try:
        return register_user(payload=payload, supabase_client=supabase_client)
    except DuplicateEmailError as exc:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=ErrorResponse(
                error=ErrorDetail(
                    code="DUPLICATE_EMAIL",
                    message=str(exc),
                )
            ).model_dump(),
        )

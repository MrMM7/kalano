from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from supabase import Client

from app.dependencies.config import settings
from app.dependencies.database import get_supabase_client
from app.models.auth import (
    ErrorDetail,
    ErrorResponse,
    LoginResponse,
    TokenClaims,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    DuplicateEmailError,
    authenticate_user,
    register_user,
)
from app.utils.jwt import create_access_token

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


@router.post(
    "/auth/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Log in user",
    description=(
        "Authenticates a user by email and password, generates a signed JWT token, "
        "sets an httpOnly cookie ('kalano_token'), and returns the token and public profile."
    ),
    responses={
        200: {
            "model": LoginResponse,
            "description": "User successfully authenticated.",
        },
        401: {
            "model": ErrorResponse,
            "description": "Invalid credentials (wrong password or non-existent email).",
        },
        422: {
            "description": "Validation error in request payload.",
        },
    },
)
def login(
    payload: UserLoginRequest,
    response: Response,
    supabase_client: Client = Depends(get_supabase_client),
) -> LoginResponse | JSONResponse:
    user = authenticate_user(
        email=payload.email,
        password=payload.password,
        supabase_client=supabase_client,
    )

    if not user:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=ErrorResponse(
                error=ErrorDetail(
                    code="INVALID_CREDENTIALS",
                    message="Invalid email or password.",
                )
            ).model_dump(),
        )

    # Prepare token claims
    token_claims = TokenClaims(
        user_id=user.id,
        user_role=user.user_role,
    )
    access_token = create_access_token(claims=token_claims)

    # Set httpOnly cookie
    response.set_cookie(
        key="kalano_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.jwt_expiration_minutes * 60,
        path="/",
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user.to_response(),
    )

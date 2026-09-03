from fastapi import Depends, HTTPException, Request, status
from supabase import Client

from app.dependencies.database import get_supabase_client
from app.models.auth import AuthenticatedUser
from app.utils.jwt import decode_access_token


async def get_current_user(
    request: Request,
    supabase_client: Client = Depends(get_supabase_client),
) -> AuthenticatedUser:
    """FastAPI dependency to extract and authenticate the current user.

    1. Checks the 'kalano_token' httpOnly cookie first.
    2. Falls back to 'Authorization: Bearer <token>' header if cookie is absent.
    3. Decodes and verifies the JWT token.
    4. Fetches the user record from the Supabase 'users' table.
    5. Returns the AuthenticatedUser model instance.

    Raises:
        HTTPException(401): If token is missing (MISSING_TOKEN), invalid/expired (INVALID_TOKEN),
                            or if user no longer exists in the database (USER_NOT_FOUND).
    """
    # 1. Check httpOnly cookie first
    token = request.cookies.get("kalano_token")

    # 2. Fall back to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    # 3. No token provided
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "MISSING_TOKEN",
                    "message": "Authentication required.",
                }
            },
        )

    # 4. Decode and verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Token is invalid or expired.",
                }
            },
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Token is invalid or expired.",
                }
            },
        )

    # 5. Fetch user from Supabase
    result = supabase_client.table("users").select("*").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "User no longer exists.",
                }
            },
        )

    return AuthenticatedUser(**result.data[0])

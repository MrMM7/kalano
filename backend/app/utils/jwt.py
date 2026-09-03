from datetime import datetime, timedelta, timezone

from jose import jwt

from app.dependencies.config import settings
from app.models.auth import TokenClaims


def create_access_token(
    claims: TokenClaims | dict,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token.

    Args:
        claims: The JWT payload claims (e.g. user_id, user_role) to encode.
        expires_delta: Optional custom duration before expiration. Defaults to
            settings.jwt_expiration_minutes.

    Returns:
        Signed JWT string.
    """
    if isinstance(claims, TokenClaims):
        payload = claims.model_dump(exclude_none=True, mode="json")
    else:
        payload = claims.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)

    payload["exp"] = expire
    encoded_jwt = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt

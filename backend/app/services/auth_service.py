import logging

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from supabase import Client

from app.models.auth import AuthenticatedUser, UserRegisterRequest, UserResponse

logger = logging.getLogger(__name__)

ph = PasswordHasher()


class DuplicateEmailError(Exception):
    """Raised when a user registration attempts to use an already registered email."""

    pass


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2."""
    return ph.hash(password)


def register_user(payload: UserRegisterRequest, supabase_client: Client) -> UserResponse:
    """Register a new user in Supabase.

    Hashes password with Argon2 and inserts record into the 'users' table.
    NOTE: 'id' and 'created_at' are handled automatically by Supabase defaults;
    the backend must not supply them.
    """
    password_hash = hash_password(payload.password)

    user_data = {
        "email": payload.email,
        "password_hash": password_hash,
        "display_name": payload.display_name,
        "user_role": payload.user_role,
        "address": None,
    }

    try:
        response = supabase_client.table("users").insert(user_data).execute()
        if not response.data:
            raise RuntimeError("Failed to insert user record into database.")
        created_record = response.data[0]
        return UserResponse(**created_record)
    except Exception as exc:
        error_str = str(exc)
        code = getattr(exc, "code", None)
        if code == "23505" or "23505" in error_str or "duplicate key" in error_str.lower():
            raise DuplicateEmailError("A user with this email address already exists.") from exc
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2 hash string."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def authenticate_user(
    email: str,
    password: str,
    supabase_client: Client,
) -> AuthenticatedUser | None:
    """Looks up user by normalized email and verifies their password.

    Returns the AuthenticatedUser model if authentication succeeds, otherwise None.
    """
    normalized_email = email.strip().lower()
    response = supabase_client.table("users").select("*").eq("email", normalized_email).execute()

    if not response.data:
        return None

    user_record = response.data[0]
    stored_hash = user_record.get("password_hash")
    if not stored_hash or not verify_password(password, stored_hash):
        return None

    return AuthenticatedUser(**user_record)

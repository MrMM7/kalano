import logging

from argon2 import PasswordHasher
from supabase import Client

from app.models.auth import UserRegisterRequest, UserResponse

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

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from jose import jwt

from app.dependencies.config import settings
from app.dependencies.database import get_supabase_client
from app.main import app

ph = PasswordHasher()


def test_login_success(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    raw_password = "correctpassword123"
    hashed = ph.hash(raw_password)

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "buyer@example.com",
        "display_name": "Jane Doe",
        "user_role": "buyer",
        "address": None,
        "password_hash": hashed,
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "buyer@example.com",
            "password": raw_password,
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str) and len(data["access_token"]) > 0
        assert data["token_type"] == "bearer"
        assert "user" in data

        user = data["user"]
        assert user["id"] == user_id
        assert user["email"] == "buyer@example.com"
        assert user["display_name"] == "Jane Doe"
        assert user["user_role"] == "buyer"
        assert "password_hash" not in user
        assert "password" not in user

        # Verify cookie is set
        assert "kalano_token" in response.cookies
        assert response.cookies["kalano_token"] == data["access_token"]
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_cookie_attributes(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    raw_password = "correctpassword123"
    hashed = ph.hash(raw_password)

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "buyer@example.com",
        "display_name": "Jane Doe",
        "user_role": "buyer",
        "address": None,
        "password_hash": hashed,
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "buyer@example.com",
            "password": raw_password,
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200

        set_cookie = response.headers.get("set-cookie")
        assert set_cookie is not None
        assert "kalano_token=" in set_cookie
        assert "httponly" in set_cookie.lower()
        assert "samesite=lax" in set_cookie.lower()
        assert "path=/" in set_cookie.lower()
        assert f"max-age={settings.jwt_expiration_minutes * 60}" in set_cookie.lower()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_jwt_claims(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    raw_password = "correctpassword123"
    hashed = ph.hash(raw_password)

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "merchant@example.com",
        "display_name": "Seller Shop",
        "user_role": "merchant",
        "address": "123 Market St",
        "password_hash": hashed,
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "merchant@example.com",
            "password": raw_password,
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200

        token = response.json()["access_token"]
        claims = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

        assert claims["user_id"] == user_id
        assert claims["user_role"] == "merchant"
        assert "exp" in claims
        assert claims["exp"] > datetime.now(timezone.utc).timestamp()
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_wrong_password(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    raw_password = "correctpassword123"
    hashed = ph.hash(raw_password)

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "buyer@example.com",
        "display_name": "Jane Doe",
        "user_role": "buyer",
        "address": None,
        "password_hash": hashed,
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "buyer@example.com",
            "password": "wrongpassword123",
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

        data = response.json()
        assert data == {
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password.",
            }
        }
        assert "kalano_token" not in response.cookies
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_nonexistent_user(client: TestClient):
    mock_supabase = MagicMock()
    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "nonexistent@example.com",
            "password": "somepassword123",
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

        data = response.json()
        assert data == {
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password.",
            }
        }
        assert "kalano_token" not in response.cookies
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_email_normalization(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    raw_password = "correctpassword123"
    hashed = ph.hash(raw_password)

    queried_emails = []

    mock_builder = MagicMock()

    def mock_eq(col, val):
        if col == "email":
            queried_emails.append(val)
        eq_mock = MagicMock()
        eq_mock.execute.return_value = MagicMock(
            data=[
                {
                    "id": user_id,
                    "created_at": created_at,
                    "email": "buyer@example.com",
                    "display_name": "Jane Doe",
                    "user_role": "buyer",
                    "address": None,
                    "password_hash": hashed,
                }
            ]
        )
        return eq_mock

    mock_builder.select.return_value.eq.side_effect = mock_eq
    mock_supabase.table.return_value = mock_builder
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "  Buyer@Example.COM  ",
            "password": raw_password,
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        assert "buyer@example.com" in queried_emails
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_login_missing_email(client: TestClient):
    payload = {
        "password": "password123",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 422
    assert "kalano_token" not in response.cookies


def test_login_missing_password(client: TestClient):
    payload = {
        "email": "buyer@example.com",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 422
    assert "kalano_token" not in response.cookies

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from jose import jwt

from app.dependencies.config import settings
from app.dependencies.database import get_supabase_client
from app.main import app
from app.utils.jwt import create_access_token


def test_me_with_valid_cookie_token(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "buyer@example.com",
        "display_name": "Jane Doe",
        "user_role": "buyer",
        "address": None,
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$somehash",
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        token = create_access_token({"user_id": user_id, "user_role": "buyer"})
        response = client.get("/api/v1/auth/me", cookies={"kalano_token": token})

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == "buyer@example.com"
        assert data["display_name"] == "Jane Doe"
        assert data["user_role"] == "buyer"
        assert data["address"] is None
        assert "created_at" in data
        assert "password_hash" not in data
        assert "password" not in data
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_me_with_valid_bearer_token(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    mock_record = {
        "id": user_id,
        "created_at": created_at,
        "email": "merchant@example.com",
        "display_name": "Merchant Jane",
        "user_role": "merchant",
        "address": "123 Market St",
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$somehash",
    }

    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[mock_record])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        token = create_access_token({"user_id": user_id, "user_role": "merchant"})
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == "merchant@example.com"
        assert data["display_name"] == "Merchant Jane"
        assert data["user_role"] == "merchant"
        assert data["address"] == "123 Market St"
        assert "password_hash" not in data
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_me_cookie_precedence(client: TestClient):
    mock_supabase = MagicMock()
    cookie_user_id = str(uuid.uuid4())
    header_user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    cookie_record = {
        "id": cookie_user_id,
        "created_at": created_at,
        "email": "cookie@example.com",
        "display_name": "Cookie User",
        "user_role": "buyer",
        "address": None,
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$somehash",
    }

    def mock_eq(col, val):
        eq_mock = MagicMock()
        if val == cookie_user_id:
            eq_mock.execute.return_value = MagicMock(data=[cookie_record])
        else:
            eq_mock.execute.return_value = MagicMock(data=[])
        return eq_mock

    mock_supabase.table.return_value.select.return_value.eq.side_effect = mock_eq
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        cookie_token = create_access_token({"user_id": cookie_user_id, "user_role": "buyer"})
        header_token = create_access_token({"user_id": header_user_id, "user_role": "merchant"})

        response = client.get(
            "/api/v1/auth/me",
            cookies={"kalano_token": cookie_token},
            headers={"Authorization": f"Bearer {header_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == cookie_user_id
        assert data["email"] == "cookie@example.com"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_me_no_token(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "MISSING_TOKEN",
            "message": "Authentication required.",
        }
    }


def test_me_expired_token(client: TestClient):
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    token = jwt.encode(
        {"user_id": "test-uuid", "exp": expired_time},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = client.get("/api/v1/auth/me", cookies={"kalano_token": token})
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "INVALID_TOKEN",
            "message": "Token is invalid or expired.",
        }
    }


def test_me_invalid_token_string(client: TestClient):
    response = client.get("/api/v1/auth/me", cookies={"kalano_token": "not-a-valid-jwt"})
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "INVALID_TOKEN",
            "message": "Token is invalid or expired.",
        }
    }


def test_me_invalid_signature(client: TestClient):
    wrong_secret = "wrong-secret-key-that-is-at-least-32-chars-long"
    token = jwt.encode(
        {"user_id": "test-uuid", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        wrong_secret,
        algorithm=settings.jwt_algorithm,
    )

    response = client.get("/api/v1/auth/me", cookies={"kalano_token": token})
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "INVALID_TOKEN",
            "message": "Token is invalid or expired.",
        }
    }


def test_me_token_missing_user_id(client: TestClient):
    token = create_access_token({"user_role": "buyer"})
    response = client.get("/api/v1/auth/me", cookies={"kalano_token": token})
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "INVALID_TOKEN",
            "message": "Token is invalid or expired.",
        }
    }


def test_me_user_not_found(client: TestClient):
    mock_supabase = MagicMock()
    mock_exec = mock_supabase.table.return_value.select.return_value.eq.return_value.execute
    mock_exec.return_value = MagicMock(data=[])
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        token = create_access_token({"user_id": "nonexistent-user-id", "user_role": "buyer"})
        response = client.get("/api/v1/auth/me", cookies={"kalano_token": token})

        assert response.status_code == 401
        assert response.json() == {
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User no longer exists.",
            }
        }
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_me_malformed_auth_header(client: TestClient):
    response1 = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Token some-token"},
    )
    assert response1.status_code == 401
    assert response1.json() == {
        "error": {
            "code": "MISSING_TOKEN",
            "message": "Authentication required.",
        }
    }

    response2 = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer "},
    )
    assert response2.status_code == 401
    assert response2.json() == {
        "error": {
            "code": "MISSING_TOKEN",
            "message": "Authentication required.",
        }
    }

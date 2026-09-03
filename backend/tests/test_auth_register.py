import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

from app.dependencies.database import get_supabase_client
from app.main import app
from app.services.auth_service import hash_password


def test_argon2_password_hashing():
    raw_password = "supersecretpassword123"
    hashed = hash_password(raw_password)
    assert hashed.startswith("$argon2")
    ph = PasswordHasher()
    assert ph.verify(hashed, raw_password) is True


def test_register_buyer_success(client: TestClient):
    inserted_payloads = []

    def mock_table(table_name: str):
        assert table_name == "users"
        mock_builder = MagicMock()

        def mock_insert(data):
            inserted_payloads.append(data)
            insert_result = MagicMock()
            user_id = str(uuid.uuid4())
            created_at = datetime.now(timezone.utc).isoformat()
            returned_record = {
                "id": user_id,
                "created_at": created_at,
                "email": data["email"],
                "display_name": data["display_name"],
                "user_role": data["user_role"],
                "address": data.get("address"),
            }
            insert_result.execute.return_value = MagicMock(data=[returned_record])
            return insert_result

        mock_builder.insert.side_effect = mock_insert
        return mock_builder

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = mock_table
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": " Buyer@Example.com ",
            "password": "validpassword123",
            "display_name": "  Jane Doe  ",
            "user_role": "buyer",
        }

        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert uuid.UUID(data["id"])
        assert data["email"] == "buyer@example.com"
        assert data["display_name"] == "Jane Doe"
        assert data["user_role"] == "buyer"
        assert data["address"] is None
        assert "password" not in data
        assert "password_hash" not in data

        # Verify that 'id' and 'created_at' were NOT passed in the insert dictionary
        assert len(inserted_payloads) == 1
        inserted_record = inserted_payloads[0]
        assert "id" not in inserted_record
        assert "created_at" not in inserted_record
        assert inserted_record["email"] == "buyer@example.com"
        assert inserted_record["display_name"] == "Jane Doe"
        assert inserted_record["user_role"] == "buyer"
        assert inserted_record["address"] is None
        assert inserted_record["password_hash"].startswith("$argon2")
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_register_merchant_success(client: TestClient):
    mock_supabase = MagicMock()
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[
            {
                "id": user_id,
                "created_at": created_at,
                "email": "merchant@example.com",
                "display_name": "Best Store",
                "user_role": "merchant",
                "address": None,
            }
        ]
    )
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "merchant@example.com",
            "password": "validpassword123",
            "display_name": "Best Store",
            "user_role": "merchant",
        }

        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["user_role"] == "merchant"
        assert data["email"] == "merchant@example.com"
        assert data["display_name"] == "Best Store"
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_register_duplicate_email(client: TestClient):
    mock_supabase = MagicMock()
    # Mock Postgres 23505 unique violation error
    err_msg = (
        '{"code": "23505", "message": "duplicate key value violates unique constraint '
        '\\"users_email_key\\""}'
    )
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception(err_msg)
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        payload = {
            "email": "duplicate@example.com",
            "password": "validpassword123",
            "display_name": "Duplicate User",
            "user_role": "buyer",
        }

        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409
        data = response.json()
        assert data == {
            "error": {
                "code": "DUPLICATE_EMAIL",
                "message": "A user with this email address already exists.",
            }
        }
    finally:
        app.dependency_overrides.pop(get_supabase_client, None)


def test_register_missing_email(client: TestClient):
    payload = {
        "password": "validpassword123",
        "display_name": "No Email User",
        "user_role": "buyer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_invalid_email_format(client: TestClient):
    payload = {
        "email": "not-an-email",
        "password": "validpassword123",
        "display_name": "Bad Email User",
        "user_role": "buyer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_short_password(client: TestClient):
    payload = {
        "email": "user@example.com",
        "password": "short",
        "display_name": "Short Password User",
        "user_role": "buyer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_missing_password(client: TestClient):
    payload = {
        "email": "user@example.com",
        "display_name": "No Password User",
        "user_role": "buyer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_empty_display_name(client: TestClient):
    payload = {
        "email": "user@example.com",
        "password": "validpassword123",
        "display_name": "   ",
        "user_role": "buyer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_invalid_role(client: TestClient):
    payload = {
        "email": "user@example.com",
        "password": "validpassword123",
        "display_name": "Logistics User",
        "user_role": "logistics",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

    payload["user_role"] = "admin"
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

from fastapi.testclient import TestClient


def test_logout_clears_cookie(client: TestClient):
    """Test that POST /api/v1/auth/logout deletes the kalano_token cookie."""
    client.cookies.set("kalano_token", "dummy_token_value")

    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Logged out successfully"

    set_cookie = response.headers.get("set-cookie")
    assert set_cookie is not None
    assert "kalano_token=" in set_cookie
    assert "max-age=0" in set_cookie.lower() or "expires=thu, 01 jan 1970" in set_cookie.lower()
    assert "path=/" in set_cookie.lower()
    assert "httponly" in set_cookie.lower()


def test_logout_when_not_logged_in(client: TestClient):
    """Test that POST /api/v1/auth/logout succeeds even without active cookie."""
    client.cookies.clear()

    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Logged out successfully"

    set_cookie = response.headers.get("set-cookie")
    assert set_cookie is not None
    assert "kalano_token=" in set_cookie

from unittest.mock import MagicMock


def test_health_status_code_200(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_response_structure(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_health_connected_mock(client, monkeypatch):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = (
        MagicMock()
    )
    monkeypatch.setattr("app.routers.health.get_supabase_client", lambda: mock_supabase)
    monkeypatch.setattr("app.dependencies.database.get_supabase_client", lambda: mock_supabase)

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["error"] is None


def test_health_disconnected_mock(client, monkeypatch):
    def mock_get_supabase_client():
        raise Exception("Connection refused")

    monkeypatch.setattr("app.routers.health.get_supabase_client", mock_get_supabase_client)
    monkeypatch.setattr("app.dependencies.database.get_supabase_client", mock_get_supabase_client)

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"] == "disconnected"
    assert "Connection refused" in data["error"]

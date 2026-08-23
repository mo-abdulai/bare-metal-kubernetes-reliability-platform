from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_platform_status_returns_configured_metadata() -> None:
    response = client.get("/api/status")
    body = response.json()

    assert response.status_code == 200
    assert body["platform"]["name"] == "Bare-Metal Kubernetes Reliability & Operations Platform"
    assert body["platform"]["environment"] == "local"
    assert body["platform"]["orchestrator"] == "K3s"
    assert body["platform"]["architecture"] == "ARM64"
    assert body["service"]["name"] == "opspulse-api"
    assert body["service"]["version"] == "0.1.0"
    assert body["service"]["status"] == "operational"

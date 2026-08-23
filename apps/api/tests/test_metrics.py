from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_prometheus_metrics_endpoint_exposes_request_counter() -> None:
    client.get("/health")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "opspulse_api_http_requests_total" in response.text


def test_metrics_summary_returns_safe_unavailable_response(monkeypatch) -> None:
    monkeypatch.setenv("PROMETHEUS_URL", "http://127.0.0.1:1")

    response = client.get("/api/metrics/summary")

    assert response.status_code == 503
    assert response.json() == {"detail": "Metrics service is currently unavailable."}

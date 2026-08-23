from fastapi.testclient import TestClient

from app.main import app
from app.schemas.logs import RecentLogsResponse

client = TestClient(app)


class FakeLokiClient:
    def query_recent_operational_logs(self, limit: int = 20) -> RecentLogsResponse:
        return RecentLogsResponse(status="ok", entries=[])


def test_recent_logs_returns_bounded_summary(monkeypatch) -> None:
    monkeypatch.setattr("app.routes.logs.LokiClient", FakeLokiClient)

    response = client.get("/api/logs/recent?limit=20")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "entries": []}


def test_recent_logs_rejects_unbounded_limit() -> None:
    response = client.get("/api/logs/recent?limit=1000")

    assert response.status_code == 422


def test_recent_logs_returns_safe_unavailable_response(monkeypatch) -> None:
    class UnavailableLokiClient:
        def query_recent_operational_logs(self, limit: int = 20) -> RecentLogsResponse:
            from app.loki_client import LokiUnavailableError

            raise LokiUnavailableError("failed")

    monkeypatch.setattr("app.routes.logs.LokiClient", UnavailableLokiClient)

    response = client.get("/api/logs/recent")

    assert response.status_code == 503
    assert response.json() == {"detail": "Logs service is currently unavailable."}


def test_recent_events_returns_safe_unavailable_response(monkeypatch) -> None:
    from app.kubernetes_client import KubernetesUnavailableError

    def unavailable_events(limit: int = 10):
        raise KubernetesUnavailableError("failed")

    monkeypatch.setattr("app.routes.logs.get_recent_kubernetes_events", unavailable_events)

    response = client.get("/api/events/recent")

    assert response.status_code == 503
    assert response.json() == {"detail": "Kubernetes events are currently unavailable."}

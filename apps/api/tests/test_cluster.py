from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_cluster_inventory_returns_safe_unavailable_response_without_kubernetes(monkeypatch) -> None:
    monkeypatch.delenv("OPSPULSE_KUBECTL", raising=False)
    monkeypatch.delenv("KUBERNETES_SERVICE_HOST", raising=False)

    response = client.get("/api/cluster/inventory")

    assert response.status_code == 503
    assert response.json() == {"detail": "Kubernetes inventory is unavailable."}

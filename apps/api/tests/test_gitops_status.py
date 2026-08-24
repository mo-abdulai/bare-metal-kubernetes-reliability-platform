from fastapi.testclient import TestClient

import app.routes.gitops as gitops_route
from app.gitops_status import GitOpsUnavailableError, get_gitops_status
from app.main import app

client = TestClient(app)


def test_gitops_status_parses_argocd_application_fields(monkeypatch) -> None:
    class FakeKubernetesClient:
        def get_json(self, path: str) -> dict:
            assert path == "/apis/argoproj.io/v1alpha1/namespaces/argocd/applications"
            return {
                "items": [
                    {
                        "metadata": {"name": "opspulse"},
                        "spec": {
                            "destination": {"namespace": "opspulse"},
                            "source": {"targetRevision": "main"},
                        },
                        "status": {
                            "sync": {"status": "Synced", "revision": "abc123"},
                            "health": {"status": "Healthy"},
                            "operationState": {"phase": "Succeeded"},
                            "reconciledAt": "2026-08-24T00:00:00Z",
                            "summary": {"images": ["nurud43/opspulse-web:v0.1.5"]},
                        },
                    }
                ]
            }

    monkeypatch.setattr("app.gitops_status.KubernetesClient", FakeKubernetesClient)

    response = get_gitops_status()

    assert response.status == "ok"
    assert response.applications[0].name == "opspulse"
    assert response.applications[0].sync_status == "Synced"
    assert response.applications[0].health_status == "Healthy"
    assert response.applications[0].revision == "abc123"
    assert response.applications[0].target_revision == "main"
    assert response.applications[0].destination_namespace == "opspulse"
    assert response.applications[0].last_operation_phase == "Succeeded"
    assert response.applications[0].current_images == ["nurud43/opspulse-web:v0.1.5"]


def test_gitops_status_endpoint_returns_safe_unavailable_response(monkeypatch) -> None:
    monkeypatch.setattr(gitops_route, "get_gitops_status", lambda: (_ for _ in ()).throw(GitOpsUnavailableError()))

    response = client.get("/api/gitops/status")

    assert response.status_code == 503
    assert response.json() == {"detail": "GitOps status is unavailable."}

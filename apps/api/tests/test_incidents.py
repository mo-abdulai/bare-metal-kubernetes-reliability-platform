from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.incidents import Signal

client = TestClient(app)


def _incident_directory(tmp_path: Path) -> Path:
    directory = tmp_path / "incidents"
    directory.mkdir()
    return directory


def test_incident_lifecycle_persists_files(monkeypatch, tmp_path: Path) -> None:
    directory = _incident_directory(tmp_path)
    signal = Signal(
        id="sig-1",
        timestamp="2026-08-23T12:00:00+00:00",
        source="kubernetes",
        severity_hint="SEV-3",
        component="opspulse-api",
        title="BackOff: Pod/opspulse-api",
        message="Container is restarting.",
        metadata={"namespace": "opspulse", "pod": "opspulse-api-123"},
    )

    monkeypatch.setattr("app.incident_store.incident_dir", lambda: directory)
    monkeypatch.setattr("app.routes.incidents.signals_by_ids", lambda signal_ids, candidate_id=None: [signal])

    assert client.get("/api/incidents").json() == []

    create_response = client.post(
        "/api/incidents",
        json={
            "title": "API pod restart loop",
            "severity": "SEV-3",
            "component": "opspulse-api",
            "summary": "The API pod is repeatedly restarting.",
            "runbook_id": "crashloopbackoff",
            "signal_ids": ["sig-1"],
            "candidate_id": "CAND-test",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == "INC-001"
    assert created["status"] == "Open"
    assert created["source"] == "candidate"
    assert created["signals"][0]["id"] == "sig-1"
    assert (directory / "INC-001.json").exists()

    detail_response = client.get("/api/incidents/INC-001")
    assert detail_response.status_code == 200
    assert detail_response.json()["title"] == "API pod restart loop"

    patch_response = client.patch("/api/incidents/INC-001", json={"status": "Investigating"})
    assert patch_response.status_code == 200
    patched = patch_response.json()
    assert patched["status"] == "Investigating"
    assert patched["timeline"][-1]["event_type"] == "status"

    timeline_response = client.post("/api/incidents/INC-001/timeline", json={"event_type": "note", "message": "Checked recent pod logs."})
    assert timeline_response.status_code == 200
    assert timeline_response.json()["timeline"][-1]["message"] == "Checked recent pod logs."

    resolve_response = client.post(
        "/api/incidents/INC-001/resolve",
        json={
            "summary": "Restart loop resolved after config correction.",
            "root_cause": "Invalid environment variable.",
            "remediation": "Redeployed the API with the corrected config.",
            "prevention": "Add deployment config validation.",
        },
    )
    assert resolve_response.status_code == 200
    resolved = resolve_response.json()
    assert resolved["status"] == "Resolved"
    assert resolved["resolved_at"] is not None
    assert resolved["resolution"]["root_cause"] == "Invalid environment variable."


def test_incident_missing_returns_404(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr("app.incident_store.incident_dir", lambda: _incident_directory(tmp_path))

    response = client.get("/api/incidents/INC-404")

    assert response.status_code == 404


def test_runbooks_are_exposed() -> None:
    response = client.get("/api/runbooks")

    assert response.status_code == 200
    runbook_ids = {item["id"] for item in response.json()}
    assert "crashloopbackoff" in runbook_ids
    assert "node-not-ready" in runbook_ids

    detail_response = client.get("/api/runbooks/crashloopbackoff")
    assert detail_response.status_code == 200
    assert "Diagnostic Commands" in detail_response.json()["content"]

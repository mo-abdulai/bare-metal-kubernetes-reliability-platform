# Incident Response

Phase 8 adds a lightweight incident-response workflow to OpsPulse. It keeps raw operational evidence separate from recorded incidents, then lets an operator review, promote, investigate, and resolve an incident without introducing a database or notification system.

## Core Model

Signals are raw operational evidence collected from the platform:

- Prometheus and Alertmanager active alerts.
- Kubernetes warning events.
- Loki operational log entries.
- Workload state derived from metrics, such as unavailable deployments and pod restarts.

Incidents are manually promoted records created after triage. A signal is not an incident until an operator reviews it and promotes it.

## Lifecycle

Incidents use this lifecycle:

- `Open`: the incident has been recorded.
- `Investigating`: an operator is actively diagnosing the issue.
- `Mitigated`: immediate user or system impact has been reduced.
- `Monitoring`: the fix is in place and the platform is being watched for recurrence.
- `Resolved`: the incident has a resolution summary and close-out details.

Each incident stores a timeline. Status changes, notes, and resolution entries are appended as structured timeline events.

## Severity

Severities are intentionally simple:

- `SEV-1`: major platform outage or critical control-plane failure.
- `SEV-2`: meaningful service degradation or node/workload availability issue.
- `SEV-3`: localized workload issue, crash loop, warning event, or actionable degradation.
- `SEV-4`: low-impact signal or informational operational anomaly.

The candidate severity is suggested from source data and text heuristics. The operator chooses the final incident severity during promotion.

## Correlation

Signals are grouped deterministically by stable metadata:

- pod
- deployment
- node
- service
- object name
- namespace
- component fallback

The backend generates incident candidates from those groups. Candidates do not persist. They are a triage aid only.

## Promotion

Promotion happens from `/incidents/promote`.

The operator reviews a candidate, selects the relevant signals, adjusts title/component/severity/runbook, and submits the form. The API writes a JSON incident record under `data/incidents` using IDs such as `INC-001`.

## Runbooks

Runbooks live as Markdown files under `runbooks/`. The API exposes summaries and detail content through:

- `GET /api/runbooks`
- `GET /api/runbooks/{runbook_id}`

Candidates and incidents may reference a runbook by ID. The frontend links those incidents to the matching runbook detail page.

## API Surface

- `GET /api/alerts/active`
- `GET /api/signals/recent`
- `GET /api/incidents/candidates`
- `GET /api/incidents`
- `GET /api/incidents/{incident_id}`
- `POST /api/incidents`
- `PATCH /api/incidents/{incident_id}`
- `POST /api/incidents/{incident_id}/timeline`
- `POST /api/incidents/{incident_id}/resolve`
- `GET /api/runbooks`
- `GET /api/runbooks/{runbook_id}`

## Architecture

```text
Alertmanager ----\
Prometheus -------\
Kubernetes Events ---> signal aggregation ---> deterministic candidates ---> manual promotion ---> JSON incident records
Loki -------------/                                  |
Workload Metrics -/                                  v
                                               Markdown runbooks
```

## Persistence Notes

The incident store is filesystem-backed and repo-shaped. Local development writes to `data/incidents`. The container image includes `data/` and `runbooks/` so the same paths exist in Kubernetes. A future production hardening step should add a shared persistent volume or external store if multiple API replicas need to write durable incident records across pod restarts.

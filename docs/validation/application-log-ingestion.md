# TEST-008 — Application Log Ingestion

## Objective

Generate one controlled application log event and verify it flows from FastAPI or Next.js through Alloy into Loki, Grafana, and OpsPulse summaries where applicable.

## Procedure

1. Call an endpoint that emits a controlled upstream failure log, such as temporarily querying logs before Loki is ready:

```bash
curl -i http://<opspulse-web-nodeport-or-api-port>/api/logs/recent
```

2. Confirm FastAPI emitted a warning without exposing credentials:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl logs -n opspulse deploy/opspulse-api --tail=100
```

3. Query Loki:

```logql
{namespace="opspulse", app="opspulse-api"} |~ "(?i)(Loki recent log query failed|error|failed)"
```

4. Confirm Grafana Explore returns the same real log line.

5. Confirm OpsPulse Overview shows `Logs Live` only when `/api/logs/recent` succeeds.

## Evidence

Pending post-deployment validation.

## Result

Pending.

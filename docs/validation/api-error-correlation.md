# TEST-010 — API Error Correlation

## Objective

Create one controlled FastAPI error condition and verify request failure, FastAPI log emission, Prometheus 5xx increment, Loki storage, Grafana visibility, and OpsPulse summary behavior.

## Procedure

1. Port-forward or call OpsPulse API directly.

2. Send a deliberately invalid request that is safe and reversible:

```bash
curl -i 'http://<opspulse-api>/api/logs/recent?limit=1000'
```

The endpoint enforces `limit <= 20`, so this should return a validation error without changing cluster state.

3. Confirm request telemetry:

```promql
sum(rate(opspulse_api_http_requests_total{route="/api/logs/recent", status_code=~"4..|5.."}[5m]))
```

4. Confirm FastAPI logs and Loki ingestion:

```logql
{namespace="opspulse", app="opspulse-api"} |~ "(?i)(validation|failed|error)"
```

5. Confirm Grafana dashboard panels show the related log or request signal.

6. Confirm normal endpoint behavior:

```bash
curl -i 'http://<opspulse-api>/api/logs/recent?limit=10'
```

## Evidence

Pending post-deployment validation.

## Result

Pending.

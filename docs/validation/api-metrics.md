# OpsPulse API Metrics Validation

## Objective

Verify that `opspulse-api` exposes Prometheus-compatible metrics and that Prometheus scrapes them through the ServiceMonitor.

## Procedure

Direct API check:

```bash
kubectl -n opspulse port-forward svc/opspulse-api 8000:8000
curl -s http://localhost:8000/metrics | grep opspulse_api_http_requests_total
```

Prometheus target check:

```promql
up{job="opspulse-api"}
```

Traffic counter check:

```promql
sum(rate(opspulse_api_http_requests_total[5m])) by (status_code)
```

## Evidence

Collected on August 23, 2026 after deploying `nurud43/opspulse-api:v0.1.2`.

Direct `/metrics` output through port-forward included:

```text
opspulse_api_http_requests_total{method="GET",route="/ready",status_code="200"} 29.0
opspulse_api_http_requests_total{method="GET",route="/health",status_code="200"} 22.0
opspulse_api_http_requests_total{method="GET",route="/api/cluster/inventory",status_code="200"} 1.0
opspulse_api_http_request_duration_seconds_bucket{le="0.005",method="GET",route="/ready",status_code="200"} 29.0
```

Prometheus target query:

```text
up{job="opspulse-api"} = 1 for 10.42.0.47:8000
up{job="opspulse-api"} = 1 for 10.42.1.36:8000
```

Traffic query:

```text
sum(rate(opspulse_api_http_requests_total[5m])) by (status_code)
status_code=200 value=0.2370
```

Frontend proxy check:

```json
{
  "status": "connected",
  "api": {
    "up": true,
    "requestRatePerSecond": 0.2,
    "errorRatePerSecond": 0,
    "p95DurationSeconds": 0.01
  }
}
```

## Result

Passed. The API exposes bounded-label Prometheus metrics, Prometheus scrapes both API replicas through the ServiceMonitor, and OpsPulse consumes the summarized metrics through FastAPI and the Next.js server proxy.

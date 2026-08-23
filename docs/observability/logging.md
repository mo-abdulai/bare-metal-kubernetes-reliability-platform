# Centralized Logging

Phase 7 adds centralized logs and event correlation with Loki, Grafana Alloy, Grafana, and OpsPulse API summaries.

```text
Pods / Kubernetes Events
        |
        v
   Grafana Alloy
        |
        v
       Loki
      /    \
     v      v
 Grafana   FastAPI
             |
             v
          OpsPulse
```

## Deployment

- Namespace: `logging`
- Loki chart: `grafana/loki` `7.3.0`
- Alloy chart: `grafana/alloy` `1.11.1`
- Loki mode: `SingleBinary`
- Loki replicas: `1`
- Alloy replicas: `1`
- Storage class: `local-path`
- Loki PVC: `2Gi`
- Retention: `48h`

Preflight inspection on 2026-08-23 showed both nodes Ready. `homepi` had about `572m` CPU used and `2815Mi` memory used. `workpi` had about `153m` CPU used and `527Mi` memory used, around 58% memory. `homepi` root/K3s storage had about `15Gi` free out of `29Gi`. Loki and Alloy are pinned to `homepi` to avoid adding resident logging load to `workpi`.

## Collection Flow

Alloy uses `loki.source.kubernetes` to tail pod logs through the Kubernetes API. This avoids privileged host filesystem access and does not require Promtail.

Collected pod log namespaces:

- `opspulse`
- `logging`

Kubernetes events are collected with `loki.source.kubernetes_events` from:

- `opspulse`
- `logging`
- `monitoring`
- `kube-system`

Event log lines are JSON so Grafana can parse fields such as `reason`, `type`, and involved object data without turning high-cardinality event messages into Loki labels.

## Labels

Pod logs use bounded labels:

- `cluster`
- `source`
- `namespace`
- `pod`
- `container`
- `node`
- `app`
- `service`

Kubernetes event streams include Alloy-provided labels:

- `cluster`
- `source`
- `namespace`
- `job`
- `instance`

The configuration intentionally does not label request IDs, timestamps, IP addresses, URLs, query strings, log messages, or user-controlled content.

## OpsPulse API

The FastAPI backend reads Loki through the server-side `LOKI_URL` setting. The browser never receives the internal Loki URL and cannot submit arbitrary LogQL.

Endpoints:

- `GET /api/logs/recent`
- `GET /api/events/recent`

Both endpoints are bounded and return small operational summaries. If Loki is unavailable, `/api/logs/recent` returns HTTP 503 while the rest of OpsPulse remains available.

## Resource Tuning

Loki is constrained to `50m` CPU and `192Mi` memory requests with `500m` CPU and `512Mi` memory limits. Alloy is constrained to `25m` CPU and `96Mi` memory requests with `250m` CPU and `256Mi` memory limits.

Retention is `48h`, query length is bounded to `48h`, and Loki caches are disabled to avoid memcached sidecars and extra memory pressure.

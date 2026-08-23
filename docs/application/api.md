# OpsPulse API

## Purpose

OpsPulse API is the internal backend service for the OpsPulse operations console. In Phase 5 it provides health, readiness, and typed platform metadata for the frontend. It does not provide live Kubernetes telemetry.

## Runtime

- Framework: FastAPI
- Server: Uvicorn
- Container: `python:3.12-slim`
- Port: `8000`
- Runtime user: non-root user `1001`

## Kubernetes Resources

| Resource | Name | Namespace | Purpose |
| --- | --- | --- | --- |
| ConfigMap | `opspulse-api-config` | `opspulse` | Non-sensitive app configuration |
| Deployment | `opspulse-api` | `opspulse` | Runs two FastAPI replicas |
| Service | `opspulse-api` | `opspulse` | Internal ClusterIP access |

The API image reference is currently:

```text
<DOCKERHUB_USERNAME>/opspulse-api:v0.1.0
```

Replace the placeholder before deployment.

## Service Discovery

Workloads in the `opspulse` namespace should use the short Service DNS name:

```text
http://opspulse-api:8000
```

The fully qualified DNS name is:

```text
http://opspulse-api.opspulse.svc.cluster.local:8000
```

The API is intentionally not exposed externally.

## Probes

| Probe | Path | Meaning |
| --- | --- | --- |
| Liveness | `/health` | FastAPI process is alive |
| Readiness | `/ready` | Pod is ready to receive Service traffic |

Phase 5 readiness has no external dependency checks. PostgreSQL-aware readiness belongs to Phase 6.

## Resource Controls

Initial requests and limits:

```yaml
requests:
  cpu: 50m
  memory: 64Mi
limits:
  cpu: 250m
  memory: 256Mi
```

These values are conservative starting points for Raspberry Pi ARM64 hardware and should be tuned with real metrics later.

# OpsPulse Frontend

OpsPulse is the operational web interface for the Bare-Metal Kubernetes Reliability & Operations Platform. It is a Next.js App Router application that communicates with the internal OpsPulse API through server-side code.

Phase 5 reads platform metadata from the FastAPI backend when it is available and keeps repository-backed static infrastructure information as a fallback. It does not query Kubernetes, Prometheus, a database, or any external telemetry source.

## Architecture

- Next.js App Router with TypeScript
- Tailwind CSS for styling
- React Server Components for route pages
- Client components only for navigation state and theme controls
- Typed data boundary in `src/lib/data/`
- Server-only API client in `src/lib/api/opspulse.ts`
- Backend-for-frontend route at `/api/platform/status`
- Shared domain models in `src/types/`

Browser-side code must not receive the Kubernetes-internal API URL. The frontend server reads `OPSPULSE_API_URL` and proxies safe responses through `/api/platform/status`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Overview dashboard with platform summary, topology, capabilities, and repository milestones |
| `/infrastructure` | Physical node inventory and LAN topology |
| `/workloads` | Empty-state workload table architecture for future Kubernetes telemetry |
| `/services` | Service definitions plus live OpsPulse API connection state |
| `/incidents` | Incident list architecture and severity model |
| `/runbooks` | Runbook directory architecture and planned categories |

## Local Development

```bash
cd apps/frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

Run against a local API:

```bash
cd apps/api
uvicorn app.main:app --reload --port 8000

cd apps/frontend
OPSPULSE_API_URL=http://localhost:8000 npm run dev
```

## Environment Variables

Copy `.env.example` if local overrides are needed:

```bash
NEXT_PUBLIC_APP_NAME=OpsPulse
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_ENVIRONMENT=local
OPSPULSE_API_URL=http://localhost:8000
```

`OPSPULSE_API_URL` is server-only configuration. Do not create `NEXT_PUBLIC_OPSPULSE_API_URL`; the browser cannot resolve Kubernetes DNS and should not receive internal service addresses.

These values are non-sensitive. Do not commit secrets.

## Health Endpoints

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` | Returns HTTP 200 when the frontend server is alive |
| `GET /api/ready` | Returns HTTP 200 when the Next.js server can serve requests |
| `GET /api/platform/status` | Server-side proxy to `OPSPULSE_API_URL/api/status`; returns HTTP 503 when the API is unavailable |

The health and readiness endpoints do not validate Kubernetes, databases, monitoring, or backend APIs.

## Production Build

```bash
npm run lint
npm run typecheck
npm run build
```

`next.config.ts` uses `output: "standalone"` for a small production runtime image.

## Docker

```bash
docker build -t opspulse-web:v0.1.0 .
docker run --rm -p 3000:3000 opspulse-web:v0.1.0
```

The Dockerfile uses a multi-stage Node LTS build, runs as a non-root user, exposes port `3000`, and relies on the standalone Next.js output.

## Kubernetes

Manifests live in `k8s/`:

| File | Purpose |
| --- | --- |
| `namespace.yaml` | Creates the `opspulse` namespace |
| `configmap.yaml` | Provides non-sensitive frontend configuration |
| `deployment.yaml` | Runs two `opspulse-web` replicas with liveness/readiness probes |
| `service.yaml` | Exposes the app through a Kubernetes-assigned NodePort |

The initial resource requests and limits are conservative for Raspberry Pi infrastructure:

- requests: `100m` CPU, `128Mi` memory
- limits: `500m` CPU, `512Mi` memory

These are starting operational limits, not final production tuning. Observe real usage and refine later.

Before applying the deployment, replace the placeholder image:

```text
<DOCKERHUB_USERNAME>/opspulse-web:v0.1.0
```

Inside Kubernetes the frontend uses:

```text
OPSPULSE_API_URL=http://opspulse-api:8000
```

This value is consumed only by the Next.js server runtime.

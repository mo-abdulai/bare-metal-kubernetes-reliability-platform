<!-- category: OpsPulse Application -->
<!-- signals: API unavailable, opspulse-api, 5xx, backend connectivity failure -->
<!-- last_updated: 2026-08-23 -->
# Runbook: API Unavailable

## Purpose

Investigate OpsPulse API unavailability or degraded backend responses.

## Symptoms

- Frontend shows backend unavailable or degraded sections.
- `/health` or `/ready` fails.
- Prometheus target is down or 5xx rate increases.
- Loki contains FastAPI upstream failure logs.

## Impact

OpsPulse may lose live Kubernetes, metrics, logging, or event visibility.

## Initial Checks

- Confirm API Deployment, Pods, Service, and endpoints.
- Check whether Prometheus, Loki, or Kubernetes API dependency is unavailable.

## Diagnostic Commands

```bash
sudo k3s kubectl get deployment opspulse-api -n opspulse
sudo k3s kubectl get pods -n opspulse -l app=opspulse-api -o wide
sudo k3s kubectl get endpoints opspulse-api -n opspulse
sudo k3s kubectl logs -n opspulse deploy/opspulse-api --tail=100
```

## Likely Causes

- API Pods unavailable or NotReady.
- Internal service dependency unavailable.
- RBAC or configuration issue.
- Bad image rollout.

## Remediation

- Restore API replicas to the intended count.
- Roll back a bad image or configuration.
- Correct missing RBAC only after confirming the failing API path.

## Verification

```bash
sudo k3s kubectl rollout status deployment/opspulse-api -n opspulse
sudo k3s kubectl exec -n opspulse deploy/opspulse-api -- python -c 'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8000/ready").status)'
```

## Escalation

Escalate if API failure hides concurrent cluster, metrics, or logging issues.

## Prevention

- Keep API endpoint tests and RBAC validation current.
- Avoid mutable tags during deployment.

# TEST-003 - API Service Failure Handling

## Objective

Verify that OpsPulse Web remains usable when the internal API has no ready replicas.

## Initial State

- `opspulse-web` is reachable through its NodePort Service.
- `opspulse-api` is running with two replicas.
- The Overview and Services pages display backend status through the frontend server-side integration.

## Procedure

Scale the API down without deleting the Deployment:

```bash
kubectl scale deployment opspulse-api --replicas=0 -n opspulse
kubectl rollout status deployment/opspulse-api -n opspulse
```

Verify:

- frontend remains reachable
- navigation still works
- backend status displays `Unavailable`
- frontend does not crash
- `GET /api/platform/status` returns HTTP 503 with safe JSON

Restore the API:

```bash
kubectl scale deployment opspulse-api --replicas=2 -n opspulse
kubectl rollout status deployment/opspulse-api -n opspulse
```

## Evidence

Not yet executed in this repository session.

## Observed Behavior

Pending cluster deployment validation.

## Result

Pending.

## Operational Significance

This test validates graceful degradation at the frontend/backend boundary and confirms the browser does not need direct access to the internal API Service.

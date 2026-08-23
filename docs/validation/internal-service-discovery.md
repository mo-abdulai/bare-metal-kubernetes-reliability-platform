# TEST-002 - Internal Service Discovery

## Objective

Verify that OpsPulse Web can communicate with OpsPulse API using Kubernetes Service DNS instead of a hardcoded IP address.

## Initial State

- Namespace `opspulse` exists.
- `opspulse-web` Deployment is running.
- `opspulse-api` Deployment is running.
- `opspulse-api` Service is type `ClusterIP`.
- Frontend configuration sets `OPSPULSE_API_URL=http://opspulse-api:8000`.

## Procedure

```bash
kubectl get svc -n opspulse
kubectl get pods -n opspulse
kubectl rollout status deployment/opspulse-api -n opspulse
kubectl rollout status deployment/opspulse-web -n opspulse
```

From a frontend Pod, verify DNS and HTTP access if tools are present:

```bash
kubectl exec -n opspulse <opspulse-web-pod> -- nslookup opspulse-api
kubectl exec -n opspulse <opspulse-web-pod> -- wget -qO- http://opspulse-api:8000/health
kubectl exec -n opspulse <opspulse-web-pod> -- wget -qO- http://opspulse-api:8000/api/status
```

If the production frontend image lacks diagnostic tools, use a temporary diagnostic Pod instead of modifying the production image.

## Evidence

Not yet executed in this repository session.

## Observed Behavior

Pending cluster deployment validation.

## Result

Pending.

## Operational Significance

This test proves the frontend depends on Kubernetes DNS and Service routing rather than node IPs, Pod IPs, or browser-visible internal addresses.

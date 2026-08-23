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

- Date: 2026-08-23
- Cluster: `homepi` / `workpi` K3s
- Images:
  - `nurud43/opspulse-api:v0.1.0`
  - `nurud43/opspulse-web:v0.1.0`
- `opspulse-api` Service: `ClusterIP`, port `8000`
- `opspulse-web` Service: `NodePort`, port `80:31424`
- Service endpoints:
  - `opspulse-api`: `10.42.0.36:8000`, `10.42.1.33:8000`
  - `opspulse-web`: `10.42.0.35:3000`, `10.42.1.31:3000`

Validated from an `opspulse-web` Pod:

```text
api-health 200 {"status":"ok","service":"opspulse-api"}
api-status 200 {"platform":{"name":"Bare-Metal Kubernetes Reliability & Operations Platform","environment":"bare-metal","orchestrator":"K3s","architecture":"ARM64"},"service":{"name":"opspulse-api","version":"0.1.0","status":"operational"}}
web-bff 200 {"status":"connected","data":{"platform":{"name":"Bare-Metal Kubernetes Reliability & Operations Platform","environment":"bare-metal","orchestrator":"K3s","architecture":"ARM64"},"service":{"name":"opspulse-api","version":"0.1.0","status":"operational"}}}
```

## Observed Behavior

The frontend Pod resolved and reached `http://opspulse-api:8000` through Kubernetes Service DNS. The frontend backend-for-frontend route returned connected API status without exposing the internal API URL to the browser.

## Result

Passed.

## Operational Significance

This test proves the frontend depends on Kubernetes DNS and Service routing rather than node IPs, Pod IPs, or browser-visible internal addresses.

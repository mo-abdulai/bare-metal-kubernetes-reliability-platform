<!-- category: Service Discovery -->
<!-- signals: service endpoints = 0, EndpointSlice empty -->
<!-- last_updated: 2026-08-23 -->
# Runbook: Service Has No Endpoints

## Purpose

Investigate a Kubernetes Service that has no ready endpoints.

## Symptoms

- Service exists, but `endpoints` or `EndpointSlice` has no addresses.
- Frontend or backend calls fail through service DNS.
- Pods may be present but NotReady.

## Impact

Clients using the Service cannot reach the workload.

## Initial Checks

- Compare Service selector with Pod labels.
- Confirm Pods are Ready.

## Diagnostic Commands

```bash
sudo k3s kubectl get svc -n <namespace> <service> -o yaml
sudo k3s kubectl get pods -n <namespace> --show-labels
sudo k3s kubectl get endpoints -n <namespace> <service>
sudo k3s kubectl get endpointslice -n <namespace>
```

## Likely Causes

- Service selector does not match Pod labels.
- Pods are failing readiness checks.
- Deployment has zero available replicas.

## Remediation

- Correct selector or labels.
- Restore Pod readiness.
- Roll out a corrected Deployment if labels or probes changed.

## Verification

```bash
sudo k3s kubectl get endpoints -n <namespace> <service>
sudo k3s kubectl run -n <namespace> curl-test --rm -it --image=curlimages/curl -- <service>:<port>
```

## Escalation

Escalate if the affected Service is part of OpsPulse API, monitoring, or logging.

## Prevention

- Validate selectors and labels during review.
- Keep Service endpoint checks in deployment validation.

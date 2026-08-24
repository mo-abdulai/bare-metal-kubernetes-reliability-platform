<!-- category: Workload Health -->
<!-- signals: readiness probe failed, liveness probe failed, Ready false -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh failed-healthcheck -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh failed-healthcheck -->
<!-- expected_signals: readiness false, probe failure events, endpoint readiness change -->
# Runbook: Failed Health Check

## Purpose

Investigate a workload that is running but failing Kubernetes health probes.

## Symptoms

- Pod phase is `Running`, but Ready is `false`.
- Events show readiness or liveness probe failures.
- Service endpoint readiness changes.

## Impact

Traffic may stop routing to the Pod, reducing available capacity.

## Initial Checks

- Confirm the probe path, port, and initial delay.
- Confirm the application actually exposes the expected health endpoint.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl get endpoints -n <namespace>
sudo k3s kubectl logs -n <namespace> <pod> --tail=100
```

## Likely Causes

- Probe path is wrong.
- Application startup exceeds probe timing.
- Application is healthy on a different port or path.

## Remediation

- Correct the probe path or port.
- Tune probe timings only after validating startup behavior.
- Fix the application health endpoint when the probe is accurate.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl get endpoints -n <namespace>
```

## Escalation

Escalate if all replicas for a critical Service are NotReady.

## Prevention

- Test health endpoints in CI and staging.
- Keep readiness checks distinct from deep dependency checks when appropriate.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh failed-healthcheck
```

Expected observations:

- Pod is `Running` but Ready is `false`.
- Kubernetes events report readiness probe failures.
- Endpoint readiness changes.
- OpsPulse surfaces the signal.

Cleanup:

```bash
./scripts/incidents/cleanup.sh failed-healthcheck
```

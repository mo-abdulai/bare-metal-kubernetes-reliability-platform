<!-- category: Workload Health -->
<!-- signals: runtime error, container restart, application exception -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh runtime-error -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh runtime-error -->
<!-- expected_signals: application exception log, restart count increase, CrashLoopBackOff -->
# Runbook: Runtime Error

## Purpose

Investigate an application container that starts, logs a runtime error, and exits.

## Symptoms

- Logs contain an application exception.
- Restart count increases.
- Pod may enter `CrashLoopBackOff`.

## Impact

The workload may be unavailable or intermittently unavailable.

## Initial Checks

- Read current and previous container logs.
- Identify whether the error is deterministic or input-driven.
- Compare with recent deployment changes.

## Diagnostic Commands

```bash
sudo k3s kubectl logs -n <namespace> <pod> --tail=100
sudo k3s kubectl logs -n <namespace> <pod> --previous --tail=100
sudo k3s kubectl describe pod -n <namespace> <pod>
```

## Likely Causes

- Application bug.
- Invalid runtime configuration.
- Missing dependency at startup.

## Remediation

- Roll back or deploy a corrected build.
- Fix configuration if the exception points to runtime config.
- Add targeted tests for the failing path.

## Verification

```bash
sudo k3s kubectl rollout status deployment/<deployment> -n <namespace>
sudo k3s kubectl logs -n <namespace> deployment/<deployment> --tail=100
```

## Escalation

Escalate if runtime errors affect multiple replicas or critical user paths.

## Prevention

- Keep startup and runtime exception tests in CI.
- Emit structured logs for failure paths.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh runtime-error
```

Expected observations:

- Application logs a deterministic runtime exception.
- Container exits and restart count increases.
- Loki receives error logs.
- OpsPulse surfaces correlated signals.

Cleanup:

```bash
./scripts/incidents/cleanup.sh runtime-error
```

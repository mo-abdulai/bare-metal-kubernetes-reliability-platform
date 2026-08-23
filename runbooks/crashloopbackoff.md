<!-- category: Workload Health -->
<!-- signals: CrashLoopBackOff, BackOff, container restart -->
<!-- last_updated: 2026-08-23 -->
# Runbook: CrashLoopBackOff

## Purpose

Investigate a container that repeatedly exits and restarts.

## Symptoms

- Pod status shows `CrashLoopBackOff`.
- Restart count increases.
- Loki shows startup or runtime errors.

## Impact

The affected workload may be unavailable or serving with reduced replica capacity.

## Initial Checks

- Identify the Pod, container, Deployment, and node.
- Check whether all replicas are affected or only one Pod.

## Diagnostic Commands

```bash
sudo k3s kubectl get pods -n <namespace> -o wide
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl logs -n <namespace> <pod> -c <container> --previous --tail=100
sudo k3s kubectl get deployment -n <namespace> <deployment> -o yaml
```

## Likely Causes

- Bad command, entrypoint, or configuration.
- Missing ConfigMap or Secret reference.
- Readiness/liveness probe killing the container.
- Application dependency unavailable.

## Remediation

- Roll back or correct the faulty image/configuration.
- Fix missing configuration references.
- Adjust probes only when they are demonstrably incorrect.

## Verification

```bash
sudo k3s kubectl rollout status deployment/<deployment> -n <namespace>
sudo k3s kubectl get pods -n <namespace>
```

## Escalation

Escalate if repeated crashes affect multiple core platform components.

## Prevention

- Validate manifests and startup paths before deployment.
- Keep focused health-check tests for probe endpoints.

<!-- category: Workload Availability -->
<!-- signals: DeploymentUnavailable, unavailable replicas, readiness failure -->
<!-- last_updated: 2026-08-23 -->
# Runbook: Deployment Unavailable

## Purpose

Investigate a Deployment with fewer available replicas than desired.

## Symptoms

- Desired replicas exceed available replicas.
- Prometheus reports deployment availability issues.
- Pods are Pending, CrashLoopBackOff, ImagePullBackOff, or NotReady.

## Impact

The workload may be degraded or unavailable depending on replica count and service routing.

## Initial Checks

- Confirm desired and available replica counts.
- Identify whether the issue is image pull, scheduling, startup, or readiness.

## Diagnostic Commands

```bash
sudo k3s kubectl get deployment -n <namespace> <deployment>
sudo k3s kubectl describe deployment -n <namespace> <deployment>
sudo k3s kubectl get pods -n <namespace> -l app=<app> -o wide
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Bad image tag or pull issue.
- Failing readiness or liveness probe.
- Insufficient node resources.
- Selector or label mismatch.

## Remediation

- Restore a known-good image or configuration.
- Correct probe path or service dependency.
- Scale back only as part of a controlled recovery plan.

## Verification

```bash
sudo k3s kubectl rollout status deployment/<deployment> -n <namespace>
sudo k3s kubectl get endpoints -n <namespace>
```

## Escalation

Escalate if the unavailable Deployment is `opspulse-api`, `opspulse-web`, Prometheus, Loki, or Grafana.

## Prevention

- Keep deployment checks in validation docs.
- Avoid reusing mutable tags during critical rollouts.

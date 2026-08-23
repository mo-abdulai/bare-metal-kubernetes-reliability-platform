<!-- category: Resource Pressure -->
<!-- signals: high memory, memory pressure -->
<!-- last_updated: 2026-08-23 -->
# Runbook: High Memory

## Purpose

Investigate elevated node or workload memory usage.

## Symptoms

- Prometheus reports high memory usage.
- Pods are evicted or OOMKilled.
- `workpi` approaches memory pressure.

## Impact

High memory can cause restarts, scheduling failures, or node instability.

## Initial Checks

- Compare node and Pod memory usage.
- Identify recent rollouts or new workloads.

## Diagnostic Commands

```bash
sudo k3s kubectl top nodes
sudo k3s kubectl top pods -A --sort-by=memory
sudo k3s kubectl get events -A --sort-by=.lastTimestamp
```

## Likely Causes

- Workload memory leak.
- Resource limits too low or too high for node capacity.
- Too many Pods on `workpi`.

## Remediation

- Reduce or reschedule nonessential workloads.
- Roll back recent workload changes.
- Tune requests and limits conservatively.

## Verification

```bash
sudo k3s kubectl top nodes
sudo k3s kubectl get pods -A
```

## Escalation

Escalate if high memory threatens `homepi` control-plane stability.

## Prevention

- Keep heavyweight components on `homepi`.

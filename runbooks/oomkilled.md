<!-- category: Resource Pressure -->
<!-- signals: OOMKilled, memory pressure, container restart -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: true -->
<!-- reproduction_command: ./scripts/incidents/incident.sh oomkilled -->
<!-- cleanup_command: ./scripts/incidents/cleanup.sh oomkilled -->
<!-- expected_signals: OOMKilled, memory limit exceeded, restart count increase, Kubernetes events -->
# Runbook: OOMKilled

## Purpose

Investigate a container killed because it exceeded its memory limit.

## Symptoms

- Container state or last state shows `OOMKilled`.
- Restart count increases.
- Node memory usage is elevated.

## Impact

The affected Pod may restart repeatedly. On `workpi`, memory pressure can destabilize colocated workloads because allocatable memory is limited.

## Initial Checks

- Identify the container memory limit and current node.
- Check whether the condition is isolated to one workload.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl top pods -n <namespace>
sudo k3s kubectl top nodes
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Memory limit too low for normal workload behavior.
- Memory leak or expensive request path.
- Too many heavy Pods scheduled on `workpi`.

## Remediation

- Restore service by rolling out a corrected workload or scaling replicas appropriately.
- Increase limits only after confirming node capacity.
- Move heavier components to `homepi` when appropriate.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace>
sudo k3s kubectl top pods -n <namespace>
sudo k3s kubectl top nodes
```

## Escalation

Escalate if memory pressure appears on both nodes or affects Prometheus, Loki, or OpsPulse.

## Prevention

- Keep memory requests and limits realistic for Raspberry Pi capacity.
- Add validation exercises for memory-bound workloads.

## Reproduction / Validation

This incident can be safely reproduced using the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

```bash
./scripts/incidents/incident.sh oomkilled
```

Expected observations:

- Container terminates with `OOMKilled`.
- Restart count increases.
- Kubernetes events capture restart evidence.
- Prometheus metrics reflect container restart behavior.
- Loki receives relevant workload logs.

Cleanup:

```bash
./scripts/incidents/cleanup.sh oomkilled
```

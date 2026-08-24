<!-- category: Scheduling -->
<!-- signals: taint mismatch, FailedScheduling, Pod Pending -->
<!-- last_updated: 2026-08-23 -->
<!-- reproducible: false -->
# Runbook: Node Taint Scheduling Failure

## Purpose

Investigate a Pod that cannot schedule because node taints are not tolerated.

## Symptoms

- Pod remains `Pending`.
- Events mention untolerated taints.
- No container starts.

## Impact

The workload has no running replica on eligible nodes.

## Initial Checks

- Inspect node taints.
- Inspect Pod tolerations.
- Confirm whether taints are intentional.

## Diagnostic Commands

```bash
sudo k3s kubectl describe pod -n <namespace> <pod>
sudo k3s kubectl describe nodes | grep -A3 Taints
sudo k3s kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Likely Causes

- Workload lacks required toleration.
- Node taint is intentional and workload is targeting the wrong nodes.
- Taint was added without updating workload scheduling policy.

## Remediation

- Add tolerations only when the workload is intended to run on the tainted node.
- Adjust node selectors or affinity to target eligible nodes.
- Review any recent node taint changes.

## Verification

```bash
sudo k3s kubectl get pods -n <namespace> -o wide
```

## Escalation

Escalate before changing production node taints.

## Prevention

- Document node taints and intended tolerations.
- Review scheduling constraints with node maintenance changes.

## Reproduction / Validation

This scenario is manual-only in the OpsPulse incident framework.

Reproduction commands are intended only for the dedicated OpsPulse test namespace and must not be applied directly to production workloads.

The framework does not modify real node taints automatically. Use safer scheduler reproductions instead:

```bash
./scripts/incidents/incident.sh node-affinity
./scripts/incidents/incident.sh insufficient-resources
```

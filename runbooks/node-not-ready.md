<!-- category: Node Health -->
<!-- signals: NodeNotReady, Ready=False, node pressure -->
<!-- last_updated: 2026-08-23 -->
# Runbook: Node NotReady

## Purpose

Investigate and restore a K3s node that is not reporting Ready.

## Symptoms

- `kubectl get nodes` shows `NotReady`.
- Pods stop scheduling or remain unavailable on one node.
- Node pressure, kubelet, or network events appear.

## Impact

A worker outage reduces placement capacity. A control-plane outage may affect Kubernetes API availability.

## Initial Checks

- Confirm whether the affected node is `homepi` or `workpi`.
- Check whether workloads have moved or are stuck.
- Verify SSH connectivity to the node.

## Diagnostic Commands

```bash
sudo k3s kubectl get nodes -o wide
sudo k3s kubectl describe node <node>
sudo k3s kubectl get events -A --sort-by=.lastTimestamp
ssh <node> systemctl status k3s-agent
ssh <node> df -h
ssh <node> free -m
```

## Likely Causes

- K3s agent or kubelet process failure.
- Node memory, disk, or PID pressure.
- Network connectivity loss between `workpi` and `homepi`.
- Host reboot or OS issue.

## Remediation

- Restore host connectivity first.
- Restart `k3s-agent` only after collecting events and service status.
- Free disk space if node filesystem pressure is present.
- Reduce workload pressure before rescheduling nonessential workloads.

## Verification

```bash
sudo k3s kubectl get nodes -o wide
sudo k3s kubectl get pods -A -o wide | grep <node>
sudo k3s kubectl top nodes
```

## Escalation

Escalate if `homepi` cannot serve the Kubernetes API or if the node repeatedly leaves Ready state.

## Prevention

- Track filesystem and memory pressure.
- Keep logging/monitoring components pinned away from constrained nodes where possible.

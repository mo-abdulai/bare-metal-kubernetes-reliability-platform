<!-- category: Resource Pressure -->
<!-- signals: high cpu, CPU pressure -->
<!-- last_updated: 2026-08-23 -->
# Runbook: High CPU

## Purpose

Investigate elevated CPU usage on nodes or workloads.

## Symptoms

- Prometheus reports high CPU usage.
- API latency or workload readiness degrades.

## Impact

Sustained CPU pressure can delay probes, scheduling, and request handling.

## Initial Checks

- Identify the node and workload consuming CPU.
- Check whether the spike aligns with deployment or validation tests.

## Diagnostic Commands

```bash
sudo k3s kubectl top nodes
sudo k3s kubectl top pods -A --sort-by=cpu
sudo k3s kubectl get events -A --sort-by=.lastTimestamp
```

## Likely Causes

- Expensive request path.
- Excessive logging or scraping.
- Build/test workload running on a cluster node.

## Remediation

- Stop nonessential test workloads.
- Scale or roll back the offending workload.
- Tune scrape/log volume if observability components are causing pressure.

## Verification

```bash
sudo k3s kubectl top nodes
sudo k3s kubectl top pods -A --sort-by=cpu
```

## Escalation

Escalate if control-plane responsiveness degrades.

## Prevention

- Use conservative resource requests and limits.

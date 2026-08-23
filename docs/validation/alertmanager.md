# Alertmanager Validation

## Objective

Verify that Alertmanager is deployed, reachable internally, and receives custom OpsPulse alert rules.

## Procedure

```bash
kubectl -n monitoring get statefulset alertmanager-kube-prometheus-stack-alertmanager
kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
```

Prometheus rule check:

```bash
kubectl -n monitoring get prometheusrule opspulse-platform-alerts
```

Alertmanager access:

```bash
curl -s http://localhost:9093/api/v2/status
```

## Expected State

Custom alerts may be inactive initially. Phase 6 does not configure external email, Slack, PagerDuty, or other notification destinations.

## Evidence

Collected on August 23, 2026.

Alertmanager workload:

```text
statefulset.apps/alertmanager-kube-prometheus-stack-alertmanager 1/1
pod/alertmanager-kube-prometheus-stack-alertmanager-0 2/2 Running homepi
```

Alertmanager API status through port-forward:

```json
{
  "version": "0.33.1",
  "clusterStatus": "disabled",
  "uptime": "2026-08-23T14:26:13.696Z"
}
```

Custom rules loaded in Prometheus:

```text
NodeDown inactive ok
KubernetesNodeNotReady inactive ok
PodCrashLooping inactive ok
DeploymentUnavailable inactive ok
HighNodeMemory inactive ok
HighNodeCPU inactive ok
HighDiskUsage inactive ok
OpsPulseAPIDown inactive ok
OpsPulseAPIHighErrorRate inactive ok
```

No external notification destination is configured in Phase 6.

## Result

Passed. Alertmanager is reachable internally, and custom OpsPulse alert rules are loaded and healthy.

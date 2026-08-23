# TEST-009 — Kubernetes Event Correlation

## Objective

Trigger a safe reversible workload change and correlate the Kubernetes event with workload state, metrics, and Loki event records.

## Procedure

1. Record current replicas:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get deployment opspulse-web -n opspulse
```

2. Temporarily scale down by one replica, then restore:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl scale deployment/opspulse-web -n opspulse --replicas=1
ssh mo-abdulai@homepi.local sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
ssh mo-abdulai@homepi.local sudo k3s kubectl scale deployment/opspulse-web -n opspulse --replicas=2
ssh mo-abdulai@homepi.local sudo k3s kubectl rollout status deployment/opspulse-web -n opspulse
```

3. Confirm Kubernetes events:

```bash
ssh mo-abdulai@homepi.local sudo k3s kubectl get events -n opspulse --sort-by=.lastTimestamp
```

4. Query Loki events:

```logql
{source="event", job="kubernetes-events", namespace="opspulse"} | json | object_name=~"opspulse-web.*"
```

5. Compare with Prometheus deployment availability:

```promql
kube_deployment_status_replicas_available{namespace="opspulse", deployment="opspulse-web"}
```

## Evidence

Pending post-deployment validation.

## Result

Pending.

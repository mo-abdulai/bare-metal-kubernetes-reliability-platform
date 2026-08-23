# Prometheus Targets Validation

## Objective

Verify that Prometheus discovers and scrapes the Phase 6 monitoring targets.

## Expected Targets

- node-exporter on `homepi`
- node-exporter on `workpi`
- kube-state-metrics
- Kubernetes API/service discovery targets provided by kube-prometheus-stack
- OpsPulse API `/metrics` target through `ServiceMonitor/opspulse-api`

## Procedure

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
curl -s http://localhost:9090/api/v1/targets
```

Useful focused checks:

```promql
up{job="node-exporter"}
up{job=~".*kube-state-metrics.*"}
up{job="opspulse-api"}
```

## Evidence

Collected on August 23, 2026 after installing `kube-prometheus-stack` chart `88.2.0`.

Monitoring pod placement:

```text
alertmanager-kube-prometheus-stack-alertmanager-0           2/2 Running homepi
kube-prometheus-stack-grafana-6bd8b78b65-z5knb              3/3 Running homepi
kube-prometheus-stack-kube-state-metrics-5db74c7ccd-4gm2r   1/1 Running homepi
kube-prometheus-stack-operator-5f9b74dd64-vpwpq             1/1 Running homepi
kube-prometheus-stack-prometheus-node-exporter-sbs5l        1/1 Running workpi
kube-prometheus-stack-prometheus-node-exporter-vrq9n        1/1 Running homepi
prometheus-kube-prometheus-stack-prometheus-0               2/2 Running homepi
```

Prometheus `up` evidence:

```text
node-exporter 192.168.0.2:9100 1
node-exporter 192.168.0.35:9100 1
apiserver 192.168.0.2:6443 1
kube-state-metrics 10.42.0.42:8080 1
opspulse-api 10.42.0.47:8000 1
opspulse-api 10.42.1.36:8000 1
```

Node CPU query returned live values:

```text
192.168.0.2:9100 13.24%
192.168.0.35:9100 16.01%
```

## Result

Passed. Prometheus is scraping node-exporter on both Raspberry Pi nodes, kube-state-metrics, the Kubernetes API server, and both OpsPulse API replicas.

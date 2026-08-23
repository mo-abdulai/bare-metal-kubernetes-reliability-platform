<!-- category: Networking -->
<!-- signals: DNSConfigForming, DNS resolution, CoreDNS -->
<!-- last_updated: 2026-08-23 -->
# Runbook: DNS Resolution

## Purpose

Investigate Kubernetes DNS or Pod DNS configuration issues.

## Symptoms

- Events show `DNSConfigForming`.
- Service DNS names fail from Pods.
- CoreDNS errors appear.

## Impact

Workloads may fail to reach internal services such as `opspulse-api`, Prometheus, or Loki.

## Initial Checks

- Check CoreDNS health.
- Confirm Pod DNS events and nameserver limits.

## Diagnostic Commands

```bash
sudo k3s kubectl get pods -n kube-system -l k8s-app=kube-dns
sudo k3s kubectl logs -n kube-system deploy/coredns --tail=100
sudo k3s kubectl get events -A --sort-by=.lastTimestamp
```

## Likely Causes

- Host resolver configuration has too many nameservers.
- CoreDNS Pod unavailable.
- Network path to cluster DNS is broken.

## Remediation

- Restore CoreDNS health first.
- Reduce host resolver nameserver count if Pod DNS config exceeds Kubernetes limits.

## Verification

```bash
sudo k3s kubectl run dns-test --rm -it --image=busybox:1.36 -- nslookup kubernetes.default.svc
```

## Escalation

Escalate if DNS breaks service discovery for OpsPulse or monitoring.

## Prevention

- Keep host resolver configuration simple on cluster nodes.

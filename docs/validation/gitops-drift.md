# TEST-014 - Configuration Drift Detection

Status: Not executed on live cluster.

## Goal

Validate that Argo CD detects and self-heals safe configuration drift.

## Planned Exercise

Initial Git state:

```text
gitops/apps/opspulse/overlays/bare-metal/kustomization.yaml
opspulse-web replicas: 2
```

Manual safe drift:

```bash
sudo k3s kubectl scale deployment/opspulse-web -n opspulse --replicas=1
```

Expected:

```text
Cluster state differs from Git
-> Argo CD detects OutOfSync
-> self-heal restores replicas to 2
-> Application returns Synced/Healthy
```

## Evidence To Capture

- initial Git desired state
- manual cluster change command
- Argo `OutOfSync` state
- restored Deployment replica count
- final `Synced/Healthy` state

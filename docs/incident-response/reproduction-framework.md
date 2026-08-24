# Incident Reproduction Framework

The OpsPulse incident reproduction framework creates controlled Kubernetes failure scenarios in a dedicated test namespace so runbooks, metrics, logs, events, and incident candidates can be validated safely.

It is a reliability engineering harness, not a tutorial manifest collection. Every automatic scenario is isolated, labeled, reversible, and designed to avoid production workloads.

## Architecture

```text
incident.sh
    |
    v
Scenario manifest
    |
    v
opspulse-chaos namespace
    |
    +--> Kubernetes state/events
    |
    +--> Prometheus
    |
    +--> Loki
    |
    v
OpsPulse Incident Signals
    |
    v
Runbook
    |
    v
cleanup.sh
```

## Safety Model

The framework:

- Uses `opspulse-chaos` by default.
- Labels resources with `opspulse.io/incident-test=true`.
- Annotates resources with `opspulse.io/purpose=incident-reproduction`.
- Does not delete `opspulse`, `monitoring`, or `logging`.
- Does not change K3s configuration.
- Does not reboot nodes.
- Does not stop host services.
- Does not change node taints automatically.
- Does not reference real Secrets.
- Does not run uncontrolled load tests.

The `node-taint` scenario is manual-only because changing real node taints is not safe as an automatic test.

## Usage

Interactive mode:

```bash
./scripts/incidents/incident.sh
```

List scenarios:

```bash
./scripts/incidents/incident.sh --list
```

Run a scenario with confirmation:

```bash
./scripts/incidents/incident.sh crashloopbackoff
```

Run non-interactively:

```bash
./scripts/incidents/incident.sh service-no-endpoints --yes
```

Dry-run:

```bash
./scripts/incidents/incident.sh oomkilled --dry-run
```

Cleanup one scenario:

```bash
./scripts/incidents/cleanup.sh oomkilled
```

Cleanup all framework resources:

```bash
./scripts/incidents/cleanup.sh --all
```

## Kubernetes Client

The scripts auto-detect `kubectl`. For K3s or remote cluster access, set `OPSPULSE_KUBECTL`:

```bash
OPSPULSE_KUBECTL="ssh mo-abdulai@homepi.local sudo k3s kubectl" ./scripts/incidents/incident.sh --list
```

For local K3s on a node:

```bash
OPSPULSE_KUBECTL="sudo k3s kubectl" ./scripts/incidents/incident.sh crashloopbackoff
```

## Supported Scenarios

| Scenario | Mode | Runbook |
| --- | --- | --- |
| `crashloopbackoff` | automatic | `runbooks/crashloopbackoff.md` |
| `imagepullbackoff` | automatic | `runbooks/imagepullbackoff.md` |
| `oomkilled` | automatic | `runbooks/oomkilled.md` |
| `failed-healthcheck` | automatic | `runbooks/failed-healthcheck.md` |
| `missing-configmap` | automatic | `runbooks/missing-configmap.md` |
| `missing-secret` | automatic | `runbooks/missing-secret.md` |
| `service-no-endpoints` | automatic | `runbooks/service-no-endpoints.md` |
| `node-affinity` | automatic | `runbooks/node-affinity.md` |
| `node-taint` | manual-only | `runbooks/node-taint.md` |
| `resource-quota` | automatic | `runbooks/resource-quota.md` |
| `insufficient-resources` | automatic | `runbooks/insufficient-resources.md` |
| `unbound-pvc` | automatic | `runbooks/unbound-pvc.md` |
| `init-container-failure` | automatic | `runbooks/init-container-failure.md` |
| `runtime-error` | automatic | `runbooks/runtime-error.md` |

## Observability Validation

After a successful reproduction:

1. Open OpsPulse `/incidents`.
2. Check Recent Signals.
3. Check Incident Candidates.
4. Open the matching runbook.
5. Follow the diagnostic commands printed by the scenario.
6. Use Grafana Explore for Prometheus and Loki evidence.
7. Clean up the scenario.

Scenario resources include labels and annotations that make the evidence identifiable:

```text
namespace = opspulse-chaos
opspulse.io/incident-test = true
opspulse.io/scenario = <scenario>
opspulse.io/runbook = <runbook>
```

## Validation

Run framework integrity checks without injecting failures:

```bash
./scripts/incidents/validate.sh
```

The validation script checks:

- Bash syntax.
- Optional `shellcheck` if installed.
- Scenario metadata.
- Runbook references.
- Kubernetes client-side manifest parsing.
- Destructive command patterns.

## Cleanup Guarantees

Scenario cleanup removes only resources declared by that scenario manifest:

```bash
./scripts/incidents/cleanup.sh crashloopbackoff
```

Full cleanup removes only the dedicated reproduction namespace:

```bash
./scripts/incidents/cleanup.sh --all
```

It never deletes production namespaces.


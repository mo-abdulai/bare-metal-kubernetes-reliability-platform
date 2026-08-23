# Validation: OOMKilled Incident

## Scenario

Validate that memory-pressure evidence can be reviewed, tied to the OOMKilled runbook, and resolved as an incident.

## Preconditions

- Kubernetes event collection is available.
- Metrics for node and pod memory are available.
- The `oomkilled` runbook is available in `/runbooks`.

## Steps

1. Create or identify a workload with OOMKilled evidence.
2. Open `/incidents`.
3. Confirm memory or OOM-related signals appear under Recent Signals.
4. Promote the relevant candidate or create an incident from selected signals.
5. Attach the `oomkilled` runbook.
6. Review memory diagnostics in the runbook detail page.
7. Add timeline entries while investigating.
8. Resolve the incident with root cause, remediation, and prevention notes.

## Expected Result

- OOM evidence is presented as signals rather than automatically becoming an incident.
- The promoted incident links to the OOMKilled runbook.
- The final incident contains selected signals, timeline entries, and a structured resolution.

## Evidence

Pending live cluster validation.

## Result

Pending.

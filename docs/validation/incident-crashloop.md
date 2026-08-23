# Validation: CrashLoopBackOff Incident

## Scenario

Validate that Kubernetes warning events and restart metrics can be reviewed and promoted into a CrashLoopBackOff incident.

## Preconditions

- OpsPulse API can read Kubernetes events.
- Loki and Prometheus are available for related log and restart signals.
- The `crashloopbackoff` runbook is available in `/runbooks`.

## Steps

1. Create or identify a pod in a restart loop.
2. Open `/incidents`.
3. Confirm Kubernetes or workload restart evidence appears under Recent Signals.
4. Confirm a candidate groups related pod evidence.
5. Promote the candidate.
6. Attach the `crashloopbackoff` runbook.
7. Open the incident detail page.
8. Review grouped signals and follow diagnostic commands from the runbook.
9. Add investigation notes to the timeline.
10. Resolve the incident after remediation.

## Expected Result

- Crash loop evidence remains visible as raw signals.
- The incident is only created after manual promotion.
- The runbook detail page provides diagnostic commands and remediation guidance.
- Resolution details are persisted in the incident JSON record.

## Evidence

Pending live cluster validation.

## Result

Pending.

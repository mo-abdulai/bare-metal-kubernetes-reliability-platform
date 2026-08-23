# Validation: Deployment Outage Incident

## Scenario

Validate that OpsPulse can surface deployment availability signals, correlate them into an incident candidate, and promote the candidate into a formal incident record.

## Preconditions

- OpsPulse API is reachable.
- Prometheus metrics are reachable from the API.
- Frontend is configured with `OPSPULSE_API_URL`.

## Steps

1. Create or identify a deployment with unavailable replicas.
2. Open `/incidents`.
3. Confirm the signal appears under Recent Signals.
4. Confirm a related candidate appears under Incident Candidates.
5. Promote the candidate and select the relevant workload signal.
6. Set severity based on observed impact.
7. Attach the `deployment-unavailable` runbook.
8. Save the incident.
9. Add an investigation timeline note.
10. Resolve the incident with summary, root cause, remediation, and prevention notes.

## Expected Result

- The candidate is generated from workload availability evidence.
- The promoted incident receives an `INC-###` identifier.
- The incident detail page shows selected signals, lifecycle controls, timeline entries, runbook link, and final resolution.

## Evidence

Pending live cluster validation.

## Result

Pending.

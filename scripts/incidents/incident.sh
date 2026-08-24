#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/checks.sh
source "${SCRIPT_DIR}/lib/checks.sh"

YES=false
DRY_RUN=false
CLEANUP=false
LIST=false
SCENARIO=""

usage() {
  cat <<EOF
Usage:
  ./scripts/incidents/incident.sh
  ./scripts/incidents/incident.sh --list
  ./scripts/incidents/incident.sh <scenario> [--yes] [--dry-run]
  ./scripts/incidents/incident.sh --cleanup <scenario>

Examples:
  ./scripts/incidents/incident.sh crashloopbackoff
  ./scripts/incidents/incident.sh oomkilled --dry-run
  ./scripts/incidents/incident.sh service-no-endpoints --yes
EOF
}

list_scenarios() {
  printf '%-24s %-28s %-12s\n' "SCENARIO" "RUNBOOK" "MODE"
  local scenario
  for scenario in "${SCENARIOS[@]}"; do
    printf '%-24s %-28s %-12s\n' "${scenario}" "$(scenario_runbook "${scenario}")" "$(scenario_mode "${scenario}")"
  done
}

interactive_menu() {
  cat <<EOF
OpsPulse Incident Reproduction Framework

Select scenario:

1) CrashLoopBackOff
2) ImagePullBackOff
3) OOMKilled
4) Failed Health Check
5) Missing ConfigMap
6) Missing Secret
7) Service Has No Endpoints
8) Node Affinity Failure
9) Node Taint Scheduling Failure
10) Resource Quota Failure
11) Insufficient Resources
12) Unbound PVC
13) Init Container Failure
14) Runtime Error

q) Quit
EOF
  printf '\nSelection: '
  read -r selection
  case "${selection}" in
    1) SCENARIO="crashloopbackoff" ;;
    2) SCENARIO="imagepullbackoff" ;;
    3) SCENARIO="oomkilled" ;;
    4) SCENARIO="failed-healthcheck" ;;
    5) SCENARIO="missing-configmap" ;;
    6) SCENARIO="missing-secret" ;;
    7) SCENARIO="service-no-endpoints" ;;
    8) SCENARIO="node-affinity" ;;
    9) SCENARIO="node-taint" ;;
    10) SCENARIO="resource-quota" ;;
    11) SCENARIO="insufficient-resources" ;;
    12) SCENARIO="unbound-pvc" ;;
    13) SCENARIO="init-container-failure" ;;
    14) SCENARIO="runtime-error" ;;
    q|Q) exit 0 ;;
    *) error "Invalid selection: ${selection}"; exit 1 ;;
  esac
}

confirm_scenario() {
  local scenario="$1"
  [[ "${YES}" == "true" ]] && return 0

  cat <<EOF
Scenario: $(scenario_title "${scenario}")

This will create temporary resources in namespace:
${CHAOS_NAMESPACE}

No production application resources will be modified.

Continue? [y/N] 
EOF
  read -r answer
  [[ "${answer}" == "y" || "${answer}" == "Y" ]]
}

pod_name_for() {
  local scenario="$1"
  kubectl_cmd get pods -n "${CHAOS_NAMESPACE}" -l "$(resource_selector "${scenario}")" \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true
}

wait_for_state() {
  local scenario="$1"
  local timeout="${2:-${DEFAULT_TIMEOUT}}"
  local observed=""
  local pod=""
  local attempt=1

  info "Waiting for $(scenario_expected_state "${scenario}")..." >&2
  while (( attempt <= timeout )); do
    case "${scenario}" in
      crashloopbackoff|runtime-error)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
        [[ "${observed}" == "CrashLoopBackOff" ]] && printf '%s\n' "${observed}" && return 0
        ;;
      imagepullbackoff)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
        [[ "${observed}" == "ImagePullBackOff" || "${observed}" == "ErrImagePull" ]] && printf '%s\n' "${observed}" && return 0
        ;;
      oomkilled)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}' 2>/dev/null || true)"
        [[ "${observed}" == "OOMKilled" ]] && printf '%s\n' "${observed}" && return 0
        ;;
      failed-healthcheck)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || true)"
        [[ "${observed}" == "false" ]] && printf '%s\n' "Ready=false" && return 0
        ;;
      missing-configmap|missing-secret)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
        [[ "${observed}" == "CreateContainerConfigError" ]] && printf '%s\n' "${observed}" && return 0
        ;;
      service-no-endpoints)
        observed="$(kubectl_cmd get endpoints opspulse-chaos-service -n "${CHAOS_NAMESPACE}" -o jsonpath='{.subsets}' 2>/dev/null || true)"
        [[ "${observed}" == "" ]] && printf '%s\n' "No endpoints" && return 0
        ;;
      node-affinity|insufficient-resources)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
        [[ "${observed}" == "Pending" ]] && printf '%s\n' "${observed}" && return 0
        ;;
      resource-quota)
        if ! apply_manifest "$(manifest_path "${scenario}")" >/tmp/opspulse-resource-quota.out 2>&1; then
          cat /tmp/opspulse-resource-quota.out
          return 0
        fi
        ;;
      unbound-pvc)
        observed="$(kubectl_cmd get pvc opspulse-chaos-unbound-pvc -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
        [[ "${observed}" == "Pending" ]] && printf '%s\n' "PVC Pending" && return 0
        ;;
      init-container-failure)
        pod="$(pod_name_for "${scenario}")"
        observed="$(kubectl_cmd get pod "${pod}" -n "${CHAOS_NAMESPACE}" -o jsonpath='{.status.initContainerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
        [[ "${observed}" == "CrashLoopBackOff" ]] && printf '%s\n' "${observed}" && return 0
        ;;
    esac

    printf '[%s/%s] Observed state: %s\n' "${attempt}" "${timeout}" "${observed:-waiting}" >&2
    sleep 1
    attempt=$((attempt + 1))
  done

  return 1
}

print_result() {
  local scenario="$1"
  local observed="$2"
  section "INCIDENT REPRODUCED"
  cat <<EOF
Scenario:
$(scenario_title "${scenario}")

Namespace:
${CHAOS_NAMESPACE}

Expected State:
$(scenario_expected_state "${scenario}")

Observed State:
${observed}

Runbook:
$(runbook_path "${scenario}")

Useful diagnostics:

$(print_diagnostics "${scenario}")

Observability:

$(print_observability_guidance)

Cleanup:

./scripts/incidents/cleanup.sh ${scenario}
EOF
}

dry_run() {
  local scenario="$1"
  section "DRY RUN"
  cat <<EOF
Scenario: $(scenario_title "${scenario}")
Manifest: $(manifest_path "${scenario}")
Namespace: ${CHAOS_NAMESPACE}
Expected State: $(scenario_expected_state "${scenario}")
Prometheus Signal: $(scenario_prometheus_signal "${scenario}")
Loki/Event Evidence: $(scenario_loki_signal "${scenario}")
Runbook: $(runbook_path "${scenario}")
Cleanup: ./scripts/incidents/cleanup.sh ${scenario}

No cluster changes were made.
EOF
  if [[ "$(scenario_mode "${scenario}")" != "manual-only" ]]; then
    apply_manifest "$(manifest_path "${scenario}")" --dry-run=client >/dev/null
  fi
}

manual_only() {
  local scenario="$1"
  section "MANUAL-ONLY SCENARIO"
  cat <<EOF
Scenario: $(scenario_title "${scenario}")

This scenario is intentionally manual-only because safely reproducing it would
require changing real node taints or relying on cluster-specific taint state.

No resources were created.

Runbook:
$(runbook_path "${scenario}")

Safe alternative:
Use node-affinity or insufficient-resources to reproduce scheduler failures
without modifying production node taints.
EOF
}

run_scenario() {
  local scenario="$1"
  local observed

  if [[ "$(scenario_mode "${scenario}")" == "manual-only" ]]; then
    manual_only "${scenario}"
    return 0
  fi

  preflight "${scenario}"

  if [[ "${DRY_RUN}" == "true" ]]; then
    dry_run "${scenario}"
    return 0
  fi

  if ! confirm_scenario "${scenario}"; then
    warn "Cancelled."
    exit 1
  fi

  ensure_namespace
  info "Applying scenario manifest: $(manifest_path "${scenario}")"
  if [[ "${scenario}" == "resource-quota" ]]; then
    apply_manifest "$(manifest_path "${scenario}")" >/tmp/opspulse-resource-quota.out 2>&1 || true
  else
    apply_manifest "$(manifest_path "${scenario}")"
  fi

  if observed="$(wait_for_state "${scenario}" "${DEFAULT_TIMEOUT}")"; then
    success "Incident reproduced successfully."
    print_result "${scenario}" "${observed}"
  else
    error "Timed out waiting for expected scenario state."
    kubectl_cmd get all,pvc,events -n "${CHAOS_NAMESPACE}" --sort-by=.metadata.name || true
    printf '\nCleanup:\n./scripts/incidents/cleanup.sh %s\n' "${scenario}"
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list) LIST=true; shift ;;
    --yes|-y) YES=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --cleanup) CLEANUP=true; shift; SCENARIO="${1:-}"; shift || true ;;
    --help|-h) usage; exit 0 ;;
    -*)
      error "Unknown option: $1"
      usage
      exit 1
      ;;
    *)
      SCENARIO="$1"
      shift
      ;;
  esac
done

if [[ "${LIST}" == "true" ]]; then
  list_scenarios
  exit 0
fi

if [[ "${CLEANUP}" == "true" ]]; then
  exec "${SCRIPT_DIR}/cleanup.sh" "${SCENARIO}"
fi

if [[ "${SCENARIO}" == "" ]]; then
  interactive_menu
fi

run_scenario "${SCENARIO}"

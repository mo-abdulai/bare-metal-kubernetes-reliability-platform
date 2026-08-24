#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SCENARIO_DIR="${SCRIPT_DIR}/scenarios"
METADATA_FILE="${SCENARIO_DIR}/metadata.yaml"
CHAOS_NAMESPACE="${OPSPULSE_CHAOS_NAMESPACE:-opspulse-chaos}"
DEFAULT_TIMEOUT="${OPSPULSE_INCIDENT_TIMEOUT:-90}"
OPSPULSE_URL="${OPSPULSE_URL:-}"
GRAFANA_URL="${GRAFANA_URL:-}"

# shellcheck source=output.sh
source "${SCRIPT_DIR}/lib/output.sh"

SCENARIOS=(
  crashloopbackoff
  imagepullbackoff
  oomkilled
  failed-healthcheck
  missing-configmap
  missing-secret
  service-no-endpoints
  node-affinity
  node-taint
  resource-quota
  insufficient-resources
  unbound-pvc
  init-container-failure
  runtime-error
)

AUTOMATIC_SCENARIOS=(
  crashloopbackoff
  imagepullbackoff
  oomkilled
  failed-healthcheck
  missing-configmap
  missing-secret
  service-no-endpoints
  node-affinity
  resource-quota
  insufficient-resources
  unbound-pvc
  init-container-failure
  runtime-error
)

is_scenario() {
  local candidate="$1"
  local scenario
  for scenario in "${SCENARIOS[@]}"; do
    [[ "${candidate}" == "${scenario}" ]] && return 0
  done
  return 1
}

is_automatic_scenario() {
  local candidate="$1"
  local scenario
  for scenario in "${AUTOMATIC_SCENARIOS[@]}"; do
    [[ "${candidate}" == "${scenario}" ]] && return 0
  done
  return 1
}

manifest_path() {
  printf '%s/%s.yaml\n' "${SCENARIO_DIR}" "$1"
}

detect_kubectl() {
  if [[ "${OPSPULSE_KUBECTL:-}" != "" ]]; then
    printf '%s\n' "${OPSPULSE_KUBECTL}"
    return 0
  fi
  if command -v kubectl >/dev/null 2>&1; then
    printf '%s\n' "kubectl"
    return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n k3s kubectl version --client >/dev/null 2>&1; then
    printf '%s\n' "sudo k3s kubectl"
    return 0
  fi
  error "No Kubernetes client found. Set OPSPULSE_KUBECTL or install kubectl."
  return 1
}

KUBECTL_CMD="${KUBECTL_CMD:-$(detect_kubectl)}"

kubectl_cmd() {
  # Intentionally split KUBECTL_CMD so commands like "sudo k3s kubectl" work.
  # shellcheck disable=SC2086
  ${KUBECTL_CMD} "$@"
}

apply_manifest() {
  local manifest="$1"
  shift
  kubectl_cmd apply "$@" -f - < "${manifest}"
}

delete_manifest() {
  local manifest="$1"
  shift
  kubectl_cmd delete "$@" -f - < "${manifest}"
}

metadata_value() {
  local scenario="$1"
  local key="$2"
  awk -v scenario="${scenario}" -v key="${key}" '
    $0 ~ "^" scenario ":" { in_block=1; next }
    in_block && /^[a-z0-9-]+:/ { in_block=0 }
    in_block && $1 == key ":" {
      sub("^[[:space:]]*" key ":[[:space:]]*", "")
      gsub(/^"|"$/, "")
      print
      exit
    }
  ' "${METADATA_FILE}"
}

scenario_title() {
  metadata_value "$1" "title"
}

scenario_runbook() {
  metadata_value "$1" "runbook"
}

scenario_mode() {
  metadata_value "$1" "mode"
}

scenario_expected_state() {
  metadata_value "$1" "expected_state"
}

scenario_cleanup() {
  metadata_value "$1" "cleanup"
}

scenario_prometheus_signal() {
  metadata_value "$1" "prometheus_signal"
}

scenario_loki_signal() {
  metadata_value "$1" "loki_signal"
}

ensure_namespace() {
  kubectl_cmd create namespace "${CHAOS_NAMESPACE}" --dry-run=client -o yaml \
    | kubectl_cmd apply -f -
  kubectl_cmd label namespace "${CHAOS_NAMESPACE}" \
    opspulse.io/incident-test=true \
    opspulse.io/purpose=incident-reproduction \
    --overwrite >/dev/null
}

resource_selector() {
  printf 'opspulse.io/incident-test=true,opspulse.io/scenario=%s' "$1"
}

runbook_path() {
  printf 'runbooks/%s.md' "$(scenario_runbook "$1")"
}

print_diagnostics() {
  local scenario="$1"
  case "${scenario}" in
    service-no-endpoints)
      cat <<EOF
${KUBECTL_CMD} get svc -n ${CHAOS_NAMESPACE}
${KUBECTL_CMD} get endpoints -n ${CHAOS_NAMESPACE}
${KUBECTL_CMD} get endpointslice -n ${CHAOS_NAMESPACE}
${KUBECTL_CMD} get pods --show-labels -n ${CHAOS_NAMESPACE}
EOF
      ;;
    *)
      cat <<EOF
${KUBECTL_CMD} get pods -n ${CHAOS_NAMESPACE}
${KUBECTL_CMD} describe pod -n ${CHAOS_NAMESPACE} -l $(resource_selector "${scenario}")
${KUBECTL_CMD} logs -n ${CHAOS_NAMESPACE} -l $(resource_selector "${scenario}") --all-containers --tail=100
${KUBECTL_CMD} get events -n ${CHAOS_NAMESPACE} --sort-by=.lastTimestamp
EOF
      ;;
  esac
}

print_observability_guidance() {
  cat <<EOF
OpsPulse:
${OPSPULSE_URL:-Open the configured OpsPulse frontend and visit /incidents}

Grafana:
${GRAFANA_URL:-Use Grafana Explore or the OpsPulse dashboards for related metrics and logs.}
EOF
}

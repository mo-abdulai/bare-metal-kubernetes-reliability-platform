SHELL := /bin/zsh

API_DIR := apps/api
WEB_DIR := apps/frontend
API_VENV := $(API_DIR)/.venv
API_PORT ?= 8000
WEB_PORT ?= 3000
OPSPULSE_API_URL ?= http://localhost:$(API_PORT)
OPSPULSE_KUBERNETES_NAMESPACE ?= opspulse
OPSPULSE_KUBECTL ?= ssh mo-abdulai@homepi.local sudo k3s kubectl
OPSPULSE_ENABLE_TUNNELS ?= true
OPSPULSE_SSH_HOST ?= mo-abdulai@homepi.local
INCIDENT_ARGS ?=
PROMETHEUS_PORT ?= 9090
ALERTMANAGER_PORT ?= 9093
LOKI_PORT ?= 3100
PROMETHEUS_URL ?= http://127.0.0.1:$(PROMETHEUS_PORT)
ALERTMANAGER_URL ?= http://127.0.0.1:$(ALERTMANAGER_PORT)
LOKI_URL ?= http://127.0.0.1:$(LOKI_PORT)
IMAGE_REPO ?= <DOCKERHUB_USERNAME>
IMAGE_TAG ?= v0.1.0
API_IMAGE ?= $(IMAGE_REPO)/opspulse-api:$(IMAGE_TAG)
WEB_IMAGE ?= $(IMAGE_REPO)/opspulse-web:$(IMAGE_TAG)
KUBECTL ?= kubectl
LOCAL_KUBECTL ?= kubectl
HELM ?= helm
MONITORING_CHART_VERSION ?= 88.2.0
LOKI_CHART_VERSION ?= 7.3.0
ALLOY_CHART_VERSION ?= 1.11.1

.PHONY: help setup setup-api setup-web start dev api web incident incident-cleanup incident-list gitops-render argocd-install argocd-bootstrap argocd-status test lint build docker-build-api docker-build-web docker-push-api docker-push-web docker-push deploy-namespace deploy-api deploy-web deploy-web-config deploy deploy-monitoring deploy-logging monitoring-status logging-status status clean check-image-repo

help:
	@echo "OpsPulse local development"
	@echo ""
	@echo "Targets:"
	@echo "  make setup      Install backend and frontend dependencies"
	@echo "  make start      Start backend on $(API_PORT) and frontend on $(WEB_PORT)"
	@echo "  make dev        Alias for make start"
	@echo "  make api        Start only the FastAPI backend"
	@echo "  make web        Start only the Next.js frontend"
	@echo "  make incident SCENARIO=crashloopbackoff"
	@echo "  make incident-cleanup SCENARIO=crashloopbackoff"
	@echo "  make gitops-render  Render GitOps Kustomize manifests locally"
	@echo "  make argocd-install Install Argo CD from the official manifest overlay"
	@echo "  make argocd-bootstrap Apply the root Argo CD Application"
	@echo "  make argocd-status  Show Argo CD Applications"
	@echo "  make test       Run backend tests"
	@echo "  make lint       Run frontend lint"
	@echo "  make build      Build the frontend"
	@echo "  make deploy     Deploy namespace, web, API, and service discovery config"
	@echo "  make deploy-monitoring  Install or upgrade the Phase 6 monitoring stack"
	@echo "  make deploy-logging     Install or upgrade the Phase 7 logging stack"
	@echo "  make status     Show OpsPulse Kubernetes resources"
	@echo ""
	@echo "Config overrides:"
	@echo "  API_PORT=8001 WEB_PORT=3001 make start"
	@echo "  OPSPULSE_KUBECTL='kubectl' make start"
	@echo "  OPSPULSE_ENABLE_TUNNELS=false make start"
	@echo "  make incident SCENARIO=crashloopbackoff INCIDENT_ARGS='--dry-run'"
	@echo "  OPSPULSE_KUBECTL='kubectl' make incident SCENARIO=crashloopbackoff"
	@echo "  IMAGE_REPO=<dockerhub-user> IMAGE_TAG=v0.1.1 make docker-push deploy"
	@echo "  KUBECTL='sudo k3s kubectl' IMAGE_REPO=<dockerhub-user> IMAGE_TAG=v0.1.1 make deploy"

setup: setup-api setup-web

setup-api:
	cd $(API_DIR) && python3 -m venv .venv
	cd $(API_DIR) && .venv/bin/pip install -r requirements-dev.txt

setup-web:
	cd $(WEB_DIR) && npm install

start:
	@if [ ! -x "$(API_VENV)/bin/uvicorn" ]; then \
		echo "Backend dependencies are missing. Run: make setup-api"; \
		exit 1; \
	fi
	@if [ ! -d "$(WEB_DIR)/node_modules" ]; then \
		echo "Frontend dependencies are missing. Run: make setup-web"; \
		exit 1; \
	fi
	@echo "Starting OpsPulse API on http://localhost:$(API_PORT)"
	@echo "Starting OpsPulse Web on http://localhost:$(WEB_PORT)"
	@echo "Frontend server will use OPSPULSE_API_URL=$(OPSPULSE_API_URL)"
	@echo "Local API Kubernetes inventory will use OPSPULSE_KUBECTL=$(OPSPULSE_KUBECTL)"
	@TUNNEL_PID=""; \
	if [ "$(OPSPULSE_ENABLE_TUNNELS)" = "true" ]; then \
		echo "Starting local observability tunnels through $(OPSPULSE_SSH_HOST)"; \
		PROMETHEUS_HOST="$$( $(OPSPULSE_KUBECTL) get svc -n monitoring kube-prometheus-stack-prometheus -o jsonpath='{.spec.clusterIP}' )"; \
		ALERTMANAGER_HOST="$$( $(OPSPULSE_KUBECTL) get svc -n monitoring kube-prometheus-stack-alertmanager -o jsonpath='{.spec.clusterIP}' )"; \
		LOKI_HOST="$$( $(OPSPULSE_KUBECTL) get svc -n logging loki-gateway -o jsonpath='{.spec.clusterIP}' )"; \
		ssh -o ExitOnForwardFailure=yes -N \
			-L 127.0.0.1:$(PROMETHEUS_PORT):$$PROMETHEUS_HOST:9090 \
			-L 127.0.0.1:$(ALERTMANAGER_PORT):$$ALERTMANAGER_HOST:9093 \
			-L 127.0.0.1:$(LOKI_PORT):$$LOKI_HOST:80 \
			$(OPSPULSE_SSH_HOST) & \
		TUNNEL_PID=$$!; \
		sleep 1; \
		if ! kill -0 $$TUNNEL_PID 2>/dev/null; then \
			echo "Failed to start observability tunnels."; \
			exit 1; \
		fi; \
		echo "Prometheus tunnel: $(PROMETHEUS_URL)"; \
		echo "Alertmanager tunnel: $(ALERTMANAGER_URL)"; \
		echo "Loki tunnel: $(LOKI_URL)"; \
	fi; \
	(cd $(API_DIR) && \
		PROMETHEUS_URL="$(PROMETHEUS_URL)" \
		ALERTMANAGER_URL="$(ALERTMANAGER_URL)" \
		LOKI_URL="$(LOKI_URL)" \
		OPSPULSE_KUBECTL="$(OPSPULSE_KUBECTL)" \
		OPSPULSE_KUBERNETES_NAMESPACE="$(OPSPULSE_KUBERNETES_NAMESPACE)" \
		exec .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port $(API_PORT)) & \
	API_PID=$$!; \
	trap 'echo ""; echo "Stopping OpsPulse services"; kill $$API_PID 2>/dev/null || true; if [ "$$TUNNEL_PID" != "" ]; then kill $$TUNNEL_PID 2>/dev/null || true; fi' INT TERM EXIT; \
	cd $(WEB_DIR) && OPSPULSE_API_URL=$(OPSPULSE_API_URL) npm run dev -- --hostname 127.0.0.1 --port $(WEB_PORT)

dev: start

api:
	cd $(API_DIR) && OPSPULSE_KUBECTL="$(OPSPULSE_KUBECTL)" OPSPULSE_KUBERNETES_NAMESPACE="$(OPSPULSE_KUBERNETES_NAMESPACE)" .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port $(API_PORT)

web:
	cd $(WEB_DIR) && OPSPULSE_API_URL=$(OPSPULSE_API_URL) npm run dev -- --hostname 127.0.0.1 --port $(WEB_PORT)

incident:
	@if [ "$(SCENARIO)" = "" ]; then \
		echo "Usage: make incident SCENARIO=crashloopbackoff"; \
		exit 1; \
	fi
	OPSPULSE_KUBECTL="$(OPSPULSE_KUBECTL)" OPSPULSE_SSH_HOST="$(OPSPULSE_SSH_HOST)" ./scripts/incidents/incident.sh "$(SCENARIO)" $(INCIDENT_ARGS)

incident-cleanup:
	@if [ "$(SCENARIO)" = "" ]; then \
		echo "Usage: make incident-cleanup SCENARIO=crashloopbackoff"; \
		exit 1; \
	fi
	OPSPULSE_KUBECTL="$(OPSPULSE_KUBECTL)" OPSPULSE_SSH_HOST="$(OPSPULSE_SSH_HOST)" ./scripts/incidents/cleanup.sh "$(SCENARIO)"

incident-list:
	OPSPULSE_KUBECTL="$(OPSPULSE_KUBECTL)" OPSPULSE_SSH_HOST="$(OPSPULSE_SSH_HOST)" ./scripts/incidents/incident.sh --list

gitops-render:
	$(LOCAL_KUBECTL) kustomize gitops/apps/opspulse/overlays/bare-metal >/dev/null
	$(LOCAL_KUBECTL) kustomize gitops/platform/argocd/applications >/dev/null
	$(LOCAL_KUBECTL) kustomize platform/monitoring >/dev/null
	$(LOCAL_KUBECTL) kustomize platform/logging >/dev/null

argocd-install:
	$(LOCAL_KUBECTL) kustomize gitops/platform/argocd/install | $(KUBECTL) apply --server-side --force-conflicts -f -
	$(KUBECTL) rollout status deployment/argocd-server -n argocd
	$(KUBECTL) rollout status deployment/argocd-repo-server -n argocd
	$(KUBECTL) rollout status deployment/argocd-redis -n argocd
	$(KUBECTL) rollout status statefulset/argocd-application-controller -n argocd

argocd-bootstrap:
	$(KUBECTL) apply -f - < gitops/bootstrap/root-application.yaml
	$(KUBECTL) get applications -n argocd

argocd-status:
	$(KUBECTL) get applications -n argocd
	$(KUBECTL) get pods -n argocd -o wide

test:
	cd $(API_DIR) && .venv/bin/pytest

lint:
	cd $(WEB_DIR) && npm run lint

build:
	cd $(WEB_DIR) && npm run build

check-image-repo:
	@if [ "$(IMAGE_REPO)" = "<DOCKERHUB_USERNAME>" ]; then \
		echo "Set IMAGE_REPO before deploying. Example: IMAGE_REPO=mydockerhubuser make deploy"; \
		exit 1; \
	fi

docker-build-api: check-image-repo
	docker buildx build --platform linux/arm64 -f $(API_DIR)/Dockerfile -t $(API_IMAGE) .

docker-build-web: check-image-repo
	docker buildx build --platform linux/arm64 -t $(WEB_IMAGE) $(WEB_DIR)

docker-push-api: check-image-repo
	docker buildx build --platform linux/arm64 -f $(API_DIR)/Dockerfile -t $(API_IMAGE) --push .

docker-push-web: check-image-repo
	docker buildx build --platform linux/arm64 -t $(WEB_IMAGE) --push $(WEB_DIR)

docker-push: docker-push-api docker-push-web

deploy-namespace:
	$(KUBECTL) apply -f apps/frontend/k8s/namespace.yaml

deploy-api: check-image-repo deploy-namespace
	$(KUBECTL) apply -f apps/api/k8s/rbac.yaml
	$(KUBECTL) apply -f apps/api/k8s/configmap.yaml
	sed 's|<DOCKERHUB_USERNAME>/opspulse-api:v0.1.0|$(API_IMAGE)|g' apps/api/k8s/deployment.yaml | $(KUBECTL) apply -f -
	$(KUBECTL) apply -f apps/api/k8s/service.yaml
	$(KUBECTL) rollout status deployment/opspulse-api -n opspulse

deploy-web: check-image-repo deploy-namespace
	$(KUBECTL) apply -f apps/frontend/k8s/configmap.yaml
	sed 's|<DOCKERHUB_USERNAME>/opspulse-web:v0.1.0|$(WEB_IMAGE)|g' apps/frontend/k8s/deployment.yaml | $(KUBECTL) apply -f -
	$(KUBECTL) apply -f apps/frontend/k8s/service.yaml
	$(KUBECTL) rollout status deployment/opspulse-web -n opspulse

deploy-web-config:
	$(KUBECTL) apply -f apps/frontend/k8s/configmap.yaml
	@if $(KUBECTL) get deployment/opspulse-web -n opspulse >/dev/null 2>&1; then \
		$(KUBECTL) rollout restart deployment/opspulse-web -n opspulse; \
		$(KUBECTL) rollout status deployment/opspulse-web -n opspulse; \
	fi

deploy: deploy-api deploy-web status

deploy-monitoring:
	$(KUBECTL) apply -f platform/monitoring/namespace.yaml
	$(HELM) repo add prometheus-community https://prometheus-community.github.io/helm-charts
	$(HELM) repo add grafana https://grafana.github.io/helm-charts
	$(HELM) repo update
	$(HELM) upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
		--version $(MONITORING_CHART_VERSION) \
		--namespace monitoring \
		--create-namespace \
		--values platform/monitoring/values.yaml
	$(KUBECTL) apply -f platform/monitoring/servicemonitor-opspulse-api.yaml
	$(KUBECTL) apply -f platform/monitoring/rules/opspulse-alerts.yaml
	$(KUBECTL) apply -f platform/monitoring/dashboards/opspulse-operations-dashboard.yaml
	$(KUBECTL) rollout status deployment/kube-prometheus-stack-operator -n monitoring
	$(KUBECTL) rollout status deployment/kube-prometheus-stack-grafana -n monitoring
	$(KUBECTL) rollout status deployment/kube-prometheus-stack-kube-state-metrics -n monitoring
	$(KUBECTL) rollout status daemonset/kube-prometheus-stack-prometheus-node-exporter -n monitoring
	$(KUBECTL) rollout status statefulset/alertmanager-kube-prometheus-stack-alertmanager -n monitoring
	$(KUBECTL) rollout status statefulset/prometheus-kube-prometheus-stack-prometheus -n monitoring
	$(MAKE) monitoring-status

deploy-logging:
	$(KUBECTL) apply -f platform/logging/namespace.yaml
	$(HELM) repo add grafana https://grafana.github.io/helm-charts
	$(HELM) repo update
	$(HELM) upgrade --install loki grafana/loki \
		--version $(LOKI_CHART_VERSION) \
		--namespace logging \
		--values platform/logging/loki-values.yaml
	$(HELM) upgrade --install alloy grafana/alloy \
		--version $(ALLOY_CHART_VERSION) \
		--namespace logging \
		--values platform/logging/alloy-values.yaml
	$(KUBECTL) apply -f platform/logging/loki-datasource.yaml
	$(KUBECTL) apply -f platform/logging/dashboards/opspulse-logs-events-dashboard.yaml
	$(KUBECTL) rollout status statefulset/loki -n logging
	$(KUBECTL) rollout status deployment/alloy -n logging
	$(MAKE) logging-status

monitoring-status:
	$(KUBECTL) get pods -n monitoring -o wide
	$(KUBECTL) get svc -n monitoring
	$(KUBECTL) get deployments -n monitoring
	$(KUBECTL) get daemonsets -n monitoring
	$(KUBECTL) get statefulsets -n monitoring

logging-status:
	$(KUBECTL) get pods -n logging -o wide
	$(KUBECTL) get svc -n logging
	$(KUBECTL) get deployments -n logging
	$(KUBECTL) get statefulsets -n logging
	$(KUBECTL) get pvc -n logging

status:
	$(KUBECTL) get deployments -n opspulse
	$(KUBECTL) get pods -n opspulse -o wide
	$(KUBECTL) get svc -n opspulse
	$(KUBECTL) get endpoints -n opspulse

clean:
	rm -rf $(API_DIR)/.pytest_cache
	find $(API_DIR) -type d -name __pycache__ -prune -exec rm -rf {} +

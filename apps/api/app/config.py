from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OpsPulse API"
    app_version: str = "0.1.0"
    environment: str = "local"
    platform_name: str = "Bare-Metal Kubernetes Reliability & Operations Platform"
    service_name: str = "opspulse-api"
    orchestrator: str = "K3s"
    architecture: str = "ARM64"
    prometheus_url: str = "http://kube-prometheus-stack-prometheus.monitoring.svc:9090"
    alertmanager_url: str = "http://kube-prometheus-stack-alertmanager.monitoring.svc:9093"
    loki_url: str = "http://loki-gateway.logging.svc"
    incident_data_dir: str = "data/incidents"
    runbook_dir: str = "runbooks"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

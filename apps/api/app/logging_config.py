import logging

from app.config import get_settings


class ServiceLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        settings = get_settings()
        timestamp = self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z")
        message = record.getMessage()
        return f"timestamp={timestamp} level={record.levelname} service={settings.service_name} message={message}"


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(ServiceLogFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

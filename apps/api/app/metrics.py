import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware

REQUEST_COUNT = Counter(
    "opspulse_api_http_requests_total",
    "Total HTTP requests handled by the OpsPulse API.",
    ["method", "route", "status_code"],
)
REQUEST_DURATION = Histogram(
    "opspulse_api_http_request_duration_seconds",
    "HTTP request duration in seconds for the OpsPulse API.",
    ["method", "route", "status_code"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)
IN_PROGRESS = Gauge(
    "opspulse_api_http_requests_in_progress",
    "HTTP requests currently in progress for the OpsPulse API.",
    ["method", "route"],
)


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    if isinstance(path, str):
        return path
    return request.url.path


class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        route = request.url.path
        start = time.perf_counter()
        IN_PROGRESS.labels(method=method, route=route).inc()

        try:
            response = await call_next(request)
            status_code = str(response.status_code)
            return response
        except Exception:
            status_code = "500"
            raise
        finally:
            route = _route_template(request)
            elapsed = time.perf_counter() - start
            IN_PROGRESS.labels(method=method, route=request.url.path).dec()
            REQUEST_COUNT.labels(method=method, route=route, status_code=status_code).inc()
            REQUEST_DURATION.labels(method=method, route=route, status_code=status_code).observe(elapsed)


def metrics_response() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

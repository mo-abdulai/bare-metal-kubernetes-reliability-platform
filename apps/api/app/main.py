import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.logging_config import configure_logging
from app.metrics import PrometheusMetricsMiddleware, metrics_response
from app.routes import cluster, health, incidents, logs, metrics as metrics_routes, status
from app.schemas.status import RootResponse

configure_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("OpsPulse API startup environment=%s version=%s", settings.environment, settings.app_version)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Internal API for OpsPulse platform metadata and future operations data.",
    lifespan=lifespan,
)
app.add_middleware(PrometheusMetricsMiddleware)


@app.get("/", response_model=RootResponse, tags=["identity"])
def root() -> RootResponse:
    return RootResponse(service=settings.service_name, docs="/docs", health="/health")


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    return metrics_response()


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, _exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": "Request validation failed."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request failure path=%s error=%s", request.url.path, exc.__class__.__name__)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


app.include_router(health.router)
app.include_router(status.router)
app.include_router(cluster.router)
app.include_router(metrics_routes.router)
app.include_router(logs.router)
app.include_router(incidents.router)

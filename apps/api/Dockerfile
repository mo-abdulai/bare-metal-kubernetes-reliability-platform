FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_NAME="OpsPulse API"
ENV APP_VERSION="0.1.0"
ENV ENVIRONMENT="bare-metal"
ENV PLATFORM_NAME="Bare-Metal Kubernetes Reliability & Operations Platform"
ENV INCIDENT_DATA_DIR="/app/data/incidents"
ENV RUNBOOK_DIR="/app/runbooks"

WORKDIR /app

RUN addgroup --system --gid 1001 opspulse && adduser --system --uid 1001 --ingroup opspulse opspulse

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY apps/api/app ./app
COPY --chown=opspulse:opspulse data ./data
COPY runbooks ./runbooks
RUN chown -R opspulse:opspulse /app/data

USER opspulse
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

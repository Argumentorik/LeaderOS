# leadercheck/backend/Dockerfile — Leader-Check FastAPI backend for Railway
#
# Build context is leadercheck/backend (rootDirectory in .railway/railway.ts).
# Code paths are relative (services/pdf_report.py → ../assets), so no /app
# layout tricks are needed here.

FROM python:3.11-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /tmp/requirements.txt


FROM python:3.11-slim-bookworm

COPY --from=builder /install /usr/local

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY . /app
WORKDIR /app

EXPOSE 8001
# --host "" binds IPv4 and IPv6 (see backend/Dockerfile). One worker: the email
# scheduler and Stripe self-healing loop run in-process and must not duplicate.
CMD ["sh", "-c", "exec uvicorn server:app --host '' --port ${PORT:-8001} --workers 1"]

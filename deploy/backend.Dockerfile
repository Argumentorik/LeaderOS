# backend/Dockerfile — LeaderOS FastAPI backend
# Slim Python 3.11 + ffmpeg (needed for the LEADER-OS-8 audio extraction fix option B)
# Multi-stage build keeps the final image small (~250MB)

FROM python:3.11-slim AS builder

WORKDIR /app

# System deps for building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ─── Runtime stage ────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Runtime deps — ffmpeg for audio extraction, curl for healthcheck debug
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure the installed binaries are on PATH
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# App code
COPY . .

# Non-root user for safety
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck — Fly.io will also hit /health via http_service.checks,
# this is the container-level fallback
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

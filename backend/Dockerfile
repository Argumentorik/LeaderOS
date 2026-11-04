# backend/Dockerfile — LeaderOS FastAPI backend for Railway
#
# Build context is the REPO ROOT (see .railway/railway.ts), so the image can mirror
# Emergent's /app layout: code in /app/backend, plus the one frontend asset the
# backend reads (services_video_compose.LOGO_PATH). routes/og.py also expects
# /app/backend/assets/fonts — keeping this layout means no path changes.

FROM python:3.11-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
# emergentintegrations is not on PyPI — it comes from Emergent's package index.
# Drop the extra index once the LLM decoupling (plan Phase 5) removes the package.
RUN pip install --no-cache-dir --prefix=/install \
        --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ \
        -r /tmp/requirements.txt


FROM python:3.11-slim-bookworm

ARG MONGO_TOOLS_VERSION=100.10.0

# ffmpeg: video/audio pipelines · libcairo2: CairoSVG · espeak-ng: listed in
# .emergent/system_deps.txt · curl: healthcheck + tools download
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        ca-certificates \
        libcairo2 \
        espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# mongodump/mongorestore so GET /api/admin/backup/database produces a restorable
# archive instead of the Extended-JSON fallback.
RUN curl -fsSL "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-${MONGO_TOOLS_VERSION}.tgz" \
        | tar -xz -C /tmp \
    && mv /tmp/mongodb-database-tools-*/bin/* /usr/local/bin/ \
    && rm -rf /tmp/mongodb-database-tools-*

COPY --from=builder /install /usr/local

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FASTEMBED_CACHE_PATH=/app/models

# Prefetch the RAG embedding model so cold starts don't download it.
# Must match services_embeddings.EMBED_MODEL_NAME.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

COPY frontend/public/icon-512.png /app/frontend/public/icon-512.png
COPY backend/ /app/backend/

WORKDIR /app/backend

# Runs as root: Railway volumes mount root-owned, and the guide media cache /
# chunked uploads live on the volume via TMPDIR (plan Phase 1c).
EXPOSE 8001
CMD ["sh", "-c", "mkdir -p \"${TMPDIR:-/tmp}\" && exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1"]

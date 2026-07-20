"""Local embedding service — replaces Voyage AI (Iter 116, Mert: "RAG ohne Voyage").

Model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384-dim)
served in-process via fastembed/ONNX. No API keys, no rate limits, no external
dependency — embeddings are generated on the backend CPU in <50ms per query.
"""
from __future__ import annotations

import asyncio
import logging
import threading
import time

logger = logging.getLogger("leaderos.embeddings")

EMBED_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

_model = None
_model_lock = threading.Lock()


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from fastembed import TextEmbedding
                t = time.time()
                m = TextEmbedding(EMBED_MODEL_NAME)
                logger.info("Embeddings: %s loaded in %.1fs", EMBED_MODEL_NAME, time.time() - t)
                _model = m
    return _model


def model_loaded() -> bool:
    return _model is not None


def _embed_sync(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    return [v.tolist() for v in model.embed(texts)]


async def embed_query(text: str) -> list[float] | None:
    """Embed a single user query. Returns None on failure — chat never breaks."""
    try:
        res = await asyncio.to_thread(_embed_sync, [text[:8000]])
        return res[0]
    except Exception as e:
        logger.error("Embeddings: query embed failed: %s", e)
        return None


async def embed_documents(texts: list[str]) -> list[list[float]]:
    return await asyncio.to_thread(_embed_sync, texts)


async def preload() -> None:
    """Warm the ONNX model at startup so the first user query is instant."""
    try:
        await asyncio.to_thread(_get_model)
    except Exception as e:
        logger.error("Embeddings: preload failed: %s", e)

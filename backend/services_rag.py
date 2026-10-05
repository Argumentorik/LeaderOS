"""WladBot RAG — HYBRID retrieval (semantic + lexical) over Supabase.

Architecture:
  1. User query → run two retrievers concurrently:
       a) SEMANTIC  — Voyage `voyage-3` embedding → `match_wladbot_documents`
          (pgvector cosine) — captures meaning / paraphrase.
       b) LEXICAL   — `match_wladbot_lexical` (Postgres German full-text, GIN)
          — captures exact terms (framework names: ALPEN, SEXIER, 4-Farben) and
          needs NO external API.
  2. Fuse the two ranked lists with Reciprocal Rank Fusion (rank-based, so the
     cosine-vs-ts_rank scale mismatch doesn't matter) → top-K chunks.
  3. Inject top chunks into the WladBot system prompt.
  4. GPT-5.2 answers using Wlad's actual content, not just base knowledge.

Why hybrid: pure vector silently missed exact framework names; pure lexical
misses paraphrase. Together they cover each other — and lexical keeps RAG alive
through a Voyage rate-limit (the common 429), instead of returning zero context.

Graceful degradation (chat NEVER breaks because of RAG):
  - Voyage down/rate-limited → lexical-only retrieval
  - Lexical RPC fails        → vector-only retrieval
  - Supabase keys missing    → no retrieval, base prompt
  Every failure path logs a warning.

Cache: in-memory LRU keyed by query text (30min TTL) — saves a round-trip
on repeat questions.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

import httpx

logger = logging.getLogger("leader-os.rag")

VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
# IMPORTANT: must match the model used to embed `wladbot_documents` (voyage-3, dim=1024).
# Using voyage-3-large here would give ~0.07 similarity (model mismatch).
VOYAGE_MODEL = "voyage-3"
EMBEDDING_DIM = 1024

# RAG tuning
# Voyage-3 cosine similarities for in-domain queries cluster between 0.25 and
# 0.45 (empirically measured against the 609-chunk Wlad corpus). The previous
# 0.60 threshold filtered EVERYTHING out — RAG looked configured but returned
# zero context. Iter 92.6 lowered to 0.25 to actually surface relevant chunks.
MATCH_THRESHOLD = float(os.environ.get("RAG_MATCH_THRESHOLD", "0.25"))
# Bumped 6 → 8 after hybrid retrieval went live (#53): RRF works better with a
# slightly wider context pool, and the corpus is now 2212 chunks (up from
# 1605 after #56), so the LLM benefits from cross-source weaving (book + course
# transcript + framework spec on the same topic).
MATCH_COUNT = int(os.environ.get("RAG_MATCH_COUNT", "8"))              # top-K chunks
# Hybrid retrieval: over-fetch from EACH retriever (vector + lexical), then fuse
# down to MATCH_COUNT via Reciprocal Rank Fusion. Over-fetching gives RRF enough
# candidates to reward chunks that BOTH retrievers surface.
MATCH_OVERFETCH = int(os.environ.get("RAG_MATCH_OVERFETCH", "12"))
RRF_K = 60                   # standard RRF damping constant (Cormack et al. 2009)
MAX_CONTEXT_CHARS = 14000    # Iter 92.23.5: bumped 4k → 14k to fit the new long course transcripts (avg 4000 chars/chunk × 3-4 chunks fits comfortably in GPT-5.2 context).
CACHE_TTL_SECONDS = 1800     # in-memory cache, 30min — covers chatty sessions
CACHE_MAX_ENTRIES = 1024

# In-memory cache  → { query_text: (timestamp, chunks_list) }
_query_cache: dict[str, tuple[float, list[dict]]] = {}


def _is_configured() -> bool:
    """RAG needs Supabase only. The corpus (`wladbot_documents`, 2 212 chunks)
    and the German full-text index live there; the lexical retriever needs no
    external API. `VOYAGE_API_KEY` only adds the semantic (vector) retriever —
    without it `_embed_query` returns None and retrieval runs lexical-only,
    exactly as the degradation path in the module docstring promises. Before
    this change a missing Voyage key switched RAG off entirely."""
    return bool(os.environ.get("SUPABASE_URL")) and bool(os.environ.get("SUPABASE_SERVICE_KEY"))


def embedding_provider() -> str:
    """'voyage' when the semantic retriever is active, else 'none' (lexical-only)."""
    return "voyage" if os.environ.get("VOYAGE_API_KEY") else "none"


async def _embed_query(query: str) -> list[float] | None:
    """Get the Voyage embedding for a user query. Returns None on any failure.

    Iter 92.23.4 (Mert: "RAG must hit on every Wlad-query in production"):
    Voyage's free-tier rate limit is 3 RPM — a chatty user triggers HTTP 429.
    We now retry with exponential backoff (0.5s → 1.5s → 3s) and respect any
    `Retry-After` header the API provides. This turns a hard fail into a
    transparent latency bump.
    """
    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        return None
    last_err: str | None = None
    for attempt in range(4):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    VOYAGE_API_URL,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "input": [query[:8000]],
                        "model": VOYAGE_MODEL,
                        "input_type": "query",
                    },
                )
                if r.status_code == 200:
                    if attempt > 0:
                        logger.info("RAG: Voyage recovered after %d retries", attempt)
                    return r.json()["data"][0]["embedding"]
                if r.status_code == 429:
                    # Honour server's Retry-After if provided, else exponential backoff
                    retry_after = r.headers.get("Retry-After")
                    if retry_after and retry_after.isdigit():
                        wait = min(float(retry_after), 5.0)
                    else:
                        wait = 0.5 + (attempt * 1.0)  # 0.5, 1.5, 2.5, 3.5
                    logger.warning("RAG: Voyage 429 (attempt %d/4) — sleeping %.1fs", attempt + 1, wait)
                    await asyncio.sleep(wait)
                    last_err = "rate_limit_429"
                    continue
                # 4xx other than 429 = unrecoverable
                if 400 <= r.status_code < 500:
                    logger.error("RAG: Voyage HTTP %d (not retryable): %s", r.status_code, r.text[:200])
                    return None
                # 5xx — retry
                last_err = f"HTTP {r.status_code}"
                await asyncio.sleep(0.5 * (attempt + 1))
        except Exception as e:
            last_err = str(e)
            logger.warning("RAG: Voyage network error (attempt %d/4): %s", attempt + 1, e)
            await asyncio.sleep(0.5 * (attempt + 1))
    logger.warning("RAG: Voyage embedding failed after 4 attempts: %s", last_err)
    return None


async def _match_documents(embedding: list[float], match_count: int = MATCH_COUNT) -> list[dict]:
    """Call Supabase RPC `match_documents` to find similar chunks.

    The RPC must accept: query_embedding (vector), match_threshold (float),
    match_count (int). Returns list of {id, content, similarity, metadata?}.

    Workaround: the deployed `match_wladbot_documents` RPC currently returns
    metadata=NULL even though the underlying column is populated. When this
    happens we backfill the metadata via a second batch read of the table.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        logger.error("RAG: SUPABASE_URL or SUPABASE_SERVICE_KEY missing — skipping retrieval")
        return []
    # Iter 92.16: retry-with-backoff on PGRST002 (Supabase schema cache transient).
    # Mert reported live "Could not query database for schema cache" → instead of
    # silently returning [], retry twice with backoff so transient blips self-heal.
    last_err: str | None = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                r = await client.post(
                    f"{url}/rest/v1/rpc/match_wladbot_documents",
                    headers={
                        "apikey": key,
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "query_embedding": embedding,
                        "match_threshold": MATCH_THRESHOLD,
                        "match_count": match_count,
                    },
                )
                if r.status_code == 200:
                    data = r.json()
                    chunks = data if isinstance(data, list) else []
                    if attempt > 0:
                        logger.info("RAG: recovered after %d retries", attempt)
                    # Backfill missing metadata (RPC bug → metadata is None on every row)
                    missing_ids = [c["id"] for c in chunks if c.get("metadata") in (None, {})]
                    if missing_ids:
                        await _backfill_metadata(client, url, key, chunks, missing_ids)
                    return chunks
                last_err = f"HTTP {r.status_code}: {r.text[:200]}"
                # PGRST002 = schema cache; retry. Anything else = unrecoverable.
                if "PGRST002" not in (r.text or ""):
                    logger.error("RAG: Supabase match_documents %s — not retryable", last_err)
                    return []
                logger.warning("RAG: PGRST002 schema-cache error (attempt %d/3) — retrying", attempt + 1)
                await asyncio.sleep(0.8 * (attempt + 1))
        except Exception as e:
            last_err = str(e)
            logger.warning("RAG: match_documents network error (attempt %d/3): %s", attempt + 1, e)
            await asyncio.sleep(0.5 * (attempt + 1))
    logger.error("RAG: match_documents FAILED after 3 attempts — last error: %s", last_err)
    return []


async def _backfill_metadata(client, url: str, key: str,
                              chunks: list[dict], missing_ids: list[str]) -> None:
    """Fetch metadata for chunk IDs the RPC didn't populate, merge in place."""
    if not missing_ids:
        return
    # PostgREST `in.(a,b,c)` filter — UUIDs are safe
    in_clause = ",".join(missing_ids)
    try:
        r = await client.get(
            f"{url}/rest/v1/wladbot_documents?id=in.({in_clause})&select=id,metadata",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        if r.status_code != 200:
            return
        meta_by_id = {row["id"]: row.get("metadata") for row in r.json() if row.get("id")}
        for chunk in chunks:
            if chunk.get("metadata") in (None, {}):
                m = meta_by_id.get(chunk["id"])
                if m:
                    chunk["metadata"] = m
    except Exception as e:
        logger.debug("RAG: metadata backfill failed (non-fatal): %s", e)


async def _match_lexical(query_text: str, match_count: int = MATCH_OVERFETCH) -> list[dict]:
    """Lexical retrieval via the `match_wladbot_lexical` RPC (German full-text).

    Needs NO external embedding API — this is the path that keeps RAG alive when
    Voyage rate-limits, and the one that reliably catches exact framework names
    (ALPEN, SEXIER, 4-Farben) that semantic search can blur. Returns the same
    {id, content, similarity, metadata} shape as the vector retriever so the two
    lists fuse cleanly. Never raises — failure → empty list.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        return []
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(
                f"{url}/rest/v1/rpc/match_wladbot_lexical",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={"query_text": query_text[:1000], "match_count": match_count},
            )
            if r.status_code != 200:
                logger.warning("RAG: lexical match HTTP %s — %s", r.status_code, r.text[:160])
                return []
            data = r.json()
            return data if isinstance(data, list) else []
    except Exception as e:
        logger.warning("RAG: lexical match failed (non-fatal): %s", e)
        return []


def _rrf_fuse(vector_hits: list[dict], lexical_hits: list[dict],
              top_k: int = MATCH_COUNT) -> list[dict]:
    """Reciprocal Rank Fusion of two ranked lists, deduped by chunk id.

    RRF score for a doc = Σ 1 / (RRF_K + rank) across the lists it appears in
    (rank is 1-based). It uses only RANK, not raw scores, so the cosine-vs-ts_rank
    scale mismatch is irrelevant — and a chunk that BOTH retrievers surface rises
    to the top. Chunks carry a `retrievers` tag for observability.
    """
    fused: dict[str, dict] = {}
    for source, hits in (("vector", vector_hits), ("lexical", lexical_hits)):
        for rank, hit in enumerate(hits, start=1):
            doc_id = hit.get("id")
            if not doc_id:
                continue
            entry = fused.get(doc_id)
            if entry is None:
                entry = {**hit, "rrf_score": 0.0, "retrievers": []}
                fused[doc_id] = entry
            entry["rrf_score"] += 1.0 / (RRF_K + rank)
            entry["retrievers"].append(source)
            # Keep the strongest cosine similarity we've seen for display.
            if source == "vector":
                entry["similarity"] = hit.get("similarity", entry.get("similarity", 0))
    ranked = sorted(fused.values(), key=lambda d: d["rrf_score"], reverse=True)
    return ranked[:top_k]


def _format_chunks_for_prompt(chunks: list[dict]) -> str:
    """Format retrieved chunks into a single context block for the system prompt.

    Iter 92.23.5 (Mert 1605-chunk audit): if even the first chunk exceeds the
    budget, we truncate it instead of returning empty — Wlad's new course
    transcripts are 4kB each, and dropping all of them silently is much worse
    than feeding a slightly-clipped first chunk. The budget itself was also
    bumped (4k → 14k) so the common case is 3-4 full chunks injected.
    """
    if not chunks:
        return ""
    lines = []
    total = 0
    for i, c in enumerate(chunks, 1):
        content = (c.get("content") or "").strip()
        if not content:
            continue
        header = f"[Quelle {i} · Relevanz {c.get('similarity', 0):.2f}]\n"
        budget_left = MAX_CONTEXT_CHARS - total - len(header)
        if budget_left <= 200:
            # No room for even a meaningful excerpt — stop appending
            break
        if len(content) > budget_left:
            # Truncate the chunk to fit; better than dropping it entirely
            content = content[:budget_left].rsplit(" ", 1)[0] + " […]"
        snippet = header + content
        lines.append(snippet)
        total += len(snippet)
    if not lines:
        return ""
    return (
        "\n\n=== WLAD-WISSEN (Auszüge aus den Original-Materialien — nutze diese als Wahrheits-Grundlage) ===\n"
        + "\n\n---\n\n".join(lines)
        + "\n=== ENDE WLAD-WISSEN ===\n"
    )


def _cache_get(query: str) -> list[dict] | None:
    rec = _query_cache.get(query)
    if not rec:
        return None
    ts, chunks = rec
    if time.time() - ts > CACHE_TTL_SECONDS:
        _query_cache.pop(query, None)
        return None
    return chunks


def _cache_put(query: str, chunks: list[dict]) -> None:
    if len(_query_cache) >= CACHE_MAX_ENTRIES:
        # Evict oldest 25% to keep things fresh & memory bounded
        sorted_keys = sorted(_query_cache, key=lambda k: _query_cache[k][0])
        for k in sorted_keys[: len(sorted_keys) // 4]:
            _query_cache.pop(k, None)
    _query_cache[query] = (time.time(), chunks)


async def retrieve_context(query: str) -> dict[str, Any]:
    """Top-level entry point. Returns:

        {
          "context_block": str,        # ready to append to system prompt (empty if no RAG)
          "chunks_count": int,         # 0 if no retrieval happened
          "rag_active": bool,          # True only if at least 1 chunk was injected
        }

    Caller is expected to do:
        ctx = await retrieve_context(user_message)
        system_prompt = BASE_SYSTEM + ctx["context_block"]
    """
    empty = {"context_block": "", "chunks_count": 0, "rag_active": False}
    if not query or len(query.strip()) < 3:
        return empty
    if not _is_configured():
        # Silent — this is the expected state before keys are configured.
        return empty

    # Cache check
    cached = _cache_get(query)
    if cached is not None:
        ctx_block = _format_chunks_for_prompt(cached)
        return {"context_block": ctx_block, "chunks_count": len(cached), "rag_active": bool(ctx_block)}

    # Hybrid retrieval — run the semantic (vector) and lexical (full-text) paths
    # concurrently, then fuse by Reciprocal Rank Fusion. Either path failing is
    # survivable: lexical covers a Voyage outage, vector covers a lexical miss.
    embedding = await _embed_query(query)
    vector_task = _match_documents(embedding, MATCH_OVERFETCH) if embedding else _noop_hits()
    lexical_task = _match_lexical(query, MATCH_OVERFETCH)
    vector_hits, lexical_hits = await asyncio.gather(vector_task, lexical_task)

    if vector_hits and lexical_hits:
        chunks = _rrf_fuse(vector_hits, lexical_hits, MATCH_COUNT)
        mode = "hybrid"
    else:
        # One retriever returned nothing — use whichever has results, trimmed to K.
        chunks = (vector_hits or lexical_hits)[:MATCH_COUNT]
        mode = "vector_only" if vector_hits else ("lexical_only" if lexical_hits else "none")

    _cache_put(query, chunks)
    ctx_block = _format_chunks_for_prompt(chunks)
    if ctx_block:
        logger.info("RAG: injected %d chunks (%s) for query (len=%d)", len(chunks), mode, len(query))
    return {"context_block": ctx_block, "chunks_count": len(chunks), "rag_active": bool(ctx_block)}


async def _noop_hits() -> list[dict]:
    """Awaitable that yields no hits — lets gather() run when Voyage is down."""
    return []


def rag_status() -> dict[str, Any]:
    """Health-check for /api/health or admin dashboards."""
    return {
        "configured": _is_configured(),
        "embedding_provider": embedding_provider(),
        "voyage_key_set": bool(os.environ.get("VOYAGE_API_KEY")),
        "supabase_key_set": bool(os.environ.get("SUPABASE_SERVICE_KEY")),
        "supabase_url_set": bool(os.environ.get("SUPABASE_URL")),
        "cache_size": len(_query_cache),
        "model": VOYAGE_MODEL,
        "dim": EMBEDDING_DIM,
        "retrieval": "hybrid (vector + lexical RRF)",
        "match_threshold": MATCH_THRESHOLD,
        "match_count": MATCH_COUNT,
        "match_overfetch": MATCH_OVERFETCH,
    }

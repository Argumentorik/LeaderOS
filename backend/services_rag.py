"""WladBot RAG — retrieval-augmented generation with LOCAL embeddings (Iter 116).

Architecture:
  1. User query → local multilingual MiniLM embedding (384-dim, in-process, no API)
  2. Cosine match against MongoDB `rag_chunks` (in-memory numpy matrix, <50ms)
  3. Parallel keyword scan + Reciprocal Rank Fusion for proper-noun frameworks
  4. Inject top chunks as additional context into the WladBot system prompt

Graceful degradation:
  - Embedding model fails to load → keyword retrieval still works
  - Empty/low-quality match       → no retrieval, chat still works with base prompt

  Every failure path logs a warning. Chat NEVER breaks because of RAG.

Cache: in-memory LRU keyed by query text (30min TTL).
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

logger = logging.getLogger("leaderos.rag")

# RAG tuning
# Multilingual-MiniLM cosine similarities for in-domain German queries cluster
# between 0.45 and 0.75 against the Wlad corpus; off-domain stays ≤0.47.
# 0.40 = recall-first (Mert: "alle Chunks müssen greifen"), top-K caps precision.
MATCH_THRESHOLD = float(os.environ.get("RAG_MATCH_THRESHOLD", "0.40"))
MATCH_COUNT = int(os.environ.get("RAG_MATCH_COUNT", "6"))              # top-K chunks
MAX_CONTEXT_CHARS = 20000    # Iter 115: bumped 14k → 20k (Tester: "RAG retrieves less than 1.0") — more fused chunks reach the model.
CACHE_TTL_SECONDS = 1800     # in-memory cache, 30min — covers chatty sessions
CACHE_MAX_ENTRIES = 1024

# In-memory cache  → { query_text: (timestamp, chunks_list) }
_query_cache: dict[str, tuple[float, list[dict]]] = {}


# ── Manual high-priority knowledge chunks (Iter 92.35, Mert P1) ──────────────
# Deterministic keyword-triggered chunks that are injected ALONGSIDE the
# vector retrieval. Use this when a framework is too important to
# rely on semantic search alone (e.g. core Wlad models that must always be
# grounded verbatim). Each entry: {keywords, content, metadata}.
MANUAL_CHUNKS: list[dict] = [
    {
        "keywords": ["zuhören", "zuhoeren", "zuhoren", "listening", "10 stufen", "zehn stufen", "stufen des zuhörens", "stages of listening", "aktives zuhören", "empathisches zuhören"],
        "metadata": {
            "course": "Wlad Leadership Frameworks",
            "topic": "10 Stufen des Zuhörens",
            "framework": "listening_10_stages",
            "source": "manual_chunk",
        },
        "content": (
            "10 Stufen des Zuhörens (Wlad Jachtchenko) — vom oberflächlichen Hören zum tiefen, transformativen Zuhören:\n\n"
            "Stufe 1 – Ignorieren: Der Sprecher wird wahrgenommen, aber die Botschaft nicht aufgenommen. Die Aufmerksamkeit ist woanders.\n"
            "Stufe 2 – Pseudo-Zuhören: Man tut so, als würde man zuhören (Nicken, 'mhm'), die Botschaft erreicht aber nicht das Bewusstsein.\n"
            "Stufe 3 – Selektives Zuhören: Man pickt nur Teile heraus, die zum eigenen Weltbild oder zur eigenen Agenda passen.\n"
            "Stufe 4 – Aufmerksames Zuhören: Man hört die Worte, fokussiert auf die Sachebene, aber bewertet noch im Stillen.\n"
            "Stufe 5 – Aktives Zuhören: Man stellt klärende Rückfragen, paraphrasiert und spiegelt — der Sprecher fühlt sich gehört.\n"
            "Stufe 6 – Empathisches Zuhören: Man hört auch die Emotion hinter den Worten und benennt sie ('Das klingt frustrierend für dich.').\n"
            "Stufe 7 – Bedürfnis-orientiertes Zuhören: Man erkennt das unausgesprochene Bedürfnis hinter der Aussage (Anerkennung, Sicherheit, Autonomie).\n"
            "Stufe 8 – Resonantes Zuhören: Man schwingt emotional mit dem Sprecher — Vertrauen und Verbindung entstehen auf einer tieferen Ebene.\n"
            "Stufe 9 – Generatives Zuhören: Man hört nicht nur, was gesagt wird, sondern was möglich werden könnte — der Sprecher entdeckt durch das Zuhören neue Gedanken.\n"
            "Stufe 10 – Transformatives Zuhören: Das Zuhören wird zum Coaching-Akt. Der Sprecher denkt klarer, fühlt sich vollständig verstanden, und der Raum für echte Veränderung entsteht.\n\n"
            "Leadership-Anwendung:\n"
            "• Stufen 1–4 sind defensiv. Sie sichern das eigene Ego, aber kosten Vertrauen im Team.\n"
            "• Stufen 5–7 sind die Pflicht für jede Führungskraft — ohne sie keine echte 1:1-Kommunikation.\n"
            "• Stufen 8–10 sind die Kür — der C-Level-Edge. Hier entsteht der 'Coach-as-Leader'-Effekt: Mitarbeiter denken besser, weil du besser zuhörst.\n\n"
            "Praxis: Vor jedem schwierigen Gespräch eine Stufe definieren — z.B. 'In diesem Gespräch will ich auf Stufe 7 (Bedürfnis) zuhören.' Dann bewusst auf das Bedürfnis hinter dem Gesagten achten."
        ),
    },
]


def _match_manual_chunks(query: str) -> list[dict]:
    """Return MANUAL_CHUNKS whose keywords appear in the (lowercased) query.

    Each match is shaped like a Supabase chunk so it slots into
    `_format_chunks_for_prompt` unchanged. similarity is set to 1.0 so manual
    chunks always appear first in the formatted block.
    """
    if not query:
        return []
    q = query.lower()
    matched: list[dict] = []
    for chunk in MANUAL_CHUNKS:
        if any(kw in q for kw in chunk["keywords"]):
            matched.append({
                "id": f"manual_{chunk['metadata']['framework']}",
                "content": chunk["content"],
                "metadata": chunk["metadata"],
                "similarity": 1.0,
            })
    return matched


# ── Hybrid keyword retrieval (Iter 111 · Mert GODMODE) ──────────────────────
# Pure vector search misses Wlad's proper-noun frameworks ("SEXIER", "6P",
# "Charisma-Modell") because rare tokens embed poorly. We therefore run a
# parallel keyword scan over `rag_chunks.content` and fuse both result lists
# with Reciprocal Rank Fusion. Needs NO external service — Mongo only.
_STOPWORDS = {
    "der", "die", "das", "und", "oder", "was", "wie", "wer", "wann", "warum", "wieso",
    "welche", "welcher", "welches", "sind", "ist", "sein", "seine", "eines", "einer",
    "einem", "einen", "eine", "ein", "mir", "mich", "dir", "dich", "von", "vom", "zum",
    "zur", "mit", "bei", "aus", "für", "auf", "doch", "gibt", "den", "dem", "des",
    "hat", "habe", "haben", "kann", "kannst", "können", "soll", "sollte", "bitte",
    "mal", "denn", "dann", "also", "über", "unter", "nach", "vor", "anhand", "thema",
    "genau", "irgendein", "irgendwas", "noch", "nur", "auch", "sehr", "dass", "nicht",
    "kein", "keine", "diese", "dieser", "dieses", "acht", "zehn", "mein", "meine",
    # domain-generic (appear in almost every chunk → noise)
    "wlad", "wlads", "jachtchenko", "modell", "modells", "modelle", "framework",
    "frameworks", "beispiel", "beispiels", "beispiele", "beispielen", "erklär",
    "erkläre", "erklären", "methode", "methoden", "sagt", "sage", "nenne", "stufen",
}


def _salient_terms(query: str) -> list[str]:
    """Extract rare/framework-ish terms worth an exact keyword lookup."""
    import re as _re
    tokens = _re.findall(r"[A-Za-zÄÖÜäöüß0-9\-]+", query.lower())
    terms = []
    for t in tokens:
        if t in _STOPWORDS:
            continue
        if len(t) < 4 and not any(ch.isdigit() for ch in t):
            continue
        terms.append(t)
    return list(dict.fromkeys(terms))[:6]


def _term_variants(term: str) -> list[str]:
    """Substring variants: raw + suffix-stripped (German plurals/genitives)."""
    v = {term[:14]}
    stripped = term.rstrip("sne")
    if len(stripped) >= 4:
        v.add(stripped[:14])
    return list(v)


async def _match_keyword(query: str) -> list[dict]:
    """Regex keyword scan over rag_chunks, scored by distinct-term coverage."""
    import re as _re
    from config import db
    terms = _salient_terms(query)
    if not terms:
        return []
    try:
        variants_per_term = [_term_variants(t) for t in terms]
        pattern = "|".join(_re.escape(v) for vs in variants_per_term for v in vs)
        docs = await db.rag_chunks.find(
            {"content": {"$regex": pattern, "$options": "i"}},
            {"_id": 0, "content": 1, "metadata": 1},
        ).limit(500).to_list(500)
        scored = []
        for d in docs:
            lc = d["content"].lower()
            distinct = sum(1 for vs in variants_per_term if any(v in lc for v in vs))
            freq = sum(lc.count(vs[0]) for vs in variants_per_term)
            score = distinct * 100 + min(freq, 30)
            scored.append((score, d))
        scored.sort(key=lambda x: -x[0])
        top = scored[:10]
        return [
            {**d, "similarity": min(0.95, 0.55 + 0.08 * (s // 100))}
            for s, d in top if s >= 100
        ]
    except Exception as e:
        logger.warning("RAG: keyword match failed: %s", e)
        return []


FUSED_COUNT = int(os.environ.get("RAG_FUSED_COUNT", "8"))


def _fuse_rrf(result_lists: list[list[dict]], k: int = 60, top: int | None = None) -> list[dict]:
    """Reciprocal Rank Fusion across retrieval lists, deduped by content."""
    scores: dict[str, float] = {}
    first: dict[str, dict] = {}
    for lst in result_lists:
        for rank, c in enumerate(lst):
            key = (c.get("content") or "")[:160]
            if not key:
                continue
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            first.setdefault(key, c)
    ordered = sorted(scores, key=lambda x: -scores[x])
    return [first[x] for x in ordered[: top or FUSED_COUNT]]


async def _embed_query(query: str) -> list[float] | None:
    """Embed a user query with the local model. Returns None on any failure."""
    from services_embeddings import embed_query
    return await embed_query(query)


# ── Local vector store (MongoDB `rag_chunks` + in-memory numpy matrix) ──────
# The ONLY retrieval path since Iter 116: the full corpus lives in Mongo and
# is matched in-process in <50ms. No external vector DB, no external API.
_LOCAL_CACHE: dict[str, Any] = {"matrix": None, "docs": None, "count": 0, "loaded_at": 0.0}


async def _match_local(embedding: list[float], threshold: float | None = None,
                       count: int | None = None) -> list[dict]:
    import numpy as np
    from config import db
    try:
        doc_count = await db.rag_chunks.estimated_document_count()
        if doc_count == 0:
            return []
        now = time.time()
        if (_LOCAL_CACHE["matrix"] is None or _LOCAL_CACHE["count"] != doc_count
                or now - _LOCAL_CACHE["loaded_at"] > 3600):
            docs = await db.rag_chunks.find(
                {}, {"_id": 0, "content": 1, "metadata": 1, "embedding": 1}
            ).to_list(60000)
            if not docs:
                return []
            mat = np.array([d["embedding"] for d in docs], dtype=np.float32)
            mat /= (np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9)
            _LOCAL_CACHE.update(
                matrix=mat,
                docs=[{"content": d["content"], "metadata": d.get("metadata") or {}} for d in docs],
                count=doc_count, loaded_at=now,
            )
            logger.info("RAG: local vector cache loaded (%d chunks)", len(docs))
        q = np.array(embedding, dtype=np.float32)
        q /= (np.linalg.norm(q) + 1e-9)
        if _LOCAL_CACHE["matrix"].shape[1] != q.shape[0]:
            logger.error("RAG: dim mismatch (store=%d, query=%d) — re-ingest required",
                         _LOCAL_CACHE["matrix"].shape[1], q.shape[0])
            return []
        sims = _LOCAL_CACHE["matrix"] @ q
        thr = MATCH_THRESHOLD if threshold is None else threshold
        top = np.argsort(-sims)[:(count or MATCH_COUNT)]
        return [
            {**_LOCAL_CACHE["docs"][int(i)], "similarity": float(sims[int(i)])}
            for i in top if float(sims[int(i)]) >= thr
        ]
    except Exception as e:
        logger.warning("RAG: local match failed: %s", e)
        return []


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

    # ── Manual chunks (deterministic, keyword-triggered) — always evaluated.
    manual = _match_manual_chunks(query)

    # Cache check
    cached = _cache_get(query)
    if cached is not None:
        combined = manual + cached
        ctx_block = _format_chunks_for_prompt(combined)
        return {"context_block": ctx_block, "chunks_count": len(combined), "rag_active": bool(ctx_block)}

    # ── Hybrid retrieval (Iter 111): vector + keyword in parallel, RRF-fused.
    # Both paths run fully local — no external keys, no rate limits.
    embedding, kw_chunks = await asyncio.gather(
        _embed_query(query),
        _match_keyword(query),
    )
    vec_chunks: list[dict] = []
    if embedding:
        vec_chunks = await _match_local(embedding)

    if vec_chunks and kw_chunks:
        chunks = _fuse_rrf([vec_chunks, kw_chunks])
    else:
        chunks = (vec_chunks or kw_chunks)[:FUSED_COUNT]

    _cache_put(query, chunks)
    combined = manual + chunks
    ctx_block = _format_chunks_for_prompt(combined)
    if ctx_block:
        logger.info("RAG: injected %d chunks (%d manual + %d vector + %d keyword → %d fused) for query (len=%d)",
                    len(combined), len(manual), len(vec_chunks), len(kw_chunks), len(chunks), len(query))
    return {"context_block": ctx_block, "chunks_count": len(combined), "rag_active": bool(ctx_block)}


def rag_status() -> dict[str, Any]:
    """Health-check for /api/rag-status or admin dashboards."""
    from services_embeddings import EMBED_MODEL_NAME, EMBEDDING_DIM, model_loaded
    return {
        "configured": True,
        "provider": "local",
        "model": EMBED_MODEL_NAME,
        "dim": EMBEDDING_DIM,
        "model_loaded": model_loaded(),
        "cache_size": len(_query_cache),
        "match_threshold": MATCH_THRESHOLD,
        "match_count": MATCH_COUNT,
    }

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
    # ── Iter 121.1: Wlad-Frameworks aus dem Original-WladBot (Telegram) ────
    # Wörtlich aus den `theory.txt` / Screenshots von Wlad übernommen, damit
    # unser Bot exakt dieselben Listen liefert wie der Referenz-Bot.
    # ⚠️ Der ältere "listening_10_stages"-Eintrag wurde in Iter 121.1
    # entfernt: er nutzte abweichende Stufen-Namen (Pseudo-/Resonant-/
    # Generativ-/Transformativ-Zuhören) und WIDERSPRACH damit dem
    # Original-Framework unten (antwortsüchtig vs. verstehend). Nie mehr
    # zurückführen ohne Wlads explizite Freigabe.
    # ── Iter 121.1: Wlad-Frameworks aus dem Original-WladBot (Telegram) ────
    # Wörtlich aus den `theory.txt` / Screenshots von Wlad übernommen, damit
    # unser Bot exakt dieselben Listen liefert wie der Referenz-Bot.
    {
        "keywords": [
            "zuhören", "zuhoeren", "zuhoren", "listening",
            "10 stufen des zuhörens", "zehn stufen des zuhörens",
            "stufen des zuhörens", "stages of listening",
            "antwortsüchtig", "antwortsuechtig", "verstehendes zuhören",
        ],
        "metadata": {
            "course": "Wlad Jachtchenko · Weiße Rhetorik",
            "topic": "10 Stufen des Zuhörens",
            "framework": "listening_10_stages_wladbot",
            "source": "wladbot_reference",
        },
        "content": (
            "10 Stufen des Zuhörens (Wlad Jachtchenko) — geordnet in zwei Hauptkategorien:\n\n"
            "**Antwortenorientiertes Zuhören (Stufen 1–6):**\n"
            "1. **Vortäuschendes Zuhören** — Zuhören wird nur vorgetäuscht, entweder vorsätzlich oder fahrlässig.\n"
            "2. **Kürzendes Zuhören** — Der Zuhörer unterbricht, weil er denkt, er habe genug verstanden.\n"
            "3. **Selektives Zuhören** — Der Zuhörer achtet nur auf bestimmte Schlagworte und ignoriert den Rest.\n"
            "4. **Übertrumpfendes Zuhören** — Der Zuhörer hört zu, um Argumente zu widerlegen oder eigene Geschichten zu erzählen.\n"
            "5. **Egoistisches Zuhören** — Der Zuhörer sucht nach persönlichem Vorteil oder strategischem Nutzen.\n"
            "6. **Beratendes Zuhören** — Der Zuhörer gibt ungefragt Ratschläge und spielt sich als Experte auf.\n\n"
            "**Verstehendes Zuhören (Stufen 7–10):**\n"
            "7. **Aufmerksames Zuhören** — Der Zuhörer hört mit ungeteilter Aufmerksamkeit zu.\n"
            "8. **Aktives Zuhören** — Der Zuhörer stellt kluge Fragen, paraphrasiert und klärt Details.\n"
            "9. **Empathisches Zuhören** — Der Zuhörer analysiert Körpersprache und Stimme und verbalisiert Emotionen.\n"
            "10. **Helfendes Zuhören** — Der Zuhörer bietet psychologische oder praktische Hilfe an und investiert seine Zeit, um dem anderen zu helfen.\n\n"
            "Diese Stufen helfen dabei, die Qualität des Zuhörens zu verbessern und die Kommunikation effektiver zu gestalten.\n\n"
            "Weiterführend: Wlads Podcast-Folge „02 · Die 7 Stufen des Zuhörens (Weiße Rhetorik #1)"
        ),
    },
    {
        "keywords": [
            "6p", "6-p", "sechs p", "6p-modell", "6p modell", "6 p modell",
            "storytelling modell", "wlads storytelling",
            "plot polarität protagonist", "peripetie pointe präsentation",
        ],
        "metadata": {
            "course": "Wlad Jachtchenko · Storytelling",
            "topic": "6P-Modell im Storytelling",
            "framework": "storytelling_6p",
            "source": "wladbot_reference",
        },
        "content": (
            "**Das 6P-Modell** von Wlad Jachtchenko ist eine strukturierte Methode zur Erstellung von Geschichten im Storytelling. "
            "Es besteht aus sechs wesentlichen Elementen, die eine gute Geschichte ausmachen:\n\n"
            "1. **Plot (Handlung)** — Der thematische Rahmen der Geschichte. Es kann um Macht, Liebe, Identität, Verzweiflung oder andere Themen gehen. Der Plot ist das Herzstück der Geschichte.\n\n"
            "2. **Polarität (Konflikt)** — Ein bestimmter Konflikt oder Gegensatz, der die Geschichte spannend macht. Beispiele sind Gewinner vs. Verlierer, Wahrheit vs. Lüge oder Liebe vs. Hass.\n\n"
            "3. **Protagonist (Hauptfigur)** — Die zentrale Figur oder der Held der Geschichte, um den sich die Handlung dreht.\n\n"
            "4. **Peripetie (Wendepunkt)** — Ein entscheidender Moment oder eine unerwartete Wendung in der Geschichte, die den Verlauf verändert.\n\n"
            "5. **Pointe (Moral der Geschichte)** — Die Schlussfolgerung oder die Lektion, die aus der Geschichte gezogen werden kann.\n\n"
            "6. **Präsentation** — Die Art und Weise, wie die Geschichte erzählt wird, einschließlich der Stimme, der Mimik und der allgemeinen Darbietung.\n\n"
            "Dieses Modell hilft dabei, Geschichten klar und wirkungsvoll zu gestalten, indem es sowohl die Struktur als auch die Präsentation berücksichtigt."
        ),
    },
    {
        "keywords": [
            "charisma", "charisma-code", "charisma code", "charisma-modell", "charisma modell",
            "acht elemente", "8 elemente charisma", "charisma acht", "8-elemente-charisma",
            "credo habitus", "außeralltäglichkeit", "ausseralltaeglichkeit",
        ],
        "metadata": {
            "course": "Wlad Jachtchenko · Charisma-Code",
            "topic": "Charisma-Modell mit 8 Elementen",
            "framework": "charisma_8",
            "source": "wladbot_reference",
        },
        "content": (
            "Das **Charisma-Modell** von Wlad Jachtchenko besteht aus acht Elementen, die zusammen den **Charisma-Code** bilden:\n\n"
            "1. **Credo** — Die festen Glaubensüberzeugungen eines Menschen, die von innen nach außen strahlen und eine klare Vision vermitteln.\n\n"
            "2. **Habitus** — Eine optimistische Grundhaltung, die Vertrauen und Zuversicht ausstrahlt.\n\n"
            "3. **Außeralltäglichkeit** — Die Fähigkeit, sich von der Masse abzuheben und etwas Einzigartiges zu bieten.\n\n"
            "4. **Rhetorik** — Die Kunst des freien Sprechens, um Gedanken klar und überzeugend zu vermitteln.\n\n"
            "5. **Inszenierung** — Die bewusste Darstellung der eigenen Person, um Aufmerksamkeit zu erregen und in Erinnerung zu bleiben.\n\n"
            "6. **Superskills** — Besondere Fähigkeiten oder Talente, die einen von anderen abheben.\n\n"
            "7. **Motivation** — Eine starke innere Antriebskraft und eine attraktive Vision, die andere inspiriert und mitreißt.\n\n"
            "8. **Arbeit** — Die kontinuierliche Arbeit an den eigenen Fähigkeiten und Werten, um das Charisma zu stärken und zu pflegen.\n\n"
            "Diese Elemente helfen dabei, eine charismatische Persönlichkeit zu entwickeln, die andere Menschen anzieht und inspiriert."
        ),
    },
    {
        "keywords": [
            "sexier", "sexier-modell", "sexier modell", "sexier framework",
            "statement explanation example impact rebuttal",
            "argumentation modell", "wladsches argumentationsmodell",
        ],
        "metadata": {
            "course": "Wlad Jachtchenko · Argumentation",
            "topic": "SEXIER-Modell",
            "framework": "sexier_argumentation",
            "source": "wladbot_reference",
        },
        "content": (
            "Das **SEXIER-Modell** von Wlad Jachtchenko ist das Kernframework für starke Argumente. Es besteht aus 6 Elementen:\n\n"
            "**S – Statement**: Die These. Der Kernsatz, den du beweisen willst.\n"
            "**E – Explanation**: Die Begründung. Warum ist die These wahr?\n"
            "**X – eXample**: Das Beispiel. Ein konkreter Fall, der die These belegt.\n"
            "**I – Impact**: Die Relevanz. Warum ist das für den Zuhörer wichtig?\n"
            "**E – Explanation of Impact**: Die Begründung der Relevanz. Warum hat es genau diese Wirkung?\n"
            "**R – Rebuttal**: Die Widerlegung des wichtigsten Einwands. Antizipiere den stärksten Gegen-Einwand und entkräfte ihn.\n\n"
            "Nutzung: Wenn du eine Rede oder ein Argument analysierst, gehe alle 6 Elemente durch — fehlt eines, ist das Argument unvollständig."
        ),
    },
    {
        "keywords": [
            "30 schlagfertigkeit", "schlagfertigkeitstechniken", "schlagfertigkeit techniken",
            "30 schlagfertigkeits-techniken", "30 techniken schlagfertigkeit",
            "rückfrage technik", "retourkutsche",
        ],
        "metadata": {
            "course": "Wlad Jachtchenko · Schlagfertigkeit",
            "topic": "30 Schlagfertigkeitstechniken",
            "framework": "schlagfertigkeit_30",
            "source": "wladbot_reference",
        },
        "content": (
            "**Die 30 Schlagfertigkeitstechniken** von Wlad Jachtchenko:\n\n"
            "1. Rückfrage-Technik\n"
            "2. Überraschende Zustimmung\n"
            "3. Notbremse-Technik\n"
            "4. Retourkutsche\n"
            "5. Verweigerungstechnik\n"
            "6. Komplimente-Technik\n"
            "7. Hinweis-Aufforderung-Technik\n"
            "8. Übergehungstechnik\n"
            "9. Definitionstechnik\n"
            "10. Standard-Antworten-Technik\n"
            "11. Ironie-Technik\n"
            "12. Meta-Technik\n"
            "13. Zwei-Silben-Technik\n"
            "14. Gerade-Weil-Technik\n"
            "15. Relativierungstechnik\n"
            "16. Hilfe-Technik\n"
            "17. Zurückweisungstechnik\n"
            "18. Ihr-Problem-Technik\n"
            "19. Spiegel-Technik\n"
            "20. Vertagungstechnik\n"
            "21. Schweige-Technik\n"
            "22. Widerlegungstechnik\n"
            "23. Abwägungstechnik\n"
            "24. Zitate-Technik\n"
            "25. Nonsense-Technik\n"
            "26. Uminterpretier-Technik\n"
            "27. Ich-Botschaften-Technik\n"
            "28. Diplomaten-Technik\n"
            "29. Lieber-als-Technik\n"
            "30. Klartext-Technik"
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


def _source_label(meta: dict) -> str:
    """Readable citation label for a chunk.

    Many chunks from early ingest runs carry the first transcript line as
    `course` ("in diesem Abschnitt zeige ich dir …") or OCR garbage
    ("WLAD JACHTCHENKO DUBISTER BESERECHEF"). `_clean_display_title` already
    solves that for the admin source list — we reuse it so the model cites
    "Du Bist Der Bessere Chef" instead of noise.
    """
    try:
        from rag_titles import clean_display_title
        label = clean_display_title(meta.get("source_file") or "", meta.get("course"))
    except Exception:
        label = (meta.get("course") or meta.get("source_file") or "Wlad-Material")
    topic = (meta.get("topic") or "").strip()
    if topic and topic.lower() not in label.lower():
        label = f"{label} · {topic}"
    return label[:110]


def _format_chunks_for_prompt(chunks: list[dict]) -> str:
    """Format retrieved chunks into a single context block for the system prompt.

    Iter 92.23.5 (Mert 1605-chunk audit): if even the first chunk exceeds the
    budget, we truncate it instead of returning empty — Wlad's new course
    transcripts are 4kB each, and dropping all of them silently is much worse
    than feeding a slightly-clipped first chunk. The budget itself was also
    bumped (4k → 14k) so the common case is 3-4 full chunks injected.

    Iter 135 (Audit): the header now carries the SOURCE (course/topic/file).
    Before, metadata was dropped, so the model had no way to attribute an
    answer to the right book/course and could not be asked to cite it.
    """
    if not chunks:
        return ""
    lines = []
    total = 0
    for i, c in enumerate(chunks, 1):
        content = (c.get("content") or "").strip()
        if not content:
            continue
        meta = c.get("metadata") or {}
        label = _source_label(meta)
        header = f"[Quelle {i} · {label} · Relevanz {c.get('similarity', 0):.2f}]\n"
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
    # Iter 135 (Audit): the whole block is guarded. The contract is "chat NEVER
    # breaks because of RAG" — an OOM in the embedding model or a numpy error
    # must degrade to an un-grounded answer, not a 500.
    try:
        embedding, kw_chunks = await asyncio.gather(
            _embed_query(query),
            _match_keyword(query),
            return_exceptions=True,
        )
        if isinstance(embedding, BaseException):
            logger.warning("RAG: embedding failed: %s", embedding)
            embedding = None
        if isinstance(kw_chunks, BaseException):
            logger.warning("RAG: keyword match failed: %s", kw_chunks)
            kw_chunks = []
        vec_chunks: list[dict] = []
        if embedding:
            vec_chunks = await _match_local(embedding)

        if vec_chunks and kw_chunks:
            chunks = _fuse_rrf([vec_chunks, kw_chunks])
        else:
            chunks = (vec_chunks or kw_chunks)[:FUSED_COUNT]
    except Exception as e:
        logger.error("RAG: retrieval failed entirely, answering without context: %s", e)
        vec_chunks, kw_chunks, chunks = [], [], []

    _cache_put(query, chunks)
    combined = manual + chunks
    ctx_block = _format_chunks_for_prompt(combined)
    if ctx_block:
        logger.info("RAG: injected %d chunks (%d manual + %d vector + %d keyword → %d fused) for query (len=%d)",
                    len(combined), len(manual), len(vec_chunks), len(kw_chunks), len(chunks), len(query))
    return {"context_block": ctx_block, "chunks_count": len(combined), "rag_active": bool(ctx_block)}


def invalidate_caches(reason: str = "") -> dict[str, int]:
    """Drop query + vector caches. MUST be called after any corpus change.

    Iter 135 (Audit finding): re-ingest/upload/delete changed `rag_chunks` but
    left the 30-min query cache and the in-process vector matrix untouched, so
    the bot kept answering from the OLD corpus for up to an hour after an admin
    updated the knowledge base.
    """
    queries = len(_query_cache)
    chunks = _LOCAL_CACHE.get("count") or 0
    _query_cache.clear()
    _LOCAL_CACHE.update(matrix=None, docs=None, count=0, loaded_at=0.0)
    logger.info("RAG: caches invalidated (%s) — dropped %d cached queries, %d-chunk matrix",
                reason or "manual", queries, chunks)
    return {"queries_dropped": queries, "matrix_chunks_dropped": chunks}


def rag_status() -> dict[str, Any]:
    """Health-check for /api/rag-status or admin dashboards."""
    from services_embeddings import EMBED_MODEL_NAME, EMBED_PROVIDER, EMBEDDING_DIM, model_loaded
    return {
        "configured": True,
        "provider": EMBED_PROVIDER,
        "model": EMBED_MODEL_NAME,
        "dim": EMBEDDING_DIM,
        "model_loaded": model_loaded(),
        "cache_size": len(_query_cache),
        "match_threshold": MATCH_THRESHOLD,
        "match_count": MATCH_COUNT,
    }

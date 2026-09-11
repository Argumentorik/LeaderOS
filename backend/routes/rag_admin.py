"""Admin: local RAG vector-store management (re-ingest knowledge on any environment)."""
import asyncio
import io
import os
import zipfile
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from config import db, logger
from rag_titles import clean_display_title as _clean_display_title
from routes.admin import require_admin

router = APIRouter(prefix="/api/admin/rag", tags=["rag-admin"])

_HANDBOOK = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "docs", "DEV_HANDBUCH_RAG.md")


@router.get("/handbuch")
async def rag_handbook(request: Request):
    """Dev-Handbuch (docs/DEV_HANDBUCH_RAG.md) als Markdown für die Admin-Hilfe (Iter 168)."""
    await require_admin(request)
    path = os.path.normpath(_HANDBOOK)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Handbuch nicht gefunden")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    return {"markdown": text, "updated_at": datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc).isoformat()}

DEFAULT_ZIP_URL = "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/8k335gkq_unchunked.zip"


@router.get("/local-status")
async def local_rag_status(request: Request):
    """RAG health for Ops: corpus size, model, cache state, last job, live probe."""
    await require_admin(request)
    from services_rag import rag_status, retrieve_context, _LOCAL_CACHE
    count = await db.rag_chunks.count_documents({})
    job = await db.rag_ingest_jobs.find_one({}, {"_id": 0}, sort=[("started_at", -1)])
    sources = len(await db.rag_chunks.distinct("metadata.source_file"))
    # Live probe: does retrieval actually return grounded context right now?
    probe = await retrieve_context("Was ist das SEXIER-Modell?")
    status = rag_status()
    sample = await db.rag_chunks.find_one({}, {"embedding": 1})
    store_dim = len((sample or {}).get("embedding") or []) if sample else None
    return {
        "chunks": count,
        "sources": sources,
        "last_job": job,
        "engine": status,
        "store_dim": store_dim,
        "dim_ok": store_dim is None or store_dim == status["dim"],
        "vector_cache_loaded": _LOCAL_CACHE.get("matrix") is not None,
        "retrieval_ok": bool(probe["rag_active"]),
        "retrieval_chunks": probe["chunks_count"],
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


class ReingestBody(BaseModel):
    zip_url: str = DEFAULT_ZIP_URL


async def _run_ingest(zip_url: str):
    job = {"status": "running", "started_at": datetime.now(timezone.utc).isoformat(), "zip_url": zip_url}
    await db.rag_ingest_jobs.delete_many({})
    await db.rag_ingest_jobs.insert_one({**job})
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            r = await client.get(zip_url)
            r.raise_for_status()
        target = "/tmp/rag_ingest_src"
        import shutil
        shutil.rmtree(target, ignore_errors=True)
        os.makedirs(target, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            for name in zf.namelist():
                if name.endswith(".txt") and "__MACOSX" not in name:
                    data = zf.read(name)
                    fname = os.path.basename(name)
                    if fname:
                        open(os.path.join(target, fname), "wb").write(data)
        from scripts_ingest_local_rag import main as ingest_folder
        await ingest_folder(target)
        from services_rag import invalidate_caches
        invalidate_caches("reingest")
        count = await db.rag_chunks.count_documents({})
        await db.rag_ingest_jobs.update_many({}, {"$set": {
            "status": "done", "chunks": count,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }})
        logger.info(f"RAG re-ingest complete: {count} chunks")
    except Exception as e:
        logger.error(f"RAG re-ingest failed: {e}")
        await db.rag_ingest_jobs.update_many({}, {"$set": {"status": "error", "error": str(e)[:300]}})


@router.post("/reingest")
async def reingest(body: ReingestBody, request: Request):
    admin = await require_admin(request)
    running = await db.rag_ingest_jobs.find_one({"status": "running"})
    if running:
        # Stale-job guard: a backend restart mid-ingest leaves the job "running"
        # forever. Jobs older than 90 min are considered dead and get replaced.
        started = running.get("started_at") or ""
        try:
            age_min = (datetime.now(timezone.utc) - datetime.fromisoformat(started)).total_seconds() / 60
        except Exception:
            age_min = 9999
        if age_min < 90:
            raise HTTPException(status_code=409, detail="Ingestion läuft bereits — Status via GET /api/admin/rag/local-status.")
        logger.warning(f"RAG: stale running job ({age_min:.0f} min old) — replaced by new ingest")
    asyncio.create_task(_run_ingest(body.zip_url))
    logger.info(f"RAG re-ingest started by {admin.get('email')}")
    return {"started": True, "note": "Läuft im Hintergrund (~10-30 Min, lokales Embedding-Modell). Status: GET /api/admin/rag/local-status"}


# ── Golden-Question self-test (Iter 111 · Mert: "nie wieder ein Fehler") ─────
# Iter 117 GODMODE: extended from 7 → 21 questions covering ALL 25 courses.
# Runs the canonical Wlad questions through the LIVE retrieval pipeline and
# checks that the expected framework content is actually in the context block.
GOLDEN_QUESTIONS = [
    {"q": "Erklär mir das SEXIER Modell von Wlad anhand eines Beispiels", "expect_any": ["SEXIER", "sexier"]},
    {"q": "Was sind die 30 Schlagfertigkeitstechniken von Wlad?", "expect_any": ["chlagfertig"]},
    {"q": "Es gibt doch irgendein 6P-Modell zum Thema Storytelling bei Wlad. Was ist das genau?", "expect_any": ["6P", "6 P"]},
    {"q": "Was sind die zehn Stufen des Zuhörens?", "expect_any": ["Stufen des Zuhörens", "Zuhör"]},
    {"q": "Wlad hat ein Charisma-Modell aus acht Elementen. Was sind diese acht?", "expect_any": ["harisma"]},
    {"q": "Was ist die Weiße Rhetorik?", "expect_any": ["eiße Rhetorik", "eisse Rhetorik", "Rhetorik"]},
    {"q": "Wie setze ich einen Anker in der Gehaltsverhandlung?", "expect_any": ["nker", "erhandl"]},
    {"q": "Was macht laut Wlad einen richtig guten Chef aus?", "expect_any": ["Chef", "Führung", "führ"]},
    {"q": "Warum sollte ich durch Gründe führen statt durch Anweisungen?", "expect_any": ["Gründe", "Begründ", "führ"]},
    {"q": "Was sind die vier Farbtypen in der Kommunikation?", "expect_any": ["Farb", "rot", "gelb"]},
    {"q": "Wie überzeuge ich einen Kunden im Verkaufsgespräch?", "expect_any": ["Verkauf", "Kunde", "Sales"]},
    {"q": "Was sind die 5 Rollen einer Führungskraft?", "expect_any": ["Rolle"]},
    {"q": "Wie überzeuge ich im Vorstellungsgespräch bei einer Bewerbung?", "expect_any": ["ewerbung", "orstellungsgespräch"]},
    {"q": "Wie kann ich schneller lernen und mir mehr merken?", "expect_any": ["lern", "merk"]},
    {"q": "Was lehrt die klassische Rhetorik über Ethos, Pathos und Logos?", "expect_any": ["thos", "Rhetorik"]},
    {"q": "Wie führe ich mein Team im Homeoffice richtig?", "expect_any": ["omeoffice", "emote", "irtuell"]},
    {"q": "Wie wirkt meine Körpersprache souveräner auf der Bühne?", "expect_any": ["örpersprache", "örper", "estik"]},
    {"q": "Wie baue ich eine überzeugende Präsentation auf?", "expect_any": ["räsentation", "räsentier"]},
    {"q": "Wie führe ich ein schwieriges Gespräch mit einem Mitarbeiter?", "expect_any": ["espräch", "onflikt"]},
    {"q": "Wie motiviere ich mein Team nachhaltig?", "expect_any": ["otivation", "otivier"]},
    {"q": "Wie überzeuge ich in Online-Meetings und digitaler Rhetorik?", "expect_any": ["igital", "nline", "amera"]},
]


@router.get("/golden-check")
async def golden_check(request: Request):
    await require_admin(request)
    from services_rag import retrieve_context
    results = []
    for g in GOLDEN_QUESTIONS:
        ctx = await retrieve_context(g["q"])
        block = ctx["context_block"]
        hit = any(term in block for term in g["expect_any"])
        results.append({
            "question": g["q"],
            "pass": bool(hit and ctx["rag_active"]),
            "chunks": ctx["chunks_count"],
        })
    passed = sum(1 for r in results if r["pass"])
    return {
        "status": "PASS" if passed == len(results) else "FAIL",
        "passed": f"{passed}/{len(results)}",
        "chunks_in_store": await db.rag_chunks.estimated_document_count(),
        "results": results,
    }


# ── GODMODE Zero-Touch (Iter 119 · Mert: "ich will nichts machen") ───────────
async def ensure_rag_ready():
    """Self-healing knowledge base: on startup, if the vector store is empty
    or holds vectors of a different dimension (older model), auto-ingest the default
    knowledge pack. Zero manual steps after any deploy."""
    try:
        await asyncio.sleep(10)  # let the app settle + embedding model preload
        import os as _os
        if _os.environ.get("RAG_AUTO_INGEST", "1") == "0" or _os.environ.get("RAG_EMBEDDINGS_DISABLED", "0") == "1":
            logger.info("RAG auto-ingest skipped (disabled via env)")
            return
        # Crash-loop guard (Iter 121): if the process gets killed mid-ingest
        # (e.g. prod OOM), do NOT immediately re-drop + re-ingest on every
        # restart — that turns one failure into a permanent boot loop.
        marker = await db.rag_auto_heal.find_one({"_id": "last_attempt"})
        if marker:
            try:
                age_h = (datetime.now(timezone.utc)
                         - datetime.fromisoformat(marker["at"])).total_seconds() / 3600
            except Exception:
                age_h = 999
            if age_h < 6 and marker.get("status") != "done":
                logger.warning("RAG auto-ingest: previous attempt %.1fh ago did not finish — backing off (manual trigger via Admin → RAG Control Center)", age_h)
                return
        from services_embeddings import EMBEDDING_DIM
        count = await db.rag_chunks.estimated_document_count()
        sample = await db.rag_chunks.find_one({}, {"embedding": 1})
        dim_ok = bool(sample) and len(sample.get("embedding") or []) == EMBEDDING_DIM
        if count > 0 and dim_ok:
            logger.info(f"RAG ready: {count} chunks, dim OK — no auto-ingest needed")
            return
        running = await db.rag_ingest_jobs.find_one({"status": "running"})
        if running:
            try:
                age_min = (datetime.now(timezone.utc)
                           - datetime.fromisoformat(running.get("started_at") or "")).total_seconds() / 60
            except Exception:
                age_min = 9999
            if age_min < 90:
                return
        logger.warning(f"RAG AUTO-INGEST: store not ready (chunks={count}, dim_ok={dim_ok}) — self-healing now")
        await db.rag_auto_heal.replace_one(
            {"_id": "last_attempt"},
            {"_id": "last_attempt", "at": datetime.now(timezone.utc).isoformat(), "status": "running"},
            upsert=True,
        )
        await _run_ingest(DEFAULT_ZIP_URL)
        await db.rag_auto_heal.update_one({"_id": "last_attempt"}, {"$set": {"status": "done"}})
    except Exception as e:
        logger.error(f"RAG auto-ingest check failed: {e}")


# ── Knowledge editing (Iter 119 · Enterprise: "knowledge can be changed") ────
# Iter 121.5 (Stefan feedback): sort books/courses first (by chunk count desc),
# then live-calls (newest first), and derive a clean human-readable title from
# the filename when `metadata.course` was stored as a text-fragment (older
# ingest scripts sometimes captured the first sentence of the chunk).
def _classify_source(source_file: str, raw_type: str | None) -> str:
    """Best-effort category: 'live_call' | 'book' | 'course' | 'custom'."""
    if raw_type in {"live_call", "book", "course", "custom"}:
        return raw_type
    fname = (source_file or "").lower()
    # 2025.07.08.txt / 2026.02.11.txt → live_call
    import re as _re
    if _re.match(r"^\d{4}[._-]\d{2}[._-]\d{2}", fname):
        return "live_call"
    # everything else defaults to a course/book
    return raw_type or "course"


@router.get("/sources")
async def list_knowledge_sources(request: Request):
    """All knowledge sources with chunk counts — the editable corpus view.

    Response format (Iter 121.5, expanded from the original flat list):
        {
          "total_chunks": <int>,
          "sources": [ {source_file, chunks, course, type, display_title}, ... ],
          "by_type": {book/course: N, live_call: M, custom: K},
          "categorised": {
            "courses": [...books & courses first, sorted by chunks desc...],
            "live_calls": [...transcripts, sorted by filename desc (=newest first)...],
            "custom":   [...user-uploads via admin UI...]
          }
        }
    """
    await require_admin(request)
    pipeline = [
        {"$group": {
            "_id": "$metadata.source_file",
            "chunks": {"$sum": 1},
            "course": {"$first": "$metadata.course"},
            "type": {"$first": "$metadata.type"},
            "last_ingested": {"$max": "$ingested_at"},
        }},
    ]
    rows = await db.rag_chunks.aggregate(pipeline).to_list(1000)

    sources: list[dict] = []
    by_type: dict[str, int] = {}
    for r in rows:
        src_file = r["_id"] or "(missing)"
        raw_course = r.get("course")
        cat = _classify_source(src_file, r.get("type"))
        by_type[cat] = by_type.get(cat, 0) + 1
        sources.append({
            "source_file": src_file,
            "chunks": r["chunks"],
            "course": raw_course,
            "display_title": _clean_display_title(src_file, raw_course),
            "type": cat,
            "last_ingested": r.get("last_ingested"),
        })

    # Categorised buckets — Stefan-Fix: books & courses appear FIRST so admins
    # see Wlads main library without scrolling past 30 live-call transcripts.
    courses = sorted(
        [s for s in sources if s["type"] in {"book", "course"}],
        key=lambda s: (-s["chunks"], s["source_file"]),
    )
    live_calls = sorted(
        [s for s in sources if s["type"] == "live_call"],
        key=lambda s: s["source_file"], reverse=True,  # newest date-file first
    )
    custom = sorted(
        [s for s in sources if s["type"] == "custom"],
        key=lambda s: s["source_file"],
    )
    # Flat list still supported (backward compat) — courses first, then calls,
    # then custom — so the OLD UI ordering ALSO shows books first.
    flat = courses + live_calls + custom

    return {
        "total_chunks": sum(r["chunks"] for r in rows),
        "sources": flat,
        "by_type": by_type,
        "categorised": {
            "courses": courses,
            "live_calls": live_calls,
            "custom": custom,
        },
    }


# ── Corpus-Vollständigkeit (Iter 134 · Wlad: "sieht man nicht ob alles da ist") ──
# Vergleicht die Quell-ZIP (Wlads komplette Bibliothek) mit dem, was wirklich
# in rag_chunks liegt. Antwort auf "ist das gesamte Wissen wirklich drin?".


@router.get("/coverage")
async def corpus_coverage(request: Request, zip_url: str = DEFAULT_ZIP_URL):
    await require_admin(request)

    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        r = await client.get(zip_url)
        r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        expected = sorted({
            os.path.basename(n) for n in zf.namelist()
            if n.endswith(".txt") and "__MACOSX" not in n and os.path.basename(n)
        })

    rows = await db.rag_chunks.aggregate([
        {"$group": {"_id": "$metadata.source_file", "chunks": {"$sum": 1}}},
    ]).to_list(2000)
    ingested = {r["_id"]: r["chunks"] for r in rows if r["_id"]}

    missing = [f for f in expected if f not in ingested]
    extra = sorted([f for f in ingested if f not in expected])
    thin = sorted(
        [{"source_file": f, "chunks": ingested[f]} for f in expected
         if f in ingested and ingested[f] < 5],
        key=lambda x: x["chunks"],
    )
    return {
        "zip_url": zip_url,
        "expected_files": len(expected),
        "ingested_files": len([f for f in expected if f in ingested]),
        "total_chunks": sum(ingested.values()),
        "complete": not missing,
        "missing": [{"source_file": f, "display_title": _clean_display_title(f, None)} for f in missing],
        "extra": [{"source_file": f, "chunks": ingested[f]} for f in extra],
        "thin": thin,
    }


class KnowledgeUpload(BaseModel):
    filename: str
    content: str
    course_title: str | None = None


MAX_KNOWLEDGE_BYTES = 2 * 1024 * 1024  # 2 MB pro Datei (Bücher, Skripte, Notizen)
KNOWLEDGE_EXTS = (".txt", ".md", ".pdf", ".docx")


def _extract_text(fname: str, raw: bytes) -> str:
    """Text aus .txt/.md/.pdf/.docx (lokal, ohne externe Dienste)."""
    low = fname.lower()
    if low.endswith(".pdf"):
        from io import BytesIO
        from pypdf import PdfReader
        return "\n\n".join((page.extract_text() or "") for page in PdfReader(BytesIO(raw)).pages)
    if low.endswith(".docx"):
        from io import BytesIO
        import docx
        return "\n".join(p.text for p in docx.Document(BytesIO(raw)).paragraphs)
    return raw.decode("utf-8", errors="replace")


async def _ingest_knowledge(admin: dict, filename: str, text: str, course_title: str | None) -> dict:
    """Chunken + lokal einbetten + in rag_chunks schreiben. Gleicher Dateiname ersetzt (idempotent)."""
    text = (text or "").strip()
    if len(text) < 50:
        raise HTTPException(status_code=422, detail="Inhalt zu kurz (min. 50 Zeichen) — bei PDFs: enthält die Datei echten Text (kein Scan)?")
    if len(text) > MAX_KNOWLEDGE_BYTES:
        raise HTTPException(status_code=422, detail="Datei zu groß (max. 2 MB Text). Bitte aufteilen.")
    import hashlib
    import re as _re
    import time as _time
    from scripts_ingest_local_rag import chunk_text
    from services_embeddings import embed_documents

    fname = _re.sub(r"[^a-zA-Z0-9._äöüÄÖÜß-]", "_", os.path.basename(filename or "wissen.txt"))
    fname = f"{fname.rsplit('.', 1)[0]}.txt" if not fname.endswith(".txt") else fname
    title = (course_title or fname.rsplit(".txt", 1)[0].replace("_", " ").title()).strip()[:90]
    chunks = chunk_text(text)
    meta = {"course": title, "type": "custom", "source_file": fname}
    docs = []
    for i in range(0, len(chunks), 128):
        batch = chunks[i:i + 128]
        embs = await embed_documents(batch)
        docs += [{
            "chunk_id": hashlib.sha1(f"{fname}:{c[:80]}:{len(c)}".encode()).hexdigest()[:16],
            "content": c, "metadata": meta, "embedding": e,
            "ingested_at": _time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        } for c, e in zip(batch, embs)]
    await db.rag_chunks.delete_many({"metadata.source_file": fname})
    if docs:
        await db.rag_chunks.insert_many(docs)
    from services_rag import invalidate_caches
    invalidate_caches(f"upload:{fname}")
    logger.info(f"RAG knowledge upload by {admin.get('email')}: {fname} → {len(docs)} chunks ({len(text)} chars)")
    return {"source_file": fname, "course": title, "chunks_added": len(docs), "chars": len(text),
            "total_chunks": await db.rag_chunks.count_documents({})}


@router.post("/upload-knowledge")
async def upload_knowledge(data: KnowledgeUpload, request: Request):
    """Wissen als Rohtext (.txt/.md-Inhalt) hinzufügen oder ersetzen."""
    admin = await require_admin(request)
    return await _ingest_knowledge(admin, data.filename, data.content, data.course_title)


@router.post("/upload-knowledge-file")
async def upload_knowledge_file(request: Request, file: UploadFile = File(...), course_title: str = Form("")):
    """Wissen als Datei (.txt/.md/.pdf/.docx, max. 2 MB) — Bücher & Skripte direkt aus dem Admin."""
    admin = await require_admin(request)
    name = file.filename or "wissen.txt"
    if not name.lower().endswith(KNOWLEDGE_EXTS):
        raise HTTPException(status_code=422, detail="Erlaubt: .txt, .md, .pdf, .docx")
    raw = await file.read()
    if len(raw) > MAX_KNOWLEDGE_BYTES:
        raise HTTPException(status_code=413, detail=f"Datei zu groß ({len(raw) / 1024 / 1024:.1f} MB, max. 2 MB). Bitte aufteilen.")
    try:
        text = _extract_text(name, raw)
    except Exception as e:
        logger.warning(f"knowledge extract failed for {name}: {e}")
        raise HTTPException(status_code=422, detail="Datei konnte nicht gelesen werden (beschädigt oder passwortgeschützt?)")
    return await _ingest_knowledge(admin, name, text, course_title or None)


@router.delete("/source/{source_file}")
async def delete_knowledge_source(source_file: str, request: Request):
    admin = await require_admin(request)
    res = await db.rag_chunks.delete_many({"metadata.source_file": source_file})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden.")
    from services_rag import invalidate_caches
    invalidate_caches(f"delete:{source_file}")
    logger.info(f"RAG source deleted by {admin.get('email')}: {source_file} ({res.deleted_count} chunks)")
    return {"deleted_chunks": res.deleted_count,
            "total_chunks": await db.rag_chunks.count_documents({})}

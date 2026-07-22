"""Admin: local RAG vector-store management (re-ingest knowledge on any environment)."""
import asyncio
import io
import os
import zipfile
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from config import db, logger

router = APIRouter(prefix="/api/admin/rag", tags=["rag-admin"])

DEFAULT_ZIP_URL = "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/8k335gkq_unchunked.zip"


@router.get("/local-status")
async def local_rag_status(request: Request):
    from routes.admin import require_admin
    await require_admin(request)
    count = await db.rag_chunks.estimated_document_count()
    job = await db.rag_ingest_jobs.find_one({}, {"_id": 0}, sort=[("started_at", -1)])
    return {"chunks": count, "last_job": job}


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
        count = await db.rag_chunks.estimated_document_count()
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
    from routes.admin import require_admin
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
    from routes.admin import require_admin
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
    or holds legacy-dimension vectors (Voyage era), auto-ingest the default
    knowledge pack. Zero manual steps after any deploy."""
    try:
        await asyncio.sleep(10)  # let the app settle + embedding model preload
        import os as _os
        if _os.environ.get("RAG_AUTO_INGEST", "1") == "0" or _os.environ.get("RAG_EMBEDDINGS_DISABLED", "0") == "1":
            logger.info("RAG auto-ingest skipped (disabled via env)")
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
        await _run_ingest(DEFAULT_ZIP_URL)
    except Exception as e:
        logger.error(f"RAG auto-ingest check failed: {e}")


# ── Knowledge editing (Iter 119 · Enterprise: "knowledge can be changed") ────
@router.get("/sources")
async def list_knowledge_sources(request: Request):
    """All knowledge sources with chunk counts — the editable corpus view."""
    from routes.admin import require_admin
    await require_admin(request)
    pipeline = [
        {"$group": {
            "_id": "$metadata.source_file",
            "chunks": {"$sum": 1},
            "course": {"$first": "$metadata.course"},
            "type": {"$first": "$metadata.type"},
        }},
        {"$sort": {"_id": 1}},
    ]
    rows = await db.rag_chunks.aggregate(pipeline).to_list(1000)
    return {"total_chunks": sum(r["chunks"] for r in rows), "sources": [
        {"source_file": r["_id"], "chunks": r["chunks"], "course": r.get("course"), "type": r.get("type") or "course"}
        for r in rows
    ]}


class KnowledgeUpload(BaseModel):
    filename: str
    content: str
    course_title: str | None = None


@router.post("/upload-knowledge")
async def upload_knowledge(data: KnowledgeUpload, request: Request):
    """Add or replace a knowledge source from raw text (.txt/.md content).

    Chunks + embeds locally (no external keys) and inserts into rag_chunks.
    Re-uploading the same filename replaces its chunks (idempotent).
    """
    from routes.admin import require_admin
    admin = await require_admin(request)
    text = (data.content or "").strip()
    if len(text) < 50:
        raise HTTPException(status_code=422, detail="Inhalt zu kurz (min. 50 Zeichen).")
    if len(text) > 400_000:
        raise HTTPException(status_code=422, detail="Datei zu groß (max. 400 KB Text). Bitte aufteilen.")
    import re as _re
    fname = _re.sub(r"[^a-zA-Z0-9._äöüÄÖÜß-]", "_", os.path.basename(data.filename or "wissen.txt"))
    if not fname.endswith(".txt"):
        fname = f"{fname.rsplit('.', 1)[0]}.txt"
    title = (data.course_title or fname.rsplit(".txt", 1)[0].replace("_", " ").title()).strip()[:90]
    from scripts_ingest_local_rag import chunk_text
    from services_embeddings import embed_documents
    import hashlib
    import time as _time
    chunks = chunk_text(text)
    meta = {"course": title, "type": "custom", "source_file": fname}
    docs = []
    for i in range(0, len(chunks), 128):
        batch = chunks[i:i + 128]
        embs = await embed_documents(batch)
        for c, e in zip(batch, embs):
            docs.append({
                "chunk_id": hashlib.sha1(f"{fname}:{c[:80]}:{len(c)}".encode()).hexdigest()[:16],
                "content": c, "metadata": meta, "embedding": e,
                "ingested_at": _time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
    await db.rag_chunks.delete_many({"metadata.source_file": fname})
    if docs:
        await db.rag_chunks.insert_many(docs)
    logger.info(f"RAG knowledge upload by {admin.get('email')}: {fname} → {len(docs)} chunks")
    return {"source_file": fname, "course": title, "chunks_added": len(docs),
            "total_chunks": await db.rag_chunks.estimated_document_count()}


@router.delete("/source/{source_file}")
async def delete_knowledge_source(source_file: str, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    res = await db.rag_chunks.delete_many({"metadata.source_file": source_file})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden.")
    logger.info(f"RAG source deleted by {admin.get('email')}: {source_file} ({res.deleted_count} chunks)")
    return {"deleted_chunks": res.deleted_count,
            "total_chunks": await db.rag_chunks.estimated_document_count()}

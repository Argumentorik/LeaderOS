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

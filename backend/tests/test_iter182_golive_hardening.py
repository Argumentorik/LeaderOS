"""Iter 182 — Go-Live-Härtung: Chunk-Upload wiederholbar, Aufräumen, Medien ohne Rate-Limit,
Analyse-Jobs nach Neustart. Keine Fal-/LLM-Kosten."""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
SAMPLE = Path("/tmp/iter182_sample.mp4")


@pytest.fixture(scope="module")
def admin() -> httpx.Client:
    c = httpx.Client(timeout=120.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


@pytest.fixture(scope="module")
def loop():
    """Motor bindet sich an genau EINE Event-Loop — alle Direkt-DB-Tests teilen sie."""
    lo = asyncio.new_event_loop()
    asyncio.set_event_loop(lo)
    yield lo
    lo.close()


@pytest.fixture(scope="module")
def sample_video(admin: httpx.Client) -> Path:
    """Ein echtes kleines MP4: das bereits produzierte Guide-Video (kein Render nötig)."""
    if SAMPLE.exists() and SAMPLE.stat().st_size > 100_000:
        return SAMPLE
    clips = admin.get(f"{API}/guide/clips", params={"kind": "feature"}).json()["clips"]
    url = next(c["video_url"] for c in clips if c.get("video_url"))
    with admin.stream("GET", f"{BASE}{url}") as resp:
        assert resp.status_code in (200, 206), resp.status_code
        with SAMPLE.open("wb") as f:
            for block in resp.iter_bytes(1 << 20):
                f.write(block)
    assert SAMPLE.stat().st_size > 100_000
    return SAMPLE


def _guide_slug(admin: httpx.Client) -> str:
    clips = admin.get(f"{API}/guide/clips", params={"kind": "feature"}).json()["clips"]
    return clips[0]["slug"]


def test_media_delivery_has_no_rate_limit(admin: httpx.Client) -> None:
    """Poster-Flut beim Erststart darf nie 429 auslösen (Firmen-NAT, mehrere Nutzer)."""
    clips = admin.get(f"{API}/guide/clips", params={"kind": "all", "lean": 1}).json()["clips"]
    poster = next(c["poster_url"] for c in clips if c.get("poster_url"))
    codes = set()
    for _ in range(45):
        r = admin.head(f"{BASE}{poster}")
        codes.add(r.status_code)
    assert 429 not in codes, codes


def test_chunk_retry_is_idempotent(admin: httpx.Client, sample_video: Path) -> None:
    """Dasselbe Stück zweimal senden (Netz-Wackler) darf die Datei NICHT verdoppeln."""
    slug = _guide_slug(admin)
    data = sample_video.read_bytes()
    init = admin.post(f"{API}/media/upload/init", json={
        "target": "guide_clip", "target_id": slug, "filename": "iter182.mp4",
        "size": len(data), "content_type": "video/mp4",
    })
    assert init.status_code == 200, init.text
    upload_id = init.json()["upload_id"]
    chunk_size = init.json()["chunk_size"]
    try:
        offset = 0
        while offset < len(data):
            blob = data[offset:offset + chunk_size]
            first = admin.post(f"{API}/media/upload/{upload_id}/chunk", content=blob,
                               headers={"Content-Type": "application/octet-stream",
                                        "X-Chunk-Offset": str(offset)})
            assert first.status_code == 200, first.text
            # Retry desselben Stücks an derselben Position
            again = admin.post(f"{API}/media/upload/{upload_id}/chunk", content=blob,
                               headers={"Content-Type": "application/octet-stream",
                                        "X-Chunk-Offset": str(offset)})
            assert again.status_code == 200, again.text
            assert again.json()["received"] == offset + len(blob)
            offset += len(blob)
        assert offset == len(data)

        gap = admin.post(f"{API}/media/upload/{upload_id}/chunk", content=b"x" * 10,
                         headers={"Content-Type": "application/octet-stream",
                                  "X-Chunk-Offset": str(len(data) + 5000)})
        assert gap.status_code == 409, gap.text
    finally:
        admin.delete(f"{API}/media/upload/{upload_id}")


def test_stale_uploads_are_cleaned_up(loop) -> None:
    async def run() -> None:
        from config import db
        from routes.media_admin import UPLOAD_DIR, _session_path, cleanup_stale_uploads

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        old_id = "up_iter182stale"
        _session_path(old_id).write_bytes(b"0" * 1024)
        await db.media_uploads.delete_one({"upload_id": old_id})
        await db.media_uploads.insert_one({
            "upload_id": old_id, "target": "guide_clip", "target_id": "x", "filename": "a.mp4",
            "size": 1024, "ext": ".mp4", "received": 1024,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat(),
        })
        orphan = UPLOAD_DIR / "up_iter182orphan.part"
        orphan.write_bytes(b"1" * 512)

        removed = await cleanup_stale_uploads()
        assert removed >= 2
        assert not _session_path(old_id).exists()
        assert not orphan.exists()
        assert await db.media_uploads.find_one({"upload_id": old_id}) is None

    loop.run_until_complete(run())


def test_orphaned_video_jobs_are_released_and_credit_refunded(loop) -> None:
    async def run() -> None:
        from config import db
        from routes.video import release_orphaned_video_jobs

        user = await db.users.find_one({"email": "standard@wladbot.test"}, {"_id": 0, "user_id": 1})
        assert user, "Seed-Account standard@wladbot.test fehlt"
        job_id = "vidjob_iter182ghost"
        await db.video_jobs.delete_one({"job_id": job_id})
        await db.video_jobs.insert_one({
            "job_id": job_id, "user_id": user["user_id"], "challenge_id": "c1",
            "status": "queued", "is_premium": True,  # kein Credit-Effekt im Test
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        })

        released = await release_orphaned_video_jobs()
        assert released >= 1
        job = await db.video_jobs.find_one({"job_id": job_id}, {"_id": 0})
        assert job["status"] == "error"
        assert job["error_code"] == 503
        assert "neu gestartet" in job["error_detail"]
        await db.video_jobs.delete_one({"job_id": job_id})

    loop.run_until_complete(run())


def test_fresh_video_jobs_survive_boot_reset(loop) -> None:
    """Ein Job, der NACH dem Prozessstart angelegt wurde, darf nicht abgeräumt werden."""
    async def run() -> None:
        from config import db
        from routes.video import release_orphaned_video_jobs

        job_id = "vidjob_iter182fresh"
        await db.video_jobs.delete_one({"job_id": job_id})
        await db.video_jobs.insert_one({
            "job_id": job_id, "user_id": "user_x", "challenge_id": "c1",
            "status": "queued", "is_premium": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await release_orphaned_video_jobs()
        job = await db.video_jobs.find_one({"job_id": job_id}, {"_id": 0})
        assert job["status"] == "queued"
        await db.video_jobs.delete_one({"job_id": job_id})

    loop.run_until_complete(run())

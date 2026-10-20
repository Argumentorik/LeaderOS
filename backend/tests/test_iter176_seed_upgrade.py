"""Iter 176: Seed-Import hebt bestehende Prod-Clips auf neuere Videos (ohne Re-Render), außer bei laufendem Render."""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routes.guide import _SEED_FILE, _import_produced_seed  # noqa: E402
from config import db  # noqa: E402

SLUG = "start-1-willkommen"


def _seed_clip() -> dict:
    return next(c for c in json.loads(_SEED_FILE.read_text())["clips"] if c["slug"] == SLUG)


def test_seed_upgrades_older_clip_and_respects_running_render() -> None:
    seed = _seed_clip()

    async def run() -> tuple[dict, dict, str, str]:
        original = await db.guide_clips.find_one({"slug": SLUG}, {"_id": 0})
        await _import_produced_seed()
        after_noop = await db.guide_clips.find_one({"slug": SLUG}, {"_id": 0, "updated_at": 1})
        try:
            # 1) Alter Prod-Stand: älteres Video → muss auf Seed gehoben werden, `published` bleibt Prod-Wert
            await db.guide_clips.update_one({"slug": SLUG}, {"$set": {"video_path": "guide/alt.mp4", "updated_at": "2026-09-01T00:00:00+00:00", "published": False}})
            await _import_produced_seed()
            upgraded = await db.guide_clips.find_one({"slug": SLUG}, {"_id": 0})
            # 2) Laufender Render → nicht anfassen
            await db.guide_clips.update_one({"slug": SLUG}, {"$set": {"video_path": None, "status": "full_running", "updated_at": "2026-09-01T00:00:00+00:00"}})
            await _import_produced_seed()
            untouched = await db.guide_clips.find_one({"slug": SLUG}, {"_id": 0})
            return upgraded, untouched, original["updated_at"], after_noop["updated_at"]
        finally:
            await db.guide_clips.replace_one({"slug": SLUG}, original)

    upgraded, untouched, before, after = asyncio.run(run())
    assert before == after  # identisches Video → kein Schreibzugriff
    assert upgraded["video_path"] == seed["video_path"]
    assert upgraded["media_token"] == seed["media_token"]
    assert upgraded["published"] is False  # Prod-Sichtbarkeit nicht überschrieben
    assert untouched["status"] == "full_running" and untouched["video_path"] is None


"""Stellt den Teaser-Status nach dem PUT-Regressionstest wieder auf video_ready.

save_script setzt status='script_ready' — der Testauftrag verlangte aber ein
Abschluss-Speichern des Originaltexts. Das Video existiert unverändert weiter.
"""
import asyncio
import os
import sys

sys.path.insert(0, "/app/backend")
os.chdir("/app/backend")

from config import db  # noqa: E402


async def main():
    clip = await db.guide_clips.find_one({"slug": "teaser-spotlight"}, {"_id": 0, "status": 1, "video_path": 1})
    print("before:", clip and clip.get("status"), bool(clip and clip.get("video_path")))
    if clip and clip.get("video_path"):
        await db.guide_clips.update_one({"slug": "teaser-spotlight"}, {"$set": {"status": "video_ready", "error": None}})
    clip = await db.guide_clips.find_one({"slug": "teaser-spotlight"}, {"_id": 0, "status": 1, "script": 1})
    print("after:", clip.get("status"), "|", clip.get("script"))


asyncio.run(main())

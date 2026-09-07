"""Kurs-Bibliothek: 10 Kurse / 72 Folgen, Freischaltung nach Tier, Videos per Admin-Upload."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from config import db
from course_content import COURSES, course_view
from routes.admin import require_admin
from routes.guide import _serve_object
from routes.uploads import put_object
from services import get_current_user
from services_tier import resolve_user_tier

router = APIRouter(prefix="/api/courses", tags=["courses"])

_BY_SLUG = {c["slug"]: c for c in COURSES}


async def _videos() -> dict[str, dict]:
    docs = await db.course_videos.find({}, {"_id": 0}).to_list(500)
    return {d["episode_id"]: d for d in docs}


async def _progress(user_id: str) -> set[str]:
    docs = await db.course_progress.find({"user_id": user_id}, {"_id": 0, "episode_id": 1}).to_list(500)
    return {d["episode_id"] for d in docs}


async def _tier(user: dict) -> str:
    info = await resolve_user_tier(user)
    return info.get("tier") if info.get("active", True) else "free"


@router.get("")
async def list_courses(request: Request):
    user = await get_current_user(request)
    tier, videos, seen = await _tier(user), await _videos(), await _progress(user["user_id"])
    out = []
    for c in COURSES:
        v = course_view(c, tier, videos)
        for e in v["episodes"]:
            e["seen"] = e["id"] in seen
        v["seen_count"] = sum(1 for e in v["episodes"] if e["seen"])
        v["episodes"] = [{k: e[k] for k in ("id", "number", "title", "minutes", "free_preview", "unlocked", "video_ready", "seen")} for e in v["episodes"]]
        out.append(v)
    return {"tier": tier, "courses": out, "total_episodes": sum(c["episode_count"] for c in out)}


@router.get("/{slug}")
async def get_course(slug: str, request: Request):
    user = await get_current_user(request)
    course = _BY_SLUG.get(slug)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    v = course_view(course, await _tier(user), await _videos())
    seen = await _progress(user["user_id"])
    for e in v["episodes"]:
        e["seen"] = e["id"] in seen
    return v


@router.post("/episodes/{episode_id}/seen")
async def mark_seen(episode_id: str, request: Request):
    user = await get_current_user(request)
    await db.course_progress.update_one(
        {"user_id": user["user_id"], "episode_id": episode_id},
        {"$set": {"seen_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True}


@router.get("/episodes/{episode_id}/video")
@router.head("/episodes/{episode_id}/video")
async def stream_episode_video(episode_id: str, request: Request):
    """Hochgeladene Folge streamen (Range-fähig) — nur wenn die Folge für den Nutzer frei ist."""
    user = await get_current_user(request)
    slug, _, num = episode_id.rpartition("-")
    course = _BY_SLUG.get(slug)
    vid = await db.course_videos.find_one({"episode_id": episode_id}, {"_id": 0})
    if not course or not vid or not vid.get("storage_path"):
        raise HTTPException(status_code=404, detail="Video nicht gefunden")
    v = course_view(course, await _tier(user), {episode_id: vid})
    ep = next((e for e in v["episodes"] if e["id"] == episode_id), None)
    if not ep or not ep["unlocked"]:
        raise HTTPException(status_code=403, detail="Diese Folge ist in deinem Paket nicht enthalten.")
    return await _serve_object(request, vid["storage_path"], "video/mp4")


class VideoIn(BaseModel):
    video_url: str


@router.put("/admin/episodes/{episode_id}/video")
async def set_episode_video(episode_id: str, data: VideoIn, request: Request):
    """Video-URL (z. B. Vimeo/YouTube/Storage) für eine Folge hinterlegen."""
    await require_admin(request)
    await db.course_videos.update_one({"episode_id": episode_id}, {"$set": {
        "video_url": data.video_url.strip(), "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True, "episode_id": episode_id}


@router.post("/admin/episodes/{episode_id}/upload")
async def upload_episode_video(episode_id: str, request: Request, file: UploadFile = File(...)):
    """MP4 direkt hochladen (Object Storage) — für Wlads Aufnahmen."""
    await require_admin(request)
    data = await file.read()
    if len(data) > 800 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Datei zu groß (max. 800 MB)")
    path = f"courses/{episode_id}/{uuid.uuid4().hex[:8]}.mp4"
    put_object(path, data, "video/mp4")
    url = f"/api/courses/episodes/{episode_id}/video"
    await db.course_videos.update_one({"episode_id": episode_id}, {"$set": {
        "video_url": url, "storage_path": path, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True, "episode_id": episode_id, "video_url": url}

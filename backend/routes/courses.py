"""Kurs-Bibliothek: 10 Kurse / 72 Folgen, Freischaltung nach Tier, Videos per Admin-Upload."""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from config import db
from course_content import CATEGORIES, COURSES, course_view
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


async def _thumbnails() -> dict[str, str]:
    docs = await db.course_meta.find({"thumbnail_url": {"$exists": True}}, {"_id": 0, "slug": 1, "thumbnail_url": 1}).to_list(100)
    return {d["slug"]: d["thumbnail_url"] for d in docs}


def _decorate(v: dict, seen: set[str], thumbs: dict[str, str]) -> dict:
    """Fortschritt, „Neu“-Flag, nächste Folge und Thumbnail-Override auf eine course_view legen."""
    for e in v["episodes"]:
        e["seen"] = e["id"] in seen
    v["seen_count"] = sum(1 for e in v["episodes"] if e["seen"])
    fresh = datetime.now(timezone.utc) - timedelta(days=14)
    v["is_new"] = any(
        e["video_updated_at"] and datetime.fromisoformat(e["video_updated_at"]) >= fresh for e in v["episodes"]
    )
    nxt = next((e for e in v["episodes"] if e["unlocked"] and not e["seen"]), None)
    v["next_episode"] = nxt["number"] if nxt else None
    if v["slug"] in thumbs:
        v["thumbnail_url"] = thumbs[v["slug"]]
    return v


@router.get("")
async def list_courses(request: Request):
    user = await get_current_user(request)
    tier, videos, seen, thumbs = await _tier(user), await _videos(), await _progress(user["user_id"]), await _thumbnails()
    out = []
    for c in COURSES:
        v = _decorate(course_view(c, tier, videos), seen, thumbs)
        v["episodes"] = [{k: e[k] for k in ("id", "number", "title", "minutes", "free_preview", "unlocked", "video_ready", "seen")} for e in v["episodes"]]
        out.append(v)
    return {
        "tier": tier, "courses": out,
        "categories": CATEGORIES,
        "total_episodes": sum(c["episode_count"] for c in out),
        "seen_total": sum(c["seen_count"] for c in out),
    }


@router.get("/{slug}")
async def get_course(slug: str, request: Request):
    user = await get_current_user(request)
    course = _BY_SLUG.get(slug)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    v = course_view(course, await _tier(user), await _videos())
    return _decorate(v, await _progress(user["user_id"]), await _thumbnails())


class ThumbnailIn(BaseModel):
    thumbnail_url: str


@router.put("/admin/{slug}/thumbnail")
async def set_course_thumbnail(slug: str, data: ThumbnailIn, request: Request):
    """Vorschaubild eines Kurses überschreiben (Standard: /courses/<slug>.jpg)."""
    await require_admin(request)
    if slug not in _BY_SLUG:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    await db.course_meta.update_one({"slug": slug}, {"$set": {
        "thumbnail_url": data.thumbnail_url.strip(), "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True, "slug": slug}


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


@router.get("/episodes/{episode_id}/poster")
async def episode_poster(episode_id: str, request: Request):
    """Vorschaubild einer Folge: Standbild aus dem hochgeladenen Video (eigene Sekunde möglich)
    oder Vimeo-Standbild. Ohne Video: 404 — die App zeigt dann die gestaltete Ersatzkachel."""
    await get_current_user(request)
    vid = await db.course_videos.find_one({"episode_id": episode_id}, {"_id": 0})
    if not vid:
        raise HTTPException(status_code=404, detail="Kein Vorschaubild")
    slug, _, num = episode_id.rpartition("-")
    course = _BY_SLUG.get(slug) or {}
    title = ""
    try:
        title = course["episodes"][int(num) - 1]["title"]
    except (KeyError, IndexError, ValueError):
        title = course.get("title", "")
    if vid.get("storage_path"):
        at = float(vid.get("poster_at") or 1.5)
        return await _serve_object(request, vid["storage_path"], "image/jpeg", poster=True,
                                   title=title, kicker="Kurs", at=at)
    if vid.get("vimeo_thumbnail"):
        return RedirectResponse(vid["vimeo_thumbnail"], status_code=302)
    raise HTTPException(status_code=404, detail="Kein Vorschaubild")


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

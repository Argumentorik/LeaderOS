"""Kurs-Bibliothek: 10 Kurse / 72 Folgen, Freischaltung nach Tier, Videos per Admin-Upload."""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import PlainTextResponse, RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from config import db
from course_content import CATEGORIES, COURSES, course_view
from course_launch import launch_info
from routes.admin import require_admin
from routes.guide import _serve_object
from routes.uploads import put_object
from services import get_current_user
from services_tier import resolve_user_tier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/courses", tags=["courses"])

_BY_SLUG = {c["slug"]: c for c in COURSES}

# Plan Iter 187: Das E-Mail-Tor gilt einmal, nicht pro Folge. Der Merker liegt
# im Cookie, der Eintrag in `course_leads`.
LEAD_COOKIE = "los_course_lead"
LEAD_COOKIE_DAYS = 180


async def _maybe_user(request: Request) -> dict | None:
    """Kurse sind öffentlich lesbar — Login ist nur ein Plus."""
    try:
        return await get_current_user(request)
    except Exception:
        return None


async def _lead_ok(request: Request) -> bool:
    token = request.cookies.get(LEAD_COOKIE)
    if not token:
        return False
    return bool(await db.course_leads.find_one({"token": token}, {"_id": 1}))


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
    """Öffentlich: der ganze Studienplan. Eingeloggt zusätzlich Fortschritt und Zugang."""
    user = await _maybe_user(request)
    info = launch_info()
    lead_ok = await _lead_ok(request)
    tier = await _tier(user) if user else "free"
    videos, thumbs = await _videos(), await _thumbnails()
    seen = await _progress(user["user_id"]) if user else set()
    out = []
    for c in COURSES:
        v = _decorate(course_view(c, tier, videos, launched=info["launched"], lead_ok=lead_ok), seen, thumbs)
        v["episodes"] = [{k: e[k] for k in ("id", "number", "title", "minutes", "free_preview", "unlocked", "gate", "video_ready", "seen")} for e in v["episodes"]]
        out.append(v)
    return {
        "tier": tier, "courses": out,
        "categories": CATEGORIES,
        "authenticated": bool(user),
        "has_access": bool(out and out[0]["has_access"]),
        "lead_registered": lead_ok,
        "launch": info,
        "total_courses": len(out),
        "total_episodes": sum(c["episode_count"] for c in out),
        "total_minutes": sum(c["minutes_total"] for c in out),
        "seen_total": sum(c["seen_count"] for c in out),
    }


@router.get("/{slug}")
async def get_course(slug: str, request: Request):
    user = await _maybe_user(request)
    course = _BY_SLUG.get(slug)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    info = launch_info()
    tier = await _tier(user) if user else "free"
    lead_ok = await _lead_ok(request)
    v = course_view(course, tier, await _videos(), launched=info["launched"], lead_ok=lead_ok)
    seen = await _progress(user["user_id"]) if user else set()
    out = _decorate(v, seen, await _thumbnails())
    out["launch"] = info
    out["authenticated"] = bool(user)
    out["lead_registered"] = lead_ok
    return out


class LeadIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    episode_id: str | None = Field(None, max_length=80)


@router.post("/lead")
async def register_lead(data: LeadIn, request: Request, response: Response):
    """Vorname + E-Mail → die vorhandenen Folgen sind für diesen Besucher offen."""
    user = await _maybe_user(request)
    email = str(data.email).strip().lower()
    slug = (data.episode_id or "").rpartition("-")[0]
    course = _BY_SLUG.get(slug)
    doc = {
        "name": data.name.strip(),
        "email": email,
        "episode_id": data.episode_id or "",
        "course_slug": slug,
        "course_title": course["title"] if course else "",
        "user_id": user["user_id"] if user else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.course_leads.update_one(
        {"email": email},
        {"$set": doc, "$setOnInsert": {"token": uuid.uuid4().hex,
                                       "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True)
    row = await db.course_leads.find_one({"email": email}, {"_id": 0, "token": 1})
    response.set_cookie(LEAD_COOKIE, row["token"], max_age=LEAD_COOKIE_DAYS * 86400,
                        httponly=True, samesite="lax", secure=True, path="/")
    logger.info("Kurs-Interessent eingetragen: %s (%s)", email, slug or "ohne Folge")
    return {"ok": True, "unlocked": True,
            "message": "Danke — die vorhandenen Folgen sind jetzt für dich offen."}


@router.get("/admin/leads")
async def list_leads(request: Request, limit: int = 500):
    """Interessenten aus dem E-Mail-Tor — für den Vertrieb."""
    await require_admin(request)
    rows = await db.course_leads.find({}, {"_id": 0, "token": 0}).sort("updated_at", -1).to_list(limit)
    return {"count": await db.course_leads.count_documents({}), "leads": rows}


@router.get("/admin/leads.csv")
async def export_leads(request: Request):
    await require_admin(request)
    rows = await db.course_leads.find({}, {"_id": 0, "token": 0}).sort("updated_at", -1).to_list(5000)
    lines = ["Name;E-Mail;Kurs;Folge;Eingetragen"]
    for r in rows:
        lines.append(";".join([
            str(r.get("name", "")).replace(";", ","),
            r.get("email", ""),
            str(r.get("course_title", "")).replace(";", ","),
            r.get("episode_id", ""),
            r.get("created_at", r.get("updated_at", "")),
        ]))
    return PlainTextResponse("\n".join(lines), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="kurs-interessenten.csv"'})


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
    user = await _maybe_user(request)
    slug, _, num = episode_id.rpartition("-")
    course = _BY_SLUG.get(slug)
    vid = await db.course_videos.find_one({"episode_id": episode_id}, {"_id": 0})
    if not course or not vid or not vid.get("storage_path"):
        raise HTTPException(status_code=404, detail="Video nicht gefunden")
    tier = await _tier(user) if user else "free"
    v = course_view(course, tier, {episode_id: vid}, lead_ok=await _lead_ok(request))
    ep = next((e for e in v["episodes"] if e["id"] == episode_id), None)
    if not ep or not ep["unlocked"]:
        raise HTTPException(status_code=403, detail="Diese Folge ist in deinem Paket nicht enthalten.")
    return await _serve_object(request, vid["storage_path"], "video/mp4")


async def ensure_episode_poster(vid: dict, title: str, force: bool = False) -> str | None:
    """Iter 185: Vorschaubild einer Kursfolge EINMAL erzeugen und dauerhaft ablegen.

    Kundenmeldung „die Thumbnails sind nicht immer da": Bisher wurde das Bild
    bei jedem Abruf frisch aus dem Video gezogen — schlägt das fehl, bleibt die
    Kachel leer. Jetzt liegt ein kleines JPEG im Speicher.
    """
    import asyncio

    from routes.guide import _local_poster, _render_version
    from routes.uploads import object_exists, put_object

    path = vid.get("storage_path")
    if not path:
        return None
    want = f"{_render_version(path) or '0'}-{vid.get('poster_at') or 1.5}"
    stored = vid.get("poster_path")
    if not force and stored and vid.get("poster_built_version") == want:
        if await asyncio.to_thread(object_exists, stored):
            return stored
    local = await asyncio.to_thread(
        _local_poster, path, title, "Kurs", float(vid.get("poster_at") or 1.5),
    )
    storage_path = f"posters/courses/{vid['episode_id']}/{want}.jpg"
    await asyncio.to_thread(put_object, storage_path, local.read_bytes(), "image/jpeg")
    await db.course_videos.update_one({"episode_id": vid["episode_id"]}, {"$set": {
        "poster_path": storage_path, "poster_built_version": want,
    }})
    return storage_path


@router.get("/episodes/{episode_id}/poster")
async def episode_poster(episode_id: str, request: Request):
    """Vorschaubild einer Folge: Standbild aus dem hochgeladenen Video (eigene Sekunde möglich)
    oder Vimeo-Standbild. Ohne Video: 404 — die App zeigt dann die gestaltete Ersatzkachel."""
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
        # Iter 185: zuerst das dauerhaft gespeicherte Bild, sonst einmalig erzeugen.
        try:
            stored = await ensure_episode_poster(vid, title)
        except Exception as e:
            logger.warning("Kurs-Vorschaubild fehlgeschlagen (%s): %s", episode_id, e)
            stored = None
        if stored:
            return await _serve_object(request, stored, "image/jpeg")
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

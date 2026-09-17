"""Ein Video-Feld für alle: generiert · Vimeo-Link · eigenes Video hochladen.

Gilt für Wlad-Guide-Clips (`guide_clips`) und Kurs-Folgen (`course_videos`).
Uploads laufen in Stücken (Chunks), damit große Dateien den Proxy nicht sprengen:
    init  → chunk (n×) → complete
Das generierte Video wird NIE überschrieben — Umschalten auf „generiert" ist
jederzeit möglich. Download ist admin-only (Kunden bekommen keinen).
"""
from __future__ import annotations

import asyncio
import re
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import db, logger
from routes.admin import require_admin
from routes.guide import _active_video, _media_url, _render_version, ensure_poster, posters_backfill, posters_status
from routes.uploads import download_object, put_object

router = APIRouter(prefix="/api/media", tags=["media-admin"])

MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024  # 2 GB je Datei
CHUNK_SIZE = 8 * 1024 * 1024               # 8 MB je Stück
ALLOWED_EXT = {".mp4", ".mov"}
ALLOWED_TYPES = {"video/mp4", "video/quicktime", "application/octet-stream"}
UPLOAD_DIR = Path(tempfile.gettempdir()) / "media_uploads"
TARGETS = ("guide_clip", "course_episode")
STALE_UPLOAD_HOURS = 12
VIMEO_RE = re.compile(r"(?:vimeo\.com/|player\.vimeo\.com/video/)(\d+)")


# ── Vimeo ───────────────────────────────────────────────────────────────────

def _vimeo_id(value: str) -> str | None:
    value = (value or "").strip()
    if value.isdigit():
        return value
    m = VIMEO_RE.search(value)
    return m.group(1) if m else None


async def _check_vimeo(value: str) -> dict:
    """Vor dem Speichern prüfen: existiert das Video und ist es einbettbar?"""
    vid = _vimeo_id(value)
    if not vid:
        raise HTTPException(status_code=400, detail="Kein Vimeo-Link erkannt. Beispiel: https://vimeo.com/123456789 oder nur die ID.")
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get("https://vimeo.com/api/oembed.json", params={"url": f"https://vimeo.com/{vid}"})
    except Exception as e:
        logger.warning("Vimeo-Prüfung nicht möglich (%s)", e)
        raise HTTPException(status_code=503, detail="Vimeo ist gerade nicht erreichbar. Bitte in einer Minute erneut speichern.")
    if resp.status_code in (403, 401):
        raise HTTPException(status_code=400, detail="Dieses Vimeo-Video ist privat oder nicht einbettbar. Stelle es in Vimeo auf einbettbar und speichere erneut.")
    if resp.status_code == 404:
        raise HTTPException(status_code=400, detail="Kein Vimeo-Video unter diesem Link gefunden. Bitte Link prüfen.")
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Vimeo antwortet mit Fehler {resp.status_code}. Bitte Link prüfen.")
    data = resp.json()
    return {
        "vimeo_id": vid,
        "vimeo_url": f"https://vimeo.com/{vid}",
        "vimeo_thumbnail": data.get("thumbnail_url") or None,
        "vimeo_title": data.get("title") or "",
        "duration": data.get("duration") or None,
    }


class VimeoIn(BaseModel):
    url: str


@router.post("/vimeo/check")
async def vimeo_check(data: VimeoIn, request: Request):
    await require_admin(request)
    return await _check_vimeo(data.url)


# ── Ziel-Dokumente ──────────────────────────────────────────────────────────

async def _guide_clip(slug: str) -> dict:
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    return clip


async def _patch_guide(slug: str, patch: dict) -> None:
    await db.guide_clips.update_one({"slug": slug}, {"$set": {**patch, "updated_at": datetime.now(timezone.utc).isoformat()}})


async def _patch_episode(episode_id: str, patch: dict) -> None:
    await db.course_videos.update_one({"episode_id": episode_id}, {"$set": {
        **patch, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)


# ── Quelle umschalten ───────────────────────────────────────────────────────

class SourceIn(BaseModel):
    source: str                 # generated | vimeo | upload
    vimeo_url: str | None = None


@router.put("/source/guide/{slug}")
async def set_guide_source(slug: str, data: SourceIn, request: Request):
    await require_admin(request)
    clip = await _guide_clip(slug)
    if data.source not in ("generated", "vimeo", "upload"):
        raise HTTPException(status_code=400, detail="Quelle muss generated, vimeo oder upload sein")
    patch: dict = {"video_source": data.source}
    if data.source == "vimeo":
        patch.update(await _check_vimeo(data.vimeo_url or clip.get("vimeo_url") or ""))
    if data.source == "upload" and not clip.get("custom_video_path"):
        raise HTTPException(status_code=400, detail="Es ist noch kein eigenes Video hochgeladen.")
    if data.source == "generated" and not clip.get("video_path"):
        raise HTTPException(status_code=400, detail="Für diesen Clip gibt es kein generiertes Video.")
    await _patch_guide(slug, patch)
    return {"ok": True, "video_source": data.source}


@router.put("/source/course/{episode_id}")
async def set_course_source(episode_id: str, data: SourceIn, request: Request):
    await require_admin(request)
    if data.source not in ("vimeo", "upload"):
        raise HTTPException(status_code=400, detail="Kurs-Folgen können Vimeo-Link oder eigenes Video nutzen")
    vid = await db.course_videos.find_one({"episode_id": episode_id}, {"_id": 0}) or {}
    patch: dict = {"video_source": data.source}
    if data.source == "vimeo":
        info = await _check_vimeo(data.vimeo_url or vid.get("vimeo_url") or "")
        patch.update(info)
        patch["video_url"] = info["vimeo_url"]
    else:
        if not vid.get("storage_path"):
            raise HTTPException(status_code=400, detail="Es ist noch kein eigenes Video hochgeladen.")
        patch["video_url"] = f"/api/courses/episodes/{episode_id}/video"
    await _patch_episode(episode_id, patch)
    return {"ok": True, "video_source": data.source}


# ── Vorschaubild: Sekunde aus dem Video wählen ──────────────────────────────

class PosterAtIn(BaseModel):
    at: float


def _validated_at(at: float) -> float:
    if at < 0 or at > 3600:
        raise HTTPException(status_code=400, detail="Sekunde muss zwischen 0 und 3600 liegen")
    return round(float(at), 2)


@router.post("/poster-at/guide/{slug}")
async def set_guide_poster_at(slug: str, data: PosterAtIn, request: Request):
    await require_admin(request)
    clip = await _guide_clip(slug)
    at = _validated_at(data.at)
    await _patch_guide(slug, {"poster_at": at})
    _, path = _active_video(clip)
    token = clip.get("media_token")
    version = f"{_render_version(path)}-{at}" if path else None
    # Iter 183: Bild sofort mit der neuen Sekunde dauerhaft erzeugen.
    if path:
        try:
            await ensure_poster({**clip, "poster_at": at}, force=True)
        except Exception as e:
            logger.warning("Vorschaubild (neue Sekunde) fehlgeschlagen: %s", e)
    return {"ok": True, "poster_at": at,
            "poster_url": _media_url(token, "poster", version) if token and path else None}


# ── Vorschaubilder: Übersicht + Nachziehen (Iter 183) ───────────────────────

async def _course_episode_title(episode_id: str) -> str:
    from course_content import COURSES

    slug, _, num = episode_id.rpartition("-")
    course = next((c for c in COURSES if c["slug"] == slug), None)
    if not course:
        return episode_id
    try:
        return course["episodes"][int(num) - 1]["title"]
    except (KeyError, IndexError, ValueError):
        return course.get("title", episode_id)


async def _course_posters_status() -> dict:
    """Iter 185: Kursfolgen zählen mit — geprüft wird die Abrufbarkeit."""
    from routes.uploads import object_exists

    missing, ready = [], []
    async for vid in db.course_videos.find({}, {"_id": 0}):
        if not vid.get("storage_path"):
            if vid.get("vimeo_thumbnail"):
                ready.append({"episode_id": vid["episode_id"], "source": "vimeo"})
            continue
        stored = vid.get("poster_path")
        if stored and await asyncio.to_thread(object_exists, stored):
            ready.append({"episode_id": vid["episode_id"], "source": "upload"})
        else:
            missing.append({"episode_id": vid["episode_id"],
                            "reason": "kein gespeichertes Bild" if not stored else "Bild nicht abrufbar"})
    return {"missing": missing, "ready": ready,
            "missing_count": len(missing), "ready_count": len(ready)}


@router.get("/posters")
async def posters_overview(request: Request):
    """Welche Videos haben noch kein dauerhaft abrufbares Vorschaubild?"""
    await require_admin(request)
    data = await posters_status()
    data["courses"] = await _course_posters_status()
    data["missing_count"] += data["courses"]["missing_count"]
    data["ready_count"] += data["courses"]["ready_count"]
    data["missing"] = data["missing"] + [
        {"slug": m["episode_id"], "title": m["episode_id"], "kind": "course", "reason": m["reason"]}
        for m in data["courses"]["missing"]
    ]
    return data


@router.post("/posters/backfill")
async def posters_backfill_endpoint(request: Request, force: bool = False):
    """Alle fehlenden Vorschaubilder in einem Durchgang nachziehen (keine Render-Kosten)."""
    await require_admin(request)
    result = await posters_backfill(force=force)
    from routes.courses import ensure_episode_poster

    built, failed = [], []
    async for vid in db.course_videos.find({"storage_path": {"$nin": [None, ""]}}, {"_id": 0}):
        try:
            title = await _course_episode_title(vid["episode_id"])
            if await ensure_episode_poster(vid, title, force=force):
                built.append(vid["episode_id"])
        except Exception as e:
            logger.warning("Kurs-Vorschaubild fehlgeschlagen (%s): %s", vid.get("episode_id"), e)
            failed.append({"slug": vid.get("episode_id"), "error": str(e)[:160]})
    result["courses_built"] = built
    result["failed"] = (result.get("failed") or []) + failed
    return result


@router.post("/poster-at/course/{episode_id}")
async def set_course_poster_at(episode_id: str, data: PosterAtIn, request: Request):
    await require_admin(request)
    at = _validated_at(data.at)
    await _patch_episode(episode_id, {"poster_at": at})
    return {"ok": True, "poster_at": at, "poster_url": f"/api/courses/episodes/{episode_id}/poster?v={at}"}


# ── Upload in Stücken ───────────────────────────────────────────────────────

class InitIn(BaseModel):
    target: str                 # guide_clip | course_episode
    target_id: str
    filename: str
    size: int
    content_type: str | None = None


def _session_path(upload_id: str) -> Path:
    return UPLOAD_DIR / f"{upload_id}.part"


@router.post("/upload/init")
async def upload_init(data: InitIn, request: Request):
    await require_admin(request)
    if data.target not in TARGETS:
        raise HTTPException(status_code=400, detail="Unbekanntes Ziel")
    ext = Path(data.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Nur MP4 oder MOV — bitte Datei vorher umwandeln.")
    if data.size <= 0 or data.size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Datei zu groß (max. 2 GB je Video).")
    if data.target == "guide_clip":
        await _guide_clip(data.target_id)
    upload_id = f"up_{uuid.uuid4().hex[:16]}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    _session_path(upload_id).write_bytes(b"")
    await db.media_uploads.insert_one({
        "upload_id": upload_id, "target": data.target, "target_id": data.target_id,
        "filename": data.filename, "size": data.size, "ext": ext, "received": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"upload_id": upload_id, "chunk_size": CHUNK_SIZE}


async def _session(upload_id: str) -> dict:
    doc = await db.media_uploads.find_one({"upload_id": upload_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Upload nicht gefunden — bitte neu starten.")
    return doc


@router.post("/upload/{upload_id}/chunk")
async def upload_chunk(upload_id: str, request: Request):
    await require_admin(request)
    session = await _session(upload_id)
    chunk = await request.body()
    if not chunk:
        raise HTTPException(status_code=400, detail="Leeres Stück empfangen")
    path = _session_path(upload_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Upload-Datei nicht mehr vorhanden — bitte neu starten.")

    # Iter 182: Jedes Stück nennt seine Position. Ein wiederholt gesendetes Stück
    # (Netz-Wackler, Retry) landet dadurch an derselben Stelle statt doppelt am
    # Dateiende — vorher wurde die Datei dabei unbrauchbar.
    on_disk = path.stat().st_size
    raw_offset = request.headers.get("X-Chunk-Offset")
    if raw_offset is None:
        offset = on_disk
    else:
        try:
            offset = int(raw_offset)
        except ValueError:
            raise HTTPException(status_code=400, detail="Ungültige Chunk-Position") from None
    if offset < 0 or offset > on_disk:
        raise HTTPException(
            status_code=409,
            detail=f"Upload steht bei {on_disk} Bytes. Bitte ab dieser Stelle weitersenden.",
        )
    if offset + len(chunk) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Datei zu groß (max. 2 GB je Video).")

    with path.open("r+b") as f:
        f.seek(offset)
        f.write(chunk)
    received = path.stat().st_size
    await db.media_uploads.update_one({"upload_id": upload_id}, {"$set": {
        "received": received, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"received": received, "size": session["size"],
            "percent": round(min(100.0, received / max(1, session["size"]) * 100), 1)}


def _probe_duration(path: Path) -> float | None:
    try:
        from services_video_compose import probe
        return round(probe(str(path))["duration"], 2) or None
    except Exception as e:
        logger.warning("Upload-Probe fehlgeschlagen: %s", e)
        return None


@router.post("/upload/{upload_id}/complete")
async def upload_complete(upload_id: str, request: Request):
    await require_admin(request)
    session = await _session(upload_id)
    path = _session_path(upload_id)
    if not path.exists() or path.stat().st_size == 0:
        raise HTTPException(status_code=400, detail="Es wurden keine Daten empfangen — bitte Upload erneut starten.")
    duration = _probe_duration(path)
    if duration is None:
        path.unlink(missing_ok=True)
        await db.media_uploads.delete_one({"upload_id": upload_id})
        raise HTTPException(status_code=400, detail="Datei ist kein abspielbares Video (MP4/MOV) oder wurde unterwegs abgebrochen.")
    target, target_id, ext = session["target"], session["target_id"], session["ext"]
    version = uuid.uuid4().hex[:8]
    storage_path = f"uploads/{target}/{target_id}/{version}{ext}"
    content_type = "video/quicktime" if ext == ".mov" else "video/mp4"
    try:
        put_object(storage_path, path.read_bytes(), content_type)
    except Exception as e:
        logger.error("Upload in den Speicher fehlgeschlagen: %s", e)
        raise HTTPException(status_code=502, detail="Speichern fehlgeschlagen. Bitte Upload erneut starten.")
    finally:
        path.unlink(missing_ok=True)
        await db.media_uploads.delete_one({"upload_id": upload_id})

    if target == "guide_clip":
        clip = await _guide_clip(target_id)
        await _patch_guide(target_id, {
            "custom_video_path": storage_path, "custom_duration_seconds": duration,
            "custom_filename": session["filename"], "custom_uploaded_at": datetime.now(timezone.utc).isoformat(),
            "video_source": "upload", "poster_at": None,
        })
        # Iter 183: Vorschaubild direkt aus dem neuen Video erzeugen und speichern.
        try:
            await ensure_poster({**clip, "custom_video_path": storage_path,
                                 "video_source": "upload", "poster_at": None}, force=True)
        except Exception as e:
            logger.warning("Vorschaubild nach Upload fehlgeschlagen: %s", e)
        token = clip.get("media_token")
        return {"ok": True, "duration_seconds": duration, "video_source": "upload",
                "video_url": _media_url(token, "custom", version) if token else None,
                "poster_url": _media_url(token, "poster", version) if token else None}

    await _patch_episode(target_id, {
        "storage_path": storage_path, "duration_seconds": duration, "video_source": "upload",
        "video_url": f"/api/courses/episodes/{target_id}/video", "poster_at": None,
        "uploaded_filename": session["filename"],
    })
    return {"ok": True, "duration_seconds": duration, "video_source": "upload",
            "video_url": f"/api/courses/episodes/{target_id}/video?v={version}",
            "poster_url": f"/api/courses/episodes/{target_id}/poster?v={version}"}


async def cleanup_stale_uploads(max_age_hours: int = STALE_UPLOAD_HOURS) -> int:
    """Iter 182: Abgebrochene Uploads (Tab zu, Netz weg, Neustart) räumen sich selbst auf —
    sonst liegen 2-GB-Stücke dauerhaft im /tmp des Pods und der Datensatz bleibt stehen."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
    stale = await db.media_uploads.find({"created_at": {"$lt": cutoff}}, {"_id": 0, "upload_id": 1}).to_list(1000)
    for doc in stale:
        _session_path(doc["upload_id"]).unlink(missing_ok=True)
    if stale:
        await db.media_uploads.delete_many({"upload_id": {"$in": [d["upload_id"] for d in stale]}})

    # Dateien ohne Datensatz (z. B. nach DB-Wechsel) ebenfalls entfernen.
    orphan_files = 0
    if UPLOAD_DIR.exists():
        known = {d["upload_id"] for d in await db.media_uploads.find({}, {"_id": 0, "upload_id": 1}).to_list(1000)}
        for part in UPLOAD_DIR.glob("*.part"):
            if part.stem not in known:
                part.unlink(missing_ok=True)
                orphan_files += 1
    total = len(stale) + orphan_files
    if total:
        logger.info("Verwaiste Video-Uploads aufgeräumt: %s Sitzungen, %s Dateien", len(stale), orphan_files)
    return total


@router.delete("/upload/{upload_id}")
async def upload_abort(upload_id: str, request: Request):
    await require_admin(request)
    _session_path(upload_id).unlink(missing_ok=True)
    await db.media_uploads.delete_one({"upload_id": upload_id})
    return {"ok": True}


# ── Download (nur Admin) ────────────────────────────────────────────────────

def _stream_download(storage_path: str, filename: str) -> StreamingResponse:
    tmp = UPLOAD_DIR / f"dl_{uuid.uuid4().hex[:10]}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    try:
        download_object(storage_path, str(tmp))
    except Exception as e:
        tmp.unlink(missing_ok=True)
        logger.error("Download aus dem Speicher fehlgeschlagen (%s): %s", storage_path, e)
        raise HTTPException(status_code=404, detail="Video nicht gefunden")

    def chunks():
        try:
            with tmp.open("rb") as f:
                while True:
                    block = f.read(1024 * 1024)
                    if not block:
                        break
                    yield block
        finally:
            tmp.unlink(missing_ok=True)

    media_type = "video/quicktime" if storage_path.lower().endswith(".mov") else "video/mp4"
    return StreamingResponse(chunks(), media_type=media_type, headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Length": str(tmp.stat().st_size),
        "Cache-Control": "private, no-store",
    })


@router.get("/download/guide/{slug}")
async def download_guide(slug: str, request: Request, variant: str = "live"):
    """Herunterladen → außerhalb schneiden → als eigenes Video wieder hochladen."""
    await require_admin(request)
    clip = await _guide_clip(slug)
    field = {"live": "video_path", "preview": "video_preview_path", "custom": "custom_video_path"}.get(variant)
    if not field:
        raise HTTPException(status_code=400, detail="variant muss live, preview oder custom sein")
    path = clip.get(field)
    if not path:
        raise HTTPException(status_code=404, detail="Für diese Fassung gibt es kein Video")
    ext = ".mov" if path.lower().endswith(".mov") else ".mp4"
    name = f"{slug}_{variant}_{_render_version(path)}{ext}"
    return _stream_download(path, name)


@router.get("/download/course/{episode_id}")
async def download_course(episode_id: str, request: Request):
    await require_admin(request)
    vid = await db.course_videos.find_one({"episode_id": episode_id}, {"_id": 0})
    if not vid or not vid.get("storage_path"):
        raise HTTPException(status_code=404, detail="Für diese Folge ist kein eigenes Video hinterlegt")
    path = vid["storage_path"]
    ext = ".mov" if path.lower().endswith(".mov") else ".mp4"
    return _stream_download(path, f"{episode_id}_{_render_version(path)}{ext}")


# ── Übersicht für das Admin-Panel ───────────────────────────────────────────

@router.get("/course-episodes")
async def course_episodes(request: Request):
    """Alle Kurs-Folgen mit aktueller Video-Quelle — Basis für die Admin-Verwaltung."""
    await require_admin(request)
    from course_content import COURSES

    videos = {d["episode_id"]: d for d in await db.course_videos.find({}, {"_id": 0}).to_list(1000)}
    out = []
    for course in COURSES:
        eps = []
        for i, e in enumerate(course["episodes"], start=1):
            ep_id = f"{course['slug']}-{i}"
            vid = videos.get(ep_id) or {}
            eps.append({
                "id": ep_id, "number": i, "title": e["title"], "minutes": e.get("minutes"),
                "video_source": vid.get("video_source") or ("vimeo" if vid.get("vimeo_id") else None),
                "vimeo_id": vid.get("vimeo_id"), "vimeo_url": vid.get("vimeo_url"),
                "has_upload": bool(vid.get("storage_path")),
                "uploaded_filename": vid.get("uploaded_filename"),
                "duration_seconds": vid.get("duration_seconds"),
                "poster_at": vid.get("poster_at"),
                "poster_url": f"/api/courses/episodes/{ep_id}/poster" if (vid.get("storage_path") or vid.get("vimeo_thumbnail")) else None,
                "ready": bool(vid.get("video_url")),
                "updated_at": vid.get("updated_at"),
            })
        out.append({"slug": course["slug"], "title": course["title"], "episodes": eps,
                    "ready": sum(1 for e in eps if e["ready"]), "total": len(eps)})
    return {"courses": out, "ready": sum(c["ready"] for c in out), "total": sum(c["total"] for c in out)}

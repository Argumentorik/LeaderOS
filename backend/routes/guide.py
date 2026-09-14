"""Guide-Videos (Iter 142): Erststart-Serie + Mission-Intros mit Wlad-Avatar.

Produktion läuft ausschließlich über den Admin-Bereich:
    Skript (Vorschlag) -> Wlad kürzt -> Stimme -> Video -> FREIGABE
Ohne Freigabe sieht kein Nutzer etwas. Nutzer bekommen immer mindestens das
Skript als Text, damit nie ein Loch in der Oberfläche entsteht.
"""

import asyncio
import base64
import subprocess
import hashlib
import json
import secrets
import tempfile
import threading
import uuid
from pathlib import Path
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from config import EMERGENT_LLM_KEY, db, logger
from guide_content import (
    BROLL_SCREENS, CLIP_SCREENS, CLIP_SETTING, FRAMES, SCRIPT_MAX_WORDS, SCRIPT_MIN_WORDS, SHOT_PRESETS,
    TALK_LEAD_AFTER_WALK_SECONDS, TALK_LEAD_SECONDS, TALK_MAX_SECONDS, TALK_MAX_SECONDS_PRO, TALK_MAX_SECONDS_SINGLE,
    TALK_TAIL_SECONDS, OUTRO_FADE_SECONDS, WLAD_STYLE_PROMPT, FILM_CARD_SECONDS, farewell_for, normalize_script, plan_shots,
    clip_questions, scene_for_aspect, seed_clips, style_prompt_for, talk_word_cap, word_count, word_limits,
)
from routes.admin import require_admin
from routes.uploads import download_object, get_object, put_object
from services import get_current_user
from services_guide_quality import godmode_check
from services_ai_errors import ai_http_error
from services_fal import (
    COST_I2V, COST_I2V_AUDIO, COST_I2V_PRO, COST_KEYFRAME, COST_LIPSYNC_PER_S, COST_OMNIHUMAN_PER_S, FalError, FalTimeout,
    clone_voice, edit_image, image_to_video, image_to_video_v26, add_ambience, generate_music, lipsync_video, omnihuman_video,
    render_talking_video, synthesize_speech,
)
from services_video_compose import (
    outro,
    BROLL_DIR, concat_segments, finish_video, mix_music_bed, normalize_segment, pad_audio, probe, render_broll,
    render_farewell_card, subtitle_chunks,
)

router = APIRouter(prefix="/api/guide", tags=["guide"])

SETTINGS_ID = "guide_settings"
DEFAULT_VOICE_ID = "Deep_Voice_Man"  # Minimax-Standardstimme, bis Wlads Klon steht
_JOBS: set = set()
SETTINGS_ASSETS = {"portrait": "portrait_path", "sample": "voice_sample_path", "body": "body_path", "signature": "signature_path"}
CLIP_MEDIA = {"video": "video_path", "audio": "audio_path", "padded": "audio_padded_path",
              "raw": "raw_video_path", "keyframe": "keyframe_path", "poster": "video_path", "preview": "video_preview_path",
              "custom": "custom_video_path"}
MEDIA_TYPES = {"video": "video/mp4", "raw": "video/mp4", "audio": "audio/mpeg", "padded": "audio/mpeg",
               "keyframe": "image/png", "poster": "image/jpeg", "preview": "video/mp4", "custom": "video/mp4"}
SHOT_MEDIA = {"keyframe": ("keyframe_path", "image/png"), "raw": ("raw_path", "video/mp4"),
              "audio": ("audio_path", "audio/mpeg"), "padded": ("padded_path", "audio/mpeg"),
              "synced": ("synced_path", "video/mp4"), "poster": ("keyframe_path", "image/jpeg")}


# ── Datenzugriff ────────────────────────────────────────────────────────────

_BOOT_RESET_DONE = False
_SEEDED_OK = False
_PROCESS_STARTED_AT = datetime.now(timezone.utc).isoformat()  # Iter 169: Boot-Reset trifft nur Läufe von VOR dem Neustart
_SEED_FILE = Path(__file__).resolve().parent.parent / "guide_seed_data.json"


_IN_PROGRESS_STATUSES = {"full_running", "audio_ready", "shots_planned", "shots_keyframed", "keyframe_ready"}


async def _import_produced_seed(force: bool = False) -> dict:
    """Prod-DB startet leer: produzierte Clips (Pfade im gemeinsamen Object Storage) einspielen.
    Iter 176: Bestehende Clips werden auf den neueren Seed-Stand gehoben (neue GODMODE-Videos kommen so
    ohne Re-Render in Prod an) — nie während eines laufenden Renders und nie bei gleichem Video.
    Iter 180: `force=True` (Admin-Knopf „Videos aus Seed einspielen") übernimmt den Seed-Stand auch ohne
    neueres Datum und setzt die Freigabe aus dem Seed — damit fehlende Videos/Vorschaubilder in Prod
    mit einem Klick zurückkommen."""
    if not _SEED_FILE.exists():
        return {"imported": 0, "upgraded": 0, "skipped": [], "seed_file": False}
    try:
        data = json.loads(_SEED_FILE.read_text())
    except Exception as e:
        logger.error("Guide seed file unreadable: %s", e)
        return {"imported": 0, "upgraded": 0, "skipped": [], "seed_file": False}
    imported = 0
    upgraded = 0
    skipped: list[str] = []
    for clip in data.get("clips", []):
        clip.pop("_id", None)
        existing = await db.guide_clips.find_one(
            {"slug": clip["slug"]}, {"_id": 1, "status": 1, "updated_at": 1, "video_path": 1, "published": 1}
        )
        if existing is None:
            try:
                await db.guide_clips.insert_one(clip)
            except DuplicateKeyError:
                continue
            imported += 1
            continue
        seed_video = clip.get("video_path")
        newer = (clip.get("updated_at") or "") > (existing.get("updated_at") or "")
        if not seed_video or (not force and (not newer or existing.get("video_path") == seed_video)):
            skipped.append(clip["slug"])
            continue
        if existing.get("status") in _IN_PROGRESS_STATUSES:
            skipped.append(clip["slug"])
            continue
        # Sichtbarkeit bleibt Prod-Entscheidung: `published` nur übernehmen, wenn dort noch nichts gesetzt ist
        # (oder der Admin den Seed bewusst erzwingt).
        payload = {k: v for k, v in clip.items() if k != "published"}
        if force or existing.get("published") is None:
            if "published" in clip:
                payload["published"] = clip["published"]
        await db.guide_clips.update_one({"_id": existing["_id"]}, {"$set": payload})
        upgraded += 1
    settings = data.get("settings") or {}
    if settings.get("portrait_path"):
        current = await db.guide_settings.find_one({"_id": SETTINGS_ID}, {"portrait_path": 1})
        if not (current or {}).get("portrait_path"):
            existing_keys = set((await db.guide_settings.find_one({"_id": SETTINGS_ID}) or {}).keys())
            missing = {k: v for k, v in settings.items() if k not in existing_keys}
            if missing:
                await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$set": missing}, upsert=True)
    if imported or upgraded:
        logger.info("Guide seed: %s clips importiert, %s auf neuere Videos gehoben", imported, upgraded)
    return {"imported": imported, "upgraded": upgraded, "skipped": skipped, "seed_file": True}


async def _ensure_seeded() -> None:
    """Legt fehlende Clips aus guide_content an (idempotent, überschreibt nichts).
    Beim ersten Aufruf nach einem Neustart werden verwaiste Läufe als Fehler markiert.
    Läuft pro Prozess nur einmal erfolgreich durch — danach kostet der Aufruf nichts."""
    global _BOOT_RESET_DONE, _SEEDED_OK
    if _SEEDED_OK:
        return
    if not _BOOT_RESET_DONE:
        _BOOT_RESET_DONE = True
        await _import_produced_seed()
        await db.guide_clips.update_many(
            {"status": {"$regex": "_running$"}, "updated_at": {"$lt": _PROCESS_STARTED_AT}},
            {"$set": {"status": "interrupted", "progress": None,
                      "error": "Server wurde neu gestartet — Schritt bitte erneut starten"}},
        )
        await db.guide_settings.update_one(
            {"_id": SETTINGS_ID, "voice_clone_status": "running"},
            {"$set": {"voice_clone_status": "failed", "voice_clone_error": "Server wurde neu gestartet"}},
        )
    await db.guide_clips.create_index("slug", unique=True)
    for seed in seed_clips():
        existing = await db.guide_clips.find_one({"slug": seed["slug"]}, {"_id": 0, "script": 1})
        if existing:
            continue
        try:
            await db.guide_clips.insert_one({
                **seed,
                "script_source": "seed",
                "status": "script_ready",
                "published": False,
                "audio_path": None,
                "video_path": None,
                "media_token": None,
                "duration_seconds": None,
                "error": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
        except DuplicateKeyError:
            pass
    _SEEDED_OK = True


async def _settings() -> dict:
    doc = await db.guide_settings.find_one({"_id": SETTINGS_ID})
    return doc or {"_id": SETTINGS_ID}


async def _set_settings(patch: dict) -> None:
    await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$set": patch}, upsert=True)


def _media_url(token: str, kind: str, version: str | None = None) -> str:
    # `?v=` = Render-Kennung aus dem Dateinamen: Token bleibt pro Clip gleich, Browser/CDN cachen die URL
    # 7 Tage — ohne Versions-Suffix spielte der Browser nach einem Re-Render das alte Video weiter.
    base = f"/api/guide/media/{token}/{kind}"
    return f"{base}?v={version}" if version else base


def _render_version(path: str | None) -> str | None:
    if not path:
        return None
    stem = path.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    return stem.rsplit("_", 1)[-1] if "_" in stem else stem


def _active_video(clip: dict) -> tuple[str, str | None]:
    """Welches Video sehen Nutzer? ('generated'|'upload'|'vimeo', Storage-Pfad bzw. None bei Vimeo).
    Iter 179: Ein Video-Feld für drei Quellen — das generierte Video bleibt immer erhalten."""
    source = clip.get("video_source") or "generated"
    if source == "upload" and clip.get("custom_video_path"):
        return "upload", clip["custom_video_path"]
    if source == "vimeo" and clip.get("vimeo_id"):
        return "vimeo", None
    return "generated", clip.get("video_path")


def _poster_version(clip: dict, path: str | None) -> str | None:
    """Versions-Kennung fürs Vorschaubild — ändert sich auch, wenn nur die Sekunde neu gewählt wurde."""
    if not path:
        return None
    version = _render_version(path)
    at = clip.get("poster_at")
    return f"{version}-{at}" if at else version


def _poster_url(clip: dict) -> str | None:
    """Vorschaubild = Standbild aus dem aktiven Video (Wlads Gesicht, nicht die Blende), versioniert wie das Video."""
    token = clip.get("media_token")
    source, path = _active_video(clip)
    if source == "vimeo":
        return clip.get("vimeo_thumbnail") or None
    if not token:
        return None
    if path:
        return _media_url(token, "poster", _poster_version(clip, path))
    if clip.get("keyframe_path"):
        return _media_url(token, "keyframe", _render_version(clip["keyframe_path"]))
    first = next((s for s in clip.get("shots", []) if s.get("keyframe_path")), None)
    if first:
        return f"/api/guide/media/{token}/shot/{first['id']}/poster?v={_render_version(first['keyframe_path'])}"
    return None


def poster_source(clip: dict) -> tuple[str | None, float]:
    """Quelle + Zeitpunkt fürs Vorschaubild. Eigene Sekunde (`poster_at`) gewinnt immer; sonst der erste
    Sprech-Take (ohne eingebrannte Untertitel/Blende), kurz nach dem stillen Auftakt. Fallback: Video bei 1,5 s."""
    source, active = _active_video(clip)
    at_override = clip.get("poster_at")
    if at_override is not None and active:
        return active, float(at_override)
    if source == "upload" and active:
        return active, 1.5
    for shot in clip.get("shots") or []:
        if shot.get("type") == "talk" and shot.get("synced_path"):
            return shot["synced_path"], round(float(shot.get("speech_lead") or 0.0) + 0.9, 2)
    if clip.get("video_path"):
        return clip["video_path"], 1.5
    return clip.get("keyframe_path"), 0.0


def _public_clip(clip: dict, seen: list) -> dict:
    token = clip.get("media_token")
    source, active = _active_video(clip)
    published = bool(clip.get("published"))
    if source == "vimeo":
        has_video = published and bool(clip.get("vimeo_id"))
        video_url = None
    else:
        has_video = published and bool(active and token)
        video_url = _media_url(token, "custom" if source == "upload" else "video", _render_version(active)) if has_video else None
    duration = clip.get("custom_duration_seconds") if source == "upload" else clip.get("duration_seconds_video")
    return {
        "poster_url": _poster_url(clip) if has_video else None,
        "duration_seconds_video": duration,
        "slug": clip["slug"],
        "kind": clip["kind"],
        "ref": clip.get("ref"),
        "order": clip.get("order", 0),
        "title": clip["title"],
        "script": clip["script"],
        "questions": clip_questions(clip["slug"]),
        "video_url": video_url,
        "video_kind": "vimeo" if (has_video and source == "vimeo") else "file",
        "vimeo_id": clip.get("vimeo_id") if (has_video and source == "vimeo") else None,
        "duration_seconds": clip.get("duration_seconds"),
        "seen": clip["slug"] in seen,
    }


async def _progress(user_id: str) -> dict:
    doc = await db.guide_progress.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {"user_id": user_id, "seen": [], "mission_autoplay": True}


# ── Nutzer-Endpunkte ────────────────────────────────────────────────────────

LEAN_FIELDS = ("slug", "kind", "ref", "order", "title", "poster_url", "video_url", "video_kind", "vimeo_id",
               "duration_seconds", "duration_seconds_video", "seen")


@router.get("/clips")
async def list_clips(request: Request, kind: str = "onboarding", lean: bool = False):
    """`lean=1` liefert nur, was eine Kachel zeigt (Titel, Dauer, Bild, gesehen) — ohne Skript/Fragen."""
    user = await get_current_user(request)
    await _ensure_seeded()
    if kind not in ("onboarding", "mission", "teaser", "coaching", "feature", "all"):
        raise HTTPException(status_code=400, detail="kind muss onboarding, mission, teaser, coaching, feature oder all sein")
    query = {} if kind == "all" else {"kind": kind}
    projection = {"_id": 0, "subtitles": 0, "shots.subtitles": 0, "error": 0, "progress": 0} if lean else {"_id": 0}
    clips = await db.guide_clips.find(query, projection).sort("order", 1).to_list(200)
    progress = await _progress(user["user_id"])
    items = [_public_clip(c, progress.get("seen", [])) for c in clips]
    if lean:
        items = [{k: i[k] for k in LEAN_FIELDS} for i in items]
    return {
        "clips": items,
        "seen_count": sum(1 for i in items if i["seen"]),
        "total": len(items),
        "mission_autoplay": progress.get("mission_autoplay", True),
    }


@router.get("/clips/mission/{day}")
async def mission_clip(day: int, request: Request):
    user = await get_current_user(request)
    await _ensure_seeded()
    clip = await db.guide_clips.find_one({"kind": "mission", "ref": str(day)}, {"_id": 0})
    if not clip:
        return {"clip": None, "mission_autoplay": True}
    progress = await _progress(user["user_id"])
    return {
        "clip": _public_clip(clip, progress.get("seen", [])),
        "mission_autoplay": progress.get("mission_autoplay", True),
    }


@router.get("/clips/{slug}")
async def clip_detail(slug: str, request: Request):
    """Ein Clip komplett (Skript, Fragen, Untertitel) — wird erst geladen, wenn er abgespielt wird."""
    user = await get_current_user(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    progress = await _progress(user["user_id"])
    out = _public_clip(clip, progress.get("seen", []))
    out["subtitles"] = clip.get("subtitles") or []
    return out



class SeenIn(BaseModel):
    pass


@router.post("/clips/{slug}/seen")
async def mark_seen(slug: str, request: Request):
    user = await get_current_user(request)
    await db.guide_progress.update_one(
        {"user_id": user["user_id"]},
        {"$addToSet": {"seen": slug}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


class PrefsIn(BaseModel):
    mission_autoplay: bool


@router.post("/prefs")
async def set_prefs(data: PrefsIn, request: Request):
    user = await get_current_user(request)
    await db.guide_progress.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"mission_autoplay": data.mission_autoplay}},
        upsert=True,
    )
    return {"ok": True, "mission_autoplay": data.mission_autoplay}


@router.get("/public/teaser")
async def public_teaser():
    """Ohne Login (Login-Seite): der freigegebene Teaser — oder null."""
    clip = await db.guide_clips.find_one(
        {"kind": "teaser", "published": True}, {"_id": 0}, sort=[("order", 1)],
    )
    if not clip:
        return {"clip": None}
    public = _public_clip(clip, [])
    if not public["video_url"] and not public["vimeo_id"]:
        return {"clip": None}
    return {"clip": {"slug": clip["slug"], "title": clip["title"], "script": clip["script"],
                     "video_url": public["video_url"], "video_kind": public["video_kind"],
                     "vimeo_id": public["vimeo_id"], "poster_url": public["poster_url"]}}


@router.get("/media/{token}/{kind}")
@router.head("/media/{token}/{kind}")
async def serve_media(token: str, kind: str, request: Request):
    """Öffentlich (ohne Login): Guide-Videos sind für alle Nutzer identisch und
    müssen zusätzlich vom Generator-Dienst abgerufen werden können. Der Token ist
    nicht erratbar und hängt am jeweiligen Clip."""
    if kind not in CLIP_MEDIA and kind not in SETTINGS_ASSETS:
        raise HTTPException(status_code=404, detail="Not found")

    clip = {}
    if kind in SETTINGS_ASSETS:
        settings = await _settings()
        if settings.get("media_token") != token:
            raise HTTPException(status_code=404, detail="Not found")
        path = settings.get(SETTINGS_ASSETS[kind])
        media_type = settings.get(f"{kind}_content_type") or ("audio/mpeg" if kind == "sample" else "image/jpeg")
    else:
        clip = await db.guide_clips.find_one({"media_token": token}, {"_id": 0})
        if not clip:
            raise HTTPException(status_code=404, detail="Not found")
        path = clip.get(CLIP_MEDIA[kind])
        media_type = MEDIA_TYPES[kind]
        poster_at = 1.5
        if kind == "poster":
            path, poster_at = poster_source(clip)

    if not path:
        raise HTTPException(status_code=404, detail="Not found")
    return await _serve_object(request, path, media_type, poster=kind == "poster",
                               title=clip.get("title") or "", kicker=KICKERS.get(clip.get("kind") or "", ""),
                               at=poster_at if clip else 1.5)


# ── Medien-Auslieferung: Disk-Cache + gestreamte Range-Antworten ────────────
# Ein Video wird genau einmal aus dem Object Storage auf die Platte geholt und danach
# in 1-MB-Stücken gestreamt. Der Prozess hält nie ein ganzes Video im RAM — egal, wie
# viele Nutzer gleichzeitig schauen.

_MEDIA_DIR = Path(tempfile.gettempdir()) / "guide_media"
_MEDIA_DIR_MAX_BYTES = 1536 * 1024 * 1024
_MEDIA_CHUNK = 1024 * 1024
_MEDIA_LOCKS: dict[str, threading.Lock] = {}
_MEDIA_LOCKS_GUARD = threading.Lock()


def _local_media(path: str) -> Path:
    """Pfad im Disk-Cache; lädt bei Bedarf gestreamt herunter (ein Download pro Objekt, auch parallel)."""
    _MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    target = _MEDIA_DIR / hashlib.sha1(path.encode()).hexdigest()
    if target.exists():
        return target
    with _MEDIA_LOCKS_GUARD:
        lock = _MEDIA_LOCKS.setdefault(path, threading.Lock())
    with lock:
        if target.exists():
            return target
        tmp = target.with_suffix(f".{uuid.uuid4().hex[:8]}.part")
        try:
            download_object(path, str(tmp))
            tmp.replace(target)
        finally:
            tmp.unlink(missing_ok=True)
    _evict_media_cache()
    return target


def _evict_media_cache() -> None:
    files = [p for p in _MEDIA_DIR.iterdir() if p.is_file() and not p.name.endswith(".part")]
    total = sum(p.stat().st_size for p in files)
    for p in sorted(files, key=lambda f: f.stat().st_atime):
        if total <= _MEDIA_DIR_MAX_BYTES:
            break
        total -= p.stat().st_size
        p.unlink(missing_ok=True)


def _parse_range(header: str | None, size: int) -> tuple[int, int] | None:
    """Ein einzelner Bytes-Range → (start, end) inklusiv; None = volle Antwort; 416 bei unerfüllbar."""
    if not header or not header.startswith("bytes=") or "," in header:
        return None
    start_s, _, end_s = header[6:].strip().partition("-")
    try:
        if not start_s:  # Suffix-Range: die letzten N Bytes
            start, end = max(0, size - int(end_s)), size - 1
        else:
            start = int(start_s)
            end = min(int(end_s) if end_s else size - 1, size - 1)
    except ValueError:
        return None
    if start > end or start >= size:
        raise HTTPException(status_code=416, detail="Range not satisfiable",
                            headers={"Content-Range": f"bytes */{size}"})
    return start, end


def _file_chunks(file_path: Path, start: int, end: int):
    with file_path.open("rb") as f:
        f.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = f.read(min(_MEDIA_CHUNK, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


KICKERS = {"onboarding": "Onboarding", "mission": "Mission-Briefing", "teaser": "Wlad für dich", "coaching": "Coaching"}


def _frame_from_video(video: Path, at: float = 1.5) -> Path:
    """Standbild (t=at) aus einem MP4 ziehen — einmalig, danach aus dem lokalen Cache."""
    target = video.with_name(f"{video.name}_frame_{at:.2f}.jpg")
    if target.exists():
        return target
    import imageio_ffmpeg
    tmp = target.with_suffix(f".{uuid.uuid4().hex[:8]}.part.jpg")
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-y", "-ss", f"{at:.2f}", "-i", str(video),
                    "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", "-q:v", "3", str(tmp)],
                   check=True, capture_output=True, timeout=120)
    tmp.replace(target)
    return target


def _local_poster(path: str, title: str = "", kicker: str = "", at: float = 1.5) -> Path:
    """Keyframe (oder Video-Standbild) -> branded Thumbnail-JPEG (Titel-Typo, W-Mark, Lime-Akzent), einmal erzeugt, dann aus dem Cache."""
    source = _local_media(path)
    if path.lower().endswith((".mp4", ".mov")):
        source = _frame_from_video(source, at)
    key = hashlib.sha1(f"{title}|{kicker}|v2".encode()).hexdigest()[:10]
    target = source.with_name(f"{source.name}_poster_{key}.jpg")
    if target.exists():
        return target
    from services_video_compose import render_thumbnail

    tmp = target.with_suffix(f".{uuid.uuid4().hex[:8]}.part")
    render_thumbnail(str(source), str(tmp), title, kicker)
    tmp.replace(target)
    return target


async def _serve_object(request: Request, path: str, media_type: str, poster: bool = False,
                        title: str = "", kicker: str = "", at: float = 1.5) -> Response:
    """Range-Requests für <video>/<audio> (Safari verlangt 206, Scrubbing braucht es überall);
    ETag/304, damit Browser und CDN nach Ablauf des Caches nur revalidieren statt neu laden."""
    try:
        file_path = await asyncio.to_thread(_local_poster, path, title, kicker, at) if poster else await asyncio.to_thread(_local_media, path)
    except Exception as e:
        logger.error("Guide media fetch failed for %s: %s", path, e)
        raise HTTPException(status_code=404, detail="Not found")
    size = file_path.stat().st_size
    etag = f'"{file_path.name[:16]}-{size}"'
    headers = {"Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", "Accept-Ranges": "bytes", "ETag": etag}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    rng = _parse_range(request.headers.get("range"), size)
    start, end = rng if rng else (0, size - 1)
    status = 206 if rng else 200
    if rng:
        headers["Content-Range"] = f"bytes {start}-{end}/{size}"
    headers["Content-Length"] = str(end - start + 1)
    if request.method == "HEAD":
        return Response(status_code=status, media_type=media_type, headers=headers)
    return StreamingResponse(_file_chunks(file_path, start, end), status_code=status,
                             media_type=media_type, headers=headers)


@router.get("/media/{token}/shot/{shot_id}/{kind}")
@router.head("/media/{token}/shot/{shot_id}/{kind}")
async def serve_shot_media(token: str, shot_id: str, kind: str, request: Request):
    """Zwischenergebnisse einzelner Shots (Fal muss raw + padded abrufen können)."""
    if kind not in SHOT_MEDIA:
        raise HTTPException(status_code=404, detail="Not found")
    clip = await db.guide_clips.find_one({"media_token": token}, {"_id": 0, "shots": 1, "title": 1, "kind": 1})
    shot = next((s for s in (clip or {}).get("shots", []) if s["id"] == shot_id), None)
    field, media_type = SHOT_MEDIA[kind]
    if not shot or not shot.get(field):
        raise HTTPException(status_code=404, detail="Not found")
    return await _serve_object(request, shot[field], media_type, poster=kind == "poster",
                               title=clip.get("title") or "", kicker=KICKERS.get(clip.get("kind") or "", ""))


@router.get("/broll/{screen}")
async def serve_broll(screen: str):
    path = BROLL_DIR / f"{screen}.png"
    if screen not in BROLL_SCREENS or not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=path.read_bytes(), media_type="image/png",
                    headers={"Cache-Control": "public, max-age=3600"})


# ── Admin: Einrichtung ──────────────────────────────────────────────────────

def _shot_view(shot: dict, token: str | None) -> dict:
    view = {k: v for k, v in shot.items() if not k.endswith("_path") and k != "fal_request"}
    view["fal_pending"] = bool(shot.get("fal_request")) and not shot.get("synced_path")
    for kind, (field, _) in SHOT_MEDIA.items():
        view[f"{kind}_url"] = f"/api/guide/media/{token}/shot/{shot['id']}/{kind}" if shot.get(field) and token else None
    preset = SHOT_PRESETS.get(shot.get("preset") or "")
    view["preset_label"] = preset["label"] if preset else "App-Tour (B-Roll)"
    view["duration"] = preset["duration"] if preset else None
    return view


def _admin_clip_view(c: dict) -> dict:
    token = c.get("media_token")
    view = {k: v for k, v in c.items() if not k.endswith("_path") and k != "shots"}
    for kind, field in CLIP_MEDIA.items():
        view[f"{kind}_url"] = _media_url(token, kind, _render_version(c.get(field))) if c.get(field) and token else None
    view["words"] = word_count(c.get("script", ""))
    view["word_limits"] = word_limits(c.get("kind", ""))
    view["godmode"] = godmode_check(c)
    preset = SHOT_PRESETS.get(c.get("shot_preset") or "")
    view["shot"] = preset and {**preset, "scene_prompt": c.get("scene_prompt") or preset["scene_prompt"],
                               "motion_prompt": c.get("motion_prompt") or preset["motion_prompt"]}
    view["shots"] = [_shot_view(s, token) for s in c.get("shots", [])]
    view["multi_shot"] = c.get("kind") in ("onboarding", "mission", "coaching", "feature") or bool(c.get("multi_shot"))
    view["aspect"] = c.get("aspect") or "16:9"
    # Iter 179: Video-Feld mit drei Quellen — was ist gerade live, was liegt bereit?
    source, active = _active_video(c)
    view["video_source"] = c.get("video_source") or "generated"
    view["active_source"] = source
    view["has_generated"] = bool(c.get("video_path"))
    view["has_upload"] = bool(c.get("custom_video_path"))
    view["poster_url"] = _poster_url(c)
    view["active_video_url"] = (
        None if source == "vimeo"
        else _media_url(token, "custom" if source == "upload" else "video", _render_version(active)) if (active and token) else None
    )
    return view


@router.get("/admin/overview")
async def admin_overview(request: Request):
    await require_admin(request)
    await _ensure_seeded()
    clips = await db.guide_clips.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    settings = await _settings()
    token = settings.get("media_token")
    return {
        "clips": [_admin_clip_view(c) for c in clips],
        "settings": {
            **{f"{kind}_url" if kind != "sample" else "voice_sample_url":
               _media_url(token, kind) if settings.get(field) and token else None
               for kind, field in SETTINGS_ASSETS.items()},
            "custom_voice_id": settings.get("custom_voice_id"),
            "voice_id_in_use": settings.get("custom_voice_id") or DEFAULT_VOICE_ID,
            "voice_clone_status": settings.get("voice_clone_status"),
            "voice_clone_error": settings.get("voice_clone_error"),
            "resolution": settings.get("resolution", "512"),
            "spent_usd": round(settings.get("spent_usd", 0.0), 2),
        },
        "limits": {"min_words": SCRIPT_MIN_WORDS, "max_words": SCRIPT_MAX_WORDS},
        "costs": {"keyframe": COST_KEYFRAME, "i2v": COST_I2V, "lipsync_per_s": COST_LIPSYNC_PER_S, "voice_clone": 1.5},
        "broll_screens": BROLL_SCREENS,
    }


async def _store_settings_asset(file: UploadFile, kind: str, max_mb: int) -> str:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Leere Datei")
    if len(data) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Datei zu groß (max {max_mb} MB)")
    settings = await _settings()
    token = settings.get("media_token") or secrets.token_urlsafe(24)
    path = f"guide/{kind}_{uuid.uuid4().hex[:10]}"
    await asyncio.to_thread(put_object, path, data, file.content_type or "application/octet-stream")
    await _set_settings({
        SETTINGS_ASSETS[kind]: path, "media_token": token, f"{kind}_content_type": file.content_type or None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return token


@router.post("/admin/seed/reimport")
async def reimport_seed(request: Request):
    """Videos + Freigaben aus `guide_seed_data.json` einspielen — der Knopf für Prod,
    wenn dort ein Video oder Vorschaubild fehlt. Laufende Renders bleiben unberührt."""
    await require_admin(request)
    result = await _import_produced_seed(force=True)
    if not result["seed_file"]:
        raise HTTPException(status_code=400, detail="Keine Seed-Datei gefunden (guide_seed_data.json)")
    total = await db.guide_clips.count_documents({})
    published = await db.guide_clips.count_documents({"published": True, "video_path": {"$ne": None}})
    return {"ok": True, **result, "clips_total": total, "clips_published": published}


class VoicePreviewIn(BaseModel):
    text: str


@router.post("/admin/voice-preview")
async def voice_preview(data: VoicePreviewIn, request: Request):
    """Aussprache-Probe (Iter 180): denselben Satz mit Wlads Klon-Stimme und der aktuellen
    Aussprache-Liste synthetisieren — zum Anhören, BEVOR Videos neu gerendert werden.
    Kostet nur TTS (Cent-Bereich), kein Filmmaterial."""
    await require_admin(request)
    from services_speech_text import to_speakable

    text = (data.text or "").strip()
    if not 3 <= len(text) <= 300:
        raise HTTPException(status_code=400, detail="Bitte 3–300 Zeichen eingeben")
    settings = await _settings()
    voice_id = settings.get("custom_voice_id") or DEFAULT_VOICE_ID
    try:
        audio, _ = await asyncio.to_thread(synthesize_speech, text, voice_id, 1.0, True)
    except FalError as e:
        raise await ai_http_error(e, "Sprachprobe fehlgeschlagen")
    seconds = await asyncio.to_thread(_duration_of, audio)
    return {
        "written_text": text,
        "spoken_text": to_speakable(text),
        "duration_seconds": round(seconds, 2),
        "voice": "clone" if settings.get("custom_voice_id") else "fallback",
        "audio_data_url": "data:audio/mpeg;base64," + base64.b64encode(audio).decode(),
    }


@router.post("/admin/signature")
async def upload_signature(request: Request, file: UploadFile = File(...)):
    """Wlads echte Unterschrift (PNG, transparent) für die Verabschiedungs-Karte — ersetzt die Handschrift-Schrift
    bei jedem weiteren Schnitt, ohne Neuaufnahme."""
    await require_admin(request)
    if (file.content_type or "") not in ("image/png", "image/webp"):
        raise HTTPException(status_code=422, detail="Bitte ein PNG mit transparentem Hintergrund hochladen")
    token = await _store_settings_asset(file, "signature", 2)
    return {"ok": True, "signature_url": _media_url(token, "signature")}


@router.post("/admin/portrait")
async def upload_portrait(request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    token = await _store_settings_asset(file, "portrait", 8)
    return {"ok": True, "portrait_url": _media_url(token, "portrait")}


@router.post("/admin/body")
async def upload_body(request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    token = await _store_settings_asset(file, "body", 8)
    return {"ok": True, "body_url": _media_url(token, "body")}


@router.post("/admin/voice-sample")
async def upload_voice_sample(request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    token = await _store_settings_asset(file, "sample", 25)
    return {"ok": True, "voice_sample_url": _media_url(token, "sample")}


def _absolute(url_path: str) -> str:
    """Fal muss unsere Medien abrufen können → absolute, öffentlich erreichbare URL.
    In der Vorschau steckt sie in PUBLIC_BASE_URL, in Produktion greift die
    Domain-Auflösung aus services_email."""
    import os

    import services_email

    base = (os.environ.get("PUBLIC_BASE_URL") or services_email._frontend_url()).rstrip("/")
    return f"{base}{url_path}"


async def _run_voice_clone(sample_url: str) -> None:
    try:
        voice_id = await asyncio.to_thread(clone_voice, sample_url)
        await _set_settings({"custom_voice_id": voice_id, "voice_clone_status": "ready", "voice_clone_error": None})
        await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$inc": {"spent_usd": 1.5}})
        logger.info("Guide voice clone ready: %s", voice_id)
    except Exception as e:
        logger.error("Guide voice clone failed: %s", e)
        await _set_settings({"voice_clone_status": "failed", "voice_clone_error": str(e)[:300]})


@router.post("/admin/voice-clone")
async def create_voice_clone(request: Request):
    """Startet den Stimm-Klon im Hintergrund (dauert Minuten — synchron liefe der Proxy in ein 502)."""
    await require_admin(request)
    settings = await _settings()
    if not settings.get("voice_sample_path"):
        raise HTTPException(status_code=400, detail="Zuerst eine Sprachprobe hochladen (30-60 Sekunden)")
    if settings.get("voice_clone_status") == "running":
        raise HTTPException(status_code=409, detail="Ein Stimm-Klon läuft bereits")
    await _set_settings({"voice_clone_status": "running", "voice_clone_error": None})
    sample_url = _absolute(_media_url(settings["media_token"], "sample"))
    task = asyncio.create_task(_run_voice_clone(sample_url))
    _JOBS.add(task)
    task.add_done_callback(_JOBS.discard)
    return {"ok": True, "voice_clone_status": "running"}


# ── Admin: Skript ───────────────────────────────────────────────────────────

SCRIPT_PROMPT = f"""Du schreibst Sprechtexte für kurze Erklärvideos von Wlad Jachtchenko
(Leadership-Coach, direkt, warm, ohne Motivationsfloskeln, duzt den Zuschauer).

HARTE REGELN:
- {SCRIPT_MIN_WORDS} bis {SCRIPT_MAX_WORDS} Wörter. Nicht mehr — jede Sekunde Video kostet Geld.
- Gesprochene Sprache: kurze Sätze, keine Aufzählungszeichen, keine Klammern, keine Emojis.
- Keine Anrede mit Namen, keine Begrüßungsfloskel wie "Hallo zusammen".
- Konkret statt allgemein: ein Beispiel aus dem Führungsalltag statt einer Definition.
- Am Ende genau ein Satz, was der Zuschauer jetzt tut.
- Keine Zahlen als Ziffern schreiben, sondern ausschreiben (Sprachausgabe).

Antworte NUR mit dem Sprechtext, ohne Überschrift und ohne Anführungszeichen."""


class ScriptSuggestIn(BaseModel):
    hint: str | None = None


@router.post("/admin/clips/{slug}/script")
async def suggest_script(slug: str, data: ScriptSuggestIn, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    context = f"Titel des Clips: {clip['title']}\nBisheriger Text:\n{clip['script']}"
    if clip["kind"] == "mission":
        context += f"\nEs ist das Intro für Tag {clip.get('ref')} der 30-Tage-Challenge."
    if data.hint:
        context += f"\nWlads Anweisung: {data.hint}"
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"guide_{slug}", system_message=SCRIPT_PROMPT)
        chat.with_model("openai", "gpt-5.2")
        text = await chat.send_message(UserMessage(text=context))
    except Exception as e:
        raise await ai_http_error(e, "guide_script")
    text = " ".join((text or "").strip().strip('"').split())
    return {"script": text, "words": word_count(text)}


class ScriptSaveIn(BaseModel):
    title: str | None = None
    script: str
    scene_prompt: str | None = None
    motion_prompt: str | None = None


@router.put("/admin/clips/{slug}")
async def save_script(slug: str, data: ScriptSaveIn, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0, "kind": 1, "multi_shot": 1, "video_path": 1})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    script = normalize_script(data.script or "")
    words = word_count(script)
    lo, hi = (30, word_limits("teaser")[1]) if clip.get("multi_shot") and clip["kind"] == "teaser" else word_limits(clip["kind"])
    if not lo <= words <= hi:
        raise HTTPException(
            status_code=400,
            detail=f"Skript hat {words} Wörter — erlaubt sind {lo} bis {hi}.",
        )
    patch = {
        "script": script,
        "script_source": "wlad",
        "error": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if not clip.get("video_path"):
        patch["status"] = "script_ready"  # fertige Filme bleiben online; Shots neu planen = bewusste Aktion
    if data.title:
        patch["title"] = data.title.strip()[:120]
    if data.scene_prompt is not None:
        patch["scene_prompt"] = data.scene_prompt.strip()[:1500] or None
    if data.motion_prompt is not None:
        patch["motion_prompt"] = data.motion_prompt.strip()[:1500] or None
    await db.guide_clips.update_one({"slug": slug}, {"$set": patch})
    return {"ok": True, "words": words}


# ── Admin: Produktion (Hintergrund-Jobs) ────────────────────────────────────

async def _patch_clip(slug: str, patch: dict) -> None:
    await db.guide_clips.update_one({"slug": slug}, {"$set": {
        **patch, "updated_at": datetime.now(timezone.utc).isoformat(),
    }})


async def _spend(slug: str, usd: float) -> None:
    await db.guide_clips.update_one({"slug": slug}, {"$inc": {"spent_usd": usd}})
    await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$inc": {"spent_usd": usd}}, upsert=True)


async def _store(prefix: str, slug: str, data: bytes, content_type: str, ext: str) -> str:
    path = f"guide/{prefix}_{slug}_{uuid.uuid4().hex[:8]}.{ext}"
    await asyncio.to_thread(put_object, path, data, content_type)
    return path


def _shot_for(clip: dict) -> dict:
    preset = SHOT_PRESETS.get(clip.get("shot_preset") or "spotlight_entrance")
    return {**preset, "scene_prompt": clip.get("scene_prompt") or preset["scene_prompt"],
            "motion_prompt": clip.get("motion_prompt") or preset["motion_prompt"]}


async def _job_audio(slug: str, clip: dict, settings: dict, token: str) -> None:
    voice_id = settings.get("custom_voice_id") or DEFAULT_VOICE_ID
    audio, duration = await asyncio.to_thread(synthesize_speech, clip["script"], voice_id)
    path = await _store("audio", slug, audio, "audio/mpeg", "mp3")
    await _patch_clip(slug, {
        "audio_path": path, "media_token": token, "duration_seconds": duration,
        "voice_id_used": voice_id, "status": "audio_ready", "error": None,
    })
    logger.info("Guide audio ready: %s (%ss)", slug, duration)


async def _job_video(slug: str, clip: dict, settings: dict, token: str) -> None:
    """Klassisch: Standbild + Ton -> SadTalker (günstig, für lange Clips)."""
    if not clip.get("audio_path"):
        raise FalError("Zuerst die Stimme erzeugen")
    if not settings.get("portrait_path"):
        raise FalError("Zuerst ein Frontalfoto hochladen")
    image_url = _absolute(_media_url(settings["media_token"], "portrait"))
    audio_url = _absolute(_media_url(token, "audio"))
    video = await asyncio.to_thread(render_talking_video, image_url, audio_url, settings.get("resolution", "512"))
    path = await _store("video", slug, video, "video/mp4", "mp4")
    await _patch_clip(slug, {
        "video_path": path, "media_token": token, "status": "video_ready", "error": None,
        "video_bytes": len(video), "pipeline": "talking_head",
    })
    logger.info("Guide video ready: %s (%s KB)", slug, len(video) // 1024)


async def _job_keyframe(slug: str, clip: dict, settings: dict, token: str) -> None:
    """Referenzen (Avatar-Gesicht + Körperfoto) + Szene -> ein Keyframe."""
    if not settings.get("portrait_path"):
        raise FalError("Zuerst das Avatar-Bild (Gesicht) hochladen")
    refs = [_absolute(_media_url(settings["media_token"], "portrait"))]
    if settings.get("body_path"):
        refs.append(_absolute(_media_url(settings["media_token"], "body")))
    shot = _shot_for(clip)
    prompt = f"{WLAD_STYLE_PROMPT} {shot['scene_prompt']}"
    image = await asyncio.to_thread(edit_image, prompt, refs, shot["aspect_ratio"])
    path = await _store("keyframe", slug, image, "image/png", "png")
    await _spend(slug, COST_KEYFRAME)
    await _patch_clip(slug, {
        "keyframe_path": path, "media_token": token, "status": "keyframe_ready", "error": None,
        "keyframe_prompt": prompt, "raw_video_path": None,
    })
    logger.info("Guide keyframe ready: %s", slug)


async def _job_cinematic(slug: str, clip: dict, settings: dict, token: str) -> None:
    """Keyframe -> Kling-Shot -> Lipsync -> Logo/Untertitel/Fades."""
    if not clip.get("keyframe_path"):
        raise FalError("Zuerst den Keyframe erzeugen und prüfen")
    if not clip.get("audio_path"):
        raise FalError("Zuerst die Stimme erzeugen")
    shot = _shot_for(clip)
    total = float(shot["duration"])
    speech = float(clip.get("duration_seconds") or 0)
    if shot["speech_start"] + speech > total - 0.4:
        raise FalError(
            f"Sprechtext ist {speech:.0f} s lang — in einen {total:.0f}-s-Shot passen nach "
            f"{shot['speech_start']:.0f} s Gehen höchstens {total - shot['speech_start'] - 0.4:.0f} s. Text kürzen."
        )

    await _patch_clip(slug, {"progress": "Bewegung (Kling)"})
    raw = await asyncio.to_thread(
        image_to_video, _absolute(_media_url(token, "keyframe")), shot["motion_prompt"],
        shot["duration"], shot["aspect_ratio"],
    )
    raw_path = await _store("raw", slug, raw, "video/mp4", "mp4")
    await _spend(slug, COST_I2V[shot["duration"]])
    await _patch_clip(slug, {"raw_video_path": raw_path, "media_token": token})

    await _patch_clip(slug, {"progress": "Lipsync"})
    audio_bytes, _ = await asyncio.to_thread(get_object, clip["audio_path"])
    padded = await asyncio.to_thread(pad_audio, audio_bytes, shot["speech_start"], total)
    padded_path = await _store("padded", slug, padded, "audio/mpeg", "mp3")
    await _patch_clip(slug, {"audio_padded_path": padded_path})
    synced = await asyncio.to_thread(
        lipsync_video, _absolute(_media_url(token, "raw")), _absolute(_media_url(token, "padded")),
    )
    await _spend(slug, COST_LIPSYNC_PER_S * total)

    await _patch_clip(slug, {"progress": "Schnitt & Branding"})
    cues = subtitle_chunks(clip["script"], shot["speech_start"], speech)
    final = await asyncio.to_thread(finish_video, synced, padded, cues, True)
    path = await _store("video", slug, final, "video/mp4", "mp4")
    await _patch_clip(slug, {
        "video_path": path, "status": "video_ready", "error": None, "progress": None,
        "video_bytes": len(final), "pipeline": "cinematic", "subtitles": cues,
        "duration_seconds_video": total,
    })
    logger.info("Guide cinematic ready: %s (%s KB)", slug, len(final) // 1024)


_STAGES = {"audio": _job_audio, "video": _job_video, "keyframe": _job_keyframe, "cinematic": _job_cinematic}


# ── Multi-Shot (Iter 144/154): Präsenz-Talk-Shots + App-B-Roll ─────────────

async def _patch_shot(slug: str, shot_id: str, patch: dict) -> None:
    await db.guide_clips.update_one(
        {"slug": slug, "shots.id": shot_id},
        {"$set": {**{f"shots.$.{k}": v for k, v in patch.items()},
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
    )


def _shot_url(token: str, shot_id: str, kind: str) -> str:
    return _absolute(f"/api/guide/media/{token}/shot/{shot_id}/{kind}")


async def _job_shot_keyframes(slug: str, clip: dict, settings: dict, token: str) -> None:
    """Ein Keyframe pro Avatar-Shot; der vorige Keyframe dient als dritte Referenz (Konsistenz)."""
    if not settings.get("portrait_path"):
        raise FalError("Zuerst das Avatar-Bild (Gesicht) hochladen")
    refs = [_absolute(_media_url(settings["media_token"], "portrait"))]
    if settings.get("body_path"):
        refs.append(_absolute(_media_url(settings["media_token"], "body")))
    await _patch_clip(slug, {"media_token": token})
    previous = None
    for shot in clip.get("shots", []):
        if shot["type"] == "broll":
            continue
        if shot.get("keyframe_path"):
            previous = shot["id"]
            continue
        if SHOT_PRESETS.get(shot.get("preset") or "", {}).get("keyframe_from") == "prev" and previous:
            prev_shot = next(s_ for s_ in clip["shots"] if s_["id"] == previous)
            shot["keyframe_path"] = prev_shot["keyframe_path"]
            await _patch_shot(slug, shot["id"], {"keyframe_path": prev_shot["keyframe_path"], "raw_path": None, "synced_path": None, "fal_request": None})
            previous = shot["id"]
            continue
        preset = SHOT_PRESETS[shot["preset"]]
        aspect = clip.get("aspect") or preset["aspect_ratio"]
        await _patch_clip(slug, {"progress": f"Keyframe {shot['id']}"})
        shot_refs = refs + ([_shot_url(token, previous, "keyframe")] if previous else [])
        prompt = f"{style_prompt_for(preset)} {scene_for_aspect(shot.get('scene_prompt') or preset['scene_prompt'], aspect, talk=preset.get('kind') == 'talk')}"
        image = await asyncio.to_thread(edit_image, prompt, shot_refs, aspect)
        path = await _store(f"kf_{shot['id']}", slug, image, "image/png", "png")
        await _spend(slug, COST_KEYFRAME)
        shot["keyframe_path"] = path
        await _patch_shot(slug, shot["id"], {"keyframe_path": path, "raw_path": None, "synced_path": None, "fal_request": None, "error": None})
        previous = shot["id"]
    await _patch_clip(slug, {"status": "shots_keyframed", "progress": None, "error": None})


async def _tts_fitting(text: str, voice_id: str, limit: float | None) -> tuple[bytes, float]:
    audio, _ = await asyncio.to_thread(synthesize_speech, text, voice_id)
    seconds = await asyncio.to_thread(_duration_of, audio)
    if limit and seconds > limit:
        speed = min(1.25, round(seconds / limit + 0.03, 2))
        audio, _ = await asyncio.to_thread(synthesize_speech, text, voice_id, speed)
        seconds = await asyncio.to_thread(_duration_of, audio)
        if seconds > limit:
            raise FalError(f"Sprechtext dauert {seconds:.1f} s — in einen Talk-Shot passen {limit:.0f} s. Text kürzen.")
    return audio, seconds


def _duration_of(data: bytes) -> float:
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".bin", delete=True) as f:
        f.write(data)
        f.flush()
        return probe(f.name)["duration"]


async def _job_render(slug: str, clip: dict, settings: dict, token: str, preview: bool = False) -> None:
    """preview=True: fertigen Film nur als Vorschau ablegen (video_preview_path) — das freigegebene Video bleibt online,
    bis die Vorschau per /approve-preview übernommen wird."""
    shots = clip.get("shots") or []
    if not shots:
        raise FalError("Zuerst die Shots planen")
    if any(s["type"] != "broll" and not s.get("keyframe_path") for s in shots):
        raise FalError("Zuerst alle Keyframes erzeugen und prüfen")
    voice_id = settings.get("custom_voice_id") or DEFAULT_VOICE_ID
    empty = [s_["id"] for s_ in shots if s_["type"] != "walk" and not (s_.get("text") or "").strip()]
    if empty:
        raise FalError(f"Shot {', '.join(empty)} hat keinen Sprechtext — Text eintragen oder Shots neu planen")
    aspect = clip.get("aspect") or "16:9"
    pro = clip.get("quality") == "pro"
    width, height = FRAMES[aspect]
    await _patch_clip(slug, {"media_token": token})
    talk_shots = [s_ for s_ in shots if s_["type"] == "talk"]

    for shot in shots:
        sid, preset = shot["id"], SHOT_PRESETS.get(shot.get("preset") or "")
        if shot.get("text") and not shot.get("audio_path"):
            await _patch_clip(slug, {"progress": f"Stimme {sid}"})
            single = bool(clip.get("single_take"))
            limit = ((TALK_MAX_SECONDS_SINGLE if single else TALK_MAX_SECONDS_PRO) if pro else TALK_MAX_SECONDS) if shot["type"] == "talk" else None
            audio, seconds = await _tts_fitting(shot["text"], voice_id, limit)
            if shot["type"] == "talk" and seconds < 2.5:
                # OmniHuman/Lipsync hängen bei < 2 s Ton -> hinten mit Stille auf 2,5 s auffüllen
                audio = await asyncio.to_thread(pad_audio, audio, 0.0, 2.5)
                seconds = 2.5
            # GODMODE: Präsenz-Shots bekommen einen stillen Auftakt (erster Talk) und einen Ausklang
            # (letzter Talk), damit Wlad nicht auf Frame 1 losredet und nicht mitten im Blick abgeschnitten wird.
            idx = shots.index(shot)
            after_walk = idx > 0 and shots[idx - 1]["type"] == "walk"
            lead = 0.0
            if pro and shot["type"] == "talk":
                lead = TALK_LEAD_AFTER_WALK_SECONDS if after_walk else (TALK_LEAD_SECONDS if shot is talk_shots[0] else 0.0)
            tail = TALK_TAIL_SECONDS if (pro and shot["type"] == "talk" and shot is talk_shots[-1]) else 0.0
            if lead or tail:
                audio = await asyncio.to_thread(pad_audio, audio, lead, seconds + lead + tail)
                seconds = seconds + lead + tail
            shot["speech_lead"], shot["speech_tail"] = lead, tail
            shot["audio_path"] = await _store(f"a_{sid}", slug, audio, "audio/mpeg", "mp3")
            shot["audio_seconds"] = round(seconds, 2)
            await _patch_shot(slug, sid, {"audio_path": shot["audio_path"], "audio_seconds": shot["audio_seconds"],
                                          "speech_lead": lead, "speech_tail": tail})
        if pro and shot["type"] == "talk" and not shot.get("synced_path"):
            pending = shot.get("fal_request")
            await _patch_clip(slug, {"progress": f"OmniHuman {sid}" + (" (abholen)" if pending else "")})
            loop = asyncio.get_running_loop()

            def _remember(req, _sid=sid):
                # läuft im Worker-Thread: Request-ID sofort persistieren, damit ein Timeout nichts verliert
                asyncio.run_coroutine_threadsafe(_patch_shot(slug, _sid, {"fal_request": req}), loop).result(30)

            try:
                synced = await asyncio.to_thread(
                    omnihuman_video, _shot_url(token, sid, "keyframe"), _shot_url(token, sid, "audio"),
                    shot.get("motion_prompt") or preset["motion_prompt"], pending, _remember,
                    "720p" if clip.get("single_take") else "1080p",
                )
            except FalTimeout:
                raise FalError(f"OmniHuman {sid} steckt in der Fal-Queue — Request gemerkt, "
                               "„Rendern“ später erneut starten holt das Ergebnis ab")
            except FalError:
                await _patch_shot(slug, sid, {"fal_request": None})
                raise
            await _spend(slug, round(COST_OMNIHUMAN_PER_S * float(shot["audio_seconds"]), 2))
            shot["synced_path"] = await _store(f"sync_{sid}", slug, synced, "video/mp4", "mp4")
            shot["engine"] = "omnihuman"
            await _patch_shot(slug, sid, {"synced_path": shot["synced_path"], "engine": "omnihuman", "fal_request": None})
            continue
        needs_motion = shot["type"] == "walk" or (shot["type"] == "talk" and not pro)
        if needs_motion and not shot.get("raw_path"):
            if shot["type"] == "walk" and preset.get("audio"):
                # Walk-in (Kling 2.6): endet auf dem Keyframe des folgenden Talk-Shots -> nahtloser Übergang;
                # Ton (Schritte, Raumklang) danach bildsynchron aus MMAudio, weil Kling End-Frame + Audio ausschließt.
                nxt = next((s_ for s_ in shots[shots.index(shot) + 1:] if s_["type"] == "talk" and s_.get("keyframe_path")), None)
                await _patch_clip(slug, {"progress": f"Walk-in {sid} (Kling 2.6)"})
                raw = await asyncio.to_thread(
                    image_to_video_v26, _shot_url(token, sid, "keyframe"),
                    shot.get("motion_prompt") or preset["motion_prompt"], preset["duration"],
                    _shot_url(token, nxt["id"], "keyframe") if nxt else None,
                )
                shot["raw_path"] = await _store(f"raw_{sid}", slug, raw, "video/mp4", "mp4")
                await _patch_shot(slug, sid, {"raw_path": shot["raw_path"], "synced_path": None, "engine": "kling-2.6"})
                await _patch_clip(slug, {"progress": f"Walk-in {sid} Ton (MMAudio)"})
                sounded = await asyncio.to_thread(
                    add_ambience, _shot_url(token, sid, "raw"), preset["ambience_prompt"], float(preset["duration"]),
                )
                shot["raw_path"] = await _store(f"raw_{sid}", slug, sounded, "video/mp4", "mp4")
                shot["engine"] = "kling-2.6-audio"
                await _spend(slug, COST_I2V_AUDIO[preset["duration"]])
                await _patch_shot(slug, sid, {"raw_path": shot["raw_path"], "synced_path": None, "engine": "kling-2.6-audio"})
                continue
            await _patch_clip(slug, {"progress": f"Bewegung {sid} (Kling{' 2.5 Pro' if pro else ''})"})
            raw = await asyncio.to_thread(
                image_to_video, _shot_url(token, sid, "keyframe"),
                shot.get("motion_prompt") or preset["motion_prompt"], preset["duration"], aspect, pro,
            )
            shot["raw_path"] = await _store(f"raw_{sid}", slug, raw, "video/mp4", "mp4")
            await _spend(slug, (COST_I2V_PRO if pro else COST_I2V)[preset["duration"]])
            await _patch_shot(slug, sid, {"raw_path": shot["raw_path"], "synced_path": None, "engine": "kling-2.5-pro" if pro else "kling-2.1"})
        if shot["type"] == "talk" and not pro and not shot.get("synced_path"):
            await _patch_clip(slug, {"progress": f"Lipsync {sid}"})
            audio_bytes, _ = await asyncio.to_thread(get_object, shot["audio_path"])
            total = float(preset["duration"])
            padded = await asyncio.to_thread(pad_audio, audio_bytes, preset["speech_start"], total)
            shot["padded_path"] = await _store(f"pad_{sid}", slug, padded, "audio/mpeg", "mp3")
            await _patch_shot(slug, sid, {"padded_path": shot["padded_path"]})
            synced = await asyncio.to_thread(lipsync_video, _shot_url(token, sid, "raw"), _shot_url(token, sid, "padded"))
            await _spend(slug, COST_LIPSYNC_PER_S * total)
            shot["synced_path"] = await _store(f"sync_{sid}", slug, synced, "video/mp4", "mp4")
            await _patch_shot(slug, sid, {"synced_path": shot["synced_path"]})

    await _patch_clip(slug, {"progress": "Schnitt & Branding"})
    segments, cues, offset, brand_windows, fades = [], [], 0.0, [], []
    for shot in shots:
        preset = SHOT_PRESETS.get(shot.get("preset") or "")
        if segments and pro:
            # Überblendung zum vorigen Shot: nach einem Walk-in länger (Ton + Bild laufen weich ineinander)
            fades.append(XFADE_WALK if shots[len(segments) - 1]["type"] == "walk" else XFADE)
            offset -= fades[-1]
        if shot["type"] == "broll":
            audio, _ = await asyncio.to_thread(get_object, shot["audio_path"])
            screens = [_screen_bytes(s, aspect) for s in shot["screens"] if (BROLL_DIR / f"{s}.png").exists()]
            seg = await asyncio.to_thread(render_broll, screens, audio, width, height)
            cues += subtitle_chunks(shot["text"], offset, shot["audio_seconds"], 6)
        elif shot["type"] == "talk" and (shot.get("engine") == "omnihuman" or pro):
            synced, _ = await asyncio.to_thread(get_object, shot["synced_path"])
            audio, _ = await asyncio.to_thread(get_object, shot["audio_path"])
            seg = await asyncio.to_thread(normalize_segment, synced, audio, width, height)
            lead, tail = float(shot.get("speech_lead") or 0.0), float(shot.get("speech_tail") or 0.0)
            cues += subtitle_chunks(shot["text"], offset + 0.05 + lead, shot["audio_seconds"] - lead - tail, 6)
        elif shot["type"] == "talk":
            synced, _ = await asyncio.to_thread(get_object, shot["synced_path"])
            padded, _ = await asyncio.to_thread(get_object, shot["padded_path"])
            seg = await asyncio.to_thread(normalize_segment, synced, padded, width, height)
            cues += subtitle_chunks(shot["text"], offset + preset["speech_start"], shot["audio_seconds"], 6)
        else:
            raw, _ = await asyncio.to_thread(get_object, shot["raw_path"])
            seg = await asyncio.to_thread(normalize_segment, raw, None, width, height, shot.get("engine") == "kling-2.6-audio")
        if pro and shot is shots[-1] and shot["type"] == "talk":
            # Iter 177: sauberes Ende — 0,5 s Ruhe nach dem letzten Wort, dann 0,8 s Bild+Ton-Blende (kein Standbild/Loop);
            # ältere Takes mit 1,8 s Stille werden entsprechend gekürzt.
            baked_tail = float(shot.get("speech_tail") or 0.0)
            trim = max(0.0, baked_tail - (TALK_TAIL_SECONDS + OUTRO_FADE_SECONDS))
            seg = await asyncio.to_thread(outro, seg, OUTRO_FADE_SECONDS, trim)
        segments.append(seg)
        seg_len = await asyncio.to_thread(_duration_of, seg)
        if shot["type"] != "broll":
            brand_windows.append((offset + (1.0 if offset == 0 else 0.0), offset + seg_len))
        offset += seg_len

    if pro:
        # Iter 169: Verabschiedungs-Karte (Abschiedssatz, Unterschrift, nächster Schritt) statt nacktem Logo-Abbinder
        farewell, next_step = farewell_for(slug)
        signature = None
        if settings.get("signature_path"):
            signature, _ = await asyncio.to_thread(get_object, settings["signature_path"])
        film = clip.get("film")
        segments.append(await asyncio.to_thread(
            render_farewell_card, width, height, farewell, next_step, signature,
            FILM_CARD_SECONDS.get(film, 3.5), LEADERCHECK_URL if film == "login_film" else None,
        ))
        fades.append(XFADE_CARD)
    joined = await asyncio.to_thread(concat_segments, segments, fades if pro else 0.0)
    if clip.get("music_bed"):
        await _patch_clip(slug, {"progress": "Musikteppich"})
        bed = await _music_bed(settings)
        joined = await asyncio.to_thread(mix_music_bed, joined, bed, MUSIC_BED_DB)
    from services_video_compose import extract_audio

    audio_track = await asyncio.to_thread(extract_audio, joined)
    final = await asyncio.to_thread(finish_video, joined, audio_track, cues, True, brand_windows)
    path = await _store("video", slug, final, "video/mp4", "mp4")
    if preview:
        await _patch_clip(slug, {
            "status": "video_ready" if clip.get("video_path") else "preview_ready", "error": None, "progress": None,
            "video_preview_path": path, "preview_subtitles": cues, "preview_duration_seconds_video": round(offset, 1),
            "preview_bytes": len(final), "preview_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Guide preview ready: %s (%.1fs, %s KB) — altes Video bleibt online", slug, offset, len(final) // 1024)
        return
    await _patch_clip(slug, {
        "video_path": path, "status": "video_ready", "error": None, "progress": None,
        "video_bytes": len(final), "pipeline": "multishot", "subtitles": cues, "stale": False,
        "duration_seconds_video": round(offset, 1), "video_preview_path": None, "preview_subtitles": None,
    })
    logger.info("Guide multishot ready: %s (%.1fs, %s KB)", slug, offset, len(final) // 1024)


async def _job_render_preview(slug: str, clip: dict, settings: dict, token: str) -> None:
    await _job_render(slug, clip, settings, token, preview=True)


def _screen_bytes(screen: str, aspect: str) -> bytes:
    mobile = BROLL_DIR / f"{screen}_m.png"
    path = mobile if aspect == "9:16" and mobile.exists() else BROLL_DIR / f"{screen}.png"
    return path.read_bytes()


_FULL_SLOTS = asyncio.Semaphore(3)
XFADE = 0.45
XFADE_WALK = 0.8  # Übergang Walk-in -> Talk: Bild endet ohnehin auf dem Talk-Keyframe, Ton läuft weich hinüber
XFADE_CARD = 0.3  # Iter 177: der Take blendet selbst aus (outro), die Karte kommt danach kurz weich aus Schwarz
LEADERCHECK_URL = "https://leadercheck.de"
MUSIC_BED_DB = -27.0  # Musikteppich unter der Stimme kaum hörbar
MUSIC_BED_PROMPT = ("very quiet, warm cinematic ambient underscore, soft sustained pads and a gentle low piano motif, "
                    "slow, hopeful, minimal, no drums, no vocals, seamless loop")


async def _music_bed(settings: dict) -> bytes:
    """Musikteppich einmal KI-generieren (Stable Audio), in guide_settings ablegen, danach kostenlos wiederverwenden."""
    if settings.get("music_bed_path"):
        data, _ = await asyncio.to_thread(get_object, settings["music_bed_path"])
        return data
    data = await asyncio.to_thread(generate_music, MUSIC_BED_PROMPT, 47)
    path = await _store("music_bed", "settings", data, "audio/wav", "wav")
    await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$set": {"music_bed_path": path}}, upsert=True)
    return data


def _setting_for(slug: str, clip: dict) -> str | None:
    """Präsenz-Setting des Clips: explizit am Clip, sonst nach Inhalt (Studio für Werkzeuge/Teaser), sonst Loft."""
    if clip.get("quality") != "pro":
        return None
    return clip.get("setting") or CLIP_SETTING.get(slug, "loft")


async def _job_full(slug: str, clip: dict, settings: dict, token: str) -> None:
    """Komplett-Pipeline für die Serienproduktion: planen (falls nötig) -> Keyframes -> Film.
    Höchstens 3 Clips gleichzeitig, damit Fal nicht in 503 läuft."""
    async with _FULL_SLOTS:
        if not clip.get("shots"):
            clip["shots"] = plan_shots(clip["script"], CLIP_SCREENS.get(slug), clip.get("quality") == "pro",
                                       _setting_for(slug, clip),
                               single_take=bool(clip.get("single_take")), walk_in=bool(clip.get("walk_in")), film=clip.get("film"))
            await _patch_clip(slug, {"shots": clip["shots"]})
        await _job_shot_keyframes(slug, clip, settings, token)
        clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
        await _patch_clip(slug, {"status": "full_running"})
        await _job_render(slug, clip, settings, token)


_STAGES.update({"shot_keyframes": _job_shot_keyframes, "render": _job_render, "render_preview": _job_render_preview, "full": _job_full})


async def _run_job(slug: str, stage: str) -> None:
    """Fehler landen am Clip, nicht im Nirwana."""
    try:
        clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
        settings = await _settings()
        token = clip.get("media_token") or secrets.token_urlsafe(24)
        await _STAGES[stage](slug, clip, settings, token)
    except Exception as e:
        logger.error("Guide job %s/%s failed: %s", slug, stage, e)
        await _patch_clip(slug, {"status": f"{stage}_failed", "error": str(e)[:400], "progress": None})


def _start_job(slug: str, stage: str) -> None:
    task = asyncio.create_task(_run_job(slug, stage))
    _JOBS.add(task)
    task.add_done_callback(_JOBS.discard)


RUNNING = {"audio_running", "video_running", "keyframe_running", "cinematic_running",
           "shot_keyframes_running", "render_running", "render_preview_running", "full_running"}


async def release_orphaned_jobs() -> int:
    """Nach Prozess-Neustart: Clips mit In-Process-Jobstatus wieder freigeben (sonst dauerhaft 409)."""
    n = 0
    async for c in db.guide_clips.find({"status": {"$in": list(RUNNING)}}, {"_id": 0, "slug": 1, "status": 1}):
        stage = c["status"].removesuffix("_running")
        await _patch_clip(c["slug"], {"status": f"{stage}_failed", "progress": None,
                                      "error": "Server wurde neu gestartet — Auftrag bitte erneut starten (Fal-Ergebnisse werden abgeholt)"})
        n += 1
    if n:
        logger.warning("Guide: %s verwaiste Jobs freigegeben", n)
    return n


async def _kick(slug: str, stage: str, *checks) -> dict:
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    if clip.get("status") in RUNNING:
        raise HTTPException(status_code=409, detail="Für diesen Clip läuft schon ein Auftrag")
    settings = await _settings()
    for ok, message in checks:
        if not ok(clip, settings):
            raise HTTPException(status_code=400, detail=message)
    if not await _claim(slug, f"{stage}_running"):
        raise HTTPException(status_code=409, detail="Für diesen Clip läuft schon ein Auftrag")
    _start_job(slug, stage)
    return {"ok": True, "status": f"{stage}_running"}


async def _claim(slug: str, status: str, extra: dict | None = None) -> bool:
    """Atomarer Statuswechsel (compare-and-set) — verhindert doppelte, bezahlte Jobs bei parallelen Requests."""
    result = await db.guide_clips.update_one(
        {"slug": slug, "status": {"$nin": list(RUNNING)}},
        {"$set": {"status": status, "error": None, **(extra or {}),
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return result.modified_count == 1


@router.post("/admin/clips/{slug}/voice")
async def generate_voice(slug: str, request: Request):
    await require_admin(request)
    return await _kick(slug, "audio")


@router.post("/admin/clips/{slug}/video")
async def generate_video(slug: str, request: Request):
    await require_admin(request)
    return await _kick(
        slug, "video",
        (lambda c, s: c.get("audio_path"), "Zuerst die Stimme erzeugen und anhören"),
        (lambda c, s: s.get("portrait_path"), "Zuerst ein Frontalfoto von Wlad hochladen"),
    )


@router.post("/admin/clips/{slug}/keyframe")
async def generate_keyframe(slug: str, request: Request):
    await require_admin(request)
    return await _kick(
        slug, "keyframe",
        (lambda c, s: s.get("portrait_path"), "Zuerst das Avatar-Bild (Gesicht) hochladen"),
    )


@router.post("/admin/clips/{slug}/cinematic")
async def generate_cinematic(slug: str, request: Request):
    await require_admin(request)
    return await _kick(
        slug, "cinematic",
        (lambda c, s: c.get("keyframe_path"), "Zuerst den Keyframe erzeugen und prüfen"),
        (lambda c, s: c.get("audio_path"), "Zuerst die Stimme erzeugen und anhören"),
    )


class PublishIn(BaseModel):
    published: bool


# ── Admin: Multi-Shot ───────────────────────────────────────────────────────

@router.post("/admin/clips/{slug}/plan")
async def plan_clip_shots(slug: str, request: Request):
    """Verteilt das Skript auf Präsenz-Talk-Shots und App-B-Roll (kostenfrei, verwirft alte Shots)."""
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    if clip.get("status") in RUNNING:
        raise HTTPException(status_code=409, detail="Für diesen Clip läuft schon ein Auftrag")
    shots = plan_shots(clip["script"], CLIP_SCREENS.get(slug), clip.get("quality") == "pro", _setting_for(slug, clip),
                               single_take=bool(clip.get("single_take")), walk_in=bool(clip.get("walk_in")), film=clip.get("film"))
    await _patch_clip(slug, {"shots": shots, "status": "shots_planned", "error": None})
    return {"ok": True, "shots": shots}


class ShotIn(BaseModel):
    id: str
    text: str | None = None
    screens: list[str] | None = None
    scene_prompt: str | None = None
    motion_prompt: str | None = None


class ShotsSaveIn(BaseModel):
    shots: list[ShotIn]


@router.put("/admin/clips/{slug}/shots")
async def save_shots(slug: str, data: ShotsSaveIn, request: Request):
    """Text-/Szenen-Änderungen je Shot. Geänderter Text verwirft Stimme + Lipsync des Shots,
    geänderte Szene verwirft den Keyframe — es wird nur neu gerendert, was sich geändert hat."""
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    if clip.get("status") in RUNNING:
        raise HTTPException(status_code=409, detail="Für diesen Clip läuft schon ein Auftrag")
    by_id = {s["id"]: s for s in clip.get("shots", [])}
    for item in data.shots:
        shot = by_id.get(item.id)
        if not shot:
            raise HTTPException(status_code=404, detail=f"Shot {item.id} nicht gefunden")
        if item.text is not None:
            text = " ".join(item.text.split())
            if shot["type"] == "walk" and text:
                raise HTTPException(status_code=400, detail="Der Walk-in-Shot ist stumm")
            cap = talk_word_cap(shot.get("preset") or "", bool(clip.get("single_take")))
            if shot["type"] == "talk" and word_count(text) > cap:
                raise HTTPException(status_code=400, detail=f"Shot {item.id}: höchstens {cap} Wörter pro Talk-Shot")
            if text != shot.get("text", ""):
                shot.update({"text": text, "audio_path": None, "audio_seconds": None, "padded_path": None, "synced_path": None, "fal_request": None})
        if item.screens is not None and shot["type"] == "broll":
            screens = [s for s in item.screens if s in BROLL_SCREENS]
            if not screens:
                raise HTTPException(status_code=400, detail="Mindestens ein App-Screen für die B-Roll")
            shot["screens"] = screens
        for key in ("scene_prompt", "motion_prompt"):
            value = getattr(item, key)
            if value is not None and shot["type"] != "broll":
                value = value.strip()[:1500] or None
                if value != shot.get(key):
                    shot[key] = value
                    if key == "scene_prompt":
                        shot.update({"keyframe_path": None, "raw_path": None, "synced_path": None, "fal_request": None})
                    else:
                        shot.update({"raw_path": None, "synced_path": None, "fal_request": None})
    await _patch_clip(slug, {"shots": list(by_id.values()), "error": None})
    return {"ok": True}


@router.post("/admin/clips/{slug}/shot-keyframes")
async def generate_shot_keyframes(slug: str, request: Request):
    await require_admin(request)
    return await _kick(
        slug, "shot_keyframes",
        (lambda c, s: c.get("shots"), "Zuerst die Shots planen"),
        (lambda c, s: s.get("portrait_path"), "Zuerst das Avatar-Bild (Gesicht) hochladen"),
    )


class BulkIn(BaseModel):
    slugs: list[str]
    quality: str = "pro"
    reset: bool = False


@router.post("/admin/clips/bulk-produce")
async def bulk_produce(data: BulkIn, request: Request):
    """Serienproduktion: planen + Keyframes + Film je Clip (max. 3 parallel)."""
    await require_admin(request)
    settings = await _settings()
    if not settings.get("portrait_path"):
        raise HTTPException(status_code=400, detail="Zuerst das Avatar-Bild (Gesicht) hochladen")
    started, skipped = [], []
    for slug in data.slugs:
        clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
        if not clip or clip.get("status") in RUNNING:
            skipped.append(slug)
            continue
        if data.reset:
            # Upgrade: neu planen, Keyframes gleicher Presets behalten, alles andere neu rendern
            old = {(s_.get("preset"), s_["type"]): s_ for s_ in clip.get("shots", [])}
            shots = plan_shots(clip["script"], CLIP_SCREENS.get(slug), data.quality == "pro",
                               _setting_for(slug, {**clip, "quality": data.quality}), single_take=bool(clip.get("single_take")), walk_in=bool(clip.get("walk_in")), film=clip.get("film"))
            for s_ in shots:
                prev = old.get((s_.get("preset"), s_["type"]))
                if prev and prev.get("keyframe_path"):
                    s_["keyframe_path"] = prev["keyframe_path"]
            # Altes Video bleibt für Nutzer online, bis der neue Film fertig ist (pipeline=None erlaubt Re-Render)
            await _patch_clip(slug, {"shots": shots, "quality": data.quality, "pipeline": None, "stale": True})
        elif clip.get("video_path") and clip.get("pipeline") == "multishot":
            skipped.append(slug)
            continue
        else:
            await _patch_clip(slug, {"quality": data.quality})
        if not await _claim(slug, "full_running", {"progress": "wartet auf Slot"}):
            skipped.append(slug)
            continue
        _start_job(slug, "full")
        started.append(slug)
    return {"ok": True, "started": started, "skipped": skipped}


@router.post("/admin/clips/{slug}/render")
async def render_multishot(slug: str, request: Request):
    await require_admin(request)
    return await _kick(
        slug, "render",
        (lambda c, s: c.get("script_draft_status") != "pending", "Skript-Entwurf wartet auf Freigabe — erst freigeben, dann rendern"),
        (lambda c, s: c.get("shots"), "Zuerst die Shots planen"),
        (lambda c, s: all(sh.get("keyframe_path") for sh in c["shots"] if sh["type"] != "broll"),
         "Zuerst alle Keyframes erzeugen und prüfen"),
    )


@router.post("/admin/clips/{slug}/render-preview")
async def render_preview(slug: str, request: Request):
    """Film neu zusammensetzen/rendern, aber nur als Vorschau ablegen — das freigegebene Video bleibt online."""
    await require_admin(request)
    return await _kick(slug, "render_preview", (lambda c, s: bool(c.get("shots")), "Zuerst die Shots planen"))


@router.post("/admin/clips/{slug}/approve-preview")
async def approve_preview(slug: str, request: Request):
    """Vorschau übernehmen: wird das freigegebene Video (Version im Link ändert sich → kein Browser-Cache)."""
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip or not clip.get("video_preview_path"):
        raise HTTPException(status_code=400, detail="Keine Vorschau vorhanden")
    await _patch_clip(slug, {
        "video_path": clip["video_preview_path"], "subtitles": clip.get("preview_subtitles") or [],
        "duration_seconds_video": clip.get("preview_duration_seconds_video"), "video_bytes": clip.get("preview_bytes"),
        "status": "video_ready", "stale": False, "video_preview_path": None, "preview_subtitles": None,
        "preview_duration_seconds_video": None, "preview_bytes": None, "preview_at": None,
    })
    return {"ok": True, "video_path": clip["video_preview_path"]}


@router.delete("/admin/clips/{slug}/preview")
async def discard_preview(slug: str, request: Request):
    await require_admin(request)
    await _patch_clip(slug, {"video_preview_path": None, "preview_subtitles": None, "preview_duration_seconds_video": None,
                             "preview_bytes": None, "preview_at": None})
    return {"ok": True}


@router.post("/admin/clips/{slug}/publish")
async def publish_clip(slug: str, data: PublishIn, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    if data.published and not _active_video(clip)[1] and not clip.get("vimeo_id"):
        raise HTTPException(status_code=400, detail="Ohne fertiges Video kann nicht freigegeben werden")
    await db.guide_clips.update_one({"slug": slug}, {"$set": {
        "published": data.published,
        "published_at": datetime.now(timezone.utc).isoformat() if data.published else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {"ok": True, "published": data.published}


class ScriptDraftIn(BaseModel):
    script: str


CALM_PRESET = "loft_talk_medium"  # ruhige Präsenz-Einstellung: frontal, direkter Blick, kein Heranlaufen


@router.put("/admin/clips/{slug}/script-draft")
async def save_script_draft(slug: str, data: ScriptDraftIn, request: Request):
    """Neues Skript als Entwurf ablegen — ohne Freigabe kein Render, alter Clip bleibt online."""
    await require_admin(request)
    if not await db.guide_clips.find_one({"slug": slug}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    script = " ".join((data.script or "").split())
    if word_count(script) < 20:
        raise HTTPException(status_code=400, detail="Skript-Entwurf zu kurz (mind. 20 Wörter)")
    await db.guide_clips.update_one({"slug": slug}, {"$set": {
        "script_draft": script, "script_draft_status": "pending", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True, "words": word_count(script)}


@router.post("/admin/clips/{slug}/script-draft/approve")
async def approve_script_draft(slug: str, request: Request):
    """Entwurf freigeben: wird zum Skript, ruhige Einstellung gesetzt, Render danach freigeschaltet."""
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip or not clip.get("script_draft"):
        raise HTTPException(status_code=404, detail="Kein Skript-Entwurf vorhanden")
    await db.guide_clips.update_one({"slug": slug}, {"$set": {
        "script": clip["script_draft"], "script_source": "wlad_v2", "script_approved_at": datetime.now(timezone.utc).isoformat(),
        "script_draft_status": "approved", "shot_preset": CALM_PRESET, "single_take": True, "quality": "pro",
        "status": "script_ready", "updated_at": datetime.now(timezone.utc).isoformat(),
    }, "$unset": {"script_draft": "", "shots": ""}})
    return {"ok": True, "preset": CALM_PRESET}


@router.delete("/admin/clips/{slug}/script-draft")
async def discard_script_draft(slug: str, request: Request):
    await require_admin(request)
    await db.guide_clips.update_one({"slug": slug}, {"$unset": {"script_draft": "", "script_draft_status": ""}})
    return {"ok": True}


@router.get("/admin/clips/{slug}")
async def admin_clip(slug: str, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    return _admin_clip_view(clip)

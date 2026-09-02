"""Guide-Videos (Iter 142): Erststart-Serie + Mission-Intros mit Wlad-Avatar.

Produktion läuft ausschließlich über den Admin-Bereich:
    Skript (Vorschlag) -> Wlad kürzt -> Stimme -> Video -> FREIGABE
Ohne Freigabe sieht kein Nutzer etwas. Nutzer bekommen immer mindestens das
Skript als Text, damit nie ein Loch in der Oberfläche entsteht.
"""

import asyncio
import secrets
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from config import EMERGENT_LLM_KEY, db, logger
from guide_content import SCRIPT_MAX_WORDS, SCRIPT_MIN_WORDS, SHOT_PRESETS, WLAD_STYLE_PROMPT, seed_clips, word_count, word_limits
from routes.admin import require_admin
from routes.uploads import get_object, put_object
from services import get_current_user
from services_ai_errors import ai_http_error
from services_fal import (
    COST_I2V, COST_KEYFRAME, COST_LIPSYNC_PER_S, FalError, clone_voice, edit_image,
    image_to_video, lipsync_video, render_talking_video, synthesize_speech,
)
from services_video_compose import finish_video, pad_audio, subtitle_chunks

router = APIRouter(prefix="/api/guide", tags=["guide"])

SETTINGS_ID = "guide_settings"
DEFAULT_VOICE_ID = "Deep_Voice_Man"  # Minimax-Standardstimme, bis Wlads Klon steht
_JOBS: set = set()
SETTINGS_ASSETS = {"portrait": "portrait_path", "sample": "voice_sample_path", "body": "body_path"}
CLIP_MEDIA = {"video": "video_path", "audio": "audio_path", "padded": "audio_padded_path",
              "raw": "raw_video_path", "keyframe": "keyframe_path"}
MEDIA_TYPES = {"video": "video/mp4", "raw": "video/mp4", "audio": "audio/mpeg", "padded": "audio/mpeg",
               "keyframe": "image/png"}


# ── Datenzugriff ────────────────────────────────────────────────────────────

_BOOT_RESET_DONE = False


async def _ensure_seeded() -> None:
    """Legt fehlende Clips aus guide_content an (idempotent, überschreibt nichts).
    Beim ersten Aufruf nach einem Neustart werden verwaiste Läufe als Fehler markiert."""
    global _BOOT_RESET_DONE
    if not _BOOT_RESET_DONE:
        _BOOT_RESET_DONE = True
        await db.guide_clips.update_many(
            {"status": {"$regex": "_running$"}},
            {"$set": {"status": "interrupted", "progress": None,
                      "error": "Server wurde neu gestartet — Schritt bitte erneut starten"}},
        )
        await db.guide_settings.update_one(
            {"_id": SETTINGS_ID, "voice_clone_status": "running"},
            {"$set": {"voice_clone_status": "failed", "voice_clone_error": "Server wurde neu gestartet"}},
        )
    for seed in seed_clips():
        existing = await db.guide_clips.find_one({"slug": seed["slug"]}, {"_id": 0, "script": 1})
        if existing:
            continue
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


async def _settings() -> dict:
    doc = await db.guide_settings.find_one({"_id": SETTINGS_ID})
    return doc or {"_id": SETTINGS_ID}


async def _set_settings(patch: dict) -> None:
    await db.guide_settings.update_one({"_id": SETTINGS_ID}, {"$set": patch}, upsert=True)


def _media_url(token: str, kind: str) -> str:
    return f"/api/guide/media/{token}/{kind}"


def _public_clip(clip: dict, seen: list) -> dict:
    token = clip.get("media_token")
    has_video = bool(clip.get("video_path") and clip.get("published") and token)
    return {
        "slug": clip["slug"],
        "kind": clip["kind"],
        "ref": clip.get("ref"),
        "order": clip.get("order", 0),
        "title": clip["title"],
        "script": clip["script"],
        "video_url": _media_url(token, "video") if has_video else None,
        "duration_seconds": clip.get("duration_seconds"),
        "seen": clip["slug"] in seen,
    }


async def _progress(user_id: str) -> dict:
    doc = await db.guide_progress.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {"user_id": user_id, "seen": [], "mission_autoplay": True}


# ── Nutzer-Endpunkte ────────────────────────────────────────────────────────

@router.get("/clips")
async def list_clips(request: Request, kind: str = "onboarding"):
    user = await get_current_user(request)
    await _ensure_seeded()
    if kind not in ("onboarding", "mission", "teaser", "all"):
        raise HTTPException(status_code=400, detail="kind muss onboarding, mission, teaser oder all sein")
    query = {} if kind == "all" else {"kind": kind}
    clips = await db.guide_clips.find(query, {"_id": 0}).sort("order", 1).to_list(200)
    progress = await _progress(user["user_id"])
    items = [_public_clip(c, progress.get("seen", [])) for c in clips]
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


@router.get("/media/{token}/{kind}")
async def serve_media(token: str, kind: str):
    """Öffentlich (ohne Login): Guide-Videos sind für alle Nutzer identisch und
    müssen zusätzlich vom Generator-Dienst abgerufen werden können. Der Token ist
    nicht erratbar und hängt am jeweiligen Clip."""
    if kind not in CLIP_MEDIA and kind not in SETTINGS_ASSETS:
        raise HTTPException(status_code=404, detail="Not found")

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

    if not path:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception as e:
        logger.error("Guide media fetch failed for %s: %s", path, e)
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=data, media_type=media_type or content_type,
                    headers={"Cache-Control": "public, max-age=86400"})


# ── Admin: Einrichtung ──────────────────────────────────────────────────────

def _admin_clip_view(c: dict) -> dict:
    token = c.get("media_token")
    view = {k: v for k, v in c.items() if not k.endswith("_path")}
    for kind, field in CLIP_MEDIA.items():
        view[f"{kind}_url"] = _media_url(token, kind) if c.get(field) and token else None
    view["words"] = word_count(c.get("script", ""))
    view["word_limits"] = word_limits(c.get("kind", ""))
    preset = SHOT_PRESETS.get(c.get("shot_preset") or "")
    view["shot"] = preset and {**preset, "scene_prompt": c.get("scene_prompt") or preset["scene_prompt"],
                               "motion_prompt": c.get("motion_prompt") or preset["motion_prompt"]}
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
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0, "kind": 1})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    script = " ".join((data.script or "").split())
    words = word_count(script)
    lo, hi = word_limits(clip["kind"])
    if not lo <= words <= hi:
        raise HTTPException(
            status_code=400,
            detail=f"Skript hat {words} Wörter — erlaubt sind {lo} bis {hi}.",
        )
    patch = {
        "script": script,
        "script_source": "wlad",
        "status": "script_ready",
        "error": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
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


RUNNING = {"audio_running", "video_running", "keyframe_running", "cinematic_running"}


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
    await _patch_clip(slug, {"status": f"{stage}_running", "error": None})
    _start_job(slug, stage)
    return {"ok": True, "status": f"{stage}_running"}


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


@router.post("/admin/clips/{slug}/publish")
async def publish_clip(slug: str, data: PublishIn, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    if data.published and not clip.get("video_path"):
        raise HTTPException(status_code=400, detail="Ohne fertiges Video kann nicht freigegeben werden")
    await db.guide_clips.update_one({"slug": slug}, {"$set": {
        "published": data.published,
        "published_at": datetime.now(timezone.utc).isoformat() if data.published else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {"ok": True, "published": data.published}


@router.get("/admin/clips/{slug}")
async def admin_clip(slug: str, request: Request):
    await require_admin(request)
    clip = await db.guide_clips.find_one({"slug": slug}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip nicht gefunden")
    return _admin_clip_view(clip)

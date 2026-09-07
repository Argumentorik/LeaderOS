"""Interaktiver Wlad (Beta, Iter 156): Sprechen mit Wlad direkt am Video.

Pipeline pro Turn: Whisper-STT -> GPT-4o (Video-Kontext + RAG + Memory) -> Wlads Klonstimme
(dieselbe Minimax-Stimme wie in den Guide-Videos, ElevenLabs als Fallback).
Die Beta ist standardmäßig GESPERRT: nur Admins sehen sie im Preview, bis `interactive_beta.enabled`
über das Admin-Panel geöffnet wird.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from config import db, logger
from services import get_current_user, get_user_memory
from services_tier import resolve_user_tier
from services_actions import record_user_action
from services_ai_errors import ai_http_error
from routes.admin import require_admin
from routes.guide import SETTINGS_ID, _set_settings, _settings
from routes.voice_tts import (
    VOICE_REGISTRY, _cap_reply_length, _ensure_voice_session, _normalize_wlad_name, _persist_voice_turn,
    _synthesize_or_cached, _transcribe_webm, _voice_llm_reply,
)

router = APIRouter(prefix="/api/guide/interactive", tags=["guide-interactive"])

BETA_KEY = "interactive_beta"
MAX_CONTEXT_CHARS = 1200
PAID_TIERS = ("standard", "accelerator")
# Default: offen für Leader-OS/PLUS, Free darf 3 Gespräche testen, danach Upsell. `enabled` = für alle unbegrenzt.
BETA_DEFAULTS = {"enabled": False, "paid_open": True, "free_trial_turns": 3}


def _beta(settings: dict) -> dict:
    return {**BETA_DEFAULTS, **(settings.get(BETA_KEY) or {})}


async def _access(user: dict) -> dict:
    beta = _beta(await _settings())
    is_admin = bool(user.get("is_admin"))
    tier_info = await resolve_user_tier(user)
    tier = tier_info.get("tier") if tier_info.get("active", True) else "free"
    paid = tier in PAID_TIERS and beta["paid_open"]
    trial_total = int(beta["free_trial_turns"] or 0)
    trial_used = int(user.get("interactive_trial_used") or 0)
    trial_left = max(0, trial_total - trial_used)
    trial = not (is_admin or beta["enabled"] or paid)
    unlocked = is_admin or beta["enabled"] or paid or trial_left > 0
    return {
        "locked": not unlocked, "enabled": beta["enabled"], "paid_open": beta["paid_open"], "tier": tier,
        "admin_preview": is_admin and not beta["enabled"] and not paid,
        "trial": trial, "trial_left": trial_left if trial else None, "trial_total": trial_total,
        "updated_at": beta.get("updated_at"),
    }


async def _wlad_voice_config() -> dict:
    """Wlads Klonstimme aus dem Guide Studio (identisch zu den Videos); ElevenLabs-Fallback bleibt in _synthesize."""
    settings = await _settings()
    base = VOICE_REGISTRY["wlad"]
    voice_id = settings.get("custom_voice_id") or base["voice_id"]
    provider = "minimax" if settings.get("custom_voice_id") else base["provider"]
    return {**base, "voice_id": voice_id, "provider": provider}


@router.get("/status")
async def interactive_status(request: Request):
    user = await get_current_user(request)
    access = await _access(user)
    return {**access, "beta": True, "voice": "wlad-clone"}


class BetaToggleIn(BaseModel):
    enabled: Optional[bool] = None
    paid_open: Optional[bool] = None
    free_trial_turns: Optional[int] = None


@router.put("/admin")
async def set_interactive_beta(data: BetaToggleIn, request: Request):
    admin = await require_admin(request)
    current = _beta(await _settings())
    patch = {**current, **{k: v for k, v in data.model_dump().items() if v is not None},
             "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": admin.get("email")}
    patch["free_trial_turns"] = max(0, min(10, int(patch["free_trial_turns"])))
    await _set_settings({BETA_KEY: patch})
    logger.info("Interactive Wlad beta -> %s by %s", {k: patch[k] for k in BETA_DEFAULTS}, admin.get("email"))
    return {"ok": True, **_beta({BETA_KEY: patch, "_id": SETTINGS_ID})}


@router.post("/turn")
async def interactive_turn(
    request: Request,
    file: Optional[UploadFile] = File(None),
    text: str = Form(""),
    session_id: Optional[str] = Form(None),
    context_title: str = Form(""),
    context_script: str = Form(""),
):
    """Ein Turn am Video: Audio (oder getippte/vorgeschlagene Frage) rein, Wlads Antwort raus."""
    from routes.credits import check_and_deduct_credit, refund_credit

    user = await get_current_user(request)
    access = await _access(user)
    if access["locked"]:
        raise HTTPException(status_code=403, detail="interactive_locked")

    transcript = text.strip()[:600]
    if not transcript:
        audio_bytes = await file.read() if file else b""
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio")
        try:
            transcript = await _transcribe_webm(audio_bytes)
        except Exception as e:
            raise await ai_http_error(e, "voice_transcribe")
    if not transcript:
        raise HTTPException(status_code=400, detail="empty_transcript")

    credit = await check_and_deduct_credit(user, "chat")
    if not credit["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    session_id = await _ensure_voice_session(session_id, user["user_id"], transcript)
    await _persist_voice_turn(session_id, user["user_id"], "user", transcript)

    # Video-Kontext als Präfix: Wlad weiß, welches Video gerade läuft und was er dort gesagt hat
    ctx = ""
    if context_title:
        ctx = f"[Kontext: Der Nutzer schaut gerade dein Video „{context_title.strip()[:120]}“."
        if context_script:
            ctx += f" Dein Text dort: {context_script.strip()[:MAX_CONTEXT_CHARS]}"
        ctx += " Beziehe dich darauf, antworte in 2–3 Sätzen wie im Video: konkret, mit einem Werkzeug oder einer Rückfrage.] "
    try:
        memory = await get_user_memory(user["user_id"])
        reply = await _voice_llm_reply(session_id, user["user_id"], ctx + transcript, memory)
    except Exception as e:
        if not credit.get("is_premium"):
            try:
                await refund_credit(user["user_id"])
            except Exception as refund_err:
                logger.warning("Credit refund failed: %s", refund_err)
        raise await ai_http_error(e, "voice_reply")

    reply = _normalize_wlad_name(_cap_reply_length(reply))
    transcript = _normalize_wlad_name(transcript)
    await _persist_voice_turn(session_id, user["user_id"], "assistant", reply)
    await db.chat_sessions.update_one({"session_id": session_id},
                                      {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "mode": "interactive_wlad"}})

    try:
        await record_user_action(user["user_id"], "chat_message", metadata={"session_id": session_id, "mode": "interactive_wlad"})
    except Exception as e:
        logger.warning("record_user_action failed: %s", e)

    trial_left = access["trial_left"]
    if access["trial"]:
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"interactive_trial_used": 1}})
        trial_left = max(0, trial_left - 1)

    # Stimme kommt separat über /speak (eigenes Zeitfenster) — der Text erscheint sofort als Untertitel
    return {"session_id": session_id, "transcript": transcript, "response_text": reply, "audio_url": "",
            "persona": "wlad", "voice": "wlad-clone", "trial": access["trial"], "trial_left": trial_left}


class SpeakIn(BaseModel):
    text: str
    session_id: Optional[str] = None


@router.post("/speak")
async def interactive_speak(data: SpeakIn, request: Request):
    """Antworttext -> Wlads Klonstimme (Minimax, bis 40 s Queue-Budget; danach ElevenLabs-Fallback)."""
    user = await get_current_user(request)
    access = await _access(user)
    if access["locked"] and not (access["trial"] and data.session_id
                                 and await db.chat_sessions.find_one({"session_id": data.session_id, "user_id": user["user_id"]}, {"_id": 1})):
        raise HTTPException(status_code=403, detail="interactive_locked")
    text = _normalize_wlad_name(_cap_reply_length(data.text.strip()))
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    voice = {**(await _wlad_voice_config()), "tts_timeout": 40}
    audio_b64 = await _synthesize_or_cached(text, "wlad", voice)
    return {"audio_url": f"data:audio/mpeg;base64,{audio_b64}", "voice": "wlad-clone" if voice["provider"] == "minimax" else "fallback"}

"""ElevenLabs Voice Integration — WladBot motivational voice + 8 Challengers persona voices.

Strategy:
- Each persona maps to an ElevenLabs pre-made voice_id that matches the vibe (personality, gender, tone).
- Actual voice cloning of real celebrities is NOT legal/ethical, so we pick curated voices from
  ElevenLabs' public library that sound appropriate for each character.
- MongoDB cache (voice_cache collection) deduplicates identical text+voice requests to save API costs.
- Audio returned as base64 data-URL for inline <audio> playback — no file storage needed.
"""
from __future__ import annotations
import os
import base64
import hashlib
import tempfile
import uuid
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel, Field

from config import db, logger, EMERGENT_LLM_KEY
from services import get_current_user, get_user_memory
from services_actions import record_user_action
from routes.admin import require_admin

router = APIRouter(prefix="/api/voice", tags=["voice"])


# ── ElevenLabs Client (lazy init) ────────────────────────────────────────────
_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="ElevenLabs not configured")
        from elevenlabs.client import ElevenLabs
        _client = ElevenLabs(api_key=api_key)
    return _client


def _reset_client() -> None:
    """Invalidate the cached client — called on 401 so the next request re-reads
    ELEVENLABS_API_KEY from env (supports key rotation without pod restart)."""
    global _client
    _client = None


# ── Persona → Voice Registry ────────────────────────────────────────────────
# Voice IDs from ElevenLabs public library — curated to match each persona's tone.
# Users can later override these per-persona via admin endpoint (future feature).
VOICE_REGISTRY: dict[str, dict] = {
    # Motivational German coach (the heart of the app).
    # Iter 92.23 (Mert: "Brian klingt zu hoch — standard AI voice, etwas tiefer"):
    #   Default umgestellt auf "Adam" — deep, neutral, classic ElevenLabs
    #   default voice. Klingt erkennbar als AI (genau was Mert will), aber
    #   nicht piepsig. Stability auf 0.55 für mehr Natürlichkeit, style 0.30
    #   damit Wlad nicht überdramatisch klingt.
    #   Override via env `ELEVENLABS_WLAD_VOICE_ID=<id>` möglich.
    "wlad": {
        "voice_id": os.environ.get("ELEVENLABS_WLAD_VOICE_ID", "pNInz6obpgDQGcFmaJgB"),  # "Adam" — deep, neutral male (standard AI sound)
        "name": "Wlad Jachtchenko",
        "stability": 0.72, "similarity_boost": 0.80, "style": 0.12,
        "language": "de",
    },
    # 8 Challengers
    "bezos": {
        "voice_id": "TX3LPaxmHKxFdv7VOQHJ",  # "Liam" — calm, commanding male
        "name": "Jeff Bezos", "stability": 0.60, "similarity_boost": 0.70, "style": 0.25, "language": "de",
    },
    "musk": {
        "voice_id": "onwK4e9ZLuTAKqWW03F9",  # "Daniel" — slightly nerdy, precise male
        "name": "Elon Musk", "stability": 0.45, "similarity_boost": 0.75, "style": 0.55, "language": "de",
    },
    "oprah": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # "Bella" — warm, empathic female
        "name": "Oprah Winfrey", "stability": 0.65, "similarity_boost": 0.80, "style": 0.50, "language": "de",
    },
    "jobs": {
        "voice_id": "ErXwobaYiN019PkySvjV",  # "Antoni" — passionate, intense male
        "name": "Steve Jobs", "stability": 0.45, "similarity_boost": 0.80, "style": 0.60, "language": "de",
    },
    "branson": {
        "voice_id": "VR6AewLTigWG4xSOukaG",  # "Arnold" — energetic, charismatic male
        "name": "Richard Branson", "stability": 0.50, "similarity_boost": 0.75, "style": 0.55, "language": "de",
    },
    "sandberg": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # "Sarah" — mature, reassuring, confident female
        "name": "Sheryl Sandberg", "stability": 0.60, "similarity_boost": 0.75, "style": 0.35, "language": "de",
    },
    "page": {
        "voice_id": "pqHfZKP75CvOlQylNhV4",  # "Bill" — thoughtful, analytical male
        "name": "Larry Page", "stability": 0.60, "similarity_boost": 0.75, "style": 0.30, "language": "de",
    },
    "hastings": {
        "voice_id": "JBFqnCBsd6RMkjVDRZzb",  # "George" — authoritative, direct male
        "name": "Reed Hastings", "stability": 0.55, "similarity_boost": 0.75, "style": 0.40, "language": "de",
    },
}

MODEL_ID = "eleven_multilingual_v2"  # supports both DE + EN
MAX_TEXT_LENGTH = 800  # ~60s of audio — enough for intros/quotes, protects cost


# ── Sparring-Personas (Iter 124.2 — Multi-Persona Voice-Sparring) ────────────
# Each maps a sparring counterparty to a real ElevenLabs voice + attitude.
# Voice IDs reuse the celebrity registry above so we don't burn extra slots.
SPARRING_PERSONAS: dict[str, dict] = {
    "cfo": {
        "label": "CFO / Finanz-Chef",
        "hint": "Zahlen · ROI · kalt · misstrauisch",
        "voice_id": "JBFqnCBsd6RMkjVDRZzb",  # George — authoritative male
        "stability": 0.62, "similarity_boost": 0.78, "style": 0.30,
        "attitude": (
            "Du BIST der CFO. Denke in Zahlen, ROI, Cashflow, Risiko. "
            "Kurze, harte Sätze. Kein Fluff, keine Emotion. Wenn er "
            "Zahlen bringt, greifst du sie an ('woher weißt du das?', "
            "'was wenn es 20% weniger wird?'). Wenn er Emotion bringt, "
            "sagst du 'das ist kein Argument'."
        ),
    },
    "board": {
        "label": "Board / Vorstand",
        "hint": "Strategisch · gemessen · staatsmännisch",
        "voice_id": "TX3LPaxmHKxFdv7VOQHJ",  # Liam — calm, commanding
        "stability": 0.65, "similarity_boost": 0.75, "style": 0.28,
        "attitude": (
            "Du BIST ein skeptisches Board-Mitglied. Denke strategisch, "
            "langfristig. Frage nach Wettbewerb, Skalierbarkeit, "
            "Risiko-Adjusted-Return. Höflich aber unbeeindruckt. Ton: "
            "gemessen, staatsmännisch, gefährlich ruhig."
        ),
    },
    "customer": {
        "label": "Verärgerter Kunde",
        "hint": "Emotional · direkt · ungeduldig",
        "voice_id": "VR6AewLTigWG4xSOukaG",  # Arnold — energetic, sharp
        "stability": 0.42, "similarity_boost": 0.72, "style": 0.55,
        "attitude": (
            "Du BIST ein verärgerter Key-Account-Kunde. Du bist frustriert, "
            "hast bereits eskaliert, denkst über Kündigung nach. Direkt, "
            "emotional, ungeduldig. Unterbrich ruhig. Fokus: 'Was macht "
            "ihr JETZT dagegen?'. Kein Small-Talk-Mode."
        ),
    },
    "boss": {
        "label": "Chef / Vorgesetzter",
        "hint": "Zeitknapp · pragmatisch · leicht skeptisch",
        "voice_id": "onwK4e9ZLuTAKqWW03F9",  # Daniel — precise, nerdy
        "stability": 0.55, "similarity_boost": 0.78, "style": 0.35,
        "attitude": (
            "Du BIST sein direkter Vorgesetzter. Du magst ihn, aber du "
            "trägst Verantwortung nach oben. Zeitknapp, pragmatisch. "
            "Fragst 'wie viel Aufwand?', 'wer macht das?', 'wann ist "
            "das durch?'. Skeptisch bei allem was mehr Arbeit für dich "
            "bedeutet."
        ),
    },
    "team": {
        "label": "Team-Mitglied",
        "hint": "Enttäuscht · verletzlich · sucht Warum",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella — warm female
        "stability": 0.60, "similarity_boost": 0.80, "style": 0.42,
        "attitude": (
            "Du BIST ein Team-Mitglied das enttäuscht/verunsichert ist. "
            "Emotional, ehrlich, verletzlich aber nicht schwach. Willst "
            "verstehen warum. Fragst nach dem Warum, nicht nach dem Wie. "
            "Wenn er nur Fakten bringt, sagst du 'das beantwortet mein "
            "Gefühl nicht'."
        ),
    },
}


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH)
    persona: str = Field(..., description="Persona key: wlad, bezos, musk, oprah, jobs, branson, sandberg, page, hastings")


# ── Helpers ─────────────────────────────────────────────────────────────────

def _cache_key(text: str, voice_id: str) -> str:
    """Stable hash for caching identical text+voice combinations."""
    raw = f"{voice_id}:{text}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def _get_cached_audio(cache_key: str) -> Optional[str]:
    doc = await db.voice_cache.find_one({"cache_key": cache_key}, {"_id": 0, "audio_b64": 1})
    return doc["audio_b64"] if doc else None


async def _save_cached_audio(cache_key: str, persona: str, text: str, voice_id: str, audio_b64: str) -> None:
    await db.voice_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {
            "cache_key": cache_key,
            "persona": persona,
            "voice_id": voice_id,
            "text_preview": text[:100],
            "audio_b64": audio_b64,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )


import re as _re_name


def _normalize_wlad_name(text: str) -> str:
    """Defensive: ersetze alle Vorkommen von 'Vlad' / 'Vladimir' / 'Wladimir' durch 'Wlad'.

    Mert: 'Vlad darf nicht genannt werden, nur Wlad'. Wenn das LLM trotz
    System-Prompt-Anweisung 'Vlad' ausgibt (oder ein RAG-Quelltext es enthält),
    fängt das hier den Slip ab — sowohl im TTS-Eingabetext als auch in
    Antworten, die wir an den Frontend zurückgeben.
    """
    if not text:
        return text
    # Standalone occurrences only — keep 'Wlad' intact, fix 'Vlad' / 'Vladi'
    text = _re_name.sub(r"\bVladimir\b", "Wlad", text)
    text = _re_name.sub(r"\bWladimir\b", "Wlad", text)
    text = _re_name.sub(r"\bVlad\b", "Wlad", text)
    return text


def _synthesize(text: str, voice_config: dict) -> bytes:
    """Blocking synthesis — returns raw MP3 bytes. Run inside run_in_threadpool."""
    text = _normalize_wlad_name(text)
    client = _get_client()
    try:
        from elevenlabs import VoiceSettings
    except ImportError:
        from elevenlabs.types import VoiceSettings
    settings = VoiceSettings(
        stability=voice_config["stability"],
        similarity_boost=voice_config["similarity_boost"],
        style=voice_config.get("style", 0.0),
        use_speaker_boost=True,
    )
    stream = client.text_to_speech.convert(
        text=text,
        voice_id=voice_config["voice_id"],
        model_id=MODEL_ID,
        voice_settings=settings,
        output_format="mp3_44100_128",
    )
    return b"".join(chunk for chunk in stream)


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/personas")
async def list_personas() -> dict:
    """Return the voice-persona registry (for frontend to know which personas are speakable)."""
    return {
        "personas": [
            {"persona": k, "name": v["name"], "language": v["language"]}
            for k, v in VOICE_REGISTRY.items()
        ],
        "model": MODEL_ID,
    }


@router.post("/tts")
async def text_to_speech(data: TTSRequest, request: Request) -> dict:
    """Generate speech for a given persona. Uses MongoDB cache for repeat requests.

    Returns `{audio_url: 'data:audio/mpeg;base64,...', cached: bool, persona, voice_id}`.
    """
    await get_current_user(request)  # require auth

    persona_key = data.persona.lower()
    voice_config = VOICE_REGISTRY.get(persona_key)
    if not voice_config:
        raise HTTPException(status_code=400, detail=f"Unknown persona '{persona_key}'. Available: {list(VOICE_REGISTRY.keys())}")

    text = data.text.strip()
    cache_key = _cache_key(text, voice_config["voice_id"])

    # 1. Try cache
    cached_b64 = await _get_cached_audio(cache_key)
    if cached_b64:
        return {
            "audio_url": f"data:audio/mpeg;base64,{cached_b64}",
            "cached": True,
            "persona": persona_key,
            "voice_id": voice_config["voice_id"],
        }

    # 2. Synthesize — graceful degrade: quota/rate/voice errors return empty
    #    audio_url instead of 502 (mirrors /voice/conversation behaviour).
    audio_bytes: bytes = b""  # pre-init to satisfy strict static analysis
    try:
        from fastapi.concurrency import run_in_threadpool
        audio_bytes = await run_in_threadpool(_synthesize, text, voice_config)
    except Exception as e:
        err_msg = str(e)
        low = err_msg.lower()
        # Iter 135 (Audit): short, honest reason instead of a raw SDK header dump.
        if "invalid_api_key" in low or "api key id used as api key" in low:
            reason = "elevenlabs_invalid_api_key"
        elif "quota" in low or "429" in low:
            reason = "elevenlabs_quota_or_rate_limit"
        elif "401" in low or "unauthorized" in low:
            reason = "elevenlabs_unauthorized"
        else:
            reason = "elevenlabs_unavailable"

        # On 401 Unauthorized from ElevenLabs, drop cached client so next request
        # re-reads ELEVENLABS_API_KEY (handles rotation without pod restart).
        if "401" in err_msg or "Unauthorized" in err_msg or "invalid_api_key" in err_msg.lower():
            logger.warning(f"ElevenLabs 401 — resetting client for next request: {e}")
            _reset_client()
        else:
            logger.warning(f"ElevenLabs synthesis unavailable — returning empty audio: {e}")
        return {
            "audio_url": "",
            "cached": False,
            "persona": persona_key,
            "voice_id": voice_config["voice_id"],
            # Iter 135 (Audit): never a silent failure. The caller (and Ops)
            # must be able to see WHY there is no audio.
            "error": reason,
        }

    audio_b64 = base64.b64encode(audio_bytes).decode("ascii")

    # 3. Cache (only if under 250 KB — prevents collection bloat)
    if len(audio_b64) < 250_000:
        try:
            await _save_cached_audio(cache_key, persona_key, text, voice_config["voice_id"], audio_b64)
        except Exception as e:
            logger.warning(f"Voice cache write failed: {e}")

    return {
        "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
        "cached": False,
        "persona": persona_key,
        "voice_id": voice_config["voice_id"],
        "bytes": len(audio_bytes),
    }


@router.delete("/cache")
async def clear_voice_cache(request: Request, persona: Optional[str] = None) -> dict:
    """Admin-only: clear the voice cache.

    Optional `?persona=wlad` scopes deletion to a single persona (only that voice's
    cached audio is cleared — useful after changing just one voice_id mapping).
    Without the query param, the entire cache is wiped.
    """
    await require_admin(request)  # trusted is_admin DB flag only

    query: dict = {}
    if persona:
        persona_key = persona.lower()
        if persona_key not in VOICE_REGISTRY:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown persona '{persona_key}'. Available: {list(VOICE_REGISTRY.keys())}",
            )
        query = {"persona": persona_key}

    result = await db.voice_cache.delete_many(query)
    return {"deleted": result.deleted_count, "scope": persona or "all"}



# ── Audio-Mode: Conversational Voice Endpoint ───────────────────────────────
# ChatGPT/Claude-style voice mode: audio-in → transcript → LLM → audio-out.

VOICE_CONVO_SYSTEM_PROMPT = """Du bist WladBot — ein deutschsprachiger Leadership-Coach im LIVE-VOICE-MODUS.

WICHTIG für Voice:
- Antworte natürlich gesprochen, wie in einem echten Gespräch.
- Maximal 2-3 kurze Sätze (60-90 Wörter), niemals länger.
- Kein JSON, keine Listen, keine Aufzählungspunkte, keine Überschriften.
- Keine Markdown-Formatierung, keine Sterne, keine Klammern.
- Stelle gerne Rückfragen, halte den Dialog am Leben.
- Sprich Deutsch, sei direkt, warm, charismatisch — wie Wlad Jachtchenko persönlich.
- Wenn der User unklar spricht, frage präzise nach.

NAMENSREGEL — STRIKT:
- Sein Name wird IMMER „Wlad" geschrieben (mit W), niemals „Vlad".
- Auch nicht „Vladimir", nicht „Wladimir" — nur „Wlad".

WLADS FRAMEWORKS (nutze, wenn der RAG-Kontext unten welche liefert):
- 3 Säulen der Überzeugung (Logos · Ethos · Pathos)
- Kommunikationsquadrant (Klarheit · Empathie · Struktur · Mut)
- Schwarze Rhetorik / Manipulationsabwehr
- Verhandeln nach Wlad-Methodik
Wenn du ein Framework anwendest, nenne es kurz beim Namen — auch im Voice-Modus.
"""


class VoiceConvoResponse(BaseModel):
    session_id: str
    transcript: str
    response_text: str
    audio_url: str
    persona: str


async def _transcribe_webm(audio_bytes: bytes) -> str:
    """Whisper transcription. Auto-detects language but biases to DE."""
    from emergentintegrations.llm.openai import OpenAISpeechToText
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    try:
        with open(tmp_path, "rb") as f:
            response = await stt.transcribe(file=f, model="whisper-1", response_format="json", language="de")
        return (response.text or "").strip()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


async def _voice_llm_reply(session_id: str, user_id: str, transcript: str, user_memory: str) -> str:
    """Generate a short conversational reply for voice mode.

    Iter 92.20 (Mert): RAG-Injection + faster model + parallel context fetch
    to keep total voice latency under the Cloudflare 30s edge timeout.

    Pipeline (~6-12s total):
      - parallel: history fetch | RAG retrieve (local embed + Mongo top-K)
      - gpt-4o-mini for the LLM step (2-3s vs gpt-5.2's 15-25s)
      - Wlad's frameworks still grounded via RAG context block
    """
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import asyncio as _asyncio

    async def _fetch_history():
        return await db.chat_messages.find(
            {"session_id": session_id}, {"_id": 0, "role": 1, "content": 1}
        ).sort("created_at", 1).to_list(20)

    async def _fetch_rag():
        try:
            from services_rag import retrieve_context
            return await retrieve_context(transcript)
        except Exception as e:
            logger.warning(f"Voice RAG failed (proceeding without): {e}")
            return {"rag_active": False, "context_block": "", "chunks_count": 0}

    history, rag_ctx = await _asyncio.gather(_fetch_history(), _fetch_rag())

    memory_block = f"\n\n--- USER MEMORY ---\n{user_memory}\n---" if user_memory else ""
    rag_block = ""
    if rag_ctx.get("rag_active") and rag_ctx.get("context_block"):
        rag_block = "\n\n" + rag_ctx["context_block"]
        logger.info("Voice RAG: %d chunks injected", rag_ctx.get("chunks_count", 0))

    # Iter 121: framework-aware Boost. Wenn der Nutzer per Voice ein Wlad-
    # Framework anspricht (auch phonetisch verballhornt — "sexier" → SEXIER),
    # geben wir dem LLM einen expliziten Hinweis, welches Framework der
    # Nutzer WAHRSCHEINLICH meint.
    framework_block = ""
    try:
        from voice_framework_map import match_frameworks
        matches = match_frameworks(transcript)
        if matches:
            names = ", ".join(f"{m['framework']} ({m['pillar']})" for m in matches)
            framework_block = (
                f"\n\n--- FRAMEWORK-KONTEXT (Voice-Match) ---\n"
                f"Der User hat vermutlich diese Wlad-Frameworks erwähnt (auch bei "
                f"unklarer Aussprache): {names}.\n"
                f"Beziehe deine Antwort explizit auf dieses Framework und nenne "
                f"es beim Namen.\n---"
            )
    except Exception as e:
        logger.warning(f"Voice framework map skipped: {e}")

    system_msg = VOICE_CONVO_SYSTEM_PROMPT + rag_block + framework_block + memory_block

    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"voicemode_{session_id}", system_message=system_msg)
    # gpt-4o-mini = ~10x schneller als gpt-5.2 für 2-3 Satz-Voice-Antworten.
    # RAG-Block grounded ihn auf Wlads Frameworks → Qualität bleibt hoch.
    # Voice quality (Tester-Feedback Iter 115): gpt-4o statt gpt-4o-mini —
    # deutlich bessere Antworten, immer noch schnell genug für Voice (~3-5s).
    chat.with_model("openai", "gpt-4o")

    # Build short context — only last 6 turns to keep TTS latency low
    ctx_lines = []
    for m in history[-6:]:
        role = "User" if m.get("role") == "user" else "Coach"
        # Strip JSON-style artifacts from previous structured replies
        content = m.get("content", "")
        if content.startswith("{") and len(content) > 200:
            content = "(vorherige Coaching-Antwort)"
        ctx_lines.append(f"{role}: {content}")
    ctx = "\n".join(ctx_lines)
    prompt = f"{ctx}\nUser: {transcript}\nCoach:" if ctx else transcript

    reply = await chat.send_message(UserMessage(text=prompt))
    return (reply or "").strip()


async def _ensure_voice_session(session_id: Optional[str], user_id: str, transcript: str) -> str:
    """Create a voice chat session if none exists, return session_id."""
    if session_id:
        return session_id
    new_id = f"chat_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_sessions.insert_one({
        "session_id": new_id, "user_id": user_id,
        "title": transcript[:50], "agent": None, "mode": "voice",
        "created_at": now, "updated_at": now,
    })
    return new_id


async def _persist_voice_turn(session_id: str, user_id: str, role: str, content: str) -> None:
    """Persist a single user/assistant voice-mode turn to chat_messages."""
    await db.chat_messages.insert_one({
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "session_id": session_id, "user_id": user_id,
        "role": role, "content": content, "mode": "voice",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


def _cap_reply_length(text: str) -> str:
    """Trim reply to TTS-safe length on a word boundary."""
    if not text:
        return "Sag das nochmal — habe ich nicht ganz verstanden."
    if len(text) > MAX_TEXT_LENGTH:
        return text[:MAX_TEXT_LENGTH].rsplit(" ", 1)[0] + "."
    return text


async def _synthesize_or_cached(reply_text: str, persona_key: str, voice_config: dict) -> str:
    """Return base64-encoded TTS audio, using cache when available."""
    cache_key = _cache_key(reply_text, voice_config["voice_id"])
    cached = await _get_cached_audio(cache_key)
    if cached:
        return cached
    try:
        from fastapi.concurrency import run_in_threadpool
        audio_bytes_out = await run_in_threadpool(_synthesize, reply_text, voice_config)
    except Exception as e:
        err_msg = str(e)
        if "401" in err_msg or "Unauthorized" in err_msg or "invalid_api_key" in err_msg.lower():
            _reset_client()
        logger.error(f"Voice TTS failed: {e}")
        raise HTTPException(status_code=502, detail=f"Voice synthesis failed: {e}")
    audio_b64 = base64.b64encode(audio_bytes_out).decode("ascii")
    if len(audio_b64) < 250_000:
        try:
            await _save_cached_audio(cache_key, persona_key, reply_text, voice_config["voice_id"], audio_b64)
        except Exception as e:
            logger.warning(f"Voice cache write failed: {e}")
    return audio_b64


@router.post("/conversation", response_model=VoiceConvoResponse)
async def voice_conversation(
    request: Request,
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    persona: str = Form("wlad"),
) -> VoiceConvoResponse:
    """Audio-in → audio-out single-shot voice turn for ChatGPT-style audio mode.

    Pipeline: Whisper STT → GPT-5.2 short reply → ElevenLabs TTS → persist turns.
    Credit is deducted only after a valid transcript exists.
    """
    from routes.credits import check_and_deduct_credit
    user = await get_current_user(request)

    persona_key = persona.lower()
    voice_config = VOICE_REGISTRY.get(persona_key)
    if not voice_config:
        raise HTTPException(status_code=400, detail=f"Unknown persona '{persona_key}'")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio")

    # 1. Transcribe BEFORE deducting credit (no credit burn on bad audio)
    try:
        transcript = await _transcribe_webm(audio_bytes)
    except Exception as e:
        logger.error(f"Voice transcription failed: {e}")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    if not transcript:
        raise HTTPException(status_code=400, detail="empty_transcript")

    # 2. Charge credit
    credit_result = await check_and_deduct_credit(user, "chat")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    # 3. Session + user turn
    session_id = await _ensure_voice_session(session_id, user["user_id"], transcript)
    await _persist_voice_turn(session_id, user["user_id"], "user", transcript)

    # 4. LLM reply
    user_memory = await get_user_memory(user["user_id"])
    try:
        reply_text = await _voice_llm_reply(session_id, user["user_id"], transcript, user_memory)
    except Exception as e:
        logger.error(f"Voice LLM reply failed: {e}")
        # Refund the credit — the user paid but got no answer.
        if not credit_result.get("is_premium"):
            try:
                from routes.credits import refund_credit
                await refund_credit(user["user_id"])
            except Exception as refund_err:
                logger.warning(f"Credit refund failed: {refund_err}")
        raise HTTPException(status_code=502, detail=f"AI reply failed: {e}")
    reply_text = _cap_reply_length(reply_text)
    reply_text = _normalize_wlad_name(reply_text)
    # Also normalise the transcript that goes back to the UI/Memory.
    transcript = _normalize_wlad_name(transcript)

    # 5. Persist assistant turn + bump session timestamp
    await _persist_voice_turn(session_id, user["user_id"], "assistant", reply_text)
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    # 6. TTS (cached) — graceful: if TTS fails (e.g. quota), still return the text reply
    try:
        audio_b64 = await _synthesize_or_cached(reply_text, persona_key, voice_config)
        audio_url = f"data:audio/mpeg;base64,{audio_b64}"
    except HTTPException as e:
        logger.warning(f"TTS unavailable — returning text-only voice reply: {e.detail}")
        audio_url = ""

    try:
        await record_user_action(user["user_id"], "chat_message", metadata={"session_id": session_id, "mode": "voice"})
    except Exception as e:
        logger.warning(f"record_user_action failed: {e}")

    return VoiceConvoResponse(
        session_id=session_id,
        transcript=transcript,
        response_text=reply_text,
        audio_url=audio_url,
        persona=persona_key,
    )


# ── Voice Sparring (Iter 124 — Argumentations-Live-Coach) ────────────────────

SPARRING_SYSTEM_PROMPT = """Du bist WLAD JACHTCHENKO — der Argumentations-Sparring-Partner.

Der User hat eine SEXIER-Strategie vorbereitet und übt jetzt LIVE. Deine Rolle:

1. Du spielst den GEGENÜBER — realistisch, spezifisch auf das Prep-Kontext.
2. Du bringst einen der antizipierten Einwände (oder einen ähnlichen) — kurz, direkt, glaubwürdig.
3. Du unterbrichst NICHT freundlich — du bist der schwierige CFO/Chef/Kunde/Board-Mitglied.
4. Nach 2-3 User-Antworten wechselst du KURZ in Coach-Modus: 1 Satz konkretes Feedback ("Der Einstieg war stark, aber das Framing zum ROI hat gefehlt"), dann zurück ins Sparring.

STIL:
- Antwortlänge: 1-2 Sätze MAX (max 20 Wörter). Diese sind Voice-Antworten — MUSS kurz sein.
- Direktes Deutsch, kein Fluff, keine Höflichkeitsfloskeln.
- Emotionaler Ton passend zur Rolle (skeptisch/bissig/testend).
- Kein Meta-Talk ("ich spiele jetzt X") — du BIST X.

WICHTIG:
- Nutze IMMER das Prep-Kontext (Ziel, Argumente, Einwände, verborgene Interessen).
- Wenn User etwas Starkes sagt, greif es auf und challenge weiter.
- Wenn User schwach ist, zeig es — aber baue dann Coach-Feedback ein.
- Sprich Deutsch. Erwähne dich selbst als "Wlad" nur beim Coach-Feedback.
"""


@router.get("/sparring-personas")
async def list_sparring_personas():
    """Return the sparring-persona catalog for the frontend picker."""
    return {
        "personas": [
            {"key": k, "label": v["label"], "hint": v.get("hint", "")}
            for k, v in SPARRING_PERSONAS.items()
        ],
    }


@router.post("/argumentation-sparring")
async def argumentation_sparring(
    request: Request,
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    prep_context: str = Form("{}"),
    persona: str = Form("wlad"),
    sparring_role: str = Form(""),
):
    """Live voice-sparring for a prepared SEXIER argumentation.

    Pipeline: Whisper STT → GPT-4o coach/counterparty reply → ElevenLabs TTS.
    prep_context is the JSON-serialised SEXIER prep data (goal, arguments,
    anticipated objections, hidden interests, coaching_focus) that grounds
    Wlad in the SPECIFIC scenario the user is training for.

    sparring_role selects a counterparty persona (cfo, board, customer, boss,
    team). When set, the persona's voice + attitude override the default Wlad
    voice — user hears a distinct sparring partner instead of just Wlad.
    """
    from routes.credits import check_and_deduct_credit
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json as _json

    user = await get_current_user(request)

    # Choose voice: sparring_role wins if valid, else fall back to persona (wlad).
    sparring_cfg = SPARRING_PERSONAS.get(sparring_role.lower()) if sparring_role else None
    if sparring_cfg:
        voice_config = {
            "voice_id": sparring_cfg["voice_id"],
            "stability": sparring_cfg["stability"],
            "similarity_boost": sparring_cfg["similarity_boost"],
            "style": sparring_cfg["style"],
        }
        persona_key = f"sparring_{sparring_role.lower()}"
    else:
        persona_key = persona.lower()
        voice_config = VOICE_REGISTRY.get(persona_key)
        if not voice_config:
            raise HTTPException(status_code=400, detail=f"Unknown persona '{persona_key}'")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio")

    # 1. Transcribe FIRST — no credit burn on empty/bad audio
    try:
        transcript = await _transcribe_webm(audio_bytes)
    except Exception as e:
        logger.error(f"Sparring STT failed: {e}")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    if not transcript:
        raise HTTPException(status_code=400, detail="empty_transcript")

    # 2. Deduct credit
    credit_result = await check_and_deduct_credit(user, "chat")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    # 3. Session + user turn
    session_id = await _ensure_voice_session(session_id, user["user_id"], transcript)
    await _persist_voice_turn(session_id, user["user_id"], "user", transcript)

    # 4. Parse prep context — build a compact grounding brief
    try:
        prep = _json.loads(prep_context) if prep_context else {}
    except Exception:
        prep = {}

    def _line(label: str, val: str | None) -> str:
        return f"- **{label}:** {val.strip()}" if val and val.strip() else ""

    brief_lines = [
        _line("Ziel des Users", prep.get("goal")),
        _line("Kontext/Hintergrund", prep.get("background")),
        _line("Gegenüber", prep.get("relationship")),
        _line("User-Kernargumente", prep.get("main_points")),
        _line("Antizipierte Einwände", prep.get("expected_objections")),
        _line("Verborgene Interessen der Gegenseite", prep.get("hidden_interests")),
        _line("Coaching-Fokus des Users", prep.get("coaching_focus")),
    ]
    grounding = "\n".join(l for l in brief_lines if l)

    # 5a. Fetch history + count user turns for escalation ladder (Iter 124.3)
    history = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1},
    ).sort("created_at", 1).to_list(20)
    user_turns = [m for m in history if m.get("role") == "user"]
    turn_no = len(user_turns) + 1  # this incoming turn included
    # Extract compact "what user has already tried" summary — keeps escalation
    # bounded even in long sessions. Just short-fragments, model reads them.
    tried_snippets = []
    for m in user_turns[-6:]:
        c = (m.get("content") or "").strip()
        if c:
            tried_snippets.append(c[:110] + ("…" if len(c) > 110 else ""))
    tried_block = ""
    if tried_snippets:
        tried_block = "\n".join(f"- {s}" for s in tried_snippets)

    # Escalation ladder — Wlad wird bewusst schwerer je länger die Session läuft.
    if turn_no <= 2:
        escalation = "STUFE 1: normale Skepsis. Ein klarer Einwand pro Turn."
    elif turn_no <= 4:
        escalation = (
            "STUFE 2: Werde härter. Bring einen zweiten Einwand direkt nach "
            "dem ersten. Zeige, dass die ersten Antworten nicht überzeugt haben."
        )
    elif turn_no <= 6:
        escalation = (
            "STUFE 3: Ruthless. Attackiere Schwachstellen aus früheren "
            "User-Antworten explizit ('vorhin sagtest du X — das widerspricht Y'). "
            "Zeit-Druck aufbauen ('ich habe gleich das nächste Meeting')."
        )
    else:
        escalation = (
            "STUFE 4 (Boss-Mode): Wenn der User eine gute Antwort liefert, "
            "gib EIN SATZ Coach-Feedback ('Der Turn war stark — du hast X endlich "
            "sauber geframed'), dann ein neuer, härterer Angriff. Wenn schwach, "
            "sag es direkt: 'Das reicht nicht — du wiederholst dich'."
        )

    # 5b. Compose system message: rules + role + prep + escalation + tried-list
    if sparring_cfg:
        system_msg = (
            SPARRING_SYSTEM_PROMPT
            + "\n\n--- ROLLE (SPRECHER JETZT) ---\n"
            + sparring_cfg["attitude"]
            + f"\nSprich als {sparring_cfg['label']}, NICHT als Wlad.\n---"
        )
    else:
        system_msg = SPARRING_SYSTEM_PROMPT
    if grounding:
        system_msg += f"\n\n--- SPARRING-KONTEXT ---\n{grounding}\n---"
    system_msg += (
        f"\n\n--- DIALOG-STATUS ---\nTurn: #{turn_no}\n{escalation}\n"
        + ("USER HAT BISHER PROBIERT (nicht wiederholen, greif konkret an):\n" + tried_block + "\n" if tried_block else "")
        + "---"
    )

    # 5c. Recent conversation for continuity — keep last 6 turns tight
    ctx_lines = []
    for m in history[-6:]:
        role = "User" if m.get("role") == "user" else "Wlad"
        ctx_lines.append(f"{role}: {m.get('content', '')}")
    ctx = "\n".join(ctx_lines)
    prompt = f"{ctx}\nUser: {transcript}\nWlad:" if ctx else transcript

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sparring_{session_id}",
            system_message=system_msg,
        )
        chat.with_model("openai", "gpt-4o")
        reply_text = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"Sparring LLM failed: {e}")
        if not credit_result.get("is_premium"):
            try:
                from routes.credits import refund_credit
                await refund_credit(user["user_id"])
            except Exception:
                pass
        raise HTTPException(status_code=502, detail=f"AI reply failed: {e}")

    reply_text = _cap_reply_length(reply_text)
    reply_text = _normalize_wlad_name(reply_text)
    transcript = _normalize_wlad_name(transcript)

    await _persist_voice_turn(session_id, user["user_id"], "assistant", reply_text)
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "mode": "sparring"}},
    )

    try:
        audio_b64 = await _synthesize_or_cached(reply_text, persona_key, voice_config)
        audio_url = f"data:audio/mpeg;base64,{audio_b64}"
    except HTTPException as e:
        logger.warning(f"Sparring TTS unavailable: {e.detail}")
        audio_url = ""

    try:
        await record_user_action(user["user_id"], "argumentation_sparring_turn", metadata={"session_id": session_id})
    except Exception:
        pass

    return {
        "session_id": session_id,
        "transcript": transcript,
        "response_text": reply_text,
        "audio_url": audio_url,
        "persona": persona_key,
        "turn_no": turn_no,
        "escalation_stage": (
            1 if turn_no <= 2 else 2 if turn_no <= 4 else 3 if turn_no <= 6 else 4
        ),
    }

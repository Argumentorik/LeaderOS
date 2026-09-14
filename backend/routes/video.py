"""Video challenge routes with Wlad Jachtchenko methodology feedback."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from pydantic import BaseModel, Field
import asyncio
import uuid
import os
import glob
import shutil
import tempfile
import subprocess
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user, get_user_memory, clean_ai_text
from services_actions import record_user_action
from services_tier import require_feature, resolve_user_tier
from services_video_trial import get_video_trial_status, consume_video_trial
from services_ai_errors import ai_http_error

router = APIRouter(prefix="/api", tags=["video"])


# ── Audio normalisation ────────────────────────────────────────────────────
# Browser MediaRecorder produces wildly different containers (Chrome → video/webm
# with Opus, Safari → video/mp4 with AAC, Firefox → different again). OpenAI's
# Whisper sometimes chokes on the raw containers — especially when the file has
# a video track or non-standard codec settings. Our defence is to ALWAYS pipe
# uploads through ffmpeg, strip the video, downsample to 16kHz mono MP3, and
# only then ship to Whisper. This makes the flow robust against every browser
# we care about and keeps payloads small (max ~25 MB Whisper limit).
def _ffmpeg_executable() -> str:
    """Return the path to a usable ffmpeg binary.

    Prefers the system ffmpeg (faster startup), falls back to the static binary
    bundled by `imageio-ffmpeg` (guarantees production has ffmpeg available even
    when the host image doesn't ship it).
    """
    system_ff = "ffmpeg"
    # Trust system ffmpeg if it's on PATH (subprocess.run will raise FileNotFoundError otherwise)
    try:
        r = subprocess.run([system_ff, "-version"], capture_output=True, timeout=5)
        if r.returncode == 0:
            return system_ff
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        raise RuntimeError(f"No ffmpeg binary available (tried PATH + imageio-ffmpeg): {e}")


def _ffmpeg_extract_audio(input_path: str, output_path: str, bitrate: str = "64k") -> None:
    """Strip video, downmix to mono 16 kHz MP3. Raises RuntimeError on failure."""
    cmd = [
        _ffmpeg_executable(), "-y", "-hide_banner", "-loglevel", "error",
        "-i", input_path,
        "-vn",                # drop video
        "-ac", "1",           # mono
        "-ar", "16000",       # 16 kHz (Whisper's native rate)
        "-c:a", "libmp3lame",
        "-b:a", bitrate,
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) < 200:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr[-300:]}")


# Whisper hard limit per single API call (OpenAI: 25 MB). We chunk anything
# larger into 10-min segments and join the transcripts — gives us effectively
# unlimited recording length (caps at ~500 MB raw upload below).
WHISPER_MAX_BYTES = 24 * 1024 * 1024  # leave 1 MB headroom for HTTP overhead

# Iter 141 (Code Review): Der asynchrone Pfad hält den Upload im RAM, solange die
# Analyse läuft. Darum harte Grenzen: Größe pro Upload und Anzahl paralleler Jobs.
ASYNC_MAX_UPLOAD_BYTES = 150 * 1024 * 1024
MAX_CONCURRENT_VIDEO_JOBS = 3
_ACTIVE_VIDEO_JOBS: set = set()
_PROCESS_STARTED_AT = datetime.now(timezone.utc).isoformat()


async def _refund_video_credit(user_id: str, credit_result: dict) -> None:
    """Iter 141 (Code Review): Wie im Chat — schlägt die Analyse fehl, bekommt
    der Nutzer seinen Credit zurück (Premium zahlt ohnehin nicht pro Analyse)."""
    if credit_result.get("is_premium"):
        return
    try:
        from routes.credits import refund_credit
        await refund_credit(user_id)
    except Exception as e:
        logger.warning("Video credit refund failed for %s: %s", user_id, e)


async def release_orphaned_video_jobs() -> int:
    """Iter 182: Analyse-Jobs leben im Prozess. Nach einem Neustart (Deploy, Hot-Reload)
    sind sie weg — der Datensatz stünde aber für immer auf 'queued', das Frontend pollt
    ins Leere und der Credit wäre verbrannt. Darum beim Start: als Fehler markieren
    und Credit zurückgeben."""
    stale = await db.video_jobs.find(
        {"status": {"$in": ["queued", "transcribing", "analyzing"]},
         "created_at": {"$lt": _PROCESS_STARTED_AT}},
        {"_id": 0, "job_id": 1, "user_id": 1, "is_premium": 1},
    ).to_list(500)
    for job in stale:
        await db.video_jobs.update_one({"job_id": job["job_id"]}, {"$set": {
            "status": "error",
            "error_code": 503,
            "error_detail": "Der Server wurde zwischendurch neu gestartet. Bitte die Analyse "
                            "erneut starten — dein Credit ist zurück auf dem Konto.",
        }})
        await _refund_video_credit(job["user_id"], {"is_premium": bool(job.get("is_premium"))})
    if stale:
        logger.warning("Video-Analysen nach Neustart freigegeben: %s", len(stale))
    return len(stale)


CHUNK_SECONDS = 600  # 10 minutes — well under 25 MB at 64 kbit/s mono


def _ffmpeg_split_into_chunks(input_path: str, chunk_dir: str, seconds: int = CHUNK_SECONDS) -> list[str]:
    """Split a normalised MP3 into N-second chunks. Returns sorted chunk paths."""
    pattern = os.path.join(chunk_dir, "chunk_%03d.mp3")
    cmd = [
        _ffmpeg_executable(), "-y", "-hide_banner", "-loglevel", "error",
        "-i", input_path,
        "-f", "segment",
        "-segment_time", str(seconds),
        "-c", "copy",          # no re-encode — already normalised MP3
        "-reset_timestamps", "1",
        pattern,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg segment failed: {result.stderr[-300:]}")
    chunks = sorted(glob.glob(os.path.join(chunk_dir, "chunk_*.mp3")))
    if not chunks:
        raise RuntimeError("ffmpeg segment produced no chunks")
    return chunks



def _build_rating_context(mode: str, level: str, focus: str, audience: str) -> str:
    """Build AI prompt modifier based on user's rating preferences."""
    parts = ["\n\nBEWERTUNGS-KONTEXT:"]

    if mode == "soft":
        parts.append("""BEWERTUNGSMODUS: ERMUTIGEND (Soft)
- Fokussiere auf Stärken und was gut gelaufen ist.
- Gib konstruktives Feedback in einem motivierenden, ermutigenden Ton.
- Bewerte wohlwollend — gib dem User das Gefühl, auf dem richtigen Weg zu sein.
- Scores sollten tendenziell 5-15 Punkte höher ausfallen als bei strenger Bewertung.
- Beginne IMMER mit dem Positiven. Formuliere Verbesserungen als 'Potenzial' statt 'Schwäche'.""")
    else:
        parts.append("""BEWERTUNGSMODUS: EHRLICH & DIREKT (Hard)
- Bewerte schonungslos ehrlich — wie ein erfahrener Executive Coach.
- Benenne Schwächen klar und direkt, ohne Beschönigung.
- Vergleiche gegen Top 1% der Führungskräfte als Benchmark.
- Scores müssen die tatsächliche Qualität widerspiegeln — keine Inflation.
- Sei direkt wie Wlad Jachtchenko in seinen Trainings: respektvoll aber ungeschönt.""")

    level_map = {
        "einsteiger": "ERFAHRUNGSLEVEL: EINSTEIGER — Bewerte für jemanden, der erst anfängt Führungsverantwortung zu übernehmen. Erkläre Frameworks. Gib Basics.",
        "fortgeschritten": "ERFAHRUNGSLEVEL: FORTGESCHRITTEN — Der User kennt die Grundlagen. Fokussiere auf Nuancen, Feinschliff und strategische Tiefe.",
        "executive": "ERFAHRUNGSLEVEL: EXECUTIVE — Bewerte auf C-Level-Niveau. Erwarte Souveränität, strategische Klarheit und Board-Ready Kommunikation.",
    }
    if level in level_map:
        parts.append(level_map[level])

    if focus:
        focus_items = [f.strip() for f in focus.split(",") if f.strip()]
        focus_labels = {
            "klarheit": "Klarheit & Präzision der Botschaft",
            "empathie": "Empathie & emotionale Intelligenz",
            "struktur": "Struktur & Aufbau der Argumentation",
            "ueberzeugungskraft": "Überzeugungskraft & Charisma",
        }
        if focus_items:
            named = [focus_labels.get(f, f) for f in focus_items]
            parts.append(f"FOKUS-BEREICHE: Bewerte besonders intensiv: {', '.join(named)}. Gib zu diesen Bereichen jeweils mindestens 2 Sätze detailliertes Feedback.")

    audience_map = {
        "team": "ZIELGRUPPE: TEAM — Die Rede richtet sich an das eigene Team. Bewerte Nahbarkeit, Motivation und Delegationskompetenz.",
        "board": "ZIELGRUPPE: BOARD/VORSTAND — Die Rede richtet sich an den Vorstand. Bewerte Executive Presence, Datenorientierung und strategische Klarheit.",
        "kunden": "ZIELGRUPPE: KUNDEN — Die Rede richtet sich an Kunden. Bewerte Überzeugungskraft, Nutzenargumentation und Vertrauensaufbau.",
        "investoren": "ZIELGRUPPE: INVESTOREN — Die Rede richtet sich an Investoren. Bewerte Vision, Zahlenorientierung und Storytelling.",
        "allgemein": "ZIELGRUPPE: ALLGEMEIN — Bewerte für eine breite Zielgruppe.",
    }
    if audience in audience_map:
        parts.append(audience_map[audience])

    return "\n".join(parts)


@router.get("/rating-preferences")
async def get_rating_preferences(request: Request):
    """Get the user's global rating preferences."""
    user = await get_current_user(request)
    prefs = user.get("rating_preferences", {
        "mode": "hard",
        "level": "fortgeschritten",
        "focus": [],
        "audience": "allgemein",
    })
    return prefs

VIDEO_ANALYSIS_PROMPT = """Du bist WLADBOT Video-Analyse-Engine, entwickelt von Wlad Jachtchenko -- Europas führendem Kommunikations- und Leadership-Coach.

DEIN PRIMÄRES FRAMEWORK -- WLADS SEXIER-MODELL (verbindliche Original-Definition):
Verwende SEXIER als HAUPT-Bewertungsmuster für die Argumentation des Sprechers.

S -- STATEMENT: Beginnt der Sprecher mit einer klaren These/Kernaussage? (kurzer, klarer Satz)
E -- EXPLANATION: Wird die Aussage tiefgehend begründet? (Warum ist die These richtig?)
X -- EXAMPLE: Gibt es ein konkretes Beispiel, das die Begründung untermauert?
I -- IMPACT: Wird die Relevanz gezeigt? (Was hat der Zuhörer davon? Welcher Einfluss?)
E -- EXPLANATION OF IMPACT: Wird begründet, WARUM dieser Einfluss/diese Relevanz wichtig ist?
R -- REBUTTAL: Wird der wichtigste Einwand des Gegenübers vorweggenommen und entkräftet?

JEDES SEXIER-FELD bekommt eine separate Bewertung von 1-10 + 1 konkrete Wlad-Übung.

UNTERSTÜTZENDE FRAMEWORKS (NUR wenn die Analyse-Tiefe es erfordert, NACH SEXIER):
- Die 3 Säulen der Überzeugung (Logos/Ethos/Pathos)
- Der Kommunikationsquadrant (Klarheit/Empathie/Struktur/Mut)
- Körpersprache-Indikatoren (Sprechgeschwindigkeit, Füllwörter, Pausen)
- Schwarze Rhetorik Check (Manipulationstechniken vermieden?)

ANALYSIS-STRUKTUR (verbindlich):
1. ZUERST: 3 Stärken (was gut war, jeweils mit SEXIER-Bezug)
2. DANN: 3 Verbesserungen (mit konkreter Wlad-Übung, jeweils mit SEXIER-Bezug)
3. DANACH: SEXIER-Scores — jedes der 6 Felder einzeln bewerten (0-100). Logos/Ethos/Pathos NICHT als eigene Scores ausgeben, höchstens als kurze Randnotiz im Text.

WICHTIG: Gib dein Feedback IMMER auf DEUTSCH. Sprich den User direkt an ("Du hast...", "Deine Stärke ist...").
Referenziere IMMER das SEXIER-Modell als Haupt-Framework.

SPRACH-POLICY (Iter 92.23.12 -- Mert verbindlich):
- Schreibe in einfacher, klarer Sprache, die JEDER versteht. Kein Business-Jargon, keine Anglizismen.
- VERMEIDE diese Phrasen und ersetze sie durch einfache deutsche Alternativen:
  * "Advisory Board" -> "Beirat"
  * "THE IDEAL LEADER" / "ideal leader" / "Mastering the X Roles" -> "Die wichtigsten Rollen einer Führungskraft" (oder Inhalt direkt benennen)
  * "Leadership Mastery" -> "Führungskompetenz" oder "echte Führungsstärke"
  * "Impact" -> "Wirkung" oder "Ergebnis"
  * "Mindset" -> "Haltung" oder "Denkweise"
  * "Performance" -> "Leistung"
  * "Engagement" -> "Beteiligung" oder "Einsatz"
  * "Best Practices" -> "bewährte Vorgehensweisen"
- Wenn ein englischer Fachbegriff zwingend nötig ist (z.B. "Pitch"), erkläre ihn einmal in Klammern.
- Kurze, klare Sätze. Lieber drei klare Sätze als ein langer mit Fremdwörtern.

Antworte NUR mit validem JSON. Kein extra Text."""


async def _transcribe_audio(file: UploadFile) -> str:
    """Transcribe uploaded media (audio or video) using OpenAI Whisper.

    Pipeline:
      1. Read upload (cap at 500 MB raw — covers ~60-90 min HD video uploads).
      2. ffmpeg-normalise to mono 16 kHz 64 kbit/s MP3 (typical 90%+ shrink).
      3. If normalised MP3 fits Whisper's 24 MB ceiling → single API call.
      4. Otherwise → re-encode at 32 kbit/s, segment into 10-min chunks,
         transcribe each chunk sequentially, join transcripts.

    This means a user can record a 60-min boardroom rehearsal locally and we
    still return a single transcript — Whisper's per-call 25 MB limit no
    longer caps recording length.
    """
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file received")
    # Raw upload cap: 500 MB. Anything bigger is almost certainly a misfire
    # (4K screen-recording etc.) — we ask the user to compress first.
    if len(contents) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413,
                            detail="Datei ist zu groß (>500 MB). Bitte komprimiere die Aufnahme.")

    # Pick a suffix based on what the browser told us (best-effort, only used
    # by ffmpeg as a hint — extraction works regardless).
    raw_suffix = ".webm"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext in {"webm", "mp4", "m4a", "mp3", "wav", "ogg", "mpga", "mpeg", "flac", "mov", "mkv", "aac"}:
            raw_suffix = f".{ext}"

    with tempfile.NamedTemporaryFile(suffix=raw_suffix, delete=False) as raw_tmp:
        raw_tmp.write(contents)
        raw_path = raw_tmp.name

    mp3_path: str | None = None
    chunk_dir: str | None = None
    try:
        # Stage 1: normalise to 64 kbit/s mono MP3
        mp3_path = raw_path.rsplit(".", 1)[0] + ".normalized.mp3"
        try:
            _ffmpeg_extract_audio(raw_path, mp3_path, bitrate="64k")
            audio_path = mp3_path
            mp3_size = os.path.getsize(mp3_path)
            logger.info("Whisper: ffmpeg-normalised %s → %s (%d bytes, raw=%d)",
                        raw_path, mp3_path, mp3_size, len(contents))
        except Exception as ff_err:
            logger.warning("ffmpeg unavailable / failed (%s) — falling back to raw upload", ff_err)
            audio_path = raw_path
            mp3_size = len(contents)

        # Stage 2: if still under Whisper limit, single-shot transcribe
        if mp3_size <= WHISPER_MAX_BYTES:
            return await _whisper_transcribe_single(stt, audio_path)

        # Stage 3: chunked path — re-encode at 32 kbit/s first to shrink further,
        # then segment into 10-min slices and transcribe sequentially.
        logger.info("Whisper: file %d bytes > %d → entering chunked transcription path",
                    mp3_size, WHISPER_MAX_BYTES)
        shrunk_path = raw_path.rsplit(".", 1)[0] + ".shrunk.mp3"
        _ffmpeg_extract_audio(raw_path, shrunk_path, bitrate="32k")
        if mp3_path and os.path.exists(mp3_path) and mp3_path != shrunk_path:
            try:
                os.unlink(mp3_path)
            except OSError:
                pass
        mp3_path = shrunk_path

        chunk_dir = tempfile.mkdtemp(prefix="whisper_chunks_")
        chunks = _ffmpeg_split_into_chunks(shrunk_path, chunk_dir, seconds=CHUNK_SECONDS)
        logger.info("Whisper: split into %d chunks for parallel transcription", len(chunks))

        # Pre-flight: ensure no chunk exceeds Whisper's limit (32 kbit/s × 10 min ≈ 2.4 MB,
        # so this is a safety belt only — practically unreachable).
        for idx, chunk_path in enumerate(chunks):
            if os.path.getsize(chunk_path) > WHISPER_MAX_BYTES:
                raise HTTPException(status_code=413,
                                    detail=f"Audio-Chunk {idx+1} ist auch nach Kompression noch zu groß. Bitte teile die Aufnahme manuell.")

        # Parallel Whisper calls — caps total wall time at the slowest chunk's latency
        # instead of summing them. 6 chunks × ~15s sequential → ~15s parallel.
        async def _safe_transcribe(idx: int, path: str) -> tuple[int, str]:
            try:
                text = await _whisper_transcribe_single(stt, path, allow_empty=True)
                return idx, text
            except HTTPException as he:
                if he.status_code == 422:
                    logger.info("Whisper: chunk %d silent, skipping", idx)
                    return idx, ""
                raise

        results = await asyncio.gather(
            *[_safe_transcribe(i, c) for i, c in enumerate(chunks)],
            return_exceptions=False,
        )
        # Preserve chunk order so the transcript reads chronologically
        results.sort(key=lambda x: x[0])
        joined = " ".join(t for _, t in results if t).strip()
        if not joined:
            raise HTTPException(status_code=422,
                                detail="Audio konnte nicht transkribiert werden — kein Sprachsignal erkannt.")
        return joined
    finally:
        if chunk_dir and os.path.isdir(chunk_dir):
            try:
                shutil.rmtree(chunk_dir, ignore_errors=True)
            except OSError:
                pass
        for p in (raw_path, mp3_path):
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


async def _whisper_transcribe_single(stt: OpenAISpeechToText, path: str, allow_empty: bool = False) -> str:
    """Send a single (<=24 MB) audio file to Whisper and return the transcript."""
    with open(path, "rb") as audio_file:
        response = await stt.transcribe(
            file=audio_file, model="whisper-1",
            response_format="json", language="de",
        )
    text = (getattr(response, "text", "") or "").strip()
    if not text and not allow_empty:
        raise HTTPException(status_code=422,
                            detail="Audio konnte nicht transkribiert werden — kein Sprachsignal erkannt.")
    return text


def _build_analysis_prompt(challenge: dict, transcript: str, prev_attempts: list, user_memory: str, rating_context: str) -> str:
    """Build the full analysis prompt for the AI model."""
    prev_context = ""
    if prev_attempts:
        prev_scores = [a.get("analysis", {}).get("overall_score", 0) for a in prev_attempts if a.get("analysis")]
        if prev_scores:
            prev_context = f"\nDer User hat diese Challenge bereits {len(prev_scores)}x gemacht. Letzte Scores: {prev_scores}. Gib Feedback ob sich der User verbessert hat."

    memory_context = f"\n\nUSER PROFIL:\n{user_memory}" if user_memory else ""

    return f"""Analysiere diese Leadership-Rede für die Mission: "{challenge['title']}" - {challenge['description']}
{prev_context}{memory_context}

TRANSKRIPT:
\"{transcript}\"

Bewerte DETAILLIERT anhand von Wlads Methodik. Antworte als JSON:
{{
  "overall_score": 0-100,
  "clarity_score": 0-100,
  "confidence_score": 0-100,
  "empathy_score": 0-100,
  "structure_score": 0-100,
  "sexier_scores": {{
    "statement": 0-100,
    "explanation": 0-100,
    "example": 0-100,
    "impact": 0-100,
    "impact_explanation": 0-100,
    "rebuttal": 0-100
  }},
  "logos_score": 0-100,
  "ethos_score": 0-100,
  "pathos_score": 0-100,
  "transcript": "das originale Transkript",
  "wlad_assessment": "3-4 Sätze persönliches Feedback im Stil von Wlad Jachtchenko.",
  "framework_feedback": {{
    "sexier": "Wlads SEXIER-Bewertung: Pro Buchstabe (S/E/X/I/E/R) 1 kurzer Satz mit konkretem Transkript-Bezug. Am Ende: 1 Wlad-Übung für das schwächste Feld.",
    "drei_saeulen": "Kurze Vertiefung (2-3 Sätze): Wie stehen Logos, Ethos, Pathos in dieser Rede? Nur als sekundäre Ergänzung zu SEXIER.",
    "kommunikationsquadrant": "Bewertung: Klarheit, Empathie, Struktur, Mut."
  }},
  "strengths": ["GENAU 3 Stärken — konkret mit Beispiel-Zitat aus dem Transkript", "Stärke 2 mit Zitat", "Stärke 3 mit Zitat"],
  "improvements": ["GENAU 3 Verbesserungen — jeweils mit konkreter Übung", "Verbesserung 2 mit Übung", "Verbesserung 3 mit Übung"],
  "speech_analysis": {{
    "filler_words": ["aehm", "also"],
    "filler_count": 0,
    "avg_sentence_length": "kurz/mittel/lang",
    "speech_pace": "zu schnell/gut/zu langsam",
    "key_phrases": ["starke Formulierung 1"]
  }},
  "rewrite_suggestion": "Überarbeitete Version der Rede (2-3 Absätze).",
  "practice_exercises": ["Übung 1", "Übung 2", "Übung 3"],
  "improvement_vs_previous": "Vergleich mit vorherigen Versuchen (falls vorhanden)",
  "deep_feedback_prompt": "Eine konkrete Frage, die der User dem WladBot-Chat stellen könnte, um tiefer in das Thema einzusteigen (z.B. 'Wie baue ich in mein nächstes Team-Meeting mehr Storytelling nach dem SEXIER-Modell ein?')."
}}

WICHTIG: strengths MUSS exakt 3 Einträge haben, improvements MUSS exakt 3 Einträge haben — keine 2, keine 4."""


def _get_rating_params(request, user):
    """Extract rating parameters from request query params with user preference fallback."""
    params = request.query_params
    global_prefs = user.get("rating_preferences", {})
    return {
        "mode": params.get("rating_mode") or global_prefs.get("mode", "hard"),
        "level": params.get("rating_level") or global_prefs.get("level", "fortgeschritten"),
        "focus": params.get("rating_focus") or ",".join(global_prefs.get("focus", [])),
        "audience": params.get("rating_audience") or global_prefs.get("audience", "allgemein"),
    }


@router.get("/video-challenges")
async def get_video_challenges():
    from data import VIDEO_CHALLENGES
    return VIDEO_CHALLENGES


async def _classify_video_transcript(transcript: str) -> str:
    """Classification bot: 'speech' (practice delivery) vs 'theory_question'.

    Short recordings that are actually knowledge questions ("Was sind die 10
    Stufen des Zuhörens?") must NOT get speech feedback — they get an answer.
    """
    if len(transcript.split()) > 130:
        return "speech"
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"vidcls_{uuid.uuid4().hex[:6]}",
            system_message=(
                "Klassifiziere das Transkript einer Video-Aufnahme in EXAKT eine Kategorie:\n"
                "- speech: Der Sprecher hält eine Rede, übt einen Pitch, beantwortet eine Übungsaufgabe, "
                "präsentiert oder spricht zu einem Publikum.\n"
                "- theory_question: Der Sprecher stellt eine Wissens-/Theoriefrage oder bittet um eine Erklärung "
                "(z.B. 'Was sind die 10 Stufen des Zuhörens?', 'Erklär mir das SEXIER-Modell', 'Wie funktioniert Framing?').\n"
                'Antworte NUR mit JSON: {"type": "speech"} oder {"type": "theory_question"}'
            ),
        )
        chat.with_model("openai", "gpt-4o-mini")
        raw = await chat.send_message(UserMessage(text=transcript[:800]))
        from services_ai_parse import parse_ai_json
        parsed = parse_ai_json(raw) or {}
        t = parsed.get("type", "speech")
        return t if t in ("speech", "theory_question") else "speech"
    except Exception as e:
        logger.warning(f"Video transcript classification failed, defaulting to speech: {e}")
        return "speech"


async def _answer_theory_question(transcript: str) -> dict:
    """RAG-grounded Wlad answer for a theory question spoken into the camera."""
    rag_block = ""
    try:
        from services_rag import retrieve_context
        rag_ctx = await retrieve_context(transcript[:400])
        if rag_ctx.get("rag_active"):
            rag_block = "\n\n" + rag_ctx["context_block"]
    except Exception as e:
        logger.warning(f"Theory-answer RAG fetch failed (proceeding without): {e}")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vidqa_{uuid.uuid4().hex[:8]}",
        system_message=(
            "Du bist WladBot — Wlad Jachtchenkos digitaler Zwilling und Leadership-Experte. "
            "Der User hat dir per Video eine Wissens-Frage gestellt. Beantworte sie klar, strukturiert und "
            "im Stil von Wlad: direkt, praxisnah, mit nummerierten Listen wo sinnvoll. Deutsch. Max 300 Wörter. "
            "Kein Rede-Feedback, keine Bewertung — nur die inhaltliche Antwort." + rag_block
        ),
    )
    chat.with_model("openai", "gpt-5.2")
    answer = await chat.send_message(UserMessage(text=transcript))
    return {
        "type": "theory_answer",
        "question": transcript,
        "answer": clean_ai_text(answer),
        "transcript": transcript,
    }



async def _run_video_ai_analysis(challenge: dict, transcript: str, prev_attempts: list, user_memory, rating_context: str) -> dict:
    """Call GPT-5.2 to analyse transcript and return structured feedback.

    Defensive contract: NEVER returns a stub-score-50-feedback document.
    If the AI's JSON is malformed, we retry once with a strict reformat prompt.
    If retry also fails, raise — the caller will surface a clean 500 to the UI
    which then prompts the user to retry. Better than persisting junk.

    RAG (Iter 92.6): the user's transcript + challenge topic is used to pull
    the top-matching Wlad-Korpus chunks so the AI grounds its feedback in
    Wlad's actual frameworks (3 Säulen, Kommunikationsquadrant, etc.) rather
    than generic coaching language.
    """
    # Classification bot: theory questions get an answer, not speech feedback.
    if await _classify_video_transcript(transcript) == "theory_question":
        logger.info("Video transcript classified as theory_question — returning Wlad answer")
        return await _answer_theory_question(transcript)

    prompt_text = _build_analysis_prompt(challenge, transcript, prev_attempts, user_memory, rating_context)

    # Pull Wlad-specific RAG context. Best-effort — falls back to base prompt
    # if retrieval fails.
    rag_block = ""
    try:
        from services_rag import retrieve_context
        rag_query = f"{challenge.get('title', '')} {challenge.get('focus', '')} {transcript[:500]}"
        rag_ctx = await retrieve_context(rag_query)
        if rag_ctx.get("rag_active"):
            rag_block = "\n\n" + rag_ctx["context_block"]
            logger.info("Video analysis RAG: %d chunks injected", rag_ctx["chunks_count"])
    except Exception as e:
        logger.warning(f"Video RAG fetch failed (proceeding without): {e}")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vid_{uuid.uuid4().hex[:8]}",
        system_message=VIDEO_ANALYSIS_PROMPT + rating_context + rag_block + (f"\n\nUSER PROFIL:\n{user_memory}" if user_memory else ""),
    )
    chat.with_model("openai", "gpt-5.2")

    ai_response = await chat.send_message(UserMessage(text=prompt_text))

    # Try parse; if it fails, ask the AI to reformat itself.
    from services_ai_parse import parse_ai_json
    analysis = parse_ai_json(ai_response)
    if analysis is None:
        logger.warning("Video AI returned non-JSON, attempting reformat retry")
        reformat = await chat.send_message(UserMessage(text=(
            "Deine letzte Antwort war kein gültiges JSON. Antworte JETZT ausschließlich mit dem oben "
            "spezifizierten JSON-Schema. Keine Markdown-Codefences, kein Vorwort, nur das JSON-Objekt."
        )))
        analysis = parse_ai_json(reformat)

    if analysis is None or not isinstance(analysis.get("overall_score"), (int, float)):
        # Final safety net — never persist junk, never silently score 50.
        # Raise a clear error so the user gets retried-prompt UI instead of bad data.
        raise ValueError("AI analysis failed to return structured feedback. Please retry.")

    # Ensure transcript is preserved even if AI omitted it
    analysis["transcript"] = analysis.get("transcript") or transcript

    # Iter 92.22 (Mert): guarantee exactly 3 strengths + 3 improvements.
    # Some LLM calls return 2 or 4 — pad with sensible defaults or truncate
    # so the UI can render "3 Stärken / 3 Verbesserungen" reliably.
    def _ensure_three(items: list, fallback: list) -> list:
        items = [s.strip() for s in (items or []) if isinstance(s, str) and s.strip()]
        if len(items) >= 3:
            return items[:3]
        # Pad from fallback if AI returned too few
        for f in fallback:
            if len(items) >= 3:
                break
            if f not in items:
                items.append(f)
        return items[:3]

    analysis["strengths"] = _ensure_three(analysis.get("strengths"), [
        "Erkennbare Struktur in der Rede",
        "Klarer Einstieg in das Thema",
        "Argument-Aufbau gut nachvollziehbar",
    ])
    analysis["improvements"] = _ensure_three(analysis.get("improvements"), [
        "Mehr konkrete Beispiele einbauen (Pathos-Hebel)",
        "Kürzere Sätze für bessere Verständlichkeit",
        "Pausen bewusster setzen für mehr Wirkung",
    ])

    # Provide a default deep-dive prompt if the LLM omitted it — used by the
    # "Tiefer im Chat besprechen" CTA in the analysis result UI.
    if not analysis.get("deep_feedback_prompt"):
        analysis["deep_feedback_prompt"] = (
            f"Ich habe gerade die Mission '{challenge.get('title', '')}' gemacht "
            f"(Score: {analysis.get('overall_score')}/100). Hilf mir gezielt an den Verbesserungen zu arbeiten."
        )
    return analysis


def _safe_parse_json(text: str) -> dict | None:
    """DEPRECATED: use services_ai_parse.parse_ai_json instead. Kept for back-compat."""
    from services_ai_parse import parse_ai_json
    return parse_ai_json(text)


async def _persist_video_analysis(user_id: str, challenge_id: str, analysis: dict, rating: dict, attempt_count: int) -> str:
    """Save video analysis entry + trigger XP/action recording. Returns entry_id."""
    entry_id = f"vid_{uuid.uuid4().hex[:12]}"
    is_theory = analysis.get("type") == "theory_answer"
    await db.video_challenges.insert_one({
        "entry_id": entry_id,
        "user_id": user_id,
        "challenge_id": challenge_id,
        "custom_title": (f"Frage: {analysis.get('question', '')[:60]}" if is_theory else None),
        "analysis": analysis,
        "rating_context": rating,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Attach entry_id back onto the analysis dict so the UI can offer a
    # share-link CTA without an extra round-trip to find the record.
    analysis["entry_id"] = entry_id
    if is_theory:
        return entry_id  # knowledge answers don't earn mission XP
    overall = analysis.get("overall_score", 0)
    await record_user_action(
        user_id,
        "video_challenge_completed",
        comm_bonus=max(1, overall // 25),
        leadership_bonus=max(1, overall // 33),
        eq_bonus=max(1, analysis.get("empathy_score", 0) // 33),
        metadata={"challenge_id": challenge_id, "score": overall, "attempt": attempt_count},
    )
    return entry_id


@router.get("/user/video-trial-status")
async def get_user_video_trial_status(request: Request):
    user = await get_current_user(request)
    tier_info = await resolve_user_tier(user)
    return await get_video_trial_status(user, tier_info["tier"])


@router.get("/video-archive")
async def get_video_archive(request: Request):
    """Return ALL of the current user's video-challenge attempts, newest first.

    Used by the in-app Video-Archive page. Nothing is ever deleted — full history
    so the user can review every analysis, every rewrite, every score.
    """
    user = await get_current_user(request)
    docs = await db.video_challenges.find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)
    return docs


class RenameVideoEntryIn(BaseModel):
    title: str = Field(..., max_length=200)


@router.patch("/video-archive/{entry_id}")
async def rename_video_entry(entry_id: str, payload: RenameVideoEntryIn, request: Request):
    """Rename a video-mission entry. Owner-only. Used by the Studio View sidebar."""
    user = await get_current_user(request)
    title = (payload.title or "").strip()[:160]
    if not title:
        raise HTTPException(status_code=400, detail="Titel darf nicht leer sein")
    result = await db.video_challenges.update_one(
        {"entry_id": entry_id, "user_id": user["user_id"]},
        {"$set": {"custom_title": title}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mission-Eintrag nicht gefunden")
    return {"entry_id": entry_id, "custom_title": title}


@router.delete("/video-archive/{entry_id}")
async def delete_video_entry(entry_id: str, request: Request):
    """Delete a single video-mission attempt. Owner-only.

    Also cleans up any associated mission_share entries so the public landing
    page no longer 410s a dangling slug.
    """
    user = await get_current_user(request)
    result = await db.video_challenges.delete_one(
        {"entry_id": entry_id, "user_id": user["user_id"]},
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mission-Eintrag nicht gefunden")
    # Best-effort cleanup of share-slug.
    await db.mission_shares.delete_many({"entry_id": entry_id, "user_id": user["user_id"]})
    return {"deleted": True}


# ── Shared Mission Replay Links (Iter 92.23) ──────────────────────────────
# Mert wants users to share their best video analyses as public landing pages.
# Use case: "Look — I scored 88/100 on the Boardroom challenge in WladBot!"
# Drives conversion via authentic social proof + opt-in only.

class ShareMissionIn(BaseModel):
    entry_id: str


@router.post("/missions/share")
async def create_mission_share(payload: ShareMissionIn, request: Request):
    """Generate a public share-token for one of the user's mission analyses.

    Returns a short, unguessable slug. The user can copy/share the resulting
    URL. Anyone with the URL can view the analysis without auth — but
    nothing private (name optional, transcript opt-in shown only as excerpt).
    """
    user = await get_current_user(request)
    doc = await db.video_challenges.find_one(
        {"entry_id": payload.entry_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Mission entry not found")

    # Re-use existing share-token if already public — idempotent.
    existing = await db.mission_shares.find_one(
        {"entry_id": payload.entry_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if existing:
        return {"share_slug": existing["share_slug"], "share_url": f"/m/{existing['share_slug']}"}

    slug = uuid.uuid4().hex[:10]
    await db.mission_shares.insert_one({
        "share_slug": slug,
        "entry_id": payload.entry_id,
        "user_id": user["user_id"],
        "challenge_id": doc.get("challenge_id"),
        "user_name": user.get("name", "Leader"),
        "user_picture": user.get("picture"),
        "user_tier": user.get("tier", "free"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "view_count": 0,
    })
    return {"share_slug": slug, "share_url": f"/m/{slug}"}


@router.get("/missions/share/{slug}")
async def get_shared_mission(slug: str):
    """PUBLIC endpoint — anyone with the slug can view the analysis.

    Returns the minimum needed for the showcase landing page: scores +
    summary, no full transcript by default. Counts views for the owner.
    """
    share = await db.mission_shares.find_one({"share_slug": slug}, {"_id": 0})
    if not share:
        raise HTTPException(status_code=404, detail="Shared mission not found")
    doc = await db.video_challenges.find_one(
        {"entry_id": share["entry_id"]},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=410, detail="Original mission deleted")

    # Increment view counter — best-effort.
    await db.mission_shares.update_one({"share_slug": slug}, {"$inc": {"view_count": 1}})

    from data import VIDEO_CHALLENGES
    challenge = next((c for c in VIDEO_CHALLENGES if c["challenge_id"] == share["challenge_id"]), None)
    analysis = doc.get("analysis", {})
    return {
        "share_slug": slug,
        "user_name": share.get("user_name", "Leader"),
        "user_picture": share.get("user_picture"),
        "challenge_title": (challenge or {}).get("title", "Leadership Mission"),
        "challenge_description": (challenge or {}).get("description", ""),
        "challenge_difficulty": (challenge or {}).get("difficulty", "mittel"),
        "overall_score": analysis.get("overall_score"),
        "clarity_score": analysis.get("clarity_score"),
        "confidence_score": analysis.get("confidence_score"),
        "empathy_score": analysis.get("empathy_score"),
        "structure_score": analysis.get("structure_score"),
        "sexier_scores": analysis.get("sexier_scores"),
        # Legacy fields — only present on entries analysed before the SEXIER switch
        "logos_score": analysis.get("logos_score"),
        "ethos_score": analysis.get("ethos_score"),
        "pathos_score": analysis.get("pathos_score"),
        "wlad_assessment": analysis.get("wlad_assessment"),
        "strengths": (analysis.get("strengths") or [])[:3],
        "improvements": (analysis.get("improvements") or [])[:3],
        # Transcript excerpt only (first 200 chars) — avoid full PII exposure.
        "transcript_excerpt": (analysis.get("transcript") or "")[:200],
        "created_at": doc.get("created_at"),
        "view_count": share.get("view_count", 0) + 1,
    }


@router.delete("/missions/share/{slug}")
async def delete_mission_share(slug: str, request: Request):
    """Revoke a previously-shared mission link. Owner-only."""
    user = await get_current_user(request)
    result = await db.mission_shares.delete_one(
        {"share_slug": slug, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Share not found or not owned by you")
    return {"deleted": True}


@router.post("/video-challenges/{challenge_id}/analyze")
async def analyze_video_challenge(challenge_id: str, request: Request, file: UploadFile = File(...)):
    from data import VIDEO_CHALLENGES
    from routes.credits import check_and_deduct_credit
    user = await get_current_user(request)

    # Trial-first: Free + Starter + Standard get 3 free analyses in their first 14 days.
    # Accelerator skips the trial entirely (require_feature returns immediately).
    tier_info = await resolve_user_tier(user)
    trial = await get_video_trial_status(user, tier_info["tier"])
    used_trial_slot = False
    if trial["active"]:
        # Inside trial window with quota remaining → bypass require_feature, consume slot.
        await consume_video_trial(user["user_id"])
        used_trial_slot = True
    else:
        # Either Accelerator (passes) or trial-ineligible/expired (raises 402 with upgrade detail).
        await require_feature(user, "video_analysis")

    credit_result = await check_and_deduct_credit(user, "video_mission")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    challenge = next((c for c in VIDEO_CHALLENGES if c["challenge_id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    rating = _get_rating_params(request, user)
    rating_context = _build_rating_context(rating["mode"], rating["level"], rating["focus"], rating["audience"])
    user_memory = await get_user_memory(user["user_id"])
    prev_attempts = await db.video_challenges.find(
        {"user_id": user["user_id"], "challenge_id": challenge_id},
        {"_id": 0, "analysis.overall_score": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(5)

    try:
        transcript = await _transcribe_audio(file)
        analysis = await _run_video_ai_analysis(challenge, transcript, prev_attempts, user_memory, rating_context)
        await _persist_video_analysis(user["user_id"], challenge_id, analysis, rating, len(prev_attempts) + 1)
        # Attach trial metadata for the UI banner (X / 3 remaining etc.)
        if used_trial_slot:
            analysis["_trial"] = await get_video_trial_status(
                await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0}) or user,
                tier_info["tier"],
            )
        return analysis
    except HTTPException:
        # Preserve 4xx codes coming from _transcribe_audio (400 empty / 413 too big / 422 silent)
        await _refund_video_credit(user["user_id"], credit_result)
        raise
    except Exception as e:
        await _refund_video_credit(user["user_id"], credit_result)
        logger.exception("Video challenge error for user=%s challenge=%s", user.get("user_id"), challenge_id)
        # Surface a friendlier message — most failures are Whisper container quirks.
        detail = str(e)
        if "Invalid file format" in detail or "litellm" in detail.lower():
            detail = "Audio-Format wurde von Whisper abgelehnt. Bitte erneut aufnehmen (Chrome empfohlen) oder ein anderes Mikrofon verwenden."
        raise HTTPException(status_code=500, detail=detail)


# ── Async Job Pattern (Iter 92.20) ─────────────────────────────────────────
# The synchronous /analyze endpoint above hits Cloudflare/ingress edge timeouts
# (~30s) when Whisper + GPT-5.2 + RAG run end-to-end on longer audio. The async
# variant below:
#
#   POST /api/video-challenges/{id}/analyze-async   → 202 + {job_id}
#   GET  /api/video-challenges/jobs/{job_id}        → status + analysis when ready
#
# Background task processes audio without holding the HTTP connection open.
# Frontend polls every 2-3s. Works for any audio length the upload survives
# (capped at 500 MB raw / WHISPER_MAX_BYTES per chunk after normalisation).

async def _video_analyze_background(
    job_id: str,
    user_id: str,
    challenge: dict,
    file_bytes: bytes,
    file_name: str,
    rating: dict,
    rating_context: str,
    user_memory,
    prev_attempts: list,
    used_trial_slot: bool,
    tier: str,
    credit_result: dict,
) -> None:
    """Background worker: transcribe → analyse → persist → mark job complete."""
    try:
        await db.video_jobs.update_one({"job_id": job_id}, {"$set": {"status": "transcribing"}})

        # Iter 140: Der Upload bleibt im Speicher — kein Pod-lokales File mehr
        # (auf dem Deployment wäre es für andere Instanzen nicht erreichbar).
        class _MemUpload:
            filename = file_name
            async def read(self) -> bytes:
                return file_bytes

        transcript = await _transcribe_audio(_MemUpload())  # type: ignore[arg-type]
        await db.video_jobs.update_one({"job_id": job_id}, {"$set": {"status": "analyzing", "transcript_preview": transcript[:120]}})

        analysis = await _run_video_ai_analysis(challenge, transcript, prev_attempts, user_memory, rating_context)
        await _persist_video_analysis(user_id, challenge["challenge_id"], analysis, rating, len(prev_attempts) + 1)

        if used_trial_slot:
            u = await db.users.find_one({"user_id": user_id}, {"_id": 0}) or {"user_id": user_id}
            analysis["_trial"] = await get_video_trial_status(u, tier)

        await db.video_jobs.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": "complete",
                "analysis": analysis,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        logger.info("Video job %s complete (user=%s, score=%s)", job_id, user_id, analysis.get("overall_score"))
    except HTTPException as he:
        await db.video_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "error", "error_code": he.status_code, "error_detail": str(he.detail)}},
        )
        await _refund_video_credit(user_id, credit_result)
        logger.warning("Video job %s failed (HTTP %s): %s", job_id, he.status_code, he.detail)
    except Exception as e:
        await db.video_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "error", "error_code": 500, "error_detail": str(e)[:300]}},
        )
        await _refund_video_credit(user_id, credit_result)
        logger.exception("Video job %s crashed", job_id)


@router.post("/video-challenges/{challenge_id}/analyze-async", status_code=202)
async def analyze_video_challenge_async(challenge_id: str, request: Request, file: UploadFile = File(...)):
    """Start a video-analysis job and return immediately with a job_id.

    Frontend polls /api/video-challenges/jobs/{job_id} until status == 'complete'
    (or 'error'). This avoids the Cloudflare/ingress 30s edge timeout for any
    audio length and gives us room to show real progress states in the UI.
    """
    from data import VIDEO_CHALLENGES
    from routes.credits import check_and_deduct_credit
    user = await get_current_user(request)

    tier_info = await resolve_user_tier(user)
    trial = await get_video_trial_status(user, tier_info["tier"])
    if not trial["active"]:
        await require_feature(user, "video_analysis")

    challenge = next((c for c in VIDEO_CHALLENGES if c["challenge_id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Iter 181 (Code Review, HIGH): ZUERST prüfen, DANN abbuchen. Vorher verlor ein Kunde
    # Credit und Trial-Slot, wenn die Datei zu groß war oder gerade zu viele Analysen liefen.
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file received")
    if len(contents) > ASYNC_MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Aufnahme ist zu groß (>{ASYNC_MAX_UPLOAD_BYTES // (1024 * 1024)} MB). "
                   "Bitte kürzer aufnehmen oder komprimieren.",
        )
    if len(_ACTIVE_VIDEO_JOBS) >= MAX_CONCURRENT_VIDEO_JOBS:
        raise HTTPException(
            status_code=429,
            detail="Gerade werden mehrere Analysen berechnet. Bitte in 1-2 Minuten erneut starten.",
        )

    used_trial_slot = False
    if trial["active"]:
        await consume_video_trial(user["user_id"])
        used_trial_slot = True

    credit_result = await check_and_deduct_credit(user, "video_mission")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    rating = _get_rating_params(request, user)
    rating_context = _build_rating_context(rating["mode"], rating["level"], rating["focus"], rating["audience"])
    user_memory = await get_user_memory(user["user_id"])
    prev_attempts = await db.video_challenges.find(
        {"user_id": user["user_id"], "challenge_id": challenge_id},
        {"_id": 0, "analysis.overall_score": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(5)

    suffix = ".webm"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext in {"webm", "mp4", "m4a", "mp3", "wav", "ogg", "mpga", "mpeg", "flac", "mov", "mkv", "aac"}:
            suffix = f".{ext}"
    job_id = f"vidjob_{uuid.uuid4().hex[:14]}"

    await db.video_jobs.insert_one({
        "job_id": job_id,
        "user_id": user["user_id"],
        "challenge_id": challenge_id,
        "status": "queued",
        "file_size": len(contents),
        "is_premium": bool(credit_result.get("is_premium")),
        "used_trial_slot": used_trial_slot,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Referenz halten (RUF006): sonst kann der Task vom GC verworfen werden.
    task = asyncio.create_task(_video_analyze_background(
        job_id=job_id,
        user_id=user["user_id"],
        challenge=challenge,
        file_bytes=contents,
        file_name=file.filename or f"upload{suffix}",
        rating=rating,
        rating_context=rating_context,
        user_memory=user_memory,
        prev_attempts=prev_attempts,
        used_trial_slot=used_trial_slot,
        tier=tier_info["tier"],
        credit_result=credit_result,
    ))
    _ACTIVE_VIDEO_JOBS.add(task)
    task.add_done_callback(_ACTIVE_VIDEO_JOBS.discard)

    return {"job_id": job_id, "status": "queued"}


@router.get("/video-challenges/jobs/{job_id}")
async def get_video_job(job_id: str, request: Request):
    """Poll endpoint: returns current job status and (when ready) the analysis."""
    user = await get_current_user(request)
    job = await db.video_jobs.find_one({"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/voice/transcribe")
async def transcribe_voice(request: Request, file: UploadFile = File(...)):
    """Public transcription endpoint for the chat voice input.

    Reuses the same ffmpeg-normalised pipeline as the video missions flow so
    Safari / Chrome / Firefox containers all work the same way.

    Iter 121 (User feedback): returns extra metadata so the client can:
      - normalise mis-heard Wlad-Framework references (e.g. "sexier" →
        SEXIER-Argumentation) as chip suggestions;
      - warn the user "Bitte deutlicher sprechen" when the recording is
        too short / mostly fillers.
    """
    await get_current_user(request)
    try:
        text = await _transcribe_audio(file)
        from voice_framework_map import enrich_transcript
        return enrich_transcript(text)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise await ai_http_error(e, "video_transcribe")

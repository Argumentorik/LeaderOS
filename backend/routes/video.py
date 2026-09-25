"""Video challenge routes with Wlad Jachtchenko methodology feedback."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import uuid
import json
import os
import re
import tempfile
import subprocess
from datetime import datetime, timezone
# Migration → lib.llm_provider (bit-identische API, Provider per ENV).
from lib.llm_provider import LlmChat, UserMessage
from lib.llm_provider import OpenAISpeechToText

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user, update_user_scores, get_user_memory, WLAD_HARD_RULES
from services_actions import record_user_action
from services_tier import require_feature, resolve_user_tier
from services_video_trial import get_video_trial_status, consume_video_trial

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


def _ffmpeg_extract_audio(input_path: str, output_path: str) -> None:
    """Strip video, downmix to mono 16 kHz MP3. Raises RuntimeError on failure."""
    cmd = [
        _ffmpeg_executable(), "-y", "-hide_banner", "-loglevel", "error",
        "-i", input_path,
        "-vn",                # drop video
        "-ac", "1",           # mono
        "-ar", "16000",       # 16 kHz (Whisper's native rate)
        "-c:a", "libmp3lame",
        "-b:a", "64k",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) < 200:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr[-300:]}")



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

DEINE ANALYSE-FRAMEWORKS (basierend auf Wlads Methodik):

1. DIE 3 SAEULEN DER UEBERZEUGUNG (Aristoteles via Wlad):
   - LOGOS: Logik, Daten, Struktur der Argumentation
   - ETHOS: Glaubwürdigkeit, Autoritaet, Souveränität
   - PATHOS: Emotionale Wirkung, Storytelling, Engagement

2. DER KOMMUNIKATIONSQUADRANT:
   - Klarheit: Ist die Botschaft präzise und unmissverständlich?
   - Empathie: Zeigt der Sprecher Verständnis für das Publikum?
   - Struktur: Gibt es eine klare Einleitung, Hauptteil, Schluss?
   - Mut: Werden schwierige Wahrheiten angesprochen?

3. KOERPERSPRACHE-INDIKATOREN (aus Transkript-Tonfall):
   - Sprechgeschwindigkeit und Pausen
   - Fuellwoerter und Unsicherheitsmarker
   - Satzlaenge und Komplexität

4. SCHWARZE RHETORIK CHECK:
   - Werden Manipulationstechniken vermieden?
   - Ist die Kommunikation authentisch und ehrlich?

WICHTIG: Gib dein Feedback IMMER auf DEUTSCH. Sprich den User direkt an ("Du hast...", "Deine Stärke ist...").
Referenziere IMMER ein spezifisches Wlad-Framework in deinem Feedback.

Antworte NUR mit validem JSON. Kein extra Text.""" + WLAD_HARD_RULES


# Whisper erfindet bei stillem oder fast stillem Audio Abspann-Texte aus
# seinen Trainingsdaten („Untertitel der Amara.org-Community", „Untertitel im
# Auftrag des ZDF", „Vielen Dank fürs Zuschauen"). Das ist nicht leer, rutschte
# also durch `if not text` — und die Analyse bewertete dann den Prompt statt
# einer Rede. Diese Phrasen sind nie echte Nutzersprache.
_WHISPER_PHANTOMS = (
    "amara.org",
    "untertitel im auftrag",
    "untertitelung aufgrund",
    "untertitel von",
    "untertitel der",
    "vielen dank fürs zuschauen",
    "danke fürs zuschauen",
    "copyright wdr",
)


def _speech_problem(text: str, min_words: int = 0) -> str | None:
    """Grund, warum `text` keine verwertbare Rede ist — oder None.

    min_words=0 für Sprachbefehle im Chat (auch „Ja" ist legitim), > 0 für
    Video-Missionen, deren kürzeste Mission 30 Sekunden dauert.
    """
    norm = " ".join((text or "").lower().split())
    words = [w for w in norm.replace(".", " ").replace(",", " ").split() if any(c.isalnum() for c in w)]
    if any(p in norm for p in _WHISPER_PHANTOMS) and len(words) < 20:
        return ("In deiner Aufnahme war keine Sprache zu hören — nur Stille. Prüfe, ob das richtige "
                "Mikrofon ausgewählt und freigegeben ist, und nimm noch einmal auf.")
    if min_words and len(words) < min_words:
        return (f"Die Aufnahme enthält zu wenig Sprache für eine Analyse ({len(words)} Wörter). "
                "Sprich mindestens 30 Sekunden am Stück und nimm noch einmal auf. Dieser Versuch kostet nichts.")
    return None


async def _transcribe_audio(file: UploadFile) -> str:
    """Transcribe uploaded media (audio or video) using OpenAI Whisper.

    Pipeline: write upload to /tmp → ffmpeg-extract MP3 audio → send to Whisper.
    Robust against browser-specific container quirks (Chrome video/webm,
    Safari video/mp4, Firefox mixed). Falls back to raw upload if ffmpeg
    isn't on PATH (development containers).
    """
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file received")
    # Raw upload limit: 150 MB. A typical 5-min video upload is 30-80 MB; capping
    # at 150 leaves headroom for HD clips while protecting the pod from
    # multi-gigabyte uploads. The 25 MB Whisper limit is enforced AFTER ffmpeg
    # has extracted audio-only (audio is ~10x smaller than video), so a 100 MB
    # video upload still works as long as its audio track fits the Whisper API.
    # Before this change we rejected every >25 MB raw upload upfront, blocking
    # most actual user recordings on the video-challenge surface.
    MAX_RAW_UPLOAD_BYTES = 150 * 1024 * 1024
    if len(contents) > MAX_RAW_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß ({len(contents) // (1024*1024)} MB). Max 150 MB — bitte kürzer aufnehmen oder die Auflösung reduzieren.",
        )

    # Pick a suffix based on what the browser told us (best-effort, only used
    # by ffmpeg as a hint — extraction works regardless).
    raw_suffix = ".webm"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext in {"webm", "mp4", "m4a", "mp3", "wav", "ogg", "mpga", "mpeg", "flac"}:
            raw_suffix = f".{ext}"

    with tempfile.NamedTemporaryFile(suffix=raw_suffix, delete=False) as raw_tmp:
        raw_tmp.write(contents)
        raw_path = raw_tmp.name

    # Try ffmpeg-normalise to MP3 first. If ffmpeg isn't available or fails on
    # this specific file, fall back to the raw upload (Whisper used to accept
    # most webm/mp4 directly).
    mp3_path: str | None = None
    try:
        mp3_path = raw_path.rsplit(".", 1)[0] + ".normalized.mp3"
        _ffmpeg_extract_audio(raw_path, mp3_path)
        audio_path = mp3_path
        logger.info("Whisper: ffmpeg-normalised %s → %s (%d bytes)",
                    raw_path, mp3_path, os.path.getsize(mp3_path))
    except Exception as ff_err:
        logger.warning("ffmpeg unavailable / failed (%s) — falling back to raw upload", ff_err)
        audio_path = raw_path

    # Whisper API enforces a 25 MB per-file cap. Audio-only MP3 at 64 kbps mono
    # is ~480 KB/min, so 25 MB ≈ ~52 minutes of speech — comfortably above any
    # realistic video-challenge recording. If the extracted audio still exceeds
    # the cap (very long recording or ffmpeg failed and we're sending the raw
    # video), reject with a clear message instead of letting Whisper return an
    # opaque 4xx.
    audio_size = os.path.getsize(audio_path)
    if audio_size > 25 * 1024 * 1024:
        for p in (raw_path, mp3_path):
            if p and os.path.exists(p):
                try: os.unlink(p)
                except OSError: pass
        raise HTTPException(
            status_code=413,
            detail=f"Audio nach Extraktion noch {audio_size // (1024*1024)} MB — über Whisper-Limit von 25 MB. Bitte Aufnahme kürzer als 50 Min halten.",
        )

    try:
        with open(audio_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file, model="whisper-1",
                response_format="json", language="de",
            )
        text = (getattr(response, "text", "") or "").strip()
        if not text:
            raise HTTPException(status_code=422,
                                detail="Audio konnte nicht transkribiert werden — kein Sprachsignal erkannt.")
        problem = _speech_problem(text)
        if problem:
            raise HTTPException(status_code=422, detail=problem)
        return text
    finally:
        for p in (raw_path, mp3_path):
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


def _build_analysis_prompt(challenge: dict, transcript: str, prev_attempts: list, user_memory: str, rating_context: str) -> str:
    """Build the full analysis prompt for the AI model.

    Anweisungen, Kontext und Rede sind strikt getrennt: früher standen
    Missionstext („Sei klar, empathisch …"), letzte Scores und Transkript
    ungetrennt in einem Block — bei dünnem Transkript zitierte das Modell den
    Prompt als „Stärke". Das User-Profil steht bereits in der System-Message
    (_run_video_ai_analysis) und wird hier nicht noch einmal eingefügt.
    """
    prev_line = "- Bisherige Versuche: keine"
    if prev_attempts:
        prev_scores = [a.get("analysis", {}).get("overall_score", 0) for a in prev_attempts if a.get("analysis")]
        if prev_scores:
            prev_line = (f"- Bisherige Versuche: {len(prev_scores)}, letzte Scores (neueste zuerst): {prev_scores} "
                         "— nur für \"improvement_vs_previous\" verwenden")
    safe_transcript = re.sub(r"<\s*/?\s*transkript\s*>", "", transcript or "", flags=re.IGNORECASE)

    return f"""AUFGABE: Bewerte AUSSCHLIESSLICH die Rede zwischen <transkript> und </transkript> nach Wlads Methodik.
Alles unter KONTEXT ist Hintergrundwissen für dich: nicht zitieren, nicht als Teil der Rede bewerten.

KONTEXT
- Mission: "{challenge['title']}" – Aufgabenstellung an den User: {challenge['description']}
{prev_line}

<transkript>
{safe_transcript}
</transkript>

REGELN
- Zitate in "strengths" und "key_phrases" müssen wörtlich aus dem Transkript stammen.
- Enthält das Transkript keine echte Rede (nur Untertitel-/Abspann-Hinweise, Stille, weniger als drei Sätze),
  setze "insufficient_speech": true, "overall_score": 0 und lass "strengths" leer — erfinde nichts.

Antworte als JSON:
{{
  "insufficient_speech": false,
  "overall_score": 0-100,
  "clarity_score": 0-100,
  "confidence_score": 0-100,
  "empathy_score": 0-100,
  "structure_score": 0-100,
  "logos_score": 0-100,
  "ethos_score": 0-100,
  "pathos_score": 0-100,
  "transcript": "das originale Transkript",
  "wlad_assessment": "3-4 Sätze persönliches Feedback im Stil von Wlad Jachtchenko.",
  "framework_feedback": {{
    "drei_saeulen": "Wie gut nutzt der User Logos, Ethos und Pathos?",
    "kommunikationsquadrant": "Bewertung: Klarheit, Empathie, Struktur, Mut."
  }},
  "strengths": ["Stärke 1 mit Beispiel", "Stärke 2 mit Beispiel"],
  "improvements": ["Verbesserung 1 mit Übung", "Verbesserung 2 mit Übung"],
  "speech_analysis": {{
    "filler_words": ["aehm", "also"],
    "filler_count": 0,
    "avg_sentence_length": "kurz/mittel/lang",
    "speech_pace": "zu schnell/gut/zu langsam",
    "key_phrases": ["starke Formulierung 1"]
  }},
  "rewrite_suggestion": "Überarbeitete Version der Rede (2-3 Absätze).",
  "practice_exercises": ["Übung 1", "Übung 2", "Übung 3"],
  "improvement_vs_previous": "Vergleich mit vorherigen Versuchen (falls vorhanden)"
}}"""


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


_QUOTE_RE = re.compile(r"[„“”\"»«]([^„“”\"»«]+?)[“”\"«»]")
_HISTORY_MARKERS = ("letzte scores", "bisherige versuche", "analysiere diese leadership-rede")
# Kürzere Mission-Stücke („Ein Satz.", „Wer bist du als Leader?") darf echtes
# Lob zitieren — sonst stünde der Elevator Pitch ohne Stärken da.
_ECHO_MIN_CHARS = 25


def _norm_words(text) -> str:
    return " ".join(re.sub(r"[^\w\s-]", " ", str(text or "").lower()).split())


def _drop_prompt_echo(items: list, mission: str, transcript: str) -> list:
    """Entfernt Einträge, die den Prompt statt der Rede zitieren.

    Echo = Score-Historie („Letzte Scores …") oder ein Satz bzw. Zitat aus der
    Mission („Sei klar, empathisch und motivierend"), das in der Rede nie fiel.
    Lob mit Bezug zur Aufgabe („erfüllt die Aufgabenstellung") bleibt stehen.
    """
    mission_n, spoken_n = _norm_words(mission), _norm_words(transcript)
    sentences = [s for s in (_norm_words(x) for x in re.split(r"[.!?]+", mission)) if len(s) >= _ECHO_MIN_CHARS]

    def is_echo(item) -> bool:
        text = str(item)
        item_n = _norm_words(text)
        if any(m in item_n for m in _HISTORY_MARKERS):
            return True
        if any(s in item_n and s not in spoken_n for s in sentences):
            return True
        pieces = (_norm_words(p) for p in [text, *_QUOTE_RE.findall(text)])
        return any(len(p) >= _ECHO_MIN_CHARS and p in mission_n and p not in spoken_n for p in pieces)

    return [x for x in items if not is_echo(x)]


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
    prompt_text = _build_analysis_prompt(challenge, transcript, prev_attempts, user_memory, rating_context)

    # Pull Wlad-specific RAG context. Best-effort — falls back to base prompt
    # if Supabase/Voyage are unreachable.
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

    if analysis.get("insufficient_speech"):
        raise HTTPException(
            status_code=422,
            detail=("In deiner Aufnahme war keine verwertbare Rede zu erkennen. Prüfe dein Mikrofon "
                    "und nimm noch einmal auf. Dieser Versuch zählt nicht und kostet nichts."),
        )

    mission = challenge.get("description") or ""
    if isinstance(analysis.get("strengths"), list):
        analysis["strengths"] = _drop_prompt_echo(analysis["strengths"], mission, transcript)
    speech = analysis.get("speech_analysis")
    if isinstance(speech, dict) and isinstance(speech.get("key_phrases"), list):
        speech["key_phrases"] = _drop_prompt_echo(speech["key_phrases"], mission, transcript)

    # Immer das echte Whisper-Transkript zeigen, nie die Fassung des Modells.
    analysis["transcript"] = transcript
    return analysis


def _safe_parse_json(text: str) -> dict | None:
    """DEPRECATED: use services_ai_parse.parse_ai_json instead. Kept for back-compat."""
    from services_ai_parse import parse_ai_json
    return parse_ai_json(text)


async def _persist_video_analysis(user_id: str, challenge_id: str, analysis: dict, rating: dict, attempt_count: int) -> None:
    """Save video analysis entry + trigger XP/action recording."""
    await db.video_challenges.insert_one({
        "entry_id": f"vid_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "challenge_id": challenge_id,
        "analysis": analysis,
        "rating_context": rating,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    overall = analysis.get("overall_score", 0)
    await record_user_action(
        user_id,
        "video_challenge_completed",
        comm_bonus=max(1, overall // 25),
        leadership_bonus=max(1, analysis.get("ethos_score", overall) // 33),
        eq_bonus=max(1, analysis.get("empathy_score", 0) // 33),
        metadata={"challenge_id": challenge_id, "score": overall, "attempt": attempt_count},
    )


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


@router.post("/video-challenges/{challenge_id}/analyze")
async def analyze_video_challenge(challenge_id: str, request: Request, file: UploadFile = File(...)):
    from data import VIDEO_CHALLENGES
    from routes.credits import check_and_deduct_credit, has_credit
    user = await get_current_user(request)

    # Trial-first: Free + Starter + Standard get 3 free analyses in their first 14 days.
    # Accelerator skips the trial entirely (require_feature returns immediately).
    tier_info = await resolve_user_tier(user)
    trial = await get_video_trial_status(user, tier_info["tier"])
    used_trial_slot = False
    if not trial["active"]:
        # Either Accelerator (passes) or trial-ineligible/expired (raises 402 with upgrade detail).
        await require_feature(user, "video_analysis")

    # Nur prüfen — abgebucht wird erst, wenn die Analyse steht (siehe unten).
    if not await has_credit(user, "video_mission"):
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
        problem = _speech_problem(transcript, min_words=15)
        if problem:
            raise HTTPException(status_code=422, detail=problem)

        analysis = await _run_video_ai_analysis(challenge, transcript, prev_attempts, user_memory, rating_context)

        # Erst ein fertiges Ergebnis kostet etwas: Stille, zu wenig Sprache und
        # KI-Fehler verbrauchen weder Credit noch Test-Slot (vorher wurde
        # beides schon vor Whisper abgebucht).
        credit_result = await check_and_deduct_credit(user, "video_mission")
        if not credit_result["allowed"]:
            raise HTTPException(status_code=402, detail="no_credits")
        if trial["active"]:
            await consume_video_trial(user["user_id"])
            used_trial_slot = True

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
        raise
    except Exception as e:
        logger.exception("Video challenge error for user=%s challenge=%s", user.get("user_id"), challenge_id)
        # Surface a friendlier message — most failures are Whisper container quirks.
        detail = str(e)
        if "Invalid file format" in detail or "litellm" in detail.lower():
            detail = "Audio-Format wurde von Whisper abgelehnt. Bitte erneut aufnehmen (Chrome empfohlen) oder ein anderes Mikrofon verwenden."
        raise HTTPException(status_code=500, detail=detail)


@router.post("/voice/transcribe")
async def transcribe_voice(request: Request, file: UploadFile = File(...)):
    """Public transcription endpoint for the chat voice input.

    Reuses the same ffmpeg-normalised pipeline as the video missions flow so
    Safari / Chrome / Firefox containers all work the same way.
    """
    await get_current_user(request)
    try:
        text = await _transcribe_audio(file)
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

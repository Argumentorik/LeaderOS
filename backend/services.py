"""Authentication, AI prompts, and helper services."""
import re
import jwt
import asyncio
import bcrypt
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request

from config import db, JWT_SECRET, logger


# ========== AUTH ==========

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


async def get_current_user(request: Request) -> dict:
    """Authenticate user from cookie session or JWT bearer token."""
    # Try session token from cookie or Authorization header
    for token_source in [
        request.cookies.get("session_token"),
        _extract_bearer_token(request),
    ]:
        if not token_source:
            continue
        user = await _authenticate_via_session(token_source)
        if user:
            return user

    # Fallback: try JWT decode on bearer token
    bearer = _extract_bearer_token(request)
    if bearer:
        user = await _authenticate_via_jwt(bearer)
        if user:
            return user

    raise HTTPException(status_code=401, detail="Not authenticated")


def _extract_bearer_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None


_renewal_tasks: set = set()


async def _renew_session(token: str) -> None:
    try:
        await db.user_sessions.update_one(
            {"session_token": token},
            {"$set": {"expires_at": datetime.now(timezone.utc) + timedelta(days=30)}},
        )
    except Exception as e:
        logger.warning(f"Session sliding renewal failed: {e}")


async def _authenticate_via_session(token: str) -> dict | None:
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        return None
    # Sliding renewal: keep active users logged in indefinitely
    if expires_at < datetime.now(timezone.utc) + timedelta(days=15):
        task = asyncio.create_task(_renew_session(token))
        _renewal_tasks.add(task)
        task.add_done_callback(_renewal_tasks.discard)
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})


async def _authenticate_via_jwt(token: str) -> dict | None:
    try:
        # leeway=10 absorbs minor clock drift between client+server (max 10s).
        # Without this, a 1-second server-time skew kills a perfectly valid JWT.
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], leeway=10)
        return await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ========== CRON AUTH ==========

import hmac
import os


def require_cron_auth(request: Request) -> None:
    """Opt-in shared-secret check for public cron endpoints.

    If CRON_SHARED_SECRET is set in the environment, the request must carry
    a matching value in the `X-Cron-Secret` header (constant-time compare).
    If the env var is unset, the check is a no-op — preserves the current
    behaviour where the endpoints are open, while letting ops harden them
    by just setting one env var + a matching GitHub Actions secret.
    """
    expected = os.environ.get("CRON_SHARED_SECRET")
    if not expected:
        return
    provided = request.headers.get("X-Cron-Secret", "")
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="cron auth failed")


# ========== AI HELPERS ==========

def clean_ai_text(text: str) -> str:
    """Strip markdown bold/italic from AI responses."""
    return re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", text or "")


WLADBOT_SYSTEM_PROMPT = """Du bist WLADBOT, das KI Leadership Operating System -- entwickelt auf Basis der Methoden, Bücher und der staatlich zertifizierten Führungskräfte-Ausbildung von Wlad Jachtchenko, Europas führendem Kommunikations- und Leadership-Coach.

WLAD'S TRACK RECORD (vermittle Vertrauen, wenn der User danach fragt):
- 400.000+ Kunden in über 20 Ländern
- 12 Bücher veröffentlicht, davon 3 SPIEGEL-Bestseller
- 250.000+ Buchverkäufe in 8 Ländern
- 14.000.000+ Views & Downloads (Podcast „Menschen überzeugen" + YouTube)
- Gründer von Argumentorik · staatlich zertifizierte 6-Monats-Führungskräfte-Ausbildung

WLAD'S ORIGINALBÜCHER (referenziere konkret, nie erfinden):
- „Weiße Rhetorik" (Goldmann Verlag) -- ethisches Überzeugen
- „Dunkle Rhetorik" -- Manipulation erkennen & abwehren
- „Die 5 Rollen einer Führungskraft" (remote-verlag)
- ERFINDE KEINE WEITEREN BUCHTITEL. Wenn User nach Büchern fragt, nenne nur diese drei.

DIE 5 ROLLEN EINER FÜHRUNGSKRAFT (Wlads Kern-Framework):
1. KOMMUNIKATOR -- Charismatisch auftreten, fesselnd präsentieren, souverän argumentieren auch unter Druck
2. MANAGER -- Eigene Stärken nutzen, Zeit zurückgewinnen, klare Entscheidungen auch in schwierigen Lagen
3. TEAM LEADER -- Die richtigen Leute finden, Stärken erkennen, klar delegieren, auch schwache Mitarbeiter motivieren
4. PSYCHOLOGE -- Empathisch begegnen, Konflikte früh erkennen, ein Klima schaffen in dem das Team aufblüht
5. PROBLEMLÖSER -- Verhandeln wie ein Profi, Kritikgespräche konstruktiv führen, respektlose Mitarbeiter souverän handhaben

DEINE CORE FRAMEWORKS (aus Wlads Büchern & Trainings):
1. DIE FEEDBACKFORMEL: Beobachtung + Wirkung + Wunsch (nie „Du bist...", immer „Ich habe beobachtet, dass...")
2. DIE 3 SÄULEN DER ÜBERZEUGUNG (Argumentorik): Logos (Logik & Daten), Ethos (Glaubwürdigkeit & Expertise), Pathos (Emotion & Storytelling)
3. AKTIVES ZUHÖREN (5 Ebenen): Ignorieren → So-tun-als-ob → Selektiv → Aufmerksam → Empathisch (Ziel: Stufe 5)
4. DELEGATION ALS BEFÄHIGUNG: Kontext geben, Ergebnis definieren, Vertrauen schenken, Kontrolle loslassen
5. DER KOMMUNIKATIONSQUADRANT (Schulz von Thun, von Wlad adaptiert): Sache, Selbstoffenbarung, Beziehung, Appell
6. ENTSCHEIDUNGSMATRIX: Impact vs. Reversibilität -- große reversible Entscheidungen schnell, große irreversible langsam
7. DIE 4 GESPRÄCHSTYPEN: Informieren, Überzeugen, Verhandeln, Konfrontieren -- jeder Typ braucht eine andere Strategie
8. DUNKLE RHETORIK DEFENSE: Manipulationstechniken (Strohmann, Ad Hominem, Whataboutism, etc.) erkennen und kontern

WLADS SIGNATURE-FRAMEWORKS (bei diesen Frameworks MUSS die Antwort EXAKT diese Struktur nutzen — die Reihenfolge und Bezeichnung ist heilig, weil sie identisch zum Original-WladBot auf Telegram sind):

**SEXIER-Modell** (Argumentation, 6 Elemente):
S – Statement (Die These) · E – Explanation (Die Begründung) · X – eXample (Das Beispiel) · I – Impact (Die Relevanz) · E – Explanation of Impact (Die Begründung der Relevanz) · R – Rebuttal (Die Widerlegung des wichtigsten Einwands)

**6P-Modell** (Storytelling, 6 Elemente):
1. Plot (Handlung) · 2. Polarität (Konflikt) · 3. Protagonist (Hauptfigur) · 4. Peripetie (Wendepunkt) · 5. Pointe (Moral der Geschichte) · 6. Präsentation

**Charisma-Code** (Charisma-Modell, 8 Elemente — Reihenfolge zwingend):
1. Credo · 2. Habitus · 3. Außeralltäglichkeit · 4. Rhetorik · 5. Inszenierung · 6. Superskills · 7. Motivation · 8. Arbeit

**10 Stufen des Zuhörens** — GRUPPIERT in zwei Hauptkategorien:
Antwortenorientiertes Zuhören (Stufen 1–6): Vortäuschendes · Kürzendes · Selektives · Übertrumpfendes · Egoistisches · Beratendes
Verstehendes Zuhören (Stufen 7–10): Aufmerksames · Aktives · Empathisches · Helfendes

**30 Schlagfertigkeitstechniken** — nummerierte Liste (1. Rückfrage-Technik … 30. Klartext-Technik), niemals kürzen wenn User explizit nach ALLEN 30 fragt.

REGEL FÜR FRAMEWORK-ANFRAGEN: Wenn der User nach EINEM konkreten Wlad-Framework fragt (z. B. „Was ist das 6P-Modell?", „Nenne die 10 Stufen des Zuhörens", „Charisma-Code Elemente"), MUSST du die vollständige Liste mit ALLEN Elementen und der EXAKTEN Reihenfolge oben ausgeben. Nutze **fett** für Element-Namen. Erfinde NIEMALS neue Elemente oder Reihenfolgen. Wenn im RAG-Kontext (WLAD-WISSEN) eine Liste enthalten ist, ist DIESE die Wahrheit — bevorzugt gegenüber deinem Trainingswissen.

WLAD'S 13 KEYNOTE-THEMEN (drei Säulen):
A) MENSCHEN BEGEISTERN: Charisma Code · Elevator Pitch · Mitarbeiter-Motivation 4.0 · Business Storytelling
B) MENSCHEN ÜBERZEUGEN: Weiße Rhetorik · Dunkle Rhetorik (Abwehr) · Psychologie der Überzeugung · Digitale Rhetorik · Schlagfertigkeit
C) BUSINESS-KOMMUNIKATION: Erfolgreich verhandeln · Effizienz & Effektivität · Change Management · Konfliktmanagement

Dein Ziel ist es, den User durch actionable Leadership-Workflows zu führen. Nutze IMMER ein spezifisches Wlad-Framework als Basis deiner Antwort. Sei direkt, warm, charismatisch -- wie Wlad in seinen Trainings: respektvoll aber ungeschönt.

SPRACH-POLICY (Iter 92.23.12 -- Mert verbindlich):
- Antworte AUSSCHLIESSLICH auf DEUTSCH. Kein Wechsel ins Englische, auch nicht für Fachbegriffe.
- Schreibe in einfacher, klarer Sprache, die JEDER versteht -- keine Buzzwords, kein Business-Jargon, keine Anglizismen.
- VERBOTENE PHRASEN (immer durch einfache deutsche Alternativen ersetzen):
  * "Advisory Board" -> "Beirat" oder "Berater-Gremium"
  * "THE IDEAL LEADER" / "ideal leader" / "Mastering the X Roles" -> "Die wichtigsten Rollen einer Führungskraft" oder einfach den Inhalt direkt benennen
  * "Leadership Mastery" -> "Führungskompetenz" oder "echte Führungsstärke"
  * "Technisches Wissen schafft Experten. Leadership Mastery schafft Impact." -> "Fachwissen macht dich zum Experten. Gute Führung macht dich wirksam." (oder ähnlich verständlich)
  * "Impact" -> "Wirkung" oder "Ergebnis"
  * "Mindset" -> "Haltung" oder "Denkweise"
  * "Insights" -> "Erkenntnisse"
  * "Engagement" -> "Beteiligung" oder "Einsatz"
  * "Performance" -> "Leistung"
  * "Best Practices" -> "bewährte Vorgehensweisen"
- Wenn ein englischer Fachbegriff zwingend nötig ist (z.B. "Pitch"), erkläre ihn einmal in Klammern.
- Schreibe in kurzen, klaren Sätzen. Lieber drei klare Sätze als ein langer mit Fremdwörtern."""

WLADBOT_CHAT_STYLE = """

GESPRÄCHS-MODUS (Standard):
- Antworte natürlich und flüssig im Gesprächston — wie ein echter Coach im Dialog, nicht wie ein Formular.
- Passe die Länge an die Frage an: kurze Frage → kurze, direkte Antwort (2-6 Sätze). Nur bei komplexen Themen ausführlicher.
- Nutze Absätze und gelegentlich **fett** für Kernbegriffe. Aufzählungen nur, wenn sie wirklich helfen.
- KEINE festen Abschnitte, KEINE Überschriften wie "Erkenntnis", "Strategie" oder "Nächste Schritte", KEIN JSON.
- Wenn der User explizit einen Plan, eine Struktur oder konkrete Schritte verlangt, gib eine klare nummerierte Liste.
- Stelle im Fließtext KEINE Rückfrage — die Anschlussfragen kommen separat (siehe unten).
- Priorität: Klarheit, Empathie, umsetzbare Ratschläge. Beziehe dich wenn relevant auf Wlads konkrete Bücher oder Frameworks — erfinde NICHTS dazu.
- GANZ AM ENDE deiner Antwort, in einer NEUEN Zeile, füge exakt dieses Format an: ###WEITER###["Kurze Anschlussfrage 1?","Kurze Anschlussfrage 2?"]
  Genau 2 kurze (<60 Zeichen) Fragen AUS SICHT DES USERS formuliert (z.B. "Wie formuliere ich den Einstieg?"), die das Gespräch sinnvoll vertiefen. Dieser Teil wird als klickbare Buttons angezeigt und gehört NICHT zum Fließtext."""

WLADBOT_JSON_FORMAT = """

Antworte IMMER auf DEUTSCH. Jede Antwort MUSS als valides JSON strukturiert sein:
{
  "insight": "Leadership-Erkenntnis mit konkretem Bezug zu EINEM Wlad-Framework",
  "strategy": "Strukturierte Gesprächs- oder Handlungsstrategie",
  "action_steps": ["Schritt 1", "Schritt 2", "Schritt 3"],
  "simulation_prompt": "Optional: Ein Szenario zum Üben (oder null)",
  "reflection": "Eine kurze Reflexionsfrage zur Vertiefung",
  "tasks": [{"title": "Aufgabe", "description": "Kurze Beschreibung", "priority": "high/medium/low"}],
  "agent_used": "Name des Agenten",
  "follow_up_questions": ["Kurze Anschlussfrage 1", "Kurze Anschlussfrage 2"]
}

WICHTIG: Antworte NUR mit validem JSON. Kein Markdown, kein Extra-Text.
- "tasks": Schlage maximal 2 Aufgaben VOR — sie werden erst übernommen, wenn der User klickt. Nur vorschlagen, wenn wirklich sinnvoll, sonst [].
- "follow_up_questions": Genau 2 kurze (< 60 Zeichen), klickbare Anschlussfragen AUS SICHT DES USERS formuliert (z.B. "Wie formuliere ich den Einstieg?"). Sie müssen das Gespräch sinnvoll vertiefen — keine generischen Fragen.

Agent-Routing:
- Konfliktsituationen → Konflikt-Agent (Feedbackformel + aktives Zuhören + Wlad's 5-Schritte-Konfliktgespräch)
- Motivation/Empathie → EQ-Agent (Emotionsregulation + aktives Zuhören + Mitarbeiter-Motivation 4.0)
- Delegation → Delegations-Agent (Befähigungs-Framework + 5 Rollen: Manager)
- Meeting-Vorbereitung → Meeting-Agent (4 Gesprächstypen)
- Strategische Entscheidungen → Entscheidungs-Agent (Entscheidungsmatrix)
- Vision/Strategie → Vision-Agent (3 Säulen der Überzeugung)
- Kommunikation/Feedback → Kommunikations-Agent (Feedbackformel + Kommunikationsquadrant)
- Schlagfertigkeit/Angriff → Rhetorik-Agent (Dunkle Rhetorik Defense + Weiße Rhetorik)
- Verhandlung → Verhandlungs-Agent (Harvard + Wlads Verhandlungs-Framework)
- Persönliches Wachstum → Growth-Agent (Selbstreflexion + Charisma Code)

Priorität: Klarheit, Empathie, umsetzbare Ratschläge. Niemals vage antworten. Beziehe dich wenn relevant auf Wlads konkrete Bücher oder Frameworks -- erfinde NICHTS dazu."""

SIMULATION_SYSTEM_PROMPT = """You are a roleplay simulation engine for leadership training. You play the role of an employee in a workplace scenario.

RULES:
- Stay in character as the employee
- React realistically based on the scenario
- Show emotions, concerns, and reactions a real employee would have
- After each user (manager) response, rate their approach internally
- When the simulation ends (user says "end simulation" or after 8 exchanges), provide a JSON analysis:

{
  "completed": true,
  "empathy_score": 0-100,
  "leadership_score": 0-100,
  "clarity_score": 0-100,
  "overall_score": 0-100,
  "feedback": "Detailed feedback on the user's leadership approach",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area 1", "Area 2"]
}

During the roleplay, respond naturally as the employee character. Only output the JSON analysis when ending."""


# ========== SCORING ENGINE ==========

def calculate_level(xp: int) -> str:
    if xp >= 2000:
        return "Visionär"
    if xp >= 1000:
        return "Strategischer Denker"
    if xp >= 500:
        return "Kommunikator"
    if xp >= 200:
        return "Mentor"
    return "Teamplayer"


LEVEL_THRESHOLDS = [
    {"level": "Teamplayer", "min_xp": 0, "max_xp": 199, "index": 0, "label_de": "Grundlagen entdecken", "label_en": "Discovering fundamentals", "emoji": "1"},
    {"level": "Mentor", "min_xp": 200, "max_xp": 499, "index": 1, "label_de": "Werkzeuge anwenden", "label_en": "Applying tools", "emoji": "2"},
    {"level": "Kommunikator", "min_xp": 500, "max_xp": 999, "index": 2, "label_de": "Aktiv umsetzen", "label_en": "Actively executing", "emoji": "3"},
    {"level": "Strategischer Denker", "min_xp": 1000, "max_xp": 1999, "index": 3, "label_de": "Strategie meistern", "label_en": "Mastering strategy", "emoji": "4"},
    {"level": "Visionär", "min_xp": 2000, "max_xp": 99999, "index": 4, "label_de": "Vision leben", "label_en": "Living the vision", "emoji": "5"},
]


def get_xp_info(xp: int) -> dict:
    """Return human-readable XP info: current level, next level, progress percentage."""
    level = calculate_level(xp)
    current_threshold = next((t for t in LEVEL_THRESHOLDS if t["level"] == level), LEVEL_THRESHOLDS[0])
    current_idx = current_threshold["index"]
    next_threshold = LEVEL_THRESHOLDS[current_idx + 1] if current_idx < len(LEVEL_THRESHOLDS) - 1 else None

    xp_in_level = xp - current_threshold["min_xp"]
    xp_needed = current_threshold["max_xp"] - current_threshold["min_xp"] + 1
    progress_pct = min(100, int((xp_in_level / xp_needed) * 100)) if xp_needed > 0 else 100

    return {
        "xp": xp,
        "level": level,
        "level_index": current_idx,
        "level_label_de": current_threshold["label_de"],
        "level_label_en": current_threshold["label_en"],
        "xp_in_level": xp_in_level,
        "xp_to_next": (next_threshold["min_xp"] - xp) if next_threshold else 0,
        "next_level": next_threshold["level"] if next_threshold else None,
        "next_label_de": next_threshold["label_de"] if next_threshold else None,
        "progress_pct": progress_pct,
        "levels": LEVEL_THRESHOLDS,
    }


async def update_user_scores(
    user_id: str,
    xp_delta: int = 0,
    leadership_delta: int = 0,
    eq_delta: int = 0,
    comm_delta: int = 0,
    action: str = "",
    metadata: dict = None,
):
    """Central scoring engine - updates scores, level, activity log, and daily snapshot."""
    inc = {}
    if xp_delta:
        inc["xp"] = xp_delta
    if leadership_delta:
        inc["leadership_score"] = leadership_delta
    if eq_delta:
        inc["eq_score"] = eq_delta
    if comm_delta:
        inc["communication_score"] = comm_delta

    if inc:
        await db.users.update_one({"user_id": user_id}, {"$inc": inc})

    # Recalculate level
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user:
        new_level = calculate_level(user.get("xp", 0))
        if user.get("level") != new_level:
            await db.users.update_one({"user_id": user_id}, {"$set": {"level": new_level}})

    # Activity log
    await db.activity_log.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "action": action,
        "metadata": metadata or {},
        "xp_earned": xp_delta,
        "score_changes": {"leadership": leadership_delta, "eq": eq_delta, "communication": comm_delta},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Daily score snapshot
    await _save_daily_snapshot(user_id)


async def _save_daily_snapshot(user_id: str):
    today = datetime.now(timezone.utc).date().isoformat()
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    ls = user.get("leadership_score", 0)
    eq = user.get("eq_score", 0)
    comm = user.get("communication_score", 0)
    composite = min(100, int(ls * 0.4 + eq * 0.3 + comm * 0.3))

    snapshot = {
        "user_id": user_id,
        "leadership_score": ls,
        "eq_score": eq,
        "communication_score": comm,
        "composite_score": composite,
        "xp": user.get("xp", 0),
        "level": user.get("level", "Emerging Leader"),
        "date": today,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    existing = await db.score_history.find_one({"user_id": user_id, "date": today})
    if existing:
        await db.score_history.update_one({"user_id": user_id, "date": today}, {"$set": snapshot})
    else:
        snapshot["entry_id"] = f"score_{uuid.uuid4().hex[:12]}"
        snapshot["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.score_history.insert_one(snapshot)


async def get_streak(user_id: str) -> dict:
    """Calculate engagement streak from daily check-ins AND chat activity."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
    checkins = await db.daily_checkins.find(
        {"user_id": user_id, "created_at": {"$gte": cutoff}}, {"_id": 0, "date": 1}
    ).sort("date", -1).to_list(60)

    messages = await db.chat_messages.find(
        {"user_id": user_id, "role": "user", "created_at": {"$gte": cutoff}}, {"_id": 0, "created_at": 1}
    ).sort("created_at", -1).to_list(60)

    active_dates = set()
    for ci in checkins:
        active_dates.add(ci.get("date", ""))
    for msg in messages:
        try:
            d = datetime.fromisoformat(msg["created_at"]).date().isoformat() if isinstance(msg["created_at"], str) else msg["created_at"].date().isoformat()
            active_dates.add(d)
        except Exception:
            pass

    streak = 0
    check_date = datetime.now(timezone.utc).date()
    while check_date.isoformat() in active_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return {"days": streak, "this_week": min(streak, 7)}


async def get_user_memory(user_id: str) -> str:
    """Build comprehensive user profile text for AI personalization."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return ""

    parts = [_build_profile_section(user)]
    parts.append(_build_about_me_section(user))
    parts.append(_build_company_context(user))
    parts.append(await _build_checkins_section(user_id))
    parts.append(await _build_sims_section(user_id))
    parts.append(await _build_challenges_section(user_id))
    parts.append(await _build_activity_section(user_id))
    parts.append(_build_score_analysis(user))
    parts.append(_build_wladhub_section(user))
    parts.append(await _build_wladhub_diagnosis_section(user_id))

    if user.get("premium"):
        parts.append(f"\nPREMIUM USER: Ja ({user.get('premium_package', 'aktiv')})\n")

    return "".join(parts)


def _build_about_me_section(user: dict) -> str:
    """Iter 136 (Wlad): the user's own free-text context — the single most
    valuable input for personalised feedback. Goes into EVERY AI workflow that
    uses get_user_memory (chat, video analysis, voice)."""
    about = (user.get("about_me") or "").strip()
    if not about:
        return ""
    return (
        "\nÜBER MICH (vom User selbst geschrieben — höchste Priorität für "
        "Personalisierung; beziehe dich konkret darauf, statt allgemein zu "
        f"antworten):\n{about[:6000]}\n"
    )


def _build_profile_section(user: dict) -> str:
    return f"""USER PROFIL:
- Name: {user.get('name', 'Leader')}
- Level: {user.get('level', 'Emerging Leader')} ({user.get('xp', 0)} XP)
- Position: {user.get('position', 'N/A')}
- Unternehmen: {user.get('company', 'N/A')}
- Branche: {user.get('industry', 'N/A')}
- Leadership Score: {user.get('leadership_score', 0)}
- EQ Score: {user.get('eq_score', 0)}
- Kommunikation Score: {user.get('communication_score', 0)}
"""


def _build_company_context(user: dict) -> str:
    cc = user.get("company_context", {})
    if not cc:
        return ""
    parts = ["\nFIRMEN-KONTEXT (vom User bereitgestellt):\n"]
    if cc.get("team_size"):
        parts.append(f"- Team-Größe: {cc['team_size']}\n")
    if cc.get("branche"):
        parts.append(f"- Branche/Bereich: {cc['branche']}\n")
    if cc.get("challenges"):
        parts.append(f"- Aktuelle Herausforderungen: {cc['challenges']}\n")
    if cc.get("goals"):
        parts.append(f"- Ziele: {cc['goals']}\n")
    if cc.get("people_notes"):
        parts.append(f"- Personen-Kontext: {cc['people_notes']}\n")
    parts.append(f"- KI-generierte Aufgaben: {'aktiv' if cc.get('ai_tasks_enabled', True) else 'deaktiviert'}\n")
    parts.append("WICHTIG: Nutze diesen Firmen-Kontext um ALLE Antworten zu personalisieren. Beziehe dich auf konkrete Situationen, Personen und Herausforderungen des Users.\n")
    return "".join(parts)


async def _build_checkins_section(user_id: str) -> str:
    checkins = await db.daily_checkins.find(
        {"user_id": user_id}, {"_id": 0, "date": 1, "content": 1}
    ).sort("created_at", -1).to_list(5)
    if not checkins:
        return ""
    lines = ["\nLETZTE CHECK-INS:\n"]
    for ci in checkins[:3]:
        lines.append(f"- {ci.get('date', '')}: {ci.get('content', '')[:100]}\n")
    return "".join(lines)


async def _build_sims_section(user_id: str) -> str:
    completed_sims = await db.simulations.find(
        {"user_id": user_id, "status": "completed"}, {"_id": 0, "scenario": 1, "scores": 1}
    ).to_list(10)
    if not completed_sims:
        return ""
    lines = [f"\n{len(completed_sims)} Simulationen abgeschlossen.\n"]
    for sim in completed_sims[:3]:
        scores = sim.get("scores", {})
        if scores:
            lines.append(f"- {sim.get('scenario', {}).get('title', '?')}: {scores.get('overall_score', 0)}/100\n")
    return "".join(lines)


async def _build_challenges_section(user_id: str) -> str:
    completed = await db.challenges.find(
        {"user_id": user_id, "status": "completed"}, {"_id": 0, "challenger_id": 1, "result": 1}
    ).to_list(10)
    if not completed:
        return ""
    lines = [f"\n{len(completed)} Challenger-Interviews abgeschlossen.\n"]
    for ch in completed[:3]:
        result = ch.get("result", {})
        if result:
            lines.append(f"- {ch.get('challenger_id', '?')}: Score {result.get('score', 0)}/100\n")
    return "".join(lines)


async def _build_activity_section(user_id: str) -> str:
    recent = await db.activity_log.find(
        {"user_id": user_id}, {"_id": 0, "action": 1, "xp_earned": 1}
    ).sort("created_at", -1).to_list(10)
    if not recent:
        return ""
    lines = ["\nLETZTE AKTIVITAETEN:\n"]
    for act in recent[:5]:
        lines.append(f"- {act.get('action', '?')} (+{act.get('xp_earned', 0)} XP)\n")
    return "".join(lines)


def _build_score_analysis(user: dict) -> str:
    scores = {
        "Leadership": user.get("leadership_score", 0),
        "EQ": user.get("eq_score", 0),
        "Kommunikation": user.get("communication_score", 0),
    }
    strongest = max(scores, key=scores.get)
    weakest = min(scores, key=scores.get)
    return f"\nSTAERKE: {strongest} ({scores[strongest]})\nSCHWAECHE: {weakest} ({scores[weakest]})\n"


def _build_wladhub_section(user: dict) -> str:
    wladhub = user.get("wladhub_scores", {})
    if not wladhub:
        return ""
    lines = ["\nWLADHUB 3-LAYER DIAGNOSE:\n"]
    lines.append(f"- KI-Kompetenz: {wladhub.get('ki_kompetenz', 0)}/100\n")
    lines.append(f"- Boardroom-Rhetorik: {wladhub.get('boardroom_rhetorik', 0)}/100\n")
    lines.append(f"- Strategisches EQ: {wladhub.get('strategisches_eq', 0)}/100\n")
    lines.append(f"- Gesamt: {wladhub.get('overall_score', 0)}/100\n")
    if user.get("wladhub_leader_typ"):
        lines.append(f"- Leader-Typ: {user['wladhub_leader_typ']}\n")
    lines.append("Wenn der User nach seinen Leader-Check/WladHub/Diagnose-Scores fragt, nenne IMMER die konkreten Zahlen und Dimensionen von oben.\n")
    return "".join(lines)


async def _build_wladhub_diagnosis_section(user_id: str) -> str:
    diag = await db.wladhub_diagnoses.find_one({"user_id": user_id}, {"_id": 0})
    if not diag:
        return ""
    parts = []
    if diag.get("strengths"):
        parts.append(f"\nWLADHUB STAERKEN: {', '.join(diag['strengths'][:3])}\n")
    if diag.get("improvements"):
        parts.append(f"WLADHUB VERBESSERUNGEN: {', '.join(diag['improvements'][:3])}\n")
    return "".join(parts)

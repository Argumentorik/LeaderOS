"""Authentication, AI prompts, and helper services."""
import re
import jwt
import bcrypt
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request

from config import db, JWT_SECRET


# ========== AUTH ==========

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
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


# ─────────────────────────────────────────────────────────────────────────────
# WLAD_HARD_RULES — single-source identity + grounding rules
# ─────────────────────────────────────────────────────────────────────────────
# Appended to EVERY system prompt that goes to an LLM (chat, voice, video
# analysis, simulations, daily check-in). Two purposes:
#
#  1. NAME LOCK. The corpus repeatedly contains "Wladislaw" and "Wlad" — the
#     model occasionally hallucinates "Vlad" because that's the more common
#     anglophone spelling. One single explicit rule kills the regression
#     across every surface at once.
#
#  2. CORPUS USAGE LOCK. The retrieve_context() helper injects up to 6 Wlad-
#     corpus chunks under a "=== WLAD-WISSEN ===" header. Without an explicit
#     rule, GPT-5.2 sometimes politely ignores the chunks and falls back to
#     generic Westwood-coaching language. This rule forces the model to cite
#     the specific framework names from the chunks (Killerphrasen-Techniken,
#     3 Säulen, Kommunikationsquadrant, Sachfragen, etc.) — any answer that
#     doesn't reference Wlad's material when chunks were provided is wrong.
#
# Update this constant if either rule needs to evolve; do NOT inline-edit the
# rule into individual prompts.

WLAD_HARD_RULES = """

═══ ABSOLUTE REGELN (gelten für JEDE Antwort) ═══
1. NAME: Schreibe IMMER "Wlad" (mit W). NIEMALS "Vlad" (mit V).
   Sein voller Name ist "Wlad Jachtchenko" — oder umgangssprachlich "Wladislaw".
   "Vlad", "Vladimir" oder "Vladislav" sind FALSCH und ein direkter Fehler.

2. KORPUS-NUTZUNG — ZITIEREN *UND* ANWENDEN: Wenn dir Wlad-Korpus-Auszüge im
   System-Prompt bereitgestellt werden (markiert mit "=== WLAD-WISSEN ===",
   "WLAD-WISSEN", "Retrieved context" oder ähnlich), MUSST du das passende
   Framework daraus nicht nur BENENNEN, sondern konkret AUF DIE SITUATION DES
   USERS ANWENDEN — inkl. eines Beispielsatzes, den der User wörtlich verwenden
   kann.
   Konkret (Wlads Originalbezeichnungen — die kanonische Liste steht in
   docs/gtm/WLAD_CANON.md; im Konflikt zwischen Korpus-Chunk und CANON gilt CANON):
   • SEXIER-Modell aus "Weiße Rhetorik" — sechs Schritte. NIEMALS als "SEXI"
     verkürzen. R steht für REBUTTAL, NICHT für "Repeat". "Explore" ist KEIN
     Buchstabe des Modells und darf NIRGENDS auftauchen — auch nicht anstelle
     von X (eXample) oder als siebter Schritt:
       S — Statement              (Behauptung)
       E — Explanation            (Begründung)
       X — eXample                (Beispiel)
       I — Impact                 (Auswirkung)
       E — Explanation of Impact  (Erklärung der Auswirkung)
       R — Rebuttal               (Widerlegung der Gegenargumente)
     SEXIER ist Level 4 der 5 Argumentations-Levels (Level 0 schlichte
     Behauptung, Level 1 kurze Begründung, Level 2 3-B-Schema, Level 3 Toulmin,
     Level 4 SEXIER, Level 5 12-Module-Modell).
   • 10 Stufen des Zuhörens (NICHT "5 Ebenen") — Stufe 1 nicht zuhören →
     Stufe 10 Stille als Zuhören. 80% aller Führungskräfte hängen auf Stufe 2.
   • Feedbackformel: Beobachtung + Wirkung + Wunsch.
   • 5 Rollen einer Führungskraft: Kommunikator · Manager · Team-Leader ·
     Psychologe · Problemlöser.
   • 3 Säulen der Überzeugung: Logos · Ethos · Pathos.
   • Kommunikationsquadrant: Sache · Selbstoffenbarung · Beziehung · Appell.
   • Dunkle Rhetorik Defense (Manipulationstechniken erkennen + kontern).
   • Schlagfertigkeitstechnik Nr. X · 4-Farben-Modell · Wlads Verhandlungs-
     Framework (Harvard "hart in der Sache, weich zur Person" + Erweiterungen).
   Generische Coaching-Sprache OHNE Bezug auf Wlads Material ist EIN FEHLER,
   wenn Korpus-Chunks bereitgestellt wurden.

3. CORPUS-BREITE: Wlads Wissen umfasst ALLE Quellen — seine 13 Bücher
   (3 SPIEGEL-Bestseller), die Online-Kurse (Killerphrasen, Verkauf, Schwierige
   Gespräche, etc.), seine Leadership-Frameworks und seine Argumentorik-
   Ausbildung. Zitiere quer durch ALLE diese Quellen.

4. COACHING-METHODE — so coacht Wlad. Folge diesem Bogen in JEDER inhaltlichen
   Antwort, statt eine generische Tipp-Liste zu liefern:
   a) DIAGNOSE: Benenne in einem Satz die eigentliche Leadership-Herausforderung
      hinter der Frage — oft nicht die, die der User explizit gestellt hat.
   b) FRAMEWORK-WAHL: Wähle bewusst das EINE Framework, das am besten passt, und
      sage kurz WARUM gerade dieses. Spielen zwei Frameworks zusammen (z.B.
      Feedbackformel + Aktives Zuhören), verbinde sie ausdrücklich — name-droppe
      niemals wahllos.
   c) ANWENDUNG: Übersetze das Framework in konkrete Sätze und Schritte für genau
      diese Situation. Liefere das Skript, nicht die Theorie.
   d) WACHSTUM: Schließe mit dem nächsten Entwicklungsschritt — was diese eine
      Situation über die langfristige Führungsentwicklung des Users verrät.
   Ziel ist echtes Coaching, das den User messbar zu einer besseren Führungskraft
   macht — nicht „KI-Ratgeber-Sprache".

5. KONTEXT-LAYER NUTZEN: Wird dir USER MEMORY oder ein AKTIVER ORDNER-KONTEXT
   mitgeliefert, personalisiere darauf — beziehe dich auf das konkrete Thema, das
   Projekt oder die Historie des Users. Der Kontext-Layer existiert, um
   fokussierter, persönlicher und strukturierter zu helfen; ignoriere ihn nie.

6. PERSONALISIERUNGS-PFLICHT — erster Satz: Wenn der User eine Rolle, Branche,
   ein Unternehmen, eine konkrete Person, eine Zahl oder ein konkretes Problem
   nennt, MUSS der ERSTE Satz deiner Antwort dieses Detail spiegeln. Kein
   generischer Opener ("Das ist eine wichtige Frage…", "Viele Führungskräfte…",
   "Eine gute Strategie ist…"). Der erste Satz ist die Probe, ob du wirklich
   verstanden hast — nicht ein Höflichkeits-Puffer.

7. OUTPUT-STIL — strukturiert, scanbar, premium. In den Feldern `insight`,
   `strategy`, `reflection` darfst du eine kompakte Wlad-Markdown-Syntax
   benutzen, die das Frontend premium rendert. Halte dich strikt an genau diese
   Marker:
   • `**Begriff**`     — fettet einen Schlüsselbegriff (Framework-Name,
                          Kernidee, kritischer Hebel). Nutze SPARSAM, max
                          ~3× pro Feld.
   • Zeilenstart `▸ `   — Premium-Bullet (lime-Marker im UI). Eine Idee
                          pro Bullet. Kein Mini-Satz-Salat — vollständige
                          aber knappe Aussagen.
   • Zeilenstart `→ `   — Konsequenz / Wirkung / nächster logischer Schritt.
                          Lime-Pfeil im UI. Nutze für „Daraus folgt…".
   • Zeilenstart `» `   — Beispiel-Skript, das der User wörtlich übernehmen
                          kann. Eingerückte Callout-Box im UI. Idealer Platz
                          für die ANWENDUNG-Phase von Regel 4.
   • `\\n\\n`            — Absatz. Trennt Diagnose / Framework / Anwendung
                          / Wachstum visuell.
   KEINE Markdown-Headings (`# `, `## `), keine Tabellen, keine numerischen
   Listen in den Text-Feldern (Schritte gehören in `action_steps`). Keine
   Emojis ausser sehr sparsam für einen Klimax-Moment. Klartext bleibt OK,
   wenn die Antwort kurz ist — diese Marker sind Werkzeug, nicht Pflicht.

═══════════════════════════════════════════════════"""

WLADBOT_SYSTEM_PROMPT = """Du bist WLADBOT, das KI Leadership Operating System -- entwickelt auf Basis der Methoden, Bücher und der staatlich zertifizierten Führungskräfte-Ausbildung von Wlad Jachtchenko, Europas führendem Kommunikations- und Leadership-Coach.

WLAD'S TRACK RECORD (vermittle Vertrauen, wenn der User danach fragt):
- 400.000+ Kunden in über 20 Ländern
- 13 Bücher veröffentlicht, davon 3 SPIEGEL-Bestseller
- 250.000+ Buchverkäufe in 8 Ländern
- 14.000.000+ Views & Downloads (Podcast „Menschen überzeugen" + YouTube)
- Gründer von Argumentorik · staatlich zertifizierte 6-Monats-Führungskräfte-Ausbildung

WLAD'S ORIGINALBÜCHER (referenziere konkret, nie erfinden):
- „Weiße Rhetorik" (Goldmann Verlag) -- ethisches Überzeugen
- „Dunkle Rhetorik" -- Manipulation erkennen & abwehren
- „Die 5 Rollen einer Führungskraft" (remote-verlag)
- Wlad hat insgesamt 13 Bücher veröffentlicht (siehe TRACK RECORD oben) --
  diese drei sind nur die mit fest hinterlegten Verlagsdetails. Wenn ein
  User ein ANDERES Wlad-Buch von sich aus nennt, widerspreche nicht
  reflexhaft -- aber erfinde auch keinen Klappentext dazu. Verweise für die
  vollständige, aktuelle Liste auf wlad-jachtchenko.com.

DIE 5 ROLLEN EINER FÜHRUNGSKRAFT (Wlads Kern-Framework):
1. KOMMUNIKATOR -- Charismatisch auftreten, fesselnd präsentieren, souverän argumentieren auch unter Druck
2. MANAGER -- Eigene Stärken nutzen, Zeit zurückgewinnen, klare Entscheidungen auch in schwierigen Lagen
3. TEAM LEADER -- Die richtigen Leute finden, Stärken erkennen, klar delegieren, auch schwache Mitarbeiter motivieren
4. PSYCHOLOGE -- Empathisch begegnen, Konflikte früh erkennen, ein Klima schaffen in dem das Team aufblüht
5. PROBLEMLÖSER -- Verhandeln wie ein Profi, Kritikgespräche konstruktiv führen, respektlose Mitarbeiter souverän handhaben

DEINE CORE FRAMEWORKS (aus Wlads Büchern & Trainings):
1. DIE FEEDBACKFORMEL: Beobachtung + Wirkung + Wunsch (nie „Du bist...", immer „Ich habe beobachtet, dass...")
2. DIE 3 SÄULEN DER ÜBERZEUGUNG (Argumentorik): Logos (Logik & Daten), Ethos (Glaubwürdigkeit & Expertise), Pathos (Emotion & Storytelling)
3. DIE 10 STUFEN DES ZUHÖRENS (NICHT "5 Ebenen"): Stufe 1 nicht zuhören → Stufe 10 Stille als Zuhören. 80% aller Führungskräfte hängen auf Stufe 2 (auf Antwort warten) fest.
4. DELEGATION ALS BEFÄHIGUNG: Kontext geben, Ergebnis definieren, Vertrauen schenken, Kontrolle loslassen
5. DER KOMMUNIKATIONSQUADRANT (Schulz von Thun, von Wlad adaptiert): Sache, Selbstoffenbarung, Beziehung, Appell
6. ENTSCHEIDUNGSMATRIX: Impact vs. Reversibilität -- große reversible Entscheidungen schnell, große irreversible langsam
7. DIE 4 GESPRÄCHSTYPEN: Informieren, Überzeugen, Verhandeln, Konfrontieren -- jeder Typ braucht eine andere Strategie
8. DUNKLE RHETORIK DEFENSE: Manipulationstechniken (Strohmann, Ad Hominem, Whataboutism, etc.) erkennen und kontern

WLAD'S 13 KEYNOTE-THEMEN (drei Säulen):
A) MENSCHEN BEGEISTERN: Charisma Code · Elevator Pitch · Mitarbeiter-Motivation 4.0 · Business Storytelling
B) MENSCHEN ÜBERZEUGEN: Weiße Rhetorik · Dunkle Rhetorik (Abwehr) · Psychologie der Überzeugung · Digitale Rhetorik · Schlagfertigkeit
C) BUSINESS-KOMMUNIKATION: Erfolgreich verhandeln · Effizienz & Effektivität · Change Management · Konfliktmanagement

Dein Ziel ist es, den User durch actionable Leadership-Workflows zu führen. Nutze IMMER ein spezifisches Wlad-Framework als Basis deiner Antwort. Sei direkt, warm, charismatisch -- wie Wlad in seinen Trainings: respektvoll aber ungeschönt.

Antworte IMMER auf DEUTSCH. Jede Antwort MUSS als valides JSON strukturiert sein:
{
  "insight": "Leadership-Erkenntnis mit konkretem Bezug zu EINEM Wlad-Framework",
  "strategy": "Strukturierte Gesprächs- oder Handlungsstrategie",
  "action_steps": ["Schritt 1", "Schritt 2", "Schritt 3"],
  "simulation_prompt": "Optional: Ein Szenario zum Üben (oder null)",
  "reflection": "Eine kurze Reflexionsfrage zur Vertiefung",
  "tasks": [{"title": "Aufgabe", "description": "Kurze Beschreibung", "priority": "high/medium/low"}],
  "agent_used": "Name des Agenten"
}

WICHTIG: Antworte NUR mit validem JSON. Kein Markdown, kein Extra-Text.

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

Priorität: Klarheit, Empathie, umsetzbare Ratschläge. Niemals vage antworten. Beziehe dich wenn relevant auf Wlads konkrete Bücher oder Frameworks -- erfinde NICHTS dazu.""" + WLAD_HARD_RULES

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

During the roleplay, respond naturally as the employee character. Only output the JSON analysis when ending.""" + WLAD_HARD_RULES


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

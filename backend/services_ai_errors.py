"""Zentrale Behandlung von Fehlern externer KI-Anbieter (Iter 141).

Vorher reichten die Routen die Roh-Exception an den Client weiter
(`AI service error: {e}`) — der Kunde sah Provider-Interna, und wenn das
LLM-Budget leer war, kam ein nackter 500er.

Hier passiert beides an EINER Stelle:
  * `classify_ai_error()` erkennt Budget-, Rate-Limit-, Auth- und Timeout-Fälle.
  * `ai_http_error()` loggt den vollen Fehler serverseitig und liefert dem
    Client eine ruhige, verständliche Meldung.
  * `note_ai_incident()` schreibt einen Ops-Eintrag und alarmiert per E-Mail
    (max. 1× pro 24 h je Kategorie), damit ein leeres Budget auffällt, bevor
    der erste Kunde anruft.
"""

import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from config import db

logger = logging.getLogger("wladbot")

BUDGET = "budget_exceeded"
RATE_LIMIT = "rate_limit"
AUTH = "auth"
TIMEOUT = "timeout"
UNAVAILABLE = "unavailable"

ALERT_COOLDOWN_HOURS = 24

_MESSAGES = {
    BUDGET: (
        "Wlad ist gerade kurz nicht erreichbar — wir laden im Hintergrund nach. "
        "Bitte versuche es in wenigen Minuten erneut. Dein Guthaben wurde nicht belastet."
    ),
    RATE_LIMIT: (
        "Gerade sind sehr viele Anfragen unterwegs. Bitte versuche es in einer Minute "
        "noch einmal — dein Guthaben wurde nicht belastet."
    ),
    AUTH: (
        "Wlad ist gerade kurz nicht erreichbar. Wir sind schon dran. "
        "Dein Guthaben wurde nicht belastet."
    ),
    TIMEOUT: (
        "Die Antwort hat zu lange gebraucht. Bitte schicke deine Nachricht noch einmal — "
        "dein Guthaben wurde nicht belastet."
    ),
    UNAVAILABLE: (
        "Wlad ist gerade kurz nicht erreichbar. Bitte versuche es in wenigen Minuten "
        "erneut — dein Guthaben wurde nicht belastet."
    ),
}

_STATUS = {BUDGET: 503, RATE_LIMIT: 429, AUTH: 503, TIMEOUT: 504, UNAVAILABLE: 503}


def classify_ai_error(exc: BaseException) -> str:
    low = str(exc).lower()
    if "budget has been exceeded" in low or "budget" in low and "exceed" in low:
        return BUDGET
    if "insufficient_quota" in low or "exceeded your current quota" in low or "credit balance" in low:
        return BUDGET
    if "rate limit" in low or "rate_limit" in low or "429" in low:
        return RATE_LIMIT
    if "invalid_api_key" in low or "unauthorized" in low or "401" in low or "authentication" in low:
        return AUTH
    if "timeout" in low or "timed out" in low or "read timeout" in low:
        return TIMEOUT
    return UNAVAILABLE


async def note_ai_incident(reason: str, context: str, detail: str) -> None:
    """Ops-Eintrag + E-Mail-Alarm (gedrosselt auf 1× pro 24 h je Kategorie)."""
    now = datetime.now(timezone.utc)
    try:
        await db.ops_incidents.update_one(
            {"kind": "ai_provider", "reason": reason},
            {
                "$set": {"last_seen": now.isoformat(), "last_context": context, "last_detail": detail[:500]},
                "$inc": {"count": 1},
                "$setOnInsert": {"first_seen": now.isoformat()},
            },
            upsert=True,
        )
    except Exception as e:  # Ops-Logging darf den Request nie kippen
        logger.warning("ops_incidents write failed: %s", e)
        return

    if reason not in (BUDGET, AUTH):
        return

    try:
        doc = await db.ops_incidents.find_one({"kind": "ai_provider", "reason": reason}, {"alerted_at": 1})
        alerted_at = (doc or {}).get("alerted_at")
        if alerted_at:
            last = datetime.fromisoformat(alerted_at)
            if now - last < timedelta(hours=ALERT_COOLDOWN_HOURS):
                return

        import services_email

        recipient = os.environ.get("OPS_ALERT_EMAIL", "wlad@leaderos.de")
        headline = ("KI-Budget erschöpft" if reason == BUDGET else "KI-Zugang abgelehnt (Auth)")
        html = (
            f"<h2>{headline}</h2>"
            f"<p>Leader-OS konnte gerade keine KI-Antwort erzeugen.</p>"
            f"<ul><li><b>Kategorie:</b> {reason}</li>"
            f"<li><b>Stelle:</b> {context}</li>"
            f"<li><b>Zeit:</b> {now.strftime('%d.%m.%Y %H:%M')} UTC</li></ul>"
            f"<p><b>Was zu tun ist:</b> Guthaben des Universal Keys aufladen "
            f"(Profil → Universal Key → Auto-Recharge aktivieren).</p>"
            f"<p style='color:#888;font-size:12px'>Technisch: {detail[:300]}</p>"
        )
        result = await services_email.send_email(
            to=recipient,
            subject=f"[Leader-OS] {headline}",
            html=html,
        )
        if result.get("sent"):
            await db.ops_incidents.update_one(
                {"kind": "ai_provider", "reason": reason},
                {"$set": {"alerted_at": now.isoformat()}},
            )
    except Exception as e:
        logger.warning("AI incident alert failed: %s", e)


async def ai_http_error(exc: BaseException, context: str) -> HTTPException:
    """Vollen Fehler loggen, Ops informieren, freundliche HTTPException liefern."""
    reason = classify_ai_error(exc)
    logger.error("AI provider error [%s] in %s: %s", reason, context, exc)
    await note_ai_incident(reason, context, str(exc))
    return HTTPException(
        status_code=_STATUS[reason],
        detail=_MESSAGES[reason],
        headers={"X-AI-Error": reason},
    )

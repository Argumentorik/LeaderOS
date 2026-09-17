"""Tages-Mail des 30-Tage-Programms — in der App selbst ausgelöst (Iter 186).

Plan Iter 186: „Der Versand wird in der App selbst ausgelöst und gegen
Doppelversand abgesichert — kein externer Dienst nötig. Fehlt der E-Mail-Zugang
in einer Umgebung, wird das gemeldet statt still verschluckt."

Versandzeit: 7:00 deutsche Zeit (Entscheidung 7a). Der Lauf wird pro Tag in
`email_jobs` festgeschrieben; ein zweiter Prozess oder Neustart löst ihn nicht
erneut aus.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from config import db, logger

SEND_HOUR_LOCAL = 7
CHECK_INTERVAL_SECONDS = 600
JOB_NAME = "challenge_daily"


def _berlin_now() -> datetime:
    """Deutsche Zeit ohne Zusatzabhängigkeit (MESZ zwischen Ende März und Ende Oktober)."""
    now = datetime.now(timezone.utc)
    offset = 2 if 3 < now.month < 11 else 1
    if now.month == 3:
        offset = 2 if now.day >= 25 else 1
    elif now.month == 10:
        offset = 2 if now.day < 25 else 1
    return now + timedelta(hours=offset)


async def _run_once() -> None:
    local = _berlin_now()
    if local.hour < SEND_HOUR_LOCAL:
        return
    today = local.date().isoformat()
    claim = await db.email_jobs.update_one(
        {"job": JOB_NAME, "day": today},
        {"$setOnInsert": {"job": JOB_NAME, "day": today,
                          "claimed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    if claim.upserted_id is None:
        return  # heute schon gelaufen

    from routes.lifecycle_emails import send_challenge_daily

    try:
        result = await send_challenge_daily()
        await db.email_jobs.update_one({"job": JOB_NAME, "day": today}, {"$set": {"result": result}})
        logger.info("Tages-Mails 30-Tage-Programm: %s", result)
        if result.get("error"):
            logger.error("Tages-Mails nicht versandt: %s", result["error"])
    except Exception as e:
        logger.exception("Tages-Mails fehlgeschlagen: %s", e)
        await db.email_jobs.update_one({"job": JOB_NAME, "day": today}, {"$set": {"error": str(e)[:300]}})


async def challenge_mail_loop() -> None:
    """Hintergrundschleife: prüft alle 10 Minuten, ob der Tageslauf fällig ist."""
    while True:
        try:
            await _run_once()
        except Exception as e:
            logger.warning("Tages-Mail-Schleife: %s", e)
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)

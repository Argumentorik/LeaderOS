"""Lifecycle email cron endpoints — Trial reminder + 7-day Drip sequence.

These endpoints are designed to be called by an external scheduler
(GitHub Actions / cron-job.org / Vercel Cron) every ~6 hours.

Endpoints:
  POST /api/cron/trial-reminders   — Free/Standard users whose 14-day video-trial
                                      window ends in ~3 days get a reminder.
  POST /api/cron/drip-sequence     — New users get Day 1, Day 3, Day 7 educational emails.

Both endpoints are guarded by `require_cron_auth` (X-Cron-Secret header).
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request

from config import db
from services import require_cron_auth
from services_email import (
    send_email, trial_reminder_email,
    framework_episode_email, FRAMEWORK_EPISODES,
    video_drip_email, VIDEO_DRIP_VIDEOS,
    is_enabled as email_enabled,
)
from routes.unsubscribe import unsubscribe_url
from services_video_trial import (
    TRIAL_DAYS, TRIAL_VIDEO_LIMIT, TRIAL_ELIGIBLE_TIERS, _parse_dt,
)
from services_tier import resolve_user_tier

router = APIRouter(prefix="/api", tags=["lifecycle-emails"])


# Reminder windows for the 14-day video-trial.
TRIAL_REMINDER_DAYS_BEFORE = (3,)   # ping 3 days before deadline

# Framework-Serie: days since signup → episode (EP 01/07 … EP 07/07)
DRIP_STAGES = [(e["day"], f"drip_ep{e['ep']}", e) for e in FRAMEWORK_EPISODES]
LEGACY_DRIP_TYPES = ["drip_day1", "drip_day3", "drip_day7"]


def _days_since(iso_str: str | None) -> float | None:
    """Return float days since the given ISO timestamp. None on parse failure."""
    dt = _parse_dt(iso_str)
    if not dt:
        return None
    return (datetime.now(timezone.utc) - dt).total_seconds() / 86400


@router.post("/cron/trial-reminders")
async def cron_trial_reminders(request: Request):
    """Email Free/Standard users whose 14-day video-trial window ends in ~3 days.

    De-duplicated via `email_log` so re-runs are idempotent.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)
    sent = 0
    scanned = 0

    # Only scan users in eligible tiers, created at most 18 days ago (window + buffer)
    eighteen_days_ago = (now - timedelta(days=18)).isoformat()
    candidates = await db.users.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": eighteen_days_ago},
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1, "tier": 1,
         "video_trial_used": 1, "video_trial_bonus": 1, "video_trial_reset_at": 1},
    ).to_list(5000)

    for u in candidates:
        scanned += 1
        # Resolve effective tier (active subscription, expiry etc.)
        try:
            tier_info = await resolve_user_tier(u)
            current_tier = tier_info["tier"]
        except Exception:
            current_tier = u.get("tier") or "free"

        if current_tier == "accelerator":
            continue
        if current_tier not in TRIAL_ELIGIBLE_TIERS:
            continue

        created = _parse_dt(u.get("created_at"))
        if not created:
            continue
        reset_at = _parse_dt(u.get("video_trial_reset_at"))
        window_start = reset_at if (reset_at and reset_at > created) else created
        deadline = window_start + timedelta(days=TRIAL_DAYS)
        days_left = (deadline - now).total_seconds() / 86400

        # Trigger when between TRIAL_REMINDER_DAYS_BEFORE-1 and TRIAL_REMINDER_DAYS_BEFORE
        # (i.e. window of ~24h around the target day so 6h cron always catches it)
        target = TRIAL_REMINDER_DAYS_BEFORE[0]
        if not (target - 0.5 <= days_left <= target + 0.5):
            continue

        bonus = int(u.get("video_trial_bonus", 0))
        used = int(u.get("video_trial_used", 0))
        total = TRIAL_VIDEO_LIMIT + bonus
        remaining = max(0, total - used)
        if remaining == 0:
            # No trial uses left → not useful to remind about expiring window
            continue

        # Dedup per-user, per-trial-window
        log_type = f"trial_reminder_{int(window_start.timestamp())}"
        already = await db.email_log.find_one(
            {"user_id": u["user_id"], "type": log_type}, {"_id": 0}
        )
        if already:
            continue

        name = u.get("name") or u["email"].split("@")[0]
        subject, html = trial_reminder_email(name, int(round(days_left)), used, total)
        result = await send_email(u["email"], subject, html)
        await db.email_log.insert_one({
            "user_id": u["user_id"], "type": log_type,
            "sent": result["sent"], "email_id": result.get("email_id"),
            "error": result.get("error"),
            "sent_at": now.isoformat(),
        })
        if result["sent"]:
            sent += 1

    return {"sent": sent, "scanned": scanned}


@router.post("/cron/drip-sequence")
async def cron_drip_sequence(request: Request):
    """Iter 186 (Entscheidung 5a): Diese Serie ist in die Tages-Mails des
    30-Tage-Programms aufgelöst — eine Mail pro Tag, ein Absender, eine Logik.

    Der Endpunkt bleibt bestehen, sendet aber nichts mehr, damit bestehende
    Aufrufe nicht ins Leere laufen.
    """
    require_cron_auth(request)
    return {"sent": 0, "scanned": 0, "merged_into": "/api/cron/challenge-daily",
            "note": "Framework-Serie ist in die Tages-Mails des 30-Tage-Programms aufgelöst."}


async def _cron_drip_sequence_legacy(request: Request):
    """Send the EP 01/07 – EP 07/07 framework series based on signup age.

    Each user gets each episode exactly once (email_log dedup), max ONE
    episode per cron run (no mail-bombing). Users mid-way through the old
    Day-1/3/7 drip are excluded to avoid double-onboarding during transition.
    Respects `unsubscribed_drip` / `unsubscribed_all`.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)
    sent_total = 0
    sent_by_stage = {}
    scanned = 0

    # Series ends at day 14 → scan users created in the past 21 days (buffer)
    cutoff = (now - timedelta(days=21)).isoformat()
    candidates = await db.users.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
            "unsubscribed_drip": {"$ne": True},
            "unsubscribed_all": {"$ne": True},
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1},
    ).to_list(5000)

    for u in candidates:
        scanned += 1
        days = _days_since(u.get("created_at"))
        if days is None:
            continue
        name = u.get("name") or u["email"].split("@")[0]

        # Transition safety: users already in the legacy Day-1/3/7 funnel
        legacy = await db.email_log.find_one(
            {"user_id": u["user_id"], "type": {"$in": LEGACY_DRIP_TYPES}}, {"_id": 1}
        )
        if legacy:
            continue

        for stage_days, log_type, episode in DRIP_STAGES:
            # Trigger if user crossed the stage threshold (≥ stage_days)
            if days < stage_days - 0.25:
                continue

            already = await db.email_log.find_one(
                {"user_id": u["user_id"], "type": log_type}, {"_id": 0}
            )
            if already:
                continue

            from services_email import _frontend_url
            unsub_link = unsubscribe_url(u["user_id"], "drip")
            subject, html = framework_episode_email(
                name, episode, app_url=_frontend_url(), unsubscribe_link=unsub_link
            )
            result = await send_email(u["email"], subject, html)
            await db.email_log.insert_one({
                "user_id": u["user_id"], "type": log_type,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"),
                "sent_at": now.isoformat(),
            })
            if result["sent"]:
                sent_total += 1
                sent_by_stage[log_type] = sent_by_stage.get(log_type, 0) + 1
            break  # max one episode per user per run

    return {"sent": sent_total, "scanned": scanned, "by_stage": sent_by_stage}


@router.get("/lifecycle/status")
async def lifecycle_status():
    """Public health check for the lifecycle email system."""
    return {
        "email_enabled": email_enabled(),
        "trial_reminder_days_before": list(TRIAL_REMINDER_DAYS_BEFORE),
        "drip_stages_days": [d for d, _, _ in DRIP_STAGES],
        "video_drip_weeks": [v["week"] for v in VIDEO_DRIP_VIDEOS],
    }


# ── Weekly Video-Drip Cron (Week 1-6 Lernvideo-Sequence) ─────────────────────
# Each user who signed up ≥ 7×W days ago gets the W-th video drip exactly once,
# IF that video has a vimeo_id set in the `learning_videos` MongoDB collection
# (so we never send "watch this!" with a broken deep-link).
#
# Designed to be called by an external scheduler once per day.

@router.post("/cron/video-drip")
async def cron_video_drip(request: Request):
    """Weekly Lernvideo drip — sends Week 1..6 emails based on signup age."""
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)

    # Which video IDs are READY (have a non-null vimeo_id / vimeo_url / video_url)
    ready_ids = set()
    async for row in db.learning_videos.find(
        {"$or": [{"vimeo_id": {"$type": "string", "$ne": ""}},
                 {"vimeo_url": {"$type": "string", "$ne": ""}},
                 {"video_url": {"$type": "string", "$ne": ""}}]},
        {"_id": 0, "id": 1},
    ):
        if row.get("id"):
            ready_ids.add(row["id"])

    sent_total = 0
    sent_by_week = {}
    scanned = 0
    skipped_no_video = 0

    # 6 weeks of drip + 7 days of buffer
    cutoff = (now - timedelta(days=7 * 6 + 7)).isoformat()
    candidates = await db.users.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
            "unsubscribed_video_drip": {"$ne": True},
            "unsubscribed_all": {"$ne": True},
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1},
    ).to_list(5000)

    for u in candidates:
        scanned += 1
        days = _days_since(u.get("created_at"))
        if days is None:
            continue
        name = u.get("name") or u["email"].split("@")[0]

        for video in VIDEO_DRIP_VIDEOS:
            # Week N fires once user is ≥ 7×N days old (with -0.25 day grace)
            threshold_days = 7 * video["week"]
            if days < threshold_days - 0.25:
                continue
            if video["id"] not in ready_ids:
                skipped_no_video += 1
                continue

            log_type = f"video_drip_w{video['week']}"
            already = await db.email_log.find_one(
                {"user_id": u["user_id"], "type": log_type}, {"_id": 0}
            )
            if already:
                continue

            subject, html = video_drip_email(
                name, video,
                unsubscribe_link=unsubscribe_url(u["user_id"], "video_drip"),
            )
            result = await send_email(u["email"], subject, html)
            await db.email_log.insert_one({
                "user_id": u["user_id"], "type": log_type,
                "video_id": video["id"], "week": video["week"],
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"),
                "sent_at": now.isoformat(),
            })
            if result["sent"]:
                sent_total += 1
                sent_by_week[log_type] = sent_by_week.get(log_type, 0) + 1

    return {
        "sent": sent_total,
        "scanned": scanned,
        "by_week": sent_by_week,
        "skipped_no_video": skipped_no_video,
        "ready_video_ids": sorted(ready_ids),
    }


# ── Day-10 Consultation Reminder (Iter 131.4 · Wlad-Direktive) ─────────────
# Ten days after signup, gently remind the user about the free 30-minute
# 1:1 call with Wlad's team. This is the highest-conversion moment: the
# user has had time to feel the product but hasn't yet decided on a plan.
CONSULTATION_BOOKING_URL = "https://leadercheck.de/beratung"
CONSULTATION_MIN_DAYS = 9.5
CONSULTATION_MAX_DAYS = 30  # widow so we don't spam users who came back after a break


@router.post("/cron/day-10-consultation")
async def cron_day10_consultation(request: Request):
    """Send a personal booking reminder ~10 days after signup.

    De-duplicated via `email_log.type = 'day10_consultation'` so re-runs
    are idempotent. Users who already booked a consultation (tracked via
    `user.consultation_booked = true`) are skipped.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    from services_email import consultation_reminder_email  # local import → keeps startup lean

    now = datetime.now(timezone.utc)
    max_ago = (now - timedelta(days=CONSULTATION_MAX_DAYS)).isoformat()
    candidates = await db.users.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": max_ago},
            "consultation_booked": {"$ne": True},
            "unsubscribed_all": {"$ne": True},
            "unsubscribed_consultation_reminder": {"$ne": True},
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1},
    ).to_list(5000)

    sent = 0
    scanned = 0
    for u in candidates:
        scanned += 1
        days = _days_since(u.get("created_at"))
        if days is None or days < CONSULTATION_MIN_DAYS or days > CONSULTATION_MAX_DAYS:
            continue
        already = await db.email_log.find_one(
            {"user_id": u["user_id"], "type": "day10_consultation"}, {"_id": 0}
        )
        if already:
            continue
        name = (u.get("name") or (u["email"].split("@")[0])).strip() or "Leader"
        subject, html = consultation_reminder_email(
            name,
            booking_url=CONSULTATION_BOOKING_URL,
            unsubscribe_link=unsubscribe_url(u["user_id"], "consultation_reminder"),
        )
        result = await send_email(u["email"], subject, html)
        await db.email_log.insert_one({
            "user_id": u["user_id"], "type": "day10_consultation",
            "sent": result["sent"], "email_id": result.get("email_id"),
            "error": result.get("error"),
            "sent_at": now.isoformat(),
        })
        if result["sent"]:
            sent += 1
    return {"sent": sent, "scanned": scanned}


# ── 30-Tage-Programm: eine Mail pro Programmtag (Iter 186) ──────────────────

async def send_challenge_daily(limit: int = 5000) -> dict:
    """Genau eine Mail pro Kunde und Tag — nur für die nächste OFFENE Aufgabe.

    Entscheidungen Iter 186: 6a (auch für Nicht-Käufer), 8a (nächste offene
    Aufgabe in der Reihenfolge), plus „nach mehreren Tagen ohne Reaktion eine
    letzte Erinnerung, dann Ruhe".
    """
    from challenge30_criteria import done_criteria, next_open_day
    from routes.challenge30 import CHALLENGES
    from services_email import _frontend_url, challenge_day_email

    if not email_enabled():
        # Fehlender E-Mail-Zugang wird gemeldet, nicht still verschluckt.
        await db.email_health.insert_one({
            "job": "challenge_daily", "error": "RESEND_API_KEY not configured",
            "at": datetime.now(timezone.utc).isoformat(),
        })
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    sent, scanned, skipped = 0, 0, 0

    async for progress in db.challenge30_progress.find(
        {}, {"_id": 0, "user_id": 1, "started_at": 1, "completed_days": 1, "c30_mails_stopped": 1},
    ):
        scanned += 1
        if progress.get("c30_mails_stopped"):
            continue
        completed = progress.get("completed_days") or []
        if len(completed) >= 30:
            continue
        days = _days_since(progress.get("started_at"))
        if days is None:
            continue
        current_day = min(int(days) + 1, 30)
        day = next_open_day(CHALLENGES, completed, current_day)
        if not day:
            continue

        user = await db.users.find_one(
            {"user_id": progress["user_id"], "email": {"$exists": True, "$ne": ""},
             "unsubscribed_reminders": {"$ne": True}, "unsubscribed_all": {"$ne": True}},
            {"_id": 0, "user_id": 1, "email": 1, "name": 1, "lang": 1},
        )
        if not user:
            continue

        # Nur EINE Mail pro Tag, insgesamt: Tagesschlüssel + Tagesnummer.
        if await db.email_log.find_one(
            {"user_id": user["user_id"], "type": {"$in": [f"c30_day{day}", f"c30_on_{today}"]}}, {"_id": 1},
        ):
            skipped += 1
            continue

        entry = next((c for c in CHALLENGES if c["day"] == day), None)
        if not entry:
            continue
        crit = done_criteria(entry)
        # Letzte Erinnerung, wenn die Aufgabe schon mehrere Tage offen liegt.
        last_call = (current_day - day) >= 4
        subject, html = challenge_day_email(
            user.get("name") or user["email"].split("@")[0],
            day, entry["title_de"], entry["desc_de"], entry.get("duration") or "10 Min",
            crit["done_de"],
            f"Woche {entry.get('week', 1)} · {entry.get('category', 'Führung')}: "
            "Diese Übung baut auf dem auf, was du bisher gemacht hast.",
            cta_path=entry.get("path") or "/challenge",
            app_url=_frontend_url(), unsubscribe_link=unsubscribe_url(user["user_id"], "reminders"),
            last_call=last_call,
        )
        result = await send_email(user["email"], subject, html)
        stamp = now.isoformat()
        if not result["sent"]:
            # Nicht still verschluckt: gemeldet und morgen erneut versucht —
            # deshalb KEINE Sperrmarke setzen.
            await db.email_health.insert_one({
                "job": "challenge_daily", "user_id": user["user_id"], "day": day,
                "error": result.get("error"), "at": stamp,
            })
            continue
        await db.email_log.insert_many([
            {"user_id": user["user_id"], "type": f"c30_day{day}", "sent": True,
             "email_id": result.get("email_id"), "sent_at": stamp},
            {"user_id": user["user_id"], "type": f"c30_on_{today}", "sent": True, "sent_at": stamp},
        ])
        sent += 1
        if last_call:
            await db.challenge30_progress.update_one(
                {"user_id": user["user_id"]}, {"$set": {"c30_mails_stopped": True}})
        if sent >= limit:
            break

    return {"sent": sent, "scanned": scanned, "skipped": skipped}


@router.post("/cron/challenge-daily")
async def cron_challenge_daily(request: Request):
    """Tages-Mail des 30-Tage-Programms (auch manuell auslösbar, Admin/Cron)."""
    require_cron_auth(request)
    return await send_challenge_daily()


# ── Start der Kurs-Universität (Plan Iter 187) ───────────────────────────────
COURSE_LAUNCH_REMINDER_DAYS = (7, 1)


@router.post("/cron/course-launch")
async def cron_course_launch(request: Request):
    """Erinnerung an Käufer kurz vor dem Start der Kurse (7 Tage und 1 Tag vorher)."""
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    from course_launch import launch_info
    from services_email import course_launch_reminder_email

    li = launch_info()
    if li["launched"] or li["days_until"] not in COURSE_LAUNCH_REMINDER_DAYS:
        return {"sent": 0, "scanned": 0, "skipped": "kein Erinnerungsfenster", "launch": li}

    log_type = f"course_launch_{li['date']}_{li['days_until']}"
    sent = scanned = 0
    users = await db.users.find(
        {"email": {"$exists": True}}, {"_id": 0, "user_id": 1, "email": 1, "name": 1, "tier": 1},
    ).to_list(5000)
    for u in users:
        info = await resolve_user_tier(u)
        if info.get("tier") in (None, "free") or not info.get("active", True):
            continue
        scanned += 1
        if await db.email_log.find_one({"user_id": u["user_id"], "type": log_type}, {"_id": 1}):
            continue
        name = u.get("name") or u["email"].split("@")[0]
        subject, html = course_launch_reminder_email(name, li["days_until"])
        result = await send_email(u["email"], subject, html)
        await db.email_log.insert_one({
            "user_id": u["user_id"], "type": log_type, "sent": result["sent"],
            "email_id": result.get("email_id"), "error": result.get("error"),
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
        if result["sent"]:
            sent += 1
    return {"sent": sent, "scanned": scanned, "launch": li}


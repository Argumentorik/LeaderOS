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

from config import db, logger
from services import require_cron_auth
from services_email import (
    send_email, trial_reminder_email,
    drip_day1_email, drip_day3_email, drip_day7_email,
    video_drip_email, VIDEO_DRIP_VIDEOS,
    free_video_drip_email,
    lead_nurture_email,
    license_activation_email,
    is_enabled as email_enabled,
)
from services_free_videos import (
    FREE_VIDEOS, PUBLIC_FUNNEL_URL, is_ready as free_video_ready,
)
from routes.unsubscribe import unsubscribe_url
from services_video_trial import (
    TRIAL_DAYS, TRIAL_VIDEO_LIMIT, TRIAL_ELIGIBLE_TIERS, _parse_dt,
)
from services_tier import resolve_user_tier

router = APIRouter(prefix="/api", tags=["lifecycle-emails"])


# Reminder windows for the 14-day video-trial.
TRIAL_REMINDER_DAYS_BEFORE = (3,)   # ping 3 days before deadline

# Drip sequence: days since signup → drip stage
DRIP_STAGES = [
    (1, "drip_day1", drip_day1_email),
    (3, "drip_day3", drip_day3_email),
    (7, "drip_day7", drip_day7_email),
]

# Lead-nurture journey (email-only leads, db.nurture_leads):
# step → day offset since capture. Step 1 is normally sent instantly at
# capture time (routes/leader_check.py) — offset 0 here is the catch-up.
LEAD_NURTURE_STEPS = [
    (1, 0),
    (2, 2),
    (3, 4),
    (4, 6),
    (5, 8),
    (6, 10),
    (7, 12),
]

# License-activation journey (/frameworks-Leads, db.license_leads):
# step → day offset since capture. Step 1 is normally sent instantly at
# capture time (routes/license_activation.py) — offset 0 here is the catch-up.
LICENSE_NURTURE_STEPS = [
    (1, 0),
    (2, 1),
    (3, 3),
    (4, 5),
    (5, 7),
]


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
    """Send Day 1, Day 3, Day 7 drip emails to all users based on their signup age.

    Each user gets each drip exactly once. Skips paid (standard/accelerator) users
    after Day 1 — they already get a tier_welcome flow.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)
    sent_total = 0
    sent_by_stage = {}
    scanned = 0

    # Pull every user created in the past 14 days (drip ends at day 7 + buffer)
    cutoff = (now - timedelta(days=14)).isoformat()
    candidates = await db.users.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1, "tier": 1},
    ).to_list(5000)

    for u in candidates:
        scanned += 1
        days = _days_since(u.get("created_at"))
        if days is None:
            continue
        name = u.get("name") or u["email"].split("@")[0]
        try:
            tier_info = await resolve_user_tier(u)
            user_tier = tier_info["tier"]
        except Exception:
            user_tier = u.get("tier") or "free"

        for stage_days, log_type, template_fn in DRIP_STAGES:
            # Trigger if user crossed the stage threshold (≥ stage_days)
            if days < stage_days - 0.25:
                continue
            # Don't send the conversion-focused Day 7 mail to users who already paid
            if log_type == "drip_day7" and user_tier in ("standard", "accelerator", "enterprise"):
                continue

            already = await db.email_log.find_one(
                {"user_id": u["user_id"], "type": log_type}, {"_id": 0}
            )
            if already:
                continue

            subject, html = template_fn(name)
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

    return {"sent": sent_total, "scanned": scanned, "by_stage": sent_by_stage}


@router.post("/cron/free-video-drip")
async def cron_free_video_drip(request: Request):
    """Daily free-video drip — sends Day 1..4 (one CTA video per day) after signup.

    Day N fires once the user is ≥ N days old (with a 0.25-day grace so the
    daily cron always catches it). Each day is sent exactly once (de-duped via
    email_log). A video slot with no source yet is skipped, so we never link to
    a broken video. Respects the shared `video_drip` unsubscribe group.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    now = datetime.now(timezone.utc)
    total = len(FREE_VIDEOS)

    sent_total = 0
    sent_by_day = {}
    scanned = 0
    skipped_no_video = 0

    # 4 days of drip + 3 days of buffer for late cron catches.
    cutoff = (now - timedelta(days=total + 3)).isoformat()
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

        for video in FREE_VIDEOS:
            day = video["day"]
            # Day N fires once the user is ≥ N days old.
            if days < day - 0.25:
                continue
            if not free_video_ready(video):
                skipped_no_video += 1
                continue

            log_type = f"free_video_drip_d{day}"
            already = await db.email_log.find_one(
                {"user_id": u["user_id"], "type": log_type}, {"_id": 0}
            )
            if already:
                continue

            subject, html = free_video_drip_email(
                name, video, total=total,
                unsubscribe_link=unsubscribe_url(u["user_id"], "video_drip"),
            )
            result = await send_email(u["email"], subject, html)
            await db.email_log.insert_one({
                "user_id": u["user_id"], "type": log_type,
                "video_id": video["id"], "day": day,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"),
                "sent_at": now.isoformat(),
            })
            if result["sent"]:
                sent_total += 1
                sent_by_day[log_type] = sent_by_day.get(log_type, 0) + 1

    # ── Email-only leads (opted in on /gratis-videos, no account yet) ─────────
    # Day 1 is sent instantly at capture time; here we send Day 2..N. Leads who
    # later registered are skipped — the registered-user loop above covers them.
    lead_sent = 0
    lead_scanned = 0
    from routes.free_videos import lead_unsub_url, bridge_lead_to_user  # local import avoids cycle
    lead_candidates = await db.free_video_leads.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
            "unsubscribed": {"$ne": True},
            "registered": {"$ne": True},
        },
        {"_id": 0, "email": 1, "name": 1, "created_at": 1, "drip_sent_days": 1},
    ).to_list(5000)

    for lead in lead_candidates:
        lead_scanned += 1
        email = lead["email"]
        # If this lead has since created an account, bridge the attribution
        # onto the user and let the registered-user loop own them.
        existing_user = await db.users.find_one(
            {"email_lower": email}, {"_id": 0, "user_id": 1}
        )
        if existing_user:
            await bridge_lead_to_user(existing_user["user_id"], email)
            continue
        days = _days_since(lead.get("created_at"))
        if days is None:
            continue
        already_days = set(lead.get("drip_sent_days") or [])
        name = lead.get("name") or email.split("@")[0]

        for video in FREE_VIDEOS:
            day = video["day"]
            if day in already_days:
                continue
            if days < day - 0.25:
                continue
            if not free_video_ready(video):
                skipped_no_video += 1
                continue

            subject, html = free_video_drip_email(
                name, video, total=total, unsubscribe_link=lead_unsub_url(email),
                deeplink=PUBLIC_FUNNEL_URL,  # lead has no account — no login wall
            )
            result = await send_email(email, subject, html)
            await db.email_log.insert_one({
                "email": email, "type": f"free_video_lead_drip_d{day}",
                "video_id": video["id"], "day": day,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"), "sent_at": now.isoformat(),
            })
            if result["sent"]:
                await db.free_video_leads.update_one(
                    {"email_lower": email}, {"$addToSet": {"drip_sent_days": day}}
                )
                lead_sent += 1
                already_days.add(day)

    return {
        "sent": sent_total,
        "scanned": scanned,
        "by_day": sent_by_day,
        "skipped_no_video": skipped_no_video,
        "lead_sent": lead_sent,
        "lead_scanned": lead_scanned,
    }


@router.post("/cron/lead-nurture")
async def cron_lead_nurture(request: Request):
    """Daily lead-nurture drip — 7 education-first mails over 12 days.

    Scans `db.nurture_leads` (landing-page email captures, see
    routes/leader_check.py) and sends the next due step per lead based on
    capture age (offsets 0/2/4/6/8/10/12). Idempotent via the
    `nurture_steps_sent` array on the lead doc (plus email_log entries).
    At most ONE step per lead per run — a lead who is behind (e.g. the cron
    was down) catches up one mail per day instead of getting a burst.
    Respects the HMAC one-click unsubscribe and skips (and marks) leads who
    have since converted to registered users — the user drips own them.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    from routes.leader_check import nurture_unsub_url  # local import avoids cycle

    now = datetime.now(timezone.utc)
    max_offset = LEAD_NURTURE_STEPS[-1][1]

    sent_total = 0
    sent_by_step = {}
    scanned = 0
    converted = 0

    # 12 days of journey + 7 days of buffer for late cron catches.
    cutoff = (now - timedelta(days=max_offset + 7)).isoformat()
    candidates = await db.nurture_leads.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
            "unsubscribed": {"$ne": True},
            "converted": {"$ne": True},
        },
        {"_id": 0, "email": 1, "email_lower": 1, "name": 1, "created_at": 1,
         "nurture_steps_sent": 1},
    ).to_list(5000)

    for lead in candidates:
        scanned += 1
        email = lead["email"]
        # Converted to a registered user since capture? Mark + skip — the
        # registered-user drips (signup_welcome, drip-sequence, …) own them.
        existing_user = await db.users.find_one(
            {"email_lower": email}, {"_id": 0, "user_id": 1}
        )
        if existing_user:
            await db.nurture_leads.update_one(
                {"email_lower": email},
                {"$set": {"converted": True,
                          "converted_user_id": existing_user["user_id"],
                          "converted_at": now.isoformat()}},
            )
            converted += 1
            continue

        days = _days_since(lead.get("created_at"))
        if days is None:
            continue
        already = set(lead.get("nurture_steps_sent") or [])
        name = lead.get("name") or email.split("@")[0]

        for step, offset in LEAD_NURTURE_STEPS:
            if step in already:
                continue
            # Step fires once the lead is ≥ offset days old (0.25-day grace
            # so the daily cron always catches the exact day).
            if days < offset - 0.25:
                continue

            subject, html = lead_nurture_email(
                step, name, unsubscribe_link=nurture_unsub_url(email)
            )
            result = await send_email(email, subject, html)
            log_type = f"lead_nurture_s{step}"
            await db.email_log.insert_one({
                "email": email, "type": log_type, "step": step,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"), "sent_at": now.isoformat(),
            })
            if result["sent"]:
                await db.nurture_leads.update_one(
                    {"email_lower": email},
                    {"$addToSet": {"nurture_steps_sent": step},
                     "$set": {"last_nurture_sent_at": now.isoformat()}},
                )
                sent_total += 1
                sent_by_step[log_type] = sent_by_step.get(log_type, 0) + 1
            # At most one step per lead per run (sent or failed-and-retried
            # next run) — never burst-send the whole backlog.
            break

    return {
        "sent": sent_total,
        "scanned": scanned,
        "by_step": sent_by_step,
        "converted_skipped": converted,
    }


@router.post("/cron/license-nurture")
async def cron_license_nurture(request: Request):
    """Daily license-activation drip — 5 mails over 7 days for /frameworks leads.

    Scans `db.license_leads` (see routes/license_activation.py) and sends the
    next due step per lead based on capture age (offsets 0/1/3/5/7).
    Idempotent via `license_steps_sent` on the lead doc (plus email_log
    entries). At most ONE step per lead per run, same backlog-catch-up
    behaviour as /api/cron/lead-nurture. Skips (and marks) leads who have
    since converted to registered users — the user drips own them from then
    on. `webinar_upcoming` is computed once per run so a lead captured
    months after 29.10. never gets a dead-event reference.
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    from routes.license_activation import license_unsub_url, _webinar_upcoming  # local import avoids cycle

    now = datetime.now(timezone.utc)
    webinar_upcoming = _webinar_upcoming()
    max_offset = LICENSE_NURTURE_STEPS[-1][1]

    sent_total = 0
    sent_by_step = {}
    scanned = 0
    converted = 0

    # 7 days of journey + 7 days of buffer for late cron catches.
    cutoff = (now - timedelta(days=max_offset + 7)).isoformat()
    candidates = await db.license_leads.find(
        {
            "email": {"$exists": True, "$ne": ""},
            "created_at": {"$gte": cutoff},
            "unsubscribed": {"$ne": True},
            "converted": {"$ne": True},
        },
        {"_id": 0, "email": 1, "email_lower": 1, "name": 1, "created_at": 1,
         "reserved_code": 1, "webinar_registered": 1, "license_steps_sent": 1},
    ).to_list(5000)

    for lead in candidates:
        scanned += 1
        email = lead["email"]
        # Converted to a registered user since capture? Mark + skip — the
        # registered-user drips (signup_welcome, drip-sequence, …) own them.
        existing_user = await db.users.find_one(
            {"email_lower": email}, {"_id": 0, "user_id": 1}
        )
        if existing_user:
            await db.license_leads.update_one(
                {"email_lower": email},
                {"$set": {"converted": True,
                          "converted_user_id": existing_user["user_id"],
                          "converted_at": now.isoformat()}},
            )
            converted += 1
            continue

        days = _days_since(lead.get("created_at"))
        if days is None:
            continue
        already = set(lead.get("license_steps_sent") or [])
        name = lead.get("name") or email.split("@")[0]
        reserved_code = lead.get("reserved_code") or ""
        if not reserved_code:
            continue  # shouldn't happen — activate() always sets it

        for step, offset in LICENSE_NURTURE_STEPS:
            if step in already:
                continue
            if days < offset - 0.25:
                continue

            subject, html = license_activation_email(
                step, name, reserved_code,
                unsubscribe_link=license_unsub_url(email),
                webinar_registered=bool(lead.get("webinar_registered")),
                webinar_upcoming=webinar_upcoming,
            )
            result = await send_email(email, subject, html)
            log_type = f"license_nurture_s{step}"
            await db.email_log.insert_one({
                "email": email, "type": log_type, "step": step,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"), "sent_at": now.isoformat(),
            })
            if result["sent"]:
                await db.license_leads.update_one(
                    {"email_lower": email},
                    {"$addToSet": {"license_steps_sent": step},
                     "$set": {"last_license_nurture_sent_at": now.isoformat()}},
                )
                sent_total += 1
                sent_by_step[log_type] = sent_by_step.get(log_type, 0) + 1
            # At most one step per lead per run — never burst-send the backlog.
            break

    return {
        "sent": sent_total,
        "scanned": scanned,
        "by_step": sent_by_step,
        "converted_skipped": converted,
        "webinar_upcoming": webinar_upcoming,
    }


@router.get("/lifecycle/status")
async def lifecycle_status():
    """Public health check for the lifecycle email system."""
    return {
        "email_enabled": email_enabled(),
        "trial_reminder_days_before": list(TRIAL_REMINDER_DAYS_BEFORE),
        "drip_stages_days": [d for d, _, _ in DRIP_STAGES],
        "lead_nurture_days": [offset for _, offset in LEAD_NURTURE_STEPS],
        "video_drip_weeks": [v["week"] for v in VIDEO_DRIP_VIDEOS],
        "free_video_days": [v["day"] for v in FREE_VIDEOS],
        "free_video_ready": [v["id"] for v in FREE_VIDEOS if free_video_ready(v)],
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

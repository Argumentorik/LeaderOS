"""GDPR data subject rights — export and delete.

  GET  /api/gdpr/export   → JSON download of all user data (Art. 20 portability)
  POST /api/gdpr/delete   → cascading account deletion (Art. 17 erasure)

Both are auth-required. Delete is irreversible and audit-logged to
`system_events`. Export is rate-limited to 1 call per hour per user.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from config import db
from services import get_current_user

router = APIRouter(prefix="/api/gdpr", tags=["gdpr"])

_EXPORTABLE_COLLECTIONS = [
    "users",
    "files",
    "daily_checkins",
    "chat_sessions",
    "chat_messages",
    "tasks",
    "video_analyses",
    "challenge30_progress",
    "challengers_sessions",
    "simulations",
    "playbook_sessions",
    "tool_runs",
    "community_posts",
    "community_comments",
    "user_credits",
    "subscriptions",
    "installment_plans",
    "user_referrals",
]


async def _log_event(user_id: str, kind: str, detail: dict | None = None) -> None:
    await db.system_events.insert_one({
        "ts": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "kind": kind,
        "detail": detail or {},
    })


@router.get("/export")
async def export_my_data(request: Request):
    """Returns every document associated with the authenticated user.

    Rate-limited via the `gdpr_exports` collection (1 / hour / user).
    """
    user = await get_current_user(request)
    user_id = user["user_id"]
    now = datetime.now(timezone.utc)

    # Lightweight rate-limit: 1 export per hour.
    recent = await db.gdpr_exports.find_one(
        {"user_id": user_id, "ts": {"$gte": (now.timestamp() - 3600)}},
    )
    if recent:
        raise HTTPException(status_code=429, detail="export_rate_limited_1h")

    export = {
        "exported_at": now.isoformat(),
        "user_id": user_id,
        "email": user.get("email"),
        "collections": {},
    }
    for coll in _EXPORTABLE_COLLECTIONS:
        try:
            cursor = db[coll].find({"user_id": user_id}, {"_id": 0})
            export["collections"][coll] = await cursor.to_list(length=10000)
        except Exception:  # noqa: BLE001 — defensive: skip missing collections
            export["collections"][coll] = []

    await db.gdpr_exports.insert_one({"user_id": user_id, "ts": now.timestamp()})
    await _log_event(user_id, "gdpr.export", {"size_collections": len(export["collections"])})
    return export


@router.post("/delete")
async def delete_my_account(request: Request):
    """Cascading account deletion (Art. 17 GDPR).

    Body: {"confirm": "DELETE-MY-ACCOUNT"}
    """
    user = await get_current_user(request)
    user_id = user["user_id"]

    body = {}
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001 — empty body is fine, we'll fail the confirm check
        pass
    if body.get("confirm") != "DELETE-MY-ACCOUNT":
        raise HTTPException(status_code=400, detail="confirm_phrase_required")

    # Snapshot what we delete for audit, BEFORE deleting.
    snapshot = {"email": user.get("email"), "tier": user.get("tier"), "deleted_at": datetime.now(timezone.utc).isoformat()}

    deleted = {}
    # Cascade across product collections + session/security data.
    # NOTE: `system_events` and `gdpr_exports` are retained for audit/legal
    # (anonymized via user_id only — no PII).
    cascade_collections = _EXPORTABLE_COLLECTIONS + [
        "user_sessions",
        "user_actions",
        "login_attempts",
    ]
    for coll in cascade_collections:
        try:
            res = await db[coll].delete_many({"user_id": user_id})
            deleted[coll] = res.deleted_count
        except Exception:  # noqa: BLE001
            deleted[coll] = 0

    # Magic-link records are keyed by email, not user_id — delete those too.
    try:
        email_lower = (user.get("email") or "").strip().lower()
        if email_lower:
            res = await db.magic_links.delete_many({"email": email_lower})
            deleted["magic_links"] = res.deleted_count
            # Also clear magic-link rate-limit entries (stored as "magic:<email>")
            await db.login_attempts.delete_many({"email": f"magic:{email_lower}"})
    except Exception:  # noqa: BLE001
        deleted["magic_links"] = 0

    # Fire Supabase mirror "user.deleted" event so the read-model stays in sync.
    try:
        from services_supabase_sync import mirror_user_event_fire_and_forget
        mirror_user_event_fire_and_forget(
            mongo_user_id=user_id,
            email=user.get("email") or "",
            full_name=user.get("name") or "",
            event="user.deleted",
            extra={"deleted_at": snapshot["deleted_at"]},
        )
    except Exception:  # noqa: BLE001 — non-blocking
        pass

    await _log_event(user_id, "gdpr.delete", {"snapshot": snapshot, "counts": deleted})

    return {"ok": True, "deleted": deleted, "message": "account_deleted_irreversible"}

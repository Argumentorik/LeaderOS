"""scripts_delete_test_accounts.py — Purge Wlad/Argumentorik test accounts.

Run manually via:
    python /app/backend/scripts_delete_test_accounts.py

Iter 121 (User request): wipe `wj@argumentorik*` and any `wlassassa*` accounts
locally so the founders can re-run the onboarding flow with fresh state.
Removes the users doc + all downstream collections keyed by user_id / email.
"""
import asyncio
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, "/app/backend")
from config import db  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")


# Collections that store per-user rows (keyed by user_id) — best-effort wipe.
# Anything missing simply no-ops.
USER_ID_COLLECTIONS = [
    "chat_sessions", "chat_messages", "tasks", "playbooks", "wladhub_diagnoses",
    "wladhub_sync_log", "video_jobs", "user_actions", "onboarding_events",
    "leader_score_history", "daily_checkins", "voice_tts_cache",
    "community_posts", "community_comments", "community_likes",
    "referrals", "credits_ledger", "user_progress", "user_folders",
    "user_missions", "user_events", "user_settings", "email_events",
    "attribution_log", "auth_login_history",
]

EMAIL_PATTERNS = [
    re.compile(r"^wj@argumentorik\.", re.IGNORECASE),
    re.compile(r"^wlassassa", re.IGNORECASE),
]


def _matches_email(email: str) -> bool:
    if not email:
        return False
    return any(p.search(email) for p in EMAIL_PATTERNS)


async def purge():
    users_cursor = db.users.find({}, {"user_id": 1, "email": 1, "_id": 0})
    victims: list[dict] = []
    async for u in users_cursor:
        if _matches_email(u.get("email", "")):
            victims.append(u)

    if not victims:
        print("[purge] No matching accounts found — nothing to delete.")
        return

    print(f"[purge] {datetime.now(timezone.utc).isoformat()} — will remove {len(victims)} accounts:")
    for v in victims:
        print(f"  · {v.get('email')} (user_id={v.get('user_id')})")

    total_removed = {"users": 0}
    for v in victims:
        uid = v.get("user_id")
        email = (v.get("email") or "").lower()
        if not uid:
            continue

        for coll in USER_ID_COLLECTIONS:
            try:
                res = await db[coll].delete_many({"user_id": uid})
                if res.deleted_count:
                    total_removed[coll] = total_removed.get(coll, 0) + res.deleted_count
            except Exception as e:
                print(f"  ! {coll}: {e}")

        # Auxiliary collections keyed by email (best-effort)
        for coll in ("magic_link_tokens", "email_subscribers", "email_events"):
            try:
                res = await db[coll].delete_many({"email": {"$in": [email, v.get("email")]}})
                if res.deleted_count:
                    total_removed[coll] = total_removed.get(coll, 0) + res.deleted_count
            except Exception:
                pass

        # Finally: the user document itself
        u_res = await db.users.delete_one({"user_id": uid})
        total_removed["users"] += u_res.deleted_count

    print(f"[purge] Done. Summary: {total_removed}")


if __name__ == "__main__":
    asyncio.run(purge())

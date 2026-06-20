"""WladBot API v5.0 - Leadership Operating System (Modular Architecture)."""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import sys

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Sentry: opt-in via SENTRY_DSN env var. No-op when unset, so dev and CI
# environments don't need an account.
#
# Alert-threshold configuration (Iter 92.4):
#   - traces_sample_rate    = 0.10 (sample 10% of transactions for perf)
#   - profiles_sample_rate  = 0.10
#   - before_send           = filters out known noise (cancelled requests,
#                              client-disconnects, 401/404s, healthchecks)
#   - in-Sentry alert rules (configured in Sentry UI, mirrored in docs/SENTRY_ALERTS.md):
#       * P0: any 5xx error > 5 events in 1 min → PagerDuty / Email
#       * P1: any new unique issue (first-seen) → Email
#       * P1: API latency p95 > 3000ms over 5 min → Email
#       * P2: warning-level breadcrumb spike (>50 in 5 min) → Slack
_sentry_dsn = os.environ.get("SENTRY_DSN")
if _sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    # Errors / status codes we should NOT alert on (legitimate non-bugs)
    _SILENCED_STATUS_CODES = {401, 403, 404, 422, 429}
    # Common request-cancelled error classes from FastAPI/uvicorn — happen when
    # the client disconnects mid-stream (e.g. user closes browser tab during
    # /api/video/analyze upload). Not actionable bugs.
    _SILENCED_EXCEPTION_NAMES = {
        "ClientDisconnect",
        "BrokenResourceError",
        "WouldBlock",
        "ConnectionResetError",
        "asyncio.CancelledError",
        "CancelledError",
    }
    # URL paths that flood Sentry but are not user-facing
    _SILENCED_URL_PARTS = ("/api/health", "/api/lifecycle/status", "/api/rag-status")

    def _before_sentry_send(event, hint):
        """Filter callback — return None to drop the event, or `event` to send."""
        try:
            # Drop expected HTTPException status codes (client errors, not bugs)
            exc_info = hint.get("exc_info") if hint else None
            if exc_info and exc_info[1] is not None:
                exc = exc_info[1]
                exc_class = type(exc).__name__
                if exc_class in _SILENCED_EXCEPTION_NAMES:
                    return None
                status_code = getattr(exc, "status_code", None)
                if status_code in _SILENCED_STATUS_CODES:
                    return None

            # Drop health/status check noise
            req = (event.get("request") or {})
            url = req.get("url") or ""
            if any(p in url for p in _SILENCED_URL_PARTS):
                return None
        except Exception:
            # Never let the filter itself crash event delivery
            pass
        return event

    sentry_sdk.init(
        dsn=_sentry_dsn,
        environment=os.environ.get("SENTRY_ENV", "production"),
        release=os.environ.get("SENTRY_RELEASE", "wladbot@5.0"),
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
        send_default_pii=False,
        attach_stacktrace=True,
        max_breadcrumbs=50,
        before_send=_before_sentry_send,
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )

from config import client, db, logger
from middleware import RateLimitMiddleware, SecurityHeadersMiddleware

from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.tasks import router as tasks_router
from routes.simulations import router as simulations_router
from routes.playbooks import router as playbooks_router
from routes.events import router as events_router
from routes.challengers import router as challengers_router
from routes.tools import router as tools_router
from routes.video import router as video_router
from routes.checkin import router as checkin_router
from routes.dashboard import router as dashboard_router
from routes.wladhub import router as wladhub_router
from routes.uploads import router as uploads_router
from routes.payments import router as payments_router
from routes.referral import router as referral_router
from routes.enterprise import router as enterprise_router
from routes.credits import router as credits_router
from routes.challenge30 import router as challenge30_router
from routes.ki_news import router as ki_news_router
from routes.my_path import router as my_path_router
from routes.community import router as community_router
from routes.admin import router as admin_router
from routes.profile import router as profile_router
from routes.voice_tts import router as voice_tts_router
from routes.monitoring import router as monitoring_router
from routes.gdpr import router as gdpr_router
from routes.oauth import router as oauth_router
from routes.support import router as support_router
from routes.folders import router as folders_router

app = FastAPI(title="WladBot API", version="5.0")

# Include all route modules
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(chat_router)
app.include_router(tasks_router)
app.include_router(simulations_router)
app.include_router(playbooks_router)
app.include_router(events_router)
app.include_router(challengers_router)
app.include_router(tools_router)
app.include_router(video_router)
app.include_router(checkin_router)
app.include_router(dashboard_router)
app.include_router(wladhub_router)
app.include_router(uploads_router)
app.include_router(payments_router)
app.include_router(referral_router)
app.include_router(enterprise_router)
app.include_router(credits_router)
app.include_router(challenge30_router)
app.include_router(ki_news_router)
app.include_router(my_path_router)
app.include_router(community_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(voice_tts_router)
app.include_router(monitoring_router)
app.include_router(gdpr_router)
app.include_router(support_router)
app.include_router(folders_router)

# Internal sync layer (Supabase ↔ Mongo)
from routes.sync import router as sync_router  # noqa: E402
app.include_router(sync_router)

# Dynamic OG image generation (LinkedIn/X share cards)
from routes.og import router as og_router  # noqa: E402
app.include_router(og_router)

# Lifecycle email crons (trial reminders + drip sequence)
from routes.lifecycle_emails import router as lifecycle_emails_router  # noqa: E402
app.include_router(lifecycle_emails_router)

# A/B testing endpoints (variant assignment + event logging + admin results)
from routes.ab_testing import router as ab_testing_router  # noqa: E402
app.include_router(ab_testing_router)

# Email unsubscribe (HMAC-signed tokens, GDPR/CAN-SPAM compliant one-click)
from routes.unsubscribe import router as unsubscribe_router  # noqa: E402
app.include_router(unsubscribe_router)


@app.get("/api/")
async def root() -> dict[str, str]:
    return {"message": "WladBot API v5.0 - Leadership OS (Modular)"}


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/rag-status")
async def rag_health() -> dict:
    """Diagnostic: is the WladBot RAG knowledge layer wired up correctly?

    Returns config flags + cache size. Does NOT expose secret values.
    Use this after rotating Voyage/Supabase keys to verify activation.
    """
    from services_rag import rag_status
    return rag_status()


# CORS: `allow_credentials=True` (needed for httpOnly session cookie) is INCOMPATIBLE
# with `allow_origins=["*"]` per the CORS spec — browsers block credentialed requests.
# Strategy: if CORS_ORIGINS="*", use allow_origin_regex=".*" which works WITH credentials.
# Otherwise: split env list into explicit origins (production-safe).
_raw_cors = os.environ.get("CORS_ORIGINS", "").strip()
_cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
}
if _raw_cors in ("", "*"):
    # Wildcard with credentials: must use regex form
    _cors_kwargs["allow_origin_regex"] = r".*"
else:
    _cors_kwargs["allow_origins"] = [o.strip() for o in _raw_cors.split(",") if o.strip()]

app.add_middleware(CORSMiddleware, **_cors_kwargs)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)


@app.on_event("startup")
async def startup() -> None:
    try:
        from routes.uploads import init_storage
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")

    # MongoDB TTL index — auto-delete expired sessions
    try:
        from pymongo import ASCENDING
        from datetime import datetime, timezone

        # Convert existing string expires_at to datetime for TTL to work
        async for sess in db.user_sessions.find({"expires_at": {"$type": "string"}}, {"_id": 1, "expires_at": 1}):
            try:
                dt = datetime.fromisoformat(sess["expires_at"].replace("Z", "+00:00"))
                await db.user_sessions.update_one({"_id": sess["_id"]}, {"$set": {"expires_at": dt}})
            except Exception:
                pass

        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        logger.info("TTL index on user_sessions.expires_at created/verified")

        # Enterprise-grade: case-insensitive unique email index (prevents duplicate accounts)
        # First, normalize existing emails to lowercase so the index can be built cleanly
        async for user in db.users.find({"email": {"$regex": "[A-Z]"}}, {"_id": 1, "email": 1}):
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"email": user["email"].strip().lower()}})
        try:
            await db.users.create_index(
                "email", unique=True,
                collation={"locale": "en", "strength": 2},  # case-insensitive uniqueness
                name="email_unique_ci",
            )
            logger.info("Unique case-insensitive index on users.email created/verified")
        except Exception as idx_err:
            logger.warning(f"users.email unique index deferred (possible legacy dupes): {idx_err}")

        # Iter 92.24 (Mert): phone-OR-email login. Sparse unique index so users
        # without a phone (the majority pre-92.23.12) tolerate the null while
        # newly-registered users get global uniqueness on phone_normalized.
        try:
            await db.users.create_index(
                "phone_normalized", unique=True, sparse=True,
                name="phone_normalized_unique_sparse",
            )
            logger.info("Sparse unique index on users.phone_normalized created/verified")
        except Exception as idx_err:
            logger.warning(f"users.phone_normalized unique index deferred: {idx_err}")

        # Rate-limit tracking: TTL on login_attempts
        await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)
        await db.login_attempts.create_index([("email", 1), ("ip", 1)])

        # Production query indexes (leaderboard, chat history, activity log)
        await db.users.create_index([("xp", -1)])
        await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
        await db.activity_log.create_index([("user_id", 1), ("created_at", -1)])
        logger.info("Production query indexes ensured (users.xp, chat_messages.session_id, activity_log.user_id+created_at)")

        # Supabase sync events — idempotency (unique event_id) + audit trail
        await db.sync_events.create_index("event_id", unique=True, name="sync_event_id_unique")
        await db.sync_events.create_index([("direction", 1), ("received_at", -1)])
        logger.info("Sync event indexes ensured (sync_events.event_id unique)")

        # Iter 92.12: 10k-user readiness — additional hot-path indexes.
        # All idempotent (create_index is a no-op if it already exists).
        # users hot-paths
        await db.users.create_index("user_id", unique=True, name="user_id_unique", sparse=True)
        await db.users.create_index([("tier", 1), ("created_at", -1)], name="tier_signup")
        # email dedup for cron drips / lifecycle (avoids double-send)
        await db.email_log.create_index([("user_id", 1), ("type", 1)], name="email_log_user_type")
        await db.email_log.create_index("sent_at", expireAfterSeconds=60 * 60 * 24 * 365)  # auto-purge after 1y
        # ab_test_events for fast bucket-lookup
        await db.ab_test_events.create_index([("user_id", 1), ("experiment", 1)], name="ab_user_experiment")
        await db.ab_test_events.create_index([("experiment", 1), ("event", 1), ("created_at", -1)], name="ab_experiment_event_time")
        # events.start_date for calendar queries
        await db.events.create_index([("start_date", 1)], name="events_start_date")
        # chat_messages.user_id for "load my full history"
        await db.chat_messages.create_index([("user_id", 1), ("created_at", -1)], name="chat_user_recent")
        # video_attempts archive page
        await db.video_attempts.create_index([("user_id", 1), ("created_at", -1)], name="video_user_recent")
        # rate-limit auxiliary
        await db.login_attempts.create_index([("ip", 1), ("created_at", -1)], name="login_ip_recent")
        # Iter 92.15 (Mert): Community 10k-user hot-paths
        await db.community_posts.create_index([("created_at", -1)], name="community_feed_recent")
        await db.community_posts.create_index([("category", 1), ("created_at", -1)], name="community_category_recent")
        await db.community_posts.create_index([("user_id", 1), ("created_at", -1)], name="community_user_posts")
        await db.community_comments.create_index([("post_id", 1), ("created_at", 1)], name="community_post_comments")
        await db.community_comments.create_index([("user_id", 1), ("created_at", -1)], name="community_user_comments")
        # Support / WladHelp ticket archive (only if/when synthesized)
        await db.support_messages.create_index([("user_id", 1), ("created_at", -1)], name="support_user_recent")
        logger.info("10k-user scaling indexes ensured (email_log, ab_test_events, events, chat_messages, video_attempts, login_attempts.ip, community, support_messages)")

        # Magic-link TTL — auto-cleanup expired tokens
        from services_magic_link import ensure_indexes as ensure_magic_link_indexes
        await ensure_magic_link_indexes()
        logger.info("Magic-link indexes ensured (TTL on expires_at)")

        # Migrate old level names to new role-based names
        level_migration = {
            "Emerging Leader": "Teamplayer",
            "Leader": "Mentor",
            "Senior Leader": "Kommunikator",
            "Executive": "Strategischer Denker",
            "Visionary": "Visionär",
            "Die Mandela-Klasse": "Teamplayer",
            "Die Drucker-Klasse": "Mentor",
            "Die Jobs-Klasse": "Kommunikator",
            "Die Bezos-Klasse": "Strategischer Denker",
            "Die Musk-Klasse": "Visionär",
        }
        for old, new in level_migration.items():
            result = await db.users.update_many({"level": old}, {"$set": {"level": new}})
            if result.modified_count:
                logger.info(f"Migrated {result.modified_count} users from '{old}' to '{new}'")

    except Exception as e:
        logger.warning(f"TTL index creation deferred: {e}")


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()

"""Monitoring-test endpoint — fires 1 Sentry event + 1 PostHog event on demand.

Admin-only. Use during launch to confirm both observability pipelines are live
before the first real user hits the app.

  curl -b cookie -X POST https://leaderos.de/api/monitoring/test
  # → 200 with {sentry_event_id, posthog_dispatched, dsn_present, ph_key_present}
"""
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException

from services import get_current_user

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

async def _require_admin(user: dict) -> None:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="admin_only")


@router.post("/test")
async def fire_test_events(request: Request):
    """Triggers a synthetic Sentry message + PostHog event, then reports outcomes."""
    user = await get_current_user(request)
    await _require_admin(user)

    sentry_dsn = os.environ.get("SENTRY_DSN", "")
    ph_key = os.environ.get("POSTHOG_KEY") or os.environ.get("POSTHOG_API_KEY", "")
    ph_host = os.environ.get("POSTHOG_HOST", "https://eu.i.posthog.com")

    sentry_event_id = None
    sentry_error = None
    posthog_dispatched = False
    posthog_error = None

    # --- Sentry test message ---------------------------------------------------
    if sentry_dsn:
        try:
            import sentry_sdk
            sentry_event_id = sentry_sdk.capture_message(
                f"[launch-day-test] monitoring/test from {user.get('email')} "
                f"at {datetime.now(timezone.utc).isoformat()}",
                level="info",
            )
        except Exception as e:  # noqa: BLE001 — intentional broad catch for monitoring path
            sentry_error = f"{type(e).__name__}: {e}"

    # --- PostHog test event ----------------------------------------------------
    if ph_key:
        try:
            from posthog import Posthog
            ph = Posthog(project_api_key=ph_key, host=ph_host)
            ph.capture(
                distinct_id=user.get("user_id") or user.get("email") or "unknown",
                event="launch_day_smoke_test",
                properties={
                    "email": user.get("email"),
                    "tier": user.get("tier"),
                    "ts": datetime.now(timezone.utc).isoformat(),
                },
            )
            ph.flush()
            posthog_dispatched = True
        except ImportError:
            posthog_error = "posthog package not installed"
        except Exception as e:  # noqa: BLE001
            posthog_error = f"{type(e).__name__}: {e}"

    return {
        "ok": True,
        "user": user.get("email"),
        "sentry": {
            "dsn_present": bool(sentry_dsn),
            "event_id": sentry_event_id,
            "error": sentry_error,
        },
        "posthog": {
            "key_present": bool(ph_key),
            "host": ph_host,
            "dispatched": posthog_dispatched,
            "error": posthog_error,
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def monitoring_health(request: Request):
    """Reports which observability tools are configured. No auth — safe metadata only."""
    return {
        "sentry": bool(os.environ.get("SENTRY_DSN")),
        "posthog": bool(os.environ.get("POSTHOG_KEY") or os.environ.get("POSTHOG_API_KEY")),
        "env": os.environ.get("SENTRY_ENV", "preview"),
    }


@router.get("/system")
async def system_health():
    """Provider-Status für alle Backend-Subsysteme (LLM, STT, Stripe,
    Storage, Supabase, Sentry). Nennt nur Provider-Namen, keine Keys —
    sicher öffentlich.
    """
    from lib.system_health import collect
    return collect()

"""OAuth provider sign-in routes — direct Google, Apple, Microsoft integration.

Each provider follows the same pattern:
  1. Frontend obtains an ID token via the provider's official SDK
  2. Frontend POSTs the ID token to /api/auth/{provider}/callback
  3. Backend verifies the signature against the provider's JWKS
  4. Backend finds/creates the user (linked by email), issues our session cookie

We DO NOT redirect from the backend — all OAuth flows are token-based
(One-Tap / Sign In with Apple JS / MSAL.js on the frontend).
"""
from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from config import db
from services import create_jwt_token
from services_actions import record_user_action
from services_oauth import (
    available_providers,
    verify_google_id_token,
    verify_apple_id_token,
    verify_microsoft_id_token,
)

logger = logging.getLogger("wladbot.oauth_routes")

router = APIRouter(prefix="/api/auth", tags=["oauth"])


# ────────────────────────────────────────────────────────────────────────────
# Provider discovery
# ────────────────────────────────────────────────────────────────────────────

@router.get("/providers")
async def list_providers():
    """Tells the frontend which sign-in buttons to render. Public endpoint.

    Also returns the public Client IDs needed by the JS SDKs (Client IDs are
    NOT secrets; they're embedded in the OAuth redirect anyway).
    """
    import os
    from services_oauth import google_client_id
    return {
        "providers": available_providers(),
        "google_client_id": google_client_id() or "",
        "apple_service_id": os.environ.get("APPLE_SERVICE_ID") or os.environ.get("APPLE_CLIENT_ID") or "",
        "microsoft_client_id": os.environ.get("MICROSOFT_CLIENT_ID") or "",
        "microsoft_tenant": os.environ.get("MICROSOFT_TENANT", "common"),
    }


# ────────────────────────────────────────────────────────────────────────────
# Shared user upsert + session issuance
# ────────────────────────────────────────────────────────────────────────────

async def _upsert_user_from_oauth(profile: dict, request: Request) -> dict:
    """Find user by email or create a new one. Link the provider sub-id."""
    # Lazy imports to avoid circular dep with routes/auth.py
    from routes.auth import (
        _capture_login_context,
        _login_history_entry,
        fire_and_forget_new_device_alert,
    )

    email = profile["email"]
    provider = profile["provider"]
    ctx = await _capture_login_context(request)
    history_entry = _login_history_entry(ctx, method=provider)
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        # Link the provider sub-id idempotently
        oauth_map = existing.get("oauth_providers") or {}
        oauth_map[provider] = {"sub": profile["sub"], "linked_at": now_iso}

        # Backfill name/picture only if currently empty (don't overwrite user edits)
        set_doc = {
            "oauth_providers": oauth_map,
            "last_login_ip": ctx["ip"],
            "last_login_at": history_entry["at"],
            "last_login_geo": ctx["geo"],
            "last_login_ua": ctx["ua"],
            "last_login_provider": provider,
        }
        if not existing.get("name") and profile.get("name"):
            set_doc["name"] = profile["name"]
        if not existing.get("picture") and profile.get("picture"):
            set_doc["picture"] = profile["picture"]

        await db.users.update_one({"user_id": existing["user_id"]}, {
            "$set": set_doc,
            "$push": {"login_history": {"$each": [history_entry], "$slice": -50}},
        })

        fire_and_forget_new_device_alert(
            user_email=email,
            user_name=existing.get("name") or profile.get("name") or "",
            ip=ctx["ip"],
            ua_parsed=ctx["ua"],
            geo=ctx["geo"],
            fingerprint=ctx["fingerprint"],
            login_history=(existing.get("login_history") or []) + [history_entry],
            method=provider,
        )

        user = await db.users.find_one({"user_id": existing["user_id"]}, {"_id": 0})
        return user

    # New user — create
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    # Iter 92.24 (Mert): tag funnel-of-origin for cross-platform attribution.
    from routes.auth import detect_source_platform
    source_platform = detect_source_platform(request)
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": profile.get("name") or email.split("@")[0],
        "picture": profile.get("picture") or None,
        "position": "",
        "company": "",
        "industry": "",
        "leadership_score": 0,
        "eq_score": 0,
        "communication_score": 0,
        "level": "Emerging Leader",
        "xp": 0,
        "premium": False,
        "source_platform": source_platform,
        "oauth_providers": {provider: {"sub": profile["sub"], "linked_at": now_iso}},
        "last_login_provider": provider,
        "signup_ip": ctx["ip"],
        "signup_geo": ctx["geo"],
        "signup_ua": ctx["ua"],
        "last_login_ip": ctx["ip"],
        "last_login_geo": ctx["geo"],
        "last_login_ua": ctx["ua"],
        "login_history": [history_entry],
        "created_at": now_iso,
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)

    # Mirror to Supabase
    try:
        from services_supabase_sync import mirror_user_event_fire_and_forget
        mirror_user_event_fire_and_forget(
            mongo_user_id=user_id,
            email=email,
            full_name=user_doc["name"],
            event="user.created",
            extra={"auth_method": provider},
            source_platform=source_platform,
        )
    except Exception as e:
        logger.warning("Supabase mirror failed (non-blocking): %s", e)

    await record_user_action(user_id, f"register_{provider}")

    # Welcome email for new OAuth user (fire-and-forget)
    try:
        import asyncio as _asyncio
        from routes.auth import _send_signup_welcome
        _asyncio.create_task(_send_signup_welcome(email, user_doc["name"]))
    except Exception as e:
        logger.warning("OAuth welcome email scheduling failed: %s", e)

    return user_doc


async def _issue_session(user: dict, request: Request, response: Response, method: str) -> dict:
    """Create JWT + session cookie and return the standard {token, user} payload."""
    from routes.auth import _create_session, _safe_user_output, _get_client_ip
    token = create_jwt_token(user["user_id"])
    await _create_session(user["user_id"], _get_client_ip(request), response, method=method)
    return {"token": token, "user": _safe_user_output(user)}


# ────────────────────────────────────────────────────────────────────────────
# Google /callback
# ────────────────────────────────────────────────────────────────────────────

class GoogleCallback(BaseModel):
    credential: str  # The ID token returned by Google Identity Services


@router.post("/google/callback")
async def google_callback(data: GoogleCallback, request: Request, response: Response):
    """Verify a Google ID token + log the user in (or create a new account)."""
    try:
        profile = verify_google_id_token(data.credential)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Google sign-in failed: {e}")
    except Exception as e:
        logger.exception("Unexpected Google verification error")
        raise HTTPException(status_code=500, detail=f"Sign-in error: {type(e).__name__}")

    user = await _upsert_user_from_oauth(profile, request)
    return await _issue_session(user, request, response, method="google")


# ────────────────────────────────────────────────────────────────────────────
# Apple /callback
# ────────────────────────────────────────────────────────────────────────────

class AppleCallback(BaseModel):
    identity_token: str
    user: dict | None = None  # Apple returns this only on the FIRST sign-in


@router.post("/apple/callback")
async def apple_callback(data: AppleCallback, request: Request, response: Response):
    try:
        profile = verify_apple_id_token(data.identity_token, user_payload=data.user)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Apple sign-in failed: {e}")
    except Exception as e:
        logger.exception("Unexpected Apple verification error")
        raise HTTPException(status_code=500, detail=f"Sign-in error: {type(e).__name__}")

    user = await _upsert_user_from_oauth(profile, request)
    return await _issue_session(user, request, response, method="apple")


# ────────────────────────────────────────────────────────────────────────────
# Microsoft /callback
# ────────────────────────────────────────────────────────────────────────────

class MicrosoftCallback(BaseModel):
    id_token: str


@router.post("/microsoft/callback")
async def microsoft_callback(data: MicrosoftCallback, request: Request, response: Response):
    try:
        profile = verify_microsoft_id_token(data.id_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Microsoft sign-in failed: {e}")
    except Exception as e:
        logger.exception("Unexpected Microsoft verification error")
        raise HTTPException(status_code=500, detail=f"Sign-in error: {type(e).__name__}")

    user = await _upsert_user_from_oauth(profile, request)
    return await _issue_session(user, request, response, method="microsoft")

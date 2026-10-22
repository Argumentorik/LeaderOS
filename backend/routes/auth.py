"""Authentication routes — Enterprise-grade security."""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError
import uuid
import httpx
import jwt
from datetime import datetime, timezone, timedelta

from config import db, OAUTH_SESSION_URL, logger
from models import UserRegister, UserLogin, normalize_phone, looks_like_phone, phone_candidates
from services import (
    JWT_SECRET, bump_token_version, create_jwt_token, hash_password, validate_password_strength, verify_password, get_current_user,
)
from services_actions import record_user_action
from services_login_security import (
    parse_user_agent,
    device_fingerprint,
    get_client_ip,
    lookup_geo,
    fire_and_forget_new_device_alert,
    fire_and_forget_not_me_alert,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def detect_source_platform(request: Request) -> str:
    """Iter 92.24 (Mert): detect funnel-of-origin for cross-platform attribution.

    Both `leadercheck.de`/`leadercheck.de` (anonymous diagnostic funnel) and
    `leaderos.de`/`leaderos.de` (authenticated coaching app) run from this
    backend. The funnel-of-origin is needed by the Supabase `users.source_platform`
    column ('leader-check' | 'leader-os' | 'manual') for first-touch attribution.

    Looks at Origin → Referer → Host (in that order). Defaults to 'leader-os'
    because that's the auth app and the dominant entry path.
    """
    sources = [
        request.headers.get("origin", ""),
        request.headers.get("referer", ""),
        request.headers.get("host", ""),
    ]
    blob = " ".join(sources).lower()
    if "leader-check" in blob or "leadercheck" in blob:
        return "leader-check"
    return "leader-os"


def _frontend_url_for(request: Request) -> str:
    from services_email import _frontend_url
    return _frontend_url(request)


async def _send_signup_welcome(email: str, name: str, app_url: str = "") -> None:
    """Send the post-signup welcome email. Silently no-ops if Resend isn't configured."""
    try:
        from services_email import send_email, signup_welcome_email, is_enabled, _frontend_url
        if not is_enabled() or not email:
            return
        # Dedup: don't send the same welcome twice if signup race / replays
        already = await db.email_log.find_one(
            {"user_email": email, "type": "signup_welcome"}, {"_id": 0}
        )
        if already:
            return
        # Iter 92.27: respect per-deploy FRONTEND_BASE_URL env so emails from the
        # leadercheck.de Vercel project link to leadercheck.de, leaderos.de project → leaderos.de.
        subject, html = signup_welcome_email(name or email.split("@")[0], app_url=app_url or _frontend_url())
        r = await send_email(email, subject, html)
        await db.email_log.insert_one({
            "user_email": email, "type": "signup_welcome",
            "sent": r["sent"], "email_id": r.get("email_id"),
            "error": r.get("error"),
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning("Signup welcome email failed for %s: %s", email, e)


# Cookie config — shared across all endpoints for consistency
COOKIE_CONFIG = {
    "key": "session_token",
    "httponly": True,
    "samesite": "lax",
    "secure": True,
    "max_age": 30 * 24 * 3600,  # 30 days — stay logged in
    "path": "/",
}

# Brute-force protection: max failed logins per (email, ip) combo per window
MAX_FAILED_ATTEMPTS = 10
ATTEMPT_WINDOW_MINUTES = 15


async def _check_rate_limit(email: str, ip: str) -> None:
    """Raise 429 if too many failed login attempts in the window."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=ATTEMPT_WINDOW_MINUTES)
    count = await db.login_attempts.count_documents({
        "email": email,
        "ip": ip,
        "created_at": {"$gte": cutoff},
        "success": False,
    })
    if count >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Zu viele fehlgeschlagene Login-Versuche. Bitte warte 15 Minuten oder nutze Passwort-Reset."
        )


async def _log_login_attempt(email: str, ip: str, success: bool) -> None:
    """Record a login attempt for rate-limiting analysis."""
    now = datetime.now(timezone.utc)
    await db.login_attempts.insert_one({
        "email": email,
        "ip": ip,
        "success": success,
        "created_at": now,
        "expires_at": now + timedelta(hours=24),  # auto-cleanup via TTL
    })


async def _create_session(user_id: str, ip_address: str, response: Response, method: str = "email") -> str:
    """Create a server-side session, set cookie, and clean up old sessions."""
    session_token = f"sess_{uuid.uuid4().hex}"

    # SEC-001: Late-seed admin flag for allowlisted emails (ADMIN_SEED_EMAILS).
    # The allowlist is an ELIGIBILITY list, not proof of ownership — admin is
    # granted ONLY once the mailbox is proven (email_verified via magic link or a
    # provider-validated OAuth email). An unverified password register/login can
    # never self-promote by claiming a founder address. `admin_revoked` always wins.
    from routes.admin import ADMIN_SEED_EMAILS
    seed_emails = [e.lower() for e in ADMIN_SEED_EMAILS]
    await db.users.update_one(
        {"user_id": user_id, "is_admin": {"$ne": True}, "admin_revoked": {"$ne": True},
         "email_verified": True,
         "$or": [{"email_lower": {"$in": seed_emails}}, {"email": {"$in": seed_emails}}]},
        {"$set": {"is_admin": True}},
    )

    # Limit sessions per user to 10 (prevents session table bloat)
    existing = await db.user_sessions.find(
        {"user_id": user_id}, {"_id": 1}
    ).sort("created_at", 1).to_list(50)
    if len(existing) >= 10:
        oldest_ids = [s["_id"] for s in existing[:len(existing) - 9]]
        await db.user_sessions.delete_many({"_id": {"$in": oldest_ids}})

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "ip_address": ip_address,
        "method": method,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(value=session_token, **COOKIE_CONFIG)
    return session_token


def _get_client_ip(request: Request) -> str:
    """Echte Client-IP vom vertrauenswürdigen Proxy-Hop (siehe services_login_security.get_client_ip)."""
    return get_client_ip(request)


async def _capture_login_context(request: Request) -> dict:
    """Gather full login context: IP, UA, geo, device fingerprint.

    Geo lookup runs concurrently with a hard timeout — never blocks login >2.5s.
    Returns a dict ready to be stored in user.login_history[].
    """
    ip = _get_client_ip(request)
    ua_parsed = parse_user_agent(request.headers.get("user-agent", ""))
    geo = await lookup_geo(ip)
    fingerprint = device_fingerprint(ip, ua_parsed)
    return {
        "ip": ip,
        "at": datetime.now(timezone.utc).isoformat(),
        "ua": ua_parsed,
        "geo": geo,
        "fingerprint": fingerprint,
    }


def _login_history_entry(ctx: dict, method: str) -> dict:
    """Shape a login_history record (flat, queryable)."""
    return {
        "ip": ctx["ip"],
        "at": ctx["at"],
        "method": method,
        "browser": ctx["ua"].get("browser", ""),
        "os": ctx["ua"].get("os", ""),
        "device_type": ctx["ua"].get("device_type", ""),
        "city": ctx["geo"].get("city", ""),
        "country_code": ctx["geo"].get("country_code", ""),
        "fingerprint": ctx["fingerprint"],
    }


def _safe_user_output(user: dict) -> dict:
    """Strip sensitive fields from user document before sending to client.

    Computes `is_admin` server-side from the trusted DB flag only (SEC-003).
    """
    is_admin = bool(user.get("is_admin"))
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "_id", "login_history", "signup_ip", "last_login_ip")}
    safe["is_admin"] = is_admin
    return safe


# ========== REGISTER ==========

@router.post("/register")
async def register(data: UserRegister, request: Request, response: Response):
    # Abuse guard (pre-launch review): max 40 signups per IP per hour.
    # Iter 178: von 15 → 40 erhöht. Firmen-NAT und Mobilfunk-Carrier teilen eine
    # IP; beim Launch hätten echte Anmeldungen sonst 429 bekommen. Duplicate-
    # Checks auf E-Mail/Telefon bleiben die eigentliche Missbrauchsbremse.
    ip = _get_client_ip(request)
    reg_cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    reg_count = await db.users.count_documents({"signup_ip": ip, "created_at_dt": {"$gte": reg_cutoff}})
    if reg_count >= 40:
        raise HTTPException(status_code=429, detail="Zu viele Registrierungen von dieser IP. Bitte versuche es später erneut.")
    # Normalize email (case-insensitive uniqueness)
    email = data.email.strip().lower()
    # SEC (audit): enforce a minimum password strength so no more weak/guessable
    # accounts (e.g. "test123") can be created. Existing accounts are unaffected.
    validate_password_strength(data.password)
    ctx = await _capture_login_context(request)
    ip_address = ctx["ip"]

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    history_entry = _login_history_entry(ctx, method="register")
    # Iter 92.24: normalize phone + dedupe globally (sparse unique index in server.py).
    phone_raw = (data.phone or "").strip() or None
    phone_normalized = normalize_phone(phone_raw)
    if phone_normalized:
        existing_phone = await db.users.find_one(
            {"phone_normalized": {"$in": phone_candidates(phone_raw)}},
            {"_id": 0, "user_id": 1},
        )
        if existing_phone:
            raise HTTPException(status_code=400, detail="Telefonnummer ist bereits registriert")

    source_platform = detect_source_platform(request)
    from models import clean_attribution
    user_doc = {
        "user_id": user_id,
        "email": email,
        # Iter 120: ad/campaign attribution (utm_*, gclid …) — first/last touch
        "attribution": clean_attribution(data.attribution),
        "name": data.name.strip(),
        # Iter 92.23.12: optional phone (Cal.com coaching call confirmations only).
        # Iter 92.24: phone is now ALSO a login identifier — `phone_normalized`
        # (E.164-ish) is the queryable key, `phone` keeps the user's original
        # display formatting for receipts/confirmations.
        "phone": phone_raw,
        "password_hash": hash_password(data.password),
        "picture": None,
        "position": "",
        "company": "",
        "industry": "",
        "leadership_score": 0,
        "eq_score": 0,
        "communication_score": 0,
        "level": "Emerging Leader",
        "xp": 0,
        "premium": False,
        # Iter 92.24: first-touch attribution — never overwritten on subsequent
        # logins. Matches the Supabase `users.source_platform` enum.
        "source_platform": source_platform,
        "signup_ip": ip_address,
        "signup_geo": ctx["geo"],
        "signup_ua": ctx["ua"],
        "last_login_ip": ip_address,
        "last_login_geo": ctx["geo"],
        "last_login_ua": ctx["ua"],
        "login_history": [history_entry],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_at_dt": datetime.now(timezone.utc),
    }
    # Sparse unique index on phone_normalized only ignores DOCS WITHOUT the field;
    # explicit nulls still conflict. Only attach the field when we have a real value.
    if phone_normalized:
        user_doc["phone_normalized"] = phone_normalized
    try:
        await db.users.insert_one(user_doc)
    except DuplicateKeyError as dup:
        # Race-safe: unique indexes catch parallel duplicate registrations.
        # Detect which constraint fired so we can return a precise message.
        msg = str(dup).lower()
        if "phone" in msg:
            raise HTTPException(status_code=400, detail="Telefonnummer ist bereits registriert")
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        logger.error(f"Register insert failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed — please try again")

    token = create_jwt_token(user_id)
    await _create_session(user_id, ip_address, response, method="register")
    await record_user_action(user_id, "register")

    # Mirror to Supabase (fire-and-forget — does not block response)
    from services_supabase_sync import mirror_user_event_fire_and_forget
    mirror_user_event_fire_and_forget(
        mongo_user_id=user_id,
        email=email,
        full_name=data.name.strip(),
        event="user.created",
        source_platform=source_platform,
    )

    # Auto-sync leadercheck.de diagnosis if user already exists in Supabase
    # leadership_insights table by email (fire-and-forget — does not block signup).
    import asyncio as _asyncio
    from services_wladhub_autosync import auto_sync_wladhub_on_signup
    _asyncio.create_task(auto_sync_wladhub_on_signup(user_id=user_id, email=email))

    # Welcome email (fire-and-forget — non-blocking)
    _asyncio.create_task(_send_signup_welcome(email, data.name.strip(), _frontend_url_for(request)))

    # Iter 92.18: CRM webhook — fire to Wingman (or whatever CRM is wired up)
    try:
        import services_crm
        services_crm.signup(user_doc, source="register_form")
    except Exception as crm_err:
        logger.debug(f"CRM signup emit failed (non-blocking): {crm_err}")

    # JWT token kept for backwards-compat API consumers; frontend uses httpOnly cookie only
    return {"token": token, "user": _safe_user_output(user_doc)}


# ========== LOGIN ==========

def _maybe_autosync_wladhub(user: dict) -> None:
    """Pull the leadercheck.de diagnosis on login.

    Iter 135 (Audit): re-checks at most every 6h per user instead of "only
    until the first diagnosis exists" — otherwise a RE-taken diagnose on
    leadercheck.de would never reach Leader-OS.
    """
    if not user.get("email"):
        return
    last = user.get("wladhub_last_check")
    if last:
        try:
            from datetime import datetime as _dt
            age_h = (datetime.now(timezone.utc) - _dt.fromisoformat(last)).total_seconds() / 3600
            if age_h < 6:
                return
        except Exception:
            pass
    import asyncio as _asyncio
    from services_wladhub_autosync import auto_sync_wladhub_on_signup
    _asyncio.create_task(auto_sync_wladhub_on_signup(user_id=user["user_id"], email=user["email"]))


def _maybe_reconcile_payments(user: dict) -> None:
    """Iter 135: activate a payment the buyer never saw confirmed (expired
    session during checkout). No-op when there is nothing pending."""
    import asyncio as _asyncio
    from routes.payments import reconcile_pending_payments
    _asyncio.create_task(reconcile_pending_payments(user["user_id"]))


@router.post("/login")
async def login(data: UserLogin, request: Request, response: Response):
    # Iter 92.24 (Mert): accept EITHER email OR phone as login identifier.
    # `identifier` is coalesced server-side in UserLogin.model_validator.
    identifier_raw = (data.identifier or "").strip()
    ctx = await _capture_login_context(request)
    ip_address = ctx["ip"]

    # Detect identifier type → build appropriate Mongo query
    if looks_like_phone(identifier_raw):
        phone_normalized = normalize_phone(identifier_raw)
        candidates = phone_candidates(identifier_raw)
        rate_key = f"phone:{phone_normalized or identifier_raw.lower()}"
        user_query = {"phone_normalized": {"$in": candidates}} if candidates else None
        method = "phone"
    else:
        email = identifier_raw.lower()
        rate_key = email
        user_query = {"email": email}
        method = "email"

    # Enterprise: brute-force protection (keyed on normalized identifier + IP)
    await _check_rate_limit(rate_key, ip_address)

    user = await db.users.find_one(user_query, {"_id": 0}) if user_query else None
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        await _log_login_attempt(rate_key, ip_address, success=False)
        # Generic message — never confirms which identifier exists (enumeration-safe)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # email below references the actual stored email — even when login was via phone
    email = user.get("email", "")
    await _log_login_attempt(rate_key, ip_address, success=True)
    history_entry = _login_history_entry(ctx, method=method)
    await db.users.update_one({"user_id": user["user_id"]}, {
        "$set": {
            "last_login_ip": ip_address,
            "last_login_at": history_entry["at"],
            "last_login_geo": ctx["geo"],
            "last_login_ua": ctx["ua"],
        },
        "$push": {"login_history": {"$each": [history_entry], "$slice": -50}}
    })

    # New-device alert (fire-and-forget — never delays login response)
    fire_and_forget_new_device_alert(
        user_email=email,
        user_name=user.get("name") or "",
        ip=ip_address,
        ua_parsed=ctx["ua"],
        geo=ctx["geo"],
        fingerprint=ctx["fingerprint"],
        login_history=(user.get("login_history") or []) + [history_entry],
        method=method,
    )

    token = create_jwt_token(user["user_id"], user.get("token_version", 1))
    await _create_session(user["user_id"], ip_address, response, method=method)
    _maybe_autosync_wladhub(user)
    _maybe_reconcile_payments(user)

    return {"token": token, "user": _safe_user_output(user)}


# ========== GOOGLE AUTH ==========

@router.post("/google-session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    # Guard against missing OAuth config — fail with a friendly 503 instead
    # of a Python TypeError that swamps the logs.
    if not OAUTH_SESSION_URL:
        raise HTTPException(
            status_code=503,
            detail="Google login is not configured on this environment. Use email/password.",
        )

    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(OAUTH_SESSION_URL, headers={"X-Session-ID": session_id})
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        google_data = resp.json()

    email = google_data["email"]
    ctx = await _capture_login_context(request)
    ip_address = ctx["ip"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    history_entry = _login_history_entry(ctx, method="google")
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {
            "$set": {
                "name": google_data.get("name", existing.get("name")),
                "picture": google_data.get("picture", existing.get("picture")),
                "last_login_ip": ip_address,
                "last_login_at": history_entry["at"],
                "last_login_geo": ctx["geo"],
                "last_login_ua": ctx["ua"],
                # SEC-001: Google asserts a verified email → proves ownership.
                "email_verified": True,
                "email_verified_via": "google",
            },
            "$push": {"login_history": {"$each": [history_entry], "$slice": -50}}
        })
        sync_event = "user.updated"
        _maybe_autosync_wladhub(existing)
        _maybe_reconcile_payments(existing)
        # New-device email for existing Google user
        fire_and_forget_new_device_alert(
            user_email=email,
            user_name=existing.get("name") or "",
            ip=ip_address,
            ua_parsed=ctx["ua"],
            geo=ctx["geo"],
            fingerprint=ctx["fingerprint"],
            login_history=(existing.get("login_history") or []) + [history_entry],
            method="google",
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        source_platform = detect_source_platform(request)
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": google_data.get("name", "User"),
            "picture": google_data.get("picture"), "leadership_score": 0, "eq_score": 0,
            "communication_score": 0, "level": "Emerging Leader", "xp": 0,
            "source_platform": source_platform,
            # SEC-001: Google asserts a verified email → proves ownership.
            "email_verified": True, "email_verified_via": "google",
            "signup_ip": ip_address, "signup_geo": ctx["geo"], "signup_ua": ctx["ua"],
            "last_login_ip": ip_address, "last_login_geo": ctx["geo"], "last_login_ua": ctx["ua"],
            "login_history": [history_entry],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        sync_event = "user.created"
        # Autosync leadercheck.de diagnosis for Google signups too (Iter 92.62 —
        # was only wired for classic register before).
        import asyncio as _asyncio
        from services_wladhub_autosync import auto_sync_wladhub_on_signup
        _asyncio.create_task(auto_sync_wladhub_on_signup(user_id=user_id, email=email))
        # Fire welcome email for new Google user (fire-and-forget)
        _asyncio.create_task(_send_signup_welcome(email, google_data.get("name") or email.split("@")[0], _frontend_url_for(request)))

    # Generate a real JWT token (not the session_token)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = create_jwt_token(user_id, (user or {}).get("token_version", 1))
    await _create_session(user_id, ip_address, response, method="google")


    # Mirror to Supabase (fire-and-forget)
    from services_supabase_sync import mirror_user_event_fire_and_forget
    mirror_user_event_fire_and_forget(
        mongo_user_id=user_id,
        email=email,
        full_name=user.get("name") or "",
        event=sync_event,
        extra={"auth_method": "google"},
        source_platform=user.get("source_platform") or detect_source_platform(request),
    )

    return {"user": _safe_user_output(user), "token": token}


# ========== SESSION MANAGEMENT ==========

@router.get("/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return _safe_user_output(user)


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Refresh an expiring JWT token. Extends the current session instead of
    creating a new one (avoids evicting sessions on other devices)."""
    user = await get_current_user(request)
    token = create_jwt_token(user["user_id"], user.get("token_version", 1))

    existing_token = request.cookies.get("session_token")
    session = None
    if existing_token:
        session = await db.user_sessions.find_one({"session_token": existing_token}, {"_id": 1})
    if session:
        await db.user_sessions.update_one(
            {"session_token": existing_token},
            {"$set": {"expires_at": datetime.now(timezone.utc) + timedelta(days=30)}},
        )
        response.set_cookie(value=existing_token, **COOKIE_CONFIG)
    else:
        ip_address = _get_client_ip(request)
        await _create_session(user["user_id"], ip_address, response, method="refresh")
    return {"token": token, "user": _safe_user_output(user)}


# ── (Iter 92.33 GDPR DELETE /me was removed — duplicate of existing routes/gdpr.py) ──


@router.get("/company-context")
async def get_company_context(request: Request):
    user = await get_current_user(request)
    return user.get("company_context", {
        "team_size": "", "branche": "", "challenges": "",
        "goals": "", "people_notes": "", "ai_tasks_enabled": True,
    })


# ========== PROFILE ==========

VALID_RATING_MODES = {"soft", "hard"}
VALID_RATING_LEVELS = {"einsteiger", "fortgeschritten", "executive"}
VALID_RATING_FOCUS = {"klarheit", "empathie", "struktur", "ueberzeugungskraft"}
VALID_RATING_AUDIENCE = {"team", "board", "kunden", "investoren", "allgemein"}
COMPANY_CONTEXT_FIELDS = ("team_size", "branche", "challenges", "goals", "people_notes", "ai_tasks_enabled")


def _sanitize_rating_preferences(rp: dict) -> dict:
    sanitized = {}
    if rp.get("mode") in VALID_RATING_MODES:
        sanitized["mode"] = rp["mode"]
    if rp.get("level") in VALID_RATING_LEVELS:
        sanitized["level"] = rp["level"]
    if isinstance(rp.get("focus"), list):
        sanitized["focus"] = [f for f in rp["focus"] if f in VALID_RATING_FOCUS]
    if rp.get("audience") in VALID_RATING_AUDIENCE:
        sanitized["audience"] = rp["audience"]
    return sanitized


def _sanitize_company_context(cc: dict) -> dict:
    return {field: cc[field] for field in COMPANY_CONTEXT_FIELDS if field in cc}


@router.put("/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    allowed = {"name", "position", "company", "industry", "rating_preferences", "company_context", "phone"}
    updates = {k: v for k, v in body.items() if k in allowed and v is not None}

    if "rating_preferences" in updates:
        updates["rating_preferences"] = _sanitize_rating_preferences(updates["rating_preferences"])
    if "company_context" in updates:
        updates["company_context"] = _sanitize_company_context(updates["company_context"])
    if "phone" in updates:
        # Same validator semantics as UserRegister.phone — silently drop garbage.
        phone_val = str(updates["phone"]).strip()
        if not phone_val:
            updates["phone"] = None
            updates["phone_normalized"] = None
        else:
            import re
            if 5 <= len(phone_val) <= 32 and re.match(r"^[+()\d\s\-./]+$", phone_val):
                updates["phone"] = phone_val
                # Iter 92.24: keep phone_normalized in sync for phone-login lookups.
                phone_norm = normalize_phone(phone_val)
                if phone_norm:
                    # Conflict check — another user already owns this phone
                    other = await db.users.find_one(
                        {"phone_normalized": phone_norm, "user_id": {"$ne": user["user_id"]}},
                        {"_id": 0, "user_id": 1},
                    )
                    if other:
                        raise HTTPException(status_code=400, detail="Telefonnummer ist bereits einem anderen Konto zugeordnet")
                updates["phone_normalized"] = phone_norm
            else:
                updates.pop("phone", None)

    # Iter 92.24: handle phone_normalized via $unset when null (sparse index quirk).
    unset = {}
    if "phone" in updates and updates.get("phone") is None:
        unset["phone_normalized"] = ""
        updates.pop("phone_normalized", None)

    if updates or unset:
        mongo_op = {}
        if updates:
            mongo_op["$set"] = updates
        if unset:
            mongo_op["$unset"] = unset
        await db.users.update_one({"user_id": user["user_id"]}, mongo_op)
    user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return _safe_user_output(user)


# ========== LOGOUT ==========

@router.post("/logout")
async def logout(request: Request, response: Response):
    # Delete session from cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0, "user_id": 1})
        await db.user_sessions.delete_one({"session_token": session_token})
        if session:
            await bump_token_version(session["user_id"])

    # Also try to invalidate JWT-based session
    bearer = request.headers.get("Authorization", "")
    if bearer.startswith("Bearer "):
        token = bearer.split(" ")[1]
        # If token matches a session, delete it too
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            await db.user_sessions.delete_one({"session_token": token})
            await bump_token_version(session["user_id"])
        else:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], leeway=10)
                await bump_token_version(payload["user_id"])
            except jwt.InvalidTokenError:
                pass

    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}



# ── Password change (authenticated) ───────────────────────────────────────

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/password/change")
async def change_password(data: PasswordChangeRequest, request: Request):
    """Authenticated user changes their own password.

    Requires current password to prevent CSRF/session-hijack lateral attacks.
    Invalidates all OTHER sessions on success (keeps current cookie alive).
    """
    user = await get_current_user(request)

    validate_password_strength(data.new_password)
    if data.new_password == data.current_password:
        raise HTTPException(status_code=400, detail="Neues Passwort darf nicht identisch zum aktuellen sein.")

    full_user = await db.users.find_one({"user_id": user["user_id"]}, {"password_hash": 1, "_id": 0})
    if not full_user or not verify_password(data.current_password, full_user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Aktuelles Passwort ist falsch.")

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "password_hash": hash_password(data.new_password),
            "password_changed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    # Invalidate OTHER sessions (everywhere except current cookie/JWT)
    current_token = request.cookies.get("session_token") or ""
    bearer = request.headers.get("Authorization", "")
    if bearer.startswith("Bearer "):
        current_token = current_token or bearer.split(" ", 1)[1]
    if current_token:
        await db.user_sessions.delete_many({
            "user_id": user["user_id"],
            "session_token": {"$ne": current_token},
        })
    else:
        await db.user_sessions.delete_many({"user_id": user["user_id"]})
    await bump_token_version(user["user_id"])

    return {"message": "Passwort erfolgreich geändert."}


# ========== MAGIC LINK (passwordless) ==========

class MagicLinkRequest(BaseModel):
    # Iter 92.49: plain str (not EmailStr) — email-validator rejects reserved
    # TLDs (.test) with 422, leaking structural info. Endpoint is already
    # anti-enumeration: unknown/invalid emails silently no-op with 200.
    email: str


class MagicLinkVerify(BaseModel):
    token: str


@router.post("/magic-link/request")
async def magic_link_request(data: MagicLinkRequest, request: Request):
    """Request a passwordless login link via email.

    Always returns 200 with the same generic message — never confirms whether
    the email exists (prevents email enumeration attacks). Rate-limited by IP
    to prevent abuse.
    """
    from services_magic_link import create_token, send_magic_link_email

    email = data.email.strip().lower()
    ip = _get_client_ip(request)

    # Iter 92.31 (Mert pre-launch hardening): tightened rate-limit per
    # Pre-Launch-Checkliste — magic-link is the most-abused passwordless
    # surface, so we cap at:
    #   (1) 3 emails per HOUR per (email, ip) combo
    #   (2) 10 emails per HOUR per IP across ALL emails (anti-spray)
    # Both rules emit identical "Zu viele Anfragen" so we never leak which
    # one tripped — preserves email-enumeration safety.
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)

    # Rule 1: same email + ip
    same_pair = await db.login_attempts.count_documents({
        "email": f"magic:{email}",
        "ip": ip,
        "created_at": {"$gte": one_hour_ago},
    })
    if same_pair >= 3:
        raise HTTPException(status_code=429, detail="Zu viele Magic-Link-Anfragen. Bitte warte 1 Stunde.")

    # Rule 2: same ip across all magic-link emails (anti-spray / bot)
    # Iter 178: 10 → 30 pro IP/Stunde (Firmen-NAT / Mobilfunk teilen IPs).
    any_email_same_ip = await db.login_attempts.count_documents({
        "email": {"$regex": "^magic:"},
        "ip": ip,
        "created_at": {"$gte": one_hour_ago},
    })
    if any_email_same_ip >= 30:
        raise HTTPException(status_code=429, detail="Zu viele Magic-Link-Anfragen. Bitte warte 1 Stunde.")

    await db.login_attempts.insert_one({
        "email": f"magic:{email}",
        "ip": ip,
        "success": True,
        "created_at": now,
        "expires_at": now + timedelta(hours=2),  # TTL — auto-purge old entries
    })

    token = await create_token(email, ip)
    if token:
        from services_email import _frontend_url
        await send_magic_link_email(email, token, base_url=_frontend_url(request))

    return {"message": "Falls die E-Mail in unserem System existiert, haben wir dir einen Login-Link geschickt. Bitte prüfe dein Postfach."}


@router.post("/magic-link/verify")
async def magic_link_verify(data: MagicLinkVerify, request: Request, response: Response):
    """Exchange a magic-link token for a session. Token is single-use."""
    from services_magic_link import consume_token

    user = await consume_token(data.token)
    if not user:
        raise HTTPException(status_code=401, detail="Link ist ungültig, abgelaufen oder wurde bereits verwendet.")

    ctx = await _capture_login_context(request)
    history_entry = _login_history_entry(ctx, method="magic_link")
    await db.users.update_one({"user_id": user["user_id"]}, {
        "$set": {
            "last_login_ip": ctx["ip"],
            "last_login_at": history_entry["at"],
            "last_login_geo": ctx["geo"],
            "last_login_ua": ctx["ua"],
        },
        "$push": {"login_history": {"$each": [history_entry], "$slice": -50}}
    })

    fire_and_forget_new_device_alert(
        user_email=user["email"],
        user_name=user.get("name") or "",
        ip=ctx["ip"],
        ua_parsed=ctx["ua"],
        geo=ctx["geo"],
        fingerprint=ctx["fingerprint"],
        login_history=(user.get("login_history") or []) + [history_entry],
        method="magic_link",
    )

    token = create_jwt_token(user["user_id"], user.get("token_version", 1))
    await _create_session(user["user_id"], ctx["ip"], response, method="magic_link")
    _maybe_autosync_wladhub(user)
    _maybe_reconcile_payments(user)
    return {"token": token, "user": _safe_user_output(user)}


# ========== SECURITY / SESSIONS (authenticated) ==========

@router.get("/security/overview")
async def security_overview(request: Request):
    """Return login history + active sessions for the current user (Profile › Security)."""
    user = await get_current_user(request)
    full = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "login_history": 1, "last_login_at": 1, "last_login_geo": 1,
         "last_login_ua": 1, "signup_ip": 1, "signup_geo": 1, "created_at": 1,
         "password_changed_at": 1, "security_ack_at": 1},
    ) or {}

    # Last 20 entries (newest first) — backfill missing fields for old entries
    all_history = full.get("login_history") or []
    raw = list(reversed(all_history[-20:]))
    history = [
        {
            "ip": h.get("ip") or "",
            "at": h.get("at") or "",
            "method": h.get("method") or "email",
            "browser": h.get("browser") or "",
            "os": h.get("os") or "",
            "device_type": h.get("device_type") or "",
            "city": h.get("city") or "",
            "country_code": h.get("country_code") or "",
            "fingerprint": h.get("fingerprint") or "",
        }
        for h in raw
    ]

    # Active sessions (server-side cookie sessions)
    current_cookie = request.cookies.get("session_token") or ""
    sessions_cursor = db.user_sessions.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "session_token": 1, "created_at": 1, "ip_address": 1, "method": 1, "expires_at": 1},
    ).sort("created_at", -1)
    sessions = []
    async for s in sessions_cursor:
        is_current = s.get("session_token") == current_cookie
        sessions.append({
            "id": (s.get("session_token") or "")[-12:],  # last 12 chars as opaque id
            "created_at": s.get("created_at"),
            "expires_at": s.get("expires_at"),
            "ip": s.get("ip_address") or "",
            "method": s.get("method") or "",
            "is_current": is_current,
        })

    current_fp = device_fingerprint(_get_client_ip(request), parse_user_agent(request.headers.get("user-agent", "")))
    return {
        "login_history": history,
        "sessions": sessions,
        "new_devices": _new_device_logins(all_history, current_fp, full.get("security_ack_at") or ""),
        "signup": {
            "at": full.get("created_at"),
            "ip": full.get("signup_ip"),
            "geo": full.get("signup_geo") or {},
        },
        "password_changed_at": full.get("password_changed_at"),
    }


@router.post("/security/revoke-other-sessions")
async def revoke_other_sessions(request: Request):
    """Log out all other devices (keep current session alive)."""
    user = await get_current_user(request)
    current_cookie = request.cookies.get("session_token") or ""
    bearer = request.headers.get("Authorization", "")
    if bearer.startswith("Bearer "):
        current_cookie = current_cookie or bearer.split(" ", 1)[1]

    query = {"user_id": user["user_id"]}
    if current_cookie:
        query["session_token"] = {"$ne": current_cookie}
    result = await db.user_sessions.delete_many(query)
    await bump_token_version(user["user_id"])
    return {"revoked": result.deleted_count}


def _new_device_logins(history: list, current_fp: str, ack_at: str, days: int = 14) -> list:
    """Logins der letzten `days` Tage von zuvor unbekannten Geräten — ohne das aktuelle Gerät
    und ohne bereits bestätigte („Das war ich“) Einträge."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    seen: set[str] = set()
    out = []
    for h in history:
        fp = h.get("fingerprint") or ""
        first_time = fp not in seen
        seen.add(fp)
        if not first_time or not fp or fp == current_fp:
            continue
        if (h.get("at") or "") <= max(cutoff, ack_at or ""):
            continue
        out.append(h)
    return list(reversed(out))[:3]


@router.post("/security/acknowledge")
async def security_acknowledge(request: Request):
    """„Das war ich“ — blendet die Neues-Gerät-Warnung für alle bisherigen Logins aus."""
    user = await get_current_user(request)
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"security_ack_at": now}})
    return {"acknowledged_at": now}


@router.post("/security/not-me")
async def security_not_me(request: Request):
    """„Das war ich nicht“ — alle anderen Geräte abmelden, alle Tokens widerrufen, Warnung quittieren."""
    user = await get_current_user(request)
    current_cookie = request.cookies.get("session_token") or ""
    query = {"user_id": user["user_id"]}
    if current_cookie:
        query["session_token"] = {"$ne": current_cookie}
    revoked_sessions = await db.user_sessions.find(
        query, {"_id": 0, "created_at": 1, "ip_address": 1, "method": 1}).sort("created_at", -1).to_list(50)
    result = await db.user_sessions.delete_many(query)
    await bump_token_version(user["user_id"])
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"user_id": user["user_id"]},
                              {"$set": {"security_ack_at": now, "security_incident_at": now}})
    logger.warning("SECURITY not-me reported by %s (%d sessions revoked)", user["user_id"], result.deleted_count)
    current_fp = device_fingerprint(_get_client_ip(request), parse_user_agent(request.headers.get("user-agent", "")))
    fire_and_forget_not_me_alert(
        user_email=user["email"],
        user_name=user.get("name") or "",
        sessions=[{"created_at": s.get("created_at"), "ip": s.get("ip_address"), "method": s.get("method")} for s in revoked_sessions],
        suspicious=_new_device_logins(user.get("login_history") or [], current_fp, user.get("security_ack_at") or ""),
    )
    return {"revoked": result.deleted_count, "has_password": bool(user.get("password_hash")),
            "next": "change_password", "email_sent_to": user["email"]}

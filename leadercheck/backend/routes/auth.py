from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import logging
import asyncio

from models import UserCreate
from services.security import (
    create_otp, verify_otp,
    issue_report_token, issue_sync_token, verify_sync_token,
    verify_report_token, escape_for_email,
)

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_user(db, request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        return None
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def create_session(db, user_id: str, response: Response) -> str:
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60
    )
    return session_token


# --------- OTP helpers (module level, testable in isolation) ---------

def mask_email(email: str) -> str:
    if "@" not in (email or ""):
        return email or ""
    name, dom = email.split("@", 1)
    if len(name) <= 2:
        return f"{name[:1]}***@{dom}"
    return f"{name[:2]}***@{dom}"


def _otp_email_html(code: str) -> str:
    return f"""
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px">
  <div style="display:inline-block;padding:6px 12px;background:#C8FF00;color:#0a0a0a;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:24px">Leader · OS</div>
  <h1 style="font-size:24px;font-weight:800;margin:0 0 12px 0">Dein Login-Code</h1>
  <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px 0">Gib diesen Code auf der Login-Seite ein, um dich einzuloggen. Er läuft in <strong style="color:#fff">10 Minuten</strong> ab.</p>
  <div style="font-size:38px;font-weight:800;letter-spacing:0.35em;background:#141414;color:#C8FF00;padding:20px 24px;border-radius:12px;text-align:center;border:1px solid #C8FF00">{code}</div>
  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0 0">Hast du dich nicht angemeldet? Ignoriere diese Mail · dein Account bleibt sicher.</p>
</div>"""


async def send_otp_email(config: dict, to_email: str, code: str) -> bool:
    """Send the 6-digit OTP via Resend. Non-blocking failure → returns False."""
    if not config.get("resend_key"):
        logger.warning("[otp] Resend key not configured — OTP not sent")
        return False
    try:
        import resend
        safe_to = escape_for_email(to_email, 254)
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Leader OS <{config.get('sender_email', 'no-reply@leaderos.de')}>",
            "to": [safe_to],
            "subject": f"{code} · Dein Leader-OS Login-Code",
            "html": _otp_email_html(code),
        })
        return True
    except Exception as e:  # noqa: BLE001
        logger.error(f"[otp] send failed: {e}")
        return False


def parse_login_email(payload: dict) -> str:
    """Validate and normalize the email from an OTP request payload."""
    raw = (payload or {}).get("identifier") or (payload or {}).get("email")
    if not isinstance(raw, str):
        raise HTTPException(status_code=400, detail="Identifier must be a string")
    email = raw.strip().lower()
    if not email or "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Invalid email")
    return email


async def request_otp_for_email(db, config: dict, email: str) -> dict:
    """Generate + send an OTP only if the account exists (enumeration-resistant)."""
    user = await db.users.find_one({"email": email}, {"_id": 0, "email": 1})
    if user:
        code = await create_otp(db, email)
        await send_otp_email(config, email, code)
    return {"status": "otp_sent_if_registered", "masked_email": mask_email(email)}


async def verify_otp_and_login(db, payload: dict, response: Response) -> dict:
    """Verify email + code, create a session and return the login payload."""
    raw_email = (payload or {}).get("identifier") or (payload or {}).get("email")
    raw_code = (payload or {}).get("code")
    if not isinstance(raw_email, str) or not isinstance(raw_code, str):
        raise HTTPException(status_code=400, detail="Email + code required as strings")
    email = raw_email.strip().lower()
    code = raw_code.strip()
    if not (email and code):
        raise HTTPException(status_code=400, detail="Missing fields")

    ok = await verify_otp(db, email, code)
    if not ok:
        raise HTTPException(status_code=401, detail="Falscher Code oder abgelaufen")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    user_id = user.get("user_id") or user.get("session_id")
    session_token = await create_session(db, user_id, response)

    # Also issue a report_token so the /report page can be loaded post-login
    report = await db.reports.find_one(
        {"$or": [{"session_id": user.get("session_id")}, {"session_id": user_id}]},
        {"_id": 0, "session_id": 1},
    )
    report_token = issue_report_token(report["session_id"], email) if report else ""

    return {
        "session_id": user.get("session_id") or user_id,
        "user_id": user_id,
        "name": user.get("name"),
        "email": email,
        "has_report": bool(report),
        "report_token": report_token,
        "session_token": session_token,
    }


async def build_sync_token_response(db, request: Request) -> dict:
    """Short-lived sync_token for landing → Leader-OS product handoff."""
    user = await get_current_user(db, request)
    if user:
        sid = user.get("session_id") or user.get("user_id")
        return {"sync_token": issue_sync_token(sid, user.get("email", "")), "email": user.get("email")}
    # Fallback: allow via report_token in Authorization header
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_report_token(token)
    return {"sync_token": issue_sync_token(payload["sid"], payload.get("email", "")), "email": payload.get("email")}


async def apply_profile_update(db, user: dict, data: dict) -> dict:
    update_fields = {k: data[k] for k in ("role", "custom_role", "consent_privacy", "consent_marketing") if k in data}
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})


PRIVACY_POLICY = {
    "title": "Datenschutzerklärung", "last_updated": "2025-01-01",
    "content": {
        "data_collection": "Wir erheben Name, E-Mail und Diagnose-Antworten.",
        "data_usage": "Daten werden zur Erstellung deines Leadership-Reports verwendet.",
        "data_storage": "Daten werden sicher auf EU-Servern gespeichert.",
        "data_deletion": "Du kannst jederzeit die Löschung deiner Daten anfordern.",
        "cookies": "Wir verwenden notwendige Session-Cookies für die Authentifizierung.",
        "third_parties": "Wir teilen keine Daten mit Dritten ohne deine Zustimmung.",
        "contact": "Datenschutz-Anfragen: datenschutz@leaderos.de"
    }
}


def register_auth_routes(router: APIRouter, db, config: Optional[dict] = None, limiter=None):
    config = config or {}

    def _rl(spec: str):
        return limiter.limit(spec) if limiter else (lambda fn: fn)

    @router.get("/auth/me")
    async def get_me(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user

    @router.post("/auth/logout")
    async def logout(request: Request, response: Response):
        session_token = request.cookies.get("session_token")
        if session_token:
            await db.user_sessions.delete_one({"session_token": session_token})
        response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
        return {"message": "Logged out"}

    @router.post("/auth/update-profile")
    async def update_profile(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        data = await request.json()
        return await apply_profile_update(db, user, data)

    @router.get("/privacy-policy")
    async def privacy_policy():
        return PRIVACY_POLICY

    @router.delete("/user/delete-data")
    async def delete_user_data(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user_id = user["user_id"]
        await db.users.delete_one({"user_id": user_id})
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.reports.delete_many({"session_id": user_id})
        return {"message": "All your data has been deleted"}

    # ─── Passwordless OTP login (SEC-002 fix) ─────────────────────────────
    @router.post("/auth/quick-login/request")
    @_rl("5/minute")
    async def quick_login_request(request: Request, payload: dict):
        """Step 1 · email → OTP. Same 200 shape whether the account exists or not."""
        email = parse_login_email(payload)
        return await request_otp_for_email(db, config, email)

    @router.post("/auth/quick-login/verify")
    @_rl("10/minute")
    async def quick_login_verify(request: Request, response: Response, payload: dict):
        """Step 2 · email + 6-digit code → session cookie + report_token."""
        return await verify_otp_and_login(db, payload, response)

    # Legacy endpoint kept for backward compat — returns ONLY a masked email
    # confirmation, no personal data. New clients use /request + /verify.
    @router.post("/auth/quick-login")
    @_rl("5/minute")
    async def quick_login_legacy(request: Request, payload: dict):
        raw = (payload or {}).get("identifier")
        if not isinstance(raw, str):
            raise HTTPException(status_code=400, detail="Identifier must be a string")
        email_candidate = raw.strip().lower() if "@" in raw else ""
        result = {"status": "otp_sent_if_registered", "masked_email": mask_email(email_candidate),
                  "message": "Wir haben dir einen Login-Code an deine E-Mail geschickt."}
        if email_candidate:
            await request_otp_for_email(db, config, email_candidate)
        return result

    # ─── Leader-OS product handoff (Sync) ─────────────────────────────────
    @router.post("/auth/leader-os-sync")
    async def leader_os_sync(request: Request):
        return await build_sync_token_response(db, request)

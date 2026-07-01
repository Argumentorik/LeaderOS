from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import httpx
import logging
import asyncio

from models import AuthSession, UserCreate
from services.security import (
    create_otp, verify_otp,
    issue_report_token, issue_sync_token, verify_sync_token,
    escape_for_email,
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


async def fetch_auth_data(session_id: str):
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        return resp.json()


async def upsert_user(db, auth_data: dict) -> str:
    email = (auth_data.get("email") or "").lower().strip()
    name = auth_data.get("name")
    picture = auth_data.get("picture", "")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user.get("user_id") or existing_user.get("session_id")
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": None, "consent_privacy": True, "consent_marketing": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return user_id


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


def register_auth_routes(router: APIRouter, db, config: Optional[dict] = None, limiter=None):
    config = config or {}

    def _rl(spec: str):
        if limiter:
            return limiter.limit(spec)
        return lambda fn: fn

    def _mask_email(email: str) -> str:
        if "@" not in (email or ""):
            return email or ""
        name, dom = email.split("@", 1)
        if len(name) <= 2:
            return f"{name[:1]}***@{dom}"
        return f"{name[:2]}***@{dom}"

    async def _send_otp_email(to_email: str, code: str) -> bool:
        """Send the 6-digit OTP via Resend. Non-blocking failure → returns False."""
        if not config.get("resend_key"):
            logger.warning("[otp] Resend key not configured — OTP not sent")
            return False
        try:
            import resend
            safe_to = escape_for_email(to_email, 254)
            html = f"""
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px">
  <div style="display:inline-block;padding:6px 12px;background:#C8FF00;color:#0a0a0a;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:24px">Leader · OS</div>
  <h1 style="font-size:24px;font-weight:800;margin:0 0 12px 0">Dein Login-Code</h1>
  <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px 0">Gib diesen Code auf der Login-Seite ein, um dich einzuloggen. Er läuft in <strong style="color:#fff">10 Minuten</strong> ab.</p>
  <div style="font-size:38px;font-weight:800;letter-spacing:0.35em;background:#141414;color:#C8FF00;padding:20px 24px;border-radius:12px;text-align:center;border:1px solid #C8FF00">{code}</div>
  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0 0">Hast du dich nicht angemeldet? Ignoriere diese Mail · dein Account bleibt sicher.</p>
</div>"""
            await asyncio.to_thread(resend.Emails.send, {
                "from": f"Leader OS <{config.get('sender_email', 'no-reply@leaderos.de')}>",
                "to": [safe_to],
                "subject": f"{code} · Dein Leader-OS Login-Code",
                "html": html,
            })
            return True
        except Exception as e:  # noqa: BLE001
            logger.error(f"[otp] send failed: {e}")
            return False

    @router.post("/auth/session")
    async def exchange_session(data: AuthSession, response: Response):
        try:
            auth_data = await fetch_auth_data(data.session_id)
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
        user_id = await upsert_user(db, auth_data)
        await create_session(db, user_id, response)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return user

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
        update_fields = {}
        for field in ("role", "custom_role", "consent_privacy", "consent_marketing"):
            if field in data:
                update_fields[field] = data[field]
        if update_fields:
            update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
        return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})

    @router.get("/privacy-policy")
    async def privacy_policy():
        return {
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
        """Step 1 · user submits email → we generate a 6-digit OTP + email it.
        Always returns 200 with the SAME shape whether the email exists or
        not (prevents account enumeration). Rate-limited to 5/minute per IP.
        """
        raw = (payload or {}).get("identifier") or (payload or {}).get("email")
        if not isinstance(raw, str):
            raise HTTPException(status_code=400, detail="Identifier must be a string")
        email = raw.strip().lower()
        if not email or "@" not in email or len(email) > 254:
            raise HTTPException(status_code=400, detail="Invalid email")

        user = await db.users.find_one({"email": email}, {"_id": 0, "email": 1})
        # Only generate + send if the user exists — but respond with same
        # shape either way. This is enumeration-resistant.
        if user:
            code = await create_otp(db, email)
            await _send_otp_email(email, code)
        return {"status": "otp_sent_if_registered", "masked_email": _mask_email(email)}

    @router.post("/auth/quick-login/verify")
    @_rl("10/minute")
    async def quick_login_verify(request: Request, response: Response, payload: dict):
        """Step 2 · user submits email + 6-digit code → we verify and issue a
        real session cookie + report_token for the resume flow.
        """
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
        report_token = ""
        if report:
            report_token = issue_report_token(report["session_id"], email)

        return {
            "session_id": user.get("session_id") or user_id,
            "user_id": user_id,
            "name": user.get("name"),
            "email": email,
            "has_report": bool(report),
            "report_token": report_token,
            "session_token": session_token,
        }

    # Legacy endpoint kept for backward compat — now returns ONLY a masked
    # email confirmation, no personal data. Old clients still get 200 but no
    # session-id leak. New clients should use /request + /verify above.
    @router.post("/auth/quick-login")
    @_rl("5/minute")
    async def quick_login_legacy(request: Request, payload: dict):
        raw = (payload or {}).get("identifier")
        if not isinstance(raw, str):
            raise HTTPException(status_code=400, detail="Identifier must be a string")
        email_candidate = raw.strip().lower() if "@" in raw else ""
        if email_candidate:
            user = await db.users.find_one({"email": email_candidate}, {"_id": 0, "email": 1})
            if user:
                code = await create_otp(db, email_candidate)
                await _send_otp_email(email_candidate, code)
        return {
            "status": "otp_sent_if_registered",
            "masked_email": _mask_email(email_candidate),
            "message": "Wir haben dir einen Login-Code an deine E-Mail geschickt.",
        }

    # ─── Leader-OS product handoff (Sync) ─────────────────────────────────
    @router.post("/auth/leader-os-sync")
    async def leader_os_sync(request: Request):
        """Return a short-lived sync_token (10min) for the logged-in user.
        The Leader-OS product exchanges this token for its own session, so
        the user seamlessly hands off from landing → product.
        Requires either a session cookie OR a valid report_token bearer.
        """
        user = await get_current_user(db, request)
        if user:
            sid = user.get("session_id") or user.get("user_id")
            return {"sync_token": issue_sync_token(sid, user.get("email", "")), "email": user.get("email")}
        # Fallback: allow via report_token in Authorization header
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        from services.security import verify_report_token
        payload = verify_report_token(token)
        return {"sync_token": issue_sync_token(payload["sid"], payload.get("email", "")), "email": payload.get("email")}

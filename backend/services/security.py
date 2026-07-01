"""Central security service for Leader-OS.

Provides:
- Report JWT (issue on quiz-submit / verify on report-read + Leader-OS handoff)
- OTP send/verify for passwordless login (Resend-based, 6 digit, 10 min TTL)
- Rate-limit helpers (slowapi) with correct client-IP resolution (last hop, not
  spoofable first `X-Forwarded-For` entry)
- HTML-escape utility for user-supplied fields going into emails

Design rules
-------------
1. `REPORT_JWT_SECRET`, `ADMIN_JWT_SECRET` MUST come from env — no in-source
   defaults, no runtime auto-generation. If missing, startup fails fast.
2. Tokens are short-scoped (`aud="report"` vs `aud="leader_os_sync"`) so a
   stolen report-token cannot be replayed for account actions.
3. OTP is single-use, marked `consumed=True` on verify.
"""
from __future__ import annotations

import os
import html as html_lib
import hmac
import hashlib
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Any

import jwt as pyjwt
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


# ─── JWT · Report + Sync tokens ────────────────────────────────────────────

REPORT_JWT_SECRET = os.environ.get("REPORT_JWT_SECRET", "")
ADMIN_JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

JWT_ALG = "HS256"
REPORT_TOKEN_TTL_DAYS = 30
SYNC_TOKEN_TTL_MINUTES = 10  # short-lived handoff to Leader OS product


def _require_secret(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(
            f"Missing env var {name} — set it in backend/.env before starting. "
            "Security service refuses to sign tokens with an empty secret."
        )
    return value


def issue_report_token(session_id: str, email: str) -> str:
    """Bind a quiz submission to its owner via a signed 30-day JWT.
    The Report page + Leader-OS handoff both require this token to prove
    ownership. Signed with REPORT_JWT_SECRET."""
    secret = _require_secret("REPORT_JWT_SECRET", REPORT_JWT_SECRET)
    now = datetime.now(timezone.utc)
    payload = {
        "sid": session_id,
        "email": (email or "").lower(),
        "aud": "report",
        "iss": "leader-os",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=REPORT_TOKEN_TTL_DAYS)).timestamp()),
    }
    return pyjwt.encode(payload, secret, algorithm=JWT_ALG)


def verify_report_token(token: str, expected_sid: Optional[str] = None) -> dict:
    """Return decoded payload · raises HTTPException(401) on any failure.

    If `expected_sid` is given, additionally enforces that the token's `sid`
    matches (prevents replaying token-A on report-B)."""
    if not token:
        raise HTTPException(status_code=401, detail="Missing report token")
    secret = _require_secret("REPORT_JWT_SECRET", REPORT_JWT_SECRET)
    try:
        payload = pyjwt.decode(token, secret, algorithms=[JWT_ALG], audience="report")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Report token expired · request a new link")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid report token")
    if expected_sid and payload.get("sid") != expected_sid:
        raise HTTPException(status_code=403, detail="Token/session mismatch")
    return payload


def issue_sync_token(session_id: str, email: str) -> str:
    """10-min token used to hand the user off from landing → Leader OS product.
    Different `aud` so a leaked sync token cannot read reports."""
    secret = _require_secret("REPORT_JWT_SECRET", REPORT_JWT_SECRET)
    now = datetime.now(timezone.utc)
    payload = {
        "sid": session_id, "email": (email or "").lower(),
        "aud": "leader_os_sync", "iss": "leader-os",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=SYNC_TOKEN_TTL_MINUTES)).timestamp()),
    }
    return pyjwt.encode(payload, secret, algorithm=JWT_ALG)


def verify_sync_token(token: str) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Missing sync token")
    secret = _require_secret("REPORT_JWT_SECRET", REPORT_JWT_SECRET)
    try:
        return pyjwt.decode(token, secret, algorithms=[JWT_ALG], audience="leader_os_sync")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sync token expired · restart login")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid sync token")


# ─── OTP · passwordless login ─────────────────────────────────────────────

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _hash_code(code: str, salt: str) -> str:
    """Store hash + per-record salt so a DB dump doesn't leak OTPs."""
    return hashlib.sha256(f"{salt}::{code}".encode("utf-8")).hexdigest()


async def create_otp(db, email: str) -> str:
    """Generate + persist a 6-digit OTP. Returns the plaintext code so the
    caller can email it. Overwrites any prior unconsumed OTP for the same email
    (single-outstanding-OTP-per-user)."""
    email = (email or "").lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    code = f"{secrets.randbelow(1_000_000):06d}"
    salt = secrets.token_hex(8)
    now = datetime.now(timezone.utc)
    doc = {
        "email": email,
        "salt": salt,
        "code_hash": _hash_code(code, salt),
        "attempts": 0,
        "consumed": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=OTP_TTL_MINUTES)).isoformat(),
    }
    # Upsert · unique on email so a fresh OTP invalidates the previous one
    await db.auth_otp.update_one({"email": email}, {"$set": doc}, upsert=True)
    return code


async def verify_otp(db, email: str, code: str) -> bool:
    """Constant-time OTP verify. Marks the OTP consumed on success. Increments
    attempt counter on failure; after OTP_MAX_ATTEMPTS the record is deleted so
    the user has to request a fresh one."""
    email = (email or "").lower().strip()
    if not email or not code:
        return False
    doc = await db.auth_otp.find_one({"email": email})
    if not doc:
        return False
    now = datetime.now(timezone.utc)
    if doc.get("consumed"):
        return False
    if now.isoformat() > doc.get("expires_at", ""):
        await db.auth_otp.delete_one({"email": email})
        return False
    expected = doc["code_hash"]
    actual = _hash_code(code.strip(), doc["salt"])
    if not hmac.compare_digest(expected, actual):
        attempts = doc.get("attempts", 0) + 1
        if attempts >= OTP_MAX_ATTEMPTS:
            await db.auth_otp.delete_one({"email": email})
        else:
            await db.auth_otp.update_one({"email": email}, {"$set": {"attempts": attempts}})
        return False
    await db.auth_otp.update_one({"email": email}, {"$set": {"consumed": True, "consumed_at": now.isoformat()}})
    return True


# ─── Rate-limit client key ────────────────────────────────────────────────

def secure_client_ip(request: Request) -> str:
    """Return the last (right-most) hop from X-Forwarded-For, which our
    ingress/proxy sets to the real client IP. Attackers can inject arbitrary
    values at the head of XFF, but not at the tail — the proxy always appends
    the real remote-addr. Falls back to `request.client.host`."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"


# ─── HTML escape (re-export as service concern) ───────────────────────────

def escape_for_email(s: Optional[str], max_len: int = 300) -> str:
    """Escape + length-cap. Use for every user-supplied field embedded in
    HTML email templates (booking/enterprise/report emails)."""
    if not s:
        return ""
    return html_lib.escape(str(s).strip()[:max_len], quote=True)

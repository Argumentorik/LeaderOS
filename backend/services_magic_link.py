"""Magic-Link passwordless login via Resend.

Flow:
  1. POST /api/auth/magic-link/request { email }
     → 200 always (no email enumeration). If user exists, generate a token,
       store hashed in `magic_links` collection, send email via Resend.
  2. POST /api/auth/magic-link/verify { token }
     → 200 + user payload + httpOnly session cookie. Token is single-use and
       expires after MAGIC_LINK_TTL_MIN minutes.

Storage shape (collection `magic_links`):
    {
      _id: str,                # hash(token) — never store raw token
      email: str,              # lowercased
      created_at: datetime,
      expires_at: datetime,    # TTL index removes expired tokens
      used_at: Optional[datetime],
      request_ip: str,
    }
"""
from __future__ import annotations

import hashlib
import logging
import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from config import db

logger = logging.getLogger("wladbot.magic_link")

MAGIC_LINK_TTL_MIN = int(os.environ.get("MAGIC_LINK_TTL_MIN", "15"))
_BASE_URL_DEFAULT = "https://leaderos.de"  # Iter 92.27: primary prod domain (no dash)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _frontend_base() -> str:
    return (os.environ.get("FRONTEND_BASE_URL") or _BASE_URL_DEFAULT).rstrip("/")


async def ensure_indexes() -> None:
    """Create TTL index on expires_at + unique on _id (hashed token)."""
    try:
        await db.magic_links.create_index("expires_at", expireAfterSeconds=0)
        await db.magic_links.create_index("email")
    except Exception as e:
        logger.warning("magic_links index creation failed: %s", e)


async def create_token(email: str, request_ip: str) -> Optional[str]:
    """Generate a fresh magic-link token for `email`. Returns the RAW token
    (URL-safe) to embed in the email link, or None if user does not exist."""
    email = (email or "").strip().lower()
    if not email:
        return None

    user = await db.users.find_one({"email": email}, {"user_id": 1})
    if not user:
        return None

    raw_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    await db.magic_links.insert_one({
        "_id": _hash_token(raw_token),
        "email": email,
        "created_at": now,
        "expires_at": now + timedelta(minutes=MAGIC_LINK_TTL_MIN),
        "used_at": None,
        "request_ip": request_ip,
    })
    return raw_token


async def consume_token(raw_token: str) -> Optional[dict]:
    """Validate + atomically mark a token as used. Returns the user document
    on success, or None on invalid/expired/already-used."""
    if not raw_token:
        return None

    token_hash = _hash_token(raw_token)
    now = datetime.now(timezone.utc)

    # Atomic find-and-update: only consume if still unused AND not expired.
    record = await db.magic_links.find_one_and_update(
        {
            "_id": token_hash,
            "used_at": None,
            "expires_at": {"$gt": now},
        },
        {"$set": {"used_at": now}},
        projection={"_id": 0, "email": 1},
    )
    if not record:
        return None

    user = await db.users.find_one({"email": record["email"]}, {"_id": 0})
    return user


def _format_email_html(user_name: str, link: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
    <div style="padding:32px 32px 24px;border-bottom:1px solid #1f2937;">
      <div style="display:inline-block;padding:6px 14px;background:#BFFF00;color:#0A0A0A;font-weight:700;font-size:12px;letter-spacing:0.08em;border-radius:999px;">WLADBOT · MAGIC LINK</div>
      <h1 style="margin:20px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Dein 1-Klick-Login</h1>
    </div>
    <div style="padding:24px 32px;color:#cbd5e1;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;">Hi {user_name},</p>
      <p style="margin:0 0 24px;">klicke auf den Button, um dich ohne Passwort einzuloggen. Der Link ist <strong style="color:#BFFF00;">{MAGIC_LINK_TTL_MIN} Minuten</strong> gültig und kann nur <strong style="color:#BFFF00;">einmal</strong> verwendet werden.</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="{link}" style="display:inline-block;padding:14px 28px;background:#BFFF00;color:#0A0A0A;font-weight:700;text-decoration:none;border-radius:10px;font-size:16px;">In WladBot einloggen →</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/><code style="word-break:break-all;color:#94a3b8;">{link}</code></p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #1f2937;color:#64748b;font-size:12px;line-height:1.5;">
      Wenn du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren — niemand kann ohne sie auf dein Konto zugreifen.<br/>
      Argumentorik-Akademie GmbH · leader-os.de
    </div>
  </div>
</body>
</html>
""".strip()


async def send_magic_link_email(email: str, raw_token: str) -> bool:
    """Build the verify URL and send via Resend. Returns True on send success."""
    from services_email import send_email, is_enabled

    if not is_enabled():
        logger.warning("Resend not configured — magic link not sent to %s", email)
        # In dev, log the token so the developer can test
        logger.info("DEV magic link token for %s: %s", email, raw_token)
        return False

    user = await db.users.find_one({"email": email}, {"name": 1, "_id": 0})
    user_name = (user or {}).get("name") or "there"

    link = f"{_frontend_base()}/auth/magic?token={raw_token}"
    html = _format_email_html(user_name, link)
    result = await send_email(
        to=email,
        subject="Dein 1-Klick-Login für WladBot",
        html=html,
    )
    return bool(result.get("sent"))

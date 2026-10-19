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
# App-tier host by default (where /auth/magic resolves to the authenticated
# React app with a working /dashboard). The hyphen-host `leader-os.de` is the
# marketing landing on Vercel, which has no post-login surface. Each Emergent
# project SHOULD set `FRONTEND_BASE_URL` explicitly to its own host
# (leaderos.de for the main app, leadercheck.de for the diagnose app) so
# cross-tenant logins return to the right surface.
_BASE_URL_DEFAULT = "https://leaderos.de"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _frontend_base(request=None) -> str:
    from services_email import _frontend_url
    return _frontend_url(request) or _BASE_URL_DEFAULT



# Only these app hosts may receive a magic link (they have a post-login
# surface). The marketing hyphen-hosts (leader-os.de / leader-check.de)
# and any other origin are rejected — this is the allowlist that makes it
# safe to trust the client-supplied origin instead of a fixed env var, and
# blocks magic-link phishing via an attacker-controlled redirect_base.
_ALLOWED_MAGIC_HOSTS = ("leaderos.de", "leadercheck.de")


def _validate_base(base_url: Optional[str]) -> Optional[str]:
    """Return a normalized https://<host> if base_url is an allowlisted app
    host (apex or subdomain), else None. Drops any path/port/query so only
    the bare scheme+host is ever used to build the link."""
    if not base_url:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(base_url.strip())
        if parsed.scheme != "https" or not parsed.hostname:
            return None
        host = parsed.hostname.lower()
        for allowed in _ALLOWED_MAGIC_HOSTS:
            if host == allowed or host.endswith("." + allowed):
                return f"https://{host}"
    except Exception:
        return None
    return None


async def ensure_indexes() -> None:
    """Create TTL index on expires_at + unique on _id (hashed token)."""
    try:
        await db.magic_links.create_index("expires_at", expireAfterSeconds=0)
        await db.magic_links.create_index("email")
    except Exception as e:
        logger.warning("magic_links index creation failed: %s", e)


async def create_token(email: str, request_ip: str) -> Optional[str]:
    """Generate a fresh magic-link token for `email`. Returns the RAW token
    (URL-safe) to embed in the email link, or None if user does not exist.

    Invalidates ALL prior unused magic-links for the same email before
    issuing the new one · so requesting a fresh link silently kills any
    earlier link sitting unused in the user's inbox. Defends against a
    common attack where a stolen unused link in an old inbox is replayed
    while the legitimate user has since requested a new one.
    """
    email = (email or "").strip().lower()
    if not email:
        return None

    user = await db.users.find_one({"email": email}, {"user_id": 1})
    if not user:
        return None

    raw_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)

    # Kill all prior unused tokens for this email so only the newest link
    # is valid. We mark them used_at=now rather than deleting so the audit
    # trail (request_ip, created_at) survives until the TTL prunes the row.
    await db.magic_links.update_many(
        {"email": email, "used_at": None},
        {"$set": {"used_at": now, "invalidated_reason": "superseded"}},
    )

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
    if user:
        # Iter 136: clicking a magic link PROVES inbox ownership → the address
        # counts as verified from here on (used by the email-sending guard).
        await db.users.update_one(
            {"email": record["email"]},
            {"$set": {"email_verified": True,
                      "email_verified_at": now.isoformat(),
                      "email_verified_via": "magic_link"},
             "$unset": {"email_status": ""}},
        )
        await db.email_suppression.delete_many({"email": record["email"]})
    return user


def _format_email_html(user_name: str, link: str, next_event: dict | None = None, base: str = "") -> str:
    base = base or _frontend_base()
    event_block = ""
    if next_event:
        try:
            dt = datetime.fromisoformat(str(next_event.get("date", "")).replace("Z", "+00:00"))
            date_label = dt.strftime("%d.%m.%Y · %H:%M Uhr")
        except Exception:
            date_label = ""
        event_block = f"""
    <div style="margin:0 32px 24px;padding:16px 18px;background:#0F1607;border:1px solid #2d3d0f;border-radius:12px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.14em;color:#BFFF00;margin-bottom:6px;">🔴 NICHT VERPASSEN · NÄCHSTES LIVE-EVENT</div>
      <div style="font-size:14px;font-weight:700;color:#fafafa;">{next_event.get('title', '')}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">{date_label} · {next_event.get('duration', '')} · mit {next_event.get('host', 'Wlad Jachtchenko')}</div>
      <a href="{base}/events" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:700;color:#BFFF00;text-decoration:none;">Platz sichern →</a>
    </div>"""

    return f"""
<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
    <div style="padding:32px 32px 24px;border-bottom:1px solid #1f2937;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:14px;vertical-align:middle;">
            <img src="{base}/wladbot-avatar-clean.png" alt="WladBot" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:50%;border:2px solid #BFFF00;" />
          </td>
          <td style="vertical-align:middle;">
            <div style="font-weight:800;font-size:15px;color:#fafafa;letter-spacing:0.02em;">WladBot <span style="font-size:9px;font-weight:800;color:#BFFF00;background:#1c2a08;padding:2px 6px;border-radius:6px;vertical-align:middle;">3.0</span></div>
            <div style="font-weight:700;font-size:10px;letter-spacing:0.14em;color:#BFFF00;margin-top:3px;">LEADER-OS · MAGIC LINK</div>
          </td>
        </tr>
      </table>
      <h1 style="margin:20px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Dein 1-Klick-Login</h1>
    </div>
    <div style="padding:24px 32px;color:#cbd5e1;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;">Hi {user_name},</p>
      <p style="margin:0 0 24px;">klicke auf den Button, um dich ohne Passwort einzuloggen. Der Link ist <strong style="color:#BFFF00;">{MAGIC_LINK_TTL_MIN} Minuten</strong> gültig und kann nur <strong style="color:#BFFF00;">einmal</strong> verwendet werden.</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="{link}" style="display:inline-block;padding:14px 28px;background:#BFFF00;color:#0A0A0A;font-weight:700;text-decoration:none;border-radius:10px;font-size:16px;">In Leader-OS einloggen →</a>
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px;">
        <tr>
          <td align="center" style="font-size:10.5px;color:#64748b;padding:8px 0;border-top:1px solid #1f2937;">
            🔒 SSL-verschlüsselt&nbsp;&nbsp;·&nbsp;&nbsp;🇩🇪 DSGVO-konform&nbsp;&nbsp;·&nbsp;&nbsp;✓ Einmal-Link, läuft automatisch ab
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/><code style="word-break:break-all;color:#94a3b8;">{link}</code></p>
    </div>
{event_block}
    <div style="padding:20px 32px;border-top:1px solid #1f2937;color:#64748b;font-size:12px;line-height:1.5;">
      Wenn du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren — niemand kann ohne sie auf dein Konto zugreifen.<br/>
      <strong style="color:#94a3b8;">Argumentorik-Akademie GmbH</strong> · <a href="https://leaderos.de" style="color:#BFFF00;text-decoration:none;">leaderos.de</a> · Dein Leadership Operating System
    </div>
  </div>
</body>
</html>
""".strip()


async def send_magic_link_email(email: str, raw_token: str, base_url: str = "") -> bool:
    """Build the verify URL and send via Resend. Returns True on send success.

    `base_url` is the visitor's own origin (e.g. https://leaderos.de). If it
    passes the allowlist it is used so the link returns the user to the exact
    app host they logged in from; otherwise we fall back to FRONTEND_BASE_URL.
    """
    from services_email import send_email, is_enabled

    if not is_enabled():
        logger.warning("Resend not configured — magic link not sent to %s", email)
        # In dev, log the token so the developer can test
        logger.info("DEV magic link token for %s: %s", email, raw_token)
        return False

    user = await db.users.find_one({"email": email}, {"name": 1, "_id": 0})
    user_name = (user or {}).get("name") or "there"

    # Branding + FOMO (Iter 92.57): tease the next upcoming live event.
    next_event = None
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        next_event = await db.events.find_one(
            {"event_type": {"$nin": ["replay"]}, "date": {"$gt": now_iso}, "access_level": "free"},
            {"_id": 0, "title": 1, "date": 1, "duration": 1, "host": 1},
            sort=[("date", 1)],
        )
    except Exception:
        next_event = None

    base = _validate_base(base_url) or _frontend_base()
    link = f"{base}/auth/magic?token={raw_token}"
    html = _format_email_html(user_name, link)
    result = await send_email(
        to=email,
        subject="Dein 1-Klick-Login für WladBot",
        html=html,
    )
    return bool(result.get("sent"))

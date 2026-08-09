"""Login security: User-Agent parsing, geo lookup, device fingerprinting, new-device email alerts.

Lightweight, fail-safe by design — every helper degrades to a sensible default if the
underlying service (ipapi, Resend) is unreachable.
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import re

import httpx

logger = logging.getLogger("wladbot.login_security")

# ipapi.co is keyless (1000 req/day free). Replace with paid alternative if higher
# throughput is needed.
_GEO_ENDPOINT = "https://ipapi.co/{ip}/json/"
_GEO_TIMEOUT = 2.5  # seconds — never block login for slow geo lookup


# ────────────────────────────────────────────────────────────────────────────
# User-Agent parsing (regex-only, no external dep)
# ────────────────────────────────────────────────────────────────────────────

_BROWSERS = [
    ("Edge",     r"Edg(?:e|A|iOS)?/([\d.]+)"),
    ("Opera",    r"OPR/([\d.]+)"),
    ("Chrome",   r"Chrome/([\d.]+)"),
    ("Firefox",  r"Firefox/([\d.]+)"),
    ("Safari",   r"Version/([\d.]+).*Safari"),
]

_OS = [
    ("iOS",      r"(?:iPhone|iPad|iPod).*OS ([\d_]+)"),
    ("Android",  r"Android ([\d.]+)"),
    ("macOS",    r"Mac OS X ([\d_]+)"),
    ("Windows",  r"Windows NT ([\d.]+)"),
    ("Linux",    r"Linux"),
]

_MOBILE_HINT = re.compile(r"Mobile|iPhone|iPad|Android", re.I)


def parse_user_agent(ua: str) -> dict:
    """Return {browser, browser_version, os, os_version, device_type, raw}.

    Best-effort — unknown UAs return "Unknown" rather than failing.
    """
    if not ua:
        return {"browser": "Unknown", "browser_version": "",
                "os": "Unknown", "os_version": "",
                "device_type": "desktop", "raw": ""}

    browser, browser_version = "Unknown", ""
    for name, pattern in _BROWSERS:
        m = re.search(pattern, ua)
        if m:
            browser, browser_version = name, m.group(1)
            break

    os_name, os_version = "Unknown", ""
    for name, pattern in _OS:
        m = re.search(pattern, ua)
        if m:
            os_name = name
            os_version = (m.group(1) if m.groups() else "").replace("_", ".")
            break

    device_type = "mobile" if _MOBILE_HINT.search(ua) else "desktop"

    return {
        "browser": browser,
        "browser_version": browser_version,
        "os": os_name,
        "os_version": os_version,
        "device_type": device_type,
        "raw": ua[:300],  # cap stored length
    }


def device_fingerprint(ip: str, ua_parsed: dict) -> str:
    """Stable, low-resolution device fingerprint.

    NOT a security boundary — purely used to decide "have we seen this combo before?"
    so we can skip the new-device email on a known browser.
    """
    parts = [
        (ip or "").strip(),
        ua_parsed.get("browser", ""),
        ua_parsed.get("os", ""),
        ua_parsed.get("device_type", ""),
    ]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:16]


# ────────────────────────────────────────────────────────────────────────────
# Geo lookup (ipapi.co)
# ────────────────────────────────────────────────────────────────────────────

# Filter private/loopback IPs — they can't be geolocated.
_PRIVATE_IP_RE = re.compile(
    r"^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.|::1|localhost|unknown)"
)


async def lookup_geo(ip: str) -> dict:
    """Resolve IP → {city, region, country, country_code, ip}.

    Returns empty dict on private IPs or any failure (never raises).
    """
    if not ip or _PRIVATE_IP_RE.match(ip):
        return {}

    try:
        async with httpx.AsyncClient(timeout=_GEO_TIMEOUT) as client:
            r = await client.get(_GEO_ENDPOINT.format(ip=ip))
            if r.status_code != 200:
                return {}
            data = r.json() or {}
            if data.get("error"):
                return {}
            return {
                "city": data.get("city") or "",
                "region": data.get("region") or "",
                "country": data.get("country_name") or "",
                "country_code": (data.get("country_code") or "").upper(),
                "ip": ip,
            }
    except Exception as e:
        logger.info("geo lookup failed for %s: %s", ip, e)
        return {}


def geo_label(geo: dict) -> str:
    """Human-readable location label: 'Berlin, DE' or 'Unbekannter Standort'."""
    if not geo:
        return "Unbekannter Standort"
    city = geo.get("city") or ""
    cc = geo.get("country_code") or geo.get("country") or ""
    if city and cc:
        return f"{city}, {cc}"
    return city or cc or "Unbekannter Standort"


# ────────────────────────────────────────────────────────────────────────────
# New-device detection + email alert
# ────────────────────────────────────────────────────────────────────────────

def is_known_device(login_history: list, fingerprint: str) -> bool:
    """True if this fingerprint appears in any previous login_history entry."""
    if not login_history or not fingerprint:
        return False
    for entry in login_history[:-1]:  # skip current login that was just appended
        if entry.get("fingerprint") == fingerprint:
            return True
    return False


def _format_email_html(user_name: str, browser: str, os_name: str,
                      location: str, ip: str, at_iso: str) -> str:
    """Render a clean, branded HTML email body for the security alert."""
    # Iter 92.27: env-driven URL so per-Vercel-project deploys (leaderos vs
    # leadercheck) link back to the SAME domain the user logged in on.
    _app_url = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/")
    _app_domain = _app_url.replace("https://", "").replace("http://", "").rstrip("/")
    return f"""
<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
    <div style="padding:32px 32px 24px;border-bottom:1px solid #1f2937;">
      <div style="display:inline-block;padding:6px 14px;background:#BFFF00;color:#0A0A0A;font-weight:700;font-size:12px;letter-spacing:0.08em;border-radius:999px;">WLADBOT · SECURITY</div>
      <h1 style="margin:20px 0 0;font-size:26px;line-height:1.25;font-weight:700;">Neuer Login auf deinem Konto</h1>
    </div>
    <div style="padding:24px 32px 8px;color:#cbd5e1;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;">Hi {user_name},</p>
      <p style="margin:0 0 20px;">wir haben gerade einen <strong style="color:#BFFF00;">Login von einem neuen Gerät oder Ort</strong> auf deinem WladBot-Konto registriert. Wenn du das selbst warst, kannst du diese Mail ignorieren.</p>
    </div>
    <div style="margin:0 32px 24px;padding:20px;background:#0d0d0d;border:1px solid #1f2937;border-radius:12px;font-size:14px;color:#94a3b8;">
      <div style="margin-bottom:10px;"><span style="color:#64748b;display:inline-block;width:90px;">Browser</span> <strong style="color:#fafafa;">{browser}</strong></div>
      <div style="margin-bottom:10px;"><span style="color:#64748b;display:inline-block;width:90px;">System</span> <strong style="color:#fafafa;">{os_name}</strong></div>
      <div style="margin-bottom:10px;"><span style="color:#64748b;display:inline-block;width:90px;">Standort</span> <strong style="color:#fafafa;">{location}</strong></div>
      <div style="margin-bottom:10px;"><span style="color:#64748b;display:inline-block;width:90px;">IP</span> <code style="color:#fafafa;background:#1a1a1a;padding:2px 8px;border-radius:4px;">{ip}</code></div>
      <div><span style="color:#64748b;display:inline-block;width:90px;">Zeit</span> <strong style="color:#fafafa;">{at_iso}</strong></div>
    </div>
    <div style="padding:0 32px 24px;color:#cbd5e1;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;">Warst du das <strong>nicht</strong>? Dann ändere sofort dein Passwort:</p>
      <a href="{_app_url}/profile?tab=security" style="display:inline-block;padding:12px 22px;background:#BFFF00;color:#0A0A0A;font-weight:700;text-decoration:none;border-radius:10px;">Konto sichern →</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #1f2937;color:#64748b;font-size:12px;line-height:1.5;">
      Diese Benachrichtigung wurde automatisch von WladBot · Leader-OS gesendet.<br/>
      Argumentorik-Akademie GmbH · {_app_domain}
    </div>
  </div>
</body>
</html>
""".strip()


async def maybe_send_new_device_alert(
    *, user_email: str, user_name: str, ip: str, ua_parsed: dict, geo: dict,
    fingerprint: str, login_history: list, method: str = "email",
) -> bool:
    """Send a new-device email alert IF this fingerprint is new for the user.

    Returns True if an email was sent. Safe to call fire-and-forget — never raises.
    """
    try:
        if is_known_device(login_history, fingerprint):
            return False

        # Lazy import to keep this module dep-light
        from services_email import send_email, is_enabled
        from datetime import datetime, timezone

        if not is_enabled():
            logger.info("Resend not configured — skipping new-device email for %s", user_email)
            return False

        location = geo_label(geo)
        browser = f"{ua_parsed.get('browser','Unknown')} {ua_parsed.get('browser_version','')}".strip()
        os_name = f"{ua_parsed.get('os','Unknown')} {ua_parsed.get('os_version','')}".strip()
        at_iso = datetime.now(timezone.utc).strftime("%d.%m.%Y · %H:%M UTC")

        html = _format_email_html(user_name or "there", browser, os_name, location, ip, at_iso)
        subject = f"Neuer Login auf deinem WladBot-Konto · {location}"
        result = await send_email(to=user_email, subject=subject, html=html)
        return bool(result.get("sent"))
    except Exception as e:
        logger.warning("new-device alert failed for %s: %s", user_email, e)
        return False


def fire_and_forget_new_device_alert(**kwargs) -> None:
    """Schedule maybe_send_new_device_alert without awaiting (login response stays fast)."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(maybe_send_new_device_alert(**kwargs))
    except RuntimeError:
        # No running loop (rare — e.g. called from sync test fixture)
        asyncio.run(maybe_send_new_device_alert(**kwargs))

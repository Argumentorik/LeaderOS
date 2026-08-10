"""Email Unsubscribe — One-click unsubscribe links in lifecycle drip emails.

CAN-SPAM / GDPR-compliant: users can opt out of any email category via a
signed token that doesn't require them to log in.

Token format: HMAC-signed `user_id:category:exp` payload — stateless, no DB
lookup needed to verify. Categories map to user-document boolean flags:
  - video_drip  → users.unsubscribed_video_drip
  - drip        → users.unsubscribed_drip  (Day 1/3/7 onboarding)
  - reminders   → users.unsubscribed_reminders
  - all         → users.unsubscribed_all  (master kill-switch)
"""
import hmac
import hashlib
import base64
import json
import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import db, logger

router = APIRouter(prefix="/api/unsubscribe", tags=["unsubscribe"])

# Reuse JWT_SECRET as HMAC key — already in env, no new secret to manage.
_SIGNING_KEY = (os.environ.get("JWT_SECRET") or "dev-only-fallback").encode()

CATEGORIES = {
    "video_drip": "unsubscribed_video_drip",
    "drip": "unsubscribed_drip",
    "reminders": "unsubscribed_reminders",
    "consultation_reminder": "unsubscribed_consultation_reminder",
    "conversion": "unsubscribed_conversion",
    "all": "unsubscribed_all",
}

CATEGORY_LABELS = {
    "video_drip": "Lernvideo-Sequence (Woche 1-6)",
    "drip": "Wlads Framework-Serie (EP 01–07)",
    "reminders": "Trial- & Termin-Reminder",
    "consultation_reminder": "Persönliche Beratungseinladung",
    "conversion": "Masterclass → Leader-OS Serie (E-Mail 1–8)",
    "all": "ALLE Marketing-Emails",
}


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def make_unsubscribe_token(user_id: str, category: str, ttl_days: int = 365) -> str:
    """Create an HMAC-signed unsubscribe token. Public, opaque, stateless."""
    if category not in CATEGORIES:
        raise ValueError(f"unknown category: {category}")
    exp = int(datetime.now(timezone.utc).timestamp()) + ttl_days * 86400
    payload = json.dumps({"u": user_id, "c": category, "e": exp}, separators=(",", ":")).encode()
    sig = hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest()
    return f"{_b64(payload)}.{_b64(sig)}"


def verify_unsubscribe_token(token: str) -> dict | None:
    """Verify token signature + expiry. Returns the payload dict or None."""
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        payload = _b64_decode(payload_b64)
        sig = _b64_decode(sig_b64)
        expected = hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(payload)
        if data.get("e", 0) < int(datetime.now(timezone.utc).timestamp()):
            return None
        if data.get("c") not in CATEGORIES:
            return None
        return data
    except Exception:
        return None


def unsubscribe_url(user_id: str, category: str, app_url: str | None = None) -> str:
    """Helper used by email templates to embed one-click unsubscribe links.

    Iter 92.27: when `app_url` is omitted, resolve from `FRONTEND_BASE_URL` env
    (per-Vercel-project) so the unsubscribe link points back to the same domain
    the email was sent FROM.
    """
    if not app_url:
        app_url = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de")
    token = make_unsubscribe_token(user_id, category)
    return f"{app_url.rstrip('/')}/email/unsubscribe?token={token}"


@router.get("/info")
async def unsubscribe_info(token: str):
    """Public: validate token & return the user's email + which category."""
    data = verify_unsubscribe_token(token)
    if not data:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Link.")

    flag_field = CATEGORIES[data["c"]]
    user = await db.users.find_one(
        {"user_id": data["u"]},
        {"_id": 0, "email": 1, "name": 1, flag_field: 1},
    )
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden.")
    already = bool(user.get(flag_field, False))

    return {
        "email": user["email"],
        "name": user.get("name") or user["email"].split("@")[0],
        "category": data["c"],
        "category_label": CATEGORY_LABELS[data["c"]],
        "already_unsubscribed": already,
    }


class ConfirmBody(BaseModel):
    token: str


@router.post("/confirm")
async def unsubscribe_confirm(body: ConfirmBody):
    """Public: flip the user's unsubscribe flag based on a valid token."""
    data = verify_unsubscribe_token(body.token)
    if not data:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Link.")

    flag_field = CATEGORIES[data["c"]]
    now = datetime.now(timezone.utc).isoformat()
    result = await db.users.update_one(
        {"user_id": data["u"]},
        {"$set": {flag_field: True, f"{flag_field}_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User nicht gefunden.")

    logger.info(f"Unsubscribed user={data['u']} category={data['c']}")
    await db.email_unsubscribes.insert_one({
        "user_id": data["u"],
        "category": data["c"],
        "ts": now,
    })
    return {"ok": True, "category": data["c"], "category_label": CATEGORY_LABELS[data["c"]]}


@router.post("/resubscribe")
async def unsubscribe_resubscribe(body: ConfirmBody):
    """Public: flip the flag back OFF so the user gets emails again."""
    data = verify_unsubscribe_token(body.token)
    if not data:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Link.")

    flag_field = CATEGORIES[data["c"]]
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"user_id": data["u"]},
        {"$set": {flag_field: False, f"{flag_field}_at": now}},
    )
    return {"ok": True, "category": data["c"], "resubscribed": True}

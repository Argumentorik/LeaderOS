"""Masterclass client management (Iter 132).

Admin creates/imports Wlad's ~400 masterclass clients directly:
  email + name + duration (6/12/18 months) + individual start date.
The account works IMMEDIATELY (masterclass=true, 250 credits, login via
Magic Link — no password needed). A cron handles the 7-day expiry
reminder and the auto-downgrade back to Free after the term ends.
"""
import calendar
import csv
import io
import uuid
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel, EmailStr

from config import db, logger
from services import require_cron_auth
from routes.credits import MASTERCLASS_CREDITS

router = APIRouter(prefix="/api", tags=["masterclass-admin"])

EXPIRY_REMINDER_DAYS = 7
EXPIRING_SOON_DAYS = 14


def _add_months(dt: datetime, months: int) -> datetime:
    m = dt.month - 1 + months
    y = dt.year + m // 12
    m = m % 12 + 1
    d = min(dt.day, calendar.monthrange(y, m)[1])
    return dt.replace(year=y, month=m, day=d)


def _parse_start(raw: str) -> datetime:
    raw = (raw or "").strip()
    if not raw:
        return datetime.now(timezone.utc)
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Ungültiges Startdatum: '{raw}' — nutze YYYY-MM-DD oder DD.MM.YYYY.")


def _parse_dt(iso_str) -> datetime | None:
    try:
        return datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _client_row(u: dict) -> dict:
    now = datetime.now(timezone.utc)
    expires = _parse_dt(u.get("masterclass_expires_at"))
    days_left = round((expires - now).total_seconds() / 86400, 1) if expires else None
    if u.get("masterclass_revoked_at"):
        status = "revoked"
    elif expires and expires <= now:
        status = "expired"
    elif days_left is not None and days_left <= EXPIRING_SOON_DAYS:
        status = "expiring"
    else:
        status = "active"
    return {
        "email": u.get("email"),
        "name": u.get("name") or "",
        "duration_months": u.get("masterclass_duration_months"),
        "started_at": u.get("masterclass_started_at"),
        "expires_at": u.get("masterclass_expires_at"),
        "days_left": days_left,
        "status": status,
        "last_login": (u.get("login_history") or [{}])[-1].get("at") if u.get("login_history") else None,
    }


async def _topup_credits(user_id: str) -> None:
    await db.credits.update_one(
        {"user_id": user_id},
        {
            "$max": {"balance": MASTERCLASS_CREDITS},
            "$setOnInsert": {"total_used": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )


async def _upsert_client(email: str, name: str, duration_months: int,
                         start_dt: datetime, admin_email: str, send_invite: bool) -> dict:
    email = email.strip().lower()
    name = (name or "").strip()
    expires = _add_months(start_dt, duration_months)
    now = datetime.now(timezone.utc)
    active = expires > now

    fields = {
        "masterclass": active,
        "masterclass_expired": not active,
        "masterclass_started_at": start_dt.isoformat(),
        "masterclass_expires_at": expires.isoformat(),
        "masterclass_duration_months": duration_months,
        "masterclass_managed_by": admin_email,
    }

    existing = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1, "name": 1})
    created = False
    if existing:
        user_id = existing["user_id"]
        if name and not existing.get("name"):
            fields["name"] = name
        await db.users.update_one({"user_id": user_id}, {"$set": fields, "$unset": {"masterclass_revoked_at": ""}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # No password_hash → login via Magic Link (or Google) only.
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "picture": None,
            "position": "", "company": "", "industry": "",
            "leadership_score": 0, "eq_score": 0, "communication_score": 0,
            "level": "Emerging Leader", "xp": 0, "premium": False,
            "source_platform": "masterclass-admin",
            "created_at": now.isoformat(),
            **fields,
        })
        created = True

    if active:
        await _topup_credits(user_id)
        if send_invite:
            try:
                from services_email import send_email, masterclass_invite_email
                display = (name or email.split("@")[0]).strip() or "Leader"
                subject, html = masterclass_invite_email(display, duration_months, expires.strftime("%d.%m.%Y"))
                asyncio.create_task(send_email(email, subject, html))
            except Exception as e:  # invite must never block creation
                logger.warning(f"Masterclass invite email failed for {email}: {e}")

    logger.info(f"Masterclass client upserted: {email} ({duration_months}M, expires {expires.date()}, created={created})")
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    row = _client_row(doc)
    row["created"] = created
    return row


# ── Admin endpoints ─────────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    email: EmailStr
    name: str = ""
    duration_months: int = 12
    start_date: str = ""
    send_email: bool = True


@router.post("/admin/masterclass/clients")
async def add_masterclass_client(data: ClientCreate, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    if not 1 <= data.duration_months <= 36:
        raise HTTPException(status_code=400, detail="Laufzeit muss zwischen 1 und 36 Monaten liegen.")
    start_dt = _parse_start(data.start_date)
    row = await _upsert_client(data.email, data.name, data.duration_months,
                               start_dt, admin.get("email", ""), data.send_email)
    return row


@router.get("/admin/masterclass/clients")
async def list_masterclass_clients(request: Request):
    from routes.admin import require_admin
    await require_admin(request)
    users = await db.users.find(
        {"masterclass_expires_at": {"$exists": True}},
        {"_id": 0, "email": 1, "name": 1, "masterclass": 1, "masterclass_expired": 1,
         "masterclass_revoked_at": 1, "masterclass_started_at": 1,
         "masterclass_expires_at": 1, "masterclass_duration_months": 1, "login_history": 1},
    ).sort("masterclass_expires_at", 1).to_list(2000)
    clients = [_client_row(u) for u in users]
    counts = {"active": 0, "expiring": 0, "expired": 0, "revoked": 0}
    for c in clients:
        counts[c["status"]] = counts.get(c["status"], 0) + 1
    return {"clients": clients, "counts": counts, "total": len(clients)}


class ClientExtend(BaseModel):
    extend_months: int = 6


@router.patch("/admin/masterclass/clients/{email}")
async def extend_masterclass_client(email: str, data: ClientExtend, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    if not 1 <= data.extend_months <= 36:
        raise HTTPException(status_code=400, detail="Verlängerung muss zwischen 1 und 36 Monaten liegen.")
    email = email.strip().lower()
    user = await db.users.find_one({"email": email, "masterclass_expires_at": {"$exists": True}}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Masterclass-Kunde nicht gefunden.")
    now = datetime.now(timezone.utc)
    current = _parse_dt(user.get("masterclass_expires_at")) or now
    base = current if current > now else now
    new_expires = _add_months(base, data.extend_months)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "masterclass": True, "masterclass_expired": False,
            "masterclass_expires_at": new_expires.isoformat(),
            "masterclass_managed_by": admin.get("email", ""),
        }, "$unset": {"masterclass_revoked_at": ""}},
    )
    await _topup_credits(user["user_id"])
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return _client_row(doc)


@router.delete("/admin/masterclass/clients/{email}")
async def revoke_masterclass_client(email: str, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    email = email.strip().lower()
    res = await db.users.update_one(
        {"email": email, "masterclass_expires_at": {"$exists": True}},
        {"$set": {"masterclass": False,
                  "masterclass_revoked_at": datetime.now(timezone.utc).isoformat(),
                  "masterclass_managed_by": admin.get("email", "")}},
    )
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Masterclass-Kunde nicht gefunden.")
    return {"ok": True}


# ── CSV bulk import ─────────────────────────────────────────────────────────

CSV_EMAIL_KEYS = ("email", "e-mail", "mail")
CSV_NAME_KEYS = ("name", "vorname", "kunde")
CSV_DURATION_KEYS = ("laufzeit", "laufzeit_monate", "monate", "duration", "duration_months")
CSV_START_KEYS = ("start", "startdatum", "start_date", "beginn")


def _pick(row: dict, keys: tuple) -> str:
    for k in keys:
        if k in row and str(row[k]).strip():
            return str(row[k]).strip()
    return ""


@router.post("/admin/masterclass/clients/import")
async def import_masterclass_clients(request: Request,
                                     file: UploadFile = File(...),
                                     send_emails: str = Form("true")):
    from routes.admin import require_admin
    admin = await require_admin(request)
    send_invites = str(send_emails).lower() in ("true", "1", "yes", "on")

    raw = await file.read()
    if len(raw) > 1_000_000:
        raise HTTPException(status_code=400, detail="CSV zu groß (max 1 MB).")
    text = raw.decode("utf-8-sig", errors="replace")
    first_line = text.splitlines()[0] if text.splitlines() else ""
    delimiter = ";" if first_line.count(";") >= first_line.count(",") else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV hat keine Kopfzeile.")
    reader.fieldnames = [(f or "").strip().lower() for f in reader.fieldnames]

    imported, errors = [], []
    for idx, row in enumerate(reader, start=2):
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        email = _pick(row, CSV_EMAIL_KEYS)
        if not email or "@" not in email:
            errors.append({"line": idx, "email": email, "error": "Keine gültige E-Mail"})
            continue
        try:
            months = int(float(_pick(row, CSV_DURATION_KEYS) or "12"))
            if not 1 <= months <= 36:
                raise ValueError
        except ValueError:
            errors.append({"line": idx, "email": email, "error": "Ungültige Laufzeit (1-36 Monate)"})
            continue
        try:
            start_dt = _parse_start(_pick(row, CSV_START_KEYS))
            result = await _upsert_client(email, _pick(row, CSV_NAME_KEYS), months,
                                          start_dt, admin.get("email", ""), send_invites)
            imported.append({"email": email, "status": result["status"], "created": result["created"]})
        except HTTPException as e:
            errors.append({"line": idx, "email": email, "error": e.detail})
        except Exception as e:
            errors.append({"line": idx, "email": email, "error": str(e)[:120]})

    logger.info(f"Masterclass CSV import by {admin.get('email')}: {len(imported)} ok, {len(errors)} errors")
    return {"imported": len(imported), "errors": errors, "rows": imported}


# ── Cron: 7-day expiry reminder + auto-downgrade ────────────────────────────

@router.post("/cron/masterclass-expiry")
async def cron_masterclass_expiry(request: Request):
    """Daily: remind clients 7 days before expiry, downgrade expired ones."""
    require_cron_auth(request)
    from services_email import send_email, masterclass_expiry_reminder_email, is_enabled as email_enabled

    now = datetime.now(timezone.utc)
    downgraded = 0
    reminded = 0

    candidates = await db.users.find(
        {"masterclass": True, "masterclass_expires_at": {"$exists": True}},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1,
         "masterclass_expires_at": 1, "unsubscribed_all": 1},
    ).to_list(5000)

    for u in candidates:
        expires = _parse_dt(u.get("masterclass_expires_at"))
        if not expires:
            continue
        days_left = (expires - now).total_seconds() / 86400

        if days_left <= 0:
            await db.users.update_one(
                {"user_id": u["user_id"]},
                {"$set": {"masterclass": False, "masterclass_expired": True}},
            )
            downgraded += 1
            continue

        if days_left <= EXPIRY_REMINDER_DAYS and email_enabled() and u.get("email") and not u.get("unsubscribed_all"):
            log_type = f"mc_expiry_{int(expires.timestamp())}"
            already = await db.email_log.find_one({"user_id": u["user_id"], "type": log_type}, {"_id": 1})
            if already:
                continue
            name = (u.get("name") or u["email"].split("@")[0]).strip() or "Leader"
            subject, html = masterclass_expiry_reminder_email(name, int(round(days_left)), expires.strftime("%d.%m.%Y"))
            result = await send_email(u["email"], subject, html)
            await db.email_log.insert_one({
                "user_id": u["user_id"], "type": log_type,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"), "sent_at": now.isoformat(),
            })
            if result["sent"]:
                reminded += 1

    return {"downgraded": downgraded, "reminded": reminded, "scanned": len(candidates)}

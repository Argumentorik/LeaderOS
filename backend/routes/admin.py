"""Admin & B2B routes — split into 4 focused registrar functions:
- register_admin_routes      (login, stats, users, transactions, emails)
- register_booking_routes    (create + list bookings)
- register_enterprise_routes (calculate, inquire, list)

Email templates and pricing logic live in /backend/services/.
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from datetime import datetime, timezone, timedelta
import asyncio
import os
import hmac
import hashlib
import base64
import json
import resend
import logging
from collections import defaultdict

from models import BookingRequest, EnterpriseInquiry
from pydantic import BaseModel

from services.admin_emails import (
    booking_expert_html,
    booking_user_html,
    enterprise_admin_html,
    enterprise_user_html,
)
from services.enterprise_pricing import calc_enterprise_discount

logger = logging.getLogger(__name__)


class AdminLogin(BaseModel):
    password: str


# ─── Tiny JWT (HS256) — no external dep ──────────────────

ADMIN_SECRET = os.environ.get("ADMIN_JWT_SECRET", os.environ.get("SECRET_KEY", "leader-os-admin-2026"))
ADMIN_TOKEN_TTL_HOURS = 8


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data = data + ("=" * padding)
    return base64.urlsafe_b64decode(data)


def issue_admin_token() -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": "admin",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=ADMIN_TOKEN_TTL_HOURS)).timestamp()),
    }
    h_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    p_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    msg = f"{h_b64}.{p_b64}".encode()
    sig = hmac.new(ADMIN_SECRET.encode(), msg, hashlib.sha256).digest()
    return f"{h_b64}.{p_b64}.{_b64url_encode(sig)}"


def _verify_admin_token(token: str) -> bool:
    try:
        h_b64, p_b64, s_b64 = token.split(".")
        msg = f"{h_b64}.{p_b64}".encode()
        expected = _b64url_encode(hmac.new(ADMIN_SECRET.encode(), msg, hashlib.sha256).digest())
        if not hmac.compare_digest(expected, s_b64):
            return False
        payload = json.loads(_b64url_decode(p_b64))
        if payload.get("sub") != "admin":
            return False
        if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            return False
        return True
    except Exception:  # noqa: BLE001
        return False


async def require_admin(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization[7:]
    if not _verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")


# ─── Brute-force protection: in-memory sliding window ─────

_LOGIN_ATTEMPTS: dict[str, list[float]] = defaultdict(list)
_MAX_ATTEMPTS_PER_15MIN = 5


def _check_login_rate(ip: str) -> bool:
    """True if allowed. False if rate-limited. 5 failed attempts / 15 min / IP."""
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - 900  # 15 min
    _LOGIN_ATTEMPTS[ip] = [t for t in _LOGIN_ATTEMPTS[ip] if t > cutoff]
    if len(_LOGIN_ATTEMPTS[ip]) >= _MAX_ATTEMPTS_PER_15MIN:
        return False
    _LOGIN_ATTEMPTS[ip].append(now)
    return True


def _reset_login_rate(ip: str) -> None:
    """Clear counter on successful login (prevents lockout of legit admin)."""
    _LOGIN_ATTEMPTS.pop(ip, None)



# ---------- Stats helpers (pure, no FastAPI) ----------

async def _build_overview_stats(db) -> dict:
    """Aggregate count queries for the admin overview dashboard."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    counts = await asyncio.gather(
        db.users.count_documents({}),
        db.reports.count_documents({}),
        db.license_keys.count_documents({}),
        db.license_keys.count_documents({"status": "active"}),
        db.license_keys.count_documents({"status": "used"}),
        db.users.count_documents({"created_at": {"$gte": today_start}}),
        db.reports.count_documents({"created_at": {"$gte": today_start}}),
        db.email_log.count_documents({}),
        db.email_log.count_documents({"sent_at": {"$gte": today_start}}),
        db.payment_transactions.count_documents({}),
        db.payment_transactions.count_documents({"payment_status": "paid"}),
        db.bookings.count_documents({}),
        db.users.count_documents({"created_at": {"$gte": seven_days_ago}}),
        db.reports.count_documents({"created_at": {"$gte": seven_days_ago}}),
    )
    (total_users, total_reports, total_keys, active_keys, used_keys,
     users_today, reports_today, total_emails, emails_today,
     total_transactions, paid_transactions, total_bookings,
     users_7d, reports_7d) = counts

    revenue_pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    diagnosis_to_report = (total_reports / total_users * 100) if total_users > 0 else 0
    report_to_payment = (paid_transactions / total_reports * 100) if total_reports > 0 else 0

    return {
        "overview": {"total_users": total_users, "total_reports": total_reports, "total_revenue": total_revenue, "total_keys": total_keys},
        "today": {"users": users_today, "reports": reports_today, "emails": emails_today},
        "keys": {"total": total_keys, "active": active_keys, "used": used_keys},
        "conversions": {"diagnosis_to_report": round(diagnosis_to_report, 1), "report_to_payment": round(report_to_payment, 1)},
        "emails": {"total": total_emails, "today": emails_today},
        "transactions": {"total": total_transactions, "paid": paid_transactions},
        "bookings": {"total": total_bookings},
        "last_7_days": {"users": users_7d, "reports": reports_7d},
    }


async def _build_users_with_status(db) -> list:
    """Fetch users + cross-reference with reports & license keys."""
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    report_sessions = set()
    async for r in db.reports.find({}, {"session_id": 1, "_id": 0}).limit(500):
        report_sessions.add(r["session_id"])
    key_map = {}
    async for k in db.license_keys.find({}, {"_id": 0, "key": 1, "email": 1, "status": 1, "plan": 1}).limit(500):
        if k.get("email"):
            key_map[k["email"]] = {"key": k["key"], "status": k["status"], "plan": k["plan"]}
    for u in users:
        sid = u.get("session_id") or u.get("user_id")
        u["has_report"] = sid in report_sessions
        u["license_key"] = key_map.get(u.get("email", ""))
    return users


# ---------- Email dispatch helpers ----------

async def _send_booking_emails(config, db, data: BookingRequest):
    if not config.get("resend_key"):
        return
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Leader OS System <{config['sender_email']}>",
            "to": ["start@aiporate.com"],
            "subject": f"Neue Termin-Anfrage: {data.name or 'Neuer Kunde'} — {data.date} {data.time}",
            "html": booking_expert_html(data.date, data.time, data.name, data.email, data.plan, data.notes),
        })
        if data.email:
            await asyncio.to_thread(resend.Emails.send, {
                "from": f"Wlad von Leader OS <{config['sender_email']}>",
                "to": [data.email],
                "subject": f"Dein Termin: {data.date} um {data.time} Uhr — Leader OS",
                "html": booking_user_html(data.name, data.date, data.time),
            })
        await db.email_log.insert_one({
            "type": "booking", "email": data.email or "expert",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.error(f"Booking email error: {e}")


async def _send_enterprise_emails(config, db, data: EnterpriseInquiry, pricing: dict):
    if not config.get("resend_key"):
        return
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Leader OS Enterprise <{config['sender_email']}>",
            "to": ["start@aiporate.com"],
            "subject": f"Enterprise-Anfrage: {data.company} ({data.employee_count} MA) — {pricing['total']:.0f} EUR",
            "html": enterprise_admin_html(data.company, data.contact_name, str(data.email), data.phone, data.employee_count, bool(data.include_coaching), data.message, pricing),
        })
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von Leader OS <{config['sender_email']}>",
            "to": [str(data.email)],
            "subject": f"Deine Enterprise-Anfrage fuer {data.company} — Leader OS",
            "html": enterprise_user_html(data.contact_name, data.company, data.employee_count, pricing),
        })
        await db.email_log.insert_one({
            "type": "enterprise_inquiry",
            "email": str(data.email),
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.error(f"Enterprise inquiry email error: {e}")


def _build_booking_doc(data: BookingRequest) -> dict:
    return {
        "date": data.date, "time": data.time,
        "name": data.name or "", "email": data.email or "",
        "session_id": data.session_id or "", "plan": data.plan or "leader_os_plus",
        "notes": data.notes or "", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_enterprise_doc(data: EnterpriseInquiry, pricing: dict) -> dict:
    return {
        "company": data.company.strip(),
        "contact_name": data.contact_name.strip(),
        "email": str(data.email).lower().strip(),
        "phone": data.phone or "",
        "employee_count": data.employee_count,
        "include_coaching": bool(data.include_coaching),
        "message": data.message or "",
        "pricing": pricing,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------- Route registrars ----------

def register_admin_routes(router: APIRouter, db, config: dict) -> None:
    """Admin dashboard: login, stats, users, transactions, email logs."""

    @router.post("/admin/login")
    async def admin_login(data: AdminLogin, request: Request) -> dict:
        # Resolve real client IP through K8s ingress (X-Forwarded-For chain).
        xff = request.headers.get("x-forwarded-for", "")
        client_ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
        if not _check_login_rate(client_ip):
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 min.")
        expected = config.get("admin_password", "")
        if not expected:
            raise HTTPException(status_code=500, detail="Admin password not configured")
        # Constant-time password compare + uniform 300ms latency on BOTH branches
        # mitigates timing-side-channel attacks against the admin login.
        valid = hmac.compare_digest(data.password, expected)
        await asyncio.sleep(0.3)
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid password")
        _reset_login_rate(client_ip)
        token = issue_admin_token()
        return {"ok": True, "token": token, "expires_in_hours": ADMIN_TOKEN_TTL_HOURS}

    @router.get("/admin/stats", dependencies=[Depends(require_admin)])
    async def admin_stats() -> dict:
        return await _build_overview_stats(db)

    @router.get("/admin/users", dependencies=[Depends(require_admin)])
    async def admin_users() -> dict:
        users = await _build_users_with_status(db)
        return {"users": users, "total": len(users)}

    @router.get("/admin/transactions", dependencies=[Depends(require_admin)])
    async def admin_transactions() -> dict:
        txs = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"transactions": txs, "total": len(txs)}

    @router.get("/admin/emails", dependencies=[Depends(require_admin)])
    async def admin_emails() -> dict:
        emails = await db.email_log.find({}, {"_id": 0}).sort("sent_at", -1).to_list(200)
        return {"emails": emails, "total": len(emails)}


def register_booking_routes(router: APIRouter, db, config: dict) -> None:
    """Free consultation booking flow."""

    @router.post("/booking/create")
    async def create_booking(data: BookingRequest) -> dict:
        booking = _build_booking_doc(data)
        await db.bookings.insert_one(booking)
        logger.info(f"Booking created: {data.date} {data.time} for {data.email}")
        await _send_booking_emails(config, db, data)
        return {
            "success": True,
            "message": "Termin-Anfrage erhalten. Bestätigung folgt per E-Mail.",
            "booking_date": data.date,
            "booking_time": data.time,
        }

    @router.get("/booking/list", dependencies=[Depends(require_admin)])
    async def list_bookings() -> dict:
        bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"bookings": bookings, "total": len(bookings)}


def register_enterprise_routes(router: APIRouter, db, config: dict) -> None:
    """B2B Enterprise tier: pricing calculator + inquiry form."""

    @router.get("/enterprise/calculate")
    async def enterprise_calculate(employees: int) -> dict:
        try:
            return calc_enterprise_discount(employees)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/enterprise/inquire")
    async def enterprise_inquire(data: EnterpriseInquiry) -> dict:
        if data.employee_count < 1:
            raise HTTPException(status_code=400, detail="Mitarbeiter-Zahl muss >= 1 sein")
        pricing = calc_enterprise_discount(data.employee_count)
        doc = _build_enterprise_doc(data, pricing)
        await db.enterprise_inquiries.insert_one(doc)
        logger.info(f"Enterprise inquiry: {data.company} — {data.employee_count} MA — {pricing['total']} EUR")
        await _send_enterprise_emails(config, db, data, pricing)
        return {
            "success": True,
            "message": "Anfrage erhalten. Wir melden uns innerhalb von 24 Stunden.",
            "pricing": pricing,
        }

    @router.get("/enterprise/list", dependencies=[Depends(require_admin)])
    async def list_enterprise_inquiries() -> dict:
        inquiries = await db.enterprise_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"inquiries": inquiries, "total": len(inquiries)}

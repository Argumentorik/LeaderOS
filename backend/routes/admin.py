from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import asyncio
import resend
import logging

from models import BookingRequest, EnterpriseInquiry
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AdminLogin(BaseModel):
    password: str


def register_admin_routes(router: APIRouter, db, config):

    @router.post("/admin/login")
    async def admin_login(data: AdminLogin):
        expected = config.get("admin_password", "")
        if not expected:
            raise HTTPException(status_code=500, detail="Admin password not configured")
        if data.password != expected:
            raise HTTPException(status_code=401, detail="Invalid password")
        return {"ok": True}

    @router.get("/admin/stats")
    async def admin_stats():
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        seven_days_ago = (now - timedelta(days=7)).isoformat()

        total_users = await db.users.count_documents({})
        total_reports = await db.reports.count_documents({})
        total_keys = await db.license_keys.count_documents({})
        active_keys = await db.license_keys.count_documents({"status": "active"})
        used_keys = await db.license_keys.count_documents({"status": "used"})
        users_today = await db.users.count_documents({"created_at": {"$gte": today_start}})
        reports_today = await db.reports.count_documents({"created_at": {"$gte": today_start}})
        total_emails = await db.email_log.count_documents({})
        emails_today = await db.email_log.count_documents({"sent_at": {"$gte": today_start}})
        total_transactions = await db.payment_transactions.count_documents({})
        paid_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})
        total_bookings = await db.bookings.count_documents({})

        pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0

        diagnosis_to_report = (total_reports / total_users * 100) if total_users > 0 else 0
        report_to_payment = (paid_transactions / total_reports * 100) if total_reports > 0 else 0
        users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
        reports_7d = await db.reports.count_documents({"created_at": {"$gte": seven_days_ago}})

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

    @router.get("/admin/users")
    async def admin_users():
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
        return {"users": users, "total": len(users)}

    @router.get("/admin/transactions")
    async def admin_transactions():
        txs = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"transactions": txs, "total": len(txs)}

    @router.get("/admin/emails")
    async def admin_emails():
        emails = await db.email_log.find({}, {"_id": 0}).sort("sent_at", -1).to_list(200)
        return {"emails": emails, "total": len(emails)}

    # --- Booking ---

    @router.post("/booking/create")
    async def create_booking(data: BookingRequest):
        booking = {
            "date": data.date, "time": data.time,
            "name": data.name or "", "email": data.email or "",
            "session_id": data.session_id or "", "plan": data.plan or "leader_os_plus",
            "notes": data.notes or "", "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.bookings.insert_one(booking)
        logger.info(f"Booking created: {data.date} {data.time} for {data.email}")

        if config.get("resend_key"):
            try:
                expert_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:500px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:20px;">Neuer Termin-Anfrage</h1>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p><strong>Datum:</strong> {data.date}</p>
<p><strong>Uhrzeit:</strong> {data.time}</p>
<p><strong>Name:</strong> {data.name or '–'}</p>
<p><strong>E-Mail:</strong> {data.email or '–'}</p>
<p><strong>Plan:</strong> {data.plan}</p>
{f'<p><strong>Notiz:</strong> {data.notes}</p>' if data.notes else ''}
</div>
<p style="color:#94A3B8;font-size:12px;">Bitte innerhalb von 24h bestätigen.</p>
</div></body></html>"""
                await asyncio.to_thread(resend.Emails.send, {
                    "from": f"WLADHUB System <{config['sender_email']}>",
                    "to": ["start@aiporate.com"],
                    "subject": f"Neue Termin-Anfrage: {data.name or 'Neuer Kunde'} — {data.date} {data.time}",
                    "html": expert_html,
                })
                if data.email:
                    user_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:500px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:22px;">Dein Termin ist angefragt!</h1>
<p style="color:#94A3B8;">Hey {data.name or 'Leader'},</p>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p style="color:#fff;"><strong>Datum:</strong> {data.date}</p>
<p style="color:#fff;"><strong>Uhrzeit:</strong> {data.time} Uhr</p>
<p style="color:#fff;"><strong>Typ:</strong> Kostenlose AI Integrity Consultation</p>
</div>
<p style="color:#94A3B8;">Wir bestätigen deinen Termin innerhalb von 24 Stunden per E-Mail.</p>
<p style="color:#C8FF00;font-weight:bold;margin-top:20px;">Bis bald!</p>
<p style="color:#64748B;font-size:11px;margin-top:30px;">WLADHUB · Leadership OS PLUS</p>
</div></body></html>"""
                    await asyncio.to_thread(resend.Emails.send, {
                        "from": f"Wlad von WLADHUB <{config['sender_email']}>",
                        "to": [data.email],
                        "subject": f"Dein Termin: {data.date} um {data.time} Uhr — WLADHUB",
                        "html": user_html,
                    })
                await db.email_log.insert_one({
                    "type": "booking", "email": data.email or "expert",
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.error(f"Booking email error: {e}")

        return {"success": True, "message": "Termin-Anfrage erhalten. Bestätigung folgt per E-Mail.",
                "booking_date": data.date, "booking_time": data.time}

    @router.get("/booking/list")
    async def list_bookings():
        bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"bookings": bookings, "total": len(bookings)}

    # --- Enterprise B2B Inquiries ---

    def calc_enterprise_discount(emp: int):
        """Volume discount on 997 EUR per seat. Tiers as defined in PRD."""
        tiers = [(200, 0.50), (100, 0.40), (50, 0.30), (20, 0.20), (10, 0.15), (5, 0.10), (1, 0.0)]
        discount = 0.0
        for threshold, pct in tiers:
            if emp >= threshold:
                discount = pct
                break
        seat_price = 997.0
        per_seat = round(seat_price * (1 - discount), 2)
        total = round(per_seat * emp, 2)
        return {"seats": emp, "discount_pct": int(discount * 100), "per_seat": per_seat, "total": total, "seat_price_full": seat_price}

    @router.get("/enterprise/calculate")
    async def enterprise_calculate(employees: int):
        if employees < 1:
            raise HTTPException(status_code=400, detail="employees muss >= 1 sein")
        return calc_enterprise_discount(employees)

    @router.post("/enterprise/inquire")
    async def enterprise_inquire(data: EnterpriseInquiry):
        if data.employee_count < 1:
            raise HTTPException(status_code=400, detail="Mitarbeiter-Zahl muss >= 1 sein")
        pricing = calc_enterprise_discount(data.employee_count)
        doc = {
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
        await db.enterprise_inquiries.insert_one(doc)
        logger.info(f"Enterprise inquiry: {data.company} — {data.employee_count} MA — {pricing['total']} EUR")

        # Send notification e-mails
        if config.get("resend_key"):
            try:
                admin_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:560px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:22px;">Neue Enterprise-Anfrage</h1>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p><strong>Firma:</strong> {data.company}</p>
<p><strong>Kontakt:</strong> {data.contact_name}</p>
<p><strong>E-Mail:</strong> {data.email}</p>
{f'<p><strong>Telefon:</strong> {data.phone}</p>' if data.phone else ''}
<p><strong>Mitarbeiter:</strong> {data.employee_count}</p>
<p><strong>Coaching gewuenscht:</strong> {'Ja' if data.include_coaching else 'Nein'}</p>
{f'<p><strong>Nachricht:</strong> {data.message}</p>' if data.message else ''}
</div>
<div style="background:#0d1f00;border:1px solid #C8FF00;border-radius:12px;padding:20px;margin:16px 0;">
<p style="color:#C8FF00;margin:0 0 8px;"><strong>Berechneter Preis</strong></p>
<p style="color:#fff;margin:4px 0;">Rabatt: <strong>{pricing['discount_pct']}%</strong></p>
<p style="color:#fff;margin:4px 0;">Pro Lizenz: <strong>{pricing['per_seat']:.2f} EUR</strong></p>
<p style="color:#C8FF00;font-size:18px;margin:8px 0 0;"><strong>Gesamt: {pricing['total']:.2f} EUR / Jahr</strong></p>
</div>
</div></body></html>"""
                await asyncio.to_thread(resend.Emails.send, {
                    "from": f"WLADHUB Enterprise <{config['sender_email']}>",
                    "to": ["start@aiporate.com"],
                    "subject": f"Enterprise-Anfrage: {data.company} ({data.employee_count} MA) — {pricing['total']:.0f} EUR",
                    "html": admin_html,
                })
                user_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:520px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:24px;">Deine Enterprise-Anfrage ist da, {data.contact_name}!</h1>
<p style="color:#94A3B8;">Hi {data.contact_name},</p>
<p style="color:#94A3B8;">vielen Dank fuer dein Interesse an Leadership OS ENTERPRISE fuer <strong style="color:#fff;">{data.company}</strong>. Wir haben deine Anfrage erhalten und melden uns innerhalb von 24 Stunden mit einem persoenlichen Angebot.</p>
<div style="background:#0d1f00;border:1px solid #C8FF00;border-radius:12px;padding:24px;margin:24px 0;">
<p style="color:#C8FF00;margin:0 0 12px;"><strong>Deine Vorab-Kalkulation</strong></p>
<p style="color:#fff;margin:6px 0;">{data.employee_count} Mitarbeiter</p>
<p style="color:#fff;margin:6px 0;">Volumen-Rabatt: <strong>{pricing['discount_pct']}%</strong></p>
<p style="color:#fff;margin:6px 0;">Pro Lizenz: {pricing['per_seat']:.2f} EUR / Jahr</p>
<p style="color:#C8FF00;font-size:20px;margin:12px 0 0;"><strong>Gesamtinvestition: {pricing['total']:.0f} EUR / Jahr</strong></p>
</div>
<p style="color:#94A3B8;font-size:13px;">Das finale Angebot kann je nach individuellen Anforderungen abweichen — z.B. mit zusaetzlichen Coaching-Modulen.</p>
<p style="color:#C8FF00;font-weight:bold;margin-top:24px;">Bis bald,<br/>Wlad</p>
<p style="color:#64748B;font-size:11px;margin-top:32px;">WLADHUB Leadership Diagnostic Platform</p>
</div></body></html>"""
                await asyncio.to_thread(resend.Emails.send, {
                    "from": f"Wlad von WLADHUB <{config['sender_email']}>",
                    "to": [str(data.email)],
                    "subject": f"Deine Enterprise-Anfrage fuer {data.company} — WLADHUB",
                    "html": user_html,
                })
                await db.email_log.insert_one({
                    "type": "enterprise_inquiry",
                    "email": str(data.email),
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.error(f"Enterprise inquiry email error: {e}")

        return {"success": True, "message": "Anfrage erhalten. Wir melden uns innerhalb von 24 Stunden.", "pricing": pricing}

    @router.get("/enterprise/list")
    async def list_enterprise_inquiries():
        inquiries = await db.enterprise_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"inquiries": inquiries, "total": len(inquiries)}

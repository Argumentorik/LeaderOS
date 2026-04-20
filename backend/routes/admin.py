from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import asyncio
import resend
import logging

from models import BookingRequest

logger = logging.getLogger(__name__)


def register_admin_routes(router: APIRouter, db, config):

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
            "session_id": data.session_id or "", "plan": data.plan or "fasttrack",
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
<p style="color:#64748B;font-size:11px;margin-top:30px;">WLADHUB · Fast Track Leadership Accelerator</p>
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

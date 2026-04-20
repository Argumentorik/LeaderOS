from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import asyncio
import resend
import logging

from models import EmailSend
from email_templates import welcome_email, report_email, plan_reminder_email, payment_confirmation_email

logger = logging.getLogger(__name__)


async def send_auto_report_email(db, config, user, report, session_id):
    """Auto-send report email after generation (fire-and-forget)."""
    email = user.get("email")
    if not email or not config.get("resend_key"):
        return
    async def _send():
        try:
            email_data = report_email(user.get("name", "Leader"), report)
            resp = await asyncio.to_thread(resend.Emails.send, {
                "from": f"Wlad von WLADHUB <{config['sender_email']}>",
                "to": [email],
                "subject": email_data["subject"],
                "html": email_data["html"],
            })
            logger.info(f"Auto report email sent to {email}")
            await db.email_log.insert_one({
                "type": "report_auto", "email": email, "session_id": session_id,
                "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
            })
        except Exception as e:
            logger.error(f"Auto report email error: {e}")
    asyncio.create_task(_send())


async def send_welcome_email_background(db, config, name, email, role):
    """Fire-and-forget welcome email."""
    if not config.get("resend_key"):
        return
    try:
        email_data = welcome_email(name, role)
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{config['sender_email']}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Welcome email sent to {email}: {resp}")
        await db.email_log.insert_one({
            "type": "welcome", "email": email,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
    except Exception as e:
        logger.error(f"Welcome email error: {e}")


async def send_payment_email_background(db, config, email, name, plan, amount):
    """Fire-and-forget payment confirmation email."""
    if not config.get("resend_key"):
        return
    try:
        email_data = payment_confirmation_email(name, plan, amount)
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{config['sender_email']}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Payment email sent to {email}: {resp}")
        await db.email_log.insert_one({
            "type": "payment_confirmation", "email": email, "plan": plan,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
    except Exception as e:
        logger.error(f"Payment email error: {e}")


def register_email_routes(router: APIRouter, db, config):

    @router.post("/email/send-report")
    async def send_report_email_endpoint(data: EmailSend):
        report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not config.get("resend_key"):
            return {"success": False, "message": "Email service not configured"}
        user = report.get("user", {})
        email = user.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email found")
        email_data = report_email(user.get("name", "Leader"), report)
        try:
            resp = await asyncio.to_thread(resend.Emails.send, {
                "from": f"Wlad von WLADHUB <{config['sender_email']}>",
                "to": [email],
                "subject": email_data["subject"],
                "html": email_data["html"],
            })
            await db.email_log.insert_one({
                "type": "report", "email": email, "session_id": data.session_id,
                "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
            })
            return {"success": True, "id": resp.get("id")}
        except Exception as e:
            logger.error(f"Email error: {e}")
            return {"success": False, "error": str(e)}

    @router.post("/email/send-plan-reminder")
    async def send_plan_reminder_endpoint(data: dict):
        session_id = data.get("session_id")
        week = data.get("week", 1)
        user = await db.users.find_one({"session_id": session_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": session_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        report = await db.reports.find_one({"session_id": session_id}, {"_id": 0})
        weakest_label = report.get("weakest_role", {}).get("label", "Leadership") if report else "Leadership"
        email = user.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email found")
        email_data = plan_reminder_email(user.get("name", "Leader"), week, weakest_label)
        try:
            resp = await asyncio.to_thread(resend.Emails.send, {
                "from": f"Wlad von WLADHUB <{config['sender_email']}>",
                "to": [email],
                "subject": email_data["subject"],
                "html": email_data["html"],
            })
            await db.email_log.insert_one({
                "type": f"plan_week_{week}", "email": email, "session_id": session_id,
                "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
            })
            return {"success": True, "id": resp.get("id")}
        except Exception as e:
            logger.error(f"Plan reminder error: {e}")
            return {"success": False, "error": str(e)}

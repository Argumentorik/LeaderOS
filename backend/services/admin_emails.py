"""HTML email templates for booking & enterprise inquiry flows.
Kept separate from route handlers to keep them small & testable.

SECURITY: every user-supplied field is escaped via `escape_for_email` before
embedding into the HTML body — prevents mail-based HTML/phishing injection.
"""
from typing import Optional
from services.security import escape_for_email as _e


def booking_expert_html(date: str, time: str, name: Optional[str], email: Optional[str], plan: Optional[str], notes: Optional[str]) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:500px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:20px;">Neuer Termin-Anfrage</h1>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p><strong>Datum:</strong> {_e(date, 30)}</p>
<p><strong>Uhrzeit:</strong> {_e(time, 20)}</p>
<p><strong>Name:</strong> {_e(name, 120) or '–'}</p>
<p><strong>E-Mail:</strong> {_e(email, 254) or '–'}</p>
<p><strong>Plan:</strong> {_e(plan, 60)}</p>
{f'<p><strong>Notiz:</strong> {_e(notes, 1000)}</p>' if notes else ''}
</div>
<p style="color:#94A3B8;font-size:12px;">Bitte innerhalb von 24h bestätigen.</p>
</div></body></html>"""


def booking_user_html(name: Optional[str], date: str, time: str) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:500px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:22px;">Dein Termin ist angefragt!</h1>
<p style="color:#94A3B8;">Hey {_e(name, 120) or 'Leader'},</p>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p style="color:#fff;"><strong>Datum:</strong> {_e(date, 30)}</p>
<p style="color:#fff;"><strong>Uhrzeit:</strong> {_e(time, 20)} Uhr</p>
<p style="color:#fff;"><strong>Typ:</strong> Kostenlose AI Integrity Consultation</p>
</div>
<p style="color:#94A3B8;">Wir bestätigen deinen Termin innerhalb von 24 Stunden per E-Mail.</p>
<p style="color:#C8FF00;font-weight:bold;margin-top:20px;">Bis bald!</p>
<p style="color:#64748B;font-size:11px;margin-top:30px;">Leader OS · Plus-Plus</p>
</div></body></html>"""


def enterprise_admin_html(company: str, contact_name: str, email: str, phone: Optional[str], employee_count: int, include_coaching: bool, message: Optional[str], pricing: dict) -> str:
    phone_block = f'<p><strong>Telefon:</strong> {_e(phone, 40)}</p>' if phone else ''
    msg_block = f'<p><strong>Nachricht:</strong> {_e(message, 2000)}</p>' if message else ''
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:560px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:22px;">Neue Enterprise-Anfrage</h1>
<div style="background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:24px;margin:16px 0;">
<p><strong>Firma:</strong> {_e(company, 200)}</p>
<p><strong>Kontakt:</strong> {_e(contact_name, 120)}</p>
<p><strong>E-Mail:</strong> {_e(email, 254)}</p>
{phone_block}
<p><strong>Mitarbeiter:</strong> {int(employee_count)}</p>
<p><strong>Coaching gewuenscht:</strong> {'Ja' if include_coaching else 'Nein'}</p>
{msg_block}
</div>
<div style="background:#0d1f00;border:1px solid #C8FF00;border-radius:12px;padding:20px;margin:16px 0;">
<p style="color:#C8FF00;margin:0 0 8px;"><strong>Berechneter Preis</strong></p>
<p style="color:#fff;margin:4px 0;">Rabatt: <strong>{pricing['discount_pct']}%</strong></p>
<p style="color:#fff;margin:4px 0;">Pro Lizenz: <strong>{pricing['per_seat']:.2f} EUR</strong></p>
<p style="color:#C8FF00;font-size:18px;margin:8px 0 0;"><strong>Gesamt: {pricing['total']:.2f} EUR / Jahr</strong></p>
</div>
</div></body></html>"""


def enterprise_user_html(contact_name: str, company: str, employee_count: int, pricing: dict) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;">
<div style="max-width:520px;margin:0 auto;">
<h1 style="color:#C8FF00;font-size:24px;">Deine Enterprise-Anfrage ist da, {contact_name}!</h1>
<p style="color:#94A3B8;">Hi {contact_name},</p>
<p style="color:#94A3B8;">vielen Dank fuer dein Interesse an Leadership OS ENTERPRISE fuer <strong style="color:#fff;">{company}</strong>. Wir haben deine Anfrage erhalten und melden uns innerhalb von 24 Stunden mit einem persoenlichen Angebot.</p>
<div style="background:#0d1f00;border:1px solid #C8FF00;border-radius:12px;padding:24px;margin:24px 0;">
<p style="color:#C8FF00;margin:0 0 12px;"><strong>Deine Vorab-Kalkulation</strong></p>
<p style="color:#fff;margin:6px 0;">{employee_count} Mitarbeiter</p>
<p style="color:#fff;margin:6px 0;">Volumen-Rabatt: <strong>{pricing['discount_pct']}%</strong></p>
<p style="color:#fff;margin:6px 0;">Pro Lizenz: {pricing['per_seat']:.2f} EUR / Jahr</p>
<p style="color:#C8FF00;font-size:20px;margin:12px 0 0;"><strong>Gesamtinvestition: {pricing['total']:.0f} EUR / Jahr</strong></p>
</div>
<p style="color:#94A3B8;font-size:13px;">Das finale Angebot kann je nach individuellen Anforderungen abweichen — z.B. mit zusaetzlichen Coaching-Modulen.</p>
<p style="color:#C8FF00;font-weight:bold;margin-top:24px;">Bis bald,<br/>Wlad</p>
<p style="color:#64748B;font-size:11px;margin-top:32px;">Leader OS Leadership Diagnostic Platform</p>
</div></body></html>"""

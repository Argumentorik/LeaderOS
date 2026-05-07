# WLADHUB - Product Requirements Document

## Architecture (Refactored Feb 2026)
```
/app/backend/
├── server.py          # 101 Zeilen — App Setup, Config, Health, User/Create
├── models.py          # 11 Pydantic Models
├── email_templates.py # 4 E-Mail Templates
├── routes/
│   ├── auth.py       # Auth, Privacy, GDPR
│   ├── quiz.py       # Quiz, Report, Coach (6-Rollen-Scoring)
│   ├── payments.py   # Stripe, License Keys (WLAD-XXXX)
│   ├── email.py      # Resend E-Mails (Welcome, Report, Plan, Payment)
│   └── admin.py      # Dashboard Stats, Users, Transactions, Bookings
```

## Pricing (Feb 2026 — Komplettoverhaul)
- **Leadership OS** — 997€/Jahr · 14-Tage-Trial · 12 Videokurse (1/Monat)
  - Einmalzahlung 997€
  - 2 Raten à 550€ = 1.100€ (+103€ Aufschlag)
  - 12 Raten à 99€ = 1.188€ (+191€ Aufschlag)
- **Leadership OS PLUS** — 4.447€/Jahr Einmalzahlung · inkl. 12 Einzelcoachings (à 299€ Wert)
- **Leadership OS ENTERPRISE** — Preis auf Anfrage · B2B-Volumen-Rabatte (5 MA→10%, 10→15%, 20→20%, 50→30%, 100→40%, 200→50%)

## Implemented
- [x] Full Funnel mit Hyperpersonalisierung
- [x] **Feb 2026 — Pricing Overhaul**: 3 neue Tiers (Leadership OS / OS PLUS / Enterprise) — alte Starter/Fast Track entfernt; Enterprise-Rabatt-Rechner mit Live-Update + Inquiry-Form (Backend `/api/enterprise/calculate` + `/api/enterprise/inquire`); Resend-E-Mails an Admin und Interessent
- [x] Admin Dashboard + Bookings + License Keys + Enterprise Inquiries
- [x] Resend E-Mail (6 Flows: Welcome/Report/Reminder/Payment/Booking/Enterprise)
- [x] Video-Plattform (/kurse)
- [x] Backend-Refactoring: 1165 → 101 Zeilen server.py
- [x] **Feb 2026 — WladBot Chat fließt in Report ein**: Q30-Chat wird als `chat_context` an `/api/quiz/generate-report` gesendet, fließt in AI-Prompt, erzeugt neues Feld `narrative.personal_response` + speichert `user_challenge` im Report-Dokument
- [x] **Feb 2026 — Personalisierter 30-Tage-Plan PDF**: Neue `generateRoadmapPDF()` Funktion + Download-Button auf `/roadmap`
- [x] **Feb 2026 — Report UI "Wlad hat dir zugehört"-Card**
- [x] **Feb 2026 — Admin-Login serverseitig**: `ADMIN_PASSWORD` Env-Var + `/api/admin/login` Endpoint (Deployment-Readiness)

## Routes
/ | /diagnose | /quiz | /analyzing | /report | /roadmap | /close | /payment-success | /activate | /kurse | /admin

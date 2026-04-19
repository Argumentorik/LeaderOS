# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose -> 30-Tage Plan -> Upsell
Autor: Wladislaw Jachtchenko | Leader-OS Branding: Pure Black (#0a0a0a) + Neon Lime (#C8FF00)

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI: Auth, Quiz, Report, WladBot, Stripe, Email
│   ├── email_templates.py     # 4 E-Mail Templates (Welcome, Report, Plan, Payment)
│   ├── .env                   # RESEND_API_KEY, SENDER_EMAIL, STRIPE, LLM keys
│   └── tests/
│       └── test_email_resend.py
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # Landing Page (Leader-OS Branding)
│   │   ├── UserForm.jsx       # Name/Email + DSGVO + Rolle
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen + Leadership-Zitate
│   │   ├── Report.jsx         # 6 Rollen + KI-Narrative + PDF + Email-Notification
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal
│   │   ├── HighTicketClose.jsx # 3 Tiers: 0/997/4.997 EUR + Stripe
│   │   └── PaymentSuccess.jsx  # Stripe Callback + Status-Polling
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation (Lime Branding)
│   │   └── AICoach.jsx        # WladBot floating Chat Panel
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Design System (Leader-OS Branding)
- **Background**: #0a0a0a (Pure Black)
- **Accent Color**: #C8FF00 (Neon Lime) — single accent
- **Buttons**: Lime green with black text, rounded-10px
- **Fonts**: Manrope (headings) + Inter (body)

## Implemented (Feb 2026)
- [x] Full Funnel: Hero -> UserForm -> Quiz -> WladBot -> Report -> Roadmap -> Upsell
- [x] 5+1 Leadership-Rollen (Kommunikator, Manager, Teamleiter, Psychologe, Problemloser, Innovator)
- [x] **Stripe Payment Integration** – 3 Pakete (0/997/4.997 EUR)
- [x] **Leader-OS Branding** — komplettes Redesign auf Pure Black + Neon Lime
- [x] **Resend E-Mail Integration** (Feb 2026):
  - Welcome-Mail (auto nach UserForm) — persönlich, Defensive Backward Pressure
  - Report-Mail (auto nach Quiz-Completion) — Score-Summary + CTA
  - 30-Tage-Plan Reminder (Wochen 1-4) — wöchentliche Aufgaben
  - Payment-Bestätigung (auto nach Stripe Webhook) — Zugangsdaten
  - Sender: wlad@leader.wladhub.com
  - MongoDB email_log Collection für Tracking
- [x] PDF-Export (Report + Curriculum) im Lime/Schwarz-Design
- [x] DSGVO, SSL, A/B Headlines, WladBot

## Key API Endpoints
- POST /api/user/create — User erstellen + Welcome-Mail senden
- POST /api/quiz/generate-report — Report generieren + Report-Mail senden
- POST /api/email/send-report — Report-Mail manuell senden
- POST /api/email/send-plan-reminder — Wöchentliche Plan-Erinnerung
- POST /api/payments/create-checkout — Stripe Checkout Session
- GET /api/payments/status/{session_id} — Zahlungsstatus
- POST /api/webhook/stripe — Stripe Webhook + Payment-Mail
- POST /api/coach/chat — WladBot Interaktion

## Next Tasks
- [ ] Video-Plattform-Integration (6 Starter-Kurse)
- [ ] Lizenzschlüssel-System für Vollzahler (997 EUR)
- [ ] Backend-Refactoring: server.py in Router-Module aufteilen
- [ ] Plattform-Features (Simulation Audio, Kalender, Playbooks)
- [ ] Buch-Integration (PDFs)
- [ ] Mobile/Audio-Features (WladBot Sprach-Coach)

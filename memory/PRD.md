# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – Full Funnel: Diagnose -> Report -> 30-Tage Plan -> Upsell -> leader-os.de
Autor: Wladislaw Jachtchenko | Leader-OS Branding: Pure Black (#0a0a0a) + Neon Lime (#C8FF00)

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI: Quiz, Report, WladBot, Stripe, Email, License Keys, Admin
│   ├── email_templates.py     # 4 E-Mail Templates (Welcome, Report, Plan, Payment)
│   └── tests/
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # 5 A/B Headlines (Original + Hormozi + Brunson)
│   │   ├── UserForm.jsx       # Name/Email + DSGVO -> Welcome-Mail
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen Animation
│   │   ├── Report.jsx         # 6 Rollen + KI-Narrative + PDF + Auto-Email
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal
│   │   ├── HighTicketClose.jsx # 3 Tiers + Stripe + Key-Aktivierung
│   │   ├── PaymentSuccess.jsx  # Stripe -> leader-os.de
│   │   ├── ActivateKey.jsx    # License Key -> leader-os.de Redirect
│   │   ├── Admin.jsx          # Dashboard: Stats, Keys, Users, Transactions, Emails
│   │   └── Kurse.jsx          # 6 Video-Kurse (Vimeo Placeholder, Free Funnel)
│   └── components/
│       ├── Navbar.jsx
│       └── AICoach.jsx
```

## Implemented (Feb 2026)
- [x] Full Funnel: Hero -> UserForm -> Quiz -> Report -> Roadmap -> Upsell
- [x] 5 A/B Headlines (3 Original + Hormozi + Brunson Style)
- [x] Leader-OS Branding (Pure Black + Neon Lime)
- [x] Resend E-Mail Integration (4 Flows)
- [x] Enterprise License Key System (WLAD-XXXX-XXXX-XXXX)
- [x] Stripe Payment (3 Pakete: 0/997/4.997 EUR)
- [x] **Admin Dashboard** (/admin, Passwort: wladhub2026):
  - Overview: KPIs, Conversion Funnel
  - License Keys: Erstellen, Revoken, Auflisten
  - Users: Alle registrierten User
  - Transactions: Stripe-Zahlungen
  - E-Mails: Alle gesendeten Resend-Mails
- [x] **Video-Plattform** (/kurse):
  - 6 Starter-Kurse mit Vimeo-Platzhaltern
  - Kostenlos für alle (Free Funnel)
  - CTAs leiten zu leader-os.de
  - Verlinkt von Hero-Seite
- [x] PDF-Export (Report + Curriculum)

## Key API Endpoints
- POST /api/license/create | activate | validate | list | revoke
- GET /api/admin/stats | users | transactions | emails
- POST /api/email/send-report | send-plan-reminder
- POST /api/payments/create-checkout

## Next Tasks
- [ ] Vimeo Video-IDs einfügen (sobald Videos fertig)
- [ ] Backend-Refactoring: server.py in Router-Module aufteilen
- [ ] Plattform-Features (Simulation, Kalender, Playbooks)
- [ ] Mobile/Audio-Features (WladBot Sprach-Coach)

# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – Full Funnel: Diagnose -> Report -> 30-Tage Plan -> Upsell -> License Key -> leader-os.de
Autor: Wladislaw Jachtchenko | Leader-OS Branding: Pure Black (#0a0a0a) + Neon Lime (#C8FF00)

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI: Auth, Quiz, Report, WladBot, Stripe, Email, License Keys
│   ├── email_templates.py     # 4 E-Mail Templates (Welcome, Report, Plan, Payment)
│   └── tests/
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # 5 A/B Headlines (Original + Hormozi + Brunson)
│   │   ├── UserForm.jsx       # Name/Email + DSGVO + Rolle -> Welcome-Mail
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen + Leadership-Zitate
│   │   ├── Report.jsx         # 6 Rollen + KI-Narrative + PDF + Auto-Email
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal
│   │   ├── HighTicketClose.jsx # 3 Tiers + Stripe + "Key aktivieren" Link
│   │   ├── PaymentSuccess.jsx  # Stripe -> leader-os.de + Key aktivieren
│   │   └── ActivateKey.jsx    # License Key Eingabe -> Redirect leader-os.de
│   └── components/
│       ├── Navbar.jsx
│       └── AICoach.jsx
```

## Implemented (Feb 2026)
- [x] Full Funnel: Hero -> UserForm -> Quiz -> WladBot -> Report -> Roadmap -> Upsell -> Activate
- [x] **5 A/B Headlines** (3 Original + Alex Hormozi Style + Russell Brunson Style)
- [x] **Leader-OS Branding** — Pure Black + Neon Lime (#C8FF00)
- [x] **Resend E-Mail Integration** (4 Flows: Welcome, Report, Plan Reminder, Payment)
- [x] **Enterprise License Key System**:
  - Format: WLAD-XXXX-XXXX-XXXX
  - Auto-generiert nach Stripe-Zahlung
  - Manuell erstellbar (Admin)
  - Aktivierungsseite /activate -> Redirect zu leader-os.de
  - Status: active, used, revoked, expired
  - 1 Jahr Gültigkeit
  - MongoDB license_keys Collection
  - E-Mail mit Key nach Erstellung
- [x] Stripe Payment Integration (3 Pakete)
- [x] PDF-Export (Report + Curriculum)

## Key API Endpoints
- POST /api/license/create — Admin: Key erstellen
- POST /api/license/activate — User: Key aktivieren -> redirect leader-os.de
- GET /api/license/validate/{key} — Key prüfen
- GET /api/license/list — Admin: Alle Keys auflisten
- POST /api/license/revoke/{key} — Admin: Key deaktivieren
- POST /api/email/send-report — Report-Mail senden
- POST /api/email/send-plan-reminder — Wochen-Reminder
- POST /api/payments/create-checkout — Stripe Checkout

## Next Tasks
- [ ] Video-Plattform-Integration (6 Starter-Kurse)
- [ ] Backend-Refactoring: server.py in Router-Module aufteilen
- [ ] Plattform-Features (Simulation, Kalender, Playbooks)
- [ ] Mobile/Audio-Features (WladBot Sprach-Coach)

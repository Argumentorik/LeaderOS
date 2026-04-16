# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose -> 30-Tage Plan -> Upsell
Autor: Wladislaw Jachtchenko | Leader-OS Branding: Pure Black (#0a0a0a) + Neon Lime (#C8FF00)

## Architecture
```
/app
├── backend/server.py      # FastAPI: Auth, Quiz, Report (6 Rollen), WladBot, Stripe Payments
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # A/B Headlines, 10 Min, 6 KI-Agenten
│   │   ├── UserForm.jsx       # Name/Email + DSGVO + Rolle
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen + Leadership-Zitate
│   │   ├── Report.jsx         # 6 Rollen + KI-Narrative + PDF + 30-Tage-Plan + Buch-Upsell
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal + dynamisch
│   │   ├── HighTicketClose.jsx # 3 Tiers: 0/997/4.997 EUR + Stripe Checkout
│   │   └── PaymentSuccess.jsx  # Stripe Callback + Status-Polling
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation mit Lime-Green Branding
│   │   └── AICoach.jsx        # WladBot floating Chat Panel
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Design System (Leader-OS Branding)
- **Background**: #0a0a0a (Pure Black)
- **Accent Color**: #C8FF00 (Neon Lime/Green) - single accent for entire app
- **Text**: White (#ffffff) with slate-400/500 for secondary
- **Cards**: Glass-morphism with white/4% opacity
- **Buttons**: Lime green (#C8FF00) with black text, rounded-10px
- **Badges**: Lime green tinted backgrounds with lime borders
- **Fonts**: Manrope (headings) + Inter (body)
- **Style**: Minimalist, editorial, clean - matching leader-os.de

## Implemented (Feb 2026)
- [x] Full Funnel: Hero -> UserForm -> Quiz -> WladBot -> Report -> Roadmap -> Upsell
- [x] 5+1 Leadership-Rollen (Kommunikator, Manager, Teamleiter, Psychologe, Problemloser, Innovator)
- [x] **Stripe Payment Integration** – 3 Pakete:
  - Kostenlos (0 EUR, Free Access)
  - Standard (997 EUR/Jahr oder 83,08 EUR/Monat in 12 Raten)
  - Fast Track (4.997 EUR/Jahr, 6x 1:1 Calls inkl.)
- [x] 14-Tage-Trial Messaging, Stripe Checkout Redirect, Status-Polling
- [x] Payment Success Page mit Polling & Bestatigung
- [x] MongoDB payment_transactions Collection
- [x] 3-Spalten Pricing (Kostenlos | Standard | Fast Track)
- [x] Buch-Funnel: "Die 5 Rollen einer Fuhrungskraft" als Gratis-Belohnung
- [x] 6 Kurse (5 Leadership + 1 AI)
- [x] Gewichtete Scoring-Matrix (6 Rollen x 6 Kategorien)
- [x] Dynamische Roadmap mit personalisiertem Hinweis
- [x] 6 KI-Agenten Konzept (Diagnose, Coach, Task, Simulations, Strategie, Community)
- [x] Leadership-Zitate auf Analyseseite
- [x] **Leader-OS Branding** (Feb 2026): Komplettes Redesign aller Seiten auf Pure Black + Neon Lime (#C8FF00)
  - Alle CSS-Variablen, Buttons, Badges, Gradients auf Lime umgestellt
  - PDF-Export (Report + Curriculum) auf neues Farbschema aktualisiert
  - AI Coach Panel auf Lime Branding
  - Alle Seiten (Hero, UserForm, Quiz, Analyzing, Report, Roadmap, HighTicketClose, PaymentSuccess) konsistent
- [x] DSGVO, SSL, A/B Headlines, WladBot
- [x] "Made with Emergent" Badge entfernt

## Key API Endpoints
- POST /api/payments/create-checkout – Stripe Checkout Session erstellen
- GET /api/payments/status/{session_id} – Zahlungsstatus abfragen
- POST /api/webhook/stripe – Stripe Webhook
- POST /api/quiz/generate-report – Report generieren
- POST /api/coach – WladBot Interaktion

## Next Tasks
- [ ] E-Mail-Flow (Resend: Report + License Key per E-Mail)
- [ ] Video-Plattform-Integration (aigumentorik.framer.ai / 6 Starter-Kurse)
- [ ] Lizenzschlussel-System fur Vollzahler (997 EUR)
- [ ] Plattform-Features (Simulation Audio, Kalender, Playbooks, Tasks)
- [ ] Buch-Integration (4-5 Bucher als PDFs)
- [ ] Mobile/Audio-Features (WladBot Sprach-Coach)
- [ ] Backend-Refactoring: server.py in Router-Module aufteilen (routes/stripe.py, routes/report.py)

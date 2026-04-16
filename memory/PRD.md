# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose → 30-Tage Plan → Upsell
Autor: Wladislaw Jachtchenko | Cinematic Modern Noir Design

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
│   │   ├── HighTicketClose.jsx # 3 Tiers: €0/€997/€4.997 + Stripe Checkout
│   │   └── PaymentSuccess.jsx  # Stripe Callback + Status-Polling
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Implemented (Feb 2026)
- [x] Full Funnel: Hero → UserForm → Quiz → WladBot → Report → Roadmap → Upsell
- [x] 5+1 Leadership-Rollen (Kommunikator, Manager, Teamleiter, Psychologe, Problemlöser, Innovator)
- [x] **Stripe Payment Integration** – 3 Pakete:
  - Kostenlos (€0, Free Access)
  - Standard (€997/Jahr oder €83,08/Monat in 12 Raten)
  - Fast Track (€4.997/Jahr, 6x 1:1 Calls inkl.)
- [x] 14-Tage-Trial Messaging, Stripe Checkout Redirect, Status-Polling
- [x] Payment Success Page mit Polling & Bestätigung
- [x] MongoDB payment_transactions Collection
- [x] 3-Spalten Pricing (Kostenlos | Standard | Fast Track)
- [x] Buch-Funnel: "Die 5 Rollen einer Führungskraft" als Gratis-Belohnung
- [x] 6 Kurse (5 Leadership + 1 AI)
- [x] Gewichtete Scoring-Matrix (6 Rollen × 6 Kategorien)
- [x] Dynamische Roadmap mit personalisiertem Hinweis
- [x] 6 KI-Agenten Konzept (Diagnose, Coach, Task, Simulations, Strategie, Community)
- [x] Leadership-Zitate auf Analyseseite
- [x] Rollenfarben: Kommunikator=Orange, Innovator=Gelb, Psychologe=Hellblau
- [x] "Made with Emergent" Badge entfernt
- [x] DSGVO, SSL, A/B Headlines, WladBot

## Key API Endpoints
- POST /api/payments/create-checkout – Stripe Checkout Session erstellen
- GET /api/payments/status/{session_id} – Zahlungsstatus abfragen
- POST /api/webhook/stripe – Stripe Webhook
- POST /api/quiz/generate-report – Report generieren
- POST /api/coach – WladBot Interaktion

## Next Tasks
- [ ] E-Mail-Flow (Resend: Report + License Key per E-Mail)
- [ ] Dynamische Roadmap-Tasks (schwächste Rolle → konkrete Wochenaufgaben)
- [ ] Video-Plattform-Integration (aigumentorik.framer.ai)
- [ ] Lizenzschlüssel-System
- [ ] Plattform-Features (Simulation Audio, Kalender, Playbooks, Tasks)
- [ ] Buch-Integration (4-5 Bücher als PDFs)
- [ ] Mobile/Audio-Features (WladBot Sprach-Coach)

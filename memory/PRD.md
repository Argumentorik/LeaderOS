# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose → 30-Tage Plan → Upsell

## Architecture
```
/app
├── backend/server.py      # FastAPI: Auth, Quiz, Report (6 Roles), WladBot
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # A/B Headlines, 10 Min, 6 KI-Agenten
│   │   ├── UserForm.jsx       # Name/Email + DSGVO
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen + Leadership-Zitate
│   │   ├── Report.jsx         # 6 Rollen (neue Farben) + Credo + PDF + Agent-Ökosystem
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal + Pop-up 1x/Session
│   │   └── HighTicketClose.jsx # €997 + €6.000 + "Kostenlos testen" klar
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Implemented
- [x] Full Funnel: Diagnose → Quiz → WladBot → Report → Roadmap → Upsell
- [x] 5+1 Leadership-Rollen (inkl. Innovator)
- [x] "10 Minuten" Diagnose-Dauer überall korrekt angezeigt
- [x] 6 KI-Agenten-Konzept: Diagnose-Agent, Coach-Agent, Task-Agent, Simulations-Agent, Strategie-Agent, Community-Agent
- [x] Roadmap: High-Level Wochen-Tabs (W01-W04) mit Tasks, Agenten & Meilensteinen
- [x] Pop-up nur 1x pro Session (30s Delay, nach Journal-Completion)
- [x] Neue Rollenfarben: Kommunikator=Orange, Innovator=Gelb, Psychologe=Hellblau
- [x] Leadership-Zitate auf Analyseseite
- [x] "Kostenlos testen – keine Zahlung nötig" klar kommuniziert
- [x] Mandatory 6-Entry Leadership-Journal (gates CTA)
- [x] Price Stack: Standard €997 + Fast Track €6.000 (EMPFOHLEN)
- [x] Stripe Payment Embed Placeholder (ready for user to connect)
- [x] 3-Column Comparison Table (Kostenlos/Standard/Fast Track)
- [x] KI Don'ts List (Bonus), Curriculum PDF, Social Sharing
- [x] WladBot: "Hi, ich bin der WladBot!", nahbar, motivierend
- [x] DSGVO, SSL, A/B Headlines, ScrollToTop, 10-Phasen Analyzing

## Mocked
- Payment: Stripe embed placeholder (user connects themselves)

## Pending Issues
- [ ] P1: Dynamische Roadmap-Logik (schwächste Rolle zuerst sortieren)
- [ ] P1: Scoring-Matrix verbessern (präzisere Zuordnung)
- [ ] P2: PDF-Download reparieren (wiederkehrender Bug)

## Next
- [ ] Stripe-Integration (14-Tage-Trial)
- [ ] Dynamische Roadmap basierend auf Report-Ergebnissen
- [ ] Video-Plattform-Integration (aigumentorik.framer.ai)
- [ ] Lizenzschlüssel-System
- [ ] Resend E-Mail: Report + License Key

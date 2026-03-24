# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose → 30-Tage Plan → Upsell
Autor: Wladislaw Jachtchenko | Cinematic Modern Noir Design

## Architecture
```
/app
├── backend/server.py      # FastAPI: Auth, Quiz, Report (6 Rollen, gewichtete Matrix), WladBot
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # A/B Headlines, 10 Min, 6 KI-Agenten
│   │   ├── UserForm.jsx       # Name/Email + DSGVO + Rolle
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen + Leadership-Zitate
│   │   ├── Report.jsx         # 6 Rollen (neue Farben) + KI-Narrative + PDF + 30-Tage-Plan + Buch-Upsell
│   │   ├── Roadmap.jsx        # 6 Agenten + Wochen-Tabs + Journal + Pop-up 1x/Session + dynamisch
│   │   └── HighTicketClose.jsx # €997/Jahr + €4.997 + Kostenlos + Buch-Funnel
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Implemented (Feb 2026)
- [x] Full Funnel: Hero → UserForm → Quiz → WladBot → Report → Roadmap → Upsell
- [x] 5+1 Leadership-Rollen (Kommunikator, Manager, Teamleiter, Psychologe, Problemlöser, Innovator)
- [x] "10 Minuten" Diagnose-Dauer (5 Stellen Hero, 1 UserForm)
- [x] 6 KI-Agenten: Diagnose, Coach, Task, Simulations, Strategie, Community
- [x] Roadmap: High-Level Wochen-Tabs (W01-W04) mit Tasks, Agenten & Meilensteinen
- [x] Dynamische Roadmap: Zeigt personalisierte Hinweise basierend auf Report-Ergebnissen
- [x] Pop-up nur 1x pro Session (30s Delay, sessionStorage, "Nein danke"-Option)
- [x] Rollenfarben: Kommunikator=Orange(#F97316), Innovator=Gelb(#EAB308), Psychologe=Hellblau(#38BDF8)
- [x] Leadership-Zitate auf Analyseseite (8 Zitate, zufällig)
- [x] Pricing: Standard €997/Jahr + Fast Track €4.997 (6x 1:1 Calls, Quarterly Reviews, Onboarding)
- [x] "Kostenlos starten" Button auf HighTicketClose (navigiert zu /roadmap)
- [x] Buch-Funnel: "Die 5 Rollen einer Führungskraft" als Gratis-Belohnung
- [x] 6 Kurse (5 Leadership + 1 AI) statt 8
- [x] Gewichtete Scoring-Matrix im Backend (6 Rollen × 6 Kategorien mit Koeffizienten)
- [x] PDF-Download mit robuster Fehlerbehandlung (try/catch)
- [x] Report: Personalisierter 30-Tage-Lernplan (schwächste Rollen zuerst)
- [x] Report: Buch-Upsell Sektion
- [x] 14 Tage kostenlos testen · 1 Jahr Mitgliedschaft · Verlängerbar
- [x] Comparison-Table: Kostenlos/Standard/Fast Track mit 14 Features
- [x] DSGVO, SSL, A/B Headlines, ScrollToTop
- [x] WladBot: nahbar, motivierend
- [x] Mandatory 6-Entry Leadership-Journal (gates CTA)

## Mocked
- Stripe Payment: Platzhalter mit dashed border (User connects)

## Pending Issues
- [ ] P2: PDF-Download vollständig testen im E2E-Flow

## Next Tasks
- [ ] P0: Stripe-Integration (14-Tage-Trial, Kreditkarte vorab)
- [ ] P1: E-Mail-Flow (Name/Email → Free Video Funnel → Upsell per Resend)
- [ ] P1: Dynamic Roadmap – schwächste Rolle aus Report priorisiert in Wochen-Tasks
- [ ] P2: Video-Plattform-Integration (aigumentorik.framer.ai)
- [ ] P2: Lizenzschlüssel-System
- [ ] P3: Plattform-Features (Simulation mit Audio, Kalender, Playbooks, Tasks)
- [ ] P3: Buch-Integration (4-5 Bücher als PDFs einlesen)
- [ ] P3: Mobile/Audio-Features (Vorlesen, Telefonieren mit WladBot)

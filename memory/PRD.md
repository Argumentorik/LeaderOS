# WLADHUB - Product Requirements Document

## Original Problem Statement
Eine High-End-Web-Applikation namens "WLADHUB" (Leadership-Diagnostic Hub). Die Anwendung bewertet Führungskräfte anhand eines 3-Layer-Modells (AI Literacy, Real-World Rhetoric, Strategic EQ) mit "Cinematic Modern Noir"-Ästhetik.

## Core Requirements
1. **Landing Page:** 10 Sektionen mit Problem, Lösung (3-Layer-Modell), Diagnose, WLADHUB-Plattform, WLADBOT (KI-Coach)
2. **Diagnostic Tool:** 30 szenario-basierte Multiple-Choice-Fragen, rollenspezifisch
3. **Benutzererfassung:** Name/E-Mail + optionaler Google-Login
4. **Ergebnis-Report:** Dynamischer Report mit KI-generierter Narrative, Radar-Chart, Layer-Scores, Empfehlungen
5. **High-Ticket Close:** Upsell-Seite mit Social-Media-Sharing
6. **Design:** Cinematic Modern Noir mit Orange/Amber-Akzenten

## Architecture
```
/app
├── backend/
│   ├── server.py         # FastAPI: Auth, Quiz, Report, Coach, Email
│   └── .env              # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── data/questions.js  # 30 MC-Fragen, 4 Rollen
│   │   ├── pages/
│   │   │   ├── Hero.jsx, UserForm.jsx, Quiz.jsx
│   │   │   ├── Analyzing.jsx, Report.jsx
│   │   │   ├── Roadmap.jsx, HighTicketClose.jsx
│   │   │   └── AuthCallback.jsx
│   │   └── components/
│   │       ├── Navbar.jsx, AICoach.jsx
│   │       └── ui/  (Shadcn)
│   └── .env
└── memory/PRD.md
```

## What's Implemented (as of 2026-03-13)
- [x] Landing Page (10 Sektionen, Cinematic Modern Noir)
- [x] WLADHUB Branding
- [x] Rollenauswahl (5 Optionen) mit Hinweis auf individuelle Fragen
- [x] Name/Email-Formular + optionaler Google-Login
- [x] 30 Multiple-Choice-Fragen (szenario-basiert, 4 Rollen)
- [x] Quiz-Logik: Fortschritt, Auto-Advance, Navigation
- [x] Submit-Button "Deinen 30-Tage-Plan aktivieren"
- [x] Backend: User-Erstellung, Quiz-Auswertung, Report-Generierung
- [x] KI-Narrative via Claude Sonnet (emergentintegrations)
- [x] Report: Radar-Chart, Layer-Scores, ROI, Empfehlungen
- [x] AI Coach (WLADBOT) Endpoint
- [x] Analyzing-Seite mit W-Logo und Animation
- [x] Roadmap (30-Tage-Plan, 4 Phasen, 7 Module)
- [x] Close/Upgrade-Seite mit Social Links
- [x] Navbar mit Progress-Breadcrumbs
- [x] DSGVO: Datenschutz, Daten-Löschung
- [x] Voice-Feature entfernt (Ship First Funnel)
- [x] UX-Polish: Alle Klicks getestet und verifiziert

## Prioritized Backlog

### P1 - Content & Polish
- [ ] Leadership-Typen (5 Rollen) basierend auf Quiz-Ergebnis zuweisen
- [ ] Methodenbank pro Typ (Eisenhower, ALPEN, Pareto, etc.)
- [ ] Social Sharing mit Leadership-Typ auf LinkedIn

### P2 - Integrations
- [ ] Resend Integration: E-Mail-Versand des Reports
- [ ] polar.sh Integration: Bezahlung / Upsell
- [ ] Voice Question Feature: Neu konzipieren

### P3 - Advanced Features
- [ ] AI Coach interaktive Demo
- [ ] LinkedIn-Login
- [ ] Daily Intelligence Hub

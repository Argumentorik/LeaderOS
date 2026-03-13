# WLADHUB - Product Requirements Document

## Original Problem Statement
WLADHUB (Leadership-Diagnostic Hub) – bewertet Führungskräfte anhand eines 3-Layer-Modells + 5+1 Leadership-Rollen mit "Cinematic Modern Noir"-Ästhetik.

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI: Auth, Quiz, Report (6 Roles), Coach, Email
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router + ScrollToTop
│   │   ├── data/questions.js  # 30 MC-Fragen, 4 Rollen
│   │   ├── utils/
│   │   │   ├── generatePDF.js          # Report PDF (6 Roles)
│   │   │   └── generateCurriculumPDF.js # Curriculum PDF
│   │   ├── pages/
│   │   │   ├── Hero.jsx          # Landing (A/B Headlines, "5+1 Rollen")
│   │   │   ├── UserForm.jsx      # Rollenauswahl + Name/Email + DSGVO
│   │   │   ├── Quiz.jsx          # 30 MC + WladBot Chat at Q30
│   │   │   ├── Analyzing.jsx     # 10 Phasen mit Icons
│   │   │   ├── Report.jsx        # 6 Rollen + Credo + AI Report
│   │   │   ├── Roadmap.jsx       # "30 Tage zur strat. Dominanz" + 8 Kurse
│   │   │   └── HighTicketClose.jsx # Upsell + Curriculum PDF
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       └── AICoach.jsx       # Wlad (nahbar, persönlich)
│   └── .env
└── memory/PRD.md
```

## What's Implemented
- [x] Landing Page (A/B Headlines, "5+1 Rollen", "5 Minuten")
- [x] DSGVO-Vertrauenssiegel (DSGVO-konform, SSL, Serverstandort DE)
- [x] Google-Login entfernt
- [x] 30 MC-Fragen (szenario-basiert, rollenspezifisch)
- [x] WladBot AI Chat nach Q30 (ChatGPT-Style, heller/besser)
- [x] Analyzing: 10 Phasen mit Icons, animated Grid
- [x] 5+1 Leadership-Rollen (Kommunikator, Manager, Team Leader, Psychologe, Problemlöser, Innovator)
- [x] Report: TOP/FOCUS Badges, Stärken/Schwächen-Analyse
- [x] Credo: "Mastering the 5+1 Roles of the Ideal Leader"
- [x] Roadmap: "30 Tage zur strategischen Dominanz", 8 Kurse, Events, AI Guidance
- [x] AI Basics als KEY Startpunkt
- [x] 1:1 Gespräch, Live Events, Special Event Tab
- [x] CTAs: "Jetzt Zugang freischalten"
- [x] PDF Report + Curriculum Download
- [x] ScrollToTop bei allen Navigationen
- [x] Claude Sonnet AI-Narrative

## Prioritized Backlog
### P1
- [ ] Resend Integration: Report per E-Mail
- [ ] polar.sh Integration: Bezahlung/Upsell
### P2
- [ ] Voice Feature, LinkedIn-Login
- [ ] A/B Analytics Dashboard
### P3
- [ ] Extended AI Coach, Daily Intelligence Hub

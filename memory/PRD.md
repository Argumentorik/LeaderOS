# WLADHUB - Product Requirements Document

## Original Problem Statement
Eine High-End-Web-Applikation namens "WLADHUB" (Leadership-Diagnostic Hub). Die Anwendung bewertet Führungskräfte anhand eines 3-Layer-Modells (AI Literacy, Real-World Rhetoric, Strategic EQ) mit "Cinematic Modern Noir"-Ästhetik.

## Architecture
```
/app
├── backend/
│   ├── server.py         # FastAPI: Auth, Quiz, Report (5 Roles), Coach, Email
│   └── .env              # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router + ScrollToTop
│   │   ├── data/questions.js  # 30 MC-Fragen, 4 Rollen
│   │   ├── utils/
│   │   │   ├── generatePDF.js          # Report PDF (5 Roles)
│   │   │   └── generateCurriculumPDF.js # Curriculum PDF
│   │   ├── pages/
│   │   │   ├── Hero.jsx          # Landing (A/B Headlines)
│   │   │   ├── UserForm.jsx      # Rollenauswahl + Name/Email + DSGVO
│   │   │   ├── Quiz.jsx          # 30 MC + WladBot at Q30
│   │   │   ├── Analyzing.jsx     # Progress Animation
│   │   │   ├── Report.jsx        # 5 Roles + Credo + AI Report
│   │   │   ├── Roadmap.jsx       # 30-Tage-Plan
│   │   │   └── HighTicketClose.jsx # Upsell + Curriculum PDF
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       └── AICoach.jsx       # WladBot (Wlad personality)
│   └── .env
└── memory/PRD.md
```

## What's Implemented
- [x] Landing Page (10 Sektionen, Cinematic Modern Noir, A/B Headlines)
- [x] WLADHUB Branding
- [x] Headline A/B Testing (3 Varianten, sessionStorage)
- [x] Rollenauswahl (5 Optionen) mit individuellen Fragen
- [x] Name/Email-Formular (Google-Login entfernt)
- [x] DSGVO-Vertrauenssiegel (DSGVO-konform, SSL, Serverstandort DE)
- [x] 30 Multiple-Choice-Fragen (szenario-basiert)
- [x] WladBot AI Chat nach Frage 30 (ChatGPT-Style)
- [x] WladBot Persönlichkeit = Wlad, nahbar, direkt
- [x] 5 Leadership-Rollen Scoring (Communicator, Manager, Team Leader, Psychologist, Problem Solver)
- [x] Stärkste/Schwächste Rolle Analyse (TOP/FOCUS Badges)
- [x] Credo-Sektion: "Mastering the 5 Roles of the Ideal Leader"
- [x] AI-Narrative via Claude Sonnet
- [x] Report: Radar-Chart, 6 Dimensionen, 3 Layer-Scores, ROI, Empfehlungen
- [x] PDF Report Download (personalisiert, 3 Seiten, 5 Rollen)
- [x] Curriculum PDF Download
- [x] Scroll-to-Top bei allen Navigationen
- [x] Roadmap (30-Tage-Plan, 4 Phasen)
- [x] Close/Upgrade-Seite mit Social Links

## Prioritized Backlog

### P1
- [ ] Resend Integration: Report per E-Mail versenden
- [ ] polar.sh Integration: Bezahlung / Upsell
- [ ] A/B Testing Analytics (welche Headline konvertiert besser)

### P2
- [ ] Voice Question Feature neu konzipieren
- [ ] LinkedIn-Login
- [ ] Daily Intelligence Hub

### P3
- [ ] AI Coach interaktive Demo mit mehr Datenerfassung
- [ ] Erweiterte Analytics Dashboard

# WLADHUB - Product Requirements Document

## Original Problem Statement
WLADHUB (Leadership-Diagnostic Hub) – bewertet Führungskräfte anhand eines 3-Layer-Modells + 5+1 Leadership-Rollen. "Cinematic Modern Noir"-Ästhetik. Funnel: Diagnose → 30-Tage Plan → Video-Plattform/Upsell.

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI: Auth, Quiz, Report (6 Roles), WladBot Coach
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router + ScrollToTop
│   │   ├── data/questions.js  # 30 MC-Fragen
│   │   ├── utils/
│   │   │   ├── generatePDF.js          # Report PDF (6 Roles)
│   │   │   └── generateCurriculumPDF.js # Curriculum PDF
│   │   ├── pages/
│   │   │   ├── Hero.jsx          # A/B Headlines
│   │   │   ├── UserForm.jsx      # Name/Email + DSGVO
│   │   │   ├── Quiz.jsx          # 30 MC + WladBot Q30
│   │   │   ├── Analyzing.jsx     # 10 Phasen
│   │   │   ├── Report.jsx        # 6 Rollen + Credo
│   │   │   ├── Roadmap.jsx       # Journal + 8 Kurse + Upsell
│   │   │   └── HighTicketClose.jsx # €997 + Don'ts List
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       └── AICoach.jsx       # WladBot
│   └── .env
```

## Implemented Features
- [x] 3-Layer Funnel: Diagnose → 30-Tage Plan → Upsell
- [x] WladBot Tone: "Hi, ich bin der WladBot!", nahbar, motivierend
- [x] 5+1 Leadership-Rollen (inkl. Innovator)
- [x] €997 Vollzugang (License Key, Community, 23 Kurse)
- [x] KI Don'ts List (Bonus)
- [x] Interactive 6-Entry Journal + WladBot Motivation
- [x] Upsell Pop-Ups (nach Journal + auf Close-Seite)
- [x] Free vs Vollzugang Vergleichstabelle
- [x] Report + Curriculum PDF Download
- [x] A/B Headline Testing
- [x] DSGVO-Vertrauenssiegel
- [x] 10-Phasen Analyzing Animation
- [x] 8 Kurse mit AI Basics als KEY
- [x] Social Sharing Links
- [x] ScrollToTop, "5 Minuten", alle CTAs korrekt

## Mocked
- Payment: €997 CTA zeigt Alert statt echte Zahlung

## Backlog
### P1
- [ ] polar.sh / Stripe für echte Zahlung
- [ ] Resend E-Mail: Report + License Key
### P2
- [ ] A/B Analytics Dashboard
- [ ] Voice Feature
### P3
- [ ] Extended AI Coach, Daily Intelligence Hub

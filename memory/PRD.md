# WLADHUB - Product Requirements Document

## Overview
WLADHUB (Leadership-Diagnostic Hub) – 3-Layer Funnel: Diagnose → 30-Tage Plan → Upsell

## Architecture
```
/app
├── backend/server.py      # FastAPI: Auth, Quiz, Report (6 Roles), WladBot
├── frontend/src/
│   ├── pages/
│   │   ├── Hero.jsx           # A/B Headlines
│   │   ├── UserForm.jsx       # Name/Email + DSGVO
│   │   ├── Quiz.jsx           # 30 MC + WladBot Q30
│   │   ├── Analyzing.jsx      # 10 Phasen
│   │   ├── Report.jsx         # 6 Rollen + Credo + PDF
│   │   ├── Roadmap.jsx        # Journal (mandatory 6) + 8 Kurse
│   │   └── HighTicketClose.jsx # €997 + €6.000 Price Stack
│   └── utils/generatePDF.js, generateCurriculumPDF.js
```

## Implemented
- [x] Full Funnel: Diagnose → Quiz → WladBot → Report → Roadmap → Upsell
- [x] 5+1 Leadership-Rollen (inkl. Innovator)
- [x] Mandatory 6-Entry Leadership-Journal (gates CTA)
- [x] Price Stack: Standard €997 + Fast Track €6.000 (EMPFOHLEN)
- [x] Stripe Payment Embed Placeholder (ready for user to connect)
- [x] 3-Column Comparison Table (Kostenlos/Standard/Fast Track)
- [x] KI Don'ts List (Bonus), Curriculum PDF, Social Sharing
- [x] WladBot: "Hi, ich bin der WladBot!", nahbar, motivierend
- [x] DSGVO, SSL, A/B Headlines, ScrollToTop, 10-Phasen Analyzing

## Mocked
- Payment: Stripe embed placeholder (user connects themselves)

## Next
- [ ] User connects Stripe for real payments
- [ ] Resend E-Mail: Report + License Key

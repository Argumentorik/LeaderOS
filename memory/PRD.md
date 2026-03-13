# WLADHUB Leadership Diagnose – PRD

## Original Problem Statement
Build a high-end German-language web application "WLADHUB Leadership Diagnose" based on the 3-Layer Leadership Model (KI-Kompetenz, Boardroom-Rhetorik, Strategisches EQ). A conversion funnel for leadership assessment with AI-generated personalized reports.

## Brand
- **Name:** WLADHUB
- **Product:** Leadership Diagnose
- **AI Coach:** WLADBOT
- **Platform:** WLADHUB Plattform

## Architecture

### Stack
- **Frontend:** React + Tailwind CSS + Recharts
- **Backend:** FastAPI + MongoDB
- **AI:** Claude Sonnet 4.5 via Emergent LLM Key
- **Email:** Resend (configured, awaiting API key)
- **Future Payments:** Polar.sh (linked in CTAs)

### API Endpoints
- `GET /api/health` – Health check
- `POST /api/user/create` – Lead capture (Name, Email, Role)
- `POST /api/quiz/generate-report` – Process 50 quiz answers + Claude report
- `GET /api/report/{session_id}` – Fetch report
- `POST /api/coach/chat` – WLADBOT chat (Claude)
- `POST /api/email/send-report` – Send HTML email report (Resend)

### Frontend Routes
- `/` – Hero page (10 sections landing page)
- `/diagnose` – User form (role + name/email)
- `/quiz` – 50-question diagnostic
- `/analyzing` – Loading + API call
- `/report` – Personal Potential Report
- `/roadmap` – 30-Day Action Plan
- `/close` – High-Ticket Close page

## Landing Page Sections (Implemented)
1. **Hero:** "Die neue Elite der Führungskräfte beherrscht drei Fähigkeiten gleichzeitig"
2. **Problem:** Typische Muster + Konsequenzen
3. **3-Layer-Modell:** KI-Kompetenz, Boardroom-Rhetorik, Strategisches EQ
4. **Diagnose:** Was du erhältst (5+1 Dimensionen, 3-Layer Score, 30-Tage-Plan, ROI)
5. **WLADHUB Plattform:** Platform preview + features
6. **WLADBOT:** AI Coach preview + use cases
7. **Leadership Kurs:** Bonus course access
8. **Zielgruppe:** Selbstständige, Angestellte, Senior Manager, High Potentials
9. **Final CTA:** "Gehörst du zu den 3% der Leader..."
10. **Footer:** WLADHUB branding

## User Personas
- **Selbstständige:** Die KI-Transformation steuern – ohne persönliche Autorität zu verlieren
- **Angestellte:** Boardroom-Entscheidungen mit strategischem EQ beschleunigen
- **Senior Manager:** Von der Führungskraft zur unverzichtbaren Schlüsselperson werden
- **High Potentials:** Den Aufstieg in die Elite-Leadership gezielt beschleunigen

## Core Requirements (Static)
1. German language throughout
2. Cinematic Modern Noir design (Cold Blue #3B82F6, Warm Amber #F59E0B)
3. 50-question diagnostic covering 6 areas (Rhetorik, Kritisches Denken, Entscheidung, Führung, EQ, Strategie)
4. 3-Layer scoring model (KI-Kompetenz, Boardroom-Rhetorik, Strategisches EQ)
5. Claude AI-generated personalized German report
6. Report delivery via email (Resend)
7. 30-Day roadmap with 7 course categories
8. WLADBOT sidebar (24/7, knows user profile)
9. Upsell to WLADHUB Plattform
10. Future Polar.sh integration for payment

## What's Been Implemented (Updated: December 2025)

### ✅ Completed Features

#### Landing Page Content Update (December 2025)
- Complete 10-section landing page with user-provided content
- WLADHUB branding throughout
- WLADBOT as the AI Coach name
- All sections from user specification implemented

#### UI/UX Design (December 2025)
- **Design System:**
  - Background: #030303 (pure dark)
  - Primary Blue: #3B82F6
  - Accent Amber: #F59E0B
  - Pill-shaped buttons (border-radius: 100px)
  - Glassmorphism cards (backdrop-blur: 20px)
  - Modern hover effects with transform and shadows
- **Typography:** Manrope for headings, Inter for body
- **Animations:** fadeInUp, slideUp, scale effects with staggered delays

#### Full User Flow
- Hero → UserForm → Quiz → Analyzing → Report → Roadmap → Close
- AI Coach (WLADBOT) available on Report, Roadmap, Close pages

### Infrastructure
- MongoDB: `emergent_diagnostic` database
- API: All endpoints tested (100% pass rate)
- Health check endpoint working

## Prioritized Backlog

### P0 (Critical – next session)
- [ ] Add Resend API key for email delivery
- [ ] Test full 50-question flow in production

### P1 (High Priority)
- [ ] Polar.sh payment integration for WLADHUB Plattform
- [ ] Actual WLADHUB Plattform links/redirects
- [ ] Report PDF download generation
- [ ] Session refresh persistence (currently localStorage only)

### P2 (Nice to Have)
- [ ] Admin dashboard for lead management
- [ ] A/B testing for hero CTAs
- [ ] Multi-language toggle (DE/EN)
- [ ] Progress saving (resume quiz after refresh)
- [ ] LinkedIn sharing of results

## Test Reports
- `/app/test_reports/iteration_2.json` - Latest test results (100% pass)

## Design Reference
- Figma: https://www.figma.com/design/8Lr9zUQsHZhnkedNvKzTmj/wladbot---main-homepage
- Reference: https://communicaire.framer.ai/

## Next Tasks
1. Provide Resend API key (`re_...` from resend.com) → email delivery active
2. Connect Polar.sh for WLADHUB Plattform upsell
3. Add actual links to WLADHUB Plattform
4. Consider session persistence for quiz progress

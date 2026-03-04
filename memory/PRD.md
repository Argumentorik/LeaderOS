# EMERGENT Diagnostic Hub – PRD

## Original Problem Statement
Build a high-end German-language web application "EMERGENT Diagnostic Hub" based on the 3-Layer Leadership Model (AI Literacy, Real-World Rhetoric, Strategic EQ). A conversion funnel for leadership assessment with AI-generated personalized reports.

## Architecture

### Stack
- **Frontend:** React + Tailwind CSS + Recharts
- **Backend:** FastAPI + MongoDB
- **AI:** Claude Sonnet 4.5 via Emergent LLM Key
- **Email:** Resend (configured, awaiting API key)
- **Future Payments:** Polar.sh (linked in CTAs)

### API Endpoints
- `POST /api/user/create` – Lead capture (Name, Email, Role)
- `POST /api/quiz/generate-report` – Process 50 quiz answers + Claude report
- `GET /api/report/{session_id}` – Fetch report
- `POST /api/coach/chat` – AI Coach chat (Claude)
- `POST /api/email/send-report` – Send HTML email report (Resend)

### Frontend Routes
- `/` – Hero page (landing)
- `/diagnose` – User form (role + name/email)
- `/quiz` – 50-question diagnostic
- `/analyzing` – Loading + API call
- `/report` – Personal Potential Report
- `/roadmap` – 30-Day Action Plan
- `/close` – High-Ticket Close page

## User Personas
- **Gründer / CEO:** Want to navigate AI era without losing authority
- **C-Level Executive:** Need boardroom presence in AI transformation
- **Senior Manager:** Want to become indispensable leadership
- **Investor:** Evaluate leadership quality in portfolio companies
- **High-Potential:** Accelerate to elite leadership

## Core Requirements (Static)
1. German language throughout
2. Cinematic Modern Noir design (Cold Blue #3B82F6, Warm Amber #D97706)
3. 50-question diagnostic covering 6 areas (Rhetorik, Kritisches Denken, Entscheidung, Führung, EQ, Strategie)
4. 3-Layer scoring model (AI Literacy, Boardroom-Rhetorik, Strategisches EQ)
5. Claude AI-generated personalized German report
6. Report delivery via email (Resend)
7. 30-Day roadmap with 7 course categories
8. AI Coach sidebar (24/7, knows user profile)
9. Upsell to "AI Learn Space" platform
10. Future Polar.sh integration for payment

## What's Been Implemented (as of initial build - February 2026)

### ✅ Completed Features
- **Hero Page:** Full cinematic design, brutal reality stats (71%, 40%, 3.7x), 3-Layer model showcase, dual CTAs
- **User Form:** Role selection (5 roles) → Name/Email form → API save
- **50-Question Quiz:** All 50 German scenarios across 6 categories, one-at-a-time placement-test style, progress bar, back navigation, auto-advance on selection
- **Analyzing Page:** Loading animation with phase messages, real Claude API call, email report sent on completion
- **Report Page:** Profile title, executive summary, 3-layer score cards, Recharts radar chart, ROI metrics (hours saved, decision speed, performance boost), 3 recommendations, Daily Intelligence Hub mockup, urgency message
- **Roadmap Page:** 4-phase structure (Master Yourself → Communication → Leadership+AI → Strategic Dominance), all 7 course categories, module details
- **High-Ticket Close:** "Wir automatisieren keine Leader. Wir upgraden sie." headline, comparison table (Without System vs With EMERGENT), 3 CTA options (AI Learn Space, PDF, Strategy Call), Polar.sh link
- **AI Coach:** Floating chat panel, Claude-powered, knows user profile, 4 preset prompts, works on /report, /roadmap, /close
- **Email:** Full HTML email template with report data, Claude analysis, ROI metrics, upsell CTA (needs Resend API key)
- **Navbar:** Fixed dark navbar with funnel progress indicator

### Infrastructure
- MongoDB: `emergent_diagnostic` database, `users` + `reports` collections
- API: All endpoints tested and working (100% backend pass)
- Design: Manrope + Inter fonts, glass cards, glow effects, CSS animations

## Prioritized Backlog

### P0 (Critical – next session)
- [ ] Add Resend API key for email delivery
- [ ] Test full 50-question flow in production

### P1 (High Priority)
- [ ] Polar.sh payment integration for AI Learn Space
- [ ] Actual video course player/links for 7 course categories
- [ ] Report PDF download generation
- [ ] Session refresh persistence (currently localStorage only)

### P2 (Nice to Have)
- [ ] Admin dashboard for lead management
- [ ] A/B testing for hero CTAs
- [ ] Multi-language toggle (DE/EN)
- [ ] Progress saving (resume quiz after refresh)
- [ ] LinkedIn sharing of results

## Next Tasks
1. Provide Resend API key (`re_...` from resend.com) → email delivery active
2. Connect Polar.sh for AI Learn Space upsell
3. Add real video content links to course categories
4. Consider session persistence for quiz progress

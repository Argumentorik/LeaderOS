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
- `GET /api/health` – Health check
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
2. Cinematic Modern Noir design (Cold Blue #3B82F6, Warm Amber #F59E0B)
3. 50-question diagnostic covering 6 areas (Rhetorik, Kritisches Denken, Entscheidung, Führung, EQ, Strategie)
4. 3-Layer scoring model (AI Literacy, Boardroom-Rhetorik, Strategisches EQ)
5. Claude AI-generated personalized German report
6. Report delivery via email (Resend)
7. 30-Day roadmap with 7 course categories
8. AI Coach sidebar (24/7, knows user profile)
9. Upsell to "AI Learn Space" platform
10. Future Polar.sh integration for payment

## What's Been Implemented (Updated: December 2025)

### ✅ Completed Features

#### UI/UX Redesign (December 2025)
- **Complete UI overhaul** based on communicaire.framer.ai reference
- **New Design System:**
  - Background: #030303 (pure dark)
  - Primary Blue: #3B82F6
  - Accent Amber: #F59E0B
  - Pill-shaped buttons (border-radius: 100px)
  - Glassmorphism cards (backdrop-blur: 20px)
  - Modern hover effects with transform and shadows
- **Typography:** Manrope for headings, Inter for body
- **Animations:** fadeInUp, slideUp, scale effects with staggered delays

#### Hero Page
- Centered layout with animated content
- Badge with pulse indicator
- Main headline with amber gradient
- Dual CTAs (Primary + Secondary)
- Dashboard preview mockup
- Statistics section with glassmorphism cards
- 3-Layer model feature cards
- "What you get" section
- Footer

#### User Form (/diagnose)
- 5 role options with modern card design
- Rounded icon containers
- Two-step form (Role → Name/Email)
- Modern input fields with glass effect

#### Quiz (/quiz)
- Fixed progress bar with gradient
- Category badge
- Scenario card with glass effect
- Option buttons with check animation
- Navigation (Back/Forward)

#### Report Page (/report)
- Profile title card with amber glow
- 3-layer score cards with progress rings
- Radar chart for 6 dimensions
- ROI metrics section
- Recommendations
- Daily Intelligence Hub preview

#### Roadmap (/roadmap)
- Phase cards with accent color bars
- Module cards with outcomes
- Course categories grid

#### High-Ticket Close (/close)
- Comparison section (Without vs With)
- Three pricing options
- Feature lists with icons

#### AI Coach
- Floating chat button with gradient
- Rounded chat panel
- Message bubbles with modern styling
- Preset prompts as badges

#### Navbar
- Clean minimal design
- Progress steps indicator
- Mobile hamburger menu

### Infrastructure
- MongoDB: `emergent_diagnostic` database
- API: All endpoints tested (100% pass rate)
- Health check endpoint added

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

## Test Reports
- `/app/test_reports/iteration_2.json` - Latest test results (100% pass)

## Design Reference
- Figma: https://www.figma.com/design/8Lr9zUQsHZhnkedNvKzTmj/wladbot---main-homepage
- Reference: https://communicaire.framer.ai/

## Next Tasks
1. Provide Resend API key (`re_...` from resend.com) → email delivery active
2. Connect Polar.sh for AI Learn Space upsell
3. Add real video content links to course categories
4. Consider session persistence for quiz progress

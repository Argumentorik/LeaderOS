# WLADHUB Leadership Diagnose – PRD

## Original Problem Statement
Build a high-end German-language web application "WLADHUB Leadership Diagnose" based on the 3-Layer Leadership Model (KI-Kompetenz, Boardroom-Rhetorik, Strategisches EQ). A conversion funnel for leadership assessment with AI-generated personalized reports.

## Brand
- **Name:** WLADHUB
- **Product:** Leadership Diagnose
- **AI Coach:** WLADBOT
- **Platform:** WLADBOT Plattform

## Architecture

### Stack
- **Frontend:** React + Tailwind CSS + Recharts
- **Backend:** FastAPI + MongoDB
- **AI:** Claude Sonnet 4.5 via Emergent LLM Key
- **Voice:** OpenAI Whisper via Emergent LLM Key
- **Auth:** Emergent-managed Google OAuth
- **Email:** Resend (configured, awaiting API key)

### API Endpoints
- `GET /api/health` – Health check
- `POST /api/auth/session` – Exchange Emergent OAuth session for app session
- `GET /api/auth/me` – Get current user
- `POST /api/auth/logout` – Logout
- `POST /api/auth/update-profile` – Update user profile
- `POST /api/user/create` – Lead capture (guest flow)
- `POST /api/voice/transcribe` – Transcribe audio with Whisper
- `POST /api/quiz/generate-report` – Process quiz answers + Claude report
- `GET /api/report/{session_id}` – Fetch report
- `POST /api/coach/chat` – WLADBOT chat (Claude)
- `POST /api/email/send-report` – Send HTML email report
- `GET /api/privacy-policy` – Privacy policy
- `DELETE /api/user/delete-data` – GDPR data deletion

### Frontend Routes
- `/` – Hero page (10 sections landing page)
- `/login` – Login page with Google Auth
- `/auth/callback` – OAuth callback handler
- `/diagnose` – User form (role selection)
- `/diagnose-guest` – Guest flow (without login)
- `/quiz` – 30-question diagnostic (5 with voice)
- `/analyzing` – Loading + API call
- `/report` – Personal Potential Report
- `/roadmap` – 30-Day Action Plan
- `/close` – High-Ticket Close page with Social Links

## What's Been Implemented (Updated: December 2025)

### ✅ Authentication
- **Google OAuth** via Emergent-managed Auth
- Session-based auth with httpOnly cookies
- Login page with privacy consent checkboxes
- Logout functionality
- Guest flow for users who prefer not to login

### ✅ Voice Recording (5 Questions)
- Browser MediaRecorder API for audio capture
- Audio upload to backend
- **OpenAI Whisper** transcription via Emergent LLM Key
- Voice questions for strategic/reflective answers

### ✅ Dynamic Questions (30 per Role)
- **5 roles:** Selbstständige, Angestellte, Senior Manager, High Potential, Custom
- Role-specific scenarios for each question
- 25 multiple choice + 5 voice questions
- Categories: Rhetorik, Kritisches Denken, Entscheidung, Führung, EQ, Strategie

### ✅ Enhanced Orange/Amber Theme
- Primary color: #F59E0B (Amber)
- Secondary: #F97316 (Orange)
- Accent: #D97706 (Dark Amber)
- Gradient logo, buttons, badges
- Glow effects with orange tones

### ✅ Scroll Animations
- ScrollReveal component for fade-in effects
- Staggered animations on section entry
- Smooth transitions on scroll

### ✅ Social Integration (Close Page)
- Instagram (Follow link)
- Facebook Group (Join link)
- LinkedIn (Share Diagnosis)

### ✅ GDPR Compliance
- Privacy consent checkbox (required)
- Marketing consent checkbox (optional)
- Privacy policy modal
- Data deletion endpoint
- No tracking cookies

### ✅ UI/UX Design
- Cinematic Modern Noir aesthetic
- Glassmorphism cards
- Pill-shaped buttons
- Modern hover effects
- Mobile responsive

## Prioritized Backlog

### P0 (Critical)
- [ ] Add Resend API key for email delivery
- [ ] Test full 30-question flow with voice in production
- [ ] Add actual Instagram/Facebook/LinkedIn URLs

### P1 (High Priority)
- [ ] Polar.sh payment integration
- [ ] Report PDF download generation
- [ ] Session refresh persistence

### P2 (Nice to Have)
- [ ] Admin dashboard for lead management
- [ ] A/B testing for hero CTAs
- [ ] Multi-language (DE/EN)

## Test Reports
- `/app/test_reports/` - Test results

## Design Reference
- Figma: https://www.figma.com/design/8Lr9zUQsHZhnkedNvKzTmj/wladbot---main-homepage
- Reference: https://communicaire.framer.ai/

## Key Files
- `/app/backend/server.py` - FastAPI server with all endpoints
- `/app/frontend/src/pages/Login.jsx` - Login with Google OAuth
- `/app/frontend/src/pages/Quiz.jsx` - Quiz with voice recording
- `/app/frontend/src/data/questions.js` - 30 role-specific questions
- `/app/frontend/src/hooks/useScrollReveal.js` - Scroll animation hook

> **⚠️ HISTORISCH (Stand Juni 2026).** RAG-Angaben in diesem Dokument (externer Embedding-Anbieter, Supabase-Chunks, 1024/3072-dim) sind überholt: Seit Iter 116 laufen Embeddings **lokal** (MiniLM, 384 dim, `rag_chunks` in MongoDB, kein Embedding-Key). Aktuelle Referenz: `README.md`, `memory/RAG_SYSTEM.md`, `docs/PRODUKT_UND_PREISE.md`.


# 🎯 Leader-OS · Claude Code Handoff (Master Context)

> **Quellen:** Iter 92.13 abgeschlossen 26.02.26 · PR #37 auf `mvpcode` gemerged · Stripe Live aktiv · Production: https://leader-os.de
> **Diese Datei = Paste-in-Claude-Code-Initial-Context.** Alles drin um direkt produktiv weiterzubauen.

---

## 1. Was ist Leader-OS?

100M-ARR Vision: "Leadership Operating System" basierend auf Wlad Jachtchenkos Argumentorik-Frameworks.
- 100% AI-native (GPT-5.2 + Voyage RAG mit 609 Wlad-Chunks)
- Tier-Monetarisierung: Free → Leadership OS (€997) → OS PLUS (€4.447)
- Production: https://leader-os.de
- Repo: `mvpcode` branch (Stand: PR #37 merged · 02.06.26)

**User-Persona:** Führungskräfte (CEO/Founder/Manager) die in 30 Tagen ihre Argumentorik + KI-Fluency leveln wollen.

**Differenzierung:** "Apple/Revolut Premium UX" + Wlads echte Methodik via RAG + Real-Coach-Buchbarkeit via Cal.com.

---

## 2. Tech-Stack

### Backend (`/app/backend/`)
- **FastAPI** (Python 3.11) auf 0.0.0.0:8001 (supervisor-managed)
- **MongoDB Motor** (async) — local in pod, Atlas M10 in Production
- **Emergent Integrations** SDK für LLM/Stripe/Whisper (single `EMERGENT_LLM_KEY` deckt GPT-5.2 + Whisper + Nano-Banana + Sora)
- **Sentry** Backend Error-Tracking
- **PostHog** Server-side Events

### Frontend (`/app/frontend/`)
- **React 18** mit CRA build, lazy-chunked (31 chunks)
- **Tailwind + Shadcn/UI** Komponenten (`/app/frontend/src/components/ui/`)
- **GSAP 3.15** für choreographed Animations (`@gsap/react@2.1.2`)
- **Sentry React** ErrorBoundary
- **PostHog** Analytics (EU region)

### Data Stores
- **MongoDB** — User-Data, Chat-History, Sessions, Events, Email-Log, AB-Test-Events
- **Supabase** — Vector Store (RAG embeddings, 609 Wlad chunks), User-Mirror via Edge Function, Stripe-Webhook-Handler via Edge Function

### Integrations (alle LIVE)
| Service | Key | Status |
|---------|-----|--------|
| Stripe (Payments) | `sk_live_…` | ✅ Live (Pod + Production) — Key rotiert 02.06.26 |
| Voyage AI (Embeddings) | — | ❌ Entfernt (Iter 116) — Embeddings laufen lokal im Backend, kein Key |
| Emergent LLM (GPT-5.2) | `sk-emergent-…` | ✅ Live |
| Resend (Email) | `re_F2Du…` | ✅ Live (`reminders@leader-os.de` verifiziert) |
| ElevenLabs (Voice) | `sk_aae1…` | ✅ Live |
| Supabase | Anon + Service Keys | ✅ Live |
| Sentry | DSN gesetzt | ✅ Live |
| PostHog (EU) | `phc_xmMQ…` | ✅ Live |
| Google OAuth | Client ID + Secret | ✅ Live |
| Cal.com | `leaderos/beratung` | ✅ Live (Public Embed) |
| Vimeo Onboarding | ID `1197728183` | ⚠️ **Privacy auf "Anywhere" setzen!** |

---

## 3. Aktuelle Architektur — Critical Paths

### Auth Flow
```
LoginPage → POST /api/auth/login → JWT in HttpOnly Cookie + localStorage
         → AuthContext lädt user → routet zu /dashboard
         → DashboardPage triggert: OnboardingTour (wenn 1st-time), OnboardingVideoModal (1x),
                                    StripeModeBanner (nur admin/owner)
```

### Stripe Payment Flow
```
User klickt "Leadership OS holen" auf /coaching
  → openPricing(packageId) öffnet PricingModal (Tier-aware: free/standard/PLUS-Filter)
  → User wählt Paket → POST /api/payments/checkout
  → routes/payments.py erstellt Stripe-Checkout-Session via StripeCheckout SDK
  → Redirect zu Stripe-hosted Checkout
  → Nach Payment: Stripe sendet Webhook → SUPABASE Edge Function (nicht FastAPI!)
  → Edge Fn ruft /api/webhook/stripe-callback → activate_tier(user_id, tier)
  → Tier-Welcome-Email + Stripe-Receipt-Email via Resend
```

⚠️ **Webhook geht an Supabase Edge Function**, nicht FastAPI:
`https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook`

### RAG Flow (Wlads Wissen)
```
User Message → /api/chat (oder /api/playbooks, /api/video/analyze, /api/simulations)
  → services_rag.retrieve_context(query)
  → Voyage AI embed (3072-dim)
  → Supabase RPC `match_leadership_insights` mit threshold 0.25
  → Top-N chunks → context-injected in GPT-5.2 system message
  → Response zitiert Wlad-Frameworks
```

**Threshold:** `RAG_MATCH_THRESHOLD=0.25` (Iter 92.6 gefixt — vorher 0.6 filterte ALLES raus)

### Agent-Orchestration (12 LLM-Routes — alle harmonisch)
Alle nutzen einheitlich:
- `EMERGENT_LLM_KEY` (single key, no vendor-lockin)
- `openai/gpt-5.2` model
- Eindeutige `session_id` pro Surface
- RAG nur auf 4 Content-Surfaces: chat, playbooks, video, simulations
- JSON-Parse via shared `services_ai_parse.parse_ai_json()`

Detail-Matrix: `/app/docs/PRODUCTION_READINESS.md`

---

## 4. File Layout (was wo)

```
/app/
├── backend/
│   ├── server.py                  # FastAPI app, startup hooks, MongoDB index init
│   ├── config.py                  # ENV vars, DB connection, logger
│   ├── services.py                # JWT auth helpers, get_current_user, require_cron_auth
│   ├── services_rag.py            # Voyage + Supabase RAG pipeline
│   ├── services_email.py          # Resend templates (drip_day1/3/7, tier_welcome, etc.)
│   ├── services_tier.py           # TIER_CONFIG, activate_tier, resolve_user_tier
│   ├── services_supabase_sync.py  # Bi-directional Mongo↔Supabase sync
│   ├── services_ai_parse.py       # Defensive JSON-Parse for LLM responses
│   ├── services_magic_link.py     # Magic-link auth
│   ├── services_login_security.py # Brute-force protection
│   ├── services_oauth.py          # Google OAuth handler
│   ├── services_video_trial.py    # Video trial logic
│   ├── services_wladhub_autosync.py # WladHub Supabase autosync
│   ├── services_actions.py        # Action library
│   ├── routes/
│   │   ├── auth.py                # /api/auth/* — login, register, refresh, callback
│   │   ├── payments.py            # /api/payments/* — checkout, stripe-mode, webhook
│   │   ├── chat.py                # /api/chat — WladBot
│   │   ├── video.py               # /api/video/* — analyze + trial
│   │   ├── playbooks.py           # /api/playbooks/* — framework-driven sessions
│   │   ├── simulations.py         # /api/simulations/* — role-play scenarios
│   │   ├── tools.py               # /api/tools/* — single-shot AI tools
│   │   ├── events.py              # /api/events — Donnerstag-cohort events
│   │   ├── ab_testing.py          # /api/ab/* — A/B test assign + tracking
│   │   ├── unsubscribe.py         # /api/unsubscribe — email opt-out
│   │   ├── voice_tts.py           # ElevenLabs voice TTS + Whisper STT
│   │   ├── credits.py, dashboard.py, profile.py, my_path.py, …
│   │   ├── admin.py               # ADMIN_EMAILS = {test@test.com, start@aiporate.com, mert@wladbot.com, mertzafermutlu@gmail.com}
│   │   ├── lifecycle_emails.py    # Cron jobs for drip sequences
│   │   ├── monitoring.py          # Health checks
│   │   ├── gdpr.py                # Data export + deletion
│   │   └── …
│   ├── tests/                     # Pytest backend tests
│   └── .env                       # ALL secrets (gitignored)
├── frontend/
│   ├── public/
│   │   ├── index.html             # Font imports (Inter + Outfit + Instrument Serif von mvpcode-PRs)
│   │   └── favicon.ico
│   ├── src/
│   │   ├── App.js                 # Router + lazyWithRetry (Iter 92.11 fix)
│   │   ├── contexts/
│   │   │   ├── AuthContext.js     # User state + JWT lifecycle
│   │   │   ├── TierContext.js     # User tier + isAccelerator
│   │   │   ├── PricingContext.js  # PricingModal global trigger
│   │   │   ├── LanguageContext.js # DE/EN translations
│   │   │   ├── ThemeContext.js    # Dark/Light mode
│   │   │   └── CreditContext.js   # AI credit tracking
│   │   ├── lib/
│   │   │   ├── api.js             # Axios instance mit JWT injection
│   │   │   ├── logger.js          # Sentry-aware logger
│   │   │   ├── lazyWithRetry.js   # Iter 92.11: stale-bundle crash protection
│   │   │   └── calendly.js        # Cal.com booking helper (NICHT mehr Calendly!)
│   │   ├── pages/
│   │   │   ├── LoginPage.js, DashboardPage.js (eager, im main bundle)
│   │   │   ├── MyPathPage.js      # Lernpfad mit UpcomingEvents-Card
│   │   │   ├── ChatPage.js        # WladBot chat
│   │   │   ├── CoachingPage.js    # Coaching hub mit Cal.com booking
│   │   │   ├── OnboardingPage.js  # 7-step onboarding (incl. strategy call step)
│   │   │   ├── PaymentSuccessPage.js
│   │   │   ├── EmailUnsubscribePage.js
│   │   │   └── …
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn primitives
│   │   │   ├── layout/            # DashboardLayout, Sidebar, Header, SidebarFooter (mit Settings-Gear)
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCards.js   # Premium 3-card row + QuickActionsGrid
│   │   │   │   ├── UpcomingEventsCard.js  # Donnerstag-Events mit GSAP entrance
│   │   │   │   ├── WladMotivationCard.js
│   │   │   │   ├── EventReminder.js
│   │   │   │   └── WladHubCard.js
│   │   │   ├── admin/
│   │   │   │   └── StripeModeBanner.js    # Iter 92.12: Live/Sandbox indicator
│   │   │   ├── onboarding/
│   │   │   │   └── OnboardingVideoModal.js # Vimeo player + GSAP choreography
│   │   │   ├── calls/
│   │   │   │   └── FakeWladCall.js        # iOS-style fake-call (PRO-aware seit Iter 92.9)
│   │   │   ├── brand/
│   │   │   │   ├── WladMark.js
│   │   │   │   ├── BookingTeaserCard.js
│   │   │   │   └── BookConsultationButton.js # useBookConsultation hook
│   │   │   ├── shared/
│   │   │   │   ├── PricingModal.js        # Tier-aware (versteckt schon gekaufte Pakete)
│   │   │   │   ├── VoiceRecorder.js       # 2-min Timer + GSAP Progress-Ring (Iter 92.10)
│   │   │   │   ├── OnboardingTour.js
│   │   │   │   ├── NetworkStatusBanner.js
│   │   │   │   ├── TierBadge.js
│   │   │   │   └── VideoPlayer.js         # Universal Vimeo/YT player
│   │   │   ├── coaching/
│   │   │   │   ├── CoachingPathCard.js
│   │   │   │   ├── CoachingRightPanel.js  # Quick-Actions (jetzt Cal.com nicht onCheckout)
│   │   │   │   └── coachingData.js        # FAQ (kein "Free" mehr)
│   │   │   ├── mypath/
│   │   │   │   └── LearningVideosTab.js   # Starter pack (war "FREE FOREVER" → "INKLUSIVE")
│   │   │   ├── playbooks/PlaybookReport.js
│   │   │   └── AppErrorBoundary.js
│   │   └── App.css                # CSS variables, tailwind, custom animations
│   ├── package.json
│   └── .env                       # REACT_APP_BACKEND_URL etc.
├── docs/
│   ├── PRODUCTION_READINESS.md    # 10k-user scaling guide
│   ├── SENTRY_ALERTS.md
│   ├── CRON_SCHEDULE.md
│   └── VIMEO_WORKFLOW.md
├── memory/
│   ├── PRD.md                     # Full feature changelog (last 13 iterations)
│   └── test_credentials.md
├── scripts/
│   └── smoke_test_production.sh   # API_BASE=… bash → 5/5 GREEN checks
├── DEPLOY.md                      # 5-Schritt Vercel + Supabase Webhook + Smoke Test
└── .env.production.template       # Complete ENV reference for Vercel
```

---

## 5. Iter-92.x Changelog (was in den letzten 13 Iterationen passierte)

| # | Date | Changes |
|---|------|---------|
| 92.13 | 02.06.26 | **Stripe LIVE bringup**: sk_live_ in Pod, `/api/payments/stripe-mode` endpoint live, DEPLOY.md + smoke_test_production.sh erstellt |
| 92.12 | 02.06.26 | 10k-user readiness: 12 neue Mongo-Indexes, StripeModeBanner Admin-UI, PRODUCTION_READINESS.md |
| 92.11 | 02.06.26 | **lazyWithRetry**: alle 31 lazy() durch `lazyWithRetry` ersetzt — stale-chunk crash protection; GSAP defensive null-checks; UpcomingEvents hover GSAP → CSS |
| 92.10 | 02.06.26 | Vimeo onboarding video; GSAP entrance choreography; "FREE/Free" complete cleanup (11 files); LearningVideosTab starter-pack premium wording |
| 92.9 | 02.06.26 | UpcomingEventsCard → Dashboard + MyPath; Sidebar Settings-Gear; VoiceRecorder 2-min Timer mit Progress-Ring; OnboardingVideoModal v1; OnboardingPage Step 5 "Strategy Call"; PricingModal tier-aware (hide owned packages); Dashboard upsell tier-aware |
| 92.8 | 02.06.26 | Calendly → Cal.com universal migration |
| 92.7 | 02.06.26 | 30/30 test report; testing infrastructure complete |
| 92.6 | 02.06.26 | **RAG threshold 0.6 → 0.25** (was filtering everything out); now correctly cites Wlad |
| 92.5 | 02.06.26 | Lockfile guard via GitHub Action (Vercel parity) |
| 92.4 | 02.06.26 | Frontend bundle 1.8MB → 851KB via code-splitting |
| 92.3 | 02.06.26 | FakeWladCall A/B testing (discount bribe variant) |
| 92.2 | 02.06.26 | First 6 videos free for anonymous + lead-magnet |
| 92.1 | 02.06.26 | Sentry hardening, Email unsubscribe, RAG global expansion to all 4 surfaces |

---

## 6. Test Credentials

Alle Accounts: Password `test123`

| Email | Tier | Notes |
|-------|------|-------|
| `free@wladbot.test` | free | 120 XP, paywall-tests |
| `standard@wladbot.test` | standard | 1420 XP, Leadership OS aktiv |
| `accelerator@wladbot.test` | accelerator | 2450 XP, PLUS aktiv |
| `accelerator-raten@wladbot.test` | accelerator | Rate 3/12 paid |
| `test@test.com` | free + admin | Sees StripeModeBanner |
| `mertzafermutlu@gmail.com` | role=owner is_admin=true | Sees admin features |

Re-seed: `cd /app/backend && python3 seed_test_users.py`

---

## 7. Production Status Snapshot

### Pod (Preview) — wo dieser Code läuft
- ✅ Backend: RUNNING (5/5 smoke checks green)
- ✅ Stripe: `live` mode, `sk_live_…`
- ✅ MongoDB: all indexes ensured
- ✅ RAG: threshold 0.25, returning Wlad-context

### Production (leader-os.de)
- ✅ Frontend (Vercel): live, auto-deploys from `mvpcode`
- ✅ Backend: redeployed mit Iter 92.12+ Code
- ✅ Stripe Webhook: Supabase Edge Function `stripe-webhook` mit new signing secret (gesetzt 02.06.26)
- ✅ Stripe Account: `acct_1TYd2YA6vBlw9Oi4` (Leader-OS, all Price IDs verified)
- ✅ Resend Dispatcher: v2 deployed, `resend_configured: true`

### Wlad's €1 Test — ✅ COMPLETED (02.06.26)
- ✅ Stripe €1 live mode payment verarbeitet
- ✅ Supabase Subscription `leadership_os_plus_yearly` aktiv bis 2027-06-03
- ✅ MongoDB Mirror: tier=accelerator gesynced
- ✅ Welcome-Email + free_course_1 raus via Resend (ids 4363f3fd / 3c910647)
- ✅ Vimeo `leader-os.de` Domain whitelisted
- Payment Link: `buy.stripe.com/00w5kCdfdbY56g9aqV00002`
- Coupon: `h7k1NOLc` (€4446 off, 5 redemptions, noch 4 übrig)
- Promo Code: `TEST1EURO`

---

## 8. Pending Tasks (was Mert/Claude Code als nächstes machen kann)

### 🔴 P0 — Blocker für 100% Live
- **Stripe Live Key in Production-ENV** (Emergent Deploy Settings) einpflegen + Backend redeploy
  → Verify: `curl https://leader-os.de/api/payments/stripe-mode` returnt `live: true`
- **Vimeo Privacy** auf "Anywhere" für Video ID `1197728183` (sonst zeigen User den Sorry-Embed-Screen)

### 🟡 P1 — Diese Woche
- **Email-Drips Wording-Sync**: alle "Free Call" / "Kostenlos" Strings in `services_email.py` Templates raus → "Strategiegespräch buchen" Cal.com-CTAs (analog Frontend Iter 92.10)
- **Voice-Recorder live mit Mic testen** im Daily-Check-in (2-min Timer + Progress-Ring + mm:ss countdown)
- **Mobile Audit** für FakeWladCall, OnboardingVideoModal, PricingModal (viewport <640px)
- **Cloudflare Rate-Limit Rule** vor leader-os.de: 100 req/min/IP für `/api/*`
- **A/B Test Tracking** `onboarding_video_call` Event analog Fake-Wlad-Call

### 🔵 P2 — Backlog
- **`/api/payments/today`** Mini-Dashboard für Admins: Checkouts heute, MRR-Delta, abandoned carts
- **Slack-Webhook** bei `checkout.session.completed`: "💸 Neuer Customer: {tier}"
- **RAG Redis-Cache** (bei 10k user spart ~25k Voyage-Calls/Tag)
- **Cross-Agent Memory** Pipeline (Playbook-Agent sieht Chat-History)
- **`/changelog` Page** auto-generiert aus PRD.md
- **`/api/integrations/health`** Single-Pane-of-Glass: Status für Resend, Voyage, Supabase, Sentry, Stripe
- **Coaching/Profile/Community** Pages auf Taste-Skill mit `gsap.context` (Pattern aus Iter 92.10)
- **`RagDebugStudio.js`** + `routes/auth.py` `google_session` refactoring (zu groß)
- **Migration auf Fly.io** Stockholm Region (50ms vs 200ms Latenz, niedrigere Kosten) — Vorbereitung in `deploy/fly.toml` + `deploy/backend.Dockerfile`

---

## 9. Production-Deploy-Procedure

Vollständig in `/app/DEPLOY.md`. TL;DR:

```bash
# 1. Push to mvpcode
git push origin mvpcode

# 2. Vercel auto-deploys frontend (90s)

# 3. Emergent Dashboard → Backend → Redeploy
#    (oder Fly: `fly deploy` aus /deploy)

# 4. Smoke test
API_BASE=https://leader-os.de bash /app/scripts/smoke_test_production.sh
# Erwartet: 5/5 GREEN

# 5. Stripe Webhook (Supabase Edge Fn) — bereits konfiguriert:
#    URL: https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook
#    Events: checkout.session.completed, async_payment_succeeded, async_payment_failed, payment_intent.payment_failed
#    Signing Secret: in Supabase Edge Fn ENV als STRIPE_WEBHOOK_SECRET

# 6. Real €1 charge with own card + immediate refund
```

---

## 10. Common Debug Recipes

### "Stripe Banner zeigt sandbox auf Production"
```bash
curl https://leader-os.de/api/payments/stripe-mode
# → wenn 404: Backend muss redeployed werden
# → wenn mode: "platform_default": STRIPE_API_KEY in Production-ENV nicht gesetzt
# → wenn mode: "test": STRIPE_API_KEY ist sk_test_, muss sk_live_ werden
```

### "WladBot zitiert kein Wlad-Wissen"
```bash
# Check RAG threshold
grep MATCH_THRESHOLD /app/backend/services_rag.py
# Erwartet: 0.25

# Check Supabase RPC connection
# Endpoint: /api/admin/rag-debug (admin only)
```

### "ErrorBoundary „Etwas ist schiefgelaufen" Crash"
Hauptursache: stale lazy-chunk nach Deploy. Iter 92.11 `lazyWithRetry` fängt das ab.
```bash
# Test: rapid navigation across 21 routes
# Check `sessionStorage.getItem('wladbot:chunk-reload')` in browser console
```

### "Onboarding-Video zeigt Sorry-Embed"
Vimeo Privacy-Setting in Mert's Vimeo Account:
- Video `1197728183` → Privacy → "Where can this video be embedded" → "Anywhere"

### "Tests / Smoke Test failing"
```bash
# Pod smoke test
API_BASE=https://command-center-229.preview.emergentagent.com bash /app/scripts/smoke_test_production.sh

# Backend tests
cd /app/backend && pytest

# Frontend tests via testing_agent_v3_fork
```

---

## 11. Key URLs

| URL | Purpose |
|-----|---------|
| https://leader-os.de | Production app |
| https://command-center-229.preview.emergentagent.com | Pod preview |
| https://srujvjjncrszhaaxepxf.supabase.co | Supabase (RAG + Webhook Edge Fns) |
| https://dashboard.stripe.com | Stripe account `acct_1TYd2YA6vBlw9Oi4` |
| https://cal.com/leaderos/beratung | Strategy Call booking |
| https://buy.stripe.com/00w5kCdfdbY56g9aqV00002 | Wlad's €1 PLUS test payment link |

---

## 12. Quick-Start für neue Claude-Code-Session

Paste diesen Block als initial context:

```
Ich arbeite an Leader-OS — siehe HANDOFF_TO_CLAUDE_CODE.md im Repo-Root.
Stack: FastAPI + MongoDB + React + Supabase RAG + Stripe live.
Aktuelles Iter: 92.13. Production: leader-os.de. Branch: mvpcode.

Was ich heute machen will: [TASK]

Bitte:
1. Verify environment first: pod oder production?
2. Lies relevante Files (siehe File Layout Section)
3. Falls 3rd party integration → frag mich nach Keys, paste nichts in Chat
4. Always test → smoke_test_production.sh oder testing agent
5. Update memory/PRD.md am Ende
6. Bei Stripe-Changes: webhook geht an Supabase Edge Fn, nicht FastAPI!
```

---

## 13. Critical Reminders / Gotchas

1. **Webhook geht an Supabase, nicht FastAPI** — `/api/webhook/stripe` ist DEPRECATED 410
2. **Never paste live keys in chat** — Stripe key wurde 02.06.26 rotiert weil im Chat geleakt
3. **Calendly ist tot** — alle Bookings via `useBookConsultation()` Hook (öffnet Cal.com Modal)
4. **GSAP** muss in `gsap.context(...)` + try-catch + null-ref-guards (siehe Iter 92.11)
5. **lazyWithRetry** für alle code-split Routes (keine pure `lazy()` mehr in App.js)
6. **Tier-aware Pricing**: PricingModal versteckt schon gekaufte Pakete automatisch
7. **"Free/Free"-Wording** ist verboten in der UI — "Strategiegespräch · 15 Min · Unverbindlich"
8. **RAG threshold 0.25** (nicht 0.6!) — sonst keine Wlad-Context im Output
9. **Backend reloads** automatisch bei Code-changes (uvicorn --reload), nur bei .env-Änderung supervisor-restart nötig
10. **MongoDB Indexes** werden bei jedem Startup idempotent erstellt — keine manuelle Migration nötig
11. **Mert ist owner/admin** → sieht StripeModeBanner; Admin-emails in `routes/admin.py ADMIN_EMAILS`
12. **GitHub Actions** `lockfile-guard.yml` verhindert Vercel-Crashes durch lockfile-drift

---

## Done — du bist ready für Claude Code. 🚀

**Empfohlener First-Prompt in Claude Code:**

> Lies `HANDOFF_TO_CLAUDE_CODE.md` und mache dich mit dem Codebase vertraut.
> Dann: [DEINE NÄCHSTE TASK]

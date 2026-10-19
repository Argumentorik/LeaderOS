# LeaderOS Application Architecture

> Audience: investors, new developers, CEO.
> Last updated: 2026-05-25.
> Repo: `aiporator/shipos`, branch `mvpcode`.

---

## 1. Product Overview

**LeaderOS** is a KI-powered leadership training platform built for German
Fuehrungskraefte (executives and managers). It combines AI coaching, video
courses, leadership diagnostics, and structured learning journeys into a
single SaaS product based on the methodology of Wlad Jachtchenko
(Argumentorik).

### Two Surfaces, One Codebase

| Surface | Domain | Auth | Purpose |
|---|---|---|---|
| **leader-check** | `leader-check.de` | Anonymous | Free diagnostic funnel -- KI score, Rhetoric score, EQ score. Captures leads, links them to the paid platform via `email_lower`. |
| **leader-os** | `leader-os.de` | Authenticated | Full coaching app: AI coach (WladBot), video courses, 30-day challenge, simulations, playbooks, community, and the AI Strategist. |

Both domains serve the same React application. The backend API lives at
`https://leader-os.de/api/*` and is proxied through Vercel rewrites.

### Target Audience

German-speaking executives and managers who want to improve their leadership
communication, emotional intelligence, and strategic thinking. All UI copy
and AI prompts are in German; this document and all developer-facing docs
are in English.

### Pricing (6 Plans)

| Plan | Price | Billing | Tier ID |
|---|---|---|---|
| Leadership OS (1 year) | EUR 997 | One-time | `standard` |
| Leadership OS (2 installments) | EUR 549 x 2 (EUR 1,100 total) | Installment | `standard` |
| Leadership OS (12 installments) | EUR 99 x 12 (EUR 1,188 total) | Installment | `standard` |
| Leadership OS PLUS (1 year) | EUR 4,447 | One-time | `accelerator` |
| Leadership OS PLUS (2 installments) | EUR 2,447 x 2 | Installment | `accelerator` |
| Leadership OS PLUS (12 installments) | EUR 442 x 12 | Installment | `accelerator` |

Enterprise pricing is quote-based with volume discounts (10-50% depending
on team size, starting at 5 seats).

### Free Tier

Unauthenticated users get the leader-check diagnostic. Authenticated free
users get limited simulations, weeks 1-2 of the 30-day challenge, and 10
AI credits/month.

---

## 2. Technical Architecture

### High-Level Diagram

```
                     leader-check.de              leader-os.de
                           |                           |
                           +--------+  +---------------+
                                    |  |
                              Vercel (CDN + SPA)
                              CRA React 19 build
                                    |
                    /api/* rewrite  |
                                    v
                          FastAPI 5.0 (Python 3.11)
                          Emergent Hosting (pod)
                           |              |
                   +-------+              +--------+
                   v                               v
             MongoDB                    Supabase Postgres 17
          (Emergent hosting)           (eu-north-1, ref: srujvjjncrszhaaxepxf)
          System of record             Structured data, RLS,
          for user state               Edge Functions, pgvector RAG
```

### Frontend

| Aspect | Detail |
|---|---|
| Framework | Create React App (CRA) via CRACO -- **not** Next.js |
| React version | 19.0 |
| Router | `react-router-dom` v7.12 |
| UI library | Radix UI (28 primitives), Lucide icons, Tailwind CSS 3 |
| Toast / notifications | Sonner v2 |
| Forms | react-hook-form + Zod validation |
| Charts | Recharts v3 |
| Animation | Framer Motion v12 |
| Analytics | PostHog (EU region, inline snippet) |
| Error tracking | Sentry React SDK (`@sentry/react` v10, host-based routing to 2 projects) |
| Auth SDK | `@react-oauth/google`, Apple Sign-In JS, MSAL.js |
| Build tool | CRACO wrapping CRA (`yarn build`) |
| Deployment | Vercel, auto-deploy on `mvpcode` push |
| Source | `frontend/src/` |

**Key pages** (30+ routes in `frontend/src/App.js`):

| Route | Page | Auth |
|---|---|---|
| `/login` | LoginPage | Public |
| `/auth/magic` | MagicLinkVerifyPage | Public |
| `/onboarding` | OnboardingPage | Protected |
| `/dashboard` | DashboardPage | Protected |
| `/chat` | ChatPage (WladBot AI coach) | Protected |
| `/missions` | VideoChallengePage | Protected |
| `/simulations` | SimulationsPage | Protected |
| `/playbooks` | PlaybooksPage | Protected |
| `/coaching` | CoachingPage | Protected |
| `/challenge` | Challenge30Page (30-day sprint) | Protected |
| `/my-path` | MyPathPage (personalized journey) | Protected |
| `/leader-diagnose` | LeaderDiagnosePage | Protected |
| `/enterprise` | EnterprisePage | Protected |
| `/profile` | ProfilePage | Protected |
| `/impressum`, `/datenschutz`, `/agb`, `/widerruf` | Legal pages | Public |

### Backend

| Aspect | Detail |
|---|---|
| Framework | FastAPI v5.0 ("WladBot API") |
| Python | 3.11 |
| Hosting | Emergent pod, supervisor-managed |
| Port | 8001 |
| ASGI | Uvicorn |
| Source | `backend/` |

**Route modules** (26 routers in `backend/routes/`):

`auth`, `oauth`, `chat`, `tasks`, `simulations`, `playbooks`, `events`,
`challengers`, `tools`, `video`, `checkin`, `dashboard`, `wladhub`,
`uploads`, `payments`, `referral`, `enterprise`, `credits`, `challenge30`,
`ki_news`, `my_path`, `community`, `admin`, `profile`, `voice_tts`,
`monitoring`, `gdpr`, `sync`, `og`

**Service modules:**

| File | Responsibility |
|---|---|
| `services.py` | JWT creation/verification, password hashing, session auth |
| `services_tier.py` | Tier definitions, `activate_tier()`, feature gating |
| `services_email.py` | Resend transactional emails, branded templates |
| `services_magic_link.py` | Passwordless login token generation and verification |
| `services_login_security.py` | User-Agent parsing, geo lookup, device fingerprinting, new-device alerts |
| `services_oauth.py` | Google/Apple/Microsoft JWKS verification |
| `services_actions.py` | Action recording (activity log) |
| `services_supabase_sync.py` | Outbound sync from MongoDB to Supabase |
| `services_video_trial.py` | Free trial video challenge tracking |
| `middleware/__init__.py` | RateLimitMiddleware, SecurityHeadersMiddleware |

### Databases

**MongoDB** (Emergent hosting) -- System of record for user state:

| Collection | Purpose |
|---|---|
| `users` | User profiles, XP, tier, addons |
| `user_sessions` | Server-side sessions (TTL index) |
| `payment_transactions` | Stripe payment records |
| `installment_plans` | Recurring payment state |
| `chat_messages` | AI coach conversation history |
| `chat_sessions` | Chat session metadata |
| `login_attempts` | Brute-force protection (TTL index) |
| `magic_links` | Passwordless login tokens (TTL index) |
| `email_log` | Sent email audit trail |
| `voice_cache` | ElevenLabs TTS cache |
| `video_drip_schedule` | Course unlock schedule |
| `enterprise_leads` | B2B lead capture |

**Supabase Postgres 17** (eu-north-1) -- Structured data with RLS:

| Table | Purpose |
|---|---|
| `users` | Cross-platform identity (email_lower UNIQUE) |
| `sessions` | Usage events with platform attribution |
| `leadership_insights` | KI/Rhetoric/EQ assessment scores |
| `incomplete_check_attempts` | leader-check funnel breadcrumbs (anon) |
| `strategist_plays` | AI-generated weekly leadership plays |
| `wladbot_documents` | RAG corpus with pgvector (HNSW, cosine) |
| `marketing_attribution` | UTM/referrer tracking |
| `prompt_templates` | Versioned LLM system prompts |
| `subscriptions` | Stripe subscription state |
| `email_journeys` | Journey definitions |
| `email_journey_steps` | Step templates per journey |
| `user_journey_state` | Per-user journey progress |
| `email_sends` | Queued/sent email records |
| `email_events` | Email engagement signals (opens, clicks) |
| `user_episode_progress` | Video course progress tracking |
| `system_events` | Structured operational logs |
| `idempotency_keys` | Webhook deduplication |
| `video_courses` / `course_episodes` | Course catalog and episode metadata |

All tables have RLS enabled. Pattern: `service_role` can do everything;
`authenticated` users access their own rows via `auth_user_id` join;
`is_admin()` gates admin-only tables. The only anon entry point is
`upsert_incomplete_attempt` (leader-check funnel capture).

### Edge Functions

Supabase Edge Functions deployed to the same project:

| Function | JWT | Purpose |
|---|---|---|
| `stripe-webhook` | No-verify | Canonical Stripe webhook handler (v9). Processes checkout, subscription, and invoice events. |
| `ingest-leader-check` | No-verify | Receives leader-check diagnostic results from anonymous users. |
| `ingest-leader-os` | No-verify | Receives leader-os platform events. |
| `ai-strategist` | Verified | Generates weekly AI leadership plays using Anthropic API. |
| `wladbot-chat` | Verified | RAG-powered AI coaching chat (pgvector similarity search). |
| `email-dispatcher` | Cron | Sends queued emails via Resend API. |
| `health-monitor` | Cron | Runs every 60s, checks system vitals. |
| `advance-email-journeys` | Cron | Advances user journey state every 15 min. |
| `user-mirror` | Service | Inbound sync endpoint for WladHub integration. |

### Email

| Aspect | Detail |
|---|---|
| Provider | Resend API |
| Sender domain | `leader-os.de` (SPF/DKIM/DMARC verified) |
| Templates | 12 branded HTML email templates in `services_email.py` |
| Journeys | 2 automated journeys (see section 5) |
| Transactional | Event registration, welcome, installment due, monthly scorecard, new-device alert, magic link |

---

## 3. Authentication Flow

### Methods

1. **Email + Password** -- Traditional registration/login with bcrypt-hashed
   passwords. Minimum 8 characters. Leaked password protection via
   HaveIBeenPwned (Supabase Auth policy).

2. **OAuth** (Google, Apple, Microsoft) -- Frontend obtains an ID token via
   the provider's official SDK (One-Tap / Sign In with Apple JS / MSAL.js).
   Backend verifies the token signature against the provider's JWKS endpoint.
   No server-side redirects.

3. **Magic Link** -- Passwordless login via Resend. Token is SHA-256 hashed
   before storage, single-use, expires after 15 minutes. TTL index
   auto-cleans expired tokens.

### Session Management

- **Cookie-based sessions**: `httpOnly`, `Secure`, `SameSite=Lax`, 7-day
  max-age, path `/`. Session tokens are `sess_{uuid}` strings stored in
  MongoDB `user_sessions` collection.
- **Session limit**: Maximum 10 concurrent sessions per user. Oldest sessions
  are pruned on new login.
- **TTL cleanup**: MongoDB TTL index on `expires_at` auto-deletes expired
  sessions.
- **JWT fallback**: Bearer token authentication supported alongside cookies,
  with `leeway=10` seconds for clock skew tolerance.

### Cross-Tab Refresh Coordination

A `localStorage` mutex prevents multiple tabs from racing to refresh the
session simultaneously. Only one tab performs the refresh; others wait and
read the result.

### ReAuthModal

Soft re-authentication component (`frontend/src/components/auth/ReAuthModal`)
prompts for credentials when a session expires mid-use, without losing page
state or navigating away.

### Brute-Force Protection

| Endpoint | Limit | Window |
|---|---|---|
| Login (`/api/auth/login`) | 10 attempts | 15 minutes |
| Register (`/api/auth/register`) | 5 attempts | 60 minutes |
| Magic Link (`/api/auth/magic-link/request`) | 5 attempts | 15 minutes |

Failed attempts are tracked per `(email, IP)` pair in the `login_attempts`
MongoDB collection with 24-hour TTL auto-cleanup.

### New-Device Detection

On login, the backend fingerprints the device (User-Agent parsing + IP geo
lookup via ipapi.co) and fires a new-device alert email if the fingerprint
is previously unseen for that user.

---

## 4. Payment Pipeline

### Flow

```
User clicks "Kaufen" on pricing page
        |
        v
POST /api/payments/checkout { package_id, origin_url }
        |
        v
Stripe Checkout Session created (server-side, amount locked)
        |
        v
User completes payment on Stripe-hosted page
        |
        v
Stripe fires checkout.session.completed webhook
        |
        v
Supabase Edge Function "stripe-webhook" (v9) receives event
        |
        +--- One-time payment? --> handleOneTimePayment()
        |                              activate_tier()
        |                              send welcome email
        |
        +--- Installment?     --> Create Stripe Subscription Schedule
                                  with iterations: N (auto-cancel)
                                  activate_tier() on first payment
```

### Pricing Packages (server-defined, amounts not editable by client)

| Package ID | Amount | Tier | Billing |
|---|---|---|---|
| `leadership_os` | EUR 997 | `standard` | One-time |
| `leadership_os_2x` | EUR 550 x 2 | `standard` | Installment |
| `leadership_os_12x` | EUR 99 x 12 | `standard` | Installment |
| `leadership_os_plus` | EUR 4,447 | `accelerator` | One-time |
| *(PLUS installment plans follow the same pattern)* | | `accelerator` | Installment |

### Tier System

| Tier | Price | Access |
|---|---|---|
| `free` | EUR 0 | Limited simulations, challenge weeks 1-2, 10 credits/month |
| `standard` (Leadership OS) | EUR 997/year | AI coach, all playbooks, full 30-day challenge, 500 credits/month, 12 video courses (drip), PDF report, community |
| `accelerator` (Leadership OS PLUS) | EUR 4,447/year | Everything in standard + video analysis, video missions, 12 one-on-one coaching calls, mastermind, priority support, unlimited credits, all 10 courses immediately |
| `enterprise` | Quote-based | Volume licensing, per-seat pricing with 10-50% discount |

### Course Unlock Logic

- **Standard tier**: 3 courses unlocked on purchase, then 1 additional course
  per month (drip release, `video_drip_interval_days: 30`).
- **Accelerator tier**: All 12 courses unlocked immediately on purchase.

### Installment Auto-Cancel

The Stripe webhook edge function creates a Subscription Schedule with a
fixed number of `iterations`. When all installments are collected, the
subscription auto-cancels. No manual intervention required. If schedule
creation fails, the incident runbook covers manual cancellation.

### Idempotency

Webhook events are deduplicated via the `idempotency_keys` table in
Supabase. Duplicate Stripe event IDs are silently skipped.

---

## 5. Email Journey Engine

### Architecture

The email journey engine lives entirely in Supabase (Postgres tables +
pg_cron + Edge Functions):

```
email_journeys (journey definitions)
   |
   +-- email_journey_steps (7 steps per journey, ordered)
           |
           +-- user_journey_state (per-user progress)
                   |
                   +-- email_sends (queued → sent → delivered)
                           |
                           +-- email_events (opens, clicks)
```

### Journeys

| Journey Code | Trigger | Steps | Duration |
|---|---|---|---|
| `leader_os_onboarding` | Standard tier purchase | 7 | 30 days |
| `plus_onboarding` | Accelerator tier purchase | 7 | 30 days |

### Execution

- **`advance_email_journeys()`**: pg_cron job runs every 15 minutes. For each
  user with an active journey, checks if `next_run_at <= now()`, evaluates
  the current step, queues the email in `email_sends`, and advances the state.

- **`email-dispatcher`**: Supabase Edge Function (cron-triggered). Picks up
  queued emails from `email_sends` and sends them via the Resend API.

### Backward-Pressure

Inactivity-triggered steps (e.g., "we miss you") have a **backward-pressure
gate**: they check `fn_user_hours_since_engagement()` and **skip** if the
user has been active recently. This prevents annoying re-engagement emails
from reaching users who are already engaged.

### Signal Triggers

User activity is tracked via three signals that update timestamps on the
`users` table:

| Signal | Source | Column |
|---|---|---|
| Session activity | `sessions` table insert trigger | `last_seen_at` |
| Episode progress | `user_episode_progress` trigger | `last_episode_started_at` |
| Email engagement | `email_events` (opens/clicks) | `last_email_engagement_at` |

---

## 6. Video Course Catalog

### Structure

- **10 courses** with **72 total episodes** (content in production).
- Stored in Supabase tables `video_courses` and `course_episodes`.
- Vimeo integration for video hosting via `rpc_attach_vimeo` RPC.

### Access Control

- RLS policies gate access based on user tier and drip schedule.
- **Standard tier**: 3 courses unlocked immediately, then 1 per month
  (tracked in `video_drip_schedule` MongoDB collection).
- **Accelerator tier**: All courses unlocked immediately.
- **Free tier**: No course access.

### Progress Tracking

Episode progress is tracked in the `user_episode_progress` Supabase table.
Triggers update the user's `last_episode_started_at` signal timestamp for
the backward-pressure email gate.

### Video Analysis (PLUS Only)

The `/missions` route (`VideoChallengePage`) allows users to upload video
recordings of their leadership communication. The backend transcribes the
audio via OpenAI Speech-to-Text and provides AI-powered feedback based on
Wlad Jachtchenko's methodology, with configurable rating modes:

- **Soft mode**: Encouraging, strength-focused feedback.
- **Hard mode**: Honest, direct executive-coach-style feedback.
- **Audience targeting**: Team, board, customers, investors, or general.
- **Focus areas**: Clarity, empathy, structure, persuasiveness.

---

## 7. Security Posture

### Transport Security

| Control | Implementation | File |
|---|---|---|
| HSTS | `max-age=63072000; includeSubDomains; preload` (2-year) | `vercel.json` |
| CSP | Enforcing policy with whitelisted domains only | `vercel.json` |
| X-Frame-Options | `DENY` (Vercel) / `SAMEORIGIN` (backend) | `vercel.json`, `middleware/__init__.py` |
| X-Content-Type-Options | `nosniff` | Both layers |
| Referrer-Policy | `strict-origin-when-cross-origin` | Both layers |
| Permissions-Policy | Camera/microphone self-only, geolocation denied, payment self-only | `vercel.json` |
| X-DNS-Prefetch-Control | `on` | `vercel.json` |

### CSP Whitelist (key domains)

`self`, `*.supabase.co`, `*.stripe.com`, `accounts.google.com`,
`appleid.apple.com`, `login.microsoftonline.com`, `*.posthog.com`,
`*.sentry.io`, `api.elevenlabs.io`, `player.vimeo.com`, `fonts.googleapis.com`,
`fonts.gstatic.com`.

### CORS

| Environment | Policy |
|---|---|
| Production | Restricted to 4 origins: `https://leader-os.de`, `https://www.leader-os.de`, `https://leader-check.de`, `https://www.leader-check.de` |
| Development | Regex-matched `localhost`/`127.0.0.1` on any port |

Credentials (`allow_credentials=True`) are always enabled (required for
httpOnly session cookies).

### Password Security

- Minimum 8 characters (enforced server-side).
- Passwords hashed with bcrypt (auto-salted).
- Leaked password protection via HaveIBeenPwned (Supabase Auth policy).
- Session invalidation on password change.

### Rate Limiting

**Backend middleware** (sliding-window, per-IP):

| Path pattern | Limit |
|---|---|
| `/api/auth/login`, `/api/auth/register` | 20 req/min |
| `/api/chat/send`, `*/analyze` | 20 req/min |
| General `/api/*` | 120 req/min |
| Non-API (static assets) | Unlimited |

**Brute-force layer** (per email+IP, in addition to middleware):

Login: 10 failed attempts / 15 min. Register: 5 / 60 min. Magic link: 5 / 15 min.

### JWT

- Algorithm: HS256.
- Expiry: 7 days.
- Leeway: 10 seconds (absorbs clock skew).
- Secret: `JWT_SECRET` environment variable (required, backend fails fast if missing).

### Database Security (Supabase)

- RLS enabled on every public table.
- All views use `security_invoker = true`.
- All trigger functions have `REVOKE ALL FROM public, anon, authenticated`
  with only `service_role` granted.
- Anon role has no direct table grants; sole entry point is
  `upsert_incomplete_attempt` RPC.
- pgvector RAG queries restricted to `authenticated` role only.

---

## 8. Infrastructure and Monitoring

### Cron Jobs

**GitHub Actions cron** (`.github/workflows/cron.yml`):

| Job | Schedule | Endpoint |
|---|---|---|
| `installments-due` | Daily 07:00 UTC (09:00 Berlin) | `POST /api/cron/installments-due` |
| `monthly-scorecard` | 1st of month, 07:00 UTC | `POST /api/cron/monthly-scorecard` |

Both jobs auto-open a GitHub Issue on failure with `cron-failure` and
`priority:high` labels.

**pg_cron jobs** (Supabase, key ones):

| Job | Interval | Purpose |
|---|---|---|
| `advance_email_journeys` | Every 15 min | Advance user email journey state |
| `email_dispatcher` | Every 15 min | Send queued emails via Resend |
| `health_monitor` | Every 60s | System health checks |
| `trigger_strategist(7)` | Weekly | Generate 7-day AI leadership plays |
| `trigger_strategist(30)` | Monthly | Generate 30-day AI leadership plays |

### Error Tracking (Sentry)

| Aspect | Detail |
|---|---|
| Region | EU |
| Projects | 2 (one per surface: leader-os, leader-check) |
| Frontend | `@sentry/react` v10, host-based DSN routing in `frontend/src/index.js` |
| Backend | `sentry-sdk` with FastAPI + Starlette integrations in `backend/server.py` |
| Traces | Sample rate configurable via `SENTRY_TRACES_SAMPLE_RATE` (default 0.1) |
| PII | `send_default_pii=False` |

### Analytics (PostHog)

| Aspect | Detail |
|---|---|
| Region | EU (`eu.i.posthog.com`) |
| Consent | Cookie consent gated (`CookieConsentBanner` component) |
| Identity | `email_lower` as dedup key (matches Supabase `users.email_lower`) |
| Init | Inline snippet in `frontend/public/index.html` |
| Helpers | `identifyByEmail()`, `resetIdentity()` in `frontend/src/lib/analytics.js` |
| Identity stitching | `posthog.alias()` + `posthog.identify()` on login/rehydrate |

### Go-Live Readiness

```sql
SELECT * FROM go_live_readiness;
```

A Supabase SQL view that runs 11 checks covering schema integrity, trigger
health, RLS status, email configuration, cron job status, and webhook
connectivity. All rows should be green. Designed for daily use during the
first 2 weeks post-launch, then weekly.

### Health Endpoints

| URL | Purpose |
|---|---|
| `GET /api/health` | Backend liveness (returns `{"status": "ok"}`) |
| `GET /api/` | Version check (returns `WladBot API v5.0`) |
| `GET /api/payments/packages` | Public package listing (also serves as integration smoke test) |

### Incident Response

Full incident runbook at `docs/ops/INCIDENT_RUNBOOK.md` covering:

- Backend down (FastAPI/supervisor)
- Stripe webhook failures
- Installment plan charging issues
- Vercel build failures
- Sentry/PostHog quota exhaustion
- Database connection limits
- RLS policy debugging
- Email delivery failures
- Rollback procedures (frontend, backend, database)
- Escalation paths (Supabase, Vercel, Stripe, Emergent, DNS)

---

## 9. Deployment Pipeline

### Frontend (Vercel)

| Aspect | Detail |
|---|---|
| Trigger | Auto-deploy on push to `mvpcode` |
| Install | `cd frontend && yarn install --frozen-lockfile` |
| Build | `cd frontend && yarn build` (CRACO) |
| Output | `frontend/build/` |
| Framework | CRA (declared in `vercel.json`) |
| Rewrites | `/api/*` proxied to `https://leader-os.de/api/*`; SPA fallback to `/index.html` |
| Static caching | `Cache-Control: public, max-age=31536000, immutable` for `/static/*` |
| Env vars | `REACT_APP_BACKEND_URL`, `GENERATE_SOURCEMAP=false`, Sentry DSNs, Stripe publishable key |

### Backend (Emergent)

| Aspect | Detail |
|---|---|
| Trigger | Manual deploy via Emergent dashboard |
| Runtime | Python 3.11, uvicorn, supervisor-managed |
| Port | 8001 |
| Dependencies | `pip install -r backend/requirements.txt` |
| Restart | `sudo supervisorctl restart backend` |

### CI (GitHub Actions)

**`ci.yml`** -- Triggered on any push that changes `frontend/package.json` or
`frontend/yarn.lock`:

1. **frontend-build**: Runs `yarn install --frozen-lockfile` + `yarn build`
   on Node 22. Catches lockfile drift before Vercel.
2. **backend-syntax**: Runs `python -m compileall -q backend` on Python 3.11.
   Catches import/syntax errors without needing private dependencies.

### Edge Functions (Supabase)

Deployed via Supabase CLI from a machine with `supabase login` complete:

```bash
supabase link --project-ref srujvjjncrszhaaxepxf
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy ingest-leader-check --no-verify-jwt
supabase functions deploy ingest-leader-os --no-verify-jwt
supabase functions deploy ai-strategist
supabase functions deploy wladbot-chat
```

Required secrets: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `STRIPE_WEBHOOK_SECRET`.

### Schema Changes

All DDL changes go through `apply_migration` via the Supabase MCP server.
After every DDL change, run `get_advisors` to check for security warnings.
The one known intentional WARN is `upsert_incomplete_attempt` callable by
`anon`.

---

## 10. What's Next

### Content (Waiting on Production)

- [ ] **72 Vimeo URLs**: Video production is underway. URLs will be attached
  via `rpc_attach_vimeo` once each course episode is finalized and uploaded
  to Vimeo.

### Email Journeys (Templates Needed)

- [ ] **Win-back email journey**: Enrollment trigger is ready
  (`fn_user_hours_since_engagement()` returns hours since last activity).
  Templates need to be designed and added to `email_journey_steps`.
- [ ] **Weekly progress digest**: Summarize the user's week (sessions,
  episodes watched, challenge progress) and email it every Monday.
- [ ] **Renewal nudge T-30**: Send a renewal reminder 30 days before
  subscription expiry.

### Frontend Wiring

- [ ] **`/my-path` page**: Wire `MyPathPage` component to the Supabase
  `v_my_path` view for personalized learning journey visualization.
- [ ] **CRA to Vite migration**: CRA is EOL. Migrate to Vite to resolve
  `yarn audit` vulnerabilities from CRA's transitive dependencies and
  improve build speed. The `resolutions` block in `frontend/package.json`
  currently patches 18 vulnerable transitive deps.

### Infrastructure

- [ ] **Mongo to Supabase migration**: Phased plan documented in
  `docs/ops/SUPABASE_MIGRATION.md`. MongoDB remains system of record for now;
  Supabase is the sync sidecar. Full migration deferred to post-launch
  stability (auth swap is the riskiest phase).
- [ ] **PostHog env-driven init**: Replace inline snippet in
  `public/index.html` with `posthog-js` npm package for cleaner CSP and
  env-var control. Migration steps in `docs/ops/INTEGRATIONS.md`.

---

## Appendix: Key File Paths

| Category | Path |
|---|---|
| Project overview | `CLAUDE.md` |
| Frontend source | `frontend/src/` |
| Backend source | `backend/` |
| Backend entry point | `backend/server.py` |
| Auth routes | `backend/routes/auth.py` |
| OAuth routes | `backend/routes/oauth.py` |
| Payment routes | `backend/routes/payments.py` |
| Tier definitions | `backend/services_tier.py` |
| Email service | `backend/services_email.py` |
| Magic link service | `backend/services_magic_link.py` |
| Login security | `backend/services_login_security.py` |
| Rate limit middleware | `backend/middleware/__init__.py` |
| Schema reference | `docs/app/SCHEMA.md` |
| Incident runbook | `docs/ops/INCIDENT_RUNBOOK.md` |
| Integrations spec | `docs/ops/INTEGRATIONS.md` |
| Operational runbook | `docs/ops/RUNBOOK.md` |
| Migration plan | `docs/ops/SUPABASE_MIGRATION.md` |
| Changelog | `docs/CHANGELOG.md` |
| Go-live runbook | `docs/archive/GO_LIVE.md` |
| Vercel config | `vercel.json` |
| CI workflow | `.github/workflows/ci.yml` |
| Cron workflow | `.github/workflows/cron.yml` |
| Frontend deps | `frontend/package.json` |
| Stripe webhook edge fn | `supabase/functions/stripe-webhook/` |

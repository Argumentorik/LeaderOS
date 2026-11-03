# System Overview

Snapshot of the production architecture as of the launch-day cleanup
(June 2026, Iter 92.20). The file is meant to be the one place a new
engineer or stakeholder can read in 10 minutes to understand what the
app is, what runs where, and how the layers actually talk to each
other. The detailed schema, runbook, integration spec, and changelog
live in their own docs — this file links into them rather than
duplicating.

## 1. Hosting / edge layer

```
                          USER (browser)
                                │
                                ▼
                    VERCEL (Edge CDN · 5 regions)
                fra1 · lhr1 · iad1 · cdg1 · arn1
   ─────────────────────────────────────────────────────────────────
   • Serves the React static bundle (CRA — not Next.js)
   • Domains: leader-os.de, leader-check.de, www.* of each
   • vercel.json rewrites /api/* → https://leader-os.de/api/*
   • Strict CSP allows: Stripe, PostHog, Sentry, Supabase, Voyage,
     Resend, ElevenLabs, accounts.google.com, appleid.apple.com,
     login.microsoftonline.com, player.vimeo.com
```

The two domains (`leader-os.de`, `leader-check.de`) point at the same
React bundle. Routing inside the app is what surfaces the two product
experiences — the FE itself doesn't fork on domain.

## 2. Frontend (`frontend/`)

CRA + React Router v7 + Radix UI + Tailwind. Lazy-loaded routes wrapped
in `lazyWithRetry` so stale-deploy chunk-404s self-recover.

### Routes (selection)

| Path | Page | Purpose |
|---|---|---|
| `/login` | LoginPage | Magic Link + OAuth (Google / Apple / Microsoft) |
| `/dashboard` | DashboardPage | Post-login home |
| `/my-path` | MyPathPage | User journey + progress |
| `/coaching` | CoachingPage | 1:1 booking surface |
| `/chat` | ChatPage | WladBot text chat |
| `/missions` | VideoChallengePage | Record + analyze video |
| `/simulations` | SimulationsPage | Role-play with AI employee |
| `/playbooks` | PlaybooksPage | Guided multi-step coaching |
| `/enterprise` | EnterprisePage | B2B funnel (leads + diagnosis) |
| `/wlad-control-x7k9q2` | AdminPage | Hidden admin path |
| `/impressum`, `/datenschutz`, `/agb`, `/widerruf` | Legal pages (GDPR) |

### Contexts (state)

| Context | Holds | Source |
|---|---|---|
| AuthContext | Supabase session + identifyByEmail() into PostHog | Supabase JS SDK |
| ThemeContext | dark / light | localStorage |
| LanguageContext | DE / EN i18n | localStorage |
| CreditContext | chat + video credit balance | `/api/credits` |
| TierContext | PLUS / Standard / Free gating | `/api/users/me` |
| PricingContext | centralized pricing config | `/api/pricing` |

### Key components

| Component | Notes |
|---|---|
| `calls/FakeWladCall` | Chip-style fake-call A/B notification, 1× per session |
| `auth/ReAuthModal` | Re-auth on stale token, cross-tab safe |
| `shared/VoiceRecorder` | Whisper audio recorder + upload |
| `shared/WladMark` | Logo |

### Frontend libs of note

`@radix-ui/*`, `@react-oauth/google`, `@sentry/react`, `axios`,
`lucide-react`, `react-router-dom@7`, `recharts`, `sonner`,
`class-variance-authority`, `gsap`, `clsx`, `cmdk`.

## 3. Backend (`backend/`)

FastAPI on Python 3.11, hosted on the Emergent Pod. All routes are
prefixed `/api`. Frontend reaches the backend via the Vercel
`/api/*` rewrite.

### Route map (`backend/routes/`)

| File | Endpoints | Purpose |
|---|---|---|
| `auth.py` | session, OAuth callbacks, magic-link verify | Cookie + JWT auth |
| `chat.py` | `/api/chat` | WladBot text chat (RAG-grounded) |
| `video.py` | `/api/video-challenges/.../analyze`, `/api/voice/transcribe` | Whisper + RAG |
| `voice_tts.py` | `/api/voice/conversation`, `/api/tts` | Audio-in→AI→audio-out |
| `simulations.py` | `/api/simulations/...` | Role-play (RAG at end) |
| `playbooks.py` | `/api/playbooks/.../step`, `/api/playbooks/.../report` | RAG per step |
| `checkin.py` | `/api/daily-checkin` | Daily reflection coaching |
| `payments.py` | `/api/payments/...` | Stripe checkout (uses STRIPE_API_KEY) |
| `enterprise.py` | `/api/enterprise/submit`, `/api/enterprise/diagnosis` | B2B leads + emails |
| `tasks.py` | task list CRUD | User productivity |
| `events.py` | event tracking | XP source |
| `referral.py` | affiliate codes | Growth |
| `ki_news.py` | AI-curated leadership news | Content |
| `credits.py` | chat + video credit ledger | Tier gating |
| `wladhub.py` | cross-platform identity bridge | Sync |
| `admin.py` | `/api/admin/rag-debug`, etc. | Admin tooling |
| `support.py` | Wingman CRM hooks (Iter 92.18, not on mvpcode yet) | Support |
| `gdpr.py` | export / delete | Compliance |

### Service modules (`backend/services_*.py`)

| Module | Responsibility |
|---|---|
| `services.py` | `WLADBOT_SYSTEM_PROMPT`, `SIMULATION_SYSTEM_PROMPT`, `WLAD_HARD_RULES` (single source for Wlad-identity + RAG-grounding rules) |
| `services_rag.py` | `retrieve_context()` — Voyage embed → Supabase RPC `match_wladbot_documents` — threshold 0.25, k=6 |
| `services_email.py` | Resend wrapper + template renderer |
| `services_tier.py` | Tier gating (free / standard / plus / accelerator) |
| `services_actions.py` | XP / leveling / scoring engine |
| `services_ai_parse.py` | Robust JSON extraction from LLM replies |
| `services_crm.py` | Wingman CRM (Iter 92.18) |
| `services_video_trial.py` | 14-day video-analysis trial counter |
| `services_voice.py` | ElevenLabs TTS (Brian voice + 7 personas) |

### Backend libs of note

`fastapi`, `uvicorn`, `pydantic`, `motor` (async Mongo driver),
`httpx`, `stripe==14.4.0`, `resend`, `sentry-sdk`,
`emergentintegrations` (Emergent's private LLM gateway giving access
to GPT-5.2 + Whisper without direct OpenAI billing), `imageio-ffmpeg`
(audio extraction fallback when system ffmpeg is missing).

## 4. State layer

### MongoDB (primary user state, on the Emergent Pod)

| Collection | Holds |
|---|---|
| `users` | Canonical user (`mongo_user_id` as PK) |
| `chat_sessions` | All WladBot conversations |
| `chat_messages` | Per-turn messages |
| `video_challenges` | Analysis results + transcripts |
| `simulations` | Role-play sessions |
| `playbook_sessions` | Playbook runs |
| `daily_checkins` | Daily reflections |
| `payment_transactions` | Stripe history |
| `events` | All user actions (XP source) |
| `tasks` | User task list |
| `enterprise_leads` | B2B lead capture |
| `ki_news_articles` | Curated leadership news |

### Supabase Postgres (`srujvjjncrszhaaxepxf`, eu-north-1 Frankfurt)

Cross-platform identity, RAG, payments-and-emails pipeline.

| Table / surface | What it holds |
|---|---|
| `public.users` | Mirrored from Mongo, `email_lower` is the cross-platform key. Also tracks `auth_user_id` (link to `auth.users`) and `meta_tags[]` (every platform ever touched). |
| `auth.users` | Supabase Auth — OAuth + Magic Link sessions |
| `subscriptions` | Active tier, Stripe payment intents |
| `pricing_plans` | 6 active plans, Stripe price + product IDs (PLUS yearly, 2× Raten, 12× Raten; standard yearly, 2× Raten, 12× Raten) |
| `wladbot_documents` | **609 RAG chunks** (text + voyage-3 1024-dim vector). HNSW index `(m=16, ef_construction=64)`. Three sets: courses (342), books (249), framework (18) |
| `email_journeys` | 3 active: plus_onboarding, leader_os_onboarding, free_course_drip |
| `email_journey_steps` | Step sequence + `delay_hours` |
| `email_templates` | 24 active, `{{var}}` substitution |
| `email_sends` | Queue + status + Resend `message_id` |
| `user_journey_state` | User enrollment in journeys |
| `idempotency_keys` | Stripe webhook dedup |
| `system_events` | All component logs |
| `emergent_sync_queue` / `inbound_sync_events` | Bidirectional sync with MongoDB |
| `incidents` | Active incidents |

#### Cron (15 jobs)

- `email_dispatcher` — every minute, drains `email_sends` → Resend
- `advance_email_journeys` — every 15 min, queues next journey step
- `drain_emergent_sync` — every minute, ships outbound queue
- `health_monitor_shallow` / `_deep` — liveness checks
- `installments-due` (GitHub Actions, 09:00 Europe/Berlin daily)
- `monthly-scorecard` (GitHub Actions, 1st of month)
- `slo_breach_check`, `emergent_circuit_check`, etc.

#### Vault secrets

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
`service_role_key`. Edge Function Secrets are a *separate* layer from
Vault — `Deno.env.get()` reads only Edge Function Secrets, never
Vault. Same key may need to live in both surfaces.

#### Edge Functions (Deno, all `srujvjjncrszhaaxepxf.supabase.co/functions/v1/*`)

| Function | Trigger | Purpose |
|---|---|---|
| `stripe-webhook` | Stripe POSTs events | Subscription upsert by email |
| `stripe-admin` | Internal POST (no JWT) | Create coupons, promo codes, payment links, list webhooks |
| `email-dispatcher` | Cron (every min) | Drain `email_sends` to Resend |
| `user-mirror` | Emergent Pod POST | MongoDB → Supabase user sync |
| `drain-emergent-sync` | Cron | Supabase → MongoDB outbound |
| `health-monitor` | Cron | Liveness scan |
| `ai-strategist` | Authenticated POST | Strategy agent (LLM-backed) |
| `wladbot-chat[-emergent]` | (deprecated stubs) | Return 410 Gone, log to `system_events`. Single chat path is now Python `/api/chat`. |

## 5. External services

| Service | Purpose | Auth |
|---|---|---|
| Stripe | Payments (live, `acct_1TYd2YA6vBlw9Oi4`) | `sk_live_` in EF Secrets + Vault |
| Resend | Transactional email | API key in EF Secrets + Vault |
| Voyage AI | Embeddings (`voyage-3`, 1024-dim) | API key in EF Secret + Emergent Pod env |
| Anthropic Claude | RAG chat fallback (4.7) | API key in EF Secrets |
| Emergent LLM gateway | GPT-5.2 + Whisper proxy | `EMERGENT_LLM_KEY` on Pod |
| ElevenLabs | TTS (Brian + 7 personas) | API key on Pod |
| PostHog | Product analytics | API key in FE env |
| Sentry | Error tracking | DSN in FE + BE env |
| Vimeo | Course video hosting | Domain allowlist: `leader-os.de` |
| Cal.com | Coaching session booking | Embed in CoachingPage |

## 6. Cross-layer data flows

### Auth (cross-platform identity)

```
User → Vercel SPA → Supabase Auth (Magic Link / OAuth)
  → auth.users INSERT
  → handle_new_auth_user trigger
     → public.users UPSERT by email_lower (links auth_user_id)
  → user-mirror EF → MongoDB users collection
  → FE gets session → AuthContext → PostHog identifyByEmail(email_lower)
```

`email_lower` is the cross-platform identity key. PostHog identity
stitching uses the same key — see `frontend/src/lib/analytics.js`.

### Payment

```
User → Stripe Checkout (live mode)
  → checkout.session.completed event
  → stripe-webhook EF
     • upsert subscription
  → DB trigger subscriptions_enroll_journey
     → INSERT user_journey_state (step 0)
  → DB trigger trg_subscription_to_emergent
     → emergent_sync_queue → drain cron → Emergent FastAPI → Mongo tier='accelerator'
  → advance_email_journeys cron (every 15 min)
     → INSERT email_sends (status=queued)
  → email-dispatcher cron (every minute)
     → Resend API → user inbox
```

### RAG (used by `/api/chat`, video analyzer, voice conversation, playbook steps)

```
User query (text / voice transcript / video transcript)
  → Python FastAPI route
  → services_rag.retrieve_context(query)
     → _embed_query → Voyage AI (voyage-3)
     → match_wladbot_documents (Supabase RPC · HNSW · threshold 0.25)
     → top-K chunks (default k=6)
     → format as "=== WLAD-WISSEN ===" block
  → append to system_prompt + WLAD_HARD_RULES
  → LlmChat (GPT-5.2 via Emergent gateway) OR Claude 4.7
  → response references Wlad's specific frameworks by name
```

`WLAD_HARD_RULES` is a single-source constant in `services.py`,
appended to every system prompt that goes to an LLM. Three locks:
name (always "Wlad", never "Vlad"), corpus usage (cite specific
framework names when chunks were provided), corpus breadth (use all
three corpora — books, courses, framework).

### Video analysis

```
Browser → VoiceRecorder / VideoRecorder
  → POST /api/video-challenges/{id}/analyze (multipart)
  → _transcribe_audio
     • ffmpeg extracts mono 16 kHz MP3 (drops video track)
     • Whisper API (25 MB cap on audio, 150 MB cap on raw)
  → _run_video_ai_analysis
     • retrieve_context(challenge title + transcript)
     • GPT-5.2 with RAG context + WLAD_HARD_RULES
     • parse_ai_json — retry once if invalid
  → MongoDB video_challenges
  → XP + score update
```

## 7. CI/CD layer

```
GitHub PR opens
  ├── ci / frontend-build      (yarn install --frozen-lockfile + yarn build)
  ├── ci / backend-syntax      (python -m compileall backend/)
  ├── lockfile-guard           (yarn.lock matches package.json)
  ├── constants-drift          (RAG threshold + voyage model only in services_rag.py)
  └── Vercel preview deploy

All 5 + Vercel must be green → merge into mvpcode allowed
mvpcode push → Vercel auto-deploys production

Post-merge to mvpcode:
  └── supabase-advisors       (daily + on-push, fails on new ERROR-level)
```

Required-status-checks on `mvpcode` are configured in GitHub branch
protection. See `CONTRIBUTING.md` for the exact list and the one-time
maintainer setup (SUPABASE_ACCESS_TOKEN secret, redirect URL
allowlist for Supabase Auth).

## 8. Branch model

| Branch | Purpose | Who pushes |
|---|---|---|
| `mvpcode` | Production. Protected, PR-only | Merge bots only |
| `feat/*` | Human / Claude feature branches | Dev sessions |
| `emergent-iter-NN.NN` | Emergent Pod-Claude pushes | Pod via "Save to GitHub" |
| `claude/*` | Claude Code session branches | Claude Code on the web |
| `backup/*` | History snapshots | Never |
| `chore/*`, `docs/*`, `fix/*` | Cross-cutting branches | Per-task |

## 9. Monitoring

Two SQL views, queryable from the Supabase dashboard SQL editor.

- `go_live_readiness` — 11 launch-readiness checks (today: 9 green, 2
  yellow that are environment-expected: no live webhook yet, Mongo
  inbound sync just stale because no inbound traffic recently).
- `launch_monitor` — 18 live metrics: webhooks, subs, emails, RAG
  match-counts, Emergent circuit, Mongo outbound lag, open incidents.

Operator workflow during a launch test:

```sql
SELECT * FROM launch_monitor ORDER BY metric;
```

## 10. Related docs (deep dives)

| Topic | File |
|---|---|
| Schema reference | `docs/app/SCHEMA.md` |
| Identity architecture | `docs/app/IDENTITY_ARCHITECTURE.md` |
| App architecture (deeper) | `docs/app/APP_ARCHITECTURE.md` |
| Operational runbook | `docs/ops/RUNBOOK.md` |
| Incident playbook | `docs/ops/INCIDENT_RUNBOOK.md` |
| Integration spec (PostHog / Sentry) | `docs/ops/INTEGRATIONS.md` |
| Cron schedule | `docs/ops/CRON_SCHEDULE.md` |
| Migration history | `docs/CHANGELOG.md` |
| Launch-day fix sequence | `docs/archive/LAUNCH_FIX.md` |
| Sentry alert config | `docs/ops/SENTRY_ALERTS.md` |
| Vimeo workflow | `docs/gtm/VIMEO_WORKFLOW.md` |
| Production readiness | `docs/ops/PRODUCTION_READINESS.md` |
| Contributor workflow | `../CONTRIBUTING.md` |

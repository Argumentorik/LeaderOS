# Tech handbook — how we treat the tech and how it works

> For everyone who touches LeaderOS code or infrastructure: Stefan, Mert,
> the support team, any future developer. Ten minutes to read. It states
> the system in one picture, the rules we do not break, and how work flows
> from idea to production. Deeper documents are linked at the end.
> Stand 05.10.2026.

---

## 1. The system in one picture

```
            leader-os.de (marketing)            leaderos.de (app)
            Vercel · branch mvpcode             Emergent · project command-center-229
            React SPA + prerendered HTML        React SPA (same bundle)
                    │  /api/* rewrite                     │
                    └──────────────┬──────────────────────┘
                                   ▼
                     FastAPI backend  (backend/server.py, 36 routers)
                       │            │             │              │
                   MongoDB     Supabase       Resend        Stripe
                 (in the pod)  Postgres       (email)     (payments)
                 users, leads, identity mirror,
                 payments,     RAG corpus 2 212 chunks,
                 sessions      pg_cron, Edge Functions
                       │
                   LLM via backend/lib/llm_provider.py
                   (Anthropic / OpenAI native, else Emergent key)
                   ElevenLabs (voice) · Voyage (optional query embeddings)
```

- **Two domains, two jobs.** Marketing pages must be fast, static and
  crawlable; the app needs Python, a database and background jobs. A
  backend outage never takes the landing pages down.
- **One identity key everywhere: `email_lower`.** Mongo, Supabase
  `public.users`, PostHog `identify`, Sentry `setUser`. A user created
  without it is a duplicate waiting to happen.
- **Source of truth is GitHub `aiporator/shipos`, branch `mvpcode`.** If a
  change is not in GitHub, it does not exist, even if it runs on Emergent.

## 2. Principles — how we treat the tech

1. **Honesty over conversion.** No fake scarcity, no invented numbers, no
   fabricated reviews, no AI-generated faces of real people. The webinar
   counter hides itself below 25 registrations. Every claim about Wlad
   comes from `docs/gtm/WLAD_CANON.md`; if it is not there, we do not say it.
2. **The product is the training loop.** Course lesson → drill on the
   user's real case → WladBot before the conversation → simulation with
   pushback → evaluation. Features that do not feed this loop are
   candidates for removal, decided by usage data (PostHog), not taste.
3. **Boring, observable infrastructure.** Health endpoint, Sentry alerts,
   PostHog events, logs you can read. A feature is done when we can see
   whether it works and whether anyone uses it.
4. **Change is cheap, drift is expensive.** Small PRs, every change in
   GitHub, Emergent deployed from `mvpcode` only. The 2026 drift between
   Emergent and GitHub cost weeks; we do not repeat it.
5. **Data rules are not optional.** Schema changes only through migrations
   (`apply_migration`), then `get_advisors`; views
   `security_invoker = true`; trigger functions granted to `service_role`
   only; the one intentional warning is `upsert_incomplete_attempt`
   callable by `anon`.
6. **Secrets live in the tool that uses them.** Emergent env, Vercel env,
   GitHub secrets, Supabase secrets. Never in mail, chat, screenshots or
   the repo (gitleaks runs on every PR). When someone needs an API key they
   create their own named key in the vendor dashboard.
7. **Every tool has two admins and 2FA.** One lost phone must not stop the
   company. Billing runs on the Argumentorik Akademie GmbH, never on a
   private card.
8. **Write it down where the next person will look.** Ops facts go in
   `docs/ops/`, architecture in `docs/app/`, go-to-market in `docs/gtm/`,
   history in `docs/archive/` (never build on archive). `docs/README.md`
   is the index; `CLAUDE.md` is the briefing for AI coding agents and
   humans alike.

## 3. How work flows

```
idea → branch from mvpcode → PR (CI: ci, gitleaks, lockfile-guard,
constants-drift, codeql) → review → merge → Vercel deploys marketing
automatically → developer deploys Emergent manually → smoke checks →
Sentry quiet for a day → PostHog shows usage
```

- **Branching:** `docs/ops/BRANCHING.md`. Production is `mvpcode`; `backup/*`
  is history; stale `claude/*` branches get deleted.
- **Frontend dependencies:** never add to `frontend/package.json` without
  updating `yarn.lock` (Vercel builds with `--frozen-lockfile`).
- **Marketing pages that should rank or be cited** must exist as HTML
  without JavaScript: either prerendered at build time
  (`frontend/scripts/prerender-*.mjs`) or as a static file in
  `frontend/public/<path>/index.html`. Rules in
  `docs/gtm/SEO_AEO_PLAYBOOK.md` §3.
- **Tests:** `backend/tests/` has unit suites that need no database
  (`test_free_video_funnel.py`, `test_lead_import.py`) and integration
  suites that need a running backend plus `TEST_*` credentials. CI
  currently runs `compileall`; enabling the unit suites is the next step.
- **Definition of done:** merged, deployed to Emergent, smoke checks green,
  Sentry quiet, an event in PostHog.

## 4. Operating it

| Need | Where |
| --- | --- |
| Is the backend up | `GET /api/health`, `GET /api/monitoring/system` |
| Deploy, env vars, logs, rollback | `docs/ops/EMERGENT_ADMIN_ONBOARDING.md` |
| Something is broken | `docs/ops/INCIDENT_RUNBOOK.md` (symptom → fix sequence with time budgets) |
| Alerts and what they mean | `docs/ops/SENTRY_ALERTS.md` |
| Scheduled jobs | `docs/ops/CRON_SCHEDULE.md` — GitHub Actions + cron-job.org call the backend with `X-Cron-Secret` |
| Payments go-live and checks | `docs/ops/DEPLOY.md` |
| Who has access to what, billing hand-over | `docs/ops/TOOL_ACCESS.md` |
| Ads tracking activation | `docs/ops/ADS_TRACKING_GO_LIVE.md` (env vars only) |
| Admin panel, support team, CSV import | `docs/ops/APP_TAKEOVER_STEFAN.md` §8 |

**Escalation.** Health down or payments failing: fix first, write later;
if the runbook's time budget is exceeded twice, stop and call the other
developer. Everything else: GitHub issue with symptom, time, and what was
tried.

## 5. The AI parts, and how we keep them honest

- **WladBot** answers with retrieval over Wlad's corpus (`services_rag.py`,
  hybrid vector + lexical) and `WLAD_HARD_RULES` appended to every prompt
  (`services.py`): name spelling, use the corpus when provided, no invented
  books. Which surface uses which guardrail: `docs/app/RAG_KNOWLEDGE_FLOW.md`.
- **The canon wins.** When corpus and `WLAD_CANON.md` disagree, the canon is
  right and the corpus chunk gets fixed (known case: `layer202_drills` with
  a wrong SEXIER definition).
- **Wording is product.** Changes to prompts, tone or answer length are
  product decisions and get Wlad's OK.
- **Providers are swappable.** LLM, speech-to-text and object storage sit
  behind shims in `backend/lib/`; the embedding provider is optional
  (lexical retrieval works without it). We never let a vendor key be the
  single thing that switches a feature off silently.
- **Credits and limits fail loudly.** Every LLM route returns a clear
  message on `402 no_credits` or a timeout; a spinner that never ends is a
  bug, not a limit.

## 6. Security and privacy in one paragraph

HTTPS with HSTS, strict CSP, HttpOnly/Secure/SameSite cookies, bcrypt,
HS256 JWT with a secret the backend refuses to start without, magic links
hashed and single-use, rate limits on auth and chat, Stripe signatures
verified with idempotency. PostHog, Sentry replays and all ad pixels are
consent-gated (`lo_consent_v1`); analytics and the database stay in the
EU. GDPR export and delete exist (`routes/gdpr.py`). Evidence with
file and line: `docs/ops/PRODUCTION_READINESS.md` §0.

## 7. Documents worth knowing

- `CLAUDE.md` — the repo briefing and working rules.
- `docs/app/SYSTEM_OVERVIEW.md`, `docs/app/APP_ARCHITECTURE.md` — the map.
- `docs/app/SCHEMA.md` — Supabase schema and triggers.
- `docs/app/FEEDBACK_BACKLOG.md` — tester feedback, triaged with code refs.
- `docs/ops/APP_TAKEOVER_STEFAN.md` — the hand-over itself.
- `docs/gtm/WLAD_CANON.md` — the only source for claims about Wlad.

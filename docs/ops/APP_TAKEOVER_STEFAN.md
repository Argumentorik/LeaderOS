# LeaderOS app takeover — Stefan

> For **Stefan (`stefan@argumentorik.com`, GitHub `sbcodes`)**. Date: 05.10.2026.
> This is the one file to read before anything else. It explains how the
> app on **leaderos.de** runs, why each piece exists, how Emergent, PostHog,
> Sentry and Stripe are set up, how the support team gets into the admin
> panel, and which tasks are now yours. Everything is checked against the
> code on `mvpcode` unless marked otherwise. Deeper references are linked;
> you don't need to read them today.
>
> Scope: the **app** (`leaderos.de`, Emergent). The marketing site
> (`leader-os.de`, Vercel) only matters where it talks to your backend.

---

## 0. Your message, answered

You wrote that the test feedback points at two areas: server issues early in
the test, and the app feeling like too much. Both are right, and both are
yours to own now. §7 turns them into a plan: a reliability checklist for the
first one, and a data-driven feature cut for the second one. Nothing has to
be fixed today; reading this file is today's work.

---

## 1. What you are taking over

```
leaderos.de (app)                      Emergent project `command-center-229`
  ├── React SPA (same bundle as leader-os.de, served by Emergent)
  ├── FastAPI backend  backend/server.py  · 36 routers in backend/routes/
  ├── MongoDB          inside the Emergent pod (users, sessions, leads, payments)
  ├── Supabase Postgres `srujvjjncrszhaaxepxf` (identity mirror, RAG vectors, cron)
  └── Resend (email) · Stripe (payments) · ElevenLabs (voice) · Voyage (embeddings)

leader-os.de (marketing, Vercel, branch mvpcode)
  └── /api/*  →  rewritten to the same Emergent backend
```

**Why two hosts.** The marketing site needs fast static hosting, SEO
prerendering and Vercel previews. The app needs long-running Python, a
database and background jobs. Splitting them means a backend outage never
takes the landing pages down, and a marketing deploy never touches user data.
The cost: `/api/*` on leader-os.de is proxied to Emergent, so the webinar
signup form depends on your backend being up.

**Source of truth is GitHub `aiporator/shipos`, branch `mvpcode`.** Emergent
has drifted from it (details in
[`EMERGENT_ADMIN_ONBOARDING.md` §2](./EMERGENT_ADMIN_ONBOARDING.md)). Your
first technical task is the reconciliation in §7.1.

---

## 2. How Emergent functions, and why we use it

**What it is.** A managed container that runs the FastAPI backend, the
MongoDB instance and an object store, with a UI for env vars, deploys and
logs. It was chosen because it got the prototype into production in days,
with the LLM calls wrapped in Emergent's own key (`EMERGENT_LLM_KEY`).

**What you need to know to operate it.**

| Topic | How it works | Why it matters |
| --- | --- | --- |
| Deploy | Manual from the Emergent UI, from branch `mvpcode`. Vercel deploys the marketing site on its own; Emergent does not. | A merged PR is not live on leaderos.de until you deploy. |
| Env vars | Emergent → project → environment. **No hot reload: every change needs a redeploy.** Full table in `EMERGENT_ADMIN_ONBOARDING.md` §3. | Half of all "it's broken" reports are a missing env var. Check `ELEVENLABS_API_KEY` first (voice), `RESEND_API_KEY` (all email), `STRIPE_API_KEY` (checkout). |
| Logs | Pod shell: `sudo supervisorctl status backend` · `sudo supervisorctl tail -100 backend` | Startup failures (missing `JWT_SECRET`, import errors) only show here. |
| Health | `GET https://leaderos.de/api/health` → `{"status":"ok"}` · `GET /api/monitoring/system` → `overall: "go"` | Run after every deploy. Smoke list in `EMERGENT_ADMIN_ONBOARDING.md` §4. |
| MongoDB | Lives in the pod. Indexes are created at startup by `server.py`; no migrations to run. | Backups are Emergent's. Export important collections (`users`, `payment_transactions`, `webinar_leads`) once a week until a proper backup job exists. |
| Rollback | Emergent → redeploy previous version. | Minutes, not hours. |
| Lock-in | Two shims switch provider by env var only: `backend/lib/llm_provider.py` (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY` → native SDK, else Emergent key) and `backend/lib/object_storage.py` (Supabase Storage when `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` are set). | You can leave Emergent in steps without touching routes. Order: reconcile → flip LLM key → flip storage → move hosting. |

**Scheduled jobs** run from GitHub Actions (`.github/workflows/cron.yml`,
`webinar-cron.yml`) and call your backend with `X-Cron-Secret`. The secret
must be identical in GitHub and Emergent. Details:
[`CRON_SCHEDULE.md`](./CRON_SCHEDULE.md).

---

## 3. PostHog — product analytics (new account needed)

**Why.** PostHog answers the question you raised: which features do people
actually use? Without it the "cut something" decision is opinion. It also
gives session replays for bug reports and Core Web Vitals from real users.

**How it is wired today.**

- Frontend: inline snippet in `frontend/public/index.html`, EU host
  `eu.i.posthog.com`, project key hardcoded (`phc_xmMQne…`). It only
  initialises after the visitor accepted analytics in the consent banner
  (`lo_consent_v1.analytics === true`), and `frontend/src/index.js`
  re-attempts init when consent changes.
- Identity: `identifyByEmail(email_lower)` on login and session rehydrate,
  `resetIdentity()` on logout (`frontend/src/lib/analytics.js`,
  `contexts/AuthContext.js`). The key is **`email_lower`**, the same key as
  Mongo, Supabase and Sentry. Never identify with anything else, or one
  person becomes two profiles.
- Backend: `POSTHOG_KEY` / `POSTHOG_API_KEY` + `POSTHOG_HOST` on Emergent for
  server-side events.
- Extra events already firing: `web_vital` (LCP, CLS, INP, TTFB), funnel
  events with `surface` and `funnel` properties (e.g. `webinar_view`).

**Set up the new account (you are the owner).**

1. `eu.posthog.com` → create organisation "Argumentorik" (EU region, keep
   data in the EU like Supabase `eu-north-1`), project "LeaderOS".
2. Project settings → copy the project API key (`phc_…`).
3. Replace the key in `frontend/public/index.html` (search for
   `posthog.init(`), open a PR to `mvpcode`. Vercel redeploys the marketing
   site; you deploy Emergent for the app.
4. Emergent env: `POSTHOG_KEY=<new key>`, `POSTHOG_HOST=https://eu.i.posthog.com`, redeploy.
5. Verify: DevTools → Network → filter `posthog` → requests go to
   `eu.i.posthog.com/e/`; after login an `identify` call carries the
   lowercased email.
6. Invite `wj@argumentorik.com` and `mert@argumentorik.com` as members; set
   2FA.

**First three dashboards to build** (they feed §7.3):

- Pageviews per `$pathname` for the app routes, last 30 days, unique users.
- Activation funnel: signup → first WladBot message → first drill → day-7 return.
- Session replays filtered on `console error` or rage clicks, for bug triage.

---

## 4. Sentry — error monitoring (new account needed)

**Why.** The "server issues early in the test" were invisible until users
complained. Sentry turns a 5xx spike, a failing Stripe webhook or a broken
login into an alert within a minute, with the stack trace.

**How it is wired today.**

- Backend: Sentry SDK in `backend/server.py`, env `SENTRY_DSN`, `SENTRY_ENV`,
  `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE` (0.10),
  `SENTRY_PROFILES_SAMPLE_RATE` (0.10). A `before_send` filter drops
  expected noise: 401/403/404/422/429, client disconnects, health checks.
- Frontend: `@sentry/react` in `frontend/src/index.js`, env-gated and
  host-based: `REACT_APP_SENTRY_DSN_LEADER_OS` for leaderos.de /
  leader-os.de, `REACT_APP_SENTRY_DSN_LEADER_CHECK` for the diagnosis site.
  With no DSN the SDK stays dormant. User context is set with `email_lower`.
- Alert rules are documented, not yet created in a UI you own:
  [`SENTRY_ALERTS.md`](./SENTRY_ALERTS.md).

**Set up the new account (you are the owner).**

1. `sentry.io` → new organisation "argumentorik", **data region EU**.
2. Three projects: `leaderos-backend` (Python / FastAPI), `leader-os`
   (React), `leader-check` (React).
3. DSNs → Emergent env (`SENTRY_DSN`, `SENTRY_ENV=production`) and Vercel env
   (`REACT_APP_SENTRY_DSN_LEADER_OS`, `REACT_APP_SENTRY_DSN_LEADER_CHECK`,
   scope Production). Redeploy both.
4. Create the alert rules from `SENTRY_ALERTS.md` with **you** as recipient
   (replace the placeholder addresses there): P0 = 5xx spike, Stripe webhook
   failure, auth endpoint errors. Add Slack later if you use it.
5. Verify: `POST /api/monitoring/test` (admin only) raises a test event; it
   must appear in `leaderos-backend` within a minute.
6. Invite `wj@argumentorik.com` and `mert@argumentorik.com`.

---

## 5. Stripe — payments

**Why crucial.** Checkout for the tiers (30-day challenge 997 €, OS year
4 797 €, instalments) and the webhook that activates the tier on the user
document. If the webhook fails, people pay and get nothing.

**How it is wired.**

- `backend/routes/payments.py`: `STRIPE_API_KEY` on Emergent. `sk_live_…` or
  your own `sk_test_…` → native Stripe SDK; the value `sk_test_emergent`
  selects Emergent's sandbox wrapper. `GET /api/payments/stripe-mode`
  tells you which mode is active and warns if the key is missing.
- Webhook endpoint: `/api/webhook/stripe` (reachable as
  `https://leaderos.de/api/webhook/stripe`; the old
  `leader-os.de/api/webhook/stripe` also lands on the same backend through
  the Vercel rewrite). Needs `STRIPE_WEBHOOK_SECRET` on Emergent. Events:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `payment_intent.payment_failed`.
- Idempotency and retries: Stripe retries for three days; handler is
  idempotent per event id.
- Step-by-step go-live and the 1 € smoke test: [`DEPLOY.md`](./DEPLOY.md).
  Incident paths (400 on every webhook = wrong secret, paid but no tier =
  webhook not delivered): [`INCIDENT_RUNBOOK.md`](./INCIDENT_RUNBOOK.md).

**What must change on the business side** (owner action, not code): the
**payout bank account, business details and VAT ID** must be the
Argumentorik Akademie GmbH, and you should be invited as *Developer* (sees
API logs and webhooks, not payouts). Checklist in
[`TOOL_ACCESS.md` §3a](./TOOL_ACCESS.md).

---

## 6. Admin panel access for the support team (fixed in code, deploy pending)

**The problem.** Admin access is decided per account: an allowlist of
emails in `backend/routes/admin.py` plus an `is_admin` flag on the user
document. Anyone else who opens `leaderos.de/wlad-control-x7k9q2` is sent to
the dashboard. Adding the support team meant editing the allowlist and
redeploying, or handing out a founder login.

**The fix (PR on `claude/leader-os-video-funnel-3am9ju`, needs merge + Emergent deploy).**

1. **Grant from the panel.** Admin panel → card *Admin access & webinar
   import* → enter the person's email → *Grant*. Requirement: the person has
   already signed up on leaderos.de (the flag lives on their user document).
   From the next request their own login opens the admin panel. Revoke is
   one click; nobody can revoke themselves and allowlisted emails cannot be
   removed there, so there is always at least one admin.
   API: `GET /api/admin/admins`, `POST /api/admin/admins {email, grant}`.
   Every grant is logged in `system_events`.
2. **Env allowlist as a second route.** `ADMIN_EMAILS=a@argumentorik.com,b@argumentorik.com`
   on Emergent (comma-separated) is merged with the code allowlist. Useful
   for founders; needs a redeploy.
3. **CSV import of webinar attendees.** Same card → choose the CSV the team
   prepared → *Check (dry run)* → *Import*. Columns `email` (required),
   `name`, `company`; comma, semicolon or tab; German or English headers;
   Zoom attendee exports work as-is. Leads are upserted into
   `webinar_leads` with source `csv-import`. **No email is sent by the
   import**; the reminder and follow-up crons treat them like any
   registration. API: `POST /api/admin/webinar-leads/import?dry_run=true`.
4. One admin definition for the whole backend: `routes/monitoring.py` had
   its own, smaller allowlist (so an account could be admin on one route and
   403 on another). It now uses `is_admin_user()` from `routes/admin.py`.

**Rollout for the webinar on 29.10.:** merge → deploy Emergent → each support
person signs up on leaderos.de → you grant them from the panel → they test
the CSV dry run with a five-line file.

---

## 7. The tasks that are now yours

### 7.1 This week

| # | Task | Where | Why first |
| --- | --- | --- | --- |
| 1 | **Reconcile Emergent with `mvpcode`**: export the live code, diff, port the Emergent-only changes into GitHub as a PR, then deploy `mvpcode`. Record the result in `EMERGENT_ADMIN_ONBOARDING.md` → "Reconciliation log". | §2 there | Every other deploy is unsafe until this is done. The webinar date, reminder windows and the admin panel fix all sit on `mvpcode` and are **not live** on Emergent. |
| 2 | Deploy and run the smoke checks (`/api/health`, `/api/monitoring/system`, `/api/webinar/stats`, one test signup on leader-os.de/webinar → confirmation email in Resend). | `EMERGENT_ADMIN_ONBOARDING.md` §4 | Proves the webinar backend before ads run. |
| 3 | Create the new **Sentry** and **PostHog** accounts (§3, §4), put the keys in Vercel and Emergent, redeploy. | this file | Observability must exist before 29.10. |
| 4 | Check `ELEVENLABS_API_KEY` on Emergent. | Emergent env | Four testers reported "voice does not work". If the key is missing or invalid, that is the whole bug. |

### 7.2 Before the webinar (29.10.)

- Webinar reminder scheduler: the primary should be an Emergent-side
  scheduler or external cron; `webinar-cron.yml` in GitHub is the backup
  (§6 of the Emergent doc).
- Resend: domain verified (DKIM/SPF), sender `reminders@leader-os.de`,
  check bounce rate.
- Stripe payouts on Argumentorik (§5), webhook secret set, 1 € smoke test.
- Support team in the admin panel (§6) and one dry-run CSV import.
- Feedback backlog P0, in this order (full analysis with code references in
  [`FEEDBACK_BACKLOG.md`](../app/FEEDBACK_BACKLOG.md)):
  1. Quiz: correct answer is B in 229 of 232 questions and also the longest
     option. Randomise positions server-side and equalise distractor length.
  2. Voice/TTS (see 7.1 #4) and the audio-mode answer that disappears after
     two seconds.
  3. Daily check-in that never starts the analysis.
  4. `402 no_credits` is rendered as "broken" on most pages: eight endpoints
     return it, three places handle it. One global paywall handler.
  5. Duplicate event rows: unique index on `event_id`, upsert instead of
     insert (`routes/events.py`).

### 7.3 Making the app simpler (your second point)

You are right that too much is going on. Do it with data, not taste:

1. Four weeks after the PostHog reset, pull unique users per app route for
   30 days.
2. Candidates from the feedback: three entry points into the same thing
   (WladBot chat, Coaching, Simulation), Challengers, Workflows/Tools,
   Wlad-Universe, Community/Progress, Events, Referral.
3. Rule: a feature used by fewer than 5 % of weekly active users gets hidden
   behind a sidebar toggle first (Danny's suggestion) and removed a month
   later if nobody asks for it.
4. Protect the core loop, it is what we sell: **course lesson → drill on the
   user's real case → ask WladBot before the conversation → simulation with
   pushback → evaluation**. Everything else is optional.
5. Shorter WladBot answers: two testers called them an overload. Response
   length and reading level are prompt settings in `services.py`
   (`WLAD_HARD_RULES`), not a redesign.

### 7.4 Making it reliable (your first point)

- Sentry P0 alerts live (§4) and a synthetic check on `/api/health` every
  five minutes (any uptime service; GitHub Actions `cron.yml` can do it).
- uvicorn workers: default is one. For a webinar-day spike set 2–4 on the
  pod (`INCIDENT_RUNBOOK.md`, "slow under load"), and watch pod CPU in
  Emergent.
- LLM timeouts and credit checks: every LLM route must fail with a message,
  never hang (see the `has_credit()` pattern in `routes/credits.py`).
- Rate limits are in `backend/middleware/__init__.py` (20 req/min on auth and
  chat per IP, 120 on `/api/*`). Shared office IPs during a live demo can
  hit these; raise temporarily on demo days, not permanently.
- Weekly Mongo export of the money and lead collections until a backup job
  exists.

---

## 8. How to develop it further

**The loop.** Branch from `mvpcode` → PR → CI (`ci`, `gitleaks`,
`lockfile-guard`, `constants-drift`, `codeql`) → merge → Vercel deploys the
marketing site → **you deploy Emergent** → smoke checks. Rules in
[`BRANCHING.md`](./BRANCHING.md).

**Where things are.** `backend/routes/*.py` one router per feature;
`backend/services*.py` shared logic and all email templates;
`backend/lib/` provider shims; `frontend/src/pages` and
`frontend/src/components` per surface; `frontend/src/features/content` the
journal; `docs/app/APP_ARCHITECTURE.md` and `docs/app/SYSTEM_OVERVIEW.md` for
the map; `docs/app/SCHEMA.md` for Supabase.

**Rules that protect the product** (from `CLAUDE.md`, the file every
contributor reads):

- `email_lower` is the identity key everywhere (Mongo, Supabase, PostHog,
  Sentry). Never create or link a user without it.
- Every claim about Wlad comes from `docs/gtm/WLAD_CANON.md`. WladBot's
  hard rules live in `services.py`; changing them is a product decision.
- No fake scarcity, no invented numbers, no faked reviews. The webinar
  counter hides itself below 25 registrations on purpose.
- Supabase schema changes only through migrations; views
  `security_invoker = true`; trigger functions granted to `service_role`
  only.
- No new frontend dependency without updating `yarn.lock` (Vercel builds
  with `--frozen-lockfile`).

**Testing.** `backend/tests/` has real suites, but CI only runs
`compileall`. Turning the pure-function tests on in CI (they need no DB:
`test_free_video_funnel.py`, `test_lead_import.py`) is a one-line win.
Integration suites need a running backend and `TEST_*` credentials.

**Definition of done for a feature:** PR merged, deployed to Emergent,
smoke checks green, Sentry quiet for a day, and a PostHog event that shows
whether anyone uses it.

---

## 9. Access checklist

| Tool | You | Action |
| --- | --- | --- |
| Emergent `command-center-229` (incl. MongoDB) | ✅ admin since 24.09. | — |
| GitHub `aiporator/shipos` | ✅ write (`sbcodes`) | ask for **maintain** so you can merge |
| Vercel team `aiporators-projects`, project `leaderos` | ✅ member | — |
| Supabase `srujvjjncrszhaaxepxf` | invite sent (Developer) | accept, enable 2FA |
| Sentry | **you create the new org** (§4) | owner |
| PostHog EU | **you create the new org** (§3) | owner |
| Stripe | invite as Developer pending | see §5 |
| Resend | invite pending | needed for email logs |
| ElevenLabs, Voyage | keys live in Emergent env | ask for member access when you rotate keys |

Full matrix and the billing hand-over: [`TOOL_ACCESS.md`](./TOOL_ACCESS.md).

## 10. People

- Wlad Jachtchenko `wj@argumentorik.com` — product and content owner; every
  WladBot wording change gets his OK.
- Eduard `ek@argumentorik.com` — Google Workspace / mailboxes.
- Mert `start@aiporate.com` → `mert@argumentorik.com` — previous owner of
  all tools; available for questions during the hand-over.
- Support team — gets admin access through §6, not through shared logins.

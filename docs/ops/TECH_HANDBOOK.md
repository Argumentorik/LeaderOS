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

## 7. Mindset for solving things

1. **Reproduce before you fix.** A bug you cannot trigger yourself is a
   rumour. Get the account, the time, the request. Logs and a Sentry event
   beat a screenshot.
2. **Env var before code.** Most "broken" reports are a missing, stale or
   wrong variable on Emergent or Vercel. Check the env table first; it
   takes two minutes and saves a day.
3. **Read, don't guess.** `supervisorctl tail`, Supabase Postgres logs,
   Resend logs, Stripe event log. The answer is usually written down
   already.
4. **Smallest safe change, then verify.** One PR per cause, smoke checks
   after deploy, Sentry quiet for a day. A fix nobody verified is a second
   bug.
5. **Time-box and escalate.** The incident runbook gives each path a time
   budget. Exceeded twice: stop, write what you tried, call the other
   developer. Heroics at 2 a.m. create the next incident.
6. **Never hot-fix on Emergent without a PR.** If it is not in GitHub it
   will be deleted by the next deploy and nobody will know why the bug came
   back.
7. **Decide with data when you can, with the user when you must.** Usage
   numbers for feature cuts, Sentry counts for priorities. Wording and
   promises to users: Wlad decides.
8. **Do not ship a workaround that lies.** A spinner that hides a 402, a
   counter that invents registrations, a "coming soon" that never comes.
   Say what is true in the UI.
9. **Leave the campsite cleaner.** When you touch a file, fix the comment,
   delete the dead branch, update the doc the next person will read.
10. **Ask early.** History: Mert. Product: Wlad. Access and mailboxes:
    Eduard. Thirty minutes of asking beats three days of archaeology.

## 8. Weekly routine — Monday, 45 minutes

Done in this order, results noted in a short message to Wlad (three lines:
green, yellow, red).

| # | Where | Check | Red means |
| --- | --- | --- | --- |
| 1 | Sentry | New issues since last week, P0 alerts fired, unresolved issues > 7 days | A P0 without a ticket |
| 2 | Emergent | Pod CPU/memory trend, credits balance, last deploy = last merge on `mvpcode`? | Credits under one month of use; drift |
| 3 | **Supabase** | Settings → Usage: Disk IO budget, DB size, egress · Database → Query Performance top 10 · Integrations → Cron: failed runs · Auth → logs for spikes · Reports → API errors · Advisors (security + performance) — any new ERROR | Disk IO draining daily, cron failures, a new advisor ERROR |
| 4 | Supabase backups | Database → Backups: last daily backup exists; once a month restore-test to a branch | No backup in 48 h |
| 5 | MongoDB | Weekly export of `users`, `payment_transactions`, `webinar_leads` to the Argumentorik Drive | Export missing |
| 6 | Resend | Bounce + complaint rate (< 2 % / < 0.1 %), domain still verified, daily volume vs plan | Bounces rising; domain unverified |
| 7 | Stripe | Failed webhooks (Developers → Webhooks), disputes, payouts arriving on the GmbH account | Any failed webhook |
| 8 | PostHog | Activation funnel, weekly active users, top 10 routes, any route with 0 users for two weeks | WAU falling two weeks in a row |
| 9 | GitHub | Open PRs older than 5 days, Dependabot security alerts, failed `cron-jobs` / `webinar-cron` runs (auto-opened issues) | A failed cron run nobody saw |
| 10 | Billing | Spend vs cap per tool (§10), card expiry dates, invoices on the GmbH | Any tool above 70 % of its cap |

Monthly, first Monday: review the access matrix (`TOOL_ACCESS.md`): remove
leavers, confirm two admins + 2FA per tool; AEO check (ask ChatGPT,
Perplexity, Claude "Welche Kurse hat LeaderOS?", "Was ist das
SEXIER-Modell?"); cost review per tool against the budget line.

## 9. What to keep in mind

- **The webinar on 29.10. is the next deadline.** Nothing risky on Emergent
  in the 48 hours before it; freeze on 27.10. evening.
- **Two hosts, two deploys.** Vercel is automatic, Emergent is you.
- **`email_lower`** everywhere, always.
- **Canon before corpus.** `WLAD_CANON.md` wins; wrong chunks get fixed.
- **Consent gates analytics.** If PostHog or Sentry "show nothing", the
  visitor may simply not have accepted; test with consent granted.
- **Crons need the same secret in three places** (GitHub, cron-job.org,
  Emergent).
- **Rate limits are per IP.** A demo from one office network can hit them;
  raise temporarily, never remove.
- **Every number on a page comes from the canon or from the database.**
- **Billing emails go to a shared mailbox, not a person's inbox** (§10).

## 10. Billing guardrails — a card limit is never reached

The rule: **every paid tool has a cap below the card limit, an alert well
before the cap, and a billing mailbox two people read.** Caps are set by the
cardholder (Wlad or Eduard) with Stefan on the call; Stefan verifies the
alerts arrive.

| Tool | Where the cap lives | Set it to | Alert |
| --- | --- | --- | --- |
| **Supabase** (org `skawjzvddehhmkwiltui`) | Org → Billing → **Spend cap** (Pro plan) | Spend cap **on**; compute add-on chosen deliberately, not by auto-scale | Usage emails (like the Disk IO mail) to the billing mailbox |
| **Emergent** | Account → Billing / Credits | Auto-recharge **off** or capped at one month's use; manual top-up on the Monday routine | Low-credit email |
| **Vercel** (team `aiporators-projects`) | Team → Settings → Billing → **Spend Management** | Monthly amount + **pause projects** when reached (marketing site only, backend is unaffected) | Email at 50 / 75 / 100 % |
| **OpenAI / Anthropic** (if native keys are used) | Platform → Limits / Usage limits | Monthly budget with hard limit; per-key limits for test keys | Email at 75 % |
| **ElevenLabs** | Subscription → usage | Plan quota only, **no auto-upgrade / no overage** | Quota email |
| **Voyage** (if kept) | Dashboard → billing | Monthly budget | Email |
| **Resend** | Settings → Billing | Fixed plan; volume reviewed weekly (§8) | Plan-limit email |
| **Google Ads · Meta · LinkedIn** | Campaign daily budgets + **account spending limit** (Google) / spending limit (Meta, LinkedIn) | Account limit = monthly ad budget; daily budgets sum below it | Platform alerts to the billing mailbox |
| **Domains** (4) | Registrar → auto-renew | Auto-renew **on**, card valid for 12+ months | Renewal reminders |
| **Stripe** | Not a cost; **payouts** | Payout schedule daily/weekly to the GmbH account | Failed payout email |

And the card itself:

1. One company card for SaaS, limit above the **sum of all caps** plus
   20 %; a second card on file at Supabase, Vercel and Emergent as backup.
2. Billing contact on every tool = a shared mailbox (e.g.
   `rechnung@argumentorik.com`), forwarded to Stefan and Wlad. Never a
   personal inbox: a person on holiday is how a limit gets reached.
3. Card expiry dates in the shared calendar, 30 days before.
4. The Monday routine (§8 row 10) compares spend to cap; anything above
   70 % gets a decision the same day: raise the cap on purpose, or reduce
   usage.
5. Nothing that costs money auto-scales without a cap. If a vendor offers
   "unlimited overage", the answer is no.

## 11. Documents worth knowing

- `CLAUDE.md` — the repo briefing and working rules.
- `docs/app/SYSTEM_OVERVIEW.md`, `docs/app/APP_ARCHITECTURE.md` — the map.
- `docs/app/SCHEMA.md` — Supabase schema and triggers.
- `docs/app/FEEDBACK_BACKLOG.md` — tester feedback, triaged with code refs.
- `docs/ops/APP_TAKEOVER_STEFAN.md` — the hand-over itself.
- `docs/gtm/WLAD_CANON.md` — the only source for claims about Wlad.

## 12. Check yourself — eight short questions

1. Where is the source of truth for the code, and what does that mean for
   a fix made directly on Emergent? (§1, §7.6)
2. Name the five steps of the core training loop. (§2.2)
3. A visitor says "PostHog shows nothing for me". First thing to check? (§9)
4. Which Supabase screens are in the Monday routine, and what is red? (§8)
5. What are the three parts of every billing guardrail? (§10)
6. A `402 no_credits` shows as an endless spinner. Is that a limit or a bug?
   (§5)
7. Who decides a WladBot wording change? Who decides a feature cut, and on
   what basis? (§5, §2.2)
8. The incident runbook time budget is exceeded twice. What do you do?
   (§7.5)

**Answer key.** 1 GitHub `mvpcode`; a hot-fix not in GitHub is deleted by
the next deploy. 2 Lesson → drill on the real case → WladBot before the
conversation → simulation with pushback → evaluation. 3 Consent: analytics
only runs after the banner was accepted. 4 Usage (Disk IO, size, egress),
Query Performance, Cron failures, Auth logs, API errors, Advisors, Backups;
red = Disk IO draining daily, cron failures, new advisor ERROR, no backup
in 48 h. 5 A cap below the card limit, an alert before the cap, a shared
billing mailbox. 6 A bug: limits must fail with a clear message. 7 Wlad;
the developer with Wlad, based on PostHog usage (under 5 % of WAU → hide,
then remove). 8 Stop, write down what was tried, call the other developer.

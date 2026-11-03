# LeaderOS app takeover — Stefan (v2, 05.10.2026)

> For **Stefan (`stefan@argumentorik.com`, GitHub `sbcodes`)**. One file,
> read top to bottom. It says what changed, what we do **together first**,
> how Emergent works, and how **you** set up PostHog and Sentry from scratch.
> Stripe you already have. A walkthrough video from Mert follows; this file
> is the written version. The repo copy is the one that gets updated:
> `docs/ops/APP_TAKEOVER_STEFAN.md`. How we treat the tech in general:
> [`TECH_HANDBOOK.md`](./TECH_HANDBOOK.md).
>
> Scope: the **app on leaderos.de** (Emergent). The marketing site
> leader-os.de (Vercel) only matters where it calls your backend.

---

## 1. What changed in the last two weeks (Mert's side)

Everything below is on branch `claude/leader-os-video-funnel-3am9ju`
(92 files), waiting for a PR to `mvpcode` and then **your** Emergent deploy.
Nothing of it is live on leaderos.de yet.

| Area | Change | Why |
| --- | --- | --- |
| **Admin access** | Any admin can grant/revoke the `is_admin` flag from the admin panel; env allowlist `ADMIN_EMAILS`; one admin check for all routes | Support team gets in with their own login, no redeploy, no shared founder account (§8) |
| **Webinar CSV import** | Admin panel uploads attendee lists into `webinar_leads` (dry run first, no emails sent) | The team prepares the list, we don't hand-edit Mongo |
| **RAG without Voyage** | `services_rag.py`: Supabase alone enables retrieval; without `VOYAGE_API_KEY` it runs lexical-only instead of switching off | Voyage was a hard dependency by accident (§9) |
| **Webinar page** | Prerendered HTML with Event + FAQ schema; date/agenda/FAQ in one data module `src/data/webinarEvent.js` | Crawlers and the SPA show the same thing |
| **Ads tracking** | Google Ads, Microsoft UET, Meta Pixel + CAPI, LinkedIn Insight, all consent-gated, activated by Vercel env vars only | Ads start without a code change |
| **Courses section + `/kurse`** | Course library on landing pages, CTA under journal articles, static `/kurse` answer page with Course schema | Courses are the main selling point and were invisible to search |
| **Journal** | 20 new guides (173 total), FAQ blocks with FAQPage schema, SEO/AEO audit | Organic reach |
| **Removed** | `/frameworks` page (redirects to `/kommunikation`), fake appointment slots, webinar counter below 25 registrations | Honesty rules |
| **Mobile** | Tap targets, cookie banner, booking strip "from 2 November" | Lead conversion on phones |

Full list: `git log origin/mvpcode..claude/leader-os-video-funnel-3am9ju`.

---

## 2. First tasks — we do these together (one call, in this order)

Mert drives, you have the keyboard. After this list you own the app.

| # | Task | Who | Done when |
| --- | --- | --- | --- |
| 1 | **Reconcile Emergent with GitHub.** Export the live Emergent code, diff against `mvpcode`, port Emergent-only changes into a PR. | both | Reconciliation log entry in `EMERGENT_ADMIN_ONBOARDING.md` |
| 2 | **Merge the branch, deploy Emergent, run smoke checks** (§3.4). | you | `/api/health` ok, `/api/webinar/stats` ok, one test signup delivers a confirmation email |
| 3 | **Supabase Disk IO alert (03.10.)** — see §7. Check usage graph, find the hot query/job, decide compute upgrade. | both | Alert gone for 7 days |
| 4 | **Env audit on Emergent**: `ELEVENLABS_API_KEY`, `RESEND_API_KEY` + `SENDER_EMAIL` (verified domain), `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET`, `CRON_SHARED_SECRET` = GitHub secret, `VOYAGE_API_KEY` (§9). | you | Each one confirmed in the UI, not assumed |
| 5 | **Sentry — new org by you** (§5). DSNs into Emergent + Vercel, test event visible. | you | Test event arrives |
| 6 | **PostHog — new org by you** (§4). Key into `index.html` + Emergent, identify fires after login. | you | `identify` call in the network tab |
| 7 | **Billing**: Resend card + billing email on Argumentorik; Supabase org card; Emergent credits. Cards are entered by the cardholder in the dashboard, never sent around. | Stefan / Wlad / Eduard | Invoices run on the GmbH |
| 8 | **Admin panel rollout** for the support team (§8). | you | One support login opens the panel, one dry-run CSV passes |
| 9 | **Feedback P0** (§10.2): quiz answer bias, voice/TTS, check-in, 402 handling, duplicate events. | you | Each closed with a PR |
| 10 | **Reliability** (§10.4): Sentry P0 rules, health check every 5 min, workers for webinar day. | you | Rules exist, first alert received |

---

## 3. Emergent — how it works

**What it is.** Emergent is an AI-agent development platform that hosts the
app it built: the FastAPI backend, MongoDB and an object store run inside
one managed pod (project `command-center-229`). The agent iterated the app
through ~180 "iterations"; the repo `Argumentorik/LeaderOS` is the exported
state plus everything built since. That is why GitHub and Emergent have
drifted: the agent sometimes committed to `mvpcode`, sometimes only to its
own copy (§2 of `EMERGENT_ADMIN_ONBOARDING.md` lists the evidence).

**Why we use it.** It got a prototype into production in days, with LLM
calls wrapped behind Emergent's own key (`EMERGENT_LLM_KEY`). The price is
lock-in and drift; both are being reduced (3.5).

### 3.1 Deploying

- Deploys are **manual** in the Emergent UI from branch `mvpcode`. Vercel
  deploys the marketing site automatically; Emergent never does.
- A merged PR is therefore **not live** on leaderos.de until you deploy.
- Before every deploy until the reconciliation is done: diff live code
  against `mvpcode` (task 2.1), or a deploy can delete Emergent-only fixes.
- Rollback = redeploy the previous version in Emergent.

### 3.2 Env vars

Emergent → project → environment. **No hot reload; every change needs a
redeploy.** Table of all 60+ variables and what breaks without each:
`EMERGENT_ADMIN_ONBOARDING.md` §3. Half of all bug reports are a missing
or stale env var.

### 3.3 Logs and the database

- Pod shell: `sudo supervisorctl status backend` ·
  `sudo supervisorctl tail -100 backend`. Startup failures only show here.
- MongoDB lives in the pod. Indexes are built at startup by `server.py`,
  no migrations. Collections that matter: `users`, `user_sessions`,
  `login_attempts`, `webinar_leads`, `payment_transactions`, `credits`,
  `chat_messages`, `system_events`. Export the money and lead collections
  weekly until a backup job exists.

### 3.4 Smoke checks after every deploy

```
GET https://leaderos.de/api/health              → {"status":"ok"}
GET https://leaderos.de/api/monitoring/system   → overall: "go"
GET https://leaderos.de/api/webinar/stats       → registered count
GET https://leaderos.de/api/payments/stripe-mode → live: true
POST /api/cron/lead-nurture without X-Cron-Secret → 401/403
```
Then one real signup on leader-os.de/webinar with a test address: the
confirmation must appear in Resend → Logs and in Mongo `webinar_leads`.

### 3.5 Leaving Emergent step by step (already prepared)

Two shims switch provider by env var alone: `backend/lib/llm_provider.py`
(`ANTHROPIC_API_KEY` or `OPENAI_API_KEY` → native SDK, else Emergent key)
and `backend/lib/object_storage.py` (Supabase Storage when
`SUPABASE_URL` + `SUPABASE_SERVICE_KEY` are set). Order: reconcile → flip
LLM key → flip storage → run the pytest suites in CI → move hosting.

### 3.6 Scheduled jobs

GitHub Actions (`cron.yml`, `webinar-cron.yml`) call your backend with
`X-Cron-Secret`; the primary webinar scheduler is cron-job.org every
15 min. The secret must be identical in GitHub, cron-job.org and Emergent.
Supabase pg_cron runs ~15 jobs whose code is **not in the repo** (drift).
Details: `CRON_SCHEDULE.md`, `EMERGENT_ADMIN_ONBOARDING.md` §6.

---

## 4. PostHog — new setup, by you

**Why.** It answers your own question: which features do people use? Without
it the "cut something" decision is opinion. Plus session replays for bug
reports and real-user Core Web Vitals. The old project under
`start@aiporate.com` is being retired; **you create the new one and own it.**

**Set up (30 minutes).**

1. `eu.posthog.com` → new organisation "Argumentorik" (**EU** region, same
   as Supabase `eu-north-1`) → project "LeaderOS".
2. Project settings → copy the project API key (`phc_…`).
3. Frontend: in `frontend/public/index.html` search `posthog.init(` and
   replace the old key. PR to `mvpcode`. Vercel redeploys the marketing
   site; you deploy Emergent so the app gets it too.
4. Emergent env: `POSTHOG_KEY=<new key>`, `POSTHOG_HOST=https://eu.i.posthog.com`, redeploy.
5. Verify in DevTools → Network, filter `posthog`: requests to
   `eu.i.posthog.com/e/`; after login an `identify` call with the
   lowercased email.
6. Invite `wj@argumentorik.com`, `mert@argumentorik.com`; 2FA on.

**How the code is wired.** Inline snippet in `index.html`, only initialised
after the visitor accepted analytics in the consent banner
(`lo_consent_v1.analytics`); `frontend/src/index.js` re-tries on consent
change. Identity = `identifyByEmail(email_lower)` on login/rehydrate,
`resetIdentity()` on logout (`frontend/src/lib/analytics.js`). The key is
**`email_lower`**, the same as in Mongo, Supabase and Sentry. Events that
already fire: `web_vital`, funnel events with `surface`/`funnel`.

**First dashboards** (feed §10.3): unique users per app route (30 days);
activation funnel signup → first WladBot message → first drill → day-7
return; replays filtered on console errors.

---

## 5. Sentry — new setup, by you

**Why.** The server issues in the test were invisible until users
complained. Sentry turns a 5xx spike, a failing Stripe webhook or a broken
login into an alert within a minute, with the stack trace. The old org
`aiporate` is being retired; **you create the new one and own it.**

**Set up (45 minutes).**

1. `sentry.io` → new organisation "argumentorik", **data region EU**.
2. Projects: `leaderos-backend` (Python/FastAPI), `leader-os` (React),
   `leader-check` (React).
3. DSNs → Emergent env `SENTRY_DSN`, `SENTRY_ENV=production`
   (`SENTRY_TRACES_SAMPLE_RATE` and `SENTRY_PROFILES_SAMPLE_RATE` stay at
   0.10) and Vercel env `REACT_APP_SENTRY_DSN_LEADER_OS`,
   `REACT_APP_SENTRY_DSN_LEADER_CHECK` (scope Production). Redeploy both.
4. Alert rules from [`SENTRY_ALERTS.md`](./SENTRY_ALERTS.md) with **you** as
   recipient: P0 = 5xx spike (>5/min), Stripe webhook error, auth endpoint
   5xx; P1 = first-seen issue, p95 latency >3 s, RAG errors.
5. Verify: `POST /api/monitoring/test` as admin → event in
   `leaderos-backend` within a minute.
6. Invite `wj@argumentorik.com`, `mert@argumentorik.com`.

**How the code is wired.** Backend SDK in `backend/server.py` with a
`before_send` filter that drops 401/403/404/422/429, client disconnects
and health checks. Frontend `@sentry/react` in `frontend/src/index.js`,
dormant without a DSN, project chosen by hostname. User context uses
`email_lower`.

---

## 6. Stripe — you are already on it

What remains, none of it code:

- **Payouts, business details, VAT ID** on the Argumentorik Akademie GmbH
  (Stripe → Settings → Business). Money, not cost: do this first.
- Live key on Emergent (`STRIPE_API_KEY=sk_live_…`), webhook endpoint
  `https://leaderos.de/api/webhook/stripe` with the four events
  (`checkout.session.completed`, `…async_payment_succeeded`,
  `…async_payment_failed`, `payment_intent.payment_failed`) and
  `STRIPE_WEBHOOK_SECRET` set. `GET /api/payments/stripe-mode` confirms
  live mode. The 1 € smoke test is in [`DEPLOY.md`](./DEPLOY.md).
- Incident paths (400 on every webhook = wrong secret; paid but no tier =
  webhook not delivered): [`INCIDENT_RUNBOOK.md`](./INCIDENT_RUNBOOK.md).

---

## 7. Supabase — the Disk IO alert and billing

**The mail from 03.10.** ("Your project is running out of Disk IO Budget",
project `srujvjjncrszhaaxepxf`) is **not a money alert**. Supabase gives
small compute instances a burst budget for disk reads/writes; we are using
it up, so queries slow down and the instance can become unresponsive. The
16.09. incident (34–38 s queries, pg_cron job startup timeouts) is the same
symptom.

**Fix path, in order.**

1. Dashboard → Settings → Billing → Usage → *Disk IO*: see when the budget
   drains (steady vs. spikes at cron times).
2. Database → Query Performance: the top queries by total time. Likely
   suspects: the ~15 pg_cron jobs (`email_dispatcher`,
   `advance_email_journeys`, `drain_emergent_sync`, `slo_breach_check`,
   `emergent_circuit_check`, health probes) and the
   `wladbot-chat-emergent` component that calls a deprecated endpoint ~437×
   per day. Disable jobs that no longer have a consumer (`email_sends` has
   been idle since 03.08.; the backend sends through Resend directly).
3. Missing indexes: `pg_stat_statements` top 20 by `mean_exec_time`; add
   via migration (`apply_migration`), then `get_advisors`.
4. If the load is legitimate: upgrade the compute add-on one size
   (Settings → Compute and Disk). This costs money → needs the org billing
   card on Argumentorik first.

**Access.** Your Developer invite to org `skawjzvddehhmkwiltui` is sent;
accept it and turn on 2FA. Billing is Owner-only; Wlad or Eduard enters
the card.

---

## 8. Admin panel for the support team (fixed in code, needs your deploy)

Admin access is per account: an allowlist in `backend/routes/admin.py`
plus an `is_admin` flag on the user document. Everyone else who opens
`leaderos.de/wlad-control-x7k9q2` lands on the dashboard.

After the deploy:

1. Admin panel → card **Admin access & webinar import** → email → *Grant*.
   The person must already have signed up on leaderos.de. From the next
   request their own login opens the panel. Revoke is one click; nobody can
   revoke themselves; allowlisted emails cannot be removed there.
   API: `GET/POST /api/admin/admins`. Every grant lands in `system_events`.
2. Or env: `ADMIN_EMAILS=a@argumentorik.com,b@argumentorik.com` on Emergent
   (merged with the code allowlist; needs a redeploy).
3. CSV import: same card → file → *Check (dry run)* → *Import*. Columns
   `email` (required), `name`, `company`; comma/semicolon/tab; German or
   English headers; Zoom exports work. Upserts into `webinar_leads` with
   source `csv-import`. **No email is sent by the import.**
   API: `POST /api/admin/webinar-leads/import?dry_run=true`.
4. `routes/monitoring.py` used to have its own, smaller allowlist (admin
   on one route, 403 on the next). It now uses `is_admin_user()` from
   `routes/admin.py`.

---

## 9. RAG and Voyage — the facts

**Our RAG is ours.** The corpus is 2 212 chunks of Wlad's books, podcasts
and trainings in Supabase (`wladbot_documents`, pgvector + German
full-text index). Retrieval is hybrid (`backend/services_rag.py`): a
semantic retriever (vector similarity) and a lexical retriever (Postgres
full-text, catches exact names like SEXIER, ALPEN) fused by Reciprocal
Rank Fusion. The lexical path needs **no external API**.

**Where Voyage sits.** Only the semantic path uses Voyage AI's embedding
API (`voyage-3`, 1 024 dims) to embed the user's question; the corpus
vectors were produced with the same model. Voyage is not "the RAG", it is
one of two retrievers.

**What was wrong.** `_is_configured()` required a Voyage key, so a missing
key switched retrieval off entirely, lexical included. Fixed on this
branch: Supabase alone enables RAG; without `VOYAGE_API_KEY` it runs
lexical-only and `rag_status()` reports `embedding_provider: "none"`.

**Your decision (task 2.4).** Check whether `VOYAGE_API_KEY` is set on
Emergent and whether the account still exists.

- Keep Voyage: cheapest path, nothing to migrate; put the key on a paid
  tier (free tier is 3 requests/min, which caused 429s).
- Drop Voyage entirely: re-embed the corpus with another model
  (`supabase/functions/backfill-embeddings` exists for that), change
  `EMBEDDING_DIM` and the `match_wladbot_documents` RPC to the new size,
  swap `_embed_query`. About two days, needs a Supabase migration.
- Until decided: lexical-only works, quality is slightly lower on
  paraphrased questions.

---

## 9a. Cal.com — the booking link today, the sales automation next

**Why it matters.** Every "Beratungsgespräch" and "Demo" CTA opens
Cal.com, on the marketing site **and inside the app on leaderos.de**:
onboarding (`OnboardingPage.js`), the coaching panel
(`coaching/CoachingRightPanel.js`), the paywall and tier-lock dialogs
(`shared/PaywallModal.js`, `shared/TierLockOverlay.js`,
`shared/PricingModal.js`), Wlad-Universe (`WladUniversePage.js`) and the
pricing ladder. The same account serves both hosts. From 2 November the
consultation slots open (`AppointmentBookingSection.js`, `BOOKING_START`).
A booking is the first sales touch; today it only lands in Cal.com's own
list and in a calendar. Later it becomes the start of the sales
automation, so the account must be ours and connected to the backend.

**How it is wired today (frontend only, no backend code).**

- Account `cal.com/leaderos`, event types **`/beratung`** (15-minute
  strategy call) and **`/demo`**. All CTAs resolve through
  `frontend/src/lib/calendly.js` (the name is historical; Calendly was
  dropped) and `components/brand/BookConsultationButton.js`.
- The embed script is loaded in `frontend/public/index.html`
  (`Cal("init","beratung")`, dark theme, brand colour). Inside the app the
  modal opens with name/email prefilled from `AuthContext`; outside the
  app a new tab opens `https://cal.com/leaderos/beratung?utm_source=…`.
- Deep links with date are supported: `?date=YYYY-MM-DD&month=YYYY-MM`
  (the booking section on the landing uses that).
- CSP in `backend/middleware/__init__.py` and `vercel.json` already allow
  `app.cal.com`.

**Account (task for you, asked on 01.10.).** Create the Cal.com
account/team under `stefan@argumentorik.com` or a shared Argumentorik
login, invite `mert@argumentorik.com` and `wj@argumentorik.com`, and make
sure the two event types keep the exact slugs `leaderos/beratung` and
`leaderos/demo`; every CTA in the code points at them. Connect Wlad's (or
the sales team's) calendar and a Zoom/Meet location. Billing card on the
GmbH, cap per Handbook §10.

**Sales automation (next step, not yet in code).** Build in this order,
each step small:

1. **Cal.com webhook → backend.** In Cal.com: Settings → Developer →
   Webhooks → subscriber URL `https://leaderos.de/api/cal/webhook`, events
   `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`,
   `MEETING_ENDED`; set a secret and store it as `CAL_WEBHOOK_SECRET` on
   Emergent. Backend: new router `backend/routes/cal.py` that verifies the
   HMAC signature, upserts the booking into Mongo `bookings`
   (`email_lower`, event type, start, status, UTM from the booking
   metadata) and links it to `users` / `webinar_leads` by `email_lower`.
2. **CRM hand-off.** Push the booking to the CRM as a deal stage
   ("Beratung gebucht" → "Beratung stattgefunden" → "Angebot" → "Gewonnen").
   The pipeline design is a product decision with Wlad; the code is one
   outbound call per webhook event.
3. **Emails via Resend, not Cal.com's.** Confirmation with the Leader-Check
   link (so the call starts with a diagnosis), reminder 24 h, no-show
   follow-up 2 h after `MEETING_ENDED` without attendance, post-call
   offer with the 14-day trial or OS-year link. Templates in
   `services_email.py`, sends logged in `email_log` like the webinar flow.
4. **Admin visibility.** Bookings card in the admin panel next to the
   webinar leads: count per week, source, show/no-show rate.
5. **Analytics.** PostHog event `booking_created` with `email_lower` so
   the funnel webinar → booking → purchase is one chart.

Rules while building: `email_lower` is the join key everywhere; no
booking data in the frontend bundle; the webhook endpoint must fail
closed on a bad signature; nothing sends an email twice (idempotent on
Cal.com's booking `uid`).

## 10. Your tasks after the hand-over

### 10.1 Before the webinar (29.10.)

Reminder scheduler verified (cron-job.org primary, GitHub backup); Resend
domain verified and bounce rate checked; Stripe payouts moved; support team
in the admin panel with one dry-run import; the P0 list below.

### 10.2 Feedback P0 (details with code references in [`FEEDBACK_BACKLOG.md`](../app/FEEDBACK_BACKLOG.md))

1. Quiz: correct answer is B in 229 of 232 questions and also the longest
   option. Randomise server-side and equalise distractor length.
2. Voice/TTS: check `ELEVENLABS_API_KEY` first; then keep the audio-mode
   answer on screen instead of dismissing after two seconds.
3. Daily check-in that never starts the analysis.
4. `402 no_credits` rendered as "broken": eight endpoints return it, three
   places handle it. One global paywall handler.
5. Duplicate event rows: unique index on `event_id`, upsert
   (`routes/events.py`).

### 10.3 Making it simpler (your second point)

1. Four weeks after the PostHog reset: unique users per app route, 30 days.
2. Candidates from the feedback: three entry points into the same thing
   (WladBot chat, Coaching, Simulation), Challengers, Workflows/Tools,
   Wlad-Universe, Community/Progress, Events, Referral.
3. Rule: under 5 % of weekly active users → hide behind a sidebar toggle
   first, remove a month later if nobody asks.
4. Protect the core loop, it is what we sell: course lesson → drill on the
   user's real case → ask WladBot before the conversation → simulation with
   pushback → evaluation.
5. Shorter WladBot answers: length and reading level are prompt settings
   in `services.py` (`WLAD_HARD_RULES`), not a redesign. Wording changes
   get Wlad's OK.

### 10.4 Making it reliable (your first point)

Sentry P0 rules live; synthetic `/api/health` check every five minutes;
uvicorn workers 2–4 on webinar day (default is one); every LLM route fails
with a message, never hangs (`has_credit()` pattern in `routes/credits.py`);
rate limits in `backend/middleware/__init__.py` raised temporarily on demo
days; weekly Mongo export.

---

## 11. Access checklist

| Tool | Status | Action |
| --- | --- | --- |
| Emergent `command-center-229` (incl. MongoDB) | ✅ admin since 24.09. | — |
| GitHub `Argumentorik/LeaderOS` | ✅ write | ask for **maintain** to merge |
| Vercel project `leaderos` | ✅ member | — |
| Stripe | ✅ you are on it | payouts to Argumentorik (§6) |
| Supabase org `skawjzvddehhmkwiltui` | invite sent (Developer) | accept, 2FA; Disk IO fix (§7) |
| Sentry | **new org by you** | §5 |
| PostHog EU | **new org by you** | §4 |
| Resend | member invite + **card/billing email** | §2 task 7 |
| ElevenLabs, Voyage | keys in Emergent env | decide Voyage (§9) |
| Cal.com `cal.com/leaderos` | **account by you**, invite Mert + Wlad | keep slugs `/beratung`, `/demo`; webhook later (§9a) |

Full matrix and the billing hand-over: [`TOOL_ACCESS.md`](./TOOL_ACCESS.md).

## 12. People

- Wlad Jachtchenko `wj@argumentorik.com` — product and content owner; every
  WladBot wording change gets his OK. Enters billing cards or delegates to
  Eduard.
- Eduard `ek@argumentorik.com` — Google Workspace, mailboxes, billing.
- Mert `start@aiporate.com` → `mert@argumentorik.com` — previous owner of
  all tools; records the walkthrough video; available during the hand-over.
- Support team — admin access through §8, not through shared logins.

---

## 13. Check yourself — ten short questions

Answer from memory, then check the section in brackets. If two are wrong,
read the section again before the hand-over call.

1. A PR is merged to `mvpcode`. Is the change live on leaderos.de? What is
   missing? (§3.1)
2. You change `RESEND_API_KEY` in Emergent. What must happen before emails
   work? (§3.2)
3. Four testers say "voice does not work". What do you check before opening
   the code? (§2 task 4, §10.2)
4. Which key is used to identify a person in Mongo, Supabase, PostHog and
   Sentry? Why does it matter? (§4)
5. Where do Sentry alerts go, and what are the three P0 rules? (§5)
6. The Supabase mail says "running out of Disk IO Budget". Is that a money
   problem? What are the first two things you look at? (§7)
7. A support colleague opens `leaderos.de/wlad-control-x7k9q2` and lands on
   the dashboard. What are the two ways to fix that, and which one needs
   no deploy? (§8)
8. `VOYAGE_API_KEY` is missing on Emergent. Does WladBot still use Wlad's
   corpus? Which retriever runs? (§9)
9. Which five smoke checks run after every deploy? (§3.4)
10. Stripe webhooks all return 400. Most likely cause? (§6)
11. Which two Cal.com slugs must never change, and what is the first step
    of the sales automation? (§9a)

**Answer key.** 1 No; you deploy Emergent manually. 2 Redeploy; env vars
do not hot-reload. 3 `ELEVENLABS_API_KEY` in Emergent env. 4 `email_lower`;
otherwise one person becomes two accounts/profiles. 5 To you (new Sentry
org); 5xx spike, Stripe webhook error, auth endpoint 5xx. 6 No, it is a
compute burst budget; Disk IO usage graph, then Query Performance /
pg_cron jobs. 7 Grant from the admin panel (no deploy) or `ADMIN_EMAILS`
env (redeploy). 8 Yes; lexical-only. 9 `/api/health`,
`/api/monitoring/system`, `/api/webinar/stats`, `/api/payments/stripe-mode`,
cron endpoint without secret → 401/403, plus one real webinar signup.
10 Wrong `STRIPE_WEBHOOK_SECRET`. 11 `leaderos/beratung` and
`leaderos/demo`; a signed Cal.com webhook into the backend that upserts
bookings by `email_lower`.

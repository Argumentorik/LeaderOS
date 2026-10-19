# Emergent Admin Onboarding — Stefan

> For: **Stefan (`stefan@argumentorik.com`, GitHub `sbcodes`)**, Emergent
> admin from 24.09.2026. You now own the app backend. This page is what
> you need on day one. For the full product tour, read
> [`ONBOARDING.md`](../../ONBOARDING.md) after this.
>
> Everything here is checked against the code on `mvpcode` or against live
> Supabase logs. Where something could only be seen from outside Emergent,
> it says so.

---

## 0. TL;DR — your first hour

1. Log in to Emergent. Open project **`command-center-229`** and find three
   things: the env var screen, the deploy button, and the logs.
2. Run the smoke checks in [§4](#4-deploying-and-checking-a-deploy). Write
   down what fails.
3. Read [§2](#2-the-one-thing-you-must-know-github-and-emergent-have-drifted).
   It explains most of the strange behaviour you will see.
4. Look at the open issues in [§8](#8-open-issues--start-here). Two of them
   affect the webinar on **29.10.2026**.

---

## 1. Where things run

```
Browser
  │
  ├── leader-os.de / www.leader-os.de ─────► Vercel (project `leaderos`, branch `mvpcode`)
  │        │  marketing, funnels, /webinar, /kommunikation, journal
  │        │
  │        ├── /api/newsletter/* ──────────► Supabase Edge Functions
  │        └── /api/*  (vercel.json rewrite) ─► https://command-center-229.emergent.host/api/*
  │
  ├── leaderos.de  (app, no hyphen) ───────► Emergent   ◄── you own this
  └── leadercheck.de (diagnosis funnel) ───► Emergent / separate host (not on our Vercel team)

Emergent FastAPI  (backend/server.py, 36 routers under backend/routes/)
  ├── MongoDB — runs inside Emergent, no separate Atlas account (primary app DB)
  ├── Supabase Postgres `srujvjjncrszhaaxepxf` (eu-north-1): identity mirror, billing,
  │   RAG vectors (`wladbot_documents`), pg_cron jobs, Edge Functions
  ├── Resend (all email) · Stripe (payments) · ElevenLabs (voice) · Voyage (embeddings)
  └── LLM via `emergentintegrations` (EMERGENT_LLM_KEY), or native keys (see §9)
```

Two domain pairs, easy to confuse:

| Hyphen = marketing (Vercel, this repo) | No hyphen = app (Emergent) |
| --- | --- |
| `leader-os.de` | `leaderos.de` |
| `leader-check.de` | `leadercheck.de` |

**Every** `/api/*` request from `leader-os.de` goes to your Emergent
backend, so a backend outage also breaks the webinar signup form.

---

## 2. The one thing you must know: GitHub and Emergent have drifted

GitHub (`aiporator/shipos`, branch **`mvpcode`**) is meant to be the
source of truth. **It is not identical to what runs on Emergent.** The
evidence:

- The live Supabase database has tables and cron jobs that **no code in
  this repo** reads or writes: `dash_*` views, `incidents`, `launch_monitor`,
  `health_probes`, `emergent_sync_queue`, `emergent_circuit_state`, and pg_cron
  functions `check_slo_breaches()` and `emergent_circuit_update()`.
- `memory/PRD.md` and `test_reports/` stop at about iteration 94. Emergent's
  own iteration count went past 183.
- Supabase logs a component called `wladbot-chat-emergent` calling a
  deprecated endpoint about 437 times per 24h (16.09.). No client in this
  repo calls a deprecated endpoint. So the caller is code we don't have.
- On 16.09. some `/api/monitoring/*` routes that exist on `mvpcode` returned
  404 in production.

**What this means for you:**

- Before you deploy `mvpcode` to Emergent, **export the current Emergent
  code and diff it against `mvpcode`.** A blind deploy can delete features
  that only exist on Emergent, or bring back bugs that were fixed there.
- Every change you make in Emergent must go back into GitHub as a PR against
  `mvpcode`. If a change isn't in GitHub, treat it as undocumented.
- Emergent sometimes auto-commits straight to `mvpcode`. `ci.yml` also runs
  on push to `mvpcode` to catch that.

**Your first real task** is to do this reconciliation once and record the
result in this file under "Reconciliation log" at the bottom.

---

## 3. What lives on Emergent

### Backend

- Entry point: `backend/server.py` (startup builds about 57 Mongo indexes,
  mounts all routers). Health route: `GET /api/health`.
- Routers: `backend/routes/*.py` — auth, oauth, chat, voice_tts, video,
  simulations, webinar, free_videos, leader_check, lifecycle_emails,
  payments, admin, admin_quality, monitoring, sync, uploads, gdpr, and others.
- Shared logic: `services.py` (includes `WLAD_HARD_RULES`, the rules that go
  into every LLM prompt), `services_rag.py` (hybrid retrieval),
  `services_email.py` (every email template), `services_magic_link.py`.

### MongoDB collections (most used)

`users`, `user_sessions`, `login_attempts` (24h TTL), `magic_links`,
`chat_sessions`, `chat_messages`, `webinar_leads`, `webinar_email_log`,
`free_video_leads`, `nurture_leads`, `email_log`, `payment_transactions`,
`installment_plans`, `credits`, `events`, `event_registrations`,
`simulations`, `tasks`, `daily_checkins`, `community_posts`, `system_events`,
`gdpr_exports`, `rag_quality_runs`. The indexes are created in
`server.py` at startup, so no manual migration is needed.

### Env vars

Change them in Emergent. **Emergent does not hot-reload env vars. Every
change needs a redeploy.**

| Group | Variables | If missing |
| --- | --- | --- |
| **Core (backend won't start)** | `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS` | Crash or no cookies |
| **Email** | `RESEND_API_KEY`, `SENDER_EMAIL` | Emails are skipped silently (`is_enabled()` gate). No error, but no magic links and no reminders |
| **Scheduled jobs** | `CRON_SHARED_SECRET` (must equal the GitHub secret of the same name) | Cron calls fail or run unprotected |
| **Supabase** | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET`, `SUPABASE_USER_MIRROR_URL`, `SUPABASE_OUTBOUND_SECRET`, `INBOUND_SYNC_SECRET`, `SYNC_JWT_SECRET` | No identity mirror, no RAG, sync endpoints return 503 |
| **AI** | `EMERGENT_LLM_KEY` · optional `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (see §9) · `VOYAGE_API_KEY` · `ELEVENLABS_API_KEY` | No chat, no RAG, voice silent |
| **RAG tuning** | `RAG_MATCH_THRESHOLD`, `RAG_MATCH_COUNT`, `RAG_MATCH_OVERFETCH` | Defaults apply. Change only in `services_rag.py`; CI enforces this |
| **Payments** | `STRIPE_API_KEY` (+ webhook secret) | No checkout |
| **Auth providers** | `GOOGLE_CLIENT_ID`, `OAUTH_SESSION_URL`, `APPLE_*`, `MICROSOFT_*`, `MAGIC_LINK_TTL_MIN` | That login option returns 503 |
| **Funnel** | `FRONTEND_BASE_URL`, `WEBINAR_JOIN_URL` (→ `https://leader-os.de/webinar/live`), `ENTERPRISE_LEAD_EMAIL`, `ENTERPRISE_NOTIFY_EMAIL`, `REPORT_JWT_SECRET` | Wrong links in emails |
| **Ads tracking** | `META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_GRAPH_VERSION`, `META_TEST_EVENT_CODE` | Meta Conversions API does nothing (on purpose, until set) |
| **Observability** | `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE`, `POSTHOG_KEY` / `POSTHOG_API_KEY`, `POSTHOG_HOST` | No error reports |
| **Never in production** | `TEST_*` (all of them) | — |

---

## 4. Deploying and checking a deploy

1. Merge to `mvpcode` via PR (GitHub Actions run: `ci`, `gitleaks`,
   `lockfile-guard`, `constants-drift`, `codeql`).
2. Vercel deploys the marketing site on its own in about 90 seconds.
3. **Emergent: you deploy the backend yourself** (after the diff from §2).
4. Env var changed? Redeploy.
5. Run the smoke checks:

```bash
BASE=https://leader-os.de/api

curl -s $BASE/health                       # {"status":"ok"}
curl -s $BASE/monitoring/system            # overall: "go"  (404 = see §2)
curl -s $BASE/webinar/stats                # capacity counter on /webinar

# Cron protection: without the header you must get 401/403
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/cron/lead-nurture
```

6. Test one real signup on `https://leader-os.de/webinar` with a test
   address. The confirmation email must arrive (check Resend → Logs), and a
   document must appear in Mongo `webinar_leads`.

Rollback: redeploy the previous version in Emergent. Vercel: Deployments →
previous production → Promote.

---

## 5. Data rules (do not break these)

- **`email_lower` is the identity key everywhere**: Mongo, Supabase
  `public.users`, PostHog `identify()`, Sentry `setUser`. If you create or
  link a user without it, one person becomes two accounts.
- **Supabase schema changes only through migrations** (Supabase MCP
  `apply_migration` or `supabase/migrations/`), never raw SQL in the
  dashboard. After every DDL change run `get_advisors`. The only expected
  warning: `upsert_incomplete_attempt` is callable by `anon`.
- Supabase views must use `security_invoker = true`. Trigger functions
  `revoke all from public, anon, authenticated` and grant only `service_role`.
- Full rule set: [`CLAUDE.md`](../../CLAUDE.md) · schema:
  [`docs/app/SCHEMA.md`](../app/SCHEMA.md) · sync:
  [`docs/app/SUPABASE_SYNC_INTEGRATION.md`](../app/SUPABASE_SYNC_INTEGRATION.md).

---

## 6. Scheduled jobs — two independent systems

**A · GitHub Actions** (`.github/workflows/cron.yml`, daily 09:00 Berlin
time and on the 1st of the month). These call your backend with header
`X-Cron-Secret`:

- `POST /api/cron/installments-due`
- `POST /api/cron/free-video-drip`
- `POST /api/cron/lead-nurture`
- `POST /api/cron/monthly-scorecard`

The target is the repo variable `BACKEND_URL` (default
`https://leader-os.de`). When a run fails, a GitHub issue opens
automatically.

**Webinar jobs** (`.github/workflows/webinar-cron.yml`, added 24.09.):

- `POST /api/cron/webinar-reminders`: 24h reminder (sent 12–24.5 h before)
  and 1h reminder (0–2 h before). Each lead gets each one once (flags on
  `webinar_leads`), so extra calls are harmless.
- `POST /api/cron/webinar-followup`: from 20h after the webinar, once per lead.

The workflow only fires in the windows around 29.10. It is the **backup**:
scheduled GitHub runs start up to 5 h late here (`cron-jobs` is scheduled
for 07:00 UTC and runs around 12:30). **Primary scheduler: cron-job.org**,
every 15 min on `webinar-reminders` with header `X-Cron-Secret` (value =
`CRON_SHARED_SECRET` in Emergent, same as the GitHub secret). See §8.1.

**B · Supabase pg_cron** (about 15 jobs in the database). These include
`email_dispatcher`, `advance_email_journeys`, `drain_emergent_sync`,
`slo_breach_check`, `emergent_circuit_check`, and health monitors. See
[`docs/app/SYSTEM_OVERVIEW.md`](../app/SYSTEM_OVERVIEW.md). **This code is
not in the repo** (see §2).

---

## 7. Where to look when something breaks

| Symptom | Look here first |
| --- | --- |
| Site up, forms fail | `curl $BASE/health` → Emergent logs |
| Login failures | Admin page → Auth-Health widget (reads Mongo `login_attempts`). A wrong password returns 401 immediately. A slow DB gives a 500, not a "failed login" |
| Emails not arriving | Resend → Logs · `SENDER_EMAIL` domain verified? (§8) |
| Slow / timeouts | Supabase → Logs → Postgres (`statement timeout`, `job startup timeout`) |
| Frontend errors | Sentry org `aiporate` (EU): projects `leader-os`, `leader-check` |
| User behaviour | PostHog EU, project 181271 |
| Scheduled jobs | GitHub → Actions → `cron-jobs` · auto-opened issues |

Admin dashboard in the app: `/wlad-control-x7k9q2` (admin role required;
granted with `select grant_admin('email')` in Supabase, see `RUNBOOK.md`).

---

## 8. Open issues — start here

In priority order. Found in live data or in the code, dated.

0. **⚠️ No deploy of `mvpcode` to Emergent before Monday 28.09.** (Greator
   event on 26./27.09., Wlad demos Video-Analyse and Challengers live, see
   [`GREATOR_TAG2_LEADEROS.md`](../gtm/GREATOR_TAG2_LEADEROS.md)).
   - Until 25.09. the speech-to-text shim `backend/lib/llm_provider.py`
     only accepted `transcribe(file_path, language)`, while `routes/video.py`
     and `routes/voice_tts.py` call `transcribe(file=…, model=…,
     response_format=…)` and read `.text`. **Deploying `mvpcode` would have
     broken video missions, `/api/voice/transcribe` and voice mode.** Fixed
     (both call styles, returns a `str` with `.text`), but deploy only after
     the event and after the diff against the live code (§2).
   - Video analysis praised its own prompt: silent audio → Whisper phantom
     „Untertitel der Amara.org-Community" → instructions and transcript in one
     block → the model quoted the prompt as „Stärken". Fixed in
     `routes/video.py` on `mvpcode` with five changes:
     1. `_speech_problem()`: Whisper phantoms and < 15 words → 422.
     2. Prompt: task, context and speech separated, speech inside
        `<transkript>` tags, new JSON field `insufficient_speech`.
     3. `insufficient_speech: true` → 422 instead of a score.
     4. `_drop_prompt_echo()` removes strengths/key phrases quoting the mission
        text or score history; the response always carries the real Whisper
        transcript.
     5. Charge only for a finished analysis: `has_credit()` (new in
        `routes/credits.py`) checks up front, credit and trial slot are
        deducted after the analysis. Silence, too little speech and AI errors
        cost nothing.

     **The live Emergent version is newer** (`_ensure_three`, „GENAU 3",
     async jobs): port these five changes there.
1. **The webinar on 29.10.2026: backend deploy + reminder scheduler.**
   - On `mvpcode` the date moved to 29.10., 10:00 CET (`WEBINAR_DATE_ISO =
     "2026-10-29T09:00:00Z"`, campaign `webinar-2026-10-29`). Confirmation,
     reminder, and follow-up emails and the calendar link come from
     Emergent. **Until Emergent runs this code, emails show the old date.**
   - The reminder windows were widened on 24.09. (±30 min → 12–24.5 h and
     0–2 h, `_REMINDER_WINDOWS` in `backend/routes/webinar.py`). **Emergent
     needs this code**, otherwise late cron runs miss the window.
   - Backup scheduler: `webinar-cron.yml` (§6). **Primary:** create a
     cron-job.org job every 15 min on `/api/cron/webinar-reminders`.
   - Test before 28.10.: Actions → `webinar-cron` → Run workflow. The
     response must be HTTP 200 with `"enabled": true` (Resend key set) and
     `"reason": "outside window"` until 28.10.
2. **Supabase performance incident (16.09.).** Postgres logs showed
   `canceling statement due to statement timeout`, queries of 34–38 s,
   `could not accept SSL connection: EOF`, and pg_cron jobs 8, 10, 12, 14,
   15 with `job startup timeout`. Check whether it's resolved, and which job
   or query caused the load. Possible causes: connection-pool exhaustion or
   an expensive cron function.
3. **Magic links / sender domain.** In June the root cause was
   `SENDER_EMAIL` on `leader-os.de`, which was not verified in Resend (every
   send failed with 403). `backend/.env.example` **still** shows
   `reminders@leader-os.de`. Check the real env var in Emergent and the
   domain status in Resend. The target is a verified `leaderos.de` sender.
4. **`deprecated_endpoint_called`, about 437 times per 24h** from component
   `wladbot-chat-emergent` (Supabase `system_events`). Find which endpoint it
   is and which client calls it. That client is not in this repo.
5. **Supabase `email_sends` queue has been idle since 03.08.** (12 rows in
   total). The documented `email_dispatcher` has nothing to send. The
   backend sends directly through Resend. Decide which system is correct
   and shut down the other.
6. **Auth-Health "CRITICAL" (20.8 %)** was 24 attempts total, mostly wrong
   passwords, **not** DB slowness. The login path is pure Mongo. Don't
   chase it unless the numbers grow.
7. CodeQL `analyze` fails on every PR because Code Scanning is turned off
   in the repo settings. Not blocking.

---

## 9. Reducing Emergent lock-in (already prepared in code)

Two shims switch provider **by env var alone**, with no code change:

- **`backend/lib/llm_provider.py`**: all 12 LLM routes use it. With
  `ANTHROPIC_API_KEY` set → native Claude. With `OPENAI_API_KEY` → native
  OpenAI. Otherwise it falls back to `EMERGENT_LLM_KEY`. The STT class
  (`OpenAISpeechToText`) works the same way.
- **`backend/lib/object_storage.py`**: with `SUPABASE_URL` and
  `SUPABASE_SERVICE_KEY` set → Supabase Storage (bucket
  `SUPABASE_STORAGE_BUCKET`, default `wladbot-uploads`, create it as private
  first). Otherwise it uses the Emergent object store.

Suggested order: finish the reconciliation (§2) → flip the LLM key → flip
storage → run the real pytest suites in CI (they exist under
`backend/tests/`, but CI currently only runs `compileall`) → later, move
hosting.

---

## 10. Your access

| Tool | Status |
| --- | --- |
| Emergent (incl. MongoDB) | ✅ Admin from 24.09. |
| GitHub `aiporator/shipos` | ✅ write (`sbcodes`) → maintain requested |
| Vercel `aiporators-projects` | ✅ Member |
| Supabase, Sentry, PostHog, Resend, Stripe, ElevenLabs, Voyage | requested, see [`TOOL_ACCESS.md`](./TOOL_ACCESS.md) §3 |

Secrets are never sent by email. If you need an API key, create your own
named key in the tool.

---

## 11. First-week checklist

- [ ] Emergent: log in, find env vars, deploy, and logs
- [ ] Smoke checks from §4 green (or failures written down)
- [ ] Export Emergent code, diff against `mvpcode`, record the result below
- [ ] Get Emergent to the 29.10. webinar code, test signup + confirmation email (§8.1)
- [ ] Create the cron-job.org job for webinar reminders, run `webinar-cron` once manually (§6, §8.1)
- [ ] Set `META_PIXEL_ID` + `META_CAPI_TOKEN` in Emergent for the Meta Conversions API ([`MARKETING_KICKOFF.md`](../gtm/MARKETING_KICKOFF.md))
- [ ] Check `SENDER_EMAIL` and the Resend domain (§8.3)
- [ ] Check the Supabase incident status (§8.2)
- [ ] Every Emergent change → PR against `mvpcode`
- [ ] Run `backend/tests` locally once (`pytest`)
- [ ] Read `CLAUDE.md` and `ONBOARDING.md`

---

## 12. Contacts

- **Mert** — owner of all tools, product/GTM: `start@aiporate.com`
  (`mert@argumentorik.com` coming soon)
- **Wlad** — content, methodology, canon: `wj@argumentorik.com`
- **Eduard** — Argumentorik email accounts: `ek@argumentorik.com`

---

## Reconciliation log

| Date | Emergent state (commit/iteration) | Diff vs. `mvpcode` | Action |
| --- | --- | --- | --- |
| _open_ | | | |

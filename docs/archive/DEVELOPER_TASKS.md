# Developer Tasks · LeaderOS

> A scoped engineering brief for the developer joining the project.
> Read [`/ONBOARDING.md`](../ONBOARDING.md) first — it explains the
> system. This doc tells you what to build next, in priority order,
> with enough detail to start without a kickoff call.
>
> Three tracks: **1) Stripe automation · 2) Output quality · 3) Speed.**
> Each ticket has: *context → current state → the task → acceptance
> criteria → files → gotchas → rough effort.*

Author: handoff prepared 2026-06-26.

---

## How to work here (ground rules)

- Branch off `mvpcode`, open a PR, let CI run, merge. Never push straight
  to `mvpcode`. (Details in `ONBOARDING.md §8`.)
- Schema changes go through the Supabase MCP `apply_migration`, never raw
  SQL. Run `get_advisors` after every DDL change. (`CLAUDE.md`.)
- The cross-platform user key is `email_lower`. Never create or link a
  user without it.
- The Stripe **webhook** is a Supabase edge function
  (`supabase/functions/stripe-webhook/index.ts`), NOT a FastAPI route.
  Checkout **sessions** are created by the backend
  (`backend/routes/payments.py`). Keep that split.
- Effort estimates assume one mid-level full-stack dev. "S" = ≤1 day,
  "M" = 2–4 days, "L" = ~1 week.

---

# Track 1 · Stripe Automation (priority)

The plumbing exists: checkout works, the webhook verifies signatures,
dedupes via `idempotency_keys`, and upserts `public.subscriptions`.
Installment plans (2×, 12×) convert into Stripe subscription schedules.
**What's missing is the *lifecycle automation* around payments** — the
flows that turn a one-time event into a managed customer journey. That's
this track.

### T1.1 — Trial → paid conversion automation · **M**

**Context.** The marketing site now leads with a **14-day free trial**
(`leaderos.de/signup?trial=14`). A trial that nobody nudges converts
poorly. There is no automated trial lifecycle yet.

**Current state.** Signup creates a Mongo user + mirrors to Supabase.
There is a `services_video_trial.py` for the *video-analysis* trial and a
`trial_reminder_email` template in `services_email.py`, but no unified
14-day product-trial state machine and no Stripe trial wiring.

**The task.**
1. Model trial state on the user (Mongo): `trial_started_at`,
   `trial_ends_at`, `trial_converted` (bool), `trial_plan` (sprint /
   plusplus).
2. On signup with `?trial=14`, create a Stripe Customer immediately
   (card optional) and set `trial_ends_at = now + 14d`.
3. Build a daily cron (extend `backend/routes/lifecycle_emails.py` +
   `docs/CRON_SCHEDULE.md`) that emails: **day 7** ("halfway, here's what
   you've unlocked"), **day 12** ("trial ends in 2 days — add a card to
   keep your seat"), **day 14** ("trial ended — reactivate").
4. When the user adds a card / buys, set `trial_converted = true` and
   activate the tier via the existing `activate_tier()`.

**Acceptance criteria.**
- A user who signs up with `?trial=14` has `trial_ends_at` set and
  receives the day-7/12/14 emails (verify with a test account whose
  `trial_started_at` is back-dated).
- Converting writes `trial_converted=true` and the tier flips.
- No email fires twice (dedupe via `email_log` like the existing drips).

**Files.** `backend/routes/auth.py` (signup), `backend/services_tier.py`,
`backend/routes/lifecycle_emails.py`, `backend/services_email.py`
(new templates), `docs/CRON_SCHEDULE.md`.

**Gotchas.** Email sends must be `asyncio.create_task` (never block the
signup response). `FRONTEND_BASE_URL` differs per Emergent project — use
it, don't hardcode `leaderos.de`.

---

### T1.2 — Dunning / failed-payment recovery · **M**

**Context.** When a card fails (`invoice.payment_failed`), Stripe retries
on its own schedule, but the customer needs to be told and the account
state needs to reflect risk. Today the webhook records `past_due` but no
recovery flow runs.

**Current state.** The edge function maps `invoice.payment_failed` →
`status: past_due` on the subscription. `installment_due_email` template
exists in `services_email.py` but isn't triggered by the failure.

**The task.**
1. In the `stripe-webhook` edge function, on `invoice.payment_failed`,
   write a row to a `dunning_events` table (or reuse `system_events`) with
   the customer, invoice, attempt count, and `next_payment_attempt`.
2. Add a backend cron (or a Supabase scheduled function) that, for each
   `past_due` subscription, sends an escalating reminder sequence:
   **attempt 1** (gentle), **attempt 2** (urgent), **final** ("access
   pauses tomorrow").
3. After Stripe exhausts retries (`customer.subscription.deleted` or N
   failed attempts), downgrade the tier to `free` via `activate_tier`.

**Acceptance criteria.**
- A simulated failed invoice (Stripe test clock) produces the reminder
  sequence and, after final failure, downgrades the user.
- Recovering (card updated, `invoice.paid`) clears `past_due` and restores
  the tier · and stops the reminders.

**Files.** `supabase/functions/stripe-webhook/index.ts`,
`backend/routes/payments.py` or a new `routes/dunning.py`,
`backend/services_email.py`, `backend/services_tier.py`.

**Gotchas.** Use Stripe **test clocks** to simulate the retry timeline —
don't wait real days. Keep the idempotency discipline: a reminder must not
double-send if the webhook re-fires.

---

### T1.3 — Self-serve billing portal + cancellation/refund flow · **M**

**Context.** There's a 14-day money-back guarantee on the Sprint and an
implicit "cancel anytime" on the trial, but no self-serve surface — every
cancel/refund is manual today.

**The task.**
1. Wire **Stripe Billing Portal**: a backend endpoint
   `POST /api/payments/portal` that creates a portal session for the
   logged-in user's Stripe customer and returns the URL. Add a
   "Manage billing" link in the app (`/profile` or `/settings`).
2. Handle `customer.subscription.updated` (downgrade/cancel-at-period-end)
   and `customer.subscription.deleted` in the webhook → reflect tier.
3. Implement the **14-day refund**: an endpoint that, if the purchase is
   ≤14 days old, issues a Stripe refund and downgrades. Log it.

**Acceptance criteria.**
- A user can open the billing portal, change/cancel their plan, and the
  app tier updates within one webhook round-trip.
- A refund inside 14 days succeeds and downgrades; outside 14 days is
  rejected with a clear message.

**Files.** `backend/routes/payments.py`,
`supabase/functions/stripe-webhook/index.ts`, a profile/settings page in
`frontend/src/pages/`.

**Gotchas.** The portal needs a Stripe **customer id** on the user —
ensure T1.1 created one. Refund eligibility is computed from the
transaction record, not trusted from the client.

---

### T1.4 — Billing reconciliation + admin visibility · **S/M**

**Context.** Two sources of truth (Stripe + our `subscriptions` table +
Mongo tier) can drift. We need a way to detect and fix drift.

**The task.**
1. A nightly reconciliation job: list active Stripe subscriptions, compare
   to `public.subscriptions` + Mongo `users.tier`, log mismatches to
   `system_events`.
2. Extend the existing admin endpoint (`backend/routes/admin.py`,
   `/api/admin/auth-health` pattern) with a `/api/admin/billing-health`
   returning: MRR, active/trialing/past_due counts, drift count, last-24h
   Stripe events processed/failed.

**Acceptance criteria.**
- A deliberately-drifted user shows up in the reconciliation log.
- `/api/admin/billing-health` returns the counts and is admin-gated.

**Files.** `backend/routes/admin.py`, a new reconciliation service,
`supabase/functions/` (read access to `subscriptions`).

**Gotchas.** Read-only first — log drift before auto-fixing. Auto-fix is a
follow-up once the log is trusted.

---

# Track 2 · Output Quality

"Better output" spans the **AI product output** (what WladBot/the agents
produce) and the **engineering output** (correctness, tests). Both raise
perceived quality.

### T2.1 — AI output quality: structured grading + regression set · **M**

**Context.** WladBot and the other agents (chat, playbooks, simulations,
video analysis) all call the same LLM gateway. Output quality is currently
unmeasured — a prompt change could silently regress.

**The task.**
1. Build a small **golden-set eval**: ~30 representative prompts per agent
   with expected qualities (tone = Wlad's voice, uses a real framework,
   no hallucinated stats). Store as fixtures.
2. Add an LLM-as-judge script that scores new outputs against the golden
   set on a rubric (relevance, methodik-accuracy, voice, safety) and
   reports a pass rate.
3. Run it in CI (or a nightly job) so a prompt/model change that drops the
   pass rate is caught before merge.

**Acceptance criteria.**
- Running the eval prints a per-agent pass rate.
- A deliberately bad prompt edit drops the score visibly.

**Files.** `backend/services_prompt_router.py`, `backend/services_rag.py`,
a new `backend/evals/` dir, `.github/workflows/`.

**Gotchas.** Keep eval cost bounded (cache, small set). The judge prompt
itself needs a rubric tight enough to be reproducible.

---

### T2.2 — RAG answer quality: retrieval tuning + citations · **M**

**Context.** WladBot answers are grounded in ~2,212 Wlad chunks via Voyage
embeddings + Supabase vector search (`RAG_MATCH_THRESHOLD`, etc). Bad
retrieval = generic answers. See `docs/RAG_KNOWLEDGE_FLOW.md`.

**The task.**
1. Add retrieval logging: for each answer, store the chunks used + scores
   (sample, privacy-safe) so you can audit "why did it say that".
2. Tune `RAG_MATCH_THRESHOLD` / `RAG_MATCH_COUNT` against the T2.1 golden
   set — find the setting that maximizes answer quality.
3. Surface **citations** in the WladBot UI ("based on: <lesson>") to raise
   trust and make wrong retrieval visible.

**Acceptance criteria.**
- You can inspect which chunks fed any given answer.
- A tuned threshold measurably beats the current default on the eval.

**Files.** `backend/services_rag.py`, the chat route, the WladBot frontend
component.

---

### T2.3 — End-to-end test coverage on the money paths · **M**

**Context.** There are 180+ backend pytest tests, but no browser-level E2E
on the critical funnels (signup → trial → checkout → webhook → tier).
These are exactly the paths where a regression costs revenue.

**The task.**
1. Add Playwright E2E for: (a) marketing CTA → signup, (b) login (magic
   link + Google stub), (c) checkout → tier activation (Stripe test mode).
2. Run them against a preview deploy in CI (nightly is fine to start).

**Acceptance criteria.**
- The three flows pass headless in CI against a preview URL.
- A broken CTA or login is caught by a red E2E run.

**Files.** new `frontend/e2e/` (Playwright is already available in the
environment), `.github/workflows/`.

**Gotchas.** Stripe test mode + test cards. Magic-link E2E needs a way to
read the token (test inbox or a dev-only endpoint that returns it).

---

# Track 3 · Speed

Recent work already cut the LCP image 2.4MB→44KB, trimmed fonts 40%, and
added Web-Vitals RUM to PostHog (`web_vital` events: LCP/CLS/INP/TTFB).
Use that RUM data to target the remaining wins — don't guess.

### T3.1 — Per-route prerendering (the big SEO + perceived-speed win) · **L**

**Context.** The marketing app is a client-rendered CRA SPA. JS-blind
social crawlers and a cold first paint both suffer. Per-route prerendering
fixes both: crawlers get correct OG/JSON-LD, users get instant first
paint.

**The task.**
1. Add `react-snap` (or a Vercel prerender step) as a **postbuild** that
   crawls the public routes (`/`, `/wlad-jachtchenko`, `/journal`, the GEO
   pillars) and writes static HTML with the rendered `<head>`.
2. Verify hydration doesn't flash/mismatch.
3. Confirm with LinkedIn Post Inspector that per-route OG now resolves.

**Acceptance criteria.**
- `view-source` on `/wlad-jachtchenko` shows the Wlad OG tags + Person
  JSON-LD **without** running JS.
- No hydration warnings in console.

**Files.** `frontend/package.json` (postbuild + dep · mind the
`yarn.lock` / `--frozen-lockfile` rule), `craco.config.js`.

**Gotchas.** This is the one risky infra change — do it on a branch, test
the Vercel preview hard before merging. It was deliberately deferred from
launch for this reason.

### T3.2 — Responsive images (`<picture>` + srcset) everywhere · **S**

**Context.** The Wlad portrait already has WebP + a 640px variant
(`frontend/public/wlad/`). Avatars still load the full image.

**The task.** Wrap the prominent `<img>`s in `<picture>` with
`type="image/webp"` source + `srcset` for the 640/1024/full variants so
mobile pulls the 14KB version, desktop the 44KB.

**Acceptance criteria.** Mobile Lighthouse shows the small variant served;
no visual regression.

**Files.** `frontend/src/components/landing/HeroSection.js`,
`LeadCaptureModal.js`, `AppointmentBookingSection.js`,
`frontend/src/lib/brandAssets.js`.

### T3.3 — Backend latency budget · **M**

**Context.** Target from `docs/PRODUCTION_READINESS.md`: login < 500ms,
API < 300ms (non-LLM). bcrypt cost 12 makes login ~250–400ms on small
CPUs. LLM calls are already async.

**The task.**
1. Add request-timing middleware → emit p50/p95 per route to Sentry/PostHog.
2. Find the slow non-LLM routes; add Mongo indexes or caching where the
   data is hot and rarely changes (tier config, pricing).
3. Confirm the production gunicorn worker count matches the CPU
   (`docs/PRODUCTION_READINESS.md` has the formula).

**Acceptance criteria.** p95 for non-LLM `/api/*` routes is under 300ms in
the dashboard; login under 500ms.

**Files.** `backend/middleware/__init__.py`, `backend/server.py`,
hot-path routes.

---

## Suggested order

1. **T1.1 trial conversion** — directly tied to launch revenue.
2. **T1.2 dunning** — stops silent revenue leakage.
3. **T2.3 E2E on money paths** — protects T1 work from regressions.
4. **T1.3 billing portal + refunds** — cuts manual support load.
5. **T3.2 responsive images** — quick perf win.
6. **T2.1 / T2.2 AI quality evals** — raises the core product quality.
7. **T1.4 reconciliation** — once T1 is live and generating data.
8. **T3.1 prerendering** — high value, but the riskiest; do it when you
   know the deploy pipeline well.
9. **T3.3 latency budget** — ongoing, data-driven.

When you pick up a ticket, drop a short note in the PR description linking
back to its ID here (e.g. "implements T1.1"). Keep this doc updated as
tickets land.

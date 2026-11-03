# Launch Day — operational playbook

The 90-minute go-live sequence for LeaderOS first cohort. Run top-to-bottom.
Each phase has explicit verification steps; do **not** skip them.

State at start (verify before beginning):
- `mvpcode` HEAD has Sentry + Stripe webhook fix + CSP fix (PRs #10, #14, #15, #16 merged)
- Vercel auto-deploys from `mvpcode` — frontend is already live with the latest
- Emergent pod is **stale** — still on Iter 80; that's what Phase 1 fixes
- Stripe is still in **test mode** on the pod — that's what Phase 2 fixes

---

## Phase 1 — Pod sync (15 min)

Bring the Emergent pod up to mvpcode HEAD. After this phase:
- Backend has `sentry_sdk` init + Stripe `construct_event` validation
- All Iter 80 work preserved (Admin-Lockdown, leader-check.de migration, JWT-Secret hardening)

### Step 1.1 — Pull mvpcode into the pod

In the Emergent chat input UI, click the **GitHub Pull** button (next to Send).
- Repository: `aiporator/SHIPOS`
- Branch: `mvpcode`

This uses Emergent's own GitHub app authorization — **no PAT exposed in chat**.

Wait for the pull to complete. Emergent will typically show a confirmation.

### Step 1.2 — Verify the pull landed

Ask Emergent Claude to run these checks and report results:

```bash
# All four should produce match output
grep -c sentry_sdk backend/server.py
grep -c construct_event backend/routes/payments.py
grep -c DSN_LEADER frontend/src/index.js
grep -c "admin" backend/routes/admin.py    # Iter 80 work must survive

# Git state after pull
git log --oneline -5
```

Expected: each grep returns ≥1. `git log` shows recent mvpcode merges (PR #14, #15, #16).

### Step 1.3 — Set persistent env vars on the pod

In Emergent's environment configuration UI (settings → env vars or equivalent),
add these as persistent values (so they survive pod restarts):

```
SENTRY_DSN=https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224
STRIPE_API_KEY=sk_live_...          # set after Phase 2
STRIPE_WEBHOOK_SECRET=whsec_...     # set after Phase 2
```

**Do NOT paste these into chat.** Emergent's env-config UI stores them
encrypted; chat history is logged.

### Step 1.4 — Restart and verify backend

```bash
sudo supervisorctl restart backend
sleep 3
curl -fsS http://127.0.0.1:8001/api/health
```

Expected:
- supervisorctl returns `backend: stopped` then `backend: started`
- curl returns `{"status":"ok"}` or similar 200 response

If `/api/health` does NOT return 200, check `supervisorctl tail backend` for
errors. Most likely cause: missing required env var (the backend now fails
fast on missing `JWT_SECRET` — make sure it's still set after Phase 1.3).

---

## Phase 2 — Stripe live setup (30 min)

The pod has the webhook signature validation code now, but Stripe is still
in test mode. Time to switch.

### Step 2.1 — Switch Stripe Dashboard to Live mode

Stripe Dashboard → top nav → toggle from **Test mode** to **Live mode**.
The header bar should change color (orange→green) to indicate live.

### Step 2.2 — Create the 4 live products

For each, use **exactly** these IDs (match what the backend expects):

| Product ID | Name | Price | Type | Billing |
|---|---|---|---|---|
| `leadership_os` | LeaderOS — One-Time | €997 | One-time | — |
| `leadership_os_2x` | LeaderOS — 2x €550 | €550 | Recurring | 1 month, 2 cycles |
| `leadership_os_12x` | LeaderOS — 12x €99 | €99 | Recurring | 1 month, 12 cycles |
| `leadership_os_plus` | LeaderOS Plus | €4,447 | One-time | — |

Settings → Products → New product. Make sure the **internal ID** field matches
exactly (Stripe shows this as "Lookup key" or "Product ID" depending on UI version).
Currency: **EUR**. Tax: configure per your VAT setup.

### Step 2.3 — Register the webhook endpoint

Stripe Dashboard → Developers → Webhooks → **Add endpoint**.

- Endpoint URL: `https://leader-os.de/api/payments/webhook/stripe`
- Description: `LeaderOS production webhook`
- Events to listen for (these are what `backend/routes/payments.py` handles):
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

Click **Add endpoint**.

### Step 2.4 — Grab the secrets

After creating the endpoint:
1. Click the new endpoint → **Signing secret** → reveal → copy `whsec_...`
2. Developers → API keys → **Live mode** → Secret key → reveal → copy `sk_live_...`

### Step 2.5 — Paste secrets into Emergent env-config

In Emergent's environment variables UI (same place as Phase 1.3):

```
STRIPE_API_KEY=sk_live_...               # from step 2.4
STRIPE_WEBHOOK_SECRET=whsec_...          # from step 2.4
```

### Step 2.6 — Restart backend to pick up new env vars

```bash
sudo supervisorctl restart backend
sleep 3
curl -fsS http://127.0.0.1:8001/api/health
```

---

## Phase 3 — End-to-end verification (15 min)

Don't open the doors until every check passes.

### Step 3.1 — Run the smoke-test script

```bash
bash scripts/verify-launch.sh
```

This script (added in this PR) hits the key endpoints and reports pass/fail
per probe. Fix any failures before proceeding to step 3.2.

### Step 3.2 — Signup flow (manual, real browser)

1. Open `https://leader-check.de` in a fresh incognito browser
2. Complete the funnel with a new email (use a real address you control)
3. In Supabase Studio → Table editor → `public.users` → confirm:
   - A row exists with your email
   - `email_lower` is lowercase
   - `meta_tags` contains `'leader-check'`
   - `source_platform` = `'leader-check'`

### Step 3.3 — Login + identity stitching

1. On `https://leader-os.de`, sign up with the same email via Supabase Auth
2. DevTools → Network tab → filter for `posthog`
3. After login completes, confirm requests to `eu.i.posthog.com/e/`:
   - One `$identify` request with `distinct_id` = your email-lower
   - Optionally `$alias` to merge prior anonymous distinct_id
4. In Supabase Studio → `public.users` → confirm `meta_tags` now contains
   both `'leader-check'` AND `'leader-os'` (the trigger added the second one)

### Step 3.4 — Checkout flow (use a real card, charge €1 for testing)

1. Navigate to pricing → click a paid plan
2. Stripe checkout opens — verify it shows **live mode** (no "TEST" banner)
   and the correct EUR amount
3. Use a real card (preferably your own) with a low test amount, or use
   Stripe's "Test card" feature in Live mode if available
4. Complete checkout
5. Stripe Dashboard → Webhooks → your endpoint → Recent deliveries → confirm
   the `checkout.session.completed` event delivered with **HTTP 200**
6. Supabase Studio → `public.subscriptions` → confirm a new row with your
   user_id, the correct plan, `status='active'`
7. Inbox: welcome email should have arrived from `reminders@leader-os.de`

### Step 3.5 — Force errors both planes

**Frontend Sentry test:**
- Open `https://leader-os.de` → DevTools console:
  ```js
  throw new Error('launch-test-leader-os-' + Date.now())
  ```
- Sentry → `leader-os` project → Issues → event appears within 5 seconds
- Repeat on `https://leader-check.de` → should land in `leader-check` project

**Backend Sentry test:**
- Hit an endpoint that's known to throw or trip an exception path
- Sentry → `leader-os` project → server-side issue appears with FastAPI stack trace

If any of step 3 fails, go back to Phase 1 or 2 and fix before proceeding.

---

## Phase 4 — Polish (15 min)

These don't block launch but should be done same-day.

### Step 4.1 — GitHub default branch

GitHub → `aiporator/shipos` → Settings → Branches → Default branch →
swap from `claude/install-supabase-cli-Z8CF9` to `mvpcode`.

### Step 4.2 — Delete dead `claude/*` branches

GitHub → Branches → All branches → trash icon next to each:
- `claude/install-supabase-cli-Z8CF9`
- `claude/integrate-sentry-mcp-BV4Ev`
- `claude/setup-posthog-eu-Oy6Ly`
- `claude/add-supabase-mcp-server-wVHPR`
- `claude/cleanup-ci-workflow-QiBAS`
- `claude/fix-xss-report-generator-9vIjG`
- `claude/framer-mcp-relay-Ot1Oh`
- `claude/mcp-server-integration-WWmJL`
- `claude/rename-default-branch-KQrTc`

Keep: `mvpcode`, `backup/mvpcode-pre-emergent-2026-05-17`, `dependabot/*`,
any active `claude/*` from this PR or future iterations.

### Step 4.3 — Supabase Auth HaveIBeenPwned

Supabase Dashboard → Authentication → Settings → Password Settings →
toggle **Check passwords against HaveIBeenPwned** to ON.

### Step 4.4 — Delete vestigial Sentry project

Sentry → Settings → Projects → `javascript-nextjs` → Remove Project.

---

## Phase 5 — Soft launch (the actual go-live)

**Do not open to all 1000 users at once.** Stagger the cohort.

### Cohort wave 1 — 50 users (T+0)

- Open registration to the first 50 invitees (e.g. founder list, beta cohort)
- Watch Sentry + PostHog dashboards for 2 hours
- Watch Stripe Dashboard for any failed payments
- If any spike in errors → roll back via Vercel "Promote previous deployment"
  + `bash scripts/deploy-backend.sh` with a previous commit

### Cohort wave 2 — 250 users (T+24h)

- Once wave 1 is stable for 24h with no Sentry alerts
- Open registration to the next 200
- Continue monitoring

### Cohort wave 3 — full 1000 (T+72h or later)

- Once wave 2 is stable for 48h
- Open registration broadly

### What to monitor (continuously)

- **Sentry** — issue volume per hour. Spikes = investigate
- **PostHog** — funnel conversion rate per page (sudden drop = UX bug)
- **Stripe Dashboard** — payment success rate. Sub-95% = investigate
- **Supabase Studio** — Logs → look for slow queries (`pg_stat_statements`)
- **Vercel** — Edge requests per minute (rate-limit before infrastructure breaks)

---

## If something goes wrong

See `docs/INCIDENT_RUNBOOK.md` for specific failure modes and their fixes.

Most common launch-day issues:
1. Pod env var typo → `/api/health` 500 — re-check env config, restart
2. Stripe webhook signing secret mismatch → all webhooks 400 — re-copy from Stripe Dashboard
3. Frontend env var missing → no Sentry events — verify Vercel env vars, redeploy
4. Supabase rate-limit on free plan → consider Pro upgrade pre-launch

---

## Post-launch (day 2-7)

- Re-run `get_advisors(type='performance')` after a week — drop indexes still flagged unused
- Set up Sentry alert rules (notify Slack/email on issue volume > threshold)
- Configure PostHog dashboards for activation, retention, revenue
- Schedule weekly Dependabot PR reviews

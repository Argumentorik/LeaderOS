# Incident runbook

When production breaks, find the symptom below and follow the fix sequence.
Don't improvise — each path has been thought through. Estimated time-to-fix
is in parentheses; if you've exceeded it 2x, stop and escalate.

For the green-state launch sequence, see `docs/archive/LAUNCH_DAY.md`.

---

## Backend (FastAPI on Emergent pod)

### Symptom: `/api/health` returns 500 or times out (5 min)

**Diagnose first:**
```bash
# On Emergent pod
sudo supervisorctl status backend         # is the process up?
sudo supervisorctl tail -100 backend      # last 100 lines of stdout/stderr
```

**Common causes:**
- Missing required env var (e.g. `JWT_SECRET` — backend fails fast on this).
  Fix: re-check Emergent env-config UI, redeploy with `sudo supervisorctl restart backend`.
- pip dependency mismatch after pull. Fix: `pip install -r backend/requirements.txt && sudo supervisorctl restart backend`.
- Database connection refused. Fix: check Supabase Dashboard → Project Status. If
  Supabase is up, check `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars.

### Symptom: All `/api/*` requests return 502/504 (5 min)

Probably supervisor restarted but FastAPI failed to bind. Check:
```bash
sudo supervisorctl status
ss -tlnp | grep 8001                      # is port 8001 actually listening?
```

If port not bound, FastAPI startup failed → tail logs, fix env vars or imports.

### Symptom: `/api/*` slow under load (10 min)

Indicates either DB bottleneck or single-worker saturation. Quick wins:

1. **DB check** — Supabase Studio → SQL editor → run:
   ```sql
   select query, calls, mean_exec_time
   from pg_stat_statements
   order by mean_exec_time desc
   limit 20;
   ```
   If one query dominates, add an index (via `apply_migration` MCP).

2. **Scale workers** — uvicorn defaults to 1 worker. For 1000 users
   sustained, increase to 2-4. Edit the supervisor config or the startup
   command, restart. Don't go above 4 on a small pod (memory pressure).

3. **Pod CPU pegged** — Emergent pod may need a bigger plan. Check
   Emergent dashboard for resource usage.

---

## Stripe + Payments

### Symptom: All Stripe webhooks returning 400 (5 min)

`STRIPE_WEBHOOK_SECRET` mismatch. The endpoint validates with `construct_event(body, sig, secret)` — if the secret is wrong, every call 400s.

**Fix:**
1. Stripe Dashboard → Webhooks → your endpoint → Signing secret → reveal + copy fresh
2. Emergent env-config UI → update `STRIPE_WEBHOOK_SECRET`
3. `sudo supervisorctl restart backend`
4. Stripe Dashboard → endpoint → click "Resend" on any failed events to retry

### Symptom: Webhooks returning 500 (10 min)

Signature validation passed but the handler crashed. Tail backend logs for the
exception. Common cases:
- Supabase write failed (e.g. unique constraint on `subscriptions.stripe_id` if
  webhook delivered twice with no idempotency check — verify `idempotency_keys`
  table is being populated)
- Email send failed (Resend rate limit or API key issue) — backend should NOT
  return 500 on email failures, it should log and proceed. If it does 500,
  patch the handler to swallow Resend errors.

### Symptom: Customer paid but no subscription row in Supabase (15 min)

Webhook didn't reach our backend, or reached but failed silently.

1. Stripe Dashboard → Events → find the customer's `checkout.session.completed`
2. Click it → see "Webhook attempts" — was it delivered?
3. If "Failed" → click Resend
4. If "Delivered with 200" but no DB row → the handler accepted but write
   failed silently. Tail backend logs around the timestamp, check
   `system_events` table in Supabase for any error entries.

### Symptom: Payments charging the wrong amount

`STRIPE_API_KEY` is in test mode (`sk_test_...`) instead of live. Check
Emergent env-config. Frontend checkout uses the publishable key from Vercel
env (`REACT_APP_STRIPE_PUBLISHABLE_KEY`) — confirm it's also `pk_live_...`.

---

## Frontend / Vercel

### Symptom: Domain shows old version (10 min)

Vercel deployed but cached. Hard refresh in browser (Cmd+Shift+R).
Still old? Check:
- Vercel Dashboard → Deployments → is the latest commit Ready?
- DNS pointing at Vercel? (`dig leader-os.de` → should resolve to Vercel IP)

If stale build is serving, force redeploy: Vercel → Deployments → ⋯ → Redeploy.

### Symptom: Vercel build fails

99% of the time: `yarn.lock` drift. Fix:
```bash
cd frontend
yarn install                              # locally, regenerates lock
git add yarn.lock
git commit -m "fix: regenerate yarn.lock"
git push
```

Vercel uses `--frozen-lockfile`, so any package.json change without a lock
update breaks the build.

### Symptom: No Sentry events from frontend (5 min)

Three possibilities:
1. `REACT_APP_SENTRY_DSN_LEADER_OS` / `LEADER_CHECK` not set in Vercel.
   Fix: Vercel → Settings → Env Vars → confirm both present in Production
   scope, then **redeploy** (CRA bakes env vars at build time).
2. Ad-blocker on the browser. Test in incognito with extensions off.
3. CSP blocking. Should not happen after the fix in PR #16 — but verify by
   opening DevTools → Console and looking for CSP violation messages.

### Symptom: No PostHog events

Same diagnostic path as Sentry. PostHog uses inline init in
`frontend/public/index.html`, so a redeploy is enough — no env var changes
needed unless you migrated to `posthog-js` npm package.

---

## Supabase / Database

### Symptom: Database connection limit reached (10 min)

You hit Supabase's connection cap. Options:
- **Quick fix**: kill long-running connections from Supabase Dashboard →
  Database → Connections
- **Real fix**: use the connection pooler URL instead of the direct connection
  in the backend. Check `SUPABASE_URL` — should point to the pgbouncer endpoint
  for FastAPI's psycopg connections.
- **Scale fix**: upgrade Supabase plan (free is 60 connections, Pro is 200,
  Team is more)

### Symptom: Trigger failing silently

Triggers don't error visibly in REST responses. Check Supabase Logs:
- Dashboard → Logs → Postgres logs → search for "ERROR" near the timestamp
- Or query `system_events` table directly if your trigger logs there

### Symptom: RLS blocking legitimate query (10 min)

Quick test: run the query as service_role. If it works, RLS is the cause.
Don't disable RLS — patch the policy. For users dealing with this:

```sql
-- See what policies exist on a table
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'your_table_name';

-- Test as a specific authenticated user
set role authenticated;
set request.jwt.claim.sub = 'user-uuid-here';
select * from your_table_name;
reset role;
```

### Symptom: pgvector queries slow

Check the HNSW index exists on `wladbot_chunks.embedding`:
```sql
select indexname, indexdef
from pg_indexes
where tablename = 'wladbot_chunks';
```

If the HNSW index is missing or unused, the query falls back to seq scan.
Either rebuild the index or check the query's planner stats with EXPLAIN.

---

## Stripe Webhook (Supabase Edge Function — canonical endpoint)

### Symptom: Stripe events not creating subscriptions

The canonical webhook is now a **Supabase Edge Function** (`stripe-webhook` v3),
NOT the backend `/api/webhook/stripe` (which returns 410 Gone).

```sql
-- Check what the Edge Function received/processed:
SELECT level, event, payload->>'stripe_subscription_id' as sub,
       payload->>'error' as err, created_at
  FROM system_events
 WHERE component = 'stripe-webhook'
 ORDER BY created_at DESC LIMIT 20;

-- Check idempotency (deduped events):
SELECT key, status, error_message, created_at
  FROM idempotency_keys
 WHERE source = 'stripe-webhook'
 ORDER BY created_at DESC LIMIT 10;
```

If zero rows → Stripe isn't reaching the Edge Function. Check:
1. Stripe Dashboard → Webhooks → endpoint status
2. URL must be: `https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook`
3. `STRIPE_WEBHOOK_SECRET` in Supabase Vault must match the endpoint's signing secret

### Symptom: Installment plan charges forever (doesn't auto-cancel)

The Edge Function creates a Subscription Schedule with `iterations: N` on
checkout. If this failed, the sub runs indefinitely.

```sql
-- Find the subscription and check if schedule was created:
SELECT event, payload
  FROM system_events
 WHERE component = 'stripe-webhook'
   AND event IN ('installment_schedule_created', 'installment_schedule_failed')
 ORDER BY created_at DESC LIMIT 5;
```

Manual fix: Stripe Dashboard → Subscriptions → find it → cancel at period end.

---

## Email Journey Engine

### Symptom: User bought but got no welcome email

```sql
-- Check if journey was enrolled:
SELECT ej.code, ujs.current_step_order, ujs.next_run_at, ujs.completed_at
  FROM user_journey_state ujs
  JOIN email_journeys ej ON ej.id = ujs.journey_id
 WHERE ujs.user_id = '<user_uuid>';

-- Check if email was queued:
SELECT template_code, status, error_message, created_at
  FROM email_sends
 WHERE user_id = '<user_uuid>'
 ORDER BY created_at DESC LIMIT 10;

-- If queued but not sent: RESEND_API_KEY missing or email-dispatcher cron stopped
SELECT * FROM cron.job WHERE jobname = 'email_dispatcher';
```

### Symptom: Inactivity emails firing for active users

The backward-pressure gate checks `fn_user_hours_since_engagement()`. If it's
returning NULL (no signal data), inactivity mails fire even for active users.

```sql
SELECT last_seen_at, last_episode_started_at, last_email_engagement_at
  FROM users WHERE id = '<user_uuid>';
-- If all NULL → signal triggers aren't firing. Check:
SELECT tgname, tgenabled FROM pg_trigger
 WHERE tgrelid IN ('sessions'::regclass, 'user_episode_progress'::regclass, 'email_events'::regclass)
   AND tgname LIKE '%signal%' OR tgname LIKE '%update%';
```

---

## Go-Live Readiness (single query)

```sql
SELECT * FROM go_live_readiness;
```

All rows should be green. Red/yellow items have `check_name` that tells you
exactly what's missing. This view was created for the launch phase — run it
daily for the first 2 weeks, then weekly.

---

## Email (Resend)

### Symptom: Welcome email not arriving

Likely causes:
1. Resend hit its quota (free tier = 3k/month). Check Resend Dashboard.
2. Domain `reminders@leader-os.de` DNS not fully propagated. Resend Dashboard →
   Domains → verify SPF/DKIM/DMARC all green.
3. Backend's Resend call swallowed an error. Check `system_events` table or
   tail logs for "RESEND_" log entries.

### Symptom: All Resend calls 401

`RESEND_API_KEY` revoked or wrong. Re-generate in Resend Dashboard, update
in Emergent env-config, restart backend.

---

## Observability (Sentry + PostHog)

### Symptom: Sentry quota exhausted (Issues page shows "Rate limited")

You're emitting more events than the plan allows. Three responses:

1. **Sample down** — lower `tracesSampleRate` and/or `replaysOnErrorSampleRate`
   in `frontend/src/index.js` and `backend/server.py`. Redeploy (frontend
   needs Vercel redeploy; backend needs supervisor restart).
2. **Filter spam** — Sentry Dashboard → Project → Settings → Inbound Filters →
   ignore noisy errors (e.g. browser extension errors)
3. **Upgrade plan** — Sentry Developer is $26/mo for 50k events

### Symptom: PostHog showing zero events (5 min)

Probably ad-blocker on dev's browser. Test in incognito. If still zero in
incognito, check Network tab for `/e/` requests to `eu.i.posthog.com`. If
they're going to `us.i.posthog.com`, your env var is wrong.

---

## Rollback procedures (use sparingly)

### Frontend rollback

Vercel → Deployments → find the last known-good deployment → ⋯ → **Promote
to Production**. Takes effect within 30 seconds.

### Backend rollback

```bash
# On Emergent pod
git log --oneline -10                     # find the last good commit
git reset --hard <commit-sha>             # destructive — make sure
sudo supervisorctl restart backend
curl -fsS http://127.0.0.1:8001/api/health
```

**Note:** this overwrites local pod changes. If the pod has uncommitted Iter
N+1 work that hasn't been saved to GitHub, you'll lose it. Always Save to
GitHub before rolling back.

### Database rollback

There's no clean rollback for applied migrations. Two options:
- **Forward fix** — write a new migration that undoes the bad change, apply via
  Supabase MCP `apply_migration`
- **Restore from backup** — Supabase Pro+ has daily backups. Supabase Dashboard
  → Database → Backups → restore. Loses any data written since backup.

Always prefer forward fix.

---

## Escalation paths

If you've exhausted the runbook and the issue isn't resolved:

- **Supabase issues** — supabase.com/dashboard/support, or community Discord
- **Vercel issues** — vercel.com/help (Pro plan = email support)
- **Stripe issues** — Dashboard → Help → contact support
- **Emergent issues** — your direct contact / support agent
- **DNS/domain issues** — your registrar (likely Namecheap/Cloudflare)

Keep an "incident log" doc somewhere outside this repo (Notion, etc.) for
recurring issues — patterns emerge after the 3rd time you fix the same thing.

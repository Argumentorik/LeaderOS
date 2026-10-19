# Runbook — LeaderOS

Project ref: `srujvjjncrszhaaxepxf` · Region: `eu-north-1`

## First 1000 users — readiness checklist

### Database (done)

| Item                                                                                  | Status |
| ------------------------------------------------------------------------------------- | ------ |
| `users.email_lower` UNIQUE — cross-platform dedup                                     | ✅ |
| `meta_tags` auto-maintained from sessions + auth signups                              | ✅ migration `cross_platform_unification_and_scale_prep` |
| Composite indexes on hot dashboard query paths                                        | ✅ same migration |
| 17 dashboard views, all `security_invoker = true`                                     | ✅ migrations `leader_os_dashboard_views*`, `cross_platform_views` |
| Trigger functions revoked from `anon` / `authenticated`                               | ✅ migration `harden_trigger_function_grants` |
| `upsert_incomplete_attempt` revoked from `authenticated` (anon-only by design)        | ✅ |
| `match_wladbot_*`, `user_context` revoked from `anon`                                 | ✅ migration `tighten_anon_rpc_grants` |
| All FKs have backing indexes; all functions `SET search_path`; RLS enabled everywhere | ✅ verified |
| `dashboard_summary(7)` end-to-end smoke                                               | ✅ returns expected JSON shape |
| Schema integrity (orphans, dup emails, missing tags)                                  | ✅ 0 issues |

### Pre-launch (you, not me)

| Item                                                                  | Where           |
| --------------------------------------------------------------------- | --------------- |
| Vault secret `service_role_key` (for `trigger_strategist`)            | Studio → Settings → Vault |
| Auth: enable **Leaked Password Protection** (HaveIBeenPwned)          | Studio → Auth → Policies |
| Edge functions: `supabase functions deploy <each of 4>`               | your Mac (commands below) |
| Edge fn secrets: `ANTHROPIC_API_KEY` (Embeddings laufen lokal im Backend, kein Embedding-Key) | `supabase secrets set ...` |
| Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel project settings |
| PostHog EU wiring verified (see [Analytics](#analytics--posthog-eu))  | Live in frontend |
| (Optional) pg_cron schedule for `select trigger_strategist(7|30)`     | Studio → SQL or `pg_cron` |

## Edge function deploy

Deploys must run on a machine with `supabase login` complete (interactive,
needs a browser) and the source bundle present. From the project root:

```bash
supabase login                      # one-time, opens browser
supabase link --project-ref srujvjjncrszhaaxepxf
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# Kein Embedding-Key nötig: RAG-Embeddings laufen lokal im FastAPI-Backend (MiniLM, 384 dim).

# Public ingest endpoints (no JWT — guarded by edge fn auth)
supabase functions deploy ingest-leader-check --no-verify-jwt
supabase functions deploy ingest-leader-os    --no-verify-jwt
# Authenticated endpoints (JWT verified)
supabase functions deploy ai-strategist
supabase functions deploy wladbot-chat
```

The edge function source lives in `supabase/functions/<name>/`. The bundle was
provided as `ship-os-FINAL.zip`; copy `edge_functions/_shared` and each
`edge_functions/<name>` into `supabase/functions/` before deploying.

## Analytics — PostHog EU

The frontend ships to the **EU cloud** (`eu.i.posthog.com`) — required so EU
end-user data never leaves the region, matching our Supabase `eu-north-1`
posture.

### How it's wired

PostHog is loaded as an inline snippet in `frontend/public/index.html` with
the EU host and project key `phc_xmMQne...`. Identity helpers in
`frontend/src/lib/analytics.js` call `posthog.alias()` + `posthog.identify()`
with `email_lower` from `frontend/src/contexts/AuthContext.js` on login,
session rehydrate, and logout.

See `docs/ops/INTEGRATIONS.md §1` for the full wiring + optional migration to
env-driven init with `posthog-js` npm package.

### Verifying region

After deploy, open the network tab on either site and confirm capture
requests go to `https://eu.i.posthog.com/e/`. Any `us.i.posthog.com` hit
means the inline snippet drifted — fix in `public/index.html`.

Dashboard UI lives at `https://eu.posthog.com` (note: no `i.`).

## Common ops

### Inspect users and their platform journey

```sql
select platform_segment, count(*)
from v_user_360
group by 1;
```

### Manually grant admin

```sql
select grant_admin('user@example.com');
```

### Force a fresh strategist run

```sql
select trigger_strategist(7);   -- 7-day plays
select trigger_strategist(30);  -- 30-day plays
```

Returns a `pg_net` request ID; check delivery with `select * from net._http_response order by id desc limit 5`.

### Dashboard JSON for the app frontend

```sql
select dashboard_summary(7);
```

### Backfill `meta_tags` after a manual data import

The `users_seed_meta_tags` BEFORE INSERT trigger handles this automatically for
new rows. For bulk updates of existing rows:

```sql
select record_platform_touch(id, source_platform)
from users where source_platform is not null;
```

### Find duplicate-email risk

Should always return zero rows (UNIQUE on `email_lower`):

```sql
select email_lower, count(*) from users group by 1 having count(*) > 1;
```

## Security advisor — known noise

```bash
# In a Claude Code session with Supabase MCP:
get_advisors(type='security')
```

One **WARN** is intentional and documented:

- `upsert_incomplete_attempt` — callable by `anon`. The leader-check landing
  page calls this from anonymous browsers to save funnel progress. Keeping it
  anon-callable is required; we already revoked the `authenticated` grant.

Anything else flagged should be investigated. After every DDL change, re-run
`get_advisors`.

## Performance advisor

```bash
get_advisors(type='performance')
```

Expected to be quiet at < 1k rows. Re-check at 100, 500, 1000 users; common
flags would be missing indexes on FKs (we already added composites for the
hot paths) or unused indexes after schema churn.

## Free-video funnel + Leader-Check handoff

### The funnel
- Public squeeze page: `/fuehrung-beginnt-hier` (aliases `/gratis`, `/free`,
  `/videos`, `/gratis-videos`, `/free-video-series` — all redirect there).
- On-landing teaser: `FreeVideoTeaser` on the main marketing page.
- Gated player for registered users: `/free-videos` (sidebar → "4 Gratis-Videos").
- Video source of truth: `backend/services_free_videos.py` (emails) +
  `frontend/src/data/freeVideos.js` (pages) — keep titles/sources in sync.
  Each slot resolves `youtube → vimeo → drive`. A slot with no source is
  skipped everywhere (page shows "in Kürze", drip never links it).
- Email deeplinks: registered-user drip → `/free-videos?v=fvN` (app);
  email-only lead drip → `PUBLIC_FUNNEL_URL` (`/fuehrung-beginnt-hier?unlock=1`,
  no login wall).

### Leads (we own the data)
- Every opt-in POSTs `/api/free-videos/lead` → durable `db.free_video_leads`
  (keyed by `email_lower`) with name + UTM + referrer + landing path + sources.
- Video 1 is emailed instantly on first opt-in; the daily
  `/api/cron/free-video-drip` cron sends Day 2-4 to leads AND registered users
  (registered leads are skipped in the lead loop to avoid double-sends).
- Admin view: `GET /api/free-videos/leads` (totals + conversion rate +
  recent). PostHog gets `lead_captured` with full attribution.
- **Lead → user bridge**: on every registration path (email register, Google
  session, leader-check sync, drip-cron detection) `bridge_lead_to_user()`
  marks the lead registered (stops the email-only drip) AND copies the
  acquisition data onto the user document as `users.funnel_attribution`
  (funnel, sources, UTM, referrer, landing path, opt-in count, drip days
  received, timestamps) + adds a `free-videos` meta_tag. The full journey
  Landing → Lead → User is queryable on the user, not buried in the side
  collection.
- Required env: `RESEND_API_KEY` (email delivery), optional `CRON_SHARED_SECRET`
  (protects the cron), Supabase env (best-effort mirror to `incomplete_attempts`).

### Leader-Check → LeaderOS sync handoff
leader-check.de mints a short-lived `sync_token`; the user is redirected to
**`https://leaderos.de/auth/sync?sync_token=…&next=/free-videos`**. This
product verifies it at `POST /api/auth/leader-os-sync` and mints a first-party
session (no second login), then lands the user in the funnel.

- **Required env (this backend):** `SYNC_JWT_SECRET` — the HS256 secret SHARED
  with the leader-check side (falls back to `REPORT_JWT_SECRET` if that's what
  leader-check signs with). If neither is set the endpoint returns **503**
  (fail-safe — it never mints a session on an unverifiable token).
- Token contract: HS256 JWT, standard `exp`, email in
  `email` / `user_email` / `e` / `sub`(if an email). Optional `typ`/`purpose`/
  `scope` must be a sync purpose (a `report_token` is rejected). Optional `jti`
  makes it single-use (replay-proof via `db.consumed_sync_tokens`).
- Cross-host is handled by `vercel.json` (edge redirect `/auth/sync` on
  leader-os.de → leaderos.de) + the synchronous `_syncHandoff()` guard in
  `frontend/src/index.js`, so the token survives even if it hits the marketing
  host or `/`.

## Rollback

Migrations are recorded by name. To undo a specific migration, write a new
migration that reverses it:

```bash
# Don't drop a migration entry — write a new one that reverses its effects.
apply_migration(name='revert_<original_name>', query='...')
```

Never `drop ... cascade` views or tables with active app traffic. Use
`alter view ... rename to v_dashboard_xxx_deprecated` and point traffic away
first.

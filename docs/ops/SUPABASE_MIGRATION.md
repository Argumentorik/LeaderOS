# Mongo → Supabase Migration (Parking Lot)

> Post-launch workstream. **Not on the tomorrow-launch path.**
> Current architecture stays: Mongo = system of record, Supabase = the
> WladHub sync sidecar described in `SUPABASE_SYNC_INTEGRATION.md`.

---

## Why migrate

- Postgres relations + RLS replace hand-rolled Mongo access control.
- Supabase Auth removes the custom JWT + session-cookie code in
  `backend/services.py` and `backend/routes/auth.py`.
- Edge Functions can absorb the cron jobs that currently live as
  FastAPI endpoints.
- Single dashboard for DB, auth, storage, and the existing Edge
  Function sync — drops one moving part (Emergent infra) once the
  backend is serverless-shaped.

## Why **not** before launch

- Auth changes break every existing session and require a coordinated
  user migration.
- Stripe webhook + installment-cron state lives in Mongo today; moving
  it mid-revenue-flow is dangerous.
- `services_tier.activate_tier`, `_finalize_paid_transaction`,
  `_create_installment_checkout` all assume Mongo doc shapes; touching
  any of them right before launch risks payment regressions.

---

## Phased plan (rough; refine when scheduled)

### Phase 0 — Inventory (½ day)
Catalogue every Mongo collection actually written by the backend:
`users`, `user_sessions`, `payment_transactions`, `installment_plans`,
`enterprise_leads`, `chat_messages`, `chat_sessions`, `voice_cache`,
`video_drip_schedule`, `email_log`, `login_attempts`, plus anything
under `routes/events.py`.

For each, capture: row count, read endpoints, write endpoints,
TTL/index requirements.

### Phase 1 — Schema (1 day)
Author Supabase migrations (one per collection) under
`supabase/migrations/`. Use the existing project — same one already
backing the WladHub sync. RLS policies per table: most read-by-owner,
admin-bypass via `service_role`.

### Phase 2 — Dual-write (2-3 days)
Wrap every `db.<collection>.insert/update` in a helper that also
upserts into Supabase. Backend stays Mongo-first; Supabase becomes a
verifiable mirror. Pick a feature flag (`SUPABASE_DUAL_WRITE=true`)
so it can be flipped off instantly.

### Phase 3 — Read cutover (1-2 days per surface)
Migrate read endpoints one at a time, starting with the lowest-stakes
ones (`chat_messages` history, `voice_cache`) and ending with `users`
and `payment_transactions`. Each surface gets:
1. Add a Supabase-backed implementation behind `USE_SUPABASE_READS_FOR=<surface>`.
2. Shadow-compare results in logs for 24-48h.
3. Flip the flag.

### Phase 4 — Auth swap (1 week, separate planning)
This is the riskiest step. Options:
- **Big-bang reset** — force every existing user through a
  "password reset" flow, hand them off to Supabase Auth.
- **Lazy migration** — on next login, validate against Mongo, then
  create the Supabase user. Keep both for 90 days.

Lazy migration is safer; needs ~2 weeks of dual-auth code in
`services.py`.

### Phase 5 — Decommission Mongo (½ day after Phase 4 stable)
Drop dual-write, archive Mongo cluster, delete the `services_supabase_sync.py`
sidecar (it's replaced by direct table access).

---

## What is **already** on Supabase

Don't re-implement these — they're working today:

- `services_supabase_sync.py` outbound writer (user signup, plan
  changes, sim completes, challenge progress) → Supabase
  `leadership_insights` table.
- `routes/internal_sync.py` inbound endpoints for the WladHub team's
  Edge Functions to push subscription updates back.
- `INBOUND_SYNC_SECRET` / `SUPABASE_OUTBOUND_SECRET` shared-secret
  auth — keep this pattern for any new sync endpoints.

See `SUPABASE_SYNC_INTEGRATION.md` for the wire details.

---

## Open questions to resolve before scheduling

1. **Custom domain on Supabase Auth?** Required if you want
   reset-password emails to come from `*@leader-os.de`.
2. **Existing Stripe customer IDs** — do they need to move to a new
   `users.id` shape, or can Supabase users keep the current
   `user_id` (UUID-string) primary key?
3. **Voice cache (`voice_cache.audio_b64`)** is large binary blobs —
   does it stay in a table or move to Supabase Storage?
4. **`email_log` dedup** depends on a compound key
   (`user_id` + `type`). Postgres unique index is straightforward;
   make sure the migration script catches existing duplicates.

---

When this gets scheduled, open a tracking issue and link the phase PRs
back here.

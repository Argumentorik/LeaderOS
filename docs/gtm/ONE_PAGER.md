# LeaderOS — System One-Pager

**Status:** ACTIVE_HEALTHY · Postgres 17 · Region `eu-north-1` · Project `srujvjjncrszhaaxepxf`
**Repo branch:** `claude/rename-default-branch-KQrTc`

---

## What it is

Two front-ends, one Supabase backend, one identity model.

| Surface | URL | Audience |
|---|---|---|
| **leader-check** | leader-check.de | Anonymous diagnostic funnel (KI / Rhetoric / EQ) |
| **leader-os** | leader-os.de | Authenticated coaching app + ai-strategist + wladbot RAG |

Cross-platform identity is unified on **`public.users.email_lower`**. First-touch is recorded in `source_platform`; every platform a user has ever touched accumulates in `meta_tags text[]`.

---

## Edge Functions (deployed)

| Function | JWT | Purpose |
|---|---|---|
| `ingest-leader-check` | public | Anonymous funnel writes (incomplete attempts, leadership insights) |
| `ingest-leader-os` | required | Authenticated session + insight ingestion |
| `wladbot-chat` | required | RAG chat: Voyage embeddings → `match_wladbot_with_neighbors` → Claude (Opus 4.7 answer / Haiku 4.5 intent) |
| `ai-strategist` | required | Generates 3–5 measurable leadership "plays" from `user_context` JSON, persists to `strategist_plays` |

All four are `ACTIVE`. Source of truth lives in `supabase/functions/` (committed this push). Shared helpers: `_shared/{cors,supabase,voyage,anthropic,log}.ts`.

---

## Database (15 public tables, 57 migrations)

**Core:** `users`, `sessions`, `leadership_insights`, `incomplete_check_attempts`, `marketing_attribution`
**Product:** `wladbot_documents` (pgvector RAG), `strategist_plays`, `prompt_templates` (versioned, `is_active`)
**Commerce:** `pricing_plans` (9 seeded), `subscriptions`
**Ops:** `daily_metric_snapshots`, `report_subscriptions`, `activity_events`, `system_events`, `idempotency_keys`

Cron-driven: `capture_daily_metrics()` for north-star trends; `send_scheduled_reports()` for executive briefings.

---

## Security posture

`get_advisors` is clean except for 4 known WARNs:
1. `upsert_incomplete_attempt` exposed to `anon` — **intentional** (anonymous funnel needs it).
2. `is_admin()` and `smoke_test_end_to_end()` callable by `authenticated` — gated internally.
3. Auth leaked-password protection disabled — toggle in dashboard when ready.

Hardening already applied: RLS on every table, `security_invoker = true` on all views, trigger functions revoked from `public/anon/authenticated` and granted only to `service_role`, executive RPCs admin-only.

---

## Data flow (mental model)

```
leader-check (anon)               leader-os (auth)
      │ upsert_incomplete_attempt        │ supabase auth signup
      ▼                                  ▼ handle_new_auth_user
      └──────────► public.users ◄────────┘
                  (email_lower UNIQUE,
                   meta_tags accumulates)
                        │
        ┌───────────────┼─────────────────┐
        ▼               ▼                 ▼
 leadership_insights  sessions     strategist_plays
                                          ▲
                                          │
                              ai-strategist edge fn
                                          ▲
                                          │
                                  wladbot-chat ──► wladbot_documents (pgvector)
```

---

## Next steps (priority order)

1. **Wire frontends to deployed edge functions.** `wladbot-chat` and `ai-strategist` are live but unconsumed — leader-os.de needs to call them with the user JWT.
2. **Stripe webhook end-to-end test.** `subscriptions` schema + `welcome_email_trigger_on_subscription` are in place; verify a real test-mode checkout writes through.
3. **Enable HaveIBeenPwned password protection** in Supabase Auth (one toggle, removes one advisor WARN).
4. **Backfill embeddings job.** `backfill-embeddings` source exists in repo but is not yet deployed — deploy and run once over `wladbot_documents` to confirm coverage.
5. **Ship the godmode dashboard.** RPCs (`godmode_dashboard`, executive briefings, anomaly detection) and views are built; needs an admin-only frontend route.
6. **CI smoke test.** Wire `smoke_test_end_to_end()` into a scheduled GitHub Action so regressions are caught before users do.
7. **Observability.** `system_events` and `activity_events` are populated but unsurfaced — add a minimal admin log viewer or pipe to a SaaS sink.

---

## Pointers

- Schema reference: `docs/app/SCHEMA.md`
- Dashboard views: `docs/app/DASHBOARD.md`
- Deploy / secrets runbook: `docs/ops/RUNBOOK.md`
- Project rules: `CLAUDE.md`

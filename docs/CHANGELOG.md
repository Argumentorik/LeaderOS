# Changelog

All notable Supabase + repo changes for LeaderOS, in the order applied.
Migrations are recorded by name in the Supabase project's migration history.

## Database migrations

| # | Migration                                          | Effect                                                                              |
|---|----------------------------------------------------|-------------------------------------------------------------------------------------|
| 1 | `leader_os_dashboard_views`                        | Created 12 `v_dashboard_*` views for Supabase Studio.                               |
| 2 | `leader_os_dashboard_views_security_invoker`       | Switched all 12 views to `security_invoker = true` (cleared 12 advisor ERRORs).     |
| 3 | `cross_platform_unification_and_scale_prep`        | `record_platform_touch`, `link_check_completion`, `users` BEFORE INSERT seed trigger, `sessions` AFTER INSERT trigger, 8 composite indexes, revoked `upsert_incomplete_attempt` from `authenticated`. Backfilled `meta_tags` for existing rows. |
| 4 | `cross_platform_views`                             | Added `v_user_360`, `v_dashboard_cross_platform`, `v_dashboard_platform_journey`, `v_dashboard_user_360_recent`, `v_dashboard_health`. |
| 5 | `harden_trigger_function_grants`                   | Revoked `public/anon/authenticated` execute on 4 trigger functions; granted only `service_role`. |
| 6 | `tighten_anon_rpc_grants`                          | Revoked anon execute on `match_wladbot_documents`, `match_wladbot_with_neighbors`, `user_context`. |
| 7 | `lock_ops_dashboard_views_to_service_role` (20260517195842) | Revoked `anon`/`authenticated` on `dash_rag` + `dash_activity_feed` and set both to `security_invoker = true`. Cleared the two remaining advisor ERRORs (2 → 0). Mirrored in `supabase/migrations/`. |

After migration 7 the security advisor reports three WARNs, all reviewed and
non-blocking — see `docs/archive/LAUNCH_FIX.md §6`:

1. `upsert_incomplete_attempt` callable by `anon` — **intentional** (funnel capture).
2. `is_admin()` callable by `authenticated` — **safe** (boolean-returning, no escalation surface).
3. Leaked password protection disabled — Studio toggle, not DDL.

## Repo changes

| Commit | What |
|--------|------|
| `Add Supabase MCP server config`        | `.mcp.json` for project-scoped Supabase MCP. |
| `Add Supabase agent skills`             | `.claude/skills/supabase`, `.claude/skills/supabase-postgres-best-practices`, `skills-lock.json`. |
| `Add LeaderOS docs (CLAUDE.md, ...)`   | `CLAUDE.md`, `docs/app/SCHEMA.md`, `docs/app/DASHBOARD.md`, `docs/ops/RUNBOOK.md`. |
| `Enable Vercel Claude Code plugin`      | `.claude/settings.json` enabling `vercel@claude-plugins-official`. |
| `docs: pre-launch readiness + CHANGELOG` | This file + RUNBOOK status update. |

## Verified end-to-end

- `dashboard_summary(7)` returns the expected JSON shape (KPIs + funnel + layers + plays + cohorts + daily).
- All 17 dashboard views execute and return rows.
- `meta_tags` triggers fire correctly (synthetic test in transaction, rolled back):
  1. `users` BEFORE INSERT seeds `source_platform` → `meta_tags`.
  2. `sessions` AFTER INSERT appends session's `platform` → user's `meta_tags`.
  3. `record_platform_touch` is idempotent on repeat calls.
- Schema integrity: 0 orphaned children, 0 duplicate emails, 0 users with `source_platform` not in `meta_tags`, 0 completed-check users without insights.
- All FKs have backing indexes; all functions have `SET search_path`; RLS enabled on every public table.

## What still requires you

- **Vault**: store `service_role_key` so `trigger_strategist()` works.
- **Edge functions**: deploy 4 of them with `supabase functions deploy` (commands in `docs/ops/RUNBOOK.md`).
- **Auth**: enable HaveIBeenPwned leaked-password protection.
- **Vercel**: confirm `NEXT_PUBLIC_SUPABASE_URL` / anon key are set.

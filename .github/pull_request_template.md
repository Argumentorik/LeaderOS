## What this PR changes

<!-- One or two sentences. Link the issue if there is one. -->

## Type of change

- [ ] Documentation only (no schema impact)
- [ ] Schema change (migration applied via Supabase MCP `apply_migration`)
- [ ] Dashboard view added or changed
- [ ] Trigger / function change
- [ ] CI / repo tooling
- [ ] Other (explain below)

## Schema-change checklist

Skip this section only if the PR is documentation- or tooling-only.

- [ ] Migration was applied via `apply_migration` (not raw SQL)
- [ ] Migration name recorded in `docs/CHANGELOG.md`
- [ ] `get_advisors(type='security')` run — output pasted below
- [ ] `get_advisors(type='performance')` run — output pasted below
- [ ] All new views have `security_invoker = true`
- [ ] All new trigger functions `revoke all from public, anon, authenticated`
      and grant only `service_role`
- [ ] No bypass of `email_lower` for user creation / linking
- [ ] FK columns have backing indexes
- [ ] Functions have `set search_path = ...`

### Advisor output

```
<!-- paste get_advisors output here -->
```

## Smoke checks performed

- [ ] `select dashboard_summary(7)` still returns expected JSON shape
- [ ] No new orphans in `users` / `sessions` / `leadership_insights`
- [ ] No new duplicate `email_lower` rows

## Cross-platform impact

- [ ] `meta_tags` still maintained correctly for both `leader-check` and `leader-os` paths
- [ ] `source_platform` first-touch invariant preserved

## Rollback plan

<!-- For schema changes: describe the reverse migration. Don't say "drop" — describe the replacement migration that undoes the effect. -->

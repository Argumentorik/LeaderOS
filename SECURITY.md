# Security policy

## Reporting a vulnerability

**Do not open a public GitHub issue.**

Report vulnerabilities privately via GitHub Security Advisories:
<https://github.com/aiporator/SHIPOS/security/advisories/new>

We acknowledge receipt within **2 business days** and aim to resolve or
mitigate within **14 days** for high-severity issues.

## Scope

This repository contains schema definitions, dashboard view catalogs, and
Claude Code wiring for the LeaderOS Supabase project (`srujvjjncrszhaaxepxf`).
Front-end code, Edge Function source, and production credentials are **not**
in this repo.

In-scope concerns include:

- Schema or RLS gaps that could leak data across `email_lower` boundaries
- Trigger functions accessible from `anon` or `authenticated` that should not be
- Views missing `security_invoker = true`
- Functions missing `set search_path`
- Documentation or runbook errors that would lead operators to expose secrets

Out-of-scope (report to the appropriate repo owners instead):

- Front-end XSS / CSRF / auth issues — file in the front-end repo
- Edge function code defects — file in the Edge Function source bundle's repo
- Anything requiring a Supabase project credential to reproduce — contact us
  directly per above

## Known accepted risk

`upsert_incomplete_attempt` is intentionally callable by `anon` so the
leader-check landing page can save funnel progress before signup. The
`authenticated` grant has been revoked. This is documented in
`docs/ops/RUNBOOK.md` and is not a finding.

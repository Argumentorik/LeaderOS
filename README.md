# Leader-OS

Single repo for the **Leader-OS** product — two surfaces, one React app,
one FastAPI backend, one Supabase project.

| Surface          | URL              | Audience                                         |
| ---------------- | ---------------- | ------------------------------------------------ |
| **leader-check** | leader-check.de  | Anonymous diagnostic funnel (KI / Rhetoric / EQ) |
| **leader-os**    | leader-os.de     | Authenticated coaching app                        |

## Repo-Struktur

```
frontend/    Create React App — Radix UI, React Router, AuthContext
backend/     FastAPI — auth, payments, chat, dashboard, simulations, …
docs/        Schema, runbook, dashboard catalog, integrations spec
.github/     CI + cron workflows
.claude/     Claude Code skills (Supabase best practices, MCP usage)
vercel.json  CRA build → frontend/build, /api/* → leader-os.de/api/*
```

**Supabase project ref:** `srujvjjncrszhaaxepxf` (region `eu-north-1`).
The MCP server is wired in `.mcp.json`.

## Production branch

**`mvpcode`** is the production branch. Vercel deploys from it on every push.

## Cross-platform identity

Both surfaces write to the same Postgres tables. The dedup key is
`public.users.email_lower` (UNIQUE). PostHog `identify()` / `alias()` use
the same lowercased email so a person stays the same across the funnel
(`leader-check.de`) and the authed app (`leader-os.de`).

See `CLAUDE.md` for the full contract, `docs/SCHEMA.md` for the database
shape, and `docs/INTEGRATIONS.md` for the frontend wiring.

## Quick start (local dev)

```bash
# Backend (Port 8001, via supervisor)
cd backend && pip install -r requirements.txt
sudo supervisorctl restart backend

# Frontend (CRA)
cd frontend
yarn install
yarn start         # http://localhost:3000 → proxies /api/* to :8001
```

Copy `frontend/.env.example` to `frontend/.env.local` and
`backend/.env.example` to `backend/.env` first.

## Documentation

| Doc                                          | What it covers                            |
| -------------------------------------------- | ----------------------------------------- |
| [`CLAUDE.md`](./CLAUDE.md)                   | Briefing for Claude Code sessions         |
| [`docs/SCHEMA.md`](./docs/SCHEMA.md)         | Postgres tables, triggers, RPCs           |
| [`docs/DASHBOARD.md`](./docs/DASHBOARD.md)   | Supabase Studio dashboard views           |
| [`docs/RUNBOOK.md`](./docs/RUNBOOK.md)       | Deploy, secrets, common ops               |
| [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md) | PostHog EU + Sentry + Supabase wiring |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)   | Schema migration history                  |
| [`docs/LAUNCH_FIX.md`](./docs/LAUNCH_FIX.md) | Vercel + GitHub cleanup sequence          |
| [`docs/GO_LIVE.md`](./docs/GO_LIVE.md)       | Original launch runbook                   |

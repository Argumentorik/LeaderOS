# Contributing to LeaderOS

Two-line summary: every change goes through a PR, and PR-required status
checks decide whether mvpcode accepts it. If you push directly to mvpcode
(only Emergent's auto-commit + admin overrides can), the same CI runs on
the push and the team gets paged when it fails.

## Branches

| Branch | Who writes to it | How |
|---|---|---|
| `mvpcode` | nobody directly (except Emergent E1 auto-commits) | PR merge only |
| `emergent-iter-NN.NN` | Emergent's Pod-Claude via "Save to GitHub" | direct push, then PR |
| `feat/*` | humans + Claude Code sessions | direct push, then PR |
| `claude/*` | Claude Code sessions | direct push, then PR |
| `backup/*` | nobody (history snapshots) | — |

## Pre-flight before opening a PR

The CI workflows under `.github/workflows/` already gate everything below,
but running them locally is faster:

```bash
# From repo root:
cd frontend && yarn install --frozen-lockfile && yarn build && cd ..
python -m compileall -q backend
```

If `yarn install --frozen-lockfile` fails: you bumped `package.json` without
regenerating `yarn.lock`. Fix with a plain `yarn install` from `frontend/`,
then commit both files together. See the CLAUDE.md project rules — the
`gsap-lockfile` incident on June 3 2026 cost 12 hours of broken Vercel
deploys because this step was skipped.

## What CI checks on every PR

| Check | What it asserts | Where |
|---|---|---|
| `ci / frontend-build` | `yarn install --frozen-lockfile` + `yarn build` succeed | [ci.yml](.github/workflows/ci.yml) |
| `ci / backend-syntax` | every `.py` in `backend/` compiles | [ci.yml](.github/workflows/ci.yml) |
| `lockfile-guard` | yarn.lock matches package.json (parity with Vercel) | [lockfile-guard.yml](.github/workflows/lockfile-guard.yml) |
| `constants-drift / rag-threshold` | `MATCH_THRESHOLD` only declared in `services_rag.py` | [constants-drift.yml](.github/workflows/constants-drift.yml) |
| `constants-drift / voyage-model` | `voyage-3` model name only in `services_rag.py` | [constants-drift.yml](.github/workflows/constants-drift.yml) |

After merge to `mvpcode`, additional checks run:

| Check | When | Notes |
|---|---|---|
| `supabase-advisors` | every push to mvpcode + daily | fails on any new ERROR-level advisor (security_definer_view, etc.) |

## Required branch-protection settings

These can only be set in the GitHub UI. Project maintainer should configure
them once on `mvpcode` (Settings → Branches → Add rule):

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Required: `ci / frontend-build`
  - Required: `ci / backend-syntax`
  - Required: `lockfile-guard / verify-lockfile`
  - Required: `constants-drift / rag-threshold`
  - Required: `constants-drift / voyage-model`
  - Required: `Vercel`
- [x] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings — leave OFF so the bot
  account (Emergent E1) can still push auto-commits, but those pushes
  will trigger the same CI and fail loudly if broken.

## Secrets to set once

| Secret | Where | Used by |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Settings → Secrets and variables → Actions | `supabase-advisors.yml` |
| `CRON_SHARED_SECRET` | already set | `cron.yml` |

`SUPABASE_ACCESS_TOKEN` is a Personal Access Token created at
<https://supabase.com/dashboard/account/tokens>. It needs read access to the
project; no write scopes required.

## Adding a new shared constant

If you find yourself copy-pasting a magic number across two or more files,
add it to `backend/constants.py` (or a TypeScript shared module for
Edge Functions) and extend `constants-drift.yml` with a regex that catches
hard-coded occurrences outside the canonical file.

The whole point of `constants-drift` is to make the second copy a CI
failure, not a future debugging session.

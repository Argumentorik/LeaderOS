# LeaderOS — Claude Code briefing

This repo (`aiporator/shipos`, branch **`mvpcode`**) is the single source of
truth for the LeaderOS product. Everything lives here:

```
shipos/
├── frontend/        Create React App (React Router, Radix UI, Sonner)
├── backend/         FastAPI (auth, payments, chat, dashboard, simulations…)
├── docs/            Schema, runbook, dashboard, integrations spec
├── vercel.json      Vercel build config (CRA frontend → frontend/build)
└── .github/         CI + cron workflows
```

| Surface          | URL (prod)       | Purpose                                                  |
| ---------------- | ---------------- | -------------------------------------------------------- |
| **leader-check** | leader-check.de  | Anonymous diagnostic funnel (KI / Rhetoric / EQ)         |
| **leader-os**    | leader-os.de     | Authenticated coaching app + ai-strategist + wladbot RAG |

Both surfaces are served by the same React app in `frontend/`. The FastAPI
backend in `backend/` is hosted at `https://leader-os.de/api/*` and proxied
through `vercel.json` rewrites.

**Supabase project ref:** `srujvjjncrszhaaxepxf` (region `eu-north-1`, Postgres 17).
The Supabase MCP server is wired in `.mcp.json` scoped to that project.

---

## How the two surfaces share state

Both surfaces write to the same Postgres tables. The cross-platform identity
key is **`public.users.email_lower`** (UNIQUE), generated from `email`.

```
┌────────────────────┐                 ┌────────────────────┐
│  leader-check.de   │                 │   leader-os.de     │
│  (anonymous)       │                 │   (Supabase Auth)  │
└─────────┬──────────┘                 └─────────┬──────────┘
          │ upsert_incomplete_attempt   handle_new_auth_user
          ▼                                       ▼
┌──────────────────────────────────────────────────────────────┐
│              public.users   (email_lower UNIQUE)             │
│   meta_tags text[]  ←  ['leader-check','leader-os','admin']  │
│   source_platform   ←  first touch only                      │
└──────────────────────────────────────────────────────────────┘
```

- **`source_platform`** — `'leader-check' | 'leader-os' | 'manual'`. **First touch only.**
- **`meta_tags text[]`** — every platform a user has *ever* touched, plus role
  tags. Maintained automatically via Postgres triggers documented in
  `docs/app/SCHEMA.md`.

For analytics, **always use `meta_tags`** ("ever touched X"), not
`source_platform`, unless you specifically want first-touch attribution.

PostHog identity stitching must use the same `email_lower` key — see
`frontend/src/lib/analytics.js` and the `identifyByEmail()` calls in
`frontend/src/contexts/AuthContext.js`.

---

## Where to look

Docs are organized by intent: `docs/gtm/` (go-to-market), `docs/app/`
(architecture), `docs/ops/` (running the app), `docs/archive/`
(historical — never build on it). Master index: `docs/README.md`.

| What you want                          | Where                                |
| -------------------------------------- | ------------------------------------ |
| Frontend code                          | `frontend/src/`                      |
| Backend code                           | `backend/`                           |
| **Verified facts canon (all claims!)** | `docs/gtm/WLAD_CANON.md`             |
| Funnel map + honesty rules             | `docs/gtm/WEBINAR_FUNNEL.md`         |
| Content/ads/SEO strategy               | `docs/gtm/`                          |
| Schema reference                       | `docs/app/SCHEMA.md`                 |
| RAG pipeline                           | `docs/app/RAG_KNOWLEDGE_FLOW.md`     |
| Dashboard views (in Supabase Studio)   | `docs/app/DASHBOARD.md`              |
| Operational runbook (deploy, secrets)  | `docs/ops/RUNBOOK.md`                |
| Cron jobs                              | `docs/ops/CRON_SCHEDULE.md`          |
| Frontend wiring spec (PostHog/Sentry)  | `docs/ops/INTEGRATIONS.md`           |
| Migration history                      | `docs/CHANGELOG.md`                  |

---

## Working rules

1. **Schema changes go through `apply_migration`** via the Supabase MCP, not raw SQL.
   Migrations are auto-named and recorded in the project's migration history.
2. **Run `get_advisors` after every DDL change.** One known intentional WARN is
   `upsert_incomplete_attempt` being callable by `anon` (the leader-check landing
   needs it). Anything else — investigate.
3. **All views must be `security_invoker = true`** (Postgres default is DEFINER,
   which Supabase flags as ERROR).
4. **All trigger functions must `revoke all from public, anon, authenticated`**
   and grant only `service_role`. They run via the trigger machinery, not REST.
5. **Don't bypass `email_lower`.** Every write that creates/links a user must use
   it as the dedup key. Same key in PostHog `identify()` / `alias()`.
6. **Don't add deps to `frontend/package.json` without updating `yarn.lock`** —
   Vercel uses `--frozen-lockfile`, so a drift breaks the build.
7. **Production branch is `mvpcode`.** All other long-lived branches are
   either history (`backup/*`) or stale (`claude/*` — most should be deleted).
8. **Read `frontend/DESIGN.md` BEFORE writing any UI.** Nike-inspired
   Athletic-Editorial DNA: pure black/white canvas, massive uppercase
   display lockups, full-bleed editorial photography, pill-shaped CTAs
   over neutral chrome. We layer a lime accent (`--brand`) and BIB-code
   monospace metadata on top — that's our signature. Don't reach for
   generic Tailwind defaults or random lucide-react icons — derive tokens
   from DESIGN.md and prefer typographic markers (mono BIB-codes, lime
   period punctuation) over icon-soup.

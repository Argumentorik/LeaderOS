# LeaderOS · Developer Onboarding

> **Read this first.** It's the single map of the whole system. Everything
> else in `docs/` is a deep-dive you reach for once you know where you are.
> If you read only one file before touching code, read this one.

Last verified: 2026-07-30.

---

## 0. State of the product (Juli 2026 — read before the deep-dives)

What is live in production right now, so you know what you're inheriting:

- **Landing (leader-os.de)** — CRO-ordered: Hero → "Ergebnisse statt
  Theorie" → 30-Sek-Wlad-Intro → product sections → Pricing → Beratung →
  FAQ → Journal (Feldnotizen, deliberately last). Primary CTA everywhere
  is the free Leader-Check. Two-step popup funnel (lead capture →
  webinar popup 35s after dismiss).
- **Webinar funnel** — `/webinar` (Hormozi ascension page, motion-first),
  `/webinar/danke` (4-video unlock + referral), `/webinar/live`
  (waiting room). Map + honesty rules: `docs/gtm/WEBINAR_FUNNEL.md`.
- **Journal** — 150+ articles in `frontend/src/features/content/`,
  rendered as an editorial broadsheet section + `/journal`. Every claim
  must check against `docs/gtm/WLAD_CANON.md`.
- **E-Mail** — full lifecycle in `backend/services_email.py`: signup
  drips, free-video drip, webinar reminders/follow-up, and the
  **7-step lead-nurture journey** (`/api/cron/lead-nurture`, day
  0/2/4/6/8/10/12, Mongo collection `nurture_leads`).
- **Terminology** — the paid entry tier is the **"30-Tage-Challenge"**
  (never "Sprint" in copy; identifiers like `id:'sprint'` deliberately
  keep the old key). Personal access is "1:1 mit Wlads Team".
- **Docs** — reorganized by intent: `docs/gtm/`, `docs/app/`,
  `docs/ops/`, `docs/archive/`. Index: `docs/README.md`. Deploy
  prerequisites: `docs/ops/EMERGENT_DEPLOY_CHECKLIST.md`.

---

## 1. The one-paragraph mental model

LeaderOS is **one Git repo** that ships **four websites** on **two
different hosting platforms**. There is a marketing side and an app side,
each with a "branded" domain (hyphen) and an "app" domain (no hyphen).
The marketing sites are a React single-page app on Vercel. The app sites
are a React + FastAPI + MongoDB stack on Emergent. They share user
identity through a Supabase Postgres mirror keyed on the lowercased email.

If you remember nothing else, remember the domain table below — almost
every "why does X happen on this URL but not that one" question is
answered by it.

---

## 2. The four domains (memorize this)

| Domain            | Hyphen? | Hosted on | What it is                                  | Code that renders it |
|---                |---      |---        |---                                          |---                   |
| **leader-os.de**  | yes     | Vercel    | Marketing landing (the funnel)              | `frontend/src/pages/LandingPage.js` |
| **leader-check.de** | yes   | Vercel    | Marketing landing for the free diagnose      | `frontend/src/pages/LeaderCheckLanding.js` |
| **leaderos.de**   | no      | Emergent  | The actual app (login, dashboard, WladBot…) | `frontend/` app routes, served by Emergent |
| **leadercheck.de** | no     | Emergent  | The free 10-min diagnose app (anonymous)    | Emergent |

Rules of thumb:

- **Hyphen = marketing (Vercel). No hyphen = app (Emergent).**
- The marketing sites have **no login**. Any auth/app route typed on a
  hyphen host is redirected to the matching no-hyphen host. That logic
  lives in `frontend/src/lib/tierRedirect.js` (run twice: once
  synchronously in `index.js` before React mounts, once in `App.js` as a
  belt-and-suspenders guard).
- The **same `frontend/` React bundle** is what Vercel builds AND what
  Emergent serves. Host-based `if` checks at the top of `LandingPage.js`
  decide which surface to show. One codebase, four faces.

Full topology with the DNS records: `README.md` + `docs/app/DOMAIN_TOPOLOGY.md`
+ `docs/app/FINAL_TOPOLOGY.md`.

---

## 3. Repo layout

```
shipos/
├── frontend/                 React 19 SPA · built by Craco (NOT plain CRA)
│   ├── public/               static assets, sitemaps, robots.txt, OG cards
│   └── src/
│       ├── pages/            46 route-level pages (LandingPage, DashboardPage…)
│       ├── components/
│       │   └── landing/      35 marketing-landing sections
│       ├── features/
│       │   └── content/      the Journal/blog engine (96 articles + renderer)
│       ├── contexts/         Auth, Theme, Tier, Pricing, Credit, Language
│       ├── lib/              shared helpers (api, tierRedirect, brandAssets, pageMeta…)
│       ├── data/             landingAssets.js (landing copy + config)
│       ├── App.js            router + providers
│       └── index.js          entry · synchronous tier-redirect + PostHog init
│
├── backend/                  FastAPI · MongoDB (Motor) · the API for the app tier
│   ├── server.py             app entry · middleware, startup indexes, route mounts
│   ├── config.py             env loading · refuses to boot without JWT_SECRET
│   ├── routes/               36 route modules (auth, oauth, chat, payments…)
│   ├── services_*.py         business logic (oauth, magic_link, rag, email, tier…)
│   ├── middleware/           rate-limit + security headers + CSP
│   └── tests/                180+ pytest tests
│
├── supabase/
│   └── functions/            12 Deno edge functions (stripe-webhook, user-mirror…)
│
├── docs/                     ~50 deep-dive docs (see the map in §9)
├── vercel.json               Vercel build + host-based redirects/rewrites
├── deploy/                   Dockerfile + fly.toml for the backend container
└── ONBOARDING.md             ← you are here
```

Counts as of last verify: 46 pages · 35 landing components · 36 backend
routes · 96 journal articles · 12 edge functions · 59 frontend deps.

---

## 4. The three data stores (and who owns what)

There are **three** persistence layers. This trips everyone up at first.

1. **MongoDB Atlas** (via Emergent) — the **app's primary store**.
   Users, sessions, chat messages, magic-links, login attempts, video
   attempts, activity log. The FastAPI backend talks to this with Motor
   (async PyMongo). Connection string is `MONGO_URL` env on Emergent.

2. **Supabase Postgres** (`srujvjjncrszhaaxepxf`) — the **cross-platform
   identity mirror + billing**. When a user is created in Mongo, a
   fire-and-forget event mirrors them into `public.users` keyed on
   `email_lower`. Stripe subscriptions live here (written by the
   `stripe-webhook` edge function). This is also where the leader-check
   anonymous funnel writes incomplete attempts.
   - The dedup key across EVERYTHING is **`email_lower`**. Never create or
     link a user without it. Same key in PostHog `identify()`.
   - Schema reference: `docs/app/SCHEMA.md`. Identity flow:
     `docs/app/IDENTITY_ARCHITECTURE.md`.

3. **PostHog** (`eu.posthog.com`, project 181271) — product analytics +
   web-vitals RUM. Not a source of truth, but every funnel decision reads
   from it. Identity stitched on the same `email_lower`.

Why three? Mongo is the app's operational DB (fast, Emergent-managed).
Supabase is the shared identity + billing layer that both the marketing
funnel and the app write to. PostHog is measurement. They reconcile on
`email_lower`.

---

## 5. Get it running locally (≈15 min)

### Prerequisites
- **Node 22** (`.nvmrc` pins it · run `nvm use`)
- **Python 3.11** for the backend
- **Yarn** (the frontend uses `yarn.lock` · Vercel runs `--frozen-lockfile`,
  so never edit `package.json` without running `yarn install` to update
  the lockfile, or the deploy breaks)

### Frontend (the part you'll touch most)
```bash
cd frontend
nvm use                 # Node 22
yarn install
yarn start              # craco start · http://localhost:3000
```
The marketing landing renders at `/`. Because host-based routing keys off
`window.location.hostname`, on `localhost` you get the **leader-os.de
marketing landing** by default (localhost is treated as a marketing host).

Useful local routes:
- `/` — marketing landing
- `/journal` — the blog index (96 articles, all local data)
- `/wlad-jachtchenko` — the canonical Wlad SEO page
- `/login`, `/dashboard` — app routes (will try to redirect to leaderos.de
  in production; locally they render so you can work on them)

Build like Vercel does (catches warnings-as-errors):
```bash
CI=false yarn build
```

### Backend (only if you touch the API)
```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # note: emergentintegrations is a
                                        # private wheel · may 404 on generic
                                        # machines · stub it if so
cp .env.example .env                    # then fill the vars in §6
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
The backend **refuses to start without `JWT_SECRET`** (by design — see
`config.py`). Minimum to boot: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`.

Run backend tests:
```bash
cd backend && pytest          # 180+ tests
```

---

## 6. Environment variables (the complete list)

These live on the **Emergent backend project** (not in the repo). The
frontend reads almost none directly — it's a static bundle. Group by
concern:

**Core (backend refuses to boot without JWT_SECRET):**
| Var | What |
|---|---|
| `MONGO_URL` | MongoDB Atlas connection string |
| `DB_NAME` | Mongo database name |
| `JWT_SECRET` | 64+ char random · signs session JWTs |

**Auth providers:**
| Var | What |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client (the "LeaderOS Production" one: `482961656741-…`) |
| `APPLE_SERVICE_ID` / `APPLE_CLIENT_ID` | Apple Sign-In (optional) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_TENANT` | Microsoft (optional) |
| `MAGIC_LINK_TTL_MIN` | magic-link expiry (default 15) |
| `FRONTEND_BASE_URL` | **per project** · `https://leaderos.de` for the app, `https://leadercheck.de` for the diagnose. Controls where magic-link emails point. |

**Email (Resend):**
| Var | What |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `SENDER_EMAIL` | `wlad@leaderos.de` (domain must be verified in Resend) or `onboarding@resend.dev` fallback |

**Payments + identity mirror:**
| Var | What |
|---|---|
| `STRIPE_API_KEY` | `sk_live_…` for production |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Supabase service-role for the mirror |
| `SUPABASE_USER_MIRROR_URL` / `SUPABASE_OUTBOUND_SECRET` | user-mirror edge function wiring |

**AI / RAG:**
| Var | What |
|---|---|
| `EMERGENT_LLM_KEY` | LLM gateway key (all agents share it) |
| `VOYAGE_API_KEY` | embeddings for RAG (WladBot knowledge) |
| `RAG_MATCH_THRESHOLD` / `RAG_MATCH_COUNT` / `RAG_MATCH_OVERFETCH` | RAG tuning |

**Ops:**
| Var | What |
|---|---|
| `CORS_ORIGINS` | comma-list of allowed origins · set explicitly in prod, never leave as `*` |
| `SENTRY_DSN` / `SENTRY_ENV` / `SENTRY_*_SAMPLE_RATE` | error + perf monitoring |
| `CRON_SHARED_SECRET` | guards the lifecycle-email cron endpoints |

Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) lives in **Supabase
Vault**, not the backend — because the webhook is a Supabase edge
function, not a FastAPI route. See §7.

---

## 7. How money flows (Stripe)

This surprises people: **the FastAPI backend does NOT handle Stripe
webhooks.** The route `/api/webhook/stripe` returns `410 Gone` on purpose.

The real handler is the Supabase edge function at
`supabase/functions/stripe-webhook/index.ts`. It:
1. Verifies the Stripe signature (`STRIPE_WEBHOOK_SECRET` from Supabase Vault)
2. Dedupes via an `idempotency_keys` table (same event id never processed twice)
3. Handles only: `checkout.session.completed`, `customer.subscription.*`,
   `invoice.paid`, `invoice.payment_failed`
4. Writes the subscription state into `public.subscriptions`, linking the
   buyer by `email_lower`

**Stripe Dashboard → Webhooks** must point at
`https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook`,
NOT at the backend.

Checkout sessions ARE created by the FastAPI backend
(`backend/routes/payments.py`) — only the webhook moved to Supabase.

---

## 8. How a change reaches production

```
you edit code on a feature branch
        │  (never commit straight to mvpcode)
        ▼
   open a PR → base branch is `mvpcode`
        │
        ├─ GitHub Actions run: ci (build + py syntax), codeql, gitleaks,
        │  lockfile-guard, constants-drift, supabase-advisors
        │
        ▼
   merge PR into `mvpcode`
        │
        ├──────────────► Vercel auto-deploys the marketing sites
        │                 (leader-os.de + leader-check.de) in ~90s
        │
        └──────────────► Emergent deploys the app tier
                          (leaderos.de + leadercheck.de) ·
                          NOTE: Emergent does NOT hot-reload env vars ·
                          changing an env var requires a manual redeploy
```

- **Production branch is `mvpcode`.** All other long-lived branches are
  history (`backup/*`) or stale (`claude/*`).
- Emergent's own tooling sometimes auto-commits straight to `mvpcode` —
  that's why `ci.yml` also runs on `push: branches: [mvpcode]`, to catch
  drift those commits bypass.
- Deploy details: `docs/ops/RUNBOOK_DEPLOY.md`, `docs/ops/DEPLOY.md`, `deploy/`.

---

## 9. Where to find things (doc map)

`docs/` has ~50 files. The ones that matter, by question:

**Start at [`docs/README.md`](./docs/README.md)** — the master index
(GTM | App | Ops | Archive). The rows below are the fast paths:

| "I need to understand…" | Read |
|---|---|
| the whole system at a glance | `docs/app/SYSTEM_OVERVIEW.md` |
| **every public claim/number (the canon)** | `docs/gtm/WLAD_CANON.md` |
| the webinar/ascension funnel | `docs/gtm/WEBINAR_FUNNEL.md` |
| all cron jobs | `docs/ops/CRON_SCHEDULE.md` |
| what the next deploy needs | `docs/ops/EMERGENT_DEPLOY_CHECKLIST.md` |
| the frontend app architecture | `docs/app/APP_ARCHITECTURE.md` |
| the domain/host routing | `README.md`, `docs/app/DOMAIN_TOPOLOGY.md`, `docs/app/FINAL_TOPOLOGY.md` |
| the database schema | `docs/app/SCHEMA.md` |
| cross-platform user identity | `docs/app/IDENTITY_ARCHITECTURE.md` |
| WladBot / RAG knowledge | `docs/app/WLADBOT_OVERVIEW.md`, `docs/app/RAG_KNOWLEDGE_FLOW.md` |
| what's production-ready (with code refs) | `docs/ops/PRODUCTION_READINESS.md` |
| auth troubleshooting (magic-link / OAuth) | `docs/archive/LAUNCH_AUTH_FIX_FRIDAY.md` |
| an incident is happening right now | `docs/ops/INCIDENT_RUNBOOK.md` |
| deploy steps | `docs/ops/RUNBOOK_DEPLOY.md`, `docs/ops/DEPLOY.md` |
| the content/blog strategy | `docs/gtm/CONTENT_STRATEGY.md` |
| Sentry alerting setup | `docs/ops/SENTRY_ALERTS.md` |
| the brand / design rules | `frontend/DESIGN.md` (kanonisch) · Historie: `docs/archive/design_guidelines.md` |
| Claude Code project rules | `CLAUDE.md` |

---

## 10. Common tasks (copy-paste recipes)

**Add a journal article:**
1. Create `frontend/src/features/content/data/articles/<slug>.js` (copy an
   existing one as a template — they're plain objects with `slug`, `title`,
   `seo`, `body` block array).
2. Import + add it to the `ARTICLES` array in
   `frontend/src/features/content/data/registry.js`.
3. Add its URL to `frontend/public/sitemap.xml` (and `sitemap-news.xml` if
   it's fresh/newsworthy).
4. `CI=false yarn build` to confirm.

**Change landing copy / pricing:**
- Most landing copy is inline in `frontend/src/components/landing/*.js`.
- Central config (CTAs, meta, pricing numbers) is in
  `frontend/src/data/landingAssets.js`.
- Pricing tiers are in `frontend/src/components/landing/PricingLadder.js`.

**Add a backend API route:**
1. Create/extend a module in `backend/routes/`.
2. Mount its router in `backend/server.py`.
3. Use a Pydantic model for the body (every route does · it's the
   validation layer).
4. Add a test in `backend/tests/`.

**Add an env var:** add it to `backend/.env.example` (so the next dev
knows it exists), document it in §6 here, then set it on Emergent and
**redeploy** (env is not hot-reloaded).

**Optimize an image:** the brand portrait pattern is WebP-primary +
JPEG-fallback (see `frontend/public/wlad/` and `lib/brandAssets.js`). Keep
hero images < 100KB. The 2.4MB→44KB story is in the git log if you want the
recipe.

---

## 11. Gotchas (things that will bite you)

- **Craco, not CRA.** `frontend` uses `@craco/craco`. Config is
  `craco.config.js`. `react-scripts` commands won't work directly.
- **`yarn.lock` is load-bearing.** Vercel builds with `--frozen-lockfile`.
  Edit `package.json` → run `yarn install` → commit the lockfile, or the
  deploy fails. There's a `lockfile-guard` CI check for exactly this.
- **Emergent doesn't hot-reload env vars.** Change one → manual redeploy.
- **Social crawlers don't run JS.** Per-route OG tags injected by React
  (`lib/pageMeta.js`) are correct for browsers + re-scrape validators, but
  classic LinkedIn/Facebook scrapers read the static `index.html`. Full
  per-route previews would need prerendering (tracked in
  `docs/ops/PRODUCTION_READINESS.md`).
- **The Stripe webhook is NOT in the backend** (§7). The backend route
  returns 410 on purpose.
- **`email_lower` is sacred.** Every user create/link uses it. Break this
  and you fork a user into two identities across Mongo + Supabase + PostHog.
- **Schema changes go through Supabase MCP `apply_migration`**, never raw
  SQL, and `get_advisors` must run after every DDL change. See `CLAUDE.md`.
- **The marketing landing forces light mode.** `LandingPage.js` strips the
  `dark` class on mount. Dashboard/app surfaces follow theme preference.

---

## 12. Who to ask / where state lives outside the repo

The full, verified access matrix (every tool, who is admin, what is still
missing for `mert@argumentorik.com`) lives in
[`docs/ops/TOOL_ACCESS.md`](./docs/ops/TOOL_ACCESS.md) — maintain it there,
not here. Short version: Vercel, GitHub, Supabase, Emergent, Resend, Stripe,
PostHog, Sentry and the domain registrar are all owned by
**start@aiporate.com**; a second owner is being added everywhere.

Contact: **start@aiporate.com** / **mert@argumentorik.com**.

> Note on the wiki: the Drive docs summarize and link — **the repo is
> always the source of truth**. If wiki and repo disagree, the repo wins.

---

## 12b. What to build next

The historical ticket backlog lives in
[`docs/archive/DEVELOPER_TASKS.md`](./docs/archive/DEVELOPER_TASKS.md)
(archived — treat as context, not as your queue). Current work arrives
as GitHub issues; GTM requests use the `gtm-campaign` issue template
with its canon/terminology checkboxes. When in doubt what to pick up,
ask in the team channel before starting from the archive.

---

## 13. Your first day checklist

- [ ] Read §2 (domains) and §4 (data stores) until they're muscle memory.
- [ ] Get the frontend running locally (`cd frontend && yarn start`).
- [ ] Open `/`, `/journal`, `/wlad-jachtchenko` locally · click around.
- [ ] Read `CLAUDE.md` (the project working-rules) and `frontend/DESIGN.md`
      (the brand DNA — don't write UI before reading it).
- [ ] Skim `docs/app/SYSTEM_OVERVIEW.md` and `docs/app/APP_ARCHITECTURE.md`.
- [ ] Make a trivial copy change on a feature branch, open a PR, watch CI
      run, see the Vercel preview deploy. That round-trip teaches you the
      whole pipeline.
- [ ] Bookmark `docs/ops/INCIDENT_RUNBOOK.md` for when something breaks.

Welcome aboard.

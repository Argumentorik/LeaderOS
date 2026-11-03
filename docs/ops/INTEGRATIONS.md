# Frontend integrations — CRA stack

Wiring spec for **PostHog (EU)**, **Sentry**, and **Supabase** in the
Create React App frontend at `frontend/`. All vars use the `REACT_APP_`
prefix that CRA requires for build-time injection.

---

## 1. PostHog — already wired

PostHog is loaded as an inline snippet in `frontend/public/index.html`
(EU host, project key `phc_xmMQne...`). Identity helpers live in
`frontend/src/lib/analytics.js` and are called from
`frontend/src/contexts/AuthContext.js`:

- `identifyByEmail(email)` on login + on `checkAuth()` rehydrate
- `resetIdentity()` on logout

The dedup key is `email_lower` — matches the contract in `docs/app/SCHEMA.md`.

**To verify after deploy:**

1. Open DevTools → Network on either domain.
2. Filter for `posthog`.
3. Capture requests should go to `https://eu.i.posthog.com/e/` (or
   `eu-assets.i.posthog.com` for the asset bundle).
4. After login, `posthog.alias` + `posthog.identify` requests fire with
   the lowercased email.

**Optional migration to env-driven init.** The inline script hardcodes
the key. To switch to `REACT_APP_POSTHOG_KEY`:

```bash
cd frontend && yarn add posthog-js
```

Then replace the inline `<script>` in `public/index.html` with:

```js
// src/lib/analytics.js
import posthog from 'posthog-js'

if (typeof window !== 'undefined' && process.env.REACT_APP_POSTHOG_KEY) {
  posthog.init(process.env.REACT_APP_POSTHOG_KEY, {
    api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    capture_pageleave: true,
  })
}
```

And update `identifyByEmail` / `resetIdentity` to use `posthog.alias` /
`posthog.identify` / `posthog.reset` directly instead of `window.posthog`.

---

## 2. Supabase — already wired

Backend talks to Supabase via the service role key (see `backend/.env.example`
and `backend/services_supabase_sync.py`). Frontend currently talks to the
backend at `/api/*`, not to Supabase directly.

If you ever wire the React frontend to Supabase directly (for Realtime, RLS-
gated queries, etc.):

```bash
cd frontend && yarn add @supabase/supabase-js
```

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)
```

Vars to add to `frontend/.env.example` and Vercel:

```
REACT_APP_SUPABASE_URL=https://srujvjjncrszhaaxepxf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

---

## 3. Sentry — already wired (host-based, one project per surface)

`@sentry/react` is in `frontend/package.json`. Init lives in
`frontend/src/index.js` and is **env-gated**: with no DSN set, the SDK stays
dormant and ships zero overhead beyond the import.

The same CRA bundle serves both surfaces, so the init code picks the right
project at runtime based on hostname:

```js
const isLeaderCheck = /(^|\.)leader-check\.de$/i.test(window.location.hostname);
const dsn = isLeaderCheck
  ? process.env.REACT_APP_SENTRY_DSN_LEADER_CHECK
  : process.env.REACT_APP_SENTRY_DSN_LEADER_OS;
```

Errors from `leader-check.de` (and `www.leader-check.de`) land in the
**leader-check** project; everything else (`leader-os.de`, `www.leader-os.de`,
previews, localhost) lands in **leader-os**.

User context is wired in `frontend/src/contexts/AuthContext.js`:
`Sentry.setUser({ email: emailLower })` on login + rehydrate,
`Sentry.setUser(null)` on logout — same `email_lower` key as PostHog. Works
across both projects (it's a global Sentry singleton).

### Sentry projects (org `aiporate`, EU region `de`)

| Project | Use | DSN |
|---|---|---|
| `leader-os` | Authenticated app + previews + localhost | `https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224` |
| `leader-check` | Funnel surface | `https://137256c15f1197642e09056bb224176d@o4511406606516224.ingest.de.sentry.io/4511407178448976` |
| ~~`javascript-nextjs`~~ | Vestigial from wizard — **delete** | — |

DSNs are public-by-design (they're baked into client JS); checking them into
`.env.example` is fine. Anyone with the DSN can submit events to the project,
so use Sentry's **Inbound Filters** (Settings → Filters) to drop noise.

### Env vars (Vercel, production scope)

```
REACT_APP_SENTRY_DSN_LEADER_OS=https://a7ea61a3...@o4511406606516224.ingest.de.sentry.io/4511407177990224
REACT_APP_SENTRY_DSN_LEADER_CHECK=https://137256c1...@o4511406606516224.ingest.de.sentry.io/4511407178448976
REACT_APP_SENTRY_ENV=production
```

CRA bakes env vars at **build time** — after setting these, you must
**redeploy** for them to take effect (Vercel → Deployments → Redeploy
latest mvpcode).

Backend Sentry (FastAPI) is on `claude/security-hardening-tonight` / PR #10
— uses `sentry-sdk` gated on `SENTRY_DSN` server-side env var. Same
host-based split isn't needed there (the backend only serves one origin).

### Source maps (optional, recommended)

To upload source maps so Sentry stack traces are readable, add Sentry's
webpack plugin or use the CLI in a build step. Out of scope for tonight's
launch; ship with minified traces first, add source maps in a follow-up.

---

## 4. Env vars — single reference

| Name                          | Where                | Notes                                     |
| ----------------------------- | -------------------- | ----------------------------------------- |
| `REACT_APP_BACKEND_URL`       | Vercel + local       | Local dev only; prod uses `/api/*` rewrite |
| `REACT_APP_SHOW_QUICK_LOGIN`  | Local dev only       | **NEVER set to `true` in production**     |
| `GENERATE_SOURCEMAP`          | Vercel (build)       | Keep `false`                              |
| `REACT_APP_POSTHOG_KEY`       | Vercel (future)      | Currently inlined in `index.html`         |
| `REACT_APP_POSTHOG_HOST`      | Vercel (future)      | `https://eu.i.posthog.com`                |
| `REACT_APP_SENTRY_DSN`        | Vercel (when wired)  | EU region (`*.ingest.de.sentry.io`)       |
| `REACT_APP_SENTRY_ENV`        | Vercel (when wired)  | `production` / `preview`                  |

Backend env vars are documented in `backend/.env.example`.

---

## 5. Pre-launch checklist (frontend side)

- [ ] Production branch in Vercel = `mvpcode`
- [ ] PostHog network requests go to `eu.i.posthog.com` (not US)
- [ ] `posthog.identify(emailLower)` fires on login + cached-user rehydrate
- [ ] `posthog.reset()` fires on logout
- [ ] `REACT_APP_SHOW_QUICK_LOGIN` is unset / `false` in production env
- [ ] Sentry installed + DSN set (when ready)
- [ ] CSP / `vercel.json` headers allow `eu.i.posthog.com`, `*.sentry.io`
      (currently no CSP header — fine, but if you add one later, don't break this)
- [ ] Database advisor green per `docs/ops/RUNBOOK.md`

---

## 6. Zernio — social posting API (backend / CLI only)

[Zernio](https://docs.zernio.com) schedules and publishes posts on connected
social accounts (LinkedIn, Instagram, …) through one REST API. We use it to
ship the carousel series from `docs/gtm/linkedin-carousels-01/` without
touching each platform's own API. Quickstart: `https://zernio.com/agent-quickstart.md`.

**Where it lives**

| Piece | File | Notes |
| ----- | ---- | ----- |
| REST client | `backend/services_zernio.py` | `httpx` against `https://zernio.com/api/v1`, bearer auth, no SDK. Validates platform limits before sending (LinkedIn: one PDF *or* up to 20 images; Instagram: up to 10 images). |
| CLI | `backend/scripts_post_carousel.py` | `accounts` (list connected accounts with their `accountId`), `show C01`, `post C01 --platform linkedin --account … --at 2026-10-28T07:30 [--tz Europe/Berlin] [--dry-run]`, `--now` to publish immediately. |
| Inputs | `docs/gtm/linkedin-carousels-01/manifest.json`, `CAPTIONS.md` | Public slide/PDF URLs under `leader-os.de/preview/carousels-01/`; caption per carousel. The "first comment" line is printed, not posted (set it by hand after publishing). |
| Tests | `backend/tests/test_zernio.py` | No network: `httpx.MockTransport`, caption parsing, payload validation, CLI dry-run. |

**Env**

| Name | Where | Notes |
| ---- | ----- | ----- |
| `ZERNIO_API_KEY` | Emergent backend env + local `.env` of whoever runs the CLI | Bearer token from the Zernio dashboard. **Never** a `REACT_APP_*` var, never in the repo, never in chat or tickets; rotate immediately if it was. Unset = the CLI only does `--dry-run`. |
| `ZERNIO_BASE_URL` | optional | Default `https://zernio.com/api/v1`. |

**Request shape we send** (from the Zernio docs, October 2026):

```json
{
  "content": "caption text",
  "platforms": [{ "platform": "linkedin", "accountId": "…" }],
  "mediaItems": [{ "url": "https://leader-os.de/preview/carousels-01/C01.pdf", "type": "document" }],
  "scheduledFor": "2026-10-28T07:30:00",
  "timezone": "Europe/Berlin"
}
```

`publishNow: true` replaces `scheduledFor` + `timezone`. Accounts are connected
once in the Zernio dashboard; their `accountId` comes from `GET /accounts`.

**Status:** the client and CLI are built against the documented API and covered
by offline tests. They have not yet been exercised against the live Zernio API
from this repo (the build sandbox cannot reach `zernio.com`). First real run:
`python3 scripts_post_carousel.py accounts`, then one `post … --dry-run`, then
one scheduled post, and check it in the Zernio dashboard.

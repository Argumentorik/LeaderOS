# Launch Handoff — Emergent-Side Setup + Go-Live Sequence

> **Status:** Vercel landing + Supabase newsletter live. Remaining: Emergent
> app deploys (leaderos.de + leadercheck.de), one extra Vercel domain
> mapping, DNS config, Supabase Auth allowlist. Order matters.

---

## Topology recap (canonical, do not deviate)

```
Mit Bindestrich     →  Landing (Marketing)  →  Vercel    →  shipos/mvpcode
Ohne Bindestrich    →  App (echte Action)   →  Emergent  →  Emergent-Projekt
```

| Host | Tier | Hosting | What lives there |
|---|---|---|---|
| `leader-os.de`      | Landing | **Vercel** (`leaderos` project) | Nike-DNA marketing landing, hero, pricing, newsletter footer |
| `leader-check.de`   | Landing | **Vercel** (`leaderos` project) | Diagnostic marketing landing (LeaderCheckLanding component, host-branched) |
| `leaderos.de`       | App     | **Emergent** | Login + Dashboard + WladBot + Coaching |
| `leadercheck.de`    | App     | **Emergent** | Diagnose quiz + score + lead-capture |

**Single-build, host-aware routing.** The same CRA build is deployed
on both Vercel and Emergent. `LandingPage.js` host-detects on mount:

- Host matches `leader-check.de`         → render `LeaderCheckLanding` (Diagnose marketing)
- Host matches `leaderos.de` / `leadercheck.de` → `Navigate to="/login"` (platform entry, no marketing)
- Anything else (incl. `leader-os.de`)   → render the main Sprint Landing

So `leaderos.de/` is the Login entry by design — no marketing fluff on
the App tier. `leader-os.de/` is the full marketing landing. The
sign-in routes (`/login`, `/auth/magic`, `/auth-callback`) work
identically on every host because they don't depend on the marketing
shell.

---

## Reference IDs (have these open in a tab)

| Thing | Value |
|---|---|
| GitHub repo | `aiporator/SHIPOS` |
| Production branch | `mvpcode` |
| Vercel project name | `leaderos` |
| Vercel project ID | `prj_j9cp8ln8HCzWWTmz6YAnsCLW5hYw` |
| Vercel team | `INHALE` (slug `aiporators-projects`, id `team_REqtA44VJGjfaqg3r5yxU6WX`) |
| Vercel project URL | https://vercel.com/aiporators-projects/leaderos |
| Vercel domain settings | https://vercel.com/aiporators-projects/leaderos/settings/domains |
| Supabase project ref | `srujvjjncrszhaaxepxf` (eu-north-1, Postgres 17) |
| Supabase URL | `https://srujvjjncrszhaaxepxf.supabase.co` |
| Supabase auth settings | Supabase Studio → Authentication → URL Configuration |
| Emergent backend (current proxy target in `vercel.json`) | `https://command-center-229.emergent.host/api/*` |

---

## What is already live (do not re-do)

- ✅ Vercel production deploy `dpl_BeSuzxe…` from SHA `dfe7dd4` (PR #94 merged) — READY
- ✅ Vercel domains mapped: `leader-os.de`, `www.leader-os.de`
- ✅ Supabase `newsletter_subscribers` table + RLS + indexes
- ✅ Supabase RPC `newsletter_can_send_doi` (anti-bombing guard)
- ✅ Supabase Edge Function `newsletter-subscribe` ACTIVE (verify_jwt=false)
- ✅ Supabase Edge Function `newsletter-confirm` ACTIVE (verify_jwt=false)
- ✅ Vercel rewrites: `/api/newsletter/*` → Supabase Edge Functions; `/api/*` → Emergent
- ✅ Per-host sitemap + robots split (leader-os.de vs leader-check.de)
- ✅ Hero discipline + GSAP scroll motion + em-dash purge across all visible copy
- ✅ ATF Sprint-specimen strip below hero + dual primary CTA (Diagnose free + Sprint €997)
- ✅ ClassScarcityBanner v2 (editorial single-line, no progress bar chrome)

## What blocks the actual go-live (do this in order)

### 1. Vercel — add the two Leader-Check Landing domains (2 min)

URL: https://vercel.com/aiporators-projects/leaderos/settings/domains

Add:
- `leader-check.de`
- `www.leader-check.de`

Vercel will match against the existing `76.76.21.21` A-record / `cname.vercel-dns.com` and validate automatically. Both should turn green within seconds. After that, hitting `https://leader-check.de/` will serve the React build and the `isLeaderCheckHost()` branch in `LandingPage.js` will render `LeaderCheckLanding`.

### 2. Emergent — set up the two app projects (the actual work)

Two separate Emergent projects, distinct content:

**Project A: `leaderos`** (the coaching app)
- Login + Magic Link + Supabase Auth callback
- Dashboard, Chat (WladBot), Tools, Missions, Coaching, Playbooks, Pricing checkout
- Stripe checkout → flows back to `/payment-success`
- Identity key: `email_lower` (already wired into the `public.users` trigger; just keep using the same Supabase project as the Landing)

**Project B: `leadercheck`** (the diagnose quiz)
- The 21-question KI / Rhetorik / EQ quiz
- Score calculation + result page
- Lead capture (writes to `public.users` with `meta_tags ['leader-check']` and `source_platform = 'leader-check'` — **not `'emergent'` like today**)

What I need from you for both Emergent projects:

| Setting | Value |
|---|---|
| `SUPABASE_URL` | `https://srujvjjncrszhaaxepxf.supabase.co` |
| `SUPABASE_ANON_KEY` | from Supabase Studio → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Studio → Settings → API (server-side only) |
| `RESEND_API_KEY` | already used by the Landing's Edge Functions; reuse it |
| `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | the existing live keys (Stripe webhook is already wired to Supabase: `stripe-webhook` Edge Function active) |
| Auth redirect → leaderos.de | `https://leaderos.de/auth-callback`, `https://leaderos.de/auth/magic` |

The Emergent projects need their custom domain settings to claim `leaderos.de` and `leadercheck.de`. They'll output a CNAME target (looks like `cname.emergent-router.com` or similar).

### 3. DNS — point the app hosts at Emergent (5 min, propagation up to 1h)

At your DNS provider (GoDaddy, Cloudflare, whatever), add:

| Host | Type | Value | TTL |
|---|---|---|---|
| `leaderos.de` | A or CNAME | (Emergent target from step 2) | 300 |
| `www.leaderos.de` | CNAME | (Emergent target from step 2) | 300 |
| `leadercheck.de` | A or CNAME | (Emergent target from step 2) | 300 |
| `www.leadercheck.de` | CNAME | (Emergent target from step 2) | 300 |

The Vercel-side hosts (`leader-os.de`, `www.leader-os.de`, `leader-check.de`, `www.leader-check.de`) keep their existing records:
- A: `76.76.21.21`
- CNAME (www): `cname.vercel-dns.com`

### 4. Supabase Auth — extend redirect-URL allowlist (1 min)

Supabase Studio → Authentication → URL Configuration → Redirect URLs:

```
https://leader-os.de/**
https://www.leader-os.de/**
https://leader-check.de/**
https://www.leader-check.de/**
https://leaderos.de/**
https://leadercheck.de/**
http://localhost:3000/**
```

Without these, magic-link auth bounces will fail with "Invalid redirect URL".

### 5. Emergent — fix the `source_platform` value (one-time data hygiene)

Surfaced during the data-sync audit: every user currently has
`source_platform = 'emergent'` even though the spec says
`'leader-check' | 'leader-os' | 'manual'`. Update each Emergent project's
user-insert code:

- Project A (`leaderos`) → set `source_platform = 'leader-os'`
- Project B (`leadercheck`) → set `source_platform = 'leader-check'`

The `meta_tags` array trigger in Postgres will continue to maintain the
"ever-touched" tags correctly. Only the first-touch attribution needs
the source-platform field.

### 6. Optional but recommended — redeploy `newsletter-subscribe` Edge Function

The anti-bombing RPC `newsletter_can_send_doi` is live in the database.
The function source in git already calls it (`b03b153`). The deployed
function is still v1 (without the RPC call). Either:

- Trigger a Supabase MCP redeploy from your local Claude Code session
  (the server-side approval that blocked it from this remote session
  may be reachable from your machine), OR
- `supabase functions deploy newsletter-subscribe --no-verify-jwt` from
  the local CLI after `supabase link --project-ref srujvjjncrszhaaxepxf`

Not launch-blocking. Resend's account-level limits cover single-victim
bombing at 50-spot launch scale.

### 7. Google Sign-In — wire up the OAuth client (10 min, blocks "Login mit Google")

The full Google login stack is already built and tested:

- **Backend**: `backend/services_oauth.py` (verifies the Google ID token via
  `google-auth`), `backend/routes/oauth.py` (`POST /auth/google/callback`
  + `GET /auth/providers`).
- **Frontend**: `frontend/src/components/auth/OAuthButtons.js`
  (`GoogleSignInButton` — loads Google Identity Services, runs One-Tap with
  popup fallback), gated by `/auth/providers` so the button only renders
  when the backend reports Google as configured.

Nothing to code. Three knobs to set:

**7a. Create the OAuth Client in Google Cloud Console** (5 min)

1. https://console.cloud.google.com/apis/credentials → *Create Credentials*
   → *OAuth client ID* → *Web application*
2. Authorized JavaScript origins:
   ```
   https://leaderos.de
   https://www.leaderos.de
   https://leadercheck.de
   https://www.leadercheck.de
   https://leader-os.de
   https://leader-check.de
   http://localhost:3000
   ```
3. Authorized redirect URIs: leave empty — we use the ID-token flow
   (`g_id_signin` / One-Tap), not the redirect flow.
4. Copy the **Client ID**. You do NOT need the client secret for the
   ID-token flow we use.

**7b. Set the env vars on Emergent** (1 min)

In each Emergent project that runs the FastAPI backend:

```
GOOGLE_CLIENT_ID=<the-client-id-from-7a>.apps.googleusercontent.com
FRONTEND_BASE_URL=https://leaderos.de        # leaderos Emergent project
# FRONTEND_BASE_URL=https://leadercheck.de   # leadercheck Emergent project
```

`GOOGLE_CLIENT_ID` unlocks both the `/auth/providers` response (so the
frontend renders the Google button) and the token-verification in
`POST /auth/google/callback`.

`FRONTEND_BASE_URL` controls the host that magic-link emails point to.
Without it, the default is `https://leaderos.de` — fine for the leaderos
project, **wrong for leadercheck** (where you must override to
`https://leadercheck.de`). The pre-fix default was `leader-os.de` (the
Vercel landing, which has no post-login surface), so any magic-link
mail sent before this commit landed users on the wrong tier.

**7c. Smoke-test** (2 min)

```bash
curl -s https://leaderos.de/api/auth/providers | jq
# Expect: { "providers": { "google": true, ... }, "google_client_id": "<id>...", ... }
```

Then open `https://leaderos.de/login` in an incognito window → the
"Mit Google fortfahren" button should render → click → Google popup
opens → on success you land on `/dashboard`.

> **Note:** there's no Apple/Microsoft setup blocker — same pattern,
> just set `APPLE_SERVICE_ID` / `MICROSOFT_CLIENT_ID` to enable them.
> Magic-link login works regardless (no provider config needed).

---

## Smoke-test sequence (run after each step)

### After step 1 (Vercel domains)

```bash
curl -sI https://leader-check.de/ | head -3
# Expect: HTTP/2 200, content-type text/html

curl -s https://leader-check.de/sitemap.xml | head -5
# Expect: <urlset> with leader-check.de URLs only (not leader-os.de)
```

### After step 2+3 (Emergent apps + DNS)

```bash
curl -sI https://leaderos.de/login | head -3
# Expect: 200 (Emergent serves the login page)

curl -sI https://leadercheck.de/ | head -3
# Expect: 200 (Emergent serves the quiz landing)
```

### After step 4 (Supabase Auth)

Open https://leaderos.de/login → enter your email → click the magic
link in the mail → should land on `/auth-callback` and bounce into
`/dashboard`. If you see "Invalid redirect URL", step 4 wasn't saved.

### Newsletter end-to-end (smoke-test once Vercel domain is live)

```bash
# 1. Subscribe via the landing's same-origin endpoint
curl -s -X POST https://leader-os.de/api/newsletter/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"yourname+launchcheck@gmail.com","source":"smoke-test","campaign":"go-live"}'
# Expect: {"ok":true}
# Expect: confirmation mail arrives in your inbox within 30s

# 2. Click the confirm link in the mail — should land on
#    https://leader-os.de/newsletter/confirmed?status=confirmed
#    (302 redirect from the Edge Function)

# 3. Verify DB state
# (Supabase Studio → newsletter_subscribers → newest row)
# status = 'active', confirmed_at set, source = 'smoke-test', campaign = 'go-live'
```

### Cross-platform identity stitch test

After all four hosts are live:
1. On `leadercheck.de`, complete the diagnose quiz with `you@example.com`
2. On `leaderos.de`, sign up with the SAME email
3. Query Supabase: `SELECT email_lower, meta_tags, source_platform FROM public.users WHERE email_lower = 'you@example.com';`
4. Expect: ONE row, `meta_tags = ['leader-check', 'leader-os']`, `source_platform = 'leader-check'` (first touch wins).

---

## Post-launch (Phase 2 work — not for go-live)

These are documented for the follow-up session, do not block launch:

- **Higgsfield-generated Wlad hero/OG imagery** — currently the fallback chain `WLAD_AVATAR_FALLBACKS` covers, but premium portraits would lift the hero
- **Newsletter Phase 2** — Resend bounce/complaint webhook into `email_suppressions`, dedicated unsubscribe endpoint
- **Content engine Phase 3** — `features/content/` registry, `/journal` route, three starter articles, RSS, content-sitemap
- **LeadCaptureModal vs footer EmailCapture conflict** — both fire on 50%-scroll, pick one
- **Emergent app re-platform decision** — eventually moving the app-tier into the same repo so a single deploy covers everything

---

## Rollback levers (if a launch step breaks production)

| Failure | Lever |
|---|---|
| Vercel domain validation fails | Remove the domain from project settings, the DNS record can stay |
| Emergent app down after DNS flip | Lower TTL beforehand (300s); if needed, swap CNAME back to the prior target |
| Supabase Auth redirect blocks login | Add the failing URL pattern to the allowlist (step 4), retry — no data loss |
| Newsletter Edge Function 500 | The function source is in git (`supabase/functions/newsletter-subscribe/`); roll back to v1 via Supabase Studio → Edge Functions → Deployments → Promote v1 |
| Vercel deploy regresses | `git revert` the offending commit on `mvpcode`, push; Vercel auto-deploys |

---

## What I can do remotely while you work on Emergent

- Watch a PR / branch for CI events (`subscribe_pr_activity`)
- Apply additional Supabase migrations (`apply_migration`)
- Deploy frontend code changes via PR → mvpcode merge
- Run Playwright smoke tests against any preview URL
- Add the LeadCaptureModal vs EmailCapture conflict fix
- Wire up the content engine Phase 3 scaffolding under `features/content/`

Tell me when you want any of those running in parallel with your Emergent work.

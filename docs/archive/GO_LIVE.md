# GO-LIVE Runbook — Leadership OS

> Single source of truth for tomorrow's launch.
> Architecture for v1: **Vercel** hosts the React frontend, **Emergent**
> hosts the FastAPI backend at `leader-os.de`, **MongoDB** is the system
> of record. Supabase stays as the WladHub sync sidecar it already is —
> the full Postgres migration is parked in `docs/SUPABASE_MIGRATION.md`.

---

## 0. Status snapshot before T-0

| Check | State | Evidence |
|---|---|---|
| Frontend builds on Vercel | ✅ verified | `dpl_HQd42CLjTY9QrVNwkKcGaN5WcC6U`, 89s, "Compiled successfully", `main.831fabaa.js` 429.3 kB |
| Backend tests pre-ship | ✅ 10/10 | `test_reports/iteration_77.json` |
| Frontend smoke tests | ✅ 35/35 | iter 77 — login, dashboard, chat, coaching, downloads, profile |
| Integrations (Mongo / GPT / ElevenLabs / Resend / Supabase / Calendly) | ✅ working | `SHIP_CHECKLIST.md` §4 |
| Stripe **Live** | ❌ test mode | Cutover step below |
| CI on PR #8 | ✅ all green | Vercel + GH Actions |
| Cron triggers | ✅ automated | `.github/workflows/cron.yml` |

---

## 0.5 Pre-flight (do this BEFORE the dashboard work)

Run from your laptop. If any step fails, **don't start the dashboard
changes** — fix the failure first.

```bash
# 1. Backend is alive (health + the two public endpoints the frontend
#    hits on first paint).
curl -sI https://leader-os.de/api/health            | head -1   # → HTTP/2 200
curl -sI https://leader-os.de/api/payments/packages | head -1   # → HTTP/2 200
curl -sI https://leader-os.de/api/voice/personas    | head -1   # → HTTP/2 200

# 2. The CI/CD train is green on PR #8's head.
gh pr checks 8        # all four lines should say "pass"

# 3. The latest Vercel preview is a real build, not the empty-deploy
#    bug we hit yesterday. Look for "Compiled successfully" and bundle
#    sizes (main bundle should be ~429 kB after gzip).
gh pr view 8 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name=="Vercel Preview Comments")'

# 4. Open the preview URL in a private browser window. Vercel
#    Deployment Protection will 403 unless you're signed into the team.
#    Sign in, then verify:
#    - /login renders, NO QuickLogin panel visible (env gate working).
#    - Register a throwaway, land on /dashboard.
#    - DevTools → Application → Cookies: session_token is HttpOnly+Secure.
#    - DevTools → Network: /api/payments/packages returns 200 (proves the
#      Vercel /api/* rewrite is wired to leader-os.de).
```

Preview URL pattern: `https://shipos-vuml-git-<branch>-aiporators-projects.vercel.app`
(see Vercel dashboard → Deployments for the exact hostname for the
current commit).

---

## 1. Pre-launch sequence (~30 min the night before)

### 1a. Vercel — Production environment variables

Vercel dashboard → `shipos-vuml` → Settings → Environment Variables.
Scope: **Production** (uncheck Preview/Development).

Paste-ready (one per row):

| Name | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://leader-os.de` |
| `GENERATE_SOURCEMAP` | `false` |

**Do not set** `REACT_APP_SHOW_QUICK_LOGIN`. If it's already there from a
preview-config copy, delete it on Production scope.

### 1b. Vercel — Disable Deployment Protection on Production

Settings → Deployment Protection → **Vercel Authentication: Off** for
Production. (Leave it on for Preview if you want preview URLs gated.)

### 1c. Vercel — Attach the production domain

Settings → Domains → add `leader-os.de` (or your chosen apex/subdomain).
DNS already points to the current host — switch the A/CNAME record per
Vercel's instructions. Plan a short DNS-propagation window (≤ 15 min in
practice with low TTLs).

> ⚠️ The backend ALSO answers at `leader-os.de` today. If you point the
> apex at Vercel, the backend needs to move to a separate host or
> sub-domain. Two clean options:
>
> 1. **Frontend on apex, backend on `api.leader-os.de`** — update
>    `frontend/vercel.json` rewrite destination + Emergent's domain
>    config. Cleanest.
> 2. **Frontend on `app.leader-os.de`, backend stays on apex** — no
>    backend changes. Marketing site can stay on apex too.
>
> Option 2 is the safer pre-launch move.
>
> **Why the `/api/*` rewrite, not direct cross-origin calls?** The
> backend sets a host-only `session_token` cookie (`HttpOnly`, `Secure`,
> `SameSite=Lax`, no `Domain` attr — see `backend/routes/auth.py:17`).
> Vercel's server-side rewrite makes every `/api/*` look same-origin to
> the browser, so the cookie ends up on the frontend host and is sent
> back on every subsequent request without needing CORS gymnastics. If
> you ever bypass the rewrite (e.g. call `https://leader-os.de` directly
> from the SPA), you'd need to add `Domain=.leader-os.de` to the cookie
> AND wire CORS preflight on every authenticated route. Not worth it.

### 1d. Stripe — Live cutover

In Stripe Dashboard:
1. Switch to **Live** mode.
2. Create 4 products with these IDs (must match `routes/payments.py`
   PACKAGES dict):
   - `leadership_os` — €997 EUR, one-time
   - `leadership_os_2x` — €550 EUR (first installment; cron handles the
     second)
   - `leadership_os_12x` — €99 EUR (first installment; cron handles 11
     more)
   - `leadership_os_plus` — €4 797 EUR, one-time
3. Register webhook → `https://leader-os.de/api/webhook/stripe`
   (or the new sub-domain if you went with option 1 above).
4. Copy the **live secret key** and **webhook signing secret**.

In Emergent → backend `.env`:
```
STRIPE_API_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…        # REQUIRED — webhook handler now does
                                     # native stripe-sdk signature validation.
                                     # Unset = warning logged, still works but
                                     # without our defense-in-depth check.
ENTERPRISE_LEAD_EMAIL=sales@leader-os.de
```
Then `sudo supervisorctl restart backend`.

### 1e. (Optional but recommended) Lock down the cron endpoints

```bash
openssl rand -hex 32   # generate
```
- Backend `.env`: `CRON_SHARED_SECRET=<the value>` → restart backend.
- GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
  - Name: `CRON_SHARED_SECRET`, value: same string.

The `.github/workflows/cron.yml` already forwards the header when the
secret is set; if it's unset, behaviour is unchanged.

### 1f. Test-user purge (do **after** Stripe is in Live mode)

```bash
mongosh "$MONGO_URL" --eval "use $DB_NAME; db.users.deleteMany({email: /@wladbot\.test$/}); db.user_sessions.deleteMany({user_id: {\$nin: db.users.distinct('user_id')}});"
```

### 1g. Merge PR #8

```
gh pr merge 8 --squash      # or via the GitHub UI
```
This is what makes Vercel build the production target.

### 1h. Sync Emergent backend with GitHub

Vercel auto-deploys the frontend on every push to `mvpcode`. Emergent
does **not** — it's a hosted dev environment, not a CD target. Backend
changes only reach `leader-os.de` when you pull them in on the Emergent
host.

```bash
# Inside the Emergent shell, from the repo root:
bash scripts/deploy-backend.sh
```

The script (added in this branch) is idempotent and safe:

- Refuses to run if there are uncommitted Emergent-side edits (so you
  can't accidentally clobber unsaved work).
- Fast-forward pulls `origin/mvpcode` only (no merge commits on the
  deploy host).
- Re-runs `pip install` **only if** `backend/requirements.txt` changed.
- Restarts the backend via supervisor.
- Polls `/api/health` and exits non-zero if the new build doesn't come
  back up within 10s.

Run it **once before launch** to guarantee the live backend is on the
same commit as GitHub, and again after any backend-touching PR
post-launch.

> ⚠️ Before the very first run, check for drift:
> ```bash
> git status                                              # any uncommitted Emergent edits?
> git fetch origin
> git log HEAD..origin/mvpcode --oneline                  # commits GitHub has, Emergent doesn't
> git log origin/mvpcode..HEAD --oneline                  # commits Emergent has, GitHub doesn't
> ```
> If the third command shows anything, **stop** — those commits exist
> only on Emergent. Commit & push them from inside Emergent first, then
> run the deploy script. Otherwise the fast-forward pull will reject.

---

## 2. Go-live smoke test (T-0, ~15 min)

Open the production URL (the new domain) and walk through:

1. **Anonymous landing** loads, no console errors, no QuickLogin panel.
2. **Register** a fresh real-email account → arrives on `/dashboard`,
   no `test123` in `localStorage`.
3. **Login** with that account → `/dashboard`. Cookie is `HttpOnly` +
   `Secure` (DevTools → Application → Cookies).
4. **Buy** `leadership_os` with a real card → Stripe success page →
   tier shows `leadership_os` on `/profile`.
5. **Webhook** event lands at `/api/webhook/stripe` (visible
   in Stripe → Developers → Events).
6. **Chat** sends a message → GPT response → no errors.
7. **Audio Mode** opens, mic permission granted, get a voice reply.
8. **Coaching** page shows €997 / €4 797 cards; Calendly opens.
9. **Downloads** page renders 4 PDF buttons; download works.
10. **Mobile** (iPhone or Android, real device): repeat #1, #2, #3, #7.

If any of these fail → revert PR #8 (`gh pr revert <merge sha>`) and
keep the previous Emergent deploy live while you fix.

---

## 3. Manual triggers you may want to test once

```bash
# verify the cron path end-to-end
gh workflow run cron-jobs --field job=installments-due
gh workflow run cron-jobs --field job=monthly-scorecard
# both should 200; check Resend dashboard for any test emails
```

---

## 4. Day-1 monitoring

For 24h after launch, watch:

- **Stripe → Events** for any `payment_intent.failed` or `dispute.*`.
- **Resend → Emails** for bounces.
- **Emergent backend logs** — tail `/var/log/supervisor/backend.err.log`
  for 4xx/5xx spikes.
- **MongoDB → `users`** count over time (sanity check sign-ups).
- **Browser console** on the production URL — no red, no CORS, no 404
  on `/api/*`.

---

## 5. Known gotchas to brief the team on

- **`REACT_APP_SHOW_QUICK_LOGIN`** is a foot-gun: if it ever lands on
  Production env it leaks test credentials publicly. Add it to your
  team's deploy-review checklist.
- **Audio Mode** requires a real microphone — headless monitoring
  can only verify UI, not voice.
- **PDF generation** runs client-side via jspdf + html2canvas; large
  reports can take 2-4 s. HTML fallback is wired.
- **Stripe webhook** is optional for happy-path because the success
  page polls `/api/payments/checkout/status/{session_id}`. The
  webhook is the safety net for closed-browser cases — register it
  before launch.
- **SmartPopups** are off on `/coaching`, `/payment-success`,
  `/downloads`, `/onboarding` (Iter 74).

---

## 6. Rollback (≤ 5 minutes)

Three failure modes, three reverts. Pick the smallest one that fixes
the symptom.

### 6a. Symptom: Vercel-served frontend is broken, backend is fine
DNS-level revert. In your DNS provider, point the production hostname
(`app.leader-os.de` or whichever you attached) **away** from Vercel and
back to the Emergent host. Propagation < 5 min with low TTLs. The
previous Emergent-served frontend keeps working unchanged.

If you cut the apex over to Vercel and that's what's broken: in Vercel
dashboard → Project → Domains → remove the apex assignment. The DNS
record still resolves to the Emergent host (assuming the A/CNAME wasn't
changed) — if it was, restore the previous record.

### 6b. Symptom: a regression slipped in via PR #8 merge
```bash
# Find the merge commit on mvpcode.
git fetch origin
MERGE_SHA=$(git log origin/mvpcode --merges --grep "#8" -n 1 --format=%H)
echo "$MERGE_SHA"

# Revert it.
git checkout mvpcode
git revert -m 1 "$MERGE_SHA"
git push origin mvpcode
```
Vercel will rebuild from the reverted `mvpcode` automatically.

### 6c. Symptom: backend on Emergent regressed after a `deploy-backend.sh` run
Roll back to the previous commit on the deploy host. The deploy script
prints the SHAs it moved between, e.g. `>> abc1234 -> def5678`.

```bash
# On Emergent:
cd /app   # or wherever the repo is
git reset --hard abc1234       # the OLD_SHA the script printed
sudo supervisorctl restart backend
curl -fsS http://127.0.0.1:8001/api/health
```
This is the one place destructive `git reset --hard` is OK — the
deploy host is a checkout, not a source of truth.

### 6d. Symptom: Stripe Live cutover misbehaving
In Emergent → backend `.env`: swap `STRIPE_API_KEY=sk_live_…` back to
the previous `sk_test_emergent`. Restart backend
(`sudo supervisorctl restart backend`). Customer charges queue up at
Stripe regardless; you can re-enable Live once you've fixed the
backend-side issue.

> If you need to communicate downtime: the previous Emergent deployment
> is still owned by you — nothing about today's launch removes that
> fallback. The Vercel deploy is purely additive until DNS cuts over.

---

## 7. What's parked for post-launch

- **Mongo → Postgres / Supabase Edge Functions migration** — there are
  unmerged branches (PRs #5, #6, #7 stacked on `claude/install-supabase-cli-Z8CF9`)
  that implement a Supabase-native rewrite of the backend. Roadmap and
  rationale in `docs/SUPABASE_MIGRATION.md`. Don't merge these today.
- **Bundle splitting** — every page is a static import in `App.js`,
  giving us a 429 kB main bundle. `React.lazy` per route would shave
  ~200 kB but is a real refactor.
- **Strict CSP** — baseline security headers are in place; a strict
  `Content-Security-Policy` needs a per-host inventory of Stripe,
  Calendly, ElevenLabs, etc. before it can be flipped on safely.
- **Sentry / PostHog** — only the env-var hook is needed once you have
  the keys; can wire in 30 min post-launch.

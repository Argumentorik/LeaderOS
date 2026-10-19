# 🚀 LEADERSHIP OS — SHIP-CHECKLIST (Iter 74)

> Snapshot: `2026-02-07` · Status: **READY TO SHIP** ✅

---

## 1️⃣ Pricing Structure (NEU)

| Tier | Preis | Dauer | Highlights |
|------|-------|-------|------------|
| **Free** | €0 | Lifetime | Limited Sims, 14 Tage Challenge |
| **Leadership OS** | **€997 / Jahr** | 365 Tage | 12 Videokurse Drip · KI-Coach 24/7 · Audio-Mode · 30-Tage Money-Back |
| **Leadership OS** · 2× Rate | 2× 550€ = **1.100€** | 365 Tage | +103€ Aufschlag |
| **Leadership OS** · 12× Rate | 12× 99€ = **1.188€** | 365 Tage | +191€ Aufschlag |
| **Leadership OS PLUS** | **€4.797 / Jahr** | 365 Tage | Alles aus OS + 12× 1:1 Coaching mit Argumentorik-Coaches (Wert 3.588€) |
| **Leadership OS Enterprise** | Auf Anfrage | 365 Tage | B2B · Volume-Discount 10–50% (5/10/20/50/100/200 MA Schwellen) |

---

## 2️⃣ Stripe Setup

**Aktueller Status:** Test-Mode (`STRIPE_API_KEY=sk_test_emergent`) ✅

**Vor Live-Schaltung erforderlich:**
1. In Stripe Dashboard 4 Products + Prices anlegen:
   - `leadership_os` → 997€ EUR one-time
   - `leadership_os_2x` → 550€ EUR (Rate 1, Folge-Raten via Cron)
   - `leadership_os_12x` → 99€ EUR (Rate 1, Folge-Raten via Cron)
   - `leadership_os_plus` → 4797€ EUR one-time
2. Live-Key in `/app/backend/.env`: `STRIPE_API_KEY=sk_live_…`
3. Webhook-URL in Stripe registrieren: `https://leader-os.de/api/webhook/stripe`
4. Webhook-Signature speichern (für künftige Härtung)
5. Backend reload: `sudo supervisorctl restart backend`

**Cron-Jobs (täglich extern triggern):**
- `POST /api/cron/installments-due` → mailt fällige Folge-Raten an OS-Raten-Käufer
- `POST /api/cron/monthly-scorecard` → mailt monatlichen Leadership-Report an PLUS-User

---

## 3️⃣ Environment Variables (alle gesetzt ✅)

### Backend `/app/backend/.env`
```
MONGO_URL=***                        # Production MongoDB
DB_NAME=***                          # Database name
EMERGENT_LLM_KEY=***                 # GPT-5.2 + Whisper + Image Gen (Universal Key)
ELEVENLABS_API_KEY=***               # Voice cloning für Audio-Mode + Challengers
STRIPE_API_KEY=***                   # ⚠️ TEST-MODE — vor Launch auf Live umstellen
RESEND_API_KEY=***                   # Email Service
SENDER_EMAIL=reminders@leader-os.de  # Verified domain
SUPABASE_URL=***
SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_KEY=***
```

### Optional zu ergänzen
```
ENTERPRISE_LEAD_EMAIL=sales@leader-os.de   # Lead-Notifications (fällt sonst auf SENDER_EMAIL)
```

### Frontend `/app/frontend/.env`
```
REACT_APP_BACKEND_URL=https://leader-os.de
```

---

## 4️⃣ Integration Health

| Service | Status | Verwendung |
|---------|--------|-----------|
| **MongoDB** | ✅ RUNNING | Users, Sessions, Tier, Payments, Chat, Voice-Cache |
| **Stripe (Test)** | ✅ Working | Checkout, Webhooks, Installment Cron |
| **OpenAI GPT-5.2** | ✅ Working | WladBot Chat (Emergent LLM Key) |
| **OpenAI Whisper** | ✅ Working | Voice-Mode + Video-Mission Transkription |
| **ElevenLabs** | ✅ Working | Wlad Voice (Audio-Mode) + 8 Challenger Voices |
| **Resend Email** | ✅ Working | Welcome, Installment, Scorecard, Enterprise-Lead |
| **Supabase** | ✅ Working | WladHub bi-direktionaler Sync (`leadership_insights`) |
| **Calendly** | ✅ Embed | Coach-Booking auf `/coaching` |

---

## 5️⃣ Key API Endpoints

### Public
- `GET /api/payments/packages` — Liste aller buchbaren Pakete
- `GET /api/payments/tiers` — Komplette Feature-Matrix
- `POST /api/payments/enterprise/quote` — Live-Preisrechner (seats → total)
- `POST /api/payments/enterprise/lead` — Lead-Form mit Email-Notification

### Authenticated
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` (HttpOnly-Cookies)
- `GET /api/user/tier` — Aktueller Tier des Users mit Features + Installment-Info
- `POST /api/payments/checkout` — Stripe-Session für ein Paket erzeugen
- `POST /api/payments/installment/next` — Folge-Rate triggern
- `POST /api/chat` · `POST /api/voice/conversation` (NEU Audio-Mode)
- `POST /api/video/upload` (Mission-Aufnahme + Whisper + GPT-Analyse)

### Admin
- `POST /api/cron/installments-due` (täglich)
- `POST /api/cron/monthly-scorecard` (monatlich, 1.)
- `GET /api/admin/auth-health` (Auth-Monitoring-Widget)

---

## 6️⃣ DB Collections (production)

| Collection | Schlüssel-Felder | TTL/Index |
|-----------|------------------|-----------|
| `users` | `user_id`, `email` (case-insensitive unique), `tier`, `xp` | Index on email + xp |
| `user_sessions` | `session_token`, `expires_at` | TTL 7 Tage |
| `payment_transactions` | `session_id`, `package_id`, `payment_status` | – |
| `installment_plans` | `user_id`, `plan_id`, `installments_paid`, `next_due_date` | – |
| `enterprise_leads` | `lead_id`, `company`, `seats`, `quote` | – |
| `chat_messages` · `chat_sessions` | `session_id`, `mode` | – |
| `voice_cache` | `cache_key` (hash), `audio_b64` | – |
| `video_drip_schedule` | `user_id`, `tier`, `total_courses` | NEU Iter 74 |

---

## 7️⃣ Frontend Routes

```
/login · /onboarding · /dashboard · /chat · /tools · /simulations
/missions · /challengers · /tasks · /playbooks · /events · /my-path
/community · /admin · /coaching (NEU 3-Tier) · /downloads (NEU PDF-Center)
/payment-success · /referral · /profile · /enterprise · /30-tage-challenge
```

---

## 8️⃣ Known Gotchas

- **Audio-Mode** braucht echtes Mikrofon — Headless-Tests können nur UI-Rendering verifizieren.
- **PDF-Generation** läuft browser-side (jsPDF + html2canvas) — bei großen Reports kann es 2–4 Sekunden dauern. Fallback auf HTML-Download bei Fehler ist eingebaut.
- **Stripe-Webhook** ist optional — Aktivierung erfolgt automatisch beim Polling von `/api/payments/checkout/status/{session_id}`. Für robustere Production sollte echter Webhook in Stripe registriert werden.
- **SmartPopups** sind seit Iter 74 auf `/coaching`, `/payment-success`, `/downloads`, `/onboarding` deaktiviert (kein Conversion-Block).
- **Legacy Tiers**: `starter` ist deprecated. Alte User mit `tier="starter"` werden via `_normalize_tier_name()` auf `free` gemappt.

---

## 9️⃣ Files of Reference (Iter 74)

### Backend
- `/app/backend/services_tier.py` (TIER_CONFIG, calc_enterprise_quote, activate_tier mit installment_plan_id)
- `/app/backend/routes/payments.py` (PACKAGES + LEGACY_PACKAGES, /enterprise/quote, /enterprise/lead, EnterpriseLead Model mit Email-Validation)
- `/app/backend/routes/voice_tts.py` (Audio-Mode Endpoint)

### Frontend
- `/app/frontend/src/components/coaching/TierPricingGrid.js` (3 Karten)
- `/app/frontend/src/components/coaching/LeadershipOSInstallmentModal.js` (2× und 12× Pläne)
- `/app/frontend/src/components/coaching/EnterpriseQuoteModal.js` (Live-Calculator + Lead-Form)
- `/app/frontend/src/pages/DownloadsPage.js` (4 PDF-Resources)
- `/app/frontend/src/lib/reportGenerator.js` (jsPDF + html2canvas)
- `/app/frontend/src/components/shared/SmartPopups.js` (Path-Blocking)
- `/app/frontend/src/components/layout/Sidebar.js` (neuer Downloads-Link)
- `/app/frontend/src/App.js` (`/downloads` Route)

---

## 🏁 Pre-Launch Checklist

> **The authoritative tomorrow-launch runbook is `docs/GO_LIVE.md`.**
> This list mirrors it for at-a-glance status.

Done in code (verified):
- [x] **Login-Page polish (Iter 77)** — a11y, autoComplete, mobile keyboard hints, Loader2, env-gated QuickLogin.
- [x] **Frontend Vercel build** — `dpl_HQd42CLjTY9QrVNwkKcGaN5WcC6U` "Compiled successfully", `main.831fabaa.js` 429.3 kB. Repo-root `vercel.json` runs `cd frontend && yarn install --frozen-lockfile && yarn build`.
- [x] **CI on every PR** — `.github/workflows/ci.yml` (frontend build + backend `compileall`).
- [x] **Cron automation** — `.github/workflows/cron.yml` POSTs both endpoints; idempotent dedup makes drift safe.
- [x] **Cron auth (opt-in)** — `CRON_SHARED_SECRET` plumbing on backend + workflow.
- [x] **Security headers on Vercel** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- [x] **Final regression** — `test_reports/iteration_77.json` (Backend 10/10 · Frontend 35/35).
- [x] **DNS verified** on `leader-os.de` (currently pointing at Emergent host).

Dashboard / external work (only you can do these — see `docs/GO_LIVE.md` for exact steps):
- [ ] Vercel: set Production env vars (`REACT_APP_BACKEND_URL`, no `REACT_APP_SHOW_QUICK_LOGIN`, `GENERATE_SOURCEMAP=false`).
- [ ] Vercel: disable Deployment Protection on Production.
- [ ] Vercel: attach production domain (recommend `app.leader-os.de` so backend keeps the apex — see GO_LIVE §1c).
- [ ] Stripe: switch to Live, create 4 products, register webhook, paste `sk_live_*` into backend `.env`.
- [ ] Backend `.env`: set `ENTERPRISE_LEAD_EMAIL` (and optionally `CRON_SHARED_SECRET` + the matching GH Actions secret).
- [ ] Mongo: `db.users.deleteMany({email: /@wladbot\.test$/})` (after Stripe is live).
- [ ] Real-device mobile test for Audio-Mode (Chrome iOS + Android).
- [ ] One real test payment end-to-end; confirm webhook received in Stripe → Events.
- [ ] Optional: Sentry / PostHog signup.
- [ ] Merge PR #8 to trigger the production Vercel build.
- [ ] Optional: Sentry/PostHog für Error-Tracking + Conversion-Funnel

**Du kannst die App jetzt produktiv ausspielen.** 🚀

---

## 🔟 Vercel Deploy (Frontend only)

The FastAPI backend continues to run on `leader-os.de` (MongoDB-bound,
not a fit for Vercel serverless without a rewrite). Vercel hosts only
the CRA frontend; the repo-root `vercel.json` cd's into `frontend/`,
runs `yarn build`, serves `frontend/build/`, and rewrites `/api/*` to
the existing backend so `src/lib/api.js`'s same-origin path keeps
working.

**Setup (one time, in Vercel dashboard):**
1. Import the GitHub repo.
2. Leave **Root Directory** as the repo root — `vercel.json` handles
   the cd-into-frontend dance. (If you prefer setting Root Directory =
   `frontend`, move `vercel.json` into that folder and drop the cd
   prefix from the install/build commands.)
3. Environment variables (Production scope):
   - `REACT_APP_BACKEND_URL=https://leader-os.de`
   - `REACT_APP_SHOW_QUICK_LOGIN` → **leave UNSET** (or `false`).
   - `GENERATE_SOURCEMAP=false`
4. **Deployment Protection** → disable Vercel Authentication on
   Preview if you want shareable preview URLs (currently 403s
   externally — Team SSO is on by default).
5. Deploy. Vercel runs `cd frontend && yarn install --frozen-lockfile
   && yarn build` and serves `frontend/build/`.

**Local trial without GitHub:**
```
cd frontend
npx vercel        # link the project (interactive)
npx vercel --prod # ship a production build
```

**DNS:** point `leader-os.de` apex/`www` at Vercel only if the backend
gets moved; otherwise add a Vercel preview/alt domain so the FastAPI
host keeps owning `leader-os.de`.

**Backend on Vercel?** Not in scope here. The current FastAPI app
relies on a long-lived MongoDB connection and Stripe webhooks — porting
to Vercel Functions would require splitting routes into `api/*.py`
handlers and externalising the Mongo client. Track separately.

**Cron-Triggers:** `.github/workflows/cron.yml` POSTs the two endpoints
from §2 on the documented schedule. Free GitHub Actions cron is at-most-
once with up-to-15-minute drift; both endpoints are idempotent (dedup
via `email_log`) so duplicates are safe. Override the backend host with
the repo variable `BACKEND_URL` if needed; manual runs available via
**Actions → cron-jobs → Run workflow**.

**CI:** `.github/workflows/ci.yml` runs `yarn build` on every PR with
the same env Vercel uses, so a red CI signals a red Vercel deploy
before merge.

**Removed dep:** `@emergentbase/visual-edits` was pulled — its private
tarball 403'd outside Emergent's infra and broke `yarn install` on
Vercel/CI. `craco.config.js` already wraps the require in a
MODULE_NOT_FOUND try/catch, so dev still warns gracefully on hosts
that don't have it.


# 🚀 Claude Code Handoff — LeaderOS / WladBot Go-Live

**Übergabezeitpunkt**: Iter 80 finalisiert. Pod-State sauber. Bereit für GitHub-Sync + Sentry/PostHog Live-Switch via Claude Code.

---

## 1. Aktueller Pod-State (Emergent /app)

- **Branch**: `main` @ `8116e29` (working tree clean)
- **Kein `origin` Remote konfiguriert** (Emergent-Pods haben das nicht von Haus aus)
- **Lokale Files seit Iter 80 (a99ea52)**:
  - `.emergent/emergent.yml` — Pod-Job-Metadata (Auto-Update)
  - `.gitignore` — neu, schützt `memory/test_credentials.md`, `node_modules/`, etc.
  - `scripts/deploy-backend.sh` — neu, von Iter 80.1 erstellt (siehe unten)

## 2. Was in Iter 80 gemacht wurde (Pod hat diese Änderungen)

### Admin-Lockdown (3-fach defence-in-depth)
- `frontend/src/components/layout/Sidebar.js` — `isAdmin = Boolean(user?.is_admin)` Gate, Admin-Link wird NICHT gerendert für Non-Admins (nicht nur CSS-hidden)
- `frontend/src/pages/AdminPage.js` — `blockNonAdmin` redirected via `<Navigate to="/dashboard" replace />` BEVOR Admin-API-Calls fliegen
- `backend/routes/admin.py` — `require_admin()` returnt 403 für alles außer `ADMIN_EMAILS` Whitelist + `is_admin=true` Users

### leader-check.de Migration (alle `wladhub.com` → `https://leader-check.de`)
- Frontend (9 Stellen): `Sidebar.js`, `WladHubEmptyState.js`, `WladHubUpgradeCta.js`, `WladHubHeader.js`, `WladHubCard.js`, `DashboardPage.js`, `ReferralPage.js` (2×), `OnboardingPage.js`
- Frontend Mailto: `CoachingPage.js` → `support@leader-os.de`
- Backend: `routes/wladhub.py` (message + wladhub_url), `routes/referral.py` (share_url), `services_tier.py` (Kommentar)
- Alle `window.open` mit `noopener,noreferrer`

### JWT_SECRET Hardening
- `backend/.env` — `JWT_SECRET` (64-char `secrets.token_urlsafe(64)`)
- `backend/config.py` — `RuntimeError` beim Boot, wenn `JWT_SECRET` fehlt (fail-fast statt silent-500-on-every-login)

### Iter 80.1 Add (Pod-only, evtl. nicht auf GitHub `mvpcode`)
- `scripts/deploy-backend.sh` — Deploy-Script mit `git pull --ff-only` + `pip install` + `supervisorctl restart` + `/api/health` curl
- `.gitignore` — Standard-Set

## 3. Aktuelle backend/.env Keys (Werte redacted)

```
MONGO_URL                  → MongoDB Connection (do not change)
DB_NAME                    → MongoDB DB-Name (do not change)
EMERGENT_LLM_KEY           → Emergent Universal Key (OpenAI + Anthropic + Gemini)
RESEND_API_KEY             → Live Resend Key (reminders@leader-os.de verified)
SENDER_EMAIL=reminders@leader-os.de
SUPABASE_URL               → https://srujvjjncrszhaaxepxf.supabase.co
SUPABASE_ANON_KEY          → Public anon JWT
SUPABASE_SERVICE_KEY       → Server-side role JWT
ELEVENLABS_API_KEY         → ElevenLabs (Wlad voice clone)
STRIPE_API_KEY             → ⚠️ TEST KEY (sk_test_...) — switch to LIVE before go-live
INBOUND_SYNC_SECRET        → 64-char urlsafe shared secret (Supabase → Mongo)
SUPABASE_OUTBOUND_SECRET   → 64-char shared secret (Mongo → Supabase)
SUPABASE_USER_MIRROR_URL   → https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/user-mirror
JWT_SECRET                 → 64-char urlsafe (set Iter 80, fail-fast on missing)
```

## 4. ❌ Was FEHLT für Go-Live (Sentry + PostHog + Stripe Live)

### Sentry
- ❌ `sentry-sdk[fastapi]` nicht in `backend/requirements.txt`
- ❌ `@sentry/react` nicht in `frontend/package.json`
- ❌ Keine `sentry_sdk.init(...)` in `backend/server.py`
- ❌ Keine `Sentry.init(...)` in `frontend/src/index.js`
- ❌ ENV: `SENTRY_DSN` (Backend) + `REACT_APP_SENTRY_DSN` (Frontend) nicht gesetzt
- **User hat DSN bereit**: `https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224` (Region: **EU/Germany**)

### PostHog
- ❌ `posthog-js` nicht in `frontend/package.json`
- ❌ Keine `posthog.init(...)` in `frontend/src/index.js` oder `AuthContext.js`
- ❌ ENV: `REACT_APP_POSTHOG_KEY` + `REACT_APP_POSTHOG_HOST` nicht gesetzt
- **TBD**: PostHog Project-Key + Region (EU=`https://eu.i.posthog.com` / US=`https://us.i.posthog.com`)

### Stripe Live
- ⚠️ Aktuell **TEST KEY** (`sk_test_...`) in `backend/.env`
- ❌ `STRIPE_WEBHOOK_SECRET` nicht gesetzt
- ❌ Live-Produkte im Stripe Dashboard erstellt? (`leadership_os` €997, `leadership_os_2x` 2×€550, `leadership_os_12x` 12×€99, `leadership_os_plus` €4.797)
- ❌ Webhook Endpoint `https://leader-os.de/api/payments/webhook/stripe` registriert?
- ❌ `construct_event(...)` Webhook-Verify in `backend/routes/payments.py`? (Vermutlich auf GitHub PR #10/#14/#15 erledigt — Pod hat es nicht)

## 5. ⚠️ Bekannte Divergenz Pod ↔ GitHub `mvpcode`

User hat bestätigt: **GitHub `mvpcode` enthält Iter 80 + PR #10 + PR #14 + PR #15** mit:
- ✅ Sentry SDK Init Backend
- ✅ Stripe `construct_event` Webhook-Verify
- ✅ Sentry Init Frontend
- ✅ Vermutlich PostHog Frontend

**Pod hat das alles NOCH NICHT** — UI-Pull war geplant ("Pull from GitHub" via Emergent-Chat-Input GitHub-Icon), aber User entscheidet sich, das in Claude Code zu finalisieren.

## 6. ✅ Verifikations-Commands für Claude Code (nach Pull)

```bash
# Nach git pull mvpcode → diese sollten alle MATCH liefern:
grep -n "sentry_sdk" /app/backend/server.py
grep -n "construct_event" /app/backend/routes/payments.py
grep -n "posthog\|REACT_APP_POSTHOG\|REACT_APP_SENTRY" /app/frontend/src/index.js
grep -l "admin" /app/backend/routes/admin.py     # Iter 80 must survive

# Smoke-Test Backend:
curl -fsS http://127.0.0.1:8001/api/health
curl -fsS -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 7. 🎯 Empfohlene Reihenfolge in Claude Code

```bash
# 1. PAT setzen (NICHT in Git committen!)
export GITHUB_PAT="ghp_xxx"   # User stellt selbst bereit

# 2. Origin Remote hinzufügen + Branch holen
cd /app
git remote add origin "https://${GITHUB_PAT}@github.com/aiporator/SHIPOS.git"
git fetch origin mvpcode
git checkout -B mvpcode origin/mvpcode

# 3. Dependencies updaten
pip install -r backend/requirements.txt
cd frontend && yarn install && cd ..

# 4. ENV Vars setzen (in /app/backend/.env appenden)
cat >> /app/backend/.env <<'EOF'
SENTRY_DSN=https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXX
EOF

# 5. Falls frontend Sentry/PostHog hat: /app/frontend/.env appenden
cat >> /app/frontend/.env <<'EOF'
REACT_APP_SENTRY_DSN=https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224
REACT_APP_POSTHOG_KEY=phc_XXXXXXXXXX
REACT_APP_POSTHOG_HOST=https://eu.i.posthog.com
EOF

# 6. Restart + Healthcheck
sudo supervisorctl restart backend
sleep 3
curl -fsS http://127.0.0.1:8001/api/health
# Expect: HTTP 200

# 7. Stripe Live-Key Switch (NACH Webhook-Test mit Test-Key!)
# In /app/backend/.env: STRIPE_API_KEY=sk_live_...
# Im Stripe Dashboard:
#   - 4 Produkte mit obigen IDs anlegen
#   - Webhook auf https://leader-os.de/api/payments/webhook/stripe registrieren
#   - Events: checkout.session.completed, invoice.paid, invoice.payment_failed
#   - Whsec-Secret in STRIPE_WEBHOOK_SECRET einsetzen
```

## 8. 📊 Test-Credentials (für Smoke-Test nach Pull)

```
Admin:        test@test.com / test123       (ADMIN_EMAILS Whitelist)
Non-Admin:    standard@wladbot.test / test123
Free-User:    free@wladbot.test / test123
Accelerator:  accelerator@wladbot.test / test123
```

**Smoke-Test Erwartung nach Pull**:
- Admin-Login → `/admin` zugänglich, Sidebar zeigt "Admin Panel"
- Non-Admin-Login → `/admin` redirected zu `/dashboard`, Sidebar zeigt KEIN "Admin Panel"
- Sidebar-Diagnose-Button → `https://leader-check.de` (nicht wladhub.com)

## 9. 🔥 Final Pre-Launch-Checkliste

- [ ] PR #10, #14, #15 im Pod (`git pull mvpcode`)
- [ ] `pip install` durch (sentry-sdk neu)
- [ ] `yarn install` durch (@sentry/react, posthog-js neu)
- [ ] `SENTRY_DSN` in backend/.env
- [ ] `REACT_APP_SENTRY_DSN` + `REACT_APP_POSTHOG_KEY` in frontend/.env
- [ ] `STRIPE_WEBHOOK_SECRET` aus Stripe-Dashboard kopiert
- [ ] **Stripe LIVE Key** statt Test-Key (NACH erstem Webhook-Test)
- [ ] 4 Live-Produkte in Stripe Dashboard erstellt
- [ ] Webhook-Endpoint `https://leader-os.de/api/payments/webhook/stripe` in Stripe registriert
- [ ] `supervisorctl restart backend` + `curl /api/health` → 200
- [ ] Test-Login mit Admin + Non-Admin
- [ ] Test-Stripe-Checkout mit Live-Key (echte Karte, 1€ refundable)
- [ ] Sentry-Dashboard zeigt Test-Event (manuell `Sentry.captureMessage("hello")`)
- [ ] PostHog-Dashboard zeigt `$pageview` Event
- [ ] Externer Cron `/api/cron/installments-due` (täglich 09:00) — z.B. cron-job.org
- [ ] Externer Cron `/api/cron/monthly-scorecard` (1. des Monats)
- [ ] Test-User in MongoDB löschen: `db.users.deleteMany({email: /@wladbot.test$/})`

## 10. Bekannte Risiken & Tipps

- ⚠️ **JWT_SECRET-Wechsel** ungültigt alle bestehenden Sessions. User müssen sich nach Deploy einmal neu einloggen.
- ⚠️ **`scripts/deploy-backend.sh`** funktioniert NUR auf einem Server mit `origin`-Remote zu GitHub. Im Emergent-Pod fehlt das standardmäßig → Script wird `exit 2` werfen, wenn ohne PAT/Remote ausgeführt.
- 💡 **Sentry Sample-Rate**: Empfehlung `traces_sample_rate=0.2` (20% Performance-Traces), `profiles_sample_rate=0.1`. Sonst Quota schnell aufgebraucht.
- 💡 **PostHog Auto-Capture**: Beim init `autocapture: false` UND eigene Events tracken → saubere Funnel-Daten. Sonst spamt Auto-Capture mit jedem Button-Klick.
- 💡 **EU-Region wählen** für DSGVO: Sentry-DSN ist bereits `ingest.de.sentry.io` ✅. PostHog `https://eu.i.posthog.com` ✅.

---

**Quick-Start in Claude Code:**

```bash
cat /app/CLAUDE_CODE_HANDOFF.md
# → Reihenfolge in Section 7 abarbeiten
# → Final Checkliste in Section 9 abhaken
```

Viel Erfolg beim Launch! 🚀

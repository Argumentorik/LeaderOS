# Production Readiness · 10k Users

> Iter 92.12 · Pre-Launch Audit für Mert. Status-Snapshot 26.02.26.
>
> **Update 2026-06-25**: Section 0 below is the single answer to
> "is this thing production-grade or vibe-coded?" — every row has a
> code reference so the claim can be verified, not just believed.

---

## 0. Production Receipts — every claim with `file:line` evidence

The 10k-user sizing notes from Section 1+ assume the foundation is
sound. This section catalogs the foundation itself: security posture,
reliability nets, observability stack, CI gates. Anything not in this
section is fair game to call vibe-coded.

### 0.1 · Security (code-path)

| Concern                          | Implementation                                                                                                  | Evidence                                                            |
|---                               |---                                                                                                              |---                                                                  |
| HTTPS enforced                   | HSTS `max-age=31536000; includeSubDomains` on every HTTPS response                                              | `backend/middleware/__init__.py:105`                                |
| CSP                              | Tight `Content-Security-Policy` allowlist for script/style/img/frame/connect — locked to the providers we use   | `backend/middleware/__init__.py:108-150`                            |
| Clickjacking                     | `X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`                                                    | `backend/middleware/__init__.py:90`                                 |
| MIME sniffing                    | `X-Content-Type-Options: nosniff`                                                                               | `backend/middleware/__init__.py:93`                                 |
| Referrer leakage                 | `Referrer-Policy: strict-origin-when-cross-origin`                                                              | `backend/middleware/__init__.py:99`                                 |
| Browser feature lockdown         | `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=()`                                  | `backend/middleware/__init__.py:102`                                |
| Session cookies                  | `HttpOnly + Secure + SameSite=Lax + max-age=7d`                                                                 | `backend/routes/auth.py:48-55`                                      |
| JWT                              | HS256, 7-day exp, 10s leeway, signed with env `JWT_SECRET` (refuse-to-start if missing)                         | `backend/services.py:14-20` · `backend/config.py:16-21`             |
| Password hashing                 | bcrypt cost 12                                                                                                  | `backend/services.py:23-28`                                         |
| Magic-link tokens                | 48-byte URL-safe via `secrets.token_urlsafe(48)`, SHA-256 stored (never the raw token), 15-min TTL, single-use via atomic find-and-update | `backend/services_magic_link.py:72-103`                             |
| Magic-link supersede             | Issuing a new link invalidates all prior unused links for that email                                            | `backend/services_magic_link.py:74-78`                              |
| OAuth ID-token verify            | Google/Apple/Microsoft via JWKS · validates iss/aud/exp/email_verified                                          | `backend/services_oauth.py`                                         |
| Anti-enumeration on magic-link   | Always returns 200 with a generic message regardless of whether the email is registered                         | `backend/routes/auth.py:584`                                        |
| Brute-force on password login    | 10 failed attempts per (email, ip) per 15 min → 429                                                             | `backend/routes/auth.py:58-76`                                      |
| Rate limits on magic-link        | 5 requests per (email, ip) per 15 min → 429                                                                     | `backend/routes/auth.py:564-571`                                    |
| Global rate limits               | 20 req/min IP on auth · 20 req/min IP on chat/analyze · 120 req/min IP on `/api/*` baseline                     | `backend/middleware/__init__.py:10-72`                              |
| CORS allowlist                   | Explicit allowlist via `CORS_ORIGINS` env (regex `.*` with credentials only when unset, dev-only)               | `backend/server.py:192-208`                                         |
| Input validation                 | Pydantic models on every route body · `EmailStr` for email · typed parameters everywhere                       | every file in `backend/routes/`                                     |
| Mongo injection                  | All queries use safe dict params (no string concat) · Motor sanitizes                                          | every Mongo call in `backend/routes/`                               |
| Stripe webhook                   | Signature verify + `idempotency_keys` table + event-type allowlist (`checkout.session.completed`, `customer.subscription.*`, `invoice.paid/failed`) | `supabase/functions/stripe-webhook/index.ts:294-360`                |
| Secret management                | All secrets via `os.environ.get` · never hardcoded · JWT_SECRET refuses to boot if missing                     | `backend/config.py:14-21`                                           |
| Secret-leak scan in CI           | gitleaks on every PR + push, scans full history (push) or diff (PR), ~150 default secret patterns               | `.github/workflows/gitleaks.yml`                                    |
| SAST in CI                       | CodeQL on every PR + weekly · `security-extended,security-and-quality` for JS + Python                          | `.github/workflows/codeql.yml`                                      |
| Dependency audit                 | Dependabot for github-actions, pip, npm · weekly · patch-updates grouped                                        | `.github/dependabot.yml`                                            |

### 0.2 · Reliability nets

| Concern                          | Implementation                                                                                                       | Evidence                                  |
|---                               |---                                                                                                                   |---                                        |
| Async LLM (no login-blocking)    | Chat handler runs `asyncio.create_task` for background analysis · returns to client immediately                      | `backend/routes/chat.py` + others         |
| Async email sends                | Welcome, magic-link, notifications all `asyncio.create_task` — never blocks the originating request                  | `backend/routes/oauth.py:160-167`         |
| TTL cleanup                      | TTL indexes on `user_sessions.expires_at`, `magic_links.expires_at`, `login_attempts.expires_at`, `email_log.sent_at` | `backend/server.py:234-290`               |
| Frontend chunk-load survival     | `lazyWithRetry` transparently retries then forces ONE reload to pick up fresh `index.html` after stale-deploy 404    | `frontend/src/lib/lazyWithRetry.js`       |
| Tier-redirect double-layer       | Synchronous in `index.js` before React mounts + `useEffect` in `AppRouter` as belt-and-suspenders                    | `frontend/src/lib/tierRedirect.js` + `frontend/src/App.js:115-117` |
| Stripe webhook retries           | Stripe retries with exponential backoff for 3 days · `idempotency_keys` row marked `failed` with the error           | `supabase/functions/stripe-webhook/index.ts:362-371` |

### 0.3 · Observability stack

| Concern                          | Implementation                                                                                                  | Evidence                                                            |
|---                               |---                                                                                                              |---                                                                  |
| Backend exception capture        | Sentry FastAPI + Starlette integrations · `traces_sample_rate=0.1`, `profiles_sample_rate=0.1`                  | `backend/server.py:23-80`                                           |
| Sentry noise filter              | `_before_sentry_send` drops 401/403/404/422/429, ClientDisconnect, healthchecks                                 | `backend/server.py:45-67`                                           |
| Frontend exception capture       | `@sentry/react` + ErrorBoundary                                                                                 | `frontend/src/index.js` · `frontend/src/components/AppErrorBoundary.js` |
| Admin auth-health endpoint       | 24-hour rolling counters · registrations, logins, OAuth errors, rate-limit triggers, top IP offenders            | `backend/routes/admin.py:137-158`                                   |
| Supabase advisor automation      | GitHub Action pulls `get_advisors(security)` + `get_advisors(performance)` and opens issues for new findings     | `.github/workflows/supabase-advisors.yml`                           |
| What we never log                | JWTs, raw OAuth credentials, raw magic-link tokens, Stripe secrets, passwords (only bcrypt hash)                 | grep-verified                                                       |

### 0.4 · CI gates

| Workflow                                | Trigger                                          | Purpose                                                                                            |
|---                                      |---                                               |---                                                                                                 |
| `.github/workflows/ci.yml`              | every PR + push to mvpcode                       | Frontend `yarn build` (Vercel parity) + backend `python -m compileall` syntax check                |
| `.github/workflows/codeql.yml`          | every PR + push to mvpcode + weekly schedule     | SAST for JS + Python, security-extended ruleset                                                    |
| `.github/workflows/gitleaks.yml`        | every PR + push to mvpcode                       | Scan diff (PR) or full history (push) for ~150 secret patterns                                     |
| `.github/workflows/lockfile-guard.yml`  | every PR                                         | Block PRs where `package.json` is edited but `yarn.lock` is not bumped (Vercel `--frozen-lockfile` parity) |
| `.github/workflows/constants-drift.yml` | every PR                                         | Block PRs where frontend tier-redirect allowlist drifts from backend route mounts                  |
| `.github/workflows/supabase-advisors.yml` | nightly                                        | Pull Supabase security + performance advisors                                                      |
| `.github/workflows/cron.yml`            | scheduled                                        | Lifecycle email drips, trial-reminder, monthly scorecard                                           |

### 0.5 · Data integrity

| Concern                            | Implementation                                                                                              | Evidence                              |
|---                                 |---                                                                                                          |---                                    |
| Duplicate-account prevention       | Mongo `users.email` UNIQUE with case-insensitive collation (strength=2) — `WLAD@x.de` vs `wlad@x.de` clash  | `backend/server.py:243-246`           |
| Cross-platform identity            | `email_lower` is the dedup key across Mongo (Emergent) and Supabase Postgres mirror                          | `docs/app/SCHEMA.md`                      |
| Stripe-webhook idempotency         | `idempotency_keys` table keyed by Stripe event id · `succeeded` short-circuits replay                       | `supabase/functions/stripe-webhook/index.ts:302-360` |
| Migration discipline               | Schema changes via Supabase MCP `apply_migration` only · raw SQL prohibited                                  | `CLAUDE.md` (workflow rule 1)         |
| All views `security_invoker = true`| Postgres default is DEFINER, which Supabase flags as ERROR · enforced                                       | `CLAUDE.md` (workflow rule 3)         |
| Trigger function permissions       | All trigger functions `revoke all from public, anon, authenticated`, grant only `service_role`              | `CLAUDE.md` (workflow rule 4)         |

### 0.6 · What's NOT done (honesty section)

These are the gaps between today's state and a 5-year-old enterprise SaaS.
Each is tracked and either intentionally deferred or scheduled.

| Gap                                                | Status                                                                                            | Priority |
|---                                                 |---                                                                                                |---       |
| Backend pytest in CI                               | Local pytest exists in `backend/tests/` (180+ tests) but CI only runs syntax-check because `emergentintegrations` is a private wheel that 404s from generic runners. Workaround: stub the import. | medium · post-launch |
| E2E browser tests on critical funnels (signup → trial → checkout) | Manual smoke today · Playwright/Detox automation deferred                                | medium · 2 weeks post-launch |
| Frontend type safety (TypeScript)                  | CRA bundle is JS-only · type errors caught at runtime. Migration is multi-week.                   | low · 6-month horizon |
| Refresh tokens                                     | 7-day JWT + 7-day cookie · user re-logs after a week. Acceptable v1.                              | low · revisit if daily-active sessions become normal |
| Backup restore drill                               | Daily snapshots exist but never restored to verify. Schedule for week 2 post-launch.              | medium · scheduled |
| WCAG 2.1 AA audit                                  | Brand-DNA components built with semantic HTML and accessible labels, no formal audit yet          | medium · post-launch |
| Load test                                          | Targeting 1k concurrent users on launch · no synthetic load test run yet                          | high · before scaling press |
| OpenAPI spec auto-publish                          | FastAPI generates `/docs` and `/openapi.json` at runtime · not exported as a versioned artifact   | low · enable for partner integrations later |

### 0.7 · How to read this section

- Claims with `file:line` references are verifiable: `grep` the file, read the line, confirm the behavior.
- Claims marked "operator-verify" live in a dashboard (Resend, Sentry, Vercel, Emergent, Supabase) — verifiable in those UIs but not in code.
- Anything **not** in this section is fair game to call vibe-coded.

If you find a row whose evidence doesn't match the claim, that's a bug — open an issue tagged `production-readiness` and we fix it before the next deploy.

---

## 1. Stripe — Live-Mode Bringup ✅ Code-bereit / ⏳ Mert-Action nötig

### Status quo
- `STRIPE_API_KEY=sk_test_emergent` (Emergent's geteilter Sandbox-Key)
- Code-Pfade in `routes/payments.py` sind 100% live-key-ready (kein Mode-Switch nötig)
- Health-Endpoint live: `GET /api/payments/stripe-mode` → zeigt Modus + Warnung
- Frontend-Banner für Mert: `StripeModeBanner` im Dashboard (admin/owner only, auto-hides bei live)

### Mert-Action (kritisch vor Launch)
1. Hol dein Live-Key auf https://dashboard.stripe.com/apikeys (Live mode → Secret key, beginnt mit `sk_live_…`)
2. Auf Vercel/Production-Host: setze `STRIPE_API_KEY=sk_live_…` als Environment Variable
3. Im Stripe-Dashboard → Developers → Webhooks: hinzufügen
   - URL: `https://leader-os.de/api/webhook/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`
4. Banner verschwindet automatisch sobald `sk_live_…` aktiv (Frontend pollt `/api/payments/stripe-mode`)
5. Test: 1€ Test-Purchase mit echter Karte → refund

### Sicherheitsnetze schon eingebaut
- Server-side Amount validation (Pakete in `PACKAGES` dict, kein client-side amount-tampering möglich)
- Webhook-Signatur via Emergent `StripeCheckout` SDK
- Idempotency via `payment_transactions.session_id` unique
- Discount-Codes server-side validiert
- Receipt-Email automatisch via Resend

---

## 2. Agent-Orchestration — Harmonisch ✅

### Audit-Resultat (alle Agents nutzen das selbe Pattern)

| Surface | Route | LLM | RAG | Session |
|---------|-------|-----|-----|---------|
| WladBot Chat | `/api/chat` | GPT-5.2 | ✅ `retrieve_context` | `chat_{session_id}` |
| Daily Check-in | `/api/checkin` | GPT-5.2 | ❌ (intentional, kurz) | `checkin_{checkin_id}` |
| Playbooks (Frame) | `/api/playbooks` | GPT-5.2 | ✅ `retrieve_context` | `pb_{session_id}` |
| Playbook Report | `/api/playbooks/report` | GPT-5.2 | ❌ (uses prior playbook ctx) | `report_{uuid}` |
| Video Analyse | `/api/video/analyze` | GPT-5.2 | ✅ `retrieve_context` | `video_{video_id}` |
| Simulations | `/api/simulations` | GPT-5.2 | ✅ `retrieve_context` | `sim_{session_id}` |
| Tools | `/api/tools/*` | GPT-5.2 | ❌ (single-shot tasks) | `tool_{type}_{uuid}` |
| Voice Mode | `/api/voice/voice-mode` | GPT-5.2 + Whisper | ❌ | `voicemode_{session_id}` |
| Challengers | `/api/challengers` | GPT-5.2 | ❌ (mock persona-driven) | `chl_{session_id}` |

### Einheitliche Patterns ✅
- **Single LLM Key**: alle Routen `EMERGENT_LLM_KEY` (kein Vendor-Lockin, Key-Budget global)
- **Single Model**: alle nutzen `openai/gpt-5.2` (keine Mixed-Quality)
- **RAG Pipeline**: 4 wichtigsten content-Surfaces (chat/playbooks/video/simulations) nutzen einheitlich Voyage-3 + Supabase chunks (matching threshold 0.60)
- **Session Memory**: jeder Agent hat eindeutige session_id für conversation continuity
- **Error Handling**: alle wrappen `await chat.send_message(...)` in try/except → fallback zu generic Wlad-Quote
- **JSON Parse**: alle Agents die JSON erwarten nutzen `services_ai_parse.parse_ai_json()` (defensive)

### Backlog (Polish, kein Blocker)
- **Cross-Agent Memory**: aktuell sieht der Playbook-Agent nicht was der Chat-Agent gesagt hat. Future Iter könnte einen "User Context Vector" via Supabase aufbauen.
- **RAG Cache**: bei 10k user mit ~3 chat-msgs/day = 30k Voyage-Embed-Calls/Tag. Empfehlung: Redis-cache embeds für identische queries (60s TTL).

---

## 3. 10k-User Skalierung — Pod-bereit ✅ / Production-Config dokumentiert

### MongoDB Indexes ✅ (alle in `server.py` startup hook)

| Collection | Index | Purpose |
|------------|-------|---------|
| `users` | `email_unique_ci` (unique, CI collation) | Login + dedup |
| `users` | `user_id_unique` | Foreign-key joins |
| `users` | `tier + created_at` | Cohort queries |
| `users` | `xp -1` | Leaderboard |
| `user_sessions` | `expires_at` TTL | Auto-cleanup |
| `chat_messages` | `session_id + created_at` | Chat history load |
| `chat_messages` | `user_id + created_at -1` | "My recent chats" |
| `activity_log` | `user_id + created_at -1` | Activity feed |
| `events` | `start_date` | Calendar queries |
| `email_log` | `user_id + type` | Dedup drip emails |
| `email_log` | `sent_at` TTL 1y | Auto-purge |
| `ab_test_events` | `user_id + experiment` | Variant lookup |
| `ab_test_events` | `experiment + event + created_at -1` | Analytics |
| `video_attempts` | `user_id + created_at -1` | Archive page |
| `login_attempts` | `email + ip` | Brute-force lock |
| `login_attempts` | `ip + created_at -1` | IP rate-limit |
| `login_attempts` | `expires_at` TTL | Auto-cleanup |
| `magic_links` | `expires_at` TTL | Auto-cleanup |
| `sync_events` | `event_id` unique | Supabase idempotency |

### Backend Process Sizing

**Im Pod (Development):**
- `uvicorn server:app --workers 1 --reload` — single process, hot-reload für DX

**Auf Production (Vercel/Railway/EC2):**
```bash
# Empfohlene Config für 10k user
gunicorn server:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --worker-connections 1000 \
  --max-requests 5000 \
  --max-requests-jitter 500 \
  --timeout 120 \
  --bind 0.0.0.0:8001
```
Rule-of-thumb: `workers = 2 * CPU_cores + 1`. Bei 10k DAU mit ~5 req/sec/user peak = ~50k req/sec → 4 workers à 12.5k = OK auf 4-vCPU instance.

### MongoDB Connection Pool
Motor default: `maxPoolSize=100`, `minPoolSize=0`. Bei 10k user kein change nötig (4 workers × 100 = 400 connections, MongoDB Atlas M10 supports 3000).

### CDN / Static Assets
- Frontend bundled via CRA, lazy-chunks gesplittet (31 chunks ab Iter 92.11)
- Vercel CDN serviert alle JS-chunks edge-cached → quasi-zero latency
- Vimeo + Drive für Video-Content → keine eigene CDN-Last
- Sentry Replay disabled (saves bandwidth)

### Rate Limiting
Aktuell: login_attempts table (5 fails/15min lock). Empfehlung für 10k user:
- **Cloudflare Rate-Limit Rules** vor Vercel-Pod (z.B. 100 req/min/IP für `/api/*`)
- Alternativ: `slowapi` package integration in FastAPI (in-process token bucket)

### Caching Strategy

| Layer | Status | TTL | Notes |
|-------|--------|-----|-------|
| Stripe price catalog | static dict | n/a | Kein DB-roundtrip |
| Event-list | DB | 0 | Kleine collection, indexed |
| RAG embeddings | none yet | n/a | **TODO**: Redis cache empfohlen |
| User tier | TierContext | session | 5min stale |
| AI response | n/a | n/a | Personalisiert, kein cache sinnvoll |

### Monitoring
- **Sentry Backend**: konfiguriert (`SENTRY_DSN_BACKEND`). Error rates → Slack-channel via Sentry-Slack integration
- **Sentry Frontend**: ErrorBoundary integrated, Session Replay disabled (cost)
- **Prometheus/Grafana**: nicht integriert (P2 für post-launch)
- **Uptime**: empfohlen → UptimeRobot mit 5-min ping auf `/api/health`

### Email Sending
- Resend integration limit: 100 emails/sec (Pro plan)
- 10k user × 6 drip-emails über 14 Tage = 60k mails / 14 days = ~4.3k/day = ~3/min → far below limit
- Lifecycle cron via `/api/cron/drip` täglich

---

## Pre-Launch Checklist

- [x] Backend MongoDB indexes für 10k user
- [x] Frontend lazy-chunk retry (kein Stale-Bundle-Crash)
- [x] Agent-Orchestration audit (alle einheitlich)
- [x] Stripe-Mode Health-Endpoint
- [x] Stripe-Mode Banner im Admin-Dashboard
- [x] Sentry Frontend + Backend
- [x] Voice-Recorder 2-min Hard-Stop
- [x] Onboarding Video Modal (Vimeo)
- [x] Tier-aware Pricing
- [ ] **Mert: Stripe Live-Keys auf Production setzen**
- [ ] **Mert: Stripe Webhook anlegen**
- [ ] **Mert: Vimeo Privacy → "Anywhere"**
- [ ] **Mert: Vercel ENV-Variables auditieren** (siehe `.env.production.template` für expected vars)
- [ ] **Mert: Test-Purchase 1€ → Refund** (smoke production payments end-to-end)
- [ ] **Mert: Cloudflare Rate-Limit Rule** (100 req/min/IP für `/api/*`)

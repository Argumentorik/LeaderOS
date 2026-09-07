# Production Readiness · 10k Users

> Iter 92.12 · Pre-Launch Audit für Mert. Status-Snapshot 26.02.26.

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
- **RAG Pipeline**: alle Content-Surfaces (chat/playbooks/video/simulations/voice) nutzen einheitlich das lokale Hybrid-RAG (MiniLM 384 dim + Keyword-RRF, `rag_chunks` in MongoDB, Threshold 0.40)
- **Session Memory**: jeder Agent hat eindeutige session_id für conversation continuity
- **Error Handling**: alle wrappen `await chat.send_message(...)` in try/except → fallback zu generic Wlad-Quote
- **JSON Parse**: alle Agents die JSON erwarten nutzen `services_ai_parse.parse_ai_json()` (defensive)

### Backlog (Polish, kein Blocker)
- **Cross-Agent Memory**: aktuell sieht der Playbook-Agent nicht was der Chat-Agent gesagt hat. Future Iter könnte einen "User Context Vector" via Supabase aufbauen.
- **RAG Cache**: Embeddings sind lokal (0 € pro Query); Query-Cache (30 min TTL, 1024 Einträge) ist In-Process. Bei mehreren Workern wäre ein geteilter Redis-Cache sinnvoll.

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

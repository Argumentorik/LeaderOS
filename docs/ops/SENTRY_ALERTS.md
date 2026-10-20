# Sentry Alert Thresholds — leader-os.de

> Mirror dieser Rules muss in **Sentry → Settings → Alerts** als "Issue Alert"
> oder "Metric Alert" angelegt werden. Diese Datei ist die Source-of-Truth
> für was wann eskaliert.

---

## Architektur

```
FastAPI server  →  before_send filter (server.py)  →  Sentry → Alert Rules
                       ↓ drops noise:
                       - 401/403/404/422/429 (expected client errors)
                       - ClientDisconnect / CancelledError (upload aborts)
                       - /api/health, /api/lifecycle/status, /api/rag-status
```

Sampling:
- `traces_sample_rate = 0.10` (10% transactions, kostenkontrolliert)
- `profiles_sample_rate = 0.10`
- Alle Errors werden gesendet (kein error sampling)

---

## Alert Rules (anlegen in Sentry UI)

### 🚨 P0 — Critical (PagerDuty / SMS to Mert)

**Rule: Production 5xx Spike**
- **Trigger:** `event.level >= error` AND `event.tags.environment = "production"` AND `event.request.status_code >= 500`
- **Threshold:** `> 5 events` in `1 minute`
- **Action:** Email mert@example.com + Slack #leader-os-alerts + (optional) PagerDuty
- **Owner:** Mert
- **Why:** Wenn 6+ User in 60s einen 500er bekommen, ist etwas Strukturelles kaputt (DB-Connection, RAG-Embedding, Stripe-Webhook). Sofort handeln.

**Rule: Stripe Webhook Failure**
- **Trigger:** `event.tags.endpoint = "/api/payments/webhook"` AND `event.level = "error"`
- **Threshold:** `> 1 event` in `5 minutes`
- **Action:** Email + Slack
- **Owner:** Mert
- **Why:** Stripe Webhook-Fehler = User zahlt, Account wird nicht freigeschaltet. Geld-zurück-Risiko.

**Rule: Auth Endpoint Errors**
- **Trigger:** `event.transaction CONTAINS "/api/auth/"` AND `event.level = "error"` AND `event.status >= 500`
- **Threshold:** `> 3 events` in `2 minutes`
- **Action:** Email + Slack
- **Why:** Login broken = Conversion-Tot.

### ⚠️ P1 — Important (Email to Mert, daily digest)

**Rule: First-Seen Issue**
- **Trigger:** `event.is_new = true` (Sentry first-seen flag)
- **Threshold:** Always (jede neue eindeutige Exception)
- **Action:** Email mert@example.com (single shot, no spam)
- **Why:** Jede neue Exception-Class ist eine potentielle Regression.

**Rule: API Latency p95**
- **Type:** Metric Alert
- **Metric:** `transaction.duration` p95 für `transaction CONTAINS "/api/"`
- **Threshold:** `> 3000 ms` for `5 minutes`
- **Action:** Email
- **Why:** Slow API = User-Abbruch. Indikator für DB-Lock, externe API-Timeout, oder Memory-Pressure.

**Rule: RAG/Embedding Errors (lokales MiniLM)**
- **Trigger:** `event.tags.module = "rag"` AND `event.level = "error"`
- **Threshold:** `> 5 events` in `10 minutes`
- **Action:** Email
- **Why:** RAG-Down = WladBot antwortet generic statt Wlad-style.

### 📊 P2 — Info (Slack only, low-priority)

**Rule: Warning-Breadcrumb-Storm**
- **Trigger:** `event.level = "warning"` (any)
- **Threshold:** `> 50 events` in `5 minutes`
- **Action:** Slack #leader-os-warnings
- **Why:** Massenwarning oft = abgelaufenes Cert, langsamer 3rd-party, oder DDoS-Versuch.

**Rule: Resend Email Bounce Spike**
- **Trigger:** `event.transaction CONTAINS "/api/cron/"` AND `event.message CONTAINS "bounce"`
- **Threshold:** `> 10 events` in `1 hour`
- **Action:** Slack
- **Why:** Bounce-Rate über 5% triggered Resend-Domain-Throttling.

---

## In-Code-Filter (was wir automatisch droppen)

Datei: `/app/backend/server.py` → `_before_sentry_send()`

**Status codes silenced** (= expected client errors, nicht actionable):
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 422 Validation Error (Pydantic)
- 429 Rate Limited

**Exception classes silenced** (= request lifecycle, kein App-Bug):
- `ClientDisconnect` — User schloss Tab mid-upload
- `BrokenResourceError` — Network failure mid-stream
- `CancelledError` / `asyncio.CancelledError`
- `ConnectionResetError`

**URL paths silenced** (= healthcheck noise):
- `/api/health`
- `/api/lifecycle/status`
- `/api/rag-status`

---

## Env Vars (zu setzen in Production)

```
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project_id>
SENTRY_ENV=production
SENTRY_RELEASE=wladbot@5.0  # bumpe mit jedem Iter (Iter 92.4 → wladbot@5.0-92.4)
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Hinweis:** Wenn `SENTRY_DSN` nicht gesetzt ist, ist Sentry komplett no-op
(perfekt für lokale Dev / CI).

---

## Manueller Test (vor Live-Schaltung)

Sentry-Test-Event triggern:

```bash
API_URL=https://leader-os.de
curl -X GET "$API_URL/api/__sentry-test"  # endpoint absichtlich nicht existent → 404, sollte gefiltert werden
curl -X GET "$API_URL/api/admin/__sentry-throw"  # admin-only endpoint, raised intentional Exception → sollte in Sentry erscheinen
```

In Sentry → Issues sollte das `__sentry-throw` Event sichtbar sein, das `__sentry-test` 404 NICHT.

---

## Backlog / Future

- [ ] Frontend Sentry-Integration (React error-boundary → Sentry browser SDK)
- [ ] Sentry Performance-Releases mit Git-Sha aus CI verlinken
- [ ] Alert-Owner-Rotation einführen sobald Team > 1 Person
- [ ] Tag jeden RAG-Call mit `module=rag` für gezieltere Filter

Stand: Feb 2026 · Iter 92.4

# Leader-OS · Architecture Rules
*(verbindlich · Mert, Juni 2026 · für alle zukünftigen Agents)*

> **Source of Truth.** Bei Konflikt zwischen Doc-Stand und Code zählt dieses Dokument. Bei jeder neuen Iteration: erst lesen, dann coden.

---

## 1. Deployment Target

- **Vercel ONLY.** Keine Fly.io, Railway, Render, AWS Lambda Vorschläge — auch nicht als Optimierung.
- Frontends: Vercel Static + Edge.
- Backend: Vercel Serverless Functions (oder kompatibles Serverless-Setup).
- Database: ein MongoDB-Cluster, geteilt von allen Domains.

## 2. Domain Map

| Domain | Rolle | Auth? | Stripe? |
|--------|-------|-------|---------|
| **leaderos.de** | Haupt-App (Auth, Chat, Missions, Coaching, Billing) | ✅ | ✅ |
| **leadercheck.de** | Marketing/Quiz/Diagnose-Funnel | ❌ (anonym) | ❌ |
| **leader-os.de** | Landing-Page-Variante | ❌ | ❌ |
| **leader-check.de** | Landing-Page-Variante | ❌ | ❌ |

Alle 4 Domains + optional www-Varianten teilen sich **ein** Backend.

## 3. CORS Whitelist (PRODUCTION)

Backend `CORS_ORIGINS` env var **MUSS** in Production exakt diese Liste sein:

```
https://leaderos.de,https://www.leaderos.de,https://leadercheck.de,https://www.leadercheck.de,https://leader-os.de,https://www.leader-os.de,https://leader-check.de,https://www.leader-check.de
```

- Wildcard `*` ist in Production **VERBOTEN** — der Backend startet nicht (Code-Safeguard in `server.py:194` raised `RuntimeError`).
- Dev/Preview darf `*` benutzen (regex-form mit credentials).
- **Niemals** andere Origins zur Whitelist hinzufügen ohne explizite Genehmigung von Mert.

## 4. Funnel Flow (Single Conversion Path)

```
leadercheck.de (Quiz)  ┐
leader-check.de (LP)   ├─→  leaderos.de/signup  →  leaderos.de/checkout  →  leaderos.de/dashboard
leader-os.de (LP)      ┘                            (Stripe)
```

- **ALLE Conversion-Events (Signup, Login, Checkout) finden auf `leaderos.de` statt.**
- Landing-Pages und Funnel-Domains haben **keine eigene Auth-Logik**.
- Cross-Domain-Tracking: Backend liest `Origin`/`Referer` und stempelt `users.source_platform`:
  - `'leader-check'` für User die via leadercheck.de oder leader-check.de kommen
  - `'leader-os'` für direkte leaderos.de oder leader-os.de Signups
- Logik: `backend/routes/auth.py::detect_source_platform()`

## 5. API Design

- **Alle** Business-Logik lebt in `/app/backend/routes/*.py` (FastAPI) oder Shared Services in `/app/backend/services_*.py`.
- Frontends sind **Thin Clients**: UI + `fetch`/`axios` zum Backend.
- Es darf **niemals** Business-Logik in mehreren Frontends dupliziert werden.
- API-Routen-Präfix: immer `/api/*` (Kubernetes-Ingress + Vercel-Routing benötigen das).
- Auth-State (JWT + httpOnly Cookie) lebt ausschließlich auf `leaderos.de`. Andere Domains greifen nur via API darauf zu (mit CORS+credentials).

## 6. Serverless-Compat Constraints

Bei Vercel-Serverless-Functions gilt:

| ❌ Vermeide | ✅ Stattdessen |
|------------|---------------|
| Long-running Prozesse (>10s Funktion, >60s Pro-Plan) | Vercel Cron Jobs (`vercel.json`) |
| Persistente WebSockets | Server-Sent-Events (kurzlebig) oder Pusher/Ably |
| Background-Worker (Celery, RQ) | Vercel Cron oder externe Worker via Webhook |
| Lokale Disk-Persistenz (`/tmp` ist ephemeral!) | Object Storage (S3/R2) |
| `asyncio.create_task` für "fire-and-forget" das wichtige Side-Effects hat | `await` synchron ODER externer Queue/Webhook |

**Achtung Iter 92.24+**: aktuelle `asyncio.create_task` Patterns in `services_supabase_sync.py`, `services_crm.py`, `routes/auth.py` (welcome-mail, wladhub-sync, supabase-mirror) sind im Long-Running-Container fine. Bei Migration zu Vercel Serverless MÜSSEN diese refactored werden — entweder zu `await` oder zu externen Queue-Webhooks. Tracking: siehe `Backlog.md`.

## 7. Logging / Debug

- **Nie** interne Reasoning-Traces, Stack-Traces oder Debug-Logs in API-Responses oder UI-Output leaken.
- Logger ist `logger` in `config.py` — geht nur in Server-Logs, nicht ins User-Facing-API.
- Auch Tests-/Health-Endpoints geben nur sterile `{"status": "ok"}` zurück.

## 8. Was MAN MACHEN DARF (Quick-Reference für Agents)

✅ Neue Routen in `routes/*.py` (mit `/api/` Präfix).
✅ Neue Frontend-Pages in `pages/*.js` mit Route in `App.js`.
✅ Neue Services in `services_*.py` (idempotent, side-effect-isoliert).
✅ MongoDB-Indices in `server.py::startup()` (sparse/unique je nach Use-Case).
✅ CORS bleibt **synchron** in production via env-Whitelist.

## 9. Was MAN NIE TUT

❌ Hardcoded Stripe-Keys, MongoDB-URLs, API-Keys im Code.
❌ Wildcard-CORS in Production.
❌ Auth-Logik in mehreren Domains duplizieren.
❌ `print()` für Debugging im Production-Code (verwende `logger`).
❌ Lange Sleeps/Polls/While-True-Loops in API-Routen.
❌ Migration-Vorschläge zu anderen Hosting-Plattformen.

---

## Iter-Trail (Architektur-Änderungen)

| Iter | Datum | Änderung |
|------|-------|----------|
| 92.24 | Jun 2026 | Phone-OR-Email Login + `source_platform` Cross-Funnel-Attribution (Vorbereitung für Multi-Domain-Funnel) |
| 92.25 | Jun 2026 | `/signup` + `/register` Routes (Apple-Style Deep-Links für Funnel-CTAs) |
| 92.26 | Jun 2026 | Architektur-Rules locked-in (dieses Dokument) + Production-CORS-Safeguard (`RuntimeError` bei `*` in prod) |

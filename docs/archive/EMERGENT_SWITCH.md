# Emergent → Vercel/Supabase Switch — Step-by-Step

> Stand 2026-06-11. Frontend bereits auf Vercel (`leader-os`-Projekt).
> Backend läuft noch auf Emergent. Plan: stranguliere Emergent endpoint
> für endpoint, ohne Production-Downtime.

## Aktuelle Topologie

```
              GoDaddy DNS (76.76.21.21)
                       │
                       ▼
              Vercel "leader-os" project
              ┌──────────────────────┐
              │  Frontend (CRA)      │  ← gemergte Nike-DNA hier
              │  Routes: /, /login,  │
              │  /dashboard, /quiz   │
              └──────────┬───────────┘
                         │ vercel.json rewrite
                         ▼ /api/* →
              Emergent Backend (preview)
              ┌──────────────────────┐
              │  FastAPI             │
              │  Auth, Stripe, Chat, │
              │  RAG, Voice, etc.    │
              └──────────┬───────────┘
                         ▼
                   MongoDB + Supabase
```

## Was schon migriert ist

✅ **Frontend** komplett auf Vercel (mvpcode, autodeploy)
✅ **Domain-Routing** über Vercel Edge (Host-Header → Project)
✅ **Auth-Provider** Supabase (parallel zu Emergent's Auth)
✅ **DB-Identität** via `public.users.email_lower` (cross-platform key)
✅ **Compat-Shims** in `backend/lib/*` für LLM, Stripe, Storage
   → Code ist bereit für jeden Provider (Anthropic statt Emergent-LLM, etc.)

## Was noch Emergent abhängig ist

| Subsystem | Wo | Migration-Aufwand |
|---|---|---|
| FastAPI-Hosting | `command-center-229.preview.emergentagent.com` | Mittel — Container deployen |
| MongoDB | Emergent-managed | Hoch — Migration zu Supabase Postgres |
| `/api/*` Endpoints | Emergent | Pro Endpoint einzeln strangulierbar |
| Background-Crons | Emergent Scheduler | Niedrig — GitHub Actions / Supabase Cron |
| File-Storage | teilweise Emergent CDN | Niedrig — bereits Supabase Storage Shim |

## 14-Tage-Switch-Plan

### Phase 1 — Backend in Vercel Serverless reincarnaten (Tag 1–5)

**Ziel:** FastAPI in Vercel Python Functions ODER separater Container
auf Fly.io/Railway laufen lassen. Emergent bleibt als Fallback.

Option A: **Vercel Python Functions**
- `api/` directory mit einzelnen `.py`-files pro Route
- Vercel deployt automatisch als Serverless
- Cold-Start ~2s, OK für Chat aber nicht für Voice-Streaming
- 30-Tag Free-Tier

Option B: **Fly.io Container** (empfohlen)
- `fly.toml` schon im Repo (`/root/.claude/uploads/2212e138.../b02df58d-fly.toml`)
- 5$ / Monat für 1 Shared-CPU + 256 MB
- Persistent Connection für RAG + WebSockets
- Region `fra` (Frankfurt) → 30ms Latenz für DE-User

Schritte:
1. `flyctl deploy` aus `backend/`
2. Vercel ENV setzen: `BACKEND_URL=https://leader-os-api.fly.dev`
3. `vercel.json` rewrite umstellen → Fly statt Emergent
4. 24h beobachten, Sentry-Errors checken
5. Wenn stabil → Emergent-Backend abschalten

### Phase 2 — MongoDB → Supabase Postgres (Tag 6–10)

**Ziel:** Single Source of Truth in Supabase, MongoDB als Read-Cache
solange wir paranoid sein wollen.

1. **Schema-Mapping**
   - Mongo `users` → bereits in Supabase `public.users` ✓
   - Mongo `chat_messages` → Supabase `public.chat_messages` (Tabelle erstellen)
   - Mongo `events`, `tasks`, `simulations` → analog

2. **Dual-Write-Phase** (Tag 6–8)
   - Backend schreibt BEIDE: Mongo + Supabase
   - Reads kommen weiter aus Mongo
   - Sentry-Alarm wenn Writes auseinanderlaufen

3. **Read-Migration** (Tag 9)
   - Backend liest aus Supabase
   - Mongo wird nur noch geschrieben (für Rollback)

4. **Cutover** (Tag 10)
   - Mongo-Writes abschalten
   - Mongo als Backup-Read-Only behalten 30d

### Phase 3 — Emergent abschalten (Tag 11–14)

1. **Final-Smoke** auf preview.leader-os.de
   - Login mit Google/Apple/Microsoft
   - WladBot-Chat (RAG-Antwort innerhalb 3s)
   - Stripe-Checkout (Sandbox-Mode)
   - Voice-Call (TTS streaming)
   - Quiz-Funnel auf leader-check.de

2. **Production-Cutover**
   - DNS bleibt wie es ist (76.76.21.21)
   - `vercel.json` rewrites endgültig auf Fly
   - Emergent-Backend: nicht löschen, aber API-Key rotieren
     damit nichts mehr ungeplant durchläuft

3. **Cleanup**
   - Emergent-CDN-URLs aus Code (z.B. customer-assets.emergentagent.com)
   - Emergent-Env-Vars aus Vercel
   - Emergent-LLM-Key kann archiviert werden

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| RAG-Embeddings inkonsistent zwischen Mongo/Supabase | Hoch | Embedding-Migration als separates Skript, einmal vorher laufen lassen |
| Stripe-Webhooks gehen verloren | Niedrig | Webhook-URL parallel auf beide Backends während Phase 2 |
| Cold-Start auf Fly nach Idle | Niedrig | `min_machines_running = 1` in fly.toml |
| Voice-Latenz steigt | Mittel | Frankfurt-Region + Streaming-API direkt zu ElevenLabs |

## Was du heute machen kannst (während Login-Check)

Nichts. Backend bleibt Emergent. Vercel-Frontend ist live, Emergent
Backend ist live, beide reden miteinander wie sie es immer getan
haben. Der Switch passiert in einem geplanten 2-Wochen-Sprint nach
diesem Launch, nicht heute.

## Verifizieren dass alles läuft

```bash
# Frontend (Vercel)
curl -I https://leader-os.de/                  # 200
curl -I https://leader-os.de/login             # 200
curl -I https://leader-check.de/quiz           # 200 (sobald angelegt)

# Backend (via Vercel rewrite → Emergent)
curl https://leader-os.de/api/health           # JSON {status:"ok"}
curl https://leader-os.de/api/monitoring/system # JSON overall:"go"

# Auth (Supabase parallel)
# Login mit Email → Magic Link kommt von Resend (Email-Service läuft)
```

Wenn alle 5 Calls grün sind, ist die aktuelle Topologie stabil und du
kannst entspannt zum 14-Tage-Plan greifen wann du willst.

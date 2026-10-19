# 🚀 Leader-OS · Deployment Guide

> Stand: Juni 2026 · Produktion: **leaderos.de** via **Emergent Deploy**

## TL;DR — Deploy in 4 Schritten

1. **Deploy-Button** in Emergent klicken (deployt aktuellen Checkpoint).
2. **Env-Variablen** in der Deploy-Konfiguration prüfen (Matrix unten) — insbesondere `STRIPE_API_KEY` (live), `EMERGENT_LLM_KEY`, `JWT_SECRET`.
3. **Post-Deploy-Checks** ausführen (unten, ~3 Minuten).
4. Bei Problemen: **Rollback** über das Emergent-Rollback-Feature (kostenlos, jeder Checkpoint).

---

## Env-Matrix (Backend)

| Variable | Pflicht | Zweck |
|---|---|---|
| `MONGO_URL`, `DB_NAME` | ✅ | MongoDB (von Emergent verwaltet) |
| `JWT_SECRET` | ✅ | Session-Tokens |
| `EMERGENT_LLM_KEY` | ✅ | GPT-5.2 / Whisper (Chat, Video, Voice, Simulationen) |
| `STRIPE_API_KEY` | ✅ | `sk_live_…` für echte Zahlungen |
| `RESEND_API_KEY`, `SENDER_EMAIL` | ✅ | Transaktions- & Drip-Mails (wlad@leaderos.de) |
| `ELEVENLABS_API_KEY` | ✅ | Wlads TTS-Stimme (Voice Sparring, Vorlesen) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` | ✅ | leader-check.de-Sync, User-Mirror, Lizenzen |
| `SUPABASE_USER_MIRROR_URL`, `SUPABASE_OUTBOUND_SECRET`, `INBOUND_SYNC_SECRET` | ✅ | Sync-Bridge Secrets |
| `OAUTH_SESSION_URL` | ✅ | Emergent-managed Google Sign-In |
| `GOOGLE_CLIENT_ID` | ◻️ | Legacy-GIS-Erkennung (Provider-Discovery) |
| `SENTRY_DSN` | ◻️ | Error-Monitoring |
| `POSTHOG_API_KEY`, `POSTHOG_HOST` | ◻️ | Produkt-Analytics |
| `CORS_ORIGINS` | ✅ | `*` oder Domain-Liste |
| `RAG_EMBEDDINGS_DISABLED` | 🆘 | `1` = Notschalter: kein ONNX-Modell-Load (Keyword-RAG bleibt aktiv) |
| `RAG_AUTO_INGEST` | 🆘 | `0` = Auto-Ingest beim Boot deaktivieren |

**Frontend:** `REACT_APP_BACKEND_URL` (Prod-URL), `REACT_APP_POSTHOG_KEY/HOST`, `REACT_APP_GOOGLE_CLIENT_ID`.

> ⚠️ **RAM**: Der Backend-Worker braucht mit Embedding-Modell ~**1 GB RSS**. Bei OOM/520-Loops:
> `RAG_EMBEDDINGS_DISABLED=1` setzen, redeployen, dann Support wegen Memory-Limit kontaktieren.

---

## Post-Deploy-Checks (Pflicht, ~3 min)

```bash
# 1. Backend lebt
curl -s https://leaderos.de/api/health            # → 200 {"status":"ok"}

# 2. RAG-Status
curl -s https://leaderos.de/api/rag-status        # → configured:true, provider:local, dim:384
```

3. **RAG-Wissen**: heilt sich nach Deploy selbst (`ensure_rag_ready` beim Boot, Crash-Loop-Bremse 6h).
   Falls Chunks fehlen: Admin-Login → `/wlad-control-x7k9q2` → RAG Control Center → „Wissen neu einlesen"
   (~20–30 Min, Ziel: 7.439 Chunks) → danach **Golden-Check-Button** → PASS 21/21 erwartet.
4. **E2E-Smoke**: Login (test-Account) → Chat-Frage „Was ist das SEXIER-Modell?" → grounded Antwort <10s.
5. **Stripe**: `/coaching` → Paket wählen → checkout.stripe.com-Session öffnet sich (NICHT bezahlen).
6. **Signup**: Neuen Account registrieren → landet auf `/onboarding`.

## Rollback

Emergent-Rollback-Feature auf beliebigen vorherigen Checkpoint (kostenlos).
Achtung: Die Prod-DB wird dabei NICHT zurückgesetzt — Mongo-Daten bleiben erhalten.

## Bekannte Betriebs-Hinweise

- **Login-Rate-Limit**: 10 Logins/15 min pro IP — Testsuiten gegen Prod triggern 429-Kaskaden (kein Bug).
- **Cold-Start**: Erster Request nach Pod-Schlaf kann 502 liefern — einmal neu laden.
- **Cron-Jobs** (extern schedulen): täglich `POST /api/cron/installments-due`, `POST /api/cron/drip-sequence`;
  alle 15 min `POST /api/cron/event-reminders`; monatlich `POST /api/cron/monthly-scorecard`.
- **Founder-Test-Accounts löschen** (einmalig nach Go-Live): `python /app/backend/scripts_delete_test_accounts.py`.
- Admin-Route: `/wlad-control-x7k9q2` · Trust-Center: `/sicherheit`.

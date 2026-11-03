# Emergent Backend Deploy — Checklist (Stand 30.07.2026)

Was das Backend nach dem nächsten Deploy können muss und welche
Env-Variablen dafür gesetzt sein müssen. Ergänzt `RUNBOOK.md` /
`RUNBOOK_DEPLOY.md` um die **seit Juli 2026 neu dazugekommenen
Features**. Frontend deployt automatisch über Vercel (`mvpcode`-Push) —
diese Liste betrifft nur das FastAPI-Backend auf Emergent.

## 1 · Env-Variablen (neu bzw. neu relevant)

| Variable | Wofür | Ohne sie |
| --- | --- | --- |
| `RESEND_API_KEY` | Alle E-Mails, inkl. **neuer 7-Mail-Lead-Nurture-Journey** | Mails werden still übersprungen (`is_enabled()`-Gate) — kein Fehler, aber kein Funnel |
| `SENDER_EMAIL` | Absenderadresse der Mails | Default greift — prüfen, dass Domain bei Resend verifiziert ist |
| `CRON_SHARED_SECRET` | Auth für alle `/api/cron/*` — inkl. **neuem `lead-nurture`-Job**. Muss identisch mit dem GitHub-Secret `CRON_SHARED_SECRET` sein | Cron-Requests laufen ungeschützt (Secret leer = kein Check) bzw. failen (Mismatch) |
| `JWT_SECRET` | HMAC-Token für One-Click-Unsubscribe (free-videos **und neue Nurture-Mails**) | Unsubscribe-Links funktionieren nicht |
| `WEBINAR_JOIN_URL` | Ziel der Webinar-Reminder-Mails → auf `https://leader-os.de/webinar/live` setzen (Warteraum-Seite) | Reminder verlinken auf Fallback |
| `SYNC_JWT_SECRET` | leader-check → leader-os Sync-Handoff | Endpoint antwortet 503 (fail-safe) |
| `ELEVENLABS_API_KEY` | Sprachausgabe, Audio-Modus, "Zitat des Tages" | Alles stumm — sieht für Nutzer wie ein kaputtes Feature aus, nicht wie fehlende Konfiguration |
| `MONGO_URL` + `DB_NAME` | Neue Collection `nurture_leads` entsteht automatisch beim ersten Lead — keine Migration nötig | Backend startet nicht |

**Neu prüfbar:** `/api/system/health` meldet seit 08/2026 auch `tts`
(ElevenLabs) und `email` (Resend). Ein fehlender Key ist dort in 5
Sekunden sichtbar — vorher sah er wie ein Produktfehler aus (im MA-Test
haben vier Tester unabhängig "Sprachausgabe geht nicht" gemeldet, obwohl
nur der Key fehlte). **Nach jedem Deploy dort zuerst nachsehen.**

Unverändert nötig (wie bisher): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
`SUPABASE_ANON_KEY`, `STRIPE_API_KEY`, `VOYAGE_API_KEY`,
`EMERGENT_LLM_KEY`, `SENTRY_DSN`, `POSTHOG_KEY`. RAG-Tuning
(`RAG_MATCH_THRESHOLD` etc.) nur in `services_rag.py` anfassen — CI
erzwingt das.

## 2 · Nach dem Deploy: Smoke-Checks (5 Minuten)

```bash
BASE=https://leader-os.de/api

# 1. Health
curl -s $BASE/health

# 2. Lead-Capture nimmt an (legt nurture_lead an + sendet Mail 1)
curl -s -X POST $BASE/leader-check/intent \
  -H 'Content-Type: application/json' \
  -d '{"email":"deploy-test@example.com","source":"deploy-smoke"}'

# 3. Cron-Endpoints antworten mit Auth (403/401 OHNE Header = Schutz aktiv)
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/cron/lead-nurture
curl -s -X POST $BASE/cron/lead-nurture -H "X-Cron-Secret: $CRON_SHARED_SECRET"

# 4. Webinar-Stats (Kapazitätsanzeige der /webinar-Page)
curl -s $BASE/webinar/stats
```

Danach in Resend prüfen: Welcome-Mail (Step 1, BIB `N-01`) an die
Test-Adresse raus? In Mongo: `nurture_leads` hat den Test-Lead mit
`nurture_steps_sent: [1]`?

## 3 · GitHub-Seite (einmalig prüfen)

- Secret `CRON_SHARED_SECRET` gesetzt (Settings → Secrets → Actions) —
  der neue tägliche `lead-nurture`-Job in `cron.yml` benutzt es.
- Der Job feuert täglich 09:00 Berlin mit den anderen; manueller
  Testlauf: Actions → cron-jobs → Run workflow → `lead-nurture`.

## 4 · Bekannte Nicht-Blocker

- Die zwei CodeQL-`analyze`-Checks failen auf jedem PR, weil Code
  Scanning in den Repo-Settings deaktiviert ist. Kein Finding, nicht
  required. Fix (optional, Repo-Admin): Settings → Advanced Security →
  Code Scanning aktivieren, dabei **nicht** "default setup" wählen (das
  Repo hat eine eigene `codeql.yml`).
- Newsletter-Opt-ins über die Supabase-Edge-Function
  (`newsletter-subscribe`) laufen separat von der Mongo-basierten
  Nurture-Journey — bewusst; Zusammenführung wäre ein eigenes Projekt.

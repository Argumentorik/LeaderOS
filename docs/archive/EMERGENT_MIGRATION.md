# Emergent → Native Anthropic/OpenAI · Migration Status

> Wir lösen die Abhängigkeit von `emergentintegrations` schrittweise auf.
> Der Compat-Shim in `backend/lib/llm_provider.py` macht das schmerzlos:
> identische API, ENV-basierter Provider-Switch.

## Status pro Route (Stand dieser PR)

| Route                          | Was nutzt es                | Status     | Notiz |
| ------------------------------ | --------------------------- | ---------- | ----- |
| `routes/chat.py`               | LlmChat                     | ✅ Shim    | Default-Hauptchat |
| `routes/challengers.py`        | LlmChat                     | ✅ Shim    | |
| `routes/folders.py`            | LlmChat                     | ✅ Shim    | |
| `routes/video.py`              | LlmChat + OpenAISpeechToText| ✅ Shim    | STT + Chat beide |
| `routes/voice_tts.py`          | LlmChat + OpenAISpeechToText| ✅ Shim    | Inkl. lokal-importierte Aufrufe |
| `routes/playbooks.py`          | LlmChat                     | ✅ Shim    | |
| `routes/tools.py`              | LlmChat                     | ✅ Shim    | |
| `routes/admin_quality.py`      | LlmChat                     | ✅ Shim    | Internes Audit-Tool |
| `routes/simulations.py`        | LlmChat                     | ✅ Shim    | |
| `routes/checkin.py`            | LlmChat                     | ✅ Shim    | Daily-Checkin |
| `routes/uploads.py`            | EMERGENT_LLM_KEY als Storage-Token | ✅ Shim | `lib.object_storage` → Supabase wenn `SUPABASE_URL`+`SUPABASE_SERVICE_KEY` |
| `routes/payments.py`           | StripeCheckout-Wrapper      | ✅ Shim | `lib.stripe_checkout` → native stripe-SDK wenn echter Key |

Nicht-Routen die noch lesen: `services_wladhub_autosync.py` (nutzt nur
EMERGENT_LLM_KEY, kein LLM-Call) — wird beim Storage-Pass mitabgehandelt.

## Provider-Switch — was muss ich in Vercel setzen?

In **Project Settings → Environment Variables** (Production):

```
ANTHROPIC_API_KEY=sk-ant-…       # → Claude Haiku 4.5 (LLM-Default)
OPENAI_API_KEY=sk-…              # → GPT-4o-mini + STT (Voice-Mode)
STRIPE_API_KEY=sk_live_…         # → ECHTER Stripe-Key (oder sk_test_… vom eigenen Konto)
SUPABASE_URL=https://srujvjjncrszhaaxepxf.supabase.co
SUPABASE_SERVICE_KEY=eyJ…        # → Storage-Bucket-Zugriff (gleicher Key wie RAG)
SUPABASE_STORAGE_BUCKET=wladbot-uploads  # Default, muss im Supabase-Dashboard angelegt sein
EMERGENT_LLM_KEY=…               # darf jetzt LEER bleiben sobald oben alles steht
```

**Supabase-Bucket anlegen (einmalig):**
1. Supabase-Dashboard → Storage → New bucket
2. Name: `wladbot-uploads`
3. Public: **Off** (Private — Files werden über uns ausgeliefert via `/api/files/...`)
4. File-Size-Limit: 5 MB (kontert MAX_FILE_SIZE in uploads.py)
5. Allowed MIME types: leer lassen (uploads.py validiert das selbst)

Reihenfolge der Auto-Detection im Shim:

1. `ANTHROPIC_API_KEY` gesetzt → Anthropic
2. `OPENAI_API_KEY` gesetzt → OpenAI
3. sonst → Emergent (Legacy)

`with_model("openai", "gpt-5.2")` Aufrufe in den Routes bleiben ohne
Effekt: der Shim respektiert die ENV-Preferenz. Heißt: ihr deployt
einmal mit beiden Keys parallel, Traffic läuft schon nativ, Emergent
ist nur noch Notfall-Backup.

## Test-Plan nach dem ENV-Switch

1. `POST /api/chat` → Antwort kommt zurück (Wladbot Hauptfall).
2. `POST /api/checkin` → Daily-Check funktioniert.
3. `POST /api/voice/transcribe` (oder Voice-Mode-Overlay im UI) →
   STT muss klappen (nutzt `OpenAISpeechToText`).
4. `GET /api/payments/stripe-mode` → muss `mode: "live"` zurückgeben
   wenn ein echter `sk_live_`-Key drin ist. `sk_test_emergent` würde
   weiter auf Legacy gehen.
5. `POST /api/payments/checkout` → Stripe-Checkout-URL kommt zurück,
   in Stripe-Dashboard ist die Session sichtbar (NICHT in Emergent).
6. `GET /api/uploads/health` → muss `backend: "supabase"` zurückgeben.
7. `POST /api/upload/profile-picture` → Bild landet im Supabase-Bucket
   `wladbot-uploads/wladbot/profiles/<user_id>/…jpg`.
8. Sentry-Tab: keine `llm_provider send failed`-Errors,
   keine `stripe_checkout`-Errors, keine `object_storage`-Errors.
9. PostHog: Chat-Volume bleibt stabil — wenn es einbricht, einzelne
   Routes prüfen.

## Rollback

Soll der native Provider zurück auf Emergent fallen:

```
# In Vercel:
ANTHROPIC_API_KEY=   (leer setzen)
OPENAI_API_KEY=      (leer setzen)
EMERGENT_LLM_KEY=…   (bleibt aktiv)
```

Redeploy nicht nötig — der Shim liest beim ersten Request neu. Ein
manueller Reload des FastAPI-Workers kann das schneller machen.

## Was als nächstes raus muss

### `requirements.txt` Entfernung

Sobald in Production:
- Alle LLM-Routes laufen native (Anthropic/OpenAI)
- `/api/payments/stripe-mode` zeigt einen echten `sk_live_`-Key
- `/api/uploads/health` zeigt `backend: "supabase"`
- 1 Woche stabil, keine Sentry-Errors aus den Shims

→ kann `emergentintegrations==0.1.0` aus `backend/requirements.txt`
raus. Die Shims fallen dann beim Build-Step weg (Try-Import-Wrapper
loggt Warning, raise't aber nicht), bis wir noch den Try-Import-
Code aus den drei `lib/*`-Files löschen.

Dann auch `EMERGENT_LLM_KEY` aus den ENV-Vars in Vercel löschen.

### Optional aufräumen
- `backend/data.py` Founder-Avatare (Bezos, Musk, …) liegen noch auf
  `customer-assets.emergentagent.com`. Reine Anzeige-Avatare, kein
  Funktionsverlust wenn der Host irgendwann offline geht — aber
  nicht schön. Bei der nächsten Wlad-Foto-Lieferung mit umziehen.
- `backend/tests/*` URLs auf `*.preview.emergentagent.com`. Tests
  laufen ohnehin lokal/in CI, kein Production-Impact.

## Wieso ein Shim und nicht direkt SDK-Calls überall?

Drei Gründe:

1. **Atomarität.** Wenn 10 Routes parallel migriert werden müssen,
   ist die Wahrscheinlichkeit dass eine vergessen wird ~100 %.
   Shim heißt: heute 9 Routes geflippt, payments.py morgen, alle
   funktionieren weiter.
2. **Rollback in einer Minute.** ENV leeren → zurück auf Emergent.
   Kein Hotfix-Push, kein Stress.
3. **Test-Surface.** Wenn Claude Haiku auf einer Route schlechter
   antwortet als GPT-5.2, sehen wir das pro Route und können
   gezielt `with_model("openai", "gpt-4o")` im Code halten, während
   alles andere auf Claude läuft. Der Shim respektiert beide Wege.

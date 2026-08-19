# DEV / OPS Handover — Leader-OS

Written for a developer or operator taking over **today**. Short, specific, no filler.
Stand: Iter 135 (13.08.2026).

---

## 0. System in 60 Sekunden

| Teil | Wo | Wahrheit |
|---|---|---|
| App-Backend | FastAPI, `/app/backend`, Supervisor-Service `backend`, Port 8001, alle Routen unter `/api` | MongoDB (`MONGO_URL`, `DB_NAME`) |
| App-Frontend | React (CRA), `/app/frontend`, Service `frontend`, Port 3000 | ruft nur `REACT_APP_BACKEND_URL` |
| Wissensbasis (RAG) | MongoDB-Collection `rag_chunks` (~7.400 Chunks, 53 Quellen), lokale Embeddings (MiniLM 384d) | Quell-ZIP mit Wlads .txt-Dateien |
| Diagnose-Daten | `wladhub_diagnoses`, `users.wladhub_scores` | **leadercheck.de (Supabase `leadership_insights`)** |
| Zahlungen | Stripe Checkout (`routes/payments.py`), Aktivierung beim Statuspolling der Erfolgsseite | Stripe (LIVE-Key in `backend/.env`) |
| Rechte/Tiers | `services_tier.py` → `TIER_CONFIG` | Mongo `users.tier` + `tier_expires_at` |
| Feature-Rollout | `routes/features.py` + Collection `feature_rollout` | Admin-Dashboard |
| Admin | `/wlad-control-x7k9q2` (nur `is_admin`) | — |

Admin-Dashboard enthält denselben Runbook als aufklappbares „Betriebs-Handbuch".

---

## 1. „Etwas ist kaputt" — Ablauf

1. **Problem einordnen**: KI-Antworten? Diagnose-Daten? Zahlung? Login? Genau eine Spur verfolgen.
2. **Systemstatus prüfen** (Admin-Dashboard, in dieser Reihenfolge):
   - *RAG Control Center*: Chunks, Quellen, „Abruf live geprüft", Modell geladen, letzter Ingest.
   - *leadercheck.de Sync*: letzter Import, letzter Fehler + Grund.
   - *Auth-Health*: Login-Fehlerquote.
   - Logs: `tail -n 200 /var/log/supervisor/backend.err.log`
3. **Betroffenen Datensatz ansehen**: Admin → Nutzer (Tier, Ablauf), Admin → Transaktionen (Session, Status), RAG Debug Studio (konkrete Frage).
4. **Admin-Aktion ausführen** (siehe §3), nicht die Datenbank.
5. **Ergebnis prüfen**: dieselbe Anzeige, die den Fehler zeigte, muss grün werden — plus die Nutzeraktion einmal selbst durchspielen.
6. **Erst dann eskalieren**: mehrere Kunden betroffen, Fix nur mit DB-Handarbeit möglich, oder Fehler wiederholt sich nach der Admin-Aktion.

---

## 2. Konkrete Fälle

### KI antwortet falsch / ohne Wlads Wissen
- RAG Control Center → „Ist alles drin? (Bücher-Check)": fehlende Dateien stehen rot.
- „Golden-Check (21 Fragen)": < 20/21 ist ein echtes Signal.
- RAG Debug Studio mit der Original-Frage: welche Quellen kommen zurück, welcher Score?
- Fix: „Wissen neu einlesen" (Re-Ingest). Läuft im Hintergrund, leert danach automatisch Query- und Vektor-Cache.
- Kein Erfolg → DEV: Chunking (`scripts_ingest_local_rag.py`), Threshold `RAG_MATCH_THRESHOLD`, Fusion in `services_rag.py`.

### Kunde sieht seine leadercheck.de-Diagnose nicht
- Sync läuft automatisch bei Signup **und** bei jedem Login, maximal alle 6 h pro Person (`users.wladhub_last_check`).
- Statuswerte im Widget: `completed` (importiert) · `unchanged` (schon aktuell) · `not_found` (auf leadercheck.de existiert nichts zu dieser E-Mail) · `error` (Grund steht dabei).
- Häufigste echte Ursache: auf leadercheck.de wurde eine andere E-Mail benutzt.
- Kunde neu einloggen lassen → Widget prüfen. Werte **nie** manuell setzen, der nächste Sync überschreibt sie.

### Zahlung durch, Zugang fehlt
- Admin → Transaktionen: `payment_status` muss `paid` sein.
- Freischaltung passiert beim Statuspolling von `/payment-success` (`GET /api/payments/checkout/status/{session_id}`). Kunde die Seite einmal neu laden lassen.
- Rechnung: Stripe erzeugt und versendet sie selbst (`invoice_creation`). Link steht in der Transaktion (`invoice_url`).
- Notfall: Admin → Tier setzen, immer mit Notiz. Mehrere Fälle → DEV.

### Login-Probleme
- `/api/admin/auth-health` bzw. Auth-Health-Widget.
- Test-Zugänge stehen in `/app/memory/test_credentials.md`.
- Nie „Cache leeren" als Erklärung akzeptieren, immer Backend-Log lesen.

---

## 3. Zuständigkeiten

**Im Admin möglich, ohne Deployment**
- Wissen hochladen / löschen / neu einlesen (Caches werden automatisch invalidiert)
- Tier setzen, Lizenzschlüssel erzeugen, Masterclass-Kunden importieren
- 1-€-Livetest für Mitarbeiter freischalten
- E-Mail-Sequenzen freigeben (Conversion Center)
- Feature-Rollout: `off` → `premium` → `all`

**Braucht Deployment**
Preise/Pakete (`PACKAGES` in `routes/payments.py`), Prompts, neue Seiten/Routen, Bugfixes, neue Felder, `.env`-Änderungen (danach `sudo supervisorctl restart backend`).

**Braucht Re-Ingest**
Neue Bücher/Kurse, geändertes Chunking, anderes Embedding-Modell (dann zwingend voller Re-Ingest, sonst Dimensions-Mismatch → Retrieval liefert 0 Treffer).

**Braucht DB-Migration**
Neues Pflichtfeld an bestehenden Dokumenten (z. B. weiteres Feld an `users`). Immer als Skript, nie per Hand.

**NIEMALS manuell ändern**
- `rag_chunks` (nur über Admin-Ingest/Upload)
- Beträge/Preise in der DB (Quelle ist der Server-Code)
- `wladhub_diagnoses` (Quelle ist leadercheck.de)
- `credits` / `tier` direkt in Mongo (Ablaufdaten laufen auseinander)
- Secrets in `.env` im laufenden Betrieb

---

## 4. Bekannte Grenzen (Stand Iter 135)

| Thema | Sachstand |
|---|---|
| Vektor-Suche | Ganze Matrix im RAM (~7.400 × 384 float32, ≈ 11 MB + Texte). Sauber bis ~50–60k Chunks; darüber echte Vektor-DB nötig. |
| RAG-Cache | Query-Cache 30 min, Vektor-Matrix 1 h bzw. bei Corpus-Änderung. Wird bei Ingest/Upload/Delete explizit geleert. |
| Metadaten-Qualität | Manche Chunks tragen als `course` die erste Transkript-Zeile. Anzeige und Zitate laufen deshalb über `_clean_display_title`. Dauerhafte Lösung: Titel beim Ingest kuratieren. |
| leadercheck.de | Read-mostly per Supabase REST mit Service-Key. Bei Ausfall: Sync schlägt fehl, Produkt läuft weiter, Widget zeigt den Fehler. |
| Stripe-Webhook | Deaktiviert. Aktivierung läuft über Statuspolling der Erfolgsseite (idempotent). Wenn ein Kunde die Erfolgsseite nie öffnet, bleibt der Zugang aus, bis er sie öffnet. |
| SPA-SEO | Kein SSR. Titel/Description/Canonical werden pro Route zur Laufzeit gesetzt (`src/lib/seo.js`). Unbekannte URLs leiten auf `/dashboard` → Soft-404. |

---

## 5. Wichtige Dateien

```
backend/services_rag.py                 Retrieval, Fusion, Caches, invalidate_caches()
backend/routes/rag_admin.py             Ingest, Quellen, Coverage, Golden-Check
backend/services_wladhub_autosync.py    leadercheck.de → Leader-OS (mit Log)
backend/routes/sync.py                  Supabase → Leader-OS (Plan/Tier, HMAC-Secret)
backend/routes/payments.py              Stripe Checkout, Rechnung, Tier-Aktivierung
backend/routes/features.py              Premium-first Rollout
backend/services_tier.py                TIER_CONFIG (einzige Wahrheit für Rechte)
frontend/src/pages/AdminPage.js          Admin-Dashboard (alle Panels)
frontend/src/lib/seo.js                  Per-Route Head-Tags
```

Tests: `cd /app/backend && REACT_APP_BACKEND_URL=<url> python3 -m pytest tests/test_iter135_godmode_audit.py tests/test_iter134_golive.py -q`

---

## 6. Nachtrag Iter 135.1 — Avatar & Sprachausgabe

**Avatar**: Es gibt genau EINE Quelle: `public/wladbot-avatar-clean.png` (Gesichts-Ausschnitt des WladBot-Charakters von leadercheck.de, 512×512, ruhiger Hintergrund). Referenziert über `WLAD_AVATAR` in `src/lib/brand.js` und `AVATAR_SRC` in `components/brand/WladBotAvatar.js`; E-Mails/Magic-Link nutzen dieselbe Datei. Neuen Avatar einsetzen = diese Datei ersetzen, sonst nichts.
Grund für den Crop: das transparente Ganzkörper-PNG wurde in 28–32-px-Kreisen (Chat, FAB) zu einem dunklen Punkt.

**Sprachausgabe (ElevenLabs) ist AKTUELL TOT**: `ELEVENLABS_API_KEY` in `backend/.env` enthält eine Key-**ID**, keinen API-Key. ElevenLabs-Keys beginnen mit `sk_`. API antwortet `invalid_api_key`.
- `POST /api/voice/tts` liefert seither `{"audio_url": "", "error": "elevenlabs_invalid_api_key"}` (200, bewusst degradiert) und die UI zeigt einen Hinweis-Toast statt stumm nichts zu tun.
- Fix: echten `sk_...`-Key in `backend/.env` setzen → `sudo supervisorctl restart backend` → prüfen mit
  `curl -s -X POST $URL/api/voice/tts -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"text":"Test","persona":"wlad"}'` → `audio_url` muss mit `data:audio/mpeg;base64,` beginnen.

---

## 7. Nachtrag Iter 136 — E-Mail-Versand, Lizenz-Wiederanmeldung, „Über mich"

**E-Mail (einziger Choke Point: `services_email.send_email`)**
- Verifizierte Absender-Domains bei Resend: `leaderos.de`, `leadercheck.de`, `leader-os.de` (alle verified). Absender kommt aus `SENDER_EMAIL` (aktuell `wlad@leaderos.de`).
- Vor JEDEM Versand läuft `_sendability()`: ungültige Syntax, Test-/Reserved-Domains (`.test`, `.local`, `.invalid`, `example.com`, `wladbot.test`) und Adressen auf der Sperrliste werden blockiert. Rückgabe: `{"sent": false, "error": "blocked:<grund>"}` + Warn-Log. Es gibt keinen Pfad daran vorbei.
- Bei permanentem Resend-Fehler → `suppress_email()`: Eintrag in `email_suppression` + `users.email_status = "invalid"`. Diese Adresse wird nie wieder automatisch angeschrieben (Schutz der Absender-Reputation).
- Sperrliste aufheben: Dokument aus `email_suppression` löschen (oder der User klickt einen Magic Link → wird automatisch entsperrt).
- `email_verified: true` wird gesetzt bei OAuth-Login und bei Magic-Link-Klick (`email_verified_via`).
- **Nicht in unserem Repo**: die Supabase-Edge-Function von leadercheck.de verschickt eigene Mails über Resend. Deren 403-Fehler in den Resend-Logs stammen von dort — dort muss der Absender ebenfalls auf eine verifizierte Domain gesetzt werden.

**Lizenz-Wiederanmeldung** (`POST /api/auth/license/activate`)
- Bereits eingelöster Key + gleiche E-Mail + korrektes Passwort → normaler Re-Login (`relogin: true`), es wird nichts doppelt aktiviert.
- Andere E-Mail → 400. Falsches Passwort → 401. Google/Apple-Konto → 409 mit Hinweis.

**„Über mich"** (`users.about_me`, max. 6000 Zeichen)
- Bearbeitbar unter Profil → „Über mich"; `PATCH /api/profile/me`.
- Fließt über `services.get_user_memory()` in JEDEN AI-Workflow (Chat, Video-Analyse, Voice) — dort steht der Block „ÜBER MICH". Kein zweiter Kontext-Pfad, nicht in Prompts duplizieren.

**Stripe-Rechnung**: Verkäufer-Angaben stehen in `INVOICE_FOOTER` / `INVOICE_SELLER` (`routes/payments.py`): Argumentorik-Akademie GmbH, Tölzer Str. 1, 82031 Grünwald, info@argumentorik.com. Der **Kontoname und die Support-Telefonnummer auf Stripe-Belegen** kommen aus den Stripe-Dashboard-Einstellungen (Business/Public details) — nur dort änderbar.

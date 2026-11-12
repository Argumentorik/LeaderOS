# WLAD AI Leader OS — Technical Requirements & QA Checklist
## Version 7.3 · Deploy-Ready · Stand: 13. Februar 2026

---

## 1. SYSTEM-ARCHITEKTUR

| Komponente | Technologie | Port |
|---|---|---|
| Frontend | React 18 + Tailwind CSS + Shadcn UI | 3000 |
| Backend | FastAPI (Python) + Uvicorn | 8001 |
| Datenbank | MongoDB (Motor async driver) | 27017 |
| Payments | Stripe via `emergentintegrations` | — |
| KI | OpenAI GPT-5.2 + Whisper via `emergentintegrations` | — |
| Auth | JWT + Session Cookies + Google OAuth (Emergent Auth) | — |

### Environment Variables (Backend `.env`)
```
MONGO_URL=<mongodb-connection-string>
DB_NAME=<database-name>
EMERGENT_LLM_KEY=<universal-llm-key>
JWT_SECRET=<jwt-secret>
OAUTH_SESSION_URL=<google-oauth-session-url>
STRIPE_API_KEY=<stripe-key>
CORS_ORIGINS=<allowed-origins>
```

### Environment Variables (Frontend `.env`)
```
REACT_APP_BACKEND_URL=<production-url>
```

---

## 2. DATENBANK — MongoDB Collections (24 total)

| Collection | Zweck | Kritisch |
|---|---|---|
| `users` | User-Profile (email, scores, preferences, premium) | JA |
| `user_sessions` | Session Tokens (session_token, user_id, expires_at) | JA |
| `chat_messages` | KI-Coach Nachrichten | JA |
| `chat_sessions` | Chat-Session-Verwaltung | JA |
| `challenge30_progress` | 30-Tage Challenge Fortschritt (completed_days, quiz_scores, xp) | JA |
| `payment_transactions` | Stripe Payment History | JA |
| `referral_codes` | Referral-Codes + Tracking | JA |
| `activity_log` | User-Aktivitäten + XP | MITTEL |
| `simulations` | Leadership-Simulationen | MITTEL |
| `video_challenges` | Video-Missionen + KI-Analyse | MITTEL |
| `daily_checkins` | Tägliche Check-ins | MITTEL |
| `playbook_sessions` | Workflow-Sessions | MITTEL |
| `wladhub_diagnoses` | WladHub 3-Layer Diagnose-Daten | MITTEL |
| `tasks` | Aufgaben-Verwaltung | NIEDRIG |
| `score_history` | Score-Verlauf | NIEDRIG |
| `enterprise_leads` | Enterprise-Funnel Leads | NIEDRIG |
| `advice_reports` | PDF-Report-Daten | NIEDRIG |
| `challenges` | Challenger-Interview-Daten | NIEDRIG |
| `events` | Events | NIEDRIG |
| `files` | Upload-Referenzen | NIEDRIG |
| `tool_usage` | Tool-Nutzung | NIEDRIG |
| `social_shares` | Social Sharing Tracking | NIEDRIG |
| `wladhub_sync_log` | WladHub Sync-Log | NIEDRIG |
| `event_registrations` | Event-Registrierungen | NIEDRIG |

### Daten-Transfer Checkliste
- [ ] Alle 24 Collections migriert
- [ ] User-Dokumente enthalten: user_id, email, name, password_hash, scores, xp, level, premium, created_at
- [ ] Session-Dokumente enthalten: session_token, user_id, expires_at
- [ ] Keine `_id` Felder in API-Responses (wird serverseitig exkludiert)
- [ ] Index auf `users.email` (unique)
- [ ] Index auf `users.user_id` (unique)
- [ ] Index auf `user_sessions.session_token`
- [ ] Index auf `activity_log.user_id` + `created_at`

---

## 3. AUTHENTIFIZIERUNG — Kritische Flows

### 3.1 E-Mail/Passwort Login
```
POST /api/auth/login
Body: {"email": "...", "password": "..."}
→ Returns: {token: "JWT", user: {...}}
→ Sets: session_token Cookie (httponly, 7 Tage)
```
**Test-Checkliste:**
- [ ] Login mit korrekten Credentials → 200 + Token + Cookie
- [ ] Login mit falschem Passwort → 401 "Invalid credentials"
- [ ] Login mit nicht-existenter E-Mail → 401 "Invalid credentials"
- [ ] Token wird im Frontend als `localStorage.wladbot_token` gespeichert
- [ ] Alle nachfolgenden API-Calls senden `Authorization: Bearer <token>`

### 3.2 Google OAuth Login
```
1. Frontend → redirect zu https://auth.emergentagent.com/?redirect=<origin>/auth-callback
2. Google Auth → redirect zu <origin>/auth-callback?session_id=<id>
3. Frontend POST /api/auth/google-session {session_id: "..."}
4. Backend verifiziert Session bei Emergent Auth Server
5. Erstellt/Updated User + Session → Returns Token
```
**Test-Checkliste:**
- [ ] Google Login Button öffnet Emergent Auth URL
- [ ] Callback-Page (`/auth-callback`) verarbeitet session_id korrekt
- [ ] Neuer Google-User wird automatisch erstellt
- [ ] Bestehender Google-User wird aktualisiert (Name, Bild)
- [ ] Cookie wird gesetzt (httponly, secure, samesite=none)

### 3.3 Session-Verwaltung
- Sessions laufen nach **7 Tagen** ab
- Dual-Auth: Cookie (session_token) ODER JWT Bearer Token
- Logout löscht Session aus DB + Cookie
- **Test:** Nach 7 Tagen → automatischer Logout

---

## 4. API-ENDPOINTS — Vollständige Liste

### Auth (`/api/auth/`)
| Method | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/auth/register` | Registrierung |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google-session` | Google OAuth |
| GET | `/api/auth/me` | Aktueller User |
| PUT | `/api/auth/profile` | Profil + Rating-Preferences updaten |
| POST | `/api/auth/logout` | Logout |

### Dashboard
| GET | `/api/dashboard-v4` | Vollständiges Dashboard (inkl. challenge30) |

### KI-Coach Chat (`/api/chat/`)
| POST | `/api/chat/send` | Nachricht senden |
| GET | `/api/chat/sessions` | Chat-Sessions |
| GET | `/api/chat/sessions/<id>` | Session-Details |

### 30-Tage Challenge (`/api/challenge30/`)
| GET | `/api/challenge30/status` | Status + Fortschritt |
| GET | `/api/challenge30/quiz/<day>` | Quiz-Fragen für Tag X |
| POST | `/api/challenge30/submit` | Quiz-Ergebnis einreichen |

### Video Missionen (`/api/`)
| GET | `/api/video-challenges` | Alle Missionen |
| POST | `/api/video-challenges/<id>/analyze` | Video analysieren (+ Rating-Params) |
| GET | `/api/rating-preferences` | Rating-Einstellungen |

### Payments (`/api/payments/`)
| GET | `/api/payments/packages` | Pricing (997/4997/2497 EUR) |
| POST | `/api/payments/create-checkout` | Stripe Checkout starten |
| GET | `/api/payments/history` | Zahlungsverlauf |

### Weitere
| GET/POST | `/api/simulations/*` | Leadership-Simulationen |
| GET/POST | `/api/challengers/*` | Challenger-Interviews |
| GET/POST | `/api/playbooks/*` | Guided Workflows |
| GET/POST | `/api/tools/*` | Leadership-Tools |
| GET/POST | `/api/checkin/*` | Daily Check-in |
| GET/POST | `/api/referral/*` | Referral-System |
| POST | `/api/enterprise/submit` | Enterprise-Lead |
| POST | `/api/wladhub/sync` | WladHub-Diagnose sync |

---

## 5. FRONTEND-SEITEN — Routing

| Route | Seite | Auth Required |
|---|---|---|
| `/` | Landing Page (Hormozi Grand Slam Offer) | NEIN |
| `/auth-callback` | Google OAuth Callback | NEIN |
| `/dashboard` | Haupt-Dashboard | JA |
| `/chat` | KI-Coach (5 Rollen) | JA |
| `/challenge` | 30-Tage Challenge | JA |
| `/simulations` | Leadership-Simulationen | JA |
| `/challengers` | Challenger-Interviews | JA |
| `/missions` | Video-Missionen + Rating-Config | JA |
| `/tools` | Leadership-Tools/Workflows | JA |
| `/playbooks` | Guided Playbooks | JA |
| `/coaching` | Coaching Hub + FAQ | JA |
| `/referral` | Referral-Dashboard | JA |
| `/enterprise` | Enterprise-Funnel | JA |
| `/payment-success` | Nach Stripe-Zahlung | JA |

---

## 6. KRITISCHE QA-TESTS (Manuell)

### 6.1 Login & Registrierung
- [ ] **E-Mail-Registrierung:** Name, E-Mail, Passwort → User wird erstellt → Dashboard
- [ ] **E-Mail-Login:** E-Mail + Passwort → Token → Dashboard
- [ ] **Google Login:** Button → Google Auth → Callback → Dashboard
- [ ] **Doppelte E-Mail:** Registrierung mit bestehender E-Mail → Fehler 400
- [ ] **Session-Persistenz:** Browser schließen → Öffnen → Noch eingeloggt (7 Tage)
- [ ] **Logout:** Klick → Session gelöscht → Zurück zur Landing Page
- [ ] **Ungültiger Token:** Manipulierter Token → 401 → Redirect zu Login

### 6.2 Dashboard
- [ ] Leader Score Ring zeigt korrekten Composite-Score
- [ ] WladHub 3-Layer Scores werden angezeigt
- [ ] 30-Tage Challenge Card mit Fortschritt und Tag-Badge
- [ ] Quick Actions (6 Icons) navigieren zu richtigen Seiten
- [ ] Streak-Anzeige funktioniert
- [ ] Referral-Card zeigt Code

### 6.3 30-Tage Challenge
- [ ] 30 Tage angezeigt, in 4 Wochen gruppiert (W01-W04)
- [ ] Tag 1 Quiz sofort startbar für neue User
- [ ] Quiz zeigt 10 Fragen pro Tag
- [ ] Antworten werden gespeichert
- [ ] Ergebnis zeigt Score %, XP, richtig/falsch mit Erklärungen
- [ ] Abgeschlossene Tage grün markiert mit Score-Badge
- [ ] "Wiederholen" Button bei abgeschlossenen Quizzen
- [ ] Versäumte Tage nachholbar ("Nachholen" Button)

### 6.4 KI-Coach Chat
- [ ] 5 Rollen wählbar (Kommunikator, Manager, Team-Leader, Psychologe, Problemlöser)
- [ ] Nachricht senden → KI antwortet auf Deutsch
- [ ] Session-Verlauf bleibt erhalten
- [ ] Structured Response mit Insights + Action Steps

### 6.5 Video Missionen + Rating
- [ ] 4 Missionen sichtbar
- [ ] Rating-Config (Soft/Hard + Level + Focus + Audience) anpassbar
- [ ] Einstellungen werden global gespeichert
- [ ] Kamera-Aufnahme startet
- [ ] Upload + KI-Analyse mit Scores
- [ ] Wlad-Assessment im Ergebnis

### 6.6 Payments
- [ ] Packages: Standard €997, Accelerator €4.997, Enterprise €2.497
- [ ] Stripe Checkout wird korrekt geöffnet
- [ ] Nach Zahlung → Payment Success Page
- [ ] User wird als Premium markiert

### 6.7 Referral
- [ ] Referral-Code wird generiert (WLAD-XXXXX Format)
- [ ] Link kopierbar
- [ ] Leaderboard zeigt Referrer

### 6.8 Enterprise
- [ ] Funnel mit 12 Fragen
- [ ] Lead wird in DB gespeichert
- [ ] Danke-Bestätigung

---

## 7. SICHERHEIT

| Bereich | Status | Details |
|---|---|---|
| Passwort-Hashing | SHA-256 (hashlib) | Kein Klartext gespeichert |
| JWT | HS256 mit SECRET aus .env | 7 Tage Laufzeit |
| Session Cookies | httponly, samesite, secure | Kein JS-Zugriff |
| CORS | Konfigurierbar via .env | Production: nur eigene Domain |
| MongoDB _id | Ausgeschlossen aus Responses | Kein ObjectId Leak |
| Input Validation | Pydantic Models + Sanitization | rating_preferences validiert |
| Error Handling | Try/Catch auf allen Routes | Keine Stack Traces an Client |
| Stripe Keys | Aus Environment | Nicht im Code |

---

## 8. PERFORMANCE

- **Frontend:** React mit Code-Splitting, Tailwind (purged CSS)
- **Backend:** Async FastAPI + Motor (non-blocking MongoDB)
- **Sessions:** MongoDB-basiert (skaliert horizontal)
- **KI-Calls:** Async via emergentintegrations
- **PDF-Generation:** Client-seitig (jspdf + html2canvas) — keine Server-Last

---

## 9. DEPLOYMENT-CHECKLISTE

### Pre-Deploy
- [ ] Alle Tests grün (Iteration 33: 24/24)
- [ ] Environment Variables korrekt in Production `.env`
- [ ] `CORS_ORIGINS` auf Production-Domain einschränken
- [ ] `secure=True` auf Session-Cookie für HTTPS
- [ ] MongoDB Production-Instanz bereit
- [ ] Stripe Keys auf Live-Mode umgestellt (nach Testing)

### Post-Deploy
- [ ] Landing Page lädt (check: "Die Top 1% der Führungskräfte nutzen KI strategisch")
- [ ] Registrierung funktioniert (neue E-Mail)
- [ ] Login funktioniert (registrierte E-Mail)
- [ ] Google Login funktioniert (OAuth Redirect + Callback)
- [ ] Dashboard lädt mit allen Komponenten
- [ ] KI-Coach antwortet auf Deutsch
- [ ] 30-Tage Challenge Quiz startbar
- [ ] Video-Aufnahme + Analyse funktioniert
- [ ] Stripe Checkout öffnet sich
- [ ] Referral-Code generierbar
- [ ] Alle Navigationen funktionieren

### Daten-Integrität nach Migration
- [ ] User-Accounts existieren mit korrekten Feldern
- [ ] Passwort-Hashes funktionieren (Login mit bekanntem Passwort testen)
- [ ] Sessions werden korrekt erstellt/geprüft
- [ ] Challenge30-Fortschritt bleibt erhalten
- [ ] Chat-Historien sind abrufbar
- [ ] Payment-Transaktionen vorhanden

---

## 10. RATE LIMITING

In-Memory Sliding-Window Rate Limiter per IP (`/app/backend/middleware/__init__.py`):

| Endpoint-Tier | Limit | Fenster | Zweck |
|---|---|---|---|
| `/api/auth/login`, `/api/auth/register` | 10 req | 60 sec | Brute-Force Schutz |
| `/api/chat/send`, `*/analyze` | 20 req | 60 sec | KI-Kosten-Schutz |
| Alle anderen `/api/*` | 120 req | 60 sec | General Protection |
| Non-API (Frontend) | Unlimited | — | Kein Limit |

Bei Überschreitung: `HTTP 429` + `{"detail": "Too many requests. Bitte warte einen Moment."}` + `Retry-After` Header.

---

## 11. SESSION TTL & AUTO-CLEANUP

- MongoDB TTL-Index auf `user_sessions.expires_at` (`expireAfterSeconds=0`)
- Sessions laufen nach **7 Tagen** ab
- MongoDB löscht abgelaufene Sessions **automatisch** (Background-Task, ~60 sec Interval)
- `expires_at` wird als native `datetime` gespeichert (nicht als String)
- Bestehende String-Sessions werden beim Startup automatisch konvertiert

---

## 12. KNOWN LIMITATIONS

1. **Session Cleanup** — TTL-Index aktiv, MongoDB bereinigt automatisch. Bei extremer Last: Shard-Awareness prüfen.
2. **Rate Limiting** — In-Memory (nicht cluster-aware). Bei Multi-Pod-Deployment: Redis-basiertes Rate Limiting empfohlen.
3. **E-Mail Verification** — Keine E-Mail-Bestätigung bei Registrierung.

---

## 11. IP-ADDRESS & LOGIN TRACKING

Jeder Login (E-Mail + Google OAuth) speichert:

### Im User-Dokument (`users` Collection)
```json
{
  "signup_ip": "203.0.113.42",
  "last_login_ip": "203.0.113.42",
  "last_login_at": "2026-02-13T10:30:00+00:00",
  "login_history": [
    {"ip": "203.0.113.42", "at": "2026-02-13T10:30:00+00:00", "method": "email"},
    {"ip": "198.51.100.7", "at": "2026-02-14T08:15:00+00:00", "method": "google"}
  ]
}
```
- `signup_ip`: IP bei Registrierung (einmalig)
- `last_login_ip`: Letzte Login-IP (wird bei jedem Login überschrieben)
- `login_history`: Array mit max. 50 Einträgen (method: "email" oder "google")

### In Session-Dokumenten (`user_sessions` Collection)
```json
{
  "session_token": "sess_abc123...",
  "user_id": "user_xyz...",
  "ip_address": "203.0.113.42",
  "expires_at": "2026-02-20T10:30:00+00:00",
  "created_at": "2026-02-13T10:30:00+00:00"
}
```

### IP wird extrahiert aus:
1. `X-Forwarded-For` Header (Kubernetes/Nginx Proxy)
2. Fallback: `request.client.host`

---

## Test-Account für QA
- **E-Mail:** test@test.com
- **Passwort:** test123

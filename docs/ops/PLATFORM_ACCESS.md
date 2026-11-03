# Platform-Access — Emergent-Backend von Vercel-Frontend nutzen

> Stand 2026-06-11. Frontend läuft auf Vercel (`leader-os` Projekt,
> Production-Branch `mvpcode`). Backend läuft weiter auf Emergent
> (`command-center-229.preview.emergentagent.com`). Diese Doku
> erklärt was du in Emergent + Supabase einstellen musst damit Login,
> Chat, Dashboard etc. von leader-os.de funktionieren.

## Aktuelle Wiring

```
Browser (leader-os.de)
  │
  ▼
Vercel Edge
  │ ── statische Assets   → CDN
  │ ── /api/* (Rewrite)   → https://command-center-229.preview.emergentagent.com/api/*
  │                                │
  │                                ▼
  │                          Emergent FastAPI
  │                                │
  │                                ▼
  │                          MongoDB + Supabase
  │
  ▼
OAuth Provider (Google/Apple/Microsoft)
  │
  ▼ Callback
  Supabase Auth → setzt Session-Cookie
  │
  ▼
Browser zurück auf leader-os.de mit ?session_id=… im Hash
```

## Was funktioniert out-of-the-box

- ✅ Statisches Frontend (Landing, Login-Page, FAQ, AGB)
- ✅ `/api/*` Aufrufe vom Frontend (via Vercel-Rewrite)
- ✅ Cookies auf leader-os.de (Vercel SSL, Same-Origin)
- ✅ Stripe-Checkout (Stripe.js sieht beide Domains)
- ✅ PostHog Analytics
- ✅ Lead-Capture (PostHog + jetzt auch backend-Endpoint, sobald gelive)

## Was du in Emergent prüfen/einstellen musst

### 1. CORS-Allowlist im Backend

Wenn auf Emergent die `CORS_ORIGINS` Env-Var **explizit gesetzt** ist,
muss `leader-os.de` und `www.leader-os.de` drin sein. Default
(`CORS_ORIGINS=""` oder `*`) erlaubt eh alles.

**Prüfen:**
- Emergent Dashboard → Backend → Environment Variables
- Falls `CORS_ORIGINS` gesetzt: füge hinzu
  `https://leader-os.de,https://www.leader-os.de,https://leader-check.de,https://www.leader-check.de`
- Falls leer/Sternchen: nichts tun

### 2. Resend Sender-Domain

Mails (Magic-Link, Welcome, Receipt) gehen über Resend von
`reminders@leader-os.de`. **In Resend Dashboard:**
- Domains → leader-os.de muss verifiziert sein (DKIM + SPF)
- Falls noch nicht: DNS-Records die Resend zeigt in GoDaddy eintragen
- Status muss "Verified" sein bevor du Live-Mails versendest

## Was du in Supabase prüfen/einstellen musst

### 1. OAuth Redirect URLs

**Wo:** Supabase Dashboard → Project `srujvjjncrszhaaxepxf` →
Authentication → URL Configuration

**Site URL muss sein:**
```
https://leader-os.de
```

**Redirect URLs Allowlist muss enthalten:**
```
https://leader-os.de/**
https://www.leader-os.de/**
https://leader-check.de/**
https://www.leader-check.de/**
http://localhost:3000/**            (für lokales Dev)
```

Sonst gibt Supabase nach OAuth-Login einen "redirect_to not allowed"
Fehler.

### 2. Magic-Link-Email-Template

Wo: Authentication → Email Templates → Magic Link

Der `{{ .ConfirmationURL }}` muss auf leader-os.de zeigen, nicht auf
die alte Emergent-Domain. Wenn das Template aus der Emergent-Zeit
noch eine andere Domain hardcoded hat → updaten.

### 3. Storage-Bucket (für Uploads)

Wo: Storage → wladbot-uploads

- Soll `private` sein
- CORS-Allow-Origins müssen leader-os.de + leader-check.de enthalten
- File-Size-Limit auf 5 MB

## Smoke-Test nach Konfig-Changes

In dieser Reihenfolge, im Browser auf leader-os.de:

```
1. Landing            → https://leader-os.de/                ✅ 200
2. Login UI           → https://leader-os.de/login           ✅ 200
3. Login mit Google   → Redirect → /dashboard                ✅
4. Dashboard lädt     → User-Daten erscheinen                ✅
5. WladBot-Chat       → erste Antwort in <3s                 ✅
6. /api/health        → https://leader-os.de/api/health      ✅ {"status":"ok"}
7. /api/monitoring/system → JSON overall:"go"                ✅
```

Wenn alle 7 grün — Platform läuft komplett über die neue Domain.

## Wo kann was schief gehen

| Symptom | Ursache | Fix |
|---|---|---|
| Login: "redirect_to not allowed" | Supabase Redirect URL fehlt | Allowlist erweitern (siehe oben §1) |
| Login OK, Dashboard leer | Cookie nicht gesetzt (CORS) | CORS_ORIGINS in Emergent prüfen |
| Magic-Link führt nach Emergent | Email-Template alt | Template updaten |
| WladBot-Chat 401 | Auth-Token nicht weitergereicht | `withCredentials:true` in api.js — sollte schon drin sein |
| Stripe-Checkout 404 | Stripe-Webhook auf alte Domain | Stripe Dashboard → Webhooks → URL auf leader-os.de/api/webhook/stripe |
| Uploads 403 | Supabase Storage Bucket-Policy | Bucket-Policy in Supabase prüfen |

## Wenn das alles passt — bist du live

Das ist die finale Vor-Launch-Checkliste. Sobald alle 7 Smoke-Test
Punkte grün sind, kannst du Google Ads, LinkedIn Posts, Newsletter
freischalten — alle Klicks landen sauber auf der neuen Platform und
die Sessions werden korrekt etabliert.

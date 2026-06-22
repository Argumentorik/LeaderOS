# Leader OS (vormals WLADHUB) - Product Requirements Document

## Architecture (Feb 2026)
```
/app/backend/
├── server.py          # 101 Zeilen — App Setup, Config, Health, User/Create
├── models.py          # 11 Pydantic Models
├── email_templates.py # 4 E-Mail Templates (Leader OS Branding)
├── routes/
│   ├── auth.py       # Auth, Privacy, GDPR, Quick-Login (Phone/Email)
│   ├── quiz.py       # Quiz, Report, Coach (6-Rollen-Scoring)
│   ├── payments.py   # Stripe, License Keys (LEADEROS-XXXX)
│   ├── email.py      # Resend E-Mails (Welcome, Report, Plan, Payment)
│   └── admin.py      # Dashboard Stats, Users, Transactions, Bookings
└── services/         # pricing, license_keys, enterprise_pricing, admin_emails
```

## Implemented (Latest first)
- [x] **Feb 2026 (Iter 28) — Leader OS Rebrand + Quick-Login + Auto-Redirect**:
  - **Typographic Logo**: Neue `LeaderOSLogo.jsx` Komponente (variants: default/stacked/mark, sizes sm→xl) — pure CSS/SVG, kein Asset. Integration in Navbar + Login + Hero-Footer.
  - **Globale Rebrand**: Alle user-facing "WLADHUB"-Texte ersetzt durch "Leader OS" (Hero, Login, Analyzing, Report, Roadmap, Admin, ActivateKey, PaymentSuccess, Pricing, PDFs, E-Mails, index.html SEO, Resend "from"-Felder, ActivateKey mailto-Link).
  - **License-Key Prefix**: Neue Keys generieren als `LEADEROS-XXXX-XXXX-XXXX` (Legacy `WLAD-` und `WLADHUB-` Keys bleiben via DB-Lookup gültig).
  - **Auto-Redirect nach Stripe-Kauf**: PaymentSuccess.jsx zeigt animierten 5-Sekunden-Countdown (Kreis-Progress + Live-Sekunden-Text) und leitet automatisch zu `https://leaderos.de` weiter. "Abbrechen"-Button stoppt Auto-Redirect.
  - **Phone/Email Quick-Login**: Neue `POST /api/auth/quick-login` (Phone-Match via Tail-Regex `{digits}$`, Email case-insensitive durch Lower-Case-Normalisierung in `upsert_user`). Frontend: Login.jsx hat neues Quick-Login-Formular zusätzlich zu Google-OAuth. Unbekannte Identifier → Routing in `/diagnose` mit Prefill (max. Registrierungsrate).
  - **Test-Verifikation**: Iteration 28 — 14/14 Backend-Pytest PASS, Frontend voll verifiziert (Logo, Quick-Login, Countdown, Branding-Cleanup).
- [x] **Feb 2026 — Production Polish**: SEO, Schema.org, Favicon, Phone-Pflicht, Stripe Email-Hint, Direct-Purchase-Buttons, Bracket-Style Design-System
- [x] **Feb 2026 — CRITICAL Stripe-Pricing-Bug**: 100x-Bug (Cents/EUR-Verwechslung in emergentintegrations) gefixt + Range-Assertion 1–100000
- [x] **Feb 2026 — P2 Polish**: Single Source of Truth Pricing (`services/pricing.py`), Type-Hints, Test-Cleanup
- [x] **Feb 2026 — Code Quality**: Routes-Komplexität alle grade B (CC≤10), Service-Layer eingeführt
- [x] **Feb 2026 — Component Splitting**: HighTicketClose.jsx 633→257 Zeilen
- [x] **Feb 2026 — Stripe-Subscription-Wiring (P3)** + Auto-Switch via `_is_real_stripe_key`
- [x] **Feb 2026 — Pricing Overhaul**: 3 Tiers (997€ / 4.447€ / Enterprise) + Enterprise-Rabatt-Rechner
- [x] Admin Dashboard + Bookings + License Keys + Enterprise Inquiries
- [x] Resend E-Mail (6 Flows) + Video-Plattform (/kurse)
- [x] Backend-Refactoring: server.py modularisiert (1165 → 101 Zeilen)
- [x] WladBot Chat fließt in Report ein + Personalisierter 30-Tage-Plan PDF
- [x] Admin-Login serverseitig (echtes JWT/Passwort-Hashing)
- [x] Full Funnel mit Hyperpersonalisierung (30 Fragen → 6-Rollen-Scoring → KI-Report)

## Pricing (Feb 2026)
- **Leadership OS** — 997€/Jahr · 14-Tage-Trial · 12 Videokurse
  - Einmal 997€ · 2 Raten à 550€ · 12 Raten à 99€ (= 1.188€)
- **Leadership OS PLUS** — 4.447€/Jahr · inkl. 12 Einzelcoachings
- **Leadership OS ENTERPRISE** — Custom · B2B-Volumen-Rabatte (5 MA→10%, …, 200→50%)

## Backlog / Next
- **P1**: Live-Funnel-Chart im Admin-Dashboard (7-Tage-Konversion-Grafik)
- **P1**: Echte Vimeo Video-IDs in `Kurse.jsx` (aktuell Dummy-Platzhalter — MOCKED)
- **P2**: Component-Splitting: Hero.jsx, Report.jsx, Roadmap.jsx (groß)
- **P2**: WladBot Sprach-Coach (Mobile/Audio)
- **P3 / Security-Hardening**:
  - Quick-Login 404 ist enumerable (User-Erkennung möglich) — vor Public-Launch ggf. Rate-Limit + uniform-Latency
  - Quick-Login Email-Lookup nutzt jetzt normalisierte Lower-Case-Emails (in upsert_user); Phone-Regex ist via `tail$` verankert

## Routes
/ | /login | /diagnose | /diagnose-guest | /quiz | /analyzing | /report | /roadmap | /close | /payment-success | /activate | /kurse | /admin

## Key APIs
- `POST /api/auth/quick-login` — Phone or Email returning-user login (NEW)
- `POST /api/auth/session` — Google OAuth exchange
- `POST /api/payments/create-checkout-session` — Stripe (one-time + subscriptions)
- `GET /api/payments/status/{session_id}` — Stripe payment status (used by PaymentSuccess)
- `POST /api/license/activate` — Aktiviert Key + liefert `redirect_url: https://leaderos.de`
- `POST /api/user/create` — Funnel-Start-User (Phone Pflicht)

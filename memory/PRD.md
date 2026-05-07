# WLADHUB - Product Requirements Document

## Architecture (Refactored Feb 2026)
```
/app/backend/
├── server.py          # 101 Zeilen — App Setup, Config, Health, User/Create
├── models.py          # 11 Pydantic Models
├── email_templates.py # 4 E-Mail Templates
├── routes/
│   ├── auth.py       # Auth, Privacy, GDPR
│   ├── quiz.py       # Quiz, Report, Coach (6-Rollen-Scoring)
│   ├── payments.py   # Stripe, License Keys (WLAD-XXXX)
│   ├── email.py      # Resend E-Mails (Welcome, Report, Plan, Payment)
│   └── admin.py      # Dashboard Stats, Users, Transactions, Bookings
```

## Pricing (Feb 2026 — Komplettoverhaul)
- **Leadership OS** — 997€/Jahr · 14-Tage-Trial · 12 Videokurse (1/Monat)
  - Einmalzahlung 997€
  - 2 Raten à 550€ = 1.100€ (+103€ Aufschlag)
  - 12 Raten à 99€ = 1.188€ (+191€ Aufschlag)
- **Leadership OS PLUS** — 4.447€/Jahr Einmalzahlung · inkl. 12 Einzelcoachings (à 299€ Wert)
- **Leadership OS ENTERPRISE** — Preis auf Anfrage · B2B-Volumen-Rabatte (5 MA→10%, 10→15%, 20→20%, 50→30%, 100→40%, 200→50%)

## Implemented
- [x] Full Funnel mit Hyperpersonalisierung
- [x] **Feb 2026 — Code Quality Refactoring**: Routes-Komplexität dramatisch reduziert. `register_admin_routes` (CC 34 → grade A), `register_payment_routes` (CC 44 → split in checkout/license registrar), `generate_ai_narrative` (CC 19 → grade B mit 4 Helpers). Alle Funktionen laut radon jetzt grade B (CC≤10). Neuer `services/`-Layer (`admin_emails.py`, `enterprise_pricing.py`, `license_keys.py`) — Logik raus aus Routes. `admin.py` split in 3 Registrare (`register_admin_routes`, `register_booking_routes`, `register_enterprise_routes`). 29/29 Backend-Regressionstests PASS.
- [x] **Feb 2026 — Cleanup & Refactoring**: Alle Legacy-Referenzen aus aktiven Code-Pfaden entfernt. HighTicketClose.jsx 633→257 Zeilen via Component-Splitting nach `/components/pricing/*`.
- [x] **Feb 2026 — Stripe-Subscription-Wiring (P3)**: Backend wired für echte Subscription-Mode. Helper `_is_real_stripe_key` schaltet automatisch um, sobald echter Stripe-Key gesetzt wird. Mit Emergent-Test-Key sauber Fallback auf Einmalzahlung des Gesamtbetrags.
- [x] **Feb 2026 — Pricing Overhaul**: 3 neue Tiers (Leadership OS / OS PLUS / Enterprise) mit Live-Rabatt-Rechner + Inquiry-Form + Resend-E-Mails
- [x] Admin Dashboard + Bookings + License Keys + Enterprise Inquiries
- [x] Resend E-Mail (6 Flows)
- [x] Video-Plattform (/kurse)
- [x] Backend-Refactoring: 1165 → 101 Zeilen server.py
- [x] **Feb 2026 — WladBot Chat fließt in Report ein**: Q30-Chat als `chat_context` → AI-Prompt → `personal_response`-Feld
- [x] **Feb 2026 — Personalisierter 30-Tage-Plan PDF**
- [x] **Feb 2026 — Report UI "Wlad hat dir zugehört"-Card**
- [x] **Feb 2026 — Admin-Login serverseitig**: ENV-Var + `/api/admin/login`

## Routes
/ | /diagnose | /quiz | /analyzing | /report | /roadmap | /close | /payment-success | /activate | /kurse | /admin

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
- [x] **Feb 2026 — P2 Polish**: (a) **Single Source of Truth Pricing**: Neuer `services/pricing.py` mit `PACKAGES`, `PLAN_CONFIG`, `PLAN_AMOUNT_MAP`. `routes/payments.py` und `services/license_keys.py` re-exportieren von dort. (b) **Type-Hint Coverage**: Alle Public API Route Handlers in admin.py/payments.py/quiz.py haben jetzt Parameter & Return Types (`-> dict`, `Optional[str]`, etc.). TypedDict für `PlanConfig` und `PackageConfig`. (c) **Test-File Cleanup**: 6 Test-Files konvertiert — alle `== True/False` und `is True/False` Boolean-Vergleiche durch direkte Truthy/Falsy-Checks ersetzt. 29/29 Regressionstests grün.
- [x] Full Funnel mit Hyperpersonalisierung
- [x] **Feb 2026 — Code Quality Refactoring**: Routes-Komplexität dramatisch reduziert. Alle Funktionen jetzt grade B (CC≤10).
- [x] **Feb 2026 — Cleanup**: Alle Legacy-Referenzen entfernt; HighTicketClose.jsx 633→257 Zeilen
- [x] **Feb 2026 — Stripe-Subscription-Wiring (P3)**: Auto-Switch via `_is_real_stripe_key` Helper
- [x] **Feb 2026 — Pricing Overhaul**: 3 Tiers + Enterprise-Rabatt-Rechner
- [x] Admin Dashboard + Bookings + License Keys + Enterprise Inquiries
- [x] Resend E-Mail (6 Flows)
- [x] Video-Plattform (/kurse)
- [x] Backend-Refactoring: 1165 → 101 Zeilen server.py
- [x] **Feb 2026 — WladBot Chat fließt in Report ein**
- [x] **Feb 2026 — Personalisierter 30-Tage-Plan PDF**
- [x] **Feb 2026 — Report UI "Wlad hat dir zugehört"-Card**
- [x] **Feb 2026 — Admin-Login serverseitig**

## Routes
/ | /diagnose | /quiz | /analyzing | /report | /roadmap | /close | /payment-success | /activate | /kurse | /admin

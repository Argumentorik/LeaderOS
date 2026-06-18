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
- [x] **Feb 2026 — Production Polish (Pre-Redeploy)**: (a) **SEO/Google Indexing**: vollständige Meta-Tags in `index.html` (Title, Description, Keywords, OG, Twitter Cards, Canonical zu leader-check.de, Schema.org JSON-LD: Organization + WebSite + Service). Neue `robots.txt` + `sitemap.xml`. (b) **Favicon**: Sourced von leader-os.de/apple-touch-icon.png, generiert 16x16/32x32/180x180/ICO. (c) **Phone-Pflicht**: `UserCreate.phone: str = Field(min_length=6, max_length=30)` + Frontend Phone-Input mit Validation Regex + lime-Helper-Text "Nutze dieselbe E-Mail wie für Leader-OS". (d) **Stripe Email-Hint**: Banner in PaymentSection erinnert User, dieselbe E-Mail wie für Leader-OS zu nutzen. (e) **Direct Purchase auf Final CTA**: 3 Buttons (close-final-os/-os-plus/-enterprise) lösen sofort Checkout aus statt zu scrollen. (f) **Design-Upgrade leader-os.de Aesthetic**: Bracket-Prefix-Labels (▸ SCHRITT 1 VON 2 · BIB · 0001), § §-Section-Numbers, Mono-Micro-Labels.
- [x] **🚨 Feb 2026 — CRITICAL Stripe-Pricing-Bug behoben**: emergentintegrations erwartete EUR (Major Units), nicht Cents — Code multiplizierte 2x → Stripe zeigte 100x den Preis (€99.700 statt €997). FIX in `_create_one_time_session`: `amount=round(float(charge_amount), 2)` + Range-Assertion 1–100000. Verifiziert via Playwright cross-domain auf echten Stripe-Seiten für alle 4 Packages.
- [x] **Feb 2026 — P2 Polish**: Single Source of Truth Pricing, Type Hints in Public API Routes, Test-File Boolean-Cleanup
- [x] **Feb 2026 — Code Quality Refactoring**: Routes-Komplexität → alle Funktionen grade B (CC≤10)
- [x] **Feb 2026 — Cleanup**: Legacy-Refs entfernt, HighTicketClose.jsx 633→257 Zeilen via Component-Splitting
- [x] **Feb 2026 — Stripe-Subscription-Wiring (P3)** + Auto-Switch via `_is_real_stripe_key`
- [x] **Feb 2026 — Pricing Overhaul**: 3 Tiers + Enterprise-Rabatt-Rechner
- [x] Admin Dashboard + Bookings + License Keys + Enterprise Inquiries
- [x] Resend E-Mail (6 Flows) + Video-Plattform
- [x] Backend-Refactoring: server.py modularisiert
- [x] WladBot Chat fließt in Report ein + Personalisierter 30-Tage-Plan PDF
- [x] Admin-Login serverseitig
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

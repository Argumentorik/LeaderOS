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

## Pricing
- Starter: 199 EUR | Standard: 997 EUR/Jahr | Fast Track: 6.970 EUR/Jahr

## Implemented
- [x] Full Funnel mit Hyperpersonalisierung
- [x] 3-Tier Pricing (199/997/6.970)
- [x] Admin Dashboard + Bookings + License Keys
- [x] Resend E-Mail (5 Flows)
- [x] Video-Plattform (/kurse)
- [x] Backend-Refactoring: 1165 → 101 Zeilen server.py

## Routes
/ | /diagnose | /quiz | /analyzing | /report | /roadmap | /close | /payment-success | /activate | /kurse | /admin

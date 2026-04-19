# WLADHUB - Product Requirements Document

## Overview
WLADHUB – Full Funnel: Diagnose -> Report -> 30-Tage Plan -> Upsell -> leader-os.de

## Pricing
- Starter: 199 EUR | Standard: 997 EUR/Jahr | Fast Track: 6.970 EUR/Jahr

## Implemented (Feb 2026)
- [x] Full Funnel (Hero → UserForm → Quiz → Report → Roadmap → Close → leader-os.de)
- [x] 5 A/B Headlines (Original + Hormozi + Brunson)
- [x] Leader-OS Branding (Pure Black + Neon Lime)
- [x] Resend E-Mail (Welcome, Report, Plan Reminder, Payment, Booking Confirmation)
- [x] Enterprise License Key (WLAD-XXXX-XXXX-XXXX)
- [x] 3-Tier Pricing (199/997/6.970 EUR)
- [x] Booking System (Termin-Buchung für Fast Track, E-Mail an Experte + User)
- [x] Admin Dashboard (Overview, Keys, Users, Transactions, Bookings, E-Mails)
- [x] Video-Plattform (/kurse) — 6 Starter-Kurse
- [x] Hyper-Personalisierung (Score, Name, schwächste Rolle durch gesamten Funnel)
- [x] Raw Answers + Report in DB für Analyse

## Key API Endpoints
- POST /api/booking/create — Termin erstellen + E-Mail an Experte/User
- GET /api/booking/list — Admin: Alle Termine
- POST /api/license/create | activate | validate | revoke
- GET /api/admin/stats | users | transactions | emails
- POST /api/email/send-report | send-plan-reminder

## Next
- [ ] Vimeo Video-IDs einfügen
- [ ] Backend-Refactoring

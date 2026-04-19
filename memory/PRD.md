# WLADHUB - Product Requirements Document

## Overview
WLADHUB – Full Funnel: Diagnose -> Report -> 30-Tage Plan -> Upsell -> leader-os.de
Ziel: Alle Nutzer zu leader-os.de lenken und zu Käufern machen.

## Implemented (Feb 2026)
- [x] Full Funnel: Hero -> UserForm -> Quiz -> Report -> Roadmap -> Upsell -> Activate -> leader-os.de
- [x] 5 A/B Headlines (Original + Hormozi + Brunson)
- [x] Leader-OS Branding (Pure Black #0a0a0a + Neon Lime #C8FF00)
- [x] Resend E-Mail (4 Flows: Welcome, Report, Plan Reminder, Payment)
- [x] Enterprise License Key System (WLAD-XXXX-XXXX-XXXX, 1 Jahr, auto nach Stripe)
- [x] Stripe Payment (3 Pakete: 0/997/4.997 EUR mit User-Daten-Matching)
- [x] Admin Dashboard (/admin, Pass: wladhub2026) mit Stats, Keys, Users, Transactions, Emails
- [x] Video-Plattform (/kurse) — 6 Starter-Kurse, Vimeo Placeholder, Free Funnel
- [x] **User Data Integrity**: Name + E-Mail matched durch gesamten Funnel (UserForm → Report → Checkout → License Key → E-Mail → Admin)
- [x] **Enriched Admin Users**: Report-Status + License Key pro User sichtbar
- [x] PDF-Export (Report + Curriculum)

## Key Routes
- / — Hero (5 Headlines A/B)
- /diagnose — UserForm (Name, E-Mail, Rolle)
- /quiz — 30 Fragen + WladBot
- /analyzing — Animation
- /report — KI-Report + PDF + Auto-Email
- /roadmap — 30-Tage-Plan + 6 Agenten
- /close — 3-Tier Pricing + Stripe Checkout
- /payment-success — Bestätigung → leader-os.de
- /activate — License Key → leader-os.de Redirect
- /kurse — 6 Video-Module (Free Funnel)
- /admin — Dashboard (Pass: wladhub2026)

## Next Tasks
- [ ] Vimeo Video-IDs einfügen
- [ ] Live-Funnel-Chart im Admin (7-Tage Tagesgrafik)
- [ ] Backend-Refactoring (server.py → Module)
- [ ] Mobile/Audio-Features

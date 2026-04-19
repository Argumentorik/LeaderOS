# WLADHUB - Product Requirements Document

## Overview
WLADHUB – Full Funnel: Diagnose -> Report -> 30-Tage Plan -> Upsell -> leader-os.de
Ready for first 100 users. All data flows cleanly processed and hyper-personalized.

## Pricing
- Starter: 199 EUR (Video Lessons + 50 Credits)
- Standard: 997 EUR/Jahr (Plattform + KI-Coach)
- Fast Track: 6.970 EUR/Jahr (AI Learning Path + 6x 1:1 Calls)

## Data Flow (Production-Ready)
1. UserForm → stores name/email/role in MongoDB + sends Welcome-Mail
2. Quiz → 30 Fragen, Antworten mit category/layer/score gespeichert (answers_raw)
3. Report → 6 Kategorien → gewichtete Matrix → 6 Leadership-Rollen → KI-Narrative → Auto-Email
4. Roadmap → Personalisiert mit Score, Name, schwächster Rolle
5. Close → 3 Tiers (199/997/6970) → Stripe → License Key → leader-os.de
6. Admin → Stats, Users (mit Report-Status + Key), Transactions, E-Mails

## Hyper-Personalisierung
- Quiz: 6 Kategorien × 5 Fragen = 30 Szenario-Fragen, rollenbasiert
- Scoring: Gewichtete Matrix (6 Rollen × 6 Kategorien)
- Report: KI-generierte Narrative basierend auf individuellem Profil
- Roadmap: Wochen-Fokus priorisiert schwächste Rolle, personalisierte Begrüßung mit Score
- E-Mails: Name, Score, schwächste Rolle, personalisierte Aufgaben
- 30-Tage-Plan: Wöchentliche Aufgaben angepasst an Schwachstellen

## Implemented
- [x] 5 A/B Headlines (Original + Hormozi + Brunson)
- [x] Leader-OS Branding (Pure Black + Neon Lime)
- [x] Resend E-Mail (4 Flows)
- [x] Enterprise License Key (WLAD-XXXX-XXXX-XXXX)
- [x] 3-Tier Pricing (199/997/6970 EUR)
- [x] Admin Dashboard + Video-Plattform
- [x] User Data Integrity (Name+Email durchgängig)
- [x] Raw Answers in DB für Analyse
- [x] Code Review Fixes (Hook deps, error handling, query limits)
- [x] question_id als String (Frontend-Backend kompatibel)
- [x] Deployment-Ready (alle Checks bestanden)

# Leader OS / Leader-Check — Product Requirements

## Vision
Leader-Check ist eine High-End-Leadership-Diagnose-Webapp (Funnel: Landing → 30-Fragen-Quiz → KI-Report → 30-Tage-Aktionsplan → Sales-Page) im Branding von Wladislaw Jachtchenko (3× SPIEGEL-Bestseller). Sprache: durchgehend Deutsch, Premium / direkt / kein Bullshit-Bingo.

## Stack
- Frontend: React, TailwindCSS, Framer Motion
- Backend: FastAPI, Pydantic, MongoDB, Service-Layer
- Payments: Stripe Checkout (**LIVE Mode aktiv** · `sk_live_…`)
- Email: Resend SDK · Sender: `wlad@leaderos.de` (verifizierte Domain)
- AI: Emergent LLM Key (Claude Sonnet 4.5 für Report-Narrative)
- PDF: reportlab 5.0.0 (server-side für E-Mail-Attachment)

## Pricing
- Sprint: 997 € einmalig oder 2×499 € / 12×99 € Raten
- Plus-Plus: 4.797 € einmalig oder 3×1.599 € Raten
- Enterprise: Custom

## 🎯 FocusCards Personas + Generischere 30-Tage-Story (Feb 2026)
- **Aceternity FocusCards** als JSX-Port (`/app/frontend/src/components/ui/focus-cards.jsx`) mit Hover-Focus, Blur+Scale auf nicht-fokussierte Cards, Gradient-Eyebrow oben + Title unten
- **"Für wen"-Section** komplett refactored zu "Vier Personas. Ein Hebel." mit 4 großen Foto-Cards (Selbstständige · Angestellte · Senior Manager · High Potentials)
- **30-Tage-Story generischer**: keine spezifische CFO/Engineering-Maria mehr, sondern Transformation im Arbeitsalltag · Woche 1 Klarheit, Woche 2 Gespräche mit Kollegen, Woche 3 KI richtig anwenden, Woche 4 Wirkung die man spürt
- Backend `THIRTY_DAY_PLAN` aktualisiert: Klarheit / Gespräche / KI-Hebel / Wirkung statt SEXIER/CFO/Harvard
- Live-Send v5 aller 7 Episoden an `start@aiporate.com`

## 🎯 30-Tage-Check + Aceternity Timeline + AI-Stack Skeleton (Feb 2026)
- **7-Tage-Plan komplett entfernt** (Verwechslungs-Risiko mit Leader-OS 30-Tage-Check). Stattdessen: **4-Phasen-Strip "30 Tage. Vier Hebel."** mit Woche 1-4 Cards (01/02/03/04 Lime-Numbers)
- **Aceternity Timeline-Component** als JSX-Port (`/app/frontend/src/components/ui/timeline.jsx`) mit Sticky-Sidebar + animierter Lime-Gradient-Linie + Scroll-getriggertem Progress
- **Skeleton-Card mit AI-Stack** (`/app/frontend/src/components/ui/skeleton-card.jsx`): Claude/OpenAI/WladBot-Pixel/Meta/Gemini Logo-Circles + Sparkle-Animation + Vertical-Line · zeigt "Sparring mit den besten KI-Hebeln"
- MariaWay-Timeline nutzt jetzt 4 Wochen mit eigenen Detail-Content: Woche 1 SEXIER-Grid, Woche 2 Stat-Trio, Woche 3 Argument-Flow, Woche 4 Ergebnis-Crown "+180.000 € Budget freigegeben"
- Backend: `SEVEN_DAY_PLAN` → `THIRTY_DAY_PLAN` (4 Phasen), `_seven_day_strip` Funktionsname behalten für Backward-Compat (mappt active_day 1-7 → 4 Phasen)
- Live-Send v4 aller 7 Episoden an `start@aiporate.com` (Resend, Feb 2026)
- Tests: 16/16 Email + 12/12 MariaWay + 10/10 Hormozi = 38/38 PASS

## 🌟 DottedGlow Premium-Tiefe (Feb 2026)
- Aceternity UI `DottedGlowBackground` als JSX-Komponente integriert (`/app/frontend/src/components/ui/dotted-glow-background.jsx`)
- Canvas-based animierter Dot-Grid mit shimmer/glow (HiDPI, ResizeObserver, IntersectionObserver für Performance)
- Eingebaut in 3 Hot-Spots auf der Landing (MariaWay-Section, Transformation-Block, Bonus-Card) + 1× im `/close` Final-CTA
- Per-Spot konfiguriert (verschiedene gap/opacity/speed Werte für unterschiedliche Intensitäten)
- Mit Radial-Mask gemilkt damit es nie aufdringlich wirkt

## ✍️ Hormozi-Copy Refactor + Apple-Cards Carousel (Feb 2026)
- **EP03 + MariaWay Copy** komplett im Hormozi/StoryBrand/VSL-Stil neu geschrieben: kurze Sätze, harte Kontraste ("Vor 30 Tagen war Maria unsichtbar"), klare Transformations-Arrows (2 Min Training → Mehr Klarheit → Mehr Präsenz → Bessere Entscheidungen → Bessere Ergebnisse)
- **Apple-Cards Carousel** (`/app/frontend/src/components/ui/apple-cards-carousel.jsx`, JSX-Port von Aceternity UI mit framer-motion 12.42) + Shared Story-Karussell `/app/frontend/src/components/shared/ClientStoriesCarousel.jsx` mit 5 Klient:innen-Stories (Maria · Engineering · 30T, Andreas · Sales · 21T, Lena · GF · 14T, Thomas · Ops · 30T, Sandra · Konzern · 6M)
- **Sticky Maria-Portrait** rechts, VSL-Hero links · Stat-Tiles 30/50/+180k €, 4-Wochen-Verlaufs-Cards, Transformation-Arrow-Stack, 7-Tage-Plan, „Was ist Leader OS?" Block
- Carousel auch in `/close` als "Echte Klienten. Echte Ergebnisse." Trust-Layer eingebaut
- **"Live mit Wlad" entfernt** (PricingConstants, PriceCards, generatePDF, Roadmap, Report, HighTicketClose, email_templates, services/pricing, EP07-Hint) → ersetzt durch "6× Live-Q&A mit KI-Experten"
- Live-Send aller 7 Episoden v3 (Hormozi) an `start@aiporate.com` (Resend, Feb 2026)
- Tests: `test_email_episodes.py` 16/16 + `test_iter36_maria_way.py` 12/12 + `test_iter37_hormozi_carousel.py` 10/10 = 38/38 PASS

## 📨 Email Drip v2 (Feb 2026)
- **7 Episoden** statt 10 Mails · Apple/Linear/Notion + Duolingo + "Mock-Style"
- Files: `/app/backend/email_episodes.py` (Design v2 + EP03 1:1 nach Mock) + `/app/backend/services/email_sequence.py` (SEQUENCE)
- Day-Offsets: T+1d · T+3d · T+6d · T+10d · T+15d · T+21d · T+28d
- Gamification: Leader Level Progress (n/7), XP-Pills (+50…+500), Streak Dots, Mission Cards
- Mock-Layout (alle Episoden ab v2): **7-Tage-Plan Strip** (7 Cards mit Lime-Active) + **"Was ist Leader OS?"** Bottom-Block (Bullets + Pixel-WladBot + Bonus-Box)
- **EP03 Maria** komplett im Mock-Design (2-Col Hero mit Portrait, Stats 30/50/+180k, Maria-Timeline mit Icons, WladBot-Card mit Flow-Diagramm 2-3 Credits→1 Sparring→Besseres Meeting)
- WladBot-Assets: `/wladbot.png` (Pixel, 7KB) + `/wladbot-3d.png` (3D-Render, 363KB)
- Backward-Compat: alte Slugs (`score_meaning`, `quickwin`, …) werden auf neue Episoden gemappt
- Live-Send: 2× alle 7 Episoden an `start@aiporate.com` verschickt (Resend, Feb 2026)
- Tests: `/app/backend/tests/test_email_episodes.py` 16/16 + `/app/backend/tests/test_iter36_maria_way.py` 12/12 PASS
- Helper-Script: `/app/backend/scripts/send_all_episodes.py <to> <name>`

## 🏠 Landing Page · MariaWay-Section (Feb 2026)
- Neue Komponente `/app/frontend/src/components/hero/MariaWay.jsx` (271 Zeilen)
- Eingebunden in `/app/frontend/src/pages/Hero.jsx` zwischen Wlad-Trust und Free-Credits
- Bildet das identische Mock-Design ab: Headline "Das war Maria vor 6 Monaten" · Maria-Portrait mit Play-Overlay · Stats 30/50/+180k · 4-Phasen-Timeline mit Icons · WladBot-Card mit Flow-Diagramm · 7-Tage-Plan Strip · "Was ist Leader OS?" Block mit Pixel-WladBot + Speech-Bubble "Ich bin bereit. Und du?"
- Mobile responsive (2-Col → 1-Col @ 375px verifiziert)
- 3 CTAs (maria-cta-bot, leaderos-cta-start, hero-cta-credits) → `/diagnose`

## ✅ Live Status (26.06.2026)
- Funnel komplett funktional + production-ready
- **Stripe LIVE Mode aktiv** (cs_live_ Checkout-URLs verifiziert)
- **Resend LIVE** + E-Mail mit **PDF-Attachment** `LeaderCheck-Diagnose.pdf` (3-seitig: Cover/Score · Wlads Einschätzung · 3 Empfehlungen + 30-Tage-Plan) verifiziert
- Wlad-Portrait (`/wlad-portrait.png`) auf Landing geladen, Trust-Section mit Pull-Quote, 6 Stats, Media-Strip (ARD/ZDF/NTV/WELT/etc.)
- Admin Dashboard JWT-secured, Live Funnel-Chart
- 10-teilige Drip-E-Mail-Sequenz in Wlad-Sprache
- SEO + AEO Meta Tags (JSON-LD: Organization, Person, FAQPage, HowTo, WebApplication, Service)
- Per-Route document.title via RouteMeta in App.js
- robots.txt mit AI-Crawler Allow (GPTBot, ClaudeBot, PerplexityBot)
- ALLE leaderos.de Outbound-Links auf Landing/Kurse entfernt (PaymentSuccess/Activate Redirects bleiben für gekaufte Kunden)
- 86+ em-dashes (–) → middle-dots (·) ersetzt (Wlad-Sprache, kein AI-Slop)
- /close Curriculum/Buch-Section entfernt
- Quiz Auto-Save (localStorage)
- Admin Token in sessionStorage (XSS-Mitigation)
- Hardcoded Secrets aus Tests entfernt

## Test-Status
- iteration_33.json (Final Go-Live): **10/10 PASS** (Stripe LIVE, PDF gen, Resend PDF E2E, Wlad portrait, Admin JWT, Health)
- iteration_32.json: 8/8 Backend PASS + Frontend 100%

## ⚠️ Cloudflare Side-Note
leadercheck.de hat in Cloudflare möglicherweise "AI Scrapers and Crawlers" Block aktiv → das überschreibt unsere robots.txt Allow-Regeln. Manuell im Cloudflare Dashboard → Security → Bots deaktivieren für vollen AEO.

## Architektur
```
/app
├── backend/
│   ├── .env (STRIPE_API_KEY=sk_live_..., RESEND_API_KEY=re_..., SENDER_EMAIL=wlad@leaderos.de)
│   ├── server.py
│   ├── models.py
│   ├── email_templates.py
│   ├── routes/ (admin, auth, email, payments, quiz)
│   ├── services/ (pricing, email_sequence, email_scheduler, pdf_report, license_keys)
│   └── tests/ (iter27..33 — ~85 pytest tests · 100% pass)
├── frontend/
│   ├── public/ (index.html SEO/AEO, robots.txt, sitemap.xml, manifest.json, wlad-portrait.png)
│   └── src/
│       ├── App.js (RouteMeta für per-Route titles)
│       ├── pages/ (Hero, HighTicketClose, Kurse, Report, Roadmap, Quiz, Admin, UserForm, Login, ActivateKey, PaymentSuccess)
│       ├── components/ (pricing, ui, admin, ExitIntentPopup, LeaderOSLogo)
│       └── utils/ (generatePDF.js · client-side Premium-PDF zusätzlich zum Server-PDF)
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## Backlog (P2/P3)
- React component splitting (Hero 806 lines, Report, Roadmap)
- Python route refactoring (Business Logic in Services)
- Sentry/Datadog Production Error Tracking
- Stripe Webhook Signature Verification (aktuell Polling)
- Quiz "Speichern & per Mail erinnert werden" für Drop-Offs bei Frage 15-20
- "WhatsApp / Calendly direct to Wlad" Onboarding-Bridge auf /payment-success für High-Ticket Buyer

## Test Credentials
Siehe `/app/memory/test_credentials.md`

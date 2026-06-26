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

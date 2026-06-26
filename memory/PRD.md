# Leader OS / Leader-Check — Product Requirements

## Vision
Leader-Check ist eine High-End-Leadership-Diagnose-Webapp (Funnel: Landing → 30-Fragen-Quiz → KI-Report → 30-Tage-Aktionsplan → Sales-Page) im Branding von Wladislaw Jachtchenko (3× SPIEGEL-Bestseller). Sprache: durchgehend Deutsch, Premium / direkt / kein Bullshit-Bingo.

## Stack
- Frontend: React, TailwindCSS, Framer Motion
- Backend: FastAPI, Pydantic, MongoDB, Service-Layer-Architecture
- Payments: Stripe Checkout (Subscriptions + Einmalzahlungen)
- Email: Resend SDK (Drip + Transactional)
- AI: Emergent LLM Key (Claude für Report-Narrative)

## Pricing
- Sprint: 997 € einmalig oder 2×499 € / 12×99 € Raten
- Plus-Plus: 4.797 € einmalig oder 3×1.599 € Raten
- Enterprise: Custom

## Live Status (26.06.2026)
✅ Funnel komplett funktional und production-ready
✅ Resend LIVE Key aktiv → wlad@leaderos.de (verifizierte Domain)
✅ Admin Dashboard JWT-secured, Live Funnel-Chart
✅ 10-teilige Drip-E-Mail-Sequenz in Wlad-Sprache
✅ Premium PDF-Report (Executive Brochure Design, jsPDF clientseitig)
✅ SEO + AEO Meta Tags (JSON-LD: Organization, Person, FAQPage, HowTo, WebApplication, Service)
✅ Per-Route document.title via RouteMeta in App.js
✅ robots.txt mit AI-Crawler Allow (GPTBot, ClaudeBot, PerplexityBot, etc.)
✅ Wlad Portrait Trust Section auf Landing (initials W als Fallback bis Portrait-JPG hochgeladen)
✅ Quiz Auto-Save (localStorage)
✅ Admin Token in sessionStorage (XSS-Mitigation)
✅ Hardcoded Secrets aus Tests entfernt

## ⚠️ OFFENE GO-LIVE-RISIKEN
- **STRIPE IN TEST-MODE**: Aktueller Key ist `sk_test_emergent`. Vor echten Kunden-Zahlungen MUSS auf Live-Key umgestellt werden, sonst sind Checkouts nur Sandbox.
- **Wlad-Portrait JPG**: `/app/frontend/public/wlad-portrait.jpg` fehlt → derzeit "W"-Initials-Fallback. Sobald JPG dort liegt, wird automatisch das Foto gezeigt.
- **Cloudflare Managed Robots**: leadercheck.de hat in Cloudflare Security → Bots → "AI Scrapers and Crawlers" möglicherweise aktiv → das überschreibt unsere Allow-Regeln für GPTBot/ClaudeBot/Perplexity. Manuell im Dashboard ausschalten für volles AEO.

## Architektur
```
/app
├── backend/
│   ├── .env (RESEND_API_KEY, SENDER_EMAIL=wlad@leaderos.de, ADMIN_PASSWORD, ADMIN_JWT_SECRET, STRIPE_API_KEY, MONGO_URL)
│   ├── server.py
│   ├── models.py
│   ├── email_templates.py
│   ├── routes/ (admin, auth, email, payments, quiz)
│   ├── services/ (pricing, email_sequence, email_scheduler, admin_emails, license_keys)
│   └── tests/ (test_iter27..32 — ~75 pytest tests, 100% pass)
├── frontend/
│   ├── public/ (index.html SEO/AEO, robots.txt, sitemap.xml, manifest.json)
│   └── src/
│       ├── App.js (RouteMeta für per-Route titles)
│       ├── pages/ (Hero, HighTicketClose, Kurse, Report, Roadmap, Quiz, Admin, UserForm, Login, ActivateKey, PaymentSuccess)
│       ├── components/ (pricing, ui, admin, ExitIntentPopup, LeaderOSLogo)
│       └── utils/ (generatePDF.js)
└── memory/
    ├── PRD.md (this file)
    └── test_credentials.md
```

## Backlog (P2/P3)
- React component splitting (Hero 805 lines, Report, Roadmap)
- Python route refactoring (move business logic to services)
- Sentry/Datadog Production Error Tracking
- Stripe Webhook Signature Verification (aktuell Polling)
- Quiz "Speichern & per Mail erinnert werden"-Option für Drop-Offs bei Frage 15-20

## Test Credentials
Siehe `/app/memory/test_credentials.md`

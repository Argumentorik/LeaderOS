# Leader OS / Leader-Check — Product Requirements

## Vision
Leader-Check ist eine High-End-Leadership-Diagnose-Webapp (Funnel: Landing → 30-Fragen-Quiz → KI-Report → 30-Tage-Aktionsplan → Sales-Page) im Branding von Wladislaw Jachtchenko (3× SPIEGEL-Bestseller). Sprache: durchgehend Deutsch, Premium / direkt / kein Bullshit-Bingo.

## 🛡️ Godmode Security Hardening · Fund-Ready (Feb 2026)
Nach dem security_audit_agent-Report (Verdict: FAIL — DO NOT LAUNCH) wurden ALLE P0/P1/P2/P3 Findings gefixt. Verifiziert via testing_agent Iter40: **17/17 Unit-Tests + 16/16 Integration-Tests PASS**, 0 critical/minor Code-Bugs.

## 🎯 UX-Polish · Apple Cards Hover-Overlay + WladBot Magic ATF (Feb 2026)
- `components/ui/apple-cards-carousel.jsx` Card-Komponente jetzt mit **Smooth Hover-Overlay**:
  - Idle: Kategorie + Titel top-left auf Bild sichtbar (dunkler Top→Bottom-Gradient)
  - Hover: Base-Gradient fadet aus, Deep-Dark-Gradient (`from-black/50 via-black/70 to-black/95`) fadet ein, `card.content` (Beschreibung + Bullets) slidet smooth von unten rein (500ms, ease-out)
  - Bild zoomt weiter (`scale-110`), Text bekommt `mask-image` Fadeout bei Overflow
  - Klick-to-Modal weiterhin verfügbar für Power-User; kein Klick mehr nötig für Verkaufsargumente
- data-testid `apple-card-hover-{index}` für Testbarkeit
- AgentsCarouselSection Paragraph: "Klick eine Karte" → "Hover eine Karte"

**WladBot 3.0 Transparent + Magic ATF**:
- Neue transparente Version `/wladbot-3-nobg.png` (removebg) ersetzt in `MariaWay.jsx` und `skeleton-card.jsx` das gerahmte Bild — kein Border/Box mehr, freistehend mit Drop-Shadow + Lime-Glow.
- **HeroATF**: WladBot magisch neben CTA-Button platziert
  - Floating (`anim-float` 4s Loop) + Lime Radial-Glow-Aura (blur-3xl, pulsing)
  - Speech-Bubble "Ich bin bereit. Und du?" → visueller Pfeil vom Bot auf den "Diagnose starten"-Button
  - Directional Cue: Bot links → CTA rechts (Desktop) / Bot unten → CTA oben (Mobile Stack)
  - data-testid `hero-wladbot`, `hero-wladbot-bubble`


**Zentraler Security-Service** (`services/security.py`, 190 Z.):
- **Report/Sync JWT** (HS256, `REPORT_JWT_SECRET` env-required, kein Default) — 30-Tage-Token für Report-Ownership, 10-Min-Sync-Token für Leader-OS-Handoff, unterschiedliche `aud`-Claims blockieren Cross-Replay
- **OTP** (6-stellig, 10-Min-TTL, 5-Attempts-Lockout, sha256+per-record-salt) für passwortlose Logins
- **`secure_client_ip(request)`** nutzt rightmost XFF-Hop (spoof-resistant)
- **`escape_for_email()`** mit html.escape + length-cap (300 chars default)

**SEC-001 · Stripe Webhook** — `stripe.Webhook.construct_event` + `db.stripe_webhook_events` mit unique-index-Idempotenz auf `event.id`. Unsigned/wrong-sig → 400. Ohne konfigurierten `STRIPE_WEBHOOK_SECRET` → 503 fail-safe (User muss nach Redeploy in Stripe-Dashboard-Webhook den `whsec_…` in .env eintragen).

**SEC-002 · Report/Coach ACL + Passwordless OTP**
- `GET /api/report/{sid}` + `POST /api/coach/chat` (post-report) fordern `Authorization: Bearer <report_token>` mit `sid`-Match; ohne/falsch → 401
- Pre-report Coach-Chat (Session ohne Report) bleibt anonym (kein PII zum Schutz-Bedarf)
- `POST /api/auth/quick-login/request` sendet 6-stelligen OTP per Resend; Response **enumeration-resistant** (`{status:'otp_sent_if_registered', masked_email}` egal ob Account existiert)
- `POST /api/auth/quick-login/verify` gegen konstant-time-Hash; 401 auf Fehler
- Legacy `/auth/quick-login` gibt jetzt gleiche No-PII-Shape zurück (kein session_id/name/phone-Leak mehr)
- `POST /api/auth/leader-os-sync` liefert 10-Min-Sync-Token für Product-Handoff

**SEC-003 · CORS-Allowlist** — Wildcard aus `CORS_ORIGINS` env gefiltert. Explizit erlaubt: `exec-eval.emergent.host`, `role-assessment-lab.preview.emergentagent.com`, `localhost:3000` + Regex `*.preview.emergentagent.com`. Fixe `allow_methods` + `allow_headers`. Startup-Log confirmed: `[cors] allowlist = [...]` ohne `*`.

**SEC-004 · Rate-Limiting** (`slowapi` mit `secure_client_ip` als key_func):
- `/user/create` 10/min · `/quiz/generate-report` 6/min · `/coach/chat` 20/min · `/report/{sid}` 30/min
- `/auth/quick-login/*` 5-10/min · `/enterprise/inquire` 5/min · `/enterprise/calculate` 30/min · `/email/*` 6-30/min

**P3 Hardening**:
- `ADMIN_JWT_SECRET` kein Fallback mehr — Backend refused start ohne env
- Admin-Login nutzt rightmost-XFF-Hop (Spoof-Fix)
- `services/admin_emails.py` escaped ALLE User-Felder via `escape_for_email` (Booking + Enterprise HTML-Mails)
- DB-Indexes on startup: `stripe_webhook_events.event_id` unique + `auth_otp.email` unique

**Sync-Flow (Landing → Leader-OS-Produkt):**
1. User schließt Quiz ab → Backend gibt `{report, report_token, sync_token}` zurück
2. Frontend speichert Tokens in localStorage
3. User klickt „Weiter zu Leader OS" → Frontend fetch `POST /api/auth/leader-os-sync` mit `Bearer <report_token>` → bekommt neuen `sync_token` (10min TTL)
4. Redirect zu Product mit `?sync_token=…` → Product exchange gegen eigene Session

**Neue Tests**:
- `/app/backend/tests/test_security_service.py` (10 tests · JWT, OTP, IP, HTML-escape)
- `/app/backend/tests/test_stripe_self_heal.py` (7 tests)
- `/app/backend/tests/test_iter40_security_hardening.py` (18 integration tests, Test-Agent-erstellt)

**Info-Finding (Infra, kein Code-Bug):** Cloudflare/K8s-Ingress am Preview-URL überschreibt ACAO auf `*`. Backend-CORS ist korrekt. Browser-CSRF ist trotzdem geblockt (ACAO:* + credentials=true wird von allen Browsern verworfen). Nach Deploy auf eigene Domain nicht mehr relevant.

## 🎴 Aceternity Features-Bento Diagnose-Section (Feb 2026)
- **DiagnoseStepsSection.jsx** komplett ersetzt durch das Aceternity „Features-Section"-Pattern (6-col asymmetric bento grid, port von TS→JSX mit framer-motion statt `motion/react`, ohne cobe-Dep).
- **4 Bento-Cards** mit individuellen Skeleton-Visuals:
  - **Card 1 (col-span-4)** „30 Fragen · 6 Führungsdimensionen" — animated Quiz-Mockup mit Progress-Bar bei 47%, echter Frage „Wenn der CFO im Meeting widerspricht …" + 5 Antwort-Optionen (Trifft eher zu in lime aktiv), Staggered-Entry Fade-In pro Option
  - **Card 2 (col-span-2)** „Score in drei Ebenen" — 3 tilted Score-Tiles (KI 78%, Rhetorik 64%, EQ 82%) mit animierten Lime-Progress-Bars, hover entrotiert auf 0°
  - **Card 3 (col-span-3)** „Dein 30-Tage-Plan" — Kalender-Grid 30 Tage (10×3), Tag 1-11 active (Lime), Tag 12 als „today" highlighted, Play-Button-Pill top-right, Heute-Task „Lass den CFO ausreden …"
  - **Card 4 (col-span-3)** „ROI-Prognose" — 3 gestaffelte radial SVG-Rings (88%/64%/100%) mit Stroke-Dash-Animation, „+184 %" Center-Score + 3 Sub-Stats (6.4h/Woche, +42 %, 30 T)
- Alle Skeletons **CSS-only** (keine zusätzlichen Stock-Photos) → preserves „16 unique images, 0 duplicates"-Regel.
- DraggableCard-Komponente bleibt im Codebase (für späteren Einsatz auf `/payment-success` License-Key-Reveal etc.).
- Verifiziert: 4/4 skeleton-testids rendern, 0 Console-Errors, headlines mit EncryptedText.

## 🖼️ Unique Images Pass · 16 distinct premium photos · Maria-Portrait Premium-Frame (Feb 2026)
- **Problem**: 4 verschiedene Bilder wurden 2-4× wiederverwendet — vor allem Marias Photo erschien 4× auf der Landing (MariaWay + Agent 01 Coach + Persona 01 Selbstständige + ClientStories Maria).
- **Fix**: Komplette Image-Map auf **16 unique Unsplash-IDs** umgestellt (verifiziert: jede ID erscheint exakt 1× im gesamten Frontend, `grep | sort | uniq -c` = alle 1).
  - **Maria-Portrait neu** in `MariaWay.jsx` (`photo-1494790108377-be9c29b29330`) und aus ClientStoriesCarousel entfernt
  - 5. ClientStory **Anna L. · HR-Direktorin** mit eigener unique ID hinzugefügt (HR-Konflikt-Story)
  - 6 Agent-Karten, 4 Persona-Karten, 5 Client-Stories — **alle mit individuellem Foto**
- **Maria-Portrait Premium-Frame** in `MariaWay.jsx`:
  - **Lime Corner-Brackets** top-left + bottom-right (Apple-style framing cue)
  - **Soft Lime-Glow** hinter dem Frame (opacity 60→100 on hover)
  - **Hover-Zoom** Bild scaliert 1.04× über 1.2s ease-out
  - **Dual-Tone Gradient** bottom-to-top + **Lime-Hairline** als bottom-border
  - **Pulsing-Dot-Caption** "● MARIA · REAL STORY" mit Head-of-Engineering Subline
  - **Play-Button** mit hover-scale 1.1 + shadow-2xl
- Verifiziert via Playwright auf `/` + `/close`: 16 distinct sources, alle Bilder laden, 0 duplicates, 0 Console-Errors.

## 🎯 EncryptedText im Report + leader_os Alias (Feb 2026)
- **EncryptedText auf `/report`**: 3 Moments-of-Truth bekommen den scramble→decode-Effekt:
  - **Gesamtscore** (`data-testid="report-total-score"`) · trigger=`mount`, duration=1800ms, charset=Ziffern-Only (`0123456789%`)
  - **Profile-Title-Headline** (`data-testid="report-profile-title-headline"`) · trigger=`view`, duration=1600ms, ABC-Charset
  - **3× Layer ScoreRings** (KI · Rhetorik · EQ) · trigger=`view`, duration=1500ms, Ziffern-Charset · sync mit der SVG-Ring-Animation
  - `EncryptedText` erweitert um optionalen `style` Prop für inline-color (Gesamtscore-Color je nach Score-Range)
  - Verifiziert via Playwright mit localStorage-Injection: Frame 200ms zeigt scrambled state, Frame 2.5s den finalen decoded Text · 0 Console-Errors.
- **`leader_os` Alias in PACKAGES**: Bare `package_id="leader_os"` resolved jetzt auf den Sprint-One-Time (997 €, mode=payment) statt 400 zurückzugeben. Verifiziert via `curl POST /api/payments/create-checkout` → liefert `cs_live_*` Session-URL.

## 🧹 Hero.jsx Split + Stripe Service + Self-Heal Cronjob (Feb 2026)
- **P1 Hero.jsx Refactor**: 1039 Zeilen → 59 Zeilen schlanker Orchestrator. Gesplittet in 13 Section-Komponenten unter `/app/frontend/src/components/hero/`:
  - `HeroATF.jsx`, `ProblemSection.jsx`, `ThreeLayersSection.jsx`, `DiagnoseStepsSection.jsx`, `AgentsCarouselSection.jsx`, `WladBotSection.jsx`, `LeadershipKursSection.jsx`, `AudiencesSection.jsx`, `SocialProofSection.jsx`, `WladTrustSection.jsx`, `FreeCreditsSection.jsx`, `FinalCTASection.jsx`, `HeroFooter.jsx`
  - `heroData.js` (228 Z.) — alle statischen Inhalte (headlines, layers, problems, diagnoseSteps, platformFeatures, wladbotFeatures, audiences, kursTopics, freeCreditsBullets, wladStats)
- **P2 Stripe Service Extraction**: `routes/payments.py` 416 → 267 Zeilen. Neue `services/stripe_checkout.py` (264 Z.) enthält: `is_real_stripe_key`, `create_subscription_session`, `apply_subscription_cancel_at`, `create_one_time_session`, `build_*_tx`, sowie der neue Self-Heal-Job.
- **P3 Self-Healing Cronjob** für stale Stripe-Checkouts: `start_self_healing_loop` läuft 1×/h im Hintergrund (asyncio.create_task auf FastAPI startup, cancel on shutdown). `cancel_stale_pending_checkouts` scannt pending Transactions > 26h alt, reconciled gegen Stripe API (paid → complete, expired/unreachable → expired). **Erster Live-Lauf: 53 alte stale Checkouts automatisch bereinigt.**
- **Tests**: 7 neue Unit-Tests in `/app/backend/tests/test_stripe_self_heal.py` (FakeDB-Pattern, 0.09s, 7/7 PASS). Backend-Regression: 51/51 PASS auf iter36-iter38 + neue Stripe Tests.
- **Test-Status (iter39)**: Backend 100% + Frontend 100% PASS — keine Regressionen, alle 13 Sections rendern, Apple Cards Modal + ESC + Carousel-Nav funktionieren, self-heal Loop confirmed via Backend-Logs.

## 🔐 EncryptedText + 6-Agent Apple Cards · Godmode (Feb 2026)
- **Aceternity `EncryptedText`-Komponente** (`/app/frontend/src/components/ui/encrypted-text.jsx`, 153 Z.): RAF-driven scramble/decode-Effekt mit `mount`/`view`/`hover` Trigger, honors `prefers-reduced-motion`. Eingebaut im ATF (`<h1 data-testid="hero-headline">` mit 1100-1500ms staggered duration) und in der "6 KI-Agenten"-Sektion (`agents-headline-line-1/2`, trigger="view").
- **"6 KI-Agenten"-Section komplett umgebaut** auf Apple Cards Carousel: 6 Image-Karten (Unsplash Portraits) mit `category` ("Agent 01-06"), `title` (Leadership Coach · Task · Simulations · Strategie · Event · Community) und `content` (desc + 3 bullets + Lime-Icon-Tile "Teil von Leader OS"). Klick öffnet Modal-Overlay mit blur backdrop, ESC schließt.
- **Admin localStorage → sessionStorage Migration**: `Admin.jsx` liest/schreibt Token jetzt konsistent aus `sessionStorage["leaderos_admin_token"]` (XSS-Mitigation, Session-Scope).
- **React Cleanup**: Array-Index-Keys in Hero.jsx durch stabile IDs ersetzt (layer.num, step.num, point, feature.text, item.text). Unescaped quotes in Report.jsx + Analyzing.jsx auf `&ldquo;` / `&rdquo;` umgestellt. 4× Unused `eslint-disable react-hooks/exhaustive-deps` Directives entfernt (Roadmap, Quiz, PaymentSuccess, Analyzing, AuthCallback, ExitIntentPopup).
- **Lint-Status**: Alle pages clean, nur vendored Aceternity/Shadcn-Files haben verbleibende Warnings.
- **Test-Status (iteration_38)**: Backend 6/6 + Frontend 8/8 PASS.
- **Deployment-Check (deployment_agent)**: `status: pass` · keine Blocker · CORS ok · env-driven · supervisor config valid.

## Stack
- Frontend: React, TailwindCSS, Framer Motion (12.42), motion, @tabler/icons-react
- Backend: FastAPI, Pydantic, MongoDB, Service-Layer (incl. Self-healing Stripe Loop)
- Payments: Stripe Checkout (**LIVE Mode aktiv** · `sk_live_…`)
- Email: Resend SDK · Sender: `wlad@leaderos.de` (verifizierte Domain)
- AI: Emergent LLM Key (Claude Sonnet 4.5 für Report-Narrative)
- PDF: reportlab 5.0.0 (server-side für E-Mail-Attachment)

## Pricing
- Sprint: 997 € einmalig oder 2×499 € / 12×99 € Raten
- Plus-Plus: 4.797 € einmalig oder 3×1.599 € Raten
- Enterprise: Custom

## 🎨 ClickUp-Premium Polishing · ATF + Drei Ebenen (Feb 2026)
- **ATF Hero**: Plus-Jakarta-Style Display-Typografie (clamp 40-84px, letter-spacing -0.05em, line-height 1.03) mit tighter Compression. Sub-Headline auf 19px mit -0.018em Tracking.
- **Drei-Ebenen-Section komplett neu**: ClickUp-inspired asymmetric Layout · linksbündige 76px Display-Headline "Top-Führungskräfte können alle drei gleichzeitig." · 3 Premium-Cards mit riesigem 180px Number-Watermark, Mono-Eyebrow "EBENE 01-03", Icon-Tile, 44px Display-Title (KI/Rhetorik/EQ), Lime-Round-Checkmark-Liste, Bottom-Annotation-Strip "▸ DEIN SCORE".
- Adaptiert für Leader-OS Branding (Schwarz/Lime statt Weiß/Violet) bei voller Übernahme der ClickUp-Typografie-Disziplin und Density.
- Tests bleiben grün, Lint clean.

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

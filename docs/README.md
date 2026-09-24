# LeaderOS — Documentation Index

Everything in `docs/` is sorted by the question you're answering:
**"How do we grow?"** → `gtm/` · **"How is it built?"** → `app/` ·
**"How do we run it?"** → `ops/`. Historical one-offs live in `archive/`.

> New to the repo entirely? Read [`../ONBOARDING.md`](../ONBOARDING.md)
> first, then come back here. Claude Code sessions start at
> [`../CLAUDE.md`](../CLAUDE.md).

---

## 🚀 GTM — Go-to-market (`gtm/`)

The single most important file is the **canon**: every public claim
(client counts, book counts, framework definitions) must check against it.

| Doc | What it covers |
| --- | --- |
| [`gtm/WLAD_CANON.md`](./gtm/WLAD_CANON.md) | **Verified facts canon.** 400.000+ Klienten, 13 Bücher, 3× SPIEGEL, framework definitions. In Konflikten gewinnt immer der Canon. |
| [`gtm/KNOWLEDGE_ONE_PAGER.md`](./gtm/KNOWLEDGE_ONE_PAGER.md) | How the knowledge system (RAG + canon + prompts) fits together — stakeholder-readable |
| [`gtm/EXPERT_OS_THESIS.md`](./gtm/EXPERT_OS_THESIS.md) | **Platform thesis** — why the canon-lock + hybrid-RAG architecture is a reusable "Expert-OS" engine, not a Wlad-only feature; for pitching other personal brands / enterprise L&D |
| [`gtm/ONE_PAGER.md`](./gtm/ONE_PAGER.md) | Product one-pager |
| [`gtm/CONTENT_STRATEGY.md`](./gtm/CONTENT_STRATEGY.md) | Content pillars, journal strategy, AEO/GEO position |
| [`gtm/CONTENT_90D.md`](./gtm/CONTENT_90D.md) | 90-day content plan |
| [`gtm/CONTENT_ADS.md`](./gtm/CONTENT_ADS.md) | Ad creative specs (design tokens, formats) |
| [`gtm/CONTENT_SPECIMENS.md`](./gtm/CONTENT_SPECIMENS.md) | Design-specimen system for content assets |
| [`gtm/ADS_90D.md`](./gtm/ADS_90D.md) | 90-day paid-ads plan |
| [`gtm/RUNBOOK_ADS_CHANNELS.md`](./gtm/RUNBOOK_ADS_CHANNELS.md) | Channel-by-channel ads runbook |
| [`gtm/CREATIVE_MATRIX.md`](./gtm/CREATIVE_MATRIX.md) | **Mengenplanung Creatives** — 24 Angles × 3 Formate × 3 Varianten = 200, Produktionswellen, Namensschema, wie viele überhaupt testbar sind |
| [`gtm/GOOGLE_ADS_SETUP.md`](./gtm/GOOGLE_ADS_SETUP.md) | Google Ads technical setup (account, gtag, Consent Mode v2, conversion actions, UTM) |
| [`gtm/META_ADS_WEBINAR.md`](./gtm/META_ADS_WEBINAR.md) | **Meta Ads Launch-Paket Webinar 29.10.** — Matrix educate/convert übersetzt, Kampagnenstruktur bei 30 €/Tag, 24 Creatives mit Copy, Pixel + Conversions API, Erwartungswerte |
| [`gtm/LINKEDIN_ADS_WEBINAR.md`](./gtm/LINKEDIN_ADS_WEBINAR.md) | **LinkedIn Ads Launch-Paket Webinar 29.10.** — eine Kampagne bei 50 €/Tag, Job-Titel-Zielgruppe, 8 Creatives 1200×627, Insight Tag + Conversion, warum Website-Conversions statt Lead Gen Forms |
| [`gtm/SEO_KEYWORDS.md`](./gtm/SEO_KEYWORDS.md) | Keyword universe (DACH leadership/AI/communication) |
| [`gtm/SEO_AEO_PLAYBOOK.md`](./gtm/SEO_AEO_PLAYBOOK.md) | **Technical visibility** — why CRA breaks AI crawlers, prerendering vs static pages, robots/IndexNow/Bing, rules for new pages |
| [`gtm/GROWTH_LOOP.md`](./gtm/GROWTH_LOOP.md) | The growth loop: check → content → funnel → referral |
| [`gtm/WEBINAR_FUNNEL.md`](./gtm/WEBINAR_FUNNEL.md) | **Ascension funnel map** (Ad → Webinar → 4 Videos → Trial → 30-Tage-Challenge → Leadership Plus) + honesty rules + missing video assets |
| [`gtm/NEWSLETTER.md`](./gtm/NEWSLETTER.md) | Newsletter system |
| [`gtm/EMAIL_BROADCASTS.md`](./gtm/EMAIL_BROADCASTS.md) | Evergreen broadcast emails (checklist/trust/CTA/teaser pattern) outside the linear lead-nurture cron chain |
| [`gtm/INSTAGRAM_30_DAY_PLAN.md`](./gtm/INSTAGRAM_30_DAY_PLAN.md) | 30-day Instagram plan (design-ready) |
| [`gtm/MARKETING_GREATOR_2026.md`](./gtm/MARKETING_GREATOR_2026.md) | Greator 2026 campaign |
| [`gtm/VIMEO_WORKFLOW.md`](./gtm/VIMEO_WORKFLOW.md) | Video hosting workflow |
| [`gtm/REMOTION_VIDEO.md`](./gtm/REMOTION_VIDEO.md) | Programmatic video rendering |

**GTM funnel surfaces in code:** landing (`frontend/src/pages/LandingPage.js`),
webinar funnel (`WebinarPage/WebinarThankYouPage/WebinarLivePage`), free-video
funnel (`/fuehrung-beginnt-hier`), journal (`frontend/src/features/content/`),
lead-nurture emails (`backend/services_email.py` + `/api/cron/lead-nurture`).

---

## 🏗 App — Architecture (`app/`)

| Doc | What it covers |
| --- | --- |
| [`app/SYSTEM_OVERVIEW.md`](./app/SYSTEM_OVERVIEW.md) | The whole system on one page |
| [`app/APP_ARCHITECTURE.md`](./app/APP_ARCHITECTURE.md) | Frontend + backend architecture deep-dive |
| [`app/SCHEMA.md`](./app/SCHEMA.md) | **Postgres schema** — tables, triggers, RPCs, `email_lower` contract |
| [`app/FEEDBACK_BACKLOG.md`](./app/FEEDBACK_BACKLOG.md) | **MA-Feedback WladBot 3.0 · Triage + To-dos** (P0/P1/P2) + Sizing der Supabase-Migration |
| [`app/DASHBOARD.md`](./app/DASHBOARD.md) | Supabase Studio dashboard views |
| [`app/IDENTITY_ARCHITECTURE.md`](./app/IDENTITY_ARCHITECTURE.md) | Cross-platform identity (`email_lower`, meta_tags, PostHog stitching) |
| [`app/DOMAIN_TOPOLOGY.md`](./app/DOMAIN_TOPOLOGY.md) | Host-based routing: leader-os.de vs leader-check.de |
| [`app/FINAL_TOPOLOGY.md`](./app/FINAL_TOPOLOGY.md) | Target topology |
| [`app/RAG_KNOWLEDGE_FLOW.md`](./app/RAG_KNOWLEDGE_FLOW.md) | WladBot RAG pipeline (chunks, embeddings, match thresholds) |
| [`app/WLADBOT_OVERVIEW.md`](./app/WLADBOT_OVERVIEW.md) | WladBot product overview |
| [`app/SUPABASE_SYNC_INTEGRATION.md`](./app/SUPABASE_SYNC_INTEGRATION.md) | Supabase ↔ Mongo sync handoff |

---

## 🔧 Ops — Run the app (`ops/`)

| Doc | What it covers |
| --- | --- |
| [`ops/RUNBOOK.md`](./ops/RUNBOOK.md) | **Main runbook** — deploy, secrets, common operations |
| [`ops/RUNBOOK_DEPLOY.md`](./ops/RUNBOOK_DEPLOY.md) | Deploy specifics (Vercel + backend) |
| [`ops/EMERGENT_DEPLOY_CHECKLIST.md`](./ops/EMERGENT_DEPLOY_CHECKLIST.md) | **Current deploy checklist** — env vars + smoke checks for the Juli-2026 features |
| [`ops/DEPLOY.md`](./ops/DEPLOY.md) | Click-through deploy guide (Stripe live keys, webhooks, rollback) |
| [`ops/RUNBOOK_DOMAINS.md`](./ops/RUNBOOK_DOMAINS.md) | DNS / domain operations |
| [`ops/INCIDENT_RUNBOOK.md`](./ops/INCIDENT_RUNBOOK.md) | When production breaks |
| [`ops/CRON_SCHEDULE.md`](./ops/CRON_SCHEDULE.md) | All cron jobs (installments, drips, webinar reminders, lead-nurture) |
| [`ops/SENTRY_ALERTS.md`](./ops/SENTRY_ALERTS.md) | Sentry alert rules |
| [`ops/INTEGRATIONS.md`](./ops/INTEGRATIONS.md) | PostHog EU + Sentry + Supabase frontend wiring |
| [`ops/PLATFORM_ACCESS.md`](./ops/PLATFORM_ACCESS.md) | Who has access to what |
| [`ops/PRODUCTION_READINESS.md`](./ops/PRODUCTION_READINESS.md) | Production-readiness audit |
| [`ops/VERCEL_QUICK_SETUP.md`](./ops/VERCEL_QUICK_SETUP.md) | Vercel dual-project setup from scratch |
| [`ops/SUPABASE_MIGRATION.md`](./ops/SUPABASE_MIGRATION.md) | How schema migrations work here |
| [`ops/BRANCHING.md`](./ops/BRANCHING.md) | Branch model — `mvpcode` is production |

---

## 📚 Stable top-level files

| Doc | Why it stays at `docs/` root |
| --- | --- |
| [`LAUNCH_PLAN.md`](./LAUNCH_PLAN.md) | **Master-Plan bis zum Webinar 29.10.2026** — drei Arbeitsströme, Woche für Woche, Gate-Logik, Risiken. Verweist quer über gtm/, app/ und ops/ |
| [`CHANGELOG.md`](./CHANGELOG.md) | Schema migration history — the PR template requires recording migrations here; path is load-bearing |

`sql/` holds loose SQL helpers for reference. Real migrations go through
the Supabase MCP `apply_migration` (see working rules in `../CLAUDE.md`)
or live in `../supabase/migrations/`.

---

## 🗄 Archive (`archive/`)

Historical one-offs kept for context: launch-day playbooks
(`LAUNCH_*.md`, `GO_LIVE.md`, `GODMODE_TONIGHT.md`), the Emergent-era
migration docs (`EMERGENT_*.md`, `CLAUDE_CODE_HANDOFF.md`,
`test_result.md`, `.gitconfig`, `.gitlab-ci.yml`), superseded design
guidelines, and completed task/branch audits. Nothing in `archive/` is
current — do not build on it.

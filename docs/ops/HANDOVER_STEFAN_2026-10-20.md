# Übergabe an Stefan · Stand 20.10.2026

Kurzfassung für die Zusammenarbeit nach dem Repo-Umzug. Ergänzt
`APP_TAKEOVER_STEFAN.md` und `EMERGENT_ADMIN_ONBOARDING.md`, ersetzt sie nicht.

## 1. Repo ist umgezogen

- Neu: `github.com/Argumentorik/LeaderOS` (vorher `aiporator/SHIPOS`).
  Produktionsbranch bleibt **`mvpcode`**. Alte URLs leiten um, Pushes mit
  alter Remote-URL funktionieren nicht mehr verlässlich: `git remote set-url
  origin https://github.com/Argumentorik/LeaderOS`.
- **Claude GitHub App** auf der Organisation `Argumentorik` installieren und
  das Repo `LeaderOS` freigeben (github.com/apps/claude/installations/select_target).
  Ohne das kann Claude Code keine Branches pushen und keine PRs öffnen.
- **Vercel-Projekt `leaderos`** (Team `aiporators-projects`, Domains
  leader-os.de / www.leader-os.de) hängt noch an `aiporator/SHIPOS`: die
  letzten automatischen Deploys (13.10.) kamen von dort. In Vercel unter
  Settings → Git das Repo auf `Argumentorik/LeaderOS` umhängen (Production
  Branch `mvpcode`), sonst deployt kein Merge mehr. Dafür muss die Vercel
  GitHub App auf der Org `Argumentorik` installiert sein.

## 2. Was seit dem 20.09. in `mvpcode` liegt (PRs #258 bis #267)

- **Statische Seiten** unter `frontend/public/<pfad>/index.html` (u. a.
  `/kurse`, `/fragen`, `/os`, `/start`). Vercel liefert sie als Dateien vor
  der SPA aus. Handgebautes HTML, kein React. `node
  frontend/scripts/check-public-urls.mjs` prüft die Links.
- **Prerendering:** `yarn build` in `frontend/` ist `craco build && node
  scripts/prerender-articles.mjs && node scripts/prerender-landings.mjs`.
  Die Skripte schreiben `build/journal/*`, `build/webinar/index.html`,
  `build/wlad-jachtchenko/index.html` usw. Ein Build ohne die Skripte
  verliert alle SEO-Antwortseiten.
- **`/webinar` und `/webinar/danke`** (offener Branch
  `claude/leader-os-video-funnel-3am9ju`, PR folgt, sobald der Push geht):
  Neubau in `frontend/src/pages/WebinarPage.js` und
  `WebinarThankYouPage.js`. Lead-Erfassung primär über
  `POST /api/webinar/register`, Fallback über die Supabase-Edge-Function
  `newsletter-subscribe` (siehe `docs/gtm/WEBINAR_FUNNEL.md`).
- **Instagram-System:** `docs/gtm/social-creatives-30/`,
  `docs/gtm/INSTAGRAM_LAUNCH_12.md`, `INSTAGRAM_30D_READY.md`,
  `CONTENT_TOPICS_YOUTUBE.md`. Vorschau unter `frontend/public/preview/ig-12/`
  (noindex, `robots.txt` sperrt `/preview/`).
- **Frontend-Bausteine:** `frontend/src/features/*` (Newsletter u. a.),
  `components/brand/*` (BookShelf, LogoWall, WladMark),
  `data/webinarEvent.js` als einzige Quelle für Termin, Agenda und FAQ des
  Webinars (SPA und Prerender lesen dieselbe Datei).
- **`vercel.json`:** Rewrites `/api/newsletter/*` → Supabase Edge Functions,
  `/api/:path*` → Emergent (`command-center-229.emergent.host`), dazu
  Security-Header und CSP. Bei neuen externen Skripten die CSP erweitern.

## 3. Was vom Backend (Emergent) erwartet wird

- `backend/routes/webinar.py` ist in `server.py` eingebunden, der laufende
  Emergent-Deploy kennt die Route aber nicht: `GET /api/webinar/stats`
  antwortet mit 404 (geprüft 20.10., 15:52 Uhr). Bitte das Backend aus
  `mvpcode` neu deployen. Env: `RESEND_API_KEY`,
  `WEBINAR_JOIN_URL=https://leader-os.de/webinar/live`, Meta-CAPI-Token,
  Mongo. Cron-Endpunkte: `/api/cron/webinar-reminders`,
  `/api/cron/webinar-followup` (`docs/ops/CRON_SCHEDULE.md`).
- Bis dahin landen Webinar-Anmeldungen über den Fallback in der
  Newsletter-Tabelle (Supabase, `source=webinar-lp`,
  `campaign=webinar-2026-10-29`). Vor dem 29.10. in `webinar_leads`
  nachziehen, damit Erinnerungen rausgehen.

## 4. Regeln, damit sich nichts überschreibt

- Den Emergent-Export nie 1:1 über `mvpcode` kopieren: `frontend/public/*`,
  `frontend/scripts/*`, `vercel.json` und `docs/*` existieren nur im Repo.
  Änderungen aus Emergent als PR gegen `mvpcode` mit Konfliktauflösung.
- `frontend/package.json` nur zusammen mit `yarn.lock` ändern (Vercel baut
  mit `--frozen-lockfile`).
- Schema-Änderungen nur per Supabase-Migration, Views mit
  `security_invoker = true`, `email_lower` bleibt der Identity-Key (siehe
  `CLAUDE.md`, `docs/app/SCHEMA.md`).
- Keine Zahlen oder Zitate über Wlad außerhalb von `docs/gtm/WLAD_CANON.md`.

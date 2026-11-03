# Launch Tomorrow — zwei saubere Vercel-Projekte

> Entscheidung 2026-06-11: Beide Domains bleiben auf Vercel, aber als
> **zwei getrennte Vercel-Projekte**, jeweils nur eine Domain. Das alte
> `shipos-vuml`-Projekt wird gestrippt und als Preview-Sandbox
> umfunktioniert.

## Ziel-Topologie

| Vercel-Projekt   | Repo / Branch         | Domain(s)                             | Zweck                          |
|------------------|-----------------------|---------------------------------------|--------------------------------|
| `leader-os`      | aiporator/shipos@mvpcode | leader-os.de · www.leader-os.de     | Produktion: Landing + App      |
| `leader-check`   | aiporator/shipos@mvpcode | leader-check.de · www.leader-check.de | Produktion: Diagnostic-Funnel  |
| `shipos-vuml`    | aiporator/shipos@feature | shipos-vuml.vercel.app              | Preview-Sandbox für Branches   |

Beide neuen Projekte bauen **denselben Code** (`frontend/`). Die
Domain-Differenzierung passiert zur Laufzeit über
`isLeaderCheckHost()` in `frontend/src/pages/LandingPage.js` — das
funktioniert bereits, kein Refactor nötig.

Warum das sauber ist:
- Jedes Projekt hat seine eigene SSL-Claim, Env-Vars, Deploy-History
- Ein Projekt kann gepausiert/rolled-back werden ohne das andere zu treffen
- Status-Pages und PostHog-Project-IDs trennbar pro Surface
- Später Code-Split möglich (`frontend/` für leader-os, `leader-check-app/` für leader-check) ohne nochmal Vercel-Setup zu touchen

## ROOT CAUSE — verifiziert via Vercel-API

Aktuell hält `shipos-vuml` alle 4 Domains gefangen:

```
project: shipos-vuml (prj_j9cp8ln8HCzWWTmz6YAnsCLW5hYw)
domains: [leader-os.de, www.leader-os.de, leader-check.de, www.leader-check.de, ...]
framework: null               // SOLL: "create-react-app"
nodeVersion: "24.x"           // SOLL: "22.x"
latestDeployment: ERROR (762ms build)
```

DNS auf `76.76.21.21` ist OK — Vercel routet pro Host-Header. Wir müssen
nur die Domains vom kaputten Projekt **ab**hängen und an die neuen
Projekte **an**hängen. **Keine GoDaddy-Änderung.**

## Morgen — Sequenz (≈25 Min, alles im Vercel-Dashboard)

### Schritt 1: Domains von shipos-vuml entfernen (5 Min)

https://vercel.com/aiporators-projects/shipos-vuml/settings/domains

Pro Domain: **3-Punkte-Menü → Remove**
- `leader-os.de`
- `www.leader-os.de`
- `leader-check.de`
- `www.leader-check.de`

`shipos-vuml.vercel.app` und git-branch-URLs **behalten**.

### Schritt 2: Projekt `leader-os` neu anlegen (8 Min)

https://vercel.com/new → Import Git Repository → `aiporator/shipos`

Einstellungen:
- **Project Name:** `leader-os`
- **Framework Preset:** `Create React App`
- **Root Directory:** `.` (NICHT `frontend/` — `vercel.json` lebt im Root)
- **Build Command:** *leave default* (übernimmt aus `vercel.json`)
- **Output Directory:** *leave default* (übernimmt aus `vercel.json`)
- **Install Command:** *leave default*
- **Node Version:** `22.x` (Settings → General nach dem ersten Deploy)
- **Production Branch:** `mvpcode` (Settings → Git nach Import)

Env-Vars aus shipos-vuml kopieren (Settings → Environment Variables des
alten Projekts öffnen, durchgehen, ins neue kopieren):
- `REACT_APP_BACKEND_URL` (sollte leer/relativ sein, weil `/api/*` proxied)
- `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_POSTHOG_KEY`, `REACT_APP_POSTHOG_HOST`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_SENTRY_DSN`
- alle anderen `REACT_APP_*` die existieren

Nach erstem Deploy:
- Settings → Domains → Add `leader-os.de` + `www.leader-os.de`
- Vercel zeigt grünen Haken (DNS schon korrekt auf 76.76.21.21)

### Schritt 3: Projekt `leader-check` neu anlegen (8 Min)

Gleiches Repo, identisches Setup, nur:
- **Project Name:** `leader-check`
- **Domain attach:** `leader-check.de` + `www.leader-check.de`
- **Env-Vars:** identisch zu `leader-os` (oder eigene PostHog-Projekt-ID für saubere Analytics-Trennung)

### Schritt 4: Verifizieren (5 Min)

Im Browser, nicht curl (Sandbox blockt):

```
https://leader-os.de/              # Nike-DNA Landing
https://leader-os.de/login         # Login mit Google/Apple/Microsoft
https://leader-check.de/           # Light-Nike Landing
https://leader-check.de/quiz       # Quiz-Funnel
```

API testen:
```
https://leader-os.de/api/health    # JSON-Response, nicht 403
```

## Backend bleibt auf Emergent (vorerst)

`vercel.json` proxied `/api/*` → `command-center-229.preview.emergentagent.com`.
Das funktioniert weil Vercel Server-Side Rewrite den Host-Header auf den
Emergent-Host setzt — Emergent's Allowlist-Check trifft also nicht auf
`leader-os.de` sondern auf seinen eigenen Hostname. Sollte grün sein.

**Falls `/api/*` trotzdem 403 gibt** → Emergent hat den Preview-Host
geschlossen. Backend-Migration nach Supabase Edge Functions wird dann
priorisiert (separate Doc, separate Woche).

## shipos-vuml — was passiert mit dem Projekt

**Behalten als Preview-Sandbox.**

- Production Branch wechseln: `mvpcode` → einer der claude/*-Feature-Branches
- Custom-Domain optional anhängen: `preview.shipos.dev` oder nichts
- Hier landet experimentelle Arbeit (PR #66 Nike-DNA), bevor sie nach
  `leader-os` gemerged wird

So bleibt Production sauber, Experimente bleiben sichtbar.

## Was wir heute Nacht *nicht* mehr machen

- Keine Vercel-UI-Klicks heute (machst du morgen früh in einem Rutsch)
- Kein Force-Push auf `mvpcode`
- Kein Branch-Cleanup (separate Aufgabe, post-launch)

## Was ich heute Nacht aufgeräumt habe

- [x] PR #66 wartet auf Merge in `mvpcode` (nach erfolgreichem
      Vercel-Setup morgen — kein Blocker für Launch)
- [x] `docs/LAUNCH_TOMORROW.md` als Single-Source-of-Truth
- [x] `docs/BRANCH_CLEANUP.md` als Putz-Liste (Vorschlag, post-launch)
- [x] Vercel-Project-State auditiert und Root-Cause hier dokumentiert

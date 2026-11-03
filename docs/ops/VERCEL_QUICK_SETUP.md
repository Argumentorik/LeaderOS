# Vercel Quick Setup — wenn die "New Project"-Maske offen ist

> Direktanleitung für den Moment in dem du auf
> https://vercel.com/new die "Import Git Repository"-Maske siehst.

## Felder ausfüllen (für `leader-os`)

| Feld                   | Wert                                |
|------------------------|-------------------------------------|
| Vercel Team            | INHALE                              |
| Project Name           | `leader-os` (mit Bindestrich!)      |
| Branch (oben)          | `mvpcode` ⚠️ NICHT der Default      |
| Application Preset     | Create React App                    |
| Root Directory         | `./` (default, lassen)              |
| Build Command          | leer / default — `vercel.json` regelt das |
| Output Directory       | leer / default                      |
| Install Command        | leer / default                      |
| Environment Variables  | **leer lassen** — Erklärung unten   |
| Node Version (later)   | 22.x (Settings → General nach Deploy) |

### Branch auf mvpcode setzen

Vercel zeigt in der Maske oben den Branch der gerade ausgecheckt ist
(z.B. `claude/install-supabase-cli-Z8CF9`). Du kannst das HIER nicht
ändern — aber kein Drama:

1. Erstmal Deploy klicken (Build wird vielleicht fehlschlagen oder
   einen alten Stand zeigen — egal).
2. Nach dem ersten Deploy: **Settings → Git → Production Branch**
3. Dropdown auf `mvpcode` setzen, Save.
4. Oben rechts: **Redeploy** → jetzt baut er den richtigen Code.

## Env-Vars — wirklich keine nötig?

**Korrekt, für den ersten Deploy nicht.** Frontend-Code:
- Backend-URL → leer = same-origin = `/api` → Vercel rewrite → Emergent ✓
- Supabase → wird vom Frontend nie direkt angerufen (alles über `/api/*`) ✓
- PostHog/Sentry → wenn nicht gesetzt = silent, App läuft trotzdem ✓

Für **Observability später** (wenn die Site live ist), in Settings →
Environment Variables nachtragen:

```
REACT_APP_POSTHOG_KEY=phc_...
REACT_APP_POSTHOG_HOST=https://eu.i.posthog.com
REACT_APP_SENTRY_DSN_LEADER_OS=https://...@...ingest.de.sentry.io/...
REACT_APP_SENTRY_DSN_LEADER_CHECK=https://...@...ingest.de.sentry.io/...
REACT_APP_SENTRY_ENV=production
```

**Wo finde ich die Werte?** Im alten `shipos-vuml`-Projekt
(Settings → Environment Variables). Auch wenn der Download nicht
geht, kannst du sie da einzeln kopieren — neben jeder Variable ist ein
👁-Icon zum aufdecken.

Falls du da auch nicht rankommst:
- **PostHog Keys:** https://eu.posthog.com → Project Settings → Project API Key
- **Sentry DSN:** https://sentry.io → Settings → Projects → leader-os / leader-check → Client Keys (DSN)

## Nach erstem Deploy

1. Settings → Git → Production Branch = `mvpcode` ✓
2. Settings → General → Node Version = `22.x` ✓
3. Settings → Domains → Add `leader-os.de` und `www.leader-os.de`
4. Vercel zeigt grünen Haken pro Domain (DNS schon auf 76.76.21.21)
5. Browser-Test: https://leader-os.de/ muss Landing zeigen

## Dann das gleiche für `leader-check`

- Neues Projekt, Name `leader-check`
- Gleiches Repo, gleiche Settings
- Domain `leader-check.de` + `www.leader-check.de` attachen
- Browser-Test: https://leader-check.de/quiz muss den Funnel zeigen

## Wichtig — Domains am alten Projekt entfernen!

**Vor** dem Domain-Attach an die neuen Projekte (oder direkt jetzt
während du sowieso im Vercel-UI bist):

https://vercel.com/aiporators-projects/shipos-vuml/settings/domains
→ alle 4 Production-Domains: **3-Punkte → Remove**

Sonst sagt Vercel beim Attach: "Already in use". `*.vercel.app`
Subdomains am alten Projekt belassen.

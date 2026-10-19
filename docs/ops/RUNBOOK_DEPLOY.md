# Deploy-Runbook · leader-os.de + leader-check.de

> Production läuft auf Vercel, Branch `mvpcode`. Alle Surfaces aus
> einem Code-Base, Host-Routing in `LandingPage.js` entscheidet
> welche Variante ausgeliefert wird.

## Aktuelle Lage (häufige Fragestellung)

**„Ich gehe auf leader-os.de und sehe die alte Landing."**

Das passiert wenn:
1. Vercel-Production-Deploy ist von einem alten Commit auf `mvpcode`
2. ODER: Production-Deploy ist von einem anderen Branch (z.B. ein
   stale `claude/*` der vor mvpcode aktiv war)
3. ODER: Vercel-Settings differieren (Warning oben in der Vercel-UI:
   "Configuration Settings in the current Production deployment
   differ from your current Project Settings")

**Lösung in drei Schritten** ↓

## 1. Code auf mvpcode bringen

Wenn Feature-Branch (z.B. `claude/add-vimeo-links-9cL3u`) gemerged
werden soll:

```bash
git fetch origin
git checkout mvpcode
git pull origin mvpcode
git merge origin/claude/add-vimeo-links-9cL3u    # fast-forward, kein Konflikt
git push origin mvpcode
```

Fast-Forward heißt: keine Merge-Commits, nichts zu reviewen, einfach
„Vorspulen". Wenn Konflikte kommen — das passiert nur wenn auf
mvpcode parallel etwas gepusht wurde — `git merge` zeigt sie an.

## 2. Vercel-Settings-Warning auflösen

Wenn die Vercel-UI sagt **„Configuration Settings in the current
Production deployment differ from your current Project Settings"**:

1. Vercel-Dashboard → Project → **Settings → Build & Deployment**.
2. Oben unter „Framework Settings" auf **„Production Overrides"**
   klicken — das zeigt was im letzten Production-Deploy aktiv war.
3. Auf **„Project Settings"** unten klicken — das ist was bei jedem
   neuen Deploy genutzt wird.
4. Entscheide: sollen die Overrides bleiben oder verworfen werden?
   - Meistens: **„Project Settings" sind richtiger** → einfach den
     nächsten Deploy machen, Overrides werden überschrieben.
   - Wenn ein Override absichtlich war → in den Project Settings
     übernehmen und Save.

## 3. Node-Version pinnen (verhindert Build-Brüche)

Falls die UI **Node.js Version: 24.x** zeigt — das ist zu neu für
CRA 5 und kann subtile Build-Brüche auslösen. Wir haben deshalb im
Repo:

- `/.nvmrc`            mit Inhalt `20`
- `/frontend/.nvmrc`   mit Inhalt `20`

Vercel respektiert `.nvmrc` automatisch. Wenn die UI trotzdem 24.x
zeigt: in **Settings → Build & Deployment → Node.js Version**
manuell auf **20.x** stellen, Save, Redeploy.

## 4. Production-Deploy auslösen

Nach dem Push auf `mvpcode` startet Vercel automatisch. Status im
**Deployments**-Tab. Ein erfolgreicher Production-Build sieht so aus:

```
✓ Installing dependencies (yarn install --frozen-lockfile)
✓ Building (yarn build → craco build)
✓ Deploying to leader-os.de + leader-check.de + www.*
✓ Production deployment ready
```

Dauer: ~90 Sekunden.

## 5. Verify — checkt alle Hebel

Sobald „Production deployment ready" steht, durchklicken:

| URL                                          | Was muss da sein                         |
| -------------------------------------------- | ---------------------------------------- |
| `https://leader-os.de/`                      | Volle Pitch-Landing, Hero "Werde KI-nativ" |
| `https://leader-check.de/`                   | Freundliche schwarze Landing, "Finden wir deinen Startpunkt" |
| `https://www.leader-check.de/`               | Gleiche wie leader-check.de              |
| `https://leader-os.de/studio`                | Hub mit 3 Studios + Workflow             |
| `https://leader-os.de/specimens`             | IG/LinkedIn-Content-Tiles                |
| `https://leader-os.de/ads`                   | Netflix-Bites-Ad-Tiles                   |
| `https://leader-os.de/system`                | Live-Health, sollte "GO" lime sein       |
| `https://leader-os.de/api/monitoring/system` | JSON, `overall: "go"`                    |
| `https://leader-os.de/api/uploads/health`    | JSON, `backend: "supabase"`              |
| `https://leader-os.de/api/payments/stripe-mode` | JSON, `mode: "live"`                  |

Wenn EINE dieser Checks fehlschlägt:

- **Landing zeigt alte Version** → Browser-Cache. Strg+Shift+R / Cmd+Shift+R.
- **leader-check zeigt Pitch-Landing** → Host-Routing nicht aktiv,
  d.h. der Code wurde nicht gemerged. `git log mvpcode` checken,
  letzter Commit muss „feat(leader-check)" sein.
- **/system zeigt DOWN** → ENV-Vars fehlen in Vercel Production.
  Settings → Environment Variables checken (siehe `EMERGENT_MIGRATION.md`).
- **/api/uploads/health zeigt backend: "emergent"** → Supabase-ENVs
  noch nicht gesetzt. SUPABASE_URL + SUPABASE_SERVICE_KEY +
  SUPABASE_STORAGE_BUCKET in Vercel Production setzen.

## Rollback

Wenn ein Production-Deploy kaputt ist:

1. Vercel-Dashboard → **Deployments** → letzter funktionierender
   Production-Deploy → **„Promote to Production"**.
2. Das ist in < 30 Sekunden live, kein Code-Rollback nötig.
3. Danach: Bug im Code finden, fixen, neu pushen.

## Was NIE passiert

- `leader-os.de` zeigt die `LeaderCheckLanding`. Der Host-Check
  `/(^|\.)leader-check\.de$/i.test(hostname)` matched leader-os.de
  niemals. Wenn doch — sofort eskalieren, das wäre ein Production-
  Severity-Bug.
- `leader-check.de` zeigt die volle Pitch-Landing. Wenn ja — Code
  ist nicht gemerged, siehe Schritt 1.

## Pattern für neue Surfaces

Beispiel: `leader-enterprise.de` für B2B-Sales:

1. Neue Datei `frontend/src/pages/EnterpriseLanding.js`.
2. `LandingPage.js` ergänzen:
   ```js
   const isEnterpriseHost = () =>
     /(^|\.)leader-enterprise\.de$/i.test(window.location.hostname);
   if (isEnterpriseHost()) return <EnterpriseLanding />;
   ```
3. Domain in Vercel-Dashboard hinzufügen.
4. Push, fertig.

Eine Codebase, mehrere Surfaces, Host-Routing.

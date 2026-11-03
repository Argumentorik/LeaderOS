# Vercel-Domains · leader-os.de & leader-check.de

> Zwei Surfaces, ein Build, ein Code-Branch. Host-Detection in
> `LandingPage.js` (`isLeaderCheckHost()`) entscheidet welche Variante
> ausgeliefert wird.

## Setup im Vercel-Dashboard

### Variante A — Beide Domains am selben Projekt (empfohlen)

Vorteile: ein Build pro Push, ein Preview-Link, eine Logs-Ansicht,
geteilte ENVs. Reicht solange beide Surfaces denselben Codebase teilen.

1. Vercel-Dashboard → Project `shipos` (oder wie es bei dir heißt) →
   **Settings → Domains**.
2. `leader-os.de` ist bereits Primary.
3. **Add Domain** → `leader-check.de` → Vercel zeigt die nötigen
   DNS-Records (A → `76.76.21.21` oder CNAME → `cname.vercel-dns.com`).
4. Bei eurem Domain-Registrar (z.B. inwx, hetzner) für `leader-check.de`
   diese Records eintragen.
5. Status in Vercel auf "Valid Configuration" warten (TTL je nach
   Registrar 1 Min bis 1 h).
6. **Production Branch** beider Domains bleibt `mvpcode`.
7. Optional: `www.leader-check.de` als Alias-Domain mit Redirect auf die
   Apex hinzufügen.

Code-Branching ist bereits live: `frontend/src/pages/LandingPage.js`
prüft `window.location.hostname`, gibt bei `leader-check.de` (und
Subdomains) die `LeaderCheckLanding`-Variante zurück. Alle anderen
Routes (`/login`, `/dashboard`, `/leader-diagnose`, …) funktionieren
auf beiden Domains identisch — das ist erwünscht: Auth landet immer
unter `leader-os.de`, leader-check leitet automatisch dahin.

### Variante B — Zwei separate Vercel-Projekte aus demselben Repo

Wenn ihr getrennte ENVs braucht (z.B. unterschiedliche PostHog-Projekte,
verschiedene Sentry-DSNs, anderes Sub-Set an Features), schaltet ihr
zwei Projekte aus demselben Repository:

1. Vercel → **Add New… → Project** → Repo wählen → Project-Name
   `shipos-leader-check`.
2. **Root Directory** bleibt der Repo-Root (vercel.json zieht alles).
3. **Production Branch**: identisch (`mvpcode`), oder ein eigener
   Release-Branch für leader-check.
4. ENV-Vars separat setzen — insbesondere:
   - `REACT_APP_SENTRY_DSN_LEADER_CHECK` (bereits im Code referenziert)
   - `REACT_APP_POSTHOG_KEY` (eigene Project-ID)
5. Domain `leader-check.de` an dieses Projekt binden, **nicht** ans
   leader-os-Projekt.

Sentry-DSN-Switch passiert automatisch in `frontend/src/index.js` per
Hostname-Check — kein Code-Eingriff nötig.

## DNS-Records (für Variante A)

| Type  | Name              | Value                    | TTL   |
| ----- | ----------------- | ------------------------ | ----- |
| A     | `leader-check.de` | `76.76.21.21`            | 300   |
| CNAME | `www`             | `cname.vercel-dns.com`   | 300   |
| TXT   | `_vercel`         | (von Vercel angezeigter Verifizierungs-String) | 300 |

## SSL

Vercel handled Let's Encrypt automatisch sobald der DNS valide ist.
Keine Zertifikats-Aktion nötig. Renewal automatisch.

## Test nach Cutover

1. `https://leader-check.de` → muss die schwarze Diagnostic-Landing
   zeigen (LeaderCheckLanding).
2. `https://leader-os.de` → muss die volle Pitch-Landing zeigen.
3. Beide Domains → `/login`, `/leader-diagnose`, `/specimens`, `/ads`
   müssen funktionieren.
4. PostHog: gleiche `email_lower`-Identität auf beiden Domains?
   In den Person-Properties prüfen.
5. Sentry: ein leader-check-spezifischer Test-Error sollte im
   leader-check-Sentry-Projekt landen, nicht im leader-os.

## Rollback

Falls leader-check.de fehlerhaft auflöst oder die Diagnostic-Landing
nicht zeigt:

- DNS-Records bei eurem Registrar zurückrollen.
- Im Code: `frontend/src/pages/LandingPage.js` → `isLeaderCheckHost()`
  temporär `return false` returnen. Push, ~90 Sek warten.

## Wenn ein dritter Surface kommt

Beispiel: `leader-enterprise.de` für B2B-Sales.

1. Neue `EnterpriseLanding.js` unter `frontend/src/pages/`.
2. Host-Check in `LandingPage.js` erweitern:
   ```js
   const isEnterpriseHost = () =>
     /(^|\.)leader-enterprise\.de$/i.test(window.location.hostname);
   if (isEnterpriseHost()) return <EnterpriseLanding />;
   ```
3. Domain in Vercel-Dashboard adden, DNS setzen, fertig.

Das ist das Pattern: **eine Code-Verzweigung, ein Build, n Domains**.
Skaliert solange die Surfaces ähnlich genug sind.

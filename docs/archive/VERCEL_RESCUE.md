# GODMODE Rescue — Vercel-Projekt frisch aufsetzen

> Letzte Erkenntnis: **Alle 20 letzten Vercel-Deploys = ERROR**, jeden Branch,
> jeden Commit, auch leere Dependabot-Bumps. Build startet nie (563ms,
> empty logs). Diagnose: das `leaderos`-Projekt hat eine kaputte
> Integration-Provisioning-Phase die wir nicht von außen reparieren
> können.
>
> **Schnellster Weg zu live: Fresh Project anlegen.** 8 Minuten total.

## Warum nicht das alte Projekt fixen

Wir haben versucht:
- `vercel.json` mit framework + commands → ignoriert
- `.nvmrc` Node 22 → ignoriert
- `package.json engines` Node 22.x → ignoriert
- Mehrere Code-Pushes → triggern jeweils ERROR ohne Logs

Das Projekt blockiert in der "Provisioning Integrations"-Phase **bevor**
unser Code überhaupt geladen wird. Eine Bound-Integration (vermutlich
Supabase oder Sentry aus der `shipos-vuml`-Ära vor dem Rename) ist
beim Provisioning kaputt. Im UI sieht man das als "2 Recommendations".

Statt eine Stunde Vercel-Support-Ticket zu öffnen: Fresh start. 8 Min.

---

## STEP 1 — Frisches Vercel-Projekt anlegen (3 Min)

1. https://vercel.com/new
2. **Import Git Repository** → `aiporator/SHIPOS`
3. Eingabefeld unten:

```
Project Name        shipos
Framework Preset    Create React App
Root Directory      ./      (lassen)
Build Command       (leer — vercel.json regelt)
Output Directory    (leer — vercel.json regelt)
Install Command     (leer — vercel.json regelt)
Node.js Version     22.x    (Settings → General nach dem ersten Deploy)
```

4. **Environment Variables**: einfach leer lassen, kein einziger Var nötig
   für den ersten Deploy. Sind Optional (siehe `frontend/.env.example`).
5. **Deploy** klicken
6. Build sollte in ~90 Sek durchlaufen (NICHT 563ms ERROR)
7. Verifizieren: die `*.vercel.app` URL zeigt die Landing-Page

## STEP 2 — Production Branch + Settings (1 Min)

Nach erstem Deploy in neuem Projekt:

- Settings → **Git** → Production Branch = `mvpcode`
- Settings → **General** → Node.js Version = `22.x` (sollte schon)
- Settings → **General** → Framework Preset = `Create React App` (sollte schon)

## STEP 3 — Domains umziehen (3 Min)

### Erst vom alten kaputten Projekt entfernen:

https://vercel.com/aiporators-projects/leaderos/settings/domains

- `leader-os.de` → 3-Punkte-Menü → **Remove**
- `www.leader-os.de` → Remove
- `leader-check.de` → Remove
- `www.leader-check.de` → Remove

(Wenn keine dieser Domains da steht: war schon nie attached, weiter zu nächstem Schritt.)

### Im neuen `shipos`-Projekt anhängen:

https://vercel.com/aiporators-projects/shipos/settings/domains

- **Add Domain** → `leader-os.de` → grüner Haken (DNS schon richtig)
- **Add Domain** → `www.leader-os.de`
- **Add Domain** → `leader-check.de`
- **Add Domain** → `www.leader-check.de`

Vercel verifiziert in ~30 Sek, dann sind die Domains umgezogen.

## STEP 4 — Smoke-Test (1 Min)

Im Browser:

```
□  https://leader-os.de/                     → Nike-DNA-Landing
□  https://leader-os.de/qr/leadercheck.png   → QR-Bild lädt
□  https://leader-check.de/                  → Light-Nike-Landing
```

Sobald alle 3 grün → **du bist live**. PR #85 kann dann gemergt werden,
neuer Code deployt automatisch über das neue Projekt.

---

## STEP 5 (post-launch) — Altes Projekt löschen

Sobald `shipos` stabil läuft und Domains umgezogen sind:

https://vercel.com/aiporators-projects/leaderos/settings/general → unten:
**"Delete Project"** → Bestätigen.

Damit ist der kaputte `leaderos`-Project endgültig weg und die kaputten
Integrations bonded an dieses Projekt sind auch tot.

---

## Wenn ein Schritt nicht klappt

### "Domain already in use" beim Attach

→ Domain ist noch beim alten Projekt. STEP 3 erste Hälfte (Remove)
muss VOR der zweiten Hälfte (Add) passieren.

### "DNS not configured" Warning

→ Vercel braucht 1–2 Min für SSL-Cert-Provisioning. Warten.
Wenn nach 5 Min noch rot: GoDaddy DNS prüfen, dass `leader-os.de` auf
`76.76.21.21` zeigt und `www.leader-os.de` CNAME auf `cname.vercel-dns.com`.

### Build im neuen Projekt failt trotzdem

→ unwahrscheinlich, weil keine Legacy-Integrations. Wenn doch: Logs sind
diesmal echt da (nicht empty). MCP-Tool kann sie ziehen.

---

## Was vom Code aus schon scharf-geschaltet ist

Branch `claude/wlad-images` Head (e881c2b) hat:

- `.nvmrc` + `frontend/.nvmrc` = Node `22`
- `frontend/package.json` `engines.node = "22.x"`
- `vercel.json` `framework: "create-react-app"` explizit
- `vercel.json` install/build/output Commands explizit
- Lokaler Build durchläuft in 73 Sekunden grün

Sobald das frische Projekt steht, läuft alles durch.

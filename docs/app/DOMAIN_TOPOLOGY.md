# Domain-Topologie — canonical

> Last updated: 2026-06-18. **Bindestriche = Marketing-Landing-Pages
> (Vercel). Ohne Bindestriche = Apps (Emergent).** Eselsbrücke:
> die mit dem Strich ist die Brücke zur App.

## TL;DR — die Eselsbrücke

```
Mit Bindestrich     →  Landing (Marketing)  →  Vercel    →  shipos/mvpcode
Ohne Bindestrich    →  App (echte Action)   →  Emergent  →  Emergent-Projekt
```

| Memo | Vier Hosts |
|---|---|
| Landing leader-OS | `leader-os.de`     → Vercel |
| App     leader-OS | `leaderos.de`      → Emergent |
| Landing leader-Check | `leader-check.de` → Vercel |
| App     leader-Check | `leadercheck.de`  → Emergent |

## Wo welcher Name in Code/Copy erscheinen darf

- **Visible user copy + Buttons**: immer die Ziel-URL nennen wo der
  Klick hingeht. "Diagnose auf leadercheck.de" → User klickt → er
  ist genau dort. Konsistent.
- **Code-Kommentare + Docs**: auseinanderhalten. "leader-check.de
  Vercel landing" vs "leadercheck.de Emergent app". Future-Devs
  müssen es lesen können.
- **SEO + Wlad-Audience Erinnerung**: `leader-os.de` und
  `leader-check.de` sind die merkbaren Markennamen — die werden
  in Newsletter-Subjects, Visitenkarten, QR-Aufdrucken verwendet.

## Die vier Hosts

| Domain | Hosting | Inhalt | Build aus |
|---|---|---|---|
| `leader-os.de` | Vercel | Nike-DNA Marketing-Landing | shipos `mvpcode` |
| `leader-check.de` | Vercel | Diagnostic Marketing-Landing | shipos `mvpcode` |
| `leaderos.de` | Emergent | App: Login + Dashboard + WladBot + Coaching | Emergent Projekt A |
| `leadercheck.de` | Emergent | App: Diagnose-Quiz + Score + Lead-Capture | Emergent Projekt B |

## CTA-Fluss

```
Visitor → leader-os.de       (Landing, Vercel)
              ↓ "Diagnose starten" Button
          leadercheck.de     (Quiz, Emergent)
              ↓ Quiz fertig, Score angezeigt
              ↓ "Sprint starten" Button
          leaderos.de/login  (App, Emergent)
              ↓ Login
          leaderos.de/dashboard


Visitor → leader-check.de    (Landing, Vercel)
              ↓ "Diagnose starten" Button
          leadercheck.de     (Quiz, Emergent)
              ↓ ... wie oben
```

## DNS-Setup

| Host | Type | Value |
|---|---|---|
| `leader-os.de` | A | `76.76.21.21` (Vercel) |
| `www.leader-os.de` | CNAME | `cname.vercel-dns.com` |
| `leader-check.de` | A | `76.76.21.21` (Vercel) |
| `www.leader-check.de` | CNAME | `cname.vercel-dns.com` |
| `leaderos.de` | CNAME | `<emergent-target>` (von Emergent Dashboard) |
| `leadercheck.de` | CNAME | `<emergent-target>` (von Emergent Dashboard) |

## Frontend-Code-Konsequenzen

`isLeaderCheckHost()` in `LandingPage.js` muss prüfen:
```js
/(^|\.)leader-check\.de$/i.test(hostname)
```

Aber **nicht** `leadercheck.de` matchen — das ist die App und wird
nicht von der React-Landing serviert, sondern von Emergent direkt.

### CTA-Targets in der Vercel-Landing

| Button | Wo | Target |
|---|---|---|
| "Diagnose starten" | überall im Funnel | `https://leadercheck.de/` |
| "Login" | LandingNav | `https://leaderos.de/login` |
| "Sprint starten" | Pricing, Final-CTA | `https://leaderos.de/checkout?tier=sprint` |
| "WladBot starten" | Hero-Sub-CTA | `https://leaderos.de/chat` |

## Supabase Auth Allowlist

Alle vier Hosts müssen in der Supabase Redirect-URL-Allowlist sein:
```
https://leader-os.de/**
https://www.leader-os.de/**
https://leader-check.de/**
https://www.leader-check.de/**
https://leaderos.de/**
https://leadercheck.de/**
http://localhost:3000/**
```

## Sitemap- und Robots-Topologie (per-Host)

Beide Marketing-Hosts werden vom selben React-Build serviert, brauchen
aber unterschiedliche `sitemap.xml` und `robots.txt`. Das wird via
Vercel host-based rewrites in `vercel.json` gelöst:

| Host | Sitemap → File | Robots → File |
|---|---|---|
| `leader-os.de` (default) | `/sitemap.xml` | `/robots.txt` |
| `leader-check.de` | `/sitemap-leader-check.xml` | `/robots-leader-check.txt` |

Beim Editieren der Routen-Listen: immer **beide** Files anpassen.
Default ist LeaderOS — Leader-Check ist override.

## Data-Sync — IST-Zustand (Stand 2026-06-20)

Die `public.users`-Tabelle dient als gemeinsame Identity (CLAUDE.md).
Snapshot der echten Datenlage:

- 28 Users insgesamt
- **0 Users mit `meta_tags ['leader-check']`** ⚠
- 2 Users mit `meta_tags ['leader-os']`
- **0 Users mit `source_platform = 'leader-check'` oder `'leader-os'`** ⚠
- Alle 28 haben `source_platform = 'emergent'` (Wert nicht in CLAUDE.md-Spec)
- **Tabelle `public.incomplete_attempts` existiert nicht** — die
  Postgres-Funktion `upsert_incomplete_attempt` referenziert ein Schema
  das nie deployed wurde.

Heißt konkret: alle bisherigen Signups gehen über die Emergent-Apps
(`leaderos.de`, `leadercheck.de`). Die Vercel-Marketing-Landings
schreiben aktuell **nichts** in Supabase — sie redirecten nur weiter
auf Emergent. Wer Cross-Platform-Stitching wirklich will, muss in den
Emergent-Projekten `source_platform` auf `'leader-os'` / `'leader-check'`
setzen statt `'emergent'`, plus `meta_tags` korrekt vergeben.

## Was als nächstes

1. **GoDaddy DNS:** A-Records für `leaderos.de` + `leadercheck.de`
   auf Emergent-Target setzen (sobald Emergent die Domain accepted).
2. **Emergent:** Custom Domains `leaderos.de` und `leadercheck.de`
   adden in den jeweiligen Projekten.
3. **Emergent:** `source_platform`-Konstante in beiden Projekten
   umstellen von `'emergent'` → `'leader-os'` bzw. `'leader-check'`.
4. **Supabase:** Allowlist erweitern auf die 6 Patterns oben.
5. **Supabase:** Schema-Audit — entweder `public.incomplete_attempts`
   Tabelle nachziehen oder `upsert_incomplete_attempt` Funktion löschen
   wenn sie nirgends benutzt wird.
6. **Frontend:** CTA-Targets nachziehen (LandingNav, Hero, Pricing,
   FinalCTA). Ist ein separater PR sobald die App-Domains live sind.

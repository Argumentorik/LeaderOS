# Tuesday-Launch — Production Readiness Checklist

> **Target:** Dienstag, erste 100 User · vier Domains live · Stripe in Production.
> **Stand:** 2026-06-19 · PR #85 GEMERGT (f367e92). Neues Vercel-Projekt `shipos` deploys mvpcode auto.
> **Vercel-Projekt:** `shipos` (NICHT mehr `leaderos`, der war kaputt + gelöscht).

## 0. Wo wir gerade stehen (PR-Status sauber)

GitHub PR-Liste ist von **18 → 2** geschrumpft. Was offen ist:

| PR | Was | Status |
|---|---|---|
| **#85** Claude/wlad images | DER Launch-PR — Wlad-Bilder, QR-Codes, Email-Template, Pricing-Sync, Asset-Repair, Node-22, VERCEL_RESCUE Doku | **MERGE BLOCKED nur durch Vercel** |
| #41 (Draft) emergent iter 92.18 | Backend-Hardening (PGRST002-Retry, Brian-Voice, Wingman-CRM) | Post-Launch, nicht Dienstag |

Alles andere (16 PRs: #65, #69, #71-82, #83, #84) wurde als obsolet
geschlossen am 19.06. — siehe Close-Kommentare auf den jeweiligen PRs.

---

## 1. Branch-Struktur — der Pfad zur Production

### Wie der Code von hier nach Live kommt

```
[ Claude Code dev / Cursor / lokales Repo ]
              ↓
              push origin claude/<branch>
              ↓
[ PR auf GitHub ]  ──→  base: mvpcode (immer)
              ↓
              squash-merge nach Review
              ↓
[ mvpcode (Production-Branch) ]
              ↓
              Vercel auto-deploy
              ↓
   leader-os.de  +  leader-check.de   ← Marketing-Landings live
```

**Regeln:**
- `mvpcode` ist **THE single source of truth** für Vercel
- Direkt-Pushes auf `mvpcode` blockieren (siehe `docs/DEV_TASKS_BRANCHES.md`
  Task 2 — Branch Protection)
- Feature-Branches nach Squash-Merge **automatisch löschen** (Repo
  Settings → "Automatically delete head branches")
- App-Code (leaderos.de, leadercheck.de) liegt im **Emergent-Workspace**,
  NICHT in diesem Repo. Änderungen dort = Emergent-Dashboard

### Aktueller Branch-Stand

| Branch | Status | Action |
|---|---|---|
| `mvpcode` | Production-Head 1a2a9ac | ✓ stable, nichts tun |
| `claude/wlad-images` | 9 commits ahead, ready to merge (PR #85) | **Mergen nach Vercel-Rescue** |
| Restliche ~80 Branches | Stale (history + claude/* iterations) | Putzen via `docs/DEV_TASKS_BRANCHES.md` (post-launch) |

### Was auf `claude/wlad-images` drauf ist und live geht

1. **Wlad-Bilder** in §01 + §02 (Higgsfield-generated, asset-paths repariert)
2. **Video-Thumbnail** auf `hf-04.png` (statt totem `wlad-thumbnail.jpg`)
3. **QR-Codes** für leadercheck.de (`/qr/leadercheck.svg` + `.png`)
4. **WladBot Overview Doc**
5. **Launch-Email-Template** (`launch_announcement_email`)
6. **Domain-Topology Klärung** in Code-Kommentaren + Visible-Copy
7. **Branch-Cleanup Doku** für Dev

---

## 2. Was auf welcher Domain läuft — Final Check

| Domain | Hosting | Inhalt | Code-Quelle |
|---|---|---|---|
| `leader-os.de` | Vercel | Marketing-Landing (Nike-DNA, Hero, Pricing, FAQ) | shipos `mvpcode` |
| `leader-check.de` | Vercel | Diagnostic Landing (light Nike) | shipos `mvpcode` |
| `leaderos.de` | Emergent | App: Login + Dashboard + WladBot + Coaching | Emergent Workspace |
| `leadercheck.de` | Emergent | App: 5-Min-Diagnose + Score | Emergent Workspace |

### Was du auf Emergent-Apps verifizieren musst (bis Dienstag)

Da der Emergent-Code in einem getrennten Workspace lebt, hier die
**read-only-Checks** die du im Browser machst:

- [ ] **`leaderos.de`** lädt und zeigt Login-Page
- [ ] Login via Google/Apple/Microsoft funktioniert (Supabase Auth)
- [ ] `/dashboard` nach Login erreichbar
- [ ] WladBot-Chat antwortet auf erste Test-Frage in < 5 Sek
- [ ] `/api/health` → 200 OK
- [ ] CORS akzeptiert Aufrufe von `leader-os.de` (via Browser-DevTools
      Network-Tab → eine Vercel-Page CORS-Request)

- [ ] **`leadercheck.de`** lädt und zeigt 5-Min-Quiz
- [ ] Quiz durchgespielt → Score sichtbar
- [ ] Email-Eingabe persistiert (in Supabase `incomplete_attempts`)
- [ ] Nach Quiz → Redirect/CTA zu `leaderos.de/login` für Sprint

---

## 3. PR Merge + Deploy (heute)

1. **PR auf** `https://github.com/aiporator/SHIPOS/compare/mvpcode...claude/wlad-images`
2. Base ist **`mvpcode`** (sicherstellen oben links)
3. ☑ "Merge without waiting for requirements" (Bypass — siehe `docs/VERCEL_PREVIEW_ISSUE.md`)
4. **Squash and merge** → Commit-Message kurz lassen
5. Branch löschen wenn GitHub fragt → ja
6. Vercel Production-Deploy läuft (~90 Sek)
7. Verifiziere: `https://leader-os.de/qr/leadercheck.png` lädt → live

---

## 4. Stripe Cutover auf Live-Mode (kritisch für Dienstag)

### Aktuelle Live-Code-Lage

| Element | Wo | Status |
|---|---|---|
| Stripe-SDK | `backend/lib/stripe_checkout.py` | ✓ Native SDK + Emergent-Fallback-Shim |
| Server-side Pakete | `backend/routes/payments.py` `PACKAGES` dict | ✓ Definiert, **aber Preis-Drift! siehe unten** |
| Webhook-Endpoint | `POST /api/webhook/stripe` mit Signatur-Validierung | ✓ Code OK |
| Env-Vars | `STRIPE_API_KEY=sk_test_emergent` | ❌ Noch im Test-Mode |

### Preis-Drift — komplett synchronisiert ✓

**Vor dem Fix:** Backend & 14 Frontend-Surfaces zeigten 4 447 €, Landing 4 797 €.
**Nach dem Fix:** Alles auf 4 797 €, in 20 Files gesynced (siehe commit `43aa53a`):

| Layer | Stellen |
|---|---|
| Backend Code | `backend/routes/payments.py`, `backend/services_tier.py` |
| Backend Tests | `backend/tests/test_iteration74_pricing.py` |
| Frontend Pricing | `TierPricingGrid`, `PricingModal`, `PaywallModal`, `TierLockOverlay`, `BotMascotPanel`, `ChatInlineUpsell`, `LearningVideosTab`, `CoachingPage`, `AGBPage` |
| SEO | `frontend/public/index.html` JSON-LD Structured Data |
| Stripe Webhook | `supabase/functions/stripe-webhook/index.ts` Kommentar |
| Operative Docs | `SHIP_CHECKLIST`, `DEPLOY`, `GO_LIVE`, `VIMEO_WORKFLOW`, `CLAUDE_CODE_HANDOFF` |

Stripe-Live-Produkt unter Dashboard muss auch 4 797 € sein.

| Tier | Landing | Backend | Stripe Live |
|---|---|---|---|
| Sprint | 997 € | 997 € ✓ | **anlegen: prod_sprint_997** |
| Plus-Plus | 4 797 € | 4 797 € ✓ | ✓ **`prod_UZ2P48So6mEBkK` confirmed** (Price-Object auf 4 797 € EUR setzen) |
| Plus-Plus 3× Rate | 1 599 € × 3 | 99 € × 12 (alt) + 550 € × 2 (alt) | **Raten-Plan aktualisieren** |

### Stripe Dashboard — Manual Setup (15 Min am Dienstag morgen)

In https://dashboard.stripe.com (Live-Mode oben rechts umschalten):

1. **Products → New Product** anlegen für jeden Pricing-Tier:
   - "LeaderOS Sprint" → Price: 997 € one-time
   - "LeaderOS Plus-Plus" → Price: 4 797 € one-time
   - "LeaderOS Plus-Plus · 3× Rate" → Price: 1 599 € (recurring? oder 3
     one-time-Sessions per Pricing-Manager)
2. Product-IDs notieren (`prod_...`)
3. **Webhooks → Add endpoint**:
   - URL: `https://leaderos.de/api/webhook/stripe`
   - Events: `checkout.session.completed`, `invoice.paid`,
     `invoice.payment_failed`, `customer.subscription.deleted`
   - Webhook-Secret notieren (`whsec_...`)
4. **Developers → API Keys**: Live-Mode-Secret-Key kopieren (`sk_live_...`)

### Env-Vars setzen — IN EMERGENT (nicht in Vercel)

Stripe läuft auf der App-Seite, also im Emergent-Workspace:

```
STRIPE_API_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Emergent → Backend → Environment Variables → Save → Restart Service.

### Test-Käufe vor Launch (am Dienstag mittag)

- [ ] Live-Karte → 1 × Sprint kaufen → Webhook in Stripe-Dashboard
      sichtbar → User in Supabase `users` Tabelle hat `tier = 'standard'`
- [ ] Refund via Stripe-Dashboard → Webhook fires → User tier zurück
- [ ] Test-Käufe in eigene Excel/Notion-Liste eintragen für Buchhaltung

---

## 5. 100-User-Limit — soft launch

Damit es bei den ersten 100 User-Signups nicht crasht:

- [ ] **Resend-Limit prüfen**: 100/Tag im Free-Tier, sonst Plan upgraden
      (https://resend.com/settings/usage)
- [ ] **Supabase-Limit**: Free-Plan hat 50 000 monthly active users → safe
- [ ] **Stripe-Tax**: Falls aktiviert, B2B-Käufe brauchen Tax-ID-Felder
      im Checkout-Flow → vorher testen
- [ ] **WladBot-Cost-Watch**: Claude-Haiku-API-Limit prüfen
      (`ANTHROPIC_API_KEY`). Bei 100 Usern × 20 Messages × ~2K Tokens
      ≈ 4 M Tokens/Tag → Anthropic-Tier 1 sollte reichen (Tier 2 = $40K-Cap)
- [ ] **Soft-Cap auf Plus-Plus**: Wenn nur 100 User in Class 0001, dann
      Mentoring-Waitlist-Counter "AKTUELL · 4 OFFENE PLÄTZE" konsistent
      kommunizieren

---

## 6. Smoke-Tests am Dienstag morgen (45 Min vor Launch)

In dieser Reihenfolge im echten Browser, nicht curl:

```
□  https://leader-os.de/                  → Landing lädt, alle Bilder
□  https://leader-os.de/qr/leadercheck.png → QR scannbar, geht zu app
□  https://leader-check.de/               → Light-Nike Landing lädt
□  https://leadercheck.de/                → Quiz-App startet
   → Quiz durchlaufen → Score sichtbar
   → Email-Eingabe → Erfolg
   → Redirect zu leaderos.de/login

□  https://leaderos.de/login              → Login-Form sichtbar
   → Google-Login → Dashboard lädt
   → /chat → WladBot antwortet
   → /api/health → JSON ok

□  Stripe Test-Kauf (1 €)
   → Checkout-Session
   → Card-Eingabe (echte Live-Karte)
   → Webhook in Stripe-Dashboard
   → User tier upgraded
   → Welcome-Email kam an

□  Mobile-Test (iPhone Safari + Android Chrome)
   → leader-os.de scrollbar, keine horizontalen Overflows
   → Video oben spielt autoplay (muted)
   → "Diagnose starten" Button tappt sauber zu leadercheck.de
```

---

## 7. Wenn was crasht — Rollback in < 5 Min

| Symptom | Was tun |
|---|---|
| `leader-os.de` zeigt Weiß-Screen | Vercel → Deployments → letzten READY-Deploy → "Promote to Production" |
| `leaderos.de` Login bricht | Emergent → Logs prüfen, ggf. zu letztem Pod-State zurückrollen |
| Stripe-Checkout 500 | Webhook-Secret fehlt oder falsch → Env-Var nochmal setzen |
| WladBot 401 | Anthropic-API-Key verbraucht oder rate-limited → Top-Up |
| `leadercheck.de` 403 | Emergent-Custom-Domain noch nicht verifiziert → DNS-Check |

---

## 8. Die genaue Sequenz für Dienstag (in Reihenfolge)

**T-90 Min: Vercel fixen** (8 Min selbst-execute)

- [ ] `docs/VERCEL_RESCUE.md` STEP 1 lesen → frisches Projekt `shipos` anlegen
- [ ] STEP 2: Production-Branch = `mvpcode`, Framework = CRA, Node = 22
- [ ] STEP 3: Domains vom alten `leaderos`-Projekt entfernen, am neuen anhängen
- [ ] STEP 4: Smoke-Test der 3 URLs grün

**T-60 Min: PR #85 mergen**

- [ ] https://github.com/aiporator/SHIPOS/pull/85 → Squash + Bypass-merge
- [ ] Vercel auto-deploy beobachten (~90 Sek)
- [ ] `https://leader-os.de/qr/leadercheck.png` → QR scant?

**T-30 Min: Stripe Live-Cutover**

- [ ] Stripe Dashboard → Live-Mode oben rechts
- [ ] Product `prod_UZ2P48So6mEBkK` (Plus-Plus): Price-Object auf `4 797 EUR one-time`
- [ ] Sprint-Product NEU anlegen: `997 EUR one-time` → ID notieren
- [ ] Webhook hinzufügen: `https://leaderos.de/api/webhook/stripe` mit Events `checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted`
- [ ] Webhook-Secret + Live-Secret-Key kopieren
- [ ] **Emergent → Backend → ENV setzen** (NICHT Vercel):
  - `STRIPE_API_KEY=sk_live_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`
  - `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Emergent Backend-Service restart
- [ ] **1 Test-Kauf mit echter Karte** → Stripe-Webhook fires → User-Tier upgradet

**T-0: Launch**

- [ ] Smoke-Tests aus Section 6 durchgehen
- [ ] Launch-Email-Versand starten (Resend, max 100/Tag im Free-Tier)
- [ ] Mobile-Tests (iPhone Safari + Android Chrome)

**Post-Launch (kann auch Mittwoch sein)**

- [ ] Branch-Cleanup via `docs/DEV_TASKS_BRANCHES.md` (~45 Min für Dev)
- [ ] PR #41 (Draft emergent iter 92.18) reviewen + mergen für Backend-Hardening
- [ ] Altes `leaderos` Vercel-Projekt löschen (STEP 5 in VERCEL_RESCUE.md)

---

## 9. Was du NICHT mehr machen musst (schon erledigt)

✓ Pricing-Sync: alle 20 Files auf 4 797 € — commit `43aa53a`
✓ Asset-Pfade: `wlad-frameworks.jpg`, `wlad-phone.jpg`, `wlad-thumbnail.jpg` repariert
✓ Vercel-Härtung: `.nvmrc` Node 22 + `engines` + `vercel.json` framework — commit `e881c2b`
✓ PR-Aufräumung: 18 PRs → 2 PRs (#85 live + #41 draft)
✓ Domain-Topologie: konsistent in Code + Docs
✓ JSON-LD SEO: Google-Snippet-Preis auf 4 797 €
✓ AGB: Legal-Disclosure auf 4 797,00 €
✓ QR-Codes für leadercheck.de erzeugt
✓ Launch-Email-Template `launch_announcement_email`
✓ Rescue-Plan dokumentiert für den Vercel-Block

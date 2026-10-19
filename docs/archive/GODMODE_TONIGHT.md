# GODMODE — heute abend live

> Single source of truth für den Launch heute abend. Was nicht auf
> dieser Liste steht, machen wir morgen. Reihenfolge ist optimiert
> auf Dependency-Order — keinen Schritt überspringen, weil der
> nächste oft den vorherigen braucht.

## T-0 Status (Stand 2026-06-11 12:30 UTC)

| Ding | Wo es steht |
|---|---|
| Code (Nike-DNA, Lead-Capture, Mobile-Fixes) | ✅ auf `claude/sign-guy-dodge-band` |
| Vercel-Projekt `leader-os` | ✅ existiert |
| Vercel-Projekt `leader-check` | ❌ doch nicht nötig (Emergent Projekt B) |
| Domain `leader-os.de` → Vercel | ✅ DNS auf 76.76.21.21 |
| Domain `start.leader-os.de` → Emergent | ⏳ DNS+Custom-Domain ausstehend |
| Domain `leader-check.de` → Emergent (B) | ❓ Status unklar |
| Backend (Emergent, command-center-229.emergent.host) | ✅ läuft |
| Supabase Redirect-URLs Allowlist | ⏳ leader-os.de + start. + leader-check ergänzen |
| Stripe Live-Mode | ❓ Status unklar |
| Google Search Console verifiziert | ⏳ wartet auf Vercel-Deploy |

---

## SEQUENZ — von oben nach unten abarbeiten

### 🟢 STAGE 1 — Code auf Production (5 Min, JETZT)

```
□ 1.1   PR von claude/sign-guy-dodge-band → mvpcode öffnen
        https://github.com/aiporator/SHIPOS/compare/mvpcode...claude/sign-guy-dodge-band
□ 1.2   Squash and merge
□ 1.3   Branch nach Merge löschen (GitHub bietet's an)
□ 1.4   Warten bis Vercel-Deploy von mvpcode grün ist (~2 Min)
        https://vercel.com/aiporators-projects/leader-os
```

### 🟢 STAGE 2 — Domain leader-os.de live (10 Min)

```
□ 2.1   Vercel "leader-os" → Settings → Domains
        Add: leader-os.de
        Add: www.leader-os.de
□ 2.2   Grüner Haken pro Domain (DNS schon korrekt)
□ 2.3   Browser-Test: https://leader-os.de/ zeigt Nike-DNA-Landing
□ 2.4   Browser-Test: https://leader-os.de/login zeigt Login
□ 2.5   Browser-Test mobil: alles erreichbar, keine Overflows
```

### 🟢 STAGE 3 — Supabase Auth Allowlist (3 Min)

https://supabase.com/dashboard/project/srujvjjncrszhaaxepxf/auth/url-configuration

```
□ 3.1   Site URL: https://leader-os.de
□ 3.2   Redirect URLs (alle hinzufügen):
        https://leader-os.de/**
        https://www.leader-os.de/**
        https://start.leader-os.de/**
        https://leader-check.de/**
        https://www.leader-check.de/**
        http://localhost:3000/**
□ 3.3   Save
```

### 🟢 STAGE 4 — start.leader-os.de aktivieren (15 Min, Fallback-URL)

```
□ 4.1   Emergent Dashboard → Projekt A → Settings → Custom Domains
        Add: start.leader-os.de
        → Notier was Emergent als CNAME-Target zeigt
□ 4.2   GoDaddy DNS → leader-os.de:
        CNAME start → <was Emergent zeigt> (TTL 600)
□ 4.3   5 Min warten (DNS-Propagation)
□ 4.4   Emergent zeigt grün ("verified")
□ 4.5   2-3 Min warten (SSL-Cert via Let's Encrypt)
□ 4.6   Browser-Test: https://start.leader-os.de/login
        → muss Emergent-Login zeigen
```

### 🟢 STAGE 5 — leader-check.de Status klären (5 Min)

```
□ 5.1   Browser: https://leader-check.de/
        Was zeigt sich?
        a) Role-Assessment → ✅ alles gut, weiter zu STAGE 6
        b) Vercel-Landing → ❌ DNS-Reset nötig
        c) Fehler/404 → ❌ Custom-Domain in Emergent Projekt B fehlt
□ 5.2   Falls (b): Vercel-Projekt entclaimen + Emergent (B) Custom-Domain adden
□ 5.3   Falls (c): Emergent (B) Custom-Domain adden + GoDaddy CNAME prüfen
```

### 🟡 STAGE 6 — Stripe Live (15 Min, KANN morgen wenn unklar)

Nur wenn Stripe **Live-Mode** noch nicht aktiv ist:

```
□ 6.1   Stripe Dashboard oben rechts: Test → Live umschalten
□ 6.2   Products → 4 Live-Produkte erstellen (oder kopieren aus Test)
        Preise:  997 €    /  Coaching Bundle  /  2 497 €  /  4 797 €
□ 6.3   Webhooks → Add endpoint:
        URL: https://leader-os.de/api/webhook/stripe
        Events: checkout.session.completed, invoice.paid, invoice.payment_failed
□ 6.4   Webhook-Secret (whsec_...) kopieren
□ 6.5   Live-API-Keys (sk_live_..., pk_live_...) kopieren
□ 6.6   Emergent Env-Config → setzen:
        STRIPE_API_KEY=sk_live_...
        STRIPE_PUBLISHABLE_KEY=pk_live_...
        STRIPE_WEBHOOK_SECRET=whsec_...
□ 6.7   Emergent Backend restart
□ 6.8   Test: 1 € Käufe (echte Karte, refund danach)
```

### 🟡 STAGE 7 — Google Search Console (5 Min, KANN morgen)

```
□ 7.1   https://search.google.com/search-console
□ 7.2   Property → URL-Prefix → https://leader-os.de
□ 7.3   Verification: HTML-Datei (sollte sofort grün — Datei deployed)
□ 7.4   Sitemap einreichen: https://leader-os.de/sitemap.xml
□ 7.5   Wiederholen für start.leader-os.de und leader-check.de
```

### 🟢 STAGE 8 — Final Smoke-Test (10 Min)

Im **echten Browser**, nicht curl. Reihenfolge:

```
□ 8.1   https://leader-os.de/
        ✓ Nike-DNA Landing
        ✓ Video oben, Quiz darunter
        ✓ WladSignGuy unten rechts ohne Overlap
        ✓ Footer mit Impressum/Datenschutz/AGB

□ 8.2   https://leader-os.de/login
        ✓ Login-UI mit Google/Apple/Microsoft Buttons
        ✓ Klick Google → Redirect → /dashboard
        ✓ Dashboard lädt mit User-Daten

□ 8.3   https://leader-os.de/quiz
        ✓ 5 Fragen klickbar
        ✓ Submit → Result-Screen mit Score

□ 8.4   https://leader-os.de/api/health
        ✓ JSON {status:"ok"}

□ 8.5   https://start.leader-os.de/login
        ✓ Emergent-Login lädt
        ✓ Login funktioniert (gleicher User wie leader-os.de Login)

□ 8.6   https://leader-check.de/
        ✓ Role-Assessment lädt

□ 8.7   Mobile (iPhone Safari + Android Chrome)
        ✓ leader-os.de hat keine horizontale Scroll-Bar
        ✓ Hero-Headline lesbar
        ✓ Video läuft (Autoplay muted)
        ✓ WladSignGuy berührt nicht ConversionBand

□ 8.8   Lead-Capture
        ✓ Email in LeadCaptureModal eingeben
        ✓ Submit → Redirect zu /thank-you
        ✓ PostHog Dashboard zeigt "lead_captured" Event mit Email
```

---

## Wenn alles 🟢 — bist du live

Was du dann machst:
1. Tweet/LinkedIn-Post: "LeaderOS ist live"
2. Newsletter-Mail an deine Liste
3. Erste 10 User einladen (Direct-DMs)
4. Schlafen
5. Morgen früh Sentry + PostHog checken — Errors? Conversions?

---

## Rollback wenn was crasht

**Symptom: leader-os.de zeigt White-Screen**
- Vercel Dashboard → leader-os → Deployments → letzter-grüner Deploy → Promote to Production. 30 Sek.

**Symptom: Login bricht**
- start.leader-os.de funktioniert noch → User dahin schicken
- Supabase Auth-URL-Config nochmal prüfen

**Symptom: Stripe-Checkout 500**
- ENV-Vars in Emergent richtig? Restart helpe meistens
- Im Notfall: Stripe Live → Test zurück, Cutover morgen

**Symptom: Alles kaputt**
- DNS-Flip: leader-os.de wieder zu Emergent
  (Aber CSP+Cookies leben dann wieder auf leader-os.de Vercel-Domain — kompliziert)
- Besser: Notiz an User-Liste "Wartungsarbeiten, in 30 Min wieder online"

---

## Was wir HEUTE NICHT machen

- Backend von Emergent zu Fly.io migrieren (das ist `docs/EMERGENT_SWITCH.md` 14-Tage-Plan)
- MongoDB → Supabase Postgres
- Email-Drip-Templates komplett upgraden
- Branch-Cleanup von 49 alten Branches
- Performance-Audit (Lighthouse-Score)
- A/B-Testing-Framework

Diese Liste ist die "wir gehen heute live"-Liste. Den Rest machen
wir nach dem Launch, mit echten User-Daten als Input.

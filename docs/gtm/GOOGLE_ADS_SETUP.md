# Google Ads Setup · LeaderOS

> Kompletter Einrichtungs-Runbook für den ersten Google-Ads-Launch.
> Landing: **`leader-os.de/wladbot`** (Ad-Landing, statisch, kein React)
> · Conversion: **Pageview `/wladbot/danke`** (nur nach erfolgreichem
> E-Mail-Submit erreichbar).
>
> Ergänzt `RUNBOOK_ADS_CHANNELS.md` §4 (Keyword-Liste, Budget-Hygiene)
> und `ADS_90D.md` (Creatives). Hier steht das **technische** Setup:
> Konto, Tag, Consent, Conversion-Actions, UTM-Konventionen.

**Stand:** August 2026 · Webinar-Termin überall im Repo:
**Do 29.10.2026, 10:00 CEST** (`2026-10-29T09:00:00Z`).

---

## 0. Was im Code bereits fertig ist

| Baustein | Wo | Status |
| --- | --- | --- |
| Ad-Landing `/wladbot` | `frontend/public/wladbot/index.html` | ✅ live (statisch, LCP-schnell, keine React-Bundle-Kosten) |
| Danke-/Conversion-Page `/wladbot/danke` | `frontend/public/wladbot/danke/index.html` | ✅ live, `noindex` |
| UTM-Passthrough | `/wladbot`-Form liest `utm_campaign` aus der URL und schickt es als `campaign` an `POST /api/leader-check/intent` (Fallback `wladbot-hero`, max 64 Zeichen) | ✅ |
| Lead-Persistenz | Mongo `nurture_leads` (Feld `campaign`) → sofortige Welcome-Mail → 7-Mail-Journey (`/api/cron/lead-nurture`, Tag 0/2/4/6/8/10/12) | ✅ |
| Ehrliche Scarcity | Countdown auf den echten Webinar-Termin, blendet sich nach Ablauf aus | ✅ |
| Google-Tag + Consent Mode v2 | `frontend/public/js/consent-gtag.js`, eingebunden in `/wladbot`, `/wladbot/danke`, `/app`, `/os` | ✅ gebaut, **inaktiv** bis die echte AW-ID gesetzt ist |
| CSP für den Tag | `vercel.json` (`googletagmanager.com`, `*.doubleclick.net`, `*.google-analytics.com`, `td.doubleclick.net`) | ✅ |

**Der einzige verbleibende Code-Schritt ist eine Zeile:** in
`frontend/public/js/consent-gtag.js` `AW_ID` von `'AW-XXXXXXXXXX'` auf
die echte ID ändern. Solange der Platzhalter steht, lädt kein externes
Skript und es erscheint kein Cookie-Banner — die Seiten bleiben exakt so
schnell und cookie-frei wie heute. Bis dahin ist die Conversion
serverseitig über `nurture_leads.campaign` + PostHog messbar.

---

## 1. Konto anlegen (User-Aktion, ~20 Min)

1. [ads.google.com](https://ads.google.com) → Konto mit der
   Firmen-Google-Identität anlegen (nicht privat!).
   - Währung **EUR**, Zeitzone **Berlin** — beides ist später
     unveränderbar.
   - **Expertenmodus** wählen ("Kampagne ohne Zielvorhaben erstellen"),
     sonst zwingt der Wizard sofort eine Smart-Campaign auf.
2. Rechnungsprofil (Firmendaten, USt-ID) hinterlegen.
3. Die **AW-Conversion-ID** notieren: Tools → Datenmanager → Google-Tag.
   Format `AW-XXXXXXXXXX`. Die brauchen wir für §3.
4. Google Ads ↔ Google Search Console verknüpfen (Tools → Verknüpfte
   Konten) — GSC ist für beide Domains bereits verifiziert.

## 2. Conversion-Actions definieren

Im Konto unter Ziele → Conversions → Neue Conversion-Aktion → Website:

| Name | Typ | Trigger | Wert | Zählung |
| --- | --- | --- | --- | --- |
| `wladbot_lead` | Lead | Pageview `leader-os.de/wladbot/danke` | 5 € (Platzhalter, später aus echter Lead→Kauf-Rate ableiten) | Eine pro Klick |
| `webinar_signup` | Lead | Pageview `leader-os.de/webinar/danke` | 8 € | Eine pro Klick |
| `signup_started` | Sekundär (Beobachtung) | Pageview `leader-os.de/signup` | — | Eine |

Warum Pageview statt Klick-Event: `/wladbot/danke` ist **nur** nach
erfolgreichem `POST /api/leader-check/intent` erreichbar (JS-Redirect
nach `r.ok`). Ein Pageview dort == ein echter Lead in `nurture_leads`.
Kein zusätzliches Event-Wiring nötig, kein Doppelzähl-Risiko.

`wladbot_lead` als **primäre** Conversion markieren (steuert das
Bidding), die anderen als sekundär.

## 3. Google-Tag scharfschalten (eine Zeile)

> **Seit 01.10.2026:** Für die React-Routen (`/webinar`, `/webinar/danke`,
> `/kommunikation`, `/ki-fuehrungskraft`, `/`) läuft der Tag über die
> Vercel-Variable `REACT_APP_GOOGLE_ADS_ID` (+ optional
> `REACT_APP_GOOGLE_ADS_WEBINAR_LABEL`), siehe
> `docs/ops/ADS_TRACKING_GO_LIVE.md`. Der Abschnitt hier gilt nur noch für
> die statischen Seiten `/wladbot`, `/app`, `/os`.

Der komplette Tag- und Consent-Code liegt fertig in
`frontend/public/js/consent-gtag.js` und ist auf `/wladbot`,
`/wladbot/danke`, `/app` und `/os` eingebunden. Zum Aktivieren:

```js
var AW_ID = 'AW-XXXXXXXXXX';   // ← echte Conversion-ID aus §1.3
```

Der Guard `/^AW-\d{9,12}$/` sorgt dafür, dass der Platzhalter nichts
lädt. Mit echter ID passiert automatisch:

1. `gtag('consent','default', …)` mit **allen vier Signalen auf
   `denied`** und `wait_for_update: 500` — noch bevor `gtag.js` geladen
   wird.
2. `gtag.js` wird nachgeladen, `gtag('config', AW_ID)` gesetzt.
3. Das Consent-Banner erscheint (nur wenn noch keine Entscheidung
   gespeichert ist).
4. Bei "Akzeptieren" → `gtag('consent','update', …)` auf `granted`.

Eine frühere Zustimmung wird aus `localStorage` **vor** dem Tag-Load
wiederhergestellt, damit ein wiederkehrender Nutzer nicht fälschlich als
cookieless gezählt wird. Die Entscheidung gilt 6 Monate, danach wird
erneut gefragt (Speicherformat `granted|<timestamp>`; `localStorage`-
Zugriffe sind in try/catch, Private Mode fällt sauber auf "erneut
fragen" zurück).

Die CSP in `vercel.json` ist bereits erweitert
(`script-src`/`img-src`/`connect-src`/`frame-src` um
`googletagmanager.com`, `*.google-analytics.com`, `*.doubleclick.net`,
`td.doubleclick.net`, `*.google.com`/`.de`) — kein weiterer Eingriff
nötig.

## 4. Consent Mode v2 · DSGVO

Umgesetzt ist **Advanced Consent Mode**: das Tag lädt immer, Default ist
`denied`, bis zur Zustimmung laufen nur cookieless Pings und Google
modelliert die fehlenden Conversions. Die Alternative "Basic" (Tag erst
nach Opt-in) verliert diese Modellierung.

Das Banner ist bewusst selbst gebaut (ein `<div>`, zwei Buttons, kein
Fremd-JS) statt eine CMP wie Cookiebot/Usercentrics einzubinden — passt
zur Zero-Dependency-Philosophie der statischen Seiten, kostet nichts und
braucht keine weiteren CSP-Einträge. Eine CMP lohnt erst, wenn mehrere
Vendor-Tags dazukommen.

**Pflicht im selben PR wie das Scharfschalten:** `/datenschutz` um einen
Google-Ads-Abschnitt ergänzen. Fertiger Textbaustein:

> **Google Ads Conversion-Tracking.** Auf unseren Kampagnen-Seiten
> setzen wir das Google-Tag der Google Ireland Limited ein, um zu
> messen, welche Anzeige zu einer Anmeldung geführt hat. Ohne deine
> Einwilligung werden dabei keine Cookies gesetzt und keine
> personenbezogenen Kennungen übertragen (Google Consent Mode v2,
> Standard: Ablehnung). Erst wenn du im Cookie-Hinweis zustimmst,
> speichert Google eine Kennung in deinem Browser, um deinen Klick auf
> die Anzeige mit der Anmeldung zu verknüpfen. Rechtsgrundlage ist deine
> Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG; du
> kannst sie jederzeit widerrufen, indem du die Website-Daten in deinem
> Browser löschst. Empfänger ist Google Ireland Limited, Gordon House,
> Barrow Street, Dublin 4, Irland; eine Übermittlung in die USA ist nicht
> ausgeschlossen (Angemessenheitsbeschluss EU-US Data Privacy Framework).

Solange keine Remarketing-Listen aktiviert sind, bleibt es bei reiner
Conversion-Messung — das ist die datensparsamste Variante und deckt das
Bidding vollständig ab.

## 5. Kampagnen-Struktur · Launch (30 €/Tag gesamt)

Budget-Rahmen aus `RUNBOOK_ADS_CHANNELS.md` (30 €/Tag Google Search,
Long-Tail zuerst). Struktur:

```
Konto
└── Kampagne S-01 · Search · WladBot (20 €/Tag)
    ├── AdGroup "ki-coach"      → kw: ki coach führung, ai coaching deutsch,
    │                              ki führungskräfte training
    ├── AdGroup "rhetorik"      → kw: rhetorik coach online, argumentation
    │                              training, überzeugend argumentieren lernen
    └── AdGroup "wlad-brand"    → kw: wlad jachtchenko, wladislaw jachtchenko
                                   (Brand-Schutz, billig, hohe CVR)
└── Kampagne S-02 · Search · Webinar (10 €/Tag)
    └── AdGroup "webinar"       → kw: führung webinar kostenlos, leadership
                                   training online — Landing /webinar
```

- Gebotsstrategie: Start **Max. Klicks** mit CPC-Limit 2,50 €; nach
  ≥ 30 Conversions auf **Conversions maximieren** umstellen.
- Ausrichtung: Deutschland + Österreich + Schweiz (deutschsprachig),
  Sprache Deutsch.
- Keyword-Match: Phrase + Exact, **kein** Broad zum Start.
- Auszuschließende Keywords ab Tag 1: `kostenlos ohne anmeldung`, `job`,
  `gehalt`, `ausbildung`, `studium`, `buch pdf download`.
- **Performance Max erst NACH ≥ 50 Search-Conversions** — PMax ohne
  Conversion-Historie verbrennt Budget auf Display-Müll.

### Anzeigentexte (RSA, kanon-ehrlich)

Alle Claims aus `WLAD_CANON.md` — keine erfundenen Zahlen:

```
Headlines (je ≤ 30 Zeichen):
  Dein KI-Coach. 24/7.
  3× SPIEGEL-Bestseller
  Wlads Methodik als KI
  Antwort in Sekunden
  Führung ist trainierbar
  Kostenlos starten
Descriptions (je ≤ 90 Zeichen):
  WladBot kennt die Methodik von Wlad Jachtchenko. Frag ihn, was dich
  gerade blockiert.
  400.000+ Klienten seit 2007. Jetzt als KI-Coach in deiner Tasche.
  Kostenlos testen.
Final-URL: https://leader-os.de/wladbot?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}
```

## 6. UTM-Konventionen

Ein Schema für alle Kanäle — `campaign` landet 1:1 in
`nurture_leads.campaign` und in PostHog:

| Parameter | Wert (Beispiele) | Regel |
| --- | --- | --- |
| `utm_source` | `google` · `meta` · `linkedin` · `newsletter` | Plattform, klein |
| `utm_medium` | `cpc` · `paid-social` · `email` | Kanaltyp |
| `utm_campaign` | `g-search-wladbot` · `g-search-webinar` · `webinar-2026-10-29` | kebab-case, ≤ 64 Zeichen, Prefix `g-` für Google |

Beispiel Final-URL Kampagne S-01:
`https://leader-os.de/wladbot?utm_source=google&utm_medium=cpc&utm_campaign=g-search-wladbot`

Auswertung: Mongo `nurture_leads` gruppiert nach `campaign` (Leads) ×
PostHog-Funnel `/wladbot → /wladbot/danke → signup` (Conversion-Rate) ×
Google-Ads-Kostenexport = **CPL pro Kampagne**.

## 7. Launch-Checkliste

Code-seitig ist alles gebaut — offen sind nur Konto-Schritte und der
Ein-Zeilen-Flip.

- [ ] §1 Konto + Rechnungsprofil, AW-ID notieren (User)
- [ ] §2 Conversion-Actions angelegt, `wladbot_lead` primär (User)
- [ ] §3 `AW_ID` in `frontend/public/js/consent-gtag.js` eintragen (Code, 1 Zeile)
- [ ] §4 `/datenschutz` um den Google-Ads-Absatz ergänzen — **im selben PR**
- [x] Consent-Banner gebaut (`consent-gtag.js`)
- [x] CSP für googletagmanager / doubleclick erweitert (`vercel.json`)
- [x] UTM-Passthrough im `/wladbot`-Formular
- [ ] §5 Kampagnen S-01/S-02 mit RSAs + negativen Keywords (User)
- [ ] Test: Ad-Preview-Klick → Formular mit Testmail → `/wladbot/danke`
      lädt → Conversion erscheint in Google Ads (bis 3 h Verzögerung)
      → Lead in `nurture_leads` mit `campaign='g-search-wladbot'`
- [ ] Wöchentlicher Reporting-Loop aus `RUNBOOK_ADS_CHANNELS.md` läuft

---

*Pflege: Bei Webinar-Terminwechsel den Termin oben UND
`utm_campaign=webinar-…`-Werte in `backend/routes/webinar.py`
(`WEBINAR_CAMPAIGN`) mitziehen.*

---

## 6. Creatives · wo sie liegen

Alle Google-Assets kommen aus dem Ad-Studio unter `/ads`, nicht aus
Google-Ads-Vorlagen:

| Asset | Wo | Limit |
| --- | --- | --- |
| RSA-Headlines, Beschreibungen, Keywords, Ausschlüsse | `/ads` → Tab **Google Text-Assets** (Daten: `frontend/src/data/googleAdsAssets.js`) | 30 / 90 Zeichen, im Studio geprüft |
| Demand Gen / Display / PMax Text | ebenda, Kampagne `DEMAND-GEN-WEBINAR` | Headlines 30, Long Headline 90, Beschreibungen 90 |
| Sitelinks, Callouts, Snippets | ebenda, „Erweiterungen" | 25 / 35 / 25 |
| Bild-Assets | `/ads` → Bild-Creatives → Plattform **google** (Variante `g`, wenig Text im Bild) | 1.91x1 = 1200×628, 1x1 = 1080 (Google-Minimum 300, Empfehlung 1200: Screenshot bei Zoom 111 %) |
| Logo | `/icon-512.png` | quadratisch |

Fünf Kampagnen sind vorbereitet: `SEARCH-WEBINAR`, `SEARCH-BRAND`
(5 €/Tag, eigene Kampagne), `SEARCH-FEEDBACK` (Landing ist der
Journal-Artikel, nicht die Webinar-Seite), `DEMAND-GEN-WEBINAR` und
`SEARCH-FRAMEWORKS` (Evergreen ab W2). Phrase-Match, keine Broad-Match-
Keywords vor 30 Conversions. Jede finale URL trägt `utm_source=google`,
damit `webinar_leads.utm` den Kanal trennt.


# Ads-Tracking · Go-Live-Checkliste

> Stand 01.10.2026. Alles im Code ist gebaut und inert. Scharf wird es
> allein über **Vercel-Umgebungsvariablen** (Projekt `leaderos` →
> Settings → Environment Variables → Production) plus einem Redeploy.
> Kein Code-Change, kein PR nötig.

## 1. Die sechs Variablen

| Variable | Woher | Format | Ohne sie |
| --- | --- | --- | --- |
| `REACT_APP_META_PIXEL_ID` | Meta Events Manager → Datenquellen → Pixel | 15–16 Ziffern | Meta-Pixel bleibt aus |
| `REACT_APP_LINKEDIN_PARTNER_ID` | Campaign Manager → Analysieren → Insight Tag | 6–10 Ziffern | Insight Tag bleibt aus |
| `REACT_APP_LINKEDIN_LEAD_CONVERSION_ID` | Campaign Manager → Analysieren → Conversions → „Webinar-Lead“ (Typ Lead, ereignisspezifisch) | 6–10 Ziffern | Tag lädt, aber keine Lead-Conversion |
| `REACT_APP_GOOGLE_ADS_ID` | Google Ads → Tools → Datenmanager → Google-Tag | `AW-XXXXXXXXXX` | Google-Tag bleibt aus |
| `REACT_APP_GOOGLE_ADS_WEBINAR_LABEL` | Conversion `webinar_signup` → Tag einrichten → Label | Zeichenkette | optional, s. u. |
| `REACT_APP_BING_UET_ID` | Microsoft Advertising → Tools → UET-Tag → Tag-ID | Ziffern | UET bleibt aus |

Backend (Emergent-Env, nicht Vercel), schon vorhanden:
`META_PIXEL_ID` + `META_CAPI_TOKEN` für die Conversions API
(`routes/webinar.py`, Deduplizierung über `meta_event_id`).

## 2. Was dann automatisch passiert

| Plattform | Lädt wann | Pageviews | Conversion „Webinar-Lead“ |
| --- | --- | --- | --- |
| Meta | nur mit Marketing-Consent | ja | `Lead` im Formular (`WebinarPage.js`) + serverseitig über CAPI, gleiche `event_id` |
| LinkedIn | nur mit Marketing-Consent | ja | `lintrk('track')` im Formular |
| Google Ads | immer, Consent Mode v2 (Default `denied`, bei Zustimmung `granted`) | jeder Routenwechsel (`App.js`) | **Pageview `/webinar/danke`** (im Konto als Conversion anlegen) und, falls Label gesetzt, zusätzlich ein `conversion`-Event auf der Danke-Seite — im Konto dann **nur eine** der beiden Conversions als primär markieren, sonst doppelt |
| Microsoft | nur mit Marketing-Consent | jeder Routenwechsel | Custom-Event `webinar_lead` (Kategorie `webinar`, Aktion `lead`) auf `/webinar/danke`; im Konto ein Conversion-Ziel „Custom-Event“ oder „Ziel-URL enthält /webinar/danke“ anlegen |

Consent-Kategorie „Marketing“ im Cookie-Banner (`CookieConsent.js`) deckt
alle vier ab. Datenschutz §5.3 nennt alle vier Anbieter.

Statische Kampagnenseiten (`/wladbot`, `/app`, `/os`) haben einen
eigenen Tag in `frontend/public/js/consent-gtag.js` — dort steht die
AW-ID als Konstante (eine Zeile, `docs/gtm/GOOGLE_ADS_SETUP.md` §3).

## 3. Reihenfolge zum Start

1. Konten: Google Ads, Microsoft Advertising, LinkedIn Campaign Manager,
   Meta Business → IDs notieren.
2. Conversions in den Konten anlegen (Tabelle oben).
3. Variablen in Vercel setzen → **Redeploy** (Deployments → ⋯ → Redeploy).
4. Test auf `https://leader-os.de/webinar`:
   - Cookie-Banner → „Alle akzeptieren“.
   - DevTools → Network: `fbevents.js`, `insight.min.js`, `gtag/js`,
     `bat.js` laden.
   - Testanmeldung mit eigener Mail → `/webinar/danke`.
   - Google Ads: Conversion erscheint innerhalb von ~3 h. Meta: Events
     Manager → Testevents. LinkedIn: Conversion-Übersicht. Microsoft:
     UET-Tag-Helper (Browser-Erweiterung) zeigt `webinar_lead`.
   - Backend: Lead in `webinar_leads` mit `utm.source` = Plattform.
5. Erst dann Kampagnen aktivieren.

## 4. UTM-Pflicht an jeder Anzeige

`?utm_source=<google|meta|linkedin|bing>&utm_medium=cpc&utm_campaign=webinar-2026-09&utm_content=<Ad-ID>`
— landet in `webinar_leads.utm` und ist die Grundlage für CPL pro Anzeige
(`docs/gtm/GOOGLE_ADS_SETUP.md` §6).

## 5. Status prüfen

In der Browser-Konsole der Live-Seite:
`window.dataLayer` (Google), `window.fbq` (Meta), `window.lintrk`
(LinkedIn), `window.uetq` (Microsoft). Fehlt eines trotz gesetzter
Variable: Redeploy vergessen, oder Consent nicht erteilt.

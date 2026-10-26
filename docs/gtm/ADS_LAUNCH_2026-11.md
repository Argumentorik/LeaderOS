# Ads-Launch · Live-Webinar Do 26.11.2026 · Go/No-Go

Stand 26.10.2026. Diese Seite ist die eine Checkliste für den Start der
bezahlten Kampagnen auf `/webinar`. Die Detailpläne je Plattform bleiben:
`META_ADS_WEBINAR.md`, `LINKEDIN_ADS_WEBINAR.md`, `GOOGLE_ADS_SETUP.md`,
`ADS_BING_LINKEDIN_WEBINAR.md`, `KI_FUEHRUNG_KAMPAGNEN.md` (Termin dort
überall auf den 26.11. umgestellt; die dortigen Zeitpläne vom September sind
überholt, es gilt der Zeitplan hier).

## 1. Termin und Zeitplan

| Was | Wann |
| --- | --- |
| Live-Webinar | **Do 26.11.2026, 10:00–11:30 Uhr** (CET, `2026-11-26T09:00:00Z`) |
| Ads-Laufzeit | 28.10. bis 26.11. (vier Wochen) |
| Woche 1 (28.10.–03.11.) | Test: drei Creatives × zwei Zielgruppen je Plattform, kleine Budgets, Conversions prüfen |
| Woche 2–3 (04.11.–19.11.) | Skalieren, was unter Ziel-CPL liegt; Verlierer abschalten |
| Woche 4 (20.11.–26.11.) | Erinnerung und Dringlichkeit („noch drei Tage", „heute 10 Uhr"), Retargeting auf Seitenbesucher ohne Anmeldung |
| Nachlauf (27.11.–03.12.) | Keine Webinar-Ads mehr; Follow-up-Mail (Backend) und Beta-CTA in den organischen Posts |

Quelle für den Termin ist `frontend/src/data/webinarEvent.js` (Seite,
Danke-Seite, Prerender, /ki-fuehrungskraft) plus `backend/routes/webinar.py`
(`WEBINAR_DATE_ISO`, Reminder-Mails). Daneben steht das Datum als Text in
Copy-Dateien (`googleAdsAssets.js`, `contentAds.js`, `landingFaq.js`,
`wladProfile.js`, `kiFuehrungskraft.js`, `LandingFooter.js`,
`ThreeStepPath.js`, `WebinarTicketAd.js`, `services_email.py`) und in den
GTM-Dokumenten. Bei einer weiteren Verschiebung: beide Quellen ändern, dann
`grep -rn "26.11\|26. November\|2026-11-26"` über `frontend/src`, `backend`
und `docs/gtm` abarbeiten, Poster LI-06 und `og-webinar.jpg` neu rendern.

## 2. Funnel-Status (was live ist, was fehlt)

| Baustein | Status | Hinweis |
| --- | --- | --- |
| `/webinar` Landing | ✅ live | Editorial-Rebuild, Formular im ersten Viewport (mobil), Countdown aus `WEBINAR_TS`, FAQ + Event-Schema |
| Lead-Capture primär | ❌ live 404 | `POST /api/webinar/register` existiert im Code, das Emergent-Backend ist seit dem Repo-Umzug nicht neu deployt |
| Lead-Capture Fallback | ✅ live | Supabase `newsletter-subscribe` mit `source=webinar-lp`, `campaign=webinar-2026-11-26`; Danke-Seite mit `?v=f` |
| Bestätigungs-Mail | ⚠️ | Primärweg: sofortige Webinar-Bestätigung + 24h/1h-Reminder (Backend). Fallback: nur die Newsletter-Double-Opt-in-Mail, **keine** Webinar-Bestätigung |
| `/webinar/danke` | ✅ | `noindex, nofollow`, Kalender-Link, Videoserie, Trial-CTA, Share-Links mit UTM; Google-Ads- und Bing-Conversion feuern hier genau einmal |
| OG-Bild | ✅ | `og-webinar.jpg` (Termin im Bild), `og-wlad.jpg` ohne „13 Bücher · 3× TEDx" |
| Sitemap / Robots | ✅ | `/webinar` lastmod 2026-10-26; `/preview/` bleibt disallow |
| Vercel Auto-Deploy | ❌ | Seit dem Umzug nach `Argumentorik/LeaderOS` deployt Vercel nicht mehr automatisch; Produktion wurde zuletzt von Hand angestoßen. Git-Integration im Vercel-Projekt neu verbinden (Stefan) |

**Harte Bedingung vor dem ersten Euro:** Emergent-Backend aus `mvpcode`
deployen. Ohne Backend bekommt jeder Ads-Lead statt der Webinar-Bestätigung
eine Newsletter-Bestätigung, und die Reminder-Mails am 25.11./26.11. fallen
aus. Prüfung: `curl -s https://leader-os.de/api/webinar/stats` liefert JSON
statt 404.

## 3. Tracking und Conversions

Alle Pixel sind Consent-gated (`CookieConsent`): sie laden erst nach Zustimmung.
Rechne mit 40–60 % gemessener Leads gegenüber den echten Anmeldungen; die
Wahrheit steht in `db.webinar_leads` (Backend) bzw. in Supabase
(`newsletter_subscribers`, `source=webinar-lp`).

| Plattform | Event | Wo | Env (Vercel, Production) |
| --- | --- | --- | --- |
| Meta | `ViewContent` beim Seitenaufruf, `Lead` mit `eventID` nach erfolgreicher Anmeldung | `WebinarPage.js` | `REACT_APP_META_PIXEL_ID` |
| LinkedIn | Insight Tag + Lead-Conversion nach Anmeldung | `WebinarPage.js` | `REACT_APP_LINKEDIN_PARTNER_ID`, `REACT_APP_LINKEDIN_LEAD_CONVERSION_ID` |
| Google Ads | Conversion (Wert 8 €) einmal pro Anmeldung | `WebinarThankYouPage.js` | `REACT_APP_GOOGLE_ADS_ID`, `REACT_APP_GOOGLE_ADS_WEBINAR_LABEL` |
| Microsoft/Bing | UET Pageview + Lead | `WebinarThankYouPage.js` | `REACT_APP_BING_UET_ID` |
| PostHog | `webinar_view`, `webinar_register_submit`, `webinar_register_result` (`via: api|fallback`), `webinar_cta_click` | beide Seiten | bereits aktiv |

Die Env-Werte konnten aus dieser Session nicht gelesen werden (keine
Leserechte auf Vercel-Env). **Vor dem Start in Vercel prüfen, fehlende Werte
setzen, dann neu deployen**, sonst feuert nichts. Test: Meta Events Manager
(Test-Events), LinkedIn Campaign Manager (Conversion-Status „aktiv"), Google
Ads (Tag-Diagnose), je ein Test-Lead mit eigener E-Mail.

Meta Conversions API (server-seitig, gleiche `event_id`) ist im Backend
vorbereitet und wird mit dem Backend-Deploy aktiv.

## 4. UTM-Konvention

```
https://leader-os.de/webinar?utm_source=<meta|linkedin|google|bing>&utm_medium=<paid-social|cpc>&utm_campaign=webinar-2026-11-26&utm_content=<creative-id>
```

Organisch: `utm_source=linkedin&utm_medium=organic&utm_campaign=webinar-2026-11-26`
(so im ersten Kommentar von Poster LI-06). KI-Kampagnen auf
`/ki-fuehrungskraft?k=<key>` wie in `KI_FUEHRUNG_KAMPAGNEN.md`. Die Seite
speichert die UTMs (`lo_webinar_utm`) und schickt sie mit der Anmeldung mit.

## 5. Creatives und Copy

- Termin in allen Copy-Dateien auf 26.11. umgestellt (`social-creatives-30/copy*.json`,
  die Ads-Dokumente). **Gerenderte Bilder, die den 29.10. im Bild tragen,
  müssen neu gerendert werden**, bevor sie in eine Anzeige gehen (Quelle
  `social-creatives-30/slides.html`, Render per Playwright wie dort beschrieben).
- Webinar-Ankündigung als Poster: `docs/gtm/linkedin-wlad-01/LI-06.jpg`
  (4:5, auch als 1:1-Zuschnitt für Meta nutzbar), Caption in `CAPTIONS.md`.
- OG/Link-Vorschau: `https://leader-os.de/og-webinar.jpg` (1200×630).
- Regeln unverändert: Zahlen nur aus `WLAD_CANON.md`, keine „13 Bücher",
  kein TEDx, keine erfundene Knappheit (Kapazität 500 im Backend ist echt),
  kein KI-Gesicht einer echten Person. Beta-Plätze (50) nur in den
  organischen Posts, nicht in den Webinar-Ads.

## 6. Organisch parallel (Zernio)

`docs/gtm/linkedin-carousels-01/SCHEDULE.json` enthält den Plan 02.11.–03.12.
(acht Karussells, sechs Poster, Webinar-Ankündigung am 11.11., Erinnerung
23.11., „heute 10 Uhr" am 26.11.). Vorschau und Versand:

```
cd backend
python3 scripts_post_carousel.py accounts          # accountIds der verbundenen Konten
python3 scripts_post_carousel.py plan              # Vorschau, nichts wird gesendet
python3 scripts_post_carousel.py plan --account-linkedin <id> --account-instagram <id> --send
```

Voraussetzungen: Wlads LinkedIn- und Instagram-Konto in Zernio verbunden,
`ZERNIO_API_KEY` in der Umgebung, Freigabe der Texte durch Wlad.

## 7. Pre-Flight (abhaken vor dem Start)

- [ ] Backend aus `mvpcode` auf Emergent deployt; `/api/webinar/stats` antwortet
- [ ] Vercel: Produktion auf dem aktuellen `mvpcode`, Git-Integration wieder aktiv
- [ ] Vercel-Env: alle sechs `REACT_APP_*`-Werte aus §3 gesetzt, Redeploy danach
- [ ] Test-Anmeldung mobil (echtes Gerät): Formular → Danke-Seite → Bestätigungs-Mail innerhalb einer Minute
- [ ] Meta Events Manager zeigt `Lead` mit `event_id`; LinkedIn-Conversion „aktiv"; Google-Ads-Conversion „Aufzeichnung"
- [ ] Link-Vorschau in LinkedIn Post Inspector und Meta Sharing Debugger zeigt `og-webinar.jpg` mit 26.11.
- [ ] Creatives ohne 29.10. im Bild; Copy mit 26.11.
- [ ] Zielgruppen und Budgets je Plattform angelegt (Detailpläne), Kampagnen auf „pausiert" bis zum Go
- [ ] Wlad hat Landing-Text und Anzeigen-Copy freigegeben
- [ ] Zernio: Konten verbunden, `plan` ohne Fehler, erster Post 02.11. eingeplant

## 8. Nach dem Start (täglich, 10 Minuten)

1. Leads zählen: Backend `/api/webinar/leads` (Admin) oder Supabase, nicht die Pixel.
2. CPL je Plattform gegen Ziel prüfen; unter Ziel: Budget +20 %, über Ziel zwei Tage in Folge: Creative tauschen oder pausieren.
3. Formular-Fehlerquote in PostHog (`webinar_register_result` mit `ok=false`); steigt sie, zuerst Backend und Supabase prüfen.
4. Kommentare unter den Ads innerhalb von 24 Stunden beantworten (Wlad oder Mert).

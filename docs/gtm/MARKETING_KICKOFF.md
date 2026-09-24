# Marketing-Start KW 40 — Go/No-Go ab Mo 28.09.2026

> Phase 2 (Vermarktung) beginnt nächste Woche. Ziel: ab Mo 28.09. laufen
> Meta- und LinkedIn-Ads auf das Webinar am **Do 29.10.2026, 10:00**.
> Diese Liste ist das Gate: **kein Ad-Euro, bevor alle 🔴-Punkte ✅ sind.**
> Ohne Tracking kaufen wir Klicks blind, ohne Reminder verlieren wir die
> Anmeldungen vor dem Termin.
>
> Stand 24.09. — geprüft gegen Code und Live-System (Details pro Zeile).

## 1. Gate — bis Fr 25.09. / spätestens So 27.09.

| # | Punkt | Wer | Stand 24.09. | Details |
| --- | --- | --- | --- | --- |
| 1 | 🔴 **Zahlungsmittel Ads-Konten** (Meta, LinkedIn, Google) auf Argumentorik-Karte + Rechnungsadresse/USt-ID | Argumentorik (Wlad/Eduard) | ❌ offen | [`TOOL_ACCESS.md`](../ops/TOOL_ACCESS.md) §3a, Zeile 2 |
| 2 | 🔴 **Zahlungsmittel Infrastruktur** (Emergent, Vercel, Supabase, Registrar, Resend) | Argumentorik | ❌ offen | §3a, Zeilen 3–7 — bei Ad-Traffic steigen die Kosten, eine abgelehnte Karte = Seite offline |
| 3 | 🔴 **Stripe-Auszahlungskonto** auf Argumentorik | Argumentorik | ❌ offen | §3a, Zeile 1 — Trial-Umwandlungen nach dem Webinar landen sonst auf dem falschen Konto |
| 4 | 🔴 **Meta-Pixel-ID** im Code | Mert → PR | ❌ Platzhalter | `frontend/src/lib/metaPixel.js` → `META_PIXEL_ID` (15–16 Ziffern) |
| 5 | 🔴 **Meta Conversions API** im Backend | Stefan (Emergent) | ❓ | Env-Vars `META_PIXEL_ID`, `META_CAPI_TOKEN` in Emergent; einmal mit `META_TEST_EVENT_CODE` testen, danach entfernen. Ohne CAPI fehlen auf iOS ~30–40 % der Leads |
| 6 | 🔴 **LinkedIn Insight Tag** | Mert → PR | ❌ Platzhalter | `frontend/src/lib/linkedinInsight.js` → `LINKEDIN_PARTNER_ID` + `LINKEDIN_LEAD_CONVERSION_ID` |
| 7 | 🟠 Google-Ads-Tag | Mert → PR | ❌ Platzhalter | `frontend/public/js/consent-gtag.js` → `AW_ID`; nur nötig, wenn Google Ads im ersten Monat laufen |
| 8 | 🔴 **Emergent läuft den 29.10.-Code** | Stefan | ❓ | Bestätigungs-Mail + Kalender-Link zeigen sonst das alte Datum. Test: auf `/webinar` anmelden, Mail prüfen. [`EMERGENT_ADMIN_ONBOARDING.md`](../ops/EMERGENT_ADMIN_ONBOARDING.md) §8.1 |
| 9 | 🔴 **Webinar-Reminder geplant** | Stefan | 🟡 Backup steht | `webinar-cron.yml` (GitHub) ist da; primär cron-job.org alle 15 min anlegen; Actions → `webinar-cron` → Run workflow muss 200 liefern |
| 10 | 🔴 **Absender-Domain in Resend verifiziert** | Stefan | ❓ | `SENDER_EMAIL` in Emergent vs. Resend → Domains. War im Juni die Ursache für 100 % Mail-Fehler |
| 11 | 🟠 Stefan hat Zugriff auf Supabase, Sentry, PostHog, Resend | Mert (Invites) | 🟡 Emergent ✅, Rest offen | [`TOOL_ACCESS.md`](../ops/TOOL_ACCESS.md) §3 — sonst kann er während der Kampagne keine Fehler sehen |
| 12 | 🟠 Zoom/Streaming-Konto + Join-Link für 29.10. | Wlad/Mert | ❓ | Der Join-Link muss in die Reminder-Mail (Env-Var `WEBINAR_JOIN_URL` in Emergent; ohne sie zeigt der Button nur auf `/webinar`) |

## 2. Kampagnen-Start (Mo 28.09.)

Nur wenn §1 grün ist. Die Pakete sind fertig:

- **Meta** — 30 €/Tag, 24 Creatives: [`META_ADS_WEBINAR.md`](./META_ADS_WEBINAR.md)
- **LinkedIn** — 50 €/Tag, 8 Creatives: [`LINKEDIN_ADS_WEBINAR.md`](./LINKEDIN_ADS_WEBINAR.md)
- **Landings:** `/webinar` (Hauptseite), `/kommunikation` (Kommunikations-Check → Webinar), `/training` (Kurzform)
- **Reihenfolge im Funnel:** Leader-Check → Webinar 29.10. → 14 Tage Trial → 30-Tage-Challenge ([`WEBINAR_FUNNEL.md`](./WEBINAR_FUNNEL.md))
- Alle Zahlen und Aussagen gegen [`WLAD_CANON.md`](./WLAD_CANON.md) prüfen. **Offen:** Greator nennt „12 Bücher · 10.000+ Manager", der Canon „13 Bücher · 400.000+ Klienten". Mit Wlad klären, bevor ein Creative eine Zahl nennt.

## 3. Woche 1 — täglich 10 Minuten

| Check | Wo | Schwelle zum Eingreifen |
| --- | --- | --- |
| Anmeldungen pro Tag | Admin → Webinar-Leads · PostHog Funnel | < 3 / Tag nach 72 h → Creatives rotieren |
| Kosten pro Anmeldung | Meta/LinkedIn Ads Manager | Meta: CPL > 2× Kampagnen-Median nach ≥ 50 Klicks · LinkedIn: CPL > 60 € nach ≥ 20 Klicks → Anzeige pausieren (Regeln aus den Ads-Paketen) |
| Pixel-/CAPI-Events kommen an | Meta Events Manager → Übersicht | 0 Events trotz Anmeldungen → Tracking kaputt, Ads stoppen |
| Bestätigungs-Mails zugestellt | Resend → Logs | eine einzige 403 → Absender-Domain prüfen (§1 Nr. 10) |
| Fehler | Sentry `leader-os` | neuer Fehler auf `/webinar` → sofort Stefan |

## 4. Wer macht was

- **Argumentorik (Wlad/Eduard):** Karten, Rechnungsadresse, Stripe-Konto (§1 Nr. 1–3) — nur sie können das eintragen, Kartendaten nie per Mail
- **Stefan:** Emergent-Deploy, CAPI-Env-Vars, Reminder-Scheduler, Resend (§1 Nr. 5, 8–10)
- **Mert:** Pixel-IDs in den Code (ein PR), Invites für Stefan, Kampagnen anlegen und steuern
- **Wlad:** Canon-Zahl klären, Greator-Event So 27.09. mit dem LeaderOS-Deck (Bühne für den Leader-Check)

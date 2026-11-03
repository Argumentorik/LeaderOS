# Email-Broadcasts — evergreen Sends außerhalb der Nurture-Kette

`backend/services_email.py` unterscheidet zwei Email-Kategorien:

1. **Kette** (`lead_nurture_email(step, …)`) — 7 Schritte, linear, per
   Cron getriggert (`/api/cron/lead-nurture`, siehe `docs/ops/CRON_SCHEDULE.md`).
   Jede Mail baut auf der vorherigen auf, Schritt 7 endet bereits mit
   dem Beratungs-CTA.
2. **Broadcasts** — einzelne, in sich geschlossene Sends für einen
   bestimmten Anlass (Launch, Webinar-Follow-up, Re-Engagement). Kein
   Schritt-Zähler, keine Reihenfolge, kein automatischer Cron-Trigger —
   werden manuell (Admin-Route oder Skript) ausgelöst, wenn ein
   konkreter Anlass da ist. Bestehende Beispiele: `launch_announcement_email`,
   `webinar_followup_email`.

Diese Datei dokumentiert die Broadcast-Kategorie.

## `beratung_checklist_email(name, unsubscribe_link=None)`

Struktur-Vorlage für Re-Engagement-/Evergreen-Broadcasts: **Checkliste →
Trust-Block → CTA → Content-Teaser.** Bewusst anders aufgebaut als die
Fließtext-Nurture-Mails — als Scan-in-5-Sekunden-Format für Leads, die
schon durch die Kette gelaufen sind, aber noch nicht gebucht haben.

Struktur-Herkunft: eine klassische B2C-Coaching-Broadcast-Mail (Beispiel
zur Inspiration: Haufe Akademie) — Begrüßung, Benefit-Checkliste (✓
+ kurzer Satz), Trust-Block (✓ + Beleg), ein CTA-Block, ein
Content-Teaser als Soft-CTA für alle, die noch nicht bereit sind.
Übernommen ist nur die **Struktur**, kein Wording und keine fremde
Behauptung — jeder Fakt im Trust-Block ist canon-verifiziert
(`WLAD_CANON.md`): 400.000+ Klienten seit 2007, 13 Bücher, 3×
SPIEGEL-Bestseller, die Multi-Surface-Parität von WladBot (siehe
`EXPERT_OS_THESIS.md` §3). Keine erfundenen Testimonials, keine
Fake-Urgency — gleiche Ehrlichkeits-Regeln wie `WEBINAR_FUNNEL.md`.

- CTA-Link: `https://www.leader-os.de/#beratung` (gleicher Anker wie
  Nurture-Schritt 7).
- Content-Teaser verlinkt einen echten Journal-Artikel
  (`warum-inhouse-trainings-nach-sechs-wochen-verpuffen`) statt eines
  generischen "mehr lesen".
- **Nicht cron-wired.** Zum Versenden: aus einer Admin-Route oder einem
  Einmal-Skript `send_email(*beratung_checklist_email(name, unsub))`
  aufrufen, analog zu `webinar_followup_email` in `routes/webinar.py`
  — Auswahl der Empfänger (z. B. "durch Nurture gelaufen, kein
  Beratungstermin gebucht") ist bewusst nicht vorentschieden, weil das
  von der jeweiligen Kampagne abhängt.

## Nächste Broadcast-Kandidaten (nicht gebaut)

Wenn weitere Broadcasts nach demselben Checkliste-Muster gebraucht
werden — z. B. ein Reaktivierungs-Mail für abgelaufene Trials, oder ein
saisonaler Kampagnen-Kick-off — dieselbe Helper-Struktur
(`_checklist()`, `_cta()`, `_kicker()`, `_headline()`) in einer neuen
Funktion wiederverwenden statt sie zu kopieren-und-anpassen; die Helper
sind bewusst lokal pro Funktion gehalten (Konvention dieser Datei), aber
sollten bei einem dritten Broadcast in einen gemeinsamen Modul-Helfer
extrahiert werden.

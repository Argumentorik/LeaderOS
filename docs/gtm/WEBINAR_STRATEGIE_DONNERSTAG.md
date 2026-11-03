# Webinar und Evergreen · Entscheidungsvorlage für Donnerstag 29.10.2026

Ausgangslage (Wlad, 28.10.): Das Webinar nicht vormittags legen, wenn alle
Führungskräfte arbeiten. Zuerst mit Evergreen-Marketing starten; wenn die
Plattform regelmäßig gutes Feedback bekommt, dann das kostenintensivere Webinar
machen. Die Strategie soll am Donnerstag besprochen werden. Aufnahmen sind kein
Problem, er nimmt ohnehin jede Woche Videos auf. Auf `/webinar` steht heute
Do 26.11.2026, 10:00 (unser Vorschlag, nicht bestätigt). Bezahlte Kampagnen
laufen nicht, bis das entschieden ist.

## Was für Evergreen schon da ist

- **Gratis-Serie „Führung beginnt hier“** unter `/fuehrung-beginnt-hier`: vier
  Videos, Opt-in ohne Konto, sofort Video 1 per Mail, Tag 2 bis 4 per Drip. Drei
  der vier Clips haben eine Quelle (Google Drive), der vierte nicht.
- **14 Tage Test** über `leaderos.de/signup?trial=14` (App auf Emergent).
- **Landings** `/ki-fuehrungskraft`, `/kommunikation`, `/training`: mit
  Webinar-Angebot gebaut, müssten für Evergreen auf Test oder Demo umgestellt werden.
- **Bausteine für Social**: acht Karussells, sechs Poster, Zernio-Plan
  (`docs/gtm/linkedin-carousels-01/SCHEDULE.json`).

Was fehlt: die **Demo „Warum LeaderOS“ (5 bis 6 Minuten, V1)** als Kernstück der
Anzeigen, stabile Videoquellen (YouTube statt Drive) und die Produktqualität
(`docs/app/WLAD_FEEDBACK_2026-10-28.md`), denn wer den Test startet, beurteilt
genau das.

## Drei Wege

| | A · Evergreen zuerst (Wlads Wunsch) | B · Live-Webinar, aber abends | C · Evergreen-Webinar (Aufzeichnung) |
| --- | --- | --- | --- |
| Ablauf | Anzeige → Demo-Video V1 und 14 Tage Test, oder Anzeige → Gratis-Serie → Test. Webinar später als Event für die warme Liste. | Anzeige → `/webinar` → Live-Termin, z. B. Do 26.11., 18:00 oder 19:00 (Mittag 12:00 als Alternative). | Anzeige → Aufzeichnung (V2, 20 bis 30 Minuten) zu festen Zeiten oder on demand, danach Test. |
| Aufwand Wlad | V1 bis 10.11. | V1 optional, Live-Termin 90 Minuten | V2 bis 20.11. |
| Kosten | niedrig, nur Anzeigen | Anzeigen plus Wlads Zeit | niedrig nach der Aufnahme |
| Risiko | Produkt muss vorher stimmen | Produktqualität offen, Termin muss gefüllt werden | muss als **Aufzeichnung** gekennzeichnet sein (nicht „live“), „Keine Aufzeichnung“ fällt auf der Seite weg |
| Änderung an der Seite | `/webinar` wird Demo-/Test-Landing oder Webinar-Warteliste | nur Datum und Uhrzeit in `frontend/src/data/webinarEvent.js`, Poster LI-06 neu | `/webinar` auf on demand umbauen, FAQ und Event-Schema ändern |

**Empfehlung: A jetzt, B oder C später.** Vier Wochen Evergreen als Test
(V1, Gratis-Serie, Test-Start), dazu die Produktpunkte aus dem Feedback beheben.
Das Webinar danach mit einem abendlichen Termin und der gesammelten Liste.
Kriterien für „gutes Feedback“ vorher festlegen, z. B. Zahl der Test-Starts,
Anteil mit drei Sitzungen in sieben Tagen, Rückmeldungen von Nutzern.

## Verknappung

Wlad schlägt vor, Verknappung einzubauen, auch wenn sie nicht stimmt, und
trotzdem mehr Leute zuzulassen. **Das setzen wir nicht um.** Eine erfundene
Begrenzung ist irreführende Werbung (§ 5 UWG, kein Rechtsrat; Meta und LinkedIn
prüfen solche Aussagen in den Anzeigenrichtlinien), sie widerspricht den Regeln
in `docs/gtm/WEBINAR_FUNNEL.md`, und sie fliegt auf, sobald jemand mit Platz 51
nachfragt. Die „50“ auf den Postern war unser Platzhalter, nicht abgestimmt.

Mit gleicher Wirkung und ehrlich geht es über **Wellen**:

- **Welle 1: 50 Plätze**, technisch gedeckelt. Ist sie voll, kommt eine Warteliste.
- **Welle 2 öffnet am festen Datum** mit mehr Plätzen. So lassen wir „trotzdem
  mehr Leute zu“, nur später und wahr.
- Echte Fristen, wenn danach wirklich etwas endet (Beta-Zugang bis Datum).
- Echte Kapazität beim Live-Termin (im Backend sind 500 Plätze hinterlegt).

Voraussetzung: Die Deckelung muss gebaut sein, bevor ein Poster oder eine
Anzeige „Plätze“ nennt. Bis dahin geht nichts mit Zahl raus (Zernio ist ohnehin
noch nicht verbunden).

## Entscheidungen am Donnerstag

1. Weg A, B oder C?
2. Falls B: Uhrzeit und Tag (abends).
3. Wellen-Modell und Größe von Welle 1.
4. Beta-Zielseite: Test mit Code oder eigene Beta-Seite mit Warteliste.
5. Termin für V1 (Demo) und Loom-Aufnahme.
6. Google Workspace: Drive und Zernio über den Argumentorik-Account.
7. Videoquellen: Vimeo-Freigabe oder YouTube für die Clips der Gratis-Serie.

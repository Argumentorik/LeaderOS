# Ads · Bing + LinkedIn (nur Document Ads) · 8 Webinar-Posts

> Stand 29.09.2026 · Webinar Do 29.10.2026, 10:00–11:30 Uhr · Ziel: die
> ersten Anmeldungen. Ergänzt `LINKEDIN_ADS_WEBINAR.md` (Struktur, Zielgruppe,
> Regeln bleiben dort gültig) und `GOOGLE_ADS_SETUP.md`.
>
> Alle Behauptungen aus `WLAD_CANON.md` / `WEBINAR_FUNNEL.md`. Keine
> „13 Bücher" (Canon: ungeklärt), keine Fake-Scarcity, keine Zähler, keine
> erfundenen Zitate. Posts sind **Entwürfe in Wlads Stimme und brauchen seine
> Freigabe**, bevor sie unter seinem Namen rausgehen.

---

## 0. Ehrliche Lage

Es gibt noch keine Anmeldungen und kein Ad-Konto-Ergebnis, auf das man
schließen könnte. Die Rechnung aus `LINKEDIN_ADS_WEBINAR.md` §0 bleibt die
realistische: 50 €/Tag über 8 Tage ≈ 400 € ≈ **6–20 Anmeldungen** (Annahme, kein
Ergebnis). Bezahlte Ads allein füllen ein Webinar in 30 Tagen nicht. Die
schnellsten ersten Anmeldungen kommen aus dem, was nichts kostet: **Wlads
eigene Posts (§3)** und **eine Mail an die bestehende Liste**
(`EMAIL_BROADCASTS.md`). Ads verstärken das, sie ersetzen es nicht.

Vor jedem bezahlten Klick muss stehen:
1. `/webinar` lädt und nimmt Anmeldungen an (Testanmeldung mit Bestätigungsmail).
2. Conversion „Webinar-Lead" pro Kanal eingerichtet (LinkedIn Insight Tag,
   Microsoft UET-Tag) — sonst sieht man nicht, was klappt.
3. `/frameworks` ist entfernt und leitet auf `/kommunikation` um. **Alle Ads
   gehen direkt auf `/webinar`**, nie auf die Umleitung.

---

## 1. LinkedIn · nur noch Document Ads

**Änderung gegenüber `LINKEDIN_ADS_WEBINAR.md`:** statt 4 Single-Image-Ads
laufen 2 Document Ads mit demselben PDF und unterschiedlichem Intro-Text.
Zielgruppe (§3), Budget (50 €/Tag), Regeln (§5) und Tracking (§4) bleiben.

**Das PDF:** `webinar-document-ad.pdf` — 6 Seiten, 1080 × 1350 (4:5),
schwarz/Lime, Wlad-Foto auf dem Cover.

| Seite | Inhalt |
| --- | --- |
| 1 | „Führung wird nicht gelernt. Sie wird trainiert." + „4 Frameworks von Wlad Jachtchenko" |
| 2 | Feedbackformel (Beobachtung + Wirkung + Wunsch) mit Beispiel |
| 3 | SEXIER, alle sechs Schritte |
| 4 | 10 Stufen des Zuhörens, Stufe 2 markiert (80 %) |
| 5 | 4-Farben-Modell |
| 6 | Webinar-CTA: Do 29. Oktober 2026 · 10:00–11:30 · kostenlos · live, keine Aufzeichnung · leader-os.de/webinar |

Alle Definitionen stehen wörtlich im Canon. Das Beispiel auf Seite 2 ist als
„Beispiel" gekennzeichnet.

**Anlage im Campaign Manager**

- Format: Sponsored Content → **Document Ad**, PDF hochladen.
- Ziel: Website-Conversions (Conversion „Webinar-Lead"), **nicht** Lead Gen
  Form. Grund unverändert (`LINKEDIN_ADS_WEBINAR.md` §1): Leads aus Lead Gen
  Forms landen nicht in `webinar_leads`, es gäbe weder Bestätigung noch
  Reminder.
- Ungated lassen (Dokument ist im Feed komplett lesbar), CTA-Button
  „Registrieren".
- Ziel-URL: `https://leader-os.de/webinar?utm_source=linkedin&utm_medium=cpc&utm_campaign=webinar-2026-09&utm_content=doc-a` (bzw. `doc-b`).

| Ad | Intro (≤ 150) | Headline (≤ 70) |
| --- | --- | --- |
| `DOC-A` (Lehre) | 4 Frameworks von Wlad Jachtchenko für das Gespräch, das du aufschiebst. Am 29.10. live im kostenlosen Webinar. | Live-Webinar mit Wlad Jachtchenko · 29. Oktober · kostenlos |
| `DOC-B` (Schmerz) | Seminare ändern Wissen, nicht Verhalten. 4 Frameworks zum Durchblättern und am 29.10. live im Webinar. | Führung trainieren statt wissen · Live-Webinar am 29.10. |

Rotation die ersten 5 Tage gleichmäßig, dann optimiert. Pausieren, urteilen,
nicht anfassen: Regeln aus `LINKEDIN_ADS_WEBINAR.md` §5.

**Später:** Wlads eigene Posts sponsern (Thought-Leader-Ads) — die 8 Posts
unten sind dafür die Auswahl. Braucht seine Freigabe.

---

## 2. Bing · Microsoft Advertising

Bing ist der Nebenkanal: kleineres Volumen, dafür oft günstigerer Klick und
ein Publikum mit hohem Desktop-Anteil (vor Anlage im Konto gegen die aktuellen
Zahlen prüfen — diese Aussage ist eine Erfahrungsannahme, kein Beleg).

**Aufbau, ohne Neuentwicklung**

1. Microsoft Advertising → **Import aus Google Ads**: `SEARCH-BRAND`,
   `SEARCH-WEBINAR`, `SEARCH-FEEDBACK` (aus `googleAdsAssets.js`).
   `SEARCH-FRAMEWORKS` **nicht** importieren (Seite entfernt).
2. Budget: klein anfangen, z. B. 10 €/Tag gesamt, Marke zuerst.
3. UET-Tag einrichten, Conversion „Webinar-Lead" auf dem Erfolgs-Event.
4. Ziel-URLs: `…/webinar?utm_source=bing&utm_medium=cpc&utm_campaign=webinar-2026-09`.
5. Zeichenlimits Search: Headline 30, Beschreibung 90 — die importierten
   Assets erfüllen sie (Test: `googleAssetProblems()`).

**Sitelinks** (Text ≤ 25, Beschreibungszeilen ≤ 35, alle geprüft)

| Text | Zeile 1 | Zeile 2 | URL |
| --- | --- | --- | --- |
| Live-Webinar 29.10. | Kostenlos, 90 Minuten, Q&A | Keine Aufzeichnung | `https://leader-os.de/webinar` |
| Feedbackformel lesen | Beobachtung, Wirkung, Wunsch | Kostenlos, ohne Login | `https://leader-os.de/journal/feedback-geben-vorlage-bww-framework` |
| Leader-Check | Dein Führungsprofil in 10 Min | Kostenlos, ohne Login | `https://leader-check.de/` |
| Über Wlad Jachtchenko | 3× SPIEGEL-Bestseller | Seit 2007 im Coaching | `https://leader-os.de/wlad-jachtchenko` |
| Journal | 150+ Artikel zu Führung | Kostenlos lesen | `https://leader-os.de/journal` |
| 14 Tage kostenlos testen | LeaderOS ohne Karte | Jederzeit kündbar | `https://leader-os.de/` |

**Callouts** (≤ 25): Kostenloses Live-Webinar · Keine Aufzeichnung ·
3× SPIEGEL-Bestseller · Seit 2007 im Coaching · 400.000+ Klienten · Ohne Kreditkarte.

**Bilder:** Bing-Bilderweiterungen und Multimedia-Ads mit den Bild-Assets des
Studios (`AD-D03`, `AD-B01`, `AD-C02`, `AD-A02` in 1.91:1 und 1:1). Sobald
klar ist, welche „neuen Bilder" gemeint sind, kommen sie hier und bei
Google/LinkedIn rein.

---

## 3. Acht Webinar-Posts · Wlads Kanäle (LinkedIn zuerst)

Mix: 4 direkt (Anmeldung ist der Punkt), 4 indirekt (Framework lehren, Anmeldung
zum Schluss). **Link in den ersten Kommentar**, nicht in den Post: LinkedIn
drosselt Posts mit externem Link. Link mit UTM:
`https://leader-os.de/webinar?utm_source=linkedin&utm_medium=organic&utm_campaign=webinar-2026-09&utm_content=post-N`

Rhythmus: ein Post pro Tag, zwei Wochen lang, Posts 1, 4, 6, 8 direkt in
Woche 1 und wieder in Woche 3 wiederholen (anderer Einstieg). Uhrzeit
Di–Do 7:30–8:30 oder 12:00.

### Post 1 · direkt · Seminar-Schmerz

```
Seminare verändern Wissen. Nicht Verhalten.

Jede Führungskraft weiß, dass man Feedback geben sollte. Dass man Konflikte früh anspricht. Dass gute Kommunikation zählt.

Warum passiert es trotzdem nicht?

Weil Führung nicht gelernt wird. Sie wird trainiert.

Am 29. Oktober zeige ich live, wie das aussieht: 90 Minuten, kostenlos, mit Q&A. Ohne Aufzeichnung.

Do, 29.10., 10:00 Uhr
Link im ersten Kommentar.
```

### Post 2 · indirekt · Feedbackformel

```
Drei Sätze für jedes schwierige Gespräch.

1. Beobachtung: „Ich habe beobachtet, dass der Bericht zum dritten Mal erst Freitagabend kam."
2. Wirkung: „Dadurch konnte ich ihn vor dem Kundentermin nicht prüfen."
3. Wunsch: „Ich wünsche mir ihn spätestens donnerstags."

Nie „Du bist unzuverlässig". Immer „Ich habe beobachtet, dass …".

Das ist die Feedbackformel: ein Satz, der beschreibt. Einer, der die Wirkung zeigt. Einer, der die Richtung vorgibt.

Am 29. Oktober zeige ich live, wie aus solchen Formeln ein Trainingssystem wird, inklusive eines echten Live-Cases. Kostenlos. Link im ersten Kommentar.
```

### Post 3 · indirekt · 10 Stufen des Zuhörens

```
80 % aller Führungskräfte hören auf Stufe 2 zu.

Stufe 2 heißt: auf die eigene Antwort warten.

Die Pyramide des Zuhörens hat zehn Stufen:

1 Nicht zuhören
2 Auf die Antwort warten
3 Selektiv zuhören
4 Empathisch zuhören
5 Aktiv zuhören
6 Strukturell zuhören: was nicht gesagt wird
7 Systemisch zuhören
8 Diagnostisch zuhören
9 Generativ zuhören
10 Stille als Zuhören

Ehrliche Frage: Auf welcher Stufe warst du im letzten Meeting?

Am 29. Oktober zeige ich live, wie man so etwas trainiert statt nur kennt. Kostenlos. Link im ersten Kommentar.
```

### Post 4 · direkt · Agenda

```
Do, 29. Oktober, 10:00 Uhr. 90 Minuten. Live.

Das passiert im Webinar:

10:05  Der Charisma-Code live: Präsenz, Wärme, Kompetenz
10:25  Das Leadership Operating System: wie WladBot, tägliche Drills und die 11 Frameworks zusammenspielen
10:55  Ein Live-Case aus der Community, gemeinsam durchgearbeitet
11:15  Q&A: deine Fragen, direkt beantwortet

Kostenlos. Keine Aufzeichnung, denn Live-Case und Q&A funktionieren nur live.

Anmeldung im ersten Kommentar.
```

### Post 5 · indirekt · SEXIER

```
Ein vollständiges Argument hat sechs Schritte.

S  Statement: die Behauptung
E  Explanation: die Begründung
X  eXample: das Beispiel
I  Impact: die Auswirkung
E  Explanation of Impact: warum die Auswirkung zählt
R  Rebuttal: die Widerlegung der Gegenargumente

Das R wird gern vergessen. Dabei entwaffnet es Einwände, bevor jemand sie ausspricht.

SEXIER stammt aus „Weiße Rhetorik". Am 29. Oktober zeige ich live, wie aus Modellen wie diesem tägliches Training wird. Kostenlos, mit Q&A. Link im ersten Kommentar.
```

### Post 6 · direkt · Kommentar-Aktion

```
Welches Gespräch schiebst du gerade auf?

Das Feedback an den Mitarbeiter, der ständig zu spät liefert. Die Gehaltsverhandlung. Der Konflikt im Team, den alle sehen und keiner anspricht.

Schreib „WEBINAR" in die Kommentare und du bekommst den Link zum kostenlosen Live-Webinar am 29. Oktober per Direktnachricht.

Und schreib dazu, um welches Gespräch es geht. Ich lese die Antworten und greife einige im Q&A auf.
```
(Der DM-Versand läuft manuell, siehe `META_ADS_WEBINAR.md` §0 „Comment-to-DM".
Der Q&A-Satz ist Wlads Zusage — nur mit seiner Freigabe posten.)

### Post 7 · indirekt · Charisma-Code

```
Ob ein Raum jemandem folgt, entscheidet sich in Sekunden.

Der Charisma-Code hat drei Signale:

Präsenz. Wärme. Kompetenz.

Jedes davon ist trainierbar.

Am 29. Oktober zeige ich den Charisma-Code live im kostenlosen Webinar. 90 Minuten, mit Q&A.

Link im ersten Kommentar.
```

### Post 8 · direkt · Was passiert nach der Anmeldung

```
Drei Dinge, die du vor der Anmeldung zum Webinar am 29. Oktober wissen solltest:

Kostet das etwas? Nein. Kostenlos.

Gibt es eine Aufzeichnung? Nein. Es ist live, mit Q&A und Live-Case.

Was passiert nach der Anmeldung? Du bekommst sofort die Bestätigung mit Kalender-Einladung, vor dem Termin zwei Erinnerungen, und auf der Bestätigungsseite schaltest du die vierteilige Videoserie „Führung beginnt hier" frei.

Do, 29.10., 10:00–11:30 Uhr. Link im ersten Kommentar.
```

---

## 4. Nicht gemacht / offen

- **Bezahlte Kampagnen sind nicht angelegt.** Dafür fehlt der Zugriff auf die
  Ad-Konten (LinkedIn Campaign Manager, Microsoft Advertising). Diese Datei
  ist die Anlage-Vorlage.
- „Neue Bilder überall": Welche Bilder gemeint sind, ist offen. Im Repo sind
  zuletzt Journal-Themenfotos und Kunden-Logos hinzugekommen, keine Ad-Motive.

# Plan: Thumbnails · Name „Wlad" · Sprach-Modus genauso schlau wie Text · Magic Link

## Der Befund aus den zwei Fotos

Dieselbe Frage, zwei Antworten:

| | Text-Modus (Foto 1) | Sprach-Modus (Foto 2) |
|---|---|---|
| S | Statement (Behauptung) ✓ | „State" ✓ (Wortlaut abweichend) |
| E | Explanation (Begründung) ✓ | **„Example" ✗** |
| X | eXample (Beispiel) ✓ | **„Explanation" ✗** |
| I | Impact (Relevanz) ✓ | Impact ✓ |
| E | Explanation of Impact ✓ | **„Explore – verschiedene Blickwinkel" ✗ (frei erfunden)** |
| R | Rebuttal (Widerlegung) ✓ | Rebuttal ✓ |

Der Text-Modus antwortet korrekt (deckt sich mit „Weiße Rhetorik"). Der Sprach-Modus vertauscht
E und X und erfindet beim zweiten E ein „Explore", das es im Modell nicht gibt. Ursache: der
Sprach-Modus antwortet aus einem eigenen, schnelleren Weg ohne Anbindung an die Buch-/
Wissensbasis — er rät aus dem Gedächtnis des Modells statt aus Wlads Inhalten.
Im Foto ist außerdem „Bei **VLAD** gibt es ja das SEXIer Modell" zu sehen — der Namensfehler
der Spracherkennung (Punkt 2).

## 1. Sprach-Modus wird inhaltlich gleichwertig zum Text-Modus

- Der Sprach-Modus bekommt **dieselbe Wissensanbindung und dieselben Coach-Regeln** wie der
  Chat: gleiche Buch-/Kursinhalte, gleiches Gedächtnis für den Nutzer, gleiches Antwort-Niveau.
  Kein zweiter, dümmerer Weg mehr.
- Unterschied bleibt nur die **Form**: gesprochene Antworten bleiben kurz, ohne Sternchen,
  Listen oder Überschriften, in ganzen Sätzen — aber inhaltlich identisch zur Textantwort.
- Gesichertes Kernwissen wird zusätzlich fest verankert, damit es in **jedem** Modus wörtlich
  stimmt. Für SEXIER gilt verbindlich:
  **S** = Statement (Behauptung) · **E** = Explanation (Begründung) · **X** = eXample (Beispiel) ·
  **I** = Impact (Relevanz für den Zuhörer) · **E** = Explanation of Impact (Begründung der
  Relevanz) · **R** = Rebuttal (Widerlegung des stärksten Einwands).
  Ebenso behandelt werden die anderen tragenden Modelle (z. B. 3-B-Schema, SEXI als Kurzform,
  Schwarze/Weiße Rhetorik, die Fragetypen), damit in beiden Modi kein Buchstabe wandert.
- Die Video-Analyse nutzt dieselbe verbindliche Definition — die SEXIER-Panels in der Analyse
  und die gesprochene Erklärung können sich damit nicht mehr widersprechen.

**Prüfung, die den Fall aus den Fotos abdeckt:** Ein fester Satz Wissensfragen wird in **beiden**
Modi gestellt (SEXIER, SEXI, 3-B-Schema, Einwandbehandlung, die 4 Persönlichkeitstypen,
„Was ist Weiße Rhetorik?") und Wort für Wort gegen die verbindliche Definition geprüft.
Freigabe nur, wenn Sprache und Text dieselbe Substanz liefern — und kein erfundenes Element
wie „Explore" mehr auftaucht.

## 2. Der Name ist überall „Wlad"

- Die Spracherkennung bekommt den Namen vorab mitgeteilt (Wlad, WladBot, Jachtchenko,
  Leader-OS, LeaderCheck), damit er von Anfang an richtig geschrieben wird.
- Zusätzlich eine feste Korrektur über jeden erkannten Text, bevor er irgendwo erscheint:
  Vlad, Vladimir, Wladimir, Flat & Co. werden zu „Wlad" bzw. „WladBot". Wirksam an einer
  Stelle für alle Wege — Sprach-Modus (auch der live mitlaufende Text beim Zuhören), Chat,
  Interaktiver Wlad am Video, Analyse-Transkripte, automatische Gesprächstitel.
- Auch die Antworten des Coaches werden geprüft: schreibt das Modell „Vlad", wird es korrigiert,
  bevor es im Bild steht oder gesprochen wird.
- Bestehende Gesprächstitel und Transkripte mit „Vlad" werden einmalig mitkorrigiert.
- Grenze: selbst getippter Nutzertext wird nicht umgeschrieben.

## 3. Thumbnails — nie wieder leere Kacheln

**Heute:** Das Vorschaubild wird bei jedem Aufruf frisch aus dem Video gezogen. Nach Neustart
oder Deploy ist der Zwischenspeicher leer, der erste Abruf scheitert oder dauert zu lange —
das Bild „verschwindet". Besonders bei neu hochgeladenen und neu gerenderten Videos.

**Künftig:**
- Jedes Video bekommt sein Vorschaubild **einmal fest erzeugt und dauerhaft gespeichert** —
  unabhängig von Neustart, Deploy oder Zwischenspeicher. Gilt für generierte Videos, eigene
  Uploads und Vimeo-Links (dort wird das Vimeo-Bild übernommen).
- Neues Bild automatisch bei Re-Render, neuem Upload oder geänderter Vorschau-Sekunde.
- Fehlt ein Bild doch, erscheint die gestaltete Ersatzkachel im Marken-Look mit Titel —
  nie ein leerer Rahmen oder ein kaputtes Bild-Symbol.
- Im Admin: Liste „Videos ohne Vorschaubild" plus ein Knopf, der alle fehlenden in einem
  Durchgang nachzieht — auch direkt nach einem Deploy auf Live prüfbar.
- Keine Render-Kosten: es werden nur Standbilder aus vorhandenem Material gezogen.

## 4. Magic Link muss sitzen

Der passwortlose Login wird vollständig durchgespielt und in Ordnung gebracht: Link anfordern →
E-Mail kommt an (Absender, Betreff, Darstellung auf dem Handy) → Klick führt direkt in die
angemeldete Ansicht. Dazu die unangenehmen Fälle: abgelaufener Link, zweiter Klick auf einen
schon benutzten Link, Link in einem anderen Browser geöffnet, unbekannte E-Mail-Adresse,
mehrfaches Anfordern hintereinander. Jeder Fall endet mit einer klaren deutschen Meldung und
einem Weg zurück — nie in einer weißen Seite oder einem Endlos-Ladebalken.

## Entscheidungen und Annahmen (können widersprochen werden)

1. **Sprache wird etwas später, aber richtig.** Die volle Wissensanbindung kostet beim
   Sprach-Modus rund eine halbe bis eine Sekunde mehr, bis Wlad zu sprechen beginnt.
   Angenommen wird: Richtigkeit geht vor Tempo. Alternative wäre, die Anbindung nur bei
   Wissensfragen zuzuschalten und bei Motivations-/Sparring-Sätzen weiter sofort zu antworten —
   sag Bescheid, wenn das gewünscht ist.
2. Verbindlich festgeschriebenes Kernwissen umfasst die Rhetorik-Modelle und Kernbegriffe,
   nicht ganze Buchkapitel.
3. Eigene Thumbnails hochzuladen ist nicht Teil des Plans — nur die Sekunden-Wahl, die es im
   Admin schon gibt.
4. Es werden keine Videos und keine Audios neu gerendert. Für die Prüfung des Sprach-Modus
   entstehen nur die üblichen Cent-Beträge für ein paar Testantworten.
5. Der Text-Modus bleibt inhaltlich wie er ist — er ist laut Foto 1 korrekt.

## Nicht Teil dieses Plans

- Neue Videos, neue Stimmen, neue Skripte, Re-Renderings.
- Weitere Ausspracheschliffe der gesprochenen Antwort („im" / „imm") — bleibt pausiert.
- Änderungen am Aussehen der Video-Kacheln über die Ersatzkachel hinaus.

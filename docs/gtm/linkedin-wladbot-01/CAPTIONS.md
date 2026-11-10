# Karussells W01 bis W03 · WLAD AI · LeaderOS-Teaser (je fünf Folien)

Stand 07.11.2026. Je Karussell fünf Folien `W0x-01.jpg` bis `W0x-05.jpg`
(1620×2025, 4:5) und das LinkedIn-Dokument `W0x.pdf` (mit Platzzahl) sowie
`W0x-open.pdf` (ohne). Das PDF ist das wischbare Karussell: mehrere
Einzelbilder zeigt LinkedIn als Raster, ein Dokument als Karussell. Dieselben Folien laufen auf Instagram als Karussell
(Captions in `../instagram-feed-01/CAPTIONS.md`).

Die letzte Folie gibt es in vier Fassungen:

| Datei | Wofür | Inhalt |
|---|---|---|
| `W0x-05.jpg` | LinkedIn, mit Begrenzung | „150 Plätze", QR-Code |
| `W0x-05-open.jpg` | LinkedIn, ohne Begrenzung | „Beta · Offen", QR-Code |
| `W0x-05-ig.jpg` | Instagram, mit Begrenzung | „150 Plätze", „Link in Bio" statt QR |
| `W0x-05-ig-open.jpg` | Instagram, ohne Begrenzung | „Beta · Offen", „Link in Bio" |

Welche Fassung gilt, entscheidet das Gate unten.

**Gestaltung:** dunkler Grund, ein echtes Bühnenfoto als Bildwelt, mattes Glas
als Oberfläche (so sieht auch das Produkt aus), Limette als einziger Akzent.
Zeilen in zwei Tönen (Inter Display, hell und gedämpft), Mono nur für
Kleinstes. Das Glas nimmt die Farbe des Lichts dahinter an; der Lichtgrund
stammt aus dem unscharfen Scheinwerfer desselben Fotos, je Folie in einer
Farbfamilie (Amber, Blaugrün, Limette). WLAD AI erscheint als
Mitteilung (Avatar, Name, Text) und als Figur; Markierungen mit Punkt und Linie
sitzen dort, wo das Bild etwas zeigt (offene Hand, „Gegenfrage"). Kein Name auf
den Folien, keine Credentials, kein Termin. Die Figur ist das bestehende
Produkt-Maskottchen (`frontend/public/wlad/wladbot3.0.png`, als Freisteller),
das Foto das echte Bühnenfoto; es wurde nichts erzeugt und kein Videostandbild
verwendet. Chat-Texte sind Beispiele und so gekennzeichnet, keine Zitate von Wlad.

**Quellen und Neu-Bauen:** `carousel.html` (alle Folien und Texte),
`../social-kit/` (Bausteine `kit.css`, `kit.js`, Bilder `build_assets.py`,
Foto `src/wlad-stage.webp`), `render.cjs` (Playwright), PDFs mit
`../linkedin-carousels-01/build_pdf.py`.

```
PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs
python3 -I ../linkedin-carousels-01/build_pdf.py .
```

## Die drei Karussells

| ID | Hook (Folie 1) | Wendung | Auflösung | Canon |
|---|---|---|---|---|
| W01 | Dein Teamlead blockt jeden Vorschlag ab. | Bot: „Falsche Frage. Besser: Was verliert er, wenn du recht hast?" | Hinter einem Nein steckt fast immer ein Interesse; erster Satz als Beobachtung, Wirkung, Wunsch | Feedbackformel |
| W02 | WLAD AI zerlegt dein Argument. | Bot: „Das ist ein Satz. Kein Argument." | Schritt 1 von 6, die sechs Schritte, dasselbe Argument neu gebaut | SEXIER (Weiße Rhetorik) |
| W03 | Dein Chef sagt: „Dafür ist kein Budget da.“ Was sagst du? | A, B oder C zur Wahl, vor dem Wischen tippen | B gewinnt: Rückfrage statt Aufgeben oder Angriff, danach direkt den Termin setzen | Rückfrage-Technik, hart in der Sache, weich zur Person |

W03 ist als Kommentar-Köder gebaut: die Optionen stehen in der Caption, die
Auflösung nur im Karussell. Der Chat in W01 und die Verdikte in W03 sind
Beispiele, kein aufgezeichnetes Gespräch. Das „erfundene" Projekt in W02 ist als
Beispiel markiert.

## Vor dem Posten: die Begrenzung muss echt sein

Folie 5 nennt **150 Plätze** und „Aufnahme stoppt bei 150". Das stimmt nur, wenn
die Aufnahme technisch bei 150 stoppt (`docs/gtm/WEBINAR_FUNNEL.md`: keine
Fake-Scarcity). **Stand heute ist das nicht gebaut.** Der QR-Link führt in den
allgemeinen 14-Tage-Zugang (`/signup?trial=14`), der für alle offen ist und
nirgends gezählt wird. Zwei ehrliche Wege:

- **A · Begrenzung bauen, dann Folie 5 mit Zahl posten.** Zuerst festlegen, was
  die 150 zählen: ein eigener Beta-Zugang, nicht der allgemeine Trial, sonst
  wäre der Webinar-Funnel nach 150 Anmeldungen dicht. Dann ein atomarer Zähler
  (Mongo `find_one_and_update` mit `$lt`-Bedingung) in jedem Registrierungsweg
  (`/api/auth/register`, OAuth, Magic Link), ein Status-Endpunkt
  (`GET /api/beta/seats`) und ein „Beta ist voll"-Zustand auf der Signup-Seite.
  Danach Emergent-Deploy von `mvpcode`. Die Zahl steht in `SEATS`
  (`carousel.html`).
- **B · Heute ohne Begrenzung posten.** Auf LinkedIn das Dokument `W0x-open.pdf`
  statt `W0x.pdf` hochladen, auf Instagram die Folien 1 bis 4 plus
  `W0x-05-ig-open.jpg`, und in der Caption den markierten Absatz streichen.

**Angleichen:** LI-05 und die acht Karussells in `../linkedin-carousels-01`
(`SEATS` in `data.js`) nennen noch 50 Plätze. Es gibt nur eine Begrenzung, die
Zahl muss überall gleich sein.

## Captions LinkedIn (Wlad, erste Person)

Der Absatz mit `[nur mit Begrenzung]` entfällt bei Weg B. Kein Link im Post-Text.

### W01 · Der Teamlead, der alles abblockt

Dein Teamlead blockt jeden Vorschlag ab.
Die meisten fragen: Wie überzeuge ich ihn?

WLAD AI stellt erst eine Gegenfrage: Was verliert er, wenn du recht hast?

Hinter einem Nein steckt fast immer ein Interesse. Wer danach fragt, statt um Zustimmung zu kämpfen, kommt weiter. Der erste Satz dafür folgt meiner Feedbackformel: Beobachtung, Wirkung, Wunsch. Nie „du bist …“, immer „mir ist aufgefallen …“.

Das ist ein Beispiel aus LeaderOS. WLAD AI ist der KI-Coach mit meiner Methodik, jederzeit für den Fall von morgen.

Die Beta ist kostenlos. Auf dem letzten Bild ist der QR-Code, den Link findet ihr im ersten Kommentar.

[nur mit Begrenzung] Wir starten mit 150 Plätzen. Wenn sie vergeben sind, ist die Beta zu.

Was antwortest du, wenn ein Vorschlag sofort abgeblockt wird?

#Leadership #Führung #KI #LeaderOS

> Erster Kommentar: „LeaderOS Beta, kostenlos: https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=comment&utm_campaign=wladbot&utm_content=w1"

### W02 · Das Argument wird zerlegt

„Wir müssen das Projekt stoppen.“
Das ist ein Satz. Kein Argument.

Die meisten Argumente bestehen aus einer Behauptung. Das ist Schritt eins von sechs. Wer dort aufhört, bekommt Nicken und keine Bewegung.

Aus meinem Buch „Weiße Rhetorik“: das SEXIER-Modell. Statement, Explanation, eXample, Impact, Explanation of Impact, Rebuttal. Sechs Schritte, zwei Minuten.

Im Karussell baut WLAD AI einen schwachen Satz Schritt für Schritt neu. Das Beispiel ist erfunden, das Modell nicht.

Die Beta von LeaderOS ist kostenlos. Auf dem letzten Bild ist der QR-Code, den Link findet ihr im ersten Kommentar.

[nur mit Begrenzung] Wir starten mit 150 Plätzen. Wenn sie vergeben sind, ist die Beta zu.

Welcher Schritt fehlt in deinem nächsten Meeting am ehesten?

#Rhetorik #Argumentation #Leadership #LeaderOS

> Erster Kommentar: „LeaderOS Beta, kostenlos: https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=comment&utm_campaign=wladbot&utm_content=w2"

### W03 · Rollenspiel: „Kein Budget“

Dein Chef sagt: „Dafür ist kein Budget da.“
Was sagst du?

A: „Okay, verstehe.“
B: „Was müsste passieren, damit es im nächsten Quartal geht?“
C: „Das ist unfair. Andere kriegen es auch.“

Schreib deinen Tipp in die Kommentare, bevor du weiterwischst. Im Karussell spielt WLAD AI deinen Chef und wertet die drei Antworten.

Hart in der Sache, weich zur Person: das gilt auch, wenn es um Geld geht.

LeaderOS ist meine Methodik als tägliches Training: ein KI-Coach, der sie kennt, und Simulationen mit einem Gegenüber, das zurückredet. Die Beta ist kostenlos, der QR-Code steht auf dem letzten Bild, den Link findet ihr im ersten Kommentar.

[nur mit Begrenzung] Wir starten mit 150 Plätzen. Wenn sie vergeben sind, ist die Beta zu.

#Verhandlung #Leadership #Führung #LeaderOS

> Erster Kommentar: „LeaderOS Beta, kostenlos: https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=comment&utm_campaign=wladbot&utm_content=w3"

## Alt-Texte (je Folie, LinkedIn und Instagram)

**W01**
1. Dunkles Titelbild mit Foto: Ein Redner mit Headset steht im Scheinwerferlicht auf einer Bühne, die offene Hand zeigt nach vorn, markiert mit dem Wort „Gegenfrage". Text: Dein Teamlead blockt jeden Vorschlag ab. Mitteilung von WLAD AI: Ich stelle dir erst eine Gegenfrage.
2. Chat mit WLAD AI, als Beispiel gekennzeichnet. Frage: Er sagt bei jeder Idee: „Haben wir schon probiert.“ Wie überzeuge ich ihn? Antwort: Falsche Frage. Besser: Was verliert er, wenn du recht hast?
3. Text: Hinter einem Nein steckt fast immer ein Interesse. Darunter ein Foto der gestikulierenden Hände des Redners. Mitteilung von WLAD AI: Oft Risiko, Mehrarbeit oder Gesichtsverlust. Frag danach, nicht nach Zustimmung.
4. Der erste Satz in drei Karten. Beobachtung: Mir ist aufgefallen, dass meine Vorschläge im Meeting sofort abgelehnt werden. Wirkung: Das kostet uns Ideen. Wunsch: Ich wünsche mir, dass wir eine davon gemeinsam durchspielen. Darunter: Nie „du bist …“, immer „mir ist aufgefallen …“.
5. Schlussfolie: Frag WLAD AI selbst. WLAD AI, eine gezeichnete Figur im grünen Samtsakko, sagt: Stell mir deine Frage. Beta, kostenlos, 150 Plätze, Aufnahme stoppt bei 150. QR-Code zum Beta-Zugang (Instagram: Link in Bio).

**W02**
1. Titelbild: WLAD AI zerlegt dein Argument. Der Beispielsatz „Wir müssen das Projekt stoppen.“ steht auf einer Karte, eine leuchtende Linie schneidet ihn in der Mitte durch. WLAD AI sagt: Das ist ein Satz. Kein Argument.
2. Schritt 1 von 6. Der Satz „Wir müssen das Projekt stoppen.“, darunter die Buchstaben S E X I E R, nur das S ist hervorgehoben. WLAD AI: Mehr steckt nicht drin. Wer hier aufhört, bekommt Nicken und keine Bewegung.
3. Die sechs Schritte des SEXIER-Modells aus Weiße Rhetorik: Statement, Explanation, eXample, Impact, Explanation of Impact, Rebuttal, je mit einer Zeile Erklärung.
4. Dasselbe Argument, neu gebaut, in sechs Zeilen zu S, E, X, I, E, R, als Beispiel gekennzeichnet. Unten: Sechs Schritte, zwei Minuten.
5. Schlussfolie: Frag WLAD AI selbst. Mitteilung: Gib mir dein Argument. 150 Plätze, Beta, kostenlos, QR-Code (Instagram: Link in Bio).

**W03**
1. Titelbild. Text: Dein Chef sagt: „Dafür ist kein Budget da.“ Was sagst du? WLAD AI sagt in einer Mitteilung: Ich spiele deinen Chef. Du hast einen Satz.
2. Wähle, bevor du weiterwischst. A: Okay, verstehe. B: Was müsste passieren, damit es im nächsten Quartal geht? C: Das ist unfair. Andere kriegen es auch.
3. WLAD AI wertet. A schwach: Du gibst auf, bevor das Gespräch beginnt. B stark, hervorgehoben: Rückfrage-Technik, aus dem Nein wird ein Weg. C schwach: Du greifst die Person an, nicht das Problem.
4. Hart in der Sache. Weich zur Person. Daneben ein Foto des Redners im Scheinwerferlicht. WLAD AI: Und setz direkt den Termin: Wann schauen wir uns das gemeinsam an?
5. Schlussfolie: Frag WLAD AI selbst. Mitteilung: Wie klingt dein Chef? 150 Plätze, Beta, kostenlos, QR-Code (Instagram: Link in Bio).

## Offene Punkte

1. **Freigabe durch Wlad** (Mail): Bilder, Captions und die Beispiel-Antworten des Bots. Das Maskottchen ist der bestehende Produkt-Avatar, in den Folien aber deutlich größer als im Produkt.
2. **Foto:** Das Bühnenfoto (`../social-kit/src/wlad-stage.webp`) kam über den Chat und ist nur 1342×1076 Pixel groß. Quelle, Nutzungsrecht und Fotografenhinweis klären und, wenn möglich, das Original besorgen; das Ersetzen der Datei und ein neuer Build genügen, alle Ausschnitte folgen automatisch.
3. **Begrenzung** (Weg A oder B oben) und die Zahl überall gleichziehen. Ohne Entscheidung nicht posten.
4. **QR-Ziele prüfen:** `https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=wladbot&utm_content=w1` (und `w2`, `w3`). Die Codes lesen sich aus den gerenderten Bildern (LinkedIn-Fassungen, 1620, 1080 und 540 Pixel Breite) korrekt aus. Vor dem Posten einmal mit dem Handy scannen und bis zur Anmeldung durchklicken (`leaderos.de` war aus der Build-Umgebung nicht erreichbar, der Pfad ist derselbe wie bei den Landing-CTAs). Auf dem Handy scannt man das eigene Display nicht; deshalb steht der Link zusätzlich im ersten Kommentar.
5. **Reihenfolge und Takt:** Vorschlag W01, dann W03, dann W02 (erst der Fall, den alle kennen, dann der Kommentar-Köder, dann das Lehrstück). Beste Zeiten: 7:30 bis 8:30 Uhr oder 12:00 bis 13:00 Uhr.

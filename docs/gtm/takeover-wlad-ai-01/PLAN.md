# Takeover „WLAD AI übernimmt" · Plan vom 11.11. bis 25.11.2026

Stand 10.11.2026. WLAD AI ist der neue Name des KI-Coachs (bisher WladBot). 15 Tage lang
übernimmt WLAD AI Wlads Kanal: jeden Tag ein Feed-Post und fünf Stories, am Starttag acht.
Alles ist gebaut und liegt in diesem Ordner: das Karussell T01 für den Starttag, 78 Stories
für alle 15 Tage, die Captions und die Texte für die Nachrichten. Der Starttag erzählt, warum es
WLAD AI gibt, was in ihm steckt und was ihn von einem allgemeinen Chatbot unterscheidet.

| Datei | Inhalt |
|---|---|
| `T01-01.jpg` bis `T01-08.jpg`, `T01.pdf` | Karussell für den Starttag (Instagram als Bilder, LinkedIn als PDF) |
| `stories/D01-1.jpg` bis `stories/D15-5.jpg` | Stories je Tag, 1080×1920 |
| `stories/D00-1.jpg`, `stories/D00-2.jpg` | leere Antwort-Story für echte Fragen |
| `STORIES.md` | jede Story mit Text, Uhrzeit und dem Sticker, der in Instagram dazukommt |
| `CAPTIONS.md` | Captions für alle 15 Tage, Nachrichten zum Stichwort, Alt-Texte |

## Die Geschichte und die Positionierung

**Kernsatz:** WLAD AI ist der KI-Coach, in dem Wlads Methodik steckt: aus seinen Büchern, seinen
Kursen und der Erfahrung aus seinen Coachings. Er erklärt nicht nur, er trainiert.

Der Starttag erzählt das in vier Schritten (T01, Folien 1 bis 5, und die Stories 2 bis 4):

1. **Wer.** „Hallo. Ich bin WLAD AI." Auf der Titelfolie steht links Wlad, rechts die Figur im
   selben grünen Samtsakko.
2. **Warum.** Wlad coacht seit 2007, mit 400.000+ Klienten in 20+ Ländern. In jedem einzelnen
   Gespräch dabei sein kann er nicht. „Ich schon."
3. **Was drin ist.** Seine Bücher (3× SPIEGEL-Bestseller-Autor), elf Frameworks, die Erfahrung
   aus den Coachings. „Daraus stammt, was ich weiß."
4. **Was anders ist.** Eine allgemeine KI weiß von allem etwas. WLAD AI kennt eine Methodik ganz,
   fragt nach, bringt Einwände und trainiert am eigenen Fall: Drill, Simulation, Auswertung.

| Abgrenzung gegen | Aussage |
|---|---|
| allgemeine Chatbots | „weiß von allem etwas" gegen „kennt eine Methodik ganz" |
| Seminare | Wissen gegen Übung: „Dir fehlt nicht Wissen. Dir fehlt Übung." |
| Videokurse | zuschauen gegen üben am eigenen Fall |

**Der rote Faden über die 15 Tage:** Wo ein Werkzeug aus einem Buch stammt, zeigt die Antwort-Story
das echte Cover und nennt den Titel: „Weiße Rhetorik" an den Tagen 6, 11 und 13, „Die 5 Rollen einer
Führungskraft" am Tag 8, „Dunkle Rhetorik" am Tag 14. So sieht man immer wieder, woher das Wissen kommt.

**Belege und Grenzen**

- **Zahlen** nur aus dem verifizierten Set in `../WEBINAR_FUNNEL.md`: 400.000+ Klienten, 20+ Länder,
  3× SPIEGEL-Bestseller, seit 2007 im Coaching. Die Website nennt an einer Stelle „400 000 Coachings";
  hier steht die geprüfte Fassung „Klienten".
- **Bücher:** Gezeigt werden drei Titel aus `../WLAD_CANON.md`, zu denen der Canon auch die Frameworks
  führt. Welche Bücher vollständig in der Wissensbasis liegen, konnte ich nicht prüfen (die Datenbank
  war in dieser Sitzung nicht erreichbar). `docs/app/WLADBOT_OVERVIEW.md` nennt Bücher, Kurse,
  Vorträge, Podcast und Live-Trainings als Quellen. Deshalb steht dort „Daraus stammt, was ich weiß"
  und nicht „alle Bücher sind in mir". „Satanische Verhandlungskunst" und „The Manipulation Bible"
  aus dem Screenshot stehen nicht im Canon und kommen deshalb nicht vor.
- **„3× SPIEGEL-Bestseller-Autor"** steht so im Canon („Dreifacher SPIEGEL-Bestseller-Autor") und
  meint den Autor. Neben drei Covern kann man die Zeile als „diese drei Titel" lesen; als
  SPIEGEL-Bestseller markiert der Canon nur „Weiße Rhetorik". Wlad sollte bestätigen, dass die
  Zeile neben diesen Covern passt (T01, Folie 4, und Story `D01-4`).
- **Der Vergleich** nennt kein Produkt und wertet nicht ab: „weiß von allem etwas, antwortet, erklärt".

## Die Logik

1. **Ein Thema pro Tag.** Der Feed-Post und die Stories behandeln dasselbe Werkzeug aus Wlads
   Methodik. Wer nur die Story sieht, versteht sie; wer beides sieht, bekommt es zweimal.
   Zwei Tage verbinden Post und Stories über die Caption: Tag 11 (der Post zeigt, dass WLAD AI
   auch am Wochenende da ist, die Stories üben das Zuhören) und Tag 14 (der Post nennt den
   Grundsatz, die Stories zeigen ihn am Strohmann).
2. **Jeden Tag derselbe Ablauf.** Fall, Abstimmung, Antwort, Drill, Weiter. Nach drei Tagen
   kennen die Follower das Muster und warten auf die Auflösung.
3. **Eine einzige Handlung.** Das Stichwort **WLAD AI**, als Kommentar unter dem Post oder als
   Antwort auf die Story. Wer es schreibt, bekommt den Link zum 14-Tage-Test per Nachricht.
4. **Spannung über den Tag.** Morgens der Fall und die Abstimmung, mittags die Antwort. Dazwischen
   liegt die Zeit, in der man wissen will, ob man richtig lag.
5. **Ein Rückkanal.** An sieben Tagen fragt ein Fragen-Sticker nach dem eigenen Fall. Die
   Antworten darauf kommen am nächsten Tag als zusätzliche Story.
6. **Zählbar.** Jeder Tag hat einen eigenen `utm_content` (`d01` bis `d15`), die Kampagne heißt
   überall `wlad-ai`.

## Tagesablauf

| Uhrzeit | Was | Wozu |
|---|---|---|
| 07:30 | Story 1 und 2: Fall und Abstimmung | Frage stellen, bevor der Tag losgeht |
| 08:00 | Feed-Post | das Thema des Tages, mit dem Stichwort in der Caption |
| 12:30 | Story 3: Antwort | Auflösung in der Mittagspause |
| 18:00 | Story 4 und 5: Drill und Weiter | ein Satz zum Mitnehmen, dann Stichwort, Frage oder Link |
| laufend | Stichwort beantworten, Fragen aus dem Sticker sammeln | das Versprechen „du bekommst den Link" einlösen |

Der Starttag weicht ab: Er beginnt um 16:00 Uhr (Story), der Feed-Post folgt um 16:05, die letzte
Story um 20:30 (acht Stories, siehe `STORIES.md`). Folgen zwei Stories aufeinander, liegt die zweite
eine Minute später.

## Stand in Metricool (10.11.2026)

Alles liegt in der Metricool-Marke `wlad.argumentorik`, fest geplant, nicht als Entwurf: 100 Einträge.

| Was | Anzahl | Veröffentlichung |
|---|---|---|
| Feed-Posts Instagram | 15 | automatisch, Tag 1 um 16:05, sonst 08:00, Hashtags als erster Kommentar, Alt-Texte gesetzt |
| Stories ohne Sticker | 53 | automatisch |
| Stories mit Sticker | 25 | Erinnerung in der Metricool-App, von Hand in Instagram mit Sticker posten |
| LinkedIn-PDFs | 7 | automatisch, Tag 1 um 16:15, sonst 11:00 (laut Metricool die stärkste Stunde) |

- Wer die Stories mit Sticker postet, braucht die Metricool-App mit Mitteilungen. Bleibt eine
  Abstimmung aus, erscheint die Antwort um 12:30 trotzdem, dann ohne Frage davor.
- Die Agentur plant im selben Zeitraum eigene Reels, bisher am 11., 12., 14. und 16.11. zwischen
  16:15 und 17:16. Am Starttag läuft ihr Reel um 16:28, also 23 Minuten nach dem Start-Post.
- Sechs alte Entwürfe vom 08.11. mit dem Namen WladBot (16. bis 20.11.) sind mit den neuen
  Fassungen überschrieben. Löschen kann die Schnittstelle nichts; das geht nur im Planer.
- LinkedIn: Tag 1 hat einen eigenen Text (dort gibt es keine Stories und keine automatische
  Nachricht) und die Schlussfolie `T01-08-li.jpg`.
- Instagram hat nach Metricool abends zwischen 18 und 20 Uhr die meisten Follower online, morgens
  um 8 Uhr rund zwei Drittel davon. Der Feed-Post bleibt trotzdem morgens, weil die Antwort-Story
  um 12:30 an mehreren Tagen auf ihn verweist.

## Kalender

<!-- KALENDER:START -->
| Tag | Datum | Thema | Feed-Post | Stories | Sticker | Story am Schluss |
|---|---|---|---|---|---|---|
| 1 | Mi 11.11. | Übernahme | **T01** · WLAD AI übernimmt (Karussell, 8 Folien) | `D01-1` bis `D01-8` | Quiz, Fragen-Sticker | Stichwort |
| 2 | Do 12.11. | Feedbackformel | **IG-07** · Beobachtung. Wirkung. Wunsch. (Einzelbild) | `D02-1` bis `D02-5` | Quiz, Fragen-Sticker | Frage an WLAD AI |
| 3 | Fr 13.11. | Rückfrage-Technik | **W03** · Dein Chef sagt: „Dafür ist kein Budget da.“ (Karussell, 5 Folien) | `D03-1` bis `D03-5` | Quiz | Stichwort |
| 4 | Sa 14.11. | Charisma-Code | **IG-06** · Präsenz. Wärme. Kompetenz. (Einzelbild) | `D04-1` bis `D04-5` | Umfrage, Fragen-Sticker | Frage an WLAD AI |
| 5 | So 15.11. | Vorbereitung | **S01** · Kopiere diese 5 Prompts (Karussell, 8 Folien) | `D05-1` bis `D05-5` | Umfrage | Stichwort |
| 6 | Mo 16.11. | SEXIER-Modell | **W02** · WLAD AI zerlegt dein Argument (Karussell, 5 Folien) | `D06-1` bis `D06-5` | Quiz, Fragen-Sticker | Frage an WLAD AI |
| 7 | Di 17.11. | Vier Gesprächstypen | **S02** · Bevor du ins schwierige Gespräch gehst: 6 Fragen (Karussell, 9 Folien) | `D07-1` bis `D07-5` | Quiz, Beitrag teilen | Verweis auf den Post |
| 8 | Mi 18.11. | Fünf Rollen | **IG-11** · Du hast nicht eine Rolle. Du hast fünf. (Einzelbild) | `D08-1` bis `D08-5` | Quiz, Fragen-Sticker | Frage an WLAD AI |
| 9 | Do 19.11. | Das Interesse hinter dem Nein | **W01** · Dein Teamlead blockt jeden Vorschlag ab (Karussell, 5 Folien) | `D09-1` bis `D09-5` | Quiz | Stichwort |
| 10 | Fr 20.11. | LeaderOS | **S03** · Ein Coach, der um 23 Uhr noch antwortet (Karussell, 8 Folien) | `D10-1` bis `D10-5` | Umfrage, Link-Sticker | Link zum Test |
| 11 | Sa 21.11. | Zuhören | **IG-03** · Dein KI-Coach wartet nie bis Montag (Einzelbild) | `D11-1` bis `D11-5` | Umfrage, Fragen-Sticker | Frage an WLAD AI |
| 12 | So 22.11. | Rückfrage im Verkauf | **IG-10** · Aus dem Nein wird ein Weg (Einzelbild) | `D12-1` bis `D12-5` | Quiz | Stichwort |
| 13 | Mo 23.11. | SEXIER: der Einwand | **IG-02** · Ein Argument, sechs Schritte (Einzelbild) | `D13-1` bis `D13-5` | Umfrage, Fragen-Sticker | Frage an WLAD AI |
| 14 | Di 24.11. | Dunkle Rhetorik erkennen | **IG-04** · Hart in der Sache. Weich zur Person. (Einzelbild) | `D14-1` bis `D14-5` | Quiz | Stichwort |
| 15 | Mi 25.11. | Abschluss | **IG-12** · Das ist WLAD AI (Einzelbild) | `D15-1` bis `D15-5` | Umfrage, Link-Sticker | Link zum Test |
<!-- KALENDER:END -->

Reserve, falls ein Tag ausfällt oder getauscht wird: `../instagram-feed-01/IG-09.jpg` (Beta ist offen).
Bei den W-Karussells immer die Schlussfolie ohne Platzzahl nehmen (`W0x-05-ig-open.jpg`, auf LinkedIn
`W0x-open.pdf`). Bei den S-Karussells die Instagram-Schlussfolie (`S0x-0N-ig.jpg`).

## Das Stichwort

Jede Caption ruft dazu auf, **WLAD AI** zu kommentieren. An sechs Tagen (1, 3, 5, 9, 12, 14) tut
das auch die letzte Story des Tages. Der Ablauf:

1. Jemand kommentiert „WLAD AI" unter dem Post oder antwortet damit auf eine Story.
2. Er bekommt die Nachricht mit dem Link zum 14-Tage-Test (Text in `CAPTIONS.md`).
3. Unter dem Kommentar steht eine kurze öffentliche Antwort („Ist unterwegs.").

Das Versprechen „Ich schicke dir den Link" gilt für jeden einzelnen Kommentar und am selben Tag.
Bei einem Konto mit vielen Followern geht das nur mit einer Automatik für Kommentare und
Story-Antworten oder mit einer Person, die mehrmals am Tag antwortet. **Eingerichtet ist davon
nichts**; auf Wlads Konten habe ich keinen Zugriff. Auf LinkedIn gibt es keine automatische
Nachricht, dort steht der Link in der Antwort unter dem Kommentar.

## Antworten auf echte Fragen

Fragen-Sticker laufen an den Tagen 1, 2, 4, 6, 8, 11 und 13. Am Tag danach kommen eine bis drei
Antworten als zusätzliche Stories:

1. Frage aus den Sticker-Antworten auswählen.
2. Die Frage in LeaderOS an WLAD AI stellen und die Antwort auf zwei bis vier Sätze kürzen.
3. `stories/D00-1.jpg` oder `stories/D00-2.jpg` hochladen, die Sticker-Antwort über „Antwort teilen"
   einfügen und den Text in Instagram eintippen.

Tag 1 verspricht „Die Antworten kommen morgen in die Story". Tag 2 braucht deshalb mindestens
eine. Diese Antworten müssen aus dem Produkt kommen, nicht aus dem Kopf: Dort steht „WLAD AI
antwortet" über einer echten Frage.

## Regeln

- **Kein Webinar, keine Platzzahl, kein Termin** außer dem Ende der Übernahme am 25.11. Das gilt
  auch für Antworten auf Kommentare.
- **Zahlen nur aus dem verifizierten Set** (siehe oben), **Frameworks nur aus `../WLAD_CANON.md`:** Feedbackformel, Rückfrage-Technik, Charisma-Code,
  SEXIER-Modell, vier Gesprächstypen, fünf Rollen, zehn Stufen des Zuhörens, Dunkle Rhetorik,
  „hart in der Sache, weich zur Person". Techniken, die der Canon nur beim Namen nennt, sind
  nicht erklärt worden.
- **Kampagnentext, keine Mitschnitte:** Die Fälle, die Antwortsätze und die Ein-Satz-Erklärungen
  (zum Beispiel zu Präsenz, Wärme, Kompetenz) habe ich geschrieben. Es sind keine Zitate von
  Wlad und keine aufgezeichneten Antworten aus dem Produkt. Der Chat auf T01, Folie 6, ist als
  Beispiel gekennzeichnet.
- **WLAD AI ist als KI erkennbar:** im Namen, in der zweiten Story („Ich bin WLAD AI") und im
  Satz „Der KI-Coach mit Wlads Methodik".
- **Produktaussagen** nur zu dem, was der 14-Tage-Test enthält: Kurse, KI-Coach per Text und
  Stimme, Simulationen, tägliche Drills, elf Frameworks, ohne Karte.

## Zählen

Je Tag: Kommentare mit dem Stichwort, Story-Antworten mit dem Stichwort, Tipps auf Umfrage und
Quiz, eingegangene Fragen, Klicks auf den Link-Sticker (Tage 10 und 15). Anmeldungen laufen über
`utm_campaign=wlad-ai` und `utm_content=d01` bis `d15`; so sieht man, welcher Tag und welches
Thema trägt.

## Vor dem Start

1. **Freigabe durch Wlad.** Eine KI-Figur spricht 15 Tage lang auf seinem Konto, in der ersten
   Person. Er muss die Idee, die Texte und das Foto auf der Titelfolie freigeben.
2. **Der Name im Produkt.** In der App und auf der Website heißt der Coach weiter WladBot
   (frontend/src 284 Dateien, frontend/public 25, backend 125). Wer dem Link folgt, liest dort
   den alten Namen. Umbenannt sind bisher nur die Social-Vorlagen. Die Umstellung im Produkt ist
   eine eigene Änderung mit Deploy auf leaderos.de.
3. **Stichwort.** Automatik einrichten oder eine Person benennen (siehe oben).
4. **Bio-Link** auf den 14-Tage-Test stellen (Adresse in `CAPTIONS.md`).
5. **Anmeldung testen.** `https://leaderos.de/signup?trial=14` einmal durchlaufen; die Bilder
   sagen „ohne Karte".
6. **Sticker-Stories von Hand posten.** Umfrage, Quiz, Fragen- und Link-Sticker setzt man in der
   Instagram-App. Nach meinem Stand können Planungstools Stories nur ohne Sticker veröffentlichen;
   vor dem Planen im Tool prüfen.
7. **Highlight „WLAD AI"** anlegen und die Stories vom Starttag dort ablegen, damit neue Besucher
   die Vorstellung finden.
8. **Fotos und Buchcover.** T01, Folie 1, zeigt Wlads Porträt (500×500 Pixel, freigestellt), Folie 3
   und die Story `D01-3` das Foto aus einem Training (800×800), die Story `D01-1` das Bühnenfoto. Alle
   kamen über den Chat und sind klein. Nutzungsrecht und Fotografenhinweis klären, ebenso die
   Einwilligung der Teilnehmerin auf dem Trainingsfoto (sie ist von hinten zu sehen; eine zweite
   Person am linken Rand ist weggeschnitten). Mit den Originalen in voller Auflösung werden die Bilder
   schärfer (`../social-kit/src/` ersetzen, neu bauen). Die Buchcover stammen aus
   `frontend/public/wlad/books`. Drei weitere Fotos (Arena, Seminar, Vortrag) liegen aufbereitet im
   Social-Kit und sind noch nicht verwendet.
9. **Das Repository ist öffentlich.** Alle Bilder auf dem Branch sind über GitHub abrufbar, auch
   vor dem Posten.

## Dateien und Neu-Bauen

`days.js` ist die einzige Quelle für die Story-Texte. `stories.html` rendert daraus die Bilder,
`build_docs.cjs` schreibt daraus `STORIES.md` und den Kalender oben. `post.html` enthält das
Karussell, `tk.js` und `takeover.css` die gemeinsamen Bausteine (Wortmarke, Statuszeile,
Sticker-Zonen) zu `../social-kit`.

```
PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCss] [all|post|stories|d03]
/usr/bin/python3 -I ../linkedin-carousels-01/build_pdf.py .
node build_docs.cjs
```

`render.cjs` schreibt neben den Bildern die Vorschau mit eingezeichneten Sticker-Zonen nach
`_guide/` (nicht eingecheckt). Eine einzelne Story im Browser: `stories.html?d=3&s=2&guide=1`.

# LinkedIn-Karussell F01 · Fenster · LeaderOS-Teaser (fünf Folien)

Stand 04.11.2026. Folien `F01-01.jpg` bis `F01-05.jpg` (2160×2700, 4:5) und das
LinkedIn-Dokument `F01.pdf`. Das PDF ist das wischbare Karussell: mehrere
Einzelbilder zeigt LinkedIn als Raster, ein Dokument als Karussell. Dazu zwei
Varianten der letzten Folie: `F01-05-open.jpg` (ohne Platzzahl, siehe unten) und
`F01-05-ig.jpg` (Instagram, Link in der Bio statt im Kommentar).

**Idee:** Jede Folie hat ein eigenes Bild, und der Fokus wandert: Gesicht, Blick,
Hände, WladBot, alles. Der Rest des Bildes ist unscharf, dunkel und körnig und
wird von Folie zu Folie schärfer: je öfter wiederholt, desto klarer. Stil nach
der Vorlage „Fenster": scharfer Ausschnitt mit dünnem weißem Rahmen im
unscharfen s/w-Bild, Headline um das Fenster geteilt. **Kein Name auf den Folien**
(der Post kommt von Wlads Konto), keine Credentials, kein Termin.

**Bilder:** Einzelbilder aus dem echten Intro-Video
(`frontend/public/videos/wlad-intro.mp4`, 2560×1440), fünf verschiedene
Momente, abgelegt in `src/` (siehe `src/README.txt`). Keine erzeugten Gesichter.
Der WladBot erscheint mit seinem bestehenden Produkt-Avatar
(`frontend/public/wladbot-avatar-clean.png`), nicht als neues Bild.

**Quellen und Neu-Bauen:** `carousel.html` (Texte, Layout, WladBot-Oberfläche),
`build_assets.py` (Foto-Ebenen und QR-Code, Pillow + numpy + `qrcode`),
`render.cjs` (Playwright), PDF mit `../linkedin-carousels-01/build_pdf.py`.

```
PYTHONPATH=<dir mit qrcode> python3 build_assets.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs
python3 -I ../linkedin-carousels-01/build_pdf.py .
```

## Die fünf Folien

| # | Bild (Video) | Fokus | Text |
|---|---|---|---|
| 1 | ruhiger Blick | linke Gesichtshälfte, senkrechtes Fenster | Führung wird nicht gelernt. · Sie wird trainiert. · Nach dem Seminar ist vor dem Alltag. |
| 2 | Nahaufnahme, sprechend | der Blick, schmaler Streifen | Montag: alle motiviert. · Sechs Wochen später: alles beim Alten. · Nach dem Seminar wissen alle, was zu tun ist. Das Problem ist nicht das Wissen. Es hat nur niemand geübt. |
| 3 | Hände offen, Geste | die Hände, Streifen | Wie beim Sport: · Wiederholen. Am Ernstfall. Mit Feedback. · Niemand wird fit von einem Vortrag über Fitness. Führung auch nicht. |
| 4 | sprechend, Hände vor der Brust | der WladBot, Chat im Fenster | Training als System. · Das ist Leader·OS. · KI-Coach, der die Methodik kennt · Simulationen mit einem Gegenüber, das zurückredet · 15 Minuten am Tag, am Fall von morgen |
| 5 | freundlich, spricht in die Kamera | alles scharf | Beta. Kostenlos. 150 Plätze. · QR-Code · „aufnahme stoppt bei 150" · „oder Link im ersten Kommentar" |

Der Chat auf Folie 4 ist als „beispiel" gekennzeichnet und folgt der echten
Oberfläche (`FloatingWladBotDrawer.js`: dunkle Fläche, lime Nutzerblase,
Bot-Blase mit Rand, „Frag mich…", lime Senden-Taste). Die Antworten nennen nur
Canon-Inhalte: Feedbackformel (Beobachtung, Wirkung, Wunsch) und „hart in der
Sache, weich zur Person". Es ist kein Zitat von Wlad, sondern eine Beispiel-
Antwort des Bots.

Alle Aussagen stammen aus den freigegebenen Serien-Texten
(`../linkedin-wlad-01/CAPTIONS.md`, `../linkedin-carousels-01/CAPTIONS.md`) und
`docs/gtm/WLAD_CANON.md`. Auf den Folien steht keine Zahl außer den 15 Minuten
und den Plätzen auf Folie 5.

## Vor dem Posten: die Begrenzung muss echt sein

Folie 5 nennt **150 Plätze** und „aufnahme stoppt bei 150". Das stimmt nur, wenn
die Aufnahme technisch bei 150 stoppt (`docs/gtm/WEBINAR_FUNNEL.md`: keine
Fake-Scarcity). **Stand heute ist das nicht gebaut.** Der QR-Link führt in den
allgemeinen 14-Tage-Zugang (`/signup?trial=14`), der für alle offen ist und
nirgends gezählt wird. Zwei ehrliche Wege:

- **A · Begrenzung bauen, dann Folie 5 mit Zahl posten.** Zuerst festlegen, was
  die 150 zählen: ein eigener Beta-Zugang (zum Beispiel Anmeldungen über diesen
  Link), nicht der allgemeine Trial, sonst wäre der Webinar-Funnel nach 150
  Anmeldungen dicht. Dann ein atomarer Zähler (Mongo `find_one_and_update` mit
  `$lt`-Bedingung) in jedem Registrierungsweg (`/api/auth/register`, OAuth,
  Magic Link), ein Status-Endpunkt (`GET /api/beta/seats`) und ein „Beta ist
  voll"-Zustand auf der Signup-Seite. Danach Emergent-Deploy von `mvpcode`. Die
  Zahl steht in `SEATS` (`carousel.html`).
- **B · Heute ohne Begrenzung posten.** Folie 5 gegen `F01-05-open.jpg` tauschen
  (Headline „Beta. Kostenlos. Jetzt starten.", keine Zahl), das PDF mit
  `SEATS = 0` neu bauen, und in der Caption den markierten Absatz streichen.

**Angleichen:** LI-05 und die acht Karussells in `../linkedin-carousels-01`
(`SEATS` in `data.js`) nennen noch 50 Plätze. Es gibt nur eine Begrenzung, die
Zahl muss überall gleich sein, bevor etwas davon gepostet wird.

## Caption (Wlad, erste Person)

Führung wird nicht gelernt.
Sie wird trainiert.

Seit 2007 gebe ich Trainings, und ich kenne den Moment danach. Alle sind begeistert, alle nehmen sich etwas vor. Sechs Wochen später ist das Verhalten das alte.

Nicht, weil das Wissen fehlt. Weil niemand täglich übt.

Deshalb haben wir LeaderOS gebaut: meine Methodik als tägliches Training. Ein KI-Coach, der meine Frameworks kennt, Simulationen mit einem Gegenüber, das zurückredet, und jeden Tag 15 Minuten am Fall von morgen.

Die Beta ist kostenlos, für alle, die ein Team, ein Projekt oder ein Gespräch führen, mit oder ohne Titel. Auf dem letzten Bild ist der QR-Code, den Link findet ihr im ersten Kommentar.

[nur mit Begrenzung] Wir starten mit 150 Plätzen. Wenn sie vergeben sind, ist die Beta zu.

Welchen Fall würdest du als Erstes trainieren?

#Leadership #Führung #Training #LeaderOS

> Erster Kommentar: „LeaderOS Beta, kostenlos: https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=comment&utm_campaign=beta-fenster"

Instagram: dieselben Folien, letzte Folie `F01-05-ig.jpg`, Caption ohne
„erster Kommentar" und mit „Link in der Bio".

## Alt-Texte (LinkedIn, je Folie)

1. Schwarzweiß-Porträt eines Mannes in Großaufnahme, im Hintergrund unscharf. Ein senkrechtes, scharfes Fenster zeigt die linke Gesichtshälfte. Links davon steht „Führung wird nicht gelernt", rechts davon „Sie wird trainiert". Unten links: „Nach dem Seminar ist vor dem Alltag", unten rechts das Zeichen von LeaderOS.
2. Dasselbe Gesicht als Nahaufnahme, unscharf. Ein schmaler, scharfer Streifen zeigt nur die Augen. Darüber: „Montag: alle motiviert". Darunter: „Sechs Wochen später: alles beim Alten". Ganz unten: „Nach dem Seminar wissen alle, was zu tun ist. Das Problem ist nicht das Wissen. Es hat nur niemand geübt."
3. Der Mann gestikuliert mit beiden Händen, das Bild ist unscharf. Ein scharfer Streifen zeigt die Hände. Oben rechts: „Wie beim Sport". Darunter links: „Wiederholen. Am Ernstfall. Mit Feedback." Ganz unten: „Niemand wird fit von einem Vortrag über Fitness. Führung auch nicht."
4. Der Mann im unscharfen Hintergrund. Im scharfen Fenster steht eine Chat-Oberfläche des WladBot mit einer Beispiel-Frage („Mein Teamlead blockt jeden Vorschlag ab. Was sage ich?") und einer Antwort zur Feedbackformel. Links: „Training als System", rechts: „Das ist LeaderOS". Unten drei Zeilen: KI-Coach, der die Methodik kennt. Simulationen mit einem Gegenüber, das zurückredet. 15 Minuten am Tag, am Fall von morgen.
5. Das Porträt jetzt ganz scharf, der Mann spricht in die Kamera. Links der Text „Beta. Kostenlos. 150 Plätze." mit 150 grünen Kästchen und dem Hinweis, dass die Aufnahme bei 150 stoppt. Rechts ein QR-Code zum Beta-Zugang. Unten links das Zeichen von LeaderOS. (Variante ohne Begrenzung: „Beta. Kostenlos. Jetzt starten.", ohne Kästchen.)

## Offene Punkte

1. **Freigabe durch Wlad** (Mail): Bilder und Caption, auch die Beispiel-Antworten des WladBot auf Folie 4.
2. **Begrenzung** (Weg A oder B oben) und die Zahl überall gleichziehen. Ohne Entscheidung nicht posten.
3. **QR-Ziel prüfen:** `https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=beta-fenster`. Der Code liest sich aus dem gerenderten Bild bis 400 Pixel Breite korrekt aus. Vor dem Posten einmal mit dem Handy scannen und bis zur Anmeldung durchklicken (`leaderos.de` war aus der Build-Umgebung nicht erreichbar, der Pfad ist derselbe wie bei den Landing-CTAs). Auf dem Handy scannt man das eigene Display nicht; deshalb steht der Link zusätzlich im ersten Kommentar.
4. **Takt:** nicht in `../linkedin-carousels-01/SCHEDULE.json` eingetragen, die Zernio-Konten sind noch nicht verbunden. Beste Zeiten: 7:30 bis 8:30 Uhr oder 12:00 bis 13:00 Uhr.

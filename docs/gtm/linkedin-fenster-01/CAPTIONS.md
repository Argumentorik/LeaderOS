# LinkedIn-Karussell F01 · Fenster · LeaderOS-Teaser (fünf Folien)

Stand 04.11.2026. Folien `F01-01.jpg` bis `F01-05.jpg` (2160×2700, 4:5) und das
LinkedIn-Dokument `F01.pdf`. Das PDF ist das wischbare Karussell: mehrere
Einzelbilder zeigt LinkedIn als Raster, ein Dokument als Karussell. Dazu zwei
Varianten der letzten Folie: `F01-05-open.jpg` (ohne Platzzahl, siehe unten) und
`F01-05-ig.jpg` (Instagram, Link in der Bio statt im Kommentar).

**Idee:** Ein Portrait, fünfmal. Auf den Folien 1 bis 4 liegt ein scharfes,
senkrechtes Fenster über der linken Gesichtshälfte, der Rest ist unscharf,
dunkel und körnig und wird von Folie zu Folie klarer: je öfter wiederholt,
desto schärfer. Folie 5 zeigt das ganze Bild scharf, mit QR-Code. Stil nach der
Vorlage „Fenster": unscharfes s/w-Gesicht, scharfes Fenster mit dünnem weißem
Rahmen, Headline links und rechts davon geteilt. **Kein Name auf den Folien**
(der Post kommt von Wlads Konto), keine Credentials, kein Termin.

**Quellen und Neu-Bauen:** `carousel.html` (Texte, Layout), `build_assets.py`
(Foto-Ebenen und QR-Code, Pillow + numpy + `qrcode`), `render.cjs` (Playwright),
PDF mit `../linkedin-carousels-01/build_pdf.py`.

```
PYTHONPATH=<dir mit qrcode> python3 build_assets.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs
python3 -I ../linkedin-carousels-01/build_pdf.py .
```

## Die fünf Folien

| # | Links vom Fenster | Rechts vom Fenster | Unten |
|---|---|---|---|
| 1 | Führung wird nicht gelernt. | Sie wird trainiert. | Nach dem Seminar ist vor dem Alltag. · Marke |
| 2 | Montag: alle motiviert. | Sechs Wochen später: alles beim Alten. | Nach dem Seminar wissen alle, was zu tun ist. Das Problem ist nicht das Wissen. Es hat nur niemand geübt. |
| 3 | Wie beim Sport: | Wiederholen. Am Ernstfall. Mit Feedback. | Niemand wird fit von einem Vortrag über Fitness. Führung ist eine Fähigkeit, und Fähigkeiten entstehen durch Training. |
| 4 | Training als System. | Das ist Leader·OS. | KI-Coach, der die Methodik kennt · Simulationen mit einem Gegenüber, das zurückredet · 15 Minuten am Tag, am Fall von morgen |
| 5 | Beta. Kostenlos. 50 Plätze. | QR-Code, „scannen · beta starten" | 50 Kästchen, „50 plätze insgesamt · aufnahme stoppt bei 50" · „oder Link im ersten Kommentar" · Marke |

Alle Aussagen stammen aus den freigegebenen Serien-Texten
(`../linkedin-wlad-01/CAPTIONS.md`, `../linkedin-carousels-01/CAPTIONS.md`) und
`docs/gtm/WLAD_CANON.md`. Auf den Folien steht keine Zahl außer den 15 Minuten
und den Plätzen auf Folie 5.

## Vor dem Posten: die Begrenzung muss echt sein

Folie 5 nennt 50 Plätze und „aufnahme stoppt bei 50". Das stimmt nur, wenn die
Aufnahme technisch bei 50 stoppt (`docs/gtm/WEBINAR_FUNNEL.md`: keine
Fake-Scarcity). **Stand heute ist das nicht gebaut.** Der QR-Link führt in den
allgemeinen 14-Tage-Zugang (`/signup?trial=14`), der für alle offen ist und
nirgends gezählt wird. Zwei ehrliche Wege:

- **A · Begrenzung bauen, dann Folie 5 mit Zahl posten.** Atomarer Zähler
  (Mongo `find_one_and_update` mit `$lt`-Bedingung), in jedem Registrierungsweg
  (`/api/auth/register`, OAuth, Magic Link), ein Status-Endpunkt
  (`GET /api/beta/seats`) und ein „Beta ist voll"-Zustand auf der Signup-Seite.
  Danach Emergent-Deploy von `mvpcode`. Die Zahl steht in `SEATS`
  (`carousel.html`, identisch mit `../linkedin-carousels-01/data.js`).
- **B · Heute ohne Begrenzung posten.** Folie 5 gegen `F01-05-open.jpg` tauschen
  (Headline „Beta. Kostenlos. Jetzt starten.", keine Zahl), das PDF mit
  `SEATS = 0` neu bauen, und in der Caption den markierten Absatz streichen.

## Caption (Wlad, erste Person)

Führung wird nicht gelernt.
Sie wird trainiert.

Seit 2007 gebe ich Trainings, und ich kenne den Moment danach. Alle sind begeistert, alle nehmen sich etwas vor. Sechs Wochen später ist das Verhalten das alte.

Nicht, weil das Wissen fehlt. Weil niemand täglich übt.

Deshalb haben wir LeaderOS gebaut: meine Methodik als tägliches Training. Ein KI-Coach, der meine Frameworks kennt, Simulationen mit einem Gegenüber, das zurückredet, und jeden Tag 15 Minuten am Fall von morgen.

Die Beta ist kostenlos, für alle, die ein Team, ein Projekt oder ein Gespräch führen, mit oder ohne Titel. Auf dem letzten Bild ist der QR-Code, den Link findet ihr im ersten Kommentar.

[nur mit Begrenzung] Wir starten mit 50 Plätzen. Wenn sie vergeben sind, ist die Beta zu.

Welchen Fall würdest du als Erstes trainieren?

#Leadership #Führung #Training #LeaderOS

> Erster Kommentar: „LeaderOS Beta, kostenlos: https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=comment&utm_campaign=beta-fenster"

Instagram: dieselben Folien, letzte Folie `F01-05-ig.jpg`, Caption ohne
„erster Kommentar" und mit „Link in der Bio".

## Alt-Texte (LinkedIn, je Folie)

1. Schwarzweiß-Portrait eines Mannes im Sakko. Die rechte Gesichtshälfte ist dunkel und unscharf, ein senkrechtes Fenster zeigt die linke Hälfte scharf. Links davon steht „Führung wird nicht gelernt", rechts davon „Sie wird trainiert". Unten links: „Nach dem Seminar ist vor dem Alltag", unten rechts das Zeichen von LeaderOS.
2. Dasselbe Portrait, der Hintergrund etwas schärfer. Links vom Fenster: „Montag: alle motiviert". Rechts: „Sechs Wochen später: alles beim Alten". Darunter: „Nach dem Seminar wissen alle, was zu tun ist. Das Problem ist nicht das Wissen. Es hat nur niemand geübt."
3. Das Portrait noch schärfer. Links: „Wie beim Sport". Rechts: „Wiederholen. Am Ernstfall. Mit Feedback." Darunter: „Niemand wird fit von einem Vortrag über Fitness. Führung ist eine Fähigkeit, und Fähigkeiten entstehen durch Training."
4. Das Portrait fast ganz scharf. Links: „Training als System". Rechts: „Das ist LeaderOS". Darunter drei Zeilen: KI-Coach, der die Methodik kennt. Simulationen mit einem Gegenüber, das zurückredet. 15 Minuten am Tag, am Fall von morgen.
5. Das Portrait ganz scharf. Links der Text „Beta. Kostenlos. 50 Plätze." mit 50 grünen Kästchen und dem Hinweis, dass die Aufnahme bei 50 stoppt. Rechts ein QR-Code zum Beta-Zugang. Unten links das Zeichen von LeaderOS. (Variante ohne Begrenzung: „Beta. Kostenlos. Jetzt starten.", ohne Kästchen.)

## Offene Punkte

1. **Freigabe durch Wlad** (Mail): Bilder und Caption.
2. **Begrenzung** (Weg A oder B oben). Ohne Entscheidung nicht posten.
3. **QR-Ziel prüfen:** `https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=beta-fenster`. Der Code liest sich aus dem gerenderten Bild bis 400 Pixel Breite korrekt aus. Vor dem Posten einmal mit dem Handy scannen und bis zur Anmeldung durchklicken (`leaderos.de` war aus der Build-Umgebung nicht erreichbar, der Pfad ist derselbe wie bei den Landing-CTAs). Auf dem Handy scannt man das eigene Display nicht; deshalb steht der Link zusätzlich im ersten Kommentar.
4. **Foto:** `frontend/public/wlad/wlad-portrait.jpg` hat nur 1376×768 Pixel, das Gesicht ist darin gut 170 Pixel breit. Ein Originalportrait in voller Auflösung macht Fenster und Folie 5 deutlich klarer (`SRC` und die Ausschnitte `BOX_A`/`BOX_B` in `build_assets.py` anpassen, neu rendern).
5. **Takt:** nicht in `../linkedin-carousels-01/SCHEDULE.json` eingetragen, die Zernio-Konten sind noch nicht verbunden. Beste Zeiten: 7:30 bis 8:30 Uhr oder 12:00 bis 13:00 Uhr.

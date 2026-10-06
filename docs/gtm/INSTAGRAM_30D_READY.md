# Instagram · 30 Tage ready to post · ab 10. Oktober 2026

Stand 6. Oktober. Alles gerendert, geprüft, als Zeitplan exportiert. Start
Freitag, 10. Oktober, 08:00 Uhr, letzter geplanter Feed-Post Samstag,
8. November. Danach läuft der Wochenrhythmus aus `INSTAGRAM_30_DAY_PLAN.md`
weiter, gefüttert aus Wlads YouTube-Folgen.

## Der Look (ein Stil, sechs Cover-Typen)

Der Feed wechselt als Schachbrett zwischen hell und dunkel, damit das
Profil strahlt statt zu versinken: ungerade Posts auf warmem Papier
(Creme), gerade Posts auf dunklem Foto oder Studio. Sechs Cover-Typen
rotieren: Paper mit Fotofenster und großer Serif-Nummer (01, 09), Typo-
Specimen mit Riesenwort („363“, „SEXIER“: 07, 11), Diagnose-HUD mit
Mono-Readout und Suchrahmen (03 hell, 10 dunkel), Pass Card mit
Framework-Spezifikation und Barcode (05), warmes Foto (02, 06), Avatar
im Studio (04, 08, 12). Innen bleibt jedes Carousel dunkel, bis auf die
Prinzip-Slide, die hell ist. Die Reihenfolge steht in `premium.html`
(`COVER`-Array) und ist je Post austauschbar.

Dunkel, warm, teuer. Editorial-Fotos mit Film-Grading (Sepia-Anteil,
reduzierte Sättigung, angehobener Kontrast), weiches Jalousien-Licht von
oben rechts, feine Hairlines statt Kästen, Inter 600 für Headlines,
Instrument Serif Italic für den Akzent, Mono-Kicker in Lime, ein
Lime-Tag als einziger Farbfleck. Kein Lime-Vollflächen-Slide mehr, keine
gefüllten Karten. Chrome auf jedem Slide: `LEADER·OS` links, Claim in
Serif mittig, `@wlad.jachtchenko` rechts, Wlads Porträt mit Name unten
links, Wischen oder CTA-Unterstreichung unten rechts.

Quelle: `social-creatives-30/instagram-12/premium.html` plus
`premium.css`, Daten in `data-ig.js`, `data-a.js`, `data-b.js`. Rendern
mit `render_premium.cjs` (Playwright, 1080 × 1350 und 1080 × 1920).

## Was fertig ist (188 Bilder)

| Set | Dateien | Inhalt |
| --- | --- | --- |
| 12 Carousels | `P01-01.png` … `P12-08.png` (96) | Die zwölf Framework-Posts aus `INSTAGRAM_LAUNCH_12.md`, 8 Slides je Post |
| 30 Singles A | `A01.png` … `A30.png` | Paradigmenwechsel, Realität, Frameworks, LeaderOS, Webinar (Set aus `SOCIAL_CREATIVES_30.md`) |
| 30 Singles B | `B01.png` … `B30.png` | „Alles ändert sich“, Kurse, Events, Paradigmenwechsel (Set B) |
| 30 Stories | `ST01.png` … `ST30.png` (9:16) | 12 Prinzip-Slides der Carousels plus 18 Statements aus Set A |
| 2 Hero | `AVATAR-profile-4x5.png`, `AVATAR-profile-9x16.png` | WladBot-Avatar mit schwebender Profilkarte (1.643 Beiträge, 77,8K Follower, Bio, Folgen-Button) für Launch-Post und Story |

Dazu `feed-grid-12.jpg` (Feed nach Post 12), `sheet-P01.jpg` …
`sheet-P12.jpg`, `sheet-A-30.jpg`, `sheet-B-30.jpg`, `sheet-stories-30.jpg`
und `schedule-30d.csv`.

## Der Zeitplan (`schedule-30d.csv`)

Eine Zeile pro Veröffentlichung, Postproxy-tauglich: `date, time, platform,
type, slot, post_id, files, caption, first_comment, link, status`. Feed
täglich 08:00, Story täglich 08:10. Hashtags stehen in `first_comment`
(Basis-Set plus Themen-Tags), nicht in der Caption. `status` ist `draft`,
bis Wlad freigegeben hat.

| Tage | Feed |
| --- | --- |
| 10.10. bis 21.10. | Carousel 01 bis 12 (Framework-Serie, täglich) |
| 22.10. bis 08.11. | 18 Singles, abwechselnd Set A und Set B: Paradigmenwechsel, Realität, Frameworks, Webinar-Woche vor dem 29.10., danach LeaderOS |
| täglich | eine Story: erst die zwölf Prinzip-Slides, dann 18 Statements |

Launch-Story am 10.10. zusätzlich: `AVATAR-profile-9x16.png` mit
Link-Sticker auf `leader-os.de/kurse`. Der 4:5-Hero geht als Feed-Post am
9. Oktober abends („morgen geht es los“) oder als Pinned Post.

Nicht eingeplant, als Reserve für Reaktionen auf Kommentare: 14 Singles
aus A (die Webinar-Serie A25 bis A30 gehört in die Woche vor dem 29.10.
und ist eingeplant) und 16 Singles aus B.

## Postproxy-Anbindung

1. Profil `wlad.jachtchenko` in Postproxy verbinden (Instagram Business,
   Meta-Login durch Wlad oder Max).
2. Zips entpacken, Bilder in einen Ordner `ig-2026-10`.
3. `schedule-30d.csv` importieren oder Zeile für Zeile anlegen: Carousel =
   mehrere `files` in Reihenfolge, Caption aus `caption`, erster Kommentar
   aus `first_comment`.
4. Alles als Entwurf anlegen, Freigabe durch Wlad bis 9. Oktober, dann
   Status auf geplant.
5. Nach dem ersten Post prüfen: Reihenfolge der Slides, Umbrüche der
   Caption, Hashtag-Kommentar sichtbar.

## Freigabe durch Wlad

Google Doc „LeaderOS · Instagram-Start 10.10. · Freigabe der ersten 12
Posts“ (geteilt mit wj@argumentorik.com als Bearbeiter) enthält alle
Captions mit einer Antwortzeile pro Post und die sechs offenen Fragen
(Themen aus seinen Folgen, Zahlen, Avatar-Stimme, Rollenspiel-Reels,
Rohdateien, Montagsrunde). Der Mail-Entwurf dazu liegt in
`EMAIL_WLAD_INSTAGRAM_START.md` und wird gesendet, sobald das Postfach
wieder verbunden ist.

## Was noch von Hand passiert

- Bio-Link auf `leader-os.de/kurse` setzen, Bio-Zeile: „Führung wird nicht
  gelernt. Sie wird trainiert. · KI-Coach WladBot · 6 Kurse · 11 Drills ·
  Webinar 29.10.“
- Highlights anlegen: Frameworks, Webinar, LeaderOS.
- Die 1.643 bestehenden Posts bleiben. Der neue Look beginnt mit Post 01;
  kein Löschen alter Beiträge.

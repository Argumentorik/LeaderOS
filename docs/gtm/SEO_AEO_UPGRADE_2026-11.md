# SEO und AEO Upgrade · 02.11.2026

Auslöser: Die Seiten bekommen zu wenige Aufrufe. Dieses Dokument hält fest, was
gefunden wurde, was im Code behoben ist und was nur im Dashboard oder auf den
Kanälen selbst geht. Grundlage bleibt `SEO_AEO_GEO_AUDIT.md` (05.10.2026) und
`SEO_AEO_PLAYBOOK.md`. Alle Fakten stammen aus `WLAD_CANON.md`.

Nicht prüfbar aus der Entwicklungsumgebung: YouTube, Instagram, TED und
Wikipedia sind dort gesperrt. Alles, was diese Seiten betrifft, ist unten als
„zu prüfen“ markiert.

---

## 1. Was die Aufrufe bremst, nach Wirkung sortiert

| # | Befund | Beleg | Stand |
| --- | --- | --- | --- |
| 1 | **Der Apex leitet auf `www` weiter, aber alle Canonicals, Sitemaps, Anzeigen und Posts nennen den Apex.** Google sieht „Seite mit Weiterleitung“ und indexiert die Ziel-URL nicht. | Live-Abruf am 02.11.2026: `https://leader-os.de/wlad-jachtchenko` antwortet 308 mit `location: https://www.leader-os.de/wlad-jachtchenko`. Vercel: `leader-os.de` hat `redirect: www.leader-os.de`. Im August war derselbe Fehler für 147 von 153 Artikeln verantwortlich (80 als „Seite mit Weiterleitung“, 67 nie gecrawlt, siehe `scripts/check-canonical-host.mjs`). | **Am 04.11.2026 umgestellt:** `leader-os.de` hat keinen Redirect mehr und liefert direkt 200 (Vercel-Domainliste und Workflow `canonical-host` bestätigen es, der Lauf vom 03.11. war noch rot). `www.leader-os.de` liefert ebenfalls noch 200 statt 308 auf den Apex, siehe §3. |
| 2 | `/kurse-uebersicht/` und die statische Wlad-Seite hatten Canonical, `og:url`, hreflang und alle JSON-LD-`@id`s auf `leaderos.de` (die App) und einen Skript-Block, der auf jedem anderen Host `noindex, nofollow` setzt. Auf `leader-os.de` war die Kursübersicht damit für Google unindexierbar. | Live-Abruf `https://www.leader-os.de/kurse-uebersicht/`. | **Behoben.** Generator `backend/scripts_seo_pages.py` zeigt auf `leader-os.de`, beide Seiten neu erzeugt. Preis-Offers zeigen auf `/leadership-programm`. |
| 3 | Die Sitemap listete `/login` (leitet auf die App weiter), `/kommunikation` und `/training` (beide `noindex`) und `/event` (widersprüchlicher Termin). Alle `lastmod`-Werte waren alt. | `sitemap.xml` | **Behoben.** 22 saubere URLs, `lastmod` aus der Git-Historie. |
| 4 | Die SPA-Hülle (`index.html`) enthielt für Antwort-Crawler nur den Satz „Diese Anwendung benötigt JavaScript“. GPTBot, ClaudeBot und PerplexityBot führen kein JavaScript aus und sahen auf `/`, `/fuehrung-beginnt-hier` und jeder nicht vorgerenderten Route nichts. | `public/index.html` | **Entschärft.** Neuer `<noscript>`-Block mit Kurzbeschreibung und Links auf die wichtigsten Seiten (ohne Termine und Preise, damit er nie veraltet). Vollständig gelöst nur durch Prerender dieser Seiten (§4). |
| 5 | Zwei Entitäten für Wlad: die Wlad-Seite hängte ihr Person-Schema an `…/wlad-jachtchenko#person`, alles andere an `…/#wlad`. | `WladJachtchenkoPage.js` | **Behoben**, eine `@id`. |
| 6 | `VideoObject` auf der Wlad-Seite zeigte auf eine Kanal-Startseite, eine Veranstalter-Startseite und trug ein Platzhalter-Datum. | `WladJachtchenkoPage.js` | **Behoben.** Nur das TED-Video mit belegter URL bleibt. Weitere Videos erst mit echter YouTube-ID (§5). |
| 7 | `/event`: Text sagt 29.–30.10., Countdown und Titel sagen 26.11., das Event-Schema endet vor seinem Start. | `EventPage.js` | **Auf `noindex, follow`**, aus der Sitemap. Entscheidung offen: umleiten auf `/webinar` oder neu terminieren. |
| 8 | Falscher Kanal im Entity-Graph: `sameAs` nannte `youtube.com/@WladTraining`, Instagram fehlte im Shell-Schema. | `index.html`, `seo.js`, `wladProfile.js` | **Behoben.** `youtube.com/@wlad.jachtchenko` und `instagram.com/wlad.jachtchenko/` in allen Schemas, `llms.txt` und den Footern (`rel="me"`). |

## 2. Im Code geändert

- `frontend/public/index.html`: `sameAs` (Organisation, Person), `<noscript>`-Navigation.
- `frontend/public/kurse-uebersicht/index.html`, `wlad-jachtchenko/index.html`: aus dem Generator neu erzeugt.
- `backend/scripts_seo_pages.py`: `ORIGIN` auf `leader-os.de`, Guard-Skript erlaubt beide Hosts, Kanal-Links. **Nicht als Ganzes ausführen**: `__main__` überschreibt auch die von Hand gepflegten `fragen/index.html` und `sitemap.xml`. Einzelne Seiten per Import erzeugen.
- `frontend/public/fragen`, `kurse`: Footer-Links zu YouTube und Instagram.
- `frontend/src/components/landing/LandingFooter.js`: YouTube und Instagram in der Firmenspalte.
- `frontend/src/features/content/utils/seo.js`, `src/data/wladProfile.js`, `src/pages/WladJachtchenkoPage.js`: `sameAs`, `@id`, `VideoObject`.
- `frontend/public/sitemap.xml`, `sitemap-index.xml`: bereinigt.
- `frontend/public/llms.txt`: Kanäle ergänzt, die beiden `noindex`-Landings entfernt, „Europas führender Argumentations-Coach“ durch eine Formulierung aus dem Canon ersetzt.
- `frontend/src/pages/EventPage.js`: `noindex, follow`.

## 3. Was nur du tun kannst, in dieser Reihenfolge

1. **Domain-Flip in Vercel. Erledigt am 04.11.2026 für den Apex; offen ist der Redirect von `www`.** Projekt `leaderos` → Settings → Domains.
   - `leader-os.de`: Edit, Redirect entfernen (Production zuweisen).
   - `www.leader-os.de`: Edit, Redirect auf `leader-os.de`, Status 308. **Noch zu setzen**, `www` antwortet am 04.11.2026 noch mit 200.
   - Prüfen: `curl -sI https://leader-os.de/wlad-jachtchenko` gibt 200. `curl -sI https://www.leader-os.de/wlad-jachtchenko` gibt 308 auf den Apex. Der tägliche Workflow `canonical-host` wird grün.
   - Nebenwirkung: Wer bisher über `www` kam, bekommt einmal ein neues Consent-Banner und eine neue anonyme PostHog-ID, weil `localStorage` je Host getrennt ist.
2. **Nach dem Deploy**, Google Search Console: Sitemap `sitemap-index.xml` neu einreichen. URL-Prüfung und „Indexierung beantragen“ für `/`, `/webinar`, `/wlad-jachtchenko`, `/kurse`, `/fragen`, `/kurse-uebersicht/`. Bericht „Seiten“: „Seite mit Weiterleitung“ öffnen und „Fehlerbehebung validieren“.
3. **Bing Webmaster Tools** verifizieren und Sitemap einreichen. ChatGPT-Suche, Copilot und DuckDuckGo hängen am Bing-Index. Der Workflow `indexnow` meldet geänderte URLs automatisch.
4. **Monatlicher Antwort-Test**: In ChatGPT, Perplexity, Claude, Gemini und Copilot fragen: „Wer ist Wlad Jachtchenko?“, „Was ist das SEXIER-Modell?“, „Welche Kurse hat LeaderOS?“, „Wie funktioniert die Feedbackformel B·W·W?“. Festhalten, ob wir zitiert werden und ob die Definition stimmt.
5. **Zu prüfen, weil von hier nicht erreichbar**: Gibt es `youtube.com/@WladTraining` und gehört er zu Wlad? Existiert `de.wikipedia.org/wiki/Wladislaw_Jachtchenko` (steht in `sameAs`)? Stimmt der TED-Link in `WladJachtchenkoPage.js`? Ist `@WladTraining` ein X-Konto (steht als `twitter:site`)? Falsche `sameAs`-Einträge schaden dem Entity-Abgleich mehr als fehlende.

## 4. Nächste Code-Schritte, nach Hebel

1. `/fuehrung-beginnt-hier` und die Startseite vorrendern wie `/webinar` (`scripts/prerender-landings.mjs`). Beide haben heute keinen Text im rohen HTML.
2. Pro Artikel drei Frage-Antwort-Blöcke (`faq`-Block), beginnend mit den 50 Ziel-URLs aus `SEO_KEYWORDS.md`. Antwort unter 50 Wörtern, erster Satz ist die Antwort.
3. Statische Kurzseite je Framework (SEXIER, Feedbackformel, 10 Stufen des Zuhörens, 5 Rollen, Charisma-Code) mit der kanonischen Definition aus `llms.txt`. Das sind die Sätze, die Antwort-Maschinen zitieren.
4. Google-Fonts selbst hosten (Render-Blocker und Datenschutz). Die Startseite ist auf dem Handy rund 64.000 px lang, die Largest-Contentful-Paint-Zeit gehört in PageSpeed Insights gemessen.
5. `kommunikation` und `training` bleiben `noindex`. Soll `/kommunikation` ranken („Rhetorik Training Führungskräfte“), braucht es eine indexierbare, vorgerenderte Variante und ein Entscheid, dass sie nicht mit `/webinar` konkurriert.

## 5. YouTube und Instagram

Die Kanäle sind zusätzliche Einstiege in Googles Video-Treffer und in KI-Antworten. Von der Seite aus sind sie jetzt verknüpft (Schema, Footer, `llms.txt`). Es fehlen der Rückweg von den Kanälen und die Video-Daten.

**YouTube**
- Titel: Frage oder Ergebnis zuerst, Name zuletzt. Beispiel: „Wie führe ich ein schwieriges Gespräch? Die Feedbackformel B·W·W | Wlad Jachtchenko“.
- Beschreibung, erste zwei Zeilen: Antwort in einem Satz und die passende Seite als volle URL. Danach Kapitel mit Zeitmarken, die kanonische Framework-Definition aus `WLAD_CANON.md`, dann Links auf `https://leader-os.de/webinar` und `https://leader-os.de/fuehrung-beginnt-hier`.
- Kapitel in jedem Video. Sie erzeugen Google-Schlüsselmomente und zitierbare Abschnitte.
- Playlists je Framework (SEXIER, Feedbackformel, Zuhören, 5 Rollen, KI-Führung). Ein angehefteter Kommentar mit dem Link auf die Seite.
- Deutsche Untertitel hochladen und korrigieren. Das Transkript steht dann auch als Text auf der passenden Seite.
- Kanalbeschreibung: ein Satz mit Name und Thema, dazu Links auf `leader-os.de`, Instagram und LinkedIn. Als hervorgehobenes Video die Webinar- oder Demo-Aufnahme (`YOUTUBE_PLAN_2026-11.md`).
- **Blockiert**: `VideoObject`-Schema und Video-Sitemap brauchen je Video ID, Datum und Dauer. Entweder eine Liste aus YouTube Studio liefern oder in den Netzwerk-Einstellungen der Sitzung `www.youtube.com` freigeben.

**Instagram**
- Namensfeld mit Suchbegriff: „Wlad Jachtchenko | Führung und Rhetorik“. Das Feld ist durchsuchbar.
- Bio: eine Zeile, was Nutzen bringt, plus ein Link auf `/fuehrung-beginnt-hier` oder `/webinar` mit UTM.
- Alt-Text bei jedem Beitrag. Instagram indexiert ihn.
- Untertitel: Frage zuerst, drei bis fünf Hashtags, keine Hashtag-Wand.
- Drei angeheftete Beiträge: Webinar, Gratis-Serie, ein Framework.
- Karussells werden gespeichert und geteilt, beides zählt. Die Serie in `docs/gtm/linkedin-carousels-01/` ist dafür gebaut.

## 6. Messung

Vor dem Flip festhalten und wöchentlich vergleichen: indexierte Seiten in der Search Console (Ziel: alle 22 Seiten und 173 Artikel), Impressionen und Klicks, Anteil „Seite mit Weiterleitung“, Bing-Index, Antwort-Test aus §3. Ohne Ausgangswerte lässt sich die Wirkung nicht belegen.

## 7. Entscheidungen, die bei dir liegen

- **`/event`**: umleiten auf `/webinar` (Vorschlag, eine Zeile in `vercel.json`) oder neu terminieren. Bis dahin `noindex`.
- **Aussagen ohne Eintrag im Canon**, die Antwort-Maschinen als Fakt wiederholen: „Europas führender Argumentations-Coach“ (Shell-Schema, Artikel-Autor, Wlad-Seite, Gratis-Serie, `/event`), „TEDx (3×)“ und Debating-Titel (Wlad-Seite), „13 Bücher“ (Startseite, `/training`, Gratis-Serie; der Canon kennt zehn Titel). Entweder in `WLAD_CANON.md` belegen oder auf den Seiten und im Schema ersetzen.
- **`/kommunikation` und `/training`** bleiben `noindex`, weil sie reine Anzeigenseiten sind. Soll `/kommunikation` über die Suche kommen, braucht es eine indexierbare Variante (§4, Punkt 5).
- **Laufzeit-Schema auf der Startseite**: Die Autoritäts-Sektion setzte bisher zusätzlich eine zweite Person ohne `@id`, mit Firmen-Domains als `sameAs` und den Angaben „Top-Speaker 4.9/5.0 · über 500 Bühnen-Engagements“. Beides ist entfernt. Wer diese Zahlen zurückhaben will, belegt sie zuerst im Canon.

# SEO · AEO · GEO Audit · leader-os.de (Stand 05.10.2026)

> Audit und Umsetzung für die Marketing-Seite leader-os.de. Business-Kontext:
> **LeaderOS** (Argumentorik-Akademie GmbH, Berlin) · Nische: Führungskräfte-
> Training als KI-gestütztes Trainingssystem (B2B/B2C, DACH, Deutsch) ·
> Zielgruppe: neue Teamleads, erfahrene Führungskräfte, Mittelstands-CEOs,
> HR/People Ops · Produkt: Kurse, KI-Coach WladBot, Simulationen, tägliche
> Drills; Einstieg über 14-Tage-Test und das Live-Webinar am 29.10.2026.
>
> Technische Grundlage und Regeln stehen in `SEO_AEO_PLAYBOOK.md`; das
> Keyword-Universum in `SEO_KEYWORDS.md`. Dieses Dokument hält fest, was im
> Audit gefunden wurde, was davon **im Code umgesetzt** ist und was nur der
> Betreiber tun kann. Jede Zahl stammt aus `WLAD_CANON.md` bzw. dem
> verifizierten Set in `WEBINAR_FUNNEL.md` (400.000+ Klienten, 20+ Länder,
> 3× SPIEGEL, Trustpilot 4,9/388, seit 2007).

---

## 0. Befund in einem Absatz

Die Infrastruktur ist überdurchschnittlich: Prerendering für 173 Artikel,
statische Antwortseiten, `llms.txt`, IndexNow, alle Antwort-Crawler
freigegeben, Entity-Graph mit `@id`s. Die Lücken lagen an drei Stellen:
(1) die wichtigsten **Conversion-Seiten** (`/webinar`, `/kommunikation`,
`/training`, Startseite) waren für Antwort-Maschinen leer, weil nur
`/ki-fuehrungskraft` prerendert wurde; (2) das **Kurs-Angebot**, das
wichtigste Verkaufsargument, hatte keine eigene zitierbare Seite und kein
`Course`-Schema mit echten Kursen; (3) **Artikel hatten keine Q&A-Blöcke**,
also keine `FAQPage`-Auszeichnung, obwohl Antwort-Maschinen genau diese
Absätze übernehmen. Dazu ein hängender `@id`-Verweis im Entity-Graph
(`#wlad` war nirgends definiert) und zwei unverifizierte Zahlen in
`llms.txt`.

Der größte Hebel bleibt außerhalb des Codes: der **Domain-Flip auf den
Apex** (Playbook §4). Solange `www` Primary ist, meldet Google 80 Artikel
als „Seite mit Weiterleitung“.

---

## 1. SEO Essentials

### 1.1 High-Intent-Keywords, die bisher keine Seite hatten

| Keyword (DE) | Intent | Vorher | Jetzt |
| --- | --- | --- | --- |
| führungskräftetraining online | kommerziell | nur Artikel „Formate im Vergleich“ | Startseiten-Title + `/kurse` |
| ki coach führungskräfte / ki coaching führung | kommerziell | WladBot-Seite ohne Keyword im Title | Startseiten-Title und -Description |
| leadership kurse online / führungskräfte kurs | kommerziell | keine | `/kurse` (statisch, Course-Schema) |
| leadership operating system | navigational/informational | nur im Fließtext | `/fragen` FRG-12, Webinar-FAQ |
| webinar führung kostenlos | kommerziell | SPA-Shell | `/webinar` prerendert mit Event + FAQ |
| rhetorik training führungskräfte | kommerziell | `/kommunikation` nicht in Sitemap | Sitemap + Footer + `llms.txt` |

### 1.2 Title / Meta Description (umgesetzt)

**Startseite** (`frontend/public/index.html`)

- Vorher: `LeaderOS · KI Leadership System · 14 Tage kostenlos testen`
- Jetzt: `Führungskräftetraining online · KI-Coach WladBot · LeaderOS` (59 Zeichen)
- Description: `Führung trainieren statt lernen: 10 Kurse, KI-Coach WladBot mit der Methodik von Wlad Jachtchenko, Simulationen und tägliche 15-Minuten-Drills. 14 Tage kostenlos, ohne Karte.`

**/kurse** (neu): `Kurse in LeaderOS · Katalog, Zugang und Ablauf | LeaderOS`

**/webinar**: Title und Description leben jetzt in `src/data/webinarEvent.js`
(`WEBINAR_SEO`) und sind im SPA und im Prerender identisch.

### 1.3 Überschriften-Hierarchie

Regel aus dem Playbook (ein `<h1>`, dann Frage-`<h2>`, Antwort im ersten
Absatz) gilt jetzt auch für `/kurse` und das Webinar-Prerender. Artikel
bekommen am Ende eine `<h2>Häufige Fragen</h2>` mit `<h3>`-Fragen, deren
erster Absatz die vollständige Antwort ist.

### 1.4 Offene Empfehlungen (nicht im Code)

- **`/kommunikation` und `/training` prerendern.** Beide Seiten halten ihre
  Texte in JSX, nicht in einem Datenmodul; ein Prerender nach dem Muster
  `/ki-fuehrungskraft` braucht erst die Verlagerung der Texte nach
  `src/data/`. Bis dahin sieht Google sie (JS-Rendering), Antwort-Maschinen
  nicht.
- **Startseite:** `index.html` ist die SPA-Shell für alle Routen, deshalb
  darf dort kein seitenspezifischer Inhalt in `#root` stehen (Playbook).
  Der zitierbare Startseiten-Inhalt liegt in `/os`, `/fragen`, `/kurse`
  und `llms.txt`. Wenn ein crawlbarer Startseiten-Body gewünscht ist, muss
  Vercel den Apex getrennt von der Shell ausliefern (Prerender nach
  `build/index.html` nur, wenn das Catch-all-Rewrite auf eine zweite
  Shell-Datei zeigt).

---

## 2. AEO · Q&A-Framework (umgesetzt)

Alle Antworten sind antwort-zuerst, konversationell und als `FAQPage`
wortgleich zum sichtbaren Text ausgezeichnet.

| Ort | Neu | Fragen |
| --- | --- | --- |
| `/fragen` (statisch) | +4 (jetzt 13) | Welche Kurse gibt es in LeaderOS? · Was ist im 14-Tage-Test enthalten? · Was ist ein Leadership Operating System? · Was passiert im Live-Webinar am 29. Oktober? |
| `/kurse` (statisch, neu) | 8 | Katalog, Ablauf, Test-Inhalt, Grundlagen vs. Master, Vorkenntnisse, Unterschied zum Videokurs, Urheber, Zertifikat |
| `/webinar` (prerendert) | 6 | Kosten, Dauer, Aufzeichnung, Vorkenntnisse, Q&A, Was ist ein Leadership Operating System? |
| Journal, 20 neueste Guides | 60 (3 je Artikel) | je Artikel die drei Fragen, die Nutzer tatsächlich stellen (z. B. „Was sind die 5 Stufen der Delegation?“, „Wie oft sollte ein 1:1 stattfinden?“, „Was ist psychologische Sicherheit?“) |

Mechanik: neuer Block-Typ `faq` im Content-Schema
(`BlockRenderer.jsx` rendert ihn in der App, `prerender-articles.mjs`
statisch plus `FAQPage` im `@graph`). Weitere Artikel bekommen Q&A, indem
man dem `body` einen Block `{ type: 'faq', items: [[Frage, Antwort], …] }`
anhängt; Antworten unter 50 Wörtern, erster Satz = Antwort.

**Empfehlung für die nächsten 153 Artikel:** zuerst die 50 Keyword-Ziel-URLs
aus `SEO_KEYWORDS.md`, je drei Fragen aus Google „Ähnliche Fragen“ zum
Keyword.

---

## 3. GEO · Zitierfähigkeit (Citation Readiness)

Was Antwort-Maschinen zitieren, sind **eindeutige, nur hier verfügbare
Aussagen**. Erfundene Studien oder Statistiken sind ausgeschlossen (Kanon-
Regel; eine falsche Zahl verbreitet sich weiter als jede Anzeige). Was wir
tatsächlich haben und jetzt konsequent ausspielen:

1. **Proprietäre Frameworks mit kanonischer Definition.** SEXIER-Modell
   (R = Rebuttal), die 10 Stufen des Zuhörens (80 % bleiben auf Stufe 2),
   Feedbackformel B·W·W, 5 Rollen, Charisma-Code, 4 Gesprächstypen. Stehen
   in `llms.txt` mit expliziter Liste dokumentierter Falschzitate; `/fragen`
   liefert die Kurzform, `/journal` die Deep-Dives. Das ist der
   Zitier-Anker Nummer eins.
2. **Die Trainings-These als zitierbarer Satz.** „Führung wird nicht
   gelernt. Sie wird trainiert.“ plus die Definition „Leadership Operating
   System“ (FRG-12, Webinar-FAQ). Eigene Begriffe werden mit der Quelle
   zitiert.
3. **Der Kurs-Katalog als Fakt.** Zehn benannte Kurse, Zugangsmodell,
   Vier-Schritte-Ablauf (`/kurse`). Antwort-Maschinen können „Welche Kurse
   hat LeaderOS?“ jetzt vollständig beantworten.
4. **Verifizierte Autoritätsdaten** (nur diese): 3× SPIEGEL-Bestseller,
   seit 2007, 400.000+ Klienten, 20+ Länder, Trustpilot 4,9 (388), die zehn
   verifizierten Buchtitel. **Entfernt** aus `llms.txt`: „insgesamt 13
   Bücher“ (Kanon: Listen nicht abgeglichen) und „14 Millionen Views“
   (nirgends verifiziert). Wer diese Zahlen zurück will, verifiziert sie
   zuerst im Kanon.

**Eigene Daten, die wir erzeugen könnten (Empfehlung, nicht umgesetzt):**
Der Leader-Check sammelt reale Diagnose-Scores in drei Dimensionen. Ein
jährlicher „Leader-Check-Report“ (anonymisierte Aggregate: Verteilung der
Scores, häufigste Schwachstelle, Unterschiede nach Rolle) wäre die einzige
originäre Statistik im DACH-Markt zu diesem Thema und damit ein echter
Zitiergrund. Voraussetzung: Mindest-N, Datenschutz-Freigabe, Berechnung
direkt aus `public.users`/Attempts, nicht aus Schätzungen.

**Expertenzitate:** Wlads O-Töne aus Podcast-Folgen (z. B. Folge 423 zum
SEXIER-Modell) als wörtliche `quote`-Blöcke mit Folgenangabe in die
Framework-Artikel. Quelle prüfbar, Zitat eindeutig zuordenbar.

---

## 4. Schema-Markup · Mapping (umgesetzt)

| Seite | Typen | Stand |
| --- | --- | --- |
| alle (Shell) | `Organization` `#organization`, `Person` **`#wlad`** (vorher `/wlad-jachtchenko#person`, auf das `founder`/`instructor`/Artikel-`author` zeigten, ohne dass der Knoten existierte), `WebSite`, `Course` (30-Tage-Challenge), `SoftwareApplication` | ✅ `@id` repariert, `mainEntityOfPage` auf die Person-Seite |
| `/kurse` | `WebPage` → `ItemList` aus 10 `Course` (provider, `CourseInstance` online, instructor `#wlad`, `isAccessibleForFree` für die sechs Grundlagen, `Offer` 0 € Test / 4.797 € OS-Jahr), `BreadcrumbList`, `FAQPage` | ✅ neu |
| `/webinar` | `WebPage` → `Event` (`OnlineEventAttendanceMode`, `isAccessibleForFree`, `performer #wlad`, `organizer #organization`), `BreadcrumbList`, `FAQPage` | ✅ statisch im Prerender (vorher nur per JS) |
| `/journal/<slug>` | `BlogPosting` (author `#wlad`, `speakable`, `dateModified` aus `updatedAt`), `BreadcrumbList`, **`FAQPage`** wenn ein `faq`-Block existiert | ✅ |
| `/fragen` | `FAQPage` (13), `BreadcrumbList` | ✅ erweitert |
| `/ki-fuehrungskraft` | `WebPage`, `Event`, `FAQPage`, `BreadcrumbList` | unverändert |
| `/wlad-jachtchenko` | `Person` per JS (Seite nicht prerendert) | offen: Prerender wie `/webinar`, damit `Person` + `Book`-Liste (`ItemList` aus `Book` mit ISBN aus `wladBookshelf.js`) ohne JS sichtbar sind |

Bewusst **nicht** gesetzt: `AggregateRating` (Trustpilot-Bewertungen
gehören Trustpilot, Self-Serving-Reviews werden von Google ignoriert bzw.
abgestraft), `SearchAction` (Route existiert nicht), `LocalBusiness` (kein
Ladengeschäft), `VideoObject` (erst mit echten Vimeo-Metadaten).

---

## 5. Umsetzung in diesem Audit · Dateien

- `frontend/public/index.html` · Title/Description, Person-`@id`.
- `frontend/public/kurse/index.html` · neue statische Kurs-Seite.
- `frontend/public/fragen/index.html` · FRG-10 bis FRG-13 + Schema + Footer-Link.
- `frontend/public/sitemap.xml` · `/kurse`, `/kommunikation`, `/training`.
- `frontend/public/robots.txt` · Allow-Einträge für die neuen Seiten.
- `frontend/public/llms.txt` · `/kurse`, `/kommunikation`, `/training`; Buch- und Podcast-Zeile auf verifizierte Angaben.
- `frontend/src/data/webinarEvent.js` · `WEBINAR_SEO`, `WEBINAR_HERO`, `FAQ` als eine Quelle.
- `frontend/src/pages/WebinarPage.js` · nutzt die Datenquelle.
- `frontend/scripts/prerender-landings.mjs` · `/webinar` prerendert.
- `frontend/scripts/prerender-articles.mjs` · `faq`-Block, `FAQPage`, Autor-`@id`, `speakable`.
- `frontend/src/features/content/components/BlockRenderer.jsx` · `faq`-Block in der App.
- 20 Artikel in `features/content/data/articles/` · je ein `faq`-Block.
- `frontend/src/components/landing/LandingFooter.js` · interne Links auf `/kurse`, `/kommunikation`, `/ki-fuehrungskraft`, `/webinar`.

## 6. Was nur der Betreiber tun kann

| Aktion | Warum |
| --- | --- |
| **Domain-Flip** in Vercel (`leader-os.de` Primary, `www` → Apex) | 80 Artikel in GSC „Seite mit Weiterleitung“; ohne das greift kein anderer Hebel (Playbook §4) |
| GSC: Sitemap neu einreichen, `/kurse` und `/webinar` per URL-Prüfung anstoßen | Erst-Indexierung der neuen Seiten in Tagen statt Wochen |
| Bing Webmaster Tools verifizieren | ChatGPT-Search, Copilot und DuckDuckGo sitzen auf dem Bing-Index |
| Monatlicher AEO-Check | In ChatGPT, Perplexity, Claude, Copilot fragen: „Welche Kurse hat LeaderOS?“, „Was ist das SEXIER-Modell?“, „Wer ist Wlad Jachtchenko?“ und protokollieren, ob wir zitiert werden und ob die Definition stimmt |
| Zahlen verifizieren, bevor sie zurückkommen | „13 Bücher“ und „14 Mio. Views“ sind aus `llms.txt` raus, bis der Kanon sie führt |
| Leader-Check-Report freigeben | Einzige originäre Statistik, die wir liefern könnten (Abschnitt 3) |

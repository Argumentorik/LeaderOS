# KI-Führungskraft · 6 Kampagnen, 1 Angebot

> Landing: **`https://leader-os.de/ki-fuehrungskraft`** (`KiFuehrungskraftPage.js`,
> Inhalt in `frontend/src/data/kiFuehrungskraft.js`). Stand 25.09.2026.
> Positionierung aus Wlads Greator-Event „Die KI-Führungskräfte-Revolution"
> (26./27.09.), übersetzt auf **unser** Angebot.

## Grundsatz: ein Angebot, sechs Versprechen

Alle sechs Kampagnen verkaufen **dasselbe Angebot**: das kostenlose
Live-Webinar am **Do 29.10.2026, 10:00–11:30 Uhr** (online, keine
Aufzeichnung). Unterschiedlich ist nur, **welches Versprechen** die
Anzeige macht. Die Kette ist bei jeder Kampagne identisch:

```
Anzeigen-Hook  =  Hero-H1 auf ?k=<key>  =  hervorgehobene Karte „Dein Fokus"
      ↓                                            ↓
Agenda-Punkt im Webinar, der das Versprechen einlöst  +  LeaderOS-Funktion, die es danach trainiert
      ↓
Lead mit source = ki-fuehrung-<key>  →  CPL und Show-up pro Versprechen messbar
```

**Regel:** Ein Versprechen, das in dieser Kette kein Glied im Webinar
oder im Produkt hat, kommt nicht in eine Anzeige. Deshalb stehen hier
bewusst **nicht** die Greator-Themen „Prozesse automatisieren",
„Business Case" oder „Kosten senken": Die löst unser 90-Minuten-Webinar
nicht ein.

## Kohärenz-Matrix

| Key | Zielgruppe | Versprechen (= Anzeigen-Hook = H1) | Eingelöst im Webinar | Trainiert in LeaderOS | Framework |
| --- | --- | --- | --- | --- | --- |
| `ki` (Standard) | Führungskräfte + Nachwuchs, KI-verunsichert | KI ersetzt keine Führungskraft. Eine Führungskraft mit KI schon. | 10:25 Leadership OS (KI-Coach + Drills) | WladBot, 30-Tage-Challenge | 11 Frameworks |
| `zeit` | Führungskräfte mit Meeting-/Gesprächslast | Vorbereitet in Minuten. Nicht in Stunden. | 10:25 Leadership OS · Live-Demo Vorbereitung | Gespräch vorbereiten (SEXIER-Prep) | SEXIER |
| `gespraech` | Teamleads mit Konflikten, Low Performern | Das schwierige Gespräch. Geprobt, bevor es passiert. | 10:55 Live-Case | Simulationen | Hart in der Sache, weich zur Person |
| `wirkung` | Führungskräfte, die präsentieren/überzeugen müssen | Überzeugen, ohne lauter zu werden. Präsenz. Wärme. Kompetenz. | 10:05 Charisma-Code live | Video-Analyse (Missionen) | Charisma-Code |
| `team` | Führungskräfte im operativen Hamsterrad | Weniger Rückfragen. Mehr Verantwortung im Team. | 10:25 Frameworks · 10:55 Live-Case | 1:1-Vorbereitung mit WladBot | Feedbackformel B-W-W, Die 5 Rollen |
| `aufstieg` | Leistungsträger vor dem ersten Führungsjob | Vom Leistungsträger zur offensichtlichen Wahl. | Video „Warum die meisten Führungskräfte unsichtbar bleiben" (Danke-Seite) + Q&A | 30-Tage-Challenge | Die 5 Rollen |

**Für Wlad:** Kampagne `ki` verspricht, dass im Webinar klar wird, *was KI
in der Führung übernimmt und was nicht*. Das steckt heute im Agenda-Punkt
10:25, aber nicht ausdrücklich. Empfehlung: dort zwei Minuten „Was KI
übernimmt – was du bleibst" (die zwei Listen von der Landing) ausdrücklich
sagen, damit das Anzeigen-Versprechen hörbar eingelöst wird.

## URLs und Tracking

Schema, eine URL pro Anzeige:

```
https://leader-os.de/ki-fuehrungskraft?k=<key>&utm_source=<meta|linkedin|google>&utm_medium=paid&utm_campaign=ki-fuehrung&utm_content=<k0N>-<key>-<variante>
```

Beispiel: `…/ki-fuehrungskraft?k=zeit&utm_source=meta&utm_medium=paid&utm_campaign=ki-fuehrung&utm_content=k02-zeit-v1`

- `k` steuert Hero, Karte und Lead-Quelle; unbekannt oder leer → `ki`.
- Canonical ist immer die nackte URL: Varianten konkurrieren nicht in Google.
- Lead in Mongo `webinar_leads`: `source = ki-fuehrung-<key>`, `quiz.kampagne = <key>`, `utm` komplett.
- PostHog: `ki_lp_view`, `ki_cta_click` (`where`), `ki_register_submit` (Property `kampagne`).
- Meta: `ViewContent` beim Laden, `Lead` mit `event_id` nach erfolgreicher Anmeldung (Conversions API dedupliziert). **Pixel-ID ist im Code noch Platzhalter**, siehe `MARKETING_KICKOFF.md`.

## Budget und Struktur (passt in die bestehenden Pakete)

Bei 30 €/Tag Meta und 50 €/Tag LinkedIn (`META_ADS_WEBINAR.md`,
`LINKEDIN_ADS_WEBINAR.md`) sind sechs eigene Kampagnen zu dünn: Keine
würde aus der Lernphase kommen. Deshalb:

- **Meta:** 1 Kampagne (Lead, CBO) → 2 Anzeigengruppen: *Führung* (`ki`, `zeit`, `gespraech`, `team`) und *Nachwuchs* (`aufstieg`, `wirkung`). Pro Key 1–2 Creatives. Pausieren nach der Regel aus dem Meta-Paket: CPL > 2× Median nach ≥ 50 Klicks.
- **LinkedIn:** 1 Kampagne, Job-Titel-Targeting, 3 Keys: `zeit`, `gespraech`, `team`. Führungskräfte auf LinkedIn reagieren auf konkrete Situationen stärker als auf das Manifest.
- **Google Search:** eine Anzeigengruppe pro Key, Keywords unten. Landing = passender `?k=`.
- Nach 7 Tagen: die zwei Keys mit dem niedrigsten CPL **und** der besten Show-up-Quote (Webinar-Teilnahme) bekommen das Budget.

## Anzeigentexte

Alle Zahlen aus `WLAD_CANON.md`. Keine Greator-Zahlen (10.000+ Manager,
250.000 Bücher, 12 Bücher). Keine Beförderungs- oder Gehaltsgarantie.
„Keine Aufzeichnung" ist wahr und darf als Live-Grund stehen, Plätze
werden nicht künstlich verknappt.

### K·01 · `ki` · Manifest
- **Meta Primärtext:** KI ersetzt keine Führungskraft. Eine Führungskraft mit KI schon. Wlad Jachtchenko zeigt live, wie du KI für Vorbereitung und Training nutzt – und die Fähigkeiten stärkst, die keine KI ersetzt. Kostenlos, Do 29.10., 10 Uhr.
- **Meta Headline:** Führen mit KI – live mit Wlad
- **LinkedIn Intro:** Aufgaben verschwinden, Führung nicht. KI übernimmt Vorbereitung, Analyse und Entwürfe – überzeugen, Orientierung geben und Konflikte lösen bleibt dein Job. Im kostenlosen Live-Webinar am 29.10. zeigt Wlad Jachtchenko, wie du beides verbindest.
- **Google Headlines:** KI-Führungskraft werden · Führen mit KI · Live-Webinar · Kostenlos am 29.10. um 10 Uhr
- **Google Descriptions:** KI übernimmt Aufgaben, nicht Führung. Lerne live, wie du beides verbindest. · 3× SPIEGEL-Bestseller-Autor Wlad Jachtchenko, 90 Minuten, kostenlos.
- **Keywords:** ki führungskraft · führen mit ki · ki für führungskräfte · ersetzt ki führungskräfte · ki leadership

### K·02 · `zeit` · Vorbereitet in Minuten
- **Meta Primärtext:** Feedback, Gehaltsgespräch, Board-Präsentation – und jedes Mal eine Stunde Vorbereitung? Der KI-Coach baut dein Gespräch nach Wlads SEXIER-Modell auf: Kontext, Argumente, Gegenseite, Coaching. Live gezeigt am 29.10.
- **Meta Headline:** Vorbereitet in Minuten
- **LinkedIn Intro:** Wie viel Zeit steckt in der Vorbereitung deines nächsten schwierigen Gesprächs? Wlad Jachtchenko zeigt live, wie Führungskräfte das mit einem KI-Coach in Minuten erledigen – strukturiert nach seinem SEXIER-Modell.
- **Google Headlines:** Gespräche mit KI vorbereiten · In Minuten statt Stunden · Kostenloses Live-Webinar
- **Google Descriptions:** Feedback, Gehalt, Präsentation: dein Gespräch nach SEXIER aufgebaut. · Wlad Jachtchenko zeigt den KI-Coach live. Do 29.10., 10 Uhr, kostenlos.
- **Keywords:** mitarbeitergespräch vorbereiten ki · gespräch vorbereiten ki · feedbackgespräch vorbereiten · ki tools führungskräfte

### K·03 · `gespraech` · Geprobt, bevor es passiert
- **Meta Primärtext:** Das Gespräch mit dem Low Performer schiebst du seit Wochen? Spiel es vorher durch – mit einem KI-Coach, der Einwände bringt und dir danach sagt, welcher Satz trägt. Live-Case im Webinar am 29.10.
- **Meta Headline:** Proben statt hoffen
- **LinkedIn Intro:** Low Performer, Konflikt im Team, Kritik an die Chefin: Die schwierigsten Gespräche führen wir ohne Probe. Im kostenlosen Live-Webinar arbeitet Wlad Jachtchenko einen echten Fall durch und zeigt, wie du solche Gespräche mit KI vorher trainierst.
- **Google Headlines:** Schwierige Gespräche proben · Low Performer ansprechen · Live-Case mit Wlad
- **Google Descriptions:** Simulation mit KI-Coach: Einwände, Gegenwind, Feedback danach. · Kostenloses Live-Webinar am 29.10. – mit echtem Führungsfall und Q&A.
- **Keywords:** schwierige gespräche führen · low performer ansprechen · kritikgespräch führen · konfliktgespräch vorbereiten

### K·04 · `wirkung` · Präsenz. Wärme. Kompetenz.
- **Meta Primärtext:** Überzeugen hat nichts mit Lautstärke zu tun. Drei Signale entscheiden in Sekunden, ob ein Raum dir folgt: Präsenz, Wärme, Kompetenz. Wlad Jachtchenko zeigt den Charisma-Code live – am 29.10., kostenlos.
- **Meta Headline:** Der Charisma-Code, live
- **LinkedIn Intro:** Warum folgt ein Raum manchen Führungskräften sofort – und anderen nie? Wlad Jachtchenko, dreifacher SPIEGEL-Bestseller-Autor, demonstriert den Charisma-Code live. Danach zeigt dir die KI-Videoanalyse, wo du stehst.
- **Google Headlines:** Überzeugen ohne lauter werden · Der Charisma-Code live · Wirkung als Führungskraft
- **Google Descriptions:** Präsenz, Wärme, Kompetenz: die drei Signale, live demonstriert. · 90 Minuten mit Wlad Jachtchenko. Kostenlos, Do 29.10., 10 Uhr.
- **Keywords:** charisma führungskraft · souverän auftreten · überzeugend präsentieren · ausstrahlung führungskraft

### K·05 · `team` · Weniger Rückfragen
- **Meta Primärtext:** Du bist der Engpass, weil jede Entscheidung bei dir landet? Delegieren, Erwartungen klären, Feedback, das ankommt: mit der Feedbackformel und einem KI-Coach, der dein nächstes 1:1 vorbereitet. Live am 29.10.
- **Meta Headline:** Mehr Verantwortung im Team
- **LinkedIn Intro:** Rückfragen, halbfertige Aufgaben, Kontrolle – das kostet Führungskräfte ihre halbe Woche. Im kostenlosen Live-Webinar zeigt Wlad Jachtchenko, wie du Verantwortung überträgst: mit der Feedbackformel und täglichem Training.
- **Google Headlines:** Weniger Rückfragen im Team · Delegieren mit System · Feedback, das ankommt
- **Google Descriptions:** Beobachtung, Wirkung, Wunsch: Feedback, das Verantwortung überträgt. · Live-Webinar mit Wlad Jachtchenko am 29.10., kostenlos und online.
- **Keywords:** richtig delegieren · feedback geben führungskraft · mitarbeiter führen · verantwortung übertragen

### K·06 · `aufstieg` · Die offensichtliche Wahl
- **Meta Primärtext:** Du lieferst, aber bei der Beförderung wird jemand anderes gesehen? Lerne die 5 Rollen einer Führungskraft, trainiere sie täglich mit KI – und mach deinen Beitrag sichtbar. Kostenloses Live-Webinar am 29.10.
- **Meta Headline:** Vom Leistungsträger zur Führung
- **LinkedIn Intro:** Gute Arbeit allein bringt dich nicht in die Führungsrolle. Wlad Jachtchenko zeigt im kostenlosen Live-Webinar, welche 5 Rollen eine Führungskraft ausmachen und wie du sie trainierst, bevor die nächste Stelle vergeben wird.
- **Google Headlines:** Führungskraft werden · Vom Leistungsträger zur Führung · Die 5 Rollen der Führung
- **Google Descriptions:** Die 5 Rollen einer Führungskraft kennen und täglich mit KI trainieren. · Kostenloses Live-Webinar mit Wlad Jachtchenko, Do 29.10., 10 Uhr.
- **Keywords:** führungskraft werden · erste führungsposition · beförderung vorbereiten · vom kollegen zum chef

## SEO und AEO

Die Seite ist **indexierbar** (anders als `/kommunikation`) und die
Pillar-Seite für den Cluster „KI-Leadership" aus `SEO_KEYWORDS.md`:

- **Prerendert** (`scripts/prerender-landings.mjs`): Google, Bing und die
  Antwort-Crawler (GPTBot, ClaudeBot, PerplexityBot) lesen den vollen Inhalt
  ohne JavaScript.
- **Strukturierte Daten:** `WebPage`, `BreadcrumbList`, `Event` (29.10.,
  kostenlos, online) und `FAQPage` mit 8 Fragen, wortgleich zum sichtbaren Text.
- **Antwort zuerst:** „Was übernimmt KI in der Führung – und was nicht?" und
  die FAQ („Ersetzt KI Führungskräfte?", „Was ist eine KI-Führungskraft?",
  „Wie nutzen Führungskräfte KI im Alltag?") beginnen mit der vollständigen
  Antwort, damit Antwort-Maschinen den Absatz zitieren.
- **Interne Links:** zu sechs KI-Cluster-Artikeln im Journal, aus dem
  Footer der Startseite, aus `sitemap.xml` und `llms.txt`.
- **Favicon:** `/favicon.ico` (16/32/48) und `/favicon-96.png` sind jetzt
  auf allen Einstiegsseiten verlinkt. Google zeigt Favicons ab 48 px im
  Vielfachen von 48. Voraussetzung bleibt der Domain-Flip aus
  `SEO_AEO_PLAYBOOK.md` §4, danach in der Search Console die Startseite neu
  indexieren lassen.

Messen: Search Console → Leistung → Seite `/ki-fuehrungskraft`; einmal im
Monat „Ersetzt KI Führungskräfte?" in ChatGPT, Perplexity und Copilot
fragen und protokollieren, ob die Seite zitiert wird.

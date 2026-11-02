# Sitemap + robots.txt — fertig zum Kopieren

Zwei fertige Textblöcke (Sitemap und robots.txt) für die Domain `leadercheck.de`,
die du direkt kopieren und einsetzen kannst. Enthalten sind nur die öffentlichen
Seiten; die robots.txt verweist auf die Sitemap-URL.

## Für wen

Für dich als Betreiber von leadercheck.de — zum Einreichen bei Google Search
Console bzw. zum Ablegen im Live-Verzeichnis der Seite.

## Inhalt (genau das bekommst du)

### 1. sitemap.xml

Öffentliche Seiten, Domain `leadercheck.de`:

- `https://leadercheck.de/` — Startseite (Priorität 1.0)
- `https://leadercheck.de/diagnose` — Diagnose-Start (0.9)
- `https://leadercheck.de/close` — Angebots-/Verkaufsseite (0.8)
- `https://leadercheck.de/quiz` — Quiz (0.7)
- `https://leadercheck.de/kurse` — Kurs-Bibliothek (0.6)
- `https://leadercheck.de/activate` — Key-Aktivierung (0.4)
- `https://leadercheck.de/login` — Login (0.3)

Nicht enthalten (bewusst): Flow-interne Seiten `/analyzing`, `/report`,
`/roadmap`, `/payment-success`, `/auth/callback` sowie `/admin`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://leadercheck.de/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="de-DE" href="https://leadercheck.de/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://leadercheck.de/" />
  </url>
  <url>
    <loc>https://leadercheck.de/diagnose</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://leadercheck.de/close</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://leadercheck.de/quiz</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://leadercheck.de/kurse</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://leadercheck.de/activate</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://leadercheck.de/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### 2. robots.txt (mit Sitemap-Verweis)

```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /analyzing
Disallow: /report
Disallow: /roadmap
Disallow: /payment-success
Disallow: /auth/

Sitemap: https://leadercheck.de/sitemap.xml
```

## Ablauf

1. Du bekommst beide Blöcke als Text im Chat zum direkten Kopieren.
2. Beide Dateien werden außerdem im Projekt hinterlegt (`sitemap.xml` ist bereits
   vorhanden und wird auf diesen Stand gebracht; `robots.txt` wird mit dem
   Sitemap-Verweis ergänzt), damit sie beim nächsten Deploy live unter
   `leadercheck.de/sitemap.xml` und `leadercheck.de/robots.txt` erreichbar sind.
3. Live werden sie mit dem nächsten Production-Deploy.

## Darstellung

Reine Textausgabe — keine UI-Änderung. Die Blöcke sind so formatiert, dass du
sie 1:1 kopieren kannst.

## Umsetzungsphasen

**Phase 1 (jetzt):** Die beiden fertigen Blöcke oben im Chat ausgeben und die
Dateien im Projekt auf genau diesen Stand bringen.

**Phase 2 (optional, später):** `<lastmod>`-Datumsangaben je Seite ergänzen und
automatisch aktuell halten.

**Phase 3 (optional, später):** Sitemap bei Google Search Console einreichen und
Indexierung prüfen.

## Annahmen

- Domain ist `leadercheck.de` (wie in der aktuellen Sitemap).
- Nur die 7 öffentlichen Seiten gehören rein; Funnel-interne Seiten und `/admin`
  bleiben außen vor (für SEO korrekt, da ohne Funnel-Durchlauf kein Inhalt).
- Die robots.txt soll den Sitemap-Verweis enthalten und die internen Seiten per
  `Disallow` von der Indexierung ausschließen.
- Es wird keine `<lastmod>`-Angabe ergänzt (bleibt wie bisher), um den aktuellen
  Stil beizubehalten.
- Die Dateien gehen erst mit dem nächsten manuellen Deploy live.

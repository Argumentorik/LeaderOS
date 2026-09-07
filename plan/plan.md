# Plan: Voyage-Altlasten entfernen · Wissen/Docs aktualisieren · SEO/AEO für DACH & „Wlad Jachtchenko“

## 1. Voyage vollständig aus Code, Konfiguration und Dokumentation entfernen
Stefan hat recht: Der RAG-Pfad und die Doku referenzieren noch Voyage (Embedding-Anbieter), obwohl die Einbettung inzwischen lokal läuft.

Ergebnis:
- Ein einziger Embedding-Weg (der aktuell produktive, lokale) für Ingestion, Suche und Admin-Uploads. Kein Voyage-Fallback, kein Voyage-Key, keine Voyage-Konstanten mehr.
- Alle Erwähnungen in Code-Kommentaren, `.env.example`, README/Handbuch, Admin-Hinweisen und Health-Endpunkten ersetzt durch den tatsächlichen Anbieter.
- Ein Konsistenz-Check im RAG-Health (Admin) zeigt: Anbieter, Modell, Dimension, Anzahl Chunks — damit „was läuft wirklich“ sichtbar ist.
- Bestehende Chunks bleiben nutzbar; sollten Alt-Chunks mit abweichender Dimension existieren, werden sie in einem Lauf neu eingebettet (kein Wissensverlust).

## 2. Gesamtes Wissen & Dokumentation auf den aktuellen Stand bringen (GitHub `aiporator/SHIPOS`)
Annahme: Das Repo `aiporator/SHIPOS` ist die Referenz für Produkt-Wissen (Konzepte, Kurs-Skripte, Positionierung), das in Wlads Wissensbasis (RAG) und in die App-Doku einfließen soll.

Ergebnis:
- Inhalte aus dem Repo werden als Wissensquellen importiert (Markdown/PDF/DOCX über den 2-MB-Upload), sauber betitelt und thematisch zugeordnet; veraltete Duplikate im RAG werden entfernt.
- Projekt-Dokumentation (README, Betriebshandbuch, Admin-Hilfetexte) wird auf den heutigen Funktionsumfang gebracht: Leader-OS/PLUS-Pakete, Kurs-Bibliothek, Video-Guide, Interaktiver Wlad (Beta), Wissens-Upload, Fal/Stimme, Zugriffsmodell.
- Alte Produktnamen und Preise, die nicht mehr gelten, werden überall vereinheitlicht (eine Quelle der Wahrheit für Namen, Preise, Paketinhalte).

**Offen (bitte bestätigen):** Ist das Repo öffentlich? Falls privat, wird ein Lesezugriff (Token oder „Save to GitHub“-Verknüpfung) benötigt. Ohne Zugriff wird Punkt 2 auf die App-eigene Doku beschränkt.

## 3. SEO/AEO für den DACH-Raum und „Wlad Jachtchenko“
Ziel: Die öffentlichen Seiten werden von Google und KI-Antwortmaschinen (ChatGPT, Perplexity, Gemini) als *die* Quelle für „Wlad Jachtchenko“, „Leader-OS“, „Führungskräfte-Coaching“, „Rhetorik-Training“, „KI-Coach für Führungskräfte“ erkannt.

Ergebnis:
- **Technische Basis:** Sitemap (alle öffentlichen Seiten inkl. Kursübersicht, Coaching, Impressum), robots.txt, kanonische URLs, `hreflang de-DE/de-AT/de-CH`, saubere Titel/Meta-Beschreibungen pro Seite (deutsch, Keyword-fokussiert), Open-Graph/Twitter-Karten mit Wlad-Bild.
- **Strukturierte Daten (JSON-LD):** Person (Wlad Jachtchenko: Autor, Rhetorik-Trainer, Speaker, Bücher, Social-Profile), Organization (Leader-OS), Course für die Kurse, Product/Offer für die Pakete, FAQPage auf Coaching- und Startseite, VideoObject für öffentliche Wlad-Videos.
- **AEO-Inhalte:** Öffentliche, ohne Login lesbare Seiten mit klaren Frage-Antwort-Blöcken („Wer ist Wlad Jachtchenko?“, „Was ist Leader-OS?“, „Was kostet …?“, „Für wen …?“), eine `llms.txt` mit Kurzbeschreibung der Plattform und der wichtigsten Seiten, sowie eine öffentliche Kursübersicht (Titel, Folgen, Dauer — Inhalte bleiben geschützt).
- **Keyword-Set DACH** (in Titel, H1/H2, FAQ und Alt-Texten): Wlad Jachtchenko, Leader-OS, Führungskräfte-Coaching, Leadership-Training online, Rhetorik für Führungskräfte, schwierige Mitarbeitergespräche, Delegation, Feedback geben, KI-Coach Führung, Executive Presence, Boardroom-Strategie.
- **Messbarkeit:** Search-Console-Verifizierung vorbereitet, CTA-Klicks aus Suchergebnissen als Ereignis erfasst.

Annahmen:
- Öffentliche Domain für die Indexierung ist die Produktions-Domain; Vorschau-Umgebungen bleiben `noindex`.
- Sprache der öffentlichen Seiten bleibt Deutsch (EN nur sekundär, ohne eigenes SEO-Ziel).
- Keine bezahlten SEO-Tools; alles on-page/technisch innerhalb der App.

## Nicht Teil dieses Plans
- Neue Videos oder Kursinhalte; Änderungen am Preis- oder Zugriffsmodell; Blog/Content-Marketing außerhalb der App.

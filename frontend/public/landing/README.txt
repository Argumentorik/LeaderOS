Landing-Page Bilder · Drop-Zone
================================

Dieser Ordner wird unter https://leader-os.de/landing/<file>
ausgeliefert. Sobald du ein Bild hier reinlegst und pushst, greift die
Landing-Page automatisch — kein Code-Change nötig.

================================
POSTER-DESIGNS · Vorrang
================================

Die 5 Poster-Mockups mit eingebranntem Text. Wenn vorhanden, werden
DIESE zuerst geladen. Falls fehlen, fallback zu hf-XX.png Mockup.

  p-01-wer-nicht-fuehrt.jpg
    §01 INHALT (Elf Frameworks. Ein OS.)
    Inhalt: "WER NICHT FÜHRT, WIRD GEFÜHRT" — Silhouette-Suits,
             "Eine Führungs-Generation die aufhört zu warten"
    Aspect: 4:5 hochkant (1200×1500 px ideal)
    Format: JPG, ≤ 600 KB

  p-02-zeit-zu-fuehren.jpg
    §02 COACH (24 Stunden. 7 Tage.)
    Inhalt: "ZEIT ZU FÜHREN — STOPP DAS MIKROMANAGEMENT"
             Dripping-Text, schwarzer Hintergrund, lime Drips
    Aspect: 4:5 hochkant
    Format: JPG, ≤ 600 KB

  p-03-fuehrungs-sprint.jpg
    §03 SPRINT (Dreißig Tage. Ein neues Du.)
    Inhalt: "FÜHRUNGS-SPRINT" + Tartanbahn von oben
             "11 FRAMEWORKS · 30 TAGE · EIN OS"
    Aspect: 4:5 hochkant
    Format: JPG, ≤ 600 KB

  p-06-bib-0001.jpg
    §06 ZERTIFIKAT (Zertifikat 0001. LinkedIn-ready.)
    Inhalt: 0001 Marathon-Startnummer
             "LEADEROS KOHORTE 01 · FÜHRUNG IST EIN HANDWERK"
    Aspect: 4:5 hochkant
    Format: JPG, ≤ 600 KB

  p-07-dreibig-tage.jpg
    §07 KOMPLETT (Powered by WladBot. Persönlich von Wlad.)
    Inhalt: "DREIBIG TAGE FÜHRUNGSPLAN" — Frau-Speaker B&W,
             "WLAD JACHTCHENKO METHODIK · KI-NATIVES COACHING"
    Aspect: 4:5 hochkant
    Format: JPG, ≤ 600 KB

================================
WIE ABLEGEN — schnellster Weg
================================

1. https://github.com/aiporator/SHIPOS/upload/mvpcode/frontend/public/landing
2. Drag-and-drop die 5 JPGs in den Browser
3. Commit-Message: "feat(landing): real poster designs"
4. "Commit directly to the mvpcode branch"
5. Vercel deployt automatisch in ~90 Sek
6. Live auf leader-os.de — scrolle zu Kapitel 01-07

================================
WICHTIG · Dateinamen
================================

Die Filenamen müssen EXAKT stimmen (case-sensitive!):
  p-01-wer-nicht-fuehrt.jpg
  p-02-zeit-zu-fuehren.jpg
  p-03-fuehrungs-sprint.jpg
  p-06-bib-0001.jpg
  p-07-dreibig-tage.jpg

Wenn ein File noch fehlt, zeigt die Section automatisch das alte
hf-XX.png Higgsfield-Mockup mit Halftone-Filter weiter. Kein Bruch.

================================
Existierende Mockup-Fallbacks
================================

  hf-01.png → §01 INHALT          (Higgsfield-AI Mockup)
  hf-02.png → §02 COACH           (Higgsfield-AI Mockup)
  hf-03.png → §03 SPRINT          (Higgsfield-AI Mockup, Tartanbahn)
  hf-04.png → §04 WLAD            (Higgsfield-AI Mockup mit Wlad-Thumb)
  hf-05.png → §05 TRUST           (Higgsfield-AI Mockup, Data-Center)
  hf-06.png → §06 ZERTIFIKAT      (Higgsfield-AI Mockup)
  hf-07.png → §07 KOMPLETT        (Higgsfield-AI Mockup)

Diese werden NUR angezeigt wenn das entsprechende p-XX.jpg fehlt.

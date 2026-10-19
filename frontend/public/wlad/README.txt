Wlad-Originalfotos — Drop-Zone
================================

Dieser Ordner wird unter https://leader-os.de/wlad/<file>
ausgeliefert. Sobald du die Bilder hier reinlegst und pushst,
greift die Landing-Page automatisch — kein Code-Change nötig.

================================
PFLICHT — die 2 Hauptbilder
================================

  wlad-portrait.jpg
    BENEFIT 04 (Authentizität): "Wlads Methodik. Live."
    Auch als Avatar in der LandingNav.

    Specs:
      - Format:    JPG
      - Aspect:    4:5 hochkant
      - Min size:  1200 × 1500 px
      - Max file:  600 KB (sonst LCP-Hit)
      - Inhalt:    Studio-Portrait, neutraler Hintergrund
                   (weiß / hellgrau / schwarz), Schultern bis
                   Kopf, Blick in Kamera, scharf

  wlad-stage.jpg
    MANIFESTO-Block + Mini-Slot in Benefit 02.

    Specs:
      - Format:    JPG
      - Aspect:    3:2 quer
      - Min size:  1600 × 1066 px
      - Max file:  600 KB
      - Inhalt:    Bühnen-Foto am Flipchart, echte Energie.

================================
OPTIONAL — falls vorhanden, sag Bescheid
================================

Werden NICHT automatisch eingebunden, aber wenn du sie ablegst,
verdrahte ich sie wo sinnvoll:

  wlad-podcast.jpg     — am Mic, 16:9
  wlad-book.jpg        — Buch hochhaltend, 4:5
  wlad-phone.jpg       — Phone mit WladBot-Screen, 4:5
  wlad-crowd.jpg       — vor Publikum, 16:9
  wlad-laptop.jpg      — coding/working, 4:5

================================
Wie ablegen
================================

Option A — via GitHub Web-UI (am einfachsten):
  1. https://github.com/aiporator/SHIPOS/tree/mvpcode/frontend/public/wlad
  2. "Add file" → "Upload files"
  3. JPGs hier reinziehen
  4. Commit direkt auf mvpcode
  → Vercel deployt automatisch in ~2 Min, Bilder sind live.

Option B — lokal:
  cp ~/Downloads/wlad-portrait.jpg frontend/public/wlad/
  cp ~/Downloads/wlad-stage.jpg    frontend/public/wlad/
  git add frontend/public/wlad/*.jpg
  git commit -m "feat(brand): real Wlad photos"
  git push origin mvpcode

================================
Optimierung auf 600 KB
================================

  - macOS Preview: Tools → Adjust Size auf 1200×1500
                   Export As → JPEG → Quality 80%
  - squoosh.app:   Browser, MozJPEG 75%
  - tinyjpg.com:   automatisch, drag&drop

================================
Aktueller Fallback
================================

Solange wlad-portrait.jpg fehlt → /landing/hf-04.png
(Higgsfield-AI-Mockup mit Wlad-Thumb). Deshalb zeigt §04
trotzdem ein Bild — aber nicht das echte Foto.

Sobald wlad-portrait.jpg existiert → echtes Foto.
Sobald wlad-stage.jpg existiert → echtes Bühnenfoto.

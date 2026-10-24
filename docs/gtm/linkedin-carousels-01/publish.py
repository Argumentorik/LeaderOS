"""Veröffentlicht gerenderte Karussells unter frontend/public/preview/carousels-01
und schreibt docs/gtm/linkedin-carousels-01/manifest.json mit öffentlichen URLs.

    python3 -I publish.py <outDir>

<outDir> ist der Ausgabeordner von render.cjs (Folien-JPGs, -ig.jpg, PDFs,
manifest.json). Kopiert werden nur Dateien, die im Manifest stehen; die
Kontaktblätter bleiben lokal. Die öffentlichen URLs (leader-os.de/preview/…)
sind für die API-Anbindung gedacht (Postproxy o. ä.: LinkedIn-Dokument = PDF,
Instagram = Einzelbilder). robots.txt schließt /preview/ aus.
"""
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PUBLIC = ROOT / "frontend" / "public" / "preview" / "carousels-01"
BASE = "https://leader-os.de/preview/carousels-01/"

out = Path(sys.argv[1])
rendered = json.loads((out / "manifest.json").read_text())
PUBLIC.mkdir(parents=True, exist_ok=True)

manifest = []
copied = 0
for c in sorted(rendered, key=lambda c: c["id"]):
    files = [*c["slides"], c["slides_instagram"][-1], c["pdf"]]
    for f in files:
        shutil.copy2(out / f, PUBLIC / f)
        copied += 1
    manifest.append({
        "id": c["id"],
        "slug": c["slug"],
        "title": c["title"],
        "caption_ref": f"CAPTIONS.md#{c['id'].lower()}",
        "linkedin": {"slides": [BASE + f for f in c["slides"]], "pdf": BASE + c["pdf"]},
        "instagram": {"slides": [BASE + f for f in c["slides_instagram"]]},
    })

(HERE / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"{len(manifest)} Karussells, {copied} Dateien nach {PUBLIC.relative_to(ROOT)}")

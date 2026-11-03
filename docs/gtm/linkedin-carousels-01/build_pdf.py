"""Baut aus den gerenderten Folien pro Karussell eine PDF (LinkedIn-Dokument).

    python3 -I build_pdf.py <outDir>

Liest manifest.json aus outDir, schreibt <ID>.pdf daneben (1080×1350 pt
Seiten, JPEG-Qualität 85) und ein Kontaktblatt contact-<ID>.jpg zur Sichtprüfung.
"""
import json
import sys
from pathlib import Path

from PIL import Image

out = Path(sys.argv[1])
only = sys.argv[2] if len(sys.argv) > 2 else None
manifest = json.loads((out / "manifest.json").read_text())
for c in manifest:
    if only and c["id"] != only:
        continue
    pages = [Image.open(out / f).convert("RGB") for f in c["slides"]]
    pdf = out / c["pdf"]
    pages[0].save(pdf, save_all=True, append_images=pages[1:], quality=85, resolution=200)
    w, h = 432, 540
    sheet = Image.new("RGB", (w * len(pages), h), "white")
    for i, p in enumerate(pages):
        t = p.copy()
        t.thumbnail((w, h))
        sheet.paste(t, (i * w, 0))
    sheet.save(out / f"contact-{c['id']}.jpg", quality=80)
    print(c["id"], len(pages), "pages ->", pdf.name, f"{pdf.stat().st_size // 1024} KB")

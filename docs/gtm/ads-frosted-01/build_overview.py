#!/usr/bin/env python3
"""
Anzeigenserie "Frosted" · Übersichtsblatt

Legt alle zwölf Anzeigen in ein Blatt (Spalten = Motive FR01 bis FR04, Zeilen =
Formate 4:5, 9:16, 1:1), zur Sichtprüfung und zum Abnicken.

    /usr/bin/python3 -I build_overview.py [outFile]
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'overview.jpg')
manifest = json.load(open(os.path.join(HERE, 'manifest.json'), encoding='utf-8'))
CW, GAP, PAD = 360, 14, 24
rows = ['4x5', '9x16', '1x1']
heights = {f: None for f in rows}
tiles = {}
for f in rows:
    for i, ad in enumerate(manifest):
        im = Image.open(os.path.join(HERE, ad['files'][f])).convert('RGB')
        h = round(im.height * CW / im.width)
        tiles[(f, i)] = im.resize((CW, h), Image.LANCZOS)
        heights[f] = h
W = PAD * 2 + len(manifest) * CW + (len(manifest) - 1) * GAP
H = PAD * 2 + sum(heights.values()) + (len(rows) - 1) * GAP
sheet = Image.new('RGB', (W, H), (8, 9, 12))
y = PAD
for f in rows:
    for i in range(len(manifest)):
        sheet.paste(tiles[(f, i)], (PAD + i * (CW + GAP), y))
    y += heights[f] + GAP
sheet.save(OUT, quality=88)
print('geschrieben:', OUT, sheet.size)

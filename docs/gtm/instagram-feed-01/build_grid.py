#!/usr/bin/env python3
"""
Instagram-Feed 01 · Rasteransicht

Legt die zwölf Kacheln so, wie das Profil sie zeigt (neuester Post oben links),
und schneidet jede auf 3:4 zu: Instagram zeigt Posts im Raster seit 2025 im
Format 3:4, ein 4:5-Bild verliert dabei links und rechts je 3 Prozent. Alle
Inhalte liegen deshalb mindestens 72 px vom Rand.

    /usr/bin/python3 -I build_grid.py [outFile]

Kacheln 01, 05, 08 = Titelfolien W01, W02, W03 aus ../linkedin-wladbot-01,
alle anderen aus diesem Ordner (IG-02.jpg ...).
"""
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(HERE, '..', 'linkedin-wladbot-01')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'grid.jpg')

ORDER = [
    os.path.join(W, 'W01-01.jpg'), os.path.join(HERE, 'IG-02.jpg'), os.path.join(HERE, 'IG-03.jpg'),
    os.path.join(HERE, 'IG-04.jpg'), os.path.join(W, 'W02-01.jpg'), os.path.join(HERE, 'IG-06.jpg'),
    os.path.join(HERE, 'IG-07.jpg'), os.path.join(W, 'W03-01.jpg'), os.path.join(HERE, 'IG-09.jpg'),
    os.path.join(HERE, 'IG-10.jpg'), os.path.join(HERE, 'IG-11.jpg'), os.path.join(HERE, 'IG-12.jpg'),
]
CW, CH, GAP, PAD = 400, 533, 6, 28


def crop34(im):
    w, h = im.size
    nw = round(h * 3 / 4)
    x = (w - nw) // 2
    return im.crop((x, 0, x + nw, h)).resize((CW, CH), Image.LANCZOS)


def main():
    sheet = Image.new('RGB', (PAD * 2 + CW * 3 + GAP * 2, PAD * 2 + CH * 4 + GAP * 3), (8, 9, 12))
    for i, f in enumerate(ORDER):
        tile = crop34(Image.open(f).convert('RGB'))
        sheet.paste(tile, (PAD + (i % 3) * (CW + GAP), PAD + (i // 3) * (CH + GAP)))
    sheet.save(OUT, quality=90)
    print('geschrieben:', OUT, sheet.size)


if __name__ == '__main__':
    main()

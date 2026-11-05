#!/usr/bin/env python3
"""
W-Serie "WladBot" · Bild-Bausteine für carousel.html

Der WladBot ist die Hauptfigur der Karussells. Aus dem bestehenden Produkt-Bild
(frontend/public/wlad/wladbot3.0.png, 512×512 auf hellem Grund) entsteht ein
sauberer Freisteller; dazu ein Filmkorn-Tile und je Karussell ein QR-Code.
Es wird nichts neu erzeugt: kein neues Gesicht, nur das vorhandene Maskottchen.

    /usr/bin/python3 build_assets.py [outDir]

Braucht Pillow, numpy, scipy und `qrcode` (backend/requirements.txt hat
qrcode==8.2; lokal reicht `pip install --target <dir> qrcode scipy` und
PYTHONPATH=<dir>).

Ausgabe in outDir (Standard: ./build, nicht eingecheckt):
  mascot.png            Freisteller 1024×1024 (RGBA)
  grain.png             Filmkorn-Tile 512×512 (Graustufen, Mittelwert 128)
  qr-w01.svg … qr-w03.svg   QR-Codes (Vektor, transparent), je mit eigenem utm_content
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', 'frontend', 'public', 'wlad', 'wladbot3.0.png')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')

# 14-Tage-Zugang auf der App-Domain (derselbe Pfad wie die Landing-CTAs), je
# Karussell mit eigenem utm_content, damit Scans getrennt auswertbar sind. Die
# Länge ist so gewählt, dass der Code in Version 6 (41×41 Module) bleibt.
QR_BASE = 'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=wladbot&utm_content='
QR_IDS = ['w1', 'w2', 'w3']


def mascot(path):
    """Freisteller: Hintergrund ist ein heller, unbunter Verlauf, der über Rand verbunden ist."""
    a = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    bg_like = ((a.max(2) - a.min(2)) < 16) & (a.min(2) > 188)
    lab, _ = ndi.label(bg_like)
    edge = np.unique(np.concatenate([lab[0, :], lab[:, 0], lab[:, -1]]))   # oben, links, rechts (unten sitzt die Jacke)
    bg = np.isin(lab, edge[edge > 0])
    fg = ndi.binary_fill_holes(~bg)
    lab2, n2 = ndi.label(fg)
    fg = lab2 == (1 + int(np.argmax(ndi.sum(fg, lab2, range(1, n2 + 1)))))
    # Rand entfärben: Randpixel nehmen die Farbe des nächsten Kernpixels (kein heller Saum auf dunklem Grund)
    core = ndi.binary_erosion(fg, iterations=3)
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    rgb = np.where(core[..., None], a, a[idx[0], idx[1]])
    alpha = np.clip((ndi.gaussian_filter(fg.astype(np.float32), 1.1) - 0.35) / 0.4, 0, 1)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    out.resize((1024, 1024), Image.LANCZOS).save(path)


def grain(path):
    rng = np.random.default_rng(1107)
    n = rng.normal(128, 38, (512, 512)).clip(0, 255).astype(np.uint8)
    Image.fromarray(n, 'L').save(path)


def make_qr(path, uid):
    try:
        import qrcode
    except ImportError:
        sys.exit('qrcode fehlt: pip install --target <dir> qrcode==8.2 und PYTHONPATH=<dir> setzen')
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=0)
    qr.add_data(QR_BASE + uid)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    n = len(matrix)
    runs = []
    for y, row in enumerate(matrix):
        x = 0
        while x < n:
            if row[x]:
                start = x
                while x < n and row[x]:
                    x += 1
                runs.append(f'M{start} {y}h{x - start}v1h-{x - start}z')
            else:
                x += 1
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
           f'<path fill="#0A0A0A" d="{"".join(runs)}"/></svg>')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg)
    return qr.version, n


def main():
    os.makedirs(OUT, exist_ok=True)
    mascot(os.path.join(OUT, 'mascot.png'))
    grain(os.path.join(OUT, 'grain.png'))
    info = [make_qr(os.path.join(OUT, f'qr-{uid.replace("w", "w0")}.svg'), uid) for uid in QR_IDS]
    print(f'wrote mascot.png, grain.png, {len(info)} QR-Codes (Version/Module {info}) nach {OUT}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
F01 "Fenster" · Foto-Ebenen und QR-Code für carousel.html

Jede der fünf Folien hat ein eigenes Bild: Einzelbilder aus dem echten
Intro-Video (src/*.jpg, siehe src/README.txt), jedes mit anderer Geste, anderem
Ausschnitt und anderem Maßstab. Der Fokus wandert: Folie 1 die linke
Gesichtshälfte (senkrechtes Fenster), Folie 2 der Blick (schmaler Streifen über
den Augen, Nahaufnahme), Folie 3 die Hände (Streifen über der Geste), Folie 4
die WladBot-Oberfläche (HTML in carousel.html; hier entsteht nur der
Hintergrund). Der Hintergrund wird von Folie zu Folie schärfer (je öfter
wiederholt, desto klarer). Folie 5 zeigt das ganze Bild scharf, höher gerahmt,
damit unten Platz für Text und QR-Code bleibt.

    /usr/bin/python3 build_assets.py [outDir]

Braucht Pillow, numpy und `qrcode` (backend/requirements.txt hat qrcode==8.2;
lokal reicht `pip install --target <dir> qrcode` und PYTHONPATH=<dir>).

Ausgabe in outDir (Standard: ./build, nicht eingecheckt):
  fenster-1.png … fenster-5.png   Foto-Ebenen, 2160×2700 (Maßstab 2)
  qr.svg                          QR-Code zu QR_URL (Vektor, transparent)

Die Fenstergeometrie (win in SLIDES) muss mit den Fenstern in carousel.html
übereinstimmen (dort `win` je Folie). Zufall ist mit festem Seed gesetzt,
Läufe sind reproduzierbar.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(HERE, 'src')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')

# Ziel des QR-Codes: 14-Tage-Zugang auf der App-Domain (derselbe Pfad wie die
# Landing-CTAs), mit eigener Kampagne, damit Scans getrennt auswertbar sind.
QR_URL = 'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=beta-fenster'

CW, CH = 1080, 1350      # Folie in CSS-px (4:5)
S = 2                    # Render-Maßstab (deviceScaleFactor)
CROP_X0, CROP_Y0 = 850, 0  # Versatz der Quelldateien im vollen 2560×1440-Frame (Ausschnitt x 850–1850, y 0–1300)

# Je Folie: Frame, Augenmitte im vollen Frame, Maßstab k (Folien-px je Quell-px),
# Ziel der Augenmitte auf der Folie (`at`), Hintergrund-Unschärfe in CSS-px,
# Fenster (x, y, w, h) und Art: Folie 1 senkrecht über der linken Gesichtshälfte
# (rechte Kante knapp links der Nasenlinie), Folie 2 Streifen über den Augen,
# Folie 3 Streifen über den Händen, Folie 4 Platz für die WladBot-Oberfläche.
# `gain` dunkelt den unscharfen Hintergrund ab (Standard BG_GAIN), `dx` justiert
# die Augenmitte von Hand nach (Haar-Cascade, ±10 px).
SLIDES = [
    dict(frame='f29', eyes=(1335.5, 408.5), k=1.65, at=(636, 668), blur=10.0, win=(336, 205, 290, 880), kind='photo', dx=0),
    dict(frame='f19', eyes=(1347.0, 395.0), k=2.20, at=(540, 600), blur=7.5, win=(90, 520, 900, 160), kind='photo', dx=0, gain=0.52),
    dict(frame='f03', eyes=(1343.5, 386.0), k=1.25, at=(540, 300), blur=5.0, win=(90, 565, 900, 345), kind='photo', dx=0, gain=0.52),
    dict(frame='f13', eyes=(1450.5, 390.5), k=1.46, at=(640, 560), blur=2.5, win=(311, 125, 340, 880), kind='ui', dx=0, gain=0.70),
    dict(frame='f21', eyes=(1295.5, 389.5), k=1.60, at=(600, 450), blur=0.0, win=None, kind='full', dx=0),
]
BG_GAIN = 0.74           # Helligkeit des unscharfen Hintergrunds (der Raum ist hell, Text liegt in Weiß darüber)


def grain(rng, h, w, cell, amp):
    """Filmkorn: Rauschen in kleinerer Auflösung, weich hochskaliert."""
    gh, gw = max(2, int(h / cell)), max(2, int(w / cell))
    n = rng.normal(0.0, 1.0, (gh, gw)).astype(np.float32)
    n = np.asarray(Image.fromarray(n, mode='F').resize((w, h), Image.BICUBIC), dtype=np.float32)
    return n * amp


def load_gray(spec, resample):
    """Quellausschnitt der Folie (Maßstab k, Augenmitte auf `at`), als Graustufen in 2160×2700."""
    img = Image.open(os.path.join(SRC_DIR, spec['frame'] + '.jpg')).convert('RGB')
    k = spec['k']
    ex, ey = spec['eyes']
    x0 = ex + spec['dx'] - spec['at'][0] / k
    y0 = ey - spec['at'][1] / k
    box = (x0 - CROP_X0, y0 - CROP_Y0, x0 - CROP_X0 + CW / k, y0 - CROP_Y0 + CH / k)
    if box[0] < 0 or box[1] < 0 or box[2] > img.width or box[3] > img.height:
        sys.exit(f"Ausschnitt von {spec['frame']} liegt außerhalb der Quelldatei: {box} in {img.size}")
    return ImageOps.grayscale(img.resize((CW * S, CH * S), resample, box=box))


def tone_sharp(a):
    """Kontrast für scharfe Bereiche, mit weicher Schulter (Lichter rollen aus)."""
    a = (a - 0.5) * 1.15 + 0.5 - 0.04
    knee = 0.78
    return np.clip(np.where(a > knee, knee + (a - knee) * 0.55, a), 0.0, 1.0)


def sharp_layer(spec):
    gray = load_gray(spec, Image.BICUBIC).filter(ImageFilter.UnsharpMask(radius=1.6 * S, percent=105, threshold=3))
    return tone_sharp(np.asarray(gray, dtype=np.float32) / 255.0)


def window_layer(spec, rng):
    x0, y0, ww, wh = (int(v * S) for v in spec['win'])
    win = sharp_layer(spec)[y0:y0 + wh, x0:x0 + ww]
    # zu den Fensterrändern hin etwas Licht nehmen, damit es nicht ausfranst
    fall = min(70.0 * S, wh * 0.22)
    edge_y = np.clip(np.minimum(np.arange(wh), wh - 1 - np.arange(wh)) / fall, 0.0, 1.0)
    win = win * (0.80 + 0.20 * edge_y[:, None])
    return np.clip(win + grain(rng, wh, ww, 1.3 * S, 0.040), 0.0, 1.0), (x0, y0, ww, wh)


def halo(h, w, rect):
    """Weicher Schatten rund um das Fenster, hebt es vom Hintergrund ab."""
    x0, y0, ww, wh = rect
    pad = 38 * S
    img = Image.new('L', (ww + 2 * pad, wh + 2 * pad), 0)
    img.paste(255, (pad, pad, pad + ww, pad + wh))
    img = img.filter(ImageFilter.GaussianBlur(20 * S))
    shade = np.ones((h, w), dtype=np.float32)
    shade[y0 - pad:y0 + wh + pad, x0 - pad:x0 + ww + pad] = 1.0 - 0.34 * (np.asarray(img, dtype=np.float32) / 255.0)
    return shade


def background(spec, rng, rect):
    """Dunkler, körniger, unscharfer Hintergrund."""
    h, w = CH * S, CW * S
    gray = load_gray(spec, Image.LANCZOS)
    bg = np.asarray(gray.filter(ImageFilter.GaussianBlur(spec['blur'] * S)), dtype=np.float32) / 255.0
    gain = spec.get('gain', BG_GAIN)
    bg = np.clip((bg - 0.06) / 0.88, 0.0, 1.0) ** 1.05 * gain
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d2 = ((xx - 0.56 * w) / (0.58 * w)) ** 2 + ((yy - 0.43 * h) / (0.78 * h)) ** 2
    vig = np.clip(1.0 - 0.56 * d2, 0.26, 1.0)
    floor = np.clip((yy / h - 0.60) / 0.40, 0.0, 1.0)          # unten dunkler für den Textblock
    vig *= 1.0 - 0.52 * floor ** 1.4
    bg = bg * vig + grain(rng, h, w, 2.6 * S, 0.055) * (0.35 + 0.65 * bg * vig / gain)
    return np.clip(bg * halo(h, w, rect), 0.0, 1.0)


def slide_with_window(spec, rng):
    win, rect = window_layer(spec, np.random.default_rng(1107)) if spec['kind'] == 'photo' else (None, tuple(int(v * S) for v in spec['win']))
    out = background(spec, rng, rect)
    x0, y0, ww, wh = rect
    out[y0:y0 + wh, x0:x0 + ww] = win if win is not None else 0.04   # Folie 4: HTML-Fenster liegt darüber
    return out


def slide_full_sharp(spec, rng):
    """Folie 5: ganzes Bild scharf, unten abgedunkelt für Text und QR."""
    a = sharp_layer(spec)
    h, w = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d2 = ((xx - 0.54 * w) / (0.78 * w)) ** 2 + ((yy - 0.30 * h) / (0.70 * h)) ** 2
    a = a * np.clip(1.0 - 0.50 * d2, 0.34, 1.0) * 0.82
    floor = np.clip((yy / h - 0.50) / 0.30, 0.0, 1.0)
    a = a * (1.0 - 0.84 * floor ** 1.15)
    a = a + grain(rng, h, w, 2.6 * S, 0.030) + grain(rng, h, w, 1.3 * S, 0.034)
    return np.clip(a, 0.0, 1.0)


def make_qr(path):
    """QR-Code als schlankes SVG: ein Pfad aus waagerechten Läufen, Modul = 1 Einheit,
    ohne Ruhezone (die liefert die weiße Karte in carousel.html)."""
    try:
        import qrcode
    except ImportError:
        sys.exit('qrcode fehlt: pip install --target <dir> qrcode==8.2 und PYTHONPATH=<dir> setzen')
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=0)
    qr.add_data(QR_URL)
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
    rng = np.random.default_rng(1107)
    layers = [slide_full_sharp(s, rng) if s['kind'] == 'full' else slide_with_window(s, rng) for s in SLIDES]
    for i, a in enumerate(layers, 1):
        Image.fromarray((a * 255.0 + 0.5).astype(np.uint8), mode='L').save(
            os.path.join(OUT, f'fenster-{i}.png'), compress_level=3)
    version, modules = make_qr(os.path.join(OUT, 'qr.svg'))
    print(f'wrote {len(layers)} Ebenen und qr.svg (Version {version}, {modules}×{modules} Module) nach {OUT}')


if __name__ == '__main__':
    main()

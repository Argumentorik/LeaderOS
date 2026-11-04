#!/usr/bin/env python3
"""
F01 "Fenster" · Foto-Ebenen und QR-Code für carousel.html

Das Karussell zeigt Wlads Portrait fünfmal. Auf den Folien 1 bis 4 liegt ein
scharfes, senkrechtes Fenster über der linken Gesichtshälfte, der Hintergrund
wird von Folie zu Folie schärfer (Fokuszug: je öfter wiederholt, desto klarer).
Folie 5 zeigt das ganze Bild scharf, etwas höher gerahmt, damit unten Platz für
Text und QR-Code bleibt. Alle Ebenen entstehen aus demselben Foto
(frontend/public/wlad/wlad-portrait.jpg), das Fenster sitzt deckungsgleich.

    /usr/bin/python3 build_assets.py [outDir]

Braucht Pillow, numpy und `qrcode` (backend/requirements.txt hat qrcode==8.2;
lokal reicht `pip install --target <dir> qrcode` und PYTHONPATH=<dir>).

Ausgabe in outDir (Standard: ./build, nicht eingecheckt):
  fenster-1.png … fenster-5.png   Foto-Ebenen, 2160×2700 (Maßstab 2)
  qr.svg                          QR-Code zu QR_URL (Vektor, transparent)

Die Fenstergeometrie (WIN) muss mit den CSS-Variablen in carousel.html
übereinstimmen. Zufall ist mit festem Seed gesetzt, Läufe sind reproduzierbar.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', 'frontend', 'public', 'wlad', 'wlad-portrait.jpg')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')

# Ziel des QR-Codes: 14-Tage-Zugang auf der App-Domain (derselbe Pfad wie die
# Landing-CTAs), mit eigener Kampagne, damit Scans getrennt auswertbar sind.
QR_URL = 'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=beta-fenster'

CW, CH = 1080, 1350      # Folie in CSS-px (4:5)
S = 2                    # Render-Maßstab (deviceScaleFactor)
K = 2.7                  # Quell-px → CSS-px (400 Quell-px werden auf 1080 gestreckt)

# Ausschnitte aus dem Quellfoto (1376×768). Nasenlinie x≈741,7 landet bei x=636,
# Augenlinie y≈197 bei y=620 (Ausschnitt A) bzw. y≈518 (Ausschnitt B).
BOX_A, Y0_A = (506.1, 0.0, 906.1, 467.4), 88      # Folien 1 bis 4; darüber wird die oberste Zeile gedehnt
BOX_B, Y0_B = (506.1, 16.0, 906.1, 516.0), 0      # Folie 5: Gesicht höher, unten Platz für QR

# Das scharfe Fenster: linke Gesichtshälfte, rechte Kante knapp links der Nasenlinie
# (x=626 statt 636, damit der helle Pfosten ab x≈629 nicht als Streifen hineinragt).
WIN = dict(x=336, y=205, w=290, h=880)

BLURS = [13, 9.5, 6, 3]  # Gaussian-Sigma des Hintergrunds in CSS-px, Folien 1 bis 4


def grain(rng, h, w, cell, amp):
    """Filmkorn: Rauschen in kleinerer Auflösung, weich hochskaliert."""
    gh, gw = max(2, int(h / cell)), max(2, int(w / cell))
    n = rng.normal(0.0, 1.0, (gh, gw)).astype(np.float32)
    n = np.asarray(Image.fromarray(n, mode='F').resize((w, h), Image.BICUBIC), dtype=np.float32)
    return n * amp


def compose(img, resample, box, y0):
    """Quellausschnitt auf Foliengröße strecken; über y0 die oberste Zeile dehnen."""
    w, h = CW * S, CH * S
    crop_h = round((box[3] - box[1]) * K * S)
    crop = img.resize((w, crop_h), resample, box=box)
    canvas = Image.new('RGB', (w, h))
    if y0 > 0:
        canvas.paste(crop.crop((0, 0, w, 1)).resize((w, y0 * S)), (0, 0))
    canvas.paste(crop, (0, y0 * S))
    return ImageOps.grayscale(canvas)


def soften_sharp(src):
    """Quelle leicht entrauschen (JPEG-Blöcke werden beim fünffachen Hochskalieren
    sonst zu Flecken), weich hochskalieren, nur dezent schärfen (sonst Halos)."""
    return src.filter(ImageFilter.MedianFilter(3))


def tone_sharp(a):
    """Kontrast für scharfe Bereiche, mit weicher Schulter (Lichter rollen aus)."""
    a = (a - 0.5) * 1.17 + 0.5 - 0.05
    knee = 0.78
    return np.clip(np.where(a > knee, knee + (a - knee) * 0.55, a), 0.0, 1.0)


def window_layer(src, rng):
    gray = compose(soften_sharp(src), Image.BICUBIC, BOX_A, Y0_A)
    gray = gray.filter(ImageFilter.UnsharpMask(radius=1.8 * S, percent=115, threshold=3))
    x0, y0, ww, wh = (int(WIN[k] * S) for k in ('x', 'y', 'w', 'h'))
    win = np.asarray(gray.crop((x0, y0, x0 + ww, y0 + wh)), dtype=np.float32) / 255.0
    win = tone_sharp(win)
    # zu den Fensterrändern hin etwas Licht nehmen, damit es nicht ausfranst
    edge_y = np.clip(np.minimum(np.arange(wh), wh - 1 - np.arange(wh)) / (70.0 * S), 0.0, 1.0)
    win = win * (0.78 + 0.22 * edge_y[:, None])
    win = np.clip(win + grain(rng, wh, ww, 1.3 * S, 0.040), 0.0, 1.0)
    return win, (x0, y0, ww, wh)


def halo(h, w, rect):
    """Weicher Schatten rund um das Fenster, hebt es vom Hintergrund ab."""
    x0, y0, ww, wh = rect
    pad = 38 * S
    img = Image.new('L', (ww + 2 * pad, wh + 2 * pad), 0)
    img.paste(255, (pad, pad, pad + ww, pad + wh))
    img = img.filter(ImageFilter.GaussianBlur(20 * S))
    shade = np.ones((h, w), dtype=np.float32)
    shade[y0 - pad:y0 + wh + pad, x0 - pad:x0 + ww + pad] = 1.0 - 0.32 * (np.asarray(img, dtype=np.float32) / 255.0)
    return shade


def background(gray, blur, rng, rect):
    """Dunkler, körniger Hintergrund; blur=0 bleibt scharf."""
    h, w = gray.size[1], gray.size[0]
    img = gray.filter(ImageFilter.GaussianBlur(blur * S)) if blur > 0 else gray
    bg = np.asarray(img, dtype=np.float32) / 255.0
    bg = np.clip((bg - 0.06) / 0.82, 0.0, 1.0) ** 0.92 * 0.80
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d2 = ((xx - 0.56 * w) / (0.80 * w)) ** 2 + ((yy - 0.43 * h) / (0.78 * h)) ** 2
    vig = np.clip(1.0 - 0.48 * d2, 0.30, 1.0)
    floor = np.clip((yy / h - 0.60) / 0.40, 0.0, 1.0)          # unten dunkler für den Textblock
    vig *= 1.0 - 0.52 * floor ** 1.4
    bg = bg * vig + grain(rng, h, w, 2.6 * S, 0.060) * (0.35 + 0.65 * bg * vig)
    return np.clip(bg * halo(h, w, rect), 0.0, 1.0)


def slide_with_window(src, blur, rng):
    gray = compose(src, Image.LANCZOS, BOX_A, Y0_A)
    win, rect = window_layer(src, np.random.default_rng(1107))   # gleiches Fenster auf allen Folien
    out = background(gray, blur, rng, rect)
    x0, y0, ww, wh = rect
    out[y0:y0 + wh, x0:x0 + ww] = win
    return out


def slide_full_sharp(src, rng):
    """Folie 5: ganzes Bild scharf, unten abgedunkelt für Text und QR."""
    gray = compose(soften_sharp(src), Image.BICUBIC, BOX_B, Y0_B)
    gray = gray.filter(ImageFilter.UnsharpMask(radius=1.8 * S, percent=115, threshold=3))
    a = tone_sharp(np.asarray(gray, dtype=np.float32) / 255.0)
    h, w = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d2 = ((xx - 0.54 * w) / (0.78 * w)) ** 2 + ((yy - 0.30 * h) / (0.70 * h)) ** 2
    a = a * np.clip(1.0 - 0.50 * d2, 0.34, 1.0)
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
    src = Image.open(SRC).convert('RGB')
    layers = [slide_with_window(src, b, rng) for b in BLURS] + [slide_full_sharp(src, rng)]
    for i, a in enumerate(layers, 1):
        Image.fromarray((a * 255.0 + 0.5).astype(np.uint8), mode='L').save(
            os.path.join(OUT, f'fenster-{i}.png'), compress_level=3)
    version, modules = make_qr(os.path.join(OUT, 'qr.svg'))
    print(f'wrote {len(layers)} Ebenen und qr.svg (Version {version}, {modules}×{modules} Module) nach {OUT}')


if __name__ == '__main__':
    main()

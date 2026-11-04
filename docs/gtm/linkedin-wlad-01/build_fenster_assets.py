#!/usr/bin/env python3
"""
LI·07 "Fenster": Foto-Ebene für poster-fenster.html

Das Poster zeigt Wlads Portrait zweimal: als unscharfen, körnigen Schwarzweiß-
Hintergrund und, deckungsgleich darüber, als scharfes Fenster über der linken
Gesichtshälfte. Beide Ebenen entstehen hier aus demselben Foto
(frontend/public/wlad/wlad-portrait.jpg), damit sie pixelgenau sitzen.

    /usr/bin/python3 build_fenster_assets.py [outDir]

Ausgabe in outDir (Standard: ./build, nicht eingecheckt):
  li07-photo.png      Hintergrund + Fenster, 2160×2700 (Maßstab 2)
  li07-preview.jpg    dasselbe in 1080×1350 zum schnellen Ansehen

Die Geometrie unten (WIN) muss mit den CSS-Variablen in poster-fenster.html
übereinstimmen. Zufall ist mit festem Seed gesetzt, Läufe sind reproduzierbar.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '..', 'frontend', 'public', 'wlad', 'wlad-portrait.jpg')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')

CW, CH = 1080, 1350      # Poster in CSS-px (4:5)
S = 2                    # Render-Maßstab (deviceScaleFactor)

# Ausschnitt aus dem Quellfoto (1376×768). 400 Quell-px werden auf 1080 gestreckt
# (Faktor 2,7): Nasenlinie (x≈741,7) landet bei x=636, Augenlinie (y≈197) bei
# y=620. Der Ausschnitt beginnt bei Y0; darüber wird die oberste Zeile gedehnt.
SRC_BOX = (506.1, 0.0, 906.1, 467.4)
K = CW / (SRC_BOX[2] - SRC_BOX[0])
Y0 = 88

# Das scharfe Fenster: linke Gesichtshälfte, rechte Kante knapp links der Nasenlinie
# (x=626 statt 636, damit der helle Pfosten ab x≈629 nicht als Streifen hineinragt).
WIN = dict(x=336, y=205, w=290, h=880)

BLUR = 13                # Gaussian-Sigma des Hintergrunds in CSS-px


def grain(rng, h, w, cell, amp):
    """Filmkorn: Rauschen in kleinerer Auflösung, weich hochskaliert."""
    gh, gw = max(2, int(h / cell)), max(2, int(w / cell))
    n = rng.normal(0.0, 1.0, (gh, gw)).astype(np.float32)
    n = np.asarray(Image.fromarray(n, mode='F').resize((w, h), Image.BICUBIC), dtype=np.float32)
    return n * amp


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(1107)
    w, h = CW * S, CH * S

    src = Image.open(SRC).convert('RGB')
    crop_h = round((SRC_BOX[3] - SRC_BOX[1]) * K * S)

    def compose(img, resample):
        """Quellausschnitt auf Postergröße strecken, darüber die oberste Zeile dehnen."""
        crop = img.resize((w, crop_h), resample, box=SRC_BOX)
        canvas = Image.new('RGB', (w, h))
        canvas.paste(crop.crop((0, 0, w, 1)).resize((w, Y0 * S)), (0, 0))
        canvas.paste(crop, (0, Y0 * S))
        return ImageOps.grayscale(canvas)

    gray = compose(src, Image.LANCZOS)

    # ---- Hintergrund: unscharf, dunkel, grobes Korn -------------------------
    bg = np.asarray(gray.filter(ImageFilter.GaussianBlur(BLUR * S)), dtype=np.float32) / 255.0
    bg = np.clip((bg - 0.08) / 0.80, 0.0, 1.0) ** 1.2 * 0.74
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = 0.56 * w, 0.43 * h
    d2 = ((xx - cx) / (0.80 * w)) ** 2 + ((yy - cy) / (0.78 * h)) ** 2
    vig = np.clip(1.0 - 0.62 * d2, 0.22, 1.0)
    floor = np.clip((yy / h - 0.60) / 0.40, 0.0, 1.0)          # unten dunkler für den Textblock
    vig *= 1.0 - 0.58 * floor ** 1.4
    bg = bg * vig
    bg = bg + grain(rng, h, w, 2.6 * S, 0.060) * (0.35 + 0.65 * bg)
    bg = np.clip(bg, 0.0, 1.0)

    # ---- Fenster: scharf, kontrastreicher, feines Korn ----------------------
    # Quelle leicht entrauschen (JPEG-Blöcke werden beim fünffachen Hochskalieren
    # sonst zu Flecken), weich hochskalieren, nur dezent schärfen (sonst Halos).
    sharp = compose(src.filter(ImageFilter.MedianFilter(3)), Image.BICUBIC)
    sharp = sharp.filter(ImageFilter.UnsharpMask(radius=1.8 * S, percent=115, threshold=3))
    x0, y0, ww, wh = (int(WIN[k] * S) for k in ('x', 'y', 'w', 'h'))
    win = np.asarray(sharp.crop((x0, y0, x0 + ww, y0 + wh)), dtype=np.float32) / 255.0
    win = (win - 0.5) * 1.17 + 0.5 - 0.05
    knee = 0.78                                   # weiche Schulter: Lichter rollen aus statt abzureißen
    win = np.clip(np.where(win > knee, knee + (win - knee) * 0.55, win), 0.0, 1.0)
    # zu den Fensterrändern hin etwas Licht nehmen, damit es nicht ausfranst
    edge_y = np.clip(np.minimum(np.arange(wh), wh - 1 - np.arange(wh)) / (70.0 * S), 0.0, 1.0)
    win = win * (0.78 + 0.22 * edge_y[:, None])
    win = win + grain(rng, wh, ww, 1.3 * S, 0.040)
    win = np.clip(win, 0.0, 1.0)

    # Schatten rund um das Fenster, hebt es vom Hintergrund ab
    shade = np.ones((h, w), dtype=np.float32)
    pad = 38 * S
    sx0, sy0, sx1, sy1 = x0 - pad, y0 - pad, x0 + ww + pad, y0 + wh + pad
    sub = shade[max(sy0, 0):sy1, max(sx0, 0):sx1]
    sh_img = Image.new('L', (sx1 - sx0, sy1 - sy0), 0)
    sh_img.paste(255, (pad, pad, pad + ww, pad + wh))
    sh_img = sh_img.filter(ImageFilter.GaussianBlur(20 * S))
    s_arr = np.asarray(sh_img, dtype=np.float32) / 255.0
    sub_h, sub_w = sub.shape
    shade[max(sy0, 0):sy1, max(sx0, 0):sx1] = 1.0 - 0.32 * s_arr[
        (max(sy0, 0) - sy0):(max(sy0, 0) - sy0) + sub_h, (max(sx0, 0) - sx0):(max(sx0, 0) - sx0) + sub_w]
    bg = bg * shade

    out = bg.copy()
    out[y0:y0 + wh, x0:x0 + ww] = win
    img = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8), mode='L')
    img.save(os.path.join(OUT, 'li07-photo.png'), compress_level=3)
    img.resize((CW, CH), Image.LANCZOS).convert('RGB').save(os.path.join(OUT, 'li07-preview.jpg'), quality=90)
    print('wrote', OUT, img.size)


if __name__ == '__main__':
    main()

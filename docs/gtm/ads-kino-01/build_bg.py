"""Baut die Hintergründe der Serie "Kino": echtes Foto hinter Riffelglas, das Gesicht bleibt scharf.
   Aufruf: /usr/bin/python3 -I build_bg.py   (braucht ../social-kit/build, siehe build_assets.py)
   Das Foto wird nur skaliert, verschoben und gebrochen. Kein erzeugtes Bild, keine KI-Schärfung."""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
H0 = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(H0, '..', 'social-kit', 'build')
W = 1080
FORMATS = {'4x5': (1350, .29, .25), '9x16': (1920, .33, .20), '1x1': (1080, .25, .26)}  # Höhe, Gesichtsmitte y, Gesichtshöhe
MOTIVE = {  # Foto, Gesicht x/y/Höhe im Foto, scharfes Band (links, rechts in Slats um die Mitte), Tönung
    'K01': ('stage.jpg', .575, .20, .16, (-3, 4), (10, 26, 44)),
    'K02': ('talk.jpg', .50, .27, .30, (-4, 3), (40, 18, 10)),
    'K03': ('coaching.jpg', .69, .31, .20, (-3, 3), (12, 34, 40)),
    'K04': ('stage-ice.jpg', .575, .20, .16, (-4, 3), (8, 24, 50)),
}
SLAT = 60
for mid, (photo, fx, fy, fh, band, tint) in MOTIVE.items():
    src = Image.open(os.path.join(B, photo)).convert('RGB')
    for fmt, (H, cy, face) in FORMATS.items():
        s = H * face / (src.height * fh)
        im = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
        base = src.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(60))
        base = ImageEnhance.Brightness(base).enhance(.75)
        x0 = int(W * .5 - fx * im.width); y0 = int(H * cy - fy * im.height)
        edge = Image.new('L', im.size, 255)
        # weiche Kanten, damit das Foto in den unscharfen Grund läuft
        g = np.ones((im.height, im.width), np.float32); f = 140
        ramp = np.clip(np.arange(im.width) / f, 0, 1); g *= ramp[None, :] * ramp[::-1][None, :]
        rv = np.clip(np.arange(im.height) / f, 0, 1); g *= rv[::-1][:, None] if y0 + im.height > H else (rv * rv[::-1])[:, None]
        if y0 >= 0: g *= np.clip(np.arange(im.height) / f, 0, 1)[:, None]
        base.paste(im, (x0, y0), Image.fromarray((g * 255).astype(np.uint8)))
        a = np.asarray(base).astype(np.float32)
        soft = np.asarray(base.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
        xs = np.arange(W); c = W // 2
        k = np.floor((xs - c) / SLAT).astype(int); u = ((xs - c) % SLAT) / SLAT - .5
        centre = c + k * SLAT + SLAT / 2
        # Stärke je Slat: null im scharfen Band, steigt nach außen
        d = np.where(k < band[0], band[0] - k, np.where(k > band[1], k - band[1], 0))
        m = np.clip(d / 2.0, 0, 1)
        mag = 1 - m * 3.4  # 1 = unverändert, negativ = gespiegelt und gedehnt wie in Riffelglas
        sx = np.clip(centre + u * SLAT * mag, 0, W - 1).astype(int)
        out = a[:, sx, :] * (1 - m)[None, :, None] + soft[:, sx, :] * m[None, :, None]
        shade = 1 + m * (.16 * np.cos(2 * np.pi * u) - .10)
        out *= shade[None, :, None]
        # Kinotönung: Schatten in die Farbwelt ziehen, unten dunkel für die Schrift
        lum = out.mean(axis=2, keepdims=True) / 255
        out = out * (.82 + .18 * lum) + np.array(tint, np.float32)[None, None, :] * (1 - lum) * .9
        yy = np.linspace(0, 1, H)[:, None, None]
        out *= 1 - np.clip((yy - .5) / .5, 0, 1) ** 1.3 * .82
        out *= 1 - np.clip((.16 - yy) / .16, 0, 1) * .45
        res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
        res.save(os.path.join(H0, f'bg-{mid}-{fmt}.jpg'), quality=88)
    print(mid)

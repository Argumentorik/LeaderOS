"""Baut das Motiv "Scherben": das echte Porträt hinter Glasscherben, jede Scherbe zeigt einen
   versetzten, vergrößerten Ausschnitt desselben Fotos. Kein erzeugtes Gesicht, keine KI-Schärfung.
   Aufruf: /usr/bin/python3 -I build_bg.py   (braucht ../social-kit/build/portrait.png)"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
H0 = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(H0, '..', 'social-kit', 'build')
S = 2; W, H = 1080 * S, 1350 * S
src = Image.open(os.path.join(B, 'portrait.png')).convert('RGBA')
def layer(scale, cx, cy, fx, fy, bright=1.0):
    """Porträt so legen, dass der Bildpunkt (fx, fy) auf (cx, cy) fällt."""
    w = int(1000 * scale * S); im = src.resize((w, w), Image.LANCZOS)
    rgb = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(im.convert('RGB')).enhance(.5)).enhance(1.22)).enhance(bright)
    out = Image.new('RGB', (W, H), (4, 5, 5)); out.paste(rgb, (int(cx * S - fx * w), int(cy * S - fy * w)), im.split()[3]); return out
canvas = layer(1.0, 540, 470, .5, .40, .6)
vig = Image.new('L', (W, H), 0); ImageDraw.Draw(vig).ellipse([W * .08, H * -.05, W * .92, H * .72], fill=255)
canvas = Image.composite(canvas, ImageEnhance.Brightness(canvas).enhance(.45), vig.filter(ImageFilter.GaussianBlur(160 * S)))
# Scherben: Polygon, Ausschnitt (Maßstab, Bildpunkt fx/fy), Helligkeit
SHARDS = [
    ([(150, 40), (400, 10), (455, 262), (365, 300)], 1.3, .44, .29, .98),
    ([(650, 20), (990, 55), (705, 345), (625, 310)], 1.25, .565, .30, .95),
    ([(15, 320), (118, 285), (300, 585), (30, 650)], 1.2, .43, .33, .9),
    ([(775, 500), (1062, 405), (1076, 730), (850, 665)], 1.3, .53, .44, .95),
    ([(60, 730), (330, 675), (372, 790), (95, 985)], 1.15, .50, .30, .92),
    ([(900, 320), (1050, 250), (1070, 350)], 1.2, .58, .28, .8),
    ([(60, 205), (150, 180), (120, 250)], 1.2, .42, .27, .7),
    ([(700, 800), (860, 760), (930, 960), (740, 990)], 1.2, .53, .45, .8),
]
for poly, sc, fx, fy, br in SHARDS:
    p = [(x * S, y * S) for x, y in poly]; cx = sum(x for x, _ in poly) / len(poly); cy = sum(y for _, y in poly) / len(poly)
    sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).polygon([(x + 14 * S, y + 20 * S) for x, y in p], fill=200)
    canvas = Image.composite(Image.new('RGB', (W, H), (0, 0, 0)), canvas, sh.filter(ImageFilter.GaussianBlur(18 * S)))
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(p, fill=255)
    content = layer(sc, cx, cy, fx, fy, br)
    sheen = Image.linear_gradient('L').rotate(-35, expand=False).resize((W, H)).point(lambda v: int(v * .09))
    content = Image.composite(Image.new('RGB', (W, H), (235, 245, 250)), content, sheen)
    canvas = Image.composite(content, canvas, m)
    ed = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ed)
    d.line(p + [p[0]], fill=(255, 255, 255, 235), width=3 * S, joint='curve')
    inner = [(x + (cx * S - x) * .035, y + (cy * S - y) * .035) for x, y in p]; d.line(inner + [inner[0]], fill=(255, 255, 255, 70), width=2 * S)
    canvas = Image.alpha_composite(canvas.convert('RGBA'), ed).convert('RGB')
fade = Image.linear_gradient('L').resize((W, H)).point(lambda v: 0 if v < 150 else min(255, int((v - 150) * 3.6)))
canvas = Image.composite(Image.new('RGB', (W, H), (4, 5, 5)), canvas, fade)
canvas.resize((1080 * 2, 1350 * 2), Image.LANCZOS).save(os.path.join(H0, 'scherben-bg.jpg'), quality=90)
print('ok')

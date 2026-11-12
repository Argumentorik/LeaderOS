"""Baut die Plakat-Silhouetten: Wlads freigestelltes Porträt als Maske, gefüllt mit einem echten Foto.
   Aufruf: /usr/bin/python3 -I build_sil.py   (braucht ../social-kit/build, siehe build_assets.py)"""
import os
from PIL import Image, ImageEnhance, ImageFilter
H = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(H, '..', 'social-kit', 'build')
S = 1500
mask = Image.open(os.path.join(B, 'portrait.png')).convert('RGBA').split()[3].resize((S, S), Image.LANCZOS)
mask = mask.point(lambda v: 255 if v > 90 else 0).filter(ImageFilter.GaussianBlur(1.2))
for mid, photo, fx in (('M01', 'stage.jpg', .5), ('M02', 'coaching.jpg', .5), ('M03', 'seminar.jpg', .5), ('M04', 'stage-smoke.jpg', .5)):
    im = Image.open(os.path.join(B, photo)).convert('RGB')
    w, h = im.size; side = min(w, h); x = int((w - side) * fx)
    ph = int(S * .66)
    im = im.crop((x, 0, x + side, side)).resize((ph, ph), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(.6)
    im = Image.blend(im, Image.new('RGB', (ph, ph), (40, 88, 176)), .3)
    im = ImageEnhance.Contrast(im).enhance(1.1)
    # Oben blauer Dunst wie Himmel, das Foto sitzt im unteren Teil und blendet weich ein.
    sky = Image.linear_gradient('L').resize((S, S))
    base = Image.merge('RGB', [sky.point(lambda v, a=a, b=b: int(a + (b - a) * v / 255)) for a, b in ((92, 44), (132, 78), (206, 150))])
    fade = Image.linear_gradient('L').resize((ph, ph)).point(lambda v: min(255, int(v * 255 / 70)))
    base.paste(im, ((S - ph) // 2, S - ph), fade)
    im = base
    im.putalpha(mask)
    im.save(os.path.join(H, f'sil-{mid}.webp'), quality=86, method=6)
    print(mid, os.path.getsize(os.path.join(H, f'sil-{mid}.webp')) // 1024, 'KB')

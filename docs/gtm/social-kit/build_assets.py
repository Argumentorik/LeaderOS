#!/usr/bin/env python3
"""
Social-Kit · Bild-Bausteine für Karussells und Instagram-Feed

Alles, was nach Foto aussieht, stammt aus dem echten Bühnenfoto
(src/wlad-stage.webp). Es wird nichts erzeugt: keine KI-Gesichter, keine
Videostandbilder. Aus dem Foto entstehen

  stage.jpg        das Foto in Farbkorrektur (kühle Schatten, warme Lichter), 1,5-fach hochgerechnet
  stage-ice.jpg    dasselbe Foto als Eis-Duoton (Marine bis Eisblau), für die Anzeigen
  stage-smoke.jpg  dasselbe Foto in Rauchgrau (neutral, hell abgesetzt), für die Anzeigen
  amb-warm.jpg     unscharfer Lichtgrund aus dem Scheinwerfer, Verlauf Burgund bis Amber
  amb-cool.jpg     derselbe Lichtgrund, Verlauf Marine bis Blaugrün
  amb-lime.jpg     derselbe Lichtgrund, Verlauf Dunkelgrün bis Limette (für die CTA)
  grain.png        Filmkorn als Kachel (Overlay)

dazu aus dem Produkt-Maskottchen (frontend/public/wlad/wladbot3.0.png) einen
sauberen Freisteller (mascot.png) und je ein QR-Code pro Karussell.

    PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 build_assets.py [outDir]

Braucht Pillow, numpy, scipy und `qrcode` (backend/requirements.txt hat
qrcode==8.2; lokal reicht `pip install --target <dir> qrcode scipy`).
Ausgabe in outDir (Standard ./build, nicht eingecheckt).
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MASCOT_SRC = os.path.join(ROOT, 'frontend', 'public', 'wlad', 'wladbot3.0.png')
STAGE_SRC = os.path.join(HERE, 'src', 'wlad-stage.webp')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')

# 14-Tage-Zugang auf der App-Domain (derselbe Pfad wie die Landing-CTAs), je
# Karussell mit eigenem utm_content, damit Scans getrennt auswertbar sind. Die
# Länge ist so gewählt, dass der Code in Version 6 (41×41 Module) bleibt.
QR_BASE = 'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=wladbot&utm_content='
QR_IDS = ['w1', 'w2', 'w3']

# S-Serie (Speichern und Kommentieren): derselbe 14-Tage-Zugang, eigene Kampagne "save",
# je Karussell ein eigenes utm_content. Kein Webinar-Link. Version 6 (41×41 Module).
QR_SAVE_BASE = 'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=qr&utm_campaign=save&utm_content='
QR_SAVE_IDS = ['s01', 's02', 's03']


def grade(img):
    """Kühle Schatten, warme Lichter, sanfte S-Kurve."""
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    shadow = np.clip(1 - lum * 2.2, 0, 1)
    a = np.clip(a + shadow * np.array([0.012, 0.022, 0.034], dtype=np.float32), 0, 1)
    a = a * a * (3 - 2 * a) * 0.6 + a * 0.4
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def hue_shift(img, shift):
    """Farbton um shift (0..255-Skala von PIL-HSV) drehen."""
    hsv = np.asarray(img.convert('HSV')).astype(np.int32)
    hsv[..., 0] = (hsv[..., 0] + shift) % 256
    return Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')


def tone(img, bright=1.0, sat=1.0, lift=(0, 0, 0)):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    gray = a.mean(2, keepdims=True)
    a = gray + (a - gray) * sat
    a = a * bright + np.array(lift, dtype=np.float32)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


# Farbverläufe (Helligkeit 0..1 -> Farbe): je Lichtgrund eine Farbfamilie statt bunter Flecken
RAMPS = {
    'warm': [(0.00, (6, 6, 10)), (0.22, (38, 12, 18)), (0.52, (148, 50, 28)), (0.80, (244, 158, 84)), (1.00, (255, 236, 206))],
    'cool': [(0.00, (4, 8, 14)), (0.22, (8, 28, 44)), (0.52, (14, 84, 108)), (0.80, (88, 174, 188)), (1.00, (222, 246, 250))],
    'lime': [(0.00, (4, 7, 5)), (0.22, (10, 24, 9)), (0.52, (40, 70, 6)), (0.80, (150, 208, 16)), (1.00, (232, 255, 160))],
}


def ambient(src, box, sigma, ramp, flip=False, gamma=1.45):
    """Unscharfer Lichtgrund aus einem Ausschnitt des Fotos (4:5, 1080×1350).
    Die Helligkeitsstruktur (Scheinwerfer, Vorhangfalten) bleibt echt, die Farbe
    kommt aus einem Verlauf. Lichter werden weich gedeckelt."""
    c = src.crop(box)
    if flip:
        c = c.transpose(Image.FLIP_LEFT_RIGHT)
    c = c.resize((540, 675), Image.LANCZOS).filter(ImageFilter.GaussianBlur(sigma))
    a = np.asarray(c).astype(np.float32) / 255.0
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
    lum = np.clip((1 - np.exp(-lum * 1.9)) ** gamma, 0, 1)
    xs = np.array([p for p, _ in RAMPS[ramp]], dtype=np.float32)
    out = np.stack([np.interp(lum, xs, np.array([col[i] for _, col in RAMPS[ramp]], dtype=np.float32)) for i in range(3)], axis=-1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((1080, 1350), Image.BICUBIC)


GRADES = {
    'ice': [(0.00, (4, 9, 18)), (0.22, (16, 38, 62)), (0.50, (78, 120, 158)), (0.78, (184, 210, 230)), (1.00, (246, 251, 255))],
    'smoke': [(0.00, (12, 11, 11)), (0.28, (58, 54, 52)), (0.58, (146, 138, 132)), (0.84, (222, 216, 210)), (1.00, (252, 249, 245))],
}


def gradient_map(img, name, gamma=0.88):
    """Helligkeit des Fotos auf einen Farbverlauf legen (Duoton-Look der Anzeigen)."""
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    lum = np.clip(0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2], 0, 1) ** gamma
    ramp = GRADES[name]
    xs = np.array([p for p, _ in ramp], dtype=np.float32)
    out = np.stack([np.interp(lum, xs, np.array([c[i] for _, c in ramp], dtype=np.float32)) for i in range(3)], axis=-1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def stage_and_plates():
    src = Image.open(STAGE_SRC).convert('RGB')
    graded = grade(src)
    big = graded.resize((int(src.width * 1.5), int(src.height * 1.5)), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    big.save(os.path.join(OUT, 'stage.jpg'), quality=93, optimize=True)
    for name in GRADES:
        gradient_map(big, name).save(os.path.join(OUT, f'stage-{name}.jpg'), quality=93, optimize=True)

    # Lichtgründe: Scheinwerfer und Vorhang rechts neben dem Kopf (ohne Gesicht), nur defokussiert
    light = (930, 0, 1342, 509)
    ambient(graded, light, 6.5, 'warm').save(os.path.join(OUT, 'amb-warm.jpg'), quality=92)
    ambient(graded, light, 6.5, 'cool', flip=True).save(os.path.join(OUT, 'amb-cool.jpg'), quality=92)
    ambient(graded, light, 6.5, 'lime').save(os.path.join(OUT, 'amb-lime.jpg'), quality=92)


def grain(path, size=256, sigma=40.0, seed=7):
    rng = np.random.default_rng(seed)
    n = np.clip(rng.normal(128, sigma, (size, size)), 0, 255).astype(np.uint8)
    Image.fromarray(n, 'L').save(path)


def mascot(path):
    """Freisteller: Hintergrund ist ein heller, unbunter Verlauf, der über den Rand verbunden ist."""
    a = np.asarray(Image.open(MASCOT_SRC).convert('RGB')).astype(np.float32)
    bg_like = ((a.max(2) - a.min(2)) < 16) & (a.min(2) > 188)
    lab, _ = ndi.label(bg_like)
    edge = np.unique(np.concatenate([lab[0, :], lab[:, 0], lab[:, -1]]))   # oben, links, rechts (unten sitzt die Jacke)
    bg = np.isin(lab, edge[edge > 0])
    fg = ndi.binary_fill_holes(~bg)
    lab2, n2 = ndi.label(fg)
    fg = lab2 == (1 + int(np.argmax(ndi.sum(fg, lab2, range(1, n2 + 1)))))
    # Rand entfärben: Randpixel nehmen die Farbe des nächsten Kernpixels (kein heller Saum auf dunklem Grund).
    # Helle, unbunte Reste des Hintergrunds am Haaransatz (oberes Fünftel, nahe am Rand) zählen nicht zum
    # Kern. Weiter unten bleibt alles, wie es ist: dort ist Helles der Hemdkragen.
    near_edge = ndi.distance_transform_edt(fg) < 16
    bgish = ((a.max(2) - a.min(2)) < 34) & (a.min(2) > 130)
    hair = (np.arange(a.shape[0]) < a.shape[0] * 0.2)[:, None]
    core = ndi.binary_erosion(fg, iterations=3) & ~(bgish & near_edge & hair)
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    rgb = np.where(core[..., None], a, a[idx[0], idx[1]])
    alpha = np.clip((ndi.gaussian_filter(fg.astype(np.float32), 1.1) - 0.35) / 0.4, 0, 1)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    out.resize((1024, 1024), Image.LANCZOS).save(path)


# Weitere echte Fotos von Wlad (10.11.2026 über den Chat gekommen, 463 bis 800 Pixel breit)
EXTRA = {'coaching': 'wlad-coaching.png', 'arena': 'wlad-arena.png', 'seminar': 'wlad-seminar.jpg', 'talk': 'wlad-talk.png'}


def photos():
    """Gleiche Farbstimmung wie das Bühnenfoto, doppelte Größe, leicht geschärft. Mehr als doppelt
    trägt die Auflösung nicht: die Fotos nur als Karte oder Ausschnitt einsetzen, nicht formatfüllend."""
    for name, f in EXTRA.items():
        src = Image.open(os.path.join(HERE, 'src', f)).convert('RGB')
        big = grade(src).resize((src.width * 2, src.height * 2), Image.LANCZOS)
        big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
        big.save(os.path.join(OUT, f'{name}.jpg'), quality=92, optimize=True)


def portrait(path):
    """Porträt freistellen (1000×1000). Der Studiohintergrund ist ein glatter, exakt neutraler Verlauf
    (R = G = B), das Hemd hat einen Blaustich: so lässt sich der Hintergrund sicher finden. Die Kante
    wird nicht ausgestanzt, sondern gerechnet: Deckkraft aus dem Abstand zur Hintergrundfarbe an der
    Stelle, danach wird der Hintergrundanteil aus der Randfarbe herausgerechnet (kein heller Saum)."""
    src = Image.open(os.path.join(HERE, 'src', 'wlad-portrait.jpg')).convert('RGB')
    big = src.resize((src.width * 2, src.height * 2), Image.BICUBIC).filter(ImageFilter.UnsharpMask(radius=1.4, percent=40, threshold=2))
    a = np.asarray(big).astype(np.float32)
    spread = a.max(2) - a.min(2)
    bg_like = (spread < 8) & (a.min(2) > 185)
    lab, _ = ndi.label(ndi.binary_erosion(bg_like, iterations=3, border_value=1))
    edge = np.unique(np.concatenate([lab[0, :], lab[:, 0], lab[:, -1]]))
    bg = ndi.binary_dilation(np.isin(lab, edge[edge > 0]), iterations=5) & ((spread < 14) & (a.min(2) > 170))
    fg = ndi.binary_fill_holes(~bg)
    lab2, n2 = ndi.label(fg)
    sizes = ndi.sum(fg, lab2, range(1, n2 + 1))
    fg = np.isin(lab2, 1 + np.flatnonzero(sizes > fg.size * 0.01))      # Kopf und Sakko, keine Krümel
    disk = ndi.generate_binary_structure(2, 2)
    fg = ndi.binary_closing(np.pad(fg, 16, mode='edge'), structure=disk, iterations=7)[16:-16, 16:-16]

    # Hintergrundfarbe an jeder Stelle: weich aus den sicheren Hintergrundpixeln fortgesetzt
    sure_bg = ndi.binary_erosion(~fg, iterations=4, border_value=1)
    w = ndi.gaussian_filter(sure_bg.astype(np.float32), 26)
    bgmap = np.dstack([ndi.gaussian_filter(a[..., c] * sure_bg, 26) / np.maximum(w, 1e-4) for c in range(3)])
    bgmap = np.where((w > 1e-3)[..., None], bgmap, 230.0)
    dist = np.abs(a - bgmap).max(2)
    soft = np.clip((dist - 14.0) / 42.0, 0, 1)
    soft = ndi.gaussian_filter(ndi.minimum_filter(soft, size=3), 0.9)       # einen Pixel nach innen, weich
    inner = ndi.binary_erosion(fg, structure=disk, iterations=7, border_value=1)      # sicher Motiv (auch das helle Hemd)
    outer = ndi.binary_dilation(fg, structure=disk, iterations=2)                      # außerhalb davon nichts
    alpha = np.where(inner, 1.0, np.where(outer, soft, 0.0))
    # Im Randband darf nichts durchsichtig werden, was klar zum Motiv gehört (dunkles Haar, Sakko)
    alpha = np.where(ndi.binary_erosion(fg, structure=disk, iterations=2, border_value=1) & (dist > 70), 1.0, alpha)
    alpha = ndi.gaussian_filter(alpha.astype(np.float32), 0.8)
    rim = np.zeros(fg.shape, bool)
    rim[:14, :] = rim[:, :14] = rim[:, -14:] = True
    alpha[rim & (spread < 14) & (a.min(2) > 150)] = 0
    # Hintergrundanteil herausrechnen
    al = np.clip(alpha, 0.12, 1)[..., None]
    rgb = np.clip((a - (1 - al) * bgmap) / al, 0, 255)
    rgb = np.where((alpha >= 0.999)[..., None], a, rgb)
    Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA').save(path)


def make_qr(path, uid, base=None):
    try:
        import qrcode
    except ImportError:
        sys.exit('qrcode fehlt: pip install --target <dir> qrcode==8.2 und PYTHONPATH=<dir> setzen')
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=0)
    qr.add_data((base or QR_BASE) + uid)
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
    stage_and_plates()
    grain(os.path.join(OUT, 'grain.png'))
    mascot(os.path.join(OUT, 'mascot.png'))
    photos()
    portrait(os.path.join(OUT, 'portrait.png'))
    info = [make_qr(os.path.join(OUT, f'qr-{uid.replace("w", "w0")}.svg'), uid) for uid in QR_IDS]
    info += [make_qr(os.path.join(OUT, f'qr-{uid}.svg'), uid, QR_SAVE_BASE) for uid in QR_SAVE_IDS]
    print(f'wrote stage.jpg (+ ice, smoke), 3 Lichtgründe, grain.png, mascot.png, {len(info)} QR-Codes (Version/Module {info}) nach {OUT}')


if __name__ == '__main__':
    main()

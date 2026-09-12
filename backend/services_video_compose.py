"""FFmpeg/Pillow-Finish für Guide-Clips (Iter 143).

Der statische imageio-ffmpeg-Build hat kein drawtext (kein freetype) — deshalb
werden Logo und Untertitel mit Pillow als PNG gerendert und per overlay-Filter
zeitgesteuert eingeblendet. Alle Funktionen sind blockierend -> asyncio.to_thread.
"""

import io
import os
import re
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
LOGO_PATH = Path(__file__).resolve().parent.parent / "frontend" / "public" / "icon-512.png"
LIME = (191, 255, 0, 255)


class ComposeError(Exception):
    pass


def _ffmpeg() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def _run(args: list[str]) -> str:
    proc = subprocess.run([_ffmpeg(), "-hide_banner", "-y", *args], capture_output=True, text=True, timeout=600)
    if proc.returncode != 0:
        raise ComposeError(f"ffmpeg fehlgeschlagen: {proc.stderr[-600:]}")
    return proc.stderr


def probe(path: str) -> dict:
    """Dauer (s) sowie Breite/Höhe des ersten Videostreams."""
    proc = subprocess.run([_ffmpeg(), "-hide_banner", "-i", path], capture_output=True, text=True, timeout=60)
    info = proc.stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.?\d*)", info)
    duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0.0
    v = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", info)
    return {"duration": duration, "width": int(v.group(1)) if v else 0, "height": int(v.group(2)) if v else 0}


def pad_audio(audio: bytes, lead_seconds: float, total_seconds: float) -> bytes:
    """Stille vorne (Gehen), Stille hinten bis exakt total_seconds — mono mp3."""
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = os.path.join(tmp, "in.mp3"), os.path.join(tmp, "out.mp3")
        Path(src).write_bytes(audio)
        lead_ms = int(round(lead_seconds * 1000))
        _run([
            "-i", src,
            "-af", f"adelay={lead_ms}:all=1,apad,atrim=0:{total_seconds:.3f}",
            "-ac", "1", "-ar", "32000", "-b:a", "128k", dst,
        ])
        return Path(dst).read_bytes()


def subtitle_chunks(text: str, speech_start: float, speech_duration: float, max_words: int = 4) -> list[dict]:
    """Zerlegt den Sprechtext in kurze Zeilen und verteilt sie proportional zur Zeichenzahl."""
    words = text.split()
    chunks, current = [], []
    for w in words:
        current.append(w)
        if len(current) >= max_words or w[-1] in ".!?,;:—":
            chunks.append(" ".join(current))
            current = []
    if current:
        chunks.append(" ".join(current))
    total_chars = sum(len(c) for c in chunks) or 1
    cues, t = [], speech_start
    for c in chunks:
        d = speech_duration * len(c) / total_chars
        cues.append({"start": round(t, 2), "end": round(t + d, 2), "text": c.rstrip(",;:")})
        t += d
    return cues


def _font(path: str, size: int):
    return ImageFont.truetype(path, size)


def _render_logo(width: int, height: int) -> Image.Image:
    """W-Mark + Wortmarke oben links, dezent (Apple-Style)."""
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    size = max(36, int(min(width, height) * 0.075))
    mark = Image.open(LOGO_PATH).convert("RGBA").resize((size, size), Image.LANCZOS)
    x, y = int(width * 0.06), int(height * 0.05)
    canvas.alpha_composite(mark, (x, y))
    draw = ImageDraw.Draw(canvas)
    font = _font(FONT_BOLD, int(size * 0.46))
    tx = x + size + int(size * 0.3)
    draw.text((tx, y + int(size * 0.08)), "LEADER-OS", font=font, fill=(255, 255, 255, 235))
    small = _font(FONT_BOLD, int(size * 0.2))
    _spaced(draw, (tx, y + int(size * 0.62)), "POWERED BY WLADBOT", small, LIME, int(size * 0.045))
    return canvas


def _spaced(draw, pos, text, font, fill, tracking):
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def render_thumbnail(source: str, dest: str, title: str, kicker: str = "", max_width: int = 1280) -> None:
    """Branded Thumbnail: Keyframe + dunkler Verlauf unten + Titel-Typo + W-Mark + Lime-Akzent (JPEG)."""
    with Image.open(source) as src:
        img = src.convert("RGB")
    if img.width > max_width:
        img = img.resize((max_width, round(img.height * max_width / img.width)), Image.LANCZOS)
    w, h = img.size
    portrait = h > w
    grad = Image.new("L", (1, h))
    for y in range(h):
        t = max(0.0, (y - h * 0.42) / (h * 0.58))
        grad.putpixel((0, y), int(min(1.0, t ** 1.1) * 235))
    shade = Image.new("RGB", (w, h), (8, 8, 8))
    img = Image.composite(shade, img, grad.resize((w, h)))
    draw = ImageDraw.Draw(img)
    pad = int(w * 0.055)
    title_size = int(w * (0.075 if portrait else 0.052))
    font = _font(FONT_BOLD, title_size)
    lines = _wrap(draw, title, font, w - 2 * pad)[:3]
    line_h = int(title_size * 1.12)
    y = h - pad - len(lines) * line_h - int(h * 0.02)
    if kicker:
        kf = _font(FONT_BOLD, int(title_size * 0.34))
        _spaced(draw, (pad, y - int(title_size * 0.75)), kicker.upper(), kf, LIME[:3], int(title_size * 0.05))
    draw.rectangle([pad, y - int(title_size * 0.15), pad + int(w * 0.035), y - int(title_size * 0.15) + int(title_size * 0.08)], fill=LIME[:3])
    for i, line in enumerate(lines):
        draw.text((pad, y + int(title_size * 0.12) + i * line_h), line, font=font, fill=(255, 255, 255))
    mark = int(w * 0.055)
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((mark, mark), Image.LANCZOS)
    img.paste(logo, (w - pad - mark, pad), logo)
    small = _font(FONT_BOLD, int(mark * 0.32))
    label = "LEADER-OS"
    lw = draw.textlength(label, font=small)
    draw.text((w - pad - mark - int(mark * 0.25) - lw, pad + int(mark * 0.32)), label, font=small, fill=(255, 255, 255))
    img.save(dest, "JPEG", quality=86, optimize=True, progressive=True)


FONT_HAND = str(Path(__file__).resolve().parent / "assets" / "fonts" / "Caveat-Bold.ttf")


def _still_to_video(canvas: "Image.Image", width: int, height: int, seconds: float) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        frame, out = os.path.join(tmp, "card.png"), os.path.join(tmp, "card.mp4")
        canvas.save(frame)
        _run([
            "-loop", "1", "-framerate", str(FPS), "-i", frame, "-f", "lavfi", "-i", "anullsrc=r=32000:cl=mono",
            "-t", f"{seconds:.2f}", "-vf", f"scale={width}:{height},format=yuv420p",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-c:a", "aac", "-b:a", "128k", "-shortest", out,
        ])
        return Path(out).read_bytes()


def mix_music_bed(video: bytes, bed: bytes, gain_db: float = -27.0) -> bytes:
    """Leisen Musikteppich unter die Tonspur legen: geloopt auf Videolänge, 2 s Fade-in, 3 s Fade-out,
    beim Sprechen per Sidechain leicht abgesenkt, in Pausen/Übergängen dadurch etwas präsenter."""
    with tempfile.TemporaryDirectory() as tmp:
        vid, mus, out = os.path.join(tmp, "in.mp4"), os.path.join(tmp, "bed.wav"), os.path.join(tmp, "out.mp4")
        Path(vid).write_bytes(video)
        Path(mus).write_bytes(bed)
        dur = probe(vid)["duration"]
        fade_out_at = max(0.0, dur - 3.0)
        flt = (
            f"[1:a]aloop=loop=-1:size=2e9,atrim=0:{dur:.3f},asetpts=N/SR/TB,"
            f"afade=t=in:st=0:d=2,afade=t=out:st={fade_out_at:.3f}:d=3,volume={gain_db}dB,aformat=channel_layouts=mono[bed];"
            f"[bed][0:a]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=600[ducked];"
            f"[ducked][0:a]amix=inputs=2:duration=first:normalize=0[a]"
        )
        _run(["-i", vid, "-i", mus, "-filter_complex", flt, "-map", "0:v:0", "-map", "[a]",
              "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "32000", "-ac", "1", out])
        return Path(out).read_bytes()


def render_farewell_card(width: int, height: int, farewell: str, next_step: str | None,
                         signature_png: bytes | None = None, seconds: float = 3.5, qr_url: str | None = None) -> bytes:
    """Verabschiedungs-Karte (Iter 169): kleines Logo oben, Abschiedssatz, Wlads Unterschrift, nächster Schritt.
    Ruhiger dunkler Leader-OS-Look, keine Tonspur (Stille). Unterschrift: echtes PNG, sonst Handschrift-Font."""
    canvas = Image.new("RGB", (width, height), (10, 10, 10))
    draw = ImageDraw.Draw(canvas)
    base = min(width, height)
    portrait = height > width
    # dezenter Lime-Schimmer unten links wie im App-Look
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = int(base * 0.55)
    gd.ellipse((-r // 2, height - r // 2, r, height + r), fill=(191, 255, 0, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(int(base * 0.12)))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), glow).convert("RGB"))
    draw = ImageDraw.Draw(canvas)

    logo = int(base * 0.085)
    mark = Image.open(LOGO_PATH).convert("RGBA").resize((logo, logo), Image.LANCZOS)
    canvas.paste(mark, ((width - logo) // 2, int(height * (0.10 if portrait else 0.09))), mark)

    f_head = _font(FONT_BOLD, int(base * (0.095 if portrait else 0.09)))
    lines = _wrap(draw, farewell, f_head, int(width * 0.82))
    y = int(height * (0.36 if portrait else 0.30))
    for ln in lines:
        w = draw.textlength(ln, font=f_head)
        draw.text(((width - w) / 2, y), ln, font=f_head, fill=(255, 255, 255))
        y += int(f_head.size * 1.18)

    y += int(base * 0.05)
    if signature_png:
        sig = Image.open(io.BytesIO(signature_png)).convert("RGBA")
        sw = int(width * (0.42 if portrait else 0.26))
        sig = sig.resize((sw, int(sig.height * sw / sig.width)), Image.LANCZOS)
        canvas.paste(sig, ((width - sw) // 2, y), sig)
        y += sig.height
    else:
        f_sig = _font(FONT_HAND, int(base * (0.21 if portrait else 0.16)))
        try:
            f_sig.set_variation_by_name("Bold")
        except Exception:
            pass
        w = draw.textlength("Wlad", font=f_sig)
        draw.text(((width - w) / 2, y), "Wlad", font=f_sig, fill=LIME[:3])
        y += int(f_sig.size * 1.05)

    if qr_url:
        import qrcode

        qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(qr_url)
        qr.make(fit=True)
        size = int(base * 0.20)
        qimg = qr.make_image(fill_color=(10, 10, 10), back_color=(255, 255, 255)).convert("RGB").resize((size, size), Image.NEAREST)
        pad = int(base * 0.012)
        qx, qy = width - size - int(width * 0.06), height - size - int(height * 0.10)
        draw.rounded_rectangle((qx - pad, qy - pad, qx + size + pad, qy + size + pad), radius=int(base * 0.015), fill=(255, 255, 255))
        canvas.paste(qimg, (qx, qy))
        f_url = _font(FONT_BOLD, int(base * 0.05))
        label = qr_url.replace("https://", "").replace("http://", "").rstrip("/")
        lw = draw.textlength(label, font=f_url)
        draw.text((qx + size / 2 - lw / 2, qy - f_url.size - int(base * 0.03)), label, font=f_url, fill=LIME[:3])
    if next_step:
        f_next = _font(FONT_REGULAR, int(base * (0.042 if portrait else 0.036)))
        y += int(base * 0.06)
        w = draw.textlength(next_step, font=f_next)
        pad_x, pad_y = int(base * 0.03), int(base * 0.016)
        box = (int((width - w) / 2 - pad_x), y - pad_y, int((width + w) / 2 + pad_x), y + f_next.size + pad_y)
        draw.rounded_rectangle(box, radius=int(base * 0.03), outline=(255, 255, 255, 40), width=1, fill=(22, 22, 22))
        draw.text(((width - w) / 2, y), next_step, font=f_next, fill=(220, 220, 220))
    return _still_to_video(canvas, width, height, seconds)


def render_end_card(width: int, height: int, seconds: float = 2.6) -> bytes:
    """Abbinder: W-Mark, LEADER-OS, POWERED BY WLADBOT auf Schwarz — mit Stille-Tonspur."""
    canvas = Image.new("RGB", (width, height), (10, 10, 10))
    size = int(min(width, height) * 0.16)
    mark = Image.open(LOGO_PATH).convert("RGBA").resize((size, size), Image.LANCZOS)
    cy = int(height * 0.44)
    canvas.paste(mark, ((width - size) // 2, cy - size), mark)
    draw = ImageDraw.Draw(canvas)
    font = _font(FONT_BOLD, int(size * 0.5))
    w = draw.textlength("LEADER-OS", font=font)
    draw.text(((width - w) / 2, cy + int(size * 0.18)), "LEADER-OS", font=font, fill=(255, 255, 255))
    small = _font(FONT_BOLD, int(size * 0.17))
    tracking = int(size * 0.05)
    text = "POWERED BY WLADBOT"
    tw = sum(draw.textlength(c, font=small) + tracking for c in text) - tracking
    _spaced(draw, ((width - tw) / 2, cy + int(size * 0.78)), text, small, LIME[:3], tracking)
    with tempfile.TemporaryDirectory() as tmp:
        frame, out = os.path.join(tmp, "end.png"), os.path.join(tmp, "end.mp4")
        canvas.save(frame)
        _run([
            "-loop", "1", "-framerate", str(FPS), "-i", frame, "-f", "lavfi", "-i", "anullsrc=r=32000:cl=mono",
            "-t", f"{seconds:.2f}", "-vf", f"scale={width}:{height},format=yuv420p",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-c:a", "aac", "-b:a", "128k", "-shortest", out,
        ])
        return Path(out).read_bytes()


def _wrap(draw, text: str, font, max_width: int) -> list[str]:
    lines, current = [], ""
    for w in text.split():
        trial = f"{current} {w}".strip()
        if draw.textlength(trial, font=font) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def _render_subtitle(width: int, height: int, text: str) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    font = _font(FONT_BOLD, int(min(width, height) * 0.062))
    lines = _wrap(draw, text, font, int(width * 0.82))
    line_h = int(font.size * 1.25)
    pad_x, pad_y = int(font.size * 0.7), int(font.size * 0.45)
    block_w = max(int(draw.textlength(ln, font=font)) for ln in lines) + pad_x * 2
    block_h = line_h * len(lines) + pad_y * 2
    x0 = (width - block_w) // 2
    anchor = 0.80 if height > width else 0.87
    y0 = int(height * anchor) - block_h // 2
    draw.rounded_rectangle([x0, y0, x0 + block_w, y0 + block_h], radius=int(font.size * 0.55), fill=(0, 0, 0, 150))
    y = y0 + pad_y
    for ln in lines:
        w = draw.textlength(ln, font=font)
        draw.text(((width - w) / 2, y), ln, font=font, fill=(255, 255, 255, 255))
        y += line_h
    return canvas


def finish_video(video: bytes, audio: bytes, cues: list[dict], brand: bool = True,
                 brand_windows: list[tuple[float, float]] | None = None) -> bytes:
    """Lipsync-Shot + Tonspur -> fertiger Clip mit Logo, Untertiteln, Fades (mp4-Bytes).
    brand_windows: Zeitfenster für das Logo (z. B. nicht über der App-B-Roll)."""
    with tempfile.TemporaryDirectory() as tmp:
        vid, aud, out = os.path.join(tmp, "in.mp4"), os.path.join(tmp, "in.mp3"), os.path.join(tmp, "out.mp4")
        Path(vid).write_bytes(video)
        Path(aud).write_bytes(audio)
        meta = probe(vid)
        dur, w, h = meta["duration"], meta["width"], meta["height"]
        if not dur or not w:
            raise ComposeError("Video konnte nicht gelesen werden")

        inputs = ["-i", vid, "-i", aud]
        overlays = []
        if brand:
            p = os.path.join(tmp, "logo.png")
            _render_logo(w, h).save(p)
            inputs += ["-i", p]
            idx = len(inputs) // 2 - 1
            for start, end in (brand_windows or [(1.0, max(1.5, dur - 0.4))]):
                overlays.append((idx, max(start, 0.2), min(end, dur - 0.2)))
        for i, cue in enumerate(cues):
            p = os.path.join(tmp, f"sub_{i}.png")
            _render_subtitle(w, h, cue["text"]).save(p)
            inputs += ["-i", p]
            overlays.append((len(inputs) // 2 - 1, cue["start"], cue["end"]))

        fade_out = max(0.0, dur - 0.7)
        chain = [f"[0:v]fade=t=in:st=0:d=0.8,fade=t=out:st={fade_out:.2f}:d=0.7[v0]"]
        last = "v0"
        for n, (idx, start, end) in enumerate(overlays):
            nxt = f"v{n + 1}"
            chain.append(f"[{last}][{idx}:v]overlay=0:0:enable='between(t,{start:.2f},{end:.2f})'[{nxt}]")
            last = nxt
        chain.append(f"[1:a]afade=t=in:st=0:d=0.3,afade=t=out:st={fade_out:.2f}:d=0.6[a]")

        _run([
            *inputs,
            "-filter_complex", ";".join(chain),
            "-map", f"[{last}]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out,
        ])
        return Path(out).read_bytes()


# ── Multi-Shot (Iter 144): B-Roll, Normalisieren, Schnitt ──────────────────

FPS = 30
BROLL_DIR = Path(__file__).resolve().parent / "assets" / "broll"


def _device_frame(screenshot: bytes, width: int, height: int) -> Image.Image:
    """App-Screenshot als schwebender Screen auf dunklem Grund (Apple-Keynote-Look)."""
    import io

    canvas = Image.new("RGBA", (width, height), (11, 11, 11, 255))
    shot = Image.open(io.BytesIO(screenshot)).convert("RGBA")
    target_w = int(width * 0.84)
    target_h = int(shot.height * target_w / shot.width)
    if target_h > height * 0.84:
        target_h = int(height * 0.84)
        target_w = int(shot.width * target_h / shot.height)
    shot = shot.resize((target_w, target_h), Image.LANCZOS)
    radius = int(width * 0.014)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, shot.width, shot.height], radius=radius, fill=255)
    x, y = (width - target_w) // 2, (height - target_h) // 2
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([x - 6, y + 14, x + target_w + 6, y + target_h + 26], radius=radius + 6, fill=(191, 255, 0, 38))
    from PIL import ImageFilter

    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(28)))
    canvas.paste(shot, (x, y), mask)
    return canvas


def render_broll(screens: list[bytes], audio: bytes, width: int, height: int) -> bytes:
    """Screens nacheinander mit langsamer Kamerafahrt, Dauer = Sprechdauer (+0.5 s)."""
    with tempfile.TemporaryDirectory() as tmp:
        aud = os.path.join(tmp, "voice.mp3")
        Path(aud).write_bytes(audio)
        total = probe(aud)["duration"] + 0.5
        per = total / max(1, len(screens))
        frames_per = int(round(per * FPS))
        parts = []
        for i, shot in enumerate(screens):
            frame = os.path.join(tmp, f"frame_{i}.png")
            _device_frame(shot, width, height).convert("RGB").save(frame)
            part = os.path.join(tmp, f"part_{i}.mp4")
            direction = "1.0+0.07*in/%d" % frames_per if i % 2 == 0 else "1.07-0.07*in/%d" % frames_per
            _run([
                "-loop", "1", "-framerate", str(FPS), "-i", frame, "-t", f"{per:.3f}",
                "-vf", f"zoompan=z='{direction}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height}:fps={FPS},format=yuv420p",
                "-c:v", "libx264", "-preset", "fast", "-crf", "18", part,
            ])
            parts.append(part)
        listing = os.path.join(tmp, "list.txt")
        Path(listing).write_text("".join(f"file '{p}'\n" for p in parts))
        out = os.path.join(tmp, "broll.mp4")
        _run([
            "-f", "concat", "-safe", "0", "-i", listing, "-i", aud,
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "32000", "-shortest", out,
        ])
        return Path(out).read_bytes()


def normalize_segment(video: bytes, audio: bytes | None, width: int, height: int, keep_audio: bool = False) -> bytes:
    """Einheitliches Format für den Schnitt: WxH, 30 fps, aac mono. Ohne Audio -> Stille;
    keep_audio = native Tonspur des Shots (z. B. Kling 2.6 Schritte/Raumklang) behalten."""
    with tempfile.TemporaryDirectory() as tmp:
        vid, out = os.path.join(tmp, "in.mp4"), os.path.join(tmp, "out.mp4")
        Path(vid).write_bytes(video)
        dur = probe(vid)["duration"]
        args = ["-i", vid]
        amap = "1:a:0"
        if audio:
            aud = os.path.join(tmp, "in.mp3")
            Path(aud).write_bytes(audio)
            args += ["-i", aud]
        elif keep_audio and _has_audio(vid):
            amap = "0:a:0"
        else:
            args += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i", "anullsrc=r=32000:cl=mono"]
        vf = (f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
              f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=0x0b0b0b,fps={FPS},format=yuv420p")
        _run([
            *args, "-vf", vf, "-map", "0:v:0", "-map", amap, "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-ar", "32000", "-ac", "1", out,
        ])
        return Path(out).read_bytes()


def _has_audio(path: str) -> bool:
    proc = subprocess.run([_ffmpeg(), "-hide_banner", "-i", path], capture_output=True, text=True, timeout=60)
    return "Audio:" in (proc.stderr or "")


def concat_segments(segments: list[bytes], crossfade: float | list[float] = 0.0) -> bytes:
    """Harter Schnitt (crossfade=0) oder weiche Überblendung (xfade + acrossfade) zwischen den Shots.
    crossfade darf eine Liste je Schnitt sein (len = Segmente - 1), z. B. länger nach einem Walk-in."""
    with tempfile.TemporaryDirectory() as tmp:
        paths, durs = [], []
        for i, seg in enumerate(segments):
            p = os.path.join(tmp, f"seg_{i}.mp4")
            Path(p).write_bytes(seg)
            paths.append(p)
            durs.append(probe(p)["duration"])
        inputs = [a for p in paths for a in ("-i", p)]
        out = os.path.join(tmp, "joined.mp4")
        fades = list(crossfade) if isinstance(crossfade, (list, tuple)) else [crossfade] * (len(paths) - 1)
        if any(f > 0 for f in fades) and len(paths) > 1:
            chain, lv, la, offset = [], "0:v:0", "0:a:0", 0.0
            for i in range(1, len(paths)):
                xf = max(0.05, fades[i - 1])
                offset += durs[i - 1] - xf
                nv, na = f"v{i}", f"a{i}"
                chain.append(f"[{lv}][{i}:v:0]xfade=transition=fade:duration={xf}:offset={offset:.3f}[{nv}]")
                chain.append(f"[{la}][{i}:a:0]acrossfade=d={xf}[{na}]")
                lv, la = nv, na
            _run([
                *inputs, "-filter_complex", ";".join(chain), "-map", f"[{lv}]", "-map", f"[{la}]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-c:a", "aac", "-b:a", "128k", out,
            ])
            return Path(out).read_bytes()
        streams = "".join(f"[{i}:v:0][{i}:a:0]" for i in range(len(paths)))
        _run([
            *inputs, "-filter_complex", f"{streams}concat=n={len(paths)}:v=1:a=1[v][a]",
            "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", out,
        ])
        return Path(out).read_bytes()


def extract_audio(video: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        vid, out = os.path.join(tmp, "in.mp4"), os.path.join(tmp, "a.mp3")
        Path(vid).write_bytes(video)
        _run(["-i", vid, "-vn", "-ac", "1", "-ar", "32000", "-b:a", "128k", out])
        return Path(out).read_bytes()

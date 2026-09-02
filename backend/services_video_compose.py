"""FFmpeg/Pillow-Finish für Guide-Clips (Iter 143).

Der statische imageio-ffmpeg-Build hat kein drawtext (kein freetype) — deshalb
werden Logo und Untertitel mit Pillow als PNG gerendert und per overlay-Filter
zeitgesteuert eingeblendet. Alle Funktionen sind blockierend -> asyncio.to_thread.
"""

import os
import re
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

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
    font = _font(FONT_BOLD, int(size * 0.5))
    draw.text((x + size + int(size * 0.3), y + int(size * 0.22)), "LEADER-OS", font=font, fill=(255, 255, 255, 235))
    return canvas


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
    block_w = max(int(draw.textlength(l, font=font)) for l in lines) + pad_x * 2
    block_h = line_h * len(lines) + pad_y * 2
    x0 = (width - block_w) // 2
    anchor = 0.80 if height > width else 0.87
    y0 = int(height * anchor) - block_h // 2
    draw.rounded_rectangle([x0, y0, x0 + block_w, y0 + block_h], radius=int(font.size * 0.55), fill=(0, 0, 0, 150))
    y = y0 + pad_y
    for l in lines:
        w = draw.textlength(l, font=font)
        draw.text(((width - w) / 2, y), l, font=font, fill=(255, 255, 255, 255))
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


def normalize_segment(video: bytes, audio: bytes | None, width: int, height: int) -> bytes:
    """Einheitliches Format für den Schnitt: WxH, 30 fps, aac mono. Ohne Audio -> Stille."""
    with tempfile.TemporaryDirectory() as tmp:
        vid, out = os.path.join(tmp, "in.mp4"), os.path.join(tmp, "out.mp4")
        Path(vid).write_bytes(video)
        dur = probe(vid)["duration"]
        args = ["-i", vid]
        if audio:
            aud = os.path.join(tmp, "in.mp3")
            Path(aud).write_bytes(audio)
            args += ["-i", aud]
        else:
            args += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i", "anullsrc=r=32000:cl=mono"]
        vf = (f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
              f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=0x0b0b0b,fps={FPS},format=yuv420p")
        _run([
            *args, "-vf", vf, "-map", "0:v:0", "-map", "1:a:0", "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-ar", "32000", "-ac", "1", out,
        ])
        return Path(out).read_bytes()


def concat_segments(segments: list[bytes]) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for i, seg in enumerate(segments):
            p = os.path.join(tmp, f"seg_{i}.mp4")
            Path(p).write_bytes(seg)
            paths.append(p)
        inputs = [a for p in paths for a in ("-i", p)]
        streams = "".join(f"[{i}:v:0][{i}:a:0]" for i in range(len(paths)))
        out = os.path.join(tmp, "joined.mp4")
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

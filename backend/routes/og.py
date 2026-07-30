"""Dynamic OG image generation for shareable Leader-Score cards.

Renders premium dark (Apple-style) PNGs on the fly for LinkedIn / X / Slack
previews. Score → giant lime number, tier label, dezent "leaderos.de" footer.

URL pattern:
  GET /api/og/leader-score/{user_id}
  GET /api/og/default

All endpoints respond with image/png + 1h public Cache-Control so social
platforms can cache aggressively (they will, regardless).

Font fallback: tries /app/backend/assets/fonts/* first, falls back to PIL default.
"""
from __future__ import annotations

import io
import logging
import os
from typing import Optional

from fastapi import APIRouter, Response
from PIL import Image, ImageDraw, ImageFont

from config import db

logger = logging.getLogger("leader-os.og")
router = APIRouter(prefix="/api/og", tags=["og-images"])

# ────────────────────────────────────────────────────────────────────────────
# Style constants — Apple/Dark + Neon Lime
# ────────────────────────────────────────────────────────────────────────────
WIDTH, HEIGHT = 1200, 630
BG_BLACK = (10, 10, 10)           # #0A0A0A
NEON_LIME = (191, 255, 0)         # #BFFF00
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (153, 153, 153)
TEXT_DIM = (102, 102, 102)
ACCENT_GRADIENT_TOP = (20, 20, 20)
ACCENT_GRADIENT_BOTTOM = (5, 5, 5)


# Score → tier label mapping (matches Wlad's leadership scale)
def _score_to_tier(score: int) -> str:
    if score >= 90:
        return "Visionärer Leader"
    if score >= 80:
        return "Strategischer Denker"
    if score >= 70:
        return "Kommunikator"
    if score >= 55:
        return "Mentor"
    if score >= 40:
        return "Teamplayer"
    return "Emerging Leader"


def _font(size: int, *, weight: str = "regular") -> ImageFont.FreeTypeFont:
    """Try Outfit (premium), fall back to DejaVu, then PIL default."""
    candidates = [
        f"/app/backend/assets/fonts/Outfit-{weight.capitalize()}.ttf",
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if weight == 'bold' else ''}.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def _render_leader_score_card(
    *,
    score: int,
    tier_label: str,
    user_name: Optional[str] = None,
) -> bytes:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_BLACK)
    draw = ImageDraw.Draw(img)

    # Subtle vertical gradient — gives it premium depth
    for y in range(HEIGHT):
        t = y / HEIGHT
        r = int(ACCENT_GRADIENT_TOP[0] * (1 - t) + ACCENT_GRADIENT_BOTTOM[0] * t)
        g = int(ACCENT_GRADIENT_TOP[1] * (1 - t) + ACCENT_GRADIENT_BOTTOM[1] * t)
        b = int(ACCENT_GRADIENT_TOP[2] * (1 - t) + ACCENT_GRADIENT_BOTTOM[2] * t)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Top-left brand mark
    f_brand = _font(28, weight="bold")
    draw.text((60, 50), "LEADER-OS", font=f_brand, fill=TEXT_WHITE)

    f_brand_sub = _font(18, weight="regular")
    draw.text((60, 88), "KI Leadership System", font=f_brand_sub, fill=TEXT_DIM)

    # Optional user attribution (small top-right)
    if user_name:
        f_user = _font(22, weight="regular")
        # right-align
        bbox = draw.textbbox((0, 0), user_name, font=f_user)
        text_w = bbox[2] - bbox[0]
        draw.text((WIDTH - 60 - text_w, 60), user_name, font=f_user, fill=TEXT_MUTED)

    # GIANT score — centerpiece
    score_str = f"{score}"
    f_score = _font(380, weight="bold")
    score_bbox = draw.textbbox((0, 0), score_str, font=f_score)
    score_w = score_bbox[2] - score_bbox[0]
    score_h = score_bbox[3] - score_bbox[1]
    score_x = (WIDTH - score_w) // 2
    score_y = 160
    draw.text((score_x, score_y), score_str, font=f_score, fill=NEON_LIME)

    # "/100" suffix in dim white
    f_max = _font(60, weight="regular")
    suffix = "/100"
    # place to right of the score
    draw.text((score_x + score_w + 16, score_y + 220), suffix, font=f_max, fill=TEXT_DIM)

    # Tier label — strong, centered below
    f_tier_kicker = _font(20, weight="bold")
    kicker = "LEADER-SCORE"
    kicker_bbox = draw.textbbox((0, 0), kicker, font=f_tier_kicker)
    kicker_w = kicker_bbox[2] - kicker_bbox[0]
    draw.text(((WIDTH - kicker_w) // 2, score_y + score_h + 35), kicker, font=f_tier_kicker, fill=TEXT_MUTED)

    f_tier = _font(54, weight="bold")
    tier_bbox = draw.textbbox((0, 0), tier_label, font=f_tier)
    tier_w = tier_bbox[2] - tier_bbox[0]
    draw.text(((WIDTH - tier_w) // 2, score_y + score_h + 70), tier_label, font=f_tier, fill=TEXT_WHITE)

    # Bottom-right footer — discreet domain
    f_footer = _font(22, weight="regular")
    footer = "leaderos.de"
    footer_bbox = draw.textbbox((0, 0), footer, font=f_footer)
    footer_w = footer_bbox[2] - footer_bbox[0]
    draw.text((WIDTH - 60 - footer_w, HEIGHT - 60), footer, font=f_footer, fill=NEON_LIME)

    # Bottom-left tagline
    f_tagline = _font(18, weight="regular")
    draw.text((60, HEIGHT - 60), "KI Leadership · 30-Tage Sprint", font=f_tagline, fill=TEXT_DIM)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _render_default_card() -> bytes:
    """Generic OG card — used on / and /login pages."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_BLACK)
    draw = ImageDraw.Draw(img)

    # Gradient
    for y in range(HEIGHT):
        t = y / HEIGHT
        r = int(ACCENT_GRADIENT_TOP[0] * (1 - t) + ACCENT_GRADIENT_BOTTOM[0] * t)
        g = int(ACCENT_GRADIENT_TOP[1] * (1 - t) + ACCENT_GRADIENT_BOTTOM[1] * t)
        b = int(ACCENT_GRADIENT_TOP[2] * (1 - t) + ACCENT_GRADIENT_BOTTOM[2] * t)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    f_brand = _font(32, weight="bold")
    draw.text((60, 50), "LEADER-OS", font=f_brand, fill=TEXT_WHITE)

    # Main headline — bold, multi-line, lime accent
    f_main = _font(86, weight="bold")
    draw.text((60, 200), "KI Leadership", font=f_main, fill=TEXT_WHITE)
    draw.text((60, 295), "in 30 Tagen.", font=f_main, fill=NEON_LIME)

    # Sub-headline
    f_sub = _font(32, weight="regular")
    draw.text((60, 410), "Werde KI-native Führungskraft —", font=f_sub, fill=TEXT_MUTED)
    draw.text((60, 450), "von Wlad Jachtchenko.", font=f_sub, fill=TEXT_MUTED)

    # Footer
    f_footer = _font(22, weight="regular")
    footer = "leaderos.de"
    footer_bbox = draw.textbbox((0, 0), footer, font=f_footer)
    footer_w = footer_bbox[2] - footer_bbox[0]
    draw.text((WIDTH - 60 - footer_w, HEIGHT - 60), footer, font=f_footer, fill=NEON_LIME)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


# ────────────────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────────────────


def _png_response(data: bytes) -> Response:
    return Response(
        content=data,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            "Content-Disposition": "inline",
        },
    )


@router.get("/default")
async def og_default():
    """Default OG image for / and /login. Returns the generic brand card."""
    try:
        return _png_response(_render_default_card())
    except Exception as e:
        logger.exception("og default render failed: %s", e)
        return Response(status_code=500, content=b"og render failed")


@router.get("/leader-score/{user_id}")
async def og_leader_score(user_id: str):
    """Dynamic Leader-Score card for sharing on LinkedIn / X."""
    try:
        user = await db.users.find_one(
            {"user_id": user_id},
            {"_id": 0, "name": 1, "leadership_score": 1, "communication_score": 1, "eq_score": 1, "wladhub_scores": 1},
        )
        if not user:
            # Fallback to default card if user not found — never 404 a social crawler
            return _png_response(_render_default_card())

        # Prefer wladhub composite if available, otherwise average the 3 scores
        wladhub = user.get("wladhub_scores") or {}
        composite = wladhub.get("overall_score")
        if not composite:
            scores = [
                user.get("leadership_score") or 0,
                user.get("communication_score") or 0,
                user.get("eq_score") or 0,
            ]
            valid = [s for s in scores if s > 0]
            composite = round(sum(valid) / len(valid)) if valid else 0

        composite = max(0, min(100, int(composite)))
        tier_label = _score_to_tier(composite)
        name = (user.get("name") or "").strip() or None

        return _png_response(
            _render_leader_score_card(score=composite, tier_label=tier_label, user_name=name)
        )
    except Exception as e:
        logger.exception("og leader-score render failed for %s: %s", user_id, e)
        return _png_response(_render_default_card())


@router.get("/leader-score/preview/{score}")
async def og_leader_score_preview(score: int):
    """Preview endpoint for testing/marketing — generate a card for any score."""
    try:
        score = max(0, min(100, int(score)))
        return _png_response(
            _render_leader_score_card(score=score, tier_label=_score_to_tier(score))
        )
    except Exception as e:
        logger.exception("og preview render failed: %s", e)
        return Response(status_code=500, content=b"og render failed")


def _render_mission_share_card(
    *,
    score: int,
    tier_label: str,
    challenge_title: str,
    user_name: Optional[str] = None,
) -> bytes:
    """Mission-specific share card. Layout differs from Leader-Score: smaller
    score (because users will achieve many mission-scores) + prominent
    challenge title so the social preview tells the *story* not just a number.
    """
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_BLACK)
    draw = ImageDraw.Draw(img)

    # Gradient backdrop
    for y in range(HEIGHT):
        t = y / HEIGHT
        r = int(ACCENT_GRADIENT_TOP[0] * (1 - t) + ACCENT_GRADIENT_BOTTOM[0] * t)
        g = int(ACCENT_GRADIENT_TOP[1] * (1 - t) + ACCENT_GRADIENT_BOTTOM[1] * t)
        b = int(ACCENT_GRADIENT_TOP[2] * (1 - t) + ACCENT_GRADIENT_BOTTOM[2] * t)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Brand-mark top-left
    f_brand = _font(28, weight="bold")
    draw.text((60, 50), "LEADER-OS", font=f_brand, fill=TEXT_WHITE)
    f_brand_sub = _font(18, weight="regular")
    draw.text((60, 88), "Video Mission · KI-Coach", font=f_brand_sub, fill=TEXT_DIM)

    # Score block — left side, smaller than Leader-Score card
    score_str = f"{score}"
    f_score = _font(220, weight="bold")
    draw.text((60, 170), score_str, font=f_score, fill=NEON_LIME)
    f_score_unit = _font(40, weight="regular")
    score_bbox = draw.textbbox((0, 0), score_str, font=f_score)
    score_w = score_bbox[2] - score_bbox[0]
    draw.text((60 + score_w + 12, 310), "/100", font=f_score_unit, fill=TEXT_DIM)

    f_score_kicker = _font(18, weight="bold")
    draw.text((60, 410), "MISSION SCORE", font=f_score_kicker, fill=TEXT_MUTED)
    f_tier = _font(28, weight="bold")
    draw.text((60, 440), tier_label, font=f_tier, fill=TEXT_WHITE)

    # Right side — challenge story
    right_x = 580
    f_chal_kicker = _font(18, weight="bold")
    draw.text((right_x, 170), "VIDEO MISSION", font=f_chal_kicker, fill=NEON_LIME)

    # Multi-line challenge title — break at ~22 chars per line, max 3 lines
    title_text = (challenge_title or "Leadership Mission").strip()
    f_title = _font(48, weight="bold")
    title_lines = _wrap_text(title_text, max_chars=22)[:3]
    for i, line in enumerate(title_lines):
        draw.text((right_x, 210 + i * 60), line, font=f_title, fill=TEXT_WHITE)

    if user_name:
        f_attr = _font(22, weight="regular")
        draw.text((right_x, 430), f"— {user_name}", font=f_attr, fill=TEXT_MUTED)

    # Footer
    f_footer = _font(22, weight="regular")
    footer = "leaderos.de"
    footer_bbox = draw.textbbox((0, 0), footer, font=f_footer)
    footer_w = footer_bbox[2] - footer_bbox[0]
    draw.text((WIDTH - 60 - footer_w, HEIGHT - 60), footer, font=f_footer, fill=NEON_LIME)
    f_tagline = _font(18, weight="regular")
    draw.text((60, HEIGHT - 60), "Willst du auch so eine Analyse? →", font=f_tagline, fill=TEXT_DIM)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _wrap_text(text: str, max_chars: int) -> list[str]:
    """Greedy word-wrap. Good enough for short challenge titles."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for w in words:
        if len(current) + len(w) + 1 <= max_chars:
            current = (current + " " + w).strip()
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


@router.get("/mission/{slug}")
async def og_mission_share(slug: str):
    """Dynamic Mission-Share card. URL referenced by SharedMissionPage SSR meta."""
    try:
        share = await db.mission_shares.find_one({"share_slug": slug}, {"_id": 0})
        if not share:
            return _png_response(_render_default_card())
        doc = await db.video_challenges.find_one({"entry_id": share["entry_id"]}, {"_id": 0})
        if not doc:
            return _png_response(_render_default_card())

        analysis = doc.get("analysis") or {}
        score = max(0, min(100, int(analysis.get("overall_score") or 0)))

        # Pull the challenge title from data.py
        from data import VIDEO_CHALLENGES
        challenge = next(
            (c for c in VIDEO_CHALLENGES if c.get("challenge_id") == share.get("challenge_id")),
            None,
        )
        title = (challenge or {}).get("title") or "Leadership Mission"
        return _png_response(
            _render_mission_share_card(
                score=score,
                tier_label=_score_to_tier(score),
                challenge_title=title,
                user_name=share.get("user_name") or None,
            )
        )
    except Exception as e:
        logger.exception("og mission render failed for %s: %s", slug, e)
        return _png_response(_render_default_card())


# ── Crawler-friendly HTML page for /m/{slug} ──────────────────────────────
# Social platforms (LinkedIn / Twitter / WhatsApp / Slack / Discord) don't
# execute JavaScript when generating link previews. They fetch the URL and
# parse <head> for OG meta tags. Our SPA's index.html is identical for every
# route, so without server-side meta-injection every shared mission would get
# the generic homepage preview.
#
# Vercel handles this via a rewrite: `/m/:slug` → this endpoint when the
# User-Agent matches a bot. Configured in `vercel.json` (see frontend root).
# For now we expose it under /api/og/mission-html/{slug} so the rewrite can
# proxy to it cleanly.

# Iter 92.27: prefer FRONTEND_BASE_URL (set per-Vercel-project to leaderos.de
# or leadercheck.de) over the legacy LEADER_OS_PUBLIC_URL env. The latter is
# kept as fallback for any deployment that still uses the old name.
OG_BASE_URL = (
    os.environ.get("FRONTEND_BASE_URL")
    or os.environ.get("LEADER_OS_PUBLIC_URL")
    or "https://leaderos.de"
).rstrip("/")


@router.get("/mission-html/{slug}")
async def og_mission_html(slug: str):
    """Server-rendered HTML stub with OG/Twitter meta tags for crawlers.

    Real users land here only via Vercel rewrites that match bot User-Agents.
    Everyone else reaches the SPA `/m/:slug` route directly.
    """
    share = await db.mission_shares.find_one({"share_slug": slug}, {"_id": 0})
    if not share:
        title = "Leader-OS · KI Leadership Training"
        description = "Werde KI-native Führungskraft mit Wlad Jachtchenkos Frameworks."
        og_image = f"{OG_BASE_URL}/api/og/default"
    else:
        doc = await db.video_challenges.find_one({"entry_id": share["entry_id"]}, {"_id": 0})
        analysis = (doc or {}).get("analysis") or {}
        score = analysis.get("overall_score") or 0
        from data import VIDEO_CHALLENGES
        challenge = next(
            (c for c in VIDEO_CHALLENGES if c.get("challenge_id") == share.get("challenge_id")),
            None,
        )
        chal_title = (challenge or {}).get("title") or "Leadership Mission"
        user_name = share.get("user_name") or "Ein Leader"
        # Use typographic German quotes („…") + middot — these render cleanly
        # across LinkedIn / X / WhatsApp without HTML-entity-escape weirdness.
        title = f"{user_name}: {score}/100 in „{chal_title}\u201c · Leader-OS"
        description = (
            f"{user_name} hat in der Mission „{chal_title}\u201c einen Score von "
            f"{score}/100 erreicht. Sieh dir Wlad Jachtchenkos KI-Analyse an — und probier es selbst."
        )
        og_image = f"{OG_BASE_URL}/api/og/mission/{slug}"

    canonical_url = f"{OG_BASE_URL}/m/{slug}"
    # Lightweight HTML — crawlers parse <head>, ignore body. We still add a
    # human-readable fallback + a redirect <meta> so real users (if they
    # somehow land here) get bounced to the SPA.
    html = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>{_escape(title)}</title>
<meta name="description" content="{_escape(description)}">
<link rel="canonical" href="{canonical_url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Leader-OS">
<meta property="og:title" content="{_escape(title)}">
<meta property="og:description" content="{_escape(description)}">
<meta property="og:url" content="{canonical_url}">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Leader-OS Mission Score Karte">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{_escape(title)}">
<meta name="twitter:description" content="{_escape(description)}">
<meta name="twitter:image" content="{og_image}">
<meta http-equiv="refresh" content="0;url={canonical_url}">
</head>
<body>
<noscript>
<h1>{_escape(title)}</h1>
<p>{_escape(description)}</p>
<a href="{canonical_url}">Mission ansehen auf Leader-OS</a>
</noscript>
<script>window.location.replace({canonical_url!r});</script>
</body>
</html>"""
    return Response(
        content=html,
        media_type="text/html; charset=utf-8",
        headers={
            "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
        },
    )


def _escape(text: str) -> str:
    """Minimal HTML attribute escaper.

    Crawlers (LinkedIn, X) decode &amp;/&lt;/&gt; but not always &quot; in
    title-tags consistently. So we render German quote-marks („…")
    untouched — they're already safe characters in HTML attributes — and
    only escape the four that *must* be escaped (& < > and ASCII ").
    German typographic quotes look better in previews anyway.
    """
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


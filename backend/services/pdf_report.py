"""
Server-side PDF Lead-Magnet generator for Resend email attachments.

This is NOT a static report. It is a 7-page premium lead magnet that
drives users back into LeaderOS by revealing curiosity hooks instead
of full answers. Locked sections create the «I've only seen the
beginning» feeling.

Design philosophy: Apple · Linear · Stripe · Notion.
Minimal. Elegant. Large typography. Premium cards. Whitespace.

7 pages:
  1. Your Leadership DNA          (Identity & Archetype)
  2. Executive Snapshot           (6 competencies, locked details)
  3. The Pattern We Found         (1 revealed + 2 locked)
  4. Your Biggest Opportunity     (Gap + impact teaser)
  5. Your 30-Day Challenge        (W1 unlocked, W2-4 teased)
  6. Your Personal AI Coach       (WladBot prompt examples)
  7. Your Leadership Journey      (Roadmap + CTAs)
"""
from __future__ import annotations
import base64
import io
import logging
from datetime import datetime
from typing import Optional, Union

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════
# BRAND
# ════════════════════════════════════════════════════════════════════
LIME = colors.HexColor("#C8FF00")
LIME_DIM = colors.HexColor("#7a9900")
BG = colors.HexColor("#0a0a0a")
CARD = colors.HexColor("#111111")
CARD_LIGHT = colors.HexColor("#161616")
BORDER = colors.HexColor("#1f1f1f")
BORDER_LIME = colors.HexColor("#C8FF0026")
WHITE = colors.HexColor("#ffffff")
SLATE = colors.HexColor("#94A3B8")
SLATE_MUTED = colors.HexColor("#64748B")
DIM = colors.HexColor("#3a3a3a")

# ════════════════════════════════════════════════════════════════════
# LABELS
# ════════════════════════════════════════════════════════════════════
ROLE_LABELS = {
    "communicator": "Der Kommunikator",
    "manager": "Der Manager",
    "team_leader": "Der Team-Architekt",
    "psychologist": "Der EQ-Stratege",
    "problem_solver": "Der Problem-Löser",
    "innovator": "Der Innovator",
    "strategist": "Der Strategist",
}

CATEGORY_LABELS = {
    "rhetorik": "Rhetorik",
    "fuehrung": "Führung",
    "eq": "Strategisches EQ",
    "kritisches_denken": "Kritisches Denken",
    "entscheidung": "Entscheidung",
    "strategie": "Strategie",
}

ELITE_BENCHMARKS = {
    "rhetorik": 82,
    "fuehrung": 85,
    "eq": 78,
    "kritisches_denken": 80,
    "entscheidung": 84,
    "strategie": 81,
}

CATEGORY_INTERPRETATIONS = {
    "rhetorik": "Wie viele Menschen dir wirklich zuhören.",
    "fuehrung": "Wie viele Menschen dir wirklich folgen.",
    "eq": "Wie tief du Menschen liest, bevor sie sprechen.",
    "kritisches_denken": "Wie schnell du Bullshit erkennst.",
    "entscheidung": "Wie sauber du unter Druck entscheidest.",
    "strategie": "Wie weit du in die Zukunft denkst.",
}


# ════════════════════════════════════════════════════════════════════
# HELPERS — Coerce real quiz.py shape OR test shape
# ════════════════════════════════════════════════════════════════════
def _coerce_narrative(raw: Union[dict, str, None]) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        return {"executive_summary": raw}
    return {}


def _coerce_top_role(report: dict) -> dict:
    s = report.get("strongest_role") or report.get("top_role")
    if isinstance(s, dict):
        return {"label": s.get("label") or ROLE_LABELS.get(s.get("key") or s.get("slug", ""), "Der Leader"),
                "score": int(s.get("score", 70))}
    if isinstance(s, str):
        return {"label": ROLE_LABELS.get(s, s.title()), "score": 70}
    return {"label": "Der Leader", "score": 70}


def _coerce_weakest_role(report: dict, fallback_score: int) -> dict:
    w = report.get("weakest_role") or {}
    if isinstance(w, dict):
        return {
            "label": w.get("label") or ROLE_LABELS.get(w.get("key") or w.get("slug", ""), "Strategie"),
            "score": int(w.get("score", max(20, fallback_score - 30))),
        }
    if isinstance(w, str):
        return {"label": ROLE_LABELS.get(w, w.title()), "score": max(20, fallback_score - 30)}
    return {"label": "Strategie", "score": max(20, fallback_score - 30)}


def _coerce_cat_scores(report: dict) -> dict:
    return report.get("cat_scores") or report.get("cat_avg") or {}


def _coerce_score(report: dict) -> int:
    return int(report.get("avg_total") or report.get("score") or report.get("total_avg") or 50)


def _percentile_for_score(score: int) -> str:
    if score >= 90:
        return "Top 1 %"
    if score >= 82:
        return "Top 5 %"
    if score >= 75:
        return "Top 10 %"
    if score >= 68:
        return "Top 20 %"
    if score >= 60:
        return "Top 35 %"
    if score >= 50:
        return "Mittelfeld"
    return "Entwicklungsbereich"


def _identity_headline_for(top_role_label: str, score: int) -> tuple[str, str]:
    """Returns (line1, line2) — short, declarative identity statement."""
    role = top_role_label.lower()
    if "kommunikator" in role:
        return ("Du triffst nicht nur Entscheidungen.", "Du formst die Sprache, in der andere sie verstehen.")
    if "manager" in role:
        return ("Du führst nicht durch Lautstärke.", "Du führst durch Konsequenz.")
    if "team" in role or "architekt" in role:
        return ("Du baust nicht Teams.", "Du baust Systeme, in denen Teams sich selbst führen.")
    if "eq" in role or "psycholog" in role:
        return ("Du liest Räume, bevor sie sprechen.", "Das ist deine unsichtbare Macht.")
    if "problem" in role:
        return ("Andere sehen Probleme.", "Du siehst Hebel.")
    if "innovat" in role:
        return ("Du wartest nicht auf den Markt.", "Du baust ihn neu.")
    return ("Du gehörst zu den wenigen,", "die wirklich Verantwortung übernehmen.")


# ════════════════════════════════════════════════════════════════════
# LOW-LEVEL DRAWING
# ════════════════════════════════════════════════════════════════════
def _page_bg(c: canvas.Canvas):
    w, h = A4
    c.setFillColor(BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)


def _page_chrome(c: canvas.Canvas, page_num: int, total_pages: int, section_label: str = ""):
    w, h = A4
    # Top-left lime tick + brand
    c.setFillColor(LIME)
    c.rect(20 * mm, h - 14 * mm, 6 * mm, 0.5 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(20 * mm, h - 18 * mm, "LEADER / OS")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 7.5)
    if section_label:
        c.drawString(50 * mm, h - 18 * mm, section_label.upper())
    c.drawRightString(w - 20 * mm, h - 18 * mm, f"{page_num:02d} / {total_pages:02d}")

    # Bottom footer
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.3)
    c.line(20 * mm, 16 * mm, w - 20 * mm, 16 * mm)
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(20 * mm, 11 * mm, "leadercheck.de · Wlad Jachtchenko · 3× SPIEGEL-Bestseller")
    c.drawRightString(w - 20 * mm, 11 * mm, f"© {datetime.now().year} Leader OS")


def _p(text: str, size: float = 10, color=SLATE, leading: float = 1.5, bold: bool = False, italic: bool = False) -> Paragraph:
    if bold and italic:
        font = "Helvetica-BoldOblique"
    elif bold:
        font = "Helvetica-Bold"
    elif italic:
        font = "Helvetica-Oblique"
    else:
        font = "Helvetica"
    style = ParagraphStyle(
        name="p", fontName=font, fontSize=size, leading=size * leading,
        textColor=color, spaceAfter=0, spaceBefore=0,
    )
    return Paragraph(text, style)


def _draw_p(c: canvas.Canvas, text: str, x: float, y: float, max_w: float, **kw) -> float:
    """Draws a wrapped paragraph. Returns y AFTER paragraph."""
    if not text:
        return y
    p = _p(text, **kw)
    _, h_used = p.wrap(max_w, 1000)
    p.drawOn(c, x, y - h_used)
    return y - h_used


def _eyebrow(c: canvas.Canvas, text: str, x: float, y: float):
    """Lime mono uppercase eyebrow label."""
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, f"▸  {text.upper()}")


def _section_number(c: canvas.Canvas, num: str, x: float, y: float):
    c.setFillColor(DIM)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, num)


def _locked_overlay(c: canvas.Canvas, x: float, y: float, w_box: float, h_box: float, label: str = "In LeaderOS freischalten"):
    """A 'locked' card overlay — lime border + soft hatch + lock label."""
    c.setFillColorRGB(0.05, 0.05, 0.05, alpha=0.7)
    c.roundRect(x, y, w_box, h_box, 3 * mm, fill=1, stroke=0)
    c.setStrokeColor(LIME)
    c.setLineWidth(0.8)
    c.setDash(2, 3)
    c.roundRect(x, y, w_box, h_box, 3 * mm, fill=0, stroke=1)
    c.setDash()
    # Lock pill (centred)
    pill_w = 60 * mm
    pill_x = x + (w_box - pill_w) / 2
    pill_y = y + h_box / 2 - 4 * mm
    c.setFillColor(LIME)
    c.roundRect(pill_x, pill_y, pill_w, 8 * mm, 4 * mm, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(x + w_box / 2, pill_y + 2.7 * mm, "🔒  " + label.upper())


def _card(c: canvas.Canvas, x: float, y: float, w_box: float, h_box: float, lime_border: bool = False, radius: float = 4 * mm):
    c.setFillColor(CARD)
    c.roundRect(x, y, w_box, h_box, radius, fill=1, stroke=0)
    c.setStrokeColor(LIME if lime_border else BORDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w_box, h_box, radius, fill=0, stroke=1)


def _progress(c: canvas.Canvas, x: float, y: float, w_full: float, value: int, max_val: int = 100,
              show_benchmark: bool = False, benchmark: int = 80):
    """Slim lime progress bar, max value rendered as fill width."""
    h_bar = 1.5 * mm
    c.setFillColor(BORDER)
    c.roundRect(x, y, w_full, h_bar, h_bar / 2, fill=1, stroke=0)
    fill_w = max(2 * mm, w_full * (value / max_val))
    c.setFillColor(LIME)
    c.roundRect(x, y, fill_w, h_bar, h_bar / 2, fill=1, stroke=0)
    if show_benchmark:
        bx = x + w_full * (benchmark / max_val)
        c.setStrokeColor(WHITE)
        c.setLineWidth(0.7)
        c.line(bx, y - 1 * mm, bx, y + h_bar + 1 * mm)


# ════════════════════════════════════════════════════════════════════
# PAGES
# ════════════════════════════════════════════════════════════════════
def _page1_leadership_dna(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 1, total, "Your Leadership DNA")

    score = ctx["score"]
    archetype = ctx["top_role"]["label"]
    percentile = ctx["percentile"]
    user_name = ctx["user_name"]
    id1, id2 = ctx["identity_headline"]

    # Eyebrow
    _eyebrow(c, "Diagnose · Seite 01", 20 * mm, h - 32 * mm)

    # Big hero title
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(20 * mm, h - 52 * mm, "Your")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(20 * mm, h - 64 * mm, "Leadership DNA.")

    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 75 * mm, f"Diagnose für {user_name}  ·  {datetime.now().strftime('%d.%m.%Y')}")

    # SCORE — extra large
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 96)
    score_str = str(score)
    score_w = c.stringWidth(score_str, "Helvetica-Bold", 96)
    score_x = (w - score_w) / 2
    c.drawString(score_x, h - 132 * mm, score_str)
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 18)
    c.drawString(score_x + score_w + 3 * mm, h - 132 * mm + 5 * mm, "/ 100")

    # Label under score
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(w / 2, h - 140 * mm, "DEIN LEADERSHIP-SCORE")

    # Archetype + percentile chips
    chip_y = h - 158 * mm
    # Chip 1 — Archetype
    chip1_w = 75 * mm
    chip1_x = w / 2 - chip1_w - 2 * mm
    c.setFillColor(CARD)
    c.roundRect(chip1_x, chip_y, chip1_w, 16 * mm, 3 * mm, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.roundRect(chip1_x, chip_y, chip1_w, 16 * mm, 3 * mm, fill=0, stroke=1)
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(chip1_x + 5 * mm, chip_y + 10 * mm, "▸  ARCHETYP")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(chip1_x + 5 * mm, chip_y + 4 * mm, archetype)
    # Chip 2 — Percentile
    chip2_x = w / 2 + 2 * mm
    c.setFillColor(CARD)
    c.roundRect(chip2_x, chip_y, chip1_w, 16 * mm, 3 * mm, fill=1, stroke=0)
    c.setStrokeColor(LIME)
    c.setLineWidth(0.5)
    c.roundRect(chip2_x, chip_y, chip1_w, 16 * mm, 3 * mm, fill=0, stroke=1)
    c.setFillColor(LIME)
    c.setFont("Helvetica", 7.5)
    c.drawString(chip2_x + 5 * mm, chip_y + 10 * mm, "▸  PERZENTIL")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(chip2_x + 5 * mm, chip_y + 4 * mm, percentile)

    # Identity headline — biggest emotional payoff
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(w / 2, h - 188 * mm, id1)
    c.setFillColor(LIME)
    c.setFont("Helvetica-BoldOblique", 18)
    c.drawCentredString(w / 2, h - 197 * mm, id2)

    # Bottom hook
    hook_y = 32 * mm
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(w / 2, hook_y, "✨   Deine vollständige Leadership-DNA wartet in LeaderOS.")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, hook_y - 6 * mm, "Diese Diagnose ist nur das erste Kapitel.")

    c.showPage()


def _page2_executive_snapshot(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 2, total, "Executive Snapshot")

    _eyebrow(c, "Section 02 · 6 Kompetenzen", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Executive")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "Snapshot.")

    c.setFillColor(SLATE)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 73 * mm, "Sechs Kompetenz-Achsen. Im Vergleich zu Elite-Leadern (Top 5 %).")

    cat_scores = ctx["cat_scores"]
    y = h - 92 * mm
    card_h = 22 * mm
    spacing = 4 * mm

    for slug, label in CATEGORY_LABELS.items():
        score = int(cat_scores.get(slug, 50))
        benchmark = ELITE_BENCHMARKS[slug]
        interpretation = CATEGORY_INTERPRETATIONS[slug]

        _card(c, 20 * mm, y - card_h, w - 40 * mm, card_h)
        # Label
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(26 * mm, y - 8 * mm, label)
        # Score
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(w - 26 * mm, y - 8 * mm, f"{score}")
        c.setFillColor(SLATE_MUTED)
        c.setFont("Helvetica", 8)
        c.drawRightString(w - 26 * mm, y - 13.5 * mm, f"Elite-Benchmark: {benchmark}")
        # Progress
        bar_w = (w - 52 * mm) - 26 * mm
        _progress(c, 26 * mm, y - 14 * mm, bar_w, score, show_benchmark=True, benchmark=benchmark)
        # Interpretation + lock
        c.setFillColor(SLATE_MUTED)
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawString(26 * mm, y - 19 * mm, interpretation)
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawRightString(w - 26 * mm, y - 19 * mm, "🔒  DETAILANALYSE IN LEADEROS")

        y -= (card_h + spacing)

    # Bottom hook
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(w / 2, 26 * mm, "Die Detailanalyse pro Kompetenz · wie sie sich gegenseitig verstärken · wartet in LeaderOS.")

    c.showPage()


def _page3_pattern(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 3, total, "The Pattern We Found")

    recs = ctx["recommendations"]
    first = recs[0] if recs else None
    cat_scores = ctx["cat_scores"]
    strong = max(cat_scores.items(), key=lambda kv: kv[1])[0] if cat_scores else "strategie"
    weak = min(cat_scores.items(), key=lambda kv: kv[1])[0] if cat_scores else "rhetorik"
    strong_label = CATEGORY_LABELS.get(strong, "Strategie")
    weak_label = CATEGORY_LABELS.get(weak, "Rhetorik")

    _eyebrow(c, "Section 03 · 3 Patterns", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Das Muster")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "in deinem Profil.")

    # Story opener — italic narrative
    story = (
        f"Wenn dein <font color='#C8FF00'>{strong_label}</font>-Score hoch ist, "
        f"aber <font color='#C8FF00'>{weak_label}</font> dahinter zurückbleibt · "
        "werden Leader oft zum Engpass im eigenen Team, ohne es zu merken."
    )
    y = h - 80 * mm
    y = _draw_p(c, story, 20 * mm, y, w - 40 * mm, size=12, color=SLATE, italic=True, leading=1.55)

    # Sub
    y -= 8 * mm
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, y, "Wir haben drei wiederkehrende Muster in deinem Profil gefunden.")
    y -= 12 * mm

    # Pattern 1 — REVEALED
    card_h = 38 * mm
    _card(c, 20 * mm, y - card_h, w - 40 * mm, card_h, lime_border=True)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(26 * mm, y - 7 * mm, "▸  PATTERN 01 · ENTHÜLLT")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    title1 = (first.get("title") if first else None) or "Du löst Probleme schneller als du delegierst."
    c.drawString(26 * mm, y - 14 * mm, title1[:70])
    desc1 = (first.get("description") if first else None) or (
        "Deine Stärke wird zur Falle: Du übernimmst Aufgaben, die andere wachsen lassen würden. "
        "Das macht dich kurzfristig stark · und langfristig zum Bottleneck."
    )
    _draw_p(c, desc1, 26 * mm, y - 19 * mm, w - 52 * mm, size=9.5, color=SLATE, leading=1.5)

    y -= (card_h + 6 * mm)

    # Pattern 2 — LOCKED
    locked_h = 22 * mm
    _card(c, 20 * mm, y - locked_h, w - 40 * mm, locked_h)
    _locked_overlay(c, 20 * mm, y - locked_h, w - 40 * mm, locked_h, "Pattern 02 · in LeaderOS")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(26 * mm, y - 7 * mm, "▸  PATTERN 02")

    y -= (locked_h + 4 * mm)

    # Pattern 3 — LOCKED
    _card(c, 20 * mm, y - locked_h, w - 40 * mm, locked_h)
    _locked_overlay(c, 20 * mm, y - locked_h, w - 40 * mm, locked_h, "Pattern 03 · in LeaderOS")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(26 * mm, y - 7 * mm, "▸  PATTERN 03")

    # CTA
    cta_y = 30 * mm
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(w / 2, cta_y, "→   ALLE 3 PATTERNS IN LEADEROS FREISCHALTEN")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, cta_y - 6 * mm, "leadercheck.de/diagnose · dein License-Key liegt im Welcome-Mail")

    c.showPage()


def _page4_biggest_opportunity(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 4, total, "Your Biggest Opportunity")

    weakest = ctx["weakest_role"]
    current = weakest["score"]
    potential = min(95, current + 32)
    gap = potential - current

    _eyebrow(c, "Section 04 · Highest Leverage", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Dein größter")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "Hebel.")

    c.setFillColor(SLATE)
    c.setFont("Helvetica", 11)
    c.drawString(20 * mm, h - 75 * mm, f"Fokus-Achse: {weakest['label']}")

    # Current vs Potential gauge card
    gauge_y = h - 165 * mm
    gauge_h = 80 * mm
    _card(c, 20 * mm, gauge_y, w - 40 * mm, gauge_h)

    # Current
    cx1 = 38 * mm
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(cx1, gauge_y + gauge_h - 12 * mm, "AKTUELL")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 48)
    c.drawString(cx1, gauge_y + gauge_h - 30 * mm, str(current))
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(cx1, gauge_y + gauge_h - 38 * mm, "/ 100")

    # Arrow
    cx_arrow = w / 2 - 5 * mm
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(cx_arrow, gauge_y + gauge_h - 26 * mm, "→")

    # Potential
    cx2 = w - 65 * mm
    c.setFillColor(LIME)
    c.setFont("Helvetica", 8.5)
    c.drawString(cx2, gauge_y + gauge_h - 12 * mm, "POTENZIAL")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 48)
    c.drawString(cx2, gauge_y + gauge_h - 30 * mm, str(potential))
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(cx2, gauge_y + gauge_h - 38 * mm, "/ 100")

    # Gap chip
    gap_y = gauge_y + 22 * mm
    c.setFillColor(LIME)
    c.roundRect(38 * mm, gap_y - 8 * mm, w - 76 * mm, 14 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(w / 2, gap_y - 3 * mm, f"GAP · +{gap} PUNKTE  ·  6 WOCHEN HEBEL")

    # Interactive teaser
    teaser_y = h - 178 * mm
    c.setFillColor(WHITE)
    c.setFont("Helvetica-BoldOblique", 13)
    c.drawString(20 * mm, teaser_y, "Was wäre, wenn du nur 10 Punkte gewinnen würdest?")

    impacts = [
        ("Schnellere", "Entscheidungen unter Druck"),
        ("Schärfere", "Executive Presence im Meeting"),
        ("Mehr", "Einfluss ohne mehr Stunden"),
    ]
    y = teaser_y - 14 * mm
    for tag, line in impacts:
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(22 * mm, y, "✓")
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(30 * mm, y, tag)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 10.5)
        c.drawString(30 * mm + c.stringWidth(tag, "Helvetica-Bold", 10.5) + 2 * mm, y, line)
        y -= 7 * mm

    # Bottom hook
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(w / 2, 30 * mm, "→   DETAILLIERTE SIMULATION DEINER ENTWICKLUNG IN LEADEROS")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, 24 * mm, "Pro Woche · pro Skill · pro Entscheidung modelliert.")

    c.showPage()


def _page5_30day_challenge(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 5, total, "Your 30-Day Challenge")

    weakest_label = ctx["weakest_role"]["label"]

    _eyebrow(c, "Section 05 · 30-Day Mission", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Deine")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "30-Tage-Challenge.")

    c.setFillColor(SLATE)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 73 * mm, f"Fokus-Achse: {weakest_label}.  ·  Nur Woche 1 ist hier sichtbar.")

    # WEEK 1 — UNLOCKED
    y = h - 88 * mm
    card_h = 70 * mm
    _card(c, 20 * mm, y - card_h, w - 40 * mm, card_h, lime_border=True)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(26 * mm, y - 8 * mm, "▸  WEEK 01 · BASELINE")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(26 * mm, y - 16 * mm, "Sehen, wo du wirklich stehst.")

    tasks = [
        ("Mo", "10-Min-Reflexion: Wo war ich gestern unscharf?"),
        ("Di", "1 schwieriges Gespräch bewusst durchspielen · vorher Argumente strukturieren"),
        ("Mi", "Boardroom-Pitch in 3 Sätzen formulieren · keine Füllwörter"),
        ("Do", "Entscheidungs-Journal starten · 1 Entscheidung, 2 Optionen, 1 Begründung"),
        ("Fr", "Wlads Top-Framework zur Fokus-Achse anwenden (in LeaderOS verfügbar)"),
    ]
    t_y = y - 25 * mm
    for day, task in tasks:
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(26 * mm, t_y, day)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 9.5)
        c.drawString(34 * mm, t_y, task)
        t_y -= 6.5 * mm

    y -= (card_h + 6 * mm)

    # WEEKS 2-4 — LOCKED with mini teaser
    weeks = [
        ("WEEK 02 · PRAXIS", "Skill in echten Konversationen installieren."),
        ("WEEK 03 · SICHTBARKEIT", "Skill vor echten Stakeholdern zeigen."),
        ("WEEK 04 · SKALIEREN", "Skill an dein Team weitergeben · Re-Diagnose."),
    ]
    locked_h = 18 * mm
    for label, teaser in weeks:
        _card(c, 20 * mm, y - locked_h, w - 40 * mm, locked_h)
        # Visible label + teaser
        c.setFillColor(SLATE_MUTED)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(26 * mm, y - 6.5 * mm, f"▸  {label}")
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(26 * mm, y - 13 * mm, teaser)
        # Lock pill on the right
        pill_w = 55 * mm
        pill_x = w - 20 * mm - pill_w
        pill_y = y - 14 * mm
        c.setFillColor(LIME)
        c.roundRect(pill_x, pill_y, pill_w, 7 * mm, 3.5 * mm, fill=1, stroke=0)
        c.setFillColor(BG)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(pill_x + pill_w / 2, pill_y + 2.2 * mm, "🔒  IN LEADEROS FREISCHALTEN")
        y -= (locked_h + 3 * mm)

    # Bottom CTA
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(w / 2, 30 * mm, "→   IN LEADEROS WEITERMACHEN")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, 24 * mm, "Wochen 2–4 mit täglichen Missionen · personalisierten Übungen · WladBot-Sparring.")

    c.showPage()


def _page6_ai_coach(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 6, total, "Your AI Leadership Coach")

    _eyebrow(c, "Section 06 · WladBot", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Dein persönlicher")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "KI-Coach.")

    c.setFillColor(SLATE)
    c.setFont("Helvetica", 10.5)
    intro = "Trainiert auf Wlads Methodik · verfügbar 24/7 · innerhalb von LeaderOS. Frag ihn was, was du sonst niemandem fragen würdest."
    _draw_p(c, intro, 20 * mm, h - 76 * mm, w - 40 * mm, size=10.5, color=SLATE, leading=1.5)

    prompts = [
        ("Vor einem schweren Gespräch.", "«Bereite mich auf das Feedback-Gespräch morgen vor.»"),
        ("Beim Delegieren.", "«Hilf mir, dieses Projekt sauber abzugeben.»"),
        ("Für Selbstreflexion.", "«Wo bin ich gerade unscharf als Leader?»"),
        ("Bei Kommunikations-Skripts.", "«Gib mir ehrliches Feedback zu dieser E-Mail.»"),
    ]
    y = h - 100 * mm
    card_h = 22 * mm
    for label, prompt in prompts:
        _card(c, 20 * mm, y - card_h, w - 40 * mm, card_h)
        # Left lime tick
        c.setFillColor(LIME)
        c.rect(20 * mm, y - card_h, 1.5 * mm, card_h, fill=1, stroke=0)
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(28 * mm, y - 7.5 * mm, label.upper())
        c.setFillColor(WHITE)
        c.setFont("Helvetica-BoldOblique", 11)
        c.drawString(28 * mm, y - 15 * mm, prompt)
        y -= (card_h + 4 * mm)

    # Bottom hook
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawCentredString(w / 2, 32 * mm, "Dies sind nur Beispiele. WladBot lernt deinen Kontext · in LeaderOS.")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(w / 2, 25 * mm, "→   50 GRATIS-CREDITS WARTEN AUF DICH")

    c.showPage()


def _page7_journey(c: canvas.Canvas, ctx: dict, total: int):
    w, h = A4
    _page_bg(c)
    _page_chrome(c, 7, total, "Your Leadership Journey")

    _eyebrow(c, "Section 07 · Roadmap", 20 * mm, h - 32 * mm)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 50 * mm, "Deine Leadership-")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(20 * mm, h - 62 * mm, "Journey beginnt jetzt.")

    # Roadmap nodes
    nodes = [
        ("Diagnose", True, "Du bist hier."),
        ("Persönliches Dashboard", False, "Dein Profil, live."),
        ("KI-Leadership-Coach", False, "WladBot, dein 24/7-Sparring."),
        ("Wöchentliche Missions", False, "Skills installieren · in Echt."),
        ("Leadership Academy", False, "91 Lektionen · 11 Frameworks."),
        ("Community", False, "Andere Top-Leader · echter Austausch."),
        ("Progress Tracking", False, "Misst, was wirklich passiert."),
        ("Re-Diagnose", False, "Delta sehen · neu kalibrieren."),
    ]
    node_y = h - 82 * mm
    node_h = 13 * mm
    for label, done, sub in nodes:
        # Connector line (top)
        if label != nodes[0][0]:
            c.setStrokeColor(BORDER_LIME)
            c.setLineWidth(1)
            c.setDash(1, 2)
            c.line(50 * mm, node_y + node_h + 0.5 * mm, 50 * mm, node_y + node_h + 4 * mm)
            c.setDash()
        # Dot
        c.setFillColor(LIME if done else BORDER)
        c.circle(50 * mm, node_y + node_h / 2, 2.2 * mm, fill=1, stroke=0)
        if done:
            c.setFillColor(BG)
            c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(50 * mm, node_y + node_h / 2 - 1.5 * mm, "✓")
        # Label
        c.setFillColor(WHITE if done else SLATE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(58 * mm, node_y + node_h / 2 + 1 * mm, label)
        c.setFillColor(SLATE_MUTED)
        c.setFont("Helvetica", 8.5)
        c.drawString(58 * mm, node_y + node_h / 2 - 4 * mm, sub)
        if done:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawRightString(w - 22 * mm, node_y + node_h / 2 + 1 * mm, "DU BIST HIER")
        node_y -= node_h

    # Manifesto
    manifesto_y = 70 * mm
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(w / 2, manifesto_y, "Leadership wird nicht durch eine Diagnose gemessen.")
    c.setFillColor(LIME)
    c.setFont("Helvetica-BoldOblique", 14)
    c.drawCentredString(w / 2, manifesto_y - 8 * mm, "Es wird durch konsequentes Handeln gebaut.")

    # Primary CTA
    btn_w = 100 * mm
    btn_x = (w - btn_w) / 2
    btn_y = 38 * mm
    c.setFillColor(LIME)
    c.roundRect(btn_x, btn_y, btn_w, 12 * mm, 6 * mm, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(w / 2, btn_y + 4 * mm, "→  IN LEADEROS WEITERMACHEN")

    # Secondary
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(w / 2, btn_y - 5 * mm, "Speichere diesen Report · komm wieder, wann du willst.")

    c.showPage()


# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════
def generate_diagnostic_pdf(user_name: str, report: dict) -> Optional[bytes]:
    """
    Generate the Leader OS Lead-Magnet PDF (7 pages, premium magnet design).
    Returns raw PDF bytes (or None on failure).
    """
    try:
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)

        score = _coerce_score(report)
        top_role = _coerce_top_role(report)
        weakest = _coerce_weakest_role(report, score)
        cat_scores = _coerce_cat_scores(report)
        narrative = _coerce_narrative(report.get("narrative"))
        percentile = _percentile_for_score(score)
        identity = _identity_headline_for(top_role["label"], score)

        # Pull recommendations (1..3) — be defensive about shape
        recs = []
        for key in ("recommendation_1", "recommendation_2", "recommendation_3"):
            r = narrative.get(key)
            if isinstance(r, dict):
                title = (r.get("title") or "").strip()
                desc = (r.get("description") or "").strip()
                if title or desc:
                    recs.append({"title": title, "description": desc})
            elif isinstance(r, str) and r.strip():
                recs.append({"title": "", "description": r.strip()})

        ctx = {
            "user_name": user_name,
            "score": score,
            "top_role": top_role,
            "weakest_role": weakest,
            "cat_scores": cat_scores,
            "narrative": narrative,
            "percentile": percentile,
            "identity_headline": identity,
            "recommendations": recs,
        }
        total = 7
        _page1_leadership_dna(c, ctx, total)
        _page2_executive_snapshot(c, ctx, total)
        _page3_pattern(c, ctx, total)
        _page4_biggest_opportunity(c, ctx, total)
        _page5_30day_challenge(c, ctx, total)
        _page6_ai_coach(c, ctx, total)
        _page7_journey(c, ctx, total)

        c.save()
        return buf.getvalue()
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        return None


def pdf_to_base64(pdf_bytes: bytes) -> str:
    return base64.b64encode(pdf_bytes).decode("ascii")

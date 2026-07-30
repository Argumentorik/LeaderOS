"""
argumentation_prep_pdf.py — Godmode-styled PDF export for SEXIER strategies.

Renders a branded Wlad Leader-OS PDF with:
  - Cover page (Wlad-Sparkle logo, user name, prep goal, generation date)
  - Diagonal "WLAD LEADER-OS · SEXIER" watermark on every page
  - Section headers colored to match the frontend accents (blue/green/orange/
    purple/rose/mint), matching StrategyResultView.js
  - SEXIER letter-chips rendered as small colored badges inline

The endpoint returns `application/pdf` with `Content-Disposition: attachment`,
so browsers download the file directly. No frontend PDF library needed.
"""
from __future__ import annotations

import io
import re
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether,
    Table, TableStyle,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Section color mapping — mirrors the frontend StrategyResultView ────────
SECTION_META = {
    "1": ("Situationsanalyse",        colors.HexColor("#3B82F6"), "Kontext · Dynamik · Hebel"),
    "2": ("Deine 3 stärksten Argumente", colors.HexColor("#6B8A00"), "SEXIER-Blöcke, priorisiert"),
    "3": ("Erwartete Einwände",       colors.HexColor("#FF9500"), "Gegenseite entwaffnen"),
    "4": ("Framing & Wording",        colors.HexColor("#7C3AED"), "Was du sagst · wie du es sagst"),
    "5": ("Schwachstellen",           colors.HexColor("#E11D48"), "Ehrliche Selbstprüfung"),
    "6": ("Ready-to-Use-Strategie",   colors.HexColor("#00CC77"), "Der Endzustand · sofort einsetzbar"),
}
BRAND_GREEN = colors.HexColor("#BFFF00")
BRAND_DARK  = colors.HexColor("#0A0A0A")
MUTED_GREY  = colors.HexColor("#666666")


def _parse_sections(md: str) -> list[dict]:
    """Split markdown into ordered [{key, title, subtitle, color, body}]."""
    lines = (md or "").replace("\r\n", "\n").split("\n")
    sections: list[dict] = []
    current: dict | None = None
    for raw in lines:
        m = re.match(r"^\s*##\s+(?:(\d+)\.\s*)?(.+?)\s*$", raw)
        if m:
            if current:
                sections.append(current)
            num = m.group(1) or ""
            meta = SECTION_META.get(num, (m.group(2), MUTED_GREY, ""))
            current = {
                "key": num or m.group(2),
                "title": meta[0],
                "color": meta[1],
                "subtitle": meta[2],
                "body_lines": [],
            }
        elif current is not None:
            current["body_lines"].append(raw)
    if current:
        sections.append(current)
    return sections


def _render_line_html(line: str) -> str:
    """Convert markdown-ish inline formatting → reportlab Paragraph HTML."""
    text = line
    # Bold
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    # SEXIER letter prefixes — render as coloured monospace badge
    text = re.sub(
        r"^\s*-\s+(S|E|X|I|E²|R):\s+",
        r'<font color="#6B8A00" backColor="#F0FFC7"><b> \1 </b></font>&nbsp;',
        text,
    )
    # Regular list bullet
    text = re.sub(r"^\s*-\s+", "• ", text)
    # Escape lone ampersands (but keep our injected entities intact)
    text = text.replace(" & ", " &amp; ")
    return text


def _cover(canvas_obj, doc):
    """Draw the branded cover page background."""
    w, h = A4
    # Top brand bar
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.rect(0, h - 1.8 * cm, w, 1.8 * cm, fill=True, stroke=False)
    canvas_obj.setFillColor(BRAND_GREEN)
    canvas_obj.rect(0, h - 1.85 * cm, w, 0.05 * cm, fill=True, stroke=False)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 12)
    canvas_obj.drawString(2 * cm, h - 1.15 * cm, "WLAD LEADER-OS · SEXIER-PREP")
    canvas_obj.setFillColor(BRAND_GREEN)
    canvas_obj.circle(w - 2.2 * cm, h - 0.9 * cm, 0.35 * cm, fill=True, stroke=False)
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont("Helvetica-Bold", 10)
    canvas_obj.drawCentredString(w - 2.2 * cm, h - 1.05 * cm, "W")
    _watermark(canvas_obj)


def _watermark(canvas_obj):
    """Diagonal Wlad watermark shown on every page."""
    w, h = A4
    canvas_obj.saveState()
    canvas_obj.setFillColor(colors.HexColor("#000000"))
    canvas_obj.setFillAlpha(0.035)
    canvas_obj.setFont("Helvetica-Bold", 60)
    canvas_obj.translate(w / 2, h / 2)
    canvas_obj.rotate(35)
    canvas_obj.drawCentredString(0, 0, "WLAD · LEADER-OS")
    canvas_obj.restoreState()


def _content_page(canvas_obj, doc):
    """Header/footer on all non-cover pages + watermark."""
    w, h = A4
    _watermark(canvas_obj)
    # Header
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.drawString(2 * cm, h - 1.1 * cm, "SEXIER-STRATEGIE · WLAD LEADER-OS")
    canvas_obj.setStrokeColor(BRAND_GREEN)
    canvas_obj.setLineWidth(1)
    canvas_obj.line(2 * cm, h - 1.3 * cm, w - 2 * cm, h - 1.3 * cm)
    # Footer
    canvas_obj.setFillColor(MUTED_GREY)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawRightString(w - 2 * cm, 1.2 * cm, f"Seite {doc.page}")
    canvas_obj.drawString(2 * cm, 1.2 * cm, "leader-check.de · vertraulich · nur für den:die Adressat:in")


def _on_first_page(canvas_obj, doc):
    _cover(canvas_obj, doc)


def render_strategy_pdf(*, strategy_markdown: str, user_name: str, prep_goal: str, tags: list[str] | None = None) -> bytes:
    """Return PDF bytes for the given SEXIER strategy."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2.4 * cm, bottomMargin=2 * cm,
        title=f"SEXIER-Strategie — {user_name or ''}".strip(" —"),
        author="Wlad Leader-OS",
    )

    styles = getSampleStyleSheet()
    h_cover = ParagraphStyle(
        "h_cover", parent=styles["Heading1"],
        fontName="Helvetica-Bold", fontSize=32, leading=38,
        textColor=BRAND_DARK, alignment=TA_LEFT, spaceAfter=0.6 * cm,
    )
    h_meta = ParagraphStyle(
        "h_meta", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=MUTED_GREY, spaceAfter=0.15 * cm,
    )
    h_section = ParagraphStyle(
        "h_section", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=15, leading=19,
        textColor=BRAND_DARK, spaceBefore=0.45 * cm, spaceAfter=0.15 * cm,
    )
    h_sub = ParagraphStyle(
        "h_sub", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=9, leading=12,
        textColor=MUTED_GREY, spaceAfter=0.35 * cm,
    )
    body = ParagraphStyle(
        "body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=15,
        textColor=colors.HexColor("#111111"), spaceAfter=0.14 * cm,
    )

    # ── Cover ────────────────────────────────────────────────
    story = []
    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph(
        '<font color="#6B8A00" size="11"><b>SEXIER-STRATEGIE</b></font>',
        h_meta,
    ))
    story.append(Paragraph(prep_goal or "Deine Argumentations-Strategie", h_cover))
    story.append(Paragraph(f"Für: <b>{user_name or 'Leader'}</b>", body))
    story.append(Paragraph(
        f"Erstellt am {datetime.now(timezone.utc).strftime('%d. %B %Y')} · Wlad Coaching",
        h_meta,
    ))
    if tags:
        story.append(Spacer(1, 0.4 * cm))
        chip_row = " ".join(
            f'<font backColor="#F0FFC7" color="#6B8A00"><b> #{t} </b></font>' for t in tags[:6]
        )
        story.append(Paragraph(chip_row, body))
    story.append(Spacer(1, 5 * cm))
    story.append(Paragraph(
        '<i>„Ein starkes Argument ist nicht laut — es ist unangreifbar."</i><br/><br/>'
        '<font color="#666666" size="9">— Wlad Jachtchenko</font>',
        body,
    ))
    story.append(PageBreak())

    # ── Sections ────────────────────────────────────────────
    sections = _parse_sections(strategy_markdown)
    for sec in sections:
        color = sec["color"]
        # Colored accent bar + section title as a small table so the accent
        # sits flush left of the title text.
        title_tbl = Table(
            [[
                "",
                Paragraph(f'<font color="#{color.hexval()[2:]}"><b>Sektion {sec["key"]}</b></font>  '
                          f'<b>{sec["title"]}</b>', h_section),
            ]],
            colWidths=[0.15 * cm, None],
        )
        title_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), color),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(KeepTogether([title_tbl]))
        if sec.get("subtitle"):
            story.append(Paragraph(sec["subtitle"], h_sub))
        for raw in sec["body_lines"]:
            line = raw.rstrip()
            if not line.strip():
                story.append(Spacer(1, 0.15 * cm))
                continue
            story.append(Paragraph(_render_line_html(line), body))
        story.append(Spacer(1, 0.5 * cm))

    if not sections:
        story.append(Paragraph("Keine strukturierten Sektionen gefunden.", body))
        story.append(Paragraph(_render_line_html(strategy_markdown or ""), body))

    doc.build(story, onFirstPage=_on_first_page, onLaterPages=_content_page)
    return buf.getvalue()

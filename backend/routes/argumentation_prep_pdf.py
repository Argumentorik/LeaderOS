"""
argumentation_prep_pdf.py — Godmode-styled PDF export for SEXIER strategies.

Renders a branded Wlad Leader-OS PDF with:
  - Cover page (Wlad-Sparkle logo, user name, prep goal, generation date)
  - Diagonal "WLAD LEADER-OS · SEXIER" watermark on every page
  - Section headers colored to match the frontend accents (blue/green/orange/
    purple/rose/mint), matching StrategyResultView.js
  - Section 2 ("Deine 3 stärksten Argumente") rendered as premium argument
    cards on their own page(s): dark header, colored SEXIER letter column,
    Einwand/Antwort rebuttal styling — no raw markdown anywhere.

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
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether,
    Table, TableStyle,
)
from reportlab.lib.enums import TA_LEFT

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
CARD_BORDER = colors.HexColor("#E4E4DE")
CARD_BG     = colors.HexColor("#FCFCF9")

# SEXIER letter palette + labels (order matters: E² before E in regexes)
LETTER_META = {
    "S":  ("#3B82F6", "Statement"),
    "E":  ("#00A868", "Erklärung"),
    "X":  ("#FF9500", "Beispiel / Beweis"),
    "I":  ("#7C3AED", "Impact"),
    "E²": ("#0891B2", "Emotion"),
    "R":  ("#E11D48", "Einwand-Konter"),
}
LETTER_RE = r"(E²|E2|S|E|X|I|R)"


def _norm_letter(letter: str) -> str:
    return "E²" if letter == "E2" else letter


def _esc(text: str) -> str:
    """Escape XML special chars before we inject our own tags."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _parse_sections(md: str) -> list[dict]:
    """Split markdown into ordered [{key, title, subtitle, color, body}]."""
    lines = (md or "").replace("\r\n", "\n").split("\n")
    sections: list[dict] = []
    current: dict | None = None
    for raw in lines:
        m = re.match(r"^\s*##\s+(?:(\d+)\.\s*)?(.+?)\s*$", raw)
        if m and not raw.lstrip().startswith("###"):
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


def _inline(text: str) -> str:
    """Markdown inline formatting → reportlab Paragraph HTML (escaped)."""
    text = _esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", text)
    return text


def _render_line_html(line: str) -> str:
    """Convert a full markdown-ish body line → Paragraph HTML."""
    text = _inline(line)
    # SEXIER letter prefixes — render as coloured monospace badge
    m = re.match(r"^\s*-\s+" + LETTER_RE + r"(?:\s*\([^)]*\))?:\s+(.*)$", text)
    if m:
        letter = _norm_letter(m.group(1))
        color, _label = LETTER_META[letter]
        return f'<font color="{color}"><b>{letter}</b></font> &nbsp;{m.group(2)}'
    # Regular list bullet (nested bullets get an en-space indent)
    text = re.sub(r"^\s{2,}-\s+", "&nbsp;&nbsp;&nbsp;○ ", text)
    text = re.sub(r"^\s*-\s+", "• ", text)
    return text


# ═══════════════════════════════════ Page furniture ═══════════════════════
def _cover(canvas_obj, doc):
    """Draw the branded cover page background."""
    w, h = A4
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
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.drawString(2 * cm, h - 1.1 * cm, "SEXIER-STRATEGIE · WLAD LEADER-OS")
    canvas_obj.setStrokeColor(BRAND_GREEN)
    canvas_obj.setLineWidth(1)
    canvas_obj.line(2 * cm, h - 1.3 * cm, w - 2 * cm, h - 1.3 * cm)
    canvas_obj.setFillColor(MUTED_GREY)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawRightString(w - 2 * cm, 1.2 * cm, f"Seite {doc.page}")
    canvas_obj.drawString(2 * cm, 1.2 * cm, "leader-check.de · vertraulich · nur für den:die Adressat:in")


def _on_first_page(canvas_obj, doc):
    _cover(canvas_obj, doc)


# ═══════════════════════════ Argument cards (Section 2) ═══════════════════
# Matches "### Argument 1: Titel", "Argument 1: Titel", "**Argument 1: Titel**"
ARG_HEAD_RE = re.compile(r"^\s*(?:#{3,4}\s+)?\*{0,2}Argument\s*(\d+)\s*[:.–-]\s*(.+?)\*{0,2}\s*$", re.IGNORECASE)


def _split_arguments(body_lines: list[str]) -> tuple[list[str], list[dict]]:
    """Split section-2 body into (intro_lines, [{num, title, lines}])."""
    intro: list[str] = []
    args: list[dict] = []
    cur: dict | None = None
    for raw in body_lines:
        if raw.strip() in ("---", "***", "___"):
            continue
        m = ARG_HEAD_RE.match(raw)
        if not m:
            # generic ### heading inside section 2 also starts a new card
            g = re.match(r"^\s*#{3,4}\s+(.+?)\s*$", raw)
            if g:
                m = None
                if cur:
                    args.append(cur)
                cur = {"num": str(len(args) + 1), "title": g.group(1).strip(), "lines": []}
                continue
        if m:
            if cur:
                args.append(cur)
            cur = {"num": m.group(1), "title": m.group(2).strip(), "lines": []}
        elif cur is None:
            if raw.strip():
                intro.append(raw)
        else:
            cur["lines"].append(raw)
    if cur:
        args.append(cur)
    return intro, args


def _parse_letter_rows(lines: list[str]) -> list[tuple[str | None, list[str]]]:
    """Group an argument's lines into (letter, [content lines]) rows."""
    rows: list[tuple[str | None, list[str]]] = []
    cur: tuple[str | None, list[str]] | None = None
    for raw in lines:
        m = re.match(r"^\s*-\s+\*{0,2}" + LETTER_RE + r"(?:\s*\([^)]*\))?\*{0,2}\s*:\s*(.*)$", raw)
        if m:
            cur = (_norm_letter(m.group(1)), [m.group(2)] if m.group(2).strip() else [])
            rows.append(cur)
        elif raw.strip():
            if cur is not None:
                cur[1].append(raw.strip())
            else:
                rows.append((None, [raw.strip()]))
                cur = rows[-1]
    return rows


def _letter_cell_par(letter: str) -> Paragraph:
    style = ParagraphStyle(
        f"letter_{letter}", fontName="Helvetica-Bold", fontSize=13, leading=15,
        textColor=colors.white, alignment=1,
    )
    return Paragraph(f"<b>{letter}</b>", style)


def _row_text_par(letter: str | None, content: list[str], body_style: ParagraphStyle) -> Paragraph:
    """Render one SEXIER row's text: tiny colored label + content lines."""
    parts: list[str] = []
    if letter and letter in LETTER_META:
        color, label = LETTER_META[letter]
        parts.append(f'<font color="{color}" size="6.5"><b>{label.upper()}</b></font>')
    for i, line in enumerate(content):
        html = _inline(line)
        html = re.sub(r"^Einwand:\s*", '<b>Einwand:</b> ', html)
        html = re.sub(r"^Antwort:\s*", '<b>Antwort:</b> ', html)
        html = re.sub(r"^-\s+", "• ", html)
        parts.append(html)
    return Paragraph("<br/>".join(parts) if parts else "&nbsp;", body_style)


def _argument_card(arg: dict, body_style: ParagraphStyle) -> Table:
    """One premium argument card: dark header + colored SEXIER letter column."""
    header_style = ParagraphStyle(
        "arg_header", fontName="Helvetica-Bold", fontSize=11.5, leading=14.5,
        textColor=colors.white,
    )
    header = Paragraph(
        f'<font color="#BFFF00" size="7.5"><b>ARGUMENT {int(arg["num"]):02d}</b></font><br/>'
        f'<b>{_inline(arg["title"])}</b>',
        header_style,
    )
    data: list[list] = [[header, ""]]
    letter_rows = _parse_letter_rows(arg["lines"])
    for letter, content in letter_rows:
        cell0 = _letter_cell_par(letter) if letter else Paragraph("", body_style)
        data.append([cell0, _row_text_par(letter, content, body_style)])

    tbl = Table(data, colWidths=[1.05 * cm, None], repeatRows=1)
    cmds = [
        # Header row
        ("SPAN", (0, 0), (1, 0)),
        ("BACKGROUND", (0, 0), (1, 0), BRAND_DARK),
        ("TOPPADDING", (0, 0), (1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (1, 0), 7),
        ("LEFTPADDING", (0, 0), (1, 0), 12),
        # Body defaults
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("BACKGROUND", (1, 1), (1, -1), CARD_BG),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("LEFTPADDING", (1, 1), (1, -1), 10),
        ("RIGHTPADDING", (1, 1), (1, -1), 10),
        # Frame
        ("BOX", (0, 0), (-1, -1), 0.8, CARD_BORDER),
        ("LINEBELOW", (1, 1), (1, -2), 0.5, colors.HexColor("#EDEDE6")),
        ("ROUNDEDCORNERS", [7, 7, 7, 7]),
    ]
    # Colored letter column, per row
    for i, (letter, _content) in enumerate(letter_rows, start=1):
        if letter and letter in LETTER_META:
            cmds.append(("BACKGROUND", (0, i), (0, i), colors.HexColor(LETTER_META[letter][0])))
        else:
            cmds.append(("BACKGROUND", (0, i), (0, i), CARD_BG))
    tbl.setStyle(TableStyle(cmds))
    return tbl


def _build_arguments_section(sec: dict, story: list, styles: dict) -> None:
    """Section 2 gets its own page(s) with a hero header + argument cards."""
    story.append(PageBreak())
    hero_style = ParagraphStyle(
        "args_hero", fontName="Helvetica-Bold", fontSize=21, leading=25,
        textColor=BRAND_DARK, spaceAfter=0.1 * cm,
    )
    story.append(Paragraph(
        '<font color="#6B8A00" size="8"><b>SEKTION 2 · SEXIER-BLÖCKE, PRIORISIERT</b></font>',
        styles["h_meta"],
    ))
    story.append(Paragraph("Deine 3 stärksten Argumente", hero_style))

    intro, args = _split_arguments(sec["body_lines"])
    card_body = ParagraphStyle(
        "card_body", parent=styles["body"], fontSize=8.9, leading=12.2,
        spaceAfter=0,
    )
    for line in intro:
        story.append(Paragraph(_render_line_html(line), styles["body"]))
    story.append(Spacer(1, 0.35 * cm))

    if not args:
        for raw in sec["body_lines"]:
            if raw.strip():
                story.append(Paragraph(_render_line_html(raw), styles["body"]))
        return

    for arg in args:
        story.append(_argument_card(arg, card_body))
        story.append(Spacer(1, 0.35 * cm))
    story.append(PageBreak())


# ═══════════════════════════════════ Main render ══════════════════════════
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

    ss = getSampleStyleSheet()
    h_cover = ParagraphStyle(
        "h_cover", parent=ss["Heading1"],
        fontName="Helvetica-Bold", fontSize=32, leading=38,
        textColor=BRAND_DARK, alignment=TA_LEFT, spaceAfter=0.6 * cm,
    )
    h_meta = ParagraphStyle(
        "h_meta", parent=ss["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=MUTED_GREY, spaceAfter=0.15 * cm,
    )
    h_section = ParagraphStyle(
        "h_section", parent=ss["Heading2"],
        fontName="Helvetica-Bold", fontSize=15, leading=19,
        textColor=BRAND_DARK, spaceBefore=0.45 * cm, spaceAfter=0.15 * cm,
    )
    h_sub = ParagraphStyle(
        "h_sub", parent=ss["Normal"],
        fontName="Helvetica-Oblique", fontSize=9, leading=12,
        textColor=MUTED_GREY, spaceAfter=0.35 * cm,
    )
    body = ParagraphStyle(
        "body", parent=ss["Normal"],
        fontName="Helvetica", fontSize=10, leading=15,
        textColor=colors.HexColor("#111111"), spaceAfter=0.14 * cm,
    )
    styles = {"h_meta": h_meta, "body": body}

    # ── Cover ────────────────────────────────────────────────
    story: list = []
    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph(
        '<font color="#6B8A00" size="11"><b>SEXIER-STRATEGIE</b></font>',
        h_meta,
    ))
    story.append(Paragraph(_esc(prep_goal or "Deine Argumentations-Strategie"), h_cover))
    story.append(Paragraph(f"Für: <b>{_esc(user_name or 'Leader')}</b>", body))
    story.append(Paragraph(
        f"Erstellt am {datetime.now(timezone.utc).strftime('%d. %B %Y')} · Wlad Coaching",
        h_meta,
    ))
    if tags:
        story.append(Spacer(1, 0.4 * cm))
        chip_row = " ".join(
            f'<font backColor="#F0FFC7" color="#6B8A00"><b> #{_esc(t)} </b></font>' for t in tags[:6]
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
        if sec["key"] == "2":
            _build_arguments_section(sec, story, styles)
            continue

        color = sec["color"]
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

        h3 = ParagraphStyle(
            f"h3_{sec['key']}", parent=body,
            fontName="Helvetica-Bold", fontSize=11.5, leading=15,
            textColor=color, spaceBefore=0.3 * cm, spaceAfter=0.12 * cm,
        )
        for raw in sec["body_lines"]:
            line = raw.rstrip()
            stripped = line.strip()
            if not stripped:
                story.append(Spacer(1, 0.15 * cm))
                continue
            if stripped in ("---", "***", "___"):
                continue
            hm = re.match(r"^#{3,4}\s+(.*)$", stripped)
            if hm:
                story.append(Paragraph(_inline(hm.group(1)), h3))
                continue
            story.append(Paragraph(_render_line_html(line), body))
        story.append(Spacer(1, 0.5 * cm))

    if not sections:
        story.append(Paragraph("Keine strukturierten Sektionen gefunden.", body))
        for raw in (strategy_markdown or "").split("\n"):
            if raw.strip():
                story.append(Paragraph(_render_line_html(raw), body))

    doc.build(story, onFirstPage=_on_first_page, onLaterPages=_content_page)
    return buf.getvalue()

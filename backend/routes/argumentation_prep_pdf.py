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

import hashlib
import io
import random
import re
from datetime import datetime, timezone

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
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
def _draw_logo(canvas_obj, x: float, y: float, size: float = 1.4):
    """Prominent Wlad Leader-OS logo: dark rounded square + lime W disc.

    `size` is a multiplier (1.0 = compact header logo, 2.4 = cover hero).
    """
    r_outer = 0.55 * cm * size
    canvas_obj.saveState()
    # Outer dark rounded square
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.roundRect(
        x - r_outer, y - r_outer, r_outer * 2, r_outer * 2,
        0.16 * cm * size, fill=True, stroke=False,
    )
    # Inner lime circle
    canvas_obj.setFillColor(BRAND_GREEN)
    canvas_obj.circle(x, y, r_outer * 0.68, fill=True, stroke=False)
    # W monogram
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont("Helvetica-Bold", 14 * size)
    canvas_obj.drawCentredString(x, y - (5 * size), "W")
    canvas_obj.restoreState()


def _cover(canvas_obj, doc):
    """Draw the branded cover page background with prominent logo."""
    w, h = A4
    # Full-width dark header bar
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.rect(0, h - 2.4 * cm, w, 2.4 * cm, fill=True, stroke=False)
    canvas_obj.setFillColor(BRAND_GREEN)
    canvas_obj.rect(0, h - 2.45 * cm, w, 0.06 * cm, fill=True, stroke=False)
    # Prominent logo in header (larger, brand-forward)
    _draw_logo(canvas_obj, 2.35 * cm, h - 1.2 * cm, size=1.15)
    # Wordmark
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 14)
    canvas_obj.drawString(3.6 * cm, h - 1.05 * cm, "WLAD LEADER-OS")
    canvas_obj.setFillColor(BRAND_GREEN)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(3.6 * cm, h - 1.5 * cm, "SEXIER · ARGUMENTATION PREP")
    # Right side: quiet URL
    canvas_obj.setFillColor(colors.HexColor("#BFBFBF"))
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.drawRightString(w - 2 * cm, h - 1.35 * cm, "leader-check.de")
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
    """Header/footer on all non-cover pages + watermark + small logo."""
    w, h = A4
    _watermark(canvas_obj)
    # Small logo in header
    _draw_logo(canvas_obj, 2.35 * cm, h - 1.05 * cm, size=0.55)
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.drawString(3.15 * cm, h - 1.1 * cm, "WLAD LEADER-OS · SEXIER-STRATEGIE")
    canvas_obj.setStrokeColor(BRAND_GREEN)
    canvas_obj.setLineWidth(1)
    canvas_obj.line(2 * cm, h - 1.4 * cm, w - 2 * cm, h - 1.4 * cm)
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
        topMargin=2.7 * cm, bottomMargin=2 * cm,
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

    # ── Final page: QR + rotating LeaderOS Plus invitation ──
    seed = f"{user_name}|{prep_goal}|{(strategy_markdown or '')[:400]}"
    _build_ending_page(story, styles, seed=seed)

    doc.build(story, onFirstPage=_on_first_page, onLaterPages=_content_page)
    return buf.getvalue()


# ═══════════════════════ Ending page (QR + rotating message) ══════════════
# Iter 128 (Wlad-Direktive): jedes PDF endet mit einer QR-basierten Einladung
# zu LeaderOS Plus. Damit Masterclass-Kunden bei jedem neuen PDF eine frische
# Nachricht bekommen, rotieren wir zwischen 12 Endings (deterministisch pro
# Strategie-Hash, damit dasselbe PDF stabil reproduzierbar ist).
ENDINGS = [
    ("Bereit für den nächsten Level?",
     "Diese Strategie ist erst der Anfang. LeaderOS Plus gibt dir Live-Calls, exklusive Kurse und die Community, die Wlad und sein Team persönlich begleiten."),
    ("Du hast den Plan. Jetzt fehlt der Raum.",
     "In LeaderOS Plus sparrst du mit Wlad und anderen Führungskräften an genau diesen Momenten — nicht mehr allein am Schreibtisch."),
    ("Eine Strategie ist kein Playbook.",
     "In LeaderOS Plus bauen wir mit dir zusammen dein persönliches Führungs-Playbook auf — Woche für Woche, bis es sitzt."),
    ("Du bist nicht der erste, der das Gespräch führt.",
     "Werde Teil des Kreises, der schon durch ist. LeaderOS Plus: echte Fälle, echte Antworten, echte Führung."),
    ("Wlad kann dir gleich persönlich antworten.",
     "In LeaderOS Plus sind monatliche Live-Sessions mit Wlad, plus Zugriff auf alle Frameworks, Kurse und Aufzeichnungen."),
    ("Ein starkes Argument ist gut. Ein starkes Netzwerk ist besser.",
     "LeaderOS Plus ist die Community, in der andere Leader deine schwierigsten Gespräche schon geführt haben — und dir zeigen, wie."),
    ("Was du hier hältst, ist Wlads Framework.",
     "Was du in LeaderOS Plus bekommst, ist Wlads Aufmerksamkeit — Live-Calls, Feedback, Coaching auf einem anderen Level."),
    ("Perfekte Vorbereitung ist wiederholbar.",
     "LeaderOS Plus macht sie zur Gewohnheit: jede Woche ein neuer Skill, jede Woche ein besserer Auftritt."),
    ("Die besten Leader haben einen unfairen Vorteil.",
     "LeaderOS Plus: laufender Zugriff auf Wlad, Rechtsanwälte, Vertriebler und Führungskräfte, die dir vorausgegangen sind."),
    ("Du hast das PDF. Willst du auch den Rest?",
     "Bücher, Kurse, Events, Community, Live-Calls — alles gebündelt in LeaderOS Plus. Ein Zugang. Kein Chaos."),
    ("Kein Framework wirkt ohne Übung.",
     "In LeaderOS Plus übst du mit echten Menschen — nicht mit einer KI, die immer nett bleibt."),
    ("Führung ist eine tägliche Entscheidung.",
     "LeaderOS Plus hält dich dran: kurze tägliche Impulse, klare Playbooks, ein Coach in der Tasche."),
]

QR_TARGET_URL = "https://leader-check.de/plus"


def _pick_ending(seed: str) -> tuple[str, str]:
    """Deterministically pick one of the endings from a stable seed."""
    if not seed:
        return random.choice(ENDINGS)
    idx = int(hashlib.md5(seed.encode("utf-8")).hexdigest(), 16) % len(ENDINGS)
    return ENDINGS[idx]


def _qr_drawing(url: str, size_cm: float = 3.6) -> Drawing:
    size_pt = size_cm * cm
    qr = QrCodeWidget(url, barLevel="M")
    b = qr.getBounds()
    w = b[2] - b[0]
    h = b[3] - b[1]
    d = Drawing(size_pt, size_pt, transform=[size_pt / w, 0, 0, size_pt / h, 0, 0])
    d.add(qr)
    return d


def _build_ending_page(story: list, styles: dict, seed: str) -> None:
    """Final page — QR to LeaderOS Plus + rotating personalised message."""
    story.append(PageBreak())

    headline, subtext = _pick_ending(seed)

    # Big dark hero card that occupies most of the page — very premium.
    hero_headline_style = ParagraphStyle(
        "end_head", fontName="Helvetica-Bold", fontSize=22, leading=26,
        textColor=colors.white, alignment=TA_LEFT, spaceAfter=0.35 * cm,
    )
    hero_sub_style = ParagraphStyle(
        "end_sub", fontName="Helvetica", fontSize=11, leading=15.5,
        textColor=colors.HexColor("#D9D9D9"), alignment=TA_LEFT,
    )
    hero_kicker_style = ParagraphStyle(
        "end_kicker", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
        textColor=BRAND_GREEN, alignment=TA_LEFT, spaceAfter=0.2 * cm,
    )
    qr_caption_style = ParagraphStyle(
        "qr_cap", fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=colors.white, alignment=TA_CENTER, spaceBefore=0.2 * cm,
    )
    qr_url_style = ParagraphStyle(
        "qr_url", fontName="Helvetica", fontSize=8, leading=10,
        textColor=colors.HexColor("#BFBFBF"), alignment=TA_CENTER,
    )

    left_cell = [
        Paragraph("LEADEROS PLUS · EINLADUNG", hero_kicker_style),
        Paragraph(_esc(headline), hero_headline_style),
        Paragraph(_esc(subtext), hero_sub_style),
        Spacer(1, 0.5 * cm),
        Paragraph(
            '<font color="#BFFF00" size="9"><b>SCAN &nbsp;→&nbsp; JOIN &nbsp;→&nbsp; LEVEL UP</b></font>',
            hero_sub_style,
        ),
    ]

    # QR block on a lime tile (contrast + brand)
    qr = _qr_drawing(QR_TARGET_URL, size_cm=3.4)
    qr_tile = Table(
        [[qr], [Paragraph("Scan me", qr_caption_style)], [Paragraph(QR_TARGET_URL, qr_url_style)]],
        colWidths=[4.6 * cm],
        rowHeights=[3.8 * cm, 0.55 * cm, 0.5 * cm],
    )
    qr_tile.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), BRAND_GREEN),
        ("BACKGROUND", (0, 1), (0, 2), BRAND_DARK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0, colors.transparent),
    ]))

    hero = Table(
        [[left_cell, qr_tile]],
        colWidths=[10.2 * cm, 5.2 * cm],
    )
    hero.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 22),
        ("RIGHTPADDING", (0, 0), (0, 0), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 26),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 26),
        ("LEFTPADDING", (1, 0), (1, 0), 4),
        ("RIGHTPADDING", (1, 0), (1, 0), 18),
        ("ROUNDEDCORNERS", [14, 14, 14, 14]),
    ]))

    story.append(Spacer(1, 0.4 * cm))
    story.append(hero)

    # Small print underneath
    fine = ParagraphStyle(
        "end_fine", fontName="Helvetica", fontSize=8.5, leading=12,
        textColor=MUTED_GREY, alignment=TA_CENTER, spaceBefore=0.6 * cm,
    )
    story.append(Paragraph(
        "Von Wlad Jachtchenko und dem Leader-OS Team. leader-check.de · Fragen? support@leader-check.de",
        fine,
    ))

"""
Server-side PDF report generator for Resend email attachments.
Uses reportlab to produce a Leader OS branded Executive Diagnostic PDF
that gets attached to the welcome / auto-report email so customers
always keep their full report even if they close the browser tab.
"""
from __future__ import annotations
import base64
import io
import logging
from datetime import datetime
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

logger = logging.getLogger(__name__)

# ── Leader OS brand colors ──────────────────────────────────────────
LIME = colors.HexColor("#C8FF00")
BG = colors.HexColor("#0a0a0a")
CARD = colors.HexColor("#141414")
BORDER = colors.HexColor("#1e1e1e")
WHITE = colors.HexColor("#ffffff")
GRAY = colors.HexColor("#94A3B8")
MUTED = colors.HexColor("#64748B")

ROLE_LABELS = {
    "communicator": "Kommunikator",
    "manager": "Manager",
    "team_leader": "Team Leader",
    "psychologist": "Psychologe",
    "problem_solver": "Problemlöser",
    "innovator": "Innovator",
}

CATEGORY_LABELS = {
    "rhetorik": "Rhetorik",
    "fuehrung": "Führung",
    "eq": "Emotionale Intelligenz",
    "kritisches_denken": "Kritisches Denken",
    "entscheidung": "Entscheidung",
    "strategie": "Strategie",
}


def _draw_page_chrome(c: canvas.Canvas, page_num: int, total_pages: int):
    """Page background + header strip + footer."""
    w, h = A4
    c.setFillColor(BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    # Lime accent bar (top)
    c.setFillColor(LIME)
    c.rect(0, h - 4 * mm, 40 * mm, 4 * mm, fill=1, stroke=0)
    # Footer line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(20 * mm, 18 * mm, w - 20 * mm, 18 * mm)
    # Footer text
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, 12 * mm, "© 2026 Leader OS · Wlad Jachtchenko · 3× SPIEGEL-Bestseller")
    c.drawRightString(w - 20 * mm, 12 * mm, f"Seite {page_num} / {total_pages}")
    c.drawCentredString(w / 2, 12 * mm, "leadercheck.de")


def _draw_logo(c: canvas.Canvas, x: float, y: float):
    """Draw the W logo block."""
    c.setFillColor(LIME)
    c.roundRect(x, y - 5 * mm, 9 * mm, 9 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + 4.5 * mm, y - 2.5 * mm, "W")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 12 * mm, y - 2 * mm, "LEADER / OS")


def _bar(c: canvas.Canvas, x: float, y: float, width: float, value: int, label: str, max_val: int = 100):
    """Draw a labeled horizontal bar with a value badge."""
    # Label
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y + 4 * mm, label)
    # Score
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(x + width, y + 4 * mm, f"{value}/{max_val}")
    # Track
    c.setFillColor(BORDER)
    c.roundRect(x, y, width, 2.4 * mm, 1.2 * mm, fill=1, stroke=0)
    # Fill
    fill_width = max(2 * mm, width * (value / max_val))
    c.setFillColor(LIME)
    c.roundRect(x, y, fill_width, 2.4 * mm, 1.2 * mm, fill=1, stroke=0)


def _paragraph(text: str, font_size: int = 10, color=GRAY, leading: float = 1.45, bold: bool = False) -> Paragraph:
    style = ParagraphStyle(
        name="body",
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=font_size,
        leading=font_size * leading,
        textColor=color,
        spaceAfter=0,
        spaceBefore=0,
    )
    return Paragraph(text, style)


def _draw_paragraph(c: canvas.Canvas, text: str, x: float, y: float, max_width: float, font_size: int = 10, color=GRAY, bold: bool = False) -> float:
    """Draw a wrapped paragraph. Returns y-position AFTER paragraph."""
    p = _paragraph(text, font_size=font_size, color=color, bold=bold)
    w_used, h_used = p.wrap(max_width, 1000)
    p.drawOn(c, x, y - h_used)
    return y - h_used - 2 * mm


def generate_diagnostic_pdf(user_name: str, report: dict) -> Optional[bytes]:
    """
    Generate a Leader OS branded Executive Diagnostic PDF.
    Returns raw PDF bytes (or None on failure).

    Expected `report` keys (best-effort extraction; missing fields are filled with safe defaults):
        - score (int): overall score 0–100
        - top_role (str): role slug, e.g. "manager"
        - weakest_role (dict): {"slug","label","score"} OR just {"label","score"}
        - cat_avg (dict[str, int]): per-category scores 0–100
        - layer_avg (dict[str, int]): {"ai_literacy","rhetoric","strategic_eq"}
        - narrative (str): KI-generated narrative summary (markdown stripped)
        - generated_at (iso str)
    """
    try:
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        w, h = A4

        score = int(report.get("score", report.get("total_avg", 50)))
        top_role_slug = report.get("top_role") or "communicator"
        if isinstance(top_role_slug, dict):
            top_role_slug = top_role_slug.get("slug") or "communicator"
        top_role_label = ROLE_LABELS.get(top_role_slug, top_role_slug.title())

        weakest = report.get("weakest_role") or {}
        if isinstance(weakest, str):
            weakest_label = ROLE_LABELS.get(weakest, weakest.title())
            weakest_score = score
        else:
            weakest_label = weakest.get("label") or ROLE_LABELS.get(weakest.get("slug", ""), "Strategie")
            weakest_score = int(weakest.get("score", max(20, score - 30)))

        cat_avg = report.get("cat_avg") or {}
        narrative = (report.get("narrative") or "").replace("\n\n", "<br/><br/>").replace("\n", " ")
        if not narrative:
            narrative = (
                f"<b>{user_name}</b>, dein Profil zeigt dich aktuell stark als "
                f"<b>{top_role_label}</b>. Dein größter Hebel liegt in deiner Schwachstelle: "
                f"<b>{weakest_label}</b>. Wenn du die nächsten 30 Tage konsequent an dieser einen Achse arbeitest, "
                f"verschiebst du dein gesamtes Führungsprofil messbar nach oben."
            )
        generated_at = report.get("generated_at") or datetime.now().isoformat()
        date_str = generated_at[:10] if isinstance(generated_at, str) else datetime.now().strftime("%Y-%m-%d")

        total_pages = 3

        # ─── PAGE 1: Cover + Overall ────────────────────────────────
        _draw_page_chrome(c, 1, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

        # Date / Diagnostic ID strip
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawRightString(w - 20 * mm, h - 20 * mm, f"Diagnose · {date_str}")

        # Hero title
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 28)
        c.drawString(20 * mm, h - 50 * mm, "Leader-Check ·")
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 28)
        c.drawString(20 * mm, h - 60 * mm, "Executive Diagnose")

        # Name
        c.setFillColor(WHITE)
        c.setFont("Helvetica", 13)
        c.drawString(20 * mm, h - 75 * mm, f"Für: {user_name}")

        # Big Score Card
        card_x, card_y, card_w, card_h = 20 * mm, h - 165 * mm, w - 40 * mm, 75 * mm
        c.setFillColor(CARD)
        c.roundRect(card_x, card_y, card_w, card_h, 4 * mm, fill=1, stroke=0)
        c.setStrokeColor(LIME)
        c.setLineWidth(0.8)
        c.roundRect(card_x, card_y, card_w, card_h, 4 * mm, fill=0, stroke=1)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(card_x + 8 * mm, card_y + card_h - 10 * mm, "DEIN LEADERSHIP-SCORE")

        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 72)
        c.drawString(card_x + 8 * mm, card_y + 22 * mm, f"{score}")
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 16)
        c.drawString(card_x + 8 * mm + c.stringWidth(str(score), "Helvetica-Bold", 72) + 4, card_y + 22 * mm, "/100")

        # Right side: Top role + weakest
        right_x = card_x + card_w / 2 + 6 * mm
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(right_x, card_y + card_h - 10 * mm, "DEINE STÄRKSTE ROLLE")
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(right_x, card_y + card_h - 20 * mm, top_role_label)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(right_x, card_y + 22 * mm, "DEIN GRÖSSTER HEBEL")
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(right_x, card_y + 12 * mm, weakest_label)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(right_x, card_y + 6 * mm, f"Aktuell: {weakest_score}/100 · 30 Tage Hebel")

        # Tagline
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(20 * mm, 30 * mm, "Diese Diagnose ist die Grundlage deines persönlichen 30-Tage-Aktionsplans.")

        c.showPage()

        # ─── PAGE 2: Narrative + Category Bars ──────────────────────
        _draw_page_chrome(c, 2, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(20 * mm, h - 35 * mm, "Wlads Einschätzung")
        c.setStrokeColor(LIME)
        c.setLineWidth(2)
        c.line(20 * mm, h - 38 * mm, 50 * mm, h - 38 * mm)

        y_cursor = h - 48 * mm
        y_cursor = _draw_paragraph(c, narrative, 20 * mm, y_cursor, w - 40 * mm, font_size=11, color=GRAY)

        # Category section
        y_cursor -= 10 * mm
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(20 * mm, y_cursor, "Kompetenz-Achsen")
        c.setStrokeColor(LIME)
        c.line(20 * mm, y_cursor - 3 * mm, 50 * mm, y_cursor - 3 * mm)
        y_cursor -= 12 * mm

        for cat_slug, label in CATEGORY_LABELS.items():
            val = int(cat_avg.get(cat_slug, 50))
            _bar(c, 20 * mm, y_cursor, w - 40 * mm, val, label)
            y_cursor -= 12 * mm

        c.showPage()

        # ─── PAGE 3: 30-Day Action Plan ────────────────────────────
        _draw_page_chrome(c, 3, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(20 * mm, h - 35 * mm, "Dein 30-Tage-Aktionsplan")
        c.setStrokeColor(LIME)
        c.setLineWidth(2)
        c.line(20 * mm, h - 38 * mm, 75 * mm, h - 38 * mm)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(20 * mm, h - 46 * mm, f"Fokus-Achse: {weakest_label}")

        plan_weeks = [
            ("Woche 1 · Diagnose vertiefen", [
                f"Tägliche 10-Minuten-Reflexion zu deiner Schwachstelle ({weakest_label})",
                "1 schwieriges Gespräch pro Tag bewusst durchspielen · vorab Argumente strukturieren",
                "Wlads Top-3-Frameworks zu deiner Achse anwenden (Argumentorik, FBI-Methode, EQ-Loop)",
            ]),
            ("Woche 2 · Praxis installieren", [
                "1× tägliches Stand-up als Mini-Bühne nutzen (3 Sätze · klar · ohne Füllwörter)",
                "Entscheidungs-Journal starten: 1 Entscheidung pro Tag, 2 Optionen, 1 Begründung",
                f"WladBot-Session zu deinem konkreten {weakest_label}-Fall (Wlads Sprache als Sparringspartner)",
            ]),
            ("Woche 3 · Sichtbarkeit erhöhen", [
                "1× Boardroom-Pitch (3 Minuten) vor echtem Stakeholder halten",
                "Stake-Communication-Skill: Pro Woche 1 schwieriges Feedback aktiv einholen",
                "Re-Diagnose ankündigen (Self-Assessment Mid-Sprint)",
            ]),
            ("Woche 4 · Skalieren", [
                "Eigene 1-Pager-Methodik erstellen (deine Lessons Learned, schriftlich)",
                "1 Team-Mitglied im neuen Skill coachen (Lehren festigt Können)",
                "Re-Diagnose machen · Delta messen · Sprint-2 planen",
            ]),
        ]

        y_cursor = h - 56 * mm
        for week_title, items in plan_weeks:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", 12)
            c.drawString(20 * mm, y_cursor, week_title)
            y_cursor -= 6 * mm
            for item in items:
                c.setFillColor(LIME)
                c.setFont("Helvetica-Bold", 9)
                c.drawString(22 * mm, y_cursor, "▸")
                y_cursor = _draw_paragraph(c, item, 28 * mm, y_cursor + 3 * mm, w - 48 * mm, font_size=9, color=GRAY)
            y_cursor -= 2 * mm

        # CTA box
        y_cursor -= 4 * mm
        if y_cursor < 50 * mm:
            y_cursor = 50 * mm
        cta_h = 26 * mm
        c.setFillColor(CARD)
        c.roundRect(20 * mm, y_cursor - cta_h, w - 40 * mm, cta_h, 3 * mm, fill=1, stroke=0)
        c.setStrokeColor(LIME)
        c.roundRect(20 * mm, y_cursor - cta_h, w - 40 * mm, cta_h, 3 * mm, fill=0, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(26 * mm, y_cursor - 10 * mm, "Bereit für den nächsten Schritt?")
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 9)
        c.drawString(26 * mm, y_cursor - 16 * mm, "Sprint (997 €) · Plus-Plus (4.797 €) · Enterprise")
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(26 * mm, y_cursor - 22 * mm, "→ leadercheck.de/close")

        c.showPage()
        c.save()
        return buf.getvalue()
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        return None


def pdf_to_base64(pdf_bytes: bytes) -> str:
    return base64.b64encode(pdf_bytes).decode("ascii")

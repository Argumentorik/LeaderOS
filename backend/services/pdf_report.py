"""
Server-side PDF report generator for Resend email attachments.
Uses reportlab to produce a Leader OS branded Executive Diagnostic PDF
that gets attached to the welcome / auto-report email so customers
always keep their full report even if they close the browser tab.

This module is DEFENSIVE about the report shape — both the live
shape from routes/quiz.py (cat_scores / strongest_role dict /
narrative dict) and the simpler test shape (cat_avg / top_role
string / narrative string) are supported.
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


# ── Helpers to coerce dict-or-string fields ─────────────────────────
def _coerce_narrative(raw: Union[dict, str, None]) -> dict:
    """Always return a dict with the keys we need."""
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        return {"executive_summary": raw}
    return {}


def _coerce_top_role(report: dict) -> str:
    """Return the label of the strongest role."""
    s = report.get("strongest_role") or report.get("top_role")
    if isinstance(s, dict):
        return s.get("label") or ROLE_LABELS.get(s.get("key") or s.get("slug", ""), "Leader")
    if isinstance(s, str):
        return ROLE_LABELS.get(s, s.title())
    return "Leader"


def _coerce_weakest_role(report: dict, fallback_score: int) -> dict:
    """Return a dict with label + score for the weakest role."""
    w = report.get("weakest_role") or {}
    if isinstance(w, str):
        return {"label": ROLE_LABELS.get(w, w.title()), "score": max(20, fallback_score - 30)}
    if isinstance(w, dict):
        return {
            "label": w.get("label") or ROLE_LABELS.get(w.get("key") or w.get("slug", ""), "Strategie"),
            "score": int(w.get("score", max(20, fallback_score - 30))),
        }
    return {"label": "Strategie", "score": max(20, fallback_score - 30)}


def _coerce_cat_scores(report: dict) -> dict:
    return report.get("cat_scores") or report.get("cat_avg") or {}


def _coerce_score(report: dict) -> int:
    return int(report.get("avg_total") or report.get("score") or report.get("total_avg") or 50)


# ── Drawing helpers ─────────────────────────────────────────────────
def _draw_page_chrome(c: canvas.Canvas, page_num: int, total_pages: int):
    w, h = A4
    c.setFillColor(BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(LIME)
    c.rect(0, h - 4 * mm, 40 * mm, 4 * mm, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(20 * mm, 18 * mm, w - 20 * mm, 18 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, 12 * mm, "© 2026 Leader OS · Wlad Jachtchenko · 3× SPIEGEL-Bestseller")
    c.drawRightString(w - 20 * mm, 12 * mm, f"Seite {page_num} / {total_pages}")
    c.drawCentredString(w / 2, 12 * mm, "leadercheck.de")


def _draw_logo(c: canvas.Canvas, x: float, y: float):
    c.setFillColor(LIME)
    c.roundRect(x, y - 5 * mm, 9 * mm, 9 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + 4.5 * mm, y - 2.5 * mm, "W")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 12 * mm, y - 2 * mm, "LEADER / OS")


def _bar(c: canvas.Canvas, x: float, y: float, width: float, value: int, label: str, max_val: int = 100):
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y + 4 * mm, label)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(x + width, y + 4 * mm, f"{value}/{max_val}")
    c.setFillColor(BORDER)
    c.roundRect(x, y, width, 2.4 * mm, 1.2 * mm, fill=1, stroke=0)
    fill_width = max(2 * mm, width * (value / max_val))
    c.setFillColor(LIME)
    c.roundRect(x, y, fill_width, 2.4 * mm, 1.2 * mm, fill=1, stroke=0)


def _draw_paragraph(c: canvas.Canvas, text: str, x: float, y: float, max_width: float,
                    font_size: int = 10, color=GRAY, bold: bool = False, leading_mult: float = 1.45) -> float:
    if not text:
        return y
    style = ParagraphStyle(
        name="body",
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=font_size,
        leading=font_size * leading_mult,
        textColor=color,
        spaceAfter=0,
        spaceBefore=0,
    )
    p = Paragraph(text, style)
    _, h_used = p.wrap(max_width, 1000)
    p.drawOn(c, x, y - h_used)
    return y - h_used - 2 * mm


def _section_title(c: canvas.Canvas, text: str, x: float, y: float, width_mm: float = 30) -> float:
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, text)
    c.setStrokeColor(LIME)
    c.setLineWidth(2)
    c.line(x, y - 3 * mm, x + width_mm * mm, y - 3 * mm)
    return y - 9 * mm


# ── Main entry ──────────────────────────────────────────────────────
def generate_diagnostic_pdf(user_name: str, report: dict) -> Optional[bytes]:
    """
    Generate a Leader OS branded Executive Diagnostic PDF (3 pages).
    Returns raw PDF bytes (or None on failure).
    Accepts both quiz.py-shape and test-shape reports (see module docstring).
    """
    try:
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        w, h = A4

        # ── Normalize the report shape ────────────────────────────
        score = _coerce_score(report)
        top_role_label = _coerce_top_role(report)
        weakest = _coerce_weakest_role(report, score)
        cat_scores = _coerce_cat_scores(report)
        narrative = _coerce_narrative(report.get("narrative"))

        profile_title = (narrative.get("profile_title") or "Leadership-Profil").strip()
        executive_summary = (narrative.get("executive_summary") or "").strip()
        top_strength = (narrative.get("top_strength") or "").strip()
        growth_priority = (narrative.get("growth_priority") or weakest["label"]).strip()
        urgency_message = (narrative.get("urgency_message") or "").strip()
        closing_statement = (narrative.get("closing_statement") or "").strip()
        personal_response = (narrative.get("personal_response") or "").strip()

        recommendations = []
        for key in ("recommendation_1", "recommendation_2", "recommendation_3"):
            r = narrative.get(key)
            if isinstance(r, dict):
                title = (r.get("title") or "").strip()
                description = (r.get("description") or "").strip()
                if title or description:
                    recommendations.append({"title": title, "description": description})
            elif isinstance(r, str) and r.strip():
                recommendations.append({"title": "", "description": r.strip()})

        if not executive_summary:
            executive_summary = (
                f"<b>{user_name}</b>, dein Profil zeigt dich aktuell stark als <b>{top_role_label}</b>. "
                f"Dein größter Hebel liegt in deiner Schwachstelle: <b>{weakest['label']}</b>. "
                f"30 Tage konsequente Arbeit an dieser Achse verschieben dein gesamtes Führungsprofil messbar."
            )

        generated_at = report.get("created_at") or report.get("generated_at") or datetime.now().isoformat()
        date_str = generated_at[:10] if isinstance(generated_at, str) and len(generated_at) >= 10 else datetime.now().strftime("%Y-%m-%d")

        total_pages = 3

        # ═══ PAGE 1: Cover + Score ══════════════════════════════════
        _draw_page_chrome(c, 1, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

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

        # Name + Profile title
        c.setFillColor(WHITE)
        c.setFont("Helvetica", 13)
        c.drawString(20 * mm, h - 75 * mm, f"Für: {user_name}")
        if profile_title:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Oblique", 12)
            c.drawString(20 * mm, h - 83 * mm, f"„{profile_title}\"")

        # Big Score Card
        card_x, card_y, card_w, card_h = 20 * mm, h - 175 * mm, w - 40 * mm, 75 * mm
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
        c.drawString(right_x, card_y + 12 * mm, weakest["label"])
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(right_x, card_y + 6 * mm, f"Aktuell: {weakest['score']}/100 · 30 Tage Hebel")

        # Personal greeting if WladBot voice was captured
        y_cursor = card_y - 10 * mm
        if personal_response:
            y_cursor = _draw_paragraph(c, f"<i>{personal_response}</i>", 20 * mm, y_cursor, w - 40 * mm, font_size=10, color=LIME)

        # Tagline
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(20 * mm, 30 * mm, "Diese Diagnose ist die Grundlage deines persönlichen 30-Tage-Aktionsplans.")

        c.showPage()

        # ═══ PAGE 2: Narrative + Category Bars ══════════════════════
        _draw_page_chrome(c, 2, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

        y_cursor = _section_title(c, "Wlads Einschätzung", 20 * mm, h - 35 * mm, 45)

        # Executive summary
        y_cursor = _draw_paragraph(c, executive_summary, 20 * mm, y_cursor, w - 40 * mm, font_size=11, color=GRAY)

        # Layer analyses
        for slug, label in [("ai_literacy_analysis", "KI-Kompetenz"),
                            ("rhetoric_analysis", "Rhetorik"),
                            ("eq_analysis", "Strategisches EQ")]:
            txt = (narrative.get(slug) or "").strip()
            if not txt:
                continue
            y_cursor -= 3 * mm
            y_cursor = _draw_paragraph(c, f"<b><font color='#C8FF00'>{label}.</font></b> {txt}", 20 * mm, y_cursor, w - 40 * mm, font_size=10, color=GRAY)

        if top_strength or growth_priority:
            y_cursor -= 4 * mm
            box_h = 22 * mm
            c.setFillColor(CARD)
            c.roundRect(20 * mm, y_cursor - box_h, w - 40 * mm, box_h, 3 * mm, fill=1, stroke=0)
            c.setStrokeColor(LIME)
            c.setLineWidth(0.5)
            c.roundRect(20 * mm, y_cursor - box_h, w - 40 * mm, box_h, 3 * mm, fill=0, stroke=1)
            inner_x = 24 * mm
            inner_y = y_cursor - 8 * mm
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(inner_x, inner_y, "▸ DEINE STÄRKE")
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(inner_x, inner_y - 5 * mm, top_strength[:80] if top_strength else "Klare Präsenz")
            mid_x = inner_x + (w - 40 * mm) / 2
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(mid_x, inner_y, "▸ DEIN NÄCHSTER HEBEL")
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(mid_x, inner_y - 5 * mm, growth_priority[:80])
            y_cursor -= box_h + 8 * mm

        if cat_scores:
            y_cursor = _section_title(c, "Kompetenz-Achsen", 20 * mm, y_cursor, 38)
            for cat_slug, label in CATEGORY_LABELS.items():
                val = int(cat_scores.get(cat_slug, 50))
                _bar(c, 20 * mm, y_cursor, w - 40 * mm, val, label)
                y_cursor -= 12 * mm

        c.showPage()

        # ═══ PAGE 3: Recommendations + 30-Day Plan ══════════════════
        _draw_page_chrome(c, 3, total_pages)
        _draw_logo(c, 20 * mm, h - 18 * mm)

        y_cursor = _section_title(c, "Wlads 3 Empfehlungen", 20 * mm, h - 35 * mm, 55)

        if recommendations:
            for i, rec in enumerate(recommendations, 1):
                title = rec.get("title") or f"Empfehlung {i}"
                desc = rec.get("description") or ""
                c.setFillColor(LIME)
                c.setFont("Helvetica-Bold", 11)
                c.drawString(20 * mm, y_cursor, f"{i}. {title}")
                y_cursor -= 5 * mm
                y_cursor = _draw_paragraph(c, desc, 24 * mm, y_cursor, w - 48 * mm, font_size=10, color=GRAY)
                y_cursor -= 3 * mm
        else:
            y_cursor = _draw_paragraph(c,
                "Konkrete Empfehlungen findest du in deinem persönlichen Login-Bereich · sie werden in Echtzeit aus deiner Diagnose generiert.",
                20 * mm, y_cursor, w - 40 * mm, font_size=10, color=GRAY)

        if urgency_message:
            y_cursor -= 4 * mm
            y_cursor = _draw_paragraph(c, f"<b><font color='#C8FF00'>Warum jetzt:</font></b> {urgency_message}",
                                       20 * mm, y_cursor, w - 40 * mm, font_size=10, color=WHITE)

        # 30-Day plan label
        y_cursor -= 6 * mm
        y_cursor = _section_title(c, "Dein 30-Tage-Aktionsplan", 20 * mm, y_cursor, 55)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(20 * mm, y_cursor, f"Fokus-Achse: {growth_priority}")
        y_cursor -= 8 * mm

        plan_weeks = [
            ("W1 · Diagnose vertiefen", "Tägliche 10-Min-Reflexion zur Schwachstelle · 1 schwieriges Gespräch pro Tag bewusst durchspielen · Wlads Top-3-Frameworks anwenden."),
            ("W2 · Praxis installieren", "1× tägliches Stand-up als Mini-Bühne · Entscheidungs-Journal starten · WladBot-Session zum konkreten Fall."),
            ("W3 · Sichtbarkeit erhöhen", "1× Boardroom-Pitch (3 Min) vor echtem Stakeholder · 1 schwieriges Feedback pro Woche aktiv einholen · Mid-Sprint Self-Assessment."),
            ("W4 · Skalieren", "Eigene 1-Pager-Methodik schriftlich festhalten · 1 Team-Mitglied im Skill coachen · Re-Diagnose machen · Delta messen."),
        ]
        for title, desc in plan_weeks:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(20 * mm, y_cursor, title)
            y_cursor -= 4.5 * mm
            y_cursor = _draw_paragraph(c, desc, 24 * mm, y_cursor + 2 * mm, w - 48 * mm, font_size=9, color=GRAY)
            y_cursor -= 1 * mm

        # CTA block
        if y_cursor < 55 * mm:
            y_cursor = 55 * mm
        cta_h = 26 * mm
        c.setFillColor(CARD)
        c.roundRect(20 * mm, y_cursor - cta_h, w - 40 * mm, cta_h, 3 * mm, fill=1, stroke=0)
        c.setStrokeColor(LIME)
        c.roundRect(20 * mm, y_cursor - cta_h, w - 40 * mm, cta_h, 3 * mm, fill=0, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 12)
        cta_title = closing_statement[:65] if closing_statement else "Bereit für den nächsten Schritt?"
        c.drawString(26 * mm, y_cursor - 10 * mm, cta_title)
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

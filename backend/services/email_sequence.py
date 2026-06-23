"""
Leader OS — 10-Email Nurture-Sequence für Non-Buyers
====================================================

Triggert nach Report-Generierung (T+0). Sendet 10 E-Mails über 30 Tage,
mit jeweils einem klaren CTA Richtung Sprint (997€) oder Plus-Plus (4.797€).

Skip-Logik: Wenn der Lead zwischendurch kauft (license_keys.activated OR
payment_transactions.payment_status == 'paid'), wird die Sequence gestoppt.

Zeitplan (Tage nach Diagnose):
  1. T+0d   Report ist da (separater Hook — nicht in dieser Sequence)
  2. T+1d   Was dein Score wirklich bedeutet
  3. T+3d   Wlad-Framework Quick-Win (Argumentationspyramide)
  4. T+5d   Klienten-Story · 400.000+ haben das gemacht
  5. T+7d   Klasse 0001 · Scarcity-Update
  6. T+10d  Was du verlierst, wenn nichts passiert
  7. T+14d  Live mit Wlad · 90 Sek Video
  8. T+18d  Sprint ODER Plus-Plus · die ehrliche Entscheidungshilfe
  9. T+23d  Last Call · Charter-Plätze
 10. T+30d  Tür schließt sich · finale Erinnerung
"""

from typing import Callable
from email_templates import (
    BRAND, _base_wrapper, _logo_block, _section_label, _heading,
    _cta_button, _ps_block,
)


# ─── Shared CTA Builders ──────────────────────────────────

def _dual_cta(primary_text: str, primary_url: str, secondary_text: str, secondary_url: str) -> str:
    """Sprint (primary, lime) + Plus-Plus (secondary, outline) buttons side-by-side."""
    return f"""<tr><td align="center" style="padding:32px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding-right:8px;">
<a href="{primary_url}" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">{primary_text}</a>
</td>
<td style="padding-left:8px;">
<a href="{secondary_url}" style="display:inline-block;background:transparent;color:{BRAND['white']};border:1px solid {BRAND['border']};font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;text-decoration:none;">{secondary_text}</a>
</td>
</tr></table>
</td></tr>"""


def _scarcity_bar(seats_left: int = 18) -> str:
    return f"""<tr><td align="center" style="padding:0 0 16px 0;">
<div style="display:inline-block;background:rgba(200,255,0,0.05);border:1px solid rgba(200,255,0,0.15);padding:8px 16px;">
<span style="color:{BRAND['lime']};font-size:10px;letter-spacing:0.2em;font-weight:600;text-transform:uppercase;">▸ Klasse 0001 · noch {seats_left} von 30 frei</span>
</div>
</td></tr>"""


def _quote_block(text: str, author: str) -> str:
    return f"""<tr><td style="background:{BRAND['card']};border-left:3px solid {BRAND['lime']};padding:20px 24px;">
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:0;font-style:italic;">«{text}»</p>
<p style="font-size:12px;color:{BRAND['muted']};margin:12px 0 0 0;">— {author}</p>
</td></tr>"""


def _bullet_list(items: list[str]) -> str:
    rows = ""
    for item in items:
        rows += f"""<tr><td style="padding:6px 0;">
<span style="color:{BRAND['lime']};font-size:14px;font-weight:700;">▸</span>
<span style="font-size:14px;color:{BRAND['white']};padding-left:12px;line-height:1.6;">{item}</span>
</td></tr>"""
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{rows}</table>"""


# ─── Email 1 (T+1d): Was dein Score wirklich bedeutet ─────

def email_1_score_meaning(name: str, weakest_label: str, weakest_score: int) -> dict:
    content = f"""
<tr><td>{_section_label("Dein Score · Tag 1 nach Diagnose", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, dein <span style='color:{BRAND['lime']}'>{weakest_label}-Wert ist {weakest_score}%</span>.<br>Hier ist, was das wirklich heißt.")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Ein Score von {weakest_score}% in {weakest_label} bedeutet konkret eins: Du lässt jeden Tag Wirkung liegen, die du haben könntest.</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">Nicht weil du schlecht bist. Sondern weil dir das Werkzeug fehlt, das die Top 1 % der Führungskräfte schon haben.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Was du jetzt tun könntest")}
{_bullet_list([
    f"Mit dem 30-Tage-Sprint deinen {weakest_label}-Wert in 4 Wochen verdoppeln",
    "Die 11 Wlad-Frameworks anwenden, die exakt diese Lücke schließen",
    "WladBot fragen, der dich auf deine Situation antwortet — 24/7",
])}
</td></tr>
{_scarcity_bar()}
{_cta_button("Sprint sichern · 997 EUR →", "https://leadercheck.de/close")}
{_ps_block(f"Deine Diagnose verschwindet nicht. Aber ehrlich? In 6 Monaten wirst du sie vergessen haben. Außer du machst jetzt was draus.")}"""
    return {
        "subject": f"{name}: Dein {weakest_label}-Score ist {weakest_score}%. Hier ist, was das heißt.",
        "html": _base_wrapper(content, f"Tag 1 nach deiner Diagnose · der echte Befund."),
    }


# ─── Email 2 (T+3d): Wlad-Framework Quick-Win ─────────────

def email_2_quickwin(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Quick-Win · 1 Wlad-Framework", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, hier ist 1 Framework,<br><span style='color:{BRAND['lime']}'>das du heute noch nutzt.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 8px 0;letter-spacing:0.15em;text-transform:uppercase;">▸ Framework 01 · SEXIER</p>
<p style="font-size:17px;color:{BRAND['white']};line-height:1.5;margin:0 0 16px 0;font-weight:700;">Die Argumentations-Pyramide.</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:0;">Wenn du das nächste Mal jemanden überzeugen willst — Boss, Team, Kunde — bau dein Argument so auf:</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_bullet_list([
    "<strong style='color:#fff'>S</strong>tatement · Eine klare Aussage. Kein «vielleicht».",
    "<strong style='color:#fff'>E</strong>xplanation · Warum diese Aussage richtig ist.",
    "<strong style='color:#fff'>X</strong>ample · Ein konkretes Beispiel · keine Hypothese.",
    "<strong style='color:#fff'>I</strong>mplication · Was passiert, wenn man's umsetzt.",
    "<strong style='color:#fff'>E</strong>vidence · Zahlen, Studie oder Erfahrungswert.",
    "<strong style='color:#fff'>R</strong>ecap · Wiederhol die Aussage. Punkt.",
])}
</td></tr>
<tr><td style="background:rgba(200,255,0,0.04);border:1px solid rgba(200,255,0,0.15);border-radius:12px;padding:20px 24px;">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>Probier's heute aus.</strong> Im nächsten Meeting. Du wirst merken, wie viel klarer du wirkst.</p>
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:12px 0 0 0;">Das ist 1 von 11 Frameworks im Sprint. Die anderen 10 zeigen dir, wie du in jeder Führungs-Situation den richtigen Hebel findest.</p>
</td></tr>
{_scarcity_bar()}
{_cta_button("Alle 11 Frameworks · Sprint 997 EUR →", "https://leadercheck.de/close")}
{_ps_block("SEXIER ist nur die Einstiegs-Methode. Im Sprint kombinierst du sie mit den anderen 10 — und auf einmal funktioniert auch das schwierige Gespräch, vor dem du dich immer gedrückt hast.")}"""
    return {
        "subject": f"{name}, hier ist 1 Wlad-Framework · sofort nutzbar.",
        "html": _base_wrapper(content, "Die SEXIER-Pyramide — Wlads Argumentations-Methode."),
    }


# ─── Email 3 (T+5d): Klienten-Story / Social Proof ────────

def email_3_social_proof(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("400.000 Klienten · 1 Story", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, das war Maria<br><span style='color:{BRAND['lime']}'>vor 6 Monaten.</span>")}</td></tr>
{_quote_block(
    "Ich war im Boardroom die fachlich Beste. Aber wenn unser CFO redete, hörten alle ihm zu. Nach dem Sprint hat mein Team mich gefragt, ob ich Coaching genommen hätte. Habe ich nicht. Ich habe Wlad genommen.",
    "Maria K. · Head of Engineering · TecConsult AG"
)}
<tr><td style="padding:24px 0;">
{_section_label("Was Maria konkret gemacht hat")}
{_bullet_list([
    "Tag 1–7: SEXIER-Pyramide in jedem Meeting · «Hat sich nach Tag 3 schon natürlich angefühlt»",
    "Tag 8–14: Schulz von Thun Kommunikations-Quadrant im 1:1 mit Direct Reports",
    "Tag 15–21: WladBot als Sparring vor jedem CFO-Meeting · «In Wlads Stimme antwortet, krass»",
    "Tag 22–30: Harvard Verhandlungs-Methode in einer Budget-Verhandlung · +180k EUR durchgesetzt",
])}
</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:20px 24px;border-left:3px solid {BRAND['lime']};">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>3× SPIEGEL-Bestseller. 400.000+ Klienten. 14 Mio. Views.</strong> Wlad zeigt dir nicht, was funktionieren könnte — sondern was bei ihm und seinen Klienten funktioniert hat.</p>
</td></tr>
{_scarcity_bar()}
{_dual_cta(
    "Sprint sichern · 997 EUR",
    "https://leadercheck.de/close",
    "Plus-Plus · 4.797 EUR",
    "https://leadercheck.de/close",
)}
{_ps_block("Maria's Story ist 1 von Hunderten. Wenn du wissen willst, was dich konkret von ihrem Ergebnis trennt — der Sprint zeigt dir's Tag für Tag.")}"""
    return {
        "subject": f"{name}, das war Maria vor 6 Monaten.",
        "html": _base_wrapper(content, "1 Klientin · 1 Sprint · +180k EUR Budget durchgesetzt."),
    }


# ─── Email 4 (T+7d): Charter-Scarcity Update ──────────────

def email_4_scarcity(name: str, seats_left: int = 14) -> dict:
    content = f"""
<tr><td>{_section_label("Charter-Update · Woche 1", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"Klasse 0001<br><span style='color:{BRAND['lime']}'>noch {seats_left} von 30.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">{name}, in den letzten 7 Tagen sind {30-seats_left} Plätze in der Charter-Klasse 0001 weggegangen. Stand jetzt: <strong style='color:{BRAND['lime']}'>noch {seats_left} von 30 frei</strong>.</p>
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">Wenn 0001 voll ist, schließt sie. Die nächste Klasse (0002 · AI Agents Builder) öffnet frühestens Q3. Charter-Mitglieder bekommen dort Vorzugs-Zugang.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Was Charter-Status konkret bedeutet")}
{_bullet_list([
    "Lifetime-Zugang zum Klasse-0001-Peer-Kreis · 30 hand-picked Charter",
    "Vorzugs-Aufnahme in alle weiteren Klassen (0002, 0003, 0004)",
    "1:1-Onboarding mit Wlad persönlich",
    "Charter-Preis: 997 EUR · später regulär höher",
])}
</td></tr>
{_dual_cta(
    "Charter-Platz sichern · 997 EUR",
    "https://leadercheck.de/close",
    "Plus-Plus + Live mit Wlad",
    "https://leadercheck.de/close",
)}
{_ps_block("Charter ist eine einmalige Sache. Nach 0001 wirst du nie wieder Charter-Status haben können — egal wie viel du bezahlst.")}"""
    return {
        "subject": f"Noch {seats_left} Charter-Plätze. Dann ist Klasse 0001 zu.",
        "html": _base_wrapper(content, f"Charter 0001 · noch {seats_left} von 30 frei."),
    }


# ─── Email 5 (T+10d): Loss Aversion ───────────────────────

def email_5_loss(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Ehrliche Rechnung", "#EF4444")}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, was kostet es dich,<br><span style='color:{BRAND['lime']}'>nichts zu ändern?</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Du hast die Diagnose gemacht. Du kennst deinen Score. Du weißt, wo der Hebel sitzt.</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">Und in 30 Tagen? Wahrscheinlich gleiches Spiel. Gleiches Meeting. Gleicher Punkt, an dem du gerne souveräner gewesen wärst.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Was du in 30 Tagen verlierst, wenn du nichts machst")}
{_bullet_list([
    "1 verpasste Gehaltsverhandlung · Branchen-Median +12 % Differenz",
    "3–4 schwierige Gespräche, die anders gelaufen wären",
    "12+ Stunden Zeit, die KI dir hätte abnehmen können",
    "1 Mitarbeiter:in, die kündigt, weil das Feedback nie klar war",
    "Den Moment, in dem dein Boss dich mit jemand anderem vergleicht",
])}
</td></tr>
<tr><td style="background:rgba(200,255,0,0.04);border:1px solid rgba(200,255,0,0.15);border-radius:12px;padding:20px 24px;">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>997 EUR vs. das alles.</strong> Plus 14 Tage Geld-zurück. Das Risiko ist nicht der Sprint. Das Risiko ist, nicht zu starten.</p>
</td></tr>
{_scarcity_bar(seats_left=12)}
{_cta_button("Sprint starten · 997 EUR →", "https://leadercheck.de/close")}
{_ps_block("Niemand wird dir vorwerfen, dass du nicht den Sprint gemacht hast. Aber du selbst — in 12 Monaten — schon.")}"""
    return {
        "subject": f"{name}: Was kostet es dich, nichts zu tun?",
        "html": _base_wrapper(content, "Die ehrliche Rechnung · Was bleibt, wenn nichts passiert."),
    }


# ─── Email 6 (T+14d): Live mit Wlad ───────────────────────

def email_6_live_with_wlad(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Live mit Wlad · Plus-Plus", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, 90 Sekunden Wlad.<br><span style='color:{BRAND['lime']}'>Dann entscheidest du.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Im Sprint hast du WladBot 24/7. Aber im <strong style='color:{BRAND['lime']}'>Plus-Plus</strong> bekommst du Wlad <strong>selbst</strong> · monatlich · 90 Minuten · ungeschnitten · deine Fälle.</p>
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">12× im Jahr. Geschlossene Gruppe. Aufzeichnung + Notes nachgeliefert.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Was Plus-Plus zusätzlich liefert")}
{_bullet_list([
    "Alles aus dem Sprint (11 Frameworks, WladBot, Zertifikat)",
    "12× monatlich Live mit Wlad · 90 Min · ungeschnitten · deine Fälle",
    "Drill-Channel · Theorie sofort am echten Fall umsetzen",
    "Quartals-Review mit Strategie-Update",
    "Vorrang auf 1:1-Mentoring-Warteliste (sehr begrenzt)",
    "Klasse 0001 Peer-Kreis · Lifetime",
])}
</td></tr>
{_quote_block(
    "Den Sprint hatte ich nach 30 Tagen durch. Im Plus-Plus habe ich gemerkt, was wirklich passiert, wenn Wlad live auf deine Frage antwortet. Das ist 30 Min Vorbereitung wert.",
    "Andreas S. · CEO · Strategie-Beratung Hamburg"
)}
{_dual_cta(
    "Sprint · 997 EUR",
    "https://leadercheck.de/close",
    "Plus-Plus · 4.797 EUR",
    "https://leadercheck.de/close",
)}
{_ps_block("Plus-Plus ist nicht für jeden. Es ist für die, die mehr wollen als die Frameworks. Die mit Wlad selbst sprechen wollen. Wenn das nichts für dich ist — der Sprint reicht für 90 % der Leute.")}"""
    return {
        "subject": f"{name}, willst du Wlad live · oder reicht WladBot?",
        "html": _base_wrapper(content, "Sprint vs. Plus-Plus · die ehrliche Entscheidungshilfe."),
    }


# ─── Email 7 (T+18d): Entscheidungs-Hilfe ────────────────

def email_7_decision_help(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Sprint vs. Plus-Plus", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, in 60 Sekunden:<br><span style='color:{BRAND['lime']}'>Welcher Pfad für dich.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:20px 24px;border-left:3px solid {BRAND['lime']};">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 6px 0;letter-spacing:0.15em;text-transform:uppercase;">▸ Sprint · 997 EUR</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:0;font-weight:600;">Für dich, wenn:</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:4px 0 0 0;">Du selbst-organisiert bist. WladBot reicht dir als Sparring. Du willst die 11 Frameworks anwenden — auf deine eigene Zeit. 30 Tage Sprint + 12 Monate Plattform-Zugang ist genau dein Setup.</p>
</td></tr>
<tr><td style="padding:14px 0;"></td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:20px 24px;border-left:3px solid {BRAND['lime']};">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 6px 0;letter-spacing:0.15em;text-transform:uppercase;">▸ Plus-Plus · 4.797 EUR</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:0;font-weight:600;">Für dich, wenn:</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:4px 0 0 0;">Du Wlad live brauchst — nicht nur den Bot. Wenn du in einer Position bist, in der falsche Entscheidungen teuer sind (Senior-Leader, CXO, Geschäftsführer). 12× Live mit Wlad + Sprint + Klasse 0001 Lifetime.</p>
</td></tr>
<tr><td style="padding:24px 0;background:rgba(200,255,0,0.04);border-radius:12px;margin-top:20px;">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0 24px;text-align:center;"><strong>Tipp:</strong> Starte mit Sprint. Wenn du nach 14 Tagen merkst, dass du Wlad live brauchst, kannst du auf Plus-Plus upgraden — Differenz wird angerechnet.</p>
</td></tr>
{_dual_cta(
    "Sprint · 997 EUR",
    "https://leadercheck.de/close",
    "Plus-Plus · 4.797 EUR",
    "https://leadercheck.de/close",
)}
{_ps_block("Wer sich nicht entscheidet, hat schon entschieden. Im Zweifel: Sprint. Du kannst immer noch upgraden.")}"""
    return {
        "subject": f"{name}, Sprint oder Plus-Plus? In 60 Sek geklärt.",
        "html": _base_wrapper(content, "Welcher Pfad für dich · ehrliche Entscheidungs-Hilfe."),
    }


# ─── Email 8 (T+23d): Last Call ───────────────────────────

def email_8_last_call(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Last Call", "#EF4444")}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, Klasse 0001<br><span style='color:{BRAND['lime']}'>schließt diese Woche.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid #EF444430;">
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:0;font-weight:600;">In wenigen Tagen wird die Charter-Klasse 0001 geschlossen. Dann kein Charter-Preis mehr. Kein Lifetime-Peer-Kreis. Kein Vorzugs-Zugang zu 0002.</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:16px 0 0 0;">Du hast vor 23 Tagen die Diagnose gemacht. Du weißt, wo dein Hebel sitzt. Die Frage ist nicht mehr <em>ob</em> — sondern <em>jetzt</em> oder später-mit-mehr-Preis.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Was du verlierst, wenn 0001 schließt")}
{_bullet_list([
    "Charter-Preis 997 EUR · später regulärer Preis 1.497 EUR",
    "Lifetime-Zugang Peer-Kreis (geschlossen für Nicht-Charter)",
    "1:1-Onboarding mit Wlad persönlich",
    "Vorzugs-Aufnahme Klasse 0002 (AI Agents Builder, Q3)",
    "14 Tage Geld-zurück-Garantie",
])}
</td></tr>
{_scarcity_bar(seats_left=6)}
{_cta_button("Jetzt Charter-Platz sichern · 997 EUR →", "https://leadercheck.de/close")}
{_ps_block("Wenn du noch unsicher bist, was du jetzt brauchst — antworte einfach auf diese E-Mail. Ich (Wlads Team) sag dir ehrlich, ob's für dich passt oder noch nicht dran ist.")}"""
    return {
        "subject": f"⚠️ {name}: Klasse 0001 schließt diese Woche.",
        "html": _base_wrapper(content, "Last Call · Charter-Klasse 0001 schließt in wenigen Tagen."),
    }


# ─── Email 9 (T+30d): Tür schließt sich ───────────────────

def email_9_door_closes(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Letzte Erinnerung", "#EF4444")}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name},<br><span style='color:{BRAND['lime']}'>30 Tage sind um.</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Vor 30 Tagen hast du die Diagnose gemacht. Du wolltest wissen, wo du als Führungskraft stehst. Und du hast es erfahren.</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">Heute ist Tag 30. Was hat sich verändert?</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;font-weight:600;">Hand auf's Herz · wahrscheinlich nichts.</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Du hast 2 Möglichkeiten")}
{_bullet_list([
    "<strong style='color:#fff'>Möglichkeit 1:</strong> Du machst weiter wie bisher. In 6 Monaten bekommst du die nächste Diagnose-Reminder-Mail von uns und denkst «hätte ich damals mal …»",
    "<strong style='color:#fff'>Möglichkeit 2:</strong> Du startest den Sprint heute. In 30 Tagen schreibst du uns, dass es die beste Entscheidung war.",
])}
</td></tr>
<tr><td style="background:rgba(200,255,0,0.04);border:1px solid rgba(200,255,0,0.15);border-radius:12px;padding:20px 24px;">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>14 Tage Geld-zurück.</strong> Wenn der Sprint nichts für dich ist, bekommst du dein Geld zurück. Ohne Diskussion.</p>
</td></tr>
{_cta_button("Sprint starten · 997 EUR →", "https://leadercheck.de/close")}
{_ps_block("Das ist die letzte automatische Erinnerung von uns. Wenn du den Sprint heute nicht startest — schreib uns trotzdem, was bei dir gerade los ist. Manchmal ist Sprint nicht der richtige Moment. Wir sagen dir's ehrlich.")}"""
    return {
        "subject": f"{name}, das ist die letzte E-Mail.",
        "html": _base_wrapper(content, "Tag 30 · letzte automatische Erinnerung."),
    }


# ─── Email 10 (T+45d): Re-engagement after long silence ───

def email_10_reengagement(name: str) -> dict:
    content = f"""
<tr><td>{_section_label("Falls du noch da bist", BRAND['muted'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, eine letzte Frage:<br><span style='color:{BRAND['lime']}'>Was hat dich abgehalten?</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Du hast vor 45 Tagen die Diagnose gemacht und keine Entscheidung getroffen. Das ist OK. Aber wir möchten lernen.</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;">Was war's? Antworte einfach auf diese Mail mit:</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_bullet_list([
    "<strong style='color:#fff'>A</strong> · Preis war zu hoch",
    "<strong style='color:#fff'>B</strong> · Falscher Moment / zu viel los",
    "<strong style='color:#fff'>C</strong> · Inhalt hat nicht überzeugt",
    "<strong style='color:#fff'>D</strong> · Anderer Grund · (kurz beschreiben)",
])}
</td></tr>
<tr><td style="background:rgba(200,255,0,0.04);border:1px solid rgba(200,255,0,0.15);border-radius:12px;padding:20px 24px;">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>Du bekommst etwas zurück:</strong> Wer ehrlich antwortet, bekommt von uns einen <strong style='color:{BRAND['lime']}'>200 EUR Klasse-0001-Gutschein</strong> · gültig 14 Tage · für den Sprint oder Plus-Plus. Das ist kein Verkaufstrick · wir lernen mehr aus deinem «warum nicht» als aus 10 Käufen.</p>
</td></tr>
{_cta_button("Falls's doch der richtige Moment ist · Sprint 997 EUR →", "https://leadercheck.de/close")}
{_ps_block("Wlad liest die Antworten persönlich. Versprochen.")}"""
    return {
        "subject": f"{name}, was hat dich abgehalten? (200 EUR Gutschein drin)",
        "html": _base_wrapper(content, "Re-engagement · Ehrliches Feedback gegen Gutschein."),
    }


# ─── Sequence Definition ──────────────────────────────────

# Tuple: (day_offset, template_fn, requires_args)
# template_fn takes (name, **context) → dict {subject, html}

SEQUENCE: list[tuple[int, str, Callable]] = [
    (1,  "score_meaning",  email_1_score_meaning),
    (3,  "quickwin",       email_2_quickwin),
    (5,  "social_proof",   email_3_social_proof),
    (7,  "scarcity",       email_4_scarcity),
    (10, "loss",           email_5_loss),
    (14, "live_with_wlad", email_6_live_with_wlad),
    (18, "decision_help",  email_7_decision_help),
    (23, "last_call",      email_8_last_call),
    (30, "door_closes",    email_9_door_closes),
    (45, "reengagement",   email_10_reengagement),
]


def render_email(slug: str, ctx: dict) -> dict | None:
    """Render an email by slug using a context dict. Returns {subject, html} or None."""
    name = ctx.get("name", "Hey")
    weakest_label = ctx.get("weakest_label", "Rhetorik")
    weakest_score = ctx.get("weakest_score", 50)
    seats_left = ctx.get("seats_left", 18)

    fn_map = {
        "score_meaning":  lambda: email_1_score_meaning(name, weakest_label, weakest_score),
        "quickwin":       lambda: email_2_quickwin(name),
        "social_proof":   lambda: email_3_social_proof(name),
        "scarcity":       lambda: email_4_scarcity(name, seats_left=max(6, seats_left - 4)),
        "loss":           lambda: email_5_loss(name),
        "live_with_wlad": lambda: email_6_live_with_wlad(name),
        "decision_help":  lambda: email_7_decision_help(name),
        "last_call":      lambda: email_8_last_call(name),
        "door_closes":    lambda: email_9_door_closes(name),
        "reengagement":   lambda: email_10_reengagement(name),
    }
    fn = fn_map.get(slug)
    return fn() if fn else None

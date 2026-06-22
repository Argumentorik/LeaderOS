"""
Leader OS E-Mail Templates — Leader-OS Branding
Cool, persönlich, Defensive Backward Pressure

Structure: Shared helpers + 4 template functions
"""

BRAND = {
    "bg": "#0a0a0a",
    "card": "#141414",
    "lime": "#C8FF00",
    "white": "#ffffff",
    "gray": "#94A3B8",
    "muted": "#64748B",
    "border": "#1e1e1e",
}


# ─── Shared HTML Helpers ───────────────────────────────────

def _logo_block() -> str:
    return f"""<tr><td style="padding:0 0 32px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:{BRAND['lime']};border-radius:8px;padding:6px 12px;">
<span style="font-size:16px;font-weight:800;color:{BRAND['bg']};letter-spacing:0.05em;">W</span>
</td>
<td style="padding-left:12px;">
<span style="font-size:16px;font-weight:700;color:{BRAND['lime']};letter-spacing:0.03em;">LEADER/OS</span>
</td>
</tr></table>
</td></tr>"""


def _footer_block() -> str:
    return f"""<tr><td style="padding:40px 0 0 0;border-top:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};line-height:1.6;margin:0;">
Du erhältst diese E-Mail, weil du die Leader OS Leadership-Diagnose gestartet hast.<br>
<a href="https://leaderos.de" style="color:{BRAND['lime']};text-decoration:none;">leaderos.de</a> · 
<a href="https://leader-check.de" style="color:{BRAND['muted']};text-decoration:none;">Abmelden</a>
</p>
<p style="font-size:10px;color:#333;margin:12px 0 0 0;">© 2026 Leader OS. Alle Rechte vorbehalten.</p>
</td></tr>"""


def _section_label(text: str, color: str = None) -> str:
    c = color or BRAND['muted']
    return f'<p style="font-size:12px;color:{c};margin:0;letter-spacing:0.15em;text-transform:uppercase;">{text}</p>'


def _heading(text: str) -> str:
    return f'<h1 style="font-size:30px;font-weight:800;color:{BRAND["white"]};margin:0;line-height:1.2;">{text}</h1>'


def _card(content: str, border_color: str = None) -> str:
    bc = border_color or BRAND['border']
    return f'<div style="background:{BRAND["card"]};border-radius:12px;padding:24px;border:1px solid {bc};">{content}</div>'


def _cta_button(text: str, url: str) -> str:
    return f"""<tr><td align="center" style="padding:32px 0;">
<a href="{url}" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;">{text}</a>
</td></tr>"""


def _ps_block(text: str) -> str:
    return f"""<tr><td style="padding:0;">
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:0;">
<strong style="color:{BRAND['white']};">P.S.</strong> {text}
</p>
</td></tr>"""


def _numbered_step(num: str, title: str, subtitle: str) -> str:
    return f"""<tr><td style="padding:10px 0;border-bottom:1px solid {BRAND['border']};">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-weight:700;font-size:13px;">{num}</span>
</td>
<td style="padding-left:14px;">
<span style="font-size:14px;color:{BRAND['white']};font-weight:600;">{title}</span>
<span style="font-size:13px;color:{BRAND['gray']};">{subtitle}</span>
</td>
</tr></table>
</td></tr>"""


def _score_bar(label: str, score: int) -> str:
    pct = max(5, min(95, score))
    return f"""<tr><td style="padding:6px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="width:120px;font-size:12px;color:{BRAND['gray']};">{label}</td>
<td><div style="background:{BRAND['border']};border-radius:4px;height:6px;"><div style="background:{BRAND['lime']};border-radius:4px;height:6px;width:{pct}%;"></div></div></td>
<td style="width:40px;text-align:right;font-size:12px;font-weight:700;color:{BRAND['white']};">{score}%</td>
</tr></table>
</td></tr>"""


def _base_wrapper(content: str, preheader: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LEADER/OS</title>
<span style="display:none!important;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}</span>
</head>
<body style="margin:0;padding:0;background-color:{BRAND['bg']};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:{BRAND['white']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:{BRAND['bg']};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
{_logo_block()}
{content}
{_footer_block()}
</table>
</td></tr>
</table>
</body>
</html>"""


# ─── Template 1: Welcome ──────────────────────────────────

def _welcome_body(name: str, role: str) -> str:
    return f"""
<tr><td style="padding:0 0 28px 0;">
{_section_label("Willkommen")}
{_heading(f"Hey {name}.<br><span style='color:{BRAND['lime']}'>Mal sehen, was du draufhast.</span>")}
</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:28px 24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">Die meisten Führungskräfte glauben, sie wüssten, wo sie stehen. Dann machen sie die Leader OS Diagnose – und merken, dass sie in einer von sechs Rollen massiv unterschätzt werden.</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;font-weight:500;">Ob das bei dir auch so ist? Keine Ahnung. Aber in 10 Minuten weißt du es.</p>
</td></tr>
<tr><td style="padding:28px 0;">
{_section_label("Was dich erwartet")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{_numbered_step("01", "30 Szenario-Fragen", f" — zugeschnitten auf deine Rolle als {role}")}
{_numbered_step("02", "KI-Report", " — dein Profil über 6 Führungsrollen")}
{_numbered_step("03", "30-Tage-Plan", " — konkrete Schritte, kein Blabla")}
</table>
</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border-left:3px solid {BRAND['lime']};">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>Kleiner Hinweis:</strong> Du musst das hier nicht machen. Die meisten machen es nicht. Sie lesen lieber <em>über</em> Leadership, statt wirklich reinzuschauen. Wenn du anders tickst – dann starte jetzt.</p>
</td></tr>
{_cta_button("Diagnose starten →", "https://leader-check.de/diagnose")}"""


def welcome_email(name: str, role: str) -> dict:
    return {
        "subject": f"{name}, dein Leadership-Check wartet.",
        "html": _base_wrapper(_welcome_body(name, role), f"Hey {name} – mal sehen, was du draufhast."),
    }


# ─── Template 2: Report ───────────────────────────────────

def _report_scores(layers: dict) -> str:
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{_score_bar("KI-Kompetenz", layers.get('ai_literacy', 50))}
{_score_bar("Rhetorik", layers.get('rhetoric', 50))}
{_score_bar("Strategisches EQ", layers.get('strategic_eq', 50))}
</table>"""


def _report_roles(strongest: dict, weakest: dict) -> str:
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td width="48%" style="background:{BRAND['card']};border-radius:12px;padding:16px 20px;border-left:3px solid {BRAND['lime']};vertical-align:top;">
<p style="font-size:10px;color:{BRAND['lime']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.12em;">Stärkste Rolle</p>
<p style="font-size:15px;font-weight:700;color:{BRAND['white']};margin:0;">{strongest.get('label', '–')} ({strongest.get('score', 0)}%)</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:{BRAND['card']};border-radius:12px;padding:16px 20px;border-left:3px solid {BRAND['muted']};vertical-align:top;">
<p style="font-size:10px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.12em;">Wachstumsbereich</p>
<p style="font-size:15px;font-weight:700;color:{BRAND['white']};margin:0;">{weakest.get('label', '–')} ({weakest.get('score', 0)}%)</p>
</td>
</tr></table>"""


def report_email(name: str, report: dict) -> dict:
    narrative = report.get("narrative", {})
    total = report.get("avg_total", 50)
    layers = report.get("layer_scores", {})
    strongest = report.get("strongest_role", {})
    weakest = report.get("weakest_role", {})
    profile_title = narrative.get("profile_title", "Dein Leadership-Profil")
    score_color = BRAND["lime"] if total >= 50 else "#EF4444"

    content = f"""
<tr><td>{_section_label("Dein Report ist da", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, du bist<br><span style='color:{BRAND['lime']}'>{profile_title}</span>")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:0;">{narrative.get('executive_summary', 'Dein individuelles Führungsprofil wurde analysiert.')}</p>
</td></tr>
<tr><td style="padding:28px 0;text-align:center;">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.15em;">Gesamtscore</p>
<p style="font-size:56px;font-weight:800;color:{score_color};margin:0;line-height:1;">{total}%</p>
</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:20px 24px;border:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.12em;">3-Layer Score</p>
{_report_scores(layers)}
</td></tr>
<tr><td style="padding:20px 0;">{_report_roles(strongest, weakest)}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;"><strong>Ehrlich?</strong> Die meisten schauen sich ihren Report an, nicken – und machen weiter wie bisher. Der Score ändert sich nicht von alleine. Wenn du wirklich willst, dass sich was bewegt, dann starte den 30-Tage-Plan. Aber nur, wenn du es ernst meinst.</p>
</td></tr>
{_cta_button("30-Tage-Plan ansehen →", "https://leader-check.de/roadmap")}
{_ps_block(f'Du hast außerdem 50 kostenlose Credits für <a href="https://leaderos.de" style="color:{BRAND["lime"]};text-decoration:none;font-weight:600;">leaderos.de</a> freigeschaltet.')}"""

    return {
        "subject": f"{name}: {profile_title} — dein Leader OS Report",
        "html": _base_wrapper(content, f"Dein Score: {total}% — {profile_title}."),
    }


# ─── Template 3: Plan Reminder ────────────────────────────

WEEK_DATA = {
    1: {"title": "Woche 1 startet jetzt.", "focus": "Awareness & Foundation",
        "tasks": ["Baseline deiner 6 Führungsdimensionen checken", "KI-Tools identifizieren, die du bereits nutzt", "Kommunikationsmuster in 2 Gesprächen beobachten"]},
    2: {"title": "Woche 2. Jetzt wird's konkret.", "focus": "Skill Building",
        "tasks": ["KI-Entscheidungsframework in einer Entscheidung anwenden", "Argumentationsstruktur für ein Meeting vorbereiten", "SMART-Ziel für diesen Monat formulieren"]},
    3: {"title": "Woche 3. Theorie trifft Realität.", "focus": "Integration & Praxis",
        "tasks": ["KI + Rhetorik in einer Präsentation kombinieren", "Schwieriges Gespräch mit EQ-Framework führen", "Feedback von 2 Vertrauenspersonen einholen"]},
    4: {"title": "Letzte Woche. Strategic Dominance.", "focus": "Leadership-Signatur",
        "tasks": ["30-Tage-Review: Wo stehst du jetzt vs. Tag 1?", "Deine Leadership-Signatur in 2 Sätzen definieren", "90-Tage-Plan mit 3 konkreten Meilensteinen erstellen"]},
}

WEEK_MSGS = {
    1: "Diese Woche geht es darum, dein Fundament zu legen. Dein größter Hebel liegt im Bereich <strong style='color:{lime}'>{role}</strong>.",
    2: "Du hast letzte Woche dein Fundament gelegt. Diese Woche baust du die ersten Werkzeuge ein.",
    3: "Ab jetzt wird es spürbar. Dein Umfeld wird merken, dass sich etwas verändert hat.",
    4: "Du bist nicht mehr derselbe Leader wie vor 30 Tagen. Jetzt geht es darum, das zu verankern.",
}


def _task_list(tasks: list) -> str:
    rows = ""
    for i, task in enumerate(tasks):
        rows += f"""<tr><td style="padding:8px 0;border-bottom:1px solid {BRAND['border']};">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:6px;width:24px;height:24px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-size:11px;font-weight:700;">{i+1}</span>
</td>
<td style="padding-left:12px;font-size:13px;color:{BRAND['white']};">{task}</td>
</tr></table></td></tr>"""
    return rows


def plan_reminder_email(name: str, week: int, weakest_role: str) -> dict:
    w = WEEK_DATA.get(week, WEEK_DATA[1])
    msg = WEEK_MSGS.get(week, "").format(lime=BRAND['lime'], role=weakest_role)

    content = f"""
<tr><td>{_section_label(f"30-Tage-Plan · Woche {week}", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, {w['title']}")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.1em;">{w['focus']}</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:0;">{msg}</p>
</td></tr>
<tr><td style="padding:24px 0;">
{_section_label("Deine 3 Aufgaben")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
{_task_list(w['tasks'])}
</table>
</td></tr>
{_cta_button("Zum Fahrplan →", "https://leader-check.de/roadmap")}
{_ps_block("Du musst nicht perfekt sein. Du musst nur dranbleiben. Jeden Tag ein Schritt.")}"""

    return {
        "subject": f"Woche {week}: {w['title']} — Leader OS",
        "html": _base_wrapper(content, f"Woche {week} deines 30-Tage-Plans. 3 Aufgaben warten."),
    }


# ─── Template 4: Payment Confirmation ─────────────────────

def _payment_details(plan_name: str, amount: float, plan: str) -> str:
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 16px 0;border-bottom:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;">Paket</p>
<p style="font-size:18px;font-weight:700;color:{BRAND['white']};margin:0;">{plan_name}</p>
</td></tr>
<tr><td style="padding:16px 0 16px 0;border-bottom:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;">Betrag</p>
<p style="font-size:18px;font-weight:700;color:{BRAND['lime']};margin:0;">{amount:.2f} EUR</p>
</td></tr>
<tr><td style="padding:16px 0 0 0;">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;">Zugang</p>
<p style="font-size:14px;font-weight:600;color:{BRAND['white']};margin:0;">Sofort aktiv · 14 Tage kostenlos testen</p>
</td></tr>
</table>"""


def _payment_features(plan: str) -> str:
    items = [
        "Alle Kurse & KI-Agenten sind freigeschaltet",
        "Dein persönlicher 30-Tage-Plan startet heute",
        "WladBot kennt dein Profil und ist 24/7 für dich da",
    ]
    if plan == "leader_os_plus":
        items.append("12 Einzelcoachings werden separat per E-Mail terminiert")
        items.append("Dedizierter Coach meldet sich innerhalb von 48h")
    elif plan == "leader_os_enterprise":
        items.append("Onboarding-Workshop wird mit deinem Account Manager geplant")
    elif plan == "fasttrack":
        items.append("1:1 Calls werden separat per E-Mail terminiert")
    rows = "".join([f"""<tr><td style="padding:8px 0;">
<span style="color:{BRAND['lime']};font-size:14px;">✓</span>
<span style="font-size:14px;color:{BRAND['white']};padding-left:10px;">{item}</span>
</td></tr>""" for item in items])
    return rows


def payment_confirmation_email(name: str, plan: str, amount: float) -> dict:
    plan_name_map = {
        "leader_os": "Leadership OS — 1 Jahr Vollzugang",
        "leader_os_plus": "Leadership OS PLUS — inkl. 12 Coachings",
        "leader_os_enterprise": "Leadership OS ENTERPRISE — B2B-Lizenz",
        "fasttrack": "Fast Track – Leadership Accelerator",
        "standard": "Leadership OS — 1 Jahr Vollzugang",
        "starter": "Starter – Video Lessons",
    }
    plan_name = plan_name_map.get(plan, "Leadership OS — 1 Jahr Vollzugang")

    content = f"""
<tr><td>{_section_label("Zahlung bestätigt", BRAND['lime'])}</td></tr>
<tr><td style="padding:8px 0 24px 0;">{_heading(f"{name}, du bist drin.")}</td></tr>
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:28px 24px;border:1px solid {BRAND['lime']}30;">
{_payment_details(plan_name, amount, plan)}
</td></tr>
<tr><td style="padding:28px 0;">
{_section_label("Was jetzt passiert")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{_payment_features(plan)}
</table>
</td></tr>
{_cta_button("Jetzt loslegen →", "https://leader-check.de/roadmap")}
<tr><td>
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:0;"><strong style="color:{BRAND['white']};">Noch was:</strong> Du hast jetzt Zugang zum kompletten System. Aber das System funktioniert nur, wenn du es nutzt. Mach was draus.</p>
</td></tr>"""

    return {
        "subject": f"Zugang aktiviert: {plan_name} — Leader OS",
        "html": _base_wrapper(content, f"Du bist drin, {name}. Dein Zugang ist aktiv."),
    }

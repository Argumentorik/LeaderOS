"""
WLADHUB E-Mail Templates — Leader-OS Branding
Cool, persönlich, Defensive Backward Pressure
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


def _base_wrapper(content: str, preheader: str = "") -> str:
    """Wraps content in the base email layout."""
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WLADHUB</title>
<span style="display:none!important;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}</span>
</head>
<body style="margin:0;padding:0;background-color:{BRAND['bg']};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:{BRAND['white']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:{BRAND['bg']};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

<!-- Logo -->
<tr><td style="padding:0 0 32px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:{BRAND['lime']};border-radius:8px;padding:6px 12px;">
<span style="font-size:16px;font-weight:800;color:{BRAND['bg']};letter-spacing:0.05em;">W</span>
</td>
<td style="padding-left:12px;">
<span style="font-size:16px;font-weight:700;color:{BRAND['lime']};letter-spacing:0.03em;">WLADHUB</span>
</td>
</tr></table>
</td></tr>

{content}

<!-- Footer -->
<tr><td style="padding:40px 0 0 0;border-top:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};line-height:1.6;margin:0;">
Du erhältst diese E-Mail, weil du die WLADHUB Leadership-Diagnose gestartet hast.<br>
<a href="https://leader-os.de" style="color:{BRAND['lime']};text-decoration:none;">leader-os.de</a> · 
<a href="https://wladhub.com" style="color:{BRAND['muted']};text-decoration:none;">Abmelden</a>
</p>
<p style="font-size:10px;color:#333;margin:12px 0 0 0;">© 2026 WLADHUB. Alle Rechte vorbehalten.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def welcome_email(name: str, role: str) -> dict:
    """Welcome email after UserForm — Defensive Backward Pressure Style"""
    content = f"""
<!-- Hero -->
<tr><td style="padding:0 0 28px 0;">
<p style="font-size:13px;color:{BRAND['muted']};margin:0 0 8px 0;letter-spacing:0.15em;text-transform:uppercase;">Willkommen</p>
<h1 style="font-size:32px;font-weight:800;color:{BRAND['white']};margin:0 0 16px 0;line-height:1.15;">
Hey {name}.<br>
<span style="color:{BRAND['lime']};">Mal sehen, was du draufhast.</span>
</h1>
</td></tr>

<!-- Personal Message -->
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:28px 24px;border:1px solid {BRAND['border']};">
<p style="font-size:15px;color:{BRAND['gray']};line-height:1.7;margin:0;">
Die meisten Führungskräfte glauben, sie wüssten, wo sie stehen. Dann machen sie die WLADHUB Diagnose – und merken, dass sie in einer von sechs Rollen massiv unterschätzt werden.
</p>
<p style="font-size:15px;color:{BRAND['white']};line-height:1.7;margin:16px 0 0 0;font-weight:500;">
Ob das bei dir auch so ist? Keine Ahnung. Aber in 10 Minuten weißt du es.
</p>
</td></tr>

<!-- What happens -->
<tr><td style="padding:28px 0;">
<p style="font-size:12px;color:{BRAND['muted']};margin:0 0 16px 0;letter-spacing:0.12em;text-transform:uppercase;">Was dich erwartet</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:10px 0;border-bottom:1px solid {BRAND['border']};">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-weight:700;font-size:13px;">01</span>
</td>
<td style="padding-left:14px;">
<span style="font-size:14px;color:{BRAND['white']};font-weight:600;">30 Szenario-Fragen</span>
<span style="font-size:13px;color:{BRAND['gray']};"> — zugeschnitten auf deine Rolle als {role}</span>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid {BRAND['border']};">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-weight:700;font-size:13px;">02</span>
</td>
<td style="padding-left:14px;">
<span style="font-size:14px;color:{BRAND['white']};font-weight:600;">KI-Report</span>
<span style="font-size:13px;color:{BRAND['gray']};"> — dein Profil über 6 Führungsrollen</span>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:10px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-weight:700;font-size:13px;">03</span>
</td>
<td style="padding-left:14px;">
<span style="font-size:14px;color:{BRAND['white']};font-weight:600;">30-Tage-Plan</span>
<span style="font-size:13px;color:{BRAND['gray']};"> — konkrete Schritte, kein Blabla</span>
</td>
</tr></table>
</td></tr>
</table>
</td></tr>

<!-- Backward Pressure -->
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border-left:3px solid {BRAND['lime']};">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;">
<strong>Kleiner Hinweis:</strong> Du musst das hier nicht machen. Die meisten machen es nicht. Sie lesen lieber <em>über</em> Leadership, statt wirklich reinzuschauen. Wenn du anders tickst – dann starte jetzt.
</p>
</td></tr>

<!-- CTA -->
<tr><td align="center" style="padding:32px 0;">
<a href="https://wladhub.com/diagnose" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;">
Diagnose starten →
</a>
<p style="font-size:12px;color:{BRAND['muted']};margin:12px 0 0 0;">10 Minuten · Kostenlos · Sofortiger Report</p>
</td></tr>
"""
    return {
        "subject": f"{name}, dein Leadership-Check wartet.",
        "html": _base_wrapper(content, f"Hey {name} – mal sehen, was du draufhast. 10 Min Diagnose."),
    }


def report_email(name: str, report: dict) -> dict:
    """Report email after quiz completion — with scores and narrative"""
    narrative = report.get("narrative", {})
    total = report.get("avg_total", 50)
    layers = report.get("layer_scores", {})
    strongest = report.get("strongest_role", {})
    weakest = report.get("weakest_role", {})
    profile_title = narrative.get("profile_title", "Dein Leadership-Profil")

    score_color = BRAND["lime"] if total >= 50 else "#EF4444"

    def _score_bar(label: str, score: int) -> str:
        pct = max(5, min(95, score))
        return f"""<tr><td style="padding:6px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="width:120px;font-size:12px;color:{BRAND['gray']};">{label}</td>
<td><div style="background:{BRAND['border']};border-radius:4px;height:6px;"><div style="background:{BRAND['lime']};border-radius:4px;height:6px;width:{pct}%;"></div></div></td>
<td style="width:40px;text-align:right;font-size:12px;font-weight:700;color:{BRAND['white']};">{score}%</td>
</tr></table>
</td></tr>"""

    content = f"""
<!-- Profile Title -->
<tr><td style="padding:0 0 8px 0;">
<p style="font-size:12px;color:{BRAND['lime']};margin:0;letter-spacing:0.15em;text-transform:uppercase;">Dein Report ist da</p>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
<h1 style="font-size:30px;font-weight:800;color:{BRAND['white']};margin:0;line-height:1.2;">
{name}, du bist<br>
<span style="color:{BRAND['lime']};">{profile_title}</span>
</h1>
</td></tr>

<!-- Executive Summary -->
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};margin-bottom:20px;">
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:0;">
{narrative.get('executive_summary', 'Dein individuelles Führungsprofil wurde analysiert.')}
</p>
</td></tr>

<!-- Total Score -->
<tr><td style="padding:28px 0;text-align:center;">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.15em;">Gesamtscore</p>
<p style="font-size:56px;font-weight:800;color:{score_color};margin:0;line-height:1;">{total}%</p>
</td></tr>

<!-- Layer Scores -->
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:20px 24px;border:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.12em;">3-Layer Score</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{_score_bar("KI-Kompetenz", layers.get('ai_literacy', 50))}
{_score_bar("Rhetorik", layers.get('rhetoric', 50))}
{_score_bar("Strategisches EQ", layers.get('strategic_eq', 50))}
</table>
</td></tr>

<!-- Strongest & Weakest -->
<tr><td style="padding:20px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td width="48%" style="background:{BRAND['card']};border-radius:12px;padding:16px 20px;border-left:3px solid {BRAND['lime']};vertical-align:top;">
<p style="font-size:10px;color:{BRAND['lime']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.12em;">Stärkste Rolle</p>
<p style="font-size:15px;font-weight:700;color:{BRAND['white']};margin:0;">{strongest.get('label', '–')} ({strongest.get('score', 0)}%)</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:{BRAND['card']};border-radius:12px;padding:16px 20px;border-left:3px solid {BRAND['muted']};vertical-align:top;">
<p style="font-size:10px;color:{BRAND['muted']};margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.12em;">Wachstumsbereich</p>
<p style="font-size:15px;font-weight:700;color:{BRAND['white']};margin:0;">{weakest.get('label', '–')} ({weakest.get('score', 0)}%)</p>
</td>
</tr></table>
</td></tr>

<!-- Backward Pressure -->
<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:14px;color:{BRAND['white']};line-height:1.7;margin:0;">
<strong>Ehrlich?</strong> Die meisten schauen sich ihren Report an, nicken – und machen weiter wie bisher. Der Score ändert sich nicht von alleine. Wenn du wirklich willst, dass sich was bewegt, dann starte den 30-Tage-Plan. Aber nur, wenn du es ernst meinst.
</p>
</td></tr>

<!-- CTA -->
<tr><td align="center" style="padding:32px 0;">
<a href="https://wladhub.com/roadmap" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;">
30-Tage-Plan ansehen →
</a>
<p style="font-size:12px;color:{BRAND['muted']};margin:12px 0 0 0;">6 KI-Agenten · Personalisiert · Kostenlos</p>
</td></tr>

<!-- PS -->
<tr><td style="padding:0 0 0 0;">
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:0;">
<strong style="color:{BRAND['white']};">P.S.</strong> Du hast außerdem 50 kostenlose Credits für <a href="https://leader-os.de" style="color:{BRAND['lime']};text-decoration:none;font-weight:600;">leader-os.de</a> freigeschaltet – das KI-Leadership-System, das speziell für Führungskräfte gebaut wurde.
</p>
</td></tr>
"""
    return {
        "subject": f"{name}: {profile_title} — dein WLADHUB Report",
        "html": _base_wrapper(content, f"Dein Score: {total}% — {profile_title}. Sieh dir jetzt deinen Report an."),
    }


def plan_reminder_email(name: str, week: int, weakest_role: str) -> dict:
    """30-Day Plan follow-up email — week 1-4"""
    week_data = {
        1: {
            "title": "Woche 1 startet jetzt.",
            "focus": "Awareness & Foundation",
            "msg": f"Diese Woche geht es darum, dein Fundament zu legen. Dein größter Hebel liegt im Bereich <strong style='color:{BRAND['lime']}'>{weakest_role}</strong>. Nicht weil du schlecht bist – sondern weil dort das meiste Wachstum steckt.",
            "tasks": ["Baseline deiner 6 Führungsdimensionen checken", "KI-Tools identifizieren, die du bereits nutzt", "Kommunikationsmuster in 2 Gesprächen beobachten"],
        },
        2: {
            "title": "Woche 2. Jetzt wird's konkret.",
            "focus": "Skill Building",
            "msg": "Du hast letzte Woche dein Fundament gelegt. Diese Woche baust du die ersten Werkzeuge ein. Nicht theoretisch – sondern in echten Situationen. Das ist der Unterschied zwischen Wissen und Können.",
            "tasks": ["KI-Entscheidungsframework in einer Entscheidung anwenden", "Argumentationsstruktur für ein Meeting vorbereiten", "SMART-Ziel für diesen Monat formulieren"],
        },
        3: {
            "title": "Woche 3. Theorie trifft Realität.",
            "focus": "Integration & Praxis",
            "msg": "Ab jetzt wird es spürbar. Dein Umfeld wird merken, dass sich etwas verändert hat. Die Frage ist nicht ob – sondern wie schnell du dranbleibst.",
            "tasks": ["KI + Rhetorik in einer Präsentation kombinieren", "Schwieriges Gespräch mit EQ-Framework führen", "Feedback von 2 Vertrauenspersonen einholen"],
        },
        4: {
            "title": "Letzte Woche. Strategic Dominance.",
            "focus": "Leadership-Signatur",
            "msg": "Du bist nicht mehr derselbe Leader wie vor 30 Tagen. Jetzt geht es darum, das zu verankern. Definiere deine Leadership-Signatur – das, wofür du stehst.",
            "tasks": ["30-Tage-Review: Wo stehst du jetzt vs. Tag 1?", "Deine Leadership-Signatur in 2 Sätzen definieren", "90-Tage-Plan mit 3 konkreten Meilensteinen erstellen"],
        },
    }

    w = week_data.get(week, week_data[1])
    tasks_html = "".join([
        f"""<tr><td style="padding:8px 0;border-bottom:1px solid {BRAND['border']};">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="background:rgba(200,255,0,0.08);border-radius:6px;width:24px;height:24px;text-align:center;vertical-align:middle;">
<span style="color:{BRAND['lime']};font-size:11px;font-weight:700;">{i+1}</span>
</td>
<td style="padding-left:12px;font-size:13px;color:{BRAND['white']};">{task}</td>
</tr></table></td></tr>""" for i, task in enumerate(w["tasks"])
    ])

    content = f"""
<tr><td style="padding:0 0 8px 0;">
<p style="font-size:12px;color:{BRAND['lime']};margin:0;letter-spacing:0.15em;text-transform:uppercase;">30-Tage-Plan · Woche {week}</p>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
<h1 style="font-size:28px;font-weight:800;color:{BRAND['white']};margin:0;line-height:1.2;">
{name}, {w['title']}
</h1>
</td></tr>

<tr><td style="background:{BRAND['card']};border-radius:12px;padding:24px;border:1px solid {BRAND['border']};">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.1em;">{w['focus']}</p>
<p style="font-size:14px;color:{BRAND['gray']};line-height:1.7;margin:0;">{w['msg']}</p>
</td></tr>

<tr><td style="padding:24px 0;">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.12em;">Deine 3 Aufgaben</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{tasks_html}
</table>
</td></tr>

<tr><td align="center" style="padding:20px 0 32px 0;">
<a href="https://wladhub.com/roadmap" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">
Zum Fahrplan →
</a>
</td></tr>

<tr><td style="padding:0;">
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:0;">
<strong style="color:{BRAND['white']};">P.S.</strong> Du musst nicht perfekt sein. Du musst nur dranbleiben. Jeden Tag ein Schritt. Das reicht.
</p>
</td></tr>
"""
    return {
        "subject": f"Woche {week}: {w['title']} — WLADHUB",
        "html": _base_wrapper(content, f"Woche {week} deines 30-Tage-Plans startet. 3 Aufgaben warten auf dich."),
    }


def payment_confirmation_email(name: str, plan: str, amount: float) -> dict:
    """Payment confirmation with license key vibe"""
    plan_name = "Fast Track – Leadership Accelerator" if plan == "fasttrack" else "Standard – Leadership System"

    content = f"""
<tr><td style="padding:0 0 8px 0;">
<p style="font-size:12px;color:{BRAND['lime']};margin:0;letter-spacing:0.15em;text-transform:uppercase;">Zahlung bestätigt</p>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
<h1 style="font-size:30px;font-weight:800;color:{BRAND['white']};margin:0;line-height:1.2;">
{name}, du bist drin.
</h1>
</td></tr>

<tr><td style="background:{BRAND['card']};border-radius:12px;padding:28px 24px;border:1px solid {BRAND['lime']}30;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
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
</table>
</td></tr>

<!-- What's next -->
<tr><td style="padding:28px 0;">
<p style="font-size:11px;color:{BRAND['muted']};margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.12em;">Was jetzt passiert</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:8px 0;">
<span style="color:{BRAND['lime']};font-size:14px;">✓</span>
<span style="font-size:14px;color:{BRAND['white']};padding-left:10px;">Alle Kurse & KI-Agenten sind freigeschaltet</span>
</td></tr>
<tr><td style="padding:8px 0;">
<span style="color:{BRAND['lime']};font-size:14px;">✓</span>
<span style="font-size:14px;color:{BRAND['white']};padding-left:10px;">Dein persönlicher 30-Tage-Plan startet heute</span>
</td></tr>
<tr><td style="padding:8px 0;">
<span style="color:{BRAND['lime']};font-size:14px;">✓</span>
<span style="font-size:14px;color:{BRAND['white']};padding-left:10px;">WladBot kennt dein Profil und ist 24/7 für dich da</span>
</td></tr>
{"<tr><td style='padding:8px 0;'><span style='color:" + BRAND['lime'] + ";font-size:14px;'>✓</span><span style='font-size:14px;color:" + BRAND['white'] + ";padding-left:10px;'>1:1 Calls werden separat per E-Mail terminiert</span></td></tr>" if plan == "fasttrack" else ""}
</table>
</td></tr>

<tr><td align="center" style="padding:20px 0 32px 0;">
<a href="https://wladhub.com/roadmap" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['bg']};font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;">
Jetzt loslegen →
</a>
</td></tr>

<tr><td>
<p style="font-size:13px;color:{BRAND['gray']};line-height:1.7;margin:0;">
<strong style="color:{BRAND['white']};">Noch was:</strong> Du hast jetzt Zugang zum kompletten System. Aber das System funktioniert nur, wenn du es nutzt. Kein Tool der Welt ersetzt die Entscheidung, jeden Tag ein bisschen besser zu werden. Mach was draus.
</p>
</td></tr>
"""
    return {
        "subject": f"Zugang aktiviert: {plan_name} — WLADHUB",
        "html": _base_wrapper(content, f"Du bist drin, {name}. Dein {plan_name} Zugang ist aktiv."),
    }

"""
Leader OS — Episode Design System v2
======================================

Apple / Linear / Notion + Duolingo Vibe.
- 56-64px Hero Headlines (E-Mail-Client safe)
- Light/Dark Section Mix
- WLAD AI Avatar (Lime Circle)
- XP Badges (+50 XP)
- Streak Dots
- Leader Level Progress
- 1 CTA pro Mail · sharp lime button
- Wlad-Punch-Copy ("Mert. Kurze Frage.")
- Keine Em-Dashes. Mittelpunkte oder Punkte.
"""
from __future__ import annotations

BRAND = {
    "bg_dark": "#0a0a0a",
    "bg_light": "#fafafa",
    "card_dark": "#141414",
    "card_light": "#ffffff",
    "lime": "#C8FF00",
    "lime_soft": "#E8FF66",
    "white": "#ffffff",
    "ink": "#0a0a0a",
    "ink_soft": "#1a1a1a",
    "gray_dark": "#94A3B8",
    "gray_light": "#6b7280",
    "muted_dark": "#64748B",
    "muted_light": "#9ca3af",
    "border_dark": "#1e1e1e",
    "border_light": "#e5e7eb",
}

LOGO_URL = "https://leadercheck.de/leaderos-logo-dark.png"
LOGO_MARK_URL = "https://leadercheck.de/leaderos-mark.png"
WLADBOT_PIXEL_URL = "https://leadercheck.de/wladbot.png"
WLADBOT_3D_URL = "https://leadercheck.de/wladbot-3d.png"
LEADEROS_LOGIN = "https://leaderos.de/login"
LEADERCHECK_HOME = "https://leadercheck.de"


# ─── 30-Day Plan Strip Data (used across all episodes) ────

THIRTY_DAY_PLAN = [
    ("Woche 1", "Klarheit",   "Den Lärm abstellen · den Hebel finden."),
    ("Woche 2", "Gespräche",  "Die Gespräche, vor denen du dich gedrückt hast."),
    ("Woche 3", "KI-Hebel",   "KI richtig führen · nicht nur fragen."),
    ("Woche 4", "Wirkung",    "Andere merken es, bevor du es sagst."),
]


# ─── NEW: 30-Day-Plan Strip (4 phase cards) ──────────────

def _seven_day_strip(active_day: int = 1) -> str:
    """30-Tage-Check als 4-Phasen-Strip. Name beibehalten für Backward-Compat.
    `active_day` 1-7 wird auf 4 Phasen gemappt (1-2 → Phase 1, 3-4 → 2, 5 → 3, 6-7 → 4).
    """
    phase_map = {1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4}
    active_phase = phase_map.get(active_day, 1)
    cards = ""
    for i, (week, focus, label) in enumerate(THIRTY_DAY_PLAN):
        is_active = (i + 1) == active_phase
        border = BRAND["lime"] if is_active else "#222"
        focus_color = BRAND["lime"] if is_active else "#777"
        num_color = BRAND["lime"] if is_active else "#444"
        label_color = BRAND["white"] if is_active else "#999"
        num = f"0{i+1}"
        cards += f"""<td valign="top" width="25%" style="padding:0 6px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;border:1px solid {border};border-radius:12px;">
<tr><td style="padding:18px 16px 18px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top" style="font-size:10px;color:{focus_color};letter-spacing:0.18em;text-transform:uppercase;font-weight:800;">{week}</td>
<td valign="top" align="right" style="font-size:22px;font-weight:800;color:{num_color};line-height:1;letter-spacing:-0.02em;">{num}</td>
</tr></table>
<p style="font-size:11px;color:{focus_color};margin:16px 0 6px 0;letter-spacing:0.02em;font-weight:700;">{focus}</p>
<p style="font-size:12px;color:{label_color};line-height:1.4;margin:0;font-weight:500;min-height:34px;">{label}</p>
</td></tr></table>
</td>"""
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:48px 24px 56px 24px;border-top:1px solid {BRAND['border_dark']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 12px 18px 12px;">
<p style="font-size:12px;color:{BRAND['gray_dark']};margin:0;letter-spacing:0.02em;font-weight:500;">
<span style="color:{BRAND['lime']};font-size:16px;">↳</span> &nbsp; Dein 30-Tage-Check · 4 Phasen · 1 Routine
</p>
</td></tr>
<tr><td style="padding:0 12px 0 12px;">
<p style="font-size:22px;color:{BRAND['white']};margin:0 0 20px 0;font-weight:800;letter-spacing:-0.02em;line-height:1.15;">
30 Tage. <span style="color:{BRAND['lime']}">Vier Hebel.</span>
</p>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>{cards}</tr></table>
</td></tr>
</table>
</td></tr>"""


# ─── NEW: WLAD AI Bot Card (Right column, dark, with flow) ─

def _wladbot_card(headline: str, body: str, flow_steps: list[str] = None, cta_label: str = "→ Marias Routine in WLAD AI starten", cta_url: str = None) -> str:
    if cta_url is None:
        cta_url = LEADEROS_LOGIN
    flow_html = ""
    if flow_steps:
        cells = ""
        for i, step in enumerate(flow_steps):
            cells += f"""<td valign="middle" style="padding:0 4px;">
<div style="background:{BRAND['lime']};color:{BRAND['ink']};font-size:11px;font-weight:800;padding:10px 12px;border-radius:8px;text-align:center;line-height:1.25;letter-spacing:-0.01em;">{step}</div>
</td>"""
            if i < len(flow_steps) - 1:
                cells += f'<td valign="middle" style="padding:0 2px;color:{BRAND["lime"]};font-size:14px;font-weight:800;">→</td>'
        flow_html = f"""<tr><td style="padding:18px 0 22px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>{cells}</tr></table>
</td></tr>"""
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;border:1px solid {BRAND['border_dark']};border-radius:18px;">
<tr><td style="padding:24px 24px 24px 24px;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="top" style="width:80px;">
<img src="{WLADBOT_3D_URL}" alt="WLAD AI" width="64" style="display:block;border:0;outline:none;width:64px;height:auto;" />
</td>
<td valign="top" style="padding-left:6px;">
<p style="font-size:11px;color:{BRAND['lime']};margin:0 0 6px 0;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;">WLAD AI ist online</p>
<p style="font-size:18px;color:{BRAND['white']};margin:0;line-height:1.35;font-weight:700;letter-spacing:-0.01em;">{headline}</p>
</td></tr></table>
<p style="font-size:14px;color:{BRAND['gray_dark']};line-height:1.65;margin:18px 0 0 0;">{body}</p>
{flow_html}
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td>
<a href="{cta_url}" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['ink']};font-size:14px;font-weight:800;padding:14px 22px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em;">{cta_label}</a>
</td></tr></table>
<p style="font-size:11px;color:{BRAND['muted_dark']};margin:14px 0 0 0;"><a href="{LEADEROS_LOGIN}" style="color:{BRAND['lime']};text-decoration:underline;">leaderos.de</a> &nbsp;·&nbsp; gleiche E-Mail wie hier</p>
</td></tr></table>"""


# ─── NEW: Two-Column Hero (Headline + Portrait/Stats card) ─

def _two_col_hero(eyebrow_left: str, eyebrow_right: str, headline_html: str, quote: str, attribution: str,
                  portrait_url: str, stats: list[tuple[str, str]], episode_num: int) -> str:
    """Mock-style hero: left column copy + right column portrait with stats overlay."""
    stat_cells = ""
    for i, (val, lbl) in enumerate(stats):
        sep = '<td style="padding:0 8px;color:#333;">|</td>' if i > 0 else ''
        stat_cells += sep + f"""<td valign="top" align="center" style="padding:0 4px;">
<p style="font-size:22px;font-weight:800;color:{BRAND['white']};margin:0;line-height:1;letter-spacing:-0.02em;">{val}</p>
<p style="font-size:11px;color:{BRAND['gray_dark']};margin:6px 0 0 0;letter-spacing:0.02em;">{lbl}</p>
</td>"""
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:36px 32px 40px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 28px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="middle">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle" style="background:{BRAND['lime']};width:24px;height:24px;border-radius:6px;text-align:center;line-height:24px;font-weight:800;color:{BRAND['ink']};font-size:13px;">W</td>
<td valign="middle" style="padding-left:9px;color:{BRAND['white']};font-size:14px;font-weight:700;letter-spacing:-0.01em;">Leader OS</td>
</tr></table>
</td>
<td align="right" style="color:{BRAND['lime']};font-size:11px;letter-spacing:0.04em;font-weight:600;">{eyebrow_right}</td>
</tr></table>
</td></tr>
<tr><td style="padding:0 0 0 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top" width="52%" style="padding-right:18px;">
<h1 class="h1" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;line-height:1.06;letter-spacing:-0.025em;font-weight:800;color:{BRAND['white']};margin:0 0 22px 0;">{headline_html}</h1>
<p style="font-size:13px;color:{BRAND['gray_dark']};line-height:1.7;font-style:italic;margin:0 0 14px 0;">«{quote}»</p>
<p style="font-size:11px;color:{BRAND['muted_dark']};margin:0;letter-spacing:0.02em;">· {attribution}</p>
</td>
<td valign="top" width="48%">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;border:1px solid {BRAND['border_dark']};border-radius:18px;overflow:hidden;">
<tr><td style="padding:0;">
<img src="{portrait_url}" alt="Maria K." width="100%" style="display:block;border:0;outline:none;width:100%;height:auto;border-radius:18px 18px 0 0;" />
</td></tr>
<tr><td style="padding:16px 18px 18px 18px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>{stat_cells}</tr></table>
</td></tr>
</table>
</td>
</tr></table>
</td></tr>
</table>
</td></tr>"""


# ─── NEW: Maria Timeline (left column, vertical with icons) ─

def _maria_timeline(phases: list[tuple[str, str, str]]) -> str:
    """phases: list of (day_range, icon_glyph, description)"""
    rows = ""
    for i, (day_range, icon, desc) in enumerate(phases):
        is_last = (i == len(phases) - 1)
        connector = "" if is_last else f"""<tr><td style="width:40px;text-align:center;padding:4px 0;"><div style="width:1px;height:24px;background:{BRAND['border_dark']};margin:0 auto;"></div></td><td></td></tr>"""
        rows += f"""<tr>
<td valign="top" style="width:40px;text-align:center;padding-top:2px;">
<div style="width:34px;height:34px;border-radius:50%;border:1px solid {BRAND['lime']};line-height:32px;text-align:center;color:{BRAND['lime']};font-size:15px;">{icon}</div>
</td>
<td valign="top" style="padding:2px 0 6px 14px;">
<p style="font-size:13px;color:{BRAND['lime']};margin:0 0 4px 0;font-weight:700;letter-spacing:0.02em;">{day_range}</p>
<p style="font-size:13px;color:{BRAND['white']};line-height:1.55;margin:0;font-weight:500;">{desc}</p>
</td>
</tr>{connector}"""
    return f"""<table role="presentation" cellspacing="0" cellpadding="0" width="100%">{rows}</table>"""


# ─── NEW: "Was ist Leader OS" Two-Col Footer Block ────────

def _what_is_leaderos_block() -> str:
    bullets = [
        "Meetings vorbereiten.",
        "Schwierige Gespräche trainieren.",
        "Feedback üben.",
        "Verhandlungen simulieren.",
        "Mehr Wirkung erzielen.",
    ]
    bullet_rows = ""
    for b in bullets:
        bullet_rows += f"""<tr><td style="padding:6px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle" style="width:22px;">
<div style="width:18px;height:18px;border-radius:50%;background:{BRAND['lime']};text-align:center;line-height:18px;color:{BRAND['ink']};font-size:11px;font-weight:800;">✓</div>
</td>
<td valign="middle" style="padding-left:10px;font-size:13px;color:{BRAND['white']};font-weight:500;">{b}</td>
</tr></table>
</td></tr>"""
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:48px 32px 40px 32px;border-top:1px solid {BRAND['border_dark']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top" width="52%" style="padding-right:20px;">
<p style="font-size:11px;color:{BRAND['muted_dark']};letter-spacing:0.18em;text-transform:uppercase;font-weight:700;margin:0 0 14px 0;">Was ist Leader OS?</p>
<h2 class="h2" style="font-size:26px;line-height:1.15;letter-spacing:-0.02em;font-weight:800;color:{BRAND['white']};margin:0 0 14px 0;">Dein tägliches Sparring für <span style="color:{BRAND['lime']}">echte Führung</span>.</h2>
<p style="font-size:13px;color:{BRAND['gray_dark']};line-height:1.65;margin:0 0 20px 0;">Keine Theorie. Keine langen Kurse. Nur Situationen, die morgen auf dich warten.</p>
<table role="presentation" cellspacing="0" cellpadding="0">{bullet_rows}</table>
</td>
<td valign="top" width="48%">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;border:1px solid {BRAND['border_dark']};border-radius:16px;">
<tr><td style="padding:22px 22px 22px 22px;">
<p style="font-size:10px;color:{BRAND['gray_dark']};letter-spacing:0.18em;text-transform:uppercase;font-weight:700;margin:0 0 8px 0;">🎁 Dein Bonus ist aktiv</p>
<p style="font-size:22px;color:{BRAND['white']};font-weight:800;margin:0 0 4px 0;letter-spacing:-0.015em;line-height:1.2;"><span style="color:{BRAND['lime']}">50 kostenlose</span><br>Credits.</p>
<p style="font-size:13px;color:{BRAND['gray_dark']};margin:0 0 16px 0;line-height:1.5;">WLAD AI ist online. Jetzt starten.</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle">
<a href="{LEADEROS_LOGIN}" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['ink']};font-size:13px;font-weight:800;padding:11px 18px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em;">Jetzt starten →</a>
</td>
<td valign="middle" style="padding-left:14px;">
<img src="{WLADBOT_PIXEL_URL}" alt="WLAD AI" width="48" style="width:48px;height:auto;display:block;border:0;outline:none;" />
</td>
</tr></table>
</td></tr></table>
</td></tr></table>
</td></tr>"""


# ─── Atom: WLAD AI Avatar (lime circle with mark) ─────────

def _wladbot_avatar(size: int = 56) -> str:
    """Round lime avatar containing the LeaderOS mark · acts as 'WLAD AI pixel'."""
    return f"""<table role="presentation" cellspacing="0" cellpadding="0" style="display:inline-block;">
<tr><td style="background:{BRAND['lime']};width:{size}px;height:{size}px;border-radius:{size//2}px;text-align:center;vertical-align:middle;">
<img src="{LOGO_MARK_URL}" alt="WLAD AI" width="{int(size*0.55)}" height="{int(size*0.55)}" style="display:inline-block;border:0;outline:none;vertical-align:middle;" />
</td></tr></table>"""


# ─── Atom: XP Pill ────────────────────────────────────────

def _xp_pill(xp: int, label: str = "XP") -> str:
    return f"""<span style="display:inline-block;background:{BRAND['lime']};color:{BRAND['ink']};font-size:11px;font-weight:800;padding:5px 11px;border-radius:999px;letter-spacing:0.04em;line-height:1;">+{xp} {label}</span>"""


def _mission_pill(num: int) -> str:
    return f"""<span style="display:inline-block;background:transparent;border:1px solid {BRAND['lime']};color:{BRAND['lime']};font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;letter-spacing:0.18em;line-height:1;text-transform:uppercase;">Mission {num:02d}</span>"""


# ─── Atom: Streak Dots ────────────────────────────────────

def _streak_dots(active: int, total: int = 7, on_dark: bool = True) -> str:
    """Row of dots, lime = completed, muted = upcoming."""
    cells = ""
    inactive_bg = "#2a2a2a" if on_dark else "#e5e7eb"
    for i in range(total):
        bg = BRAND["lime"] if i < active else inactive_bg
        cells += f"""<td style="padding:0 4px;"><div style="width:10px;height:10px;border-radius:5px;background:{bg};"></div></td>"""
    return f"""<table role="presentation" cellspacing="0" cellpadding="0"><tr>{cells}</tr></table>"""


# ─── Atom: Leader Level Bar ───────────────────────────────

def _leader_level_bar(level: int, total: int = 7, on_dark: bool = True) -> str:
    """Compact progress bar with 'Leader Level · 1 / 7' label."""
    pct = max(6, int((level / total) * 100))
    fg = BRAND["white"] if on_dark else BRAND["ink"]
    muted = BRAND["muted_dark"] if on_dark else BRAND["muted_light"]
    track = "#1f1f1f" if on_dark else "#eef0f2"
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 8px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="font-size:10px;color:{muted};letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Leader Level</td>
<td align="right" style="font-size:11px;color:{fg};font-weight:700;letter-spacing:0.02em;">{level} / {total}</td>
</tr></table>
</td></tr>
<tr><td><div style="background:{track};border-radius:99px;height:6px;overflow:hidden;">
<div style="background:{BRAND['lime']};height:6px;width:{pct}%;border-radius:99px;"></div></div>
</td></tr></table>"""


# ─── Atom: Hero Headline ──────────────────────────────────

def _hero_headline(text: str, on_dark: bool = True) -> str:
    color = BRAND["white"] if on_dark else BRAND["ink"]
    return f"""<h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:48px;line-height:1.02;letter-spacing:-0.025em;font-weight:800;color:{color};margin:0;">{text}</h1>"""


def _eyebrow(text: str, on_dark: bool = True) -> str:
    color = BRAND["muted_dark"] if on_dark else BRAND["muted_light"]
    return f"""<p style="font-size:11px;color:{color};margin:0;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">{text}</p>"""


def _punch_opener(text: str, on_dark: bool = True) -> str:
    color = BRAND["gray_dark"] if on_dark else BRAND["gray_light"]
    return f"""<p style="font-size:15px;color:{color};margin:0;line-height:1.55;font-weight:500;">{text}</p>"""


# ─── Atom: Single CTA Button ──────────────────────────────

def _cta(label: str, url: str, hint: str = "") -> str:
    hint_html = ""
    if hint:
        hint_html = f"""<p style="font-size:11px;color:{BRAND['muted_dark']};margin:14px 0 0 0;letter-spacing:0.02em;">{hint}</p>"""
    return f"""<table role="presentation" cellspacing="0" cellpadding="0">
<tr><td>
<a href="{url}" style="display:inline-block;background:{BRAND['lime']};color:{BRAND['ink']};font-size:15px;font-weight:800;padding:18px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em;">{label}</a>
{hint_html}
</td></tr></table>"""


# ─── Atom: Mission Card (Light section) ───────────────────

def _mission_card(num: int, title: str, body: str, time_label: str = "1 min") -> str:
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{BRAND['card_light']};border-radius:16px;border:1px solid {BRAND['border_light']};">
<tr><td style="padding:28px 28px 24px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top">{_mission_pill(num)}</td>
<td valign="top" align="right" style="font-size:11px;color:{BRAND['gray_light']};letter-spacing:0.05em;font-weight:600;">⏱ {time_label}</td>
</tr></table>
<p style="font-size:22px;font-weight:800;color:{BRAND['ink']};margin:18px 0 10px 0;line-height:1.25;letter-spacing:-0.015em;">{title}</p>
<p style="font-size:15px;color:{BRAND['gray_light']};margin:0;line-height:1.65;">{body}</p>
</td></tr></table>"""


# ─── Atom: Story / Quote Block ────────────────────────────

def _story_quote(text: str, author: str, on_dark: bool = True) -> str:
    bg = BRAND["card_dark"] if on_dark else BRAND["card_light"]
    border = BRAND["border_dark"] if on_dark else BRAND["border_light"]
    body = BRAND["white"] if on_dark else BRAND["ink"]
    sub = BRAND["gray_dark"] if on_dark else BRAND["gray_light"]
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{bg};border-radius:16px;border:1px solid {border};">
<tr><td style="padding:32px 32px 28px 32px;">
<p style="font-size:13px;color:{BRAND['lime']};font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 18px 0;">↳ Field Note</p>
<p style="font-size:20px;color:{body};line-height:1.5;font-weight:600;margin:0;letter-spacing:-0.01em;">«{text}»</p>
<p style="font-size:13px;color:{sub};margin:18px 0 0 0;letter-spacing:0.02em;">{author}</p>
</td></tr></table>"""


# ─── Atom: Stat Row (3 cells) ─────────────────────────────

def _stat_row(stats: list[tuple[str, str]], on_dark: bool = True) -> str:
    sub = BRAND["gray_dark"] if on_dark else BRAND["gray_light"]
    cells = ""
    for value, label in stats:
        cells += f"""<td valign="top" style="padding:0 8px;">
<p style="font-size:32px;font-weight:800;color:{BRAND['lime']};margin:0;line-height:1;letter-spacing:-0.02em;">{value}</p>
<p style="font-size:12px;color:{sub};margin:8px 0 0 0;line-height:1.5;letter-spacing:0.02em;">{label}</p>
</td>"""
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>{cells}</tr></table>"""


# ─── Atom: Numbered Step Stack ────────────────────────────

def _step_stack(steps: list[tuple[str, str]], on_dark: bool = True) -> str:
    body = BRAND["white"] if on_dark else BRAND["ink"]
    sub = BRAND["gray_dark"] if on_dark else BRAND["gray_light"]
    rows = ""
    for i, (title, sub_text) in enumerate(steps, start=1):
        rows += f"""<tr><td style="padding:14px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="top" style="width:36px;">
<div style="width:28px;height:28px;border-radius:8px;background:{BRAND['lime']};color:{BRAND['ink']};text-align:center;line-height:28px;font-size:13px;font-weight:800;">{i}</div>
</td>
<td valign="top" style="padding-left:14px;">
<p style="font-size:16px;font-weight:700;color:{body};margin:0;line-height:1.45;letter-spacing:-0.01em;">{title}</p>
<p style="font-size:14px;color:{sub};margin:4px 0 0 0;line-height:1.55;">{sub_text}</p>
</td></tr></table>
</td></tr>"""
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{rows}</table>"""


# ─── Atom: Inline WLAD AI Says ────────────────────────────

def _wlad_says(text: str, on_dark: bool = True) -> str:
    fg = BRAND["white"] if on_dark else BRAND["ink"]
    sub = BRAND["gray_dark"] if on_dark else BRAND["gray_light"]
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td valign="top" style="width:64px;">{_wladbot_avatar(48)}</td>
<td valign="top" style="padding-left:14px;">
<p style="font-size:11px;color:{sub};margin:0 0 4px 0;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">WLAD AI sagt</p>
<p style="font-size:15px;color:{fg};margin:0;line-height:1.6;font-weight:500;">{text}</p>
</td></tr></table>"""


# ─── Atom: Section Divider (giant whitespace) ─────────────

def _air(px: int = 56) -> str:
    return f"""<tr><td style="height:{px}px;line-height:{px}px;font-size:0;">&nbsp;</td></tr>"""


# ─── Layout: Dark Hero Section ────────────────────────────

def _dark_hero(eyebrow: str, headline: str, opener: str, episode_num: int, total_episodes: int = 7) -> str:
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:64px 40px 56px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 32px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle"><img src="{LOGO_URL}" alt="Leader OS" height="22" style="height:22px;width:auto;display:block;border:0;outline:none;" /></td>
<td valign="middle" align="right">
<span style="display:inline-block;color:{BRAND['gray_dark']};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">EP {episode_num:02d} / {total_episodes:02d}</span>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:0 0 24px 0;">{_eyebrow(eyebrow, on_dark=True)}</td></tr>
<tr><td style="padding:0 0 24px 0;">{_hero_headline(headline, on_dark=True)}</td></tr>
<tr><td style="padding:0 0 32px 0;max-width:480px;">{_punch_opener(opener, on_dark=True)}</td></tr>
<tr><td style="padding:0 0 0 0;">{_leader_level_bar(episode_num, total_episodes, on_dark=True)}</td></tr>
</table>
</td></tr>"""


# ─── Layout: Light Mission Section ────────────────────────

def _light_section(content_rows: str) -> str:
    return f"""<tr><td style="background:{BRAND['bg_light']};padding:64px 40px 64px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{content_rows}
</table>
</td></tr>"""


# ─── Layout: Dark Story Section ───────────────────────────

def _dark_section(content_rows: str) -> str:
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:56px 40px 56px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{content_rows}
</table>
</td></tr>"""


# ─── Layout: CTA Section (Dark, Bold) ─────────────────────

def _cta_section(eyebrow: str, headline: str, cta_label: str, cta_url: str, hint: str = "", xp_reward: int = 50) -> str:
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:56px 40px 64px 40px;border-top:1px solid {BRAND['border_dark']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 18px 0;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td>{_eyebrow(eyebrow, on_dark=True)}</td>
<td align="right" style="padding-left:12px;">{_xp_pill(xp_reward)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:0 0 28px 0;">
<h2 style="font-size:28px;line-height:1.15;letter-spacing:-0.02em;font-weight:800;color:{BRAND['white']};margin:0;">{headline}</h2>
</td></tr>
<tr><td>{_cta(cta_label, cta_url, hint)}</td></tr>
</table>
</td></tr>"""


# ─── Layout: Footer ───────────────────────────────────────

def _footer(email_for_unsub: str = "") -> str:
    unsub_url = f"{LEADERCHECK_HOME}/api/email/unsubscribe?email={email_for_unsub or 'unknown'}"
    return f"""<tr><td style="background:{BRAND['bg_dark']};padding:32px 40px 48px 40px;border-top:1px solid {BRAND['border_dark']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 16px 0;">
<img src="{LOGO_MARK_URL}" alt="Leader OS" height="18" style="height:18px;width:auto;display:block;border:0;outline:none;" />
</td></tr>
<tr><td>
<p style="font-size:11px;color:{BRAND['muted_dark']};line-height:1.7;margin:0;">
Du erhältst diese Mail, weil du die Leader-Check Diagnose gemacht hast. 7 Episoden über 30 Tage · dein Leader-OS-Check.<br>
<a href="{LEADERCHECK_HOME}" style="color:{BRAND['lime']};text-decoration:none;">leadercheck.de</a> &nbsp;·&nbsp;
<a href="{LEADEROS_LOGIN}" style="color:{BRAND['lime']};text-decoration:none;">leaderos.de Login</a> &nbsp;·&nbsp;
<a href="mailto:wlad@leaderos.de" style="color:{BRAND['lime']};text-decoration:none;">Antworten an Wlad</a> &nbsp;·&nbsp;
<a href="{unsub_url}" style="color:{BRAND['muted_dark']};text-decoration:underline;">Pause</a>
</p>
<p style="font-size:10px;color:#444;margin:14px 0 0 0;">© 2026 Leader OS · Wlad Jachtchenko</p>
</td></tr>
</table>
</td></tr>"""


# ─── Layout: Full Wrapper ─────────────────────────────────

def _wrap(preheader: str, body_rows: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>Leader OS</title>
<style>
@media only screen and (max-width:600px) {{
  .h1 {{ font-size:36px !important; line-height:1.05 !important; }}
  .h2 {{ font-size:22px !important; }}
  .pad {{ padding-left:24px !important; padding-right:24px !important; }}
}}
</style>
</head>
<body style="margin:0;padding:0;background:{BRAND['bg_dark']};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<span style="display:none!important;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{BRAND['bg_dark']};">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:{BRAND['bg_dark']};">
{body_rows}
</table>
</td></tr></table>
</body></html>"""


# ════════════════════════════════════════════════════════════
#  THE 7 EPISODES
# ════════════════════════════════════════════════════════════

# ─── EP 01 · T+1d · Der erste Sieg ────────────────────────

def episode_01_first_win(name: str, weakest_label: str = "Rhetorik", email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 01 · Der erste Sieg",
        headline=f"{name}.<br>Kurze Frage.",
        opener="Du hast die Diagnose gemacht. Stark. Jetzt kommt der Teil, den 90 % überspringen: dein erster echter Sieg. Heute. In 3 Minuten. Kein Workshop. Keine Theorie.",
        episode_num=1,
    )

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Deine Mission", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 32px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.1;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">Die 1-Frage-Regel.</h2>
</td></tr>
<tr><td>
{_mission_card(
    num=1,
    title="Stell WLAD AI heute Abend genau eine Frage.",
    body=f"Geh auf leaderos.de · log dich ein · 50 Credits liegen schon da. Frag ihn: «Wo ist mein {weakest_label}-Hebel diese Woche am größten?» · Das ist alles. Eine Frage. Eine Antwort. Dein erster Sieg.",
    time_label="3 min",
)}
</td></tr>
<tr><td style="padding:32px 0 0 0;">
{_stat_row([
    ("50", "Credits aktiv"),
    ("2-3", "Credits pro Frage"),
    ("24/7", "WLAD AI online"),
], on_dark=False)}
</td></tr>
""")

    story = _dark_section(f"""
<tr><td style="padding:0 0 28px 0;">{_eyebrow("Warum das funktioniert")}</td></tr>
<tr><td>
{_wlad_says("«Die meisten warten auf den perfekten Moment. Wer in den ersten 24 Stunden seinen ersten Mini-Sieg holt, bleibt 4× länger dran. Klingt banal. Ist es nicht.»")}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 01 starten",
        headline="Login. Eine Frage. Erster Sieg.",
        cta_label="→ Mission starten",
        cta_url=LEADEROS_LOGIN,
        hint="leaderos.de · Login mit deiner Diagnose-E-Mail · +50 XP wenn du heute startest",
        xp_reward=50,
    )

    body = hero + light + story + cta + _seven_day_strip(active_day=1) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, dein erster Sieg. Heute. 3 Minuten.",
        "html": _wrap("Episode 01 · Mission 01 · Dein erster Sieg in 3 Minuten. +50 XP warten.", body),
    }


# ─── EP 02 · T+3d · Die Antwort, die jeder Chef hören will ─

def episode_02_boss_answer(name: str, email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 02 · Die Boss-Antwort",
        headline=f"{name}.<br>Die Antwort,<br>die jeder Chef<br>hören will.",
        opener="Es gibt einen Satz, mit dem du jedes schwierige Gespräch in 6 Sekunden aufräumst. Wlad nennt's S·E·X·I·E·R. Klingt komisch. Funktioniert brutal gut.",
        episode_num=2,
    )

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Framework 01 · S·E·X·I·E·R", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 32px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.1;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">6 Buchstaben.<br>1 klare Aussage.</h2>
</td></tr>
<tr><td>
{_step_stack([
    ("S · Statement", "Eine klare Aussage. Kein «vielleicht», kein «evtl.»"),
    ("E · Explanation", "Warum die Aussage stimmt. Ein Satz."),
    ("X · eXample", "Ein konkretes Beispiel. Keine Hypothese."),
    ("I · Implication", "Was passiert, wenn man es umsetzt."),
    ("E · Evidence", "Zahl, Studie oder Erfahrungswert. Punkt."),
    ("R · Recap", "Wiederhol die Aussage. Mikrofon fällt."),
], on_dark=False)}
</td></tr>
<tr><td style="padding:40px 0 0 0;">
{_mission_card(
    num=2,
    title="Wende S·E·X·I·E·R auf dein nächstes Argument an.",
    body="Du hast diese Woche garantiert ein Argument im Kopf, das du noch nicht ausgesprochen hast. Tipp es in WLAD AI ein · «Mach mir aus diesem Argument ein sauberes S·E·X·I·E·R.» Du bekommst's in 30 Sekunden aufgeräumt zurück.",
    time_label="4 min",
)}
</td></tr>
""")

    story = _dark_section(f"""
<tr><td>
{_wlad_says("«400.000+ Führungskräfte haben das gelernt. Die einen sagen 'kennt jeder'. Die anderen wenden's an. Rate, wer die Gehaltsverhandlung gewinnt.»")}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 02 · +50 XP",
        headline="Dein Argument. WLAD AI. 30 Sekunden.",
        cta_label="→ Mission starten",
        cta_url=LEADEROS_LOGIN,
        hint="Sag im Chat: «Wende S·E·X·I·E·R an auf folgendes Argument: …»",
        xp_reward=50,
    )

    body = hero + light + story + cta + _seven_day_strip(active_day=2) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, dieser Satz räumt jedes Meeting auf.",
        "html": _wrap("Episode 02 · S·E·X·I·E·R Framework · Mission 02 wartet. +50 XP.", body),
    }


# ─── EP 03 · T+6d · Warum Maria plötzlich jeder zuhörte ───
# NEW DESIGN · Following the Mock Screenshot (Maria portrait + Timeline + WLAD AI card + 7-Day Strip + What-is-LeaderOS)

def episode_03_maria(name: str, email: str = "") -> dict:
    maria_portrait = "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=800&q=80&auto=format&fit=crop"

    hero = _two_col_hero(
        eyebrow_left="Episode 03",
        eyebrow_right="Tag 5 · Eine Geschichte, die alles verändert",
        headline_html=f"Vor 30 Tagen<br>war Maria <span style='color:{BRAND['lime']}'>unsichtbar</span>.",
        quote=(
            "Sie war fachlich die Beste im Raum. Trotzdem hörten alle zu, sobald der CFO sprach. "
            "Sie wusste die Antworten. Aber niemand wartete auf ihre Meinung. "
            "Dann loggte sie sich bei Leader OS ein. 30 Tage. 50 Credits. Jeden Tag 10 Minuten Sparring mit WLAD AI. "
            "Am Tag 31 fragte ihr Team: «Hast du heimlich ein Executive Coaching gemacht?». "
            "Ihre Antwort: «Nein. Ich habe einfach jeden Tag mit Wlad trainiert.»"
        ),
        attribution="Maria K. · Head of Engineering · TecConsult AG",
        portrait_url=maria_portrait,
        stats=[("30", "Tage"), ("50", "Credits"), ("+180k €", "verhandelt")],
        episode_num=3,
    )

    # Two-column section: Maria-Timeline left, WLAD AI card right
    timeline_phases = [
        ("Woche 1",  "△",  "SEXIER vor jedem Meeting · «Ab Tag 3 fühlte es sich natürlich an»"),
        ("Woche 2",  "💬", "Schwierige Mitarbeiter-Gespräche vorher simuliert · keine Unsicherheit mehr"),
        ("Woche 3",  "≋",  "5 Min CFO-Sparring vor jedem Meeting · «Ich wusste, was ich sagen werde»"),
        ("Woche 4",  "♛",  "Budgetverhandlung nach Harvard-Methode · +180.000 € freigegeben"),
    ]

    middle = f"""<tr><td style="background:{BRAND['bg_dark']};padding:40px 32px 32px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top" width="52%" style="padding-right:18px;">
<p style="font-size:11px;color:{BRAND['muted_dark']};letter-spacing:0.18em;text-transform:uppercase;font-weight:700;margin:0 0 18px 0;">Was in diesen 30 Tagen passiert ist</p>
{_maria_timeline(timeline_phases)}
</td>
<td valign="top" width="48%">
{_wladbot_card(
    headline=f"WLAD AI ist online.<br>Deine <span style='color:{BRAND['lime']}'>50 Credits</span> warten.",
    body="Maria hat ihre 50 Credits genutzt. Deine warten bereits auf dich. Mit 2-3 Credits pro Session reichen sie für 15-25 echte Führungssituationen. Nicht zum Lernen. Zum Trainieren. Für Meetings, die morgen stattfinden.",
    flow_steps=["2-3 Credits", "1 Session", "Bessere Ergebnisse"],
    cta_label="→ Marias Routine starten",
    cta_url=LEADEROS_LOGIN,
)}
</td>
</tr></table>
</td></tr>"""

    seven_day = _seven_day_strip(active_day=3)
    what_is = _what_is_leaderos_block()

    # P.S. line · Hormozi-style
    ps_line = f"""<tr><td style="background:{BRAND['bg_dark']};padding:0 32px 32px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td valign="top" style="font-size:13px;color:{BRAND['gray_dark']};line-height:1.7;">
<strong style="color:{BRAND['white']};">P.S.</strong> &nbsp; Maria ist keine Ausnahme. Sie hat nichts Besonderes gemacht. Sie hat sich eingeloggt. Die Credits genutzt. Und jeden Tag ein bisschen trainiert. <strong style="color:{BRAND['white']};">Genau dort beginnt Veränderung.</strong>
</td>
<td align="right" valign="top" style="width:30px;color:{BRAND['lime']};font-size:18px;">♡</td>
</tr></table>
</td></tr>"""

    body = hero + middle + seven_day + what_is + ps_line + _footer(email)
    return {
        "subject": f"{name}, vor 30 Tagen war Maria unsichtbar.",
        "html": _wrap("Tag 5 · Eine Geschichte, die alles verändert. Marias 30 Tage. Dein 30-Tage-Check.", body),
    }


# ─── EP 04 · T+10d · Der schwierigste Satz im Meeting ─────

def episode_04_hardest_sentence(name: str, email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 04 · Der schwierigste Satz",
        headline=f"{name}.<br>Der schwierigste<br>Satz im Meeting.",
        opener="Es ist nicht «Nein». Es ist nicht «Ich weiß es nicht». Es ist der eine Satz, den 80 % aller Führungskräfte umgehen · weil er unbequem ist. Genau deshalb funktioniert er.",
        episode_num=4,
    )

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Der Satz", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 32px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.12;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">«Ich sehe das anders ·<br>und hier ist warum.»</h2>
</td></tr>
<tr><td style="padding:0 0 32px 0;">
<p style="font-size:16px;color:{BRAND['gray_light']};line-height:1.65;margin:0;">Nicht «mit Verlaub». Nicht «vielleicht». Klar. Begründet. Ohne Aggression. Wlad nennt es <strong style="color:{BRAND['ink']};">Defensive Backward Pressure</strong>: Du widersprichst · und ziehst gleichzeitig den Raum auf deine Seite.</p>
</td></tr>
<tr><td>
{_step_stack([
    ("01 · Anker setzen", "«Ich sehe das anders.» · 4 Wörter · alles still."),
    ("02 · Brücke bauen", "«Hier ist warum:» · jeder will jetzt deinen Grund."),
    ("03 · Beweis liefern", "Ein konkretes Beispiel oder eine Zahl. Mehr nicht."),
], on_dark=False)}
</td></tr>
<tr><td style="padding:40px 0 0 0;">
{_mission_card(
    num=4,
    title="Probiere den Satz in WLAD AI durch.",
    body="Sag: «Spiel mir ein schwieriges Meeting durch · ich übe Defensive Backward Pressure.» · Du bekommst 3 Übungs-Szenarien zurück. Wähl eines. Antworte. WLAD AI gibt Feedback.",
    time_label="6 min",
)}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 04 · +75 XP",
        headline="Üb den Satz. Bevor du ihn brauchst.",
        cta_label="→ Mission starten",
        cta_url=LEADEROS_LOGIN,
        hint="3 Übungs-Szenarien direkt im WLAD AI · keine Folien · nur Reps",
        xp_reward=75,
    )

    body = hero + light + cta + _seven_day_strip(active_day=4) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, der Satz, den keiner sagt.",
        "html": _wrap("Episode 04 · Defensive Backward Pressure · Mission 04. +75 XP.", body),
    }


# ─── EP 05 · T+15d · Der CFO-Test ─────────────────────────

def episode_05_cfo_test(name: str, email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 05 · Der CFO-Test",
        headline=f"{name}.<br>Bestehst du<br>den CFO-Test?",
        opener="Stell dir vor, dein CFO kommt unangekündigt zu dir und fragt: «In 3 Sätzen · warum sollten wir nächstes Jahr 10 % mehr in dein Team investieren?» · Hast du die Antwort? Heute?",
        episode_num=5,
    )

    dark = _dark_section(f"""
<tr><td style="padding:0 0 28px 0;">{_eyebrow("Die Wahrheit")}</td></tr>
<tr><td>
{_wlad_says("«Wenn du den CFO-Test heute nicht in 60 Sekunden bestehst, wirst du nächstes Jahr nicht das Budget bekommen. Punkt. Das ist nicht unfair. Das ist die Liga.»")}
</td></tr>
""")

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Die 3-Satz-Formel", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 32px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.12;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">Outcome.<br>Hebel.<br>Zahl.</h2>
</td></tr>
<tr><td>
{_step_stack([
    ("Satz 1 · Outcome", "Was bekommt das Unternehmen? Nicht was du tust. Was rauskommt."),
    ("Satz 2 · Hebel", "Welcher Hebel? Warum gerade dein Team? Nicht jemand anderes?"),
    ("Satz 3 · Zahl", "Eine konkrete Zahl. EUR, Prozent, Wochen. Ohne Zahl: kein Budget."),
], on_dark=False)}
</td></tr>
<tr><td style="padding:40px 0 0 0;">
{_mission_card(
    num=5,
    title="Lass WLAD AI deinen CFO-Pitch zerreißen.",
    body="Schreib deine 3 Sätze in WLAD AI. Sag: «Sei mein CFO. Sei skeptisch. Stell mir die 3 härtesten Rückfragen.» · Du übst gegen eine Wand · und stehst nächstes Mal wie ein Profi.",
    time_label="8 min",
)}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 05 · +100 XP",
        headline="Pitch in 3 Sätzen. Heute. Nicht morgen.",
        cta_label="→ Mission starten",
        cta_url=LEADEROS_LOGIN,
        hint="WLAD AI als CFO-Sparring · 2-3 Credits pro Runde",
        xp_reward=100,
    )

    body = hero + dark + light + cta + _seven_day_strip(active_day=5) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, bestehst du den CFO-Test?",
        "html": _wrap("Episode 05 · Der CFO-Test · 3 Sätze · Outcome · Hebel · Zahl. +100 XP.", body),
    }


# ─── EP 06 · T+21d · Die 3-Minuten-Routine ────────────────

def episode_06_three_min(name: str, email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 06 · Die Routine",
        headline=f"{name}.<br>Die 3-Minuten-<br>Routine.",
        opener="Du hast jetzt 5 Episoden hinter dir. Die meisten machen jetzt einen Fehler: sie hören auf. Was die Top-1 % machen: sie bauen daraus eine Mini-Routine. 3 Minuten. Jeden Morgen.",
        episode_num=6,
    )

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Wlads Morgen-Stack", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 32px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.1;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">3 Minuten.<br>Jeden Tag.<br>Vor dem Kalender.</h2>
</td></tr>
<tr><td>
{_step_stack([
    ("Min 1 · Scan", "Was ist heute das wichtigste Gespräch? Ein Satz an WLAD AI."),
    ("Min 2 · Prep", "WLAD AI spielt dir die schwierigste Rückfrage durch. Eine."),
    ("Min 3 · Anchor", "Du schreibst dir die eine Antwort auf. Handy zu. Tag start."),
], on_dark=False)}
</td></tr>
<tr><td style="padding:40px 0 32px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:24px 28px;background:#0a0a0a;border-radius:16px;">
<p style="font-size:11px;color:{BRAND['lime']};letter-spacing:0.18em;text-transform:uppercase;font-weight:700;margin:0 0 12px 0;">↳ Streak Mode</p>
<p style="font-size:16px;color:{BRAND['white']};font-weight:600;margin:0 0 16px 0;line-height:1.5;">7 Tage in Folge = Free Bonus: 25 extra Credits</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td>{_streak_dots(active=0, total=7, on_dark=True)}</td></tr></table>
</td></tr></table>
</td></tr>
<tr><td>
{_mission_card(
    num=6,
    title="Starte deinen Streak. Heute Morgen oder morgen früh.",
    body="Setze dir 3 Minuten in den Kalender · zwischen Kaffee und erstem Meeting. WLAD AI öffnen · ein Satz reicht. 7 Tage am Stück = du bekommst 25 Credits geschenkt.",
    time_label="3 min/Tag",
)}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 06 · +150 XP",
        headline="Tag 1 deines Streaks. Jetzt.",
        cta_label="→ Streak starten",
        cta_url=LEADEROS_LOGIN,
        hint="3 Min/Tag · 7 Tage = +25 Credits Bonus · WLAD AI ist online",
        xp_reward=150,
    )

    body = hero + light + cta + _seven_day_strip(active_day=6) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, 3 Minuten. Jeden Morgen. Reicht.",
        "html": _wrap("Episode 06 · Die 3-Minuten-Routine · 7-Tage-Streak · +25 Credits Bonus.", body),
    }


# ─── EP 07 · T+28d · Executive Mode ───────────────────────

def episode_07_executive_mode(name: str, email: str = "") -> dict:
    hero = _dark_hero(
        eyebrow="Episode 07 · Executive Mode",
        headline=f"{name}.<br>Letzte<br>Episode.<br>Executive Mode.",
        opener="6 Episoden hinter dir. Du hast die Frameworks. Du hast Marias Move. Du hast den CFO-Test. Du hast die 3-Min-Routine. Jetzt kommt die Frage: bleibst du Solo · oder gehst du in den Sprint?",
        episode_num=7,
    )

    light = _light_section(f"""
<tr><td style="padding:0 0 24px 0;">{_eyebrow("Was sich heute ändert", on_dark=False)}</td></tr>
<tr><td style="padding:0 0 40px 0;">
<h2 class="h2" style="font-size:34px;line-height:1.1;letter-spacing:-0.02em;font-weight:800;color:{BRAND['ink']};margin:0;">Solo bleiben.<br>Oder Sprint starten.</h2>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="background:{BRAND['card_light']};border:1px solid {BRAND['border_light']};border-radius:16px;padding:28px;">
<p style="font-size:11px;color:{BRAND['gray_light']};letter-spacing:0.16em;text-transform:uppercase;font-weight:700;margin:0 0 12px 0;">Option A · Solo</p>
<p style="font-size:22px;font-weight:800;color:{BRAND['ink']};margin:0 0 14px 0;line-height:1.25;letter-spacing:-0.015em;">Du machst weiter mit 50 Credits.</p>
<p style="font-size:14px;color:{BRAND['gray_light']};line-height:1.6;margin:0;">Reicht für 15-25 Sparring-Runden. Dann ist Schluss. Kein Sprint, keine Frameworks-Bibliothek, keine Klasse 0001.</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 0 32px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="background:#0a0a0a;border:1px solid {BRAND['lime']};border-radius:16px;padding:28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:0 0 12px 0;">{_xp_pill(500, "XP UNLOCK")}</td>
</tr></table>
<p style="font-size:22px;font-weight:800;color:{BRAND['white']};margin:0 0 14px 0;line-height:1.25;letter-spacing:-0.015em;">Sprint · 30 Tage · 11 Frameworks · WLAD AI unbegrenzt</p>
<p style="font-size:14px;color:{BRAND['gray_dark']};line-height:1.65;margin:0 0 20px 0;">Alles aus den 7 Episoden · plus 11 Wlad-Frameworks, unbegrenzter WLAD AI, Zertifikat, Klasse 0001 Peer-Kreis, 14 Tage Geld-zurück.</p>
<p style="font-size:13px;color:{BRAND['lime']};font-weight:700;margin:0;letter-spacing:0.02em;">997 EUR einmalig · oder 12 × 99 EUR</p>
</td></tr>
</table>
</td></tr>
<tr><td>
{_mission_card(
    num=7,
    title="Final Mission · Entscheide bewusst.",
    body="Klick rüber zur Sprint-Seite. Lies dir Klasse 0001 in Ruhe durch. Wenn's nicht für dich ist · ehrlich · dann mach Solo weiter, alles gut. Wenn es passt · dann ist heute der Moment.",
    time_label="2 min",
)}
</td></tr>
""")

    dark = _dark_section(f"""
<tr><td>
{_wlad_says("«Ich verkauf dir nichts. Ich zeig dir, was Klasse 0001 macht. Wenn du nicht in der Liga bist, in der dieser Sprint Sinn macht · sag's mir direkt. Ich schreib dir zurück.»")}
</td></tr>
""")

    cta = _cta_section(
        eyebrow="Mission 07 · Executive Unlock",
        headline="Sprint ansehen. 2 Minuten reichen.",
        cta_label="→ Executive Mode entsperren",
        cta_url=f"{LEADERCHECK_HOME}/close",
        hint="Klasse 0001 · 14 Tage Geld-zurück · Antwort vom Team in 24h",
        xp_reward=500,
    )

    body = hero + light + dark + cta + _seven_day_strip(active_day=7) + _what_is_leaderos_block() + _footer(email)
    return {
        "subject": f"{name}, letzte Episode. Solo oder Sprint?",
        "html": _wrap("Episode 07 · Executive Mode · Sprint vs. Solo · 500 XP Unlock.", body),
    }


# ════════════════════════════════════════════════════════════
#  QUIZ ABANDONMENT REMINDERS (additive · not part of the 7-drip)
# ════════════════════════════════════════════════════════════

def _quiz_reminder_body(name, resume_url, answered, total, headline, opener,
                        mission_line, cta_label, hint, email):
    top = f"""<tr><td style="background:{BRAND['bg_dark']};padding:64px 40px 40px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 30px 0;"><img src="{LOGO_URL}" alt="Leader OS" height="22" style="height:22px;width:auto;display:block;border:0;outline:none;" /></td></tr>
<tr><td style="padding:0 0 20px 0;">{_eyebrow("Deine Diagnose wartet")}</td></tr>
<tr><td style="padding:0 0 22px 0;">{_hero_headline(headline)}</td></tr>
<tr><td style="padding:0 0 32px 0;max-width:480px;">{_punch_opener(opener)}</td></tr>
<tr><td>{_stat_row([(f"{answered}/{total}", "Fragen beantwortet"), ("~3", "Min bis fertig"), ("0 €", "kostenlos")])}</td></tr>
</table></td></tr>"""
    cta = f"""<tr><td style="background:{BRAND['bg_dark']};padding:8px 40px 56px 40px;border-top:1px solid {BRAND['border_dark']};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:32px 0 22px 0;"><h2 style="font-size:26px;line-height:1.2;letter-spacing:-0.02em;font-weight:800;color:{BRAND['white']};margin:0;">{mission_line}</h2></td></tr>
<tr><td>{_cta(cta_label, resume_url, hint)}</td></tr>
</table></td></tr>"""
    return top + cta + _footer(email)


def episode_quiz_reminder_1(name: str, resume_url: str = "https://leadercheck.de/quiz",
                            answered: int = 0, total: int = 20, email: str = "") -> dict:
    body = _quiz_reminder_body(
        name, resume_url, answered, total,
        headline=f"{name}, du warst<br>fast durch.",
        opener=f"Du hast {answered} von {total} Fragen beantwortet · dann kam das Leben dazwischen. Kein Problem: dein Fortschritt ist gespeichert · du machst genau da weiter, wo du warst. In unter 3 Minuten hast du deinen persönlichen Leadership-Report.",
        mission_line="Mach deine Diagnose in 3 Minuten fertig.",
        cta_label="→ Diagnose fortsetzen",
        hint="Kostenlos · dein Fortschritt ist gespeichert · kein Neuanfang",
        email=email,
    )
    return {
        "subject": f"{name}, deine Leadership-Diagnose wartet ({answered}/{total})",
        "html": _wrap(f"Du warst bei Frage {answered} von {total}. Mach in 3 Minuten fertig · dein Fortschritt ist gespeichert.", body),
    }


def episode_quiz_reminder_2(name: str, resume_url: str = "https://leadercheck.de/quiz",
                            answered: int = 0, total: int = 20, email: str = "") -> dict:
    body = _quiz_reminder_body(
        name, resume_url, answered, total,
        headline=f"{name}, letzte<br>Erinnerung.",
        opener=f"Deine Diagnose steht seit gestern bei {answered} von {total}. Die meisten, die hier abbrechen, erfahren nie, wo ihr größter Führungs-Hebel liegt. Schade drum · die letzten Fragen dauern keine 3 Minuten · und danach liegt dein 7-Seiten-Report in deinem Postfach.",
        mission_line="Die letzten Fragen · dann ist dein Report da.",
        cta_label="→ Jetzt abschließen",
        hint="Kostenlos · danach bekommst du deinen 7-Seiten-Report als PDF",
        email=email,
    )
    return {
        "subject": f"{name}, letzte Erinnerung: deine Diagnose ({answered}/{total})",
        "html": _wrap(f"Letzte Erinnerung · deine Leadership-Diagnose steht bei {answered}/{total}. 3 Minuten bis zum Report.", body),
    }


# ════════════════════════════════════════════════════════════
#  Episode Registry
# ════════════════════════════════════════════════════════════

EPISODES = {
    "ep01_first_win":        episode_01_first_win,
    "ep02_boss_answer":      episode_02_boss_answer,
    "ep03_maria":            episode_03_maria,
    "ep04_hardest_sentence": episode_04_hardest_sentence,
    "ep05_cfo_test":         episode_05_cfo_test,
    "ep06_three_min":        episode_06_three_min,
    "ep07_executive_mode":   episode_07_executive_mode,
    "quiz_reminder_1":       episode_quiz_reminder_1,
    "quiz_reminder_2":       episode_quiz_reminder_2,
}


def render_episode(slug: str, ctx: dict) -> dict | None:
    fn = EPISODES.get(slug)
    if not fn:
        return None
    name = ctx.get("name", "Hey")
    weakest = ctx.get("weakest_label", "Rhetorik")
    email = ctx.get("email", "")
    if slug == "ep01_first_win":
        return fn(name=name, weakest_label=weakest, email=email)
    if slug in ("quiz_reminder_1", "quiz_reminder_2"):
        return fn(
            name=name,
            resume_url=ctx.get("resume_url", "https://leadercheck.de/quiz"),
            answered=ctx.get("answered", ctx.get("current", 0)),
            total=ctx.get("total", 20),
            email=email,
        )
    return fn(name=name, email=email)

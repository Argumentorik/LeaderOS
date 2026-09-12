"""Personalisierte Reise: Onboarding (Rolle, Ziel) + Leader-Check bestimmen Fokus und die ersten 7 Tage.

Regel: Nirgends nennen, wie viele Fragen der Leader-Check hat.
"""
from datetime import datetime, timezone

FOCUS_META = {
    "boardroom_rhetorik": {"label": "Boardroom-Rhetorik", "short": "Rhetorik", "goal": "klar, knapp und überzeugend auftreten"},
    "strategisches_eq": {"label": "Strategisches EQ", "short": "EQ", "goal": "Menschen lesen, Konflikte souverän führen"},
    "ki_kompetenz": {"label": "KI-Kompetenz", "short": "KI", "goal": "KI als Sparringspartner für Entscheidungen nutzen"},
}

GOAL_TO_FOCUS = {
    "communication": "boardroom_rhetorik", "career": "boardroom_rhetorik",
    "conflicts": "strategisches_eq", "eq": "strategisches_eq", "delegation": "strategisches_eq",
    "strategy": "ki_kompetenz",
}

GOAL_LABEL = {
    "communication": "bessere Kommunikation", "conflicts": "Konflikte lösen", "delegation": "besser delegieren",
    "strategy": "strategischer denken", "career": "Karriere beschleunigen", "eq": "EQ entwickeln",
}

ROLE_META = {
    "team-lead": {"label": "Team Lead", "team": "3–10 Mitarbeitende", "hint": "Du führst nah dran am Alltag – deine Wirkung entsteht im Gespräch."},
    "manager": {"label": "Manager", "team": "10–30 Mitarbeitende", "hint": "Du führst über andere – Klarheit und Delegation sind dein Hebel."},
    "director": {"label": "Director / VP", "team": "mehrere Teams", "hint": "Du führst Führungskräfte – Botschaften müssen durch mehrere Ebenen tragen."},
    "c-level": {"label": "C-Level / Executive", "team": "die gesamte Organisation", "hint": "Jedes Wort von dir wird gelesen – Präzision vor Menge."},
    "aspiring": {"label": "angehende Führungskraft", "team": "noch kein eigenes Team", "hint": "Du baust jetzt die Gewohnheiten, die später deine Führung tragen."},
}

# 7 Tage je Fokus: {title, task, path, cta, minutes}
WEEK_PLANS = {
    "boardroom_rhetorik": [
        {"title": "Deine Baseline", "task": "Frag Wlad: „Wie wirke ich, wenn ich unter Druck spreche?“ und beschreibe eine echte Situation aus {team_ctx}.", "path": "/chat", "cta": "Mit Wlad sprechen", "minutes": 10},
        {"title": "Ein Satz, eine Botschaft", "task": "Formuliere die Kernbotschaft deines nächsten Meetings in einem Satz. Wlad schärft ihn mit dir.", "path": "/tools", "cta": "Werkzeug öffnen", "minutes": 10},
        {"title": "Die drei Säulen", "task": "Tag 3 der Challenge: Struktur, Klarheit, Wirkung – die Grundlage für jede Rede.", "path": "/challenge", "cta": "Challenge öffnen", "minutes": 10},
        {"title": "Vor der Kamera", "task": "Nimm deine Botschaft in 60 Sekunden auf. Wlad analysiert Füllwörter, Tempo und Wirkung.", "path": "/missions", "cta": "Video-Mission starten", "minutes": 10},
        {"title": "Gegenwind üben", "task": "In der Simulation antwortet dein Gegenüber unbequem. Bleib bei deiner Kernbotschaft.", "path": "/simulations", "cta": "Simulation starten", "minutes": 15},
        {"title": "Kurs: Rhetorik-Grundlagen", "task": "Folge 1 ist frei: Wlads Fundament für überzeugendes Sprechen.", "path": "/kurse", "cta": "Zum Kurs", "minutes": 12},
        {"title": "Wochen-Review", "task": "Erzähl Wlad, was sich in deinen Gesprächen verändert hat – er baut daraus deinen Plan für Woche 2.", "path": "/chat", "cta": "Review mit Wlad", "minutes": 10},
    ],
    "strategisches_eq": [
        {"title": "Deine Baseline", "task": "Frag Wlad: „Welches Gespräch schiebe ich gerade vor mir her – und warum?“ Beschreibe die Person aus {team_ctx}.", "path": "/chat", "cta": "Mit Wlad sprechen", "minutes": 10},
        {"title": "Perspektivwechsel", "task": "Lass Wlad die Sicht deines Gegenübers einnehmen. Was braucht diese Person wirklich von dir?", "path": "/chat", "cta": "Mit Wlad sprechen", "minutes": 10},
        {"title": "Stärken & Trigger", "task": "Tag 4 der Challenge: Was bringt dich aus der Ruhe – und was machst du dann?", "path": "/challenge", "cta": "Challenge öffnen", "minutes": 10},
        {"title": "Das schwierige Gespräch", "task": "Simuliere das Gespräch, das du aufschiebst. Ziel: ruhig bleiben, klar bleiben.", "path": "/simulations", "cta": "Simulation starten", "minutes": 15},
        {"title": "Feedback, das ankommt", "task": "Baue mit Wlad ein konkretes Feedback für ein Teammitglied – wertschätzend und deutlich.", "path": "/tools", "cta": "Werkzeug öffnen", "minutes": 10},
        {"title": "Kurs: Führung & EQ", "task": "Folge 1 ist frei: Wlads Grundlagen für emotionale Führung.", "path": "/kurse", "cta": "Zum Kurs", "minutes": 12},
        {"title": "Wochen-Review", "task": "Welches Gespräch hast du geführt? Wlad wertet mit dir aus und plant Woche 2.", "path": "/chat", "cta": "Review mit Wlad", "minutes": 10},
    ],
    "ki_kompetenz": [
        {"title": "Deine Baseline", "task": "Frag Wlad: „Welche Entscheidung steht bei {team_ctx} als Nächstes an?“ und lass dir drei Szenarien bauen.", "path": "/chat", "cta": "Mit Wlad sprechen", "minutes": 10},
        {"title": "KI richtig einordnen", "task": "Tag 2 der Challenge: Was KI für Führungskräfte kann – und was nicht.", "path": "/challenge", "cta": "Challenge öffnen", "minutes": 10},
        {"title": "Der Sparringspartner", "task": "Gib Wlad eine echte Entscheidung und lass ihn die stärksten Gegenargumente finden.", "path": "/chat", "cta": "Mit Wlad sprechen", "minutes": 10},
        {"title": "Vom Plan zur Aufgabe", "task": "Lass Wlad aus deinem Ziel einen Wochenplan mit klaren Aufgaben ableiten.", "path": "/tasks", "cta": "Aufgaben öffnen", "minutes": 10},
        {"title": "Entscheidung erklären", "task": "Nimm in 60 Sekunden auf, wie du eine Entscheidung deinem Team erklärst. Wlad prüft Klarheit und Struktur.", "path": "/missions", "cta": "Video-Mission starten", "minutes": 10},
        {"title": "Kurs: Grundlagen", "task": "Folge 1 ist frei: Wlads Denkwerkzeuge für bessere Entscheidungen.", "path": "/kurse", "cta": "Zum Kurs", "minutes": 12},
        {"title": "Wochen-Review", "task": "Welche Entscheidung hast du mit Wlad vorbereitet? Auswertung und Plan für Woche 2.", "path": "/chat", "cta": "Review mit Wlad", "minutes": 10},
    ],
}


def _scores(user: dict) -> dict:
    raw = user.get("wladhub_scores") or {}
    return {k: int(raw.get(k) or 0) for k in FOCUS_META if raw.get(k) is not None}


def pick_focus(user: dict) -> tuple[str, str, str]:
    """→ (focus_key, source, reason). Leader-Check schlägt Onboarding-Ziel schlägt Standard."""
    scores = {k: v for k, v in _scores(user).items() if v > 0}
    if scores:
        focus = min(scores, key=scores.get)
        label = FOCUS_META[focus]["label"]
        return focus, "leader-check", f"Dein Leader-Check zeigt: {label} ist mit {scores[focus]}/100 dein größter Hebel."
    goal = user.get("primary_goal")
    if goal in GOAL_TO_FOCUS:
        focus = GOAL_TO_FOCUS[goal]
        return focus, "onboarding", f"Dein Ziel aus dem Onboarding: {GOAL_LABEL[goal]}. Dafür setzen wir bei {FOCUS_META[focus]['label']} an."
    return "boardroom_rhetorik", "default", "Wir starten mit dem Hebel, der bei den meisten Führungskräften am schnellsten wirkt: klar und überzeugend sprechen."


def _start(user: dict) -> datetime:
    for key in ("onboarding_completed_at", "created_at"):
        val = user.get(key)
        if isinstance(val, str):
            try:
                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        if isinstance(val, datetime):
            return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc)


def build_journey(user: dict) -> dict:
    focus, source, reason = pick_focus(user)
    role = ROLE_META.get(user.get("role") or "", None)
    team_ctx = f"deinem Team ({role['team']})" if role and role["team"] != "noch kein eigenes Team" else "deinem Umfeld"
    day = max(1, (datetime.now(timezone.utc) - _start(user)).days + 1)
    done = set(int(d) for d in (user.get("journey_progress") or {}).get("done_days", []))
    current = next((i for i in range(1, 8) if i not in done), None)
    week = []
    for i, step in enumerate(WEEK_PLANS[focus], start=1):
        week.append({
            "day": i, "title": step["title"], "task": step["task"].format(team_ctx=team_ctx),
            "path": step["path"], "cta": step["cta"], "minutes": step["minutes"],
            "done": i in done, "today": i == current,
        })
    today = week[current - 1] if current else None
    return {
        "focus": focus, "focus_label": FOCUS_META[focus]["label"], "focus_goal": FOCUS_META[focus]["goal"],
        "source": source, "reason": reason,
        "role": user.get("role") or None, "role_label": role["label"] if role else None,
        "team_label": role["team"] if role else None, "role_hint": role["hint"] if role else None,
        "goal": user.get("primary_goal") or None, "goal_label": GOAL_LABEL.get(user.get("primary_goal") or ""),
        "scores": _scores(user) or None,
        "day": day, "week_done": current is None, "done_count": len(done),
        "today": today, "week": week,
    }


def journey_prompt_section(user: dict) -> str:
    """Kompakter Block für das WladBot-Gedächtnis (Systemprompt)."""
    j = build_journey(user)
    lines = ["\nPERSONALISIERTE REISE (aus Onboarding + Leader-Check):\n"]
    if j["role_label"]:
        lines.append(f"- Rolle: {j['role_label']} · Team: {j['team_label']}\n")
    if j["goal_label"]:
        lines.append(f"- Ziel laut Onboarding: {j['goal_label']}\n")
    lines.append(f"- Fokus der ersten Wochen: {j['focus_label']} ({j['source']}) – {j['reason']}\n")
    if j["today"]:
        lines.append(f"- Aktueller Schritt (Schritt {j['today']['day']} von 7): {j['today']['title']} – {j['today']['task']}\n")
    lines.append(
        "REGELN: Passe Beispiele, Tiefe und Ton an Rolle und Teamgröße an (Team Lead = konkrete Gespräche, "
        "C-Level = Organisation und Wirkung nach außen). Beziehe dich in den ersten 7 Schritten auf den Fokus und den aktuellen Schritt, "
        "wenn es passt. Nenne NIEMALS, wie viele Fragen der Leader-Check hat – sprich nur über Dimensionen und Ergebnisse.\n"
    )
    return "".join(lines)

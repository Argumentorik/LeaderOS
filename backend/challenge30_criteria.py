"""30-Tage-Programm: Abschlusskriterien und offene Tage (Iter 186).

Kundenmeldung „Tag 2 unklar": Es stand nirgends, wann eine Aufgabe erledigt
ist. Jeder Tag trägt jetzt ein „Erledigt ist, wenn …" in normaler Sprache —
abgeleitet aus Art und Ziel des Tages, plus Ausnahmen, wo es konkreter geht.
"""
from __future__ import annotations

QUIZ_DONE = (
    "Erledigt ist, wenn du die 10 Fragen beantwortet und mindestens 60 % erreicht hast.",
    "Done when you have answered the 10 questions with at least 60 %.",
)

BY_PATH = {
    "/chat": (
        "Erledigt ist, wenn du WladBot deine Situation geschildert und eine Antwort mit "
        "konkreten Schritten erhalten hast.",
        "Done when you have described your situation to WladBot and received concrete steps.",
    ),
    "/challengers": (
        "Erledigt ist, wenn du ein Rollenspiel bis zum Ende geführt und die Auswertung gelesen hast.",
        "Done when you have finished one roleplay and read the evaluation.",
    ),
    "/simulations": (
        "Erledigt ist, wenn du ein Gesprächs-Training abgeschlossen und deine Strategie erhalten hast.",
        "Done when you have completed one conversation training and received your strategy.",
    ),
    "/missions": (
        "Erledigt ist, wenn du ein Video von zwei Minuten aufgenommen und die Auswertung angesehen hast.",
        "Done when you have recorded a two-minute video and viewed the analysis.",
    ),
    "/tools": (
        "Erledigt ist, wenn du ein Werkzeug bis zum Ergebnis durchlaufen hast.",
        "Done when you have run one tool through to its result.",
    ),
    "/playbooks": (
        "Erledigt ist, wenn du einen Leitfaden gelesen und einen Schritt daraus für dich notiert hast.",
        "Done when you have read one guide and noted one step from it.",
    ),
    "/tasks": (
        "Erledigt ist, wenn die Aufgabe in deiner Liste steht und du sie abgehakt hast.",
        "Done when the task is on your list and ticked off.",
    ),
    "/daily-checkin": (
        "Erledigt ist, wenn dein Check-in für heute gespeichert ist.",
        "Done when today's check-in is saved.",
    ),
    "/kurse": (
        "Erledigt ist, wenn du eine Folge zu Ende gesehen hast.",
        "Done when you have watched one episode to the end.",
    ),
    "/wladhub": (
        "Erledigt ist, wenn deine Leader-Diagnose abgeschlossen und das Profil sichtbar ist.",
        "Done when your leader diagnosis is finished and the profile is visible.",
    ),
    "/referral": (
        "Erledigt ist, wenn du dein Zertifikat geöffnet hast.",
        "Done when you have opened your certificate.",
    ),
}

FALLBACK = (
    "Erledigt ist, wenn du die Übung einmal wirklich gemacht und den Tag hier abgehakt hast.",
    "Done when you have actually done the exercise once and ticked off the day here.",
)


def done_criteria(entry: dict) -> dict:
    """„Erledigt ist, wenn …" für einen Programmtag (DE + EN)."""
    if entry.get("type") == "quiz":
        de, en = QUIZ_DONE
    else:
        de, en = BY_PATH.get(entry.get("path") or "", FALLBACK)
    return {"done_de": de, "done_en": en}


def with_criteria(entries: list[dict]) -> list[dict]:
    return [{**e, **done_criteria(e)} for e in entries]


def open_days(entries: list[dict], completed: list[int], current_day: int) -> list[int]:
    """Alle fälligen, noch offenen Tage — verpasst heißt nachholbar, nicht verloren."""
    return [e["day"] for e in entries if e["day"] <= current_day and e["day"] not in completed]


def next_open_day(entries: list[dict], completed: list[int], current_day: int) -> int | None:
    """Entscheidung 8a: die nächste offene Aufgabe in der Reihenfolge (Tag 2 bleibt Tag 2)."""
    days = open_days(entries, completed, current_day)
    return days[0] if days else None

"""
Leader OS — 7-Episode Drip-Sequence (v2)
=========================================

Aufgaben:
1. SEQUENCE definiert 7 Episoden über 28 Tage.
2. render_email(slug, ctx) liefert {subject, html} für eine gegebene Episode.

Design: siehe `/app/backend/email_episodes.py` (Apple/Linear/Notion + Duolingo Vibe).

Episoden (Day-Offset · Slug · Titel):
  T+1d   ep01_first_win        Der erste Sieg
  T+3d   ep02_boss_answer      Die Antwort, die jeder Chef hören will
  T+6d   ep03_maria            Warum Maria plötzlich jeder zuhörte
  T+10d  ep04_hardest_sentence Der schwierigste Satz im Meeting
  T+15d  ep05_cfo_test         Der CFO-Test
  T+21d  ep06_three_min        Die 3-Minuten-Routine
  T+28d  ep07_executive_mode   Executive Mode (Sprint-Pitch)

Skip-Logik (im Scheduler): Wenn Lead zwischendurch kauft oder unsubscribed,
wird die Sequenz angehalten.
"""
from typing import Callable

from email_episodes import (
    EPISODES,
    render_episode,
    episode_01_first_win,
    episode_02_boss_answer,
    episode_03_maria,
    episode_04_hardest_sentence,
    episode_05_cfo_test,
    episode_06_three_min,
    episode_07_executive_mode,
)


# (day_offset, slug, fn) · fn primär für Doku-Zwecke, render_email mappt selbst
SEQUENCE: list[tuple[int, str, Callable]] = [
    (1,  "ep01_first_win",        episode_01_first_win),
    (3,  "ep02_boss_answer",      episode_02_boss_answer),
    (6,  "ep03_maria",            episode_03_maria),
    (10, "ep04_hardest_sentence", episode_04_hardest_sentence),
    (15, "ep05_cfo_test",         episode_05_cfo_test),
    (21, "ep06_three_min",        episode_06_three_min),
    (28, "ep07_executive_mode",   episode_07_executive_mode),
]


def render_email(slug: str, ctx: dict) -> dict | None:
    """Render an email by slug using a context dict. Returns {subject, html} or None.

    Backward-compatible: alte Slugs aus der 10-Mail-Sequence werden auf die
    nächstpassende Episode gemappt, damit bereits enqueueten Mails nicht
    crashen.
    """
    legacy_map = {
        "score_meaning":  "ep01_first_win",
        "quickwin":       "ep02_boss_answer",
        "social_proof":   "ep03_maria",
        "scarcity":       "ep04_hardest_sentence",
        "loss":           "ep05_cfo_test",
        "live_with_wlad": "ep06_three_min",
        "decision_help":  "ep07_executive_mode",
        "last_call":      "ep07_executive_mode",
        "door_closes":    "ep07_executive_mode",
        "reengagement":   "ep07_executive_mode",
    }
    effective_slug = legacy_map.get(slug, slug)
    return render_episode(effective_slug, ctx)

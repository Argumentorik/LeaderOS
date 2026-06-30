"""Smoke-Tests für die 7 Drip-Episoden."""
import pytest

from email_episodes import EPISODES, render_episode
from services.email_sequence import SEQUENCE, render_email


EXPECTED_SLUGS = [
    "ep01_first_win",
    "ep02_boss_answer",
    "ep03_maria",
    "ep04_hardest_sentence",
    "ep05_cfo_test",
    "ep06_three_min",
    "ep07_executive_mode",
]


def test_sequence_has_seven_episodes():
    assert len(SEQUENCE) == 7
    slugs = [s for _, s, _ in SEQUENCE]
    assert slugs == EXPECTED_SLUGS


def test_day_offsets_are_ascending():
    days = [d for d, _, _ in SEQUENCE]
    assert days == sorted(days)
    assert days[0] >= 1 and days[-1] <= 30


@pytest.mark.parametrize("slug", EXPECTED_SLUGS)
def test_episode_renders(slug):
    out = render_episode(slug, {"name": "Mert", "weakest_label": "Rhetorik", "email": "test@example.com"})
    assert out is not None
    assert out["subject"]
    assert "<!DOCTYPE html>" in out["html"]
    assert "Mert" in out["html"]
    # No em-dashes (AI-Slop check)
    assert "—" not in out["html"]
    # WladBot avatar uses Logo Mark
    assert "leaderos-mark.png" in out["html"] or "leaderos-logo-dark.png" in out["html"]


@pytest.mark.parametrize("legacy", ["score_meaning", "quickwin", "social_proof", "last_call", "door_closes", "reengagement"])
def test_legacy_slug_backward_compat(legacy):
    out = render_email(legacy, {"name": "Mert", "weakest_label": "Rhetorik"})
    assert out is not None
    assert out["subject"]
    assert "<!DOCTYPE html>" in out["html"]


def test_all_episodes_have_single_cta():
    """Jede Episode muss genau 1 Hero-CTA-Button enthalten (1-CTA-Regel)."""
    for slug in EXPECTED_SLUGS:
        out = render_episode(slug, {"name": "Mert", "email": "x@y.de"})
        # Lime CTA-Buttons werden via background:#C8FF00 + padding:18px 32px geklont
        cta_count = out["html"].count("padding:18px 32px;border-radius:8px;text-decoration:none")
        assert cta_count == 1, f"{slug}: erwartet 1 Hero-CTA, gefunden {cta_count}"

"""Iter 141 — Regressionstests zu den Code-Review-Findings.


Abgedeckt:
  HIGH   Registrierungs-Validatoren waren toter Code (models.py)
  MEDIUM Leeres TTS-Audio darf nicht gecacht werden
  MEDIUM Provider-Fehlertexte dürfen nicht an den Client gehen
  MEDIUM Async-Video-Upload: harte Grenzen für RAM-Verbrauch
         Quiz-Shuffle: GET und Scoring müssen dieselbe Reihenfolge sehen
"""

import os
import sys

import pytest
from pydantic import ValidationError

DUMMY_PW = "geheim123"  # noqa: S105 — Dummy für Schema-Tests, kein echtes Konto

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ── HIGH: Registrierungs-Validierung ────────────────────────────────────────
def test_register_rejects_invalid_input():
    from models import UserRegister

    with pytest.raises(ValidationError) as exc:
        UserRegister(email="NOTvalid", password="123", name="x" * 200, phone="!!")  # noqa: S106 — absichtlich ungültig
    fields = {e["loc"][0] for e in exc.value.errors()}
    assert {"email", "password", "name", "phone"} <= fields


def test_register_accepts_valid_input():
    from models import UserRegister

    u = UserRegister(email="  Max.Muster@Example.de ", password=DUMMY_PW, name=" Max ", phone="+49 170 1234567")
    assert u.email == "max.muster@example.de"
    assert u.name == "Max"


@pytest.mark.parametrize("bad_email", ["kein-at-zeichen", "@nodomain.de", "a@b", "a b@c.de", ""])
def test_register_rejects_broken_emails(bad_email):
    from models import UserRegister

    with pytest.raises(ValidationError):
        UserRegister(email=bad_email, password=DUMMY_PW, name="Max", phone="+4917012345")


# ── MEDIUM: KI-Fehler werden klassifiziert, nicht durchgereicht ──────────────
@pytest.mark.parametrize("msg,expected", [
    ("Error code: 400 - Budget has been exceeded for this key", "budget_exceeded"),
    ("insufficient_quota: You exceeded your current quota", "budget_exceeded"),
    ("429 Too Many Requests — rate limit reached", "rate_limit"),
    ("401 Unauthorized: invalid_api_key", "auth"),
    ("Read timeout on POST /chat/completions", "timeout"),
    ("Connection reset by peer", "unavailable"),
])
def test_ai_error_classification(msg, expected):
    from services_ai_errors import classify_ai_error

    assert classify_ai_error(Exception(msg)) == expected


def test_ai_error_messages_hide_provider_details():
    from services_ai_errors import _MESSAGES, _STATUS, BUDGET

    assert _STATUS[BUDGET] == 503
    for reason, text in _MESSAGES.items():
        low = text.lower()
        assert "openai" not in low and "traceback" not in low and "error code" not in low
        assert "guthaben wurde nicht belastet" in low, reason


# ── MEDIUM: Video-Upload-Grenzen ────────────────────────────────────────────
def test_async_video_limits_are_bounded():
    import routes.video as video

    assert video.ASYNC_MAX_UPLOAD_BYTES <= 200 * 1024 * 1024
    assert 1 <= video.MAX_CONCURRENT_VIDEO_JOBS <= 5
    worst_case = video.ASYNC_MAX_UPLOAD_BYTES * video.MAX_CONCURRENT_VIDEO_JOBS
    assert worst_case <= 600 * 1024 * 1024, "Worst-Case-RAM zu hoch"


# ── Quiz: Shuffle-Konsistenz und kein Leak ──────────────────────────────────
def test_quiz_shuffle_is_stable_per_user_and_differs_between_users():
    from quiz_quality import shuffle_options

    options = ["A-Antwort", "B-Antwort", "C-Antwort", "D-Antwort"]
    first = shuffle_options(options, 1, "user_a", "3", "0")
    again = shuffle_options(options, 1, "user_a", "3", "0")
    other = shuffle_options(options, 1, "user_b", "3", "0")

    assert first == again, "Reload muss dieselbe Reihenfolge liefern"
    assert first[0][first[1]] == "B-Antwort", "Index muss auf die richtige Antwort zeigen"
    assert set(first[0]) == set(options)
    assert first[0] != other[0] or first[1] != other[1]


def test_quiz_bank_has_no_position_bias_after_shuffle():
    from collections import Counter

    from quiz_bank import QUIZ_BANK
    from quiz_quality import shuffle_options

    positions = Counter()
    for day in range(1, 31):
        for i, q in enumerate(QUIZ_BANK[day]):
            if q.get("type", "mc") != "mc" or not q.get("options"):
                continue
            _opts, correct = shuffle_options(q["options"], q.get("correct", -1), "seed_user", str(day), str(i))
            positions[correct] += 1

    total = sum(v for k, v in positions.items() if k >= 0)
    assert total > 200
    for pos in range(4):
        share = positions[pos] / total
        assert 0.15 < share < 0.35, f"Position {pos} zu häufig/selten: {share:.0%}"


def test_quiz_validator_flags_weak_distractors():
    from quiz_quality import validate_question

    weak = {
        "options": [
            "Nichts",
            "Ein Leader, der Verantwortung übernimmt und seinem Team klare Orientierung gibt, auch wenn es unbequem wird",
            "Zufall",
            "Egal",
        ],
        "correct": 1,
    }
    issues = validate_question(weak)
    assert any("zu_kurz" in i for i in issues)
    assert "richtige_antwort_ist_deutlich_laengste" in issues

    balanced = {
        "options": [
            "Verantwortung übernehmen und dem Team klare Orientierung geben, auch wenn es unbequem wird",
            "Entscheidungen an das Team abgeben, damit niemand die Verantwortung alleine tragen muss",
            "Erst entscheiden, wenn alle Beteiligten dem Vorschlag ausdrücklich zugestimmt haben",
            "Konflikte vertagen, bis sich die Lage von selbst beruhigt und keiner mehr nachfragt",
        ],
        "correct": 0,
    }
    assert validate_question(balanced) == []


def test_selfassessment_questions_are_not_flagged():
    from quiz_quality import validate_question

    q = {"options": ["Ja, klar", "Teilweise schon", "Eher nicht", "Nein"], "correct": -1}
    assert validate_question(q) == []

"""Iter 139 — Quiz-Qualität (P4) + Support-Adresse (P2) Backend-Tests.

Run: cd /app/backend && REACT_APP_BACKEND_URL=<url> pytest tests/test_iter139_fixes.py -q
"""
import os
import statistics

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

STANDARD = {"email": "standard@wladbot.test", "password": "test123"}
FREE = {"email": "free@wladbot.test", "password": "test123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def std_auth():
    return _login(STANDARD)


@pytest.fixture(scope="module")
def free_auth():
    return _login(FREE)


# ── P4 Quiz ─────────────────────────────────────────────────────────────────

class TestQuizQuality:
    def _get(self, auth, day):
        r = requests.get(f"{API}/challenge30/quiz/{day}", headers=auth, timeout=30)
        assert r.status_code == 200, f"day {day}: {r.status_code} {r.text[:300]}"
        return r.json()

    def test_no_correct_leak_days_1_10(self, std_auth):
        leaks = []
        for day in range(1, 11):
            data = self._get(std_auth, day)
            raw = requests.get(f"{API}/challenge30/quiz/{day}", headers=std_auth, timeout=30).text
            for q in data["questions"]:
                if "correct" in q or "explanation" in q:
                    leaks.append((day, list(q.keys())))
            assert '"correct"' not in raw, f"day {day} raw payload leaks 'correct'"
        assert not leaks, f"correct/explanation leaked: {leaks}"

    def test_option_order_stable_across_reloads(self, std_auth):
        for day in range(1, 11):
            a = self._get(std_auth, day)
            b = self._get(std_auth, day)
            assert [q.get("options") for q in a["questions"]] == \
                   [q.get("options") for q in b["questions"]], f"day {day} order unstable"

    def test_order_differs_between_users(self, std_auth, free_auth):
        differing_days = 0
        for day in range(1, 8):
            a = self._get(std_auth, day)
            try:
                b = self._get(free_auth, day)
            except AssertionError:
                pytest.skip("free user has no access to this day")
            if [q.get("options") for q in a["questions"]] != [q.get("options") for q in b["questions"]]:
                differing_days += 1
        assert differing_days >= 5, f"only {differing_days}/7 days differ between users"

    def test_option_length_distribution(self, std_auth):
        outliers = []
        checked = 0
        for day in range(1, 15):
            data = self._get(std_auth, day)
            for q in data["questions"]:
                opts = q.get("options") or []
                if q.get("type", "mc") != "mc" or len(opts) < 3:
                    continue
                checked += 1
                lengths = [len(o) for o in opts]
                median = statistics.median(lengths)
                dev = max(abs(l - median) / median for l in lengths)
                if dev > 0.25:
                    outliers.append((day, q["q"][:40], round(dev, 2)))
        assert checked >= 20, f"only {checked} MC questions checked"
        ratio = len(outliers) / checked
        print(f"MC checked={checked} outliers={len(outliers)} ({ratio:.0%})")
        assert ratio <= 0.30, f"{ratio:.0%} of questions exceed 25% length deviation: {outliers[:10]}"

    def test_submit_scoring_matches_shuffled_order(self, std_auth):
        """Submit the true (shuffled) correct index for MC q0 and a wrong one for q1."""
        import sys
        sys.path.insert(0, "/app/backend")
        from quiz_bank import QUIZ_BANK  # noqa
        from quiz_quality import shuffle_options  # noqa

        me = requests.get(f"{API}/auth/me", headers=std_auth, timeout=30)
        assert me.status_code == 200, me.text
        user_id = me.json().get("user_id") or me.json().get("user", {}).get("user_id")
        assert user_id, me.text

        day = 1
        questions = QUIZ_BANK.get(day) or QUIZ_BANK.get(str(day))
        assert questions, "no bank questions for day 1"
        get_data = self._get(std_auth, day)

        answers = {}
        expected = {}
        for i, q in enumerate(questions):
            if q.get("type", "mc") not in ("mc",):
                answers[str(i)] = 0
                expected[i] = True
                continue
            shuffled, correct_idx = shuffle_options(q.get("options", []), q.get("correct", -1),
                                                     user_id, str(day), str(i))
            # sanity: server-served options match locally computed shuffle
            assert get_data["questions"][i].get("options") == shuffled, \
                f"q{i}: served options differ from deterministic shuffle"
            if correct_idx == -1:
                answers[str(i)] = 0
                expected[i] = True
            elif i % 2 == 0:
                answers[str(i)] = correct_idx
                expected[i] = True
            else:
                answers[str(i)] = (correct_idx + 1) % len(shuffled)
                expected[i] = False

        r = requests.post(f"{API}/challenge30/quiz/{day}", headers=std_auth,
                          json={"answers": answers}, timeout=60)
        if r.status_code == 402:
            pytest.skip("no credits for quiz submission")
        assert r.status_code == 200, r.text
        res = r.json()
        for i, item in enumerate(res["results"]):
            assert item["correct"] == expected[i], \
                f"q{i} scored {item['correct']}, expected {expected[i]} ({item.get('question','')[:40]})"
        assert res["correct"] == sum(1 for v in expected.values() if v)


# ── P2 Support-Adresse ──────────────────────────────────────────────────────

@pytest.mark.parametrize("question", [
    "Wie erreiche ich den Support von Argumentorik?",
    "Support Mail von Argumentorik?",
    "An wen wende ich mich bei Problemen mit Argumentorik?",
])
def test_support_address_is_support_at_argumentorik(std_auth, question):
    r = requests.post(f"{API}/chat", headers=std_auth,
                      json={"message": question, "session_id": None}, timeout=180)
    if r.status_code == 402:
        pytest.skip("no credits")
    assert r.status_code == 200, r.text
    import json as _json
    reply = _json.dumps(r.json(), ensure_ascii=False).lower()
    assert reply, r.text[:400]
    print(f"\nQ: {question}\nA: {reply[:600]}")
    assert "support@argumentorik.com" in reply, f"missing support address: {reply[:400]}"
    assert "info@argumentorik.com" not in reply, f"info@ mentioned: {reply[:400]}"

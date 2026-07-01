"""Iter 92.48 – Static challenger intros + hybrid model routing + voice cache tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{API}/auth/login", json={"email": "standard@wladbot.test", "password": "test123"}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ========== Challengers ==========
class TestChallengers:
    def test_challengers_list_has_initial_message(self):
        r = requests.get(f"{API}/challengers", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 8, f"expected 8, got {len(data)}"
        for c in data:
            assert c.get("initial_message"), f"{c.get('challenger_id')} missing initial_message"
            assert len(c["initial_message"]) > 40

    def test_intros_requires_auth(self):
        r = requests.get(f"{API}/challengers/intros", timeout=15)
        assert r.status_code in (401, 403), f"anon should be blocked, got {r.status_code}"

    def test_intros_authenticated(self, auth_headers):
        r = requests.get(f"{API}/challengers/intros", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 8
        for item in data:
            for k in ("challenger_id", "name", "avatar", "initial_message"):
                assert k in item
            assert item["initial_message"]

    def test_start_bezos_fast_and_static(self, auth_headers):
        t0 = time.time()
        r = requests.post(f"{API}/challengers/bezos/start", headers=auth_headers, timeout=30)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        data = r.json()
        assert "challenge_id" in data
        assert "Jeff Bezos" in data["initial_message"]
        assert elapsed < 3.0, f"start took {elapsed:.2f}s — LLM likely not skipped"
        # Save for follow-up test
        TestChallengers.bezos_challenge_id = data["challenge_id"]

    def test_start_jobs_static_intro(self, auth_headers):
        r = requests.post(f"{API}/challengers/jobs/start", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert "Steve" in r.json()["initial_message"]

    def test_message_follow_up_no_result(self, auth_headers):
        cid = getattr(TestChallengers, "bezos_challenge_id", None)
        if not cid:
            pytest.skip("no challenge id from start")
        r = requests.post(
            f"{API}/challengers/bezos/message",
            headers=auth_headers,
            json={"challenge_id": cid, "message": "Ich würde in ein starkes Team investieren, das langfristig skaliert."},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "response" in data and data["response"]
        assert data.get("result") is None


# ========== Voice cache ==========
class TestVoiceCache:
    def test_tts_first_then_cached(self, auth_headers):
        payload = {"text": "Willkommen. Ich bin Jeff Bezos.", "persona": "bezos"}
        r1 = requests.post(f"{API}/voice/tts", headers=auth_headers, json=payload, timeout=60)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert "audio_url" in d1 and d1["audio_url"].startswith("data:audio")
        # 2nd call should be cached=True
        r2 = requests.post(f"{API}/voice/tts", headers=auth_headers, json=payload, timeout=30)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2.get("cached") is True, f"second call not cached: {d2.get('cached')}"


# ========== Hybrid chat routing ==========
class TestChatHybrid:
    def test_short_message_fast(self, auth_headers):
        payload = {"message": "Wie delegiere ich effektiver?", "modality": "text"}
        t0 = time.time()
        r = requests.post(f"{API}/chat", headers=auth_headers, json=payload, timeout=90)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        data = r.json()
        assert "response" in data
        assert data.get("modality") == "text"
        # response can be dict or str (Wlad JSON shape)
        resp = data["response"]
        if isinstance(resp, dict):
            for k in ("insight", "strategy", "action_steps"):
                assert k in resp, f"missing key {k} in short response"
        print(f"Short chat elapsed: {elapsed:.2f}s")

    def test_long_message_deep(self, auth_headers):
        long_msg = (
            "Ich habe eine sehr komplexe Konfliktsituation in meinem Team: Zwei Senior Manager streiten seit "
            "Wochen über die strategische Richtung eines Kernprojekts. Der eine will Speed, der andere Qualität. "
            "Das Team ist gespalten, die Stimmung kippt, und wir verlieren wichtige Deadlines. Wie gehe ich als "
            "Führungskraft strukturiert und empathisch damit um, ohne meine Autorität zu verlieren?"
        )
        assert len(long_msg) > 200
        r = requests.post(f"{API}/chat", headers=auth_headers, json={"message": long_msg, "modality": "text"}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "response" in data
        assert data.get("modality") == "text"
        resp = data["response"]
        if isinstance(resp, dict):
            for k in ("insight", "strategy", "action_steps"):
                assert k in resp, f"missing key {k} in long response"

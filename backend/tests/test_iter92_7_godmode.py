"""
Iter 92.6 + 92.7 GODMODE backend regression tests.
- RAG flow on /api/chat (Wlad-Wissen)
- RAG code-path presence in video.py / playbooks.py / simulations.py (static check)
- /api/lifecycle/status
- /api/payments/checkout WLAD10 vs no-code
- /api/unsubscribe/info?token=garbage
- /api/my-path/videos (6 free starter videos)
- /api/events?tab=live (Thursdays >= 2026-07-02)
- Public assets HEAD: favicon.svg, icon-192.png, apple-touch-icon.png, manifest.json
"""
import os
import re
from datetime import datetime
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")
TEST_EMAIL = "test@test.com"
TEST_PASS = "test123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": TEST_EMAIL, "password": TEST_PASS}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    j = r.json()
    tok = j.get("token") or j.get("access_token")
    assert tok, f"no token in login response: {j}"
    return tok


@pytest.fixture(scope="session")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --- Backend RAG static code-path verification ---
class TestRagStaticInjection:
    def test_video_py_has_rag_block(self):
        with open("/app/backend/routes/video.py") as f:
            src = f.read()
        assert "from services_rag import retrieve_context" in src
        assert "rag_block" in src and "context_block" in src

    def test_playbooks_py_has_rag_block(self):
        with open("/app/backend/routes/playbooks.py") as f:
            src = f.read()
        assert "from services_rag import retrieve_context" in src
        assert "rag_block" in src

    def test_simulations_py_has_rag_block(self):
        with open("/app/backend/routes/simulations.py") as f:
            src = f.read()
        assert "from services_rag import retrieve_context" in src
        assert "rag_block" in src

    def test_rag_threshold_is_0_40(self):
        with open("/app/backend/services_rag.py") as f:
            src = f.read()
        assert 'MATCH_THRESHOLD = float(os.environ.get("RAG_MATCH_THRESHOLD"' in src
        assert '"0.40"' in src


# --- Live chat (RAG retrieval, local embeddings) ---
class TestChatRag:
    def test_chat_feedbackformel(self, headers):
        r = requests.post(f"{BASE_URL}/api/chat",
                          headers=headers,
                          json={"message": "Was ist die Feedbackformel?"},
                          timeout=90)
        assert r.status_code == 200, f"chat failed: {r.status_code} {r.text[:300]}"
        j = r.json()
        # Response shape — flexible: could be {response: ...} or {message: ...} or {reply}
        raw = (j.get("response") or j.get("message") or j.get("reply") or
               j.get("content") or j)
        text = (str(raw) if not isinstance(raw, str) else raw).lower()
        assert len(text) > 30, f"too short: {text}"
        # Should not crash; ideally references RAG concepts (loose check)
        has_signal = any(w in text for w in ["reifegrad", "kriterien", "feedback", "konkret", "wlad"])
        assert has_signal, f"no Wlad/feedback signal in response: {text[:400]}"


# --- Lifecycle ---
class TestLifecycle:
    def test_lifecycle_status(self, headers):
        r = requests.get(f"{BASE_URL}/api/lifecycle/status", headers=headers, timeout=20)
        assert r.status_code == 200, r.text[:200]
        j = r.json()
        assert "email_enabled" in j
        assert j.get("video_drip_weeks") == [1, 2, 3, 4, 5, 6], f"got {j.get('video_drip_weeks')}"


# --- Payments WLAD10 ---
class TestPayments:
    def test_checkout_with_wlad10(self, headers):
        r = requests.post(f"{BASE_URL}/api/payments/checkout",
                          headers=headers,
                          json={"package_id": "leadership_os",
                                "discount_code": "WLAD10",
                                "origin_url": BASE_URL},
                          timeout=30)
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        amt = j.get("amount") or j.get("discounted_amount") or j.get("price")
        assert amt is not None
        # Either 897.30 € or 89730 cents
        assert abs(float(amt) - 897.30) < 0.5 or int(amt) == 89730, f"unexpected amount: {amt}"

    def test_checkout_no_code(self, headers):
        r = requests.post(f"{BASE_URL}/api/payments/checkout",
                          headers=headers,
                          json={"package_id": "leadership_os",
                                "origin_url": BASE_URL},
                          timeout=30)
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        amt = j.get("amount") or j.get("discounted_amount") or j.get("price")
        assert amt is not None
        assert abs(float(amt) - 997.00) < 0.5 or int(amt) == 99700, f"unexpected amount: {amt}"


# --- Unsubscribe ---
class TestUnsubscribe:
    def test_garbage_token(self):
        r = requests.get(f"{BASE_URL}/api/unsubscribe/info?token=garbage", timeout=20)
        assert r.status_code == 400
        body = r.json()
        msg = body.get("detail") or body.get("message") or str(body)
        assert "Ungültig" in msg or "abgelaufen" in msg, msg


# --- MyPath videos ---
class TestMyPath:
    def test_videos_six_free(self, headers):
        r = requests.get(f"{BASE_URL}/api/my-path/videos", headers=headers, timeout=20)
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        videos = j if isinstance(j, list) else (j.get("videos") or j.get("items") or j.get("starter_videos") or [])
        assert isinstance(videos, list), f"shape: {type(j)}"
        # 6 starter videos with min_tier:'free', unlocked:true
        free_unlocked = [v for v in videos
                         if (v.get("min_tier") in (None, "free")) and v.get("unlocked", True)]
        assert len(free_unlocked) >= 6, f"got {len(free_unlocked)} free unlocked, expected >=6; sample: {videos[:1]}"


# --- Events ---
class TestEvents:
    def test_live_events_thursdays(self, headers):
        r = requests.get(f"{BASE_URL}/api/events?tab=live", headers=headers, timeout=20)
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        events = j if isinstance(j, list) else (j.get("events") or j.get("items") or [])
        upcoming = []
        cutoff = datetime(2026, 7, 2)
        for ev in events:
            ds = ev.get("date") or ev.get("start_date") or ev.get("scheduled_at") or ev.get("starts_at")
            if not ds:
                continue
            try:
                d = datetime.fromisoformat(ds.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                continue
            if d >= datetime.now():
                upcoming.append((d, ev))
        # Skip if no upcoming events at all
        if not upcoming:
            pytest.skip("no upcoming events to validate")
        for d, ev in upcoming:
            assert d.weekday() == 3, f"event {ev.get('id') or ev.get('title')} on {d} is weekday {d.weekday()}, expected Thursday"
            assert d >= cutoff, f"event {ev} before 2026-07-02"


# --- Public assets ---
class TestPublicAssets:
    @pytest.mark.parametrize("path", ["/favicon.svg", "/icon-192.png", "/apple-touch-icon.png", "/manifest.json"])
    def test_asset_200(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} → {r.status_code}"

    def test_manifest_has_shortcuts(self):
        r = requests.get(f"{BASE_URL}/manifest.json", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "shortcuts" in j and isinstance(j["shortcuts"], list) and len(j["shortcuts"]) > 0


# --- Frontend CSS utility presence (static file check) ---
class TestCssUtilities:
    def test_css_utilities_defined(self):
        with open("/app/frontend/src/index.css") as f:
            src = f.read()
        assert ".btn-shine" in src
        assert ".card-lift" in src
        assert ".glow-lime" in src

    def test_login_button_classes(self):
        with open("/app/frontend/src/components/auth/AuthForm.js") as f:
            src = f.read()
        assert "glow-lime" in src and "btn-shine" in src

    def test_dashboard_quick_cards_classes(self):
        with open("/app/frontend/src/components/dashboard/StatCards.js") as f:
            src = f.read()
        assert "card-lift" in src and "btn-shine" in src

    def test_wladmark_new_path(self):
        with open("/app/frontend/src/components/brand/WladMark.js") as f:
            src = f.read()
        assert "M2.8 4.8 L" in src

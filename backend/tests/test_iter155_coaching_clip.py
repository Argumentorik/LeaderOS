"""Iter 155: Coaching-Clip (kind coaching), Talk-Wortbudget je Preset, Portrait-Framing für Talk-Keyframes."""
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _login(email, password="test123"):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def test_coaching_script_godmode_and_honest_scope():
    from guide_scripts_godmode import AI_SLOP, SCRIPTS
    from guide_content import word_limits
    s = SCRIPTS["coaching-pakete"]
    lo, hi = word_limits("coaching")
    assert lo <= len(s.split()) <= hi
    assert not [p for p in AI_SLOP if p in s.lower()]
    # 997 € gilt für die sechs Fundament-Kurse, nicht für alle zehn
    assert "sechs Fundament-Kurse" in s and "PLUS ergänzt die vier Kurse" in s


def test_seed_contains_coaching_clip_in_studio():
    from guide_content import CLIP_SCREENS, CLIP_SETTING, seed_clips
    clip = next(c for c in seed_clips() if c["slug"] == "coaching-pakete")
    assert clip["kind"] == "coaching" and clip["multi_shot"] and clip["aspect"] == "16:9"
    assert CLIP_SETTING["coaching-pakete"] == "studio" and "coaching" in CLIP_SCREENS["coaching-pakete"]


def test_talk_word_cap_by_preset():
    from guide_content import talk_word_cap
    assert talk_word_cap("studio_medium") == 64 and talk_word_cap("loft_seated_medium") == 64
    assert talk_word_cap("studio_closeup") == 50 and talk_word_cap("loft_seated_closeup") == 50
    assert talk_word_cap("loft_talk_medium") == 26 and talk_word_cap("") == 26


def test_talk_keyframes_use_portrait_framing():
    from guide_content import SHOT_PRESETS, WLAD_STYLE_PROMPT, scene_for_aspect, style_prompt_for
    talk = style_prompt_for(SHOT_PRESETS["studio_medium"])
    assert "NOT full body" in talk and "Full body" not in talk
    assert style_prompt_for(SHOT_PRESETS["loft_walk_in"]) == WLAD_STYLE_PROMPT
    scene = scene_for_aspect(SHOT_PRESETS["studio_medium"]["scene_prompt"], "16:9", talk=True)
    assert "long legs" not in scene and "camera is close" in scene
    for name in ("loft_seated_medium", "loft_seated_closeup", "studio_medium", "studio_closeup"):
        assert "TIGHT" in SHOT_PRESETS[name]["scene_prompt"]


def test_clips_endpoint_accepts_coaching_kind():
    s = _login("free@wladbot.test")
    r = s.get(f"{API}/api/guide/clips", params={"kind": "coaching"}, timeout=30)
    assert r.status_code == 200 and isinstance(r.json()["clips"], list)
    assert s.get(f"{API}/api/guide/clips", params={"kind": "foo"}, timeout=30).status_code == 400


def test_admin_shot_cap_message_uses_preset_budget():
    s = _login("test@test.com")
    long_text = " ".join(["Wort"] * 70)
    r = s.put(f"{API}/api/guide/admin/clips/coaching-pakete/shots", json={"shots": [{"id": "s1", "text": long_text}]}, timeout=30)
    assert r.status_code in (400, 409)
    if r.status_code == 400:
        assert "64 Wörter" in r.json()["detail"]


def test_fal_timeout_keeps_request_for_resume():
    import services_fal as f
    req = {"endpoint": "x", "request_id": "r1", "status_url": f"{f._control_base()}/queue/x/requests/r1/status",
           "response_url": f"{f._control_base()}/queue/x/requests/r1"}

    class _Res:
        status_code = 200

        @staticmethod
        def json():
            return {"status": "IN_QUEUE"}

    original = f._get_with_retry
    f._get_with_retry = lambda *a, **k: _Res()
    try:
        try:
            f.wait_fal(req, timeout_seconds=0.2, poll_interval=0.05)
            raise AssertionError("expected FalTimeout")
        except f.FalTimeout as e:
            assert e.request["request_id"] == "r1" and isinstance(e, f.FalError)
    finally:
        f._get_with_retry = original


def test_direct_fal_key_switches_auth_and_queue_origin(monkeypatch):
    import services_fal as f
    monkeypatch.setenv("FAL_KEY", "k-test")
    assert f._headers()["Authorization"] == "Key k-test"
    assert f._trusted_queue_url("https://queue.fal.run/fal-ai/x/requests/1/status").startswith("https://queue.fal.run/")
    monkeypatch.delenv("FAL_KEY")
    monkeypatch.setenv("EMERGENT_LLM_KEY", "e")
    assert f._headers()["Authorization"] == "Bearer e"


def test_shot_view_hides_fal_request_but_flags_pending():
    from routes.guide import _shot_view
    v = _shot_view({"id": "s3", "type": "talk", "preset": "studio_closeup", "fal_request": {"request_id": "r"}}, "tok")
    assert "fal_request" not in v and v["fal_pending"] is True
    v2 = _shot_view({"id": "s3", "type": "talk", "fal_request": {"request_id": "r"}, "synced_path": "p"}, "tok")
    assert v2["fal_pending"] is False and v2["synced_url"]

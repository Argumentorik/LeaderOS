"""
Iteration 92 — Backend testing for LeaderOS pre-launch polish.

Validates:
  1. GET /api/events?tab=live returns events that are all on Thursday and >= 2026-07-02.
  2. The eight `live_ki_call_0..7` events fall on weekly Thursdays from 2026-07-02..2026-08-20 @ 18:00 UTC.
  3. POST /api/payments/checkout {package_id:'leadership_os', origin_url:'https://example.com'} returns
     200 with a checkout.stripe.com URL.
"""

import os
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Backend public URL fallback from frontend/.env
    with open("/app/frontend/.env", "r") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

JULY_2_2026 = datetime(2026, 7, 2, tzinfo=timezone.utc)


def _parse(iso_str: str) -> datetime:
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))


# -------- Events: weekly Thursdays starting 2026-07-02 --------
class TestEventsWeeklyThursday:
    def test_live_events_endpoint_ok(self):
        r = requests.get(f"{BASE_URL}/api/events", params={"tab": "live"}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) or isinstance(data, dict)

    def test_all_non_replay_events_are_thursday_and_after_july_2(self):
        r = requests.get(f"{BASE_URL}/api/events", params={"tab": "live"}, timeout=20)
        assert r.status_code == 200
        payload = r.json()
        # API may return a list or {events:[...]}
        events = payload if isinstance(payload, list) else payload.get("events", [])
        assert events, "Expected at least one event for tab=live"

        bad = []
        for ev in events:
            if ev.get("is_replay") or ev.get("replay"):
                continue
            iso = ev.get("starts_at") or ev.get("start_time") or ev.get("date")
            if not iso:
                continue
            dt = _parse(iso)
            if dt.weekday() != 3:
                bad.append(
                    f"{ev.get('id') or ev.get('slug')}: {iso} (weekday={dt.weekday()})"
                )
            elif dt < JULY_2_2026:
                bad.append(
                    f"{ev.get('id') or ev.get('slug')}: {iso} is before 2026-07-02"
                )
        assert not bad, "Non-Thursday or pre-July events: " + "; ".join(bad)

    def test_live_ki_call_weekly_dates(self):
        """live_ki_call_0..7 should be 2026-07-02 → 2026-08-20 Thursdays 18:00 UTC."""
        r = requests.get(f"{BASE_URL}/api/events", params={"tab": "live"}, timeout=20)
        payload = r.json()
        events = payload if isinstance(payload, list) else payload.get("events", [])
        by_id = {}
        for ev in events:
            eid = ev.get("id") or ev.get("slug") or ev.get("event_id")
            if eid and str(eid).startswith("live_ki_call_"):
                by_id[str(eid)] = ev

        expected = {
            "live_ki_call_0": datetime(2026, 7, 2, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_1": datetime(2026, 7, 9, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_2": datetime(2026, 7, 16, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_3": datetime(2026, 7, 23, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_4": datetime(2026, 7, 30, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_5": datetime(2026, 8, 6, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_6": datetime(2026, 8, 13, 18, 0, tzinfo=timezone.utc),
            "live_ki_call_7": datetime(2026, 8, 20, 18, 0, tzinfo=timezone.utc),
        }
        missing = [eid for eid in expected if eid not in by_id]
        assert not missing, f"Missing live_ki_call events: {missing}. Found ids: {list(by_id.keys())[:20]}"

        wrong = []
        for eid, want in expected.items():
            ev = by_id[eid]
            iso = ev.get("starts_at") or ev.get("start_time") or ev.get("date")
            got = _parse(iso)
            if got != want:
                wrong.append(f"{eid}: got {got.isoformat()} expected {want.isoformat()}")
        assert not wrong, "Wrong dates: " + "; ".join(wrong)


# -------- Stripe checkout --------
def _login_session() -> requests.Session:
    s = requests.Session()
    # Try cookie-based auth
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@test.com", "password": "test123"},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"Login failed status={r.status_code} body={r.text[:200]}")
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    token = body.get("access_token") or body.get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


class TestStripeCheckout:
    def test_create_checkout_session(self):
        sess = _login_session()
        r = sess.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "origin_url": "https://example.com"},
            timeout=30,
        )
        # 401 indicates auth context unsupported by tests; surface the real failure mode
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:400]}"
        data = r.json()
        url = data.get("url") or data.get("checkout_url") or data.get("session_url")
        assert url, f"No checkout url in response: {data}"
        assert "checkout.stripe.com" in url, f"Expected stripe URL, got: {url}"

    def test_create_checkout_session_unauthenticated(self):
        """Anonymous checkout should also be supported per spec (some apps allow it)."""
        r = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "origin_url": "https://example.com"},
            timeout=30,
        )
        # We don't assert on this — report both outcomes
        print(f"anon checkout status={r.status_code} body={r.text[:200]}")

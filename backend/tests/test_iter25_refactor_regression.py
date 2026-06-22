"""Iteration 25 — Regression after pure refactoring (services/ split + 3 admin registrars + payments split + quiz narrative helpers).

NO behavior must change vs iter24. Covers all endpoints listed in the review_request.
"""
import os
import re
import time
import pytest
import requests


def _read_frontend_env_url():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        return None
    return None


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env_url() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL
ADMIN_PW = "wladhub2026"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Health ----------
class TestHealth:
    def test_health(self, s):
        r = s.get(f"{API}/health")
        assert r.status_code == 200
        d = r.json()
        assert d.get("status") == "healthy"


# ---------- Admin auth ----------
class TestAdminAuth:
    def test_login_ok(self, s):
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PW})
        assert r.status_code == 200, r.text
        # API normally returns success indicator
        d = r.json()
        # Server returns {"ok": True} on success
        assert (d.get("ok") or d.get("success") is True
                or d.get("status") == "ok" or "token" in d or d.get("authenticated") is True), d

    def test_login_wrong(self, s):
        r = s.post(f"{API}/admin/login", json={"password": "wrong_pw_xxx"})
        assert r.status_code == 401, r.text


# ---------- Admin reads ----------
class TestAdminReads:
    def test_stats_keys(self, s):
        r = s.get(f"{API}/admin/stats")
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("overview", "today", "keys", "conversions", "emails", "transactions", "bookings", "last_7_days"):
            assert key in d, f"missing key {key} in stats: {list(d.keys())}"
        # numeric sanity
        assert isinstance(d["overview"], dict)
        assert isinstance(d["last_7_days"], (list, dict))

    def test_users_array(self, s):
        r = s.get(f"{API}/admin/users")
        assert r.status_code == 200
        d = r.json()
        users = d.get("users")
        assert isinstance(users, list)
        if users:
            sample = users[0]
            assert "has_report" in sample
            assert "license_key" in sample

    def test_transactions_array(self, s):
        r = s.get(f"{API}/admin/transactions")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("transactions"), list)

    def test_emails_array(self, s):
        r = s.get(f"{API}/admin/emails")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("emails"), list)


# ---------- Booking ----------
class TestBooking:
    def test_create_default_plan(self, s):
        unique_email = f"TEST_iter25_book_{int(time.time())}@example.com"
        r = s.post(f"{API}/booking/create", json={
            "name": "TEST_iter25_book",
            "email": unique_email,
            "date": "2026-03-01",
            "time": "11:00",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success")
        # verify via list
        lr = s.get(f"{API}/booking/list")
        assert lr.status_code == 200
        bookings = lr.json().get("bookings", [])
        match = next((b for b in bookings if b.get("email") == unique_email), None)
        assert match is not None
        assert match.get("plan") == "leader_os_plus"

    def test_list(self, s):
        r = s.get(f"{API}/booking/list")
        assert r.status_code == 200
        assert isinstance(r.json().get("bookings"), list)


# ---------- Enterprise ----------
class TestEnterprise:
    @pytest.mark.parametrize("emp,pct", [
        (4, 0),
        (5, 10),
        (10, 15),
        (20, 20),
        (50, 30),
        (100, 40),
        (200, 50),
    ])
    def test_calc_tiers(self, s, emp, pct):
        r = s.get(f"{API}/enterprise/calculate", params={"employees": emp})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["discount_pct"] == pct, f"emp={emp} expected {pct}% got {d['discount_pct']}%"
        assert d["seats"] == emp

    def test_inquiry(self, s):
        r = s.post(f"{API}/enterprise/inquire", json={
            "company": "TEST_iter25 GmbH",
            "contact_name": "TEST_iter25",
            "email": "TEST_iter25_ent@example.com",
            "phone": "+49000",
            "employee_count": 25,
            "include_coaching": False,
            "message": "iter25 regression",
        })
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d.get("success")
        assert "pricing" in d

    def test_list(self, s):
        r = s.get(f"{API}/enterprise/list")
        assert r.status_code == 200
        assert isinstance(r.json().get("inquiries"), list)


# ---------- Payments ----------
class TestPayments:
    def _checkout(self, s, pkg):
        return s.post(f"{API}/payments/create-checkout", json={
            "package_id": pkg, "origin_url": ORIGIN,
            "email": "TEST_iter25@example.com", "user_name": "TEST_iter25",
        })

    def test_leader_os_full(self, s):
        r = self._checkout(s, "leader_os_full")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["mode"] == "payment"
        sid = d["session_id"]
        time.sleep(0.4)
        st = s.get(f"{API}/payments/status/{sid}").json()
        assert st.get("amount") == 997.0
        assert st.get("currency", "EUR").upper() == "EUR"

    def test_leader_os_2rate_fallback(self, s):
        r = self._checkout(s, "leader_os_2rate")
        assert r.status_code == 200, r.text
        d = r.json()
        sid = d["session_id"]
        time.sleep(0.4)
        st = s.get(f"{API}/payments/status/{sid}").json()
        assert st.get("amount") == 1100.0

    def test_leader_os_12rate_fallback(self, s):
        r = self._checkout(s, "leader_os_12rate")
        assert r.status_code == 200
        d = r.json()
        sid = d["session_id"]
        time.sleep(0.4)
        st = s.get(f"{API}/payments/status/{sid}").json()
        assert st.get("amount") == 1188.0

    def test_leader_os_plus(self, s):
        r = self._checkout(s, "leader_os_plus")
        assert r.status_code == 200
        d = r.json()
        sid = d["session_id"]
        time.sleep(0.4)
        st = s.get(f"{API}/payments/status/{sid}").json()
        assert st.get("amount") == 4797.0

    def test_invalid_package(self, s):
        r = self._checkout(s, "totally_unknown_xyz")
        assert r.status_code == 400


# ---------- License keys ----------
KEY_RX = re.compile(r"^WLADHUB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$")


class TestLicense:
    def test_create_leader_os(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os", "name": "TEST_iter25_K1"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("plan") == "leader_os"
        assert KEY_RX.match(d["key"]), f"key format mismatch: {d['key']}"
        assert d.get("status") == "active"

    def test_create_leader_os_plus(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os_plus", "name": "TEST_iter25_K2"})
        assert r.status_code == 200
        d = r.json()
        assert d["plan"] == "leader_os_plus"
        assert KEY_RX.match(d["key"])

    def test_create_leader_os_enterprise(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os_enterprise", "name": "TEST_iter25_K3"})
        assert r.status_code == 200
        d = r.json()
        assert d["plan"] == "leader_os_enterprise"
        assert KEY_RX.match(d["key"])

    def test_validate_then_activate_then_revoke(self, s):
        # CREATE
        cr = s.post(f"{API}/license/create", json={"plan": "leader_os", "name": "TEST_iter25_LIFE"})
        assert cr.status_code == 200
        key = cr.json()["key"]

        # VALIDATE active
        vr = s.get(f"{API}/license/validate/{key}")
        assert vr.status_code == 200
        assert vr.json().get("valid")

        # ACTIVATE — schema requires `license_key` + optional `email`
        ar = s.post(f"{API}/license/activate", json={
            "license_key": key, "email": "TEST_iter25_act@example.com",
        })
        assert ar.status_code == 200, ar.text
        assert ar.json().get("success")

        # confirm status used in list
        lr = s.get(f"{API}/license/list")
        assert lr.status_code == 200
        keys = lr.json().get("keys", [])
        match = next((k for k in keys if k.get("key") == key), None)
        assert match is not None
        assert match.get("status") == "used"

        # REVOKE
        rr = s.post(f"{API}/license/revoke/{key}")
        assert rr.status_code == 200, rr.text
        assert rr.json().get("success")

        # confirm revoked
        lr2 = s.get(f"{API}/license/list")
        m2 = next((k for k in lr2.json().get("keys", []) if k.get("key") == key), None)
        assert m2 is not None
        assert m2.get("status") == "revoked"

    def test_list(self, s):
        r = s.get(f"{API}/license/list")
        assert r.status_code == 200
        assert isinstance(r.json().get("keys"), list)


# ---------- Quiz narrative regression ----------
class TestQuizNarrative:
    def test_generate_report_with_chat_context(self, s):
        # Create user
        ur = s.post(f"{API}/user/create", json={
            "name": "TEST_iter25_quiz",
            "email": f"TEST_iter25_quiz_{int(time.time())}@example.com",
            "role": "ceo",
            "consent_privacy": True,
            "consent_marketing": False,
        })
        assert ur.status_code == 200, ur.text
        sid = ur.json()["session_id"]

        # Submit answers + chat_context (chat_context = List[{role, text}])
        cats = ["self_leadership", "communication", "decision_making", "team_dev", "vision"]
        layers = ["mindset", "behavior", "skill"]
        answers = [
            {"question_id": f"q{i}", "category": cats[i % len(cats)], "layer": layers[i % len(layers)], "score": 3}
            for i in range(1, 11)
        ]
        chat_context = [
            {"role": "user", "text": (
                "Mein größtes Problem ist, dass mein Team ständig auf Entscheidungen wartet "
                "und ich abends nicht abschalten kann. Ich will mehr Klarheit und weniger Mikromanagement."
            )},
            {"role": "assistant", "text": "Verstanden — was steht aktuell am stärksten im Weg?"},
            {"role": "user", "text": "Ich delegiere zu wenig und kontrolliere zu viel."},
        ]
        payload = {
            "session_id": sid,
            "answers": answers,
            "chat_context": chat_context,
        }
        r = s.post(f"{API}/quiz/generate-report", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        # Either nested under "report" or at root — accept both
        report = d.get("report") or d
        narrative = report.get("narrative") or d.get("narrative") or {}
        # personal_response in narrative
        assert "personal_response" in narrative or "personal_response" in d, f"narrative keys: {list(narrative.keys())}"
        # user_challenge somewhere in report
        assert "user_challenge" in report or "user_challenge" in d, f"top keys: {list(d.keys())}"

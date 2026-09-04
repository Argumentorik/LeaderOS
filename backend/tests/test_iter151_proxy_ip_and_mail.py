"""Iter 151: Client-IP nur vom vertrauenswürdigen Proxy-Hop + Bestätigungs-Mail nach „Das war ich nicht“."""
import os
import sys
from types import SimpleNamespace

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")
from services_login_security import get_client_ip, _format_not_me_email_html  # noqa: E402

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _req(headers: dict, host: str = "10.0.0.1"):
    return SimpleNamespace(headers={k.lower(): v for k, v in headers.items()}, client=SimpleNamespace(host=host))


def test_ip_rightmost_hop_default(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_HOPS", "1")
    monkeypatch.delenv("TRUST_CF_CONNECTING_IP", raising=False)
    assert get_client_ip(_req({"X-Forwarded-For": "6.6.6.6, 203.0.113.5"})) == "203.0.113.5"
    assert get_client_ip(_req({"X-Forwarded-For": "6.6.6.6"})) == "6.6.6.6"
    assert get_client_ip(_req({})) == "10.0.0.1"


def test_ip_multi_hop_and_short_chain_falls_back(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_HOPS", "3")
    assert get_client_ip(_req({"X-Forwarded-For": "6.6.6.6, 1.1.1.1, 172.71.1.1, 35.186.1.1"})) == "1.1.1.1"
    # zu kurze Kette (weniger Einträge als Hops) -> Verbindungs-IP, nie ein Client-Wert
    assert get_client_ip(_req({"X-Forwarded-For": "6.6.6.6, 7.7.7.7"})) == "10.0.0.1"


def test_cf_header_ignored_unless_enabled(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_HOPS", "1")
    monkeypatch.setenv("TRUST_CF_CONNECTING_IP", "false")
    assert get_client_ip(_req({"CF-Connecting-IP": "7.7.7.7", "X-Forwarded-For": "1.1.1.1, 2.2.2.2"})) == "2.2.2.2"
    monkeypatch.setenv("TRUST_CF_CONNECTING_IP", "true")
    assert get_client_ip(_req({"CF-Connecting-IP": "7.7.7.7", "X-Forwarded-For": "1.1.1.1, 2.2.2.2"})) == "7.7.7.7"


def test_spoofed_xff_not_recorded_end_to_end():
    egress = requests.get("https://api.ipify.org", timeout=15).text.strip()
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": "free@wladbot.test", "password": "test123"},
               headers={"X-Forwarded-For": "6.6.6.6, 8.8.8.8"}, timeout=30)
    assert r.status_code == 200, r.text
    ov = s.get(f"{API}/api/auth/security/overview", timeout=30).json()
    recorded = ov["login_history"][0]["ip"]
    assert recorded not in ("6.6.6.6", "8.8.8.8")
    assert recorded == egress


def test_not_me_returns_email_target_and_html_renders():
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": "free@wladbot.test", "password": "test123"}, timeout=30)
    assert r.status_code == 200
    r = s.post(f"{API}/api/auth/security/not-me", timeout=30)
    assert r.status_code == 200
    assert r.json()["email_sent_to"] == "free@wladbot.test"
    assert s.get(f"{API}/api/auth/me", timeout=30).status_code == 200

    html = _format_not_me_email_html(
        "Felix",
        [{"created_at": "2026-09-04T10:00:00+00:00", "ip": "203.0.113.9", "method": "email"}],
        [{"browser": "Firefox", "os": "Windows", "city": "Lagos", "country_code": "NG", "ip": "203.0.113.9", "at": "2026-09-04T09:00:00+00:00"}],
        "04.09.2026 · 10:30 UTC",
    )
    assert "Lagos, NG" in html and "203.0.113.9" in html
    assert "/profile?tab=account&amp;focus=password" in html
    assert "1 andere Sitzung" in html
    # XSS-Schutz in der Mail
    html2 = _format_not_me_email_html("<script>x</script>", [], [], "now")
    assert "<script>" not in html2 and "&lt;script&gt;" in html2

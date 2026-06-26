"""
Iter31: Pre-go-live verification tests
- Health, admin auth (JWT), admin endpoints
- Stripe checkout creation for leader_os_full & leader_os_plus
- Static SEO assets: robots.txt, sitemap.xml, manifest.json
"""
import os
import json
import xml.etree.ElementTree as ET
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://role-assessment-lab.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "wladhub2026")


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("ok") is True
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    return data["token"]


# ---- Health ----
def test_health_200():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200


# ---- Admin auth ----
def test_admin_login_wrong_password():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_admin_login_correct(admin_token):
    assert admin_token


def test_admin_stats_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/stats", timeout=15)
    assert r.status_code == 401


def test_admin_stats_with_token(admin_token):
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)


def test_admin_users_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/users", timeout=15)
    assert r.status_code == 401


def test_admin_users_with_token(admin_token):
    r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "users" in data
    assert isinstance(data["users"], list)


def test_admin_fake_token_401():
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": "Bearer fake.token.value"}, timeout=15)
    assert r.status_code == 401


# ---- Payments ----
def test_create_checkout_leader_os_full():
    r = requests.post(
        f"{BASE_URL}/api/payments/create-checkout",
        json={"package_id": "leader_os_full", "origin_url": "https://leadercheck.de"},
        timeout=30,
    )
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
    data = r.json()
    assert "url" in data or "checkout_url" in data
    url = data.get("url") or data.get("checkout_url")
    assert isinstance(url, str) and url.startswith("http")


def test_create_checkout_leader_os_plus():
    r = requests.post(
        f"{BASE_URL}/api/payments/create-checkout",
        json={"package_id": "leader_os_plus", "origin_url": "https://leadercheck.de"},
        timeout=30,
    )
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
    data = r.json()
    url = data.get("url") or data.get("checkout_url")
    assert isinstance(url, str) and url.startswith("http")


# ---- Static SEO assets (served from frontend) ----
FRONTEND_URL = BASE_URL  # same host via ingress

def test_robots_txt():
    r = requests.get(f"{FRONTEND_URL}/robots.txt", timeout=15)
    assert r.status_code == 200
    body = r.text
    assert "GPTBot" in body
    assert "ClaudeBot" in body
    assert "PerplexityBot" in body
    assert "Sitemap:" in body
    assert "leadercheck.de/sitemap.xml" in body


def test_sitemap_xml_valid():
    r = requests.get(f"{FRONTEND_URL}/sitemap.xml", timeout=15)
    assert r.status_code == 200
    # validate XML
    root = ET.fromstring(r.content)
    assert root.tag.endswith("urlset")
    locs = [el.text for el in root.iter() if el.tag.endswith("loc")]
    assert any("leadercheck.de/" in l for l in locs)
    assert any("/diagnose" in l for l in locs)
    assert any("/quiz" in l for l in locs)
    assert any("/close" in l for l in locs)
    assert any("/login" in l for l in locs)


def test_manifest_json_valid():
    r = requests.get(f"{FRONTEND_URL}/manifest.json", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("theme_color") == "#0a0a0a"
    assert data.get("lang") == "de-DE"
    assert data.get("short_name") == "Leader-Check"


def test_index_html_no_emergent_in_meta():
    r = requests.get(f"{FRONTEND_URL}/", timeout=15)
    assert r.status_code == 200
    html = r.text
    # the served index.html (root) should not contain "Emergent" string in meta region.
    # Note: posthog initialisation may not contain "Emergent"; the badge script was removed.
    # Verify the <head> region only:
    head_end = html.lower().find("</head>")
    assert head_end > 0
    head_region = html[:head_end]
    assert "Emergent" not in head_region, "Found 'Emergent' string in <head> region"
    assert "Leader-Check" in head_region
    assert "Kostenlose KI-Leadership-Diagnose" in head_region


def test_index_html_jsonld_valid():
    r = requests.get(f"{FRONTEND_URL}/", timeout=15)
    html = r.text
    # extract first application/ld+json block
    import re
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    assert m, "No JSON-LD script tag found"
    payload = json.loads(m.group(1))
    assert "@graph" in payload
    types = [n.get("@type") for n in payload["@graph"]]
    for required in ["Organization", "Person", "WebSite", "WebApplication", "Service", "FAQPage", "HowTo"]:
        assert required in types, f"Missing @type {required} in JSON-LD"

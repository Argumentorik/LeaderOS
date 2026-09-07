"""Iter 162 — Voyage-Cleanup, RAG-Konsistenz-Check, SEO/AEO-Seiten, Bulk-Import-Backend."""
import json
import os
import re
import subprocess
import sys

import pytest
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
BASE = os.environ.get("REACT_APP_BACKEND_URL") or "http://localhost:8001"
PUBLIC = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public")


def test_rag_status_reports_single_local_provider_and_consistency():
    r = requests.get(f"{BASE}/api/rag-status", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["provider"] == "local"
    assert d["dim"] == 384
    assert d["chunks"] > 7000
    assert d["store_dim"] == 384
    assert d["consistent"] is True


def test_no_external_embedding_provider_left_in_operative_code():
    root = os.path.join(os.path.dirname(__file__), "..")
    hits = subprocess.run(
        ["grep", "-rli", "voyage", root, "--include=*.py", "--exclude-dir=tests", "--exclude=scripts_send_*"],
        capture_output=True, text=True,
    ).stdout.strip()
    assert hits == "", hits
    env_example = open(os.path.join(root, ".env.example"), encoding="utf-8").read()
    assert "VOYAGE" not in env_example.upper()


@pytest.mark.parametrize("page", ["fragen", "wlad-jachtchenko", "kurse-uebersicht"])
def test_static_seo_pages_have_schema_matching_visible_text(page):
    html = open(os.path.join(PUBLIC, page, "index.html"), encoding="utf-8").read()
    assert f'rel="canonical" href="https://leaderos.de/{page}/"' in html
    for lang in ("de-DE", "de-AT", "de-CH", "x-default"):
        assert f'hreflang="{lang}"' in html
    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
    types = {n["@type"] for n in ld["@graph"]}
    assert {"Organization", "Person", "BreadcrumbList"} <= types
    faq = [n for n in ld["@graph"] if n["@type"] == "FAQPage"]
    if faq:
        for q in faq[0]["mainEntity"]:
            assert q["name"] in html.replace("&amp;", "&")
    assert "utm_source=seo" in html
    assert "noindex" in html  # preview guard script


def test_course_overview_lists_all_courses():
    from course_content import COURSES
    html = open(os.path.join(PUBLIC, "kurse-uebersicht", "index.html"), encoding="utf-8").read()
    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
    courses = [n for n in ld["@graph"] if n["@type"] == "Course"]
    assert len(courses) == len(COURSES)
    for c in COURSES:
        assert f'id="{c["slug"]}"' in html


def test_sitemap_robots_llms_consistent():
    sm = open(os.path.join(PUBLIC, "sitemap.xml"), encoding="utf-8").read()
    robots = open(os.path.join(PUBLIC, "robots.txt"), encoding="utf-8").read()
    llms = open(os.path.join(PUBLIC, "llms.txt"), encoding="utf-8").read()
    for p in ("/fragen/", "/wlad-jachtchenko/", "/kurse-uebersicht/"):
        assert f"https://leaderos.de{p}" in sm
        assert f"Allow: {p}" in robots
        assert f"https://leaderos.de{p}" in llms
    assert 'hreflang="de-AT"' in sm
    assert "Crawl-delay:" not in robots
    assert "voyage" not in llms.lower()
    assert "SEXIER" in llms and "10 Stufen des Zuhörens" in llms


def test_index_shell_has_no_page_specific_schema():
    html = open(os.path.join(PUBLIC, "index.html"), encoding="utf-8").read()
    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
    types = {n["@type"] for n in ld["@graph"]}
    assert "FAQPage" not in types and "HowTo" not in types
    assert "SearchAction" not in html
    assert 'hreflang="de-CH"' in html
    assert "google-site-verification" in html


def _admin_token():
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json().get("token") or r.json().get("access_token")


def test_admin_local_status_exposes_dim_check_and_bulk_upload_roundtrip():
    tok = _admin_token()
    h = {"Authorization": f"Bearer {tok}"}
    st = requests.get(f"{BASE}/api/admin/rag/local-status", headers=h, timeout=60).json()
    assert st["dim_ok"] is True and st["store_dim"] == 384
    files = {"a": ("iter162_bulk_a.md", "# Test A\n" + "Delegation heißt Verantwortung übergeben, nicht Aufgaben abwerfen. " * 6), "b": ("iter162_bulk_b.txt", "Feedback nach der Formel Beobachtung, Wirkung, Wunsch. " * 6)}
    for _, (name, body) in files.items():
        r = requests.post(f"{BASE}/api/admin/rag/upload-knowledge-file", headers=h, files={"file": (name, body.encode())}, data={"course_title": name}, timeout=120)
        assert r.status_code == 200, r.text
        assert r.json()["chunks_added"] >= 1
    srcs = requests.get(f"{BASE}/api/admin/rag/sources", headers=h, timeout=60).json()
    custom = {s["source_file"] for s in srcs["categorised"]["custom"]}
    assert {"iter162_bulk_a.txt", "iter162_bulk_b.txt"} <= custom
    for sf in ("iter162_bulk_a.txt", "iter162_bulk_b.txt"):
        assert requests.delete(f"{BASE}/api/admin/rag/source/{sf}", headers=h, timeout=60).status_code == 200

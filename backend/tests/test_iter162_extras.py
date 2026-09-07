"""Iter 162 extras — file upload edge cases + regression endpoints."""
import io
import os
import re
import requests

# Load frontend URL from env file if not set
if not os.environ.get("REACT_APP_BACKEND_URL"):
    _env_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env")
    try:
        with open(_env_path) as _f:
            for _line in _f:
                if _line.startswith("REACT_APP_BACKEND_URL="):
                    os.environ["REACT_APP_BACKEND_URL"] = _line.split("=", 1)[1].strip()
                    break
    except FileNotFoundError:
        pass

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
_UA = {"User-Agent": "iter162-tests/1.0"}


def _login(identifier="test@test.com", password="test123"):
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": identifier, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def test_health():
    r = requests.get(f"{BASE}/api/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") in ("ok", "healthy", True) or "ok" in str(r.json()).lower()


def test_admin_local_rag_status():
    token = _login()
    r = requests.get(f"{BASE}/api/admin/rag/local-status", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("dim_ok") is True
    assert d.get("store_dim") == 384
    assert d.get("engine", {}).get("provider") == "local"


def test_upload_rejects_exe_extension():
    token = _login()
    hdr = {"Authorization": f"Bearer {token}"}
    files = {"file": ("evil.exe", io.BytesIO(b"MZ" + b"a" * 200), "application/octet-stream")}
    data = {"course_title": "TEST_iter162_extras"}
    r = requests.post(f"{BASE}/api/admin/rag/upload-knowledge-file", headers=hdr, files=files, data=data, timeout=30)
    assert r.status_code == 422, f"Expected 422 got {r.status_code}: {r.text}"


def test_upload_rejects_oversize():
    token = _login()
    hdr = {"Authorization": f"Bearer {token}"}
    big = b"a" * (2 * 1024 * 1024 + 100)  # > 2MB
    files = {"file": ("big.txt", io.BytesIO(big), "text/plain")}
    data = {"course_title": "TEST_iter162_extras"}
    r = requests.post(f"{BASE}/api/admin/rag/upload-knowledge-file", headers=hdr, files=files, data=data, timeout=60)
    assert r.status_code == 413, f"Expected 413 got {r.status_code}: {r.text[:200]}"


def test_upload_md_txt_and_delete_cleanup():
    token = _login()
    hdr = {"Authorization": f"Bearer {token}"}
    created = []
    for name, content in [
        ("TEST_iter162_a.md", "# TEST Iter162 A\n\nDies ist ein Test-Wissenstext mit ausreichender Länge für RAG-Chunking."),
        ("TEST_iter162_b.txt", "Führung ist eine Praxis, kein Titel. TEST iter162 b content for embedding purposes and chunk count."),
    ]:
        files = {"file": (name, io.BytesIO(content.encode("utf-8")), "text/plain")}
        data = {"course_title": "TEST_iter162_extras"}
        r = requests.post(f"{BASE}/api/admin/rag/upload-knowledge-file", headers=hdr, files=files, data=data, timeout=60)
        assert r.status_code == 200, f"{name}: {r.status_code} {r.text}"
        j = r.json()
        assert j.get("chunks_added", 0) >= 1
        created.append(j.get("source_file") or name.replace(".md", ".txt"))

    # list
    r = requests.get(f"{BASE}/api/admin/rag/sources", headers=hdr, timeout=30)
    assert r.status_code == 200
    listing = r.json()
    custom_files = set()
    cat = listing.get("categorised", {}).get("custom") or listing.get("custom") or []
    for entry in cat:
        if isinstance(entry, dict):
            custom_files.add(entry.get("source_file") or entry.get("file") or entry.get("name"))
        else:
            custom_files.add(entry)
    for c in created:
        assert c in custom_files, f"{c} not in {custom_files}"

    # cleanup
    for c in created:
        r = requests.delete(f"{BASE}/api/admin/rag/source/{c}", headers=hdr, timeout=30)
        assert r.status_code in (200, 204), f"delete {c}: {r.status_code} {r.text}"


def test_golden_check_pass():
    token = _login()
    hdr = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/api/admin/rag/golden-check", headers=hdr, timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    status = str(d.get("status", "")).upper()
    # Report failing questions if not PASS
    assert status == "PASS", f"golden-check status={status}: {d}"


def test_public_seo_pages_served_static():
    for slug in ("fragen", "wlad-jachtchenko", "kurse-uebersicht"):
        r = requests.get(f"{BASE}/{slug}/", timeout=30, headers=_UA)
        assert r.status_code == 200, f"{slug}: {r.status_code}"
        html = r.text
        assert f'href="https://leaderos.de/{slug}/"' in html
        assert 'application/ld+json' in html
        assert '<title>' in html


def test_robots_and_sitemap_and_llms():
    r = requests.get(f"{BASE}/robots.txt", timeout=15, headers=_UA)
    assert r.status_code == 200
    body = r.text
    assert "Disallow: /api/" in body
    assert "Disallow: /dashboard" in body
    assert "Crawl-delay:" not in body
    for slug in ("/fragen/", "/wlad-jachtchenko/", "/kurse-uebersicht/"):
        assert slug in body, f"{slug} missing in robots"

    r = requests.get(f"{BASE}/sitemap.xml", timeout=15, headers=_UA)
    assert r.status_code == 200
    sm = r.text
    for slug in ("fragen", "wlad-jachtchenko", "kurse-uebersicht"):
        assert f"https://leaderos.de/{slug}/" in sm
    assert 'hreflang="de-AT"' in sm

    r = requests.get(f"{BASE}/llms.txt", timeout=15, headers=_UA)
    assert r.status_code == 200
    assert "SEXIER" in r.text
    assert "Voyage" not in r.text

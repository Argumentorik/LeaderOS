"""Iter 160: Admin knowledge file upload + Credits transparency.

Covers:
- POST /api/admin/rag/upload-knowledge-file (.txt happy path)
- GET /api/admin/rag/sources contains uploaded file
- DELETE /api/admin/rag/source/{name}
- .pdf upload happy path (reportlab-generated)
- 3 MB oversize → 413
- wrong extension (.exe / .jpg) → 422
- non-admin upload → 403
- GET /api/credits (free user) returns costs/used_by_action/recent/limit
"""
import io
import os
import sys
from pathlib import Path

import pytest
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Read API URL from frontend/.env
_env = Path("/app/frontend/.env").read_text()
API = [ln for ln in _env.splitlines() if ln.startswith("REACT_APP_BACKEND_URL=")][0].split("=", 1)[1].strip()

ADMIN_EMAIL = "test@test.com"
FREE_EMAIL = "free@wladbot.test"
PW = "test123"

UPLOAD_TXT = "qa_upload_test.txt"
UPLOAD_PDF_NAME = "qa_upload_test_pdf.pdf"


def _login(email, password=PW):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text[:200]}"
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN_EMAIL)


@pytest.fixture(scope="module")
def free_user():
    return _login(FREE_EMAIL)


def _german_text(min_chars: int = 240) -> str:
    base = (
        "Diese Testdatei enthält deutschsprachigen Text für den QA-Upload. "
        "Sie beschreibt beispielhaft Führung, Rhetorik und Präsentationstechniken. "
        "Ziel ist eine ausreichende Länge, damit die Chunking-Logik mindestens einen "
        "sinnvollen Chunk erzeugt und die Einbettung erfolgreich durchläuft. "
    )
    while len(base) < min_chars:
        base += base
    return base


# ── 1. .txt Upload happy path ────────────────────────────────────────────────
def test_upload_txt_success(admin):
    content = _german_text(300).encode("utf-8")
    files = {"file": (UPLOAD_TXT, io.BytesIO(content), "text/plain")}
    data = {"course_title": "QA Upload Test"}
    r = admin.post(f"{API}/api/admin/rag/upload-knowledge-file", files=files, data=data, timeout=60)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    body = r.json()
    assert body["source_file"] == UPLOAD_TXT
    assert body["chunks_added"] >= 1
    assert body["chars"] >= 200


def test_sources_contains_upload(admin):
    r = admin.get(f"{API}/api/admin/rag/sources", timeout=30)
    assert r.status_code == 200
    names = [s["source_file"] for s in r.json().get("sources", [])]
    assert UPLOAD_TXT in names, f"{UPLOAD_TXT} not in sources: {names[:20]}"


def test_delete_txt_source(admin):
    r = admin.delete(f"{API}/api/admin/rag/source/{UPLOAD_TXT}", timeout=30)
    assert r.status_code == 200, r.text
    assert r.json().get("deleted_chunks", 0) >= 1


# ── 2. .pdf upload happy path ────────────────────────────────────────────────
def _make_pdf_bytes() -> bytes:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    txt = _german_text(400)
    y = 800
    for chunk in [txt[i:i + 90] for i in range(0, len(txt), 90)]:
        c.drawString(40, y, chunk)
        y -= 14
        if y < 40:
            c.showPage(); y = 800
    c.save()
    return buf.getvalue()


def test_upload_pdf_success_then_delete(admin):
    pdf = _make_pdf_bytes()
    assert len(pdf) < 500_000
    files = {"file": (UPLOAD_PDF_NAME, io.BytesIO(pdf), "application/pdf")}
    r = admin.post(f"{API}/api/admin/rag/upload-knowledge-file",
                   files=files, data={"course_title": "QA PDF Upload"}, timeout=90)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    body = r.json()
    # normalized filename: pdf → .txt after ingest
    src = body["source_file"]
    assert src.endswith(".txt")
    assert body["chunks_added"] >= 1
    # cleanup
    d = admin.delete(f"{API}/api/admin/rag/source/{src}", timeout=30)
    assert d.status_code == 200


# ── 3. Oversize (>2 MB) → 413 ────────────────────────────────────────────────
def test_upload_oversize_413(admin):
    big = b"a" * (3 * 1024 * 1024)
    files = {"file": ("qa_big.txt", io.BytesIO(big), "text/plain")}
    r = admin.post(f"{API}/api/admin/rag/upload-knowledge-file", files=files, data={"course_title": ""}, timeout=60)
    assert r.status_code == 413, f"expected 413, got {r.status_code}: {r.text[:200]}"


# ── 4. Wrong extension → 422 ─────────────────────────────────────────────────
@pytest.mark.parametrize("fname,ctype", [("qa_bad.exe", "application/octet-stream"), ("qa_bad.jpg", "image/jpeg")])
def test_upload_bad_extension_422(admin, fname, ctype):
    files = {"file": (fname, io.BytesIO(b"whatever bytes"), ctype)}
    r = admin.post(f"{API}/api/admin/rag/upload-knowledge-file", files=files, data={"course_title": ""}, timeout=30)
    assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text[:200]}"


# ── 5. Non-admin → 403 ───────────────────────────────────────────────────────
def test_upload_non_admin_403(free_user):
    content = _german_text(300).encode("utf-8")
    files = {"file": ("qa_free_upload.txt", io.BytesIO(content), "text/plain")}
    r = free_user.post(f"{API}/api/admin/rag/upload-knowledge-file", files=files, data={"course_title": ""}, timeout=30)
    assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text[:200]}"


# ── 6. Credits transparency ──────────────────────────────────────────────────
def test_credits_transparency_fields(free_user):
    r = free_user.get(f"{API}/api/credits", timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "costs" in body and isinstance(body["costs"], dict)
    assert "used_by_action" in body and isinstance(body["used_by_action"], dict)
    assert "recent" in body and isinstance(body["recent"], list)
    assert len(body["recent"]) <= 8
    assert "limit" in body
    # recent entries have action/cost/at (only when non-empty)
    for h in body["recent"]:
        assert "action" in h and "cost" in h and "at" in h

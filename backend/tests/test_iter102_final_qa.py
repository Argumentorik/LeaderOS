"""Iter 102 — Final pre-deployment QA backend smoke."""
import os
import asyncio
import requests
import pytest
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def test_auth_providers(s):
    r = s.get(f"{BASE_URL}/api/auth/providers", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert bool(data.get("google") or data.get("google_client_id")) is True


def test_challengers_returns_8(s):
    r = s.get(f"{BASE_URL}/api/challengers", timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("challengers", d.get("items", []))
    assert len(items) == 8, f"expected 8, got {len(items)}"


def test_tools_list(s):
    r = s.get(f"{BASE_URL}/api/tools", timeout=15)
    assert r.status_code == 200


def test_license_invalid_key(s):
    r = s.post(f"{BASE_URL}/api/auth/license/activate",
               json={"license_key": "INVALID-KEY-XXXX-XXXX", "email": "x@y.com", "password": "Testpass2026x"},
               timeout=15)
    assert r.status_code in (400, 404, 422), r.status_code


def _login(s, ident, pw):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"identifier": ident, "password": pw}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def test_my_path_videos_authenticated(s):
    data = _login(s, "accelerator@wladbot.test", "test123")
    tok = data.get("token") or data.get("access_token")
    h = {"Authorization": f"Bearer {tok}"} if tok else {}
    r = s.get(f"{BASE_URL}/api/my-path/videos", headers=h, timeout=15)
    assert r.status_code == 200


def test_magic_link_e2e(s):
    """Request magic link, read token from DB, verify."""
    email = "test@test.com"
    r = s.post(f"{BASE_URL}/api/auth/magic-link/request", json={"email": email}, timeout=15)
    assert r.status_code == 200

    async def fetch_token():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        # Latest record for that email
        doc = await db.magic_links.find_one({"email": email}, sort=[("created_at", -1)])
        client.close()
        return doc

    doc = asyncio.get_event_loop().run_until_complete(fetch_token())
    assert doc is not None, "magic-link record not created"
    # Token is stored hashed as _id -> we cannot get raw token from DB.
    # Instead, generate token directly by calling create_token from backend service.


def test_magic_link_verify_via_service():
    """Because raw token is never stored, generate one via the service and verify via HTTP."""
    import sys
    sys.path.insert(0, "/app/backend")
    from services_magic_link import create_token

    async def gen():
        return await create_token("test@test.com", "127.0.0.1")

    tok = asyncio.get_event_loop().run_until_complete(gen())
    assert tok, "token gen failed"

    r = requests.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": tok}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "user" in d
    assert d["user"].get("email") == "test@test.com"

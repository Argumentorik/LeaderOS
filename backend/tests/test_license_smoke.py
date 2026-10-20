"""Quick smoke test for license-key backend endpoints (iter 99)."""
import os
import uuid
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if "REACT_APP_BACKEND_URL" in os.environ else "https://command-center-229.preview.emergentagent.com"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_admin_list_keys(admin_headers):
    r = requests.get(f"{BASE}/api/admin/license-keys", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "keys" in data and "counts" in data


def test_non_admin_forbidden():
    # Login as non-admin
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": "free@wladbot.test", "password": "test123"}, timeout=15)
    if r.status_code != 200:
        pytest.skip("Non-admin login unavailable")
    tok = r.json()["token"]
    r2 = requests.get(f"{BASE}/api/admin/license-keys", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r2.status_code in (401, 403), r2.status_code


@pytest.fixture(scope="module")
def generated_key(admin_headers):
    r = requests.post(
        f"{BASE}/api/admin/license-keys/generate",
        headers=admin_headers,
        json={"package_id": "leadership_os", "count": 1, "note": "smoke-test-iter99"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["keys"]) == 1
    return data["keys"][0]


def test_generate_key_format(generated_key):
    parts = generated_key.split("-")
    assert len(parts) == 4 and all(len(p) == 4 for p in parts)


def test_generate_invalid_package(admin_headers):
    r = requests.post(
        f"{BASE}/api/admin/license-keys/generate",
        headers=admin_headers,
        json={"package_id": "not_a_package", "count": 1},
        timeout=15,
    )
    assert r.status_code == 400


def test_activate_unknown_key():
    r = requests.post(
        f"{BASE}/api/auth/license/activate",
        json={"license_key": "AAAA-BBBB-CCCC-DDDD", "email": f"noexist-{uuid.uuid4().hex[:6]}@test.com", "password": "Testpass2026x", "name": "X"},
        timeout=15,
    )
    assert r.status_code == 404, r.text


def test_activate_and_double_redeem(generated_key):
    email = f"lictest-{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(
        f"{BASE}/api/auth/license/activate",
        json={"license_key": generated_key, "email": email, "password": "Testpass2026x", "name": "License Smoke"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("token")
    assert data.get("user", {}).get("email") == email
    assert data.get("account_created") is True

    # Double redemption should fail
    r2 = requests.post(
        f"{BASE}/api/auth/license/activate",
        json={"license_key": generated_key, "email": f"other-{uuid.uuid4().hex[:6]}@test.com", "password": "Testpass2026x", "name": "X"},
        timeout=15,
    )
    assert r2.status_code == 400, r2.text


def test_revoke_active_key(admin_headers):
    # Generate a fresh key
    r = requests.post(
        f"{BASE}/api/admin/license-keys/generate",
        headers=admin_headers,
        json={"package_id": "leadership_os", "count": 1, "note": "revoke-smoke"},
        timeout=15,
    )
    plain = r.json()["keys"][0]

    # Find its key_id from list
    lst = requests.get(f"{BASE}/api/admin/license-keys?status=active", headers=admin_headers, timeout=15).json()
    # find by masked
    normalized = plain.replace("-", "")
    mask = f"{normalized[:4]}-····-····-{normalized[-4:]}"
    match = next((k for k in lst["keys"] if k["key_masked"] == mask), None)
    assert match, "Generated key not found in list"

    rr = requests.post(f"{BASE}/api/admin/license-keys/{match['key_id']}/revoke", headers=admin_headers, timeout=15)
    assert rr.status_code == 200

    # Second revoke should 404
    rr2 = requests.post(f"{BASE}/api/admin/license-keys/{match['key_id']}/revoke", headers=admin_headers, timeout=15)
    assert rr2.status_code == 404

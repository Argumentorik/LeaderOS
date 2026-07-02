"""Iter 92.45 — Backend tests: onboarding heard_from marketing attribution."""
import os
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env", override=False)

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read directly from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

EMAIL = "accelerator@wladbot.test"
PASSWORD = os.environ.get("E2E_TEST_PASSWORD", "test123")  # seeded test account


@pytest.fixture(scope="module")
def token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


# --- POST /api/wladhub/onboarding with heard_from field ---

def test_onboarding_with_heard_from_linkedin(headers, db):
    r = requests.post(
        f"{BASE_URL}/api/wladhub/onboarding",
        json={"role": "c-level", "primary_goal": "communication", "heard_from": "linkedin"},
        headers=headers,
        timeout=15,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("xp_earned") == 5
    assert "message" in data

    # Verify persistence in MongoDB
    user = db.users.find_one({"email": EMAIL})
    assert user is not None
    assert user.get("heard_from") == "linkedin"
    assert user.get("role") == "c-level"
    assert user.get("primary_goal") == "communication"


# --- POST without heard_from → 200 (Optional) ---

def test_onboarding_without_heard_from(headers, db):
    r = requests.post(
        f"{BASE_URL}/api/wladhub/onboarding",
        json={"role": "manager", "primary_goal": "strategy"},
        headers=headers,
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("xp_earned") == 5

    # heard_from should remain unchanged (previously set to linkedin), not overwritten
    user = db.users.find_one({"email": EMAIL})
    assert user.get("role") == "manager"


# --- record_user_action metadata contains heard_from ---

def test_user_actions_metadata_includes_heard_from(headers, db):
    # Post with a distinct heard_from value to identify our action
    r = requests.post(
        f"{BASE_URL}/api/wladhub/onboarding",
        json={"role": "director", "primary_goal": "delegation", "heard_from": "youtube"},
        headers=headers,
        timeout=15,
    )
    assert r.status_code == 200

    user = db.users.find_one({"email": EMAIL})
    assert user.get("heard_from") == "youtube"

    # Find latest onboarding_completed action for this user (collection: activity_log)
    action = db.activity_log.find_one(
        {"user_id": user["user_id"], "action": "onboarding_completed"},
        sort=[("timestamp", -1)],
    )
    assert action is not None, "No onboarding_completed action recorded in activity_log"
    meta = action.get("metadata", {})
    assert meta.get("heard_from") == "youtube", f"metadata: {meta}"
    assert meta.get("goal") == "delegation"


# --- Optional field validation: various valid sources ---

@pytest.mark.parametrize("src", [
    "instagram", "google", "podcast", "friend", "wlad_book",
    "leadercheck", "event", "tiktok", "chatgpt", "other",
])
def test_onboarding_accepts_all_heard_sources(headers, db, src):
    r = requests.post(
        f"{BASE_URL}/api/wladhub/onboarding",
        json={"role": "team-lead", "primary_goal": "communication", "heard_from": src},
        headers=headers,
        timeout=15,
    )
    assert r.status_code == 200, r.text
    user = db.users.find_one({"email": EMAIL})
    assert user.get("heard_from") == src


# --- Unauth request should fail ---

def test_onboarding_unauth():
    r = requests.post(
        f"{BASE_URL}/api/wladhub/onboarding",
        json={"role": "c-level", "heard_from": "linkedin"},
        timeout=15,
    )
    assert r.status_code in (401, 403), r.text

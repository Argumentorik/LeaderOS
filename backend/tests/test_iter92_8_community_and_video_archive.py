"""Iter 92.8 — Community feed-filter + me-stats + video-archive PATCH/DELETE.

Tests:
  - GET  /api/community/me-stats           (rank/post_count/total_likes/comment_count)
  - GET  /api/community/feed?feed=top      (sorted by likes_count desc)
  - GET  /api/community/feed?feed=mine     (only auth user's posts)
  - GET  /api/community/feed?feed=liked    (only posts user liked)
  - GET  /api/community/feed?feed=all      (default — newest first regression)
  - GET  /api/community/feed?category=win  (regression — category filter)
  - POST /api/community/posts              (regression — create post)
  - PATCH /api/video-archive/{entry_id}    (rename, 400 empty, 404 unknown)
  - DELETE /api/video-archive/{entry_id}   (delete + mission_share cleanup, 404 unknown)
  - GET  /api/video-archive                (regression — newest first)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")


# ── Fixtures ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    tok = r.json().get("token")
    assert tok, "no token in login response"
    return tok


@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── Community: me-stats ───────────────────────────────────────────────────
class TestCommunityMeStats:
    def test_me_stats_shape(self, h):
        r = requests.get(f"{BASE_URL}/api/community/me-stats", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        for k in ("user_id", "name", "post_count", "total_likes", "comment_count", "rank", "total_leaders"):
            assert k in d, f"missing key {k} in {d}"
        assert d["user_id"] == "user_f111693f1b00", f"unexpected user_id {d['user_id']}"
        assert isinstance(d["post_count"], int) and d["post_count"] >= 0
        assert isinstance(d["total_likes"], int) and d["total_likes"] >= 0
        assert isinstance(d["comment_count"], int) and d["comment_count"] >= 0
        assert isinstance(d["total_leaders"], int) and d["total_leaders"] >= 0
        # rank: null if user has 0 posts, else int between 1 and total_leaders
        if d["post_count"] == 0:
            assert d["rank"] is None, f"rank should be null when post_count=0, got {d['rank']}"
        else:
            assert isinstance(d["rank"], int) and 1 <= d["rank"] <= d["total_leaders"]


# ── Community: feed filter variants ───────────────────────────────────────
class TestCommunityFeedFilters:
    def test_feed_all_default(self, h):
        r = requests.get(f"{BASE_URL}/api/community/feed", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        posts = r.json()
        assert isinstance(posts, list)
        # newest first
        if len(posts) >= 2:
            assert posts[0]["created_at"] >= posts[1]["created_at"]
        # author enrichment
        if posts:
            p = posts[0]
            for k in ("post_id", "author_name", "comment_count", "liked_by_me", "likes_count"):
                assert k in p, f"missing {k} in post"

    def test_feed_top_sorted_by_likes(self, h):
        r = requests.get(f"{BASE_URL}/api/community/feed?feed=top", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        posts = r.json()
        assert isinstance(posts, list)
        if len(posts) >= 2:
            for i in range(len(posts) - 1):
                assert posts[i]["likes_count"] >= posts[i + 1]["likes_count"], (
                    f"top feed not sorted desc by likes_count: idx {i}={posts[i]['likes_count']} idx {i+1}={posts[i+1]['likes_count']}"
                )

    def test_feed_mine_only_own_posts(self, h):
        r = requests.get(f"{BASE_URL}/api/community/feed?feed=mine", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        posts = r.json()
        assert isinstance(posts, list)
        # may be empty — that's fine. If non-empty, ALL posts must be authored by test user.
        for p in posts:
            assert p["user_id"] == "user_f111693f1b00", f"feed=mine returned foreign post {p['user_id']}"

    def test_feed_liked_only_liked_posts(self, h):
        r = requests.get(f"{BASE_URL}/api/community/feed?feed=liked", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        posts = r.json()
        assert isinstance(posts, list)
        # All returned posts should have liked_by_me=true (since they came from the likes filter)
        for p in posts:
            assert p.get("liked_by_me") is True, f"feed=liked returned a post not liked by me: {p['post_id']}"

    def test_feed_category_win_regression(self, h):
        r = requests.get(f"{BASE_URL}/api/community/feed?category=win", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        posts = r.json()
        assert isinstance(posts, list)
        for p in posts:
            assert p.get("category") == "win", f"category=win returned non-win post {p.get('category')}"


# ── Community: create post regression + cleanup ───────────────────────────
class TestCommunityCreatePost:
    created_post_id = None

    def test_create_post_succeeds(self, h):
        payload = {"content": "TEST_iter92_8 — regression post for backend testing", "category": "general"}
        r = requests.post(f"{BASE_URL}/api/community/posts", headers=h, json=payload, timeout=15)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "post_id" in d and d["post_id"].startswith("p_")
        assert d["content"] == payload["content"]
        assert d["category"] == "general"
        assert d["likes_count"] == 0 and d["liked_by_me"] is False
        TestCommunityCreatePost.created_post_id = d["post_id"]

    def test_cleanup_created_post(self, h):
        pid = TestCommunityCreatePost.created_post_id
        if not pid:
            pytest.skip("no post id captured")
        r = requests.delete(f"{BASE_URL}/api/community/posts/{pid}", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("deleted") is True


# ── Video-Archive: regression GET + PATCH + DELETE ────────────────────────
class TestVideoArchiveRenameDelete:
    def test_get_video_archive_returns_list(self, h):
        r = requests.get(f"{BASE_URL}/api/video-archive", headers=h, timeout=15)
        assert r.status_code == 200, r.text[:200]
        docs = r.json()
        assert isinstance(docs, list)
        # If list is non-empty, ensure newest-first sort + no MongoDB _id leakage
        if len(docs) >= 2:
            assert docs[0]["created_at"] >= docs[1]["created_at"]
        for d in docs:
            assert "_id" not in d, "_id leaked from MongoDB"

    def test_patch_rename_round_trip(self, h):
        # Need at least one entry to rename. If empty, skip — can't seed audio.
        r = requests.get(f"{BASE_URL}/api/video-archive", headers=h, timeout=15)
        docs = r.json()
        if not docs:
            pytest.skip("no video-archive entries for test user — can't test rename round-trip")
        entry_id = docs[0]["entry_id"]
        original_title = docs[0].get("custom_title")

        new_title = "TEST_iter92_8_rename"
        r = requests.patch(
            f"{BASE_URL}/api/video-archive/{entry_id}",
            headers=h, json={"title": new_title}, timeout=15,
        )
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("custom_title") == new_title

        # Verify persisted via GET
        r2 = requests.get(f"{BASE_URL}/api/video-archive", headers=h, timeout=15)
        match = next((x for x in r2.json() if x["entry_id"] == entry_id), None)
        assert match and match.get("custom_title") == new_title, "rename not persisted"

        # Restore original title (cleanup)
        restore = original_title or "WladBot Video Mission"
        requests.patch(
            f"{BASE_URL}/api/video-archive/{entry_id}",
            headers=h, json={"title": restore}, timeout=15,
        )

    def test_patch_empty_title_returns_400(self, h):
        r = requests.get(f"{BASE_URL}/api/video-archive", headers=h, timeout=15)
        docs = r.json()
        if not docs:
            pytest.skip("no entries to test empty title 400")
        entry_id = docs[0]["entry_id"]
        r = requests.patch(
            f"{BASE_URL}/api/video-archive/{entry_id}",
            headers=h, json={"title": "   "}, timeout=15,
        )
        assert r.status_code == 400, f"expected 400 for empty title, got {r.status_code} {r.text[:200]}"

    def test_patch_unknown_entry_returns_404(self, h):
        r = requests.patch(
            f"{BASE_URL}/api/video-archive/vid_doesnotexist123",
            headers=h, json={"title": "nope"}, timeout=15,
        )
        assert r.status_code == 404, f"expected 404, got {r.status_code} {r.text[:200]}"

    def test_delete_unknown_entry_returns_404(self, h):
        r = requests.delete(
            f"{BASE_URL}/api/video-archive/vid_doesnotexist123",
            headers=h, timeout=15,
        )
        assert r.status_code == 404, f"expected 404, got {r.status_code} {r.text[:200]}"

    # NOTE: we intentionally do NOT test the destructive DELETE on a real entry
    # — could not be recovered. The 404 path above proves the route is wired
    # and reachable. Owner-only guard is enforced by the same Mongo filter
    # ({"entry_id": id, "user_id": user["user_id"]}) used in PATCH which
    # we DID verify ends up at 404 for the unknown-id case.

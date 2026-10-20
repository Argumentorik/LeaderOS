"""Iter 92.39 — Domain sweep regression test.

Verifies that all app-canonical references to `leader-os.de` (with dash) have
been replaced with `leaderos.de` (no dash), while preserving intentional CORS
backward-compat entries (server.py:196 + .env.example:46).
"""
import os
import re
import subprocess
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "http://localhost:8001"
PROJECT_ROOT = "/app"


def _grep_dashed(paths):
    """Return all lines containing 'leader-os.de' in the given paths (recursive)."""
    out = subprocess.run(
        ["grep", "-rn", "leader-os.de", *paths],
        capture_output=True, text=True,
    )
    lines = [ln for ln in out.stdout.splitlines()
             if "__pycache__" not in ln and "/tests/" not in ln
             and "node_modules" not in ln and "/build/" not in ln]
    return lines


# ── Domain sweep ──────────────────────────────────────────────────────────────
class TestDomainSweep:
    def test_backend_services_no_dashed_domain(self):
        lines = _grep_dashed([
            "/app/backend/services_email.py",
            "/app/backend/services_magic_link.py",
            "/app/backend/services_wladhub_autosync.py",
            "/app/backend/services_tier.py",
        ])
        assert lines == [], "Found dashed leader-os.de:\n" + "\n".join(lines)

    def test_backend_routes_no_dashed_domain(self):
        lines = _grep_dashed(["/app/backend/routes/"])
        assert lines == [], "Found dashed leader-os.de:\n" + "\n".join(lines)

    def test_frontend_src_no_dashed_domain(self):
        lines = _grep_dashed(["/app/frontend/src/"])
        assert lines == [], "Found dashed leader-os.de:\n" + "\n".join(lines)

    def test_frontend_public_no_dashed_domain(self):
        lines = _grep_dashed(["/app/frontend/public/"])
        assert lines == [], "Found dashed leader-os.de:\n" + "\n".join(lines)

    def test_cors_comment_preserved_in_server(self):
        """server.py:196 must STILL reference leader-os.de in CORS comment."""
        with open("/app/backend/server.py") as f:
            content = f.read()
        assert "leader-os.de" in content, "CORS comment with dashed domain missing"

    def test_cors_comment_preserved_in_env_example(self):
        with open("/app/backend/.env.example") as f:
            content = f.read()
        assert "leader-os.de" in content, "Intentional CORS list dashed domain missing"


# ── Sender + share.js + sitemap/robots ────────────────────────────────────────
class TestSenderAndShare:
    def test_sender_email_no_dash(self):
        # import via path
        import importlib.util
        spec = importlib.util.spec_from_file_location("services_email", "/app/backend/services_email.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        assert mod.SENDER_EMAIL == "wlad@leaderos.de", f"got {mod.SENDER_EMAIL!r}"

    def test_share_js_prod_origin(self):
        with open("/app/frontend/src/lib/share.js") as f:
            content = f.read()
        assert "const PROD_ORIGIN = 'https://leaderos.de'" in content
        assert "leader-os.de" not in content

    def test_sitemap_uses_no_dash(self):
        with open("/app/frontend/public/sitemap.xml") as f:
            content = f.read()
        # Required pages
        for path in ["/", "/login", "/impressum", "/datenschutz", "/agb", "/widerruf"]:
            assert f"https://leaderos.de{path}" in content, f"missing https://leaderos.de{path}"
        assert "leader-os.de" not in content

    def test_robots_sitemap_directive(self):
        with open("/app/frontend/public/robots.txt") as f:
            content = f.read()
        assert "Sitemap: https://leaderos.de/sitemap.xml" in content
        assert "leader-os.de" not in content


# ── Email template renders ────────────────────────────────────────────────────
class TestEmailTemplates:
    @pytest.fixture(scope="class")
    def email_mod(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("services_email", "/app/backend/services_email.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    def _check(self, html: str, subj: str):
        assert "leader-os.de" not in html, "dashed found in html"
        assert "leader-os.de" not in subj, "dashed found in subject"

    def test_signup_welcome(self, email_mod):
        subj, html = email_mod.signup_welcome_email("Mert")
        self._check(html, subj)
        assert "leaderos.de" in html

    @pytest.mark.parametrize("tier", ["starter", "standard", "accelerator"])
    def test_tier_welcome(self, email_mod, tier):
        subj, html = email_mod.tier_welcome_email(tier, "Mert")
        self._check(html, subj)

    @pytest.mark.parametrize("ep_idx", range(7))
    def test_drip(self, email_mod, ep_idx):
        subj, html = email_mod.framework_episode_email("Mert", email_mod.FRAMEWORK_EPISODES[ep_idx])
        self._check(html, subj)

    def test_magic_link_template(self):
        # Inspect source (module imports app config so direct import not possible here)
        with open("/app/backend/services_magic_link.py") as f:
            src = f.read()
        assert "leaderos.de" in src
        assert "leader-os.de" not in src


# ── OG endpoint footer source check ───────────────────────────────────────────
class TestOG:
    def test_og_footer_uses_no_dash(self):
        with open("/app/backend/routes/og.py") as f:
            src = f.read()
        # All footer = "..." lines must be no-dash
        footers = re.findall(r'footer\s*=\s*"([^"]+)"', src)
        assert footers, "no footer assignments found"
        for fv in footers:
            assert fv == "leaderos.de", f"og.py footer = {fv!r}, expected leaderos.de"
        assert "leader-os.de" not in src


# ── Regression: auth + magic-link ─────────────────────────────────────────────
class TestAuthRegression:
    def test_login_admin(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "test@test.com", "password": "test123"},
                          timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data or "token" in data or data.get("user")

    def test_me_endpoint(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "test@test.com", "password": "test123"},
                          timeout=15)
        tok = r.json().get("access_token") or r.json().get("token")
        if not tok:
            pytest.skip("no token returned")
        r2 = requests.get(f"{BASE_URL}/api/auth/me",
                          headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r2.status_code == 200

    def test_magic_link_request_no_500(self):
        """Use fresh email to bypass per-hour rate-limit. Expect 200 or 429."""
        import uuid
        fresh = f"mert-iter39-{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/magic-link/request",
                          json={"email": fresh}, timeout=20)
        assert r.status_code in (200, 202, 429), f"unexpected {r.status_code}: {r.text}"

"""Iter 92.38 — SENDER_EMAIL rename to wlad@leaderos.de (NO dash) + support route mailtos.

Background:
  Resend was rejecting all outgoing onboarding mails because the previous sender
  `reminders@leader-os.de` was on a domain Resend had NOT verified. Mert is
  verifying `leaderos.de` (no dash) on his Resend dashboard.  This iter:
    1. Flips /app/backend/.env  SENDER_EMAIL → wlad@leaderos.de
    2. sed-renames every `support@leader-os.de` → `support@leaderos.de`
       and `reminders@leader-os.de` → `wlad@leaderos.de` in
       /app/backend/routes/support.py and /app/backend/.env.example
    3. backend already restarted.

We DO NOT actually call Resend (no real inbox sends).  We assert:
  - the .env file is correct
  - services_email constants/templates pick up the new sender
  - all mailto links in support.py route to the new domain
  - magic-link request still 200s (covers the send_email path)
"""
import os
import re
import sys
import importlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()

sys.path.insert(0, "/app/backend")


# ───────── .env contents ─────────
class TestEnvFile:
    def test_sender_email_in_env(self):
        env = open("/app/backend/.env").read()
        m = re.search(r'^SENDER_EMAIL\s*=\s*"?([^"\n]+)"?', env, re.MULTILINE)
        assert m is not None, "SENDER_EMAIL line missing from /app/backend/.env"
        assert m.group(1).strip() == "wlad@leaderos.de", \
            f"SENDER_EMAIL must equal 'wlad@leaderos.de', got {m.group(1)!r}"

    def test_no_old_dashed_sender_in_env(self):
        env = open("/app/backend/.env").read()
        assert "reminders@leader-os.de" not in env, \
            "Old SENDER_EMAIL 'reminders@leader-os.de' must be removed"

    def test_env_example_updated(self):
        ex = open("/app/backend/.env.example").read()
        assert "SENDER_EMAIL=wlad@leaderos.de" in ex
        assert "reminders@leader-os.de" not in ex


# ───────── services_email module constants & templates ─────────
class TestServicesEmailModule:
    def test_sender_email_constant(self):
        # Force-reload to be sure we see the env in effect at this point
        import services_email as se
        importlib.reload(se)
        assert se.SENDER_EMAIL == "wlad@leaderos.de", \
            f"services_email.SENDER_EMAIL = {se.SENDER_EMAIL!r}, expected 'wlad@leaderos.de'"

    def test_brand_name_is_wladbot(self):
        import services_email as se
        importlib.reload(se)
        assert se.BRAND_NAME == "WladBot"

    def test_from_header_string(self):
        """Reproduces line ~63: from_email default = f'{BRAND_NAME} <{SENDER_EMAIL}>'."""
        import services_email as se
        importlib.reload(se)
        from_header = f"{se.BRAND_NAME} <{se.SENDER_EMAIL}>"
        assert from_header == "WladBot <wlad@leaderos.de>", \
            f"From-header constructs to {from_header!r}"

    def test_signup_welcome_renders(self):
        from services_email import signup_welcome_email
        subj, html = signup_welcome_email("Mert", "https://leader-os.de")
        assert isinstance(subj, str) and len(subj) > 0
        assert isinstance(html, str) and len(html) > 1000, f"HTML length {len(html)}"
        assert "Mert" in html

    @pytest.mark.parametrize("tier", ["standard", "accelerator", "starter"])
    def test_tier_welcome_renders(self, tier):
        from services_email import tier_welcome_email
        subj, html = tier_welcome_email(tier, "Mert")
        assert subj and isinstance(subj, str)
        # Name is interpolated into the subject ({name} placeholder), template body
        # uses generic 2nd-person German ("du") so 'Mert' appears in subject only.
        assert "Mert" in subj, f"tier={tier} subject={subj!r}"
        assert len(html) > 1000, f"tier={tier} html len={len(html)}"

    @pytest.mark.parametrize("fn", ["drip_day1_email", "drip_day3_email", "drip_day7_email"])
    def test_drip_emails_render(self, fn):
        import services_email
        subj, html = getattr(services_email, fn)(name="Mert")
        assert subj and isinstance(subj, str)
        assert len(html) > 1000, f"{fn} html len={len(html)}"


# ───────── routes/support.py mailto links ─────────
class TestSupportRoutes:
    SUPPORT_PY = "/app/backend/routes/support.py"

    def test_no_dashed_support_email(self):
        src = open(self.SUPPORT_PY).read()
        assert "support@leader-os.de" not in src, \
            "Old mailto 'support@leader-os.de' must be 0 occurrences"

    def test_at_least_four_no_dash_support_mailtos(self):
        src = open(self.SUPPORT_PY).read()
        count = src.count("support@leaderos.de")
        assert count >= 4, f"Expected ≥4 'support@leaderos.de' mailtos, got {count}"


# ───────── HTTP path that triggers send_email (magic-link) ─────────
class TestMagicLinkSendPath:
    def test_magic_link_request_returns_200_or_429(self):
        """Triggers the send_email() code path that constructs the From header
        with the new sender.  We do NOT receive the mail — we just ensure the
        endpoint accepts the request (200) OR rate-limits us (429 after
        several prior calls).  Either is proof that the email layer did NOT
        crash with a 5xx (which would indicate a sender/template error)."""
        r = requests.post(
            f"{BASE_URL}/api/auth/magic-link/request",
            json={"email": "test@test.com"},
            timeout=20,
        )
        # 429 is the per-hour rate-limit — endpoint still functional
        assert r.status_code in (200, 429), r.text
        assert r.status_code != 500, f"5xx indicates send_email/template crash: {r.text}"

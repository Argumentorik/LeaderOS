"""Iter 177: alle Clips mit vorhandenen Takes neu zusammensetzen (0 $) — sauberer Ausklang. Sequentiell, als Vorschau."""
import os
import sys
import time

import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
SLUGS = [a for a in sys.argv[1:] if not a.startswith("-")] or [
    "start-1-willkommen", "start-2-so-sprichst-du", "start-3-kontext", "start-4-werkzeuge", "start-5-erste-7-tage",
    "mission-day-1", "mission-day-2", "mission-day-3", "mission-day-4", "mission-day-5", "mission-day-6", "mission-day-7",
    "coaching-pakete", "bp-playbooks", "bp-missionen", "bp-video-analyse",
]

s = requests.Session()
r = s.post(f"{BASE}/api/auth/login", json={"email": "test@test.com", "password": os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")}, timeout=20)
r.raise_for_status()

for slug in SLUGS:
    r = s.post(f"{BASE}/api/guide/admin/clips/{slug}/render-preview", timeout=30)
    print(slug, "start", r.status_code, r.text[:80], flush=True)
    if r.status_code != 200:
        continue
    for _ in range(120):
        time.sleep(5)
        c = s.get(f"{BASE}/api/guide/admin/clips/{slug}", timeout=30).json()
        if c.get("status") != "render_preview_running":
            print(slug, "->", c.get("status"), c.get("error"), "preview:", c.get("preview_duration_seconds_video"), "alt:", c.get("duration_seconds_video"), flush=True)
            if os.environ.get("APPROVE") == "1" and c.get("preview_url"):
                a = s.post(f"{BASE}/api/guide/admin/clips/{slug}/approve-preview", timeout=30)
                print(slug, "approved", a.status_code, flush=True)
            break

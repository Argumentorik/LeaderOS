"""
Resend Live-Send aller 7 Drip-Episoden an einen Test-Empfänger.

Usage:
    cd /app/backend && python -m scripts.send_all_episodes start@aiporate.com Mert
"""
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Stelle sicher, dass wir backend/ im Path haben
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

import resend  # noqa: E402
from email_episodes import EPISODES, render_episode  # noqa: E402

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL") or os.environ.get("RESEND_FROM_EMAIL") or "wlad@leadercheck.de"


def main() -> int:
    if not RESEND_API_KEY:
        print("[FAIL] RESEND_API_KEY ist leer.")
        return 1
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.send_all_episodes <to_email> [name]")
        return 1

    to = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else "Mert"

    resend.api_key = RESEND_API_KEY
    ctx = {"name": name, "weakest_label": "Rhetorik", "weakest_score": 50, "email": to}

    sent_ids = []
    slugs = list(EPISODES.keys())
    print(f"\n→ Sending {len(slugs)} Episodes to {to} (name='{name}')")
    print(f"   Sender: {SENDER_EMAIL}\n")

    for i, slug in enumerate(slugs, start=1):
        rendered = render_episode(slug, ctx)
        if not rendered:
            print(f"  [{i}/7] {slug:30s} → RENDER FAIL")
            continue
        try:
            resp = resend.Emails.send({
                "from": f"Wlad von Leader OS <{SENDER_EMAIL}>",
                "to": [to],
                "subject": rendered["subject"],
                "html": rendered["html"],
            })
            rid = resp.get("id") if isinstance(resp, dict) else str(resp)
            sent_ids.append((slug, rid))
            print(f"  [{i}/7] {slug:30s} → sent · id={rid}")
            time.sleep(0.6)  # Resend rate-limit safety
        except Exception as e:  # noqa: BLE001
            print(f"  [{i}/7] {slug:30s} → SEND FAIL: {e}")

    print(f"\n✓ Done. Sent {len(sent_ids)}/{len(slugs)} emails.")
    for slug, rid in sent_ids:
        print(f"   · {slug:30s}  {rid}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Builder-time only: exakte fal.ai-Endpoints für die Guide-Videos ermitteln."""

import json
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

KEY = os.environ["EMERGENT_LLM_KEY"]
BASE = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com").rstrip("/")
CONTROL = f"{BASE}/api/v1/fal"
HEADERS = {"Authorization": f"Bearer {KEY}"}


def search(q: str, limit: int = 12):
    r = requests.get(f"{CONTROL}/catalog/models", headers=HEADERS,
                     params={"q": q, "status": "active", "limit": limit}, timeout=45)
    r.raise_for_status()
    out = []
    for m in r.json().get("models", []):
        out.append({
            "endpoint_id": m.get("endpoint_id"),
            "priceable": m.get("priceable"),
            "denied": m.get("denied"),
            "title": (m.get("title") or "")[:70],
            "has_openapi": isinstance(m.get("openapi"), dict),
        })
    return out


if __name__ == "__main__":
    for q in sys.argv[1:]:
        print(f"\n=== {q} ===")
        try:
            for row in search(q):
                print(json.dumps(row, ensure_ascii=False))
        except Exception as e:
            print("ERR", e)

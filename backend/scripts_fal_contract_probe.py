"""Builder-time only: exakte fal.ai-Contracts (Submit-Input / Result-Output) lesen."""

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


def contract(endpoint_id: str) -> dict:
    r = requests.get(f"{CONTROL}/catalog/models", headers=HEADERS,
                     params={"q": endpoint_id, "status": "active", "limit": 10}, timeout=60)
    r.raise_for_status()
    matches = [m for m in r.json().get("models", [])
               if m.get("endpoint_id") == endpoint_id and m.get("priceable") and not m.get("denied")]
    if len(matches) != 1:
        raise ValueError(f"nicht eindeutig: {endpoint_id}")
    openapi = matches[0]["openapi"]
    paths = openapi.get("paths", {})
    submit = [ops["post"] for p, ops in paths.items()
              if "/requests/" not in p and isinstance(ops, dict) and isinstance(ops.get("post"), dict)]
    result = [ops["get"] for p, ops in paths.items()
              if (p.endswith("/requests/{request_id}") or p.endswith("/requests/{request_id}/response"))
              and isinstance(ops, dict) and isinstance(ops.get("get"), dict)]
    if len(submit) != 1 or len(result) != 1:
        raise ValueError(f"mehrdeutiger Contract: {endpoint_id}")
    in_schema = submit[0].get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema")
    out_schema = None
    for status in ("200", "201", "default"):
        out_schema = result[0].get("responses", {}).get(status, {}).get("content", {}).get("application/json", {}).get("schema")
        if out_schema:
            break
    return {
        "endpoint_id": endpoint_id,
        "input": in_schema,
        "output": out_schema,
        "components": openapi.get("components", {}).get("schemas", {}),
    }


def resolve(schema, components, depth=0):
    if not isinstance(schema, dict) or depth > 3:
        return schema
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        return resolve(components.get(name, {}), components, depth + 1)
    return schema


def describe(endpoint_id: str) -> None:
    c = contract(endpoint_id)
    comp = c["components"]
    print(f"\n########## {endpoint_id} ##########")
    for label in ("input", "output"):
        s = resolve(c[label], comp)
        print(f"\n--- {label.upper()} (required: {s.get('required')}) ---")
        for field, spec in (s.get("properties") or {}).items():
            spec = resolve(spec, comp)
            info = {k: v for k, v in spec.items()
                    if k in ("type", "enum", "default", "minimum", "maximum", "format", "description")}
            if isinstance(info.get("description"), str):
                info["description"] = info["description"][:110]
            print(f"  {field}: {json.dumps(info, ensure_ascii=False)}")


if __name__ == "__main__":
    for e in sys.argv[1:]:
        try:
            describe(e)
        except Exception as exc:
            print(f"\n########## {e} ##########\nERR {exc}")

"""Exportiert die produzierten Guide-Clips + Settings als Seed für Production.

Die Videos liegen im Emergent Object Storage (gleicher Key in Preview und Prod),
die Metadaten aber in der Preview-DB. Dieses JSON wird beim ersten Aufruf in Prod
von routes/guide._ensure_seeded eingespielt (nur für Clips ohne eigenes Video).

Aufruf nach jeder neuen Produktion:  cd /app/backend && python3 scripts/export_guide_seed.py
"""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

clips = list(db.guide_clips.find({"video_path": {"$ne": None}}, {"_id": 0}))
settings = db.guide_settings.find_one({"_id": "guide_settings"}, {"_id": 0}) or {}
settings.pop("spent_usd", None)
out = Path(__file__).resolve().parent.parent / "guide_seed_data.json"
out.write_text(json.dumps({"clips": clips, "settings": settings}, ensure_ascii=False, indent=1))
print(f"{len(clips)} Clips + Settings -> {out} ({out.stat().st_size // 1024} KB)")

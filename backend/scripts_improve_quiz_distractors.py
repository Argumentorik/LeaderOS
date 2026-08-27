"""Iter 139 — Distraktoren aufwerten (P4b).

Der statische QUIZ_BANK hatte in 229/235 MC-Fragen die richtige Antwort als
deutlich längste Option, Distraktoren waren 1-3 Wörter („Nichts", „Zufall").
Dieses Script schreibt die Optionen NEU (Frage, richtige Aussage und Erklärung
bleiben inhaltlich erhalten) und validiert jede Variante gegen quiz_quality.
Ergebnis landet in quiz_overrides.json und wird von quiz_bank.py beim Import
über den Bestand gelegt — der Original-Bank-Code bleibt unverändert.

Aufruf:  python3 scripts_improve_quiz_distractors.py [--days 1,2,3] [--limit N]
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))
load_dotenv(Path(__file__).resolve().parent / ".env")

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402
from quiz_bank import QUIZ_BANK_RAW  # noqa: E402
from quiz_quality import validate_question  # noqa: E402

OVERRIDES_PATH = Path(__file__).resolve().parent / "quiz_overrides.json"

RULES_PROMPT = """Du bist Prüfungs-Didaktiker für Führungskräfte-Weiterbildung.
Du bekommst eine Multiple-Choice-Frage, die aktuell richtige Antwort und die Erklärung.
Schreibe die 4 Antwortoptionen NEU. HARTE REGELN (Verstoß = unbrauchbar):
1. Genau 4 Optionen. Die inhaltlich richtige Aussage bleibt inhaltlich gleich, darf aber
   sprachlich gekürzt/geglättet werden.
2. Alle 4 Optionen haben VERGLEICHBARE LÄNGE: jede zwischen 60 und 110 Zeichen,
   maximal 25 % Abweichung zur Median-Länge. Gleiche grammatikalische Form (alle als
   Aussagesatz ohne Punkt am Ende, kein Stichwort-Fragment).
3. Jeder Distraktor ist PLAUSIBEL: typischer Denkfehler, Teilwahrheit, verwandte Methode
   oder verwechselbare Definition. Keine absurden, ironischen oder leeren Optionen
   („Nichts", „Zufall", „Egal" sind verboten).
4. Keine verräterischen Signalwörter: die richtige Antwort darf nicht als einzige
   „immer/alle/nie/jeder" enthalten; Distraktoren nicht systematisch absoluter formulieren.
5. Kein wörtliches Copy-Paste aus der Erklärung in die richtige Antwort.
6. Deutsch, klar, ohne Buzzwords und ohne Anglizismen.

Antworte AUSSCHLIESSLICH mit JSON:
{"options": ["...", "...", "...", "..."], "correct": <Index der richtigen Antwort 0-3>}
"""


async def rewrite_question(q: dict, attempt: int) -> dict | None:
    key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not key:
        raise RuntimeError("EMERGENT_LLM_KEY missing")
    chat = LlmChat(api_key=key, session_id=f"quiz-rewrite-{attempt}", system_message=RULES_PROMPT).with_model(
        "openai", "gpt-4o-mini"
    )
    payload = {
        "frage": q["q"],
        "richtige_antwort": q["options"][q["correct"]],
        "bisherige_distraktoren": [o for i, o in enumerate(q["options"]) if i != q["correct"]],
        "erklaerung": q.get("explanation", ""),
    }
    raw = await chat.send_message(UserMessage(text=json.dumps(payload, ensure_ascii=False)))
    body = raw.strip()
    if body.startswith("```"):
        body = body.strip("`")
        body = body[body.find("{"):body.rfind("}") + 1]
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return None
    options = parsed.get("options")
    correct = parsed.get("correct")
    if not isinstance(options, list) or len(options) != 4 or not isinstance(correct, int):
        return None
    return {"options": [str(o).strip() for o in options], "correct": correct}


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", default="")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    days = [int(d) for d in args.days.split(",") if d.strip()] or sorted(QUIZ_BANK_RAW.keys())
    overrides = json.loads(OVERRIDES_PATH.read_text()) if OVERRIDES_PATH.exists() else {}
    done = 0
    failed = []

    for day in days:
        for idx, q in enumerate(QUIZ_BANK_RAW.get(day, [])):
            if q.get("type", "mc") != "mc" or not q.get("options"):
                continue
            ref = f"{day}:{idx}"
            if ref in overrides:
                continue
            if args.limit and done >= args.limit:
                break
            candidate = None
            for attempt in range(1, 4):
                candidate = await rewrite_question(q, attempt)
                if not candidate:
                    continue
                issues = validate_question(candidate)
                if not issues:
                    break
                print(f"  {ref} Versuch {attempt} abgelehnt: {issues[:3]}")
                candidate = None
            if candidate:
                overrides[ref] = candidate
                done += 1
                print(f"OK {ref} ({done})")
                OVERRIDES_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=1))
            else:
                failed.append(ref)
        if args.limit and done >= args.limit:
            break

    OVERRIDES_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=1))
    print(f"\nfertig: {done} neu geschrieben, {len(failed)} nicht validierbar: {failed[:10]}")


if __name__ == "__main__":
    asyncio.run(main())

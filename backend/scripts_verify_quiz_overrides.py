"""Iter 139 — Solver-Gegencheck für die neu geschriebenen Quiz-Optionen.

Nach dem Distraktoren-Rewrite kann es passieren, dass zwei Optionen gleich
richtig klingen. Dieses Script lässt ein Modell die Frage NUR anhand der
Optionen lösen (ohne die Erklärung zu kennen). Trifft es die vorgesehene
Antwort nicht eindeutig, wird der Override verworfen — die Frage fällt dann
auf die kuratierte Original-Variante zurück (die durch das Shuffling weiterhin
keinen Positions-Bias hat).

Aufruf: python3 scripts_verify_quiz_overrides.py [--limit N]
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

OVERRIDES_PATH = Path(__file__).resolve().parent / "quiz_overrides.json"

SOLVER_PROMPT = """Du bist Prüfungs-Kandidat. Du bekommst eine Multiple-Choice-Frage
mit Antwortoptionen. Wähle die EINZIGE fachlich richtige Option.
Antworte ausschließlich mit JSON: {"answer": <Index 0-3>, "eindeutig": true|false}
"eindeutig" ist false, wenn mehrere Optionen fachlich richtig sein könnten."""


async def solve(question: str, options: list) -> tuple[int, bool]:
    key = os.environ["EMERGENT_LLM_KEY"]
    chat = LlmChat(api_key=key, session_id="quiz-solver", system_message=SOLVER_PROMPT).with_model(
        "openai", "gpt-4o-mini"
    )
    raw = await chat.send_message(UserMessage(text=json.dumps({"frage": question, "optionen": options}, ensure_ascii=False)))
    body = raw.strip()
    if body.startswith("```"):
        body = body[body.find("{"):body.rfind("}") + 1]
    try:
        parsed = json.loads(body)
        return int(parsed.get("answer", -1)), bool(parsed.get("eindeutig", False))
    except (ValueError, TypeError):
        return -1, False


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    overrides = json.loads(OVERRIDES_PATH.read_text())
    checked = json.loads((OVERRIDES_PATH.parent / "quiz_overrides_verified.json").read_text()) if (OVERRIDES_PATH.parent / "quiz_overrides_verified.json").exists() else {}
    rejected = []
    done = 0

    for ref, data in list(overrides.items()):
        if ref in checked:
            continue
        if args.limit and done >= args.limit:
            break
        day_str, _, idx_str = ref.partition(":")
        question = QUIZ_BANK_RAW[int(day_str)][int(idx_str)]["q"]
        answer, unique = await solve(question, data["options"])
        done += 1
        if answer == data["correct"] and unique:
            checked[ref] = True
        else:
            rejected.append(ref)
            overrides.pop(ref, None)
            print(f"verworfen {ref}: solver={answer} soll={data['correct']} eindeutig={unique}")
        if done % 20 == 0:
            OVERRIDES_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=1))
            (OVERRIDES_PATH.parent / "quiz_overrides_verified.json").write_text(json.dumps(checked, ensure_ascii=False))
            print(f"… {done} geprüft, {len(rejected)} verworfen")

    OVERRIDES_PATH.write_text(json.dumps(overrides, ensure_ascii=False, indent=1))
    (OVERRIDES_PATH.parent / "quiz_overrides_verified.json").write_text(json.dumps(checked, ensure_ascii=False))
    print(f"\nfertig: {done} geprüft, {len(rejected)} verworfen → {len(overrides)} Overrides aktiv")


if __name__ == "__main__":
    asyncio.run(main())

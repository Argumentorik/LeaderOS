"""Iter 169: Onboarding-Schlusssätze + neue Missions-Skripte in guide_scripts_godmode.SCRIPTS schreiben (einmalig)."""
import asyncio
import os
import re

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

CLOSERS = {
    "start-1-willkommen": "Wir sehen uns gleich im nächsten Video – da zeige ich dir, wie du mit mir sprichst.",
    "start-2-so-sprichst-du": "Deine Aufgabe für heute: Schreib mir die eine Situation, die dir diese Woche am meisten im Kopf herumgeht. Ich lese mit.",
    "start-3-kontext": "Nimm dir die fünf Minuten jetzt. Ich warte hier auf dich.",
    "start-4-werkzeuge": "Fünf Minuten reichen für den Anfang. Und im nächsten Video zeige ich dir, wie deine erste Woche aussieht.",
    "start-5-erste-7-tage": "Leg dir deine zehn Minuten jetzt in den Kalender. Morgen sehen wir uns zur ersten Challenge – ich freue mich auf dich.",
}
# start-2: der bisherige letzte Satz sagt fast dasselbe wie der neue Schluss -> ersetzen statt doppeln
DROP_LAST = {"start-2-so-sprichst-du"}

MISSIONS = {
    1: "Tag eins. Bevor wir irgendetwas verändern, wollen wir wissen, wo du stehst. Heute beantwortest du zehn Fragen zu deinem Führungsalltag – ehrlich, nicht so, wie du gern wärst. Es gibt kein Falsch. Diese Baseline ist dein Ausgangspunkt, und in einer Woche schauen wir gemeinsam, was sich bewegt hat. Nimm dir zehn ruhige Minuten, kein Handy nebenbei. Los geht's – ich bin gespannt, wo du startest.",
    2: "Tag zwei. Jeder redet über KI, und die meisten Führungskräfte schwanken zwischen Hype und Abwehr. Beides hilft deinem Team nicht. Heute schauen wir nüchtern hin: Wo nimmt KI dir Arbeit ab, wo braucht dein Team weiter dein Urteil – und wie sprichst du darüber, ohne Angst zu machen oder Versprechen zu geben, die du nicht halten kannst? Deine Aufgabe: Nenne mir im Chat eine Aufgabe in deinem Team, bei der du dir heute unsicher bist, ob KI helfen sollte. Damit arbeiten wir.",
    3: "Tag drei. Du sagst etwas, dein Team hört etwas anderes – und du merkst es erst, wenn das Ergebnis nicht stimmt. Heute geht es darum, wie deine Botschaft wirklich ankommt: ein klarer Kern, ein Satz, den man sich merken kann, und die Frage danach, was verstanden wurde. In der Challenge übst du das an einer echten Nachricht, die du diese Woche loswerden musst. Formuliere sie heute einmal so, wie du sie normalerweise sagen würdest – und dann so, dass sie hängen bleibt. Wir vergleichen.",
    4: "Tag vier. Feedback scheitert selten an der Absicht, fast immer an der Form. Zu weich, und nichts ändert sich. Zu hart, und dein Gegenüber macht dicht. Heute lernst du eine Struktur, mit der du klar bleibst und trotzdem in Verbindung: Beobachtung, Wirkung, Wunsch. Deine Aufgabe: Denk an eine Person, der du seit Wochen etwas sagen willst. Formuliere ihr Feedback heute in drei Sätzen – und übe es in der Simulation, bevor du es wirklich sagst. Ich höre zu.",
    5: "Tag fünf. Die wichtigen Entscheidungen triffst du nie mit allen Informationen. Wer wartet, bis alles klar ist, entscheidet am Ende gar nicht – und das Team wartet mit. Heute schauen wir, wie du gute Entscheidungen triffst, wenn vieles offen ist: Was weißt du sicher, was nimmst du an, was kannst du in einer Woche wieder korrigieren? Deine Aufgabe: Nenne mir im Chat eine Entscheidung, die du gerade vor dir herschiebst. Wir nehmen sie heute auseinander – und du triffst sie bis Freitag.",
    6: "Tag sechs. Die meisten Konflikte im Team werden nicht zu groß, weil sie groß angefangen haben – sondern weil niemand sie angesprochen hat, als sie klein waren. Heute geht es um den frühen Satz: ruhig, konkret, ohne Vorwurf. „Mir ist aufgefallen, dass … Wie siehst du das?“ Das ist alles. Deine Aufgabe: Wo in deinem Team knirscht es gerade leise? Formuliere den ersten Satz, mit dem du das morgen ansprichst, und übe ihn heute in der Simulation. Je früher, desto leichter.",
    7: "Tag sieben. Eine Woche liegt hinter dir – Zeit, ehrlich hinzuschauen. Nicht, ob du alles geschafft hast, sondern was sich verändert hat: Welches Gespräch ist anders gelaufen? Wo hast du gezögert? Was nimmst du in die zweite Woche mit? Heute beantwortest du dieselben Fragen wie am ersten Tag, und wir legen die Antworten nebeneinander. Nimm dir dafür Zeit – das ist der wichtigste Blick der Woche. Ich bin stolz, dass du drangeblieben bist. Wir sehen uns morgen, in Woche zwei.",
}


def check(slug, kind, script):
    import sys
    sys.path.insert(0, "/app/backend")
    from services_guide_quality import godmode_check
    from guide_content import word_count
    res = godmode_check({"script": script, "kind": kind, "shots": [], "slug": slug})
    fails = [i["label"] for i in res["items"] if not i["ok"] and i["id"].startswith("script")]
    print(f"{slug:24s} {word_count(script):3d} W  ~{word_count(script)/2.85:4.1f}s  {'OK' if not fails else 'FAIL: ' + '; '.join(fails)}")
    return not fails


def py_str(text: str, indent: str = "        ") -> str:
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > 108:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    lines.append(cur)
    return "(\n" + "\n".join(f'{indent}"{ln} "' if i < len(lines) - 1 else f'{indent}"{ln}"' for i, ln in enumerate(lines)) + "\n    )"


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    new = {}
    ok = True
    for slug, closer in CLOSERS.items():
        c = await db.guide_clips.find_one({"slug": slug}, {"_id": 0, "script": 1})
        sents = [s for s in re.split(r"(?<=[.!?])\s+", " ".join(c["script"].split())) if s]
        if slug in DROP_LAST:
            sents = sents[:-1]
        new[slug] = " ".join(sents + [closer])
        ok &= check(slug, "onboarding", new[slug])
    for day, script in MISSIONS.items():
        new[f"mission-day-{day}"] = " ".join(script.split())
        ok &= check(f"mission-day-{day}", "mission", new[f"mission-day-{day}"])
    if not ok:
        raise SystemExit("Skripte nicht GODMODE-fähig — abgebrochen")
    p = "/app/backend/guide_scripts_godmode.py"
    src = open(p, encoding="utf-8").read()
    for slug in CLOSERS:
        pat = re.compile(rf'    "{re.escape(slug)}": \(\n(?:        ".*"\n)+    \),\n')
        assert pat.search(src), slug
        src = pat.sub(f'    "{slug}": {py_str(new[slug])},\n', src, count=1)
    src += "\n# Iter 169: Mission-Briefings Tag 1–7 — ein Take, nur Wlad, klare Aufgabe, natürlicher Schluss.\n"
    for day in MISSIONS:
        src += f'SCRIPTS["mission-day-{day}"] = {py_str(new[f"mission-day-{day}"], indent="    ")}\n'
    open(p, "w", encoding="utf-8").write(src)
    print("geschrieben:", p)


asyncio.run(main())

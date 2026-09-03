"""Guide-Video-Inhalte (Iter 142) — Stufe B: Erststart-Serie + Tag 1-7.

Jeder Clip trägt sein Skript ALS FALLBACK-TEXT im Code. Fehlt das Video (noch
nicht produziert, nicht freigegeben oder Ladefehler), zeigt die Oberfläche
genau diesen Text — es entsteht nie ein Loch.

Wortgrenze ist keine Kosmetik: Fal rechnet pro Sekunde Video ab.
"""

SCRIPT_MIN_WORDS = 55
SCRIPT_MAX_WORDS = 115
WORD_LIMITS = {"teaser": (6, 30), "onboarding": (55, 115), "mission": (55, 115)}


def word_limits(kind: str) -> tuple[int, int]:
    return WORD_LIMITS.get(kind, (SCRIPT_MIN_WORDS, SCRIPT_MAX_WORDS))


# ── Cinematic-Look (Iter 143): 3D-Wlad im Stil des WladBot-Avatars ──────────
WLAD_STYLE_PROMPT = (
    "High-end Pixar-style 3D animated character of the man in the first reference image: keep his exact "
    "face, dark side-parted hair, short stubble beard, warm brown eyes and friendly confident expression. "
    "Full body, same athletic proportions and confident open stage posture as the man in the second reference "
    "image. He wears a dark green velvet blazer, a light blue shirt with open collar, no tie, dark tailored "
    "trousers and brown leather shoes. Clean stylized 3D animation film look, subsurface skin, soft fabric "
    "detail, no text, no watermark."
)

SHOT_PRESETS = {
    "spotlight_entrance": {
        "label": "Dunkles Studio · Lichtkegel",
        "scene_prompt": (
            "Scene: a dark cinematic studio with a pitch-black background. A single hard spotlight from above "
            "forms a bright cone of light on a polished dark floor, with subtle haze and volumetric light. "
            "He stands at the edge of the light beam, half in shadow, about to step forward into the light. "
            "Vertical 9:16 composition, full body visible with feet on the floor, dramatic rim light, "
            "Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "The man walks calmly and confidently forward out of the darkness into the hard spotlight, stops "
            "in the center of the light cone, looks straight into the camera, gives a slight confident smile "
            "and then talks to the camera with natural subtle head movements and small hand gestures. Slow "
            "cinematic dolly-in, volumetric haze in the light beam, consistent character and outfit, "
            "no camera cuts, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 4.0,
        "aspect_ratio": "9:16",
    },
    "loft_walk_in": {
        "label": "Loft-Büro · Walk-in",
        "kind": "walk",
        "scene_prompt": (
            "Scene: a modern bright loft office with tall windows, soft daylight, concrete and warm wood, a few "
            "green plants, a large screen on the wall glowing softly in lime green. He is walking toward the camera "
            "through the office, full body visible, confident relaxed stride. Horizontal 16:9 composition, "
            "Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "The man walks calmly and confidently toward the camera through the bright loft office, natural arm "
            "swing, stops and looks into the camera with a slight smile. Slow cinematic dolly-in, soft daylight "
            "flares, consistent character and outfit, no camera cuts, smooth realistic motion."
        ),
        "duration": "5",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
    "loft_talk_medium": {
        "label": "Loft-Büro · Halbnah",
        "kind": "talk",
        "scene_prompt": (
            "Scene: medium shot from the waist up, he stands in a modern bright loft office with tall windows and "
            "soft daylight, blurred background with warm wood, plants and a softly glowing lime-green screen. "
            "He looks straight into the camera with a warm confident expression, hands relaxed and ready to gesture. "
            "Horizontal 16:9 composition, face clearly lit and large in frame, Netflix-quality animation film still, "
            "shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "The man stands still and talks directly to the camera like a coach, natural mouth movements, subtle "
            "head movements, small open hand gestures, warm eye contact. Very slow cinematic push-in, no walking, "
            "no camera cuts, consistent character and outfit, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.6,
        "aspect_ratio": "16:9",
    },
    "loft_talk_closeup": {
        "label": "Loft-Büro · Close-up",
        "kind": "talk",
        "scene_prompt": (
            "Scene: close-up from the chest up, he stands in a modern bright loft office, soft daylight from the "
            "side, strongly blurred background with warm wood and a softly glowing lime-green screen. He looks "
            "straight into the camera with calm confidence and a slight smile. Horizontal 16:9 composition, face "
            "large and sharp in frame, Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "The man talks directly to the camera, natural mouth movements, calm confident expression, subtle "
            "nods, minimal head movement, warm eye contact, ends with a slight confident smile. Very slow cinematic "
            "push-in, no walking, no camera cuts, consistent character, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.6,
        "aspect_ratio": "16:9",
    },
}

# B-Roll: echte App-Screens (Playwright-Screenshots in backend/assets/broll; *_m.png = Mobile für 9:16)
BROLL_SCREENS = {
    "dashboard": "Dashboard",
    "chat": "WladBot-Chat",
    "video": "Video-Analyse",
    "challenge": "30-Tage-Challenge",
    "simulations": "Simulationen",
    "missions": "Missionen",
    "tasks": "Aufgaben",
    "checkin": "Daily Check-in",
    "tools": "Werkzeuge",
    "playbooks": "Playbooks",
    "videos": "Lern-Videos",
    "progress": "Community",
    "diagnose": "Leader-Diagnose",
    "mypath": "Mein Weg",
    "coaching": "Coaching-Memory",
    "profile": "Profil & Kontext",
}

# Passende App-Screens je Clip (B-Roll-Block)
CLIP_SCREENS = {
    "start-1-willkommen": ["dashboard", "chat", "video", "challenge"],
    "start-2-so-sprichst-du": ["chat", "simulations", "coaching", "tasks"],
    "start-3-kontext": ["profile", "dashboard", "chat"],
    "start-4-werkzeuge": ["tools", "simulations", "video", "playbooks"],
    "start-5-erste-7-tage": ["missions", "challenge", "checkin", "mypath"],
    "mission-day-1": ["missions", "diagnose", "mypath"],
    "mission-day-2": ["missions", "chat", "tools"],
    "mission-day-3": ["missions", "simulations", "chat"],
    "mission-day-4": ["missions", "simulations", "playbooks"],
    "mission-day-5": ["missions", "chat", "tasks"],
    "mission-day-6": ["missions", "simulations", "coaching"],
    "mission-day-7": ["mypath", "checkin", "coaching", "dashboard"],
    "teaser-login": ["chat", "video", "missions"],
}
DEFAULT_SCREENS = ["dashboard", "chat", "video", "challenge"]

# Wie ein Onboarding-Clip in Shots zerfällt (Stufe B)
MULTI_SHOT_PLAN = [
    {"type": "walk", "preset": "loft_walk_in"},
    {"type": "talk", "preset": "loft_talk_medium", "max_words": 22},
    {"type": "broll"},
    {"type": "talk", "preset": "loft_talk_closeup", "max_words": 22},
]
MULTI_SHOT_PLAN_PRO = [
    {"type": "walk", "preset": "loft_walk_in"},
    {"type": "talk", "preset": "loft_talk_medium", "max_words": 48},
    {"type": "broll"},
    {"type": "talk", "preset": "loft_talk_closeup", "max_words": 40},
]
TALK_MAX_SECONDS = 9.2
TALK_MAX_SECONDS_PRO = 28.0
FRAMES = {"16:9": (1280, 720), "9:16": (720, 1280)}


def scene_for_aspect(prompt: str, aspect: str) -> str:
    return prompt.replace("Horizontal 16:9 composition", "Vertical 9:16 composition") if aspect == "9:16" else prompt


def _sentences(text: str) -> list[str]:
    import re

    return [p for p in re.split(r"(?<=[.!?])\s+", " ".join(text.split())) if p]


def _take_words(sentences: list[str], max_words: int) -> tuple[str, list[str]]:
    """Nimmt ganze Sätze von vorn, bis max_words erreicht wäre (mindestens einen)."""
    taken, count = [], 0
    for s in sentences:
        n = len(s.split())
        if taken and count + n > max_words:
            break
        taken.append(s)
        count += n
        if count >= max_words:
            break
    return " ".join(taken), sentences[len(taken):]


def plan_shots(script: str, screens: list[str] | None = None, pro: bool = False) -> list[dict]:
    """Verteilt den Sprechtext: erster Talk-Shot = Anfang, letzter Talk-Shot = Ende,
    B-Roll bekommt den Rest in der Mitte. pro = längere Talk-Passagen (OmniHuman, kein 10-s-Limit)."""
    plan = MULTI_SHOT_PLAN_PRO if pro else MULTI_SHOT_PLAN
    screens = screens or DEFAULT_SCREENS
    sentences = _sentences(script)
    talks = [i for i, s in enumerate(plan) if s["type"] == "talk"]
    texts = {}
    total = word_count(script)
    # pro: Anteile statt fester Grenzen (50 % Einstieg, ~25 % App-Tour, 25 % Abschluss), sentence-aligned
    first_limit = min(plan[talks[0]]["max_words"], max(12, round(total * 0.5))) if pro and talks else (plan[talks[0]]["max_words"] if talks else 0)
    last_limit = min(plan[talks[-1]]["max_words"], max(10, round(total * 0.25))) if pro and talks else (plan[talks[-1]]["max_words"] if talks else 0)
    if talks:
        texts[talks[0]], sentences = _take_words(sentences, first_limit)
        if len(talks) > 1:
            tail, count, limit = [], 0, last_limit
            while sentences and count + len(sentences[-1].split()) <= limit:
                tail.insert(0, sentences.pop())
                count += len(tail[0].split())
            if not tail and sentences:
                # Letzter Satz ist zu lang für einen Talk-Shot -> am letzten Komma/Gedankenstrich teilen
                last = sentences.pop()
                cut = max(last.rfind(", ", 0, len(last) // 2 + 20), last.rfind(" — ", 0, len(last) // 2 + 20))
                if cut > 0:
                    head, rest = last[:cut + 1].rstrip(","), last[cut + 1:].strip(" —")
                    sentences.append(head + ("" if head.endswith((".", "!", "?")) else "."))
                    tail = [rest[0].upper() + rest[1:] if rest else rest]
                else:
                    tail = [last]
            texts[talks[-1]] = " ".join(tail)
    shots = []
    for i, tpl in enumerate(plan):
        shots.append({
            "id": f"s{i + 1}", "type": tpl["type"], "preset": tpl.get("preset"),
            "screens": screens if tpl["type"] == "broll" else [],
            "text": " ".join(sentences) if tpl["type"] == "broll" else texts.get(i, ""),
        })
    return shots

# ── Teaser: Ein 10-s-Shot für Social (Stufe A) ──────────────────────────────
TEASER_CLIPS = [
    {
        "slug": "teaser-spotlight",
        "order": 1,
        "title": "Teaser: Ins Licht",
        "script": "Führung ist kein Talent. Führung ist ein System. Willkommen bei Leader-OS.",
        "shot_preset": "spotlight_entrance",
    },
]

# Login-Seite: Multi-Shot 9:16, Conversion-Text (Stufe B)
LOGIN_TEASER = {
    "slug": "teaser-login",
    "order": 0,
    "title": "Warum Leader-OS",
    "script": (
        "Du führst ein Team. Aber wer coacht eigentlich dich? Leader-OS ist dein persönlicher Coach: "
        "KI-Sparring für schwierige Gespräche, Video-Analyse deiner Wirkung und tägliche Missionen, "
        "die dich wirklich besser machen. Kein Kurs, den du abarbeitest. Ein System, das mit dir arbeitet. "
        "Starte heute — kostenlos."
    ),
}

# ── Erststart-Serie: 5 Clips, je 30-45 Sekunden ──────────────────────────────
ONBOARDING_CLIPS = [
    {
        "slug": "start-1-willkommen",
        "order": 1,
        "title": "Willkommen bei Leader-OS",
        "script": (
            "Schön, dass du da bist. Hier bekommst du keinen Kurs, den du abarbeitest — sondern einen "
            "Sparringspartner für echte Führungssituationen. Deine Chance: In den nächsten zehn Minuten richtest "
            "du dein System ein und arbeitest ab morgen an deinen eigenen Fällen. Das schwierige Gespräch. "
            "Der Mitarbeiter, der abbaut. Die Präsentation vor dem Vorstand. Du sagst mir, wer du bist und wo du "
            "führst — ich passe alles darauf an. Nimm dir diese zehn Minuten wirklich. Sie entscheiden, wie gut "
            "alles danach wird."
        ),
    },
    {
        "slug": "start-2-so-sprichst-du",
        "order": 2,
        "title": "So sprichst du mit der KI",
        "script": (
            "Der häufigste Fehler: Stichworte. Wer „Mitarbeitergespräch\" eintippt, bekommt eine "
            "Wikipedia-Antwort. Schlecht ist: „Konflikt im Team\". Gut ist: „Zwei meiner "
            "Entwickler reden seit drei Wochen nicht mehr miteinander, das Projekt steht, "
            "morgen um zehn habe ich beide im Raum — wie eröffne ich das Gespräch?\" "
            "Siehst du den Unterschied? Situation, Beteiligte, Zeitpunkt, Ziel. "
            "Je konkreter du fragst, desto brauchbarer die Antwort. Schreib wie zu einem Coach, "
            "der dich kennt — nicht wie in eine Suchmaschine."
        ),
    },
    {
        "slug": "start-3-kontext",
        "order": 3,
        "title": "Kontext ist alles",
        "script": (
            "Zwei Führungskräfte stellen dieselbe Frage und brauchen völlig verschiedene "
            "Antworten. Ein Teamleiter mit vier Leuten in der Pflege führt anders als ein "
            "Bereichsleiter mit achtzig Leuten im Vertrieb. Deshalb hinterlegst du Rolle, "
            "Unternehmen und Branche — und im Bereich „Über mich\" alles, was zu dir gehört: "
            "Stärken, Schwächen, Verantwortung, Ziele. Das liest die KI bei jeder Antwort mit. "
            "Fünf Minuten Aufwand, und aus allgemeinen Ratschlägen wird Beratung, die auf "
            "deinen Alltag passt. Ohne diese Angaben bleibt alles Mittelmaß."
        ),
    },
    {
        "slug": "start-4-werkzeuge",
        "order": 4,
        "title": "Deine Werkzeuge",
        "script": (
            "Vier Werkzeuge, vier Zwecke. Der Chat ist für Denken und Vorbereiten: Strategie für "
            "ein Gespräch, Argumente für eine Entscheidung. Die Simulation ist zum Üben — dein "
            "Gegenüber antwortet, und zwar unbequem. Die Video-Analyse zeigt dir, wie du wirkst: "
            "Stimme, Tempo, Struktur, Präsenz. Playbooks sind fertige Abläufe für "
            "wiederkehrende Situationen. Regel für den Anfang: erst denken im Chat, dann üben in "
            "der Simulation, dann aufnehmen in der Video-Analyse. Genau diese Reihenfolge macht "
            "den Unterschied."
        ),
    },
    {
        "slug": "start-5-erste-7-tage",
        "order": 5,
        "title": "Deine ersten sieben Tage",
        "script": (
            "Konkret: Heute füllst du deinen Kontext aus und stellst der KI eine echte Frage aus "
            "deinem Alltag. Morgen startest du Tag eins der Challenge — zehn Minuten, nicht mehr. "
            "In der ersten Woche nimmst du außerdem ein Video auf. Ja, das kostet Überwindung. "
            "Genau deshalb wirkt es. Sieben Tage, jeden Tag zehn Minuten. Wer das durchhält, "
            "merkt den Unterschied nicht am Wissen, sondern daran, wie er im nächsten schwierigen "
            "Gespräch dasteht. Lass uns anfangen."
        ),
    },
]

# ── Mission-Intros: Tag 1-7, je 20-35 Sekunden ──────────────────────────────
MISSION_CLIPS = [
    {
        "day": 1,
        "title": "Tag 1: Deine Baseline",
        "script": (
            "Tag eins ist kein Test, den man bestehen muss. Zehn Fragen zeigen dir, wo du in den "
            "sechs Führungsdimensionen heute stehst. Antworte ehrlich, nicht wie das Lehrbuch es "
            "gern hätte — geschönte Antworten bringen dir einen geschönten Plan. Ein gutes "
            "Ergebnis ist nicht die volle Punktzahl, sondern eine Dimension, bei der du sagst: "
            "genau, da bin ich schwach. Damit arbeiten wir die nächsten Wochen."
        ),
    },
    {
        "day": 2,
        "title": "Tag 2: KI richtig einordnen",
        "script": (
            "Heute geht es nicht um Technik, sondern um Haltung. KI nimmt dir keine Entscheidung "
            "ab — sie zeigt dir die Optionen, die du übersehen hättest. Wer sie als Orakel nutzt, "
            "wird faul. Wer sie als Sparringspartner nutzt, wird schneller besser. "
            "Zehn Fragen zum KI-Mindset. Nutze danach den Chat und frag mich nach einer "
            "Entscheidung, die diese Woche bei dir ansteht."
        ),
    },
    {
        "day": 3,
        "title": "Tag 3: Kommunikation, die ankommt",
        "script": (
            "Die meisten Führungskräfte reden klar — und werden trotzdem nicht verstanden. "
            "Der Grund liegt selten an den Worten, sondern an der Reihenfolge. Heute geht es "
            "darum, wie du eine Botschaft baust, die hängen bleibt. Ein gutes Ergebnis: du "
            "formulierst eine Nachricht, die du diese Woche wirklich senden musst, und merkst "
            "beim zweiten Lesen, was du weglassen kannst."
        ),
    },
    {
        "day": 4,
        "title": "Tag 4: Feedback, das wirkt",
        "script": (
            "Feedback scheitert fast nie am Mut, sondern am Zeitpunkt und an der Beobachtung. "
            "Wer sagt „Sie sind unzuverlässig\", bekommt Widerstand. Wer sagt „Der Bericht war "
            "am Dienstag zugesagt und kam am Freitag\", bekommt ein Gespräch. "
            "Heute übst du diesen Unterschied. Ein gutes Ergebnis ist ein Satz, den du morgen "
            "so aussprechen könntest, ohne dich zu verstellen."
        ),
    },
    {
        "day": 5,
        "title": "Tag 5: Entscheiden unter Unsicherheit",
        "schedule_note": "",
        "script": (
            "Führung heißt entscheiden, bevor alle Informationen da sind. Die häufigste "
            "Ausrede lautet: ich brauche noch Zahlen. Manchmal stimmt das. Meistens ist es "
            "Angst vor dem Fehler. Heute lernst du, wie du zwischen beidem unterscheidest. "
            "Ein gutes Ergebnis: du treffst eine Entscheidung, die du seit Wochen vor dir "
            "herschiebst — und schreibst auf, woran du merkst, dass sie falsch war."
        ),
    },
    {
        "day": 6,
        "title": "Tag 6: Konflikte früh ansprechen",
        "script": (
            "Kein Konflikt wird durch Warten kleiner. Er wird nur teurer. Die Kunst ist, ihn "
            "anzusprechen, während er noch klein ist — da fühlt es sich unnötig an, und genau da "
            "funktioniert es. Heute geht es um den ersten Satz eines solchen Gesprächs. "
            "Ein gutes Ergebnis: du weißt, mit welcher Person du diese Woche zehn Minuten "
            "sprechen solltest, und wie du beginnst."
        ),
    },
    {
        "day": 7,
        "title": "Tag 7: Woche eins auswerten",
        "script": (
            "Sieben Tage sind geschafft — jetzt kommt der Teil, den die meisten überspringen: "
            "auswerten. Nicht „war gut\", sondern konkret: Was hast du anders gemacht als vorher? "
            "Wo bist du in die alte Rolle zurückgefallen? Ein gutes Ergebnis heute ist eine "
            "einzige Sache, die du in Woche zwei bewusst wiederholst. Eine. Nicht fünf. "
            "Wer fünf Dinge ändern will, ändert nichts."
        ),
    },
]


def seed_clips() -> list[dict]:
    """Alle Clips der aktuellen Stufe als flache Liste (Reihenfolge = Anzeige)."""
    clips = [
        {
            "slug": c["slug"],
            "kind": "teaser",
            "ref": None,
            "order": c["order"],
            "title": c["title"],
            "script": c["script"],
            "shot_preset": c["shot_preset"],
        }
        for c in TEASER_CLIPS
    ]
    clips.append({
        "slug": LOGIN_TEASER["slug"], "kind": "teaser", "ref": None, "order": LOGIN_TEASER["order"],
        "title": LOGIN_TEASER["title"], "script": " ".join(LOGIN_TEASER["script"].split()),
        "multi_shot": True, "aspect": "9:16",
    })
    clips += [
        {
            "slug": c["slug"],
            "kind": "onboarding",
            "ref": None,
            "order": c["order"],
            "title": c["title"],
            "script": " ".join(c["script"].split()),
            "aspect": "16:9",
        }
        for c in ONBOARDING_CLIPS
    ]
    clips += [
        {
            "slug": f"mission-day-{c['day']}",
            "kind": "mission",
            "ref": str(c["day"]),
            "order": 100 + c["day"],
            "title": c["title"],
            "script": " ".join(c["script"].split()),
            "aspect": "16:9",
        }
        for c in MISSION_CLIPS
    ]
    return clips


def word_count(text: str) -> int:
    return len([w for w in (text or "").split() if w.strip()])

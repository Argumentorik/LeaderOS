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
}

# ── Teaser: Ein 10-s-Shot für Social (Stufe A) ──────────────────────────────
TEASER_CLIPS = [
    {
        "slug": "teaser-spotlight",
        "order": 0,
        "title": "Teaser: Ins Licht",
        "script": "Führung ist kein Talent. Führung ist ein System. Willkommen bei Leader-OS.",
        "shot_preset": "spotlight_entrance",
    },
]

# ── Erststart-Serie: 5 Clips, je 30-45 Sekunden ──────────────────────────────
ONBOARDING_CLIPS = [
    {
        "slug": "start-1-willkommen",
        "order": 1,
        "title": "Willkommen bei Leader-OS",
        "script": (
            "Schön, dass du da bist. Leader-OS ist kein Kurs, den du abarbeitest — es ist dein "
            "Sparringspartner für echte Führungssituationen. Das schwierige Gespräch morgen. "
            "Der Mitarbeiter, der abbaut. Die Präsentation vor dem Vorstand. "
            "In den nächsten zehn Minuten richtest du dein System ein: du sagst mir, wer du bist "
            "und wo du führst. Danach arbeiten wir an deinen Fällen, nicht an Beispielen aus "
            "einem Lehrbuch. Nimm dir die zehn Minuten wirklich. Sie entscheiden, wie gut alles "
            "danach wird."
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
    clips += [
        {
            "slug": c["slug"],
            "kind": "onboarding",
            "ref": None,
            "order": c["order"],
            "title": c["title"],
            "script": " ".join(c["script"].split()),
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
        }
        for c in MISSION_CLIPS
    ]
    return clips


def word_count(text: str) -> int:
    return len([w for w in (text or "").split() if w.strip()])

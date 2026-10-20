"""Guide-Video-Inhalte (Iter 142) — Stufe B: Erststart-Serie + Tag 1-7.

Jeder Clip trägt sein Skript ALS FALLBACK-TEXT im Code. Fehlt das Video (noch
nicht produziert, nicht freigegeben oder Ladefehler), zeigt die Oberfläche
genau diesen Text — es entsteht nie ein Loch.

Wortgrenze ist keine Kosmetik: Fal rechnet pro Sekunde Video ab.
"""

SCRIPT_MIN_WORDS = 55
SCRIPT_MAX_WORDS = 115
WORD_LIMITS = {"teaser": (6, 190), "onboarding": (70, 150), "feature": (70, 150), "mission": (55, 130), "coaching": (70, 170)}


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
# Präsenz-Talk-Shots: Portrait-Beschnitt statt Ganzkörper — sonst kopiert das Modell das Ganzkörper-Referenzfoto.
WLAD_STYLE_PROMPT_TALK = (
    "High-end Pixar-style 3D animated character of the man in the first reference image: keep his exact "
    "face, dark side-parted hair, short stubble beard, warm brown eyes and friendly confident expression. "
    "Same athletic build, outfit and confident posture as the man in the second reference image, but framed "
    "like a portrait photo: crop at the waist or chest, NOT full body, no legs, no feet, no floor visible. "
    "The person fills at least 70 percent of the image height and is centered. He wears a dark green velvet "
    "blazer, a light blue shirt with open collar, no tie. Clean stylized 3D animation film look, subsurface "
    "skin, soft fabric detail, no text, no watermark."
)


def style_prompt_for(preset: dict) -> str:
    return WLAD_STYLE_PROMPT_TALK if preset.get("kind") == "talk" else WLAD_STYLE_PROMPT

SHOT_PRESETS = {
    # ── GODMODE (Iter 154): Präsenz statt Herumlaufen ─────────────────────────
    "loft_seated_medium": {
        "label": "Loft · sitzend, halbnah",
        "kind": "talk",
        "scene_prompt": (
            "Scene: TIGHT medium shot framed from the waist up — his head sits near the top edge of the frame and his "
            "torso fills most of the image height, table edge at the bottom, no legs visible. He sits relaxed at a warm "
            "wooden table in a modern bright loft office, tall windows with soft daylight behind him, blurred background "
            "with concrete, warm wood, a few plants and a softly glowing lime-green screen. Camera close, slightly above "
            "eye level, like sitting across the table from him. He leans in a little, forearms resting on the table, "
            "looks straight into the camera with a warm, attentive expression. Horizontal 16:9 composition, he is large "
            "and present in frame, face sharp, Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "He stays seated and present, talks directly to the camera like in a calm one-on-one conversation: "
            "natural lip movement in sync with the voice, subtle nods, small purposeful hand gestures resting on "
            "the table, warm eye contact, relaxed breathing. No walking, no camera cuts, steady framing, consistent "
            "character and outfit, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
    "loft_seated_closeup": {
        "label": "Loft · sitzend, Close-up",
        "kind": "talk",
        "scene_prompt": (
            "Scene: TIGHT close-up framed from the chest up — his face fills the upper half of the frame, shoulders "
            "touch the frame edges, no legs, no full body. He sits at a warm wooden table in a modern bright loft office, "
            "soft daylight from the side, strongly blurred background with warm wood and a softly glowing lime-green "
            "screen. Camera close, slightly above eye level. He looks straight into the camera with calm confidence and "
            "a slight smile, as if finishing an important thought. Horizontal 16:9 composition, face large and "
            "sharp in frame, Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "He stays seated and present, speaks directly to the camera with natural lip movement in sync with the "
            "voice, calm micro-expressions, a slight nod to underline key words, steady eye contact, ends with a "
            "warm confident smile and holds the gaze. No walking, no camera cuts, steady framing, consistent "
            "character and outfit, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
    "studio_medium": {
        "label": "Dunkles Studio · halbnah",
        "kind": "talk",
        "scene_prompt": (
            "Scene: TIGHT medium shot framed from the waist up — his head sits near the top edge of the frame and his "
            "torso fills most of the image height, legs NOT visible. He stands in a dark cinematic studio with a pitch-black "
            "background. A single soft spotlight from above lights him, subtle haze, a thin lime-green rim light "
            "on his shoulder. He stands still and grounded, looks straight into the camera with focused, warm "
            "confidence. Horizontal 16:9 composition, face sharp, premium Apple-keynote look, Netflix-quality "
            "animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "He stands grounded in the spotlight and speaks directly to the camera: natural lip movement in sync "
            "with the voice, deliberate small hand gestures, subtle head movement, steady eye contact. No walking, "
            "no camera cuts, steady framing, volumetric haze, consistent character and outfit, smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
    "studio_closeup": {
        "label": "Dunkles Studio · Close-up",
        "kind": "talk",
        "scene_prompt": (
            "Scene: TIGHT close-up framed from the chest up — his face fills the upper half of the frame, no legs, no "
            "full body. He stands in a dark cinematic studio with a pitch-black background, "
            "soft key light from above, a thin lime-green rim light, subtle haze. He looks straight into the camera "
            "with calm confidence and a slight smile. Horizontal 16:9 composition, face large and sharp in frame, "
            "premium keynote look, Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "He speaks directly to the camera with natural lip movement in sync with the voice, calm "
            "micro-expressions, a slight nod on key words, steady eye contact, ends with a confident smile and "
            "holds the gaze. No walking, no camera cuts, steady framing, consistent character and outfit, "
            "smooth realistic motion."
        ),
        "duration": "10",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
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
    # GODMODE Walk-in (Iter 167): Wlad kommt aus dem Dunkel ins Licht — Kling 2.6 mit nativem Ton (Schritte, Raumklang).
    # Der Shot endet auf dem Keyframe des folgenden Talk-Shots (end_image) -> nahtloser Übergang ins Sprechen.
    "studio_walk_in": {
        "label": "Dunkles Studio · Walk-in mit Ton",
        "kind": "walk",
        "audio": True,
        "scene_prompt": (
            "Scene: a dark cinematic studio with a pitch-black background and a polished dark floor. A single hard "
            "spotlight from above forms a bright cone of light in the center with subtle haze and volumetric light, "
            "a thin lime-green rim light at the edge of the beam. He stands a few steps behind the light cone, still "
            "half in shadow, mid-stride, about to walk forward into the light toward the camera, calm and confident. "
            "Vertical 9:16 composition, full body visible with feet on the floor, premium Apple-keynote look, "
            "Netflix-quality animation film still, shallow depth of field, 8k render."
        ),
        "motion_prompt": (
            "The man walks calmly and confidently forward out of the darkness into the spotlight, straight toward the "
            "camera, with a relaxed natural stride and a slight arm swing. Slow cinematic dolly-in that follows him, so "
            "that by the end he stands grounded in the center of the light, framed from the waist up, looking straight "
            "into the camera with a warm, focused expression and a slight confident smile. Volumetric haze in the "
            "light beam, consistent character and outfit, no camera cuts, smooth realistic motion."
        ),
        "ambience_prompt": (
            "soft steady footsteps of leather shoes on a polished studio floor, quiet studio room tone, "
            "a very subtle deep cinematic ambience swelling gently as he steps into the light, no speech, no music"
        ),
        "duration": "5",
        "speech_start": 0.0,
        "aspect_ratio": "9:16",
    },
    # Login-Film (Iter 171): Loft -> Dunkelheit -> Spotlight. Start = eigener Keyframe (Wlad steht am Tisch),
    # Ende = Keyframe des folgenden Studio-Shots (end_image) -> fließender Ortswechsel ohne Schnitt.
    "loft_walk_out": {
        "label": "Loft · steht auf und geht ins Dunkel",
        "kind": "walk",
        "audio": True,
        "scene_prompt": (
            "Scene: a bright modern loft office with warm daylight from tall windows, a wooden table with a laptop, "
            "green plants. He has just stood up from the chair beside the table and stands upright, turned slightly "
            "toward a dark open doorway at the back of the room, calm and decisive. Full body visible, feet on the "
            "floor, wide 16:9 composition, premium Apple-keynote look, Netflix-quality animation film still, 8k render."
        ),
        "motion_prompt": (
            "The man turns and walks calmly away from the table toward the dark doorway at the back. As he walks, the "
            "warm daylight of the loft fades away and the room falls into darkness; then a single hard spotlight "
            "switches on ahead of him and he steps into the cone of light and turns to face the camera, ending framed "
            "from the waist up in a dark studio with volumetric haze. One continuous smooth camera move following him, "
            "no cuts, consistent character and outfit, cinematic, realistic motion."
        ),
        "ambience_prompt": (
            "calm footsteps of leather shoes on a wooden floor becoming footsteps on a polished studio floor, "
            "quiet room tone, a soft click of a stage spotlight switching on, subtle deep cinematic ambience, no speech, no music"
        ),
        "duration": "10",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
    },
    "studio_push_in": {
        "label": "Studio · langsame Fahrt nah heran",
        "kind": "walk",
        "audio": True,
        "keyframe_from": "prev",  # Start = Keyframe des vorigen Studio-Shots, Ende = Close-up des nächsten
        "scene_prompt": "",
        "motion_prompt": (
            "Very slow, steady cinematic dolly-in toward the man standing in the single spotlight; he stays still, "
            "breathes calmly, holds eye contact with the camera with a focused, warm expression. The framing tightens "
            "from waist-up to a close-up of his face and shoulders. The lighting stays exactly the same the whole time: "
            "one soft spotlight from above, pitch-black background, no new lights, no light rays, no sparkles, no "
            "flashes, no fog change. No cuts, no speech, consistent character and outfit."
        ),
        "ambience_prompt": "very quiet studio room tone, subtle low cinematic hum, no speech, no music",
        "duration": "5",
        "speech_start": 0.0,
        "aspect_ratio": "16:9",
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
    "coaching-pakete": ["videos", "chat", "simulations", "coaching"],
    "bp-playbooks": ["playbooks", "chat", "tools"],
    "bp-missionen": ["missions", "video", "progress"],
    "bp-video-analyse": ["video", "missions", "progress"],
    "bp-workflows": ["tools", "chat", "playbooks"],
    "bp-challengers": ["challenge", "video", "progress"],
    "bp-simulationen": ["simulations", "chat", "progress"],
}

# Best-Practice-Clips (Kind "feature"): Wlad erklärt, wie man ein Feature richtig nutzt — sitzt direkt auf der Feature-Seite
FEATURE_CLIPS = [
    {"slug": "bp-playbooks", "order": 300, "title": "Playbooks richtig nutzen"},
    {"slug": "bp-missionen", "order": 301, "title": "Video-Missionen: so trainierst du"},
    {"slug": "bp-video-analyse", "order": 302, "title": "Video-Analyse: so liest du dein Feedback"},
    # Iter 180: ein Take, nur Wlad im Studio — Skript + Lippensynchron neu, kein neues Filmmaterial
    {"slug": "bp-workflows", "order": 303, "title": "Workflows: die Abkürzung für deine Vorbereitung", "single_take": True},
    {"slug": "bp-challengers", "order": 304, "title": "Challengers: so nutzt du die Bühne", "single_take": True},
    {"slug": "bp-simulationen", "order": 305, "title": "Simulationen: so sparrst du richtig", "single_take": True},
]

# Vorschlagsfragen für „Mit WladBot sprechen“ (Fallback: generisch)
CLIP_QUESTIONS = {
    "bp-playbooks": ["Welches Playbook passt zu meinem Gespräch nächste Woche?", "Wie formuliere ich das Ziel in einem Satz?", "Was mache ich mit dem Advice Report?"],
    "bp-missionen": ["Welche Mission sollte ich zuerst machen?", "Wie fange ich die ersten zehn Sekunden an?", "Was ändere ich im zweiten Versuch?"],
    "bp-video-analyse": ["Was bedeutet SEXIER genau?", "Welches Video eignet sich zum Hochladen?", "Wie lese ich meinen Score richtig?"],
    "bp-workflows": ["Welcher Workflow passt zu meinem nächsten Termin?", "Wie formuliere ich eine Absage, die nicht verbrennt?", "Wie strukturiere ich ein Meeting in fünf Minuten?"],
    "bp-challengers": ["Mit welcher Challenge fange ich an?", "Wie bekomme ich eine bessere Bewertung?", "Was schaue ich mir bei anderen an?"],
    "bp-simulationen": ["Welche Simulation passt zu meinem Gespräch morgen?", "Wie mache ich mein Gegenüber schwieriger?", "Woran merke ich, dass ich besser werde?"],
    "coaching-pakete": ["Welches Paket passt zu meiner Situation?", "Was passiert in den Live-Coachings?", "Wie schnell sehe ich Ergebnisse?"],
    "teaser-login": ["Wie startest du mit mir?", "Was bringt mir der erste Tag?", "Was unterscheidet dich von einem Kurs?"],
}
DEFAULT_QUESTIONS = ["Wie wende ich das morgen konkret an?", "Was ist der häufigste Fehler dabei?", "Gib mir ein Beispiel aus deiner Praxis."]


def clip_questions(slug: str) -> list[str]:
    return CLIP_QUESTIONS.get(slug, DEFAULT_QUESTIONS)
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
# GODMODE (Iter 154): Präsenz-Plan — Wlad ist ab Sekunde 1 im Bild und spricht direkt, kein Walk-in.
PRESENCE_SETTINGS = {
    "loft": ("loft_seated_medium", "loft_seated_closeup"),
    "studio": ("studio_medium", "studio_closeup"),
}
# Wlad wirkt einige Zentimeter größer: längere Beine, elegante Proportionen (Nutzerwunsch Iter 154).
WLAD_STATURE = "He is tall with long legs and elegant, athletic proportions (about 1.90 m), upright posture. "
WLAD_STATURE_TALK = "He is tall with broad shoulders and an upright, relaxed posture; the camera is close to him. "
# Studio-Look für Clips über Videos, Simulationen & Co.; sonst Gesprächs-Charakter im Loft.
CLIP_SETTING = {"start-4-werkzeuge": "studio", "teaser-login": "studio", "teaser-spotlight": "studio",
                "coaching-pakete": "studio", "bp-playbooks": "studio", "bp-missionen": "studio", "bp-video-analyse": "studio",
                "bp-workflows": "studio", "bp-challengers": "studio", "bp-simulationen": "studio"}


def presence_plan(setting: str = "loft") -> list[dict]:
    medium, closeup = PRESENCE_SETTINGS.get(setting, PRESENCE_SETTINGS["loft"])
    return [
        {"type": "talk", "preset": medium, "max_words": 64},
        {"type": "broll"},
        {"type": "talk", "preset": closeup, "max_words": 50},
    ]


TALK_LEAD_SECONDS = 0.4   # Wlad ist kurz still im Bild, bevor er spricht
TALK_TAIL_SECONDS = 0.5   # Iter 177: 0,5 s Ruhe nach dem letzten Wort — der Rest ist Blende (OUTRO_FADE_SECONDS), kein Standbild
OUTRO_FADE_SECONDS = 0.8  # Bild + Ton blenden gemeinsam aus, dann Verabschiedungs-Karte

# Verabschiedungs-Karte je Clip (Iter 169): Abschiedssatz + nächster Schritt. Fallback für alle anderen Clips.
FAREWELLS = {
    "teaser-login": ("Fang heute an.", "Kostenlos starten · leadercheck.de"),
    "start-1-willkommen": ("Wir sehen uns gleich.", "Weiter → So sprichst du mit mir"),
    "start-2-so-sprichst-du": ("Ich lese mit.", "Jetzt → Schreib mir deine Situation im Chat"),
    "start-3-kontext": ("Ich warte hier auf dich.", "Jetzt → Deinen Kontext ausfüllen"),
    "start-4-werkzeuge": ("Bis gleich.", "Weiter → Deine ersten 7 Tage"),
    "start-5-erste-7-tage": ("Bis morgen.", "Morgen → Tag 1: Deine Baseline"),
    "mission-day-1": ("Ich bin gespannt.", "Jetzt → Challenge Tag 1 starten"),
    "mission-day-2": ("Damit arbeiten wir.", "Jetzt → Challenge Tag 2 starten"),
    "mission-day-3": ("Wir vergleichen.", "Jetzt → Challenge Tag 3 starten"),
    "mission-day-4": ("Ich höre zu.", "Jetzt → In der Simulation üben"),
    "mission-day-5": ("Bis Freitag.", "Jetzt → Challenge Tag 5 starten"),
    "mission-day-6": ("Je früher, desto leichter.", "Jetzt → In der Simulation üben"),
    "mission-day-7": ("Bis morgen, in Woche zwei.", "Morgen → Woche zwei"),
    "coaching-pakete": ("Wir sehen uns drinnen.", "Weiter → Dein Paket wählen"),
    "bp-playbooks": ("Bis gleich.", "Jetzt → Ein Playbook öffnen"),
    "bp-missionen": ("Bis gleich.", "Jetzt → Deine erste Mission"),
    "bp-video-analyse": ("Kamera an.", "Jetzt → Video-Analyse starten"),
}
FAREWELL_DEFAULT = ("Bis bald.", None)


def farewell_for(slug: str) -> tuple[str, str | None]:
    return FAREWELLS.get(slug, FAREWELL_DEFAULT)
TALK_MAX_SECONDS = 9.2
TALK_MAX_SECONDS_PRO = 28.0
TALK_MAX_SECONDS_SINGLE = 58.0  # Single-Take (OmniHuman 720p, ein durchgehender Take, eine Tonspur)


def single_take_plan(setting: str = "loft") -> list[dict]:
    """GODMODE-Gesprächsniveau: ein ruhiger Präsenz-Shot, der ganze Text als eine Tonspur, kein Schnitt."""
    medium, _ = PRESENCE_SETTINGS.get(setting, PRESENCE_SETTINGS["loft"])
    return [{"type": "talk", "preset": medium, "max_words": 160}]


# Walk-in vor dem Single-Take (Login-Teaser): Wlad kommt mit Ton herein, dann ein durchgehender Talk.
WALK_IN_PRESETS = {"studio": "studio_walk_in", "loft": "loft_walk_in"}
TALK_LEAD_AFTER_WALK_SECONDS = 0.7  # nach dem Ankommen kurz stehen und schauen, dann sprechen


def walk_in_plan(setting: str = "studio") -> list[dict]:
    return [{"type": "walk", "preset": WALK_IN_PRESETS.get(setting, WALK_IN_PRESETS["studio"])}, *single_take_plan(setting)]


# Film-Pläne (Iter 171): Absätze des Skripts (Leerzeile) werden der Reihe nach auf die Talk-Shots verteilt.
FILM_PLANS = {
    "login_film": [
        {"type": "talk", "preset": "loft_seated_medium"},
        {"type": "walk", "preset": "loft_walk_out"},
        {"type": "talk", "preset": "studio_medium"},
        {"type": "walk", "preset": "studio_push_in"},
        {"type": "talk", "preset": "studio_closeup"},
    ],
}
FILM_CARD_SECONDS = {"login_film": 4.5}


def film_shots(script: str, plan_name: str) -> list[dict]:
    plan = FILM_PLANS[plan_name]
    paragraphs = [" ".join(p.split()) for p in script.split("\n\n") if p.strip()]
    talks = [i for i, s in enumerate(plan) if s["type"] == "talk"]
    if len(paragraphs) != len(talks):
        raise ValueError(f"Film {plan_name}: {len(talks)} Sprech-Kapitel erwartet, {len(paragraphs)} Absätze im Skript")
    texts = dict(zip(talks, paragraphs))
    return [{"id": f"s{i + 1}", "type": s["type"], "preset": s["preset"], "screens": [], "text": texts.get(i, "")}
            for i, s in enumerate(plan)]
FRAMES = {"16:9": (1280, 720), "9:16": (720, 1280)}


def scene_for_aspect(prompt: str, aspect: str, talk: bool = False) -> str:
    prompt = prompt.replace("Horizontal 16:9 composition", "Vertical 9:16 composition") if aspect == "9:16" else prompt
    stature = WLAD_STATURE_TALK if talk else WLAD_STATURE
    return prompt if stature in prompt else prompt.replace("Scene: ", "Scene: " + stature, 1)


SINGLE_TAKE_WORD_CAP = 160  # ein durchgehender Take bis ~58 s


def talk_word_cap(preset_name: str, single_take: bool = False) -> int:
    """Wortbudget eines Talk-Shots: Single-Take 160 (bis 58 s), Präsenz-Shots (OmniHuman, bis 28 s) 64/50,
    alte 10-s-Kling-Shots 26."""
    if single_take:
        return SINGLE_TAKE_WORD_CAP
    for medium, closeup in PRESENCE_SETTINGS.values():
        if preset_name == medium:
            return 64
        if preset_name == closeup:
            return 50
    return 26


def _sentences(text: str) -> list[str]:
    import re

    return [p for p in re.split(r"(?<=[.!?])\s+", " ".join(text.split())) if p]


def _take_words(sentences: list[str], max_words: int) -> tuple[str, list[str]]:
    """Nimmt ganze Sätze von vorn, bis max_words erreicht wäre (mindestens einen).
    Passt der nächste Satz nicht mehr ganz, wird er am letzten Komma/Gedankenstrich innerhalb
    des Budgets geteilt — so landet der Einstieg bei Wlad statt in der App-Tour."""
    taken, count = [], 0
    for s in sentences:
        n = len(s.split())
        if taken and count + n > max_words:
            break
        taken.append(s)
        count += n
        if count >= max_words:
            break
    rest = sentences[len(taken):]
    budget = max_words - count
    if rest and budget >= 10:
        nxt = rest[0]
        words = nxt.split()
        head_words = " ".join(words[:budget])
        cut = max(head_words.rfind(", "), head_words.rfind(" – "), head_words.rfind(" — "), head_words.rfind(": "))
        if cut >= len(" ".join(words[:6])):
            head, tail = nxt[:cut + 1].rstrip(",:"), nxt[cut + 1:].strip(" –—")
            if len(tail.split()) >= 4:
                taken.append(head + ("" if head.endswith((".", "!", "?")) else "."))
                rest = [tail[0].upper() + tail[1:]] + rest[1:]
    return " ".join(taken), rest


def _talk_limits(plan: list[dict], talks: list[int], total: int, pro: bool, setting: str | None) -> tuple[int, int]:
    """Wortbudget für ersten/letzten Talk-Shot. pro: Anteile (~55 % Einstieg, ~30 % Abschluss), sonst Preset-Maximum."""
    if not talks:
        return 0, 0
    first_max, last_max = plan[talks[0]]["max_words"], plan[talks[-1]]["max_words"]
    if not pro:
        return first_max, last_max
    share_first, share_last = (0.55, 0.3) if setting else (0.5, 0.25)
    return min(first_max, max(12, round(total * share_first))), min(last_max, max(10, round(total * share_last)))


def _split_long_sentence(last: str) -> tuple[str, str]:
    """Satz am letzten Komma/Gedankenstrich (vor der Mitte + 20 Zeichen) in Kopf und Rest teilen."""
    cut = max(last.rfind(", ", 0, len(last) // 2 + 20), last.rfind(" — ", 0, len(last) // 2 + 20))
    if cut <= 0:
        return "", last
    head, rest = last[:cut + 1].rstrip(","), last[cut + 1:].strip(" —")
    head += "" if head.endswith((".", "!", "?")) else "."
    return head, (rest[0].upper() + rest[1:] if rest else rest)


def _take_tail(sentences: list[str], limit: int) -> str:
    """Nimmt ganze Sätze vom Ende bis `limit` Wörter; passt kein ganzer Satz, wird der letzte geteilt."""
    tail, count = [], 0
    while sentences and count + len(sentences[-1].split()) <= limit:
        tail.insert(0, sentences.pop())
        count += len(tail[0].split())
    if not tail and sentences:
        head, rest = _split_long_sentence(sentences.pop())
        if head:
            sentences.append(head)
        tail = [rest]
    return " ".join(tail)


def _single_take_shots(script: str, setting: str | None, walk_in: bool) -> list[dict]:
    text = " ".join(script.split())
    if walk_in:
        walk, medium = walk_in_plan(setting or "studio")
        return [{"id": "s1", "type": "walk", "preset": walk["preset"], "screens": [], "text": ""},
                {"id": "s2", "type": "talk", "preset": medium["preset"], "screens": [], "text": text}]
    medium = single_take_plan(setting or "loft")[0]
    return [{"id": "s1", "type": "talk", "preset": medium["preset"], "screens": [], "text": text}]


def plan_shots(script: str, screens: list[str] | None = None, pro: bool = False, setting: str | None = None,
               single_take: bool = False, walk_in: bool = False, film: str | None = None) -> list[dict]:
    """Verteilt den Sprechtext: erster Talk-Shot = Anfang, letzter Talk-Shot = Ende,
    B-Roll bekommt den Rest in der Mitte. pro = längere Talk-Passagen (OmniHuman, kein 10-s-Limit).
    setting = Präsenz-Plan ohne Walk-in ("loft" | "studio"). walk_in = Single-Take mit Walk-in davor.
    film = benannter Film-Plan (Kapitel = Absätze des Skripts)."""
    if film:
        return film_shots(script, film)
    if single_take:
        return _single_take_shots(script, setting, walk_in)
    plan = presence_plan(setting) if setting else (MULTI_SHOT_PLAN_PRO if pro else MULTI_SHOT_PLAN)
    screens = screens or DEFAULT_SCREENS
    sentences = _sentences(script)
    talks = [i for i, s in enumerate(plan) if s["type"] == "talk"]
    first_limit, last_limit = _talk_limits(plan, talks, word_count(script), pro, setting)
    texts: dict[int, str] = {}
    if talks:
        texts[talks[0]], sentences = _take_words(sentences, first_limit)
        if len(talks) > 1:
            texts[talks[-1]] = _take_tail(sentences, last_limit)
    return [{
        "id": f"s{i + 1}", "type": tpl["type"], "preset": tpl.get("preset"),
        "screens": screens if tpl["type"] == "broll" else [],
        "text": " ".join(sentences) if tpl["type"] == "broll" else texts.get(i, ""),
    } for i, tpl in enumerate(plan)]

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


def _clip(slug: str, kind: str, order: int, title: str, script: str, **extra) -> dict:
    return {"slug": slug, "kind": kind, "ref": extra.pop("ref", None), "order": order, "title": title,
            "script": normalize_script(script), **extra}


def normalize_script(text: str) -> str:
    """Whitespace glätten, Absätze (Leerzeile = Film-Kapitel) erhalten."""
    return "\n\n".join(" ".join(p.split()) for p in text.split("\n\n") if p.strip())


def seed_clips() -> list[dict]:
    """Alle Clips der aktuellen Stufe als flache Liste (Reihenfolge = Anzeige)."""
    from guide_scripts_godmode import SCRIPTS as GODMODE_SCRIPTS

    for c in ONBOARDING_CLIPS:
        c["script"] = GODMODE_SCRIPTS.get(c["slug"], c["script"])
    LOGIN_TEASER["script"] = GODMODE_SCRIPTS.get("teaser-login", LOGIN_TEASER["script"])
    clips = [_clip(c["slug"], "teaser", c["order"], c["title"], c["script"], shot_preset=c["shot_preset"]) for c in TEASER_CLIPS]
    clips.append(_clip(LOGIN_TEASER["slug"], "teaser", LOGIN_TEASER["order"], LOGIN_TEASER["title"], LOGIN_TEASER["script"],
                       multi_shot=True, aspect="16:9", film="login_film", music_bed=True))
    clips += [_clip(c["slug"], "onboarding", c["order"], c["title"], c["script"], aspect="16:9", single_take=True) for c in ONBOARDING_CLIPS]
    # Iter 169: Missionen = ein Take, nur Wlad, dunkles Studio, keine B-Roll
    clips += [_clip(f"mission-day-{c['day']}", "mission", 100 + c["day"], c["title"],
                    GODMODE_SCRIPTS.get(f"mission-day-{c['day']}", c["script"]), ref=str(c["day"]), aspect="16:9",
                    single_take=True, setting="studio")
              for c in MISSION_CLIPS]
    clips.append(_clip("coaching-pakete", "coaching", 200, "Was du mit Leader-OS bekommst", GODMODE_SCRIPTS["coaching-pakete"],
                       multi_shot=True, aspect="16:9"))
    clips += [_clip(c["slug"], "feature", c["order"], c["title"], GODMODE_SCRIPTS[c["slug"]],
                    multi_shot=not c.get("single_take"), single_take=bool(c.get("single_take")),
                    setting="studio" if c.get("single_take") else None, aspect="16:9")
              for c in FEATURE_CLIPS]
    return clips


def word_count(text: str) -> int:
    return len([w for w in (text or "").split() if w.strip()])

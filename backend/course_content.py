"""Leader-OS Kurs-Bibliothek (Drehbuch V01, Aufnahme durch Wlad).

10 Kurse · 72 Folgen. Folge 1 jedes Kurses = FREE Preview. Kurse 1–6 = Tier standard (Leader-OS €997),
Kurse 7–10 = Tier accelerator (Leadership OS PLUS). Videos werden nach der Aufnahme im Admin hochgeladen.
"""

STANDARD, PLUS = "standard", "accelerator"
TIER_RANK = {"free": 0, STANDARD: 1, PLUS: 2, "enterprise": 2}


def _ep(title: str, minutes: int, purpose: str, bullets: list[str] | None = None) -> dict:
    return {"title": title, "minutes": minutes, "purpose": purpose, "bullets": bullets or []}


COURSES = [
    {"slug": "rhetorik-grundlagen", "title": "Rhetorik-Grundlagen", "tier": STANDARD, "emoji": "📕",
     "tagline": "Rhetorik ist kein Talent, sondern ein System mit Regeln und Hebeln.",
     "episodes": [
        _ep("Warum 90 % aller Führungskräfte falsch reden — und die 30-Sekunden-Formel", 10,
            "Sofort beweisen, dass Rhetorik System ist. Quick Win, der heute funktioniert.",
            ["Rhetorik ist kein Talent, sondern ein System mit Regeln und Hebeln.",
             "Die drei häufigsten Fehler: zu lang reden, falsche Ebene, Zuhörer in 30 Sekunden verlieren.",
             "Logos–Ethos–Pathos: 80 % der Manager nutzen nur Logos — und scheitern damit.",
             "Die 30-Sekunden-Formel: „Mein Punkt ist X, weil Y, und das bedeutet für uns Z.“",
             "Live-Beispiel: Launch-Verschiebung als 8-Sekunden-Statement — klar, scharf, entscheidbar."]),
        _ep("Stimm-Architektur — wie du klingst entscheidet alles", 8, "Spürbare Wirkungssteigerung beim ersten Telefonat nach dem Kurs."),
        _ep("Körpersprache dekodiert — was deine Hände verraten", 7, "Aha-Momente, die du im nächsten Meeting spürst."),
        _ep("Einwand-Vorwegnahme — überzeugen, bevor Widerstand entsteht", 9, "Der Hebel, der bei Budget- und Strategie-Pitches sofort messbar wirkt."),
        _ep("Schwarze Rhetorik erkennen — Manipulation im Meeting", 8, "Schutzschild-Effekt: nie wieder ausgespielt werden."),
        _ep("Der Elevator Pitch — 60 Sekunden, die entscheiden", 10, "Du baust nach dem Video deinen eigenen Pitch."),
     ]},
    {"slug": "schwierige-gespraeche", "title": "Schwierige Gespräche meistern", "tier": STANDARD, "emoji": "📗",
     "tagline": "Vermeidung kostet mehr als jeder Fehler — die Feedbackformel als Werkzeug.",
     "episodes": [
        _ep("Warum schwierige Gespräche scheitern — und die Feedbackformel", 10,
            "Den Schmerz der Vermeidung benennen. Die Formel als sofortiges Werkzeug.",
            ["Drei Szenarien, die jeder kennt: Underperformer, reinredende Kollegin, unbequemes Gespräch nach oben.",
             "Warum Gespräche scheitern: Beobachtung mit Bewertung vermischen, Person statt Verhalten angreifen.",
             "Die Feedbackformel: Wahrnehmung — Wirkung — Wunsch.",
             "Die 48-Stunden-Regel: nicht sofort, nicht später — genau 48 Stunden.",
             "Beweis: DAX-Abteilungsleiter, acht Monate Problem — gelöst in einem Gespräch."]),
        _ep("Konflikte im Team moderieren", 9, "Vom Beteiligten zum Moderator — spürbar im nächsten Team-Konflikt."),
        _ep("Emotionale Reaktionen auffangen", 10, "Sicherheit in Momenten, die jeden überfordern: Tränen, Schreien, Mauern."),
        _ep("Negatives Feedback, das motiviert", 10, "Kritik kann energetisieren — der scheinbare Widerspruch aufgelöst."),
        _ep("Das Exit-Gespräch", 11, "Die schwerste Disziplin sauber meistern: Würde wahren, rechtssicher, klar."),
     ]},
    {"slug": "delegation", "title": "Delegation wie ein Profi", "tier": STANDARD, "emoji": "📘",
     "tagline": "Raus aus der 60-Stunden-Woche — mit dem KEVL-Framework.",
     "episodes": [
        _ep("Warum die meisten Manager falsch delegieren — und das KEVL-Framework", 10,
            "Den Schmerz der 60-Stunden-Woche aktivieren, KEVL als Ausweg.",
            ["Die zwei tödlichen Wege: Mikromanagement oder Abdikation — beide machen dich zum Flaschenhals.",
             "KEVL: Kontext — Ergebnis — Vertrauen — Loslassen.",
             "Ergebnis definieren, nicht das Wie. Entscheidungsrahmen klären. Bis zum Check-in nicht nachfassen.",
             "Quick Win: „Sag mir in einem Satz: Was lieferst du mir bis wann?“",
             "Beweis: Geschäftsführerin von 55 auf 42 Stunden pro Woche in sechs Wochen."]),
        _ep("Die fünf Delegationsstufen", 9, "Kein Rätselraten mehr: Stufe explizit kommunizieren."),
        _ep("Kompetenzbasierte Delegation", 10, "Raus aus der „immer dieselben drei Leute“-Falle."),
        _ep("Die Comeback-Falle", 9, "Schluss mit Rückdelegation — der wichtigste Selbstmanagement-Hebel."),
     ]},
    {"slug": "feedback-formate", "title": "Feedback-Formate — SBI & WWW", "tier": STANDARD, "emoji": "📙",
     "tagline": "Verhalten statt Identität — Feedback, das Veränderung erzeugt.",
     "episodes": [
        _ep("Warum „Du bist…“-Feedback Vertrauen zerstört — und das SBI-Modell", 10,
            "Verstehen, warum Feedback-Gespräche scheitern. SBI als Werkzeug.",
            ["„Du bist unzuverlässig“ — Identitätsangriffe aktivieren den Bedrohungsmodus im Gehirn.",
             "SBI: Situation — Behavior — Impact. Das validierteste Feedback-Framework der Welt.",
             "Die Kamera-Regel: Hätte eine Kamera das aufgenommen?",
             "Beweis: Vertriebsleiterin, 73 % Identitätsaussagen — nach SBI null Widerstand im Halbjahresgespräch."]),
        _ep("Das WWW-Modell — Wahrnehmung, Wirkung, Wunsch", 8, "Von der Vergangenheits-Beschreibung in zukunftsorientierte Führung."),
        _ep("Peer Feedback ohne Hierarchie", 9, "Den blinden Fleck schließen — die schwerste Feedback-Disziplin."),
        _ep("Upward Feedback — dem Chef sagen, was nicht funktioniert", 10, "Mut zur Klarheit nach oben — ohne Karriere-Risiko."),
        _ep("Feedback-Kultur im Team aufbauen", 10, "Aus deinem Werkzeug die Teamsprache machen."),
     ]},
    {"slug": "storytelling-boardroom", "title": "Storytelling im Boardroom", "tier": STANDARD, "emoji": "📕",
     "tagline": "Vorstände entscheiden nicht auf Basis von Zahlen, sondern von Geschichten.",
     "episodes": [
        _ep("Warum Daten allein niemanden überzeugen — und das Boardroom-Narrative", 9,
            "Den Frust der Vorstandspräsentation aktivieren. Die Struktur als Lösung.",
            ["Das typische Scheitern: 25 Minuten präsentieren — „Was wollen Sie von uns?“",
             "Boardroom-Narrative: Situation → Conflict → Resolution → Ask.",
             "Der Ein-Satz-Test: Wenn der Vorstand nur einen Satz behält — welcher?",
             "Beweis: VP Operations, 1,2 Mio. Budget nach drei abgelehnten Anläufen freigegeben."]),
        _ep("Data Storytelling", 8, "Aus jedem Excel eine Story machen."),
        _ep("Stakeholder Mapping vor dem Meeting", 9, "Vorbereitung als unsichtbare Vorarbeit, die Meetings entscheidet."),
        _ep("Die Ein-Slide-Story", 8, "Maximale Verdichtung — eine Folie, ein Argument."),
        _ep("Krisen-Narrative", 10, "Schlechte Zahlen präsentieren, ohne Vertrauen zu verlieren."),
        _ep("Vision Pitches", 9, "Eine Zukunft erzählen, die noch nicht existiert."),
        _ep("Shareholder Stories", 9, "Investor-Calls und Hauptversammlungen — höchste Sichtbarkeit."),
     ]},
    {"slug": "meeting-rhetorik", "title": "Meeting-Rhetorik", "tier": STANDARD, "emoji": "📗",
     "tagline": "Eröffnung — Steuerung — Abschluss: jedes Meeting dominieren.",
     "episodes": [
        _ep("Warum die meisten Meetings verschwendete Zeit sind — und das Meeting-Dominanz-Modell", 10,
            "16 verschwendete Stunden pro Woche als Schmerz. Drei-Phasen-Modell als Lösung.",
            ["23 Stunden pro Woche in Meetings — über 16 davon verschwendet.",
             "Das Meeting-Dominanz-Modell: Eröffnung — Steuerung — Abschluss.",
             "Wer zusammenfasst, führt.",
             "Quick Win: „Bevor wir loslegen, definieren wir kurz das ideale Ergebnis.“"]),
        _ep("Agenda-Kontrolle — Meetings gewinnen, bevor sie beginnen", 9, "Wer die Agenda schreibt, prägt 80 % des Ergebnisses."),
        _ep("Virtuelle Meeting-Präsenz", 10, "Im Kachelbild sichtbar bleiben."),
        _ep("Die Decision-Forcing-Technik", 10, "Jedes Meeting endet mit Ergebnis. Keine Vertagungen mehr."),
     ]},
    {"slug": "ki-first-leadership", "title": "KI-First Leadership", "tier": PLUS, "emoji": "🔶",
     "tagline": "Die Führungskraft der Zukunft beherrscht KI als Führungsinstrument.",
     "episodes": [
        _ep("Warum Führungskräfte, die KI nicht verstehen, ersetzt werden — und die KI-Kompetenz-Matrix", 12,
            "Existenzielle Dringlichkeit aktivieren, ohne Panik zu machen.",
            ["Drei Kompetenzfallen: Lückenwissen, IT-Delegation, Geschwindigkeitsillusion.",
             "Die KI-Kompetenz-Matrix: Konsument → Anwender → Stratege → Architekt × Individuell → Ökosystem.",
             "Quick Win: der KI-Briefing-Prompt mit drei Optionen und deinem blinden Fleck.",
             "Beweis: Geschäftsführer, 400 Mitarbeitende — 50 Stunden pro Woche im Führungsteam gespart."]),
        _ep("Prompt Engineering für Führungskräfte", 11, "Die strategische Anwendung, nicht die Hobby-Variante."),
        _ep("KI-augmentierte Entscheidungsfindung", 11, "Schneller entscheiden, ohne das Urteil auszulagern."),
        _ep("KI in der Mitarbeiterführung — 1:1s, Feedback, Entwicklung", 11, "Den People-Hebel der KI sichtbar machen."),
        _ep("KI-First Teams aufbauen", 11, "Das Team mitnehmen, ohne Druck zu erzeugen."),
        _ep("Automatisierung von Reports und Analysen", 11, "Operativen Ballast loswerden."),
        _ep("KI-Ethik als Führungsverantwortung", 11, "Klare Grenzen ziehen, bevor andere sie für dich ziehen."),
        _ep("Die Zukunft der KI-Führung — 3, 5, 10 Jahre", 11, "Szenarien für die eigene Karriereplanung."),
        _ep("Kompetitive KI-Vorteile aufbauen", 11, "Vom individuellen Nutzen zum Unternehmensvorteil."),
        _ep("KI-Change-Management", 11, "Transformieren, ohne die Organisation zu zerbrechen."),
        _ep("KI-ROI messen", 11, "Wirkung beweisen, nicht behaupten."),
        _ep("Die KI-native Führungskraft — Integration und Identität", 12, "Alles zusammenführen. Identitäts-Update als Abschluss."),
     ]},
    {"slug": "change-management", "title": "Change Management Master", "tier": PLUS, "emoji": "🔶",
     "tagline": "70 % aller Change-Initiativen scheitern — das Resistance Spectrum als Werkzeug.",
     "episodes": [
        _ep("Warum 70 % aller Change-Initiativen scheitern — und das Resistance Spectrum", 12,
            "Die brutale Zahl als Pattern Interrupt. Resistance Spectrum als Diagnose-Werkzeug.",
            ["Drei Todesarten von Change: Strategie-Friedhof, Anfangs-Euphorie, unsichtbarer Widerstand.",
             "Fünf Positionen: Champions, Offene, Abwartende, Skeptiker, Blockierer.",
             "Wer die Abwartenden gewinnt, gewinnt den Change.",
             "Beweis: CEO mit 1.200 Mitarbeitenden — Reorg in 4 statt 12 Monaten, Fluktuation unter 5 %."]),
        _ep("Stakeholder-Mapping — die Psychologie hinter dem Widerstand", 11, "Tiefer als die Position — die Motive verstehen."),
        _ep("Die Change-Koalition — Verbündete strategisch aufbauen", 11, "Aus dem Einzelkämpfer-Modus rauskommen."),
        _ep("Middle Management Buy-In — der Friedhof guter Strategien", 11, "Den kritischsten Hebel im Change adressieren."),
        _ep("Communication Cascades", 11, "Die Botschaft unverzerrt durch die Organisation bekommen."),
        _ep("Kulturwandel — die unsichtbare Transformation", 11, "Über Strukturwandel hinaus — die tiefste Schicht."),
        _ep("Change Fatigue — wenn die Organisation erschöpft ist", 11, "Die unsichtbare Krankheit erkennen, bevor sie tödlich wird."),
        _ep("Change messen", 11, "Aus Bauchgefühl Daten machen."),
        _ep("Post-Change-Stabilisierung", 11, "Den Rückfall verhindern, der nach sechs Monaten kommt."),
        _ep("Die permanente Change-Organisation", 12, "Identitäts-Update — Change als Normalzustand."),
     ]},
    {"slug": "executive-presence", "title": "Executive Presence & Charisma", "tier": PLUS, "emoji": "🔶",
     "tagline": "Gravitas, Kommunikation, Erscheinung — trainierbar, kein Talent.",
     "episodes": [
        _ep("Was Executive Presence wirklich ist — und warum es nichts mit Charisma zu tun hat", 11,
            "Den Charisma-Mythos zerlegen. Drei trainierbare Säulen.",
            ["Die Beförderungswand: fachlich brillant, aber „irgendwie fehlt noch etwas“.",
             "Drei Säulen: Gravitas + Kommunikation + Erscheinung.",
             "Quick Win: die Zwei-Sekunden-Regel — vor jeder Antwort zwei volle Sekunden Stille.",
             "Beweis: Senior Director, sechs Monate Training, Beförderung zur VP."]),
        _ep("Gravitas unter Druck", 11, "Souveränität, wenn es wirklich zählt."),
        _ep("Strategische Stille", 10, "Die Macht des Nicht-Sprechens."),
        _ep("Die Autoritäts-Stimme", 11, "Stimme als Statussignal."),
        _ep("Dressing the Part", 10, "Erscheinung als strategisches Werkzeug — ohne Klischee."),
        _ep("Virtuelle Executive Presence", 11, "Präsenz durch die Kamera."),
        _ep("Boardroom Body Language", 11, "Den Raum besitzen, ohne ein Wort zu sagen."),
        _ep("Krisen-Präsenz", 12, "Die ultimative Prüfung. Was wirklich bleibt."),
     ]},
    {"slug": "boardroom-strategie", "title": "Boardroom-Strategie", "tier": PLUS, "emoji": "🔶",
     "tagline": "Im Boardroom wird die Entscheidung vor dem Meeting getroffen.",
     "episodes": [
        _ep("Warum brillante Strategen im Boardroom scheitern — und das Board-Psychologie-Framework", 12,
            "Den brillanten Verlierer zeigen. Politik als entscheidendes Spielfeld einführen.",
            ["Thomas, VP Strategy, 45 perfekte Slides — nach sieben Minuten unterbrochen.",
             "Ein Board ist kein rationales Gremium — es ist ein Machtsystem.",
             "Macht-Karten lesen — Allianzen bauen — Raum lesen.",
             "Die Entscheidung fällt vor dem Meeting; im Meeting wird sie formalisiert."]),
        _ep("Pre-Meeting-Politik", 11, "Die unsichtbare Arbeit konkret machen."),
        _ep("Das Sponsor-System", 11, "Warum du jemanden brauchst, der für dich kämpft."),
        _ep("Budget-Narrative", 11, "Investitionen als Geschichten verkaufen."),
        _ep("Schlechte Nachrichten präsentieren", 11, "Vertrauen erhalten in der Krise."),
        _ep("Krisen-Board-Dynamik", 11, "Führen, wenn das Board panisch wird."),
        _ep("Board-Member-Archetypen", 11, "Die sechs Persönlichkeiten verstehen — und sie spielen können."),
        _ep("Shareholder Relations", 11, "Wenn das Board nicht das einzige Publikum ist."),
        _ep("M&A-Kommunikation im Board", 11, "Die höchste Disziplin — wenn Milliarden auf dem Spiel stehen."),
        _ep("Succession Planning Communication", 11, "Über Nachfolge sprechen, bevor es zu spät ist."),
        _ep("Die CEO-Board-Dynamik", 12, "Das komplexeste Verhältnis der Unternehmenswelt."),
     ]},
]


CATEGORIES = {
    "rhetorik": {"de": "Rhetorik & Kommunikation", "en": "Rhetoric & communication"},
    "fuehrung": {"de": "Führung & Gespräche", "en": "Leadership & conversations"},
    "executive": {"de": "Strategie & Executive", "en": "Strategy & executive"},
}
COURSE_CATEGORY = {
    "rhetorik-grundlagen": "rhetorik", "storytelling-boardroom": "rhetorik", "meeting-rhetorik": "rhetorik",
    "schwierige-gespraeche": "fuehrung", "delegation": "fuehrung", "feedback-formate": "fuehrung",
    "ki-first-leadership": "executive", "change-management": "executive", "executive-presence": "executive", "boardroom-strategie": "executive",
}
LEVELS = ["grundlagen", "aufbau", "executive"]  # Kurse 1–3 / 4–6 / 7–10


def course_level(course: dict) -> str:
    idx = next((i for i, c in enumerate(COURSES) if c["slug"] == course["slug"]), 0)
    return LEVELS[min(idx // 3, 2)]


def course_view(course: dict, user_tier: str, videos: dict[str, dict]) -> dict:
    """Kurs mit Freischalt-Status: Folge 1 immer frei, Rest ab Kurs-Tier. `videos` = {episode_id: {...}} aus der DB."""
    unlocked_course = TIER_RANK.get(user_tier, 0) >= TIER_RANK[course["tier"]]
    eps = []
    for i, e in enumerate(course["episodes"], start=1):
        ep_id = f"{course['slug']}-{i}"
        vid = videos.get(ep_id) or {}
        eps.append({
            "id": ep_id, "number": i, **e, "free_preview": i == 1,
            "unlocked": i == 1 or unlocked_course,
            "video_url": vid.get("video_url") if (i == 1 or unlocked_course) else None,
            "video_ready": bool(vid.get("video_url")),
            "video_updated_at": vid.get("updated_at"),
        })
    first_url = eps[0]["video_url"] or ""
    return {
        "slug": course["slug"], "title": course["title"], "tagline": course["tagline"], "emoji": course["emoji"],
        "tier": course["tier"], "tier_label": "Leadership OS" if course["tier"] == STANDARD else "Leadership OS PLUS",
        "category": COURSE_CATEGORY.get(course["slug"], "rhetorik"), "level": course_level(course),
        "thumbnail_url": f"/courses/{course['slug']}.jpg",
        # Hover-Vorschau nur für direkt streambare MP4s (unsere Storage-Route), nicht für Vimeo/YouTube-Links
        "preview_url": first_url if first_url.startswith("/api/") or first_url.endswith(".mp4") else None,
        "episode_count": len(eps), "minutes_total": sum(e["minutes"] for e in course["episodes"]),
        "unlocked": unlocked_course, "videos_ready": sum(1 for e in eps if e["video_ready"]),
        "episodes": eps,
    }

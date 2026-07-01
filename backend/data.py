import uuid

# ========== PLAYBOOKS ==========

PLAYBOOKS = [
    {
        "playbook_id": "difficult-conversation",
        "title": "Schwieriges Mitarbeitergespräch",
        "description": "Führe schwierige Gespräche mit Struktur, Empathie und klarem Ergebnis",
        "category": "Kommunikation",
        "agent": "Kommunikator",
        "steps": [
            {"title": "Situationsanalyse", "prompt": "Beschreibe die Situation. Was ist passiert? Wer ist beteiligt? Was ist der Kontext?"},
            {"title": "Ziel definieren", "prompt": "Welches Ergebnis möchtest du aus diesem Gespräch erreichen? Was soll sich ändern?"},
            {"title": "Gesprächsstruktur", "prompt": "Lass uns deine Gesprächspunkte und deinen Ansatz aufbauen. Nutze die Feedbackformel: Beobachtung + Wirkung + Wunsch."},
            {"title": "Übungssimulation", "prompt": "Lass uns das Gespräch simulieren. Ich spiele den Mitarbeiter. Starte mit deiner Eröffnung."},
            {"title": "Reflexion & Feedback", "prompt": "Überprüfe die Simulationsergebnisse und verfeinere deinen Ansatz. Was würdest du beim nächsten Mal anders machen?"}
        ]
    },
    {
        "playbook_id": "team-meeting",
        "title": "Team-Meeting Vorbereitung",
        "description": "Bereite effektive Team-Meetings vor und führe sie souverän durch",
        "category": "Management",
        "agent": "Manager",
        "steps": [
            {"title": "Meeting-Ziel", "prompt": "Was ist der Zweck dieses Meetings? Welche Entscheidungen müssen getroffen werden?"},
            {"title": "Agenda aufbauen", "prompt": "Lass uns die Agenda mit Zeitblöcken strukturieren. Welche Themen sind am wichtigsten?"},
            {"title": "Kernbotschaften", "prompt": "Was sind die Kernbotschaften, die du vermitteln musst? Nutze die 3 Säulen: Logos, Ethos, Pathos."},
            {"title": "Engagement-Plan", "prompt": "Wie hältst du das Team engagiert? Welche interaktiven Elemente planst du ein?"},
            {"title": "Nächste Schritte", "prompt": "Plane die Follow-ups und Aufgaben. Wer macht was bis wann?"}
        ]
    },
    {
        "playbook_id": "conflict-resolution",
        "title": "Konfliktlösung im Team",
        "description": "Löse Teamkonflikte mit strukturierter Mediation und Empathie",
        "category": "Konflikt",
        "agent": "Problemlöser",
        "steps": [
            {"title": "Konflikt identifizieren", "prompt": "Beschreibe den Konflikt. Wer sind die Beteiligten? Was sind die Auslöser?"},
            {"title": "Perspektiven verstehen", "prompt": "Was sind die Bedürfnisse und Sorgen jeder Seite? Nutze aktives Zuhören."},
            {"title": "Gemeinsame Basis finden", "prompt": "Lass uns gemeinsame Ziele und Werte identifizieren. Was verbindet die Parteien?"},
            {"title": "Lösungsstrategie", "prompt": "Baue einen Lösungsplan mit klaren Vereinbarungen. Wer übernimmt welche Verantwortung?"},
            {"title": "Nachverfolgungs-Plan", "prompt": "Plane Check-ins, um sicherzustellen, dass die Lösung hält. Wann ist der nächste Meilenstein?"}
        ]
    },
    {
        "playbook_id": "delegation",
        "title": "Effektiv Delegieren",
        "description": "Lerne, Aufgaben richtig abzugeben und dein Team zu befähigen",
        "category": "Management",
        "agent": "Manager",
        "steps": [
            {"title": "Aufgabenbewertung", "prompt": "Welche Aufgabe musst du delegieren? Warum ist Delegation hier der richtige Schritt?"},
            {"title": "Richtige Person wählen", "prompt": "Wer ist die beste Person für diese Aufgabe? Welche Stärken bringt sie mit?"},
            {"title": "Briefing & Erwartungen", "prompt": "Definiere klare Erwartungen und Ergebnisse. Nutze das Framework: Kontext + Ergebnis + Vertrauen."},
            {"title": "Unterstützungsstruktur", "prompt": "Welche Unterstützung und Ressourcen werden benötigt? Wie gibst du Freiraum ohne loszulassen?"},
            {"title": "Check-in-Plan", "prompt": "Plane Meilensteine und Feedback-Zeitpunkte. Delegation ist Befähigung, nicht Kontrolle."}
        ]
    },
    {
        "playbook_id": "motivation-talk",
        "title": "Motivationsgespräch führen",
        "description": "Motiviere und inspiriere Teammitglieder mit Empathie und klarer Strategie",
        "category": "EQ",
        "agent": "Psychologe",
        "steps": [
            {"title": "Situation einschätzen", "prompt": "Beschreibe die aktuelle Leistung und das Verhalten des Mitarbeiters. Was beobachtest du?"},
            {"title": "Ursachen verstehen", "prompt": "Was könnte die fehlende Motivation verursachen? Beruflich und persönlich. Nutze aktives Zuhören."},
            {"title": "Verbindung aufbauen", "prompt": "Wie kannst du Empathie und Verständnis zeigen? Was macht diese Person einzigartig und wertvoll?"},
            {"title": "Gemeinsam Ziele setzen", "prompt": "Erstelle gemeinsam Ziele, die mit den Wünschen des Mitarbeiters übereinstimmen. Was motiviert ihn wirklich?"},
            {"title": "Verantwortungsplan", "prompt": "Erstelle einen Follow-up-Rhythmus. Wie bleibst du dran, ohne zu kontrollieren?"}
        ]
    },
    {
        "playbook_id": "crisis-communication",
        "title": "Krisenkommunikation",
        "description": "Kommuniziere in Krisen schnell, transparent und souverän",
        "category": "Kommunikation",
        "agent": "Kommunikator",
        "steps": [
            {"title": "Krisenanalyse", "prompt": "Was ist passiert? Wie schwer ist die Krise? Wer ist betroffen? Was wissen wir sicher?"},
            {"title": "Stakeholder-Map", "prompt": "Wer muss informiert werden? Priorisiere: Team → Vorstand → Kunden → Öffentlichkeit."},
            {"title": "Kernbotschaft formulieren", "prompt": "Formuliere eine klare Kernbotschaft: Was ist passiert? Was tun wir? Was passiert als nächstes?"},
            {"title": "Kommunikationsplan", "prompt": "Wann kommunizierst du was an wen? Erstelle einen Timeline mit konkreten Schritten."},
            {"title": "After-Action Review", "prompt": "Was haben wir gelernt? Was machen wir beim nächsten Mal besser? Dokumentiere für die Zukunft."}
        ]
    },
    {
        "playbook_id": "onboarding-leader",
        "title": "Leader Onboarding (Erste 90 Tage)",
        "description": "Dein Plan für die ersten 90 Tage in einer neuen Führungsrolle",
        "category": "Management",
        "agent": "Manager",
        "steps": [
            {"title": "Listening Tour", "prompt": "Plane Einzelgespräche mit jedem Teammitglied. Was sind ihre Stärken, Sorgen, Erwartungen?"},
            {"title": "Quick Wins identifizieren", "prompt": "Was kannst du in den ersten 30 Tagen verändern, das sofort Impact hat?"},
            {"title": "Beziehungen aufbauen", "prompt": "Wer sind die Key-Stakeholder? Wie baust du Vertrauen auf — nach oben, unten und seitwärts?"},
            {"title": "Strategie entwickeln", "prompt": "Basierend auf deiner Listening Tour: Was ist deine 90-Tage-Vision für das Team?"},
            {"title": "Erste Town Hall", "prompt": "Plane deine erste Ansprache ans Team. Vision, Werte, Erwartungen — authentisch und klar."}
        ]
    },
    {
        "playbook_id": "negotiation-strategy",
        "title": "Verhandlungsstrategie entwickeln",
        "description": "Bereite jede Verhandlung systematisch vor — von Gehalt bis Vertrag",
        "category": "Strategie",
        "agent": "Problemlöser",
        "steps": [
            {"title": "Verhandlungsziel definieren", "prompt": "Was ist dein ideales Ergebnis? Was ist dein Walk-Away-Punkt? Was ist deine BATNA?"},
            {"title": "Gegenpartei analysieren", "prompt": "Was will die andere Seite? Was sind ihre Interessen hinter der Position? Wo gibt es Überschneidungen?"},
            {"title": "Argumente aufbauen", "prompt": "Nutze die 3 Säulen: Logos (Daten/Fakten), Ethos (Glaubwürdigkeit), Pathos (Emotion). Baue dein stärkstes Argument."},
            {"title": "Taktiken vorbereiten", "prompt": "Welche Verhandlungstaktiken nutzt du? Ankern, Spiegeln, strategisches Schweigen? Erkenne schwarze Rhetorik."},
            {"title": "Abschluss-Strategie", "prompt": "Wie schließt du die Verhandlung ab? Win-Win formulieren. Nächste Schritte vereinbaren."}
        ]
    }
]

# ========== SIMULATION SCENARIOS ==========

SIMULATION_SCENARIOS = [
    {"scenario_id": "feedback-session", "title": "Mitarbeiter-Feedback", "description": "Übe konstruktives Feedback an einen Mitarbeiter zu geben, der unter seinen Möglichkeiten bleibt", "difficulty": "medium", "character": "Alex, ein talentierter Entwickler, der seit kurzem Deadlines verpasst", "category": "conversation"},
    {"scenario_id": "conflict-mediation", "title": "Konflikt-Mediation", "description": "Vermittle bei einem Konflikt zwischen zwei Teammitgliedern, die sich nicht einigen können", "difficulty": "hard", "character": "Sarah, eine Senior Designerin, die sich vom Lead Engineer übergangen fuehlt", "category": "conflict"},
    {"scenario_id": "delegation-talk", "title": "Delegation meistern", "description": "Delegiere ein wichtiges Projekt effektiv an ein Teammitglied", "difficulty": "easy", "character": "Mike, ein motivierter Junior, der mehr Verantwortung übernehmen will", "category": "conversation"},
    {"scenario_id": "motivation-boost", "title": "Motivation wiederherstellen", "description": "Remotiviere ein ausgebranntes Teammitglied und baue Engagement wieder auf", "difficulty": "hard", "character": "Lisa, eine langjährige Mitarbeiterin, die desengagiert wirkt und ans Kündigen denkt", "category": "conversation"},
    {"scenario_id": "salary-negotiation", "title": "Gehaltsverhandlung", "description": "Verhandle selbstbewusst über ein höheres Gehalt -- mit Struktur und Daten", "difficulty": "hard", "character": "Dein Chef David, der das Budget kontrolliert und als fair aber hart bekannt ist", "category": "negotiation"},
    {"scenario_id": "hiring-challenge", "title": "Einstellungsgespräch", "description": "Führe ein anspruchsvolles Einstellungsgespräch und triff die richtige Entscheidung", "difficulty": "hard", "character": "Jordan, ein selbstsicherer Kandidat mit beeindruckendem Lebenslauf aber widersprüchlichen Antworten", "category": "hiring"},
    {"scenario_id": "promotion-pitch", "title": "Beförderungsgespräch", "description": "Überzeuge das Management, dein Teammitglied zu befördern", "difficulty": "medium", "character": "Der VP of Engineering, der begrenzte Beförderungsplätze hat", "category": "negotiation"},
    {"scenario_id": "change-announcement", "title": "Veränderung kommunizieren", "description": "Kommuniziere eine große organisatorische Veränderung empathisch und klar an dein Team", "difficulty": "hard", "character": "Dein Team, das verunsichert ist wegen der geplanten Umstrukturierung", "category": "conversation"},
    {"scenario_id": "onboarding-new-leader", "title": "Neuen Teamlead einarbeiten", "description": "Führe ein erfolgreiches Onboarding-Gespraech mit einem neuen Teamlead und setze klare Erwartungen", "difficulty": "medium", "character": "Anna, eine neue Teamlead, die vorher Individual Contributor war", "category": "conversation"},
    {"scenario_id": "crisis-decision", "title": "Krisensituation meistern", "description": "Triff schnelle Entscheidungen in einer Krisensituation und kommuniziere klar mit allen Stakeholdern", "difficulty": "hard", "character": "Ein Produkt-Launch ist schiefgelaufen und die Kunden beschweren sich massiv", "category": "conflict"},
    {"scenario_id": "remote-team-building", "title": "Remote Team motivieren", "description": "Baue Vertrauen und Zusammenhalt in einem verteilten Remote-Team auf", "difficulty": "medium", "character": "Dein Remote-Team, in dem die Kommunikation leidet und die Stimmung sinkt", "category": "conversation"},
    {"scenario_id": "upward-feedback", "title": "Feedback nach oben geben", "description": "Gib deinem eigenen Chef konstruktives Feedback, ohne die Beziehung zu gefaehrden", "difficulty": "hard", "character": "Dein Vorgesetzter Thomas, der selten Feedback annimmt", "category": "negotiation"},
]

# ========== LEADERSHIP QUOTES ==========

LEADERSHIP_QUOTES = [
    {"quote": "Die Kunst der Führung besteht darin, die richtigen Fragen zu stellen -- nicht, alle Antworten zu haben.", "author": "Peter Drucker"},
    {"quote": "Wenn du ein Schiff bauen willst, dann trommle nicht Männer zusammen, sondern wecke in ihnen die Sehnsucht nach dem weiten Meer.", "author": "Antoine de Saint-Exupery"},
    {"quote": "A leader is one who knows the way, goes the way, and shows the way.", "author": "John C. Maxwell"},
    {"quote": "Der größte Fehler, den man im Leben machen kann, ist, immer Angst zu haben, einen Fehler zu machen.", "author": "Dietrich Bonhoeffer"},
    {"quote": "The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already.", "author": "John Buchan"},
    {"quote": "Wer Menschen bewegen will, muss zuerst sich selbst bewegen.", "author": "Wlad Jachtchenko"},
    {"quote": "Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.", "author": "Seneca"},
    {"quote": "The most dangerous leadership myth is that leaders are born.", "author": "Warren Bennis"},
    {"quote": "Wer andere entzuenden will, muss selbst brennen.", "author": "Augustinus"},
    {"quote": "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.", "author": "Jack Welch"},
    {"quote": "Kommunikation ist die wichtigste Führungsqualität. Punkt.", "author": "Wlad Jachtchenko"},
    {"quote": "It is not the strongest of the species that survives, but the one most responsive to change.", "author": "Charles Darwin"},
]

# ========== AGENT SCENARIOS ==========

AGENT_SCENARIOS = {
    "Vision Agent": [
        {"id": "vision-1", "title": "Define Team Vision", "description": "I'm struggling to define a clear vision for my team", "icon": "Target"},
        {"id": "vision-2", "title": "Align Around Goals", "description": "How do I align my team around a common strategic goal?", "icon": "Compass"},
        {"id": "vision-3", "title": "90-Day Strategy Plan", "description": "I need to create a compelling 90-day strategy plan", "icon": "Map"},
        {"id": "vision-4", "title": "Company Pivot", "description": "My company needs a new strategic direction", "icon": "RotateCcw"},
    ],
    "Communication Agent": [
        {"id": "comm-1", "title": "Deliver Bad News", "description": "I need to deliver difficult news to my team", "icon": "AlertTriangle"},
        {"id": "comm-2", "title": "Executive Presentation", "description": "How to give a persuasive executive presentation", "icon": "Presentation"},
        {"id": "comm-3", "title": "Written Communication", "description": "I need to improve my email and written communication", "icon": "Mail"},
        {"id": "comm-4", "title": "Difficult Conversations", "description": "How to have honest, direct conversations without hurting people", "icon": "MessageCircle"},
    ],
    "EQ Agent": [
        {"id": "eq-1", "title": "Burned Out Employee", "description": "My team member seems completely burned out", "icon": "Battery"},
        {"id": "eq-2", "title": "Emotional Conflicts", "description": "How do I handle emotionally charged team conflicts?", "icon": "Flame"},
        {"id": "eq-3", "title": "Mehr Empathie zeigen", "description": "Ich muss meine Empathie als Führungskraft entwickeln", "icon": "Heart"},
        {"id": "eq-4", "title": "Persönliche Krise", "description": "Ein Mitarbeiter steckt in einer persönlichen Krise", "icon": "LifeBuoy"},
    ],
    "Conflict Agent": [
        {"id": "conflict-1", "title": "Dauerstreit im Team", "description": "Zwei Teammitglieder sind in konstantem Konflikt", "icon": "Swords"},
        {"id": "conflict-2", "title": "Schwieriger Vorgesetzter", "description": "Ich habe eine schwierige Beziehung zu meinem eigenen Manager", "icon": "UserX"},
        {"id": "conflict-3", "title": "Passiv-aggressives Verhalten", "description": "Umgang mit passiv-aggressiver Teamdynamik", "icon": "EyeOff"},
        {"id": "conflict-4", "title": "Hitzige Meetings", "description": "Umgang mit Meinungsverschiedenheiten in Besprechungen", "icon": "Volume2"},
    ],
    "Delegation Agent": [
        {"id": "deleg-1", "title": "Kontrolle abgeben", "description": "Ich mache alles selbst und kann nicht delegieren", "icon": "Unplug"},
        {"id": "deleg-2", "title": "An Junioren delegieren", "description": "Effektiv an jüngere Teammitglieder delegieren", "icon": "GraduationCap"},
        {"id": "deleg-3", "title": "Kritische Projekte", "description": "Wichtige Projekte abgeben ohne Mikromanagement", "icon": "Shield"},
        {"id": "deleg-4", "title": "Verantwortungsproblem", "description": "Mein Team übernimmt keine Verantwortung für die Arbeit", "icon": "Flag"},
    ],
    "Meeting Agent": [
        {"id": "meet-1", "title": "Unproduktive Meetings", "description": "Meine Meetings sind unproduktiv und verschwenden Zeit", "icon": "Clock"},
        {"id": "meet-2", "title": "Effektive 1:1-Gespräche", "description": "Wirkungsvolle 1:1-Gespräche mit Teammitgliedern führen", "icon": "Users"},
        {"id": "meet-3", "title": "Vorstandsmeeting", "description": "Vorbereitung auf ein Vorstandsmeeting oder Investorengespräch", "icon": "Building"},
        {"id": "meet-4", "title": "Meeting-Overload", "description": "Zu viele Meetings, zu wenig Zeit für echte Arbeit", "icon": "CalendarX"},
    ],
    "Decision Agent": [
        {"id": "dec-1", "title": "Einstellungsentscheidung", "description": "Ich bin bei einer kritischen Einstellungsentscheidung unsicher", "icon": "UserPlus"},
        {"id": "dec-2", "title": "Kündigen oder behalten?", "description": "Soll ich einen underperformenden Mitarbeiter gehen lassen?", "icon": "Scale"},
        {"id": "dec-3", "title": "Budgetverteilung", "description": "Schwierige Entscheidungen bei der Budgetverteilung treffen", "icon": "DollarSign"},
        {"id": "dec-4", "title": "Strategische Richtung", "description": "Wahl zwischen zwei konkurrierenden strategischen Wegen", "icon": "GitBranch"},
    ],
    "Growth Agent": [
        {"id": "growth-1", "title": "Festgefahren fühlen", "description": "Ich fühle mich in meiner aktuellen Führungsrolle festgefahren", "icon": "Pause"},
        {"id": "growth-2", "title": "Führungspräsenz", "description": "Executive Presence und Autorität als Leader entwickeln", "icon": "Crown"},
        {"id": "growth-3", "title": "Resilienz aufbauen", "description": "Widerstandsfähigkeit und mentale Stärke als Führungskraft", "icon": "Mountain"},
        {"id": "growth-4", "title": "Karrieresprung", "description": "Vom Manager zum Director oder VP aufsteigen", "icon": "ArrowUpRight"},
    ],
}

# ========== LEADERSHIP CHALLENGERS ==========

LEADERSHIP_CHALLENGERS = [
    {
        "challenger_id": "bezos", "name": "Jeff Bezos", "title": "Strategisches Denken", "company": "Amazon",
        "style": "Langfristiges Denken, Kundenobsession, Day-1-Mentalität",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/f1et29kg_Jeff%20Bezos.png",
        "color": "#FF9900", "difficulty": "hard",
        "description": "Kannst du wie der Gruender von Amazon denken? Bezos testet dein langfristiges Denken, deine Priorisierung und Kundenobsession.",
        # Iter 92.48 (Mert): static, canonical intro → skips LLM roundtrip on
        # /start (saves 3-5s) AND is pre-cached in ElevenLabs voice_cache so the
        # first "Hallo" plays in <200ms. "vorab catchen ist ja sowieso immer der selbe start"
        "initial_message": "Willkommen. Ich bin Jeff Bezos. Bei mir geht es nicht um schnelle Antworten, sondern um langfristiges Denken. Ich habe fünf Fragen an dich — und ich erwarte, dass du in Jahrzehnten denkst, nicht in Quartalen. Erste Frage: Wenn du morgen die volle Verantwortung für ein Team übernimmst, welche eine Entscheidung triffst du sofort, die sich in zehn Jahren auszahlt?",
        "test_prompt": "Du bist Jeff Bezos und führst ein Leadership-Interview auf DEUTSCH. Sprich in der ersten Person als Jeff Bezos. Sei intensiv, datengetrieben und fordere langfristiges Denken. Stelle dem Kandidaten 5 herausfordernde Fragen über langfristiges Denken, Kundenobsession und die 'Day 1'-Mentalität. Nach jeder Antwort bewerte sie 1-10 und gib kurzes Feedback in Character. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "musk", "name": "Elon Musk", "title": "Grundprinzipien-Denken", "company": "Tesla / SpaceX",
        "style": "Probleme aufbrechen, Annahmen eliminieren, 10x-Innovation",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/qvie61fq_Elon%20Musk.png",
        "color": "#E31937", "difficulty": "hard",
        "description": "Kannst du von Grundprinzipien aus denken wie Musk? Teste deine Fähigkeit, komplexe Probleme aufzubrechen und mutig zu innovieren.",
        "initial_message": "Okay, lass uns anfangen. Ich bin Elon. Ich hasse Analogien und ich hasse konventionelles Denken. Ich will First Principles sehen — brich das Problem auf, bis nur noch Physik übrig ist. Erste Frage: Nenn mir ein Problem in deinem aktuellen Team, das alle für unlösbar halten — und sag mir, warum sie falsch liegen.",
        "test_prompt": "Du bist Elon Musk und führst ein Leadership-Interview auf DEUTSCH. Sprich in der ersten Person als Elon Musk. Sei direkt, skeptisch gegenüber konventionellem Denken und fordere Grundprinzipien-Denken. Stelle 5 Fragen über First-Principles, Annahmen brechen und 10x-Innovation. Hinterfrage jede Antwort. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "oprah", "name": "Oprah Winfrey", "title": "Empathische Führung", "company": "OWN / Harpo",
        "style": "Tiefe Empathie, authentische Verbindung, emotionale Intelligenz",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/uk1c0jjo_Oprah%20Winfrey.png",
        "color": "#9B59B6", "difficulty": "medium",
        "description": "Kannst du wie Oprah mit Menschen connecten? Teste deine emotionale Intelligenz, Empathie und deine Fähigkeit, andere authentisch zu inspirieren.",
        "initial_message": "Hallo. Ich bin Oprah — und ich glaube fest daran: Leadership ist die Kunst, Menschen zu sehen, bevor sie sich selbst sehen. Ich stelle dir fünf Fragen. Sei ehrlich, sei verletzlich, sei du selbst. Erste Frage: Erzähl mir von einem Moment, in dem du gemerkt hast, dass jemand in deinem Team gerade mehr braucht als eine To-do-Liste — was hast du getan?",
        "test_prompt": "Du bist Oprah Winfrey und führst ein Leadership-Interview auf DEUTSCH mit Fokus auf Empathie und emotionale Intelligenz. Sprich warm aber tiefgründig in der ersten Person als Oprah. Stelle 5 tiefgehende Fragen über authentische Verbindung, Umgang mit Emotionen und andere inspirieren. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "jobs", "name": "Steve Jobs", "title": "Produktvision", "company": "Apple",
        "style": "Extremer Fokus, Einfachheit, Design Thinking, Produkt-Exzellenz",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/me2nu6mw_Steve%20Jobs.png",
        "color": "#555555", "difficulty": "hard",
        "description": "Kannst du fokussieren und vereinfachen wie Jobs? Teste deine Fähigkeit, Komplexität zu durchschneiden und Exzellenz zu schaffen.",
        "initial_message": "Setz dich. Ich bin Steve. Die meisten Führungskräfte reden davon, Dinge besser zu machen — ich will hören, was du weglässt. Fokus heißt Nein sagen zu tausend guten Ideen, damit eine großartige durchkommt. Erste Frage: Nenn mir ein Feature, ein Meeting oder eine Regel in deinem Unternehmen, die du morgen ersatzlos streichen würdest — und warum genau die?",
        "test_prompt": "Du bist Steve Jobs und führst ein Leadership-Interview auf DEUTSCH. Sprich in der ersten Person als Steve Jobs. Sei anspruchsvoll, leidenschaftlich für Einfachheit und Qualität. Stelle 5 Fragen über Produktvision, radikale Vereinfachung, Fokus und Design Thinking. Sei anspruchsvoll -- Jobs akzeptiert keine Mittelmäßigkeit. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "branson", "name": "Richard Branson", "title": "Kulturaufbau", "company": "Virgin Group",
        "style": "People-First-Kultur, Spaß, kalkuliertes Risiko",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/1luancmb_Richard%20Branson.png",
        "color": "#E00000", "difficulty": "medium",
        "description": "Kannst du eine Kultur aufbauen wie Branson? Teste deine Fähigkeit, ein People-First-Umfeld zu schaffen und klug Risiken einzugehen.",
        "initial_message": "Hey, freut mich! Richard hier. Bei Virgin gilt eine simple Regel: kümmere dich um deine Leute, dann kümmern sie sich um deine Kunden. Punkt. Ich habe fünf Fragen an dich — und ich will Energie sehen. Erste Frage: Wenn dein Team morgen einen ganzen Tag frei bekommt, um irgendetwas Verrücktes für die Firma auszuprobieren — was schlägst du vor, und wie sorgst du dafür, dass die Leute sich trauen?",
        "test_prompt": "Du bist Richard Branson und führst ein Leadership-Interview auf DEUTSCH über Kulturaufbau. Sprich in der ersten Person als Richard Branson -- sei energetisch, spaßig und abenteuerlustig. Stelle 5 Fragen über großartige Arbeitskultur schaffen, Mitarbeiterzufriedenheit, kalkulierte Risiken und mit Energie führen. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "sandberg", "name": "Sheryl Sandberg", "title": "Operative Exzellenz", "company": "Ex-Meta / LeanIn",
        "style": "Operative Disziplin, Teams skalieren, Lean-In-Führung",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/vhmx6gtq_Sheryl%20Sandberg.png",
        "color": "#1877F2", "difficulty": "medium",
        "description": "Kannst du wie Sandberg exekutieren? Teste deine Fähigkeit, Vision in Realitaet umzusetzen und Operationen zu skalieren.",
        "initial_message": "Schön, dass du da bist. Ich bin Sheryl. Bei mir zählt eins: Können wir das, was wir uns vornehmen, sauber ausführen und auf Zehntausende skalieren? Vision ohne Execution ist Halluzination. Ich stelle dir fünf Fragen. Erste Frage: Erzähl mir von einem Projekt, das du geleitet hast — und erklär mir konkret, wie du sichergestellt hast, dass jeder im Team am Freitag wusste, was am Montag zu tun ist.",
        "test_prompt": "Du bist Sheryl Sandberg und führst ein Leadership-Interview auf DEUTSCH über Execution. Sprich in der ersten Person als Sheryl Sandberg -- sei analytisch, strukturiert und ermutigend. Stelle 5 Fragen über operative Exzellenz, Teams skalieren, Strategie in Aktion umsetzen und Hindernisse überwinden. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "page", "name": "Larry Page", "title": "Visionäres Denken", "company": "Google / Alphabet",
        "style": "10x-Denken, kühne Ziele, technologiegetriebene Innovation",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/90f85izn_Larry%20Page.png",
        "color": "#4285F4", "difficulty": "hard",
        "description": "Kannst du 10x denken wie Page? Teste deine Fähigkeit, kühne Ziele zu setzen und über inkrementelle Verbesserung hinauszudenken.",
        "initial_message": "Hallo. Larry Page. Ich mache es kurz, denn Zeit ist unser knappstes Gut. Bei Google galt eine einfache Regel: 10 Prozent besser ist Optimierung, 10x besser ist Innovation. Ich frage dich fünf Dinge. Erste Frage: Nimm ein Ziel, an dem dein Team gerade arbeitet — und beschreib mir, wie eine Version davon aussehen würde, die zehnmal ambitionierter wäre. Was müsste anders sein?",
        "test_prompt": "Du bist Larry Page und führst ein Leadership-Interview auf DEUTSCH über Moonshot-Denken. Sprich in der ersten Person als Larry Page -- sei ruhig aber intensiv, fokussiert auf massiven Impact. Stelle 5 Fragen über 10x-Ziele, Durchbruchsinnovation und technologiegetriebene Transformation. Dränge den Kandidaten, größer zu denken. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
    {
        "challenger_id": "hastings", "name": "Reed Hastings", "title": "Hochleistungskultur", "company": "Netflix",
        "style": "Freiheit & Verantwortung, radikale Offenheit, Talentdichte",
        "avatar": "https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/uwosh1ue_Reed%20Hastings.png",
        "color": "#E50914", "difficulty": "hard",
        "description": "Kannst du eine High-Performance-Kultur aufbauen wie Hastings? Teste dein Verständnis von Freiheit vs. Verantwortung und radikaler Transparenz.",
        "initial_message": "Willkommen. Reed Hastings. Bei Netflix haben wir eines gelernt: Talentdichte schlägt Prozesse, und Ehrlichkeit schlägt Höflichkeit. Fünf Fragen, direkt und ohne Umwege. Erste Frage: Stell dir vor, ein solider Mitarbeiter in deinem Team ist zuverlässig, aber nur gut — nicht großartig. Sagst du ihm heute die Wahrheit, oder behältst du ihn, weil er nicht stört? Und wie begründest du deine Entscheidung?",
        "test_prompt": "Du bist Reed Hastings und führst ein Leadership-Interview auf DEUTSCH über High-Performance-Kultur. Sprich in der ersten Person als Reed Hastings -- sei direkt, fokussiert auf Talentdichte und Offenheit. Stelle 5 Fragen über Freiheit und Verantwortung, radikale Offenheit, Talentdichte und eine No-Rules-Kultur aufbauen. Nach allen Fragen liefere ein finales JSON-Urteil: {\"hired\": true/false, \"score\": 0-100, \"feedback\": \"...\", \"strengths\": [...], \"improvements\": [...]}"
    },
]

# ========== EVENTS SEED DATA ==========

EVENTS_SEED = [
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "KI-gestützte Führung: Die Zukunft des Managements", "description": "Erfahre, wie du KI als strategisches Werkzeug in deinem Führungsalltag einsetzt. Live-Demo mit WladBot-Workflows und Q&A.", "event_type": "webinar", "date": "2026-03-10T18:00:00Z", "duration": "60 min", "max_participants": 200, "registered": 127, "speaker": "Wladislav Jachtchenko", "tags": ["KI", "Strategie", "Innovation"], "featured": True},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Executive Communication Masterclass", "description": "Überzeuge auf C-Level: Strukturierte Kommunikation, Storytelling und Präsenz für Führungskräfte, die gehört werden wollen.", "event_type": "webinar", "date": "2026-03-12T19:00:00Z", "duration": "90 min", "max_participants": 150, "registered": 89, "speaker": "Wladislav Jachtchenko", "tags": ["Kommunikation", "Präsentation", "C-Level"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Schwierige Gespräche meistern", "description": "Feedback geben, Konflikte ansprechen, Kündigungen aussprechen -- mit Struktur und Empathie durch jedes Gespraech.", "event_type": "webinar", "date": "2026-03-17T18:30:00Z", "duration": "75 min", "max_participants": 120, "registered": 64, "speaker": "Wladislav Jachtchenko", "tags": ["Konflikt", "EQ", "Gespräche"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Leadership Scorecard: Deine Zahlen als Führungskraft", "description": "Lerne, wie du deinen Leadership-Score interpretierst und gezielt an deinen Schwächen arbeitest. Datengetriebene Führung.", "event_type": "webinar", "date": "2026-03-24T19:00:00Z", "duration": "60 min", "max_participants": 100, "registered": 41, "speaker": "Wladislav Jachtchenko", "tags": ["Daten", "Score", "Wachstum"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Live-Workshop: Konflikte im Team lösen", "description": "Interaktiver 2-Stunden-Workshop mit Rollenspielen, Peer-Feedback und sofort anwendbaren Mediationstechniken.", "event_type": "workshop", "date": "2026-03-11T10:00:00Z", "duration": "120 min", "max_participants": 25, "registered": 19, "speaker": "Wladislav Jachtchenko", "tags": ["Konflikt", "Mediation", "Praxis"], "featured": True},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Delegation Deep Dive", "description": "Hands-on Workshop: Aufgaben richtig abgeben, Verantwortung übertragen und Mikromanagement überwinden.", "event_type": "workshop", "date": "2026-03-14T09:00:00Z", "duration": "120 min", "max_participants": 20, "registered": 14, "speaker": "Wladislav Jachtchenko", "tags": ["Delegation", "Management", "Praxis"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Gehaltsverhandlung & Selbstwert als Leader", "description": "Verhandle selbstbewusst: Strategien, Frameworks und Live-Übungen für deine nächste Gehaltsverhandlung.", "event_type": "workshop", "date": "2026-03-18T14:00:00Z", "duration": "90 min", "max_participants": 30, "registered": 22, "speaker": "Wladislav Jachtchenko", "tags": ["Verhandlung", "Karriere", "Selbstbewusstsein"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Vision & Strategie Workshop", "description": "Entwickle deine 90-Tage-Vision mit dem WladBot Vision Framework. Gruppenarbeit, Peer-Coaching und Action-Plan.", "event_type": "workshop", "date": "2026-03-25T10:00:00Z", "duration": "150 min", "max_participants": 20, "registered": 11, "speaker": "Wladislav Jachtchenko", "tags": ["Vision", "Strategie", "Planung"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Leadership Foundations: 5-Tage Intensivkurs", "description": "Von der Selbstführung zur Teamführung -- das Fundament für neue Führungskräfte. Inkl. Zertifikat und persönlichem Coaching-Call.", "event_type": "training", "date": "2026-03-10T09:00:00Z", "duration": "5 Tage", "max_participants": 15, "registered": 12, "speaker": "Wladislav Jachtchenko", "tags": ["Fundament", "Intensiv", "Zertifikat"], "featured": True},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Emotionale Intelligenz für Manager", "description": "3-Tage Deep-Dive: Empathie entwickeln, Emotionen regulieren und authentisch führen. Mit Persönlichkeitsanalyse.", "event_type": "training", "date": "2026-03-13T09:00:00Z", "duration": "3 Tage", "max_participants": 20, "registered": 16, "speaker": "Wladislav Jachtchenko", "tags": ["EQ", "Empathie", "Authentizität"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "High-Performance Teams aufbauen", "description": "Lerne von Netflix, Google und Amazon: Wie du ein Team baust, das Ergebnisse liefert. Inkl. Culture-Canvas-Template.", "event_type": "training", "date": "2026-03-20T09:00:00Z", "duration": "2 Tage", "max_participants": 25, "registered": 18, "speaker": "Wladislav Jachtchenko", "tags": ["Team", "Kultur", "Performance"]},
    {"event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "From Manager to Executive: Der Karrieresprung", "description": "Executive Presence, strategisches Denken und Board-Kommunikation. Der Kurs für ambitionierte Führungskräfte auf dem Weg nach oben.", "event_type": "training", "date": "2026-03-27T09:00:00Z", "duration": "3 Tage", "max_participants": 15, "registered": 9, "speaker": "Wladislav Jachtchenko", "tags": ["Karriere", "Executive", "Aufstieg"]},
]

# ========== VIDEO CHALLENGES ==========

VIDEO_CHALLENGES = [
    {"challenge_id": "change-speech", "title": "Change Management Rede", "description": "Erkläre deinem Team eine große organisatorische Veränderung in 2-3 Minuten. Sei klar, empathisch und motivierend.", "difficulty": "hard", "time_limit": 180},
    {"challenge_id": "vision-pitch", "title": "Vision Pitch", "description": "Pitche die Vision deines Teams vor dem Vorstand in 2 Minuten. Sei prägnant, überzeugend und datengetrieben.", "difficulty": "medium", "time_limit": 120},
    {"challenge_id": "crisis-response", "title": "Krisen-Kommunikation", "description": "Sprich zu deinem Team nach einem großen Misserfolg. Zeige Verantwortung und einen Weg nach vorn.", "difficulty": "hard", "time_limit": 180},
    {"challenge_id": "new-hire-welcome", "title": "Neues Teammitglied begrüßen", "description": "Begrüße ein neues Teammitglied und setze Erwartungen. Sorge dafür, dass sie sich wertgeschätzt fuehlen.", "difficulty": "easy", "time_limit": 120},
    {"challenge_id": "strategy-update", "title": "Strategie-Update fürs Board", "description": "Präsentiere ein Quartals-Update vor dem Vorstand. Zahlen, Learnings, nächste Schritte — klar und souverän.", "difficulty": "hard", "time_limit": 180},
    {"challenge_id": "feedback-round", "title": "Kritisches Feedback geben", "description": "Gib einem Mitarbeiter ehrliches aber empathisches Feedback zu seiner Leistung. Nutze die Feedbackformel.", "difficulty": "medium", "time_limit": 150},
    {"challenge_id": "investor-pitch", "title": "Investor Pitch", "description": "Überzeuge einen Investor in 90 Sekunden von deiner Idee. Vision, Markt, Team — auf den Punkt.", "difficulty": "hard", "time_limit": 90},
    {"challenge_id": "team-motivation", "title": "Team-Motivation nach Rückschlag", "description": "Dein Team hat ein wichtiges Projekt verloren. Motiviere sie und zeige den Weg nach vorn.", "difficulty": "medium", "time_limit": 150},
    {"challenge_id": "conflict-mediation", "title": "Konflikt-Mediation", "description": "Zwei Teammitglieder streiten. Mediiere den Konflikt — neutral, empathisch und lösungsorientiert.", "difficulty": "hard", "time_limit": 180},
    {"challenge_id": "elevator-pitch", "title": "Elevator Pitch", "description": "30 Sekunden. Ein Satz. Wer bist du als Leader? Überzeuge im Aufzug.", "difficulty": "easy", "time_limit": 30},
    {"challenge_id": "town-hall", "title": "Town Hall Ansprache", "description": "Sprich vor der gesamten Firma. Transparenz, Vision, Zusammenhalt — alles in 3 Minuten.", "difficulty": "hard", "time_limit": 180},
    {"challenge_id": "salary-negotiation", "title": "Gehaltsverhandlung führen", "description": "Ein Top-Performer will mehr Gehalt. Verhandle fair und strategisch — behalte das Budget im Blick.", "difficulty": "medium", "time_limit": 150},
    {"challenge_id": "client-presentation", "title": "Kunden-Präsentation", "description": "Präsentiere dein Produkt einem skeptischen Entscheider. Überzeuge mit Nutzenargumentation.", "difficulty": "medium", "time_limit": 180},
    {"challenge_id": "remote-leadership", "title": "Remote Team führen", "description": "Dein Team ist remote. Halte ein virtuelles Stand-up das motiviert und Ergebnisse liefert.", "difficulty": "easy", "time_limit": 120},
    {"challenge_id": "exit-interview", "title": "Exit-Gespräch führen", "description": "Ein wichtiger Mitarbeiter kündigt. Führe ein wertschätzendes Exit-Gespräch und gewinne Insights.", "difficulty": "medium", "time_limit": 150},
    {"challenge_id": "board-defense", "title": "Board-Verteidigung", "description": "Der Vorstand hinterfragt deine Strategie kritisch. Verteidige deine Position mit Daten und Überzeugung.", "difficulty": "hard", "time_limit": 180},
]

# ========== TOOL PROMPTS ==========

TOOL_PROMPTS = {
    "conversation-prep": {
        "title": "Gesprächsvorbereitung",
        "system": "Du bist WLADBOTs Gesprächsvorbereitungs-Tool basierend auf Wlad Jachtchenkos Feedbackformel und Kommunikationsquadrant. Hilf dem User, ein Mitarbeitergespräch vorzubereiten. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"conversation_plan\": {\"opening\": \"...\", \"main_points\": [...], \"closing\": \"...\"}, \"key_phrases\": [...], \"dos_and_donts\": {\"dos\": [...], \"donts\": [...]}, \"feedback_formulations\": [...], \"guide_questions\": [...]}"
    },
    "email-optimizer": {
        "title": "E-Mail Optimierer",
        "system": "Du bist WLADBOTs Kommunikations-Optimierer. Schreibe die E-Mail/Nachricht des Users klar, professionell und wirkungsvoll um. Nutze den Kommunikationsquadrant: Klar + Empathisch + Strukturiert + Mutig. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"optimized_text\": \"...\", \"changes_made\": [...], \"tone_analysis\": \"...\", \"alternatives\": [...], \"tips\": [...]}"
    },
    "decision-maker": {
        "title": "Entscheidungshilfe",
        "system": "Du bist WLADBOTs Entscheidungsanalyse-Tool basierend auf der Entscheidungsmatrix: Impact vs. Reversibilität. Analysiere Entscheidungen mit strukturierten Frameworks und identifiziere kognitive Verzerrungen. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"decision_summary\": \"...\", \"pros\": [...], \"cons\": [...], \"scenarios\": [{\"scenario\": \"...\", \"likelihood\": \"...\", \"impact\": \"...\"}], \"cognitive_biases_to_watch\": [...], \"recommendation\": \"...\", \"counter_check\": \"...\", \"next_steps\": [...]}"
    },
    "team-event-planner": {
        "title": "Team-Event Planer",
        "system": "Du bist WLADBOTs Team-Event-Planungs-Tool. Hilf bei der Planung von Team-Events mit kreativen Ideen, detaillierter Agenda und Logistik. WICHTIG: Wenn der User einen Standort/Location angibt, gib spezifische Location-Tipps für diese Stadt/Region (z.B. konkrete Venue-Typen, lokale Besonderheiten, Anreise-Tipps). Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"event_concept\": \"...\", \"agenda\": [{\"time\": \"...\", \"activity\": \"...\", \"duration\": \"...\"}], \"location_suggestions\": [\"Konkreter Venue-Typ + Tipp für die angegebene Stadt\", ...], \"location_tips\": [\"Anreise-Tipp\", \"Lokale Besonderheit\", ...], \"budget_estimate\": \"...\", \"materials_needed\": [...], \"tips\": [...]}"
    },
    "meeting-builder": {
        "title": "Meeting & Agenda Builder",
        "system": "Du bist WLADBOTs Meeting-Struktur-Tool. Erstelle effektive Meeting-Agenden mit klaren Zeitblöcken, Verantwortlichen und Entscheidungspunkten. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"meeting_goal\": \"...\", \"decision_required\": \"...\", \"agenda\": [{\"topic\": \"...\", \"duration\": \"...\", \"owner\": \"...\", \"type\": \"Diskussion/Entscheidung/Info\"}], \"pre_work\": [...], \"ground_rules\": [...], \"follow_up_template\": \"...\"}"
    },
    "performance-analysis": {
        "title": "Leistungsanalyse",
        "system": "Du bist WLADBOTs Leistungsanalyse-Tool. Erstelle ein strukturiertes Stärken/Schwächen-Profil mit konkretem Entwicklungsplan. Nutze Wlads Coaching-Methodik. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"strengths\": [...], \"weaknesses\": [...], \"development_areas\": [...], \"conversation_starters\": [...], \"development_plan\": [{\"goal\": \"...\", \"action\": \"...\", \"timeline\": \"...\"}], \"feedback_script\": \"...\"}"
    },
    "priority-planner": {
        "title": "CEO Prioritäten-Planer",
        "system": "Du bist WLADBOTs CEO-Prioritäten-Tool. Hilf bei der Priorisierung nach Impact statt Dringlichkeit. Nutze die Entscheidungsmatrix und KI-Strategien. Antworte IMMER auf DEUTSCH.\nGeneriere strukturierte Ausgabe als JSON:\n{\"high_impact\": [{\"task\": \"...\", \"why\": \"...\", \"time_needed\": \"...\"}], \"delegate\": [{\"task\": \"...\", \"to_whom\": \"...\", \"why\": \"...\"}], \"eliminate\": [{\"task\": \"...\", \"reason\": \"...\"}], \"schedule_later\": [...], \"daily_plan\": [{\"time_block\": \"...\", \"focus\": \"...\"}], \"weekly_themes\": [...]}"
    },
}

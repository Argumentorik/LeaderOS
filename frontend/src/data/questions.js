export const CATEGORIES = {
  rhetorik: 'Rhetorik & Kommunikation',
  kritisches_denken: 'Kritisches Denken',
  entscheidung: 'Entscheidungsfindung',
  fuehrung: 'Führungskompetenz',
  eq: 'Emotionale Intelligenz',
  strategie: 'KI-Strategie'
};

export const CATEGORY_COLORS = {
  rhetorik: '#3B82F6',
  kritisches_denken: '#60A5FA',
  entscheidung: '#D97706',
  fuehrung: '#2563EB',
  eq: '#F59E0B',
  strategie: '#8B5CF6'
};

export const LAYERS = {
  ai_literacy: 'KI-Kompetenz',
  rhetoric: 'Boardroom-Rhetorik',
  strategic_eq: 'Strategisches EQ'
};

// Voice questions are marked with isVoice: true (Questions 26-30)
// Each role has slightly different scenarios but same core competencies

const baseQuestions = [
  // === RHETORIK & KOMMUNIKATION (1–5) ===
  {
    id: 1, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein großer Kunde zweifelt öffentlich an deinem Produkt auf LinkedIn.",
      angestellte: "Dein Vorgesetzter kritisiert deine Abteilung in einem Meeting vor dem gesamten Management.",
      senior_manager: "Ein wichtiger Stakeholder stellt deine Projektentscheidung in einer Vorstandssitzung infrage.",
      high_potential: "Ein erfahrener Kollege untergräbt deine Ideen subtil in Teammeetings."
    },
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Situation ignorieren und hoffen, dass es sich von selbst klärt", score: 0 },
      { id: 'b', text: "Direkte, sachliche Konfrontation mit Fakten und klarer Körpersprache", score: 4 },
      { id: 'c', text: "Schriftliche Stellungnahme vorbereiten und später versenden", score: 2 },
      { id: 'd', text: "Verbündete suchen, die für dich sprechen", score: 1 }
    ]
  },
  {
    id: 2, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du pitchst vor Investoren und einer unterbricht dich ständig mit kritischen Fragen.",
      angestellte: "In einer wichtigen Präsentation unterbricht dich die Geschäftsführung mit Gegenfragen.",
      senior_manager: "Der CEO unterbricht deinen Strategievortrag mit einer völlig unerwarteten Frage.",
      high_potential: "Ein Senior Manager hinterfragt deine Analyse aggressiv vor dem Team."
    },
    question: "Was tust du in diesem Moment?",
    options: [
      { id: 'a', text: "Unterbrecher höflich ignorieren und weiter präsentieren", score: 1 },
      { id: 'b', text: "Frage aufgreifen, kurz beantworten, dann elegant zum Hauptpunkt zurückführen", score: 4 },
      { id: 'c', text: "Alle Fragen auf die Q&A-Session am Ende verschieben", score: 2 }
    ]
  },
  {
    id: 3, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Dein wichtigster Mitarbeiter möchte kündigen. Du hast 30 Minuten für ein Gespräch.",
      angestellte: "Ein Teammitglied hat einen schweren Fehler gemacht, der das Projekt gefährdet.",
      senior_manager: "Ein High Performer in deinem Team ist demotiviert und zeigt erste Anzeichen von Burnout.",
      high_potential: "Ein Kollege, mit dem du eng zusammenarbeitest, macht Fehler, die auf dich zurückfallen."
    },
    question: "Wie strukturierst du das Gespräch?",
    options: [
      { id: 'a', text: "Direkt mit Lösungsvorschlägen einsteigen, um Zeit zu sparen", score: 1 },
      { id: 'b', text: "Erst aktiv zuhören, dann gemeinsam Ursachen identifizieren, zuletzt konkrete nächste Schritte vereinbaren", score: 4 },
      { id: 'c', text: "HR oder einen Coach hinzuziehen", score: 2 },
      { id: 'd', text: "Schriftliche Dokumentation erstellen und dann besprechen", score: 1 }
    ]
  },
  {
    id: 4, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du musst einem langjährigen Kunden mitteilen, dass du die Preise um 40% erhöhst.",
      angestellte: "Du musst deinem Team mitteilen, dass Bonuszahlungen dieses Jahr gestrichen werden.",
      senior_manager: "Du musst Entlassungen in deiner Abteilung kommunizieren.",
      high_potential: "Du musst einem Teamkollegen mitteilen, dass sein Projekt nicht weiterverfolgt wird."
    },
    question: "Wie kommunizierst du die schlechte Nachricht?",
    options: [
      { id: 'a', text: "Per E-Mail mit ausführlicher Begründung", score: 1 },
      { id: 'b', text: "Persönlich, direkt, mit Empathie – zuerst die Nachricht, dann der Kontext, dann der Ausblick", score: 4 },
      { id: 'c', text: "Nachricht abschwächen und positiv verpacken", score: 0 },
      { id: 'd', text: "Jemand anderen bitten, es zu kommunizieren", score: 0 }
    ]
  },
  {
    id: 5, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein Journalist fragt dich unerwartet zu einem Datenschutz-Vorfall in deinem Unternehmen.",
      angestellte: "In einem internen Town Hall fragst jemand öffentlich nach den echten Gründen für kürzliche Entlassungen.",
      senior_manager: "Ein Vorstandsmitglied fragt nach Details zu einem Projekt, das du erst seit 2 Wochen kennst.",
      high_potential: "In einem Meeting wirst du nach deiner Meinung zu einer Entscheidung gefragt, die politisch heikel ist."
    },
    question: "Wie gehst du mit der unerwarteten Frage um?",
    options: [
      { id: 'a', text: "Ehrlich sagen, dass du die Antwort nicht kennst, und Rückmeldung versprechen", score: 3 },
      { id: 'b', text: "Souverän mit dem antworten, was du weißt, Grenzen klar benennen, Kompetenz zeigen", score: 4 },
      { id: 'c', text: "Frage an jemand anderen weiterleiten", score: 2 },
      { id: 'd', text: "Antwort improvisieren, um kompetent zu wirken", score: 0 }
    ]
  },

  // === KRITISCHES DENKEN (6–10) ===
  {
    id: 6, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein KI-Tool empfiehlt, 3 deiner 5 Dienstleistungen einzustellen. Die Datenbasis: 6 Monate.",
      angestellte: "Ein KI-Dashboard zeigt, dass dein Bereich 30% unter Budget performt. Das Management fordert Erklärungen.",
      senior_manager: "Ein McKinsey-Bericht empfiehlt eine Restrukturierung, die deiner Intuition widerspricht.",
      high_potential: "Dein Teamleiter präsentiert Daten, die deine Projektidee scheinbar widerlegen."
    },
    question: "Wie bewertest du die Empfehlung?",
    options: [
      { id: 'a', text: "Daten blind vertrauen – sie basieren auf Fakten", score: 0 },
      { id: 'b', text: "Datenqualität prüfen, Annahmen hinterfragen, Kontext einbeziehen, eigene Perspektive formulieren", score: 4 },
      { id: 'c', text: "Zweite Meinung von extern einholen", score: 2 },
      { id: 'd', text: "Empfehlung ignorieren und eigener Intuition folgen", score: 1 }
    ]
  },
  {
    id: 7, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Zwei deiner wichtigsten Berater geben dir komplett widersprüchliche Empfehlungen.",
      angestellte: "Dein direkter Vorgesetzter und die Fachabteilung haben völlig unterschiedliche Erwartungen an dich.",
      senior_manager: "Der CFO und der CMO fordern gegensätzliche Prioritäten von deinem Bereich.",
      high_potential: "Zwei Senior Mentoren geben dir gegensätzliche Karriereratschläge."
    },
    question: "Wie triffst du eine Entscheidung?",
    options: [
      { id: 'a', text: "Die Meinung der Person mit mehr Einfluss wählen", score: 1 },
      { id: 'b', text: "Beiden recht geben und einen Kompromiss finden", score: 2 },
      { id: 'c', text: "Eigene Analyse durchführen, beide Perspektiven integrieren, begründete eigene Position entwickeln", score: 4 },
      { id: 'd', text: "Entscheidung aufschieben, bis sich die Situation klärt", score: 0 }
    ]
  },
  {
    id: 8, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein Geschäftsmodell funktioniert gut, aber ein Wettbewerber disruptiert den Markt mit KI.",
      angestellte: "Dein Unternehmen führt ein neues KI-System ein, das deinen Arbeitsbereich stark verändert.",
      senior_manager: "Eine neue Technologie macht 30% der Prozesse in deinem Verantwortungsbereich obsolet.",
      high_potential: "KI-Tools automatisieren zunehmend Aufgaben, die bisher dein Alleinstellungsmerkmal waren."
    },
    question: "Wie reagierst du auf diese Disruption?",
    options: [
      { id: 'a', text: "Abwarten und beobachten, wie sich der Markt entwickelt", score: 0 },
      { id: 'b', text: "Sofort das Gleiche kopieren wie der Wettbewerber", score: 1 },
      { id: 'c', text: "Disruption analysieren, eigene Stärken identifizieren, strategisch neu positionieren", score: 4 },
      { id: 'd', text: "Auf bewährte Stärken konzentrieren und Nische verteidigen", score: 2 }
    ]
  },
  {
    id: 9, category: 'kritisches_denken', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein Branchenexperte bezeichnet dein Geschäftsmodell öffentlich als veraltet.",
      angestellte: "Ein bekannter Analyst kritisiert die Strategie deines Unternehmens scharf.",
      senior_manager: "Ein externes Audit identifiziert schwere Mängel in deinem Verantwortungsbereich.",
      high_potential: "Dein 360-Grad-Feedback enthält überraschend kritische Kommentare."
    },
    question: "Wie gehst du mit dieser Kritik um?",
    options: [
      { id: 'a', text: "Kritik öffentlich widerlegen mit Gegenargumenten", score: 1 },
      { id: 'b', text: "Kritik ernst nehmen, valide Punkte identifizieren, selektiv integrieren, klar kommunizieren", score: 4 },
      { id: 'c', text: "Kritik ignorieren – Kritiker verstehen den Kontext nicht", score: 0 },
      { id: 'd', text: "PR-Agentur mit Damage Control beauftragen", score: 1 }
    ]
  },
  {
    id: 10, category: 'kritisches_denken', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Dein Team ist überzeugt von einer Strategie, die du für falsch hältst.",
      angestellte: "Die Mehrheit deiner Abteilung unterstützt einen Ansatz, den du für riskant hältst.",
      senior_manager: "Dein gesamtes Leadership-Team empfiehlt eine Richtung, gegen die du starke Bedenken hast.",
      high_potential: "Alle in deinem Projektteam sind für Option A, du bist überzeugt von Option B."
    },
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Der Mehrheit folgen – das Team muss hinter der Entscheidung stehen", score: 2 },
      { id: 'b', text: "Deine Meinung durchsetzen – du trägst die Verantwortung", score: 1 },
      { id: 'c', text: "Bedenken klar artikulieren, Dialog führen, dann gemeinsam entscheiden", score: 4 },
      { id: 'd', text: "Externe Meinung einholen, um zu entscheiden", score: 2 }
    ]
  },

  // === ENTSCHEIDUNGSFINDUNG (11–15) ===
  {
    id: 11, category: 'entscheidung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein KI-System gibt dir eine Investitionsempfehlung mit 73% Konfidenz. Du hast 24h Zeit.",
      angestellte: "Ein Analytics-Dashboard zeigt einen Trend, der sofortige Budgetumverteilung nahelegt.",
      senior_manager: "KI-gestützte Prognosen empfehlen eine große strategische Wette mit mittlerer Sicherheit.",
      high_potential: "Ein Tool empfiehlt eine Herangehensweise, die schneller wäre, aber riskanter."
    },
    question: "Wie triffst du die Entscheidung?",
    options: [
      { id: 'a', text: "Der KI-Empfehlung folgen – die Daten sind objektiver als Intuition", score: 1 },
      { id: 'b', text: "KI-Output als Input nutzen, aber mit Marktkenntnis, Timing und Risikotoleranz abgleichen", score: 4 },
      { id: 'c', text: "Mehr Daten anfordern, bis Konfidenz höher ist", score: 2 },
      { id: 'd', text: "Entscheidung delegieren an jemanden mit mehr Erfahrung", score: 0 }
    ]
  },
  {
    id: 12, category: 'entscheidung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du musst zwischen zwei Großkunden wählen – beide fordern Exklusivität.",
      angestellte: "Du musst dich zwischen zwei internen Projekten entscheiden – du kannst nur eines übernehmen.",
      senior_manager: "Zwei Abteilungen wollen dieselben Ressourcen – du musst priorisieren.",
      high_potential: "Zwei Karrierepfade liegen vor dir – beide haben Vor- und Nachteile."
    },
    question: "Wie näherst du dich dieser Entscheidung?",
    options: [
      { id: 'a', text: "Pro-Contra-Listen erstellen und rational abwägen", score: 2 },
      { id: 'b', text: "Langfristige strategische Ziele als Filter nutzen, nicht kurzfristigen Gewinn", score: 4 },
      { id: 'c', text: "Mit Vertrauensperson besprechen", score: 2 },
      { id: 'd', text: "Die Option wählen, die mehr Menschen zufriedenstellt", score: 1 }
    ]
  },
  {
    id: 13, category: 'entscheidung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du hast eine wichtige Entscheidung getroffen, die sich als falsch herausstellt.",
      angestellte: "Ein Projekt, für das du gekämpft hast, scheitert spektakulär.",
      senior_manager: "Eine Initiative unter deiner Verantwortung verfehlt alle Ziele.",
      high_potential: "Dein erster eigenverantwortlicher Vorschlag wird abgelehnt."
    },
    question: "Wie kommunizierst du das Ergebnis?",
    options: [
      { id: 'a', text: "Externe Faktoren betonen, die zur Situation beigetragen haben", score: 0 },
      { id: 'b', text: "Volle Verantwortung übernehmen, Learnings benennen, konkret korrigieren", score: 4 },
      { id: 'c', text: "Situation erstmal analysieren, bevor du dich äußerst", score: 2 },
      { id: 'd', text: "Team um Feedback bitten, was schiefgelaufen ist", score: 2 }
    ]
  },
  {
    id: 14, category: 'entscheidung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein Konkurrent bietet dir eine Übernahme an. Du hast eine Woche Bedenkzeit.",
      angestellte: "Dir wird eine Beförderung angeboten, aber in einem Bereich außerhalb deiner Expertise.",
      senior_manager: "Du erhältst ein Angebot für eine C-Level-Position bei einem Startup.",
      high_potential: "Dir wird ein schneller Aufstieg angeboten, aber mit Umzug in eine andere Stadt."
    },
    question: "Wie strukturierst du deine Entscheidungsfindung?",
    options: [
      { id: 'a', text: "Intuition vertrauen – große Entscheidungen trifft man aus dem Bauch", score: 1 },
      { id: 'b', text: "Systematischer Framework: Werte, langfristige Ziele, Risiken, Stakeholder-Impact", score: 4 },
      { id: 'c', text: "Meinungen von möglichst vielen Menschen einholen", score: 2 },
      { id: 'd', text: "Finanzielle Analyse als Hauptkriterium", score: 2 }
    ]
  },
  {
    id: 15, category: 'entscheidung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Dein bester Freund ist auch dein Geschäftspartner. Die Partnerschaft funktioniert nicht mehr.",
      angestellte: "Dein Mentor und Freund im Unternehmen macht einen schweren ethischen Fehler.",
      senior_manager: "Ein Teammitglied, das du eingestellt und gefördert hast, performt dauerhaft schlecht.",
      high_potential: "Ein enger Kollege und Freund bewirbt sich auf dieselbe Position wie du."
    },
    question: "Wie gehst du mit dem Konflikt zwischen Beziehung und Business um?",
    options: [
      { id: 'a', text: "Freundschaft hat Priorität – berufliche Dinge können warten", score: 0 },
      { id: 'b', text: "Beide Ebenen klar trennen, aber beide Aspekte transparent ansprechen", score: 4 },
      { id: 'c', text: "Business hat Priorität – persönliche Gefühle dürfen nicht im Weg stehen", score: 2 },
      { id: 'd', text: "Vermittler einschalten, um den Konflikt zu lösen", score: 2 }
    ]
  },

  // === FÜHRUNGSKOMPETENZ (16–20) ===
  {
    id: 16, category: 'fuehrung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Dein Startup wächst von 5 auf 25 Mitarbeiter. Die Kultur verändert sich.",
      angestellte: "Durch eine Reorganisation verantwortest du plötzlich ein viel größeres Team.",
      senior_manager: "Du übernimmst eine Abteilung mit niedriger Moral und hoher Fluktuation.",
      high_potential: "Du wirst erstmals Teamleiter – deine bisherigen Kollegen sind jetzt deine Mitarbeiter."
    },
    question: "Wie etablierst du deine Führungsrolle?",
    options: [
      { id: 'a', text: "Schnell Autorität zeigen durch klare Ansagen und Entscheidungen", score: 2 },
      { id: 'b', text: "Erst zuhören, dann Vision kommunizieren, dann gemeinsam Regeln etablieren", score: 4 },
      { id: 'c', text: "Bestehende Strukturen weitgehend beibehalten", score: 1 },
      { id: 'd', text: "Erfahrene Führungskraft als Coach engagieren", score: 2 }
    ]
  },
  {
    id: 17, category: 'fuehrung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Zwei deiner Schlüsselmitarbeiter haben einen offenen Konflikt.",
      angestellte: "In deinem Team gibt es Grüppchenbildung und unterschwellige Konflikte.",
      senior_manager: "Zwei deiner direkten Berichte konkurrieren aggressiv um die gleiche Beförderung.",
      high_potential: "Du bist zwischen zwei Fraktionen in deinem Team gefangen."
    },
    question: "Wie gehst du mit dem Konflikt um?",
    options: [
      { id: 'a', text: "Beide zu einem klärenden Gespräch zusammenbringen", score: 3 },
      { id: 'b', text: "Einzelgespräche führen, Ursachen verstehen, dann moderieren", score: 4 },
      { id: 'c', text: "HR oder externe Mediation einschalten", score: 2 },
      { id: 'd', text: "Klare Ansage machen, dass persönliche Konflikte im Job nichts verloren haben", score: 1 }
    ]
  },
  {
    id: 18, category: 'fuehrung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein Mitarbeiter hat Angst, dass KI seinen Job überflüssig macht.",
      angestellte: "Dein Team ist skeptisch gegenüber neuen KI-Tools, die eingeführt werden sollen.",
      senior_manager: "Widerstand gegen KI-Transformation in deinem Verantwortungsbereich.",
      high_potential: "Ältere Kollegen lehnen technologische Veränderungen ab, die du befürwortest."
    },
    question: "Wie führst du durch diese Unsicherheit?",
    options: [
      { id: 'a', text: "KI-Vorteile rational erklären und auf Effizienzgewinne verweisen", score: 2 },
      { id: 'b', text: "Ängste ernst nehmen, gemeinsam Zukunftsszenarien entwickeln, Weiterbildung anbieten", score: 4 },
      { id: 'c', text: "KI-Einführung verlangsamen, bis das Team bereit ist", score: 1 },
      { id: 'd', text: "Entscheidung top-down durchsetzen – Veränderung ist unvermeidlich", score: 1 }
    ]
  },
  {
    id: 19, category: 'fuehrung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du musst deinem Team eine schwierige Transformation kommunizieren.",
      angestellte: "Du sollst Veränderungen kommunizieren, hinter denen du selbst nicht 100% stehst.",
      senior_manager: "Dein Team muss einen schmerzhaften Kurswechsel der Geschäftsführung mittragen.",
      high_potential: "Du sollst eine Entscheidung deines Chefs vertreten, die du für falsch hältst."
    },
    question: "Wie kommunizierst du Veränderungen, die nicht von dir kommen?",
    options: [
      { id: 'a', text: "Distanzieren: 'Die Geschäftsführung hat entschieden...'", score: 0 },
      { id: 'b', text: "Ownership zeigen, Kontext erklären, eigene Rolle klar machen, Raum für Fragen geben", score: 4 },
      { id: 'c', text: "Fakten neutral präsentieren ohne eigene Bewertung", score: 2 },
      { id: 'd', text: "Positive Aspekte hervorheben, schwierige Teile minimieren", score: 1 }
    ]
  },
  {
    id: 20, category: 'fuehrung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du bist am Limit. 80-Stunden-Wochen, Familie beschwert sich, Gesundheit leidet.",
      angestellte: "Du merkst erste Burnout-Anzeichen, aber das Projekt ist in einer kritischen Phase.",
      senior_manager: "Dein Kalender ist zu 150% gefüllt. Du schaffst nicht mehr alles.",
      high_potential: "Du arbeitest mehr als alle anderen, aber deine Performance sinkt."
    },
    question: "Wie gehst du mit deinen eigenen Grenzen um?",
    options: [
      { id: 'a', text: "Durchhalten – die kritische Phase ist bald vorbei", score: 0 },
      { id: 'b', text: "Selbstreflexion, klare Grenzen setzen, strategisch delegieren, transparent kommunizieren", score: 4 },
      { id: 'c', text: "Urlaub nehmen, sobald es möglich ist", score: 2 },
      { id: 'd', text: "Effizienter arbeiten und Zeitmanagement verbessern", score: 2 }
    ]
  },

  // === EMOTIONALE INTELLIGENZ (21–25) ===
  {
    id: 21, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Ein Mitarbeiter teilt dir mit, dass er unter starkem privatem Stress steht.",
      angestellte: "Ein Teammitglied weint in einem 1:1 über persönliche Probleme.",
      senior_manager: "Ein Senior-Leader in deinem Bereich zeigt Anzeichen einer persönlichen Krise.",
      high_potential: "Ein Kollege vertraut dir eine schwierige persönliche Situation an."
    },
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Empathisch zuhören, aber klare Grenze zwischen Arbeit und Privat ziehen", score: 2 },
      { id: 'b', text: "Präsent sein, aktiv zuhören, Unterstützung anbieten, gemeinsam pragmatische Lösungen finden", score: 4 },
      { id: 'c', text: "An HR oder EAP (Employee Assistance Program) verweisen", score: 2 },
      { id: 'd', text: "Situation ernst nehmen, aber schnell zu Arbeitsfragen überleiten", score: 1 }
    ]
  },
  {
    id: 22, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du bist wütend über eine unfaire Entscheidung eines Partners.",
      angestellte: "Eine ungerechte Entscheidung deines Vorgesetzten macht dich richtig wütend.",
      senior_manager: "Der Vorstand trifft eine Entscheidung, die dich persönlich betrifft und frustriert.",
      high_potential: "Du wirst bei einer Beförderung übergangen – jemand mit weniger Erfahrung bekommt den Job."
    },
    question: "Wie gehst du mit deiner Wut um?",
    options: [
      { id: 'a', text: "Emotion runterschlucken und professionell bleiben", score: 1 },
      { id: 'b', text: "Erst durchatmen, dann sachlich ansprechen, dabei eigene Emotionen benennen ohne zu beschuldigen", score: 4 },
      { id: 'c', text: "Mit Vertrauensperson darüber sprechen, bevor du handelst", score: 3 },
      { id: 'd', text: "Situation akzeptieren – kämpfen bringt nichts", score: 1 }
    ]
  },
  {
    id: 23, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du hast einen großen Erfolg erzielt. Dein Team hat maßgeblich beigetragen.",
      angestellte: "Dein Projekt ist ein voller Erfolg. Dein Chef lobt dich öffentlich.",
      senior_manager: "Deine Abteilung wird für herausragende Ergebnisse ausgezeichnet.",
      high_potential: "Du bekommst öffentliches Lob für ein Projekt, an dem viele mitgearbeitet haben."
    },
    question: "Wie gehst du mit dem Erfolg um?",
    options: [
      { id: 'a', text: "Bescheiden sein und den Erfolg hauptsächlich dem Team zuschreiben", score: 3 },
      { id: 'b', text: "Erfolg feiern, Team sichtbar würdigen, eigene Rolle authentisch einordnen", score: 4 },
      { id: 'c', text: "Auf die nächste Herausforderung fokussieren – Erfolg ist vergänglich", score: 1 },
      { id: 'd', text: "Erfolg als Sprungbrett für die nächste Forderung nutzen", score: 2 }
    ]
  },
  {
    id: 24, category: 'eq', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein schwieriger Kunde wird am Telefon laut und beleidigend.",
      angestellte: "Ein Kollege greift dich in einem Meeting persönlich an.",
      senior_manager: "Ein Vorstandsmitglied kritisiert dich öffentlich und unfair.",
      high_potential: "Ein Senior-Kollege macht eine abwertende Bemerkung über dich vor anderen."
    },
    question: "Wie reagierst du im Moment?",
    options: [
      { id: 'a', text: "Ruhig bleiben und nicht reagieren – Angriff ins Leere laufen lassen", score: 2 },
      { id: 'b', text: "Sachlich, aber bestimmt Grenze setzen: 'So sprechen wir nicht miteinander'", score: 4 },
      { id: 'c', text: "Situation deeskalieren und später unter vier Augen klären", score: 3 },
      { id: 'd', text: "Gleiche Energie zurückgeben – sonst wirst du nicht ernst genommen", score: 0 }
    ]
  },
  {
    id: 25, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du weißt, dass ein Mitbewerber unethische Praktiken anwendet – und damit erfolgreich ist.",
      angestellte: "Du erfährst von fragwürdigen Praktiken in einer anderen Abteilung.",
      senior_manager: "Dir wird nahegelegt, Zahlen 'kreativer' darzustellen.",
      high_potential: "Du siehst, wie jemand befördert wird, der Erfolge anderer als seine eigenen verkauft."
    },
    question: "Wie gehst du mit diesem ethischen Dilemma um?",
    options: [
      { id: 'a', text: "Nicht dein Problem – fokussiere dich auf deine eigene Arbeit", score: 0 },
      { id: 'b', text: "Eigene Werte als Kompass nutzen, Konsequenzen abwägen, dann handeln", score: 4 },
      { id: 'c', text: "Anonym melden oder Whistleblower-Kanal nutzen", score: 3 },
      { id: 'd', text: "Mit Vertrauensperson besprechen, bevor du handelst", score: 2 }
    ]
  },

  // === KI-STRATEGIE (26–30) - VOICE QUESTIONS ===
  {
    id: 26, category: 'strategie', layer: 'ai_literacy', isVoice: true,
    scenarios: {
      selbststaendige: "Wie würdest du KI in deinem Unternehmen einsetzen, um einen echten Wettbewerbsvorteil zu schaffen?",
      angestellte: "Wie würdest du KI nutzen, um deine Produktivität und die deines Teams zu steigern?",
      senior_manager: "Wie würdest du KI-Transformation in deinem Verantwortungsbereich strategisch vorantreiben?",
      high_potential: "Wie würdest du KI-Kompetenz nutzen, um dich von anderen High Potentials abzuheben?"
    },
    question: "Beantworte diese Frage per Sprachaufnahme (30-60 Sekunden):",
    options: [],
    voicePrompt: true
  },
  {
    id: 27, category: 'strategie', layer: 'rhetoric', isVoice: true,
    scenarios: {
      selbststaendige: "Stell dir vor, du pitchst dein wichtigstes Produkt vor kritischen Investoren. Was sagst du in 60 Sekunden?",
      angestellte: "Du hast 60 Sekunden im Aufzug mit dem CEO. Wie präsentierst du deine wichtigste Idee?",
      senior_manager: "Du hast 60 Sekunden, um den Vorstand von einer großen strategischen Initiative zu überzeugen. Was sagst du?",
      high_potential: "Du hast 60 Sekunden, um dich für eine Beförderung zu empfehlen. Was sagst du?"
    },
    question: "Nimm deinen Elevator Pitch auf (max 60 Sekunden):",
    options: [],
    voicePrompt: true
  },
  {
    id: 28, category: 'strategie', layer: 'strategic_eq', isVoice: true,
    scenarios: {
      selbststaendige: "Was war die schwierigste Führungsentscheidung, die du je treffen musstest? Wie hast du sie getroffen?",
      angestellte: "Beschreibe eine Situation, in der du gegen den Strom schwimmen musstest. Was ist passiert?",
      senior_manager: "Erzähle von einer Entscheidung, bei der Kopf und Bauch unterschiedlicher Meinung waren. Was hast du getan?",
      high_potential: "Beschreibe einen Moment, in dem du Verantwortung übernommen hast, obwohl es nicht dein Job war."
    },
    question: "Reflektiere und antworte per Sprachaufnahme (60-90 Sekunden):",
    options: [],
    voicePrompt: true
  },
  {
    id: 29, category: 'strategie', layer: 'ai_literacy', isVoice: true,
    scenarios: {
      selbststaendige: "Wie stellst du sicher, dass du als Unternehmer auch in 5 Jahren noch relevant bist?",
      angestellte: "Wie entwickelst du dich weiter, um in einer Welt mit zunehmender KI wertvoll zu bleiben?",
      senior_manager: "Was tust du konkret, um deine Führungsfähigkeiten kontinuierlich weiterzuentwickeln?",
      high_potential: "Was unterscheidet dich von anderen, die denselben Karriereweg anstreben?"
    },
    question: "Beantworte diese Zukunftsfrage per Sprachaufnahme (30-60 Sekunden):",
    options: [],
    voicePrompt: true
  },
  {
    id: 30, category: 'strategie', layer: 'rhetoric', isVoice: true,
    scenarios: {
      selbststaendige: "Wenn du eine Botschaft an alle Führungskräfte senden könntest – was wäre sie?",
      angestellte: "Was würdest du anderen raten, die eine Führungskarriere anstreben?",
      senior_manager: "Was ist die wichtigste Lektion, die du als Führungskraft gelernt hast?",
      high_potential: "Was treibt dich an? Was ist dein 'Warum' für eine Karriere in der Führung?"
    },
    question: "Deine persönliche Leadership-Message (30-60 Sekunden):",
    options: [],
    voicePrompt: true
  }
];

// Function to get questions for a specific role
export function getQuestionsForRole(role) {
  const roleKey = role?.toLowerCase().replace(/[-\s]/g, '_') || 'selbststaendige';
  const validRoles = ['selbststaendige', 'angestellte', 'senior_manager', 'high_potential'];
  const selectedRole = validRoles.includes(roleKey) ? roleKey : 'selbststaendige';
  
  return baseQuestions.map(q => ({
    ...q,
    scenario: q.scenarios[selectedRole] || q.scenarios.selbststaendige
  }));
}

// Export default questions (for backwards compatibility)
export const questions = getQuestionsForRole('selbststaendige');

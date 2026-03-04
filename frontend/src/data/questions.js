export const CATEGORIES = {
  rhetorik: 'Rhetorik & Kommunikation',
  kritisches_denken: 'Kritisches Denken',
  entscheidung: 'Entscheidungsfindung',
  fuehrung: 'Führungskompetenz',
  eq: 'Emotionale Intelligenz',
  strategie: 'Business-Strategie'
};

export const CATEGORY_COLORS = {
  rhetorik: '#3B82F6',
  kritisches_denken: '#60A5FA',
  entscheidung: '#D97706',
  fuehrung: '#2563EB',
  eq: '#F59E0B',
  strategie: '#93C5FD'
};

export const LAYERS = {
  ai_literacy: 'KI-Kompetenz',
  rhetoric: 'Boardroom-Rhetorik',
  strategic_eq: 'Strategisches EQ'
};

export const questions = [
  // === RHETORIK & KOMMUNIKATION (1–8) ===
  {
    id: 1, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Ein KI-Modell empfiehlt eine 20%ige Personalreduzierung. Du präsentierst das Ergebnis dem Vorstand.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "KI-Daten unkommentiert präsentieren und Vorstand entscheiden lassen", score: 0 },
      { id: 'b', text: "Mit klarer eigener Haltung präsentieren, Kontext erklären und Diskussion strategisch führen", score: 3 },
      { id: 'c', text: "Externe Beratungsfirma mit der Kommunikation beauftragen", score: 1 },
      { id: 'd', text: "Nur die positiven Aspekte der KI-Empfehlung zeigen", score: 1 }
    ]
  },
  {
    id: 2, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Dein größter Investor zweifelt öffentlich an deiner Strategie.",
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Konflikt vermeiden, schriftliches Statement senden", score: 0 },
      { id: 'b', text: "Persönliches Gespräch suchen, aktiv zuhören, Bedenken direkt und sachlich adressieren", score: 3 },
      { id: 'c', text: "Mit Fakten per E-Mail antworten", score: 1 },
      { id: 'd', text: "CFO die Situation klären lassen", score: 2 }
    ]
  },
  {
    id: 3, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Krisensituation: Das Team verlangt sofortige Antworten, aber die Informationen sind noch unvollständig.",
    question: "Was kommunizierst du?",
    options: [
      { id: 'a', text: "Warten bis alle Informationen vorliegen", score: 0 },
      { id: 'b', text: "Transparent kommunizieren: was bekannt ist, was noch fehlt und wie das Vorgehen sein wird", score: 3 },
      { id: 'c', text: "Team mit unbestätigten Informationen beruhigen", score: 1 },
      { id: 'd', text: "Kommunikation an einen Sprecher delegieren", score: 2 }
    ]
  },
  {
    id: 4, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Ein Top-Performer liefert seit Wochen unterdurchschnittliche Ergebnisse.",
    question: "Wie führst du das Gespräch?",
    options: [
      { id: 'a', text: "Formelle E-Mail mit den Leistungsproblemen senden", score: 0 },
      { id: 'b', text: "Privates Gespräch mit konkreten Beobachtungen, offenen Fragen und echtem Interesse an der Ursache", score: 3 },
      { id: 'c', text: "Abwarten und auf Verbesserung hoffen", score: 1 },
      { id: 'd', text: "Direkt an HR verweisen", score: 1 }
    ]
  },
  {
    id: 5, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Eine strategische Veränderung steht an, die das Team verunsichern wird.",
    question: "Wie und wann kommunizierst du?",
    options: [
      { id: 'a', text: "Alles auf einmal per E-Mail", score: 0 },
      { id: 'b', text: "Team-Meeting: zuerst das Warum, dann das Was, dann Raum für Fragen", score: 3 },
      { id: 'c', text: "Nur direkte Reports informieren – der Rest erfährt es durch Flurfunk", score: 0 },
      { id: 'd', text: "Ankündigung so lange wie möglich aufschieben", score: 0 }
    ]
  },
  {
    id: 6, category: 'rhetorik', layer: 'rhetoric',
    scenario: "In einer Investor-Verhandlung verliert das Gespräch plötzlich an Energie.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Vorbereitete Präsentation einfach fortführen", score: 1 },
      { id: 'b', text: "Stoppen, echte Bedenken erfragen und Gespräch auf gemeinsame Ziele reframen", score: 3 },
      { id: 'c', text: "Meeting frühzeitig beenden und Fortsetzung planen", score: 2 },
      { id: 'd', text: "Tempo erhöhen und mit mehr Daten überzeugen", score: 0 }
    ]
  },
  {
    id: 7, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Allhands-Präsentation für ein kulturell diverses internationales Team.",
    question: "Wie gestaltest du sie?",
    options: [
      { id: 'a', text: "Bewährte Kommunikationsstrategie beibehalten", score: 0 },
      { id: 'b', text: "Sprache, Beispiele und Stil bewusst an die Diversität des Teams anpassen", score: 3 },
      { id: 'c', text: "Kollegen die Präsentation übernehmen lassen", score: 1 },
      { id: 'd', text: "Kurz halten und Informationsdichte reduzieren", score: 1 }
    ]
  },
  {
    id: 8, category: 'rhetorik', layer: 'rhetoric',
    scenario: "Nach einer fehlgeschlagenen Initiative fordert ein Vorstandsmitglied eine öffentliche Erklärung.",
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Schaden durch strategisch formulierte Unterstatements minimieren", score: 1 },
      { id: 'b', text: "Klare Verantwortung übernehmen, Lerneffekte erklären, nächsten Schritt zeigen", score: 3 },
      { id: 'c', text: "Schuld auf externe Faktoren verlagern", score: 0 },
      { id: 'd', text: "Kommunikationsberater das Statement verfassen lassen, ohne selbst aufzutreten", score: 1 }
    ]
  },

  // === KRITISCHES DENKEN (9–16) ===
  {
    id: 9, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Ein umfangreicher KI-Report empfiehlt, dein Kernprodukt einzustellen. Die Daten wirken überzeugend.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Sofort der KI-Empfehlung folgen und das Produkt einstellen", score: 0 },
      { id: 'b', text: "Report-Annahmen analysieren, weitere Perspektiven einholen und dann eigenständig entscheiden", score: 3 },
      { id: 'c', text: "Report vollständig ignorieren", score: 0 },
      { id: 'd', text: "Eine zweite KI-Analyse beauftragen", score: 1 }
    ]
  },
  {
    id: 10, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Zwei Marktberichte liefern gegensätzliche Prognosen für deine Branche.",
    question: "Wie gehst du damit um?",
    options: [
      { id: 'a', text: "Den optimistischeren Bericht wählen", score: 0 },
      { id: 'b', text: "Methodiken beider Berichte analysieren, Kernunterschiede identifizieren, eigene fundierte Einschätzung bilden", score: 3 },
      { id: 'c', text: "Auf einen dritten Bericht warten, der Klarheit schafft", score: 1 },
      { id: 'd', text: "Team-Mehrheitsentscheidung einholen", score: 2 }
    ]
  },
  {
    id: 11, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Das Unternehmen wächst stark, aber die Profitabilität sinkt parallel.",
    question: "Wie analysierst du die Situation?",
    options: [
      { id: 'a', text: "Weiteres Wachstum fokussieren – Profitabilität kommt durch Skalierung", score: 1 },
      { id: 'b', text: "Systematisch alle Kostentreiber analysieren, Ineffizienzen identifizieren, Wachstumshebel von Kostenstrukturen trennen", score: 3 },
      { id: 'c', text: "Sofort alle Ausgaben kürzen", score: 0 },
      { id: 'd', text: "Externe Unternehmensberatung beauftragen", score: 2 }
    ]
  },
  {
    id: 12, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Ein neuer Branchentrend gewinnt Medienaufmerksamkeit. Alle reden darüber.",
    question: "Soll dein Unternehmen folgen?",
    options: [
      { id: 'a', text: "Sofort dem Trend folgen", score: 0 },
      { id: 'b', text: "Analysieren ob strukturell oder Hype, dann strategische Relevanz für das eigene Modell bewerten", score: 3 },
      { id: 'c', text: "Warten bis Wettbewerber sich positioniert haben", score: 1 },
      { id: 'd', text: "Branchentrends grundsätzlich ignorieren", score: 0 }
    ]
  },
  {
    id: 13, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Dein Bauchgefühl widerspricht den vorliegenden Analysedaten eindeutig.",
    question: "Wem folgst du?",
    options: [
      { id: 'a', text: "Immer den Daten folgen – sie sind objektiver", score: 1 },
      { id: 'b', text: "Untersuchen warum die Intuition abweicht – sie zeigt oft blinde Flecken der Daten auf", score: 3 },
      { id: 'c', text: "Immer der Intuition folgen", score: 0 },
      { id: 'd', text: "Externe Validierung einholen", score: 2 }
    ]
  },
  {
    id: 14, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Ein Experten-Panel ist sich einig, dass deine aktuelle Strategie falsch ist.",
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Strategie sofort revidieren", score: 1 },
      { id: 'b', text: "Panel-Prämissen kritisch hinterfragen, eigene blinde Flecken prüfen, dann eigenständig entscheiden", score: 3 },
      { id: 'c', text: "Strategie ohne weitere Analyse verteidigen", score: 0 },
      { id: 'd', text: "Dem Panel zustimmen um Konflikte zu vermeiden", score: 0 }
    ]
  },
  {
    id: 15, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Dein bestes Produkt hat seit 3 Monaten sinkende NPS-Werte. Das Team sieht keinen Handlungsbedarf.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Die Einschätzung des Teams akzeptieren", score: 0 },
      { id: 'b', text: "Eigenständig Ursachen untersuchen, Kunden direkt befragen, eigene Schlussfolgerungen ziehen", score: 3 },
      { id: 'c', text: "Sofort ein Produkt-Redesign starten", score: 1 },
      { id: 'd', text: "Weitere 3 Monate abwarten um einen Trend zu erkennen", score: 1 }
    ]
  },
  {
    id: 16, category: 'kritisches_denken', layer: 'ai_literacy',
    scenario: "Eine neue Regulierung tritt in 18 Monaten in Kraft und betrifft dein Geschäftsmodell.",
    question: "Wie reagierst du jetzt?",
    options: [
      { id: 'a', text: "Warten bis die Regulierung konkreter wird", score: 0 },
      { id: 'b', text: "Auswirkungen analysieren, strategische Optionen identifizieren, proaktiv für Szenarien planen", score: 3 },
      { id: 'c', text: "Sofort eine Anwaltskanzlei für Compliance-Arbeit beauftragen", score: 2 },
      { id: 'd', text: "Ignorieren – Regulierungen ändern sich oft noch", score: 0 }
    ]
  },

  // === ENTSCHEIDUNGSFINDUNG (17–25) ===
  {
    id: 17, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Eine unternehmensweite Entscheidung ist nötig. Du hast 60% der benötigten Informationen.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Auf vollständige Informationen warten", score: 0 },
      { id: 'b', text: "Kritische Informationen identifizieren, fundierte Entscheidung treffen, Korrektiv-Mechanismen einbauen", score: 3 },
      { id: 'c', text: "Entscheidung vollständig delegieren", score: 1 },
      { id: 'd', text: "Rein intuitiv entscheiden", score: 1 }
    ]
  },
  {
    id: 18, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Eine KI-Analyse empfiehlt eine strategische Richtung, die deiner Erfahrung widerspricht.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "KI folgen – sie ist objektiver als menschliche Erfahrung", score: 1 },
      { id: 'b', text: "KI als Startpunkt nutzen, Annahmen hinterfragen, eigene Erfahrung als zusätzliche Datenschicht integrieren", score: 3 },
      { id: 'c', text: "Erfahrung folgen – KI versteht keine strategischen Nuancen", score: 1 },
      { id: 'd', text: "Das Team entscheiden lassen", score: 0 }
    ]
  },
  {
    id: 19, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Vor dir liegt eine schwer revidierbare Entscheidung mit großem Potenzial, aber erheblichem Risiko.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Nicht-reversible Entscheidungen grundsätzlich meiden", score: 0 },
      { id: 'b', text: "Asymmetrisch analysieren: Downside-Risiken stärker gewichten, kritische Variablen absichern bevor entschieden wird", score: 3 },
      { id: 'c', text: "Schnell entscheiden bevor die Gelegenheit verpasst ist", score: 1 },
      { id: 'd', text: "Auf mehr Marktdaten warten", score: 1 }
    ]
  },
  {
    id: 20, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Das Team ist gespalten. Die Mehrheit bevorzugt Option A, du siehst Option B klar als besser.",
    question: "Wie entscheidest du?",
    options: [
      { id: 'a', text: "Mehrheit folgen um den Teamfrieden zu wahren", score: 0 },
      { id: 'b', text: "Perspektive zu Option B erklären, Argumente für A aktiv anhören, dann begründete Endentscheidung treffen", score: 3 },
      { id: 'c', text: "Option B ohne weitere Diskussion erzwingen", score: 1 },
      { id: 'd', text: "Externe Berater entscheiden lassen", score: 0 }
    ]
  },
  {
    id: 21, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Ein Projekt mit €500k Investment zeigt kaum Fortschritt. Das Team will durchhalten.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Fortsetzen – ihr habt bereits so viel investiert", score: 0 },
      { id: 'b', text: "Projekt nach zukünftigen Aussichten bewerten, nicht vergangenen Kosten – stoppen wenn nötig", score: 3 },
      { id: 'c', text: "Budget um 50% kürzen und fortsetzen", score: 2 },
      { id: 'd', text: "Noch 3 Monate warten bevor entschieden wird", score: 1 }
    ]
  },
  {
    id: 22, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Eine komplexe Entscheidung ist nötig, aber du leidest unter Entscheidungslähmung.",
    question: "Wie überwindest du sie?",
    options: [
      { id: 'a', text: "Warten bis die Lähmung von selbst verschwindet", score: 0 },
      { id: 'b', text: "Klare Deadline setzen, 3 Kernkriterien definieren und entscheiden – auch unvollkommene Entscheidungen sind besser als keine", score: 3 },
      { id: 'c', text: "Entscheidung vollständig delegieren", score: 1 },
      { id: 'd', text: "Nach dem zuletzt Gelesenem entscheiden", score: 0 }
    ]
  },
  {
    id: 23, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Eine schnelle Entscheidung ist gefragt. Du hast exakt 15 Minuten.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Rein intuitiv entscheiden", score: 1 },
      { id: 'b', text: "Wichtigstes Kriterium identifizieren, 2 Minuten für Kerndaten, klare Entscheidung mit kommuniziertem Entscheidungspfad", score: 3 },
      { id: 'c', text: "Mehr Zeit verlangen und Entscheidung verschieben", score: 0 },
      { id: 'd', text: "Jemand anderen entscheiden lassen", score: 0 }
    ]
  },
  {
    id: 24, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Eine Entscheidung birgt ethische Graubereiche.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Rein wirtschaftlich entscheiden", score: 0 },
      { id: 'b', text: "Ethische Überlegungen explizit in den Entscheidungsrahmen integrieren – Vertrauen und Reputation sind wirtschaftliche Faktoren", score: 3 },
      { id: 'c', text: "Nur prüfen ob es legal ist", score: 1 },
      { id: 'd', text: "Entscheidungen mit ethischen Graubereichen grundsätzlich meiden", score: 1 }
    ]
  },
  {
    id: 25, category: 'entscheidung', layer: 'strategic_eq',
    scenario: "Du erkennst, dass eine vergangene Entscheidung falsch war. Das Team hat sich bereits darauf ausgerichtet.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Entscheidung aufrechterhalten um Glaubwürdigkeit zu wahren", score: 0 },
      { id: 'b', text: "Transparent kommunizieren was gelernt wurde, Kurskorrektur erklären, Situation als Leadership-Moment nutzen", score: 3 },
      { id: 'c', text: "Still ohne Erklärung revidieren", score: 1 },
      { id: 'd', text: "Verantwortung auf geänderte Umstände schieben", score: 0 }
    ]
  },

  // === FÜHRUNGSKOMPETENZ (26–34) ===
  {
    id: 26, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Dein bestes Talent droht das Unternehmen zu verlassen.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Gehalt erhöhen", score: 1 },
      { id: 'b', text: "Tiefgreifende Einzelgespräche führen, wahre Motivatoren verstehen, individuelle Entwicklungspfade schaffen", score: 3 },
      { id: 'c', text: "Geschehenlassen – gute Leute ziehen weiter", score: 0 },
      { id: 'd', text: "HR über Retention-Pakete sprechen", score: 2 }
    ]
  },
  {
    id: 27, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Zwei deiner Top-Manager haben einen eskalierenden Konflikt.",
    question: "Was ist dein Ansatz?",
    options: [
      { id: 'a', text: "Ignorieren – sie sind Erwachsene", score: 0 },
      { id: 'b', text: "Strukturiertes Gespräch moderieren, Kernursachen adressieren, klare Erwartungen für professionelle Zusammenarbeit setzen", score: 3 },
      { id: 'c', text: "Beide physisch voneinander trennen", score: 1 },
      { id: 'd', text: "Beide schriftlich verwarnen", score: 1 }
    ]
  },
  {
    id: 28, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Ein hochpotentieller Mitarbeiter leistet dauerhaft unterdurchschnittlich.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Schnell kündigen bevor das Team demotiviert wird", score: 1 },
      { id: 'b', text: "Can't-Do vs Won't-Do Problem analysieren, entsprechend mit klarer Erwartungsführung und Support handeln", score: 3 },
      { id: 'c', text: "Problem ignorieren und auf Verbesserung hoffen", score: 0 },
      { id: 'd', text: "In eine andere Abteilung versetzen", score: 1 }
    ]
  },
  {
    id: 29, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Das Unternehmen durchläuft einen massiven Kulturwandel. Das Team widersteht.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Wandel von oben erzwingen", score: 0 },
      { id: 'b', text: "Das Warum des Wandels erklären, Multiplikatoren einbinden, Übergang gemeinsam mit dem Team gestalten", score: 3 },
      { id: 'c', text: "Wandel verlangsamen um Widerstand zu reduzieren", score: 1 },
      { id: 'd', text: "Team mehr Zeit zur Anpassung geben", score: 2 }
    ]
  },
  {
    id: 30, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Du delegierst eine kritische Aufgabe. Der Mitarbeiter liefert nicht die erwartete Qualität.",
    question: "Was machst du?",
    options: [
      { id: 'a', text: "Aufgabe selbst übernehmen", score: 0 },
      { id: 'b', text: "Briefing-Klarheit prüfen, konkretes Feedback geben, Verbesserung als Coaching-Moment begleiten", score: 3 },
      { id: 'c', text: "Mitarbeiter formal tadeln", score: 1 },
      { id: 'd', text: "Aufgabe an jemand anderen delegieren", score: 1 }
    ]
  },
  {
    id: 31, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Du übernimmst eine Remote-Führungsrolle. Das Team fühlt sich disconnected.",
    question: "Wie baust du Verbindung auf?",
    options: [
      { id: 'a', text: "Anzahl der Video-Meetings erhöhen", score: 1 },
      { id: 'b', text: "Bewusste Check-in-Rituale einbauen, asynchrone Kommunikation fördern, Raum für persönliche Verbindung jenseits von Aufgaben schaffen", score: 3 },
      { id: 'c', text: "Team selbst Verbindung aufbauen lassen", score: 0 },
      { id: 'd', text: "Offsite-Event planen", score: 2 }
    ]
  },
  {
    id: 32, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Du erkennst einen toxischen Top-Performer im Team.",
    question: "Was ist dein Leadership-Ansatz?",
    options: [
      { id: 'a', text: "Toxisches Verhalten wegen der Performance ignorieren", score: 0 },
      { id: 'b', text: "Klares, privates Gespräch: kulturellen Schaden erklären, klare Grenzen setzen, faire Chance zur Veränderung geben", score: 3 },
      { id: 'c', text: "Sofort entlassen", score: 1 },
      { id: 'd', text: "Hoffen dass das Team selbst damit umgeht", score: 0 }
    ]
  },
  {
    id: 33, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Noch kein Nachfolger identifiziert. Du erhältst ein plötzlich attraktives externes Angebot.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Angebot annehmen – das Unternehmen ist nicht für immer deine Verantwortung", score: 1 },
      { id: 'b', text: "Angebot evaluieren und Zeit für einen Übergabeplan nehmen bevor entschieden wird", score: 3 },
      { id: 'c', text: "Sofort ablehnen – Loyalität gehört dem Unternehmen", score: 1 },
      { id: 'd', text: "Angebot als Gehaltsverhandlungs-Hebel nutzen", score: 0 }
    ]
  },
  {
    id: 34, category: 'fuehrung', layer: 'rhetoric',
    scenario: "Eine externe Krise bedroht deinen Markt. Das Team ist verängstigt.",
    question: "Wie führst du?",
    options: [
      { id: 'a', text: "Keine Schwäche zeigen, bedingungslose Zuversicht kommunizieren", score: 1 },
      { id: 'b', text: "Authentisch über Unsicherheit sein, Stärke durch klare Denkweise und nächste Schritte zeigen, Team fokussiert halten", score: 3 },
      { id: 'c', text: "Team-Kommunikation reduzieren um Panik zu vermeiden", score: 0 },
      { id: 'd', text: "Auf interne Prozesse konzentrieren, externe Faktoren ignorieren", score: 0 }
    ]
  },

  // === EMOTIONALE INTELLIGENZ (35–42) ===
  {
    id: 35, category: 'eq', layer: 'strategic_eq',
    scenario: "Ein Vorstandsmitglied greift deine Idee in einem Meeting öffentlich und direkt an.",
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Sofort emotional verteidigen", score: 0 },
      { id: 'b', text: "Ruhig bleiben, für die Perspektive danken, spezifische Bedenken erfragen, sachlich adressieren", score: 3 },
      { id: 'c', text: "Schweigen und es persönlich nehmen", score: 0 },
      { id: 'd', text: "Das Meeting abbrechen", score: 0 }
    ]
  },
  {
    id: 36, category: 'eq', layer: 'strategic_eq',
    scenario: "Das Team wirkt trotz guter Ergebnisse dauerhaft demotiviert.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Abwarten ob es sich von selbst reguliert", score: 0 },
      { id: 'b', text: "Einzelne Check-ins führen, aktiv ohne Wertung zuhören, unausgesprochene Ursachen identifizieren", score: 3 },
      { id: 'c', text: "Ein Team-Event zur Stimmungsverbesserung ankündigen", score: 1 },
      { id: 'd', text: "Ziele und Boni erhöhen", score: 1 }
    ]
  },
  {
    id: 37, category: 'eq', layer: 'strategic_eq',
    scenario: "Du gerätst persönlich in eine stressige Phase und merkst, dass du reaktiver wirst.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Einfach härter durch die Phase arbeiten", score: 0 },
      { id: 'b', text: "Zustand bewusst erkennen, Regenerationsraum schaffen, offen mit engen Vertrauenspersonen kommunizieren", score: 3 },
      { id: 'c', text: "Stress vor dem Team verbergen", score: 0 },
      { id: 'd', text: "Alle unwichtigen Aufgaben delegieren", score: 2 }
    ]
  },
  {
    id: 38, category: 'eq', layer: 'strategic_eq',
    scenario: "In einer Verhandlung spürst du, dass die andere Seite nervös und unter Druck wird.",
    question: "Was machst du?",
    options: [
      { id: 'a', text: "Den Vorteil aggressiv ausnutzen", score: 0 },
      { id: 'b', text: "Druck strategisch reduzieren, psychologische Sicherheit schaffen, Empathie für eine nachhaltige Einigung nutzen", score: 3 },
      { id: 'c', text: "Signale ignorieren und die Strategie fortführen", score: 1 },
      { id: 'd', text: "Sofort Zugeständnisse anbieten", score: 1 }
    ]
  },
  {
    id: 39, category: 'eq', layer: 'strategic_eq',
    scenario: "Ein Kollege auf Augenhöhe verbreitet negative Gerüchte über dich.",
    question: "Wie reagierst du?",
    options: [
      { id: 'a', text: "Gegendarstellungen verbreiten", score: 0 },
      { id: 'b', text: "Direktes, ruhiges Gespräch suchen, Ursache verstehen, Situation ohne Drama klären", score: 3 },
      { id: 'c', text: "Vollständig ignorieren", score: 1 },
      { id: 'd', text: "Beim gemeinsamen Vorgesetzten beschweren", score: 1 }
    ]
  },
  {
    id: 40, category: 'eq', layer: 'strategic_eq',
    scenario: "Eine emotionale Entlassungswelle muss angekündigt werden.",
    question: "Wie bereitest du dich vor?",
    options: [
      { id: 'a', text: "Kommunikation vollständig an HR delegieren", score: 0 },
      { id: 'b', text: "Emotional vorbereiten, Gespräche persönlich führen, echte Empathie zeigen, Unterstützungsressourcen bereitstellen", score: 3 },
      { id: 'c', text: "Standardisierte E-Mail versenden", score: 0 },
      { id: 'd', text: "Externen Berater die Nachrichten überbringen lassen", score: 1 }
    ]
  },
  {
    id: 41, category: 'eq', layer: 'strategic_eq',
    scenario: "Das Team feiert einen großen Erfolg, du bist aber unzufrieden mit dem Prozess.",
    question: "Wie verhältst du dich?",
    options: [
      { id: 'a', text: "Kritik am Prozess sofort teilen", score: 0 },
      { id: 'b', text: "Erfolg aufrichtig feiern, Leistung anerkennen, Prozessthema separat in einem ruhigen Moment adressieren", score: 3 },
      { id: 'c', text: "Die Feier frühzeitig verlassen", score: 0 },
      { id: 'd', text: "Unzufriedenheit schweigend für sich behalten", score: 1 }
    ]
  },
  {
    id: 42, category: 'eq', layer: 'strategic_eq',
    scenario: "Ein wichtiger Stakeholder kommuniziert nie emotional, aber du erkennst nonverbale Spannungssignale.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Signale ignorieren und sachlich weiterkommunizieren", score: 1 },
      { id: 'b', text: "Unausgesprochene Spannung direkt aber taktvoll ansprechen, Raum für offene Kommunikation schaffen", score: 3 },
      { id: 'c', text: "Kontakt reduzieren um Reibung zu minimieren", score: 0 },
      { id: 'd', text: "Formelle E-Mail zur Klärung von Missverständnissen senden", score: 1 }
    ]
  },

  // === BUSINESS-STRATEGIE (43–50) ===
  {
    id: 43, category: 'strategie', layer: 'ai_literacy',
    scenario: "Deine Branche wird durch KI massiv disruptiert.",
    question: "Wie positionierst du dein Unternehmen strategisch?",
    options: [
      { id: 'a', text: "Auf mehr Marktklarheit warten", score: 0 },
      { id: 'b', text: "Analysieren wo KI die Wertschöpfung ergänzen kann, wo sie bedroht, und eine aktive Transformationsstrategie entwickeln", score: 3 },
      { id: 'c', text: "Ignorieren – das Geschäftsmodell ist KI-resistent", score: 0 },
      { id: 'd', text: "Sofort alle verfügbaren KI-Tools adoptieren", score: 1 }
    ]
  },
  {
    id: 44, category: 'strategie', layer: 'ai_literacy',
    scenario: "Ein Konkurrent integriert KI deutlich schneller als ihr.",
    question: "Was ist deine strategische Reaktion?",
    options: [
      { id: 'a', text: "KI-Investitionen sofort verdoppeln um aufzuholen", score: 1 },
      { id: 'b', text: "Analysieren ob der Konkurrent wirklich profitiert, eigenen KI-Hebel identifizieren, differenzierte Strategie entwickeln", score: 3 },
      { id: 'c', text: "Wettbewerbsaktivitäten ignorieren", score: 0 },
      { id: 'd', text: "Den Vorstand überzeugen, dass KI ein Hype ist", score: 0 }
    ]
  },
  {
    id: 45, category: 'strategie', layer: 'ai_literacy',
    scenario: "Der Vorstand fragt nach dem ROI eurer KI-Investitionen. Du hast keine genauen Zahlen.",
    question: "Wie antwortest du?",
    options: [
      { id: 'a', text: "Grobe Schätzungen als Fakten präsentieren", score: 0 },
      { id: 'b', text: "Transparent über die Datenlage sein, qualitative Fortschritte zeigen, KI-ROI-Framework für die Zukunft etablieren", score: 3 },
      { id: 'c', text: "Genaue Zahlen für nächstes Quartal versprechen", score: 1 },
      { id: 'd', text: "Das Thema auf andere Investitionen wechseln", score: 0 }
    ]
  },
  {
    id: 46, category: 'strategie', layer: 'ai_literacy',
    scenario: "Ein KI-Tool schlägt eine kurzfristig profitable aber ethisch fragwürdige Empfehlung vor.",
    question: "Was tust du?",
    options: [
      { id: 'a', text: "Empfehlung folgen da sie profitabel ist", score: 0 },
      { id: 'b', text: "Ablehnen, ethische Überlegung dokumentieren, Chance für KI-Governance-Richtlinien nutzen", score: 3 },
      { id: 'c', text: "Rechtsabteilung prüfen lassen ob es legal ist", score: 1 },
      { id: 'd', text: "Empfehlung ohne weitere Reflexion ignorieren", score: 1 }
    ]
  },
  {
    id: 47, category: 'strategie', layer: 'ai_literacy',
    scenario: "Soll dein Unternehmen KI-Fähigkeiten intern aufbauen oder eine KI-Partnerschaft eingehen?",
    question: "Was ist dein Ansatz?",
    options: [
      { id: 'a', text: "Immer extern einkaufen – Technologie ist nicht eure Kernkompetenz", score: 1 },
      { id: 'b', text: "Strategisch analysieren: Kernkompetenz, Wettbewerbsvorteil durch eigenes KI-Wissen und Make-or-Buy-Kipp-Punkt", score: 3 },
      { id: 'c', text: "Immer intern aufbauen – strategische Abhängigkeiten sind gefährlich", score: 1 },
      { id: 'd', text: "Nach dem niedrigsten Preis entscheiden", score: 0 }
    ]
  },
  {
    id: 48, category: 'strategie', layer: 'ai_literacy',
    scenario: "Die digitale Transformation soll starten. Das mittlere Management widersteht.",
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Mittleres Management übergehen", score: 0 },
      { id: 'b', text: "Schlüsselpersonen als Transformations-Champions identifizieren, aktiv einbinden und zu Mitgestaltern machen", score: 3 },
      { id: 'c', text: "Transformation verlangsamen", score: 1 },
      { id: 'd', text: "Widerständige Manager ersetzen", score: 1 }
    ]
  },
  {
    id: 49, category: 'strategie', layer: 'ai_literacy',
    scenario: "Begrenzte Budget-Ressourcen müssen zwischen KI-Innovation und Kerngeschäft-Optimierung aufgeteilt werden.",
    question: "Wie allokierst du?",
    options: [
      { id: 'a', text: "Alles in KI investieren – das ist die Zukunft", score: 0 },
      { id: 'b', text: "Strategischen Wert beider Bereiche bewerten, minimales Kerngeschäft-Investment definieren, dynamisch basierend auf Lernkurven allokieren", score: 3 },
      { id: 'c', text: "An beiden sparen und auf besseren Zeitpunkt warten", score: 0 },
      { id: 'd', text: "Den Berater-Empfehlungen für die Budget-Aufteilung folgen", score: 1 }
    ]
  },
  {
    id: 50, category: 'strategie', layer: 'ai_literacy',
    scenario: "Du erkennst: In 3 Jahren werden KI-Agenten viele Aufgaben deines Teams übernehmen.",
    question: "Wie handelst du jetzt?",
    options: [
      { id: 'a', text: "Auf Klarheit warten bevor gehandelt wird", score: 0 },
      { id: 'b', text: "Proaktiv Upskilling starten, Rollen auf menschliche Stärken ausrichten, Human-AI-Collaboration-Strategie entwickeln", score: 3 },
      { id: 'c', text: "Still mit Headcount-Reduktion beginnen", score: 0 },
      { id: 'd', text: "Kommunizieren dass sich nichts ändern wird um Unruhe zu vermeiden", score: 0 }
    ]
  }
];

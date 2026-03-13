export const CATEGORIES = {
  rhetorik: 'Rhetorik & Kommunikation',
  kritisches_denken: 'Kritisches Denken',
  entscheidung: 'Entscheidungsfindung',
  fuehrung: 'Führungskompetenz',
  eq: 'Emotionale Intelligenz',
  strategie: 'KI-Strategie'
};

export const CATEGORY_COLORS = {
  rhetorik: '#F59E0B',
  kritisches_denken: '#F97316',
  entscheidung: '#D97706',
  fuehrung: '#F59E0B',
  eq: '#F97316',
  strategie: '#D97706'
};

export const LAYERS = {
  ai_literacy: 'KI-Kompetenz',
  rhetoric: 'Boardroom-Rhetorik',
  strategic_eq: 'Strategisches EQ'
};

const baseQuestions = [
  // === RHETORIK & KOMMUNIKATION (1–5) ===
  {
    id: 1, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein großer Kunde zweifelt öffentlich an deinem Produkt auf LinkedIn. 2.400 Reaktionen, dein Team ist verunsichert.",
      angestellte: "Dein Vorgesetzter kritisiert deine Abteilung in einem All-Hands-Meeting vor 200 Mitarbeitern. Die Stimmung kippt.",
      senior_manager: "Ein wichtiger Stakeholder stellt deine 2-Millionen-Euro-Projektentscheidung in einer Vorstandssitzung öffentlich infrage.",
      high_potential: "Ein erfahrener Kollege mit 15 Jahren mehr Erfahrung untergräbt systematisch deine Ideen in Teammeetings."
    },
    question: "Wie reagierst du in den nächsten 60 Minuten?",
    options: [
      { id: 'a', text: "Abwarten und die Situation beobachten – vielleicht löst sie sich von selbst", score: 0 },
      { id: 'b', text: "Direkt, sachlich und souverän konfrontieren: Fakten präsentieren, Körpersprache kontrollieren, Raum für Dialog lassen", score: 4 },
      { id: 'c', text: "Eine ausführliche schriftliche Stellungnahme vorbereiten und später versenden", score: 2 },
      { id: 'd', text: "Verbündete mobilisieren, die für dich sprechen und die Situation entschärfen", score: 1 }
    ]
  },
  {
    id: 2, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du pitchst vor einem Investoren-Panel. Mitten in deinem Kernsatz unterbricht dich der Lead-Investor mit einer kritischen Frage zur Unit Economics.",
      angestellte: "In deiner Strategie-Präsentation vor dem C-Level unterbricht dich der CEO mit einer Frage, die deine Kernthese infrage stellt.",
      senior_manager: "Der Aufsichtsratsvorsitzende unterbricht deinen Jahresvortrag mit einer völlig unerwarteten Frage zu einem Nebenthema.",
      high_potential: "Ein Partner der Unternehmensberatung hinterfragt deine Analyse aggressiv vor dem gesamten Projektteam."
    },
    question: "Was tust du in diesem Moment?",
    options: [
      { id: 'a', text: "Höflich ignorieren und die Präsentation zu Ende bringen – die Frage kommt später", score: 1 },
      { id: 'b', text: "Frage aufgreifen, in 30 Sekunden präzise beantworten, dann elegant zum Hauptpunkt zurückführen: 'Das beantwortet auch...'", score: 4 },
      { id: 'c', text: "Alle Fragen auf die Q&A-Session verschieben: 'Guter Punkt, darauf komme ich am Ende zurück'", score: 2 }
    ]
  },
  {
    id: 3, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Dein bester Entwickler – der einzige, der das Kernprodukt versteht – sagt dir, dass er in 4 Wochen geht. Du hast 30 Minuten.",
      angestellte: "Ein Teammitglied hat einen Fehler gemacht, der das Quartalsziel gefährdet. HR will eine Abmahnung, du brauchst die Person.",
      senior_manager: "Dein High Performer zeigt Burnout-Anzeichen, performt aber noch. Ein Ausfall würde das Projekt um 3 Monate verzögern.",
      high_potential: "Ein Kollege, auf dessen Arbeit du aufbaust, macht wiederholt Fehler, die auf dich zurückfallen. Morgen ist Deadline."
    },
    question: "Wie strukturierst du das Gespräch?",
    options: [
      { id: 'a', text: "Direkt mit Lösungsvorschlägen einsteigen – die Zeit drängt", score: 1 },
      { id: 'b', text: "Erst 10 Minuten aktiv zuhören, dann gemeinsam Ursachen identifizieren, zuletzt 3 konkrete nächste Schritte mit Deadlines vereinbaren", score: 4 },
      { id: 'c', text: "HR oder einen externen Coach hinzuziehen, bevor du handelst", score: 2 },
      { id: 'd', text: "Situation schriftlich dokumentieren und dann besprechen", score: 1 }
    ]
  },
  {
    id: 4, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du musst einem 8-Jahre-Kunden mitteilen, dass du die Preise um 60% erhöhst – oder die Zusammenarbeit beenden musst.",
      angestellte: "Du musst deinem 12-köpfigen Team mitteilen, dass Bonuszahlungen dieses Jahr komplett gestrichen werden. Einige haben ihre Finanzen darauf aufgebaut.",
      senior_manager: "Du musst 20% deiner Abteilung entlassen. Du kennst jeden einzelnen persönlich seit Jahren.",
      high_potential: "Du musst einem Teammitglied mitteilen, dass sein Herzensprojekt – an dem er 6 Monate gearbeitet hat – nicht weiterverfolgt wird."
    },
    question: "Wie kommunizierst du die schlechte Nachricht?",
    options: [
      { id: 'a', text: "Per E-Mail mit ausführlicher Begründung – das gibt allen Zeit, es zu verarbeiten", score: 1 },
      { id: 'b', text: "Persönlich, direkt, mit Empathie: Erst die Nachricht (10 Sek), dann der Kontext (1 Min), dann der Ausblick und konkrete nächste Schritte", score: 4 },
      { id: 'c', text: "Die Nachricht abschwächen und positiv verpacken, um die Beziehung zu schonen", score: 0 },
      { id: 'd', text: "Jemand anderen bitten, die Nachricht zu überbringen – du bist zu nah dran", score: 0 }
    ]
  },
  {
    id: 5, category: 'rhetorik', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein Journalist der Wirtschaftswoche fragt dich live auf einer Konferenz zu einem Datenschutz-Vorfall, von dem du erst seit 2 Stunden weißt.",
      angestellte: "In einem Town Hall fragt ein Mitarbeiter öffentlich nach den 'echten Gründen' für die Entlassungen letzte Woche. 500 Leute hören zu.",
      senior_manager: "Ein Vorstandsmitglied fragt in der Jahreskonferenz nach Details zu einem Projekt, das du erst seit 2 Wochen verantwortest.",
      high_potential: "In einem Strategy-Review wirst du nach deiner Meinung zu einer C-Level-Entscheidung gefragt, die intern hochpolitisch ist."
    },
    question: "Wie gehst du mit der unerwarteten Frage um?",
    options: [
      { id: 'a', text: "Ehrlich sagen: 'Ich habe noch nicht alle Details, aber ich komme bis morgen 18 Uhr auf Sie zurück'", score: 3 },
      { id: 'b', text: "Souverän mit dem antworten, was du weißt, Grenzen klar benennen: 'Was ich sagen kann..., was ich noch nicht sagen kann...'", score: 4 },
      { id: 'c', text: "Die Frage an jemanden weiterleiten, der mehr weiß", score: 2 },
      { id: 'd', text: "Eine Antwort improvisieren, die kompetent klingt", score: 0 }
    ]
  },

  // === KRITISCHES DENKEN (6–10) ===
  {
    id: 6, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein KI-Analytics-Tool empfiehlt, 3 deiner 5 profitabelsten Dienstleistungen einzustellen. Die Datenbasis: 6 Monate, 847 Datenpunkte.",
      angestellte: "Ein KI-Dashboard zeigt, dass dein Bereich 30% unter Budget performt. Das Management fordert in 48h einen Turnaround-Plan.",
      senior_manager: "Ein McKinsey-Team präsentiert eine KI-gestützte Restrukturierung, die deiner 20-Jahre-Erfahrung komplett widerspricht.",
      high_potential: "Dein Teamleiter präsentiert KI-generierte Daten, die deine Projektidee scheinbar widerlegen. Die Daten sehen solide aus."
    },
    question: "Wie bewertest du die KI-Empfehlung?",
    options: [
      { id: 'a', text: "Den Daten vertrauen – KI ist objektiver als menschliche Intuition", score: 0 },
      { id: 'b', text: "Datenqualität prüfen, Annahmen hinterfragen, Kontext einbeziehen, dann eigene fundierte Position formulieren", score: 4 },
      { id: 'c', text: "Zweite Meinung von einem externen Experten einholen", score: 2 },
      { id: 'd', text: "Der eigenen Erfahrung vertrauen und die KI-Empfehlung ignorieren", score: 1 }
    ]
  },
  {
    id: 7, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein wichtigster Investor und dein erfahrenster Berater geben dir komplett widersprüchliche Empfehlungen zur Wachstumsstrategie.",
      angestellte: "Dein direkter Vorgesetzter will Projekt A priorisieren, die Fachabteilung besteht auf Projekt B. Beide haben valide Argumente.",
      senior_manager: "Der CFO fordert 25% Kostensenkung, der CMO will 40% mehr Marketingbudget. Beide zeigen ROI-Berechnungen.",
      high_potential: "Zwei Senior Mentoren, die du beide respektierst, geben dir gegensätzliche Karriereratschläge."
    },
    question: "Wie triffst du eine Entscheidung?",
    options: [
      { id: 'a', text: "Die Meinung der Person mit mehr Einfluss oder Erfahrung wählen", score: 1 },
      { id: 'b', text: "Beiden teilweise recht geben und einen diplomatischen Kompromiss finden", score: 2 },
      { id: 'c', text: "Eigene Analyse durchführen, beide Perspektiven integrieren, begründete eigene Position entwickeln und klar kommunizieren", score: 4 },
      { id: 'd', text: "Die Entscheidung aufschieben, bis sich die Situation von selbst klärt", score: 0 }
    ]
  },
  {
    id: 8, category: 'kritisches_denken', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein Geschäftsmodell funktioniert seit 5 Jahren. Jetzt disruptiert ein Wettbewerber mit KI den Markt – seine Preise sind 70% niedriger.",
      angestellte: "Dein Unternehmen führt ein KI-System ein, das 60% deiner aktuellen Tätigkeiten automatisieren könnte.",
      senior_manager: "Eine neue KI-Technologie macht 40% der Prozesse in deinem Verantwortungsbereich potenziell obsolet. Die Konkurrenz testet bereits.",
      high_potential: "KI-Tools übernehmen zunehmend die analytischen Aufgaben, die bisher dein Alleinstellungsmerkmal waren."
    },
    question: "Wie reagierst du auf diese Disruption?",
    options: [
      { id: 'a', text: "Abwarten und beobachten – vielleicht ist es nur ein Hype", score: 0 },
      { id: 'b', text: "Sofort das Gleiche kopieren wie der Wettbewerber", score: 1 },
      { id: 'c', text: "Disruption analysieren, eigene einzigartige Stärken identifizieren, strategisch neu positionieren und investieren", score: 4 },
      { id: 'd', text: "Auf bewährte Stärken konzentrieren und die Nische verteidigen", score: 2 }
    ]
  },
  {
    id: 9, category: 'kritisches_denken', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein bekannter Branchenexperte bezeichnet dein Geschäftsmodell auf einer Konferenz öffentlich als 'veraltet und dem Untergang geweiht'.",
      angestellte: "Ein renommierter Analyst kritisiert die Strategie deines Unternehmens scharf – dein Name wird als Verantwortlicher genannt.",
      senior_manager: "Ein externes Audit identifiziert 'schwerwiegende Führungsmängel' in deinem Verantwortungsbereich. Der Bericht wird geleakt.",
      high_potential: "Dein 360-Grad-Feedback enthält überraschend kritische Kommentare von Kollegen, die du als Verbündete betrachtet hast."
    },
    question: "Wie gehst du mit dieser öffentlichen Kritik um?",
    options: [
      { id: 'a', text: "Kritik öffentlich widerlegen und mit Gegenargumenten kontern", score: 1 },
      { id: 'b', text: "Kritik ernst nehmen, valide Punkte identifizieren, selektiv integrieren, dann klar und souverän kommunizieren", score: 4 },
      { id: 'c', text: "Kritik ignorieren – die verstehen den Kontext nicht", score: 0 },
      { id: 'd', text: "PR-Agentur beauftragen und professionelles Krisenmanagement starten", score: 1 }
    ]
  },
  {
    id: 10, category: 'kritisches_denken', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Dein gesamtes Team (8 Personen) ist überzeugt von einer Expansionsstrategie, die du für zu riskant hältst.",
      angestellte: "90% deiner Abteilung unterstützt einen Ansatz, den du für strategisch falsch hältst. Du bist der einzige Skeptiker.",
      senior_manager: "Dein gesamtes Leadership-Team (12 Direktberichte) empfiehlt einstimmig eine Richtung, gegen die du fundamentale Bedenken hast.",
      high_potential: "Alle 6 Mitglieder deines Projektteams sind für Option A, du bist überzeugt, dass Option B langfristig besser ist."
    },
    question: "Wie gehst du vor?",
    options: [
      { id: 'a', text: "Der Mehrheit folgen – das Team muss geschlossen hinter der Entscheidung stehen", score: 2 },
      { id: 'b', text: "Deine Meinung durchsetzen – du trägst letztlich die Verantwortung", score: 1 },
      { id: 'c', text: "Bedenken klar und strukturiert artikulieren, echten Dialog führen, dann gemeinsam entscheiden und Entscheidung mittragen", score: 4 },
      { id: 'd', text: "Externe Meinung einholen, um die Pattsituation aufzulösen", score: 2 }
    ]
  },

  // === ENTSCHEIDUNGSFINDUNG (11–15) ===
  {
    id: 11, category: 'entscheidung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Dein KI-System empfiehlt eine 200.000€ Investition mit 73% Konfidenz. Du hast 24 Stunden für die Entscheidung.",
      angestellte: "Ein KI-Analytics-Dashboard zeigt einen Trend, der sofortige Budgetumverteilung von 500.000€ nahelegt. Dein Chef ist im Urlaub.",
      senior_manager: "KI-Prognosen empfehlen eine strategische Wette auf einen neuen Markt mit 65% Erfolgswahrscheinlichkeit. Einsatz: 5 Millionen.",
      high_potential: "Ein KI-Tool empfiehlt eine Herangehensweise, die 3 Wochen schneller wäre, aber ein 25% höheres Fehlerrisiko hat."
    },
    question: "Wie triffst du die Entscheidung?",
    options: [
      { id: 'a', text: "Der KI-Empfehlung folgen – die Daten sind objektiver als Bauchgefühl", score: 1 },
      { id: 'b', text: "KI-Output als einen Input nutzen, aber mit Marktkenntnis, Timing, Risikotoleranz und strategischem Kontext abgleichen", score: 4 },
      { id: 'c', text: "Mehr Daten anfordern, bis die Konfidenz bei mindestens 85% liegt", score: 2 },
      { id: 'd', text: "Entscheidung an jemanden mit mehr Erfahrung delegieren", score: 0 }
    ]
  },
  {
    id: 12, category: 'entscheidung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Zwei Großkunden wollen Exklusivverträge. Beide würden 40% deines Umsatzes ausmachen. Du kannst nur einen wählen.",
      angestellte: "Zwei interne Projekte konkurrieren um dich als Projektleiter. Eines ist sichtbarer, das andere strategisch wichtiger.",
      senior_manager: "Zwei Abteilungen fordern dieselben 3 Mitarbeiter. Beide Projekte sind für das Quartalsziel kritisch.",
      high_potential: "Zwei Karrierepfade: Spezialist mit Expertenstatus oder Generalist mit Führungsverantwortung. Beide haben starke Befürworter."
    },
    question: "Wie näherst du dich dieser Entscheidung?",
    options: [
      { id: 'a', text: "Pro-Contra-Listen erstellen und rational nach Punkten abwägen", score: 2 },
      { id: 'b', text: "Langfristige strategische Ziele als primären Filter nutzen, nicht kurzfristigen Gewinn", score: 4 },
      { id: 'c', text: "Mit mehreren Vertrauenspersonen besprechen und deren Meinung gewichten", score: 2 },
      { id: 'd', text: "Die Option wählen, die mehr Menschen zufriedenstellt", score: 1 }
    ]
  },
  {
    id: 13, category: 'entscheidung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du hast eine strategische Entscheidung getroffen, die 6 Monate später offensichtlich falsch war. Verlust: 150.000€.",
      angestellte: "Ein Projekt, für das du gekämpft hast, scheitert spektakulär. Alle wissen, dass es 'dein Baby' war.",
      senior_manager: "Eine Initiative unter deiner Verantwortung verfehlt alle KPIs. Der CEO fragt nach Erklärungen.",
      high_potential: "Dein erster eigenverantwortlicher Vorschlag wird nicht nur abgelehnt, sondern als 'strategisch naiv' bezeichnet."
    },
    question: "Wie kommunizierst du das Ergebnis?",
    options: [
      { id: 'a', text: "Externe Faktoren betonen, die zur Situation beigetragen haben – der Markt, das Timing, fehlende Ressourcen", score: 0 },
      { id: 'b', text: "Volle Verantwortung übernehmen, konkrete Learnings benennen, Korrekturmaßnahmen mit Timeline präsentieren", score: 4 },
      { id: 'c', text: "Situation erst intern analysieren, bevor du dich öffentlich äußerst", score: 2 },
      { id: 'd', text: "Team um Feedback bitten, was konkret schiefgelaufen ist", score: 2 }
    ]
  },
  {
    id: 14, category: 'entscheidung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein Konzern bietet dir eine Übernahme an: 8x Umsatz, aber du bleibst nur 2 Jahre an Bord. Du hast 7 Tage Bedenkzeit.",
      angestellte: "Dir wird eine Beförderung angeboten: 40% mehr Gehalt, aber in einem Bereich, den du nicht kennst und nicht magst.",
      senior_manager: "Ein Startup bietet dir die CEO-Position: Equity, Prestige, aber 50% weniger Gehalt und hohes Risiko.",
      high_potential: "Ein Fast-Track-Programm wird angeboten: Beförderung in 18 Monaten garantiert, aber Umzug in eine Stadt, die du nicht magst."
    },
    question: "Wie strukturierst du deine Entscheidungsfindung?",
    options: [
      { id: 'a', text: "Der Intuition vertrauen – große Entscheidungen trifft man aus dem Bauch heraus", score: 1 },
      { id: 'b', text: "Systematisches Framework: Werte, langfristige Ziele, Risiken, Stakeholder-Impact, dann Entscheidung mit klarem Commitment", score: 4 },
      { id: 'c', text: "Meinungen von möglichst vielen Menschen einholen und dann aggregieren", score: 2 },
      { id: 'd', text: "Finanzielle Analyse als Hauptkriterium – Zahlen lügen nicht", score: 2 }
    ]
  },
  {
    id: 15, category: 'entscheidung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Dein bester Freund ist auch dein Mitgründer. Nach 5 Jahren funktioniert die Partnerschaft nicht mehr. Er blockiert strategische Entscheidungen.",
      angestellte: "Dein Mentor und Freund im Unternehmen macht einen schweren ethischen Fehler. Du bist der Einzige, der davon weiß.",
      senior_manager: "Ein Teammitglied, das du vor 3 Jahren eingestellt und seitdem gefördert hast, performt dauerhaft unter Erwartung.",
      high_potential: "Dein engster Kollege und Freund bewirbt sich auf dieselbe Beförderung wie du. Ihr habt bisher immer zusammengearbeitet."
    },
    question: "Wie gehst du mit dem Konflikt zwischen Beziehung und Business um?",
    options: [
      { id: 'a', text: "Freundschaft hat Priorität – berufliche Dinge können warten oder anders gelöst werden", score: 0 },
      { id: 'b', text: "Beide Ebenen klar trennen, aber beide Aspekte offen und transparent ansprechen – in separaten Gesprächen", score: 4 },
      { id: 'c', text: "Business hat Priorität – persönliche Gefühle dürfen professionelle Entscheidungen nicht beeinflussen", score: 2 },
      { id: 'd', text: "Einen neutralen Vermittler einschalten, um den Konflikt objektiv zu lösen", score: 2 }
    ]
  },

  // === FÜHRUNGSKOMPETENZ (16–20) ===
  {
    id: 16, category: 'fuehrung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Dein Startup wächst von 5 auf 30 Mitarbeiter in 8 Monaten. Die ursprüngliche Kultur löst sich auf, Silos entstehen.",
      angestellte: "Durch eine Reorganisation verantwortest du plötzlich ein Team von 25 statt 8. Die Hälfte kennt dich nicht.",
      senior_manager: "Du übernimmst eine Abteilung mit 40% Fluktuation, toxischer Kultur und einem Team, das dem letzten Chef misstraut.",
      high_potential: "Du wirst zum ersten Mal Teamleiter – 6 deiner bisherigen Kollegen sind jetzt deine direkten Mitarbeiter."
    },
    question: "Wie etablierst du deine Führungsrolle in den ersten 90 Tagen?",
    options: [
      { id: 'a', text: "Schnell Autorität demonstrieren durch klare Ansagen und erste sichtbare Entscheidungen", score: 2 },
      { id: 'b', text: "Erst 30 Tage zuhören, dann Vision kommunizieren, dann gemeinsam neue Regeln etablieren und Quick Wins liefern", score: 4 },
      { id: 'c', text: "Bestehende Strukturen und Prozesse weitgehend beibehalten, um Stabilität zu signalisieren", score: 1 },
      { id: 'd', text: "Einen erfahrenen Executive Coach engagieren, der den Übergang begleitet", score: 2 }
    ]
  },
  {
    id: 17, category: 'fuehrung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Deine beiden wichtigsten Mitarbeiter – CTO und Head of Sales – haben einen offenen, eskalierten Konflikt. Das Team spaltet sich.",
      angestellte: "In deinem Team gibt es zwei Fraktionen, die nicht mehr miteinander reden. Die Produktivität ist um 40% eingebrochen.",
      senior_manager: "Zwei deiner Direktberichte konkurrieren aggressiv um die gleiche VP-Position. Der Konflikt wird öffentlich.",
      high_potential: "Du bist zwischen zwei Fraktionen in deinem Projektteam gefangen – beide wollen dich auf ihrer Seite."
    },
    question: "Wie löst du den Konflikt?",
    options: [
      { id: 'a', text: "Beide sofort zu einem klärenden Gespräch zusammenbringen und moderieren", score: 3 },
      { id: 'b', text: "Erst Einzelgespräche führen, Ursachen und Interessen verstehen, dann strukturiert moderieren mit klaren Vereinbarungen", score: 4 },
      { id: 'c', text: "HR oder externe Mediation einschalten – das ist zu komplex für interne Lösung", score: 2 },
      { id: 'd', text: "Klare Ansage machen: 'Persönliche Konflikte haben im Job nichts verloren. Löst das unter euch.'", score: 1 }
    ]
  },
  {
    id: 18, category: 'fuehrung', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein Schlüsselmitarbeiter kommt zu dir: 'KI macht meinen Job in 2 Jahren überflüssig. Ich habe Angst.'",
      angestellte: "Dein Team ist skeptisch bis ängstlich gegenüber den neuen KI-Tools. Die Adoption liegt bei 15%.",
      senior_manager: "Massiver Widerstand gegen KI-Transformation in deinem Bereich. Die Betriebsratsvorsitzende droht mit Eskalation.",
      high_potential: "Ältere Kollegen lehnen die technologischen Veränderungen ab, die du vorantreibst. Sie haben Einfluss auf deine Bewertung."
    },
    question: "Wie führst du durch diese Unsicherheit?",
    options: [
      { id: 'a', text: "KI-Vorteile rational erklären und auf Effizienzgewinne und Arbeitserleichterung verweisen", score: 2 },
      { id: 'b', text: "Ängste erst ernst nehmen und validieren, dann gemeinsam Zukunftsszenarien entwickeln, konkrete Weiterbildung anbieten", score: 4 },
      { id: 'c', text: "KI-Einführung verlangsamen, bis das Team emotional bereit ist", score: 1 },
      { id: 'd', text: "Entscheidung top-down durchsetzen – Veränderung ist unvermeidlich, Widerstand ist normal", score: 1 }
    ]
  },
  {
    id: 19, category: 'fuehrung', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du musst deinem Team eine Pivot-Entscheidung kommunizieren, die bedeutet: Das Produkt der letzten 18 Monate wird eingestellt.",
      angestellte: "Du sollst Restrukturierungsmaßnahmen kommunizieren, hinter denen du selbst nur zu 60% stehst.",
      senior_manager: "Dein Team muss eine Strategieänderung der Geschäftsführung mittragen, die du für taktisch falsch hältst.",
      high_potential: "Du sollst eine Entscheidung deines Chefs vor dem Team vertreten, die du persönlich für einen Fehler hältst."
    },
    question: "Wie kommunizierst du Veränderungen, die nicht von dir kommen?",
    options: [
      { id: 'a', text: "Distanzieren: 'Die Geschäftsführung hat entschieden, wir müssen das umsetzen...'", score: 0 },
      { id: 'b', text: "Ownership zeigen, Kontext erklären, eigene Rolle klar machen, Raum für Fragen und Emotionen geben, dann vorwärts führen", score: 4 },
      { id: 'c', text: "Fakten neutral präsentieren ohne eigene Bewertung – sollen sich selbst ein Bild machen", score: 2 },
      { id: 'd', text: "Positive Aspekte hervorheben, schwierige Teile minimieren", score: 1 }
    ]
  },
  {
    id: 20, category: 'fuehrung', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du arbeitest seit 3 Monaten 70+ Stunden pro Woche. Deine Partnerin droht mit Trennung, dein Arzt warnt vor Burnout.",
      angestellte: "Du merkst erste Burnout-Anzeichen – Schlafprobleme, Reizbarkeit, Konzentrationsschwäche. Das Projekt ist in der kritischsten Phase.",
      senior_manager: "Dein Kalender ist zu 160% gefüllt. Du verpasst wichtige Entscheidungen, weil du nicht mehr alles schaffst.",
      high_potential: "Du arbeitest mehr als alle anderen (65h/Woche), aber deine Performance-Reviews werden schlechter, nicht besser."
    },
    question: "Wie gehst du mit deinen eigenen Grenzen um?",
    options: [
      { id: 'a', text: "Durchhalten – die kritische Phase ist in 2-3 Monaten vorbei", score: 0 },
      { id: 'b', text: "Selbstreflexion, dann: klare Grenzen setzen, strategisch delegieren, transparent kommunizieren, Hilfe annehmen", score: 4 },
      { id: 'c', text: "2 Wochen Urlaub nehmen, sobald es möglich ist", score: 2 },
      { id: 'd', text: "Effizienter arbeiten – besseres Zeitmanagement, weniger Meetings", score: 2 }
    ]
  },

  // === EMOTIONALE INTELLIGENZ (21–25) ===
  {
    id: 21, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Ein Schlüsselmitarbeiter bittet um ein Gespräch. Er erzählt unter Tränen von seiner Scheidung und fragt nach 2 Monaten Auszeit.",
      angestellte: "Ein Teammitglied bricht in eurem 1:1 in Tränen aus und erzählt von schweren persönlichen Problemen.",
      senior_manager: "Ein Senior Leader in deinem Bereich zeigt Anzeichen einer persönlichen Krise – sein Vater ist gerade gestorben.",
      high_potential: "Ein Kollege vertraut dir an, dass er unter Depressionen leidet und sich Hilfe sucht."
    },
    question: "Wie reagierst du in diesem Moment?",
    options: [
      { id: 'a', text: "Empathisch zuhören, aber eine klare Grenze zwischen Arbeit und Privat ziehen", score: 2 },
      { id: 'b', text: "Voll präsent sein, aktiv zuhören ohne zu urteilen, emotionale Unterstützung anbieten, dann gemeinsam pragmatische Lösungen finden", score: 4 },
      { id: 'c', text: "An HR oder das Employee Assistance Program verweisen – das sind Profis dafür", score: 2 },
      { id: 'd', text: "Situation ernst nehmen, aber schnell zu konkreten Arbeitslösungen überleiten", score: 1 }
    ]
  },
  {
    id: 22, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Ein Investor, der dir die Finanzierung zugesagt hatte, zieht im letzten Moment zurück. Ohne Begründung. Per E-Mail.",
      angestellte: "Eine Beförderung, die dir zugesagt wurde, geht an jemanden mit weniger Erfahrung. Dein Chef erklärt: 'War eine politische Entscheidung.'",
      senior_manager: "Der Vorstand kippt eine Strategie, für die du 2 Jahre gekämpft hast. Kommentar: 'Wir gehen einen anderen Weg.'",
      high_potential: "Du wirst bei einer Beförderung übergangen – jemand, den du eingearbeitet hast, bekommt die Position."
    },
    question: "Wie gehst du mit deiner Wut und Enttäuschung um?",
    options: [
      { id: 'a', text: "Emotion runterschlucken und professionell weitermachen – Gefühle zeigen ist unprofessionell", score: 1 },
      { id: 'b', text: "Erst durchatmen und verarbeiten, dann sachlich ansprechen und dabei eigene Emotionen benennen, ohne zu beschuldigen", score: 4 },
      { id: 'c', text: "Mit einer Vertrauensperson darüber sprechen, bevor du irgendwie handelst", score: 3 },
      { id: 'd', text: "Situation akzeptieren – dagegen anzukämpfen bringt nichts und schadet nur", score: 1 }
    ]
  },
  {
    id: 23, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Dein Startup hat gerade eine Series A abgeschlossen. Presse, Applaus, Gratulationen. Dein Team hat 18 Monate dafür gearbeitet.",
      angestellte: "Dein Projekt ist ein voller Erfolg – 200% des Ziels erreicht. Der CEO lobt dich öffentlich vor 500 Mitarbeitern.",
      senior_manager: "Deine Abteilung gewinnt den internen Innovationspreis. Du stehst auf der Bühne, das Team applaudiert.",
      high_potential: "Du bekommst öffentliches Lob und einen Bonus für ein Projekt, an dem viele mitgearbeitet haben."
    },
    question: "Wie gehst du mit diesem Erfolg um?",
    options: [
      { id: 'a', text: "Bescheiden bleiben und den Erfolg hauptsächlich dem Team zuschreiben", score: 3 },
      { id: 'b', text: "Erfolg feiern, Team sichtbar würdigen, eigene Rolle authentisch einordnen, dann: Was kommt als Nächstes?", score: 4 },
      { id: 'c', text: "Auf die nächste Herausforderung fokussieren – Erfolg ist vergänglich", score: 1 },
      { id: 'd', text: "Den Moment nutzen, um für mehr Ressourcen oder die nächste Beförderung zu verhandeln", score: 2 }
    ]
  },
  {
    id: 24, category: 'eq', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein schwieriger Kunde wird am Telefon laut, beschimpft dich persönlich und droht mit Anwalt.",
      angestellte: "Ein Kollege greift dich in einem Meeting vor 15 Personen persönlich an: 'Du hast keine Ahnung, wovon du redest.'",
      senior_manager: "Ein Vorstandsmitglied kritisiert dich in einer öffentlichen Runde scharf und unfair.",
      high_potential: "Ein Senior-Kollege macht eine abwertende Bemerkung über dich vor dem gesamten Projektteam."
    },
    question: "Wie reagierst du im Moment des Angriffs?",
    options: [
      { id: 'a', text: "Ruhig bleiben und nicht reagieren – den Angriff ins Leere laufen lassen", score: 2 },
      { id: 'b', text: "Sachlich, aber bestimmt eine Grenze setzen: 'Ich verstehe die Frustration, aber so sprechen wir nicht miteinander. Lass uns das konstruktiv klären.'", score: 4 },
      { id: 'c', text: "Situation deeskalieren und später unter vier Augen klären", score: 3 },
      { id: 'd', text: "Mit gleicher Energie zurückgeben – sonst wirst du nicht ernst genommen", score: 0 }
    ]
  },
  {
    id: 25, category: 'eq', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Du erfährst, dass ein Mitbewerber Kunden mit falschen Versprechungen abwirbt. Es funktioniert – er wächst schneller als du.",
      angestellte: "Du beobachtest, wie ein Kollege Erfolge anderer als seine eigenen verkauft. Er wird dafür befördert.",
      senior_manager: "Dir wird nahegelegt, Quartalszahlen 'kreativer' darzustellen, um ein wichtiges Investoren-Meeting zu sichern.",
      high_potential: "Du siehst, wie dein Chef in einem wichtigen Meeting wissentlich falsche Zahlen präsentiert."
    },
    question: "Wie gehst du mit diesem ethischen Dilemma um?",
    options: [
      { id: 'a', text: "Nicht mein Problem – fokussiere dich auf deine eigene Arbeit", score: 0 },
      { id: 'b', text: "Eigene Werte als Kompass nutzen, Konsequenzen aller Optionen durchdenken, dann klar und mutig handeln", score: 4 },
      { id: 'c', text: "Anonym melden oder den Whistleblower-Kanal nutzen", score: 3 },
      { id: 'd', text: "Mit einer Vertrauensperson besprechen, bevor du irgendetwas unternimmst", score: 2 }
    ]
  },

  // === KI-STRATEGIE (26–30) ===
  {
    id: 26, category: 'strategie', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Ein neues KI-Tool verspricht, 80% deiner Kundenkommunikation zu automatisieren. Kosten: 500€/Monat. Ersparnis: 20h/Woche.",
      angestellte: "Dein Unternehmen bietet ein internes KI-Upskilling-Programm an (40h). Dein Chef sagt: 'Optional, aber empfohlen.'",
      senior_manager: "Ein Berater empfiehlt massive KI-Investitionen (2 Mio €). ROI-Versprechen: 5x in 3 Jahren. Risiko: Unklar.",
      high_potential: "Du könntest ein neues KI-Tool lernen (30h Investment) oder dich auf deine Kernkompetenzen konzentrieren."
    },
    question: "Wie entscheidest du über KI-Investitionen (Zeit oder Geld)?",
    options: [
      { id: 'a', text: "Abwarten und schauen, was sich als Standard durchsetzt", score: 1 },
      { id: 'b', text: "Strategisch evaluieren: Use Case definieren, Pilot starten, messen, dann skalieren oder stoppen", score: 4 },
      { id: 'c', text: "Früh adoptieren – wer zu spät kommt, verliert den Anschluss", score: 2 },
      { id: 'd', text: "Auf bewährte Tools setzen – neue Technologie hat immer Kinderkrankheiten", score: 1 }
    ]
  },
  {
    id: 27, category: 'strategie', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Du wirst gebeten, auf einer Konferenz über 'KI in deiner Branche' zu sprechen. 500 Zuhörer, 15 Minuten.",
      angestellte: "Dein Chef bittet dich, dem Vorstand zu erklären, wie KI eure Abteilung transformieren könnte. 20 Minuten.",
      senior_manager: "Du sollst die KI-Strategie für die nächsten 3 Jahre präsentieren. Publikum: Aufsichtsrat. Stakes: Hoch.",
      high_potential: "Du wirst gebeten, ein internes KI-Training für 30 Kollegen zu halten. Thema: 'KI produktiv nutzen'."
    },
    question: "Wie positionierst du dich als KI-Thought-Leader?",
    options: [
      { id: 'a', text: "Technische Details und Möglichkeiten in den Vordergrund stellen", score: 1 },
      { id: 'b', text: "KI als Werkzeug für menschliche Ziele framen, konkrete Use Cases zeigen, Grenzen ehrlich benennen, zur Aktion aufrufen", score: 4 },
      { id: 'c', text: "Vorsichtig und ausgewogen präsentieren – KI hat auch Risiken", score: 2 },
      { id: 'd', text: "Die Einladung ablehnen – du bist kein KI-Experte", score: 0 }
    ]
  },
  {
    id: 28, category: 'strategie', layer: 'strategic_eq',
    scenarios: {
      selbststaendige: "Deine Branche wird durch KI umgekrempelt. Einige Wettbewerber schließen, andere wachsen explosiv. Du stehst am Scheideweg.",
      angestellte: "Dein Unternehmen erwartet, dass du 'KI-ready' bist. Aber niemand erklärt, was das konkret bedeutet.",
      senior_manager: "Du sollst dein Team 'fit für die KI-Ära' machen. Budget: vorhanden. Klare Anleitung: nicht vorhanden.",
      high_potential: "Die Frage 'Was macht dich unersetzbar in einer Welt mit KI?' hält dich nachts wach."
    },
    question: "Was ist deine Strategie, um langfristig relevant zu bleiben?",
    options: [
      { id: 'a', text: "Technische KI-Skills aufbauen – Programmieren, Prompting, Tools beherrschen", score: 2 },
      { id: 'b', text: "Auf einzigartig menschliche Stärken setzen: Urteilsvermögen, Beziehungen, Kreativität, und KI als Verstärker nutzen", score: 4 },
      { id: 'c', text: "Abwarten und beobachten – in 2 Jahren ist klarer, was wirklich gebraucht wird", score: 0 },
      { id: 'd', text: "In eine Branche wechseln, die weniger von KI betroffen ist", score: 1 }
    ]
  },
  {
    id: 29, category: 'strategie', layer: 'ai_literacy',
    scenarios: {
      selbststaendige: "Du nutzt KI für wichtige Entscheidungen: Preisgestaltung, Kundensegmentierung, Personalentscheidungen.",
      angestellte: "Dein Team setzt KI für Analysen und Berichte ein. Manchmal widersprechen die KI-Outputs deinem Bauchgefühl.",
      senior_manager: "KI-gestützte Dashboards liefern dir täglich Empfehlungen. Wie viel Autonomie gibst du der KI?",
      high_potential: "Du sollst entscheiden, wie viel KI-Input in deine Arbeit einfließen soll. Von 0% bis 100% ist alles möglich."
    },
    question: "Wie balancierst du menschliches Urteil und KI-Empfehlungen?",
    options: [
      { id: 'a', text: "KI für Daten und Analyse, Mensch für finale Entscheidung – immer", score: 3 },
      { id: 'b', text: "Kontext-abhängig: Bei reversiblen Entscheidungen mehr KI-Autonomie, bei kritischen Entscheidungen mehr menschliche Prüfung", score: 4 },
      { id: 'c', text: "KI primär nutzen und nur bei Zweifeln hinterfragen", score: 1 },
      { id: 'd', text: "KI als interessanten Input sehen, aber hauptsächlich der eigenen Erfahrung vertrauen", score: 2 }
    ]
  },
  {
    id: 30, category: 'strategie', layer: 'rhetoric',
    scenarios: {
      selbststaendige: "Ein Journalist fragt: 'Ersetzt KI bald Unternehmer wie Sie?' Die Kamera läuft.",
      angestellte: "Dein CEO fragt in einem Town Hall: 'Wie siehst du die Zukunft der Arbeit mit KI?' 1.000 Leute hören zu.",
      senior_manager: "Auf einer Podiumsdiskussion sollst du die Frage beantworten: 'Werden Führungskräfte durch KI ersetzt?'",
      high_potential: "Ein Mentor fragt dich: 'Was macht dich als Leader wertvoll, das KI nicht kann?'"
    },
    question: "Was ist deine Antwort auf die Frage 'Mensch vs. KI'?",
    options: [
      { id: 'a', text: "'KI kann vieles, aber nicht alles. Manche Dinge werden immer menschlich bleiben.'", score: 2 },
      { id: 'b', text: "'Die Frage ist falsch gestellt. Die besten Leader nutzen KI als Verstärker ihrer menschlichen Stärken – Urteil, Empathie, Vision.'", score: 4 },
      { id: 'c', text: "'KI wird viele Jobs ersetzen, aber auch neue schaffen. Anpassung ist der Schlüssel.'", score: 2 },
      { id: 'd', text: "'Ehrlich? Ich weiß es nicht. Niemand kann die Zukunft vorhersagen.'", score: 1 }
    ]
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

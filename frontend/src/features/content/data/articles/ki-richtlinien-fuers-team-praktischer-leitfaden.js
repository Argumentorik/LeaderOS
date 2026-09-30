export default {
  slug: 'ki-richtlinien-fuers-team-praktischer-leitfaden',
  type: 'guide',
  status: 'published',
  title: 'KI-Richtlinien fürs Team: ein praktischer Leitfaden.',
  description:
    'Welche Regeln ein Team für den KI-Einsatz braucht: erlaubte Tools, geschützte Daten, Kennzeichnung, Prüfpflicht und ' +
    'Verantwortung. Ein Leitfaden in sechs Regeln, kurz genug, dass ihn jemand liest.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-09-30',
  cover: null,
  tags: ['KI', 'Führung', 'Team', 'Methodik'],
  body: [
    {
      type: 'paragraph',
      text:
        'Ein Team braucht für den KI-Einsatz sechs kurze Regeln: welche Tools erlaubt sind, welche Daten nie hineindürfen, wann du KI-Einsatz kennzeichnest, wie Ergebnisse geprüft werden, ' +
        'wer die Verantwortung trägt und wann die Regeln überprüft werden. Sie passen auf eine Seite. Wichtiger als die Vollständigkeit ist, dass jede Person im Team sie kennt und sich traut, bei Zweifel nachzufragen.',
    },
    {
      type: 'callout',
      tone: 'neutral',
      text:
        'Hinweis: Dieser Leitfaden ist eine Orientierung für Führungskräfte, keine Rechts- oder Datenschutzberatung. ' +
        'Stimme konkrete Regeln mit Datenschutz, IT-Sicherheit und Recht ab, und beziehe bei Bedarf den Betriebsrat ein.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 1: Welche Tools sind erlaubt?',
    },
    {
      type: 'paragraph',
      text:
        'Nenne eine kurze Liste freigegebener Tools und wofür sie gedacht sind. Nicht „alle“ und nicht „keine“, sondern konkret: „Für Textentwürfe und Zusammenfassungen nutzen wir diese zwei Tools, ' +
        'für alles andere fragst du vorher.“ Lege einen einfachen Weg fest, wie neue Tools geprüft werden, und benenne eine Ansprechperson. ' +
        'Ein Ranking, welches Tool das beste ist, gehört nicht in die Richtlinie. Die Frage ist, welche ihr freigegeben habt und warum. ' +
        'Die Freigabe selbst klärst du mit IT und Datenschutz.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 2: Welche Daten dürfen nie hinein?',
    },
    {
      type: 'paragraph',
      text:
        'Hier braucht dein Team die klarste Formulierung. Beispielhafte Kategorien, die du mit Datenschutz und Recht festlegst:',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Personenbezogene Daten von Mitarbeitenden, Kundinnen und Kunden, zum Beispiel Namen mit Leistungsbeurteilungen oder Gesundheitsangaben.',
        'Zugangsdaten, Schlüssel und Passwörter.',
        'Vertrauliche Verträge, Preise und unveröffentlichte Zahlen.',
        'Geschäftsgeheimnisse wie Quellcode oder Strategiepapiere, sofern nicht ausdrücklich freigegeben.',
      ],
    },
    {
      type: 'paragraph',
      text:
        'Eine Faustregel, die im Alltag hilft: „Was ich nicht in eine Mail an eine externe Person schreiben würde, gebe ich auch nicht in ein KI-Tool ein, ' +
        'solange es dafür keine ausdrückliche Freigabe gibt.“ Die Faustregel ersetzt die Liste nicht, sie macht sie merkbar.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 3: Wann kennzeichnen wir KI-Einsatz?',
    },
    {
      type: 'paragraph',
      text:
        'Lege fest, wo eine Kennzeichnung sinnvoll ist, zum Beispiel bei externen Texten, Entscheidungsvorlagen und Berichten. Bei persönlichen Notizen und ersten Gedankenentwürfen nicht. ' +
        'Ein Satz genügt: „Erster Entwurf mit KI erstellt, inhaltlich geprüft von Anna.“ Die Kennzeichnung ist kein Stigma, sondern eine Gesprächsgrundlage: ' +
        'Wer liest, weiß, wo er genauer hinschauen sollte. Wenn im Team die Sorge besteht, KI-Nutzung werde negativ bewertet, klärst du das offen, ' +
        'sonst bleibt Nutzung im Verborgenen, wie im Artikel über Schatten-KI beschrieben.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 4: Prüfpflicht für jedes Ergebnis.',
    },
    {
      type: 'paragraph',
      text:
        'KI-Ergebnisse klingen oft sicher, auch wenn sie falsch sind. Deshalb gilt: Je größer die Wirkung, desto gründlicher die Prüfung. ' +
        'Zahlen, Namen, Zitate, Quellen und rechtliche Aussagen werden immer gegengeprüft, bevor sie das Team verlassen. ' +
        'Wie du erfundene Inhalte erkennst, steht im Artikel zu KI-Halluzinationen. Die Regel für dein Team: Nichts geht raus, was niemand verstanden und geprüft hat.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 5: Die Verantwortung bleibt beim Menschen.',
    },
    {
      type: 'paragraph',
      text:
        'Wer ein Ergebnis weitergibt, verantwortet es, egal, woher der Entwurf kam. „Die KI hat das geschrieben“ ist keine Begründung, sondern ein Hinweis auf eine fehlende Prüfung. ' +
        'Besonders vorsichtig bist du bei Entscheidungen über Menschen, etwa Beurteilungen, Bewerbungen oder Beförderungen. Dort ersetzt KI nie die eigene Bewertung, ' +
        'und wie sie eingesetzt werden darf, klärst du mit HR, Recht und gegebenenfalls dem Betriebsrat.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Regel 6: Ein fester Review-Rhythmus.',
    },
    {
      type: 'paragraph',
      text:
        'Tools, Möglichkeiten und Risiken ändern sich schneller als jede Richtlinie. Plane deshalb einen festen Termin ein, zum Beispiel vierteljährlich 30 Minuten im Teammeeting. ' +
        'Drei Fragen genügen: Was hat gut funktioniert? Wo gab es Unsicherheit oder Fehler? Was muss in den Regeln angepasst werden? ' +
        'Berichte über Fehler dürfen keine Schuldzuweisung auslösen, sonst erfährst du nichts davon.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'So könnte die Seite aussehen (Beispiel).',
    },
    {
      type: 'paragraph',
      text:
        'Ein Beispiel, das du anpassen kannst: „Wir nutzen KI für Entwürfe, Zusammenfassungen und Ideensuche, mit den freigegebenen Tools aus der Liste. ' +
        'Personenbezogene Daten, Zugangsdaten und vertrauliche Unterlagen geben wir nicht ein. Externe Texte und Entscheidungsvorlagen kennzeichnen wir als KI-unterstützt. ' +
        'Zahlen, Quellen und Zitate prüfen wir vor dem Versand. Wer etwas weitergibt, verantwortet es. Bei Zweifel fragt ihr Thomas, ohne dass jemand sich rechtfertigen muss. ' +
        'Wir schauen alle drei Monate gemeinsam, was wir ändern.“ Die Namen und Fristen sind Platzhalter. Die Substanz hängt an den Freigaben, die du mit Datenschutz, IT und Recht klärst.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Wenn jemand gegen die Regeln verstößt.',
    },
    {
      type: 'paragraph',
      text:
        'Früher oder später passiert es: Jemand kopiert etwas in ein Tool, das nicht freigegeben ist. Die erste Reaktion prägt, ob dir künftig solche Fälle gemeldet werden. ' +
        'Kläre zuerst, was passiert ist, und informiere bei Bedarf Datenschutz oder IT, weil dort über weitere Schritte entschieden wird. ' +
        'Im Gespräch nutzt du die Feedbackformel: Beobachtung („Du hast das Protokoll in ein nicht freigegebenes Tool kopiert“), Wirkung („Damit liegen Kundendaten außerhalb unserer Kontrolle“), ' +
        'Wunsch („Künftig fragst du vorher, und wenn etwas schiefgeht, meldest du es sofort“). Welche Konsequenzen arbeitsrechtlich möglich sind, klärst du mit HR und Recht.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Typische Fehler bei KI-Richtlinien.',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Das 20-Seiten-Dokument, das niemand liest. Kurz und konkret schlägt vollständig und ungelesen.',
        'Das pauschale Verbot. Es verhindert keine Nutzung, es verschiebt sie in den Schatten.',
        'Nur Verbote, kein Erlaubnisraum. Sag auch, was ausdrücklich gewünscht ist.',
        'Keine Ansprechperson. Wenn niemand auf Fragen antwortet, entscheiden alle allein.',
        'Einmal geschrieben, nie überprüft.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Schritt für Schritt: so führst du die Regeln ein.',
    },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Frage im Team offen nach: Wer nutzt schon KI, wofür, und wo gibt es Unsicherheit? Ohne Schuldvorwurf.',
        'Schreibe einen Entwurf auf einer Seite mit den sechs Regeln.',
        'Stimme ihn mit Datenschutz, IT und Recht ab, und beziehe bei Bedarf den Betriebsrat ein.',
        'Bespreche ihn im Team mit zwei bis drei echten Beispielfällen, etwa: „Darf ich dieses Kundenprotokoll zusammenfassen lassen?“',
        'Benenne eine Ansprechperson und wo Fragen gestellt werden dürfen.',
        'Setze den ersten Review-Termin in den Kalender, bevor die Regeln in Kraft treten.',
      ],
    },
    {
      type: 'paragraph',
      text:
        'Regeln sind nur die eine Hälfte, die andere ist das Gespräch. Im LeaderOS kannst du es üben: WladBot spielt die Mitarbeiterin, die zugibt, Kundendaten in ein Tool kopiert zu haben, ' +
        'und du trainierst, ruhig, klar und ohne Vorwurf zu reagieren. In täglichen 15-Minuten-Drills wiederholst du solche Gespräche, bis sie dir leichter fallen. ' +
        'Du kannst LeaderOS 14 Tage kostenlos testen.',
    },
  ],
  seo: {
    title: 'KI-Richtlinien fürs Team: praktischer Leitfaden',
    description:
      'KI-Richtlinien fürs Team: sechs Regeln zu Tools, Daten, Kennzeichnung, Prüfpflicht, Verantwortung und Review. Kurz, konkret und mit Beispielformulierungen.',
    keywords: [
      'ki richtlinien unternehmen',
      'ki richtlinie team',
      'ki regeln mitarbeiter',
      'ki nutzung im unternehmen regeln',
      'chatgpt richtlinie unternehmen',
    ],
  },
  related: [
    'shadow-ki-warum-dein-team-heimlich-chatgpt-nutzt',
    'ki-halluzinationen-erkennen-als-manager',
    'ki-strategie-fuer-mittelstand',
  ],
};

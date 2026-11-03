/**
 * Article: ROI von Führungskräftetraining messen.
 *
 * Honest treatment of a hard measurement problem. Uses the Kirkpatrick
 * model as the real framework, proposes concrete proxies, and refuses
 * to oversell attribution — soft-skill ROI is directionally useful,
 * not scientifically clean.
 */
export default {
  slug: 'roi-von-fuehrungskraeftetraining-messen',
  type: 'guide',
  status: 'published',
  title: 'ROI von Führungskräftetraining messen: Warum die Zufriedenheits-Umfrage nicht reicht.',
  description:
    'Ein Score von 4,6 von 5 direkt nach dem Seminar sagt nichts über die Wirkung sechs Monate später. Konkrete ' +
    'Messgrößen für den ROI von Führungskräftetraining, und eine ehrliche Einordnung, warum diese Messung ' +
    'grundsätzlich schwer bleibt.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-13',
  cover: null,
  tags: ['Strategie', 'Training', 'Frameworks'],
  body: [
    {
      type: 'paragraph',
      text:
        'Das "Happy Sheet" ist der am meisten überschätzte Datenpunkt in der Weiterbildung: ein Fragebogen, den ' +
        'Teilnehmer fünf Minuten nach dem letzten Slide ausfüllen. Er misst Stimmung, nicht Wirkung. Ein Trainer ' +
        'kann brillant unterhalten und trotzdem null Verhaltensänderung im Team hinterlassen, und der Bogen zeigt ' +
        'trotzdem 4,6 von 5.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Das Kirkpatrick-Modell: vier Ebenen, die fast niemand komplett misst.',
    },
    {
      type: 'framework',
      code: 'R-L-V-E',
      title: 'Kirkpatrick-Modell: die vier Evaluationsebenen',
      explanation:
        'Reaktion (hat es gefallen?), Lernen (wurde der Inhalt verstanden?), Verhalten (wird es im Arbeitsalltag ' +
        'tatsächlich angewendet?), Ergebnis (hat sich eine Geschäftskennzahl dadurch verändert?). Die meisten ' +
        'Trainingsprogramme messen nur Ebene eins.',
    },
    {
      type: 'paragraph',
      text:
        'Der Grund ist ökonomisch, nicht böswillig: Ebene eins ist billig und in fünf Minuten erhoben. Ebene drei ' +
        'und vier verlangen Follow-up-Erhebungen Wochen oder Monate später, an Personen die dann im Alltagsgeschäft ' +
        'stecken und keine Lust auf einen weiteren Fragebogen haben. Also bleibt es meistens bei Ebene eins, und ' +
        'die wird dann fälschlich als "ROI" verkauft.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Was du stattdessen messen kannst.',
    },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Mitarbeiterfluktuation im geführten Team, gemessen sechs und zwölf Monate nach dem Training, im Vergleich ' +
          'zum Team-Durchschnitt davor.',
        'eNPS im Team (Wahrscheinlichkeit, den eigenen Arbeitsplatz weiterzuempfehlen), als kurzer Pulscheck vor ' +
          'dem Training und danach in festen Abständen wiederholt.',
        '360-Grad-Feedback-Delta: dieselben Kompetenzen, dieselben Bewerter, sechs Monate später erneut erhoben. ' +
          'Die Differenz ist aussagekräftiger als jede Einzelmessung.',
        'Time-to-next-promotion beziehungsweise interne Mobilität: bewegt sich die Führungskraft oder Mitarbeiter ' +
          'aus ihrem Team schneller in neue Verantwortung als vorher üblich?',
        'Anzahl eskalierter Konflikte, die die HR-Abteilung erreichen, statt im Team selbst gelöst zu werden.',
      ],
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Jede dieser Kennzahlen ist eine Korrelation, keine Kausalität. Sie zu erheben ist trotzdem besser als sie ' +
        'zu ignorieren, weil eine Korrelation über zwölf Monate immer noch mehr Signal liefert als ein Applaus am ' +
        'Ende des Seminartags.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Die ehrliche Grenze: Attribution ist fast unmöglich.',
    },
    {
      type: 'paragraph',
      text:
        'Sei hier ehrlich mit dir selbst und mit dem Vorstand: Wenn sich die Fluktuation in einem Team verbessert, ' +
        'nachdem die Führungskraft ein Training absolviert hat, weißt du nicht sicher, ob das Training ursächlich ' +
        'war. Vielleicht ist gleichzeitig ein toxisches Teammitglied gegangen. Vielleicht hat sich der Arbeitsmarkt ' +
        'verändert. Vielleicht wäre die Führungskraft ohnehin gereift.',
    },
    {
      type: 'paragraph',
      text:
        'Die meisten öffentlich zitierten ROI-Zahlen für Soft-Skill-Trainings basieren auf Selbstauskunft der ' +
        'Teilnehmer ("Ich schätze, ich bin jetzt X Prozent produktiver") und sind mit Vorsicht zu genießen. Das ist ' +
        'kein Grund, die Messung aufzugeben. Es ist ein Grund, sie als Richtungsanzeiger zu behandeln statt als ' +
        'Beweis.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Der pragmatische Weg.',
    },
    {
      type: 'paragraph',
      text:
        'Wähle vor Trainingsbeginn zwei bis drei der oben genannten Proxys. Erhebe eine Baseline. Wiederhole die ' +
        'Messung zu festen Zeitpunkten, nicht ad hoc. Und kommuniziere gegenüber der Geschäftsführung von Anfang ' +
        'an, dass es sich um Richtungssignale handelt, nicht um einen belastbaren Kausalitätsnachweis. Das ist ' +
        'ehrlicher als jede Studie, die einen exakten ROI-Prozentsatz verspricht.',
    },
    {
      type: 'quote',
      text:
        'Wer dir einen exakten ROI-Prozentsatz für ein Kommunikationstraining verspricht, hat entweder die Daten ' +
        'erfunden oder die Fragestellung nicht verstanden.',
      attribution: 'Wlad, Argumentorik-Akademie 2024',
    },
    {
      type: 'paragraph',
      text:
        'LeaderOS löst das Attributionsproblem nicht, das kann kein Tool. Aber es liefert wenigstens einen ' +
        'lückenlosen Datentrail: Drill-Completion, Challenge-Fortschritt und Kompetenz-Scores über 30 Tage, die sich ' +
        'sauber neben eNPS- oder 360-Grad-Daten legen lassen, statt eines einzigen Zufriedenheits-Werts direkt nach ' +
        'einem Seminartag.',
    },
  ],
  seo: {
    title: 'ROI von Führungskräftetraining messen: Kennzahlen · LeaderOS',
    description:
      'ROI von Führungskräftetraining messen: Kirkpatrick-Modell, konkrete Kennzahlen wie Fluktuation, eNPS und ' +
      '360-Grad-Delta, plus ehrliche Grenzen der Attribution. Von Wlad Jachtchenko.',
    keywords: [
      'ROI Führungskräftetraining',
      'ROI von Training messen',
      'Kirkpatrick Modell',
      'Trainingserfolg messen',
      'Soft Skill Training ROI',
      'Weiterbildung Erfolg messen',
      'HR Kennzahlen Führungskräfteentwicklung',
    ],
  },
  related: [
    'fuehrungskraeftetraining-formate-im-vergleich',
    'fuehrungskraefteentwicklung-leadership-development',
    'mikro-drills-fuenfzehn-minuten-pro-tag',
  ],
};

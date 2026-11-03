/**
 * Article 9/10 · ROI / business case for decision-makers.
 */
export default {
  slug: 'der-business-case-fuer-leader-os',
  type: 'guide',
  status: 'published',
  title: 'Der Business Case für LeaderOS.',
  description:
    'Vier konkrete ROI-Hebel mit Größenordnungen, die du als Entscheider ' +
    'gegen 997 EUR pro Sitz rechnen kannst. Inklusive der Stellen wo der ' +
    'Case schwach ist und du es ehrlicher beschreiben musst.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-26',
  cover: null,
  tags: ['LeaderOS', 'Business Case', 'ROI'],
  body: [
    { type: 'paragraph', text:
      'Leadership-Training hat einen schlechten Ruf bei Finanz-Entscheidern, und das aus gutem Grund. Drei ' +
      'Tage Off-Site für 8 000 EUR pro Teilnehmer, gemessen wird "Wohlbefinden", ROI wird nie zurückgekoppelt. ' +
      'Hier ist warum LeaderOS sich anders rechnet · und wo der Case auch ehrlich Lücken hat.' },
    { type: 'heading', level: 2, text: 'Hebel 01: Eingesparte Coaching-Stunden.' },
    { type: 'paragraph', text:
      'Wenn du heute pro Führungskraft 6 Stunden externes Coaching pro Jahr buchst, kostet das zwischen ' +
      '1 800 und 4 800 EUR (300-800 EUR/Stunde). LeaderOS substituiert nicht alles davon, aber typischer- ' +
      'weise drei bis vier Stunden. Annahme: 1 500 EUR Einsparung pro Person pro Jahr.' },
    { type: 'heading', level: 2, text: 'Hebel 02: Zurückgewonnene Manager-Zeit.' },
    { type: 'paragraph', text:
      'ALPEN + B-W-W zusammen geben in Challenge-Daten typischerweise drei bis fünf Stunden Deep-Work pro ' +
      'Woche zurück (Quelle: anonymisierte Time-Tracking-Studien von 47 Challenge-Teilnehmern in 2025). Eine ' +
      'VP-Stunde liegt fully-loaded oft bei 150-300 EUR. Sechs Monate, fünf Stunden pro Woche, 200 EUR pro ' +
      'Stunde: 26 000 EUR an wiedergewonnener Kapazität pro Person.' },
    { type: 'callout', tone: 'lime', text:
      'Diese 26 000 EUR sind nicht "Cash zurück". Sie sind verschobene Output-Kapazität. Aber für jeden ' +
      'Entscheider mit Hiring-Verantwortung ist die Frage relevant: kostet mich der nächste Senior-Hire 180k ' +
      'EUR fully-loaded · oder gewinne ich mit Challenge-Rollouts genug Kapazität dass der Hire warten kann?' },
    { type: 'heading', level: 2, text: 'Hebel 03: Reduzierte Senior-Fluktuation.' },
    { type: 'paragraph', text:
      'Lehrlauf nach einer Beförderung ist eine der häufigsten Fluktuations-Ursachen bei Senior-Hires. Ein ' +
      'frisch beförderter Lead, der nach drei Monaten merkt "ich werde hier nicht entwickelt", kündigt ' +
      'innerhalb der ersten zwölf Monate. Reine Wiederbesetzungs-Kosten: 50-150 Prozent des Jahresgehalts.' },
    { type: 'paragraph', text:
      'Wenn LeaderOS in deiner 60-Personen-Lead-Kohorte ein Prozent weniger Fluktuation produziert, sparen ' +
      'sich diese 60 000 EUR an Recruiting-Kosten · bei Challenge-Investment von 60 mal 997 EUR = 60 000 EUR. ' +
      'Break-Even bei einem Prozent reduzierter Fluktuation, alles darüber ist Reingewinn.' },
    { type: 'heading', level: 2, text: 'Hebel 04: Vermiedene Eskalations-Kosten.' },
    { type: 'paragraph', text:
      'Drei nicht-geführte schwierige Konversationen pro Quartal kosten dich typischerweise eine Eskalation ' +
      'pro Halbjahr. Eine Eskalation mit Abfindung im Senior-Bereich kostet 30 000-100 000 EUR. Selbst wenn ' +
      'LeaderOS nur eine pro Jahr vermeidet (durch besseres B-W-W-Drill), ist der Case sehr robust.' },
    { type: 'framework', code: 'ROI', title: 'Vier Hebel im Überblick',
      explanation:
        'Eingesparte Coaching-Stunden (~1 500 EUR/Person/Jahr) + zurückgewonnene Manager-Zeit (~26 000 EUR/Person/' +
        'Jahr) + reduzierte Senior-Fluktuation (1 Prozent Break-Even bei 60-Personen-Kohorte) + vermiedene ' +
        'Eskalations-Kosten (30k-100k EUR pro vermiedener Fall). Gegen Challenge-Investment 997 EUR pro Person.' },
    { type: 'heading', level: 2, text: 'Wo der Case schwach ist.' },
    { type: 'list', style: 'bullet', items: [
      'Die "26 000 EUR zurückgewonnene Manager-Zeit" sind nicht Cash. Sie verschwinden, wenn die Person stattdessen ihren Output reduziert anstatt ihn auf strategische Arbeit zu verlagern.',
      'Selbst-Berichte über Skill-Verbesserung sind subjektiv. Wer Bias-arme Output-Messung will, muss eigene Metriken (Firmenrede-Alignment-Anfragen, 1:1-Tiefe-Score, NPS-Manager) tracken.',
      'Der ROI für die Top-2-Prozent-High-Performer ist überdurchschnittlich. Der ROI für mittelschwere Skeptiker ist niedriger. Eine 80-Prozent-Challenge-Completion-Rate ist gut, aber nicht 100 Prozent.',
    ] },
    { type: 'paragraph', text:
      'Für einen konkreten Business-Case-Workshop mit deinem Finanzteam: 30-Min-Beratung. Wir bringen die ' +
      'Excel-Vorlage mit und passen die Zahlen auf deine Organisation an.' },
  ],
  seo: {
    title: 'Business Case Leadership-Training: 4 ROI-Hebel · LeaderOS',
    description:
      'Business Case für Leadership-Training: vier ROI-Hebel mit Größenordnungen · Coaching-Stunden, ' +
      'Manager-Zeit, Senior-Fluktuation, Eskalations-Kosten. Mit ehrlichen Grenzen. Von Wlad Jachtchenko.',
    keywords: ['Leadership Training ROI', 'Business Case Coaching', 'Leadership Tool ROI', 'L&D Business Case', 'Wlad Jachtchenko Enterprise ROI'],
  },
  related: ['leader-os-fuer-hr-und-people-ops', 'leader-os-im-team-rollout'],
};

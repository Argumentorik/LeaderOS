/**
 * Article: Warum Frameworks nicht im Kopf bleiben.
 *
 * Starter article to prove the content-block schema. Wlad-voice
 * field note about why coaches read 30 books and still can't recall
 * one model under pressure. Lands the "Drill > Theorie" thesis that
 * routes back to the Sprint product.
 *
 * The shape of this object IS the schema. Future articles match it
 * field-for-field so a CMS migration later is a 1:1 mapping job.
 */
export default {
  slug: 'warum-frameworks-nicht-im-kopf-bleiben',
  type: 'field-note',
  status: 'published',
  title: 'Warum Frameworks nicht im Kopf bleiben.',
  description:
    'Eine Field Note aus 400 000 Coachings. Drei Gründe warum 80 Prozent ' +
    'aller Führungs-Modelle nach zwei Wochen wieder verschwinden, und was ' +
    'stattdessen funktioniert.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-20',
  cover: null,
  tags: ['Frameworks', 'Mindset', 'Drill'],
  body: [
    {
      type: 'paragraph',
      text:
        'Letzte Woche habe ich mit einer Vorständin gesprochen. Sie hatte in den letzten zwei Jahren ' +
        'sechzehn Leadership-Bücher gelesen. Sie konnte mir den Titel jedes Buches nennen. Sie konnte mir ' +
        'kein einziges Framework aus diesen Büchern unter Druck anwenden.',
    },
    {
      type: 'paragraph',
      text:
        'Das ist kein Einzelfall. Es ist das Muster. Und es hat drei Gründe.',
    },
    {
      type: 'heading',
      level: 2,
      text: '01. Lesen ist nicht lernen.',
    },
    {
      type: 'paragraph',
      text:
        'Das Gehirn unterscheidet Wiedererkennen von Abrufen. Wenn du ein Framework liest, fühlt sich ' +
        'das an wie verstehen. Tatsächlich hast du es nur wiedererkannt. Abrufen ist der Akt, das ' +
        'Modell ohne Buch in der Hand auf eine reale Situation zu projizieren. Ohne Abruf-Übung verblasst ' +
        'die neue Information innerhalb von 72 Stunden auf das vorherige Wissensniveau.',
    },
    {
      type: 'quote',
      text:
        'Du brauchst kein neues Buch. Du brauchst dreißig Drill-Wiederholungen am echten Fall.',
      attribution: 'Wlad, in jedem zweiten Coaching',
    },
    {
      type: 'heading',
      level: 2,
      text: '02. Generische Frameworks treffen keinen echten Fall.',
    },
    {
      type: 'paragraph',
      text:
        'Die meisten Frameworks sind in einem Lehrbuch-Beispiel hängengeblieben. SEXIER, das Argumentations-' +
        'Modell von Wlad, klingt auf der Folie wie ein Akronym. Im echten Verhandlungs-Setting mit einem ' +
        'Senior-Stakeholder klingt es plötzlich nach etwas anderem: nach dem konkreten Satz, den du um ' +
        '14:32 Uhr in der Firmenrede liefern musst.',
    },
    {
      type: 'framework',
      code: 'SEXIER',
      title: 'Das Argumentations-Modell',
      explanation:
        'Ein Sechs-Schritte-Pfad durch jede Verhandlung: Statement, Explanation, eXample, Impact, ' +
        'Explanation of Impact, Rebuttal. Auf der Folie sieht es nach Theorie aus. Beim dritten Drill am ' +
        'eigenen Fall wird es zu deinem Default-Reflex.',
    },
    {
      type: 'paragraph',
      text:
        'Der Unterschied zwischen Theorie und Skript ist drei Wochen geübte Anwendung. Nicht drei Wochen ' +
        'gelesen.',
    },
    {
      type: 'heading',
      level: 2,
      text: '03. Kein Coach um 22:47 Uhr.',
    },
    {
      type: 'paragraph',
      text:
        'Die dritte Wand ist Verfügbarkeit. Ein 1-zu-1 Coach kostet zwischen 300 und 800 Euro pro Stunde ' +
        'und ist am Dienstagabend nicht erreichbar. Genau dann brauchst du ihn aber: wenn du morgen früh ' +
        'jemandem das gleiche Feedback zum dritten Mal geben musst und keinen Satz im Kopf hast.',
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Drei Wochen Challenge, dreißig Drills am echten Fall, ein KI-Coach der deine Stilhistorie kennt. ' +
        'Das ist der Trade, den die Methodik vorschlägt.',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Lesen fühlt sich an wie verstehen · es ist Wiedererkennen.',
        'Abrufen entsteht durch dreißig wiederholte Anwendungen, nicht durch ein neues Buch.',
        'Generische Modelle treffen keine Firmenrede · geübte Skripte schon.',
        'Verfügbarkeit ist die unterschätzte Dimension. Coach um 22:47 Uhr oder nichts.',
      ],
    },
    {
      type: 'paragraph',
      text:
        'Wenn dich das überzeugt, beginne mit der kostenlosen Diagnose auf leadercheck.de. Sie zeigt dir ' +
        'in fünf Minuten, an welchem der elf Frameworks dein größter Hebel liegt. Danach entscheidest du ' +
        'ob eine Challenge sinnvoll ist.',
    },
  ],
  seo: {
    title: 'Warum Frameworks nicht im Kopf bleiben · LeaderOS',
    description:
      'Warum 80 Prozent aller Leadership-Frameworks nach zwei Wochen verschwinden · Field Note aus ' +
      '400.000 Coachings, drei Mechanismen und ein konkreter Trade. Von Wlad Jachtchenko.',
    keywords: [
      'Leadership Frameworks',
      'Wlad Jachtchenko',
      'Leadership Drill',
      'Argumentations-Training',
      'Führungskräfte Coaching',
      'Feedback-Modell',
    ],
  },
  related: ['sprint-oder-marathon'],
};

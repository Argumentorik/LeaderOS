// Content-Specimens · Instagram (1080×1080) + LinkedIn (1080×1350)
// Posts im selben Athletic-Editorial-Specimen-Stil wie die Landing-
// Page-Mockups (hf-01..hf-07): Outfit-Black-Italic-Headline mit Lime-
// Punkt, BIB-Code-Header, Mono-Metadata-Footer.
//
// Jede Post-Definition rendert sich via PostSpecimen.js zu einer
// screenshotbaren Kachel. Die `format`-Felder steuern das Seiten-
// verhältnis:
//   'square'   → 1080×1080  (Instagram-Feed)
//   'vertical' → 1080×1350  (LinkedIn / Instagram-Story-Light)
//
// Variants:
//   'headline'  · XXL Outfit-Italic-Headline, dichotomie-Subline
//   'numbers'   · Big-Numbers (à la 400 TAUSEND / 14 MILLIONEN)
//   'framework' · Specimen-Tabelle mit nummerierter Liste
//   'quote'     · Manifesto-Zeile mit BIB-Hairline
//   'bib'       · Marathon-Startnummer-Plate

export const POST_SERIES = [
  // ─────────────────────────────────────────────────────────────────
  // SERIE A · KI-NATIVE MANIFESTO  (5 Posts · LinkedIn + Instagram)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'A-01',
    slug: 'manifest-tempo-kurs',
    format: 'square',
    platform: 'instagram',
    variant: 'headline',
    bib: 'MANIFEST · 0001',
    eyebrow: 'MANIFEST · §01',
    headline: 'KI bestimmt das Tempo.',
    accent: 'Du bestimmst den Kurs.',
    body: 'Werkzeuge entscheiden nicht. Menschen entscheiden.',
    foot: 'leader-os.de',
    caption:
      'KI bestimmt das Tempo. Du bestimmst den Kurs.\n\n' +
      'Werkzeuge werden schneller. Modelle werden klüger. Pipelines ' +
      'werden günstiger. Die Geschwindigkeit gehört der Maschine.\n\n' +
      'Die Richtung gehört dir. Und nur dir.\n\n' +
      'Werde KI-nativ · leader-os.de\n\n' +
      '#leadership #kinativ #wladmethodik',
  },
  {
    id: 'A-02',
    slug: 'manifest-algorithmen-menschen',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'quote',
    bib: 'MANIFEST · 0002',
    eyebrow: 'MANIFEST · §02',
    headline: 'Algorithmen führen Prozesse.',
    accent: 'Menschen führen Menschen.',
    body:
      'Du brauchst keine bessere Software. Du brauchst keine teurere ' +
      'Schulung. Du brauchst die Klarheit, die kein Modell ersetzt.',
    foot: 'BIB · 0001 · leader-os.de',
    caption:
      'Algorithmen führen Prozesse. Menschen führen Menschen.\n\n' +
      'Ein Modell kann eine Pipeline orchestrieren. Es kann nie für ' +
      'dich entscheiden, wem du in einer schwierigen Stunde wirklich ' +
      'zuhörst.\n\n' +
      'Das ist Leadership. Und das wird teurer, nicht billiger.\n\n' +
      '→ leader-os.de',
  },
  {
    id: 'A-03',
    slug: 'manifest-zoegern',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'headline',
    bib: 'MANIFEST · 0003',
    eyebrow: 'MANIFEST · §03',
    headline: 'Wer heute zögert,',
    accent: 'führt morgen unter jemandem, der nicht gezögert hat.',
    body: 'Es gibt 2026 keine neutrale Position mehr.',
    foot: 'leader-os.de · diagnose kostenlos',
    caption:
      'Wer heute zögert, führt morgen unter jemandem, der nicht ' +
      'gezögert hat.\n\n' +
      '2026 ist keine neutrale Position mehr verfügbar. KI ist nicht ' +
      'ein weiteres Tool. Sie ist das neue Betriebssystem deiner ' +
      'Branche. Wer das versteht, wird gebraucht. Wer nicht, wird ' +
      'verwaltet.\n\n' +
      'Diagnose kostenlos auf leader-check.de.\n\n' +
      '#leadership #ki #karriere',
  },

  // ─────────────────────────────────────────────────────────────────
  // SERIE B · FRAMEWORK-DRILLS  (5 Posts · Instagram-Carousel-fähig)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'B-01',
    slug: 'framework-sexier',
    format: 'square',
    platform: 'instagram',
    variant: 'framework',
    bib: 'FRAMEWORK · 01/11',
    eyebrow: 'DRILL · SEXIER',
    headline: 'Argumentieren in 6 Schritten.',
    accent: 'SEXIER.',
    body: 'Das Argumentations-Modell, das in jeder Verhandlung trägt.',
    rows: [
      ['S', 'STATEMENT',     'Klare These zuerst'],
      ['E', 'EXPLANATION',   'Warum dieser Satz'],
      ['X', 'EXAMPLE',       'Ein konkretes Beispiel'],
      ['I', 'IMPACT',        'Was es für uns bedeutet'],
      ['E', 'EXCEPTION',     'Wo es nicht gilt'],
      ['R', 'RESOLUTION',    'Was wir jetzt tun'],
    ],
    foot: 'leader-os.de · 11 Frameworks',
    caption:
      'SEXIER · argumentieren in sechs Schritten.\n\n' +
      'Statement → Explanation → Example → Impact → Exception → ' +
      'Resolution. Das Modell, mit dem Wlad seit Jahren Menschen ' +
      'in Verhandlungen wieder klar bringt.\n\n' +
      'Eines von elf Frameworks im LeaderOS. → leader-os.de',
  },
  {
    id: 'B-02',
    slug: 'framework-3-saeulen',
    format: 'square',
    platform: 'instagram',
    variant: 'framework',
    bib: 'FRAMEWORK · 04/11',
    eyebrow: 'DRILL · 3 SÄULEN',
    headline: 'Logos. Ethos. Pathos.',
    accent: 'Aristoteles funktioniert noch.',
    body: 'Drei Säulen · jede Überzeugungsrede steht auf diesen drei.',
    rows: [
      ['L', 'LOGOS',  'Das Argument · die Logik · die Zahl'],
      ['E', 'ETHOS',  'Wer du bist · warum du sprichst'],
      ['P', 'PATHOS', 'Was es für die Menschen bedeutet'],
    ],
    foot: 'leader-os.de · 11 Frameworks',
    caption:
      'Logos. Ethos. Pathos. · Aristoteles funktioniert noch.\n\n' +
      'Drei Säulen, auf denen jede Überzeugungs-Situation steht: ' +
      'die Logik (Logos), die Person (Ethos), die Emotion (Pathos). ' +
      'Wer eine vergisst, verliert die Hälfte des Raums.\n\n' +
      'Eines von elf Frameworks im LeaderOS.',
  },
  {
    id: 'B-03',
    slug: 'framework-feedback-formel',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'framework',
    bib: 'FRAMEWORK · 03/11',
    eyebrow: 'DRILL · FEEDBACK',
    headline: 'Feedback ohne',
    accent: 'Drama.',
    body: 'Drei Sätze. Beobachtung. Wirkung. Wunsch.',
    rows: [
      ['B', 'BEOBACHTUNG', '„Ich habe gesehen, dass …"'],
      ['W', 'WIRKUNG',     '„Das wirkt auf mich wie …"'],
      ['W', 'WUNSCH',      '„Ich wünsche mir, dass …"'],
    ],
    foot: 'leader-os.de · 11 Frameworks',
    caption:
      'Feedback ohne Drama · in drei Sätzen.\n\n' +
      'Beobachtung. Wirkung. Wunsch. Mehr braucht keine schwierige ' +
      'Konversation. Mehr macht jede schwierige Konversation kaputt.\n\n' +
      'Probier es im nächsten 1:1 aus. Berichte mir, wie es war.\n\n' +
      '→ leader-os.de',
  },
  {
    id: 'B-04',
    slug: 'framework-dunkle-rhetorik',
    format: 'square',
    platform: 'instagram',
    variant: 'framework',
    bib: 'FRAMEWORK · 07/11',
    eyebrow: 'DRILL · DUNKLE RHETORIK',
    headline: 'Erkenne sie.',
    accent: 'Nutze sie nie.',
    body: 'Drei der häufigsten Manipulationen · und ihr Konter.',
    rows: [
      ['1', 'STRAW MAN',      'Konter: „Das habe ich nicht gesagt."'],
      ['2', 'AD HOMINEM',     'Konter: „Zurück zum Thema, bitte."'],
      ['3', 'FALSCHES UNS',   'Konter: „Wer ist mit ›wir‹ gemeint?"'],
    ],
    foot: 'leader-os.de · 11 Frameworks',
    caption:
      'Dunkle Rhetorik · erkenne sie. Nutze sie nie.\n\n' +
      'Drei der häufigsten Tricks in Diskussionen · und der einfache ' +
      'Konter dazu. Du musst nicht aggressiver werden. Du musst nur ' +
      'sehen, was gespielt wird.\n\n' +
      'Eines von elf Frameworks im LeaderOS.',
  },
  {
    id: 'B-05',
    slug: 'framework-5-rollen',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'framework',
    bib: 'FRAMEWORK · 02/11',
    eyebrow: 'DRILL · 5 ROLLEN',
    headline: 'Du bist nicht eine',
    accent: 'Führungskraft.',
    body: 'Du wechselst zwischen fünf Rollen · pro Tag. Bewusst oder nicht.',
    rows: [
      ['1', 'VISIONÄR',     'Wohin gehen wir?'],
      ['2', 'STRATEGE',     'Wie kommen wir hin?'],
      ['3', 'COACH',        'Wer wird hier wachsen?'],
      ['4', 'OPERATOR',     'Was passiert heute?'],
      ['5', 'BOTSCHAFTER',  'Wer muss das hören?'],
    ],
    foot: 'leader-os.de · 11 Frameworks',
    caption:
      'Du bist nicht eine Führungskraft. Du bist fünf · pro Tag.\n\n' +
      'Visionär. Stratege. Coach. Operator. Botschafter. Die Frage ' +
      'ist nicht, welche du bist. Die Frage ist, ob du bewusst ' +
      'zwischen ihnen wechselst · oder ob die Situation für dich ' +
      'entscheidet.\n\n' +
      '→ leader-os.de',
  },

  // ─────────────────────────────────────────────────────────────────
  // SERIE C · TRUST + PRODUKT  (4 Posts)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'C-01',
    slug: 'trust-400-14',
    format: 'square',
    platform: 'instagram',
    variant: 'numbers',
    bib: 'TRUST · 0001',
    eyebrow: 'BENEFIT 05 · TRUST',
    headline: '400 Tausend.',
    accent: '14 Millionen.',
    body: 'Kunden, die seine Methode gelernt haben. Views auf seinem Material.',
    numbers: [
      { big: '400', suffix: 'TAUSEND',  caption: 'Kunden weltweit' },
      { big: '14',  suffix: 'MILLIONEN', caption: 'Views Podcast + YouTube' },
    ],
    foot: 'Wlad Jachtchenko · 3× SPIEGEL-Bestseller',
    caption:
      '400 Tausend Kunden. 14 Millionen Views. 3 SPIEGEL-Bestseller.\n\n' +
      'Wlad Jachtchenkos Methodik ist nicht neu. Sie ist seit Jahren ' +
      'in der Praxis erprobt · in Konzernen, im Mittelstand, in ' +
      'Verhandlungen, die niemand mitbekommt. Jetzt im LeaderOS.\n\n' +
      '→ leader-os.de',
  },
  {
    id: 'C-02',
    slug: 'produkt-24-7',
    format: 'square',
    platform: 'instagram',
    variant: 'headline',
    bib: 'WLADBOT · 0001',
    eyebrow: 'BENEFIT 02 · IMMER WACH',
    headline: '24 Stunden.',
    accent: '7 Tage.',
    body: 'Dein KI-Coach wartet nicht bis Montag.',
    foot: 'WladBot · leader-check.de',
    caption:
      '24 Stunden. 7 Tage. Dein KI-Coach wartet nicht bis Montag.\n\n' +
      'WladBot kennt Wlads Methodik in- und auswendig. Antwortet in ' +
      'Wlads Stimme, mit Wlads Frameworks, auf deine konkrete ' +
      'Leadership-Situation · in unter 3 Sekunden.\n\n' +
      'Kostenlose Probe auf leader-check.de.',
  },
  {
    id: 'C-03',
    slug: 'produkt-30-tage',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'bib',
    bib: 'SPRINT · 0001',
    eyebrow: 'BENEFIT 03 · SPRINT',
    headline: '30 Tage.',
    accent: 'Ein neues Du.',
    body: 'Jeden Tag eine Frage. Jeden Tag ein Drill. Am Ende: Zertifikat 0001.',
    foot: 'BIB · 0001 · leader-os.de',
    caption:
      '30 Tage. Ein neues Du.\n\n' +
      'Die LeaderOS-Challenge ist kein Kurs. Sie ist ein Training · ' +
      'jeden Tag eine Frage, jeden Tag ein Drill, jeden Tag etwas ' +
      'näher an der Führungskraft, die du werden willst.\n\n' +
      'BIB 0001 jetzt starten. → leader-os.de',
  },
  {
    id: 'C-04',
    slug: 'produkt-komplettbegleitung',
    format: 'vertical',
    platform: 'linkedin',
    variant: 'framework',
    bib: 'OS · 0001',
    eyebrow: 'BENEFIT 07 · KOMPLETT',
    headline: 'Du lernst nicht allein.',
    accent: 'Du wirst Teil von etwas.',
    body: 'Sechs Bausteine. Eine Begleitung.',
    rows: [
      ['BOT', 'WLADBOT',        '24/7 Coach in Wlads Stimme'],
      ['VID', 'LERNVIDEOS',     'Jeden Tag eine neue Lektion'],
      ['LIV', 'LIVE-SESSIONS',  'Monatlich · live · ungeschnitten'],
      ['CLS', 'COMMUNITY',       'Privater Channel · für alle Mitglieder'],
      ['CAL', 'STRATEGIE-CALL', 'Monatlich · klein · persönlich'],
      ['ZRT', 'ZERTIFIKAT',     'Mit deiner Startnummer 0001'],
    ],
    foot: 'leader-os.de',
    caption:
      'Du lernst nicht allein. Du wirst Teil von etwas.\n\n' +
      'WladBot ist der Anfang. Dahinter: tägliche Lernvideos, Live-' +
      'Sessions mit Wlad, die Community im privaten Channel, ' +
      'monatliche Strategie-Calls · und ein Zertifikat, das zeigt, ' +
      'wer du geworden bist.\n\n' +
      '→ leader-os.de',
  },
];

// Quick-Index nach Slug.
export const POST_BY_SLUG = Object.fromEntries(
  POST_SERIES.map((p) => [p.slug, p])
);

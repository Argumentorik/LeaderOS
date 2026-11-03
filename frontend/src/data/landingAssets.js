// LeaderOS Landing-Page content · Mockup-aligned (Direction A v3).
// Athletic Editorial × Heron-Preston specimen-sheet aesthetic.
//
// SPECIMEN-MAP (7 Mockup-Sheets in /public/landing/):
//   hf-01  §01 INHALT          Elf Frameworks. Ein OS.
//   hf-02  §02 IMMER WACH      24 Stunden. 7 Tage.
//   hf-03  §03 SPRINT          30 Tage. Ein neues Du.        (BIB-Plate)
//   hf-04  §04 AUTHENTIZITÄT   Wlads Methodik. Live.          (Wlad-Portrait)
//   hf-05  §05 TRUST           400 Tausend. 14 Millionen.    (Big numbers)
//   hf-06  §06 ZERTIFIKAT      Zertifikat 0001.              (Urkunde)
//   hf-07  §07 TECH-STACK      Powered by WladBot.           (3D-Voxel-Kopf)
//
// VISUAL VARIANTS (siehe BenefitVisual.js):
//   'photo' · Editorial-Foto im Specimen-Frame
//   'bib'   · Marathon-Startnummer 0001 (typografisch, kein Foto)
//   'trust' · Riesen 400 · 14 mit TAUSEND / MILLIONEN-Caption
//   'cert'  · Zertifikat-Plate mit Goldsiegel-Hint
//   'voxel' · WladBot-Voxel-Kopf-Hint (typografisch, lime auf schwarz)
//
// WLAD-FOTOS:
//   /wlad/wlad-portrait.jpg + /wlad/wlad-stage.jpg sollen vom Studio
//   geliefert werden. Solange sie fehlen, fällt der Code auf die
//   hf-04-Mockup-Version zurück (siehe BenefitVisual).

const photo = (seed, w = 1200, h = 1500) =>
  `https://picsum.photos/seed/${encodeURIComponent('leader-os-' + seed)}/${w}/${h}?grayscale`;

const local = (file) => `/landing/${file}`;
const wlad = (file) => `/wlad/${file}`;

export const LANDING_META = {
  title: 'LeaderOS · Das Leadership Operating System. Kostenlos testen.',
  description:
    'LeaderOS ist dein persönliches Leadership Operating System — mit ' +
    'KI-Coach, täglichen Übungen und den Methoden von Wlad Jachtchenko, ' +
    'damit du jeden Tag besser führst. 14 Tage kostenlos, ohne Karte.',
  url: 'https://leader-os.de',
  slogan: '14 Tage kostenlos.',
  // Kicker, gehört unter den ATF-Headline-Block.
  kicker: 'Elf Frameworks. Ein KI-Coach. Vierzehn Tage, ohne Karte.',
  cohort: '0001',
  bib: 'BIB · 0001',
  cta: {
    // Funnel (preferred order): (1) Beratungsgespräch · the consultative
    // conversion we lead with · scrolls to the cal.com booking section.
    // (2) Leader-Check · the free 10-min diagnose on leadercheck.de, the
    // low-friction lead-magnet at the top of the funnel. (3) leaderos.de ·
    // the app itself · 14 Tage kostenlos for visitors who want to start
    // self-serve right now. All three converge on the same email_lower id.
    beratung:  { label: 'Beratungsgespräch buchen', href: '/#beratung' },
    diagnose:  { label: 'Kostenloser Leader-Check · 10 Min', href: 'https://leadercheck.de' },
    primary:   { label: 'Jetzt 14 Tage kostenlos testen', href: 'https://leaderos.de/signup?trial=14' },
    secondary: { label: 'Login', href: 'https://leaderos.de/login' },
  },
  // Pricing kept in the data for the one section that explicitly sells
  // tiers (PricingLadder · further down the page) · the marketing
  // landing itself never leads with a Euro figure anymore.
  pricing: {
    trial:  { amount: '0', currency: '€', label: '14 TAGE KOSTENLOS' },
    sprint: { amount: '997', currency: '€', label: '30-TAGE-CHALLENGE' },
    os:     { amount: '4 797', currency: '€', label: 'OS · JAHR' },
    note:   'Erst testen. Dann entscheiden.',
  },
};

// MANIFESTO · Dichotomie-Slogans im "X. Y."-Pattern. Wandert in einen
// eigenen Block zwischen How-It-Works und Benefits.
export const LANDING_MANIFESTO = {
  eyebrow: 'MANIFEST · 2026',
  headline: 'KI bestimmt das Tempo.',
  headlineAccent: 'Du bestimmst den Kurs.',
  lines: [
    ['01', 'Algorithmen führen Prozesse.',  'Menschen führen Menschen.'],
    ['02', 'Tools werden schneller.',       'Führung muss klarer werden.'],
    ['03', 'Code skaliert.',                'Leadership entscheidet.'],
    ['04', 'Die KI wird klüger.',           'Werde du es auch.'],
    ['05', 'Wer heute zögert,',             'führt morgen unter jemandem, der nicht zögert.'],
  ],
  cta: 'Challenge sichern',
  href: 'https://leadercheck.de',
};

// 3-step path · Diagnose → Sprint → OS.
export const HOW_IT_WORKS = [
  {
    nr: '01',
    code: 'DIAGNOSE',
    duration: '10 MIN · KOSTENLOS',
    title: 'Wo stehst du?',
    body:
      'Starte auf leadercheck.de mit der kostenlosen KI-Diagnose. ' +
      'Drei Dimensionen: KI-Readiness, Rhetorik, Emotionale Intelligenz. ' +
      'Du bekommst sofort deinen Score plus konkrete Empfehlung.',
    cta: 'Jetzt diagnostizieren',
    href: 'https://leadercheck.de',
    external: true,
  },
  {
    nr: '02',
    code: 'SPRINT',
    duration: '30 TAGE · BEGLEITET',
    title: 'Dein personalisierter Plan.',
    body:
      'Basierend auf deiner Diagnose: jeden Tag eine Aufgabe, ' +
      'ein Framework, ein Drill. WladBot begleitet dich mit Wlads ' +
      'Methodik. Am Ende: dein Zertifikat.',
    cta: 'Challenge kennenlernen',
    href: 'https://leadercheck.de',
    external: true,
  },
  {
    nr: '03',
    code: 'OS',
    duration: 'LEBENSLANG · OFFEN',
    title: 'Dein Operating System.',
    body:
      'Nach der Challenge: voller Zugriff auf alle elf Frameworks, ' +
      'WladBot 24/7, monatliche Live-Sessions und das ' +
      'LeaderOS-Netzwerk.',
    cta: 'OS erkunden',
    href: 'https://leaderos.de/login',
    external: true,
  },
];

// 7 Benefits, exakt aus den Mockup-Specimens hf-01 bis hf-07.
// Jede Section bekommt einen Dichotomie-Subline-Slogan ("X. Y.").
export const LANDING_BENEFITS = [
  {
    nr: '01',
    code: 'INHALT',
    eyebrow: 'BENEFIT 01 · INHALT',
    headline: 'Elf Frameworks.',
    headlineAccent: 'Ein OS.',
    subline: 'Theorie-Bücher altern. Frameworks bleiben.',
    body:
      'Elf bewährte Wlad-Frameworks für jede Führungs-Situation, '+
      'in einem System. Vom Argumentations-Modell SEXIER über die ' +
      'Fünf Rollen der Führung, die Feedback-Formel, Drei Säulen ' +
      'der Überzeugung, Zehn Stufen des Zuhörens, den ' +
      'Kommunikationsquadrant nach Schulz von Thun, Dunkle Rhetorik ' +
      '(damit du Manipulation erkennst), das Vier-Farben-Modell für ' +
      'Persönlichkeits-Typen, Schlagfertigkeit, die ALPEN-Methode für ' +
      'Zeitmanagement bis zur Harvard-Verhandlungsmethode. Du lernst ' +
      'nicht 11 Bücher, du lernst ein System das du täglich anwendest.',
    detail: [
      ['01', 'SEXIER',           'Argumentations-Modell'],
      ['02', '5 ROLLEN',         'Identität'],
      ['03', 'FEEDBACK',         'Beobachtung · Wirkung · Wunsch'],
      ['04', '3 SÄULEN',         'Logos · Ethos · Pathos'],
      ['05', '10 STUFEN',        'Zuhör-Hierarchie'],
      ['06', 'KOMM-QUAD',        'Schulz von Thun'],
      ['07', 'DUNKLE RHETORIK',  'Manipulation erkennen'],
      ['08', '4-FARBEN',         'Persönlichkeits-Typen'],
      ['09', 'SCHLAGFERTIG',     'Verbale Reflexe'],
      ['10', 'ALPEN',            'Zeit-Methodik'],
      ['11', 'VERHANDLUNG',      'Harvard-Methode'],
    ],
    cta: 'Alle Frameworks ansehen',
    href: 'https://leadercheck.de',
    variant: 'photo',
    photo: local('p-01-wer-nicht-fuehrt.webp'),
    posterDesign: true,
    photoFallback: local('hf-01.webp'),
    photoFit: 'cover',
  },
  {
    nr: '02',
    code: 'COACH',
    eyebrow: 'BENEFIT 02 · IMMER WACH',
    headline: '24 Stunden.',
    headlineAccent: '7 Tage.',
    subline: 'Andere Coaches schlafen. Deiner nicht.',
    body:
      'WladBot ist dein persönlicher KI-Coach, trainiert auf 15 ' +
      'Jahren Wlad-Methodik, 600+ Lektionen, drei SPIEGEL-Bestseller. ' +
      'Du fragst ihn was du sonst Wlad selbst fragen würdest: ' +
      '"Wie eröffne ich diese schwierige Konversation?", "Wie ' +
      'argumentiere ich gegen meinen CFO?", "Wie führe ich dieses ' +
      'Feedback-Gespräch?". Antwort in unter 3 Sekunden. In Wlads Ton.',
    detail: [
      ['HRS', 'VERFÜGBARKEIT',  '24 / 7 / 365'],
      ['LNG', 'SPRACHE',        'Deutsch · English'],
      ['LAG', 'ANTWORTZEIT',    '< 3 Sekunden'],
      ['VOI', 'VOICE-CHAT',     'Live-Telefonat mit WladBot'],
    ],
    cta: 'WladBot starten',
    href: 'https://leadercheck.de',
    variant: 'photo',
    photo: local('p-02-zeit-zu-fuehren.webp'),
    posterDesign: true,
    photoFallback: local('hf-02.webp'),
    photoFit: 'cover',
  },
  {
    nr: '03',
    code: 'SPRINT',
    eyebrow: 'BENEFIT 03 · SPRINT',
    headline: '30 Tage.',
    headlineAccent: 'Ein neues Du.',
    subline: 'Andere Challenges enden mit einem Zertifikat. Deine mit einem System.',
    body:
      'Jeden Tag eine Frage. Jeden Tag ein Drill. Jeden Tag etwas ' +
      'näher an der Führungskraft, die du werden willst. ' +
      'Am Ende: dein persönliches Zertifikat 0001.',
    detail: [
      ['ID',    'STARTNUMMER',    'Deine Leadership-Evolution'],
      ['DAY',   'TÄGLICH',        '1 Frage · 1 Drill · 1 Reflexion'],
      ['END',   'ABSCHLUSS',      'Zertifikat 0001 · LinkedIn-ready'],
      ['SIGN',  'UNTERSCHRIFT',   'Wlad Jachtchenko persönlich'],
    ],
    cta: 'Challenge starten',
    href: 'https://leadercheck.de',
    variant: 'bib',
    photo: local('p-03-fuehrungs-sprint.webp'),
    posterDesign: true,
    photoFallback: local('hf-03.webp'),
    photoFit: 'cover',
    // Poster card sits lower in the split so it aligns with body+CTA
    // instead of hanging at the headline edge (user feedback).
    visualOffset: true,
  },
  {
    nr: '04',
    code: 'WLAD',
    eyebrow: 'BENEFIT 04 · AUTHENTIZITÄT',
    headline: 'Wlads Methodik.',
    headlineAccent: 'Live.',
    subline: 'KI-Hype ist überall. Echte Methodik selten.',
    body:
      'Fünfhunderttausend Kunden haben seine Methode gelernt. ' +
      'Drei SPIEGEL-Bestseller. Vierzehn Millionen Views. ' +
      'Jetzt direkt in deiner Tasche.',
    detail: [
      ['NAM', 'WLAD JACHTCHENKO', 'Europas führender Argumentations-Coach'],
      ['MAT', 'METHODIK',         'Authentische Wlad-Frameworks'],
      ['VOI', 'STIMME',           'Antwortet in Wlads Ton'],
      ['CTX', 'KONTEXT',          'Deine Situation, sein Wissen'],
    ],
    cta: 'Mehr über Wlad',
    href: 'https://leadercheck.de',
    variant: 'photo',
    posterDesign: true,
    photo: wlad('wlad-portrait.webp'),
    photoFallback: wlad('wlad-portrait.jpg'),
    // No fallback on purpose. hf-04.png is an AI-generated mockup of
    // someone who is NOT Wlad · if the real portrait ever 404s we want a
    // broken-image marker so we notice in QA, not a stranger silently
    // taking Wlad's place in the AUTHENTIZITÄT chapter.
    photoFit: 'portrait',
  },
  {
    nr: '05',
    code: 'TRUST',
    eyebrow: 'BENEFIT 05 · TRUST',
    headline: '400 Tausend.',
    headlineAccent: '14 Millionen.',
    subline: 'Andere zeigen Logos. Wir zeigen Zahlen.',
    body:
      'Kunden weltweit haben seine Methode gelernt. ' +
      'Vierzehn Millionen Views auf seinem Podcast und YouTube. ' +
      'Drei SPIEGEL-Bestseller. Zwölf Bücher gesamt.',
    detail: [
      ['400K', 'KUNDEN',          'In 20+ Ländern'],
      ['14M',  'VIEWS',           'Podcast + YouTube'],
      ['3×',   'SPIEGEL-BESTS.',  'Weiße Rhetorik · Dunkle Rhetorik · 5 Rollen'],
      ['12',   'BÜCHER GESAMT',   '250 000+ Verkäufe'],
      ['ZERT', 'AUSBILDUNG',      'Staatlich · sechs Monate'],
    ],
    cta: 'Mehr Beweise',
    href: 'https://leadercheck.de',
    // WladBot 3.0 card (avatar + pixel scan-grid + live status). The old
    // numbers poster just duplicated the headline and cropped badly in the
    // 4:5 frame (user feedback) — the numbers live in headline + specimen
    // table, the card now shows WHO is behind them.
    variant: 'wladbot30',
    posterDesign: false,
    photo: null,
    photoFallback: null,
  },
  {
    nr: '06',
    code: 'ZERTIFIKAT',
    eyebrow: 'BENEFIT 06 · NACHWEIS',
    headline: 'Zertifikat 0001.',
    headlineAccent: 'LinkedIn-ready.',
    subline: 'PDFs vergessen. Dieses Zertifikat trägst du.',
    body:
      'Jede Challenge endet mit einem persönlichen Zertifikat, ' +
      'signiert von Wlad Jachtchenko, mit deiner Startnummer 0001 ' +
      'und dem offiziellen LeaderOS-Siegel. Teilbar auf LinkedIn.',
    detail: [
      ['SIG', 'UNTERSCHRIFT',  'Wlad Jachtchenko · handschriftlich'],
      ['NR.', 'STARTNUMMER',   '0001 · Individuell'],
      ['SEA', 'SIEGEL',        'Goldfolie · LeaderOS Wappen'],
      ['SHA', 'SHAREABLE',     'LinkedIn · CV · Profil'],
    ],
    cta: 'Erstes Zertifikat freischalten',
    href: 'https://leadercheck.de',
    variant: 'cert',
    photo: local('p-06-bib-0001.webp'),
    posterDesign: true,
    photoFallback: local('hf-06.webp'),
    photoFit: 'cover',
  },
  {
    nr: '07',
    code: 'KOMPLETT',
    eyebrow: 'BENEFIT 07 · KOMPLETTBEGLEITUNG',
    headline: 'Powered by WladBot.',
    headlineAccent: 'Persönlich von Wlad.',
    subline: 'Lernen ist nicht genug. Umsetzen entscheidet.',
    dark: true,
    body:
      'Plus-Plus ist kein Online-Kurs den du wegklickst. Es ist ' +
      'echtes Enablement: tägliche Lernvideos, Live-Sessions im kleinen Kreis ' +
      'persönlich, der Drill-Channel in dem du das Gelernte sofort ' +
      'auf deinen echten Führungsalltag anwendest, und WladBot der ' +
      'deine Challenge-Historie kennt. Du lernst nicht 11 Bücher, du ' +
      'setzt sie um.',
    detail: [
      ['BOT',  'WLADBOT',        'Dein 24/7 Coach in Wlads Stimme'],
      ['VID',  'LERNVIDEOS',     'Jeden Tag eine neue Lektion'],
      ['LIV',  'LIVE-SESSIONS',  'Monatlich · live · ungeschnitten'],
      ['DRL',  'DRILL-CHANNEL',  'Theorie sofort am echten Fall umsetzen'],
      ['ENB',  'ENABLEMENT',     '12 Monate, bis es sitzt'],
      ['ZRT',  'ZERTIFIKAT',     'Mit deiner persönlichen Startnummer'],
      ['INV',  'INVESTITION',    '30-Tage 997 € · OS-Jahr 4 797 €'],
    ],
    cta: 'Jetzt starten',
    href: 'https://leadercheck.de',
    variant: 'voxel',
    photo: local('p-07-dreibig-tage.webp'),
    posterDesign: true,
    photoFallback: local('p-07-dreibig-tage.webp'),
    photoFit: 'cover',
  },
];

// Hero photo, large editorial backdrop.
export const HERO_PHOTO = photo('hero', 1600, 2000);

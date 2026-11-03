// Google Ads · Text-Assets · Webinar 26.11.2026 + Evergreen-Search.
//
// Was hier steht, wird im Ad-Studio (/ads → „Google Text-Assets") mit
// Zeichenzahl gegen die Google-Limits geprüft und per Klick kopiert.
// Bild-Assets kommen aus contentAds.js (platform 'google').
//
// Regeln: jede Zahl aus docs/gtm/WLAD_CANON.md, keine Superlative ohne
// Beleg, keine „Garantie", keine Verknappung. Google verlangt zudem: keine
// Ausrufezeichen in Headlines, kein GROSSSCHREIBEN ganzer Wörter außer
// Eigennamen, keine wiederholten Satzzeichen.
//
// Konto-Setup, Conversion-Aktionen, Consent Mode: docs/gtm/GOOGLE_ADS_SETUP.md.

export const GOOGLE_LIMITS = {
  headline: 30,
  description: 90,
  longHeadline: 90,
  businessName: 25,
  path: 15,
  sitelink: 25,
  sitelinkDesc: 35,
  callout: 25,
  snippet: 25,
};

const WEBINAR_URL = 'https://leader-os.de/webinar?utm_source=google&utm_medium=cpc&utm_campaign=webinar-2026-09';
const FRAMEWORKS_URL = 'https://leader-os.de/frameworks?utm_source=google&utm_medium=cpc&utm_campaign=frameworks-2026-10';

export const GOOGLE_CAMPAIGNS = [
  {
    id: 'SEARCH-WEBINAR',
    type: 'Search · Responsive Search Ad',
    goal: 'Leads · Conversion „Webinar-Lead"',
    finalUrl: WEBINAR_URL,
    paths: ['webinar', 'live'],
    note: 'Eine Anzeigengruppe, Phrase-Match. Keine Broad-Match-Keywords vor 30 Conversions — Google streut sonst auf „führung" allgemein.',
    keywords: [
      '"führungskräfte webinar"', '"leadership webinar"', '"webinar führung"',
      '"führungskräftetraining online"', '"führungskräfte training"', '"leadership training online"',
      '"führen lernen"', '"führungskompetenzen"', '"feedback geben lernen"',
      '"wlad jachtchenko"', '"jachtchenko webinar"',
    ],
    negatives: ['kostenlos download', 'pdf', 'studium', 'ausbildung', 'gehalt', 'job', 'stellen', 'bachelor', 'master'],
    headlines: [
      'Webinar mit Wlad Jachtchenko',
      'Führung täglich trainierbar',
      'Kostenloses Live-Webinar',
      '26. November · 10 Uhr · live',
      '90 Minuten, echter Live-Case',
      'Deine Fragen im Q&A',
      'Keine Aufzeichnung, nur live',
      '3× SPIEGEL-Bestseller-Autor',
      'Seit 2007 im Coaching',
      'Über 400.000 Klienten',
      'Feedbackformel live erklärt',
      'Der Charisma-Code live',
      'Seminar vorbei, nichts bleibt?',
      'Jetzt kostenlos Platz sichern',
      'Führe besser. Jeden Tag.',
    ],
    descriptions: [
      'Wlad Jachtchenko zeigt live, wie Führung in 15 Minuten am Tag trainierbar wird. Kostenlos.',
      'Charisma-Code, Leadership-Betriebssystem und ein echter Live-Case aus der Community.',
      '90 Minuten am 26. November, 10 Uhr. Live, mit Q&A, ohne Aufzeichnung. Platz sichern.',
      'Seminare ändern Wissen, nicht Verhalten. Im Webinar: Führung, die täglich trainiert wird.',
    ],
  },
  {
    id: 'SEARCH-BRAND',
    type: 'Search · Responsive Search Ad',
    goal: 'Markensuche abfangen · Webinar als erstes Angebot',
    finalUrl: WEBINAR_URL,
    paths: ['wlad', 'webinar'],
    note: 'Eigene Kampagne mit kleinem Budget (5 €/Tag). Markensuche ist die günstigste Conversion, die es gibt — und ohne Anzeige steht dort ein Wettbewerber.',
    keywords: [
      '"wlad jachtchenko"', '"wladislaw jachtchenko"', '"jachtchenko"', '"argumentorik"',
      '"wlad jachtchenko webinar"', '"wlad jachtchenko coaching"', '"leaderos"', '"leader os"',
    ],
    negatives: ['buch kaufen', 'amazon', 'thalia', 'pdf'],
    headlines: [
      'Wlad Jachtchenko: Live-Webinar',
      'Wlad Jachtchenko · LeaderOS',
      'Live am 26. November',
      'Kostenlos · 90 Minuten · Q&A',
      'Methodik als Trainingssystem',
      'Weiße Rhetorik, Feedbackformel',
      '3× SPIEGEL-Bestseller-Autor',
      'Seit 2007 · 400.000+ Klienten',
      'Jetzt Platz sichern',
      'Führe besser. Jeden Tag.',
    ],
    descriptions: [
      'Das Live-Webinar mit Wlad Jachtchenko: 26. November, 10 Uhr, kostenlos, mit Q&A.',
      'Wlads komplette Methodik als tägliches Trainingssystem — zum ersten Mal live gezeigt.',
      'Keine Aufzeichnung. Deine Fragen kommen dran. Platz kostenlos sichern.',
      'LeaderOS: der KI-Coach, der Wlads Bücher kennt. 14 Tage kostenlos, ohne Karte.',
    ],
  },
  {
    id: 'SEARCH-FEEDBACK',
    type: 'Search · Responsive Search Ad',
    goal: 'Akutes Problem → Journal-Artikel → Webinar-CTA',
    finalUrl: 'https://leader-os.de/journal/feedback-geben-vorlage-bww-framework?utm_source=google&utm_medium=cpc&utm_campaign=webinar-2026-09',
    paths: ['feedback', 'formel'],
    note: 'Landing ist der Artikel, nicht die Webinar-Seite: wer „feedback geben" sucht, will erst die Antwort, dann das Angebot. Der Artikel trägt den Webinar-CTA.',
    keywords: [
      '"feedback geben"', '"feedback formel"', '"feedback geben führungskraft"', '"kritikgespräch führen"',
      '"konfliktgespräch führen"', '"mitarbeitergespräch vorbereiten"', '"konstruktive kritik"',
    ],
    negatives: ['kunden feedback', 'feedback tool', 'software', 'umfrage', 'formular', 'vorlage word'],
    headlines: [
      'Feedback geben: die Formel',
      'Beobachtung, Wirkung, Wunsch',
      'Drei Sätze für jedes Gespräch',
      'Ich habe beobachtet, dass …',
      'Wlads Feedbackformel',
      'Kritikgespräch ohne Drama',
      'Skript statt Bauchgefühl',
      'Von Wlad Jachtchenko',
      'Live im Webinar am 26.11.',
      'Kostenlos nachlesen',
    ],
    descriptions: [
      'Beobachtung + Wirkung + Wunsch. Die Feedbackformel von Wlad Jachtchenko, mit Beispielen.',
      'Kritik äußern, ohne Vertrauen zu verlieren. Skript statt Bauchgefühl, zum Nachlesen.',
      'Und am 26. November live: die Formel an einem echten Fall, im kostenlosen Webinar.',
      'Aus der Methodik hinter 400.000+ Coachings. Kostenlos, ohne Login.',
    ],
  },
  {
    id: 'DEMAND-GEN-WEBINAR',
    type: 'Demand Gen / Display / Performance Max · Asset-Gruppe',
    goal: 'Reichweite + Retargeting · Bild-Assets aus dem Studio (Plattform „google")',
    finalUrl: WEBINAR_URL,
    businessName: 'LeaderOS',
    logo: '/icon-512.png',
    images: ['AD-D03-1.91x1-g', 'AD-D03-1x1-g', 'AD-B01-1.91x1-g', 'AD-B01-1x1-g', 'AD-C02-1.91x1-g', 'AD-C02-1x1-g', 'AD-A02-1.91x1-g', 'AD-A02-1x1-g'],
    note: 'Bilder: 1.91x1 = 1200×628, 1x1 = 1080 (Google-Minimum 300, Empfehlung 1200 — Screenshot bei Zoom 111 % liefert 1200). Logo quadratisch aus /icon-512.png.',
    headlines: [
      'Webinar mit Wlad Jachtchenko',
      'Führung täglich trainierbar',
      'Kostenlos · 26. Nov · 10 Uhr',
      'Keine Aufzeichnung, nur live',
      '3× SPIEGEL-Bestseller-Autor',
    ],
    longHeadline: 'Führe besser. Jeden Tag. Das kostenlose Live-Webinar mit Wlad Jachtchenko am 26.11.',
    descriptions: [
      'Charisma-Code, Leadership-Betriebssystem, ein echter Live-Case. 90 Minuten, mit Q&A.',
      'Seminare ändern Wissen, nicht Verhalten. Im Webinar: Führung in 15 Minuten am Tag üben.',
      'Seit 2007 im Coaching, 400.000+ Klienten, 3× SPIEGEL-Bestseller. Erstmals live als System.',
      'Kostenlos, live, ohne Aufzeichnung. Platz sichern, Kalender-Einladung kommt sofort.',
      'Wlad Jachtchenko beantwortet deine Fragen persönlich. 26. November, 10 Uhr.',
    ],
  },
  {
    id: 'SEARCH-FRAMEWORKS',
    type: 'Search · Responsive Search Ad · Evergreen (ab W2)',
    goal: 'Framework-Suchen → /frameworks → Webinar/Trial',
    finalUrl: FRAMEWORKS_URL,
    paths: ['frameworks', 'wlad'],
    note: 'PAUSIERT: Die Seite /frameworks ist entfernt und leitet auf /kommunikation um. Nicht in Google/Bing anlegen, bis es eine neue Framework-Landing gibt. Keywords aus SEO_KEYWORDS.md Cluster 3 + 4, Phrase-Match.',
    keywords: [
      '"5 rollen einer führungskraft"', '"sexier modell"', '"dunkle rhetorik"', '"logos ethos pathos"',
      '"4 farben modell"', '"schulz von thun 4 ohren"', '"aktives zuhören stufen"', '"charisma lernen"',
      '"feedback formel"', '"schlagfertigkeit lernen"',
    ],
    negatives: ['pdf', 'buch kaufen', 'amazon', 'zusammenfassung', 'referat', 'schule', 'unterricht'],
    headlines: [
      'Wlads Frameworks, eine Seite',
      '5 Rollen einer Führungskraft',
      'SEXIER und Feedbackformel',
      '10 Stufen des Zuhörens',
      'Dunkle Rhetorik erkennen',
      'Logos, Ethos, Pathos',
      'Aus 3 SPIEGEL-Bestsellern',
      'Von Wlad Jachtchenko',
      'Kostenlos, ohne Login',
      'Führe besser. Jeden Tag.',
    ],
    descriptions: [
      'Acht Frameworks von Wlad Jachtchenko, exakt so wie im Coaching trainiert. Auf einer Seite.',
      'SEXIER, Feedbackformel, 5 Rollen, 10 Stufen des Zuhörens, 4 Farben, Charisma-Code.',
      'Aus „Weiße Rhetorik", „Dunkle Rhetorik" und „Die 5 Rollen einer Führungskraft". Kostenlos.',
      'Und im LeaderOS täglich trainieren: 14 Tage kostenlos, ohne Karte, jederzeit kündbar.',
    ],
  },
];

// Erweiterungen (Assets auf Konto-Ebene) · gelten für alle Search-Kampagnen.
export const GOOGLE_EXTENSIONS = {
  sitelinks: [
    { text: 'Live-Webinar 26.11.', desc1: 'Kostenlos, 90 Minuten, Q&A', desc2: 'Keine Aufzeichnung', url: 'https://leader-os.de/webinar' },
    { text: 'Leader-Check', desc1: 'Dein Führungsprofil in 10 Min', desc2: 'Kostenlos, ohne Login', url: 'https://leader-check.de/' },
    { text: 'Feedbackformel lesen', desc1: 'Beobachtung, Wirkung, Wunsch', desc2: 'Kostenlos, ohne Login', url: 'https://leader-os.de/journal/feedback-geben-vorlage-bww-framework' },
    { text: 'Über Wlad Jachtchenko', desc1: '3× SPIEGEL-Bestseller', desc2: 'Seit 2007 im Coaching', url: 'https://leader-os.de/wlad-jachtchenko' },
    { text: 'Journal', desc1: '150+ Artikel zu Führung', desc2: 'Kostenlos lesen', url: 'https://leader-os.de/journal' },
    { text: '14 Tage kostenlos testen', desc1: 'LeaderOS ohne Karte', desc2: 'Jederzeit kündbar', url: 'https://leader-os.de/' },
  ],
  callouts: [
    'Kostenloses Live-Webinar', 'Keine Aufzeichnung', '3× SPIEGEL-Bestseller', 'Seit 2007 im Coaching',
    '400.000+ Klienten', '14 Tage kostenlos testen', 'Ohne Kreditkarte', 'Jederzeit kündbar',
  ],
  snippets: {
    header: 'Kurse',
    values: ['SEXIER-Modell', 'Feedbackformel', 'Die 5 Rollen', '10 Stufen des Zuhörens', '3 Säulen', '4-Farben-Modell', 'Dunkle Rhetorik', 'Charisma-Code'],
  },
};

/** Alle Text-Assets mit Limit-Verstößen — für Studio-Anzeige und Tests. */
export const googleAssetProblems = () => {
  const out = [];
  const check = (owner, kind, value, limit) => {
    if (value && value.length > limit) out.push(`${owner} · ${kind}: „${value}" (${value.length} > ${limit})`);
  };
  GOOGLE_CAMPAIGNS.forEach((c) => {
    (c.headlines || []).forEach((h) => check(c.id, 'headline', h, GOOGLE_LIMITS.headline));
    (c.descriptions || []).forEach((d) => check(c.id, 'description', d, GOOGLE_LIMITS.description));
    check(c.id, 'longHeadline', c.longHeadline, GOOGLE_LIMITS.longHeadline);
    check(c.id, 'businessName', c.businessName, GOOGLE_LIMITS.businessName);
    (c.paths || []).forEach((p) => check(c.id, 'path', p, GOOGLE_LIMITS.path));
  });
  GOOGLE_EXTENSIONS.sitelinks.forEach((s) => {
    check('sitelinks', 'text', s.text, GOOGLE_LIMITS.sitelink);
    check('sitelinks', 'desc', s.desc1, GOOGLE_LIMITS.sitelinkDesc);
    check('sitelinks', 'desc', s.desc2, GOOGLE_LIMITS.sitelinkDesc);
  });
  GOOGLE_EXTENSIONS.callouts.forEach((c) => check('callouts', 'callout', c, GOOGLE_LIMITS.callout));
  GOOGLE_EXTENSIONS.snippets.values.forEach((v) => check('snippets', 'value', v, GOOGLE_LIMITS.snippet));
  return out;
};

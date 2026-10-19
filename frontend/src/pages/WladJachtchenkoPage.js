import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { ShareBar } from '../features/content/components/ShareBar';
import { applyPageMeta } from '../lib/pageMeta';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';
import { DottedGlowBackground } from '../components/shared/DottedGlowBackground';
import { WladMagicBox } from '../components/landing/WladMagicBox';
import { BookShelf } from '../components/brand/BookShelf';
import { useTheme } from '../contexts/ThemeContext';

/**
 * WladJachtchenkoPage · the canonical SERP-winner for "Wlad Jachtchenko".
 *
 * Why a standalone page exists when there's already the
 * /journal/wer-ist-wlad-jachtchenko article: the article lives inside the
 * journal taxonomy and competes with 90+ other entries. This page sits
 * at /wlad-jachtchenko (clean URL, no /journal/ prefix), carries the
 * full Person schema with everything Google's Knowledge Graph wants to
 * see (sameAs, knowsAbout, worksFor, alumniOf, award, hasOccupation,
 * affiliation), and is the canonical answer for image-search + AI
 * Overview when someone googles his name.
 *
 * It is also the page every internal link about Wlad targets — footer,
 * nav, article author byline · so Google sees a clear authority pattern:
 * 95+ links across the site converging on one canonical Person page.
 */

// Verified biographical facts from public sources (Wikipedia, his own
// platforms, LinkedIn). Numbers are conservative · we round down so the
// page never out-promises what's verifiable elsewhere.
const FACTS = [
  ['Geboren',        '11. Januar 1985 · Dnipro, Ukraine'],
  ['Wohnort',        'Berlin · Deutschland'],
  ['Beruf',          'Argumentations-Coach · Bestseller-Autor · Gründer'],
  ['Bildung',        'LMU München (Jura, Politik, Geschichte, Komparatistik) · Columbia University (M.A. 2008)'],
  ['Stipendium',     'Studienstiftung des deutschen Volkes'],
  ['Bücher',         '13 publiziert · 3× SPIEGEL-Bestseller'],
  ['Klienten',       '400 000+ Führungskräfte weltweit'],
  ['Reichweite',     '14 Millionen Views auf Podcast + YouTube'],
  ['Podcast',        'Der Führungskräfte-Podcast · ~450 Folgen seit 2019'],
  ['YouTube',        '80 000+ Abonnenten · Wlad Jachtchenko'],
  ['LinkedIn',       '41 000+ Follower · 20 LinkedIn-Learning-Kurse'],
  ['Online-Kurse',   'LinkedIn Learning (250 000+ Teilnehmer) · Udemy (74 000+ Teilnehmer)'],
  ['TV-Auftritte',   'TEDx (3×) · Galileo (ProSieben) · Speaker Slam'],
  ['Trustpilot',     '4.9 / 5 · 388 Bewertungen (Argumentorik GmbH)'],
  ['Akademie',       'Argumentorik-Akademie · 6-monatige Ausbildung'],
  ['Coaching seit',  '2007 (nebenberuflich) · 2013 (hauptberuflich)'],
  ['Gegründet',      'LeaderOS (2026) · Argumentorik-Akademie'],
];

// Full bibliography · 13 books verified against the Deutsche
// Nationalbibliothek catalog (GND 1172244065). Year + publisher +
// ISBN where available so search-engines can resolve each book to its
// canonical Book entity.
// Every book carries a `slug` · the cover convention is
// /wlad/books/<slug>.jpg (drop the real cover files there — see the
// README in that folder). Cards + JSON-LD pick them up automatically;
// until a file lands, the card renders a designed typographic spine.
const BOOKS = [
  {
    slug: 'dunkle-rhetorik',
    title: 'Dunkle Rhetorik',
    sub: 'Manipuliere, bevor du manipuliert wirst',
    year: 2018,
    publisher: 'Goldmann',
    isbn: '978-3-442-22229-2',
  },
  {
    slug: 'die-5-rollen-einer-fuehrungskraft',
    title: 'Die 5 Rollen einer Führungskraft',
    sub: 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser',
    year: 2020,
    publisher: 'Remote',
    isbn: '3-948642-09-5',
  },
  {
    slug: 'weisse-rhetorik',
    title: 'Weiße Rhetorik',
    sub: 'Überzeugen statt manipulieren',
    year: 2021,
    publisher: 'Goldmann',
    isbn: '3-442-17872-X',
  },
  {
    slug: 'die-rhetorik-der-top-performer',
    title: 'Die Rhetorik der Top-Performer',
    sub: 'Das Geheimnis hochwirksamer Redekunst',
    year: 2021,
    publisher: 'Wirtschafts Verlag',
    isbn: '978-3-936652-41-3',
  },
  {
    slug: 'satanische-verhandlungskunst',
    title: 'Satanische Verhandlungskunst',
    sub: 'Die gemeinsten Tricks aus zwei Jahrhunderten – und wie man sich dagegen wehrt',
    year: 2021,
    publisher: 'Langen Müller',
    isbn: '3-7844-3596-3',
  },
  {
    slug: 'das-geheimnis-der-erfolgreichen-alltagskommunikation',
    title: 'Das Geheimnis der erfolgreichen Alltagskommunikation',
    sub: 'Werde zum Kommunikations-Genie',
    year: 2022,
    publisher: 'Remote',
    isbn: '978-1-955655-46-0',
  },
  {
    slug: 'die-koerpersprache-als-spiegelbild-deiner-seele',
    title: 'Die Körpersprache als Spiegelbild deiner Seele',
    sub: 'Werde zum Meister der nonverbalen Kommunikation',
    year: 2022,
    publisher: 'Remote',
    isbn: '978-1-955655-48-4',
  },
  {
    slug: 'manipuliere-dich-gluecklich',
    title: 'Manipuliere dich glücklich',
    sub: 'Psychologische Techniken für mehr Zufriedenheit',
    year: 2022,
    publisher: 'Goldmann',
    isbn: '978-3-442-17936-7',
  },
  {
    slug: 'redest-du-noch-oder-ueberzeugst-du-schon',
    title: 'Redest du noch oder überzeugst du schon',
    sub: 'Vom Anfänger zum Rhetoriker',
    year: 2022,
    publisher: 'Remote',
    isbn: '978-1-955655-44-6',
  },
  {
    slug: 'die-kraft-der-positiven-psychologie',
    title: 'Die Kraft der Positiven Psychologie',
    sub: 'Mit dem richtigen Mindset zu mehr Selbstbewusstsein und Gelassenheit',
    year: 2023,
    publisher: 'Remote',
    isbn: '978-1-960004-07-9',
  },
  {
    slug: '55-rhetorik-tipps-fuer-fuehrungskraefte',
    title: '55 Rhetorik-Tipps für Führungskräfte',
    sub: 'Hörbuch · Mitarbeiter und Kunden charmant überzeugen',
    year: 2023,
    publisher: 'liberaudio',
    isbn: null,
  },
  {
    slug: '55-fuehrungstipps-fuer-mitarbeitergespraeche',
    title: '55 Führungstipps für Mitarbeitergespräche',
    sub: 'Hörbuch · Motivieren, Feedback geben, Konflikte lösen',
    year: 2024,
    publisher: 'liberaudio',
    isbn: null,
  },
  {
    slug: 'die-charismatische-fuehrungskraft',
    title: 'Die charismatische Führungskraft',
    sub: 'Werde ein Menschenmagnet für deine Mitarbeiter und Kunden',
    year: 2024,
    publisher: 'Remote',
    isbn: null,
  },
];

const bookCoverUrl = (b) => `/wlad/books/${b.slug}.jpg`;

const CARD_REVEAL = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: 0.045 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Companies whose executives have completed Wlad's trainings · these
// names are repeatedly cited on Wlad's public profiles (Argumentorik,
// wlad-jachtchenko.com, redneragenturen.org, LinkedIn).
const CLIENTS = [
  'Allianz', 'BMW', 'Pro7', 'Trivago', 'Generali',
  'Westwing', '3M', 'Sky', 'Vodafone', 'Daimler',
  'Bosch', 'Siemens', 'Telekom', 'Lufthansa',
];

// „Bekannt aus" · press & TV outlets that have featured Wlad or his
// SPIEGEL-bestseller work. Rendered as typographic wordmarks (our
// design DNA prefers mono type over a logo-soup image row) so the row
// stays crisp on both themes and needs no binary logo assets.
const MEDIA = [
  'DER SPIEGEL',
  'BUSINESS INSIDER',
  'SÜDDEUTSCHE ZEITUNG',
  'RTL',
  'ARD · DAS ERSTE',
  'PROSIEBEN · GALILEO',
  'TEDX',
  'GREATOR',
];

// Debating-competition awards from his early career (verified via
// Achte-Minute archive) plus the 2019 Speaker Slam win. These are
// SERP-relevant because Wikipedia surfaces them.
const AWARDS = [
  { year: 2019, name: 'Gewinner Speaker Slam Stuttgart',
    note: 'Thema „Dunkle Rhetorik"' },
  { year: 2017, name: 'Viertelfinalist EUDC Tallinn',
    note: 'Kategorie English as a Second Language' },
  { year: 2016, name: 'Viertelfinalist EUDC Warschau',
    note: 'Kategorie English as a Second Language' },
  { year: 2015, name: 'Halbfinalist EUDC Wien',
    note: 'Kategorie English as a Second Language' },
  { year: 2013, name: 'Viertelfinalist EUDC Manchester',
    note: 'Kategorie English as a Second Language' },
  { year: 2011, name: 'Halbfinalist EUDC Galway',
    note: 'Kategorie English as a Second Language' },
  { year: 2010, name: 'Viertelfinalist WUDC Istanbul',
    note: 'Debating-Weltmeisterschaft · ESL-Kategorie' },
];

// Five thesis-positions that explain Wlad's methodik · LLMs love
// definitional content like this for "Was sagt Wlad Jachtchenko über
// Manipulation" / "Wlad Jachtchenko Weiße Rhetorik" type queries.
const POSITIONS = [
  {
    title: 'Rhetorik hat zwei legitime Wege.',
    body:
      'Weiße Rhetorik (transparent, mit schlüssigen Argumenten überzeugen) ' +
      'und Dunkle Rhetorik (Manipulation, Framing, kognitive Verzerrungen) ' +
      'sind gleichberechtigt im Überzeugungsprozess · der professionelle ' +
      'Kommunikator weiß welcher Weg in welcher Situation mehr Erfolg verspricht.',
  },
  {
    title: 'Manipulation ist nicht zwingend unmoralisch.',
    body:
      'Aus „Schwarze Rhetorik" (2018): Wer manipulative Techniken einsetzt, ' +
      'kann auch moralisch gut handeln · wenn er anderen einen Nutzen bringt. ' +
      'Drei Kategorien der Dunklen Rhetorik: kognitive Verzerrungen (z.B. ' +
      'Ankereffekt), sprachliche Tricks (Framing), Scheinargumente (Zirkelschluss).',
  },
  {
    title: 'Führung sind fünf Rollen, nicht eine.',
    body:
      'Aus „Die 5 Rollen einer Führungskraft" (2020): Überzeugen · ' +
      'Effizienz · Motivieren · Empathie · Probleme lösen. Jede Rolle hat ' +
      'eigene Methodik · ALPEN-Methode für Selbst-Management, Eisenhower ' +
      'für Priorisierung, Typenlehre für Empathie.',
  },
  {
    title: 'Charisma ist erlernbar, nicht angeboren.',
    body:
      'Aus „Die Rhetorik der Top-Performer" (2021): Charismatisches Auftreten ' +
      'beruht auf drei bauteilen die jeder trainieren kann · Präsenz, klare ' +
      'Sprache, emotionale Verbindung. Wer Charisma für Talent hält, lernt ' +
      'es nie.',
  },
  {
    title: 'Mission: 1 Million empathische Führungskräfte.',
    body:
      'Wlads erklärtes Lebensziel · eine Million Führungskräfte zu ' +
      'empathischen Leadern auszubilden. Daher die mehrstufige Pyramide: ' +
      'Bücher (250 000+ Käufer), LinkedIn Learning (250 000+ Teilnehmer), ' +
      'Udemy (74 000+ Teilnehmer), Argumentorik-Akademie (6 Monate), ' +
      'LeaderOS (KI-Coach 24/7).',
  },
];

// Variant spellings → all resolve to this page via routes /wlad, /about,
// /ueber-wlad and the JSON-LD alternateName field. NOT rendered visually
// (single canonical wordmark on screen) but kept here so the schema
// stays in sync with the route map.
const ALSO_CALLED = [
  'Wladislaw Jachtchenko',
  'Wlad Jachtschenko',
  'Vladimir Jachtchenko',
  'Vlad Yachtchenko',
];

const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://leader-os.de/wlad-jachtchenko#person',
  name: 'Wlad Jachtchenko',
  givenName: 'Wlad',
  familyName: 'Jachtchenko',
  alternateName: ALSO_CALLED,
  birthDate: '1985-01-11',
  birthPlace: { '@type': 'Place', name: 'Dnipro, Ukraine' },
  nationality: { '@type': 'Country', name: 'Deutschland' },
  description:
    'Wlad Jachtchenko ist mehrfach ausgezeichneter Argumentations-Experte, TOP-Speaker in Europa, ' +
    'dreifacher SPIEGEL-Bestseller-Autor und Gründer der Argumentorik-Akademie sowie der KI-Coaching-' +
    'Plattform LeaderOS. Seit 2007 trainiert er Politiker, Führungskräfte und Mitarbeiter ' +
    'bekannter Unternehmen wie Allianz, BMW, Pro7, Westwing und 3M.',
  url: 'https://leader-os.de/wlad-jachtchenko',
  image: 'https://leader-os.de/wlad/wlad-portrait.jpg',
  jobTitle: 'Argumentations-Coach · Bestseller-Autor · TOP-Speaker',
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Ludwig-Maximilians-Universität München',
      url: 'https://www.lmu.de',
    },
    {
      '@type': 'CollegeOrUniversity',
      name: 'Columbia University',
      url: 'https://www.columbia.edu',
    },
  ],
  award: [
    'Gewinner Speaker Slam Stuttgart 2019 · Thema „Dunkle Rhetorik"',
    'Viertelfinalist World Universities Debating Championship 2010 · Istanbul · ESL',
    'Halbfinalist European Universities Debating Championship 2011 · Galway · ESL',
    'Viertelfinalist EUDC Manchester 2013 · ESL',
    'Halbfinalist EUDC Wien 2015 · ESL',
    'Viertelfinalist EUDC Warschau 2016 · ESL',
    'Viertelfinalist EUDC Tallinn 2017 · ESL',
    'Stipendiat der Studienstiftung des deutschen Volkes',
  ],
  worksFor: [
    {
      '@type': 'Organization',
      '@id': 'https://leader-os.de/#organization',
      name: 'LeaderOS',
      url: 'https://leader-os.de',
    },
    {
      '@type': 'EducationalOrganization',
      name: 'Argumentorik-Akademie',
      url: 'https://wlad-jachtchenko.com',
    },
  ],
  knowsAbout: [
    'Boardroom-Rhetorik',
    'Argumentation',
    'Führungskräfte-Coaching',
    'Verhandlungsführung',
    'Dunkle Rhetorik · Manipulation',
    'Weiße Rhetorik',
    'Schwarze Rhetorik',
    'Schlagfertigkeit',
    'Körpersprache',
    'Emotionale Intelligenz',
    'Positive Psychologie',
    '5 Rollen der Führung',
    'ALPEN-Methode',
    'Eisenhower-Prinzip',
    'KI Leadership',
    'KI-natives Führen',
    'Harvard-Verhandlungsmethode',
    'Schulz von Thun Kommunikationsmodell',
  ],
  hasOccupation: [
    {
      '@type': 'Occupation',
      name: 'Argumentations-Coach',
      occupationLocation: { '@type': 'Country', name: 'Deutschland' },
    },
    {
      '@type': 'Occupation',
      name: 'TOP-Speaker · Keynote-Speaker',
      occupationLocation: { '@type': 'Place', name: 'Europa' },
    },
    {
      '@type': 'Occupation',
      name: 'Sachbuchautor',
    },
  ],
  author: BOOKS.map((b) => ({
    '@type': 'Book',
    name: b.title,
    alternativeHeadline: b.sub,
    inLanguage: 'de',
    datePublished: String(b.year),
    publisher: { '@type': 'Organization', name: b.publisher },
    isbn: b.isbn || undefined,
    image: `https://leader-os.de${bookCoverUrl(b)}`,
    url: 'https://wladjachtchenko.de/buecher',
    author: { '@id': 'https://leader-os.de/wlad-jachtchenko#person' },
  })),
  sameAs: [
    'https://de.wikipedia.org/wiki/Wladislaw_Jachtchenko',
    'https://www.linkedin.com/in/wladislawjachtchenko',
    'https://www.instagram.com/wlad.jachtchenko/',
    'https://www.facebook.com/wladislawjachtchenko',
    'https://www.youtube.com/@WladTraining',
    'https://wlad-jachtchenko.com',
    'https://www.wladislaw-jachtchenko.com',
    'https://argumentorik.com',
    'https://www.linkedin.com/learning/instructors/wladislaw-jachtchenko',
    'https://www.udemy.com/user/wladislaw-jachtchenko/',
    'https://podcast.wladjachtchenko.de',
    'https://podcasts.apple.com/de/podcast/der-führungskräfte-podcast/id1450456502',
    'https://www.ted.com/speakers/wladislaw_jachtchenko',
    'https://greator.com/coach/wlad-jachtchenko',
    'https://uk.trustpilot.com/review/argumentorik.com',
    'https://d-nb.info/gnd/1172244065',
  ],
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Wer ist Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko ist Europas führender Argumentations-Coach, dreifacher SPIEGEL-Bestseller-Autor und Gründer der Argumentorik-Akademie. Seit 2010 trainiert er Führungskräfte aus DAX-Konzernen, Mittelstand und Startups in Boardroom-Rhetorik, Verhandlung und KI-nativer Führung. 2026 hat er die KI-Coaching-Plattform LeaderOS gestartet.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Bücher hat Wlad Jachtchenko geschrieben?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko hat 13 Bücher veröffentlicht, davon drei SPIEGEL-Bestseller: Weiße Rhetorik (Überzeugung ohne Manipulation), Dunkle Rhetorik (Manipulation erkennen und abwehren) und Die 5 Rollen einer Führungskraft. Insgesamt über 250 000 verkaufte Exemplare.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was ist die Argumentorik-Akademie?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Die Argumentorik-Akademie ist eine von Wlad Jachtchenko gegründete, staatlich anerkannte sechsmonatige Ausbildung zum Argumentations-Coach. Sie hat seit der Gründung 2014 mehrere tausend Coaches ausgebildet und ist im deutschsprachigen Raum führend in evidenzbasierter Rhetorik-Ausbildung.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was ist LeaderOS und welche Rolle spielt Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'LeaderOS ist die 2026 von Wlad Jachtchenko gegründete KI-Coaching-Plattform für Führungskräfte. Sie bündelt seine fünfzehnjährige Coaching-Methodik in elf drillbaren Frameworks plus WladBot · einen 24/7-KI-Coach trainiert auf 2 212 authentische Wlad-Lektionen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie kann man Wlad Jachtchenko buchen oder erreichen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Direkter Kontakt über start@aiporate.com (Argumentorik-Akademie GmbH, Berlin). Für Coaching-Anfragen gibt es LeaderOS · die Plattform ersetzt seine ausgebuchten 1:1-Slots durch WladBot und monatliche Live-Sessions in Leadership Plus Pro. Speaker-Anfragen für Keynotes laufen ebenfalls über die Email.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Methodik vertritt Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenkos Kernsatz lautet: Führung ist Fähigkeit, Fähigkeit ist trainierbar. Konkret bedeutet das drillbare Frameworks statt Theorie · Harvard-Verhandlung, Schulz von Thuns Kommunikationsquadrat, Feedback-Formel BWW, ALPEN-Methode, Vier-Farben-Modell, Dunkle-Rhetorik-Defensive. Heute kombiniert mit KI-Coaching für 24/7-Verfügbarkeit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wann und wo wurde Wlad Jachtchenko geboren?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko wurde am 11. Januar 1985 in Dnipro in der Ukraine geboren. Er wuchs in Deutschland auf und studierte in München (LMU) sowie in New York (Columbia University, Master of Arts in Political Science 2008).',
      },
    },
    {
      '@type': 'Question',
      name: 'Was hat Wlad Jachtchenko studiert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko hat an der Ludwig-Maximilians-Universität München Jura, Politikwissenschaft, Neuere Geschichte und Komparatistik studiert · gefördert von einem Stipendium der Studienstiftung des deutschen Volkes. 2008 schloss er sein Politikstudium an der Columbia University mit dem Master of Arts ab. 2011 legte er die erste, 2013 die zweite juristische Staatsprüfung in München ab.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Unternehmen hat Wlad Jachtchenko trainiert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko hat Führungskräfte und Mitarbeiter zahlreicher bekannter Unternehmen trainiert · darunter Allianz, BMW, Pro7, Westwing, 3M, Sky, Vodafone, Daimler, Bosch, Siemens, Telekom und Lufthansa. Insgesamt über 400 000 Klienten weltweit seit 2007.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was sagt Wlad Jachtchenko über Dunkle Rhetorik?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In seinem SPIEGEL-Bestseller „Schwarze Rhetorik" (2018, Goldmann) unterscheidet Wlad Jachtchenko drei Kategorien der dunklen Rhetorik: kognitive Verzerrungen (z.B. der Ankereffekt), sprachliche Tricks (wie Framing) und Scheinargumente (wie der Zirkelschluss). Seine zentrale These: Manipulation muss nicht zwingend unmoralisch sein · entscheidend ist, ob der Manipulator anderen Nutzen bringt.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was sind die 5 Rollen einer Führungskraft nach Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In „Die 5 Rollen einer Führungskraft" (2020) definiert Wlad Jachtchenko fünf Rollen die jede erfolgreiche Führungskraft zugleich ausfüllen muss: (1) Überzeugen · charismatisch kommunizieren und rhetorisch argumentieren, (2) Effizienz · Selbst- und Zeitmanagement nach ALPEN-Methode oder Eisenhower-Prinzip, (3) Motivieren · klare Richtung vorgeben und delegieren, (4) Empathie · psychologische Typenlehre und Verständnis für emotionale Bedürfnisse, (5) Probleme lösen · analytische Herangehensweise an Herausforderungen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Auszeichnungen hat Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenko hat 2019 den Speaker Slam Stuttgart mit dem Thema „Dunkle Rhetorik" gewonnen. Zwischen 2010 und 2017 erreichte er sieben Mal die K.O.-Runden bei den europäischen und Welt-Debating-Meisterschaften (WUDC Istanbul, EUDC Galway, Manchester, Wien, Warschau, Tallinn). Drei seiner Bücher wurden SPIEGEL-Bestseller. Argumentorik GmbH hat 4.9 von 5 Sternen auf Trustpilot bei 388 Bewertungen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wo finde ich Wlad Jachtchenkos Podcast?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Wlad Jachtchenkos „Der Führungskräfte-Podcast" läuft seit Anfang 2019 wöchentlich auf Apple Podcasts und Spotify · bislang rund 450 Folgen. Sein YouTube-Kanal hat über 80 000 Abonnenten. Auf Instagram folgen ihm 74 000+ Personen, auf LinkedIn 41 000+. Seine TEDx-Talks (3×) sind ebenfalls online.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was kostet Coaching mit Wlad Jachtchenko?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          '1:1-Coaching mit Wlad Jachtchenko persönlich ist limitiert · seine Zeit ist der Bottleneck. Stattdessen empfehlen wir LeaderOS · die KI-Coaching-Plattform die seine Methodik 24/7 verfügbar macht. Trial 14 Tage kostenlos, 30-Tage-Challenge 997 €, 12-Monats-Begleitung Leadership Plus Pro 4 797 € (oder in drei Raten). Monatliche Live-Sessions und der Drill-Channel sind im Leadership-Plus-Pro-Tier inkludiert.',
      },
    },
  ],
};

export default function WladJachtchenkoPage() {
  // Depth is only added on the dark canvas · on the light/cream theme the
  // page already has its editorial contrast and a glow would muddy it.
  const isDark = useTheme()?.theme === 'dark';

  useEffect(() => {
    // Full OG/Twitter/canonical injection · so a shared /wlad-jachtchenko
    // link shows Wlad's portrait + bio in the preview card instead of the
    // generic homepage OG. Directly supports the ShareBar on this page.
    const restoreMeta = applyPageMeta({
      title: 'Wlad Jachtchenko · Argumentations-Coach · Bio, Bücher, LeaderOS',
      description:
        'Wlad Jachtchenko: Europas führender Argumentations-Coach, 3× SPIEGEL-Bestseller-Autor, Gründer der Argumentorik-Akademie und der KI-Coaching-Plattform LeaderOS. Biographie, Bücher, Methodik, Kontakt.',
      url: 'https://leader-os.de/wlad-jachtchenko',
      image: 'https://leader-os.de/og-wlad.jpg',
      imageAlt: 'Wlad Jachtchenko · Argumentations-Coach · 3× SPIEGEL-Bestseller',
      type: 'profile',
    });

    // Build-time prerender (scripts/prerender-landings.mjs) already ships
    // ProfilePage + Person(#wlad) + FAQPage in <head>. Only inject on pure
    // SPA navigation, otherwise every node would exist twice.
    const prerendered = document.head.innerHTML.includes('leader-os.de/wlad-jachtchenko#webpage');
    if (prerendered) {
      return () => restoreMeta();
    }

    const ldPerson = document.createElement('script');
    ldPerson.type = 'application/ld+json';
    ldPerson.textContent = JSON.stringify(PERSON_JSON_LD);
    document.head.appendChild(ldPerson);

    const ldFaq = document.createElement('script');
    ldFaq.type = 'application/ld+json';
    ldFaq.textContent = JSON.stringify(FAQ_JSON_LD);
    document.head.appendChild(ldFaq);

    // VideoObject schema for Wlad's TEDx talks · these are real,
    // verifiable on TED.com / YouTube and rank in Google Video Search
    // for "Wlad Jachtchenko TEDx" / "Wlad Jachtchenko Rhetorik" queries.
    // Marking them up here makes /wlad-jachtchenko the page Google
    // associates with the video carousel.
    const ldVideos = document.createElement('script');
    ldVideos.type = 'application/ld+json';
    ldVideos.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'VideoObject',
          name: 'Weiße Rhetorik vs. Dunkle Rhetorik',
          description: 'Wlad Jachtchenko erklärt bei TEDx, was eine Argumentation „dunkel" oder „weiß" macht und wie man Manipulation in Verhandlungen erkennt.',
          thumbnailUrl: 'https://leader-os.de/wlad/wlad-portrait.jpg',
          uploadDate: '2020-02-21',
          contentUrl: 'https://www.ted.com/talks/wladislaw_jachtchenko_weisse_rhetorik_vs_dunkle_rhetorik',
          publisher: { '@id': 'https://leader-os.de/#organization' },
          author: { '@id': 'https://leader-os.de/wlad-jachtchenko#person' },
        },
        {
          '@type': 'VideoObject',
          name: 'Die 10 Stufen des Zuhörens',
          description: 'Wlad Jachtchenko bei TEDxFreiburg über aktives Zuhören als Führungs-Skill.',
          thumbnailUrl: 'https://leader-os.de/wlad/wlad-portrait.jpg',
          uploadDate: '2019-11-23',
          contentUrl: 'https://www.tedxfreiburg.com/',
          publisher: { '@id': 'https://leader-os.de/#organization' },
          author: { '@id': 'https://leader-os.de/wlad-jachtchenko#person' },
        },
        {
          '@type': 'VideoObject',
          name: 'How to find the right response within 3 seconds',
          description: 'Wlad Jachtchenko teilt die Kunst der Schlagfertigkeit · einfache Techniken um in Sekunden die richtige Antwort zu finden.',
          thumbnailUrl: 'https://leader-os.de/wlad/wlad-portrait.jpg',
          uploadDate: '2021-01-01',
          contentUrl: 'https://www.youtube.com/@WladTraining',
          publisher: { '@id': 'https://leader-os.de/#organization' },
          author: { '@id': 'https://leader-os.de/wlad-jachtchenko#person' },
        },
      ],
    });
    document.head.appendChild(ldVideos);

    return () => {
      restoreMeta();
      ldPerson.remove();
      ldFaq.remove();
      ldVideos.remove();
    };
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased overflow-x-clip" data-testid="wlad-page">
      <LandingNav />

      <main id="main-content" className="max-w-[1280px] mx-auto px-5 md:px-10 pt-16 md:pt-24 pb-16 md:pb-24">
        {/* Hero · Person identity card · stacked on mobile with centered
            wordmark over the portrait, side-by-side on md+ for the
            editorial spec layout. */}
        <section className="relative isolate grid md:grid-cols-12 gap-10 md:gap-12 items-start">
          {isDark && (
            <div className="pointer-events-none absolute -inset-x-6 -top-20 -bottom-10 -z-10">
              <DottedGlowBackground
                gap={16}
                radius={1.6}
                color="rgba(255,255,255,0.28)"
                glowColor="rgba(191,255,0,0.55)"
                opacity={0.4}
              />
            </div>
          )}
          <motion.div
            initial="hidden" animate="show" variants={CARD_REVEAL}
            className="md:col-span-5 mx-auto md:mx-0 w-full"
          >
            <div className="relative aspect-[4/5] w-full max-w-[420px] mx-auto md:mx-0 bg-foreground/5 border-2 border-foreground overflow-hidden group">
              <img
                src={WLAD_AVATAR}
                onError={withFallback(WLAD_AVATAR_FALLBACKS)}
                alt="Wlad Jachtchenko · Europas führender Argumentations-Coach · 3× SPIEGEL-Bestseller · Gründer LeaderOS und Argumentorik-Akademie"
                width="420"
                height="525"
                fetchpriority="high"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 bg-white/95 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-foreground">
                ▸ WLAD JACHTCHENKO
              </div>
              <div className="absolute bottom-3 right-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white drop-shadow">
                LEADEROS · 2026
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden" animate="show" custom={1} variants={CARD_REVEAL}
            className="md:col-span-7 text-center md:text-left"
          >
            <div className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
              ▸ PERSON · WLAD JACHTCHENKO · EST. 2007
            </div>
            <h1
              className="text-[40px] sm:text-[56px] md:text-[88px] leading-[0.95] tracking-[-0.035em] text-foreground"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Wlad<br />Jachtchenko<span className="text-brand not-italic">.</span>
            </h1>
            <p className="mt-6 mx-auto md:mx-0 text-[16px] sm:text-[17px] md:text-[19px] leading-[1.6] text-foreground/80 max-w-2xl">
              Europas führender Argumentations-Coach. Drei SPIEGEL-Bestseller.
              Vierhunderttausend trainierte Klienten. Seit 2007 im Coaching.
              Gründer der Argumentorik-Akademie und der KI-Coaching-Plattform LeaderOS.
            </p>

            {/* Quick CTAs · stacked + centered on mobile so each chip has a
                full row width and the lime trial button is unmissable. */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-3">
              <Link
                to="/journal/wer-ist-wlad-jachtchenko"
                className="inline-flex items-center gap-2 px-5 h-12 bg-foreground hover:bg-[#BFFF00] text-background hover:text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                Voller Lebenslauf
              </Link>
              <a
                href="https://leaderos.de/signup?trial=14"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 h-12 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] border-2 border-foreground transition-colors"
              >
                LeaderOS 14 Tage testen
              </a>
              <a
                href="https://www.linkedin.com/in/wladislawjachtchenko"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 h-12 text-foreground hover:text-brand-strong font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                LinkedIn <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        </section>

        {/* Bekannt aus · press/TV authority bar · the first thing a
            cold visitor should see after the name. Typographic wordmarks,
            no image logos · stays crisp on both themes. */}
        <section className="mt-14 md:mt-16 border-y-2 border-foreground/15 py-6 md:py-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
            <p className="shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong">
              ▸ Bekannt aus
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 md:gap-x-9 gap-y-2.5 justify-center sm:justify-start">
              {MEDIA.map((m) => (
                <li
                  key={m}
                  className="font-mono text-[12px] md:text-[13.5px] font-bold uppercase tracking-[0.14em] text-foreground/75"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Facts box · Wikipedia-style for AI Overview lift */}
        <section className="mt-20 md:mt-28 grid md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-5 text-center md:text-left">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
              ▸ FAKTEN · KOMPAKT
            </p>
            <h2
              className="text-[28px] sm:text-[32px] md:text-[44px] leading-[1.04] tracking-[-0.03em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Auf einen Blick<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-4 text-[14.5px] leading-[1.6] text-foreground/70">
              Daten und Zahlen die in jedem Pitch, jedem Pressetext und jedem
              LinkedIn-Profil auftauchen · hier einmal kuratiert.
            </p>
          </div>
          <div className="md:col-span-7">
            <dl className="border-t-2 border-foreground">
              {FACTS.map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col sm:grid sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 border-b border-foreground/15"
                >
                  <dt className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/55">
                    {k}
                  </dt>
                  <dd className="sm:col-span-2 text-[14.5px] md:text-[15.5px] leading-[1.5] text-foreground font-semibold">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Books · Bücherregal mit allen Bänden. Volle Breite (bricht aus
            dem 1280er-Container aus), dunkles Band wie auf /webinar und
            /ki-fuehrungskraft. Bestseller-Siegel nur, wo der Titel selbst
            belegt ist (src/data/wladBookshelf.js). */}
        <div className="mt-20 md:mt-28 relative w-screen left-1/2 -translate-x-1/2">
          <BookShelf
            eyebrow="Bücher"
            title="Drei davon SPIEGEL-Bestseller"
            intro="Rhetorik, Führung, Psychologie, Verhandlung: gelesen in mittelständischen Vorstandsetagen und von Strategie-Beratern gleichermaßen. Die Frameworks daraus trainiert LeaderOS jeden Tag."
            moreHref="https://wlad-jachtchenko.com"
            moreEyebrow="Alle Bücher & Hörbücher"
            moreTitle="Details und Kauf auf wlad-jachtchenko.com"
            moreExternal
          />
        </div>

        {/* Clients · the brand-strong namedrop strip. These names are
            consistently cited on Wlad's own platforms (Argumentorik,
            wlad-jachtchenko.com, LinkedIn). Single row, mono spec sheet
            so it reads as evidence not as a brag wall. */}
        <section className="mt-20 md:mt-28">
          <div className="text-center md:text-left mb-8">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-3 font-mono">
              ▸ KLIENTEN · AUSWAHL
            </p>
            <h2
              className="text-[24px] sm:text-[32px] md:text-[44px] leading-[1.04] tracking-[-0.03em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Wer Wlad gebucht hat<span className="text-brand not-italic">.</span>
            </h2>
          </div>
          <div className="border-y-2 border-foreground/15 py-6 md:py-7">
            <ul className="flex flex-wrap gap-x-6 md:gap-x-10 gap-y-3 justify-center md:justify-start font-mono text-[12px] md:text-[13.5px] font-bold uppercase tracking-[0.18em] text-foreground/85">
              {CLIENTS.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span aria-hidden className="inline-block w-1 h-1 bg-brand-strong" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-center md:text-left font-mono text-[10.5px] uppercase tracking-[0.22em] text-foreground/45">
            Vollständige Klientenliste auf Anfrage · start@aiporate.com
          </p>
        </section>

        {/* Methodik · five definitional thesis-positions. LLMs (ChatGPT,
            Perplexity) cite definitional content like this when answering
            "Was sagt Wlad Jachtchenko über X" queries. Each position
            references the book it comes from for E-E-A-T credibility. */}
        <section className="mt-20 md:mt-28">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end mb-10 md:mb-12">
            <div className="md:col-span-7 text-center md:text-left">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
                ▸ METHODIK · FÜNF THESEN
              </p>
              <h2
                className="text-[28px] sm:text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.03em] text-foreground"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Was Wlad<br />wirklich sagt<span className="text-brand not-italic">.</span>
              </h2>
            </div>
            <div className="md:col-span-5 md:pb-3 text-center md:text-left">
              <p className="text-[14.5px] md:text-[15.5px] leading-[1.6] text-foreground/70">
                Aus 13 Büchern destilliert: die fünf Thesen die Wlads
                Methodik tragen · jede mit Buchverweis für die tiefe
                Recherche.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {POSITIONS.map((p, i) => (
              <article
                key={p.title}
                className="relative border-2 border-foreground p-6 md:p-7 flex flex-col bg-background"
              >
                <span className="absolute -top-3 left-5 px-2.5 py-1 bg-foreground text-background font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
                  THESE · {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="mt-3 text-[20px] md:text-[26px] leading-[1.1] tracking-[-0.025em] text-foreground"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {p.title.replace(/\.$/, '')}<span className="text-brand-strong not-italic">.</span>
                </h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-foreground/75 flex-1">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Auszeichnungen · debating competitions + Speaker Slam · the
            same list Wikipedia surfaces, mirrored here so we are the
            canonical owner of the data not just the consumer. */}
        <section className="mt-20 md:mt-28">
          <div className="text-center md:text-left mb-8 md:mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
              ▸ AUSZEICHNUNGEN
            </p>
            <h2
              className="text-[24px] sm:text-[32px] md:text-[44px] leading-[1.04] tracking-[-0.03em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Sieben Debatten-Titel<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-3 text-[14px] leading-[1.55] text-foreground/65 max-w-2xl mx-auto md:mx-0">
              Von der WM in Istanbul bis zum Speaker Slam Stuttgart ·
              Wlad hat 10 Jahre im internationalen Debating-Zirkus gewonnen,
              bevor er hauptberuflich coachte.
            </p>
          </div>
          <ol className="border-t-2 border-foreground">
            {AWARDS.map((a) => (
              <li key={`${a.year}-${a.name}`} className="grid grid-cols-12 gap-4 py-4 border-b border-foreground/15 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-mono text-[14px] md:text-[16px] font-black tabular-nums text-brand-strong">
                  {a.year}
                </span>
                <span className="col-span-9 sm:col-span-6 text-[14px] md:text-[15.5px] font-bold text-foreground leading-[1.4]">
                  {a.name}
                </span>
                <span className="col-span-12 sm:col-span-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-foreground/55 sm:text-right">
                  {a.note}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Quote · the iconic one · scales down on mobile so it stays
            inside the viewport on a 375px screen without ripping the
            sentence apart at awkward break points. */}
        <section className="mt-20 md:mt-28 border-y-2 border-foreground py-14 md:py-20">
          <blockquote
            className="text-[28px] sm:text-[40px] md:text-[60px] lg:text-[72px] leading-[1.06] tracking-[-0.03em] text-foreground max-w-5xl text-center md:text-left mx-auto md:mx-0"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            „Führung ist Fähigkeit. Fähigkeit ist trainierbar.
            Wer Fähigkeit für Talent hält, lernt nie zu führen<span className="text-brand not-italic">.</span>"
          </blockquote>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-foreground/55 text-center md:text-left">
            ▸ WLAD JACHTCHENKO · METHODIK-KERNSATZ
          </p>
        </section>

        {/* Wlad's projects · LeaderOS is the featured card · the whole
            section is a conversion bridge for the 400 Masterclass alumni:
            "you know the method — here's where it lives every day". */}
        <section className="mt-20 md:mt-28">
          <div className="text-center md:text-left max-w-3xl">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
              ▸ SO ARBEITEST DU WEITER MIT WLAD
            </p>
            <h2
              className="text-[28px] sm:text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.03em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Wlads Methodik · jetzt dein System<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-4 text-[14.5px] md:text-[15.5px] leading-[1.6] text-foreground/70">
              Du kennst die Methodik aus Büchern, Masterclass oder Podcast. In
              LeaderOS drillst du sie täglich mit WladBot · 24/7, in 10 Minuten
              pro Tag, bis Führung Reflex wird statt Theorie.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            {[
              { name: 'LeaderOS',
                sub: 'KI-Coaching-Plattform · seit 2026',
                desc: 'Wlads komplette Methodik als tägliches Training. WladBot 24/7, 11 drillbare Frameworks, messbarer Fortschritt. 14 Tage kostenlos, ohne Karte.',
                href: 'https://leaderos.de/signup?trial=14',
                cta: '14 Tage kostenlos testen',
                featured: true },
              { name: 'Argumentorik-Akademie',
                sub: 'Staatlich anerkannt · seit 2014',
                desc: 'Sechs-monatige Ausbildung zum Argumentations-Coach. Mehrere tausend Absolventen.',
                href: 'https://wladjachtchenko.de',
                cta: 'wladjachtchenko.de' },
              { name: 'Wlad spricht · Podcast',
                sub: '14 Millionen Views · wöchentlich',
                desc: 'Episoden zu Führung, Rhetorik, KI im Alltag. Auf Apple Podcasts und Spotify.',
                href: 'https://podcast.wladjachtchenko.de',
                cta: 'podcast.wladjachtchenko.de' },
            ].map((p) => (
              <article
                key={p.name}
                className={
                  p.featured
                    ? 'relative border-2 border-foreground bg-brand/[0.06] p-6 md:p-7 flex flex-col shadow-[6px_6px_0_0_rgba(0,0,0,0.06)]'
                    : 'border-2 border-foreground/40 p-6 md:p-7 hover:bg-foreground/[0.03] transition-colors flex flex-col'
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 left-6 px-2.5 py-1 bg-[#BFFF00] text-[#0A0A0A] font-mono text-[9.5px] font-bold uppercase tracking-[0.2em]">
                    ★ Empfohlen für dich
                  </span>
                )}
                <h3
                  className={`${p.featured ? 'mt-2 text-[26px] md:text-[30px]' : 'text-[22px] md:text-[26px]'} leading-[1.05] tracking-[-0.025em] text-foreground`}
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {p.name}<span className="text-brand-strong not-italic">.</span>
                </h3>
                <p className="mt-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/55">
                  {p.sub}
                </p>
                <p className="mt-4 text-[14px] leading-[1.55] text-foreground/72 flex-1">
                  {p.desc}
                </p>
                {p.featured ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#BFFF00] hover:bg-foreground text-[#0A0A0A] hover:text-background font-bold text-[12px] uppercase tracking-[0.14em] transition-colors"
                  >
                    {p.cta} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-foreground hover:text-brand-strong transition-colors"
                  >
                    {p.cta} <ArrowUpRight size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Wlad Magic Box · bundled media hub (podcast + TEDx/keynotes) */}
        <div className="mt-20 md:mt-28">
          <WladMagicBox />
        </div>

        {/* Conversion band · the money moment for Masterclass/event alumni.
            Always-dark island with dotted-glow depth · the value props are
            lifted from Wlad's own event copy (charisma, natural authority,
            weniger arbeiten / mehr verdienen) and pointed at LeaderOS. */}
        <section className="relative isolate mt-20 md:mt-28 overflow-hidden bg-[#0A0A0A] text-white px-6 py-14 sm:px-10 sm:py-16 md:px-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <DottedGlowBackground
              gap={16}
              radius={1.8}
              color="rgba(255,255,255,0.22)"
              glowColor="rgba(191,255,0,0.6)"
              opacity={0.5}
            />
          </div>
          <div className="max-w-3xl">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5">
              ▸ Aus der Masterclass? Mach weiter.
            </p>
            <h2
              className="text-[30px] sm:text-[42px] md:text-[58px] leading-[1.0] tracking-[-0.03em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Führen wie die<br />Top 1 %<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-6 text-[15px] sm:text-[17px] leading-[1.6] text-white/75">
              Natürliche Autorität, charismatische Ausstrahlung, Teams die von
              allein Verantwortung übernehmen · weniger arbeiten, mehr bewirken.
              Genau die Methodik, die Wlad DAX-Vorständen für 10.000 € Tagessatz
              vermittelt · in LeaderOS drillst du sie täglich mit WladBot, für
              den Preis eines Mittagessens.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3">
              <a
                href="https://leaderos.de/signup?trial=14"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                14 Tage kostenlos testen <ArrowUpRight size={15} />
              </a>
              <a
                href="https://leadercheck.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 border-2 border-white/30 hover:border-brand text-white hover:text-brand font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                Erst den Leader-Check · 10 Min
              </a>
            </div>
            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/40">
              14 Tage kostenlos · ohne Karte · jederzeit kündbar
            </p>
          </div>
        </section>

        {/* Press / journalists · the surface that journalists Google-and-cite */}
        <section className="mt-20 md:mt-28 bg-foreground text-background p-6 sm:p-8 md:p-12">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center text-center md:text-left">
            <div className="md:col-span-7">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4 font-mono">
                ▸ PRESSE · JOURNALISTEN
              </p>
              <h2
                className="text-[24px] sm:text-[28px] md:text-[40px] leading-[1.04] tracking-[-0.025em]"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Pressefotos, Bio, Sprecher-Anfragen<span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-4 text-[14.5px] leading-[1.6] text-background/75 mx-auto md:mx-0">
                Für Interviews, Keynotes oder Hintergrundgespräche · einfach Mail an
                start@aiporate.com. Bio in zwei Längen, Pressefoto in 4K, und ein
                kuratierter Zitat-Pool stehen auf Anfrage bereit.
              </p>
            </div>
            <div className="md:col-span-5 md:text-right">
              <a
                href="mailto:start@aiporate.com?subject=Presse-Anfrage%20zu%20Wlad%20Jachtchenko"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                Presse-Anfrage senden
              </a>
            </div>
          </div>
        </section>

        {/* Entity-disambiguation lives in the Person JSON-LD's alternateName
            field (machine-readable, helps search engines resolve variant
            spellings) · we do not surface the variants visually anymore
            because brand discipline requires a single canonical
            wordmark on screen: "Wlad Jachtchenko". */}

        {/* Viral surface · readers landing on this page are doing
            authority-research about Wlad · the moment they finish
            reading is exactly when LinkedIn-share intent peaks. */}
        <ShareBar
          url="https://leader-os.de/wlad-jachtchenko"
          title="Wlad Jachtchenko · Argumentations-Coach · 3× SPIEGEL-Bestseller"
          summary="Europas führender Argumentations-Coach. Fünfzehn Jahre Coaching-Praxis. Gründer der Argumentorik-Akademie und LeaderOS."
          slug="wlad-jachtchenko"
        />
      </main>

      <LandingFooter />
    </div>
  );
}

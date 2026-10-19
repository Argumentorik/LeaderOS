/**
 * webinarEvent · die eine Quelle für Termin und Agenda des Live-Webinars.
 *
 * /webinar und /ki-fuehrungskraft zeigen dieselbe Veranstaltung. Damit
 * keine Landing etwas verspricht, das die andere (oder das Webinar selbst)
 * nicht hält, leben Termin und Agenda nur hier. Backend-Gegenstück:
 * WEBINAR_DATE_ISO in backend/routes/webinar.py — bei Verschiebung beide
 * ändern.
 *
 * Pure ES module ohne Imports: scripts/prerender-landings.mjs lädt diese
 * Datei direkt in Node.
 */

export const WEBINAR_START = '2026-10-29T10:00:00+01:00';
export const WEBINAR_END = '2026-10-29T11:30:00+01:00';
export const WEBINAR_TS = new Date(WEBINAR_START).getTime();
export const WEBINAR_DATE_LABEL = 'Do, 29. Oktober 2026';
export const WEBINAR_TIME_LABEL = '10:00–11:30 Uhr';
export const WEBINAR_CAMPAIGN = 'webinar-2026-10-29';

/** Seitentitel und Beschreibung von /webinar — identisch im SPA (applyPageMeta)
 * und im Build-Prerendering, damit Crawler und Browser dasselbe sehen. */
export const WEBINAR_SEO = {
  title: 'Kostenloses Live-Webinar · Trainiere Führung. Nicht nur Wissen. · LeaderOS',
  description:
    'Du weißt, wie gute Führung geht — du kommst nur nicht dazu. Live-Webinar am 29.10.2026 mit ' +
    'Wlad Jachtchenko (3× SPIEGEL-Bestseller): das erste Leadership Operating System, das Führung ' +
    'täglich in 15 Minuten trainierbar macht statt einmal im Jahr im Seminar. Kostenlos, live, mit Q&A.',
  url: 'https://leader-os.de/webinar',
  image: 'https://leader-os.de/og-wlad.jpg',
};

export const WEBINAR_HERO = {
  h1: 'Trainiere Führung.',
  h1Accent: 'Nicht nur Wissen.',
  sub:
    'Du weißt, wie gute Führung geht. Du kommst nur nicht dazu. In 90 Minuten zeigt Wlad Jachtchenko live, ' +
    'wie Führungskräfte Gespräche, Feedback und Entscheidungen täglich trainieren statt einmal im Jahr im Seminar zu hören.',
};

/** FAQ · wortgleich im Accordion (/webinar) und im FAQPage-Schema. */
export const FAQ = [
  ['Kostet das etwas?', 'Nein. Das Webinar ist komplett kostenlos — keine Karte, kein Haken. Du brauchst nur deine E-Mail.'],
  ['Wie lange dauert es?', '90 Minuten — von 10:00 bis etwa 11:30 Uhr, inklusive Live-Q&A.'],
  ['Gibt es eine Aufzeichnung?', 'Nein, das Webinar ist live. Genau deshalb lohnt es sich: du kannst deine Fragen direkt im Q&A stellen.'],
  ['Brauche ich Vorkenntnisse?', 'Nein. Für Führungskräfte und alle, die es werden wollen — Teamleads, Projektmanager, Senior-Experten. Keine KI-Vorkenntnisse nötig.'],
  ['Kann ich Fragen stellen?', 'Ja — das Q&A ist fester Teil der Agenda (ab 11:15 Uhr). Wlad beantwortet live.'],
  ['Was ist ein Leadership Operating System?', 'Ein Trainingssystem, das Führung täglich übt statt einmal im Jahr zu lehren: Kurse mit Wlads Frameworks, ein KI-Coach (WladBot), Simulationen mit einem Gegenüber, das zurückredet, und 15-Minuten-Drills an deinem echten Fall.'],
];

export const AGENDA = [
  ['10:00', 'Check-in & Warm-up', 'Kurz ankommen — worum es in den nächsten 90 Minuten geht.'],
  ['10:05', 'Der Charisma-Code live', 'Präsenz · Wärme · Kompetenz — die drei Signale, in Echtzeit demonstriert.'],
  ['10:25', 'Das Leadership Operating System', 'Wie WladBot, tägliche Drills und die 11 Frameworks zusammenspielen.'],
  ['10:55', 'Live-Case aus der Community', 'Eine echte Führungssituation, gemeinsam durchgearbeitet.'],
  ['11:15', 'Q&A mit Wlad', 'Deine Fragen, direkt beantwortet.'],
];

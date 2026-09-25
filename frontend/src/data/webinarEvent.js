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

export const AGENDA = [
  ['10:00', 'Check-in & Warm-up', 'Kurz ankommen — worum es in den nächsten 90 Minuten geht.'],
  ['10:05', 'Der Charisma-Code live', 'Präsenz · Wärme · Kompetenz — die drei Signale, in Echtzeit demonstriert.'],
  ['10:25', 'Das Leadership Operating System', 'Wie WladBot, tägliche Drills und die 11 Frameworks zusammenspielen.'],
  ['10:55', 'Live-Case aus der Community', 'Eine echte Führungssituation, gemeinsam durchgearbeitet.'],
  ['11:15', 'Q&A mit Wlad', 'Deine Fragen, direkt beantwortet.'],
];

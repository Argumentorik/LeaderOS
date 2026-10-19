/**
 * wladProfile · die Fakten der Person-Seite /wlad-jachtchenko als Daten.
 *
 * Nur belegte Aussagen (docs/gtm/WLAD_CANON.md und das verifizierte Set in
 * docs/gtm/WEBINAR_FUNNEL.md): 3× SPIEGEL-Bestseller, seit 2007, 400.000+
 * Klienten, 20+ Länder, Trustpilot 4,9 / 388, geboren 1985 in Dnipro, LMU
 * und Columbia. Bewusst keine Gesamtzahl der Bücher, keine Reichweiten-
 * Zahlen (14 Mio. Views, Käuferzahlen), bis der Kanon sie führt.
 *
 * Pure ES-Modul ohne React-Imports: scripts/prerender-landings.mjs lädt es
 * in Node und rendert /wlad-jachtchenko als statisches HTML, damit Suchen
 * nach dem Namen auf leader-os.de landen und Antwort-Maschinen die Seite
 * ohne JavaScript lesen. Die Bücher kommen aus wladBookshelf.js.
 */
import { BOOKSHELF } from './wladBookshelf.js';

export const PATH = '/wlad-jachtchenko';
export const PAGE_URL = `https://leader-os.de${PATH}`;
export const OG_IMAGE = 'https://leader-os.de/og-wlad.jpg';
export const PORTRAIT = 'https://leader-os.de/wlad/wlad-portrait.jpg';

export const SEO = {
  title: 'Wlad Jachtchenko · Argumentations-Coach, 3× SPIEGEL-Bestseller-Autor, Gründer von LeaderOS',
  description:
    'Wlad Jachtchenko: Rhetorik-Trainer und Leadership-Coach seit 2007, dreifacher SPIEGEL-Bestseller-Autor, Gründer der ' +
    'Argumentorik-Akademie und des Trainingssystems LeaderOS. Biografie, Bücher, Methodik, Webinar und Kontakt.',
};

export const ALSO_CALLED = ['Wladislaw Jachtchenko', 'Wlad Jachtschenko', 'Vladimir Jachtchenko', 'Vlad Yachtchenko'];

/** Erster Absatz = die Antwort auf „Wer ist Wlad Jachtchenko?“ */
export const LEDE =
  'Wlad Jachtchenko (Wladislaw Jachtchenko, geboren 1985 in Dnipro) ist Rhetorik-Trainer, Leadership-Coach und ' +
  'dreifacher SPIEGEL-Bestseller-Autor. Er ist Volljurist, hat in München und an der Columbia University in New York ' +
  'studiert und trainiert seit 2007 Führungskräfte, inzwischen über 400.000 Klienten in mehr als 20 Ländern. Er ist ' +
  'Gründer der Argumentorik-Akademie und des Trainingssystems LeaderOS. Die Schreibweise ist immer Wlad mit W.';

export const BIO = [
  'Geboren am 11. Januar 1985 in Dnipro, aufgewachsen in Deutschland. Studium der Politikwissenschaft, Jura, Geschichte ' +
    'und Literaturwissenschaft an der LMU München und an der Columbia University in New York (Master of Arts). Volljurist, ' +
    'ehemals Assistent bei den Vereinten Nationen.',
  'Seit 2007 als Speaker, Rhetorik-Trainer und Leadership-Coach tätig. Seine Methodik hat er in Büchern wie „Weiße ' +
    'Rhetorik“, „Dunkle Rhetorik“ und „Die 5 Rollen einer Führungskraft“ festgehalten und in der Argumentorik-Akademie, ' +
    'einer sechsmonatigen Ausbildung zum Argumentations-Coach, weitergegeben.',
  'Mit LeaderOS hat er diese Methodik 2026 in ein Trainingssystem übersetzt: zehn Kurse, der KI-Coach WladBot, ' +
    'Simulationen mit einem Gegenüber, das zurückredet, und tägliche 15-Minuten-Drills. Sein Satz dazu: Führung wird ' +
    'nicht gelernt, sie wird trainiert.',
];

export const FACTS = [
  ['Geboren', '11. Januar 1985 · Dnipro'],
  ['Beruf', 'Rhetorik-Trainer · Leadership-Coach · Autor · Gründer'],
  ['Bildung', 'LMU München · Columbia University, New York (M.A.) · Volljurist'],
  ['Coaching seit', '2007'],
  ['Klienten', '400.000+ in 20+ Ländern'],
  ['Bücher', '3× SPIEGEL-Bestseller: Weiße Rhetorik · Redest du noch, oder überzeugst du schon? · Die Kraft der Positiven Psychologie'],
  ['Bewertungen', 'Trustpilot 4,9 / 5 · 388 Bewertungen (Argumentorik)'],
  ['Gegründet', 'Argumentorik-Akademie · LeaderOS (2026)'],
];

/** Kern-Frameworks mit kanonischer Definition (Kurzform; Deep-Dives unter /fragen und im Journal). */
export const FRAMEWORKS = [
  ['SEXIER-Modell', 'Statement, Explanation, eXample, Impact, Explanation of Impact, Rebuttal: sechs Schritte für ein vollständiges Argument (aus „Weiße Rhetorik“).', '/fragen#f05'],
  ['Feedbackformel B·W·W', 'Beobachtung, Wirkung, Wunsch. Nie „Du bist …“, immer „Ich habe beobachtet, dass …“.', '/fragen#f06'],
  ['Die 5 Rollen einer Führungskraft', 'Kommunikator, Manager, Team-Leader, Psychologe, Problemlöser.', '/fragen#f07'],
  ['Die 10 Stufen des Zuhörens', 'Von „Nicht zuhören“ bis „Stille als Zuhören“; 80 Prozent aller Führungskräfte bleiben auf Stufe 2, dem Warten auf die eigene Antwort.', '/journal/die-10-stufen-des-zuhoerens-wlads-modell-erklaert'],
  ['Charisma-Code', 'Präsenz, Wärme, Kompetenz: die drei Signale, die ein Raum in Sekunden dekodiert.', '/journal/charisma-code-drei-signale-die-den-raum-entscheiden'],
  ['Dunkle Rhetorik erkennen', 'Strohmann, Ad hominem, Whataboutism, Scheinargumente: erkennen und kontern. Hart in der Sache, weich zur Person.', '/journal/dunkle-rhetorik-erkennen-und-abwehren'],
];

export const BOOKS = BOOKSHELF;

export const SAME_AS = [
  'https://de.wikipedia.org/wiki/Wladislaw_Jachtchenko',
  'https://www.linkedin.com/in/wladislawjachtchenko',
  'https://www.instagram.com/wlad.jachtchenko/',
  'https://www.youtube.com/@WladTraining',
  'https://wlad-jachtchenko.com',
  'https://argumentorik.com',
  'https://www.linkedin.com/learning/instructors/wladislaw-jachtchenko',
  'https://www.udemy.com/user/wladislaw-jachtchenko/',
  'https://podcast.wladjachtchenko.de',
  'https://www.ted.com/speakers/wladislaw_jachtchenko',
  'https://greator.com/coach/wlad-jachtchenko',
  'https://uk.trustpilot.com/review/argumentorik.com',
  'https://d-nb.info/gnd/1172244065',
];

export const KNOWS_ABOUT = [
  'Rhetorik', 'Argumentation', 'Führungskräfte-Coaching', 'Verhandlungsführung', 'Dunkle Rhetorik', 'Weiße Rhetorik',
  'Schlagfertigkeit', 'Körpersprache', 'Emotionale Intelligenz', 'Positive Psychologie', 'Die 5 Rollen einer Führungskraft',
  'KI für Führungskräfte', 'Harvard-Verhandlungsmethode', 'Kommunikationsquadrat nach Schulz von Thun',
];

/** Wo man Wlad erlebt · interne Pfade, die Crawler ohne JS verfolgen. */
export const WHERE = [
  ['/webinar', 'Kostenloses Live-Webinar am 29. Oktober 2026', '90 Minuten live: Charisma-Code, das Leadership Operating System, ein echter Führungsfall, Q&A.'],
  ['/kurse', 'Die Kurse in LeaderOS', 'Sechs Grundlagen-Kurse ab Tag 1, vier Master-Programme im OS-Jahr, elf Framework-Drills.'],
  ['/fragen', 'Fragen & Frameworks', 'Die kanonischen Definitionen von SEXIER, Feedbackformel und den 5 Rollen, kurz und zitierbar.'],
  ['/journal/wer-ist-wlad-jachtchenko', 'Wer ist Wlad Jachtchenko? (Journal)', 'Die ausführliche Feldnotiz zu Werdegang und Methodik.'],
  ['/journal/5-rollen-der-fuehrung-nach-wlad-jachtchenko', 'Die 5 Rollen der Führung', 'Das Kern-Framework aus seinem Buch, erklärt.'],
  ['/kommunikation', 'Kommunikations-Training', 'Überzeugen ist ein System: Rhetorik und Gesprächsführung als Training.'],
];

export const FAQ = [
  ['Wer ist Wlad Jachtchenko?', LEDE],
  ['Welche Bücher hat Wlad Jachtchenko geschrieben?',
    'Drei seiner Bücher sind SPIEGEL-Bestseller: „Weiße Rhetorik“ (Goldmann), „Redest du noch, oder überzeugst du schon?“ und „Die Kraft der Positiven Psychologie“ (beide Remote Verlag). Weitere Titel sind „Die 5 Rollen einer Führungskraft“, „Dunkle Rhetorik“, „Die charismatische Führungskraft“, „Manipuliere dich glücklich“, „Werde Menschenmagnet“, „Die Körpersprache als Spiegelbild deiner Seele“ und „Führen durch Gründe“ (mit Prof. Dr. Julian Nida-Rümelin).'],
  ['Was ist die Argumentorik-Akademie?',
    'Die Argumentorik-Akademie ist die von Wlad Jachtchenko gegründete sechsmonatige Ausbildung zum Argumentations-Coach. Sie steht hinter den Trainings, auf denen LeaderOS aufbaut.'],
  ['Was ist LeaderOS, und welche Rolle spielt Wlad Jachtchenko?',
    'LeaderOS ist das 2026 von Wlad Jachtchenko gegründete Trainingssystem für Führungskräfte: zehn Kurse mit seiner Methodik, der KI-Coach WladBot, der auf 2 212 authentischen Wlad-Inhalten aus Büchern, Podcasts und Trainings antwortet, Simulationen und tägliche Drills. Wlad ist Gründer, Autor der Methodik und Gastgeber der monatlichen Live-Sessions.'],
  ['Welche Methodik vertritt Wlad Jachtchenko?',
    'Führung wird nicht gelernt, sie wird trainiert. Statt Theorie drillbare Frameworks: das SEXIER-Modell, die Feedbackformel B·W·W, die 5 Rollen einer Führungskraft, die 10 Stufen des Zuhörens, die Harvard-Verhandlungsmethode, der Charisma-Code und die Abwehr Dunkler Rhetorik. Hart in der Sache, weich zur Person.'],
  ['Wo kann man Wlad Jachtchenko live erleben?',
    'Im kostenlosen Live-Webinar am Donnerstag, 29. Oktober 2026, 10:00 bis 11:30 Uhr (leader-os.de/webinar), in den monatlichen Live-Sessions für Mitglieder von LeaderOS und in seinen Keynotes. Speaker- und Kooperationsanfragen: start@aiporate.com (Argumentorik-Akademie GmbH, Berlin).'],
  ['Wann und wo wurde Wlad Jachtchenko geboren?',
    'Am 11. Januar 1985 in Dnipro. Er wuchs in Deutschland auf, studierte in München an der LMU und in New York an der Columbia University (Master of Arts).'],
];

/**
 * kiFuehrungskraft · Inhalt der Landing /ki-fuehrungskraft.
 *
 * Eine Quelle für zwei Ausgaben:
 *   - src/pages/KiFuehrungskraftPage.js  (React, was Besucher sehen)
 *   - scripts/prerender-landings.mjs     (statisches HTML + JSON-LD, was
 *     Google, Bing und die Antwort-Crawler ohne JavaScript lesen)
 * FAQPage-Schema muss wortgleich zum sichtbaren Text sein — deshalb
 * schreiben beide aus denselben Strings. Hier ändern, nie in einer Ausgabe.
 *
 * Regeln (docs/gtm/WEBINAR_FUNNEL.md, docs/gtm/WLAD_CANON.md):
 *   - Jede Zahl aus dem verifizierten Set: 400.000+ Klienten seit 2007,
 *     20+ Länder, 3× SPIEGEL-Bestseller, Trustpilot 4,9 / 388.
 *     Keine Buchanzahl (Canon 13 vs. Greator-Seite 12 — ungeklärt).
 *   - Jedes Kampagnen-Versprechen ist durch einen Agenda-Punkt des
 *     Webinars (src/data/webinarEvent.js) oder eine echte LeaderOS-
 *     Funktion gedeckt. Matrix: docs/gtm/KI_FUEHRUNG_KAMPAGNEN.md.
 *
 * Pure ES module: nur relative Imports mit .js-Endung, damit Node die
 * Datei im Build direkt laden kann.
 */
import { AGENDA, WEBINAR_DATE_LABEL, WEBINAR_TIME_LABEL } from './webinarEvent.js';

export const PATH = '/ki-fuehrungskraft';
export const PAGE_URL = `https://leader-os.de${PATH}`;
export const OG_IMAGE = 'https://leader-os.de/og-ki-fuehrungskraft.jpg';

export const SEO = {
  title: 'KI-Führungskraft werden: Führen mit KI · Live-Webinar mit Wlad Jachtchenko',
  description:
    'KI ersetzt keine Führungskraft – eine Führungskraft mit KI schon. Wie du mit KI-Coach und täglichem ' +
    'Training Gespräche vorbereitest, überzeugst und dein Team führst. Kostenloses Live-Webinar am 26.11.2026.',
};

export const OFFER = {
  label: 'Kostenloses Live-Webinar',
  date: WEBINAR_DATE_LABEL,
  time: WEBINAR_TIME_LABEL,
  facts: ['Online', 'Kostenlos', 'Keine Aufzeichnung', '90 Minuten'],
  cta: 'Kostenlos anmelden',
};

/**
 * Sechs Kampagnen, eine Seite. Die Anzeige verlinkt ?k=<key>; Hero,
 * hervorgehobene Karte und Lead-Quelle folgen dem Schlüssel. Ohne oder mit
 * unbekanntem k gilt `ki`. Canonical bleibt immer die nackte URL.
 */
export const CAMPAIGNS = {
  ki: {
    bib: 'K·01 · Manifest',
    eyebrow: 'Die neue Wahrheit über Führung',
    h1: 'KI ersetzt keine Führungskraft.',
    h1Accent: 'Eine Führungskraft mit KI schon.',
    sub: 'Wlad Jachtchenko zeigt live, wie du KI für Vorbereitung und Training nutzt – und die Fähigkeiten stärkst, die keine KI ersetzt: überzeugen, Orientierung geben, Konflikte lösen.',
  },
  zeit: {
    bib: 'K·02 · Zeit',
    eyebrow: 'Gespräche vorbereiten mit KI',
    h1: 'Vorbereitet in Minuten.',
    h1Accent: 'Nicht in Stunden.',
    sub: 'Feedback, Gehaltsgespräch, Board-Präsentation: Der KI-Coach baut dein Gespräch nach Wlads SEXIER-Modell auf – Kontext, Argumente, Gegenseite, Coaching.',
  },
  gespraech: {
    bib: 'K·03 · Gespräche',
    eyebrow: 'Schwierige Gespräche mit KI trainieren',
    h1: 'Das schwierige Gespräch.',
    h1Accent: 'Geprobt, bevor es passiert.',
    sub: 'Low Performer, Konflikt im Team, Kritik an die Chefin: In der Simulation spielst du es mit dem KI-Coach durch – mit Einwänden und Gegenwind. Danach weißt du, welcher Satz trägt.',
  },
  wirkung: {
    bib: 'K·04 · Wirkung',
    eyebrow: 'Der Charisma-Code, live demonstriert',
    h1: 'Überzeugen, ohne lauter zu werden.',
    h1Accent: 'Präsenz. Wärme. Kompetenz.',
    sub: 'Drei Signale entscheiden in Sekunden, ob ein Raum dir folgt. Am 26. November zeigt Wlad den Charisma-Code live – und die KI-Videoanalyse zeigt dir danach, wo du stehst.',
  },
  team: {
    bib: 'K·05 · Team',
    eyebrow: 'Feedback und Delegation mit System',
    h1: 'Weniger Rückfragen.',
    h1Accent: 'Mehr Verantwortung im Team.',
    sub: 'Delegieren, Erwartungen klären, Feedback geben, das ankommt: mit der Feedbackformel Beobachtung · Wirkung · Wunsch und einem KI-Coach, der dein nächstes 1:1 mit dir vorbereitet.',
  },
  aufstieg: {
    bib: 'K·06 · Aufstieg',
    eyebrow: 'Für alle, die Führungskraft werden wollen',
    h1: 'Vom Leistungsträger',
    h1Accent: 'zur offensichtlichen Wahl.',
    sub: 'Du lieferst, aber niemand sieht es? Lerne die 5 Rollen einer Führungskraft, trainiere sie täglich mit KI – und mach deinen Beitrag sichtbar, bevor die nächste Stelle vergeben wird.',
  },
};
export const DEFAULT_CAMPAIGN = 'ki';
export const campaignFor = (k) => (k && CAMPAIGNS[k] ? k : DEFAULT_CAMPAIGN);

export const SHIFTS = [
  ['Aufgaben verschwinden', 'Vorbereitung, Analyse, erste Entwürfe: Was früher Stunden gekostet hat, erledigt KI heute in Minuten.'],
  ['Erwartungen steigen', 'Wer führt, muss zeigen, dass Menschen und Ergebnisse durch die eigene Führung messbar besser werden.'],
  ['Neue Gewinner entstehen', 'Wer Menschenführung und KI verbindet, wird sichtbarer, wertvoller und schwerer zu ersetzen.'],
];

export const SPLIT = {
  question: 'Was übernimmt KI in der Führung – und was nicht?',
  answer:
    'KI übernimmt Vorbereitung, Analyse und Entwürfe. Nicht übernehmen kann sie, was Führung im Kern ausmacht: ' +
    'Menschen überzeugen, Orientierung geben, Konflikte lösen und ein Team durch Veränderung führen. Die ' +
    'Führungskraft der Zukunft beherrscht beides – sie nutzt KI als Werkzeug und trainiert die menschlichen ' +
    'Fähigkeiten, die dadurch wertvoller werden.',
  ki: ['Gespräche strukturieren', 'Argumente und Einwände durchspielen', 'Feedback vorformulieren', 'Entscheidungen vorbereiten', 'Reden und Auftritte analysieren'],
  du: ['Menschen überzeugen', 'Orientierung geben', 'Konflikte lösen', 'Vertrauen aufbauen', 'Durch Veränderung führen'],
};

/** Eine Karte pro Kampagne — dieselbe Reihenfolge wie CAMPAIGNS. */
export const OUTCOMES = [
  { key: 'ki', title: 'Ein System statt Seminar-Notizen', desc: 'Methodik, KI-Coach und tägliches Training in einem System – 15 Minuten am Tag, an deinen echten Fällen.', tool: 'LeaderOS', fw: '11 Frameworks', img: '/wlad/wladbot3.0.webp', fit: 'avatar' },
  { key: 'zeit', title: 'Minuten statt Stunden', desc: 'Der KI-Coach strukturiert dein nächstes Gespräch: Kontext, Argumente, Gegenseite, Coaching.', tool: 'Gespräch vorbereiten', fw: 'SEXIER-Modell', img: '/wlad/books/weisse-rhetorik.jpg', fit: 'book' },
  { key: 'gespraech', title: 'Proben statt hoffen', desc: 'Realistische Führungssituationen durchspielen, bevor sie im echten Meeting passieren – mit Feedback danach.', tool: 'Simulationen', fw: 'Hart in der Sache, weich zur Person', img: '/wlad/books/redest-du-noch-oder-ueberzeugst-du-schon.jpg', fit: 'book' },
  { key: 'wirkung', title: 'Präsenz, die trägt', desc: 'Rede aufnehmen, hochladen, auswerten lassen: drei Stärken, drei Hebel – nach Wlads Frameworks.', tool: 'Video-Analyse', fw: 'Charisma-Code', img: '/wlad/books/die-charismatische-fuehrungskraft.jpg', fit: 'book' },
  { key: 'team', title: 'Ein Team, das mitdenkt', desc: 'Delegation und Feedback vorbereiten, die Verantwortung übertragen statt Rückfragen erzeugen.', tool: '1:1-Vorbereitung', fw: 'Feedbackformel B-W-W', img: '/wlad/books/die-5-rollen-einer-fuehrungskraft.jpg', fit: 'book' },
  { key: 'aufstieg', title: 'Sichtbar werden', desc: 'Die 5 Rollen einer Führungskraft trainieren – 30 Tage, jeden Tag eine Aufgabe, Fortschritt schwarz auf weiß.', tool: '30-Tage-Challenge', fw: 'Die 5 Rollen', img: '/wlad/wlad-portrait-640.jpg', fit: 'cover' },
];

export const AUDIENCES = [
  {
    bib: 'A · Nachwuchs',
    title: 'Du willst Führungskraft werden',
    lead: 'Vom unsichtbaren Leistungsträger zur offensichtlichen Wahl.',
    points: ['Die 5 Rollen einer Führungskraft kennen und trainieren', 'KI als Vorsprung in Vorbereitung und Analyse nutzen', 'Beförderungs- und Gehaltsgespräch strukturiert vorbereiten'],
  },
  {
    bib: 'B · Führung',
    title: 'Du führst bereits',
    lead: 'Vom operativen Engpass zur Führungskraft, die trainiert statt improvisiert.',
    points: ['Schwierige Gespräche vorbereiten und vorher proben', 'Feedback geben, das ankommt und Verantwortung überträgt', 'Die eigene Wirkung messen – und gezielt verbessern'],
  },
];

export { AGENDA };

export const HOST = {
  name: 'Wlad Jachtchenko',
  role: 'Leadership-Trainer · dreifacher SPIEGEL-Bestseller-Autor',
  bio:
    'Seit 2007 trainiert Wlad Jachtchenko Führungskräfte – über 400.000 Klienten in mehr als 20 Ländern. ' +
    'Volljurist, Columbia-Absolvent, ehemals bei der UNO, Gründer der Argumentorik-Akademie. Mit LeaderOS hat er ' +
    'seine Methodik in ein System übersetzt, das nicht einmal inspiriert, sondern jeden Tag trainiert.',
  clients: ['Allianz', 'BMW', 'Siemens', 'Telekom', 'Lufthansa', 'Bosch', 'Vodafone', 'Generali'],
};

export const STATS = [
  ['400.000+', 'Klienten seit 2007'],
  ['20+', 'Länder'],
  ['3×', 'SPIEGEL-Bestseller'],
  ['4,9 / 5', 'Trustpilot · 388 Bewertungen'],
];

/** Überschriften echter, öffentlicher Trustpilot-Bewertungen zu Wlads Trainings. */
export const REVIEWS = [
  ['Kompetenz auf höchstem Niveau.', 'Leo', 'Live-Webinar', '6. Juni 2026'],
  ['Ein sehr inspirierendes Webinar mit wertvollen Impulsen für Führungskräfte.', 'Christina Lenschmidt', 'Webinar für Führungskräfte', '7. Februar 2026'],
  ['Großartig – unbedingt empfehlenswert!', 'Paul Karl Gilke', '2-Tage-Führungskräfte-Event', '2. Februar 2026'],
  ['Authentisch, inspirierend und professionell.', 'Herr Schlunken', 'Coaching', '6. Juni 2026'],
];
export const TRUSTPILOT_URL = 'https://uk.trustpilot.com/review/argumentorik.com';

/** Antwort zuerst: der erste Satz beantwortet die Frage vollständig (AEO). */
export const FAQ = [
  ['Ersetzt KI Führungskräfte?', 'Nein. KI ersetzt Aufgaben, nicht Führung: Vorbereitung, Analyse und Entwürfe erledigt sie in Minuten. Menschen überzeugen, Orientierung geben und Konflikte lösen kann sie nicht. Ersetzbar wird, wer weiterführt wie bisher – Führungskräfte, die KI gezielt nutzen, überholen die, die es nicht tun.'],
  ['Was ist eine KI-Führungskraft?', 'Eine KI-Führungskraft nutzt KI als Werkzeug für Vorbereitung, Analyse und Training – und investiert die gewonnene Zeit in das, was nur Menschen können: überzeugen, Vertrauen aufbauen und ein Team durch Veränderung führen. Sie arbeitet nicht mehr, sondern trainiert gezielter.'],
  ['Wie nutzen Führungskräfte KI im Alltag?', 'Am wirksamsten in vier Situationen: Gespräche vorbereiten (Argumente, Einwände, Formulierungen), schwierige Gespräche vorher simulieren, Feedback nach einer klaren Formel vorformulieren und die eigene Wirkung analysieren lassen, etwa eine Rede per Video. In LeaderOS übernimmt das der KI-Coach WladBot, ergänzt um kurze tägliche Drills.'],
  ['Was ist LeaderOS?', 'LeaderOS ist das KI-Leadership-Betriebssystem von Wlad Jachtchenko: seine Frameworks – darunter das SEXIER-Modell, die Feedbackformel und die 5 Rollen einer Führungskraft –, ein KI-Coach, der sie exakt so anwendet, und tägliches Training mit Simulationen und einer 30-Tage-Challenge.'],
  ['Was passiert im Live-Webinar am 26. November?', 'In 90 Minuten demonstriert Wlad den Charisma-Code live, zeigt, wie KI-Coach, tägliche Drills und die 11 Frameworks zusammenspielen, arbeitet einen echten Führungsfall durch und beantwortet deine Fragen im Q&A.'],
  ['Brauche ich technisches Wissen oder KI-Vorkenntnisse?', 'Nein. Du brauchst keine KI-Vorkenntnisse und kein technisches Wissen. Wenn du eine E-Mail schreiben kannst, kannst du den KI-Coach nutzen – er fragt nach, was er wissen muss.'],
  ['Muss ich bereits Führungskraft sein?', 'Nein. Das Webinar ist für Führungskräfte und für alle, die es werden wollen – Teamleads, Projektleitungen und Senior-Experten, die den nächsten Schritt vorbereiten.'],
  ['Was kostet die Teilnahme, und gibt es eine Aufzeichnung?', 'Die Teilnahme ist kostenlos, ohne Kreditkarte. Eine Aufzeichnung gibt es nicht: Das Webinar ist bewusst live, damit du deine Fragen direkt im Q&A stellen kannst.'],
];

/** Themen-Cluster „KI-Leadership": die Landing ist die Pillar-Seite dafür. */
export const READING = [
  ['/journal/ki-leadership-was-bedeutet-das-konkret', 'KI Leadership: was bedeutet das konkret?'],
  ['/journal/was-ist-eine-ki-native-fuehrungskraft', 'Was ist eine KI-native Führungskraft?'],
  ['/journal/ki-im-fuehrungs-alltag-drei-use-cases', 'KI im Führungsalltag: drei Use Cases, die heute schon funktionieren'],
  ['/journal/mitarbeitergespraech-vorbereiten-mit-ki', 'Mitarbeitergespräch vorbereiten – mit KI in 12 Minuten'],
  ['/journal/1-zu-1s-im-ki-zeitalter-was-bots-nicht-koennen', '1:1s im KI-Zeitalter: was Bots nicht können'],
  ['/journal/die-5-rollen-einer-ki-nativen-fuehrungskraft', 'Die 5 Rollen einer KI-nativen Führungskraft'],
];

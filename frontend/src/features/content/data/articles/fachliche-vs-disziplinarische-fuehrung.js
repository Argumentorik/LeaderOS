/**
 * Pillar · "fachliche Führung" + "disziplinarische Führung". Two
 * separate high-intent keywords, constantly confused → one article
 * that owns both by clarifying the distinction.
 */
export default {
  slug: 'fachliche-vs-disziplinarische-fuehrung',
  type: 'guide',
  status: 'published',
  title: 'Fachliche und disziplinarische Führung.',
  description:
    'Der Unterschied klar erklärt · wer was darf, wann beides ' +
    'zusammenfällt, und wie du als fachliche Führungskraft ohne ' +
    'disziplinarische Macht trotzdem führst.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-29',
  cover: null,
  tags: ['Führung', 'Fachliche Führung', 'Disziplinarische Führung', 'Methoden'],
  seo: {
    title: 'Fachliche vs. disziplinarische Führung: Unterschied',
    description:
      'Fachliche vs. disziplinarische Führung einfach erklärt: wer welche ' +
      'Befugnisse hat, wann beides zusammenfällt und wie du ohne ' +
      'Weisungsbefugnis trotzdem führst. Von Wlad Jachtchenko.',
    keywords: [
      'fachliche Führung',
      'disziplinarische Führung',
      'fachliche vs disziplinarische Führung',
      'fachliche Führung Definition',
      'disziplinarische Führung Definition',
      'Unterschied fachliche disziplinarische Führung',
      'fachliche Führungskraft',
      'disziplinarischer Vorgesetzter',
      'Führungsverantwortung',
    ],
    canonical: 'https://leader-os.de/journal/fachliche-vs-disziplinarische-fuehrung',
    ogImage: 'https://leader-os.de/og-wlad.jpg',
    ogImageAlt: 'Fachliche vs. disziplinarische Führung · Unterschied · LeaderOS',
  },
  body: [
    { type: 'paragraph', text:
      'Fachliche Führung und disziplinarische Führung sind zwei verschiedene Arten von Führungsverantwortung · und sie werden ständig verwechselt. Kurz: Fachliche Führung steuert das WAS und WIE der Arbeit. Disziplinarische Führung steuert das ARBEITSVERHÄLTNIS der Person. Manchmal liegt beides bei einer Person, oft ist es geteilt.' },
    { type: 'heading', level: 2, text: 'Was ist disziplinarische Führung?' },
    { type: 'paragraph', text:
      'Die disziplinarische Führungskraft ist die formale Vorgesetzte einer Person · der Chef im arbeitsrechtlichen Sinn. Sie entscheidet über Themen, die das Arbeitsverhältnis betreffen.' },
    { type: 'list', style: 'bullet', items: [
      'Einstellung, Versetzung, Kündigung',
      'Gehalt, Bonus, Beförderung',
      'Urlaubsfreigabe, Arbeitszeit, Home-Office-Regelung',
      'Leistungsbeurteilung mit arbeitsrechtlicher Konsequenz',
      'Weisungsrecht im rechtlichen Sinn',
    ] },
    { type: 'heading', level: 2, text: 'Was ist fachliche Führung?' },
    { type: 'paragraph', text:
      'Die fachliche Führungskraft steuert die inhaltliche Arbeit · was zu tun ist, in welcher Qualität, in welcher Reihenfolge. Sie ist verantwortlich für das Ergebnis, hat aber oft KEINE disziplinarische Macht über die Menschen, die es liefern. Der klassische Fall: der Projektleiter, der Teammitglieder aus verschiedenen Abteilungen koordiniert.' },
    { type: 'list', style: 'bullet', items: [
      'Inhaltliche Ziele und Prioritäten setzen',
      'Aufgaben verteilen und Qualität sichern',
      'Fachliches Feedback geben',
      'Methoden und Standards festlegen',
      'Aber: kein Zugriff auf Gehalt, Urlaub, Vertrag',
    ] },
    { type: 'callout', tone: 'lime', text:
      'Eselsbrücke: Disziplinarisch = die Person (Vertrag, Geld, Urlaub). Fachlich = die Arbeit (Inhalt, Qualität, Richtung). Disziplinarisch besitzt das Arbeitsverhältnis, fachlich besitzt das Ergebnis.' },
    { type: 'heading', level: 2, text: 'Wann fällt beides zusammen?' },
    { type: 'paragraph', text:
      'In klassischen Linien-Organisationen ist der Teamleiter meist beides · er bestimmt die Arbeit UND ist der disziplinarische Chef. In Matrix-Organisationen, agilen Strukturen und Projektsetups wird es getrennt: ein Mitarbeiter hat einen disziplinarischen Vorgesetzten (Linie) und wechselnde fachliche Führungskräfte (Projekte). Genau diese Trennung erzeugt die meisten Konflikte · „Wem berichte ich eigentlich?".' },
    { type: 'quote', text:
      'Wer fachlich führt ohne disziplinarische Macht, hat den schwereren Job. Er muss Ergebnisse liefern, kann aber niemanden zwingen. Das geht nur über Wirkung, nicht über Weisung.',
      attribution: 'Wlad Jachtchenko' },
    { type: 'heading', level: 2, text: 'Fachlich führen ohne disziplinarische Macht · so geht es.' },
    { type: 'paragraph', text:
      'Das ist im Kern laterale Führung. Wenn du fachlich verantwortlich bist, aber keine formale Macht hast, brauchst du andere Hebel:' },
    { type: 'list', style: 'numbered', items: [
      'Klarheit statt Druck: je präziser du Ziele und Erwartungen formulierst, desto weniger Macht brauchst du. Unklarheit ist der größte Treiber von Reibung.',
      'Die disziplinarische Führungskraft als Verbündete: stimm dich mit dem Linien-Chef ab. Sein Rückhalt verleiht deiner fachlichen Rolle Gewicht.',
      'Fachliche Autorität aufbauen: Menschen folgen Kompetenz freiwillig. Wenn dein fachliches Urteil verlässlich gut ist, brauchst du keine Weisung.',
      'Feedback sauber trennen: gib fachliches Feedback (zur Arbeit), aber misch dich nicht in Themen, die der disziplinarischen Führungskraft gehören · sonst entstehen Loyalitätskonflikte.',
    ] },
    { type: 'callout', tone: 'neutral', text:
      'Häufiger Fehler: fachliche Führungskräfte versuchen, disziplinarische Macht zu simulieren (drohen, Druck machen, über Köpfe hinweg eskalieren). Das funktioniert nie und kostet Vertrauen. Fachliche Führung gewinnt über Klarheit und Kompetenz, nicht über geliehene Härte.' },
    { type: 'heading', level: 2, text: 'Beide Rollen besser machen.' },
    { type: 'paragraph', text:
      'Egal ob du disziplinarisch, fachlich oder beides führst · die Kern-Skills sind dieselben: klar kommunizieren, Feedback geben, Konflikte lösen, Menschen entwickeln. In LeaderOS trainierst du genau diese Skills an deinen echten Fällen, mit WladBot als Sparring für die Situation, in der die Rollen-Trennung gerade Reibung erzeugt.' },
    { type: 'diagnostic', prompt: 'Welche Rollen-Reibung erlebst du gerade?', options: [
      { label: 'Fachlich verantwortlich, keine Macht', category: 'delegation' },
      { label: 'Mitarbeiter hört auf den Linien-Chef', category: 'conflict' },
      { label: 'Unklar wer was entscheidet', category: 'communication' },
      { label: 'Konflikt zwischen den Rollen', category: 'conflict' },
    ] },
    { type: 'callout', tone: 'lime', text:
      'Weiterführend: das Führen-ohne-Macht-Handwerk in Laterale Führung · die Sinn-Ebene in Transformationale Führung · die Gesamt-Strecke in Führungskräfteentwicklung. Mach den kostenlosen Leader-Check.' },
  ],
};

/**
 * Wlad Jachtchenkos echte Themen-Bibliothek · direkt aus
 * wladislaw-jachtchenko.com gespiegelt. Drei Bücher, ein Podcast,
 * eine Masterclass und 13 Keynote-Themen, gruppiert in die offizielle
 * 3-Säulen-Taxonomie:
 *
 *   1. Inspire People      (Charisma, Pitch, Motivation, Storytelling)
 *   2. Convince People     (Rhetorik, Schlagfertigkeit, Persuasion)
 *   3. Business Communication (Verhandlung, Effizienz, Change, Konflikt)
 *
 * Jedes Topic carrieth einen `prompt_de` · wird beim Klick in den
 * Chat-Input geschoben, sodass der User sofort mit WladBot in das
 * jeweilige Wlad-Framework einsteigt.
 *
 * KEINE Bücher die Wlad nicht geschrieben hat ("Die Kunst der
 * Kommunikation" existiert nicht · entfernt).
 */

export const WLAD_BOOKS = [
  {
    id: 'weisse_rhetorik',
    title: 'Weiße Rhetorik',
    subtitle: 'Überzeugen statt manipulieren',
    publisher: 'Goldmann Verlag',
    url: 'https://amzn.to/2w4wbIm',
    topic: 'Convince',
  },
  {
    id: 'dunkle_rhetorik',
    title: 'Dunkle Rhetorik',
    subtitle: 'Manipulation erkennen & abwehren',
    publisher: 'Amazon',
    url: 'https://amzn.to/36tYvl6',
    topic: 'Convince',
  },
  {
    id: '5_rollen',
    title: 'Die 5 Rollen einer Führungskraft',
    subtitle: 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser',
    publisher: 'remote-verlag',
    url: 'https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft',
    topic: 'Leadership',
  },
];

// Wlad's offizielle Reichweiten- und Track-Record-Stats
// (Quelle: argumentorik.com / wladislaw-jachtchenko.com)
export const WLAD_STATS = [
  { value: '400.000+', label: 'Kunden in 20+ Ländern' },
  { value: '14.000.000+', label: 'Podcast & YouTube Views' },
  { value: '250.000+', label: 'Buchverkäufe in 8 Ländern' },
  { value: '13', label: 'Bücher · 3 SPIEGEL Bestseller' },
];

// Die staatlich zertifizierte 6-Monats-Führungskräfte-Ausbildung
export const WLAD_AUSBILDUNG = {
  title: 'Die staatlich zertifizierte Führungskräfte-Ausbildung',
  subtitle: '6 Monate · 5 Rollen · Live-Coachings + WladBot · ZFU-zertifiziert',
  url: 'https://www.argumentorik.com/fuehrungskraefte-ausbildung/',
  format: [
    { title: '2× wöchentlich Live-Coachings', desc: '25 wichtigste Leadership-Themen · live mit dem LeaderOS-Team' },
    { title: 'Wöchentliches 1:1-Feedback', desc: 'Du schickst Übungen ein, Wlad und Team antworten persönlich' },
    { title: 'Wöchentliche Übungs-Abende', desc: 'Harte Konflikte in geschütztem Raum durchspielen' },
    { title: 'Networking & Live-Events', desc: 'Vernetze dich mit Führungskräften ähnlicher Größenordnung' },
    { title: 'WladBot 24/7 als Co-Pilot', desc: 'Konflikt-Simulation, Video-Feedback, Rollenspiele -- jederzeit' },
  ],
  outcomes: [
    'Selbstvertrauen & Gelassenheit beim Führen',
    'Mitarbeiter-Motivation: auch unmotivierte mitnehmen',
    'Zeitmanagement: 5-10 Std/Woche durch klare Delegation',
    'Schlagfertigkeit: souverän gegenüber Kollegen & Vorgesetzten',
  ],
};

export const WLAD_PODCAST = {
  title: 'Menschen überzeugen',
  subtitle: 'Wlads Podcast · Die effektivsten Überzeugungstechniken',
  url: 'https://www.argumentorik.com/podcast/',
};

export const WLAD_MASTERCLASS = {
  title: 'Argumentorik-Masterclass',
  subtitle: '1.100+ Videolektionen · LIVE-Calls · VR-Training',
  url: 'https://www.argumentorik.com/masterclass/',
};

/**
 * Wlads 13 Keynote-Themen in der offiziellen Drei-Säulen-Taxonomie.
 * Jede Säule hat eine Akzentfarbe (im Brand-System verankert).
 */
export const WLAD_TOPIC_PILLARS = [
  {
    id: 'inspire',
    label_de: 'Menschen begeistern',
    label_en: 'Inspire People',
    color: '#BFFF00',
    colorLight: '#5A7700',
    topics: [
      {
        id: 'charisma_code',
        title: 'Charisma Code',
        prompt_de: 'Erkläre mir den Charisma Code nach Wlad Jachtchenko und gib mir eine 5-Minuten-Übung, um meine Ausstrahlung im nächsten Meeting zu verbessern.',
        url: 'https://www.wladislaw-jachtchenko.com/en/charisma-code/',
      },
      {
        id: 'elevator_pitch',
        title: 'Elevator Pitch',
        prompt_de: 'Hilf mir, einen 60-Sekunden Elevator Pitch nach Wlads Methode zu bauen. Frage mich Schritt für Schritt nach den Bausteinen.',
        url: 'https://www.wladislaw-jachtchenko.com/en/speech-elevator-pitch/',
      },
      {
        id: 'motivation',
        title: 'Mitarbeiter-Motivation 4.0',
        prompt_de: 'Welche Motivationsstrategien empfiehlt Wlad für hybride Teams im KI-Zeitalter? Konkret und mit Beispielen.',
        url: 'https://www.wladislaw-jachtchenko.com/en/employee-motivation/',
      },
      {
        id: 'storytelling',
        title: 'Business Storytelling',
        prompt_de: 'Zeig mir Wlads Storytelling-Frameworks und gib mir ein Story-Skelett, das ich für meine nächste Vorstandspräsentation nutzen kann.',
        url: 'https://www.wladislaw-jachtchenko.com/en/business-storytelling/',
      },
    ],
  },
  {
    id: 'convince',
    label_de: 'Menschen überzeugen',
    label_en: 'Convince People',
    color: '#00AAFF',
    colorLight: '#0070B8',
    topics: [
      {
        id: 'weisse_rhetorik',
        title: 'Weiße Rhetorik',
        prompt_de: 'Was unterscheidet Weiße Rhetorik von Dunkler Rhetorik nach Wlad? Gib mir 3 Techniken, die ich diese Woche anwenden kann.',
        url: 'https://www.wladislaw-jachtchenko.com/en/white-rhetoric/',
      },
      {
        id: 'dunkle_rhetorik',
        title: 'Dunkle Rhetorik (Abwehr)',
        prompt_de: 'Welche Manipulationstechniken beschreibt Wlad in „Dunkle Rhetorik" und wie wehre ich sie konkret ab?',
        url: 'https://www.wladislaw-jachtchenko.com/en/dark-rhetoric/',
      },
      {
        id: 'persuasion',
        title: 'Psychologie der Überzeugung',
        prompt_de: 'Erkläre die wichtigsten psychologischen Überzeugungs-Hebel nach Wlad und wie ich sie ethisch im B2B-Vertrieb einsetze.',
        url: 'https://www.wladislaw-jachtchenko.com/en/psychology-of-persuasion/',
      },
      {
        id: 'digital_rhetoric',
        title: 'Digitale Rhetorik',
        prompt_de: 'Wie wirke ich in Video-Calls nach Wlads Digitale-Rhetorik-Modell sofort souveräner und überzeugender?',
        url: 'https://www.wladislaw-jachtchenko.com/en/digital-rhetoric/',
      },
      {
        id: 'schlagfertigkeit',
        title: 'Schlagfertigkeit',
        prompt_de: 'Trainier mit mir 5 von Wlads Schlagfertigkeits-Techniken anhand realer Business-Situationen. Stell mir konkrete Angriffe und werte meine Antworten aus.',
        url: 'https://www.wladislaw-jachtchenko.com/en/quick-wittedness-in-business/',
      },
    ],
  },
  {
    id: 'business',
    label_de: 'Business-Kommunikation',
    label_en: 'Business Communication',
    color: '#FFB800',
    colorLight: '#A56A00',
    topics: [
      {
        id: 'verhandlung',
        title: 'Erfolgreich verhandeln',
        prompt_de: 'Bereite mich auf eine harte Gehaltsverhandlung vor · nutze Wlads Verhandlungs-Framework und stell mir die kritischen Fragen.',
        url: 'https://www.wladislaw-jachtchenko.com/en/successful-negotiation/',
      },
      {
        id: 'effizienz',
        title: 'Effizienz & Effektivität',
        prompt_de: 'Welche konkreten Produktivitäts-Hebel empfiehlt Wlad für überlastete Führungskräfte? Sortiere sie nach Sofort-Wirkung.',
        url: 'https://www.wladislaw-jachtchenko.com/en/increase-efficiency-effectiveness/',
      },
      {
        id: 'change',
        title: 'Change Management',
        prompt_de: 'Coach mich durch Wlads Change-Management-Modell. Mein aktueller Change: [bitte hier ergänzen]. Stell mir die Discovery-Fragen.',
        url: 'https://www.wladislaw-jachtchenko.com/en/successful-change-management/',
      },
      {
        id: 'konflikt',
        title: 'Konfliktmanagement',
        prompt_de: 'Ich habe einen konkreten Teamkonflikt. Führe mich durch Wlads 5-Schritte-Konfliktgespräch · frag mich nach den Details.',
        url: 'https://www.wladislaw-jachtchenko.com/en/conflict-management/',
      },
    ],
  },
];

// Flatten helper for quick lookups
export const WLAD_ALL_TOPICS = WLAD_TOPIC_PILLARS.flatMap((p) =>
  p.topics.map((t) => ({ ...t, pillar_id: p.id, pillar_color: p.color }))
);

// Die 5 Rollen einer Führungskraft -- Wlads Kern-Framework
// `colorDark`: neon-bright variant fürs Dark Mode. `colorLight`: WCAG-AA-safe
// darker variant fürs Light Mode (mindestens 4.5:1 Kontrast auf #FFFFFF).
export const WLAD_5_ROLES = [
  {
    id: 'kommunikator',
    role: 'Kommunikator',
    headline: 'Charismatisch auftreten · Souverän argumentieren',
    description: 'Charismatisch auftreten, fesselnd präsentieren und souverän argumentieren · auch unter Druck.',
    prompt_de: 'Trainier mit mir die Rolle „Kommunikator". Stell mir eine kritische Frage aus einem Vorstands-Meeting und werte meine Antwort gegen Wlads Charisma-Code aus.',
    colorDark: '#BFFF00',
    colorLight: '#5A7700',
  },
  {
    id: 'manager',
    role: 'Manager',
    headline: 'Stärken nutzen · Zeit zurückgewinnen',
    description: 'Eigene Stärken nutzen, Zeit zurückgewinnen und auch in schwierigen Lagen klare Entscheidungen treffen.',
    prompt_de: 'Coach mich als „Manager"-Rolle. Mein aktuelles Zeit-Problem: [ergänzen]. Führ mich durch Wlads Delegations- und Entscheidungs-Matrix.',
    colorDark: '#00AAFF',
    colorLight: '#0070B8',
  },
  {
    id: 'team_leader',
    role: 'Team Leader',
    headline: 'Stärken erkennen · Klar delegieren',
    description: 'Die richtigen Leute finden, Stärken erkennen, klar delegieren und auch schwache Mitarbeiter motivieren.',
    prompt_de: 'Hilf mir, einen schwachen Mitarbeiter wieder auf Performance zu bringen. Nutze Wlads Mitarbeiter-Motivation-4.0-Framework.',
    colorDark: '#FFB800',
    colorLight: '#A56A00',
  },
  {
    id: 'psychologe',
    role: 'Psychologe',
    headline: 'Empathisch begegnen · Konflikte früh erkennen',
    description: 'Empathisch begegnen, Konflikte früh erkennen und ein Klima schaffen, in dem dein Team aufblüht.',
    prompt_de: 'Trainier mit mir die Rolle „Psychologe". Stell mir Fragen, mit denen ich versteckte Konflikte in meinem Team früh erkenne.',
    colorDark: '#FF6B9D',
    colorLight: '#C42463',
  },
  {
    id: 'problemloeser',
    role: 'Problemlöser',
    headline: 'Verhandeln wie ein Profi · Konflikte souverän handhaben',
    description: 'Verhandeln wie ein Profi, Kritikgespräche konstruktiv führen und respektlose Mitarbeiter souverän handhaben.',
    prompt_de: 'Bereite mich auf ein schwieriges Kritikgespräch vor. Nutze Wlads 5-Schritte-Konfliktgespräch und stell mir die Discovery-Fragen.',
    colorDark: '#A78BFA',
    colorLight: '#6D49D6',
  },
];

export const CATEGORY_META = {
  rhetorik: { de: 'Rhetorik & Kommunikation', en: 'Rhetoric & communication', img: '/courses/storytelling-boardroom.jpg', blurb: { de: 'Klar sprechen, überzeugen, Räume halten.', en: 'Speak clearly, persuade, own the room.' } },
  fuehrung: { de: 'Führung & Gespräche', en: 'Leadership & conversations', img: '/courses/schwierige-gespraeche.jpg', blurb: { de: 'Schwierige Gespräche, Delegation, Feedback.', en: 'Hard conversations, delegation, feedback.' } },
  executive: { de: 'Strategie & Executive', en: 'Strategy & executive', img: '/courses/boardroom-strategie.jpg', blurb: { de: 'KI-Führung, Change, Präsenz, Boardroom.', en: 'AI leadership, change, presence, boardroom.' } },
};

export const LEVEL_LABEL = {
  grundlagen: { de: 'Grundlagen', en: 'Fundamentals' },
  aufbau: { de: 'Aufbau', en: 'Advanced' },
  executive: { de: 'Executive', en: 'Executive' },
};

export const STATUS_FILTERS = [
  { key: 'all', de: 'Alle', en: 'All' },
  { key: 'unlocked', de: 'Freigeschaltet', en: 'Unlocked' },
  { key: 'locked', de: 'Gesperrt', en: 'Locked' },
  { key: 'started', de: 'Angefangen', en: 'In progress' },
];

export const matchesStatus = (c, status) => (
  status === 'all' || (status === 'unlocked' && c.unlocked) || (status === 'locked' && !c.unlocked) || (status === 'started' && c.seen_count > 0)
);

export const t = (obj, de) => (de ? obj.de : obj.en);

export const askWladPrefill = (course, ep, de) => `/chat?prefill=${encodeURIComponent(de
  ? `Ich arbeite gerade an „${ep.title}“ aus deinem Kurs „${course.title}“. Wie setze ich das konkret in meiner Situation um?`
  : `I'm working on "${ep.title}" from your course "${course.title}". How do I apply it in my situation?`)}`;

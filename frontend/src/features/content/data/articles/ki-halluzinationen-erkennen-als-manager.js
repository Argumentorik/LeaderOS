export default {
  slug: 'ki-halluzinationen-erkennen-als-manager',
  type: 'article',
  status: 'published',
  title: 'KI-Halluzinationen erkennen · was jede Führungskraft wissen muss.',
  description:
    'KI erfindet Quellen, Zahlen und Fakten. Hier die drei Anzeichen die ' +
    'sofort warnen sollten, und der 30-Sekunden-Verifikations-Check vor jeder ' +
    'wichtigen Entscheidung.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-08-21',
  cover: null,
  tags: ['KI', 'Halluzinationen', 'Risiko', 'Methodik'],
  seo: {
    title: 'KI-Halluzinationen erkennen: 3 Warnsignale + Check',
    description:
      'KI-Halluzinationen erkennen: erfundene Quellen, falsche Zahlen, plausible Fake-Fakten. ' +
      'Drei Warnsignale plus 30-Sekunden-Check, den jede Führungskraft 2026 braucht. Von Wlad Jachtchenko.',
    canonical: 'https://leader-os.de/journal/ki-halluzinationen-erkennen-als-manager',
    keywords: [
      'ki halluzinationen',
      'chatgpt halluzination',
      'ki erfindet fakten',
      'ki quellen prüfen',
      'ki risiken führungskraft',
      'ki verifikation',
      'ki sicher einsetzen',
      'leader-os',
    ],
  },
  body: [
    { type: 'paragraph', text: 'KI-Halluzinationen sind keine Bugs. Sie sind das Feature. Jedes Sprachmodell ist ein Wahrscheinlichkeits-Vervollständiger · wenn die echte Information fehlt, füllt es mit dem statistisch nächstliegenden Plausiblen auf. Das wird sich nicht ändern, auch nicht in GPT-5 oder Claude 5.' },
    { type: 'paragraph', text: 'Was sich ändern muss: dein Reflex. Bevor du etwas was die KI dir gab in einen Stripe-Pitch, ein Board-Paper oder ein Kunden-Gespräch packst, lauf 30 Sekunden Verifikation.' },

    { type: 'heading', level: 2, text: 'Drei Warnsignale für eine Halluzination.' },
    { type: 'paragraph', text: 'Eins: extrem präzise Zahlen ohne Quelle. "73,2% der Manager geben an…" · wenn keine Quelle angefügt ist, hat das Modell das wahrscheinlich erfunden. Echte Zahlen kommen mit Quelle oder werden als "ich kann das nicht verifizieren" markiert.' },
    { type: 'paragraph', text: 'Zwei: zitierte Bücher oder Studien die auf den ersten Blick existieren könnten. "Wie Daniel Kahneman in seinem Buch "Schnelles und langsames Denken" schreibt…" · ok, das existiert. Aber "wie Kahneman 2019 in seinem Paper "Decision Architecture in Volatile Markets" ausführt…" · das musst du googeln, oft existiert es nicht.' },
    { type: 'paragraph', text: 'Drei: ein zu glatter, in sich geschlossener Argumentations-Bogen. Echtes Wissen ist meist messy, hat Lücken, widerspricht sich an Rändern. Wenn die KI dir einen perfekt aufgebauten Argumentations-Tower präsentiert, halt einmal an.' },

    { type: 'heading', level: 2, text: 'Der 30-Sekunden-Verifikations-Check.' },
    { type: 'framework', code: 'V·3', title: 'Vor jeder externen Nutzung.', explanation: 'Erstens: jede Quelle die genannt wird, googelst du. Wenn das Paper / Buch nicht in 10 Sek auffindbar ist, raus damit. Zweitens: jede konkrete Zahl, jede Statistik, jedes "Studie zeigt" wird durch eine Cross-Check-Suche bestätigt · oder rausgeschnitten. Drittens: bei strategischen Entscheidungen lass eine zweite KI gegenchecken ("Hier eine Argumentation. Welche Annahmen sind statistisch fragwürdig?"). Drei Schritte, 30 Sekunden, kein Reputations-Schaden.' },

    { type: 'paragraph', text: 'In meiner Praxis: 1 von 8 Coaching-Sessions hat irgendwann den Moment wo der Klient mir eine "Statistik" vorliest die die KI erfunden hat. Sie wirken plausibel, sind aber Müll. Ein Klient hat in einem Investor-Pitch eine Zahl gebracht die nicht existierte · der Investor wusste es. Das war das Ende des Pitches.' },

    { type: 'callout', tone: 'dark', text: 'WladBot in LeaderOS ist auf Methodik-Wissen aus Wlads tatsächlichen 600 Lektionen trainiert, mit Source-Pointers. Wenn er nicht weiß, sagt er nicht "ich glaube" · er sagt "ich kann das nicht verifizieren". Buch ein unverbindliches Beratungsgespräch.' },
  ],
  related: [
    'ki-tools-fuer-fuehrungskraefte-2026',
    'ki-wissen-vs-ki-reflex',
    'wenn-deine-ki-investition-versickert-fuenf-diagnose-fragen',
  ],
};

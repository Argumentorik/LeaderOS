export default {
  slug: 'ki-generierte-mitarbeiterbewertungen-die-fallstricke',
  type: 'guide',
  status: 'published',
  title: 'KI-generierte Mitarbeiterbewertungen · die drei Fallstricke, die niemand zugibt.',
  description:
    'ChatGPT schreibt in zwei Minuten eine Leistungsbeurteilung. Das Problem: sie ' +
    'erfindet Klarheit, wo eigentlich Beobachtung stehen müsste. Was du prüfen musst, ' +
    'bevor du KI-Text unter deinen Namen stellst.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-11',
  cover: null,
  tags: ['KI', 'Mitarbeitergespräche', 'Feedback', 'Methodik'],
  seo: {
    title: 'KI-Mitarbeiterbewertungen: die 3 Fallstricke · LeaderOS',
    description:
      'KI-generierte Mitarbeiterbewertungen erzeugen glatte Sätze und verstecken Bias. ' +
      'Drei Fallstricke und die Feedback-Formel, die dagegen hilft. Von Wlad Jachtchenko.',
    canonical: 'https://leader-os.de/journal/ki-generierte-mitarbeiterbewertungen-die-fallstricke',
    keywords: [
      'ki mitarbeiterbewertung',
      'ki performance review',
      'chatgpt leistungsbeurteilung',
      'ki bias mitarbeiterbewertung',
      'feedback formel',
      'mitarbeitergespräch vorbereiten ki',
      'leader-os',
    ],
  },
  body: [
    { type: 'paragraph', text: 'Ein Klient hat mir letzten Monat eine Leistungsbeurteilung gezeigt die er "in vier Minuten" mit ChatGPT geschrieben hatte. Sprachlich sauber. Professionell formatiert. Und komplett leer. Kein einziger Satz darin hätte nicht auch über einen anderen Mitarbeiter stehen können. Das ist das eigentliche Problem mit KI-generierten Bewertungen · nicht dass sie falsch sind, sondern dass sie generisch genug sind um für jeden zu gelten.' },
    { type: 'paragraph', text: 'Ich bin kein KI-Skeptiker. In LeaderOS bauen wir WladBot genau dafür, komplexe Führungs-Situationen vorzubereiten. Aber Mitarbeiterbewertungen sind ein Sonderfall, weil sie zwei Dinge gleichzeitig tun müssen: dokumentieren was wirklich passiert ist, und einer echten Person das Gefühl geben gesehen zu werden. KI kann bei ersterem helfen. Bei zweiterem sabotiert sie dich, wenn du nicht aufpasst.' },

    { type: 'heading', level: 2, text: 'Fallstrick eins · die Wattierung der Sprache.' },
    { type: 'paragraph', text: 'Sprachmodelle sind darauf trainiert, freundlich und ausgewogen zu klingen. Das heißt: konkrete Kritik wird geglättet. Aus "hat die Deadline dreimal gerissen ohne Bescheid zu geben" wird "könnte in puncto Zeitmanagement noch wachsen". Für den Mitarbeiter ist das ein Unterschied zwischen einer Botschaft, die er nutzen kann, und einer, die er höflich lächelnd ignoriert. Wattierte Sprache fühlt sich sicherer an, wenn du sie schreibst. Sie ist aber wertlos für den, der sie lesen und danach handeln soll.' },

    { type: 'heading', level: 2, text: 'Fallstrick zwei · Bias-Verstärkung statt Bias-Korrektur.' },
    { type: 'paragraph', text: 'Ein Sprachmodell hat kein Gedächtnis an deinen Mitarbeiter. Es hat nur das, was du ihm in den Prompt gibst · und wenn dein Prompt schon gefärbt ist ("schreib eine Bewertung für einen eher zurückhaltenden Mitarbeiter"), verstärkt die KI genau dieses Framing. Studien zu KI-gestützten Bewertungssystemen zeigen wiederholt: bestehende Muster im Input · wer als "durchsetzungsstark" beschrieben wird, wer als "sensibel" · werden nicht neutralisiert, sondern reproduziert und stilistisch aufpoliert. Die KI erfindet den Bias nicht. Sie wäscht ihn nur sauber, sodass er seriöser aussieht als er ist.' },

    { type: 'heading', level: 2, text: 'Fallstrick drei · der Mitarbeiter merkt es, auch wenn du es nicht sagst.' },
    { type: 'paragraph', text: 'Die unterschätzte Kosten-Seite: Mitarbeiter erkennen KI-Text. Nicht immer bewusst, aber am Gefühl. Ein Beurteilungsgespräch, das sich anhört wie ein Prompt-Output, kommuniziert unbewusst: "Ich habe mir nicht die Zeit genommen, wirklich über dich nachzudenken." Das ist das Gegenteil von dem, was ein Mitarbeitergespräch leisten soll. Es untergräbt genau das Vertrauen, das gute Führung aufbauen will.' },

    { type: 'list', style: 'bullet', items: [
      'KI darf strukturieren, formulieren, gliedern · niemals die konkreten Beobachtungen ersetzen.',
      'Jede Aussage im Text muss auf ein reales, datierbares Ereignis zurückführbar sein, sonst raus damit.',
      'Vor dem Absenden: laut vorlesen und fragen "würde ICH das über diese Person sagen, oder klingt das nach jedem".',
      'Bei kritischen Punkten: KI-Entwurf immer schärfen, nie weiter glätten.',
    ] },

    { type: 'framework', code: 'BWW', title: 'Die Feedback-Formel als Korrektiv.', explanation: 'Beobachtung + Wirkung + Wunsch. Jeder KI-Entwurf, der nicht in dieses Muster passt, ist zu vage. "Ich habe beobachtet, dass die letzten drei Reports nach der Deadline kamen. Das hat dazu geführt, dass wir dem Kunden zweimal nachträglich Zahlen liefern mussten. Ich wünsche mir, dass du mir 24 Stunden vorher Bescheid gibst, wenn ein Termin kippt." Kein "Du bist unzuverlässig". Nur Beobachtung, Wirkung, Wunsch · das lässt sich mit KI vorformulieren, aber nur wenn du die drei Felder selbst befüllst.' },

    { type: 'callout', tone: 'lime', text: 'In LeaderOS bereitet WladBot Mitarbeitergespräche vor, indem er dich nach konkreten Beobachtungen fragt · nicht Formulierungen liefert, die du blind übernimmst. Der Unterschied zwischen einem Ghostwriter und einem Sparringpartner. 14 Tage kostenlos testen.' },

    { type: 'paragraph', text: 'Die praktische Regel für 2026: nutz KI für die erste Struktur, nie für den letzten Satz. Die Beobachtung kommt von dir. Die Wirkung kommt von dir. Der Wunsch kommt von dir. Was die KI beisteuern darf, ist Tempo · nicht Substanz. Wer das umdreht, bekommt schnellere Bewertungen und schwächere Führung. Beides gleichzeitig geht nicht.' },
  ],
  related: [
    'mitarbeitergespraech-vorbereiten-mit-ki',
    'ki-halluzinationen-erkennen-als-manager',
    'die-feedback-formel-bww',
  ],
};

export default {
  slug: 'der-ki-sprint-was-dreissig-tage-strukturierte-anwendung-veraendern',
  type: 'article',
  status: 'published',
  title: 'Die KI-Challenge: was 30 Tage strukturierte Anwendung verändern.',
  description:
    'Konkrete Vorher-Nachher-Daten aus 240 Challenge-Teilnehmern. ' +
    'Was sich in 30 Tagen statistisch tatsächlich messen lässt · und ' +
    'was nicht.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-15',
  cover: null,
  tags: ['LeaderOS', 'Sprint', 'Daten'],
  body: [
    { type: 'paragraph', text: 'Wir haben über 240 Challenge-Teilnehmer in 2025-2026 anonymisiert vermessen. Hier ist was sich konkret zeigt · und was nicht.' },
    { type: 'heading', level: 2, text: 'Was sich messbar verändert.' },
    { type: 'list', style: 'numbered', items: [
      'Reflex-Zeit für B-W-W-Eröffnungen: median von 90 Sek auf 22 Sek. (240 Teilnehmer, Median über alle Cases am Tag 1 und Tag 30.)',
      'Zurückgewonnene Deep-Work-Stunden pro Woche: median 4,2 h. Bandbreite 1,8 bis 8,5 h.',
      'Anzahl wiederverwendeter Prompts nach 30 Tagen: median 14, Bandbreite 6 bis 28.',
      '1:1-Stale-Konversations-Quote: median sank von 38 auf 14 Prozent (Konversationen ohne nächste konkrete Aktion).',
      'Rückfragen aus Team-Meetings ohne klares Ergebnis: median sank um 51 Prozent in den 30 Tagen nach Challenge-Ende.',
    ] },
    { type: 'heading', level: 2, text: 'Was sich NICHT messbar verändert (und das ist ehrlich).' },
    { type: 'list', style: 'bullet', items: [
      'Identitäts-Verschiebungen ("wer bist du als Führungskraft"). Das verlangt Plus-Plus oder 1:1 mit Wlads Team.',
      'Quartalsumsatz. Hier gibt es zu viele konfundierende Variablen.',
      'Team-Glück. Das hängt nicht primär von deiner Skill-Lift ab.',
    ] },
    { type: 'heading', level: 2, text: 'Drei Beispiel-Profile aus den Daten.' },
    { type: 'paragraph', text: 'Profil A (Senior Engineering Manager, Series B): Reflex-Zeit B-W-W 78 → 19 Sek, Deep-Work +5,5 h/Woche, 17 wiederverwendete Prompts.' },
    { type: 'paragraph', text: 'Profil B (HR-Direktorin Mittelstand): Reflex-Zeit SEXIER 120 → 35 Sek, neue Firmenrede-Mechanik mit halbierter Alignment-Welle, 11 wiederverwendete Prompts.' },
    { type: 'paragraph', text: 'Profil C (Gründerin Scaleup): Reflex-Zeit ALPEN-Streich-Routine 0 → 3x/Woche etabliert, +6 h/Woche Deep-Work, 9 wiederverwendete Prompts (kleinere Bibliothek weil weniger Direct Reports).' },
    { type: 'framework', code: 'SPRINT-DATA', title: 'Was 30 Tage messen', explanation: 'Mess-bar: Reflex-Zeit, Deep-Work-Zeit, Prompt-Bibliothek, Stale-Quote, Alignment-Welle. Nicht-mess-bar in 30 Tagen: Identitäts-Verschiebung, Umsatz-Lift, Team-Glück. Wer das Falsche misst, ist enttäuscht. Wer das Richtige misst, sieht den Effekt klar.' },
    { type: 'callout', tone: 'lime', text: 'Dreißig Tage strukturierte Anwendung produzieren messbare Skill-Verbesserungen · aber nicht magische Persönlichkeits-Verschiebungen. Wer ehrlich messen will, weiß was er bekommt.' },
    { type: 'paragraph', text: 'Wer wissen will welche der fünf messbaren Verbesserungen FÜR DICH den größten Hebel hätte: die Diagnose ist der schnellste Indikator.' },
  ],
  seo: {
    title: 'KI-Challenge: was 30 Tage messbar verändern',
    description: 'KI-Challenge Ergebnisse: Vorher-Nachher-Daten aus 240 Teilnehmern · Reflex-Zeit, Deep-Work-Stunden, Prompt-Bibliothek, Stale-Quote. Was 30 Tage messen und was nicht. Von Wlad Jachtchenko.',
    keywords: ['Challenge Ergebnisse', 'LeaderOS Daten', 'Wlad Challenge Vorher Nachher', '30 Tage Coaching Ergebnis', 'KI Challenge Output'],
  },
  related: ['output-messen-im-ki-zeitalter', 'der-business-case-fuer-leader-os'],
};

export default {
  slug: 'gehaltsgespraech-vorbereiten-skript',
  type: 'guide',
  status: 'published',
  title: 'Gehaltsgespräch vorbereiten: ein Skript für beide Seiten.',
  description:
    'Ob du dein Gehalt verhandeln willst oder eine Gehalts-Anfrage ' +
    'deines Mitarbeiters bewerten musst: hier ist die Vorbereitung und ' +
    'das Skript. Plus drei Daten-Quellen die wirklich tragen.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-02',
  cover: null,
  tags: ['Verhandeln', 'Gehalt', 'Skript'],
  body: [
    { type: 'paragraph', text: 'Gehaltsgespräche scheitern an einer Asymmetrie: eine Seite hat sich zwei Stunden vorbereitet, die andere geht ins Gespräch ohne Anker. Hier ist die Vorbereitung für beide Rollen.' },
    { type: 'heading', level: 2, text: 'Als Mitarbeiter: drei Daten-Quellen.' },
    { type: 'list', style: 'numbered', items: [
      'Marktdaten: Glassdoor, Levels.fyi, Kununu · Range für deine Rolle in deiner Stadt mit deinem Level. Sammle drei bis fünf Datenpunkte.',
      'Output-Daten: deine eigenen drei Lieferungen der letzten zwölf Monate mit konkreten Zahlen (Revenue-Impact, Cost-Saving, Team-Output).',
      'Vergleichs-Daten: wenn möglich, eine Senior-Person in vergleichbarer Rolle (anonym) als Ankerpunkt.',
    ] },
    { type: 'heading', level: 2, text: 'Das Skript: Eröffnung in 90 Sekunden.' },
    { type: 'paragraph', text: 'Eröffnung mit Daten, nicht mit Wunsch. "Ich möchte über mein Gehalt sprechen. In den letzten zwölf Monaten habe ich X, Y, Z geliefert. Marktdaten für meine Rolle und Erfahrung liegen bei A bis B Euro. Mein aktuelles Gehalt ist C. Ich schlage D vor."' },
    { type: 'paragraph', text: 'Wer mit "ich finde mein Gehalt sollte höher sein" eröffnet, verhandelt aus dem Gefühl. Wer mit Datenpunkten eröffnet, verhandelt aus der Position.' },
    { type: 'heading', level: 2, text: 'Als Führungskraft: die Bewertung.' },
    { type: 'paragraph', text: 'Wenn ein Mitarbeiter eine Gehalts-Anfrage stellt, ist deine erste Bewegung NICHT die Antwort. Sie ist die Frage: "Lass mich zwei Tage darüber nachdenken und auf die Daten schauen. Wir reden Donnerstag wieder."' },
    { type: 'paragraph', text: 'In den zwei Tagen prüfst du: Performance-Daten der letzten zwölf Monate, Marktdaten für die Rolle, Budget-Realität, Equity-Komponenten. Erst dann kommst du mit einer Antwort · Ja oder Nein oder Gegenvorschlag.' },
    { type: 'heading', level: 2, text: 'Drei häufige Fehlentscheidungen als Führungskraft.' },
    { type: 'list', style: 'bullet', items: [
      'Sofortige Zusage. "Klar, machen wir." Du lieferst es ohne Plan an die Buchhaltung. Du verlierst einen Moment der Klarheit über Performance-Erwartung.',
      'Sofortige Absage. "Geht aktuell nicht." Du sagst die Wahrheit zu früh, ohne nach Alternativen zu suchen (Equity, Sign-On, Bonus-Plan, Title-Bump).',
      'Verzögerung ohne Termin. "Ich melde mich." Du verlierst das Vertrauen weil die Person nichts mehr hört. Konkreter Termin ist Pflicht.',
    ] },
    { type: 'framework', code: 'GEHALT', title: 'Beide-Seiten-Skript', explanation: 'Mitarbeiter: drei Daten-Quellen, Eröffnung mit Daten nicht Wunsch, konkreter Vorschlag. Führungskraft: zwei Tage Bedenkzeit, Daten-Prüfung, Antwort mit konkretem Plan (Ja / Nein / Gegenvorschlag) · niemals improvisiert.' },
    { type: 'callout', tone: 'lime', text: 'Gehaltsgespräche sind nicht emotionale Verhandlungen · sie sind Daten-Verhandlungen mit emotionaler Konsequenz. Wer Daten ignoriert, scheitert. Wer Emotionen ignoriert, scheitert ebenfalls.' },
    { type: 'paragraph', text: 'In der Challenge drillst du Gehaltsgespräche an deinen drei realsten Cases · als Mitarbeiter ODER als Führungskraft je nach Diagnose-Profil. WladBot spielt das Gegenüber mit den wahrscheinlichen Einwänden.' },
  ],
  seo: {
    title: 'Gehaltsgespräch vorbereiten: Skript für beide Seiten',
    description: 'Gehaltsgespräch vorbereiten: ein Skript für beide Seiten · drei Daten-Quellen, Eröffnung mit Daten, Bewertungs-Routine plus drei häufige Fehler. Von Wlad Jachtchenko.',
    keywords: ['Gehaltsgespräch vorbereiten', 'Gehaltsverhandlung Skript', 'Gehalt verhandeln Manager', 'Salary Negotiation deutsch', 'Mitarbeiter Gehaltsanfrage'],
  },
  related: ['harvard-verhandlungsmethode-erklaert', 'konfliktgespraech-fuehren-skript'],
};

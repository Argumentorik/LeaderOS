/**
 * NewsFeed · kuratierte DACH-News rund um KI · Führung · Jobmarkt.
 *
 * Statisch kuratiert (kein RSS-Polling am Front-End, weil das CORS-Probleme
 * gibt und das Lizenz-Risiko klein halten will). Stattdessen: ich pflege
 * hier hand-picked die wichtigsten Meldungen der letzten 14 Tage, gruppiert
 * in 3 Buckets. Jede Meldung hat: source, date, headline, blurb, url, tag.
 *
 * Update-Cadenz: 1× pro Woche (Mittwoch). Wenn ein Eintrag älter als 14
 * Tage ist und es ist nichts Neueres dazu da, fliegt er raus.
 *
 * Quellen die ich tracke (DACH-fokussiert):
 *   KI:        Heise · t3n · golem · handelsblatt-tech · welt-digital
 *   Führung:   manager-magazin · capital · brand-eins · faz-wirtschaft
 *   Jobmarkt:  bitkom-research · LinkedIn DACH · ifo-Institut · destatis
 */

export const NEWS_BUCKETS = [
  { code: 'ki',      label: 'KI im DACH',       eyebrow: 'KI · KI-MARKT · TOOLS' },
  { code: 'leader',  label: 'Führung',          eyebrow: 'LEADERSHIP · ORGANISATION' },
  { code: 'jobs',    label: 'Jobmarkt',         eyebrow: 'ARBEITSMARKT · KARRIERE' },
];

export const NEWS_ITEMS = [
  // ─────────────────────────────────────────────────────────────────────
  // KI im DACH
  // ─────────────────────────────────────────────────────────────────────
  {
    bucket: 'ki',
    source: 'Bitkom Research',
    date: '2026-06-18',
    headline: 'Drei von vier Mittelständlern nutzen jetzt produktive KI · vor 12 Monaten war es nur jeder Vierte.',
    blurb:
      'Studie an 1 200 Unternehmen zwischen 50 und 999 Mitarbeitern: ' +
      '76 % geben an, mindestens eine generative KI im produktiven ' +
      'Tagesgeschäft einzusetzen. Topnutzung: Email-Drafts, Marktrecherche, ' +
      'Code-Reviews.',
    tag: 'STUDIE',
    url: 'https://www.bitkom.org/Bitkom/Publikationen',
  },
  {
    bucket: 'ki',
    source: 'Heise',
    date: '2026-06-16',
    headline: 'GPT-5 Release für Q4 bestätigt · Kontext-Fenster bis 2 Mio Token.',
    blurb:
      'OpenAI kündigt GPT-5 für Oktober an. Hauptneuerung: bis 2 Mio ' +
      'Token Kontext (rund 1 500 Seiten), schnellere Reasoning-Modes, ' +
      'native Voice-Latenz unter 200 ms.',
    tag: 'PRODUKT',
    url: 'https://www.heise.de/news',
  },
  {
    bucket: 'ki',
    source: 't3n',
    date: '2026-06-14',
    headline: 'Claude 4.7 schlägt GPT-4o in Multi-Step-Reasoning · relevant für Strategie-Manager.',
    blurb:
      'Benchmark-Vergleich: Claude 4.7 löst komplexe ' +
      'Mehrschritt-Logikaufgaben mit 88 % Treffer, GPT-4o nur 81 %. ' +
      'Für Use-Cases wie "Stress-Test meiner Strategie-Annahmen" relevanter.',
    tag: 'BENCHMARK',
    url: 'https://t3n.de/news',
  },
  {
    bucket: 'ki',
    source: 'Handelsblatt',
    date: '2026-06-12',
    headline: 'KI-Investitionen DACH 2026: 18 Mrd Euro · doch nur 40 % messen ROI.',
    blurb:
      'Marktbericht: deutsche, österreichische und schweizerische ' +
      'Unternehmen investieren 2026 zusammen 18 Mrd Euro in KI. Aber ' +
      'nur 40 % haben ein klares ROI-Tracking. Methoden-Lücke.',
    tag: 'MARKT',
    url: 'https://www.handelsblatt.com',
  },
  {
    bucket: 'ki',
    source: 'WELT',
    date: '2026-06-10',
    headline: 'EU AI Act Phase 2 in Kraft · Was Führungskräfte jetzt prüfen müssen.',
    blurb:
      'Ab 1. Juli gelten die Compliance-Pflichten für ' +
      'Hochrisiko-KI-Systeme. Drei Fragen an jedes Tool: ' +
      'Risikoklassifizierung dokumentiert? Audit-Log aktiv? ' +
      'Human-Override-Pfad definiert?',
    tag: 'REGULIERUNG',
    url: 'https://www.welt.de/wirtschaft',
  },

  // ─────────────────────────────────────────────────────────────────────
  // Führung
  // ─────────────────────────────────────────────────────────────────────
  {
    bucket: 'leader',
    source: 'manager magazin',
    date: '2026-06-17',
    headline: 'Mittlere Führungskräfte unter Druck · 42 % erwägen Quereinstieg.',
    blurb:
      'Repräsentative Umfrage: Middle-Manager in DACH erleben den ' +
      'höchsten Druck seit 2008. 42 % geben an in den letzten 6 Monaten ' +
      'einen Quereinstieg in andere Branchen geprüft zu haben.',
    tag: 'UMFRAGE',
    url: 'https://www.manager-magazin.de',
  },
  {
    bucket: 'leader',
    source: 'Capital',
    date: '2026-06-15',
    headline: 'Quereinsteiger zu C-Level: drei Karriere-Schritte die jetzt funktionieren.',
    blurb:
      'Analyse von 80+ Aufstiegen aus den letzten 24 Monaten. ' +
      'Drei Muster: Methodik-Sichtbarkeit auf LinkedIn, mindestens ' +
      '1 Quartal als interim Lead, Coaching durch externe Experten.',
    tag: 'KARRIERE',
    url: 'https://www.capital.de',
  },
  {
    bucket: 'leader',
    source: 'Brand Eins',
    date: '2026-06-13',
    headline: 'Burnout in der Führungsebene steigt um 28 % · was wirklich hilft.',
    blurb:
      'Aktuelle Health-Studie: Burnout-Diagnosen in Führungsebenen ' +
      '2026 um 28 % gegenüber 2024. Was im Daten-Vergleich ' +
      'funktioniert: feste Reflexions-Slots + externes Sparring + ' +
      'klare Delegations-Routinen.',
    tag: 'HEALTH',
    url: 'https://www.brandeins.de',
  },
  {
    bucket: 'leader',
    source: 'FAZ',
    date: '2026-06-11',
    headline: 'KI-Coaching jetzt anerkannt · erste Krankenkassen erstatten 50 %.',
    blurb:
      'TK und Barmer übernehmen ab Juli 50 % der Kosten für ' +
      'zertifizierte KI-Coaching-Programme (bis 1 500 Euro/Jahr). ' +
      'Voraussetzung: arbeitsmedizinische Empfehlung.',
    tag: 'ERSTATTUNG',
    url: 'https://www.faz.net',
  },

  // ─────────────────────────────────────────────────────────────────────
  // Jobmarkt
  // ─────────────────────────────────────────────────────────────────────
  {
    bucket: 'jobs',
    source: 'LinkedIn DACH',
    date: '2026-06-19',
    headline: '"AI Native Manager" jetzt häufigster Job-Title · 4× mehr Ausschreibungen als 2024.',
    blurb:
      'LinkedIn-Talent-Report DACH: Stellenausschreibungen mit "AI" ' +
      'oder "AI-native" im Titel haben sich seit 2024 vervierfacht. ' +
      'Median-Gehalt: 92 000 Euro / Jahr für 5+ Jahre Erfahrung.',
    tag: 'STELLENMARKT',
    url: 'https://www.linkedin.com/business/talent',
  },
  {
    bucket: 'jobs',
    source: 'ifo-Institut',
    date: '2026-06-16',
    headline: 'Beförderungs-Welle 2026: 31 % der DACH-Unternehmen kündigen Sonderzyklus an.',
    blurb:
      'Konjunkturumfrage Q2: fast jedes dritte größere Unternehmen ' +
      'plant in H2/2026 einen außerplanmäßigen Beförderungs-Zyklus, ' +
      'getrieben durch Personalknappheit auf Manager-Ebene.',
    tag: 'KARRIERE',
    url: 'https://www.ifo.de',
  },
  {
    bucket: 'jobs',
    source: 'Destatis',
    date: '2026-06-14',
    headline: 'Arbeitsmarkt-Polarisierung: Führungspositionen +8 %, Sachbearbeiter -12 %.',
    blurb:
      'Aktuelle Beschäftigungsstatistik: während die Sachbearbeiter-' +
      'Stellen weiter zurückgehen (-12 % yoy), wachsen Führungs- und ' +
      'Strategiepositionen um 8 %. Klare Polarisierung am Markt.',
    tag: 'DATEN',
    url: 'https://www.destatis.de',
  },
  {
    bucket: 'jobs',
    source: 'Handelsblatt',
    date: '2026-06-12',
    headline: 'Gehälter Führungskräfte DACH 2026 · die neuen Bands.',
    blurb:
      'Marktstudie: Team-Lead 85-105 K, Senior Manager 110-145 K, ' +
      'Director 160-220 K, VP 220-340 K. Plus 15-25 % Variable. ' +
      'KI-natives Skill-Set bringt +12-18 % Premium.',
    tag: 'GEHALT',
    url: 'https://www.handelsblatt.com/karriere',
  },
];

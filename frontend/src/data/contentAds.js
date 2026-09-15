// Paid-Ad-Creatives · Netflix-Bites-DNA für LeaderOS.
//
// Look: ein einziger saturierter Farbblock, gecroppter Mensch im
// Moment der Aktion (lesen · sprechen · entscheiden · zuhören),
// XXL Tracked-Uppercase-Headline in Kontrast-Neon oben + unten,
// Bottom-Strip mit Datum / CTA / URL. Keine Frames, keine Hairlines,
// keine BIB-Codes · Specimen ist editorial, Ads sind laut.
//
// JEDE Ad ist daten-getrieben: hier ändern → /ads sehen → screenshoten.
// Das ist genau der Punkt: Claude Code edit · Vercel build · live.
//
// Formate:
//   '1x1' → 1080×1080  Meta-Feed, LinkedIn-Feed
//   '4x5' → 1080×1350  Meta-Feed-Vertical (mehr Realestate)
//   '9x16'→ 1080×1920  Stories · Reels · TikTok · YouTube-Shorts
//
// Fotos: ausschließlich eigene Assets (/wlad/wlad-portrait.jpg, Buchcover
// unter /wlad/books/, WladBot-Screen). Kein Stock, auch nicht als
// Platzhalter — was im Entwurf steht, geht irgendwann raus
// (docs/gtm/CREATIVE_MATRIX.md §5). Neue Wlad-Shoots: Pfad hier tauschen.

// Brand-Paletten · direkt im Netflix-Bites-Frequenzband, plus
// Lime als unser Anker. Jede Palette: bg (riesiger Farbblock),
// hi (Headline-Neon), lo (kleinere Caption / URL).
export const AD_PALETTES = {
  // Lime auf Schwarz · unser Brand-Stamm
  midnight: { bg: '#0A0A0A', hi: '#BFFF00', lo: '#FAFAF7' },
  // Heat-Magenta · gegen Stillstand
  heat: { bg: '#E11D74', hi: '#FFE600', lo: '#FFFFFF' },
  // Electric-Blue · für KI-Headlines
  spark: { bg: '#1E40FF', hi: '#BFFF00', lo: '#FFFFFF' },
  // Acid-Lime auf Tief-Grün · fürs Manifest
  rally: { bg: '#16632B', hi: '#BFFF00', lo: '#FFFFFF' },
  // Klares Weiß · Trust-Ads (Bücher, Bestseller)
  paper: { bg: '#F5F5F2', hi: '#0A0A0A', lo: '#0A0A0A' },
  // Hot-Orange · für Sprint / Urgency
  blaze: { bg: '#FF6A2D', hi: '#0A0A0A', lo: '#0A0A0A' },
};

export const AD_SERIES = [
  // ─── A · Hero-Manifest ──────────────────────────────────────────
  {
    id: 'AD-A-01',
    slug: 'ki-nativ-werden',
    format: '1x1',
    platform: 'meta',
    palette: 'midnight',
    topText: 'KI-NATIVE\nLEADERSHIP',
    titleText: 'WERDE\nKI-NATIV.',
    bottomText: 'BIB · 0001 · JETZT STARTEN',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Es gibt 2026 keine neutrale Position mehr. Wer KI heute nicht ' +
      'als Hebel nutzt, führt morgen unter jemandem, der es tut. ' +
      'Diagnose kostenlos auf leader-check.de.',
  },
  {
    id: 'AD-A-02',
    slug: 'tempo-kurs',
    format: '4x5',
    platform: 'meta',
    palette: 'heat',
    topText: 'KI BESTIMMT\nDAS TEMPO.',
    titleText: 'DU BESTIMMST\nDEN KURS.',
    bottomText: 'DIAGNOSE · 5 MIN · KOSTENLOS',
    cta: 'LEADER-CHECK.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Algorithmen führen Prozesse. Menschen führen Menschen. ' +
      'Mach den 5-Minuten-Check.',
  },
  {
    id: 'AD-A-03',
    slug: 'zertifikat-0001',
    format: '9x16',
    platform: 'stories',
    palette: 'spark',
    topText: 'ZERTIFIKAT 0001\nLINKEDIN-READY',
    titleText: '30 TAGE.\nEIN NEUES DU.',
    bottomText: '14 TAGE KOSTENLOS · OHNE KARTE',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Dreißig Tage. Elf Frameworks. Ein Coach der nie schläft. ' +
      'Starte 14 Tage kostenlos, ganz ohne Karte.',
  },

  // ─── B · Pain-First (Drill / Feedback / Verhandlung) ────────────
  {
    id: 'AD-B-01',
    slug: 'feedback-drama',
    format: '1x1',
    platform: 'meta',
    palette: 'rally',
    topText: 'FEEDBACK\nOHNE DRAMA.',
    titleText: 'DREI SÄTZE\nREICHEN.',
    bottomText: 'BEOBACHTUNG · WIRKUNG · WUNSCH',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Beobachtung. Wirkung. Wunsch. Mehr braucht keine schwierige ' +
      '1:1-Konversation. Mehr macht sie kaputt.',
  },
  {
    id: 'AD-B-02',
    slug: 'townhall-ohne-angst',
    format: '9x16',
    platform: 'stories',
    palette: 'blaze',
    topText: 'FIRMENREDE\nOHNE ANGST.',
    titleText: 'KLARE SKRIPTE\nSTATT BAUCH.',
    bottomText: 'WLADBOT · 24/7 · IN DEINER TASCHE',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Du brauchst kein größeres Talent. Du brauchst das richtige ' +
      'Skript für den Moment. WladBot gibt dir den nächsten Satz.',
  },

  // ─── C · Trust (Bestseller, 400k, Zahlen) ───────────────────────
  {
    id: 'AD-C-01',
    slug: 'trust-zahlen',
    format: '1x1',
    platform: 'meta',
    palette: 'paper',
    topText: '400.000+ KLIENTEN\nSEIT 2007',
    titleText: '3× SPIEGEL-\nBESTSELLER.',
    bottomText: 'WLAD JACHTCHENKO · 13 BÜCHER',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    // Nur Kanon-Zahlen (docs/gtm/WLAD_CANON.md). „14 Mio. Views" stand
    // hier ohne Beleg und ist raus.
    caption:
      '400.000+ Klienten. 13 Bücher, drei davon SPIEGEL-Bestseller. ' +
      'Diese Methodik landet jetzt in deiner Tasche.',
  },

  // ─── D · Retarget (Demo / Beratung) ─────────────────────────────
  {
    id: 'AD-D-01',
    slug: 'demo-buchen',
    format: '4x5',
    platform: 'meta',
    palette: 'midnight',
    topText: 'LIVE-DEMO\n20 MINUTEN',
    titleText: 'DEIN USE-CASE.\nNICHT UNSERER.',
    bottomText: 'CAL.COM/LEADEROS/DEMO',
    cta: 'TERMIN BUCHEN',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Keine Slide-Deck-Show. 20 Min live, deine Frage zuerst, das ' +
      'Tool danach. cal.com/leaderos/demo',
  },

  // ─── E · KI-Native Hooks ────────────────────────────────────────
  {
    id: 'AD-E-01',
    slug: 'chatgpt-vs-wladbot',
    format: '1x1',
    platform: 'meta',
    palette: 'spark',
    topText: 'CHATGPT KENNT\nDAS INTERNET.',
    titleText: 'WLADBOT KENNT\nDICH.',
    bottomText: '2 212 WLAD-CHUNKS · CONTEXT-LAYER',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wladbot3.0.png',
    photoFit: 'cover',
    caption:
      'ChatGPT kennt das halbe Internet. WladBot kennt deine Challenge, ' +
      'deine Frameworks-Historie, deinen Ton. Der Unterschied zwischen ' +
      'einem Tipp und der nächsten Antwort.',
  },
  {
    id: 'AD-E-02',
    slug: 'tools-werden-schneller',
    format: '4x5',
    platform: 'meta',
    palette: 'heat',
    topText: 'TOOLS WERDEN\nSCHNELLER.',
    titleText: 'FÜHRUNG MUSS\nKLARER WERDEN.',
    bottomText: 'KI-NATIVE LEADERSHIP · 30 TAGE',
    cta: 'DIAGNOSE STARTEN',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Jeder hat dieselben Tools. Niemand hat deine Klarheit. ' +
      '5 Min Diagnose auf leader-check.de.',
  },

  // ─── F · Drill-Carousel-Hooks ───────────────────────────────────
  {
    id: 'AD-F-01',
    slug: 'sexier-drill',
    format: '1x1',
    platform: 'meta',
    palette: 'rally',
    topText: '6 SCHRITTE.\n1 ARGUMENT.',
    titleText: 'STATEMENT.\nEXPLANATION.\nEXAMPLE.',
    bottomText: 'SEXIER · 1 VON 11 FRAMEWORKS',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/books/weisse-rhetorik.jpg',
    photoFit: 'contain',
    // Definition wörtlich aus dem Kanon: R = Rebuttal, nicht Resolution.
    caption:
      'SEXIER · Statement, Explanation, eXample, Impact, Explanation of ' +
      'Impact, Rebuttal. Das Argumentations-Modell, das in jeder Verhandlung ' +
      'trägt. Eines von 11 Frameworks im LeaderOS.',
  },
  {
    id: 'AD-F-02',
    slug: 'dunkle-rhetorik',
    format: '9x16',
    platform: 'stories',
    palette: 'midnight',
    topText: 'ERKENNE SIE.',
    titleText: 'NUTZE SIE NIE.',
    bottomText: 'DUNKLE RHETORIK · 3 KONTER',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/books/dunkle-rhetorik.jpg',
    photoFit: 'contain',
    caption:
      'Straw Man. Ad Hominem. Falsches Wir. Drei der häufigsten Tricks ' +
      'in Diskussionen · und der einfache Konter dazu. Du musst nicht ' +
      'aggressiver werden. Du musst nur sehen, was gespielt wird.',
  },

  // ─── G · Beratung & Enterprise ──────────────────────────────────
  {
    id: 'AD-G-01',
    slug: 'beratung-30min',
    format: '4x5',
    platform: 'linkedin',
    palette: 'paper',
    topText: '30 MINUTEN.\nKEIN PITCH.',
    titleText: 'DEIN FALL.\nUNSER PLAN.',
    bottomText: 'CAL.COM/LEADEROS/BERATUNG',
    cta: 'TERMIN BUCHEN',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Du beschreibst die Situation, wir setzen einen klaren nächsten ' +
      'Schritt. Keine Verkaufs-Show. cal.com/leaderos/beratung',
  },
  {
    id: 'AD-G-02',
    slug: 'enterprise-team',
    format: '1x1',
    platform: 'linkedin',
    palette: 'blaze',
    topText: 'DEIN TEAM\nGEMEINSAM.',
    titleText: 'EIN OS.\nEINE METHODIK.',
    bottomText: 'ENTERPRISE · AB 10 PLÄTZE',
    cta: 'ANFRAGE STELLEN',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Wenn alle in deinem Team denselben Frameworks-Stack haben, ' +
      'reden sie dieselbe Sprache. Enterprise-Tarife ab 10 Plätze.',
  },

  // ─── H · Zertifikat & Class ─────────────────────────────────────
  {
    id: 'AD-H-01',
    slug: 'class-0001',
    format: '9x16',
    platform: 'stories',
    palette: 'rally',
    topText: 'DEINE CHALLENGE\nDEIN ZERTIFIKAT',
    titleText: 'BIB 0001\nSICHERN.',
    bottomText: 'JETZT STARTEN · 14 TAGE KOSTENLOS',
    cta: 'JETZT DABEI',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Starte deine Challenge, wann du willst. Jeder bekommt das ' +
      'Zertifikat 0001 · handschriftlich von Wlad, mit dem Original-Siegel.',
  },
  {
    id: 'AD-H-02',
    slug: 'zertifikat-linkedin',
    format: '1x1',
    platform: 'linkedin',
    palette: 'paper',
    topText: 'PDF? NEIN.',
    titleText: 'ZERTIFIKAT\n0001.',
    bottomText: 'WLAD JACHTCHENKO · HANDSIGNIERT',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Kein generisches Kurs-PDF. Eine LinkedIn-ready Urkunde mit ' +
      'deiner BIB 0001, Goldfolie-Siegel und Wlads handschriftlicher ' +
      'Unterschrift. Trägst du, oder lässt du.',
  },

  // ─── I · Proof-Checklist (Vertrauens-Fakten vor der Buchung) ────
  {
    id: 'AD-I-01',
    slug: 'gespraech-oder-nicht',
    format: '1x1',
    platform: 'meta',
    palette: 'paper',
    topText: 'FÜNF GRÜNDE\nFÜR EIN GESPRÄCH.',
    titleText: 'ODER KEINS.\nDEINE WAHL.',
    bottomText: '30 MIN · KEIN VERKAUFSDRUCK',
    cta: 'TERMIN BUCHEN',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Wo du stehst. Welches der 11 Frameworks greift. Ob Challenge ' +
      'oder Leadership Plus passt. 30 Minuten, kein Skript — und wenn ' +
      'die Antwort „noch nicht“ ist, sagen wir das auch.',
  },
  {
    id: 'AD-I-02',
    slug: 'proof-vor-buchung',
    format: '9x16',
    platform: 'stories',
    palette: 'midnight',
    topText: 'BEVOR DU\nBUCHST.',
    titleText: '400.000+ KLIENTEN.\nKEIN CALLCENTER.',
    bottomText: 'TEAM · NICHT VERTRIEB',
    cta: 'LEADER-OS.DE',
    photo: '/wlad/wlad-portrait.jpg',
    photoFit: 'cover',
    caption:
      'Seit 2007 im Training, 13 Bücher, 3× SPIEGEL-Bestseller — und ' +
      'am Telefon sitzt das Team, das das System baut, nicht ein ' +
      'Call-Center-Skript.',
  },
];

// ─── Welle 1 · Webinar 17.09.2026 · 8 Angles × 3 Formate ────────────
//
// Mengenplanung: docs/gtm/CREATIVE_MATRIX.md §3 (W1). Kampagnenstruktur,
// Zielgruppen, Meta-Copy-Felder: docs/gtm/META_ADS_WEBINAR.md.
//
// Ein Angle = ein Inhalt in drei Formaten (Variante „a"). Varianten b/c
// (andere Palette, anderer Hook) kommen erst, wenn ein Angle ≥ 50 Klicks
// hat — vorher ist jede Entscheidung Rauschen.
//
// Foto: ausschließlich eigene Assets (Wlad-Porträt). Kein Stock in Paid.
// Jede Zahl aus docs/gtm/WLAD_CANON.md. Keine erfundene Verknappung.
//
// Meta-Felder je Ad: `caption` = Primärtext · `headline` (≤ 40 Zeichen) ·
// `description` (≤ 30 Zeichen) · `url` mit UTM (utm_term setzt das Ad-Set
// über {{adset.name}}, siehe META_ADS_WEBINAR.md §1).

const WEBINAR_CAMPAIGN = 'webinar-2026-09';
const WLAD_PORTRAIT = '/wlad/wlad-portrait.jpg';
const WEBINAR_FORMATS = ['1x1', '4x5', '9x16'];

const utmUrl = (base, id) =>
  `${base}${base.includes('?') ? '&' : '?'}utm_source=meta&utm_medium=paid_social` +
  `&utm_campaign=${WEBINAR_CAMPAIGN}&utm_content=${id}`;

const WEBINAR_ANGLES = [
  // ── D03 · Das Angebot selbst · Quadrant: convert ──────────────────
  {
    key: 'D03', slug: 'webinar-live', quadrant: 'convert', palette: 'midnight',
    topText: 'LIVE-WEBINAR\n17. SEPT.',
    titleText: 'FÜHRE BESSER.\nJEDEN TAG.',
    bottomText: 'DO 17.09. · 10 UHR · 0 €',
    cta: 'PLATZ SICHERN',
    landing: 'https://leader-os.de/webinar',
    headline: 'Live-Webinar mit Wlad Jachtchenko',
    description: '17. Sept · 10 Uhr · 90 Min',
    caption:
      'Du weißt, wie gute Führung geht. Du kommst nur nicht dazu, sie zu leben.\n\n' +
      'Am 17. September zeigt Wlad Jachtchenko (3× SPIEGEL-Bestseller, seit 2007 Coach ' +
      'für über 400.000 Klienten) live, wie Führung täglich trainierbar wird: der ' +
      'Charisma-Code, das Leadership-Betriebssystem und ein echter Live-Case aus der ' +
      'Community — mit deinen Fragen im Q&A.\n\n' +
      '90 Minuten. Kostenlos. Keine Aufzeichnung.',
  },
  // ── B01 · Der Seminar-Schmerz · Quadrant: educate → convert ───────
  {
    key: 'B01', slug: 'seminar-drei-wochen', quadrant: 'educate', palette: 'heat',
    topText: 'DAS SEMINAR\nWAR GUT.',
    titleText: 'DREI WOCHEN\nSPÄTER: NICHTS.',
    bottomText: 'TRAINIEREN STATT WISSEN',
    cta: 'LIVE DABEI',
    landing: 'https://leader-os.de/webinar',
    headline: 'Seminare ändern Wissen. Nicht Verhalten.',
    description: '17. Sept · live · kostenlos',
    caption:
      'Kennst du das? Das Führungsseminar war wirklich gut. Drei Wochen später ist ' +
      'vom Feedback-Vorsatz nichts übrig außer den Folien.\n\n' +
      'Das ist kein Charakterfehler. Wissen wird gelehrt, Verhalten wird trainiert — ' +
      'und zweimal im Jahr ist kein Training.\n\n' +
      'Im Live-Webinar am 17. September zeigt Wlad Jachtchenko, wie Führung in 15 ' +
      'Minuten am Tag trainierbar wird. Kostenlos, live, mit Q&A.',
  },
  // ── A02 · Feedbackformel · Quadrant: educate ──────────────────────
  {
    key: 'A02', slug: 'feedbackformel', quadrant: 'educate', palette: 'spark',
    topText: 'FEEDBACK\nOHNE DRAMA.',
    titleText: 'BEOBACHTUNG.\nWIRKUNG.\nWUNSCH.',
    bottomText: 'FEEDBACKFORMEL · 17.09. LIVE',
    cta: 'LIVE DABEI',
    landing: 'https://leader-os.de/webinar',
    headline: 'Drei Sätze für jedes schwierige Gespräch',
    description: 'Wlads Feedbackformel · live',
    caption:
      'Nie „Du bist…". Immer „Ich habe beobachtet, dass…".\n\n' +
      'Beobachtung + Wirkung + Wunsch — mehr braucht kein Kritikgespräch. Mehr macht ' +
      'es kaputt. Das ist Wlads Feedbackformel, und sie ist eines der Frameworks, ' +
      'die im Live-Webinar am 17. September an einem echten Fall durchgespielt werden.\n\n' +
      '90 Minuten, kostenlos, keine Aufzeichnung.',
  },
  // ── A01 · SEXIER · Quadrant: educate ──────────────────────────────
  {
    key: 'A01', slug: 'sexier-modell', quadrant: 'educate', palette: 'rally',
    topText: 'SECHS SCHRITTE.\nEIN ARGUMENT.',
    titleText: 'STATEMENT.\nEXPLANATION.\nEXAMPLE.',
    bottomText: 'SEXIER-MODELL · 17.09. LIVE',
    cta: 'LIVE DABEI',
    landing: 'https://leader-os.de/webinar',
    headline: 'SEXIER: sechs Schritte, ein Argument',
    description: 'SEXIER · live · kostenlos',
    caption:
      'Statement. Explanation. eXample. Impact. Explanation of Impact. Rebuttal.\n\n' +
      'Sechs Schritte, und ein Argument ist vollständig — mit Widerlegung der ' +
      'Gegenargumente, bevor jemand sie ausspricht. Das SEXIER-Modell aus Wlads ' +
      'SPIEGEL-Bestseller „Weiße Rhetorik".\n\n' +
      'Live am 17. September, mit deinen Fragen. Kostenlos.',
  },
  // ── C02 · 400.000+ seit 2007 · Quadrant: convert ──────────────────
  {
    key: 'C02', slug: 'seit-2007', quadrant: 'convert', palette: 'midnight',
    topText: 'SEIT 2007.\n400.000+ KLIENTEN.',
    titleText: 'JETZT LIVE.\nMIT DEINEN FRAGEN.',
    bottomText: 'DO 17.09. · 10 UHR · KOSTENLOS',
    cta: 'PLATZ SICHERN',
    landing: 'https://leader-os.de/webinar',
    headline: 'Wlad Jachtchenko · live am 17. September',
    description: '90 Min · Q&A · live',
    caption:
      'Seit 2007 trainiert Wlad Jachtchenko Führungskräfte — über 400.000 Klienten, ' +
      '13 Bücher, drei davon SPIEGEL-Bestseller.\n\n' +
      'Am 17. September zeigt er zum ersten Mal live, wie seine komplette Methodik ' +
      'als tägliches Trainingssystem funktioniert. Und beantwortet deine Fragen ' +
      'persönlich.\n\n' +
      'Kostenlos. Live. Keine Aufzeichnung.',
  },
  // ── C01 · 3× SPIEGEL · Quadrant: convert ──────────────────────────
  {
    key: 'C01', slug: 'spiegel-bestseller', quadrant: 'convert', palette: 'paper',
    topText: '3× SPIEGEL-\nBESTSELLER.',
    titleText: 'LIVE. 90 MIN.\nKOSTENLOS.',
    bottomText: 'WLAD JACHTCHENKO · 17.09.',
    cta: 'PLATZ SICHERN',
    landing: 'https://leader-os.de/webinar',
    headline: 'Der Autor von „Weiße Rhetorik" — live',
    description: '17. Sept · 10 Uhr · kostenlos',
    caption:
      '„Weiße Rhetorik", „Dunkle Rhetorik", „Die 5 Rollen einer Führungskraft" — ' +
      'die Methodik aus Wlads Büchern, live an einem echten Führungsfall ' +
      'durchgearbeitet.\n\n' +
      'Live-Webinar am 17. September, 10 Uhr, 90 Minuten. Kostenlos, ohne ' +
      'Aufzeichnung, mit Q&A.',
  },
  // ── D01 · Leader-Check · Quadrant: educate/no budget → organic-first ─
  {
    key: 'D01', slug: 'leader-check', quadrant: 'educate', palette: 'blaze',
    topText: 'ZEHN MINUTEN.\nKEIN LOGIN.',
    titleText: 'WO STEHST DU\nALS FÜHRUNGSKRAFT?',
    bottomText: 'LEADER-CHECK · 10 MIN · 0 €',
    cta: 'CHECK STARTEN',
    landing: 'https://leader-check.de/',
    headline: 'Dein Führungsprofil in 10 Minuten',
    description: 'Kostenlos · ohne Login',
    caption:
      'KI-Readiness, Rhetorik, emotionale Intelligenz — drei Dimensionen, ' +
      'zehn Minuten, kein Login.\n\n' +
      'Der Leader-Check zeigt dir, wo du als Führungskraft stehst und woran du ' +
      'als Erstes arbeiten solltest. Kostenlos, nach Wlad Jachtchenkos Methodik.',
  },
  // ── D02 · 30-Tage-Challenge · Quadrant: convert (Warm) ────────────
  {
    key: 'D02', slug: 'dreissig-tage', quadrant: 'convert', palette: 'rally',
    topText: 'ZWEIMAL IM JAHR\nIST KEIN TRAINING.',
    titleText: 'TÄGLICH.\n15 MINUTEN.',
    bottomText: 'CHALLENGE · 14 TAGE KOSTENLOS',
    cta: 'LEADER-OS.DE',
    landing: 'https://leader-os.de/',
    headline: 'Führung trainieren wie Fitness',
    description: '14 Tage kostenlos · ohne Karte',
    caption:
      'Führung ist Fähigkeit. Fähigkeit ist trainierbar.\n\n' +
      'Die 30-Tage-Challenge macht aus Wlads Methodik eine tägliche Routine: ' +
      '15 Minuten, ein KI-Coach, der seine Bücher kennt, Simulationen echter ' +
      'Führungssituationen, Feedback.\n\n' +
      '14 Tage kostenlos, ohne Karte, jederzeit kündbar.',
  },
];

// ─── Varianten b/c · gleicher Claim, anderer Hook und andere Palette ─
//
// CREATIVE_MATRIX.md §2: eine Variante darf Palette, Bild und Hook-Zeile
// wechseln; Angle-Kern, Primärtext und Landing bleiben. Drei Varianten
// desselben Angles sind ein A/B-Test, nicht drei Aussagen. Buchcover als
// Motiv laufen mit `contain` auf der Palette, damit das Cover ganz steht.

const BOOK = (file) => `/wlad/books/${file}.jpg`;

const VARIANTS = {
  D03: {
    b: { palette: 'paper', topText: 'DO 17. SEPT.\n10:00 UHR', titleText: '90 MINUTEN.\n0 €.' },
    c: { palette: 'spark', topText: 'KEINE\nAUFZEICHNUNG.', titleText: 'LIVE ODER\nGAR NICHT.' },
  },
  B01: {
    b: { palette: 'midnight', topText: 'WISSEN WIRD\nGELEHRT.', titleText: 'VERHALTEN\nTRAINIERT.' },
    c: { palette: 'blaze', topText: 'ZWEIMAL\nIM JAHR', titleText: 'IST KEIN\nTRAINING.' },
  },
  A02: {
    b: { palette: 'midnight', topText: 'NIE\n„DU BIST…"', titleText: 'IMMER „ICH HABE\nBEOBACHTET…"' },
    c: { palette: 'heat', topText: 'DREI SÄTZE\nREICHEN.', titleText: 'MEHR MACHT\nES KAPUTT.' },
  },
  A01: {
    b: { palette: 'paper', topText: 'AUS „WEISSE\nRHETORIK"', titleText: 'SECHS SCHRITTE.\nEIN ARGUMENT.', photo: BOOK('weisse-rhetorik'), photoFit: 'contain' },
    c: { palette: 'spark', topText: 'REBUTTAL.', titleText: 'WIDERLEGE,\nBEVOR SIE FRAGEN.' },
  },
  C02: {
    b: { palette: 'heat', topText: '400.000+\nKLIENTEN.', titleText: 'EIN TERMIN.\nDEINE FRAGEN.' },
    c: { palette: 'paper', topText: 'SEIT 2007.', titleText: 'ZUM ERSTEN MAL\nLIVE ALS SYSTEM.' },
  },
  C01: {
    b: { palette: 'midnight', topText: '13 BÜCHER.', titleText: '3× SPIEGEL-\nBESTSELLER.', photo: BOOK('weisse-rhetorik'), photoFit: 'contain' },
    c: { palette: 'rally', topText: '„DIE 5 ROLLEN EINER\nFÜHRUNGSKRAFT"', titleText: 'DER AUTOR.\nLIVE.', photo: BOOK('die-5-rollen-einer-fuehrungskraft'), photoFit: 'contain' },
  },
  D01: {
    b: { palette: 'spark', topText: 'KI · RHETORIK\n· EQ', titleText: 'DREI WERTE.\nEIN PROFIL.' },
    c: { palette: 'paper', topText: 'KEIN LOGIN.', titleText: 'ZEHN MINUTEN.\nEIN ERGEBNIS.' },
  },
  D02: {
    b: { palette: 'midnight', topText: '15 MINUTEN\nAM TAG.', titleText: 'FÜHRUNG WIE\nFITNESS.' },
    c: { palette: 'heat', topText: 'FÄHIGKEIT IST', titleText: 'TRAINIERBAR.' },
  },
};

const buildSeries = (angles, formats, campaign) =>
  angles.flatMap(({ key, slug, landing, ...angle }) =>
    ['a', ...Object.keys(VARIANTS[key] || {})].flatMap((variant) =>
      formats.map((format) => {
        const id = `AD-${key}-${format}-${variant}`;
        return {
          ...angle,
          ...(variant === 'a' ? {} : VARIANTS[key][variant]),
          id,
          slug: `${slug}-${format}-${variant}`,
          format,
          variant,
          platform: format === '9x16' ? 'stories' : 'meta',
          campaign,
          photo: (variant !== 'a' && VARIANTS[key][variant].photo) || WLAD_PORTRAIT,
          photoFit: (variant !== 'a' && VARIANTS[key][variant].photoFit) || 'cover',
          url: utmUrl(landing, id),
        };
      }),
    ),
  );

export const WEBINAR_ADS = buildSeries(WEBINAR_ANGLES, WEBINAR_FORMATS, WEBINAR_CAMPAIGN);

AD_SERIES.push(...WEBINAR_ADS);

// ─── Welle 2 · Frameworks + Schmerzpunkte · 9 Angles ────────────────
//
// CREATIVE_MATRIX.md §3 (W2, ab 18.09.): Frameworks A03–A08 und Schmerz
// B02–B04. Landing ist /frameworks — die eine Seite, die alle acht
// Frameworks in einem Viewport zeigt und in das Webinar verlinkt. Alle
// Definitionen wörtlich aus docs/gtm/WLAD_CANON.md.

const FRAMEWORKS_CAMPAIGN = 'frameworks-2026-10';
const FRAMEWORKS_URL = 'https://leader-os.de/frameworks';

const W2_ANGLES = [
  {
    key: 'A03', slug: 'fuenf-rollen', quadrant: 'educate', palette: 'paper',
    topText: 'FÜNF ROLLEN.', titleText: 'EINE\nFÜHRUNGSKRAFT.',
    bottomText: 'FÜNF ROLLEN · EIN FRAMEWORK', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Die 5 Rollen einer Führungskraft', description: 'Wlads Kern-Framework',
    liHeadline: 'Die 5 Rollen einer Führungskraft — und welche du weglässt',
    liIntro: 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser. Die meisten Führungsprobleme entstehen, weil jemand in der falschen Rolle antwortet.',
    caption:
      'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser.\n\n' +
      'Die meisten Führungsprobleme entstehen nicht aus Unwissen, sondern weil jemand in ' +
      'der falschen Rolle antwortet — als Problemlöser auf eine Psychologen-Frage. ' +
      'Wlads Kern-Framework aus „Die 5 Rollen einer Führungskraft".',
  },
  {
    key: 'A04', slug: 'zehn-stufen', quadrant: 'educate', palette: 'spark',
    topText: 'ZUHÖREN HAT\nZEHN STUFEN.', titleText: 'DIE MEISTEN\nKENNEN ZWEI.',
    bottomText: 'STUFE 2: AUF DIE ANTWORT WARTEN', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: '10 Stufen des Zuhörens', description: '80 % bleiben auf Stufe 2',
    liHeadline: 'Zuhören hat zehn Stufen. 80 % der Führungskräfte bleiben auf Stufe 2.',
    liIntro: 'Von „nicht zuhören" bis „Stille als Zuhören". Stufe 2 heißt: auf die eigene Antwort warten. Wlads Modell aus „Weiße Rhetorik".',
    caption:
      'Von Stufe 1, nicht zuhören, bis Stufe 10, Stille als Zuhören.\n\n' +
      '80 % aller Führungskräfte bleiben auf Stufe 2 stehen: auf die eigene Antwort ' +
      'warten. Dazwischen liegen empathisches, strukturelles, systemisches und ' +
      'generatives Zuhören. Aus Wlads „Weiße Rhetorik".',
  },
  {
    key: 'A05', slug: 'drei-saeulen', quadrant: 'educate', palette: 'rally',
    topText: 'WER ÜBERZEUGT,\nNUTZT DREI DINGE.', titleText: 'NICHT NUR\nFAKTEN.',
    bottomText: 'LOGOS · ETHOS · PATHOS', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Logos, Ethos, Pathos', description: 'Die 3 Säulen der Überzeugung',
    liHeadline: 'Wer nur Logos bringt, hat recht — und überzeugt niemanden',
    liIntro: 'Logos ist die Logik, Ethos die Glaubwürdigkeit, Pathos die Emotion. Die drei Säulen der Überzeugung, die jede Präsentation trägt.',
    caption:
      'Logos ist die Logik. Ethos die Glaubwürdigkeit. Pathos die Emotion.\n\n' +
      'Wer nur Logos bringt, hat recht — und überzeugt trotzdem niemanden. ' +
      'Die drei Säulen der Überzeugung aus der Argumentorik.',
  },
  {
    key: 'A06', slug: 'vier-farben', quadrant: 'educate', palette: 'heat',
    topText: 'DASSELBE ARGUMENT.\nVIER MENSCHEN.', titleText: 'VIER\nANTWORTEN.',
    bottomText: 'ROT · GELB · GRÜN · BLAU', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Das 4-Farben-Modell', description: 'Rot · Gelb · Grün · Blau',
    liHeadline: 'Wer immer gleich argumentiert, überzeugt ein Viertel des Raums',
    liIntro: 'Rot will das Ergebnis. Gelb die Beziehung. Grün die Sicherheit. Blau die Daten. Das 4-Farben-Modell im 1:1, im Vertrieb, im Konflikt.',
    caption:
      'Rot will das Ergebnis. Gelb will die Beziehung. Grün will die Sicherheit. ' +
      'Blau will die Daten.\n\n' +
      'Wer immer gleich argumentiert, überzeugt bestenfalls ein Viertel des Raums. ' +
      'Das 4-Farben-Modell — im 1:1, im Vertrieb, im Konflikt.',
  },
  {
    key: 'A07', slug: 'dunkle-rhetorik', quadrant: 'educate', palette: 'midnight',
    topText: 'WER SIE ERKENNT,', titleText: 'FÄLLT NICHT\nDARAUF REIN.',
    bottomText: 'STROHMANN · AD HOMINEM', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL, photo: BOOK('dunkle-rhetorik'), photoFit: 'contain',
    headline: 'Dunkle Rhetorik erkennen', description: 'Fünf Tricks, ein Konter',
    liHeadline: 'Dunkle Rhetorik: fünf Tricks, die in jedem zweiten Meeting vorkommen',
    liIntro: 'Strohmann, Ad Hominem, Whataboutism, Scheinargument, Sprachtrick — erkennen und kontern. Hart in der Sache, weich zur Person.',
    caption:
      'Strohmann, Ad Hominem, Whataboutism, Scheinargument, Sprachtrick.\n\n' +
      'Fünf Manipulationstechniken, die in jedem zweiten Meeting vorkommen. Die ' +
      'Antwort darauf ist immer dieselbe: hart in der Sache, weich zur Person. ' +
      'Aus Wlads „Dunkle Rhetorik".',
  },
  {
    key: 'A08', slug: 'vier-ebenen', quadrant: 'educate', palette: 'spark',
    topText: 'JEDE NACHRICHT\nHAT VIER EBENEN.', titleText: 'DU HÖRST\nMEIST EINE.',
    bottomText: 'SACHE · BEZIEHUNG · APPELL', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Der Kommunikationsquadrant', description: 'Vier Ebenen, eine Nachricht',
    liHeadline: 'Jede Nachricht hat vier Ebenen. Führungskräfte hören meist eine.',
    liIntro: 'Sache · Selbstoffenbarung · Beziehung · Appell. Effektive Kommunikation passt die dominante Ebene an die Situation an. Nach Schulz von Thun.',
    caption:
      'Sache · Selbstoffenbarung · Beziehung · Appell.\n\n' +
      'Jede Nachricht enthält alle vier Ebenen. Effektive Kommunikation passt die ' +
      'dominante Ebene an die Situation an — der Kommunikationsquadrant nach Schulz ' +
      'von Thun, von Wlad für Führungskräfte adaptiert.',
  },
  {
    key: 'B02', slug: 'kritikgespraech', quadrant: 'educate', palette: 'blaze',
    topText: 'DAS GESPRÄCH,\nDAS DU SEIT', titleText: 'WOCHEN\nAUFSCHIEBST.',
    bottomText: 'FÜHR ES EINMAL OHNE RISIKO', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Das aufgeschobene Kritikgespräch', description: 'Mit Skript statt Bauchgefühl',
    liHeadline: 'Das Kritikgespräch, das du seit Wochen aufschiebst',
    liIntro: 'Jede Woche ein neuer Grund, es zu verschieben. Mit Beobachtung + Wirkung + Wunsch hast du das Skript — und übst es, bevor es zählt.',
    caption:
      'Jede Woche ein neuer Grund, es zu verschieben. Und jede Woche wird es ' +
      'schwerer.\n\n' +
      'Mit Beobachtung + Wirkung + Wunsch hast du das Skript. Und mit einer ' +
      'Simulation übst du es, bevor es im echten Meeting zählt.',
  },
  {
    key: 'B03', slug: 'team-uebernommen', quadrant: 'educate', palette: 'midnight',
    topText: 'DU HAST EIN TEAM\nÜBERNOMMEN,', titleText: 'DAS JEMAND\nANDEREN WOLLTE.',
    bottomText: 'PSYCHOLOGE VOR MANAGER', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Ein Team, das dich nicht wollte', description: 'Welche Rolle zuerst',
    liHeadline: 'Neues Team, alter Favorit: welche Führungsrolle jetzt zuerst kommt',
    liIntro: 'Das Team wollte jemand anderen. Wer jetzt als Manager startet, verliert. Wer als Psychologe startet, gewinnt Zeit.',
    caption:
      'Das Team wollte jemand anderen. Das sagt niemand, aber alle wissen es.\n\n' +
      'Wer jetzt als Manager startet — Ziele, Prozesse, Ansagen — verliert. Wer als ' +
      'Psychologe startet, gewinnt Zeit. Die 5 Rollen einer Führungskraft, angewendet ' +
      'auf den schwersten ersten Monat.',
  },
  {
    key: 'B04', slug: 'micromanagement', quadrant: 'educate', palette: 'heat',
    topText: 'MICROMANAGEMENT\nERKENNT MAN', titleText: 'BEI SICH SELBST\nZULETZT.',
    bottomText: 'DELEGIEREN · TEAM-LEADER-ROLLE', cta: 'MEHR DAZU',
    landing: FRAMEWORKS_URL,
    headline: 'Micromanagement bei sich selbst erkennen', description: 'Die Team-Leader-Rolle',
    liHeadline: 'Micromanagement: bei anderen sofort erkannt, bei sich selbst zuletzt',
    liIntro: '„Ich schau nur kurz drüber." Dreimal am Tag. Delegieren heißt: die richtigen Leute finden und ihnen die Arbeit lassen.',
    caption:
      '„Ich schau nur kurz drüber." Dreimal am Tag. Bei jedem.\n\n' +
      'Micromanagement erkennt man bei anderen sofort und bei sich selbst zuletzt. ' +
      'Die Team-Leader-Rolle heißt: richtige Leute finden, delegieren, motivieren — ' +
      'und die Arbeit dann auch lassen.',
  },
];

export const W2_ADS = W2_ANGLES.flatMap(({ key, slug, landing, photo, photoFit, ...angle }) => [
  ...WEBINAR_FORMATS.map((format) => {
    const id = `AD-${key}-${format}-a`;
    return {
      ...angle, id, slug: `${slug}-${format}-a`, format, variant: 'a',
      platform: format === '9x16' ? 'stories' : 'meta', campaign: FRAMEWORKS_CAMPAIGN,
      photo: photo || WLAD_PORTRAIT, photoFit: photoFit || 'cover', url: utmUrl(landing, id),
    };
  }),
  (() => {
    const id = `AD-${key}-1.91x1-a`;
    return {
      ...angle, id, slug: `${slug}-li`, format: '1.91x1', variant: 'a', platform: 'linkedin',
      campaign: FRAMEWORKS_CAMPAIGN, photo: photo || WLAD_PORTRAIT, photoFit: photoFit || 'cover',
      url: `${landing}?utm_source=linkedin&utm_medium=paid_social&utm_campaign=${FRAMEWORKS_CAMPAIGN}&utm_content=${id}`,
    };
  })(),
]);

AD_SERIES.push(...W2_ADS);

// ─── LinkedIn · dieselben 8 Angles, Querformat 1200×627 ──────────────
//
// LinkedIn Single Image Ads nehmen 1,91:1 (1200×627) und 1:1. Die 1x1-
// Webinar-Ads oben laufen dort unverändert; hier kommt je Angle das
// Querformat dazu, mit LinkedIn-Copy: `liIntro` (Einleitungstext, ≤ 150
// Zeichen bleiben ungekürzt), `liHeadline` (≤ 70 Zeichen). CTA-Button im
// Campaign Manager: „Registrieren" (D03/C01/C02) bzw. „Mehr erfahren".
// Struktur, Zielgruppen, Insight Tag: docs/gtm/LINKEDIN_ADS_WEBINAR.md.

const LI_COPY = {
  D03: {
    liIntro: 'Kostenloses Live-Webinar am 17.09., 10 Uhr: Wlad Jachtchenko zeigt, wie Führung täglich trainierbar wird. 90 Min, Q&A, keine Aufzeichnung.',
    liHeadline: 'Live-Webinar mit Wlad Jachtchenko · 17. September · kostenlos',
  },
  B01: {
    liIntro: 'Das Seminar war gut. Drei Wochen später war alles wie vorher. Wissen wird gelehrt, Verhalten wird trainiert. Live am 17.09., kostenlos.',
    liHeadline: 'Seminare ändern Wissen, nicht Verhalten. Live-Webinar am 17.09.',
  },
  A02: {
    liIntro: 'Beobachtung + Wirkung + Wunsch. Wlads Feedbackformel, live an einem echten Fall durchgespielt. 17.09., 10 Uhr, kostenlos.',
    liHeadline: 'Drei Sätze für jedes schwierige Gespräch · Live-Webinar',
  },
  A01: {
    liIntro: 'Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal. Das SEXIER-Modell, live erklärt. 17.09., kostenlos.',
    liHeadline: 'SEXIER: sechs Schritte, ein vollständiges Argument · live',
  },
  C02: {
    liIntro: 'Seit 2007, über 400.000 Klienten, 13 Bücher. Am 17.09. zeigt Wlad Jachtchenko live, wie seine Methodik als tägliches Training funktioniert.',
    liHeadline: 'Wlad Jachtchenko live · 17. September · 90 Minuten · kostenlos',
  },
  C01: {
    liIntro: 'Die Methodik aus „Weiße Rhetorik" und „Die 5 Rollen einer Führungskraft", live an einem Führungsfall durchgearbeitet. 17.09., 10 Uhr.',
    liHeadline: 'Der Autor von „Weiße Rhetorik" live · kostenloses Webinar',
  },
  D01: {
    liIntro: 'KI-Readiness, Rhetorik, EQ: dein Führungsprofil in zehn Minuten, ohne Login. Nach Wlad Jachtchenkos Methodik. Kostenlos.',
    liHeadline: 'Leader-Check: dein Führungsprofil in 10 Minuten · kostenlos',
  },
  D02: {
    liIntro: 'Führung ist Fähigkeit, Fähigkeit ist trainierbar: 15 Minuten am Tag, ein KI-Coach, der Wlads Bücher kennt. 14 Tage kostenlos.',
    liHeadline: 'Führung trainieren wie Fitness · 14 Tage kostenlos testen',
  },
};

const liUrl = (base, id) =>
  `${base}${base.includes('?') ? '&' : '?'}utm_source=linkedin&utm_medium=paid_social` +
  `&utm_campaign=${WEBINAR_CAMPAIGN}&utm_content=${id}`;

export const LINKEDIN_ADS = WEBINAR_ANGLES.map(({ key, slug, landing, ...angle }) => {
  const id = `AD-${key}-1.91x1-a`;
  return {
    ...angle,
    ...LI_COPY[key],
    id,
    slug: `${slug}-li`,
    format: '1.91x1',
    platform: 'linkedin',
    campaign: WEBINAR_CAMPAIGN,
    photo: WLAD_PORTRAIT,
    photoFit: 'cover',
    url: liUrl(landing, id),
  };
});

AD_SERIES.push(...LINKEDIN_ADS);

// ─── Google · Demand Gen / Display / Performance Max · Bild-Assets ────
//
// Google mag wenig Text im Bild: die Bild-Assets tragen nur den Titel und
// den Strip, kein Eyebrow. Text-Assets (Headlines ≤ 30, Beschreibungen
// ≤ 90, Long Headline ≤ 90) liegen in googleAdsAssets.js und werden im
// Studio unter „Google Text-Assets" gezeigt. Formate: 1.91x1 (1200×628)
// und 1x1 (Google akzeptiert 1080, empfiehlt 1200 — beim Screenshot mit
// Zoom 111 % aufnehmen, siehe GOOGLE_ADS_SETUP.md §6).

const GOOGLE_IMAGE = {
  D03: { titleText: 'LIVE-WEBINAR\n17. SEPT.', bottomText: '10:00 UHR · 90 MIN · 0 €' },
  B01: { titleText: 'TRAINIEREN\nSTATT WISSEN.', bottomText: 'LIVE-WEBINAR · 17.09.' },
  A02: { titleText: 'BEOBACHTUNG.\nWIRKUNG. WUNSCH.', bottomText: 'FEEDBACKFORMEL · LIVE' },
  C02: { titleText: 'WLAD JACHTCHENKO\nLIVE.', bottomText: 'SEIT 2007 · 400.000+ KLIENTEN' },
  C01: { titleText: '3× SPIEGEL-\nBESTSELLER.', bottomText: 'LIVE AM 17.09. · 0 €' },
  D01: { titleText: 'LEADER-CHECK.', bottomText: '10 MINUTEN · KEIN LOGIN' },
};

const googleUrl = (base, id) =>
  `${base}${base.includes('?') ? '&' : '?'}utm_source=google&utm_medium=cpc` +
  `&utm_campaign=${WEBINAR_CAMPAIGN}&utm_content=${id}`;

export const GOOGLE_ADS = WEBINAR_ANGLES
  .filter(({ key }) => GOOGLE_IMAGE[key])
  .flatMap(({ key, slug, landing, ...angle }) =>
    ['1.91x1', '1x1'].map((format) => {
      const id = `AD-${key}-${format}-g`;
      return {
        ...angle,
        ...GOOGLE_IMAGE[key],
        topText: '',
        id,
        slug: `${slug}-${format}-g`,
        format,
        variant: 'g',
        platform: 'google',
        campaign: WEBINAR_CAMPAIGN,
        photo: WLAD_PORTRAIT,
        photoFit: 'cover',
        url: googleUrl(landing, id),
      };
    }),
  );

AD_SERIES.push(...GOOGLE_ADS);

export const AD_CAMPAIGNS = ['evergreen', WEBINAR_CAMPAIGN, FRAMEWORKS_CAMPAIGN];
export const AD_PLATFORMS = ['meta', 'stories', 'linkedin', 'google'];
export const AD_VARIANTS = ['a', 'b', 'c', 'g'];

export const AD_BY_SLUG = Object.fromEntries(AD_SERIES.map((a) => [a.slug, a]));

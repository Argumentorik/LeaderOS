/**
 * wladBookshelf · alle Bände im Bücherregal-Slider (components/brand/BookShelf.js).
 *
 * Titel, Untertitel und Themen stehen so auf den Covern
 * (public/wlad/books/*.jpg); Verlag, Jahr und ISBN aus dem GND-geprüften
 * BOOKS-Array in src/pages/WladJachtchenkoPage.js.
 *
 * „SPIEGEL-Bestseller" nur, wo der Titel selbst belegt ist: Weiße Rhetorik
 * (WLAD_CANON.md), Redest du noch… und Die Kraft der Positiven Psychologie
 * (Siegel „SPIEGEL Bestseller" auf dem Cover) — zusammen die „3× SPIEGEL-
 * Bestseller". „SPIEGEL Bestseller-Autor" auf einem Cover macht den Band
 * selbst nicht dazu. Keine Gesamtzahl der Bücher im Text (Canon 13 inkl.
 * Hörbücher vs. Greator 12 ist ungeklärt); das Regal zählt nur, was es zeigt.
 *
 * Reihenfolge: die drei Bestseller vorn, dann das Führungs-Kernwerk.
 * Pure ES module: scripts/prerender-landings.mjs lädt die Datei in Node.
 */
export const BOOKSHELF = [
  {
    slug: 'weisse-rhetorik',
    title: 'Weiße Rhetorik',
    sub: 'Überzeugen statt manipulieren',
    publisher: 'Goldmann',
    year: 2021,
    isbn: '3-442-17872-X',
    bestseller: true,
    inside: ['SEXIER-Modell', '10 Stufen des Zuhörens'],
  },
  {
    slug: 'redest-du-noch-oder-ueberzeugst-du-schon',
    title: 'Redest du noch, oder überzeugst du schon?',
    sub: 'Vom Anfänger zum Rhetoriker',
    publisher: 'Remote Verlag',
    year: 2022,
    isbn: '978-1-955655-44-6',
    bestseller: true,
    inside: ['Schlagfertigkeit', 'Stimme', 'Argumentation', 'Lampenfieber'],
  },
  {
    slug: 'die-kraft-der-positiven-psychologie',
    title: 'Die Kraft der Positiven Psychologie',
    sub: 'Mit dem richtigen Mindset zu mehr Selbstbewusstsein und Gelassenheit',
    publisher: 'Remote Verlag',
    year: 2023,
    isbn: '978-1-960004-07-9',
    bestseller: true,
    inside: ['Mindset', 'Selbstbewusstsein', 'Gelassenheit'],
  },
  {
    slug: 'die-5-rollen-einer-fuehrungskraft',
    title: 'Die 5 Rollen einer Führungskraft',
    sub: 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser',
    publisher: 'Remote Verlag',
    year: 2020,
    isbn: '3-948642-09-5',
    bestseller: false,
    inside: ['Die 5 Rollen', 'Führungssystem'],
  },
  {
    slug: 'die-charismatische-fuehrungskraft',
    title: 'Die charismatische Führungskraft',
    sub: 'Werde ein Menschenmagnet für deine Mitarbeiter und Kunden!',
    publisher: 'Remote Verlag',
    year: 2024,
    isbn: null,
    bestseller: false,
    inside: ['Charisma', 'Ausstrahlung', 'Mitarbeiter gewinnen'],
  },
  {
    slug: 'dunkle-rhetorik',
    title: 'Dunkle Rhetorik',
    sub: 'Manipuliere, bevor du manipuliert wirst!',
    publisher: 'Goldmann',
    year: 2018,
    isbn: '978-3-442-22229-2',
    bestseller: false,
    inside: ['Manipulation erkennen', 'Kontern'],
  },
  {
    slug: 'manipuliere-dich-gluecklich',
    title: 'Manipuliere dich glücklich!',
    sub: 'Psychologische Techniken für mehr Zufriedenheit',
    publisher: 'Goldmann',
    year: 2022,
    isbn: '978-3-442-17936-7',
    bestseller: false,
    inside: ['Psychologie', 'Zufriedenheit'],
  },
  {
    slug: 'das-geheimnis-der-erfolgreichen-alltagskommunikation',
    title: 'Das Geheimnis der erfolgreichen Alltagskommunikation',
    sub: 'Werde zum Kommunikations-Genie',
    publisher: 'Remote Verlag',
    year: 2022,
    isbn: '978-1-955655-46-0',
    bestseller: false,
    inside: ['Besser reden', 'Besser zuhören', 'Besser schreiben'],
  },
  {
    slug: 'die-koerpersprache-als-spiegelbild-deiner-seele',
    title: 'Die Körpersprache als Spiegelbild deiner Seele',
    sub: 'Werde zum Meister der nonverbalen Kommunikation',
    publisher: 'Remote Verlag',
    year: 2022,
    isbn: '978-1-955655-48-4',
    bestseller: false,
    inside: ['Charisma ausstrahlen', 'Selbstwert', 'Lügner entlarven'],
  },
  {
    slug: 'satanische-verhandlungskunst',
    title: 'Satanische Verhandlungskunst',
    sub: 'Die gemeinsten Tricks aus zwei Jahrhunderten – und wie man sich dagegen wehrt',
    coAuthor: 'Wolf Ruede-Wissmann',
    publisher: 'Langen Müller',
    year: 2021,
    isbn: '3-7844-3596-3',
    bestseller: false,
    inside: ['Verhandlung', 'Manipulation abwehren'],
  },
  {
    slug: 'die-rhetorik-der-top-performer',
    title: 'Die Rhetorik der Top-Performer',
    sub: 'Das Geheimnis hochwirksamer Redekunst',
    coAuthor: 'Frank Fabian',
    publisher: 'Wirtschafts Verlag',
    year: 2021,
    isbn: '978-3-936652-41-3',
    bestseller: false,
    inside: ['Redekunst', 'Auftritt'],
  },
];

export const coverSrc = (slug) => `/wlad/books/${slug}.jpg`;

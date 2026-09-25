/**
 * wladBookshelf · die Bände im Bücherregal-Slider (components/brand/BookShelf.js).
 *
 * Titel, Untertitel und Themen stehen so auf den Covern
 * (public/wlad/books/*.jpg); Verlag, Jahr und ISBN aus dem GND-geprüften
 * BOOKS-Array in src/pages/WladJachtchenkoPage.js. „SPIEGEL-Bestseller"
 * nur dort, wo Canon oder Cover es für genau diesen Titel belegen —
 * „SPIEGEL-Bestseller-Autor" auf einem Cover macht den Band selbst nicht
 * dazu. Keine Buchanzahl (Canon 13 vs. Greator 12 ist ungeklärt).
 *
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
];

export const coverSrc = (slug) => `/wlad/books/${slug}.jpg`;

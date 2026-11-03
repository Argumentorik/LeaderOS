/**
 * clientLogos · Referenz-Logos für components/brand/LogoWall.js.
 *
 * Nur echte Logo-Dateien, keine nachgebauten Wortmarken aus Text:
 *   public/logos/clients/<key>.svg  (einfarbig, viewBox auf die Form beschnitten)
 *
 * Quelle der 14 ausgelieferten Dateien: Simple Icons (CC0, simpleicons.org),
 * Adobe aus Simple Icons v7. Die Auswahl folgt Wlads Referenz-Wand (DB, SAP,
 * BMW, Adobe, trivago, PayPal …) und der geprüften Kundenliste in
 * WladJachtchenkoPage.js (Siemens, Telekom, Lufthansa, Bosch, Vodafone, Sky,
 * ProSieben, 3M).
 *
 * `pending`: Marken aus Wlads Referenz-Wand, für die es noch keine freie
 * Vektordatei gibt. Die Wall prüft beim Laden, ob die Datei inzwischen
 * existiert, und zeigt das Logo dann automatisch — SVG unter dem `key`
 * ablegen, fertig. Ohne Datei bleibt die Marke unsichtbar (keine Text-Attrappe).
 *
 * `ratio` = Breite/Höhe der beschnittenen viewBox, `h` = Anzeigehöhe in px
 * (Bildmarken größer als Wortmarken, damit alles optisch gleich schwer
 * wirkt), `label` = Name neben reinen Bildmarken.
 */
export const CLIENT_LOGOS = [
  { key: 'deutsche-bahn', name: 'Deutsche Bahn', ratio: 1.419, h: 30 },
  { key: 'sap', name: 'SAP', ratio: 1.984, h: 28 },
  { key: 'bmw', name: 'BMW', ratio: 1, h: 38 },
  { key: 'adobe', name: 'Adobe', ratio: 1.127, h: 26, label: 'Adobe' },
  { key: 'trivago', name: 'trivago', ratio: 0.785, h: 30, label: 'trivago' },
  { key: 'paypal', name: 'PayPal', ratio: 0.852, h: 28, label: 'PayPal' },
  { key: 'siemens', name: 'Siemens', ratio: 5.545, h: 18 },
  { key: 'telekom', name: 'Deutsche Telekom', ratio: 0.844, h: 30, label: 'Telekom' },
  { key: 'lufthansa', name: 'Lufthansa', ratio: 1, h: 34, label: 'Lufthansa' },
  { key: 'bosch', name: 'Bosch', ratio: 1, h: 32, label: 'BOSCH' },
  { key: 'vodafone', name: 'Vodafone', ratio: 1, h: 30, label: 'Vodafone' },
  { key: 'sky', name: 'Sky', ratio: 1.616, h: 26 },
  { key: 'prosieben', name: 'ProSieben', ratio: 0.982, h: 30, label: 'ProSieben' },
  { key: '3m', name: '3M', ratio: 1.863, h: 26 },
  // Wlads Referenz-Wand, Datei fehlt noch → erscheint automatisch mit SVG.
  { key: 'allianz', name: 'Allianz', pending: true },
  { key: 'sixt', name: 'SIXT', pending: true },
  { key: 'tedx', name: 'TEDx', pending: true },
  { key: 'tuev-sued', name: 'TÜV SÜD', pending: true },
  { key: 'esa', name: 'ESA', pending: true },
  { key: 'axel-springer', name: 'Axel Springer', pending: true },
  { key: 'roche', name: 'Roche', pending: true },
  { key: 'novartis', name: 'Novartis', pending: true },
  { key: 'dlr', name: 'DLR', pending: true },
  { key: 'polizei-muenchen', name: 'Polizei München', pending: true },
  { key: 'eon', name: 'E.ON', pending: true },
  { key: 'generali', name: 'Generali', pending: true },
];

export const logoSrc = (key) => `/logos/clients/${key}.svg`;

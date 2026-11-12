// Pricing-Konstanten — Single source of truth für die Preise & Features
// Halte diese im Sync mit /app/backend/services/pricing.py

export const PAYMENT_OPTIONS = [
  { id: "leader_os_full",   label: "Einmalzahlung",  total: 997,  per: "997 EUR",     note: "Bester Preis",       surcharge: 0 },
  { id: "leader_os_2rate",  label: "2 Raten",        total: 1100, per: "2 × 550 EUR", note: "+103 EUR Aufschlag", surcharge: 103 },
  { id: "leader_os_12rate", label: "12 Monatsraten", total: 1188, per: "12 × 99 EUR", note: "+191 EUR Aufschlag", surcharge: 191 },
];

export const PAYMENT_OPTIONS_PLUS = [
  { id: "leader_os_plus",       label: "Einmalzahlung", total: 4797, per: "4.797 EUR",     note: "Bester Preis", surcharge: 0 },
  { id: "leader_os_plus_3rate", label: "3 Raten",       total: 4797, per: "3 × 1.599 EUR", note: "Zinsfrei",     surcharge: 0 },
];

export const ENTERPRISE_TIERS = [
  { from: 5,   discount: 10 },
  { from: 10,  discount: 15 },
  { from: 20,  discount: 20 },
  { from: 50,  discount: 30 },
  { from: 100, discount: 40 },
  { from: 200, discount: 50 },
];

// Sprint = 30 Tage + 12 Monate Plattform
export const OS_FEATURES = [
  { text: "14 Tage Geld-zurück-Garantie", highlight: true },
  { text: "30-Tage-Sprint mit Wlad · 1 Aufgabe / Tag", included: true, star: true },
  { text: "11 Wlad-Frameworks · sofort einsetzbar", included: true },
  { text: "WLAD AI 24/7 · in Wlads Stimme", included: true },
  { text: "12 Monate Plattform-Zugang inkludiert", included: true },
  { text: "91 Lektionen + 30 Drills + 12 Videokurse", included: true },
  { text: "Zertifikat 0001 · LinkedIn-ready", included: true },
  { text: "Sofortzugang per License Key", included: true },
];

// Plus-Plus = Sprint + Live-Q&As mit KI-Experten
export const OS_PLUS_FEATURES = [
  { text: "Alles aus dem Sprint", highlight: true },
  { text: "6× im Jahr Live-Q&A mit unseren KI-Experten · 90 Min", included: true, star: true },
  { text: "Drill-Channel · Theorie sofort am echten Fall", included: true },
  { text: "Sprint-Historie als Kontext für WLAD AI", included: true },
  { text: "Vorrang auf 1:1-Mentoring-Warteliste", included: true },
  { text: "Klasse 0001 Peer-Kreis · Lifetime-Zugang", included: true },
  { text: "Quartals-Review mit Strategie-Update", included: true },
  { text: "Vorzugs-Zugang Klasse 0002 (AI Agents Builder)", included: true },
];

export const ENTERPRISE_FEATURES = [
  { text: "B2B-Lizenzen für dein Unternehmen", highlight: true },
  { text: "Volumen-Rabatte: 10 % bis 50 % je nach Team-Größe", included: true, star: true },
  { text: "Zentrales Admin-Dashboard für alle Lizenzen", included: true },
  { text: "Onboarding-Workshop mit Wlad persönlich", included: true },
  { text: "Coachings optional zubuchbar", included: true },
  { text: "Individuelle Vertrags- und Rechnungsstellung", included: true },
  { text: "Dedizierter Account Manager", included: true },
];

export const COMPARISON_ROWS = [
  ["14 Tage Geld-zurück-Garantie", true, true, true],
  ["Diagnose + KI-Report", true, true, true],
  ["11 Wlad-Frameworks", true, true, true],
  ["30-Tage-Sprint mit täglichem Drill", true, true, true],
  ["WLAD AI 24/7", true, true, true],
  ["12 Monate Plattform-Zugang", true, true, true],
  ["91 Lektionen + 12 Videokurse", true, true, true],
  ["Zertifikat 0001 (LinkedIn-ready)", true, true, true],
  ["Ratenzahlung möglich", true, true, true],
  ["6× Live-Q&A mit KI-Experten (jährlich, 90 Min)", false, true, "optional"],
  ["Drill-Channel · echte Fälle", false, true, true],
  ["Quartals-Review", false, true, true],
  ["Vorrang 1:1-Mentoring", false, true, true],
  ["Klasse 0001 Peer-Kreis Lifetime", false, true, true],
  ["Volumen-Rabatte (10 bis 50 %)", false, false, true],
  ["Zentrales Admin-Dashboard", false, false, true],
  ["Onboarding-Workshop mit Wlad", false, false, true],
  ["Dedizierter Account Manager", false, false, true],
];

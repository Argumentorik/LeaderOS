// Pricing-Konstanten — Single source of truth für die Preise & Features
// Halte diese im Sync mit /app/backend/routes/payments.py PACKAGES und /app/backend/routes/admin.py ENTERPRISE tiers

export const PAYMENT_OPTIONS = [
  { id: "leader_os_full",   label: "Einmalzahlung",  total: 997,  per: "997 EUR",     note: "Bester Preis",       surcharge: 0 },
  { id: "leader_os_2rate",  label: "2 Raten",        total: 1100, per: "2 × 550 EUR", note: "+103 EUR Aufschlag", surcharge: 103 },
  { id: "leader_os_12rate", label: "12 Monatsraten", total: 1188, per: "12 × 99 EUR", note: "+191 EUR Aufschlag", surcharge: 191 },
];

export const ENTERPRISE_TIERS = [
  { from: 5,   discount: 10 },
  { from: 10,  discount: 15 },
  { from: 20,  discount: 20 },
  { from: 50,  discount: 30 },
  { from: 100, discount: 40 },
  { from: 200, discount: 50 },
];

export const OS_FEATURES = [
  { text: "14 Tage Testphase · jederzeit kündbar", highlight: true },
  { text: "Vollzugang zur WLADHUB Plattform · 1 Jahr", included: true },
  { text: "12 Premium-Videokurse (1 neuer Kurs jeden Monat)", included: true, star: true },
  { text: "Wert pro Kurs: 199 EUR · Gesamtwert: 2.388 EUR", subline: true },
  { text: "WladBot AI Coach 24/7", included: true },
  { text: "Personalisierte Learning Journey", included: true },
  { text: "Leadership Playbooks & Frameworks", included: true },
  { text: "License Key per E-Mail · Sofortzugang", included: true },
];

export const OS_PLUS_FEATURES = [
  { text: "Alles aus Leadership OS", highlight: true },
  { text: "12 Einzelcoachings mit Argumentorik-Leadership Coaches", included: true, star: true },
  { text: "Wert pro Coaching: 299 EUR · Gesamt: 3.588 EUR", subline: true },
  { text: "Persönliche Lernbegleitung über 12 Monate", included: true },
  { text: "Direkter Zugang zu Top-Coaches", included: true },
  { text: "Quartals-Reviews mit Strategie-Update", included: true },
  { text: "Priority Support · 24h Response", included: true },
];

export const ENTERPRISE_FEATURES = [
  { text: "B2B-Lizenzen für dein Unternehmen", highlight: true },
  { text: "Volumen-Rabatte: 10% – 50% je nach Mitarbeiterzahl", included: true, star: true },
  { text: "Zentrales Admin-Dashboard für alle Lizenzen", included: true },
  { text: "Onboarding-Workshop mit Wlad", included: true },
  { text: "Coachings optional zubuchbar", included: true },
  { text: "Individuelle Vertrags- und Rechnungsstellung", included: true },
  { text: "Dedizierter Account Manager", included: true },
];

export const COMPARISON_ROWS = [
  ["14 Tage Testphase", true, true, true],
  ["Leadership-Diagnose + KI-Report", true, true, true],
  ["12 Premium-Videokurse (1 pro Monat)", true, true, true],
  ["Personalisierter 30-Tage-Plan", true, true, true],
  ["WladBot AI Coach 24/7", true, true, true],
  ["WLADHUB Plattform-Vollzugang", true, true, true],
  ["Leadership Playbooks & Frameworks", true, true, true],
  ["License Key per E-Mail", true, true, true],
  ["Ratenzahlung möglich", true, false, true],
  ["12 Einzelcoachings (à 299 EUR Wert)", false, true, "optional"],
  ["Persönliche Lernbegleitung 12 Monate", false, true, true],
  ["Quartals-Reviews", false, true, true],
  ["Priority Support", false, true, true],
  ["Volumen-Rabatte (10–50%)", false, false, true],
  ["Zentrales Admin-Dashboard", false, false, true],
  ["Onboarding-Workshop mit Wlad", false, false, true],
  ["Dedizierter Account Manager", false, false, true],
  ["Individuelle Vertragsgestaltung", false, false, true],
];

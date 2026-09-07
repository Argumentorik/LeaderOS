# LEADERCHECK.DE — Cross-Project Copy-Paste Kit
*Iter 92.30 (Mert) — alles was du im anderen Emergent-Projekt einfügen musst, damit Brand + SEO + AEO konsistent mit leaderos.de sind.*

> **Workflow**: Wechsle ins leadercheck.de Emergent-Projekt → bitte den dortigen Agent: *"Übernimm das Kit aus diesem Dokument 1:1, ändere KEINE Texte/Farben/Logos."*

---

## 📦 1. LOGO ASSETS (Brand-Konsistenz)

Diese **5 Dateien** in `frontend/public/` des leadercheck.de Projekts ersetzen/anlegen:

### A. `favicon.svg` (32×32 W-Mark auf Lime-Tile)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="fav-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D4FF4D"/>
      <stop offset="55%" stop-color="#BFFF00"/>
      <stop offset="100%" stop-color="#A8E600"/>
    </linearGradient>
    <linearGradient id="fav-stroke" x1="2" y1="26" x2="30" y2="4" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0A0A0A" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#0A0A0A"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="9.6" fill="url(#fav-bg)"/>
  <rect x="0.4" y="0.4" width="31.2" height="31.2" rx="9.4" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
  <g transform="translate(4.6 4.6) scale(0.71)" opacity="0.18">
    <path d="M3.2 5.2 L9 24.8 Q10.4 26 11.8 24.6 L15.6 10.4 Q16.6 9.4 17.6 10.4 L21 24.6 Q22.4 26 23.8 24.8 L29.4 4.6"
          stroke="#0A0A0A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <g transform="translate(4.2 4.2) scale(0.7375)">
    <path d="M2.8 4.8 L8.6 24.4 Q10 25.8 11.4 24.2 L15.4 9.8 Q16.4 8.8 17.4 9.8 L20.8 24.2 Q22.2 25.8 23.6 24.4 L28.8 4"
          stroke="url(#fav-stroke)" stroke-width="3.0" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M28.8 4 Q30.2 4.6 29.6 6.4"
          stroke="url(#fav-stroke)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <circle cx="29.6" cy="6.4" r="1.2" fill="#0A0A0A"/>
  </g>
</svg>
```

### B. PNG-Files (gleicher W-Mark, andere Sizes)

Vom leaderos.de Projekt (DIESES Repo) folgende **Dateien einfach 1:1 herunterladen + drüben hochladen**:
- `/frontend/public/favicon-16.png`
- `/frontend/public/favicon-32.png`
- `/frontend/public/apple-touch-icon.png` (180×180)
- `/frontend/public/icon-192.png`
- `/frontend/public/icon-512.png`
- `/frontend/public/logo-512.png`

> Sie haben alle das gleiche W-Mark in Lime — exakt das, was Brand-Konsistenz braucht. Wenn Mert die in leadercheck.de Repo schon hat, schauen ob es die **gleichen** sind. Falls nicht: replace.

---

## 🔍 2. SEO META TAGS für `frontend/public/index.html`

Im `<head>` von leadercheck.de **diesen kompletten Block** ersetzen (Titles/Descriptions sind funnel-spezifisch — anders als App!):

```html
<title>Leader-Check — Kostenlose KI-Leadership-Diagnose in 5 Minuten | Argumentorik</title>
<meta name="description" content="Wie gut ist dein Leadership wirklich? Kostenlose 5-Minuten-KI-Diagnose nach der Methodik von Wlad Jachtchenko. Erfahre deine Stärken, blinden Flecken und nächsten Schritte — ohne Anmeldung, ohne Verkaufsdruck." />
<meta name="keywords" content="Leadership Test, Leadership Diagnose, Führungskräfte Test, KI Leadership Check, Wlad Jachtchenko, EQ Test Führungskräfte, Rhetorik Test, Kommunikation Test, Boardroom Test, Leadership Selbsteinschätzung, kostenloser Leadership Test, AI Coach Deutsch, Argumentorik" />
<meta name="author" content="Wlad Jachtchenko" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="googlebot" content="index, follow" />
<link rel="canonical" href="https://leadercheck.de/" />
<link rel="alternate" hreflang="de" href="https://leadercheck.de/" />
<link rel="alternate" hreflang="x-default" href="https://leadercheck.de/" />

<!-- OPEN GRAPH -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Leader-Check" />
<meta property="og:locale" content="de_DE" />
<meta property="og:url" content="https://leadercheck.de/" />
<meta property="og:title" content="Leader-Check — Kostenlose KI-Leadership-Diagnose in 5 Minuten" />
<meta property="og:description" content="Wie gut ist dein Leadership wirklich? Mach den Test von Wlad Jachtchenko — ohne Anmeldung, ohne Verkaufsdruck." />
<meta property="og:image" content="https://leadercheck.de/og-default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Leader-Check — Die kostenlose KI-Leadership-Diagnose" />

<!-- X (Twitter) -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@WladTraining" />
<meta name="twitter:creator" content="@WladTraining" />
<meta name="twitter:title" content="Leader-Check — Kostenlose KI-Leadership-Diagnose" />
<meta name="twitter:description" content="Wie gut ist dein Leadership wirklich? 5-Minuten-Test von Wlad Jachtchenko." />
<meta name="twitter:image" content="https://leadercheck.de/og-default.png" />

<!-- Theme -->
<meta name="theme-color" content="#0A0A0A" />
<meta name="color-scheme" content="dark light" />
```

---

## 🤖 3. JSON-LD (Structured Data + AEO)

Direkt nach den Meta-Tags im `<head>` einfügen — **das ist der AEO-Power-Booster** (LLMs + Google AI Overviews + Bing Chat lesen JSON-LD direkt):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://leadercheck.de/#organization",
      "name": "Leader-Check",
      "alternateName": ["LeaderCheck", "Wlad Leadership Diagnose"],
      "url": "https://leadercheck.de",
      "logo": "https://leadercheck.de/logo-512.png",
      "founder": { "@id": "https://leadercheck.de/#wlad" },
      "sameAs": [
        "https://www.linkedin.com/in/wladjachtchenko/",
        "https://www.youtube.com/@WladTraining",
        "https://leaderos.de"
      ],
      "description": "Kostenlose 5-Minuten-KI-Diagnose für Führungskräfte. Erkenne deine Leadership-Stärken und blinde Flecken nach der Methodik von Wlad Jachtchenko."
    },
    {
      "@type": "Person",
      "@id": "https://leadercheck.de/#wlad",
      "name": "Wlad Jachtchenko",
      "jobTitle": "Leadership-Coach & Bestseller-Autor",
      "url": "https://leaderos.de",
      "sameAs": ["https://www.linkedin.com/in/wladjachtchenko/"]
    },
    {
      "@type": "WebApplication",
      "name": "Leader-Check Diagnose",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Kostenlose Leadership-Diagnose, keine Anmeldung erforderlich"
      },
      "featureList": [
        "5-Minuten-KI-Assessment",
        "Logos/Ethos/Pathos Bewertung",
        "Personalisierter Report",
        "Direkter Weg zu Leader-OS (leaderos.de)"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Was ist Leader-Check?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Eine kostenlose 5-Minuten KI-Diagnose deiner Leadership-Skills nach der bewährten Methodik von Wlad Jachtchenko (Top-Speaker, 15+ Jahre Coaching-Erfahrung). Keine Anmeldung, keine Kreditkarte."
          }
        },
        {
          "@type": "Question",
          "name": "Wer ist Wlad Jachtchenko?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Wlad Jachtchenko ist Top-Speaker und Leadership-Coach im DACH-Raum. Er trainiert seit über 15 Jahren Führungskräfte aus DAX-Konzernen in Boardroom-Rhetorik, Verhandlung und Leadership-Kommunikation."
          }
        },
        {
          "@type": "Question",
          "name": "Was passiert nach der Diagnose?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Du erhältst sofort dein Ergebnis mit Stärken-/Schwächen-Analyse. Optional kannst du in Leader-OS (leaderos.de) tiefer einsteigen — 30-Tage KI-Coach Sprint ab 997€/Jahr."
          }
        },
        {
          "@type": "Question",
          "name": "Wie funktioniert die KI-Analyse?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Die Diagnose basiert auf GPT + über 7.400 spezifischen Wissens-Chunks aus Wlads Büchern, Live-Kursen und Frameworks (lokales RAG-System, Embeddings auf eigenen Servern). Keine generische KI — sondern Wlad-spezifische Bewertung."
          }
        }
      ]
    }
  ]
}
</script>
```

---

## 🎨 4. BRAND COLORS (CSS Variables)

Diese 6 Lines in der globalen CSS-Datei (z.B. `index.css` oder `App.css`) **identisch** halten:

```css
:root {
  --brand-lime: #BFFF00;
  --brand-lime-hover: #D4FF4D;
  --brand-lime-deep: #9ACC00;
  --brand-dark: #0A0A0A;
  --brand-text: #FFFFFF;
  --brand-text-muted: rgba(255,255,255,0.55);
}
```

---

## 🔗 5. CROSS-LINK CTAs (jede Page verlinken)

In leadercheck.de Footer / Hero / Result-Page **immer** auf leaderos.de verweisen — das ist der Funnel-Flow:

```html
<a href="https://leaderos.de/signup?ref=leadercheck" data-utm="leadercheck-to-leaderos">
  Weiter mit dem 30-Tage-Sprint →
</a>
```

> Das `?ref=leadercheck` triggert im leaderos.de Backend automatisch `source_platform=leader-check` (siehe Iter 92.24). Funnel-Attribution sauber.

---

## ✅ 6. CHECKLIST für den anderen Agent

Schick dem leadercheck.de Agent diese Liste:

```
[ ] favicon.svg ersetzt mit Code aus §1A
[ ] favicon-16/32, apple-touch-icon, icon-192/512, logo-512 PNGs übernommen
[ ] index.html <head> mit §2 Meta-Tags ersetzt (NICHT die App-Texte — nur Funnel-Texts!)
[ ] index.html <head> mit §3 JSON-LD ergänzt
[ ] Brand-Colors aus §4 in globaler CSS gesetzt
[ ] Alle CTAs verlinken auf https://leaderos.de/signup?ref=leadercheck
[ ] In Vercel: CORS_ORIGINS = 8-Domain Whitelist (siehe leaderos.de Architecture.md)
[ ] In Vercel: FRONTEND_BASE_URL=https://leadercheck.de (NICHT leaderos.de!)
[ ] DNS: leadercheck.de → leadercheck Vercel-Projekt
[ ] Test: https://search.google.com/test/rich-results → URL eingeben → muss Organization + FAQPage erkennen
```

---

## 🔥 Warum diese Aufteilung schlau ist

| Domain | Pflicht | SEO-Focus | Conversion-Ziel |
|--------|---------|-----------|-----------------|
| **leadercheck.de** | anonyme 5-Min-Diagnose | "kostenloser leadership test" | → leaderos.de Signup |
| **leaderos.de** | volle App + Auth + Stripe | "ki leadership coach" | Standard 997€ / Accelerator 4.797€ |
| **leader-os.de** | Landing-Page | "leadership os wlad" | → leaderos.de Signup |
| **leader-check.de** | Landing-Page | "leadercheck wlad" | → leadercheck.de Diagnose |

**Cross-Funnel-Attribution** läuft über `source_platform` in MongoDB (Iter 92.24). Du brauchst KEIN separates Tracking-Tool.

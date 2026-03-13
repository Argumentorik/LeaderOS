import { useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, Download, Calendar, Brain, Shield, Zap, Sparkles } from "lucide-react";

const stats = [
  { value: "3.7x", label: "mehr Resignationen ohne aktive Führungsentwicklung" },
  { value: "65%", label: "höheres Team-Engagement in Coaching-Kulturen" },
  { value: "40%", label: "der Führungskräfte erwägen Kündigung durch Überlastung" },
];

const options = [
  {
    badge: "EMPFOHLEN",
    badgeStyle: "bg-gradient-to-r from-amber-500 to-amber-400 text-black",
    title: "Vollzugang: WLADHUB Plattform",
    subtitle: "Das komplette Leadership-System",
    price: "Kostenloser Einstieg",
    cta: "Jetzt kostenlos starten",
    ctaStyle: "btn-amber",
    href: "https://polar.sh",
    external: true,
    features: [
      "7 vollständige Kurse nach Intentional Sequence",
      "24/7 WLADBOT als KI-Leadership-Coach",
      "Daily Intelligence Hub (3h → 15min)",
      "Persönliches Entscheidungs-Journal",
      "Strategy Canvas & Decision-Frameworks",
      "Community mit Foundern und C-Level Executives",
    ],
    icon: Brain,
    highlight: true,
  },
  {
    badge: "PDF",
    badgeStyle: "badge-blue",
    title: "Curriculum PDF",
    subtitle: "Vollständiger Kurs-Überblick",
    price: "Kostenlos",
    cta: "Curriculum herunterladen",
    ctaStyle: "btn-secondary",
    href: "#",
    external: false,
    features: [
      "Alle 7 Module im Überblick",
      "Lernziele pro Modul",
      "30-Tage-Fahrplan als Dokument",
      "Leadership-Framework-Referenz",
    ],
    icon: Download,
    highlight: false,
  },
  {
    badge: "PERSÖNLICH",
    badgeStyle: "badge-white",
    title: "30-Min Strategy Call",
    subtitle: "1:1 mit einem Leadership-Experten",
    price: "Kostenlos",
    cta: "Call buchen",
    ctaStyle: "btn-secondary",
    href: "https://calendly.com",
    external: true,
    features: [
      "Persönliche Report-Analyse",
      "Individuelle Entwicklungsstrategie",
      "KI-Integrations-Roadmap",
      "Nächste konkrete Schritte",
    ],
    icon: Calendar,
    highlight: false,
  },
];

export default function HighTicketClose() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030303] pb-24" data-testid="close-page">
      {/* Background Effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/4 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Deine Leadership-Transformation
          </div>
          <h1
            className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4"
            data-testid="close-headline"
          >
            Wir automatisieren
            <br />
            keine Leader.
            <br />
            <span className="text-gradient-amber">Wir upgraden sie.</span>
          </h1>
          <p className="font-inter text-lg text-slate-500 max-w-2xl mx-auto mt-6">
            Die Zukunft gehört nicht den Intelligentesten. Sie gehört den Klarsten,
            den Komponiertesten und den strategisch Empathischsten.
          </p>
        </div>

        {/* The Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14" data-testid="close-comparison">
          <div className="glass-card-subtle p-6">
            <div className="font-inter text-xs tracking-widest text-slate-600 mb-4">
              OHNE SYSTEM
            </div>
            <div className="space-y-3">
              {["KI übernimmt Entscheidungsprozesse", "Autorität erodiert langsam", "Team sucht Führung bei Tools", "3.7x höhere Resignationsrate"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-500 font-inter text-sm">
                  <span className="w-5 h-px bg-red-500/50 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6 card-glow-amber">
            <div className="font-inter text-xs tracking-widest text-amber-400 mb-4">
              MIT WLADHUB
            </div>
            <div className="space-y-3">
              {["KI als strategischen Hebel nutzen", "Boardroom-Autorität stärken", "Team folgt deiner Richtung", "65% höheres Team-Engagement"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300 font-inter text-sm">
                  <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14" data-testid="close-stats">
          {stats.map((s, i) => (
            <div key={i} className="glass-card-subtle p-6 text-center hover-card">
              <div className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-2">{s.value}</div>
              <div className="font-inter text-sm text-slate-500 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14" data-testid="close-options">
          {options.map((opt, i) => (
            <div 
              key={i} 
              className={`flex flex-col p-6 rounded-2xl ${
                opt.highlight 
                  ? "glass-card card-glow-amber border border-amber-500/20" 
                  : "glass-card-subtle"
              }`} 
              data-testid={`close-option-${i}`}
            >
              {/* Badge */}
              <div className={`inline-flex self-start text-xs font-semibold tracking-wider px-3 py-1.5 rounded-full mb-4 ${opt.badgeStyle}`}>
                {opt.badge}
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                opt.highlight ? "bg-amber-500/15" : "bg-white/5"
              }`}>
                <opt.icon className={`w-5 h-5 ${opt.highlight ? "text-amber-400" : "text-slate-400"}`} />
              </div>

              {/* Title */}
              <h3 className="font-manrope font-bold text-xl text-white mb-1">{opt.title}</h3>
              <p className="font-inter text-sm text-slate-500 mb-2">{opt.subtitle}</p>
              <div className="font-manrope font-bold text-white mb-5">{opt.price}</div>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {opt.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2">
                    <Zap className={`w-3 h-3 shrink-0 mt-1 ${opt.highlight ? "text-amber-500" : "text-slate-600"}`} />
                    <span className="font-inter text-sm text-slate-400 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {opt.external ? (
                <a
                  data-testid={`close-cta-${i}`}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${opt.ctaStyle} w-full py-3.5 font-medium flex items-center justify-center gap-2`}
                >
                  {opt.cta}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  data-testid={`close-cta-${i}`}
                  className={`${opt.ctaStyle} w-full py-3.5 font-medium flex items-center justify-center gap-2`}
                >
                  {opt.cta}
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Philosophy */}
        <div className="glass-card p-10 text-center mb-12">
          <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-6">
            Die nächste Generation von Leadern wird nicht durch Intelligenz definiert.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Klarheit unter Druck", "Ethisches Urteilsvermögen", "Überzeugende Kommunikation", "Emotionale Regulation", "Strategische Richtung"].map((q, i) => (
              <div key={i} className="badge-white px-4 py-2 text-sm">
                {q}
              </div>
            ))}
          </div>
          <p className="font-inter text-slate-500">
            KI kann Intelligenz assistieren. Nur du kannst Leadership verkörpern.
          </p>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="font-manrope font-bold text-sm tracking-widest text-slate-500 mb-6">
            SCHLIESSE DICH DEN LEADERN AN, DIE SICH WEIGERN, ERSETZBAR ZU WERDEN
          </p>
          <a
            data-testid="close-final-cta"
            href="https://polar.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-amber px-12 py-4 font-semibold inline-flex items-center gap-3"
          >
            Jetzt Vollzugang sichern
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

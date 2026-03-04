import { useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, Download, Calendar, Brain, Shield, Zap } from "lucide-react";

const stats = [
  { value: "3.7x", label: "mehr Resignationen ohne aktive Führungsentwicklung" },
  { value: "65%", label: "höheres Team-Engagement in Coaching-Kulturen" },
  { value: "40%", label: "der Führungskräfte erwägen Kündigung durch Überlastung" },
];

const options = [
  {
    badge: "EMPFOHLEN",
    badgeColor: "bg-amber-500 text-black",
    title: "Vollzugang: AI Learn Space",
    subtitle: "Das komplette Leadership-System",
    price: "Kostenloser Einstieg",
    cta: "Jetzt kostenlos starten",
    ctaStyle: "btn-amber",
    href: "https://polar.sh",
    external: true,
    features: [
      "7 vollständige Kurse nach Intentional Sequence",
      "24/7 KI-Leadership-Coach mit deinem Profil",
      "Daily Intelligence Hub (3h → 15min)",
      "Persönliches Entscheidungs-Journal",
      "Strategy Canvas & Decision-Frameworks",
      "Community mit Foundern und C-Level Executives",
    ],
    icon: Brain,
    color: "border-warm-DEFAULT/40 bg-warm-dim card-glow-amber",
  },
  {
    badge: "PDF",
    badgeColor: "bg-blue-500/20 text-blue-400",
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
    color: "border-blue-500/20 bg-cold-dim",
  },
  {
    badge: "PERSÖNLICH",
    badgeColor: "bg-white/10 text-white",
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
    color: "border-white/10 bg-noir-surface",
  },
];

export default function HighTicketClose() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-noir-bg pb-24" data-testid="close-page">
      {/* Glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-500/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-amber-500/20 bg-warm-dim px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-amber-400">
              Deine Leadership-Transformation
            </span>
          </div>
          <h1
            className="font-manrope font-black text-4xl md:text-6xl lg:text-7xl text-white leading-none mb-4"
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
        <div className="grid grid-cols-2 gap-4 mb-14" data-testid="close-comparison">
          <div className="border border-white/5 bg-noir-surface p-6">
            <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-slate-600 mb-4">
              OHNE SYSTEM
            </div>
            <div className="space-y-3">
              {["KI übernimmt Entscheidungsprozesse", "Autorität erodiert langsam", "Team sucht Führung bei Tools", "3.7x höhere Resignationsrate"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-500 text-sm font-inter">
                  <span className="w-4 h-px bg-red-400/50 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="border border-warm-DEFAULT/30 bg-warm-dim p-6">
            <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-amber-400 mb-4">
              MIT EMERGENT
            </div>
            <div className="space-y-3">
              {["KI als strategischen Hebel nutzen", "Boardroom-Autorität stärken", "Team folgt deiner Richtung", "65% höheres Team-Engagement"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-inter">
                  <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-14" data-testid="close-stats">
          {stats.map((s, i) => (
            <div key={i} className="border border-white/5 bg-noir-surface p-5 text-center">
              <div className="font-manrope font-black text-3xl md:text-4xl text-white mb-2">{s.value}</div>
              <div className="font-inter text-xs text-slate-500 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14" data-testid="close-options">
          {options.map((opt, i) => (
            <div key={i} className={`border p-6 flex flex-col ${opt.color}`} data-testid={`close-option-${i}`}>
              {/* Badge */}
              <div className={`inline-flex self-start text-xs font-manrope font-bold tracking-wider px-2 py-1 mb-4 ${opt.badgeColor}`}>
                {opt.badge}
              </div>

              {/* Icon */}
              <opt.icon className="w-6 h-6 mb-4 text-current opacity-60" />

              {/* Title */}
              <h3 className="font-manrope font-black text-lg text-white mb-1">{opt.title}</h3>
              <p className="font-inter text-xs text-slate-500 mb-2">{opt.subtitle}</p>
              <div className="font-manrope font-bold text-sm text-white mb-5">{opt.price}</div>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {opt.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2">
                    <Zap className="w-3 h-3 text-current opacity-50 shrink-0 mt-0.5" />
                    <span className="font-inter text-xs text-slate-400 leading-relaxed">{f}</span>
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
                  className={`${opt.ctaStyle} w-full py-3 font-manrope text-xs tracking-widest uppercase flex items-center justify-center gap-2`}
                >
                  {opt.cta}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  data-testid={`close-cta-${i}`}
                  className={`${opt.ctaStyle} w-full py-3 font-manrope text-xs tracking-widest uppercase flex items-center justify-center gap-2`}
                >
                  {opt.cta}
                  <Download className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Philosophy */}
        <div className="border border-white/5 bg-noir-surface p-10 text-center mb-12">
          <h2 className="font-manrope font-black text-2xl md:text-3xl text-white mb-4">
            Die nächste Generation von Leadern wird nicht durch Intelligenz definiert.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-8">
            {["Klarheit unter Druck", "Ethisches Urteilsvermögen", "Überzeugende Kommunikation", "Emotionale Regulation", "Strategische Richtung"].map((q, i) => (
              <div key={i} className="border border-white/5 p-3">
                <span className="font-inter text-xs text-slate-400">{q}</span>
              </div>
            ))}
          </div>
          <p className="font-inter text-slate-500">
            KI kann Intelligenz assistieren. Nur du kannst Leadership verkörpern.
          </p>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="font-manrope font-bold text-sm tracking-[0.3em] uppercase text-slate-500 mb-6">
            SCHLIESSE DICH DEN LEADERN AN, DIE SICH WEIGERN, ERSETZBAR ZU WERDEN
          </p>
          <a
            data-testid="close-final-cta"
            href="https://polar.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-amber px-12 py-4 font-manrope text-sm tracking-widest uppercase inline-flex items-center gap-3"
          >
            Jetzt Vollzugang sichern
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

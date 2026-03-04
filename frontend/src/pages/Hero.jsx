import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, TrendingUp, Sparkles, Clock, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "KI-Kompetenz",
    desc: "KI als strategischen Hebel nutzen",
    color: "#3B82F6"
  },
  {
    icon: MessageSquare,
    title: "Boardroom-Rhetorik",
    desc: "Autorität und Überzeugungskraft",
    color: "#60A5FA"
  },
  {
    icon: TrendingUp,
    title: "Strategisches EQ",
    desc: "Empathie als Wettbewerbsvorteil",
    color: "#F59E0B"
  }
];

const stats = [
  { value: "71%", label: "der Führungskräfte berichten von erhöhtem Stress" },
  { value: "40%", label: "denken aktiv an Kündigung durch Überlastung" },
  { value: "3.7x", label: "mehr Resignationen ohne aktive Entwicklung" }
];

const benefits = [
  { icon: Clock, text: "50 Szenarien in ~7 Minuten" },
  { icon: Zap, text: "Sofortiger Report" },
  { icon: Users, text: "Für Gründer & C-Level" }
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#030303] overflow-hidden" data-testid="hero-page">
      {/* Background Effects */}
      <div className="hero-glow-center" />
      <div className="hero-glow-amber" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10">
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 badge-blue px-4 py-2 mb-8 opacity-0 anim-fade-up"
              data-testid="hero-badge"
            >
              <span className="dot-pulse" style={{ background: '#3B82F6' }} />
              <span className="font-inter text-sm font-medium">
                AI Leadership Diagnose
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="font-manrope font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white mb-6 opacity-0 anim-fade-up delay-1"
              data-testid="hero-headline"
            >
              AI Changes Speed.
              <br />
              <span className="text-gradient-amber">Leadership</span> Decides Direction.
            </h1>

            {/* Subheadline */}
            <p
              className="font-inter text-base md:text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto opacity-0 anim-fade-up delay-2"
              data-testid="hero-subheadline"
            >
              Werde der Leader, den KI nicht ersetzen kann. Starte deine AI-Potential-Diagnose
              und erhalte deinen personalisierten{" "}
              <span className="text-white font-medium">30-Tage-Fahrplan</span>{" "}
              zur strategischen Dominanz.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 opacity-0 anim-fade-up delay-3">
              <button
                data-testid="hero-cta-primary"
                onClick={() => navigate("/diagnose")}
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold"
              >
                Diagnose starten
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary flex items-center justify-center gap-2 px-6 py-4 text-base"
              >
                Mehr erfahren
              </button>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 opacity-0 anim-fade-up delay-4">
              {benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-slate-600" />
                  <span className="font-inter">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 opacity-0 anim-slide-up delay-5">
            <div className="dashboard-frame max-w-5xl mx-auto p-1">
              <div className="bg-[#0a0a0a] rounded-[20px] p-6 md:p-8">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex items-center gap-2 badge-white px-3 py-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="font-inter text-xs text-slate-400">Daily Intelligence Hub</span>
                  </div>
                </div>
                
                {/* Mock Dashboard Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { time: "07:15", title: "Board-Briefing generiert", desc: "Automatisches Tages-Briefing", tag: "Rhetorik" },
                    { time: "08:30", title: "Entscheidungs-Journal", desc: "KI analysiert Muster", tag: "EQ-Score" },
                    { time: "09:00", title: "Marktlage zusammengefasst", desc: "Wettbewerber-Updates", tag: "Strategie" }
                  ].map((item, i) => (
                    <div key={i} className="glass-card-subtle p-4 hover-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs text-slate-600">{item.time}</span>
                        <span className="badge-blue px-2 py-0.5 text-xs">{item.tag}</span>
                      </div>
                      <h4 className="font-manrope font-semibold text-sm text-white mb-1">{item.title}</h4>
                      <p className="font-inter text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
                
                {/* Live indicator */}
                <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
                  <span className="dot-pulse" />
                  <span className="font-inter">KI-Coach verfügbar — kennt dein Profil</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-white/5 py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="font-inter text-sm text-slate-500 tracking-wide">Die brutale Realität</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" data-testid="hero-stats">
              {stats.map((s, i) => (
                <div key={i} className="glass-card-subtle p-6 text-center hover-card">
                  <div className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-2">
                    {s.value}
                  </div>
                  <div className="font-inter text-sm text-slate-500 leading-relaxed">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Layer Model Section */}
        <div id="features" className="py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Das 3-Layer-Modell
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Was Elite-Leader von allen anderen unterscheidet
              </h2>
              <p className="font-inter text-slate-500 max-w-2xl mx-auto">
                Die meisten Führungskräfte haben nur 1 von 3 Schichten. Elite-Leader integrieren alle 3.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="hero-layers">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="feature-card p-6 md:p-8"
                  data-testid={`hero-layer-${i}`}
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div className="font-manrope text-xs font-semibold tracking-widest text-slate-600 mb-2">
                    LAYER {i + 1}
                  </div>
                  <h3 className="font-manrope font-bold text-xl text-white mb-2">{feature.title}</h3>
                  <p className="font-inter text-sm text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4" />
                  Was dich erwartet
                </span>
                <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-6">
                  Dein persönlicher Leadership-Report in 7 Minuten
                </h2>
                <ul className="space-y-4">
                  {[
                    "Diagnose deiner 6 Führungsdimensionen",
                    "3-Layer-Score: KI-Kompetenz, Rhetorik, Strategisches EQ",
                    "Personalisierter 30-Tage-Aktionsplan",
                    "ROI-Prognose: Stunden gespart, Entscheidungsgeschwindigkeit",
                    "Zugang zum KI-Leadership-Coach"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 font-inter text-slate-300">
                      <span 
                        className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      >
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="glass-card p-8">
                <div className="font-manrope text-xs font-semibold tracking-widest text-slate-500 mb-6">
                  FÜR WEN IST DIE DIAGNOSE?
                </div>
                {[
                  { role: "Gründer & CEOs", desc: "Die KI-Transformation navigieren ohne Präsenz zu verlieren" },
                  { role: "C-Level Executives", desc: "Boardroom-Entscheidungen mit strategischem EQ beschleunigen" },
                  { role: "Senior Manager", desc: "Von Führungskraft zur unverzichtbaren Schlüsselperson werden" },
                  { role: "High-Potentials", desc: "Den Sprung in die Elite-Leadership beschleunigen" }
                ].map((item, i) => (
                  <div key={i} className="border-b border-white/5 py-4 last:border-0 last:pb-0 first:pt-0">
                    <div className="font-manrope font-semibold text-white mb-1">{item.role}</div>
                    <div className="font-inter text-sm text-slate-500">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-white mb-4 leading-tight">
              Bist du unter den <span className="text-gradient-amber">3% der Leader</span>,
              <br className="hidden md:block" />
              die KI beherrschen statt von ihr ersetzt zu werden?
            </h2>
            <p className="font-inter text-lg text-slate-500 mb-10">
              Finde es heraus — kostenlos, in 7 Minuten.
            </p>
            <button
              data-testid="hero-cta-bottom"
              onClick={() => navigate("/diagnose")}
              className="btn-primary px-10 py-4 text-base font-semibold inline-flex items-center gap-3"
            >
              Diagnose jetzt starten
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-manrope font-bold text-white">EMERGENT</span>
                <span className="text-slate-600">|</span>
                <span className="font-inter text-sm text-slate-500">Diagnostic Hub</span>
              </div>
              <div className="font-inter text-sm text-slate-600">
                © 2025 EMERGENT. Alle Rechte vorbehalten.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";

const HERO_BG = "https://images.pexels.com/photos/7319478/pexels-photo-7319478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const stats = [
  { value: "71%", label: "der Führungskräfte berichten von erhöhtem Stress", color: "text-blue-400" },
  { value: "40%", label: "denken aktiv an Kündigung durch Überlastung", color: "text-amber-500" },
  { value: "3.7x", label: "mehr Resignationen ohne aktive Entwicklung", color: "text-red-400" },
];

const layers = [
  { icon: Brain, label: "KI-Kompetenz", desc: "KI als strategischen Hebel nutzen", color: "border-blue-500/30 text-blue-400" },
  { icon: MessageSquare, label: "Boardroom-Rhetorik", desc: "Autorität und Überzeugungskraft", color: "border-blue-400/20 text-blue-300" },
  { icon: TrendingUp, label: "Strategisches EQ", desc: "Empathie als Wettbewerbsvorteil", color: "border-amber-500/30 text-amber-400" },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-noir-bg overflow-hidden" data-testid="hero-page">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt="Executive Leadership"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-bg via-noir-bg/95 to-noir-bg/80" />
      </div>

      {/* Blue glow left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      {/* Amber glow right */}
      <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-amber-600/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 border border-blue-500/20 bg-blue-500/5 px-4 py-2 mb-8 anim-fade-up"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-blue-400">
              AI Leadership Diagnose
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="font-manrope font-black text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight text-white mb-6 anim-fade-up delay-100"
            data-testid="hero-headline"
          >
            AI Changes Speed.
            <br />
            <span className="text-gradient-amber">Leadership</span>
            <br />
            Decides Direction.
          </h1>

          {/* Subheadline */}
          <p
            className="font-inter text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl anim-fade-up delay-200"
            data-testid="hero-subheadline"
          >
            Werde der Leader, den KI nicht ersetzen kann. Starte deine AI-Potential-Diagnose
            und erhalte deinen personalisierten{" "}
            <span className="text-white font-medium">30-Tage-Fahrplan</span>{" "}
            zur strategischen Dominanz.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 anim-fade-up delay-300">
            <button
              data-testid="hero-cta-primary"
              onClick={() => navigate("/diagnose")}
              className="btn-primary flex items-center justify-center gap-3 px-8 py-4 font-manrope text-sm tracking-widest uppercase"
            >
              Starte die Diagnose
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-inter">
              <span>50 Szenarien</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>~7 Minuten</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Kostenlos</span>
            </div>
          </div>

          {/* Stats – Brutal Reality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 anim-fade-up delay-400" data-testid="hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="border border-white/5 bg-noir-surface p-5">
                <div className={`font-manrope font-black text-3xl mb-1 ${s.color}`}>
                  {s.value}
                </div>
                <div className="font-inter text-xs text-slate-500 leading-relaxed">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Layer Model */}
        <div className="mt-24 pt-16 border-t border-white/5" data-testid="hero-layers">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-px bg-blue-500" />
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-slate-500">
              Das 3-Layer-Modell
            </span>
          </div>
          <h2 className="font-manrope font-bold text-2xl md:text-3xl text-white mb-10">
            Was Elite-Leader von allen anderen unterscheidet
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layers.map((layer, i) => (
              <div
                key={i}
                className={`border bg-noir-surface p-6 hover:bg-noir-highlight transition-all duration-200 ${layer.color}`}
                data-testid={`hero-layer-${i}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-manrope font-black text-sm tracking-widest text-slate-600">
                    LAYER {i + 1}
                  </span>
                </div>
                <layer.icon className="w-5 h-5 mb-3 opacity-70" />
                <h3 className="font-manrope font-bold text-lg text-white mb-1">{layer.label}</h3>
                <p className="font-inter text-sm text-slate-500">{layer.desc}</p>
              </div>
            ))}
          </div>

          <p className="font-inter text-sm text-slate-600 mt-6">
            <AlertTriangle className="w-4 h-4 inline mr-2 text-amber-600" />
            Die meisten Führungskräfte haben nur 1 von 3 Schichten. Elite-Leader integrieren alle 3.
          </p>
        </div>

        {/* What you get */}
        <div className="mt-24 pt-16 border-t border-white/5" data-testid="hero-benefits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-amber-500 mb-3 block">
                Was dich erwartet
              </span>
              <h2 className="font-manrope font-bold text-2xl md:text-3xl text-white mb-6">
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
                  <li key={i} className="flex items-start gap-3 font-inter text-sm text-slate-400">
                    <span className="w-5 h-5 rounded-none bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-white/5 bg-noir-surface p-8">
              <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-slate-500 mb-4">
                Für wen ist die Diagnose?
              </div>
              {[
                { role: "Gründer & CEOs", desc: "Die KI-Transformation navigieren ohne Präsenz zu verlieren" },
                { role: "C-Level Executives", desc: "Boardroom-Entscheidungen mit strategischem EQ beschleunigen" },
                { role: "Senior Manager", desc: "Von Führungskraft zur unverzichtbaren Schlüsselperson werden" },
                { role: "High-Potentials", desc: "Den Sprung in die Elite-Leadership beschleunigen" },
              ].map((item, i) => (
                <div key={i} className="border-b border-white/5 py-4 last:border-0 last:pb-0">
                  <div className="font-manrope font-semibold text-sm text-white mb-1">{item.role}</div>
                  <div className="font-inter text-xs text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 text-center">
          <h2 className="font-manrope font-black text-3xl md:text-4xl text-white mb-4">
            Bist du unter den <span className="text-gradient-amber">3% der Leader</span>,<br />
            die KI beherrschen statt von ihr ersetzt zu werden?
          </h2>
          <p className="font-inter text-slate-500 mb-8">Finde es heraus – kostenlos, in 7 Minuten.</p>
          <button
            data-testid="hero-cta-bottom"
            onClick={() => navigate("/diagnose")}
            className="btn-primary px-10 py-4 font-manrope text-sm tracking-widest uppercase inline-flex items-center gap-3"
          >
            Diagnose jetzt starten
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

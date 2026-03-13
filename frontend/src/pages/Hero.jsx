import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, TrendingUp, Sparkles, Clock, Zap, Users, Target, Briefcase, User, Bot, BookOpen, Play, X, Check, CheckSquare, Calendar, MessageCircle } from "lucide-react";
import { ScrollReveal } from "../hooks/useScrollReveal";

const layers = [
  {
    num: "01",
    icon: Brain,
    title: "KI-Kompetenz",
    subtitle: "Layer 1",
    desc: "KI als strategischen Hebel nutzen.",
    points: ["Entscheidungen schneller treffen", "Prozesse automatisieren", "Wettbewerbsvorteile schaffen"],
    color: "#F59E0B" // Changed to amber
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Boardroom-Rhetorik",
    subtitle: "Layer 2",
    desc: "Autorität zeigen, wenn es darauf ankommt.",
    points: ["Argumentationsstruktur", "Klare Kommunikation", "Souveräne Präsenz"],
    color: "#F97316" // Orange
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Strategisches EQ",
    subtitle: "Layer 3",
    desc: "Empathie als Führungskraft-Verstärker.",
    points: ["Teamdynamiken verstehen", "Vertrauen aufbauen", "Konflikte strategisch lösen"],
    color: "#D97706" // Darker amber
  }
];

const problems = [
  "Gute Strategen ohne Überzeugungskraft",
  "Rhetorisch stark, aber ohne KI-Kompetenz",
  "Empathisch – aber ohne klare Entscheidungsfähigkeit"
];

const diagnoseSteps = [
  { num: "1", title: "Diagnose deiner 5+1 Führungsdimensionen", desc: "" },
  { num: "2", title: "Deinen persönlichen 3-Layer Score", desc: "KI-Kompetenz · Boardroom-Rhetorik · Strategisches EQ" },
  { num: "3", title: "Personalisierter 30-Tage-Aktionsplan", desc: "Klare Schritte, um deine Führungswirkung zu erhöhen." },
  { num: "4", title: "ROI-Prognose", desc: "Eingesparte Stunden · Schnellere Entscheidungen · Höhere Wirkung" }
];

const platformFeatures = [
  { icon: Bot, title: "AI Coach", desc: "24/7 persönliches Coaching", color: "#F59E0B" },
  { icon: CheckSquare, title: "Tasks", desc: "Tägliche Leadership-Aufgaben", color: "#F97316" },
  { icon: Users, title: "Simulation", desc: "Schwierige Gespräche üben", color: "#D97706" },
  { icon: BookOpen, title: "Playbooks", desc: "Bewährte Strategien", color: "#F59E0B" },
  { icon: Calendar, title: "Events", desc: "Live-Sessions & Workshops", color: "#F97316" },
  { icon: MessageCircle, title: "Community", desc: "Coaching-Community-Zugang", color: "#D97706" },
];

const wladbotFeatures = [
  "Vorbereitung schwieriger Gespräche",
  "Strukturierung von Argumentationen",
  "Analyse von Führungssituationen",
  "Simulation von Boardroom-Diskussionen"
];

const audiences = [
  {
    icon: Target,
    title: "Selbstständige",
    desc: "Die KI-Transformation steuern – ohne ihre persönliche Autorität zu verlieren."
  },
  {
    icon: Briefcase,
    title: "Angestellte",
    desc: "Boardroom-Entscheidungen mit strategischem EQ beschleunigen."
  },
  {
    icon: TrendingUp,
    title: "Senior Manager",
    desc: "Den Schritt machen von der Führungskraft zur unverzichtbaren Schlüsselperson."
  },
  {
    icon: User,
    title: "High Potentials",
    desc: "Den Aufstieg in die Elite-Leadership gezielt beschleunigen."
  }
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
        {/* ===== SECTION 1: HERO ===== */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pre-headline */}
            <p className="font-inter text-sm md:text-base text-slate-500 mb-6 opacity-0 anim-fade-up">
              Werde der Leader, den KI nicht ersetzen kann.
            </p>

            {/* Main Headline */}
            <h1
              className="font-manrope font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white mb-6 opacity-0 anim-fade-up delay-1"
              data-testid="hero-headline"
            >
              Die neue Elite der Führungskräfte
              <br />
              <span className="text-gradient-amber">beherrscht drei Fähigkeiten</span>
              <br />
              gleichzeitig.
            </h1>

            {/* Three Skills */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8 opacity-0 anim-fade-up delay-2">
              <span className="badge-blue px-4 py-2 text-sm font-medium">KI-Kompetenz</span>
              <span className="badge-blue px-4 py-2 text-sm font-medium">Boardroom-Rhetorik</span>
              <span className="badge-amber px-4 py-2 text-sm font-medium">Strategisches EQ</span>
            </div>

            {/* Subheadline */}
            <p
              className="font-inter text-base md:text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto opacity-0 anim-fade-up delay-3"
              data-testid="hero-subheadline"
            >
              Mit der <span className="text-white font-semibold">WLADHUB Diagnose</span> findest du in nur{" "}
              <span className="text-white font-semibold">7 Minuten</span> heraus, wo du heute stehst – 
              und wie du zu den <span className="text-gradient-amber font-semibold">Top 3 % der Leader</span> gehörst.
            </p>

            {/* CTA */}
            <div className="opacity-0 anim-fade-up delay-4">
              <button
                data-testid="hero-cta-primary"
                onClick={() => navigate("/diagnose")}
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold mx-auto mb-4"
              >
                Kostenlose Leadership-Diagnose starten
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="font-inter text-sm text-slate-600">
                7 Minuten · Sofortiger Report · Persönlicher Aktionsplan
              </p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: PROBLEM ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="font-inter text-xs tracking-widest text-slate-600 uppercase mb-4 block">
                  Die Realität moderner Führung
                </span>
                <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                  Viele Führungskräfte sind in einem Bereich stark –
                  <br className="hidden md:block" />
                  <span className="text-slate-500">aber nicht in allen.</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Problems */}
              <ScrollReveal delay={100}>
                <div className="glass-card-subtle p-8">
                  <div className="font-inter text-xs tracking-widest text-slate-600 uppercase mb-6">
                    Typische Muster
                  </div>
                  <div className="space-y-4">
                    {problems.map((problem, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                        <span className="font-inter text-slate-400">{problem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Consequences */}
              <ScrollReveal delay={200}>
                <div className="glass-card p-8 card-glow-amber">
                  <div className="font-inter text-xs tracking-widest text-amber-500/80 uppercase mb-6">
                    Das Ergebnis
                  </div>
                  <div className="space-y-3">
                    {["Langsame Entscheidungen.", "Verpasste Chancen.", "Sinkender Einfluss."].map((item, i) => (
                      <div key={i} className="font-manrope font-bold text-xl text-white">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: 3-LAYER MODEL ===== */}
        <section id="model" className="py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4" />
                Das 3-Layer-Modell der Elite-Leader
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                Die besten Führungskräfte kombinieren
                <br />
                <span className="text-gradient-amber">drei Ebenen gleichzeitig.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="hero-layers">
              {layers.map((layer, i) => (
                <div
                  key={i}
                  className="feature-card p-6 md:p-8"
                  data-testid={`hero-layer-${i}`}
                >
                  {/* Layer Number */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-manrope text-xs font-semibold tracking-widest text-slate-600">
                      {layer.subtitle.toUpperCase()}
                    </span>
                    <span className="font-manrope font-extrabold text-3xl text-white/10">
                      {layer.num}
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${layer.color}15` }}
                  >
                    <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="font-manrope font-bold text-xl text-white mb-2">{layer.title}</h3>
                  <p className="font-inter text-sm text-slate-500 mb-5">{layer.desc}</p>
                  
                  {/* Points */}
                  <div className="space-y-2">
                    {layer.points.map((point, pi) => (
                      <div key={pi} className="flex items-center gap-3">
                        <Check className="w-4 h-4 shrink-0" style={{ color: layer.color }} />
                        <span className="font-inter text-sm text-slate-400">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 4: DIE DIAGNOSE ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4" />
                In nur 7 Minuten
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Dein persönlicher Leadership-Report
              </h2>
              <p className="font-inter text-slate-500 max-w-2xl mx-auto">
                Die WLADHUB Diagnose analysiert deine Führungskompetenzen anhand eines strukturierten Modells.
              </p>
            </div>

            {/* What you get */}
            <div className="font-inter text-sm text-slate-500 mb-6 text-center">Du erhältst:</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="diagnose-steps">
              {diagnoseSteps.map((step, i) => (
                <div key={i} className="glass-card p-6 hover-card">
                  <div className="flex items-start gap-4">
                    <span 
                      className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-manrope font-bold shrink-0"
                    >
                      {step.num}
                    </span>
                    <div>
                      <h4 className="font-manrope font-bold text-white mb-1">{step.title}</h4>
                      {step.desc && (
                        <p className="font-inter text-sm text-slate-500">{step.desc}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: WLADHUB PLATTFORM ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4" />
                WLADBOT Plattform
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Nach deiner Diagnose erhältst du Zugang zur
                <span className="text-gradient-blue"> WLADBOT Plattform.</span>
              </h2>
              <p className="font-inter text-slate-500 max-w-2xl mx-auto">
                Alles, was du für deinen Aufstieg brauchst – an einem Ort.
              </p>
            </div>

            {/* Platform Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platformFeatures.map((feature, i) => (
                <div key={i} className="feature-card p-5 text-center hover-card">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-manrope font-bold text-white mb-1">{feature.title}</h3>
                  <p className="font-inter text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: WLADBOT ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* WLADBOT Preview */}
              <div className="glass-card p-6 card-glow-blue order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-white">WLADBOT</div>
                    <div className="flex items-center gap-2">
                      <span className="dot-pulse" style={{ width: 6, height: 6 }} />
                      <span className="font-inter text-xs text-slate-500">KI-Leadership-Coach</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                    <p className="font-inter text-sm text-slate-300">
                      "Wie kann ich mich auf ein schwieriges Feedbackgespräch mit meinem Team vorbereiten?"
                    </p>
                  </div>
                  <div className="bg-blue-500 px-4 py-3 rounded-2xl rounded-br-md ml-8">
                    <p className="font-inter text-sm text-white">
                      Lass uns das strukturiert angehen. Zunächst: Was ist der konkrete Anlass?
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
                  <Bot className="w-4 h-4" />
                  Der WLADBOT
                </span>
                <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                  Dein persönlicher
                  <span className="text-gradient-amber"> KI-Leadership-Coach.</span>
                </h2>
                <p className="font-inter text-slate-500 mb-6">
                  Du kannst ihn nutzen für:
                </p>
                <div className="space-y-3 mb-8">
                  {wladbotFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="font-inter text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="glass-card-subtle p-4">
                  <p className="font-inter text-sm text-slate-500">
                    Der WLADBOT kombiniert: <span className="text-slate-300">KI-Analyse</span> · <span className="text-slate-300">Leadership-Modelle</span> · <span className="text-slate-300">Rhetorik-Training</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: LEADERSHIP KURS ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
              <BookOpen className="w-4 h-4" />
              Bonus
            </span>
            <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
              Zugang zu ausgewählten Modulen des
              <span className="text-gradient-blue"> WLAD Leadership Programms.</span>
            </h2>
            <p className="font-inter text-slate-500 mb-8 max-w-2xl mx-auto">
              Im Kurs lernst du:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Brain, text: "KI strategisch im Führungsalltag einsetzen" },
                { icon: MessageSquare, text: "Überzeugend argumentieren" },
                { icon: Users, text: "Teams mit strategischem EQ führen" }
              ].map((item, i) => (
                <div key={i} className="glass-card-subtle p-5 hover-card">
                  <item.icon className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                  <p className="font-inter text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="glass-card-subtle p-4 inline-block">
              <p className="font-inter text-sm text-slate-500">
                Die Inhalte verbinden <span className="text-white font-medium">Rhetorik</span>, <span className="text-white font-medium">Strategie</span> und <span className="text-white font-medium">KI-Kompetenz</span> in einem strukturierten System.
              </p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: ZIELGRUPPE ===== */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Für wen ist diese Diagnose gedacht?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="audience-cards">
              {audiences.map((audience, i) => (
                <div key={i} className="feature-card p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <audience.icon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-manrope font-bold text-white mb-2">{audience.title}</h3>
                  <p className="font-inter text-sm text-slate-500">{audience.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 9: FINAL CTA ===== */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="font-inter text-sm text-slate-600 mb-4 block">Die entscheidende Frage</span>
            <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-white mb-6 leading-tight">
              Gehörst du zu den <span className="text-gradient-amber">3 % der Leader</span>,
              <br className="hidden md:block" />
              die KI strategisch beherrschen –
              <br className="hidden md:block" />
              statt von ihr ersetzt zu werden?
            </h2>
            <p className="font-inter text-lg text-slate-500 mb-10">
              Finde es heraus. <span className="text-white">Kostenlos. In nur 7 Minuten.</span>
            </p>
            <button
              data-testid="hero-cta-bottom"
              onClick={() => navigate("/diagnose")}
              className="btn-primary px-10 py-4 text-base font-semibold inline-flex items-center gap-3"
            >
              Leadership-Diagnose starten
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-manrope font-bold text-white">WLADHUB</span>
                <span className="text-slate-600">|</span>
                <span className="font-inter text-sm text-slate-500">Leadership Diagnose</span>
              </div>
              <div className="font-inter text-sm text-slate-600">
                © 2025 WLADHUB. Alle Rechte vorbehalten.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

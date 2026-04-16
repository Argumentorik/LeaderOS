import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, TrendingUp, Sparkles, Clock, Zap, Users, Target, Briefcase, User, Bot, BookOpen, Play, X, Check, CheckSquare, Calendar, MessageCircle, Download } from "lucide-react";
import { ScrollReveal } from "../hooks/useScrollReveal";
import { useState, useEffect } from "react";

const headlines = [
  {
    pre: "Werde der Leader, den KI nicht ersetzen kann.",
    lines: ["KI skaliert Intelligenz.", "{Leadership bestimmt}", "die Richtung."],
  },
  {
    pre: "Die KI-Ära braucht eine neue Art von Führung.",
    lines: ["Beherrschst du die", "{5+1 Rollen des modernen}", "Leaders?"],
  },
  {
    pre: "Dein Leadership-Profil in 10 Minuten.",
    lines: ["Entdecke, welche", "{Führungsrolle}", "dich definiert."],
  },
];

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
  { icon: Bot, title: "Leadership Coach", desc: "Dein persönlicher KI-Coach, der dein Profil kennt", color: "#F59E0B" },
  { icon: CheckSquare, title: "Task Agent", desc: "Tägliche Aufgaben, angepasst an deine Schwächen", color: "#F97316" },
  { icon: Users, title: "Simulations-Agent", desc: "Übe schwierige Gespräche mit KI-Gegenüber", color: "#D97706" },
  { icon: BookOpen, title: "Strategie-Agent", desc: "Playbooks & Frameworks auf Abruf", color: "#F59E0B" },
  { icon: Calendar, title: "Event-Agent", desc: "Live-Sessions, passend zu deinem Level", color: "#F97316" },
  { icon: MessageCircle, title: "Community-Agent", desc: "Vernetzung mit Führungskräften deiner Stufe", color: "#D97706" },
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
  const [headlineIdx] = useState(() => {
    const stored = sessionStorage.getItem("wladhub_ab");
    if (stored !== null) return parseInt(stored, 10);
    const idx = Math.floor(Math.random() * headlines.length);
    sessionStorage.setItem("wladhub_ab", idx);
    return idx;
  });
  const hl = headlines[headlineIdx];

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
        <section className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 pt-32 pb-24">
          {/* Pre-headline */}
          <p className="font-inter text-sm md:text-base text-slate-500 mb-8 opacity-0 anim-fade-up text-center">
            {hl.pre}
          </p>

          {/* Main Headline — A/B tested */}
          <h1
            className="font-manrope font-extrabold text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.03em] text-white mb-8 opacity-0 anim-fade-up delay-1 text-center"
            data-testid="hero-headline"
          >
            {hl.lines.map((line, i) => {
              const isAccent = line.startsWith("{") && line.endsWith("}");
              const text = isAccent ? line.slice(1, -1) : line;
              return (
                <span key={i}>
                  {isAccent ? <span className="text-gradient-amber">{text}</span> : text}
                  {i < hl.lines.length - 1 && <br />}
                </span>
              );
            })}
          </h1>

          {/* Three Skills */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mb-10 opacity-0 anim-fade-up delay-2">
            <span className="badge-blue px-5 py-2.5 text-sm font-semibold tracking-wide">KI-Kompetenz</span>
            <span className="badge-blue px-5 py-2.5 text-sm font-semibold tracking-wide">Boardroom-Rhetorik</span>
            <span className="badge-amber px-5 py-2.5 text-sm font-semibold tracking-wide">Strategisches EQ</span>
          </div>

          {/* Subheadline */}
          <p
            className="font-inter text-base md:text-lg text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto opacity-0 anim-fade-up delay-3 text-center"
            data-testid="hero-subheadline"
          >
            Die <span className="text-white font-semibold">WLADHUB Diagnose</span> zeigt dir in{" "}
            <span className="text-white font-semibold">10 Minuten</span>, wo du stehst – 
            und was dich von den <span className="text-gradient-amber font-semibold">Top 1 % der Leader</span> trennt.
          </p>

          {/* CTA */}
          <div className="opacity-0 anim-fade-up delay-4 text-center">
            <button
              data-testid="hero-cta-primary"
              onClick={() => navigate("/diagnose")}
              className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-semibold mb-5"
            >
              Kostenlose Leadership-Diagnose starten
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="font-inter text-sm text-slate-600">
              10 Minuten · Sofortiger Report · Persönlicher Aktionsplan
            </p>
          </div>
        </section>

        {/* ===== SECTION 2: PROBLEM – Clean Dashboard Style ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase mb-5">
                  Die Realität moderner Führung
                </span>
                <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4 leading-tight">
                  Viele Führungskräfte sind in einem Bereich stark –
                  <br className="hidden md:block" />
                  <span className="text-slate-500">aber nicht in allen.</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
              {/* Problems – 3 cols */}
              <ScrollReveal delay={100}>
                <div className="md:col-span-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-8">
                  <div className="font-inter text-[10px] tracking-[0.2em] text-slate-600 uppercase mb-6">
                    Typische Muster
                  </div>
                  <div className="space-y-5">
                    {problems.map((problem, i) => (
                      <div key={i} className="flex items-start gap-4 group">
                        <div className="w-7 h-7 rounded-lg bg-red-500/8 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 text-red-400/60" />
                        </div>
                        <span className="font-inter text-[15px] text-slate-400 leading-relaxed">{problem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Consequences – 2 cols */}
              <ScrollReveal delay={200}>
                <div className="md:col-span-2 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-8">
                  <div className="font-inter text-[10px] tracking-[0.2em] text-amber-500/60 uppercase mb-6">
                    Das Ergebnis
                  </div>
                  <div className="space-y-4">
                    {["Langsame Entscheidungen.", "Verpasste Chancen.", "Sinkender Einfluss."].map((item, i) => (
                      <div key={i} className="font-manrope font-bold text-lg text-white/90">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/[0.04]">
                    <p className="font-inter text-xs text-slate-600 leading-relaxed">
                      Die WLADHUB Diagnose zeigt dir in 10 Minuten, welche Rolle du vernachlässigst.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: 3-LAYER MODEL – Clean ===== */}
        <section id="model" className="py-24 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full border border-blue-500/15 bg-blue-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-blue-400 uppercase mb-5">
                Das 3-Layer-Modell
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                Die besten Führungskräfte kombinieren
                <br />
                <span className="text-gradient-amber">drei Ebenen gleichzeitig.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="hero-layers">
              {layers.map((layer, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-7 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.025]"
                  data-testid={`hero-layer-${i}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-inter text-[10px] font-medium tracking-[0.2em] text-slate-600 uppercase">
                      {layer.subtitle.toUpperCase()}
                    </span>
                    <span className="font-manrope font-extrabold text-2xl text-white/[0.06]">
                      {layer.num}
                    </span>
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${layer.color}10` }}
                  >
                    <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                  </div>
                  
                  <h3 className="font-manrope font-bold text-lg text-white mb-2">{layer.title}</h3>
                  <p className="font-inter text-sm text-slate-500 mb-5 leading-relaxed">{layer.desc}</p>
                  
                  <div className="space-y-2.5 pt-4 border-t border-white/[0.04]">
                    {layer.points.map((point, pi) => (
                      <div key={pi} className="flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                        <span className="font-inter text-sm text-slate-400">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 4: DIE DIAGNOSE – Clean ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full border border-amber-500/15 bg-amber-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-amber-400 uppercase mb-5">
                10 Minuten
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Dein persönlicher Leadership-Report
              </h2>
              <p className="font-inter text-sm text-slate-500 max-w-xl mx-auto">
                Die WLADHUB Diagnose analysiert deine Führungskompetenzen anhand eines strukturierten Modells.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="diagnose-steps">
              {diagnoseSteps.map((step, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all hover:border-white/[0.08]">
                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 rounded-lg bg-blue-500/8 text-blue-400 flex items-center justify-center font-manrope font-bold text-sm shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <h4 className="font-manrope font-bold text-white text-[15px] mb-1">{step.title}</h4>
                      {step.desc && (
                        <p className="font-inter text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: 6 KI-AGENTEN – Dashboard Style ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full border border-blue-500/15 bg-blue-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-blue-400 uppercase mb-5">
                6 KI-Agenten
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Mehrere spezialisierte Agenten,
                <span className="text-gradient-blue"> die das Leben eines Leaders erleichtern.</span>
              </h2>
              <p className="font-inter text-sm text-slate-500 max-w-xl mx-auto">
                Jeder Agent ist auf einen Bereich deiner Führungsentwicklung spezialisiert.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platformFeatures.map((feature, i) => (
                <div key={i} className="group rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.025]">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${feature.color}08` }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full opacity-60 animate-pulse" style={{ backgroundColor: feature.color }} />
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-1">{feature.title}</h3>
                  <p className="font-inter text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: WLADBOT – Clean ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* WLADBOT Preview */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/8 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">WLADBOT</div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-inter text-xs text-slate-500">Online</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/[0.03] border border-white/[0.04] px-4 py-3 rounded-2xl rounded-bl-md">
                    <p className="font-inter text-sm text-slate-300">
                      "Wie kann ich mich auf ein schwieriges Feedbackgespräch mit meinem Team vorbereiten?"
                    </p>
                  </div>
                  <div className="bg-blue-500/90 px-4 py-3 rounded-2xl rounded-br-md ml-8">
                    <p className="font-inter text-sm text-white">
                      Lass uns das strukturiert angehen. Zunächst: Was ist der konkrete Anlass?
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="inline-block px-3 py-1 rounded-full border border-amber-500/15 bg-amber-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-amber-400 uppercase mb-5">
                  Der WLADBOT
                </span>
                <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                  Dein persönlicher
                  <span className="text-gradient-amber"> KI-Leadership-Coach.</span>
                </h2>
                <p className="font-inter text-sm text-slate-500 mb-6">
                  Du kannst ihn nutzen für:
                </p>
                <div className="space-y-3 mb-8">
                  {wladbotFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="font-inter text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                  <p className="font-inter text-xs text-slate-500">
                    Kombiniert: <span className="text-slate-400">KI-Analyse</span> · <span className="text-slate-400">Leadership-Modelle</span> · <span className="text-slate-400">Rhetorik-Training</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: LEADERSHIP KURS – Clean ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="inline-block px-3 py-1 rounded-full border border-blue-500/15 bg-blue-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-blue-400 uppercase mb-5">
              Bonus
            </span>
            <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
              Zugang zu ausgewählten Modulen des
              <span className="text-gradient-blue"> WLAD Leadership Programms.</span>
            </h2>
            <p className="font-inter text-sm text-slate-500 mb-8 max-w-xl mx-auto">
              Im Kurs lernst du:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Brain, text: "KI strategisch im Führungsalltag einsetzen" },
                { icon: MessageSquare, text: "Überzeugend argumentieren" },
                { icon: Users, text: "Teams mit strategischem EQ führen" }
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all hover:border-white/[0.08]">
                  <item.icon className="w-5 h-5 text-blue-400 mx-auto mb-3" />
                  <p className="font-inter text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 inline-block">
              <p className="font-inter text-xs text-slate-500">
                Die Inhalte verbinden <span className="text-slate-400 font-medium">Rhetorik</span>, <span className="text-slate-400 font-medium">Strategie</span> und <span className="text-slate-400 font-medium">KI-Kompetenz</span> in einem strukturierten System.
              </p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: ZIELGRUPPE – Clean ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Für wen ist diese Diagnose gedacht?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="audience-cards">
              {audiences.map((audience, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center transition-all hover:border-white/[0.08]">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                    <audience.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-2">{audience.title}</h3>
                  <p className="font-inter text-xs text-slate-500 leading-relaxed">{audience.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 9: SOCIAL PROOF + SCARCITY – Clean ===== */}
        <section className="py-24 border-t border-white/[0.04]" data-testid="scarcity-section">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full border border-amber-500/15 bg-amber-500/[0.04] text-[10px] font-semibold tracking-[0.2em] text-amber-400 uppercase mb-5">
                Limitiert in 2026
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
                Nur <span className="text-gradient-amber">1 % der Führungskräfte</span> nutzen
                <br className="hidden md:block" />
                KI wirklich strategisch.
              </h2>
              <p className="font-inter text-base text-slate-500 max-w-2xl mx-auto">
                Die anderen 99 % lesen darüber. Du könntest es heute noch ändern – in 10 Minuten weißt du genau, wo du stehst.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-amber-400 mb-2">2.847+</div>
                <div className="font-inter text-xs text-slate-500">Leader haben die Diagnose bereits gemacht</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-white mb-2">94%</div>
                <div className="font-inter text-xs text-slate-500">sagen: "Hat mir die Augen geöffnet"</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-white mb-2">10 Min</div>
                <div className="font-inter text-xs text-slate-500">für Klarheit, die andere in Monaten nicht bekommen</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
              <p className="font-inter text-sm text-slate-400 italic leading-relaxed">
                "Ich dachte, ich wäre ein guter Kommunikator – bis WLADHUB mir gezeigt hat, dass mein eigentlicher Hebel im strategischen EQ liegt. Das hat alles verändert."
              </p>
              <p className="font-inter text-xs text-slate-600 mt-3">— Senior Manager, DAX 40 Unternehmen</p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 10: FREE CREDITS + LEADER-OS.DE ===== */}
        <section className="py-20 border-t border-white/5" data-testid="free-credits-section">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="glass-card p-8 md:p-10 border border-green-500/15 bg-gradient-to-br from-green-500/5 via-transparent to-amber-500/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/20 text-green-400 text-xs font-bold inline-block mb-4">
                    GRATIS NACH COMPLETION
                  </div>
                  <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-3">
                    50 Free Credits für die
                    <span className="text-gradient-amber"> beste KI-Plattform.</span>
                  </h2>
                  <p className="font-inter text-sm text-slate-400 mb-6 leading-relaxed">
                    Als Belohnung für deine Diagnose erhältst du <span className="text-white font-medium">50 kostenlose Credits</span> für
                    {" "}<span className="text-amber-400 font-medium">leader-os.de</span> – das intelligenteste Leadership-Betriebssystem auf dem Markt.
                    Nutze KI-Agenten, die speziell für Führungskräfte gebaut wurden.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      "KI-Coach für schwierige Gespräche & Entscheidungen",
                      "Simulations-Agent für Boardroom-Szenarien",
                      "Persönlicher Report als PDF herunterladen",
                      "30-Tage-Aktionsplan sofort starten",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        <span className="font-inter text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      data-testid="hero-cta-credits"
                      onClick={() => navigate("/diagnose")}
                      className="btn-primary px-8 py-4 text-base font-semibold inline-flex items-center gap-2"
                    >
                      Diagnose starten & Credits sichern
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <a
                      href="https://leader-os.de"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-6 py-4 text-sm font-medium inline-flex items-center gap-2"
                      data-testid="leader-os-link"
                    >
                      leader-os.de entdecken
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="glass-card-subtle p-5 hover-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="font-manrope font-bold text-sm text-white">Leadership OS</div>
                        <div className="font-inter text-xs text-slate-500">KI-Agenten für Führungskräfte</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="font-inter text-[10px] text-slate-600">50 Credits</span>
                      <span className="font-inter text-[10px] text-green-400">Kostenlos</span>
                    </div>
                  </div>

                  <div className="glass-card-subtle p-5 hover-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <Download className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-manrope font-bold text-sm text-white">Dein Report als PDF</div>
                        <div className="font-inter text-xs text-slate-500">Personalisiert · Sofort verfügbar</div>
                      </div>
                    </div>
                    <p className="font-inter text-xs text-slate-500">Vollständige Analyse deiner 6 Führungsrollen mit individuellem 30-Tage-Lernplan.</p>
                  </div>

                  <div className="glass-card-subtle p-5 hover-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-manrope font-bold text-sm text-white">0 € · Für immer</div>
                        <div className="font-inter text-xs text-slate-500">Keine Kreditkarte nötig</div>
                      </div>
                    </div>
                    <p className="font-inter text-xs text-slate-500">Diagnose, Report und 50 Credits – komplett kostenlos. Versprochen.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 11: FINAL CTA ===== */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="font-inter text-sm text-slate-600 mb-4 block">Die entscheidende Frage</span>
            <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-white mb-6 leading-tight">
              Gehörst du zu den <span className="text-gradient-amber">Top 1 %</span>,
              <br className="hidden md:block" />
              die KI als strategischen Vorteil nutzen –
              <br className="hidden md:block" />
              oder zu den 99 %, die zusehen?
            </h2>
            <p className="font-inter text-lg text-slate-500 mb-4">
              Finde es heraus. <span className="text-white">Kostenlos. In nur 10 Minuten.</span>
            </p>
            <p className="font-inter text-sm text-green-400/80 mb-10">
              + 50 Free Credits für leader-os.de · Report als PDF · 30-Tage-Plan
            </p>
            <button
              data-testid="hero-cta-bottom"
              onClick={() => navigate("/diagnose")}
              className="btn-primary px-10 py-4 text-base font-semibold inline-flex items-center gap-3"
            >
              Jetzt Diagnose starten – Kostenlos
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
                © 2026 WLADHUB. Alle Rechte vorbehalten.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

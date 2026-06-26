import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, TrendingUp, Sparkles, Clock, Zap, Users, Target, Briefcase, User, Bot, BookOpen, Play, X, Check, CheckSquare, Calendar, MessageCircle, Download } from "lucide-react";
import { ScrollReveal } from "../hooks/useScrollReveal";
import { useState, useEffect } from "react";
import LeaderOSLogo from "../components/LeaderOSLogo";

const headlines = [
  {
    pre: "Werde der Leader, den KI nicht ersetzen kann.",
    lines: ["KI skaliert Intelligenz.", "{Leadership bestimmt}", "die Richtung."],
  },
  {
    pre: "Die KI-Ära braucht eine neue Art von Führung.",
    lines: ["Beherrschst du die", "{6 Rollen des modernen}", "Leaders?"],
  },
  {
    pre: "Dein Leadership-Profil in 10 Minuten.",
    lines: ["Entdecke, welche", "{Führungsrolle}", "dich definiert."],
  },
  {
    pre: "97% der Führungskräfte überschätzen sich in mindestens einer Rolle.",
    lines: ["{10 Minuten.}", "6 Rollen. 1 Score.", "Keine Ausreden."],
  },
  {
    pre: "Es gibt ein Geheimnis, das die Top 1% der Leader kennen · und du noch nicht.",
    lines: ["Die {verborgene Rolle},", "die über deinen", "Aufstieg entscheidet."],
  },
];

const layers = [
  {
    num: "01",
    icon: Brain,
    title: "KI",
    subtitle: "Ebene 01",
    desc: "Du nutzt KI im Alltag · nicht für Memes.",
    points: ["Schneller entscheiden", "Routine automatisch", "Vorsprung sichtbar"],
    color: "#C8FF00"
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Rhetorik",
    subtitle: "Ebene 02",
    desc: "Du sprichst klar · andere folgen.",
    points: ["Klarer Aufbau", "Echte Worte", "Ruhige Präsenz"],
    color: "#C8FF00"
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "EQ",
    subtitle: "Ebene 03",
    desc: "Du verstehst dein Team · sie vertrauen dir.",
    points: ["Stimmung lesen", "Vertrauen aufbauen", "Konflikte ruhig lösen"],
    color: "#C8FF00"
  }
];

const problems = [
  "Gute Strategen · aber niemand hört zu",
  "Stark im Reden · aber KI noch nicht im Alltag",
  "Verstehen Menschen · entscheiden zu langsam"
];

const diagnoseSteps = [
  { num: "1", title: "30 Fragen · 6 Führungsdimensionen", desc: "" },
  { num: "2", title: "Dein Score in drei Ebenen", desc: "KI · Rhetorik · EQ" },
  { num: "3", title: "Dein persönlicher 30-Tage-Plan", desc: "Konkret · Schritt für Schritt · jeden Tag eine Aufgabe." },
  { num: "4", title: "ROI-Prognose", desc: "Wieviel Zeit du sparst · wie viel Wirkung du gewinnst" }
];

const platformFeatures = [
  { icon: Bot, title: "Leadership Coach", desc: "Dein persönlicher KI-Coach, der dein Profil kennt", color: "#C8FF00" },
  { icon: CheckSquare, title: "Task Agent", desc: "Tägliche Aufgaben, angepasst an deine Schwächen", color: "#C8FF00" },
  { icon: Users, title: "Simulations-Agent", desc: "Übe schwierige Gespräche mit KI-Gegenüber", color: "#C8FF00" },
  { icon: BookOpen, title: "Strategie-Agent", desc: "Playbooks & Frameworks auf Abruf", color: "#C8FF00" },
  { icon: Calendar, title: "Event-Agent", desc: "Live-Sessions, passend zu deinem Level", color: "#C8FF00" },
  { icon: MessageCircle, title: "Community-Agent", desc: "Vernetzung mit Führungskräften deiner Stufe", color: "#C8FF00" },
];

const wladbotFeatures = [
  "Schwierige Gespräche vorher durchspielen",
  "Argumente strukturieren · in Wlads Sprache",
  "Führungssituation in 30 Sekunden einordnen",
  "Schwierige Meetings durchspielen · bevor sie passieren"
];

const audiences = [
  {
    icon: Target,
    title: "Selbstständige",
    desc: "KI nutzen · ohne dich selbst zu verlieren."
  },
  {
    icon: Briefcase,
    title: "Angestellte",
    desc: "Schneller entscheiden · mit klarem Kopf und Bauchgefühl."
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
    const stored = sessionStorage.getItem("leaderos_ab");
    if (stored !== null) return parseInt(stored, 10);
    const idx = Math.floor(Math.random() * headlines.length);
    sessionStorage.setItem("leaderos_ab", idx);
    return idx;
  });
  const hl = headlines[headlineIdx];

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden" data-testid="hero-page">
      {/* Background Effects */}
      <div className="hero-glow-center" />
      <div className="hero-glow-lime" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10">
        {/* ===== SECTION 1: HERO ===== */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 pt-32 pb-24">
          {/* Design-system section label (Leader-OS bracket prefix style) */}
          <div className="flex justify-center mb-10 opacity-0 anim-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[#C8FF00] font-bold">
                ▸ § 01 / 07 · DIAGNOSE · KOSTENLOS 
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1
            className="font-manrope font-extrabold text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.03em] text-white mb-8 opacity-0 anim-fade-up delay-1 text-center"
            data-testid="hero-headline"
          >
            {hl.lines.map((line, i) => {
              const isAccent = line.startsWith("{") && line.endsWith("}");
              const text = isAccent ? line.slice(1, -1) : line;
              return (
                <span key={i}>
                  {isAccent ? <span className="text-gradient-lime">{text}</span> : text}
                  {i < hl.lines.length - 1 && <br />}
                </span>
              );
            })}
          </h1>

          {/* Three Skills — einfache Wörter, keine Jargon */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mb-10 opacity-0 anim-fade-up delay-2">
            <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">KI</span>
            <span className="font-mono text-xs text-slate-700">·</span>
            <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">Rhetorik</span>
            <span className="font-mono text-xs text-slate-700">·</span>
            <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">EQ</span>
          </div>

          {/* Subheadline — einfache Sprache */}
          <p
            className="font-inter text-base md:text-lg text-slate-400 leading-relaxed mb-10 max-w-3xl mx-auto opacity-0 anim-fade-up delay-3 text-center"
            data-testid="hero-subheadline"
          >
            <span className="text-white font-semibold">Zehn Minuten · 30 Fragen · ehrlich beantwortet.</span>{" "}
            Du bekommst sofort deinen Score in drei Ebenen plus konkreten 30-Tage-Plan.{" "}
            Kein Login. Kein Spam. <span className="text-[#C8FF00] font-semibold">Sofort umsetzbar.</span>
          </p>

          {/* Scarcity-Bar — wie auf der Plattform */}
          <div className="flex justify-center mb-8 opacity-0 anim-fade-up delay-3">
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/[0.08] bg-white/[0.02]">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 font-medium uppercase">
                Sei Teil der Leader-OS Bewegung · <span className="text-[#C8FF00]">KI · Rhetorik · EQ</span> meistern
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="opacity-0 anim-fade-up delay-4 text-center">
            <button
              data-testid="hero-cta-primary"
              onClick={() => navigate("/diagnose")}
              className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-semibold mb-5"
            >
              Jetzt Diagnose starten · 10 Min
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="font-inter text-sm text-slate-600">
              Kostenlos · ohne Login · DSGVO · 100 % anonym
            </p>
          </div>
        </section>

        {/* ===== SECTION 2: PROBLEM ===== */}
        <section className="py-28 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <ScrollReveal>
              <div className="text-center mb-20">
                <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                  ▸ Das echte Problem
                </span>
                <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                  <span className="block text-3xl md:text-5xl lg:text-6xl">
                    Du bist in einer Sache <span className="text-[#C8FF00]">gut</span>.
                  </span>
                  <span className="block text-2xl md:text-4xl lg:text-5xl mt-4 text-slate-400 font-bold">
                    In <span className="italic font-semibold">zwei</span> wird&apos;s eng. In <span className="italic font-semibold">drei</span> selten.
                  </span>
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Problems - Left Card */}
                <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 overflow-hidden group hover:border-white/[0.1] transition-all duration-500">
                  {/* Subtle corner accent */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-red-500/[0.03] rounded-full blur-[40px]" />
                  <div className="relative">
                    <div className="font-inter text-[10px] tracking-[0.25em] text-red-400/50 uppercase mb-8 flex items-center gap-3">
                      <span className="w-8 h-px bg-red-400/30" />
                      ▸ Klingt vertraut?
                    </div>
                    <div className="space-y-6">
                      {problems.map((problem, i) => (
                        <div key={`problem-${i}`} className="flex items-start gap-4 group/item">
                          <div className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-red-500/10 transition-colors">
                            <X className="w-3.5 h-3.5 text-red-400/70" />
                          </div>
                          <span className="font-inter text-[15px] text-slate-300 leading-relaxed">{problem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Consequences - Right Card with Lime accent */}
                <div className="relative rounded-2xl border border-[#C8FF00]/[0.12] bg-[#C8FF00]/[0.02] p-8 md:p-10 overflow-hidden group hover:border-[#C8FF00]/20 transition-all duration-500">
                  {/* Corner glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF00]/[0.04] rounded-full blur-[60px]" />
                  <div className="relative">
                    <div className="font-inter text-[10px] tracking-[0.25em] text-[#C8FF00]/50 uppercase mb-8 flex items-center gap-3">
                      <span className="w-8 h-px bg-[#C8FF00]/30" />
                      ▸ Das kostet dich
                    </div>
                    <div className="space-y-5">
                      {["Langsame Entscheidungen.", "Verpasste Chancen.", "Weniger Einfluss."].map((item, i) => (
                        <div key={`result-${i}`} className="font-manrope font-bold text-xl text-white/90 flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]/60 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#C8FF00]/[0.08]">
                      <p className="font-inter text-sm text-slate-500 leading-relaxed">
                        Die Diagnose zeigt dir in <span className="text-white font-medium">10 Minuten</span>, welche Ebene du vernachlässigst · ohne Bullshit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ===== SECTION 3: 3-EBENEN-MODELL ===== */}
        <section id="model" className="py-24 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ Drei Ebenen
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                <span className="block text-3xl md:text-5xl lg:text-6xl">
                  Top-Führungskräfte können
                </span>
                <span className="block text-3xl md:text-5xl lg:text-6xl mt-2">
                  <span className="text-[#C8FF00]">alle drei</span> <span className="italic font-semibold text-white/95">gleichzeitig</span>.
                </span>
              </h2>
              <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
                KI · Rhetorik · EQ. <span className="text-white font-medium">Wer eine Ebene weglässt</span>, verliert das Spiel · auch wenn er es nicht merkt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="hero-layers">
              {layers.map((layer, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-7 transition-all duration-300 hover:border-[#C8FF00]/15 hover:bg-white/[0.025]"
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
                        <div className="w-1 h-1 rounded-full shrink-0 bg-[#C8FF00]" />
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
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ 10 Minuten · Sofort-Klarheit
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                <span className="block text-3xl md:text-5xl lg:text-6xl">
                  Dein <span className="italic font-semibold text-white/95">persönlicher</span>
                </span>
                <span className="block text-3xl md:text-5xl lg:text-6xl mt-2 text-[#C8FF00]">
                  Leadership-Report.
                </span>
              </h2>
              <p className="font-inter text-base text-slate-400 max-w-xl mx-auto mt-6 leading-relaxed">
                Die Leader OS Diagnose analysiert deine Führungskompetenzen anhand eines strukturierten Modells.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="diagnose-steps">
              {diagnoseSteps.map((step, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all hover:border-[#C8FF00]/10">
                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 rounded-lg bg-[#C8FF00]/8 text-[#C8FF00] flex items-center justify-center font-manrope font-bold text-sm shrink-0">
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

        {/* ===== SECTION 5: 6 KI-AGENTEN ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ 6 KI-Agenten
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                <span className="block text-3xl md:text-5xl lg:text-6xl">
                  Sechs spezialisierte Agenten,
                </span>
                <span className="block text-2xl md:text-4xl lg:text-5xl mt-3 text-[#C8FF00] italic font-semibold">
                  die dir als Leader Arbeit abnehmen.
                </span>
              </h2>
              <p className="font-inter text-base text-slate-400 max-w-xl mx-auto mt-6 leading-relaxed">
                Jeder Agent ist auf einen Bereich deiner Führungsentwicklung spezialisiert.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platformFeatures.map((feature, i) => (
                <div key={i} className="group rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all duration-300 hover:border-[#C8FF00]/15 hover:bg-white/[0.025]">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#C8FF00]/[0.06]"
                    >
                      <feature.icon className="w-5 h-5 text-[#C8FF00]" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full opacity-60 animate-pulse bg-[#C8FF00]" />
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-1">{feature.title}</h3>
                  <p className="font-inter text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: WLADBOT ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* WLADBOT Preview */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
                  <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.08] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">WLADBOT</div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                      <span className="font-inter text-xs text-slate-500">Online</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/[0.03] border border-white/[0.04] px-4 py-3 rounded-2xl rounded-bl-md">
                    <p className="font-inter text-sm text-slate-300">
                      &laquo;Wie kann ich mich auf ein schwieriges Feedbackgespräch mit meinem Team vorbereiten?&raquo;
                    </p>
                  </div>
                  <div className="bg-[#C8FF00] px-4 py-3 rounded-2xl rounded-br-md ml-8">
                    <p className="font-inter text-sm text-[#0a0a0a] font-medium">
                      Lass uns das strukturiert angehen. Zunächst: Was ist der konkrete Anlass?
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                  ▸ Der WladBot
                </span>
                <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight mb-6">
                  <span className="block text-3xl md:text-4xl lg:text-5xl">
                    Dein <span className="italic font-semibold">persönlicher</span>
                  </span>
                  <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-[#C8FF00]">
                    KI-Leadership-Coach.
                  </span>
                </h2>
                <p className="font-inter text-sm text-slate-400 mb-6 leading-relaxed">
                  Du kannst ihn nutzen für:
                </p>
                <div className="space-y-3 mb-8">
                  {wladbotFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] shrink-0" />
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

        {/* ===== SECTION 7: LEADERSHIP KURS ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
              ▸ Bonus für Diagnose-Absolventen
            </span>
            <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
              <span className="block text-3xl md:text-5xl lg:text-6xl">
                Zugang zu <span className="italic font-semibold">ausgewählten</span> Modulen
              </span>
              <span className="block text-3xl md:text-5xl lg:text-6xl mt-2 text-[#C8FF00]">
                des Wlad Leadership Programms.
              </span>
            </h2>
            <p className="font-inter text-base text-slate-400 mt-6 mb-10 max-w-xl mx-auto leading-relaxed">
              Im Kurs lernst du:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Brain, text: "KI strategisch im Führungsalltag einsetzen" },
                { icon: MessageSquare, text: "Überzeugend argumentieren" },
                { icon: Users, text: "Teams mit strategischem EQ führen" }
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all hover:border-[#C8FF00]/10">
                  <item.icon className="w-5 h-5 text-[#C8FF00] mx-auto mb-3" />
                  <p className="font-inter text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 inline-block">
              <p className="font-inter text-xs text-slate-500">
                Die Inhalte verbinden <span className="text-slate-400 font-medium">Rhetorik</span>, <span className="text-slate-400 font-medium">Strategie</span> und <span className="text-slate-400 font-medium">KI im Alltag</span> in einem strukturierten System.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate("/kurse")}
                className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2"
                data-testid="hero-kurse-cta"
              >
                Alle 6 Kurse ansehen
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: ZIELGRUPPE ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ Für wen
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                <span className="block text-3xl md:text-5xl lg:text-6xl">
                  Für wen ist diese
                </span>
                <span className="block text-3xl md:text-5xl lg:text-6xl mt-2 text-[#C8FF00] italic font-semibold">
                  Diagnose gedacht?
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="audience-cards">
              {audiences.map((audience, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center transition-all hover:border-[#C8FF00]/10">
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

        {/* ===== SECTION 9: SOCIAL PROOF + SCARCITY ===== */}
        <section className="py-24 border-t border-white/[0.04]" data-testid="scarcity-section">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ Limitiert in 2026
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
                <span className="block text-3xl md:text-5xl lg:text-6xl">
                  Nur <span className="text-[#C8FF00]">1 % der Führungskräfte</span>
                </span>
                <span className="block text-2xl md:text-4xl lg:text-5xl mt-4 text-slate-400 font-bold">
                  nutzen KI <span className="italic font-semibold text-white/95">wirklich</span> strategisch.
                </span>
              </h2>
              <p className="font-inter text-base text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
                Die anderen 99 % lesen darüber. <span className="text-white">Du könntest es heute noch ändern</span> · in 10 Minuten weißt du genau, wo du stehst.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-[#C8FF00] mb-2">2.847+</div>
                <div className="font-inter text-xs text-slate-500">Leader haben die Diagnose bereits gemacht</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-white mb-2">94%</div>
                <div className="font-inter text-xs text-slate-500">sagen: &laquo;Hat mir die Augen geöffnet&raquo;</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
                <div className="font-manrope font-extrabold text-3xl text-white mb-2">10 Min</div>
                <div className="font-inter text-xs text-slate-500">für Klarheit, die andere in Monaten nicht bekommen</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
              <p className="font-inter text-sm text-slate-400 italic leading-relaxed">
                &laquo;Ich dachte, ich wäre ein guter Kommunikator · bis Leader OS mir gezeigt hat, dass mein eigentlicher Hebel im strategischen EQ liegt. Das hat alles verändert.&raquo;
              </p>
              <p className="font-inter text-xs text-slate-600 mt-3">· Senior Manager, DAX 40 Unternehmen</p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 9.5: WLAD PORTRAIT TRUST ===== */}
        <section className="py-20 md:py-28 border-t border-white/[0.04] relative overflow-hidden" data-testid="wlad-trust-landing">
          {/* Subtle lime grid background */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, #C8FF00 0%, transparent 50%)" }} />

          <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
            {/* Section label */}
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 mb-4 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04] font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] uppercase font-semibold">
                ▸ Hinter Leader · OS
              </span>
              <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-white leading-tight max-w-3xl mx-auto">
                Eine Methodik.{" "}
                <span className="text-gradient-lime">10 Jahre verdichtet.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 lg:gap-16 items-center">
              {/* Portrait */}
              <div className="relative mx-auto lg:mx-0 max-w-sm w-full">
                {/* Lime accent corner top-left */}
                <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-[#C8FF00] rounded-tl-2xl pointer-events-none" />
                {/* Lime accent corner bottom-right */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-[#C8FF00] rounded-br-2xl pointer-events-none" />

                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#C8FF00]/15 bg-gradient-to-br from-[#C8FF00]/[0.04] to-transparent shadow-2xl shadow-[#C8FF00]/[0.05]">
                  <img
                    src="/wlad-portrait.png"
                    alt="Wladislaw Jachtchenko · Gründer Leader OS · 3× SPIEGEL-Bestseller-Autor"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                    data-testid="wlad-portrait-img"
                  />
                  {/* Fallback when image not yet uploaded */}
                  <div className="absolute inset-0 hidden items-center justify-center flex-col gap-3 bg-gradient-to-br from-[#0f1410] to-[#0a0a0a]" data-testid="wlad-portrait-fallback">
                    <div className="w-32 h-32 rounded-full bg-[#C8FF00] flex items-center justify-center">
                      <span className="font-manrope font-extrabold text-6xl text-[#0a0a0a]">W</span>
                    </div>
                    <div className="text-center">
                      <div className="font-manrope font-bold text-white text-lg">Wladislaw</div>
                      <div className="font-manrope font-bold text-[#C8FF00] text-lg">Jachtchenko</div>
                    </div>
                  </div>

                  {/* Bottom gradient + caption */}
                  <div className="absolute inset-x-0 bottom-0 p-5 pt-16 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] font-semibold uppercase mb-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                      Gründer · Leader OS
                    </div>
                    <div className="font-manrope font-bold text-white text-lg leading-tight">Wladislaw Jachtchenko</div>
                    <div className="font-inter text-xs text-slate-400 mt-1">Executive Coach · 3× SPIEGEL-Bestseller</div>
                  </div>
                </div>

                {/* Floating credentials chip */}
                <div className="absolute -right-4 top-8 hidden md:block px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#C8FF00]/30 shadow-2xl shadow-black/50 rotate-2">
                  <div className="font-mono text-[9px] tracking-[0.18em] text-[#C8FF00] font-bold uppercase">3× SPIEGEL</div>
                  <div className="font-manrope font-bold text-[11px] text-white">Bestseller</div>
                </div>
                <div className="absolute -left-4 bottom-20 hidden md:block px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#C8FF00]/30 shadow-2xl shadow-black/50 -rotate-2">
                  <div className="font-mono text-[9px] tracking-[0.18em] text-[#C8FF00] font-bold uppercase">400.000+</div>
                  <div className="font-manrope font-bold text-[11px] text-white">Klienten</div>
                </div>
              </div>

              {/* Trust content */}
              <div>
                {/* Wlad's pull-quote */}
                <div className="mb-7 pl-6 border-l-2 border-[#C8FF00]">
                  <p className="font-manrope font-medium text-lg md:text-xl text-white leading-snug mb-3">
                    «Leadership ist nicht, was du sagst, sondern wie du in den schwierigen Momenten entscheidest. Genau dafür habe ich Leader · OS gebaut.»
                  </p>
                  <p className="font-inter text-xs text-slate-500">· Wlad Jachtchenko</p>
                </div>

                <p className="font-inter text-base text-slate-400 leading-relaxed mb-4">
                  Alles, was Wlad in über 10 Jahren in Coachings, Frameworks und Büchern entwickelt hat · steckt heute in Leader OS. Nicht als Kurs-Bibliothek, sondern als tägliches System für deine schwierigsten Führungs-Entscheidungen.
                </p>
                <p className="font-inter text-sm text-slate-500 leading-relaxed mb-7">
                  3× SPIEGEL-Bestseller-Autor · über 400.000 Klienten in Rhetorik, Verhandlung und KI ausgebildet · Top-Speaker auf über 500 Bühnen · regelmäßig bei ARD, ZDF, ntv, Welt, Wirtschaftswoche.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
                  {[
                    ["400k+", "Klienten ausgebildet"],
                    ["3×", "SPIEGEL-Bestseller"],
                    ["500+", "Bühnen weltweit"],
                    ["91", "Premium-Lektionen"],
                    ["10+", "Jahre Praxis"],
                    ["4.9", "Speaker-Rating / 5"],
                  ].map(([num, label]) => (
                    <div key={label} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#C8FF00]/20 transition-colors">
                      <div className="font-manrope font-extrabold text-xl md:text-2xl text-[#C8FF00] leading-none mb-1.5">{num}</div>
                      <div className="font-inter text-[11px] text-slate-500 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-white/[0.05]">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase mb-3">▸ Als Autor zu Gast bei</p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-manrope font-bold text-sm text-slate-400">
                    <span>ARD</span><span className="text-slate-700">·</span>
                    <span>ZDF</span><span className="text-slate-700">·</span>
                    <span>NTV</span><span className="text-slate-700">·</span>
                    <span>WELT</span><span className="text-slate-700">·</span>
                    <span>WIRTSCHAFTSWOCHE</span><span className="text-slate-700">·</span>
                    <span>HANDELSBLATT</span><span className="text-slate-700">·</span>
                    <span>FAZ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 10: 50 FREE CREDITS — Bonus für Diagnose ===== */}
        <section className="py-20 border-t border-white/[0.04]" data-testid="free-credits-section">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="glass-card p-8 md:p-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.02]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-block mb-5 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                    ▸ Gratis nach Completion
                  </span>
                  <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight mb-5">
                    <span className="block text-2xl md:text-4xl">
                      50 Free Credits für deinen
                    </span>
                    <span className="block text-2xl md:text-4xl mt-1 text-[#C8FF00] italic font-semibold">
                      WladBot &amp; KI-Coach.
                    </span>
                  </h2>
                  <p className="font-inter text-sm text-slate-400 mb-6 leading-relaxed">
                    Als Belohnung für deine Diagnose erhältst du <span className="text-white font-medium">50 kostenlose Credits</span> für den WladBot und alle KI-Tools innerhalb von Leader OS. Schwierige Gespräche durchspielen, Argumente strukturieren, Entscheidungen schärfen · in Wlads Sprache.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      "WladBot · dein KI-Coach für schwierige Gespräche",
                      "Schwierige Meetings durchspielen · bevor sie passieren",
                      "Persönlicher Report als PDF herunterladen",
                      "30-Tage-Aktionsplan sofort starten",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#C8FF00] shrink-0" />
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
                      Diagnose starten &amp; Credits sichern
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="glass-card-subtle p-5 hover-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-[#C8FF00]" />
                      </div>
                      <div>
                        <div className="font-manrope font-bold text-sm text-white">WladBot · 50 Credits</div>
                        <div className="font-inter text-xs text-slate-500">KI-Coach in Wlads Sprache</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full w-[65%] rounded-full bg-[#C8FF00]" />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="font-inter text-[10px] text-slate-600">50 Credits</span>
                      <span className="font-inter text-[10px] text-[#C8FF00]">Kostenlos</span>
                    </div>
                  </div>

                  <div className="glass-card-subtle p-5 hover-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                        <Download className="w-5 h-5 text-slate-400" />
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
                      <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.06] flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#C8FF00]" />
                      </div>
                      <div>
                        <div className="font-manrope font-bold text-sm text-white">0 EUR · Für immer</div>
                        <div className="font-inter text-xs text-slate-500">Keine Kreditkarte nötig</div>
                      </div>
                    </div>
                    <p className="font-inter text-xs text-slate-500">Diagnose, Report und 50 Credits · komplett kostenlos. Versprochen.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 11: FINAL CTA ===== */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
              ▸ Die entscheidende Frage
            </span>
            <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight mb-8">
              <span className="block text-3xl md:text-5xl lg:text-6xl">
                Gehörst du zu den <span className="text-[#C8FF00]">Top 1 %</span>,
              </span>
              <span className="block text-3xl md:text-5xl lg:text-6xl mt-2">
                die KI als <span className="italic font-semibold text-white/95">strategischen Vorteil</span> nutzen
              </span>
              <span className="block text-2xl md:text-4xl lg:text-5xl mt-5 text-slate-400 font-bold">
                oder zu den <span className="text-white">99 %</span>, die zusehen?
              </span>
            </h2>
            <p className="font-inter text-lg text-slate-400 mb-3 max-w-2xl mx-auto">
              Finde es heraus. <span className="text-white font-medium">Kostenlos. In 10 Minuten.</span>
            </p>
            <p className="font-inter text-sm text-[#C8FF00]/70 mb-10">
              + 50 Free Credits für deinen WladBot · Report als PDF · 30-Tage-Plan
            </p>
            <button
              data-testid="hero-cta-bottom"
              onClick={() => navigate("/diagnose")}
              className="btn-primary px-10 py-4 text-base font-semibold inline-flex items-center gap-3"
            >
              Jetzt Diagnose starten · Kostenlos
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LeaderOSLogo variant="default" size="md" />
                <span className="text-slate-700">|</span>
                <span className="font-inter text-sm text-slate-500">Leadership Diagnose</span>
              </div>
              <div className="font-inter text-sm text-slate-600">
                2026 Leader OS. Alle Rechte vorbehalten.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}


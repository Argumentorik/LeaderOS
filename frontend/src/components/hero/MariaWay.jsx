import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, MessageCircle, Users, Shield, TrendingUp,
  Clock, Trophy, Triangle, Activity, Crown, Check, ArrowRight,
} from "lucide-react";

const TIMELINE = [
  { range: "Tag 1-7",   Icon: Triangle, text: "SEXIER-Pyramide vor jedem Meeting via WladBot durchgespielt · «Tag 3 schon natürlich»" },
  { range: "Tag 8-14",  Icon: MessageCircle, text: "Kommunikations-Quadrant im 1:1 mit Direct Reports · WladBot als Vor-Sparring" },
  { range: "Tag 15-21", Icon: Activity, text: "Vor jedem CFO-Meeting WladBot in Wlads Stimme · «Krass»" },
  { range: "Tag 22-30", Icon: Crown, text: "Harvard-Methode in Budget-Verhandlung · +180k EUR durchgesetzt" },
];

const SEVEN_DAYS = [
  { num: "1", day: "Heute",      Icon: Zap,           title: "Erstes Sparring in 3 Minuten" },
  { num: "2", day: "Morgen",     Icon: MessageCircle, title: "Die Antwort, die überzeugt" },
  { num: "3", day: "Übermorgen", Icon: Users,         title: "Warum Maria plötzlich gehört wurde" },
  { num: "4", day: "Tag 4",      Icon: Shield,        title: "Der schwierigste Satz im Meeting" },
  { num: "5", day: "Tag 5",      Icon: TrendingUp,    title: "Der CFO-Test" },
  { num: "6", day: "Tag 6",      Icon: Clock,         title: "Deine 3-Minuten-Routine" },
  { num: "7", day: "Tag 7",      Icon: Trophy,        title: "Executive Mode" },
];

const BULLETS = [
  "Sparring mit WladBot in Sekunden",
  "Für echte Meetings. Nicht für Theorie.",
  "Von Top Leadern entwickelt.",
  "Für Ergebnisse, die man sieht.",
];

export default function MariaWay() {
  const navigate = useNavigate();
  const activeDay = 1;

  return (
    <section
      className="py-20 md:py-28 border-t border-white/[0.04]"
      data-testid="maria-way-section"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Top eyebrow strip */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#C8FF00] flex items-center justify-center text-black font-extrabold text-xs">W</div>
            <span className="font-manrope text-sm font-bold text-white tracking-tight">Leader OS</span>
          </div>
          <span className="font-inter text-[11px] tracking-[0.04em] text-[#C8FF00] font-semibold">
            Tag 5 · 1 Klientin · 1 Story
          </span>
        </div>

        {/* Hero · 2-column: Headline left / Portrait+Stats right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start mb-16">
          <div className="md:col-span-7">
            <h2
              className="font-manrope font-extrabold text-white tracking-tight leading-[1.04]"
              data-testid="maria-headline"
            >
              <span className="block text-4xl md:text-6xl">Das war Maria</span>
              <span className="block text-4xl md:text-6xl mt-1">
                vor <span className="text-[#C8FF00]">6 Monaten</span>.
              </span>
            </h2>
            <p className="font-inter text-base md:text-lg italic text-slate-300/90 leading-relaxed mt-7 max-w-[540px]">
              «Ich war im Boardroom die fachlich Beste. Aber wenn unser CFO redete, hörten alle ihm zu. Ich habe mich auf{" "}
              <a href="https://leaderos.de/login" className="underline text-white decoration-[#C8FF00] decoration-2 underline-offset-4">
                leaderos.de
              </a>{" "}
              eingeloggt, WladBot 30 Tage am Stück genutzt, und am Tag 31 hat mein Team mich gefragt, ob ich Coaching genommen hätte. Habe ich nicht. Ich habe Wlad genommen.»
            </p>
            <p className="font-inter text-xs text-slate-500 mt-5 tracking-wide">
              · Maria K. · Head of Engineering · TecConsult AG
            </p>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=900&q=80&auto=format&fit=crop"
                  alt="Maria K."
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl">
                    <div className="ml-1 w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-5 px-4">
                {[
                  { v: "30", l: "Tage" },
                  { v: "50", l: "Credits" },
                  { v: "+180k", l: "EUR verhandelt" },
                ].map((s, i) => (
                  <div key={i} className="text-center px-2" data-testid={`maria-stat-${i}`}>
                    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">{s.v}</p>
                    <p className="font-inter text-[11px] text-slate-400 mt-2">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle · Timeline left / WladBot card right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-16">
          <div className="md:col-span-7">
            <p className="font-inter text-[11px] tracking-[0.18em] uppercase font-bold text-slate-500 mb-8">
              Was Maria mit ihren Credits gemacht hat
            </p>
            <div className="relative">
              {TIMELINE.map(({ range, Icon, text }, i) => (
                <div key={range} className="flex gap-5 mb-7 last:mb-0" data-testid={`maria-phase-${i}`}>
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full border border-[#C8FF00]/70 flex items-center justify-center bg-black">
                      <Icon className="w-5 h-5 text-[#C8FF00]" />
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-px h-7 bg-white/[0.08]" />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="font-manrope font-bold text-[#C8FF00] text-sm tracking-wide mb-1.5">{range}</p>
                    <p className="font-inter text-sm md:text-base text-white/90 leading-relaxed max-w-[440px]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-6">
              <div className="flex items-start gap-3 mb-4">
                <img src="/wladbot-3d.png" alt="WladBot" className="w-14 h-auto shrink-0" />
                <div className="pt-1">
                  <p className="font-inter text-[10px] uppercase tracking-[0.18em] font-bold text-[#C8FF00] mb-1">
                    WladBot ist online
                  </p>
                  <p className="font-manrope font-extrabold text-white text-lg leading-tight tracking-tight">
                    Maria hat <span className="text-[#C8FF00]">50 Credits</span> genutzt.<br />
                    Du hast <span className="text-[#C8FF00]">50 freigeschaltet</span>.
                  </p>
                </div>
              </div>
              <p className="font-inter text-sm text-slate-300/80 leading-relaxed mb-5">
                Mit 2-3 Credits pro Anfrage reicht das für 15-25 echte Sparring-Runden. Logge dich heute Abend ein und probiere ihre Mo-Mi-Routine.
              </p>
              <div className="flex items-center gap-1.5 mb-6">
                {["2-3 Credits", "1 Sparring", "Besseres Meeting"].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className="px-3 py-2.5 rounded-lg bg-[#C8FF00] text-black text-[11px] font-extrabold leading-tight text-center tracking-tight flex-1">
                      {step}
                    </div>
                    {i < arr.length - 1 && <span className="text-[#C8FF00] font-extrabold text-sm">→</span>}
                  </React.Fragment>
                ))}
              </div>
              <button
                onClick={() => navigate("/diagnose")}
                data-testid="maria-cta-bot"
                className="btn-primary w-full px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> Marias Routine starten
              </button>
              <p className="font-inter text-[11px] text-slate-500 mt-3 text-center">
                <a href="https://leaderos.de/login" className="text-[#C8FF00] underline">leaderos.de</a> · gleiche E-Mail wie hier
              </p>
            </div>
          </div>
        </div>

        {/* 7-Tage-Plan Strip */}
        <div className="mb-16">
          <p className="font-inter text-sm text-slate-300 mb-5">
            <span className="text-[#C8FF00] text-base">↳</span>&nbsp;&nbsp;Dein 7-Tage-Plan für den ersten Unterschied
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {SEVEN_DAYS.map(({ num, day, Icon, title }, i) => {
              const isActive = i + 1 === activeDay;
              return (
                <div
                  key={num}
                  data-testid={`day-card-${num}`}
                  className={`rounded-xl p-4 text-center transition-all bg-[#0d0d0d] border ${
                    isActive ? "border-[#C8FF00]" : "border-white/[0.08]"
                  }`}
                >
                  <p className={`font-manrope text-2xl font-extrabold leading-none tracking-tight ${
                    isActive ? "text-[#C8FF00]" : "text-slate-500"
                  }`}>{num}</p>
                  <p className="font-inter text-[10px] text-slate-500 mt-1.5 font-semibold tracking-wide">{day}</p>
                  <Icon className={`w-4 h-4 mx-auto my-3 ${isActive ? "text-[#C8FF00]" : "text-slate-600"}`} />
                  <p className={`font-inter text-[10px] leading-snug min-h-[28px] ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}>
                    {title}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2.5">
                    {[0,1,2,3,4,5].map((d) => (
                      <div key={d} className={`w-1 h-1 rounded-full ${
                        isActive && d === 0 ? "bg-[#C8FF00]" : "bg-white/10"
                      }`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* "Was ist Leader OS?" Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pt-8 border-t border-white/[0.04]">
          <div className="md:col-span-7">
            <p className="font-inter text-[11px] tracking-[0.18em] uppercase font-bold text-slate-500 mb-4">
              Was ist Leader OS?
            </p>
            <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-[1.1] mb-7">
              Dein tägliches{" "}
              <span className="text-[#C8FF00]">Training</span>{" "}
              für bessere Führung.
            </h3>
            <ul className="space-y-3">
              {BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-3" data-testid={`leaderos-bullet-${i}`}>
                  <div className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                  <span className="font-inter text-sm md:text-base text-white/90">{b}</span>
                </li>
              ))}
            </ul>
            <p className="font-inter text-sm text-slate-400 mt-8 leading-relaxed max-w-[520px]">
              <span className="text-white font-bold">P.S.</span>&nbsp;&nbsp;Marias Story ist 1 von Hunderten. Aber sie hat eines gemeinsam mit allen: Sie hat sich eingeloggt und die Credits genutzt. Der Rest passiert von alleine. <span className="text-[#C8FF00]">♡</span>
            </p>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-7">
              <p className="font-inter text-[10px] tracking-[0.18em] uppercase font-bold text-slate-400 mb-3">
                Dein Bonus aktiv
              </p>
              <p className="font-manrope font-extrabold text-2xl md:text-3xl text-white tracking-tight leading-tight">
                <span className="text-[#C8FF00]">50 Free Credits</span>
              </p>
              <p className="font-inter text-sm text-slate-400 mt-1 mb-6">WladBot ist online</p>
              <div className="flex items-end gap-4">
                <button
                  onClick={() => navigate("/diagnose")}
                  data-testid="leaderos-cta-start"
                  className="btn-primary px-6 py-3 text-sm font-bold inline-flex items-center gap-2"
                >
                  Jetzt starten <ArrowRight className="w-4 h-4" />
                </button>
                <div className="relative">
                  <img src="/wladbot.png" alt="WladBot Pixel" className="w-20 h-auto" />
                  <div className="absolute -top-3 -left-12 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
                    Ich bin bereit. Und du?
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

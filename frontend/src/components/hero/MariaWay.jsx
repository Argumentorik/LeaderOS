import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, ArrowRight, Zap, MessageCircle, Users,
  Shield, TrendingUp, Clock, Trophy,
} from "lucide-react";
import ClientStoriesCarousel from "../shared/ClientStoriesCarousel";

const SEVEN_DAYS = [
  { num: "Tag 1", Icon: Zap,           title: "In 3 Minuten souveräner auftreten." },
  { num: "Tag 2", Icon: MessageCircle, title: "Antworten, die Menschen überzeugen." },
  { num: "Tag 3", Icon: Users,         title: "Warum gute Ideen endlich gehört werden." },
  { num: "Tag 4", Icon: Shield,        title: "Der Satz, der schwierige Meetings dreht." },
  { num: "Tag 5", Icon: TrendingUp,    title: "Der CFO-Test." },
  { num: "Tag 6", Icon: Clock,         title: "Die 3-Minuten-Routine vor jedem Gespräch." },
  { num: "Tag 7", Icon: Trophy,        title: "Executive Mode." },
];

const BULLETS = [
  "Meetings vorbereiten.",
  "Schwierige Gespräche trainieren.",
  "Feedback üben.",
  "Verhandlungen simulieren.",
  "Mehr Wirkung erzielen.",
];

const TRANSFORMATION = [
  "2 Minuten Training",
  "Mehr Klarheit",
  "Mehr Präsenz",
  "Bessere Entscheidungen",
  "Bessere Ergebnisse",
];

// Story Cards Data moved to /components/shared/ClientStoriesCarousel.jsx

export default function MariaWay() {
  const navigate = useNavigate();

  return (
    <section
      className="py-20 md:py-28 border-t border-white/[0.04]"
      data-testid="maria-way-section"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Eyebrow strip */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#C8FF00] flex items-center justify-center text-black font-extrabold text-sm">W</div>
            <span className="font-manrope text-sm font-bold text-white tracking-tight">Leader OS</span>
          </div>
          <span className="font-mono text-[10px] md:text-[11px] tracking-[0.22em] text-[#C8FF00] font-bold uppercase">
            Tag 5 · Eine Geschichte, die alles verändert
          </span>
        </div>

        {/* HERO · VSL-Style Headline + Portrait */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start mb-20">
          <div className="md:col-span-7" data-testid="maria-headline-block">
            <h2
              className="font-manrope font-extrabold text-white tracking-tight leading-[1.02]"
              data-testid="maria-headline"
            >
              <span className="block text-5xl md:text-7xl">Vor 30 Tagen</span>
              <span className="block text-5xl md:text-7xl mt-1">
                war Maria <span className="text-[#C8FF00]">unsichtbar</span>.
              </span>
            </h2>

            <div className="mt-10 space-y-5 max-w-[540px]">
              <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
                Sie war fachlich die Beste im Raum.
              </p>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
                Trotzdem hörten alle zu, sobald der CFO sprach.
              </p>
              <p className="text-base md:text-lg text-slate-400 leading-relaxed">
                Sie wusste die Antworten. Aber niemand wartete auf ihre Meinung.
              </p>
            </div>

            <div className="mt-10 pl-5 border-l-2 border-[#C8FF00]">
              <p className="text-white text-base md:text-lg leading-relaxed">
                Dann loggte sie sich bei <span className="text-[#C8FF00] font-bold">Leader OS</span> ein.
              </p>
              <div className="mt-4 space-y-1">
                <p className="text-white/90 text-base md:text-lg font-semibold">30 Tage.</p>
                <p className="text-white/90 text-base md:text-lg font-semibold">50 Credits.</p>
                <p className="text-white/90 text-base md:text-lg font-semibold">Jeden Tag 10 Minuten Sparring mit WladBot.</p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-sm text-slate-500 mb-3">Am Tag 31 fragte ihr Team:</p>
              <p className="text-2xl md:text-3xl font-extrabold text-[#C8FF00] leading-tight tracking-tight">
                «Hast du heimlich ein<br />Executive Coaching gemacht?»
              </p>
              <p className="text-sm text-slate-500 mt-6 mb-1">Ihre Antwort:</p>
              <p className="text-xl md:text-2xl font-bold text-white leading-snug">
                «Nein. Ich habe einfach jeden Tag mit Wlad trainiert.»
              </p>
              <p className="text-xs text-slate-500 mt-5 tracking-wide">· Maria K. · Head of Engineering · TecConsult AG</p>
            </div>
          </div>

          <div className="md:col-span-5 md:sticky md:top-24">
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=900&q=85&auto=format&fit=crop"
                  alt="Maria K."
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl">
                    <div className="ml-1 w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-5 px-2">
                {[
                  { v: "30", l: "Tage" },
                  { v: "50", l: "Credits" },
                  { v: "+180k €", l: "verhandelt" },
                ].map((s, i) => (
                  <div key={i} className="text-center px-2" data-testid={`maria-stat-${i}`}>
                    <p className="font-manrope text-xl md:text-2xl font-extrabold text-white tracking-tight leading-none">{s.v}</p>
                    <p className="font-inter text-[10px] md:text-[11px] text-slate-400 mt-2 tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BIG-NUMBER section */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { big: "30", sub: "Tage" },
            { big: "50", sub: "Credits" },
            { big: "+180k €", sub: "erfolgreich verhandelt" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#0d0d0d] border border-white/[0.06] p-8 text-center"
              data-testid={`maria-bignumber-${i}`}
            >
              <p className="font-manrope text-5xl md:text-6xl font-extrabold text-[#C8FF00] leading-none tracking-tight">
                {s.big}
              </p>
              <p className="font-inter text-sm text-slate-400 mt-3 tracking-wide">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* 4-WEEK TIMELINE */}
        <div className="mb-20">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-4">
            ↳ Was in diesen 30 Tagen passiert ist
          </p>
          <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-tight mb-12">
            Vier Wochen. Vier Hebel.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                week: "Woche 1",
                title: "SEXIER vor jedem Meeting.",
                body: "Maria trainierte mit WladBot die SEXIER-Methode. Vor jedem Meeting.",
                quote: "Ab Tag 3 fühlte es sich völlig natürlich an.",
              },
              {
                week: "Woche 2",
                title: "Schwierige Gespräche · simuliert.",
                body: "Mitarbeiter-1:1s vorher mit WladBot durchgespielt. Keine Ausreden. Keine Unsicherheit.",
                quote: "Ich wusste, was kommt. Bevor es kam.",
              },
              {
                week: "Woche 3",
                title: "5 Minuten CFO-Sparring.",
                body: "Vor jedem Gespräch mit dem CFO 5 Minuten mit WladBot. Argument vor Argument.",
                quote: "Plötzlich wusste ich genau, was ich sagen werde.",
              },
              {
                week: "Woche 4",
                title: "Harvard-Verhandlung.",
                body: "Budgetverhandlung nach Harvard-Methode mit WladBot vorbereitet. Drei Szenarien.",
                quote: "+180.000 € Budget. Freigegeben.",
              },
            ].map((w, i) => (
              <div
                key={w.week}
                className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-7 md:p-8 hover:border-[#C8FF00]/30 transition"
                data-testid={`maria-week-${i + 1}`}
              >
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-3">
                  {w.week}
                </p>
                <p className="font-manrope text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight mb-4">
                  {w.title}
                </p>
                <p className="font-inter text-sm text-slate-400 leading-relaxed mb-4">{w.body}</p>
                <p className="font-inter text-sm italic text-white/80 border-l-2 border-[#C8FF00]/40 pl-3">
                  «{w.quote}»
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TRANSFORMATION ARROWS */}
        <div className="mb-20 rounded-3xl bg-gradient-to-br from-[#C8FF00]/[0.06] to-transparent border border-[#C8FF00]/15 p-8 md:p-14 text-center">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">
            Marias Routine · Ab heute Abend.
          </p>
          <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-tight mb-10">
            Starte heute Abend.<br />Mit Marias Routine.
          </h3>
          <div className="flex flex-col items-center gap-3 mb-10">
            {TRANSFORMATION.map((t, i) => (
              <React.Fragment key={t}>
                <p
                  className={`font-manrope font-bold tracking-tight ${
                    i === 0 ? "text-base text-slate-400" :
                    i === TRANSFORMATION.length - 1 ? "text-xl md:text-2xl text-[#C8FF00]" :
                    "text-base md:text-lg text-white"
                  }`}
                  data-testid={`transform-step-${i}`}
                >
                  {t}
                </p>
                {i < TRANSFORMATION.length - 1 && (
                  <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-[#C8FF00]/60" />
                )}
              </React.Fragment>
            ))}
          </div>
          <button
            onClick={() => navigate("/diagnose")}
            data-testid="maria-cta-bot"
            className="btn-primary px-8 py-4 text-base font-bold inline-flex items-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> Jetzt Leader OS öffnen
          </button>
          <p className="text-xs text-slate-500 mt-5">
            <a href="https://leaderos.de/login" className="text-[#C8FF00] underline">leaderos.de</a> · mit derselben E-Mail wie hier
          </p>
        </div>

        {/* 7-Tage-Plan Strip */}
        <div className="mb-20">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
            ↳ Dein 7-Tage-Plan
          </p>
          <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-tight mb-10">
            Sieben Tage. Sieben Hebel.
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {SEVEN_DAYS.map(({ num, Icon, title }, i) => {
              const isActive = i === 0;
              return (
                <div
                  key={num}
                  data-testid={`day-card-${i + 1}`}
                  className={`rounded-xl p-5 transition-all bg-[#0d0d0d] border ${
                    isActive ? "border-[#C8FF00]" : "border-white/[0.08]"
                  }`}
                >
                  <p className={`font-mono text-[10px] tracking-[0.18em] uppercase font-bold ${
                    isActive ? "text-[#C8FF00]" : "text-slate-500"
                  }`}>{num}</p>
                  <Icon className={`w-5 h-5 my-4 ${isActive ? "text-[#C8FF00]" : "text-slate-600"}`} />
                  <p className={`font-inter text-xs leading-snug ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}>
                    {title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLIENT STORY CAROUSEL · Apple-Cards */}
        <ClientStoriesCarousel
          className="mb-20"
          eyebrow="↳ Sie haben es auch gemacht"
          headline={<>5 Stories. 5 Hebel.<br /><span className="text-[#C8FF00]">Ein Pattern.</span></>}
          subline="Tippe auf eine Karte. Lies, was passiert ist. Frage dich, was bei dir möglich wäre."
        />

        {/* "Was ist Leader OS?" Block · Apple/Linear style */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 pt-12 border-t border-white/[0.04]">
          <div className="md:col-span-7">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
              ↳ Was ist Leader OS?
            </p>
            <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-[1.05] mb-6">
              Dein tägliches Sparring<br />
              für <span className="text-[#C8FF00]">echte Führung</span>.
            </h3>
            <div className="space-y-2 text-slate-300 text-base md:text-lg leading-relaxed max-w-[520px] mb-8">
              <p>Keine Theorie.</p>
              <p>Keine langen Kurse.</p>
              <p className="text-white font-medium">Nur Situationen, die morgen auf dich warten.</p>
            </div>
            <ul className="space-y-3 mb-10">
              {BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-3" data-testid={`leaderos-bullet-${i}`}>
                  <div className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                  <span className="font-inter text-base text-white/90">{b}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/[0.06] p-6 max-w-[540px]">
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-white font-bold">P.S.</span>&nbsp;&nbsp;Maria ist keine Ausnahme. Sie hat nichts Besonderes gemacht. Sie hat sich eingeloggt. Die Credits genutzt. Und jeden Tag ein bisschen trainiert. <span className="text-white font-semibold">Genau dort beginnt Veränderung.</span> <span className="text-[#C8FF00]">♡</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-[#C8FF00]/30 bg-gradient-to-br from-[#C8FF00]/[0.08] to-transparent p-7 md:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-3">
                🎁 Dein Bonus ist aktiv
              </p>
              <p className="font-manrope font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                <span className="text-[#C8FF00]">50 kostenlose</span><br />Credits.
              </p>
              <p className="font-inter text-base text-slate-400 mt-3 mb-7">
                WladBot ist online. Du musst nur einloggen.
              </p>
              <div className="flex items-end gap-4 mb-2">
                <button
                  onClick={() => navigate("/diagnose")}
                  data-testid="leaderos-cta-start"
                  className="btn-primary px-6 py-3.5 text-sm font-bold inline-flex items-center gap-2"
                >
                  Jetzt starten <ArrowRight className="w-4 h-4" />
                </button>
                <div className="relative">
                  <img src="/wladbot.png" alt="WladBot" className="w-20 h-auto" />
                  <div className="absolute -top-3 -left-[120px] bg-white text-black text-[10px] font-bold px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                    Ich bin bereit. Und du?
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-white" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-4">
                Mit 2-3 Credits pro Session reicht das für 15-25 echte Führungssituationen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

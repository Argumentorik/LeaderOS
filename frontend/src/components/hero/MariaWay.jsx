import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import ClientStoriesCarousel from "../shared/ClientStoriesCarousel";
import { DottedGlowBackground } from "../ui/dotted-glow-background";
import { Timeline } from "../ui/timeline";
import {
  Card as SkCard,
  CardTitle as SkCardTitle,
  CardDescription as SkCardDescription,
  CardSkeletonContainer,
  AIStackSkeleton,
} from "../ui/skeleton-card";

const THIRTY_DAY_PLAN = [
  { num: "01", week: "Woche 1", label: "Klarheit im Kopf · ohne Überforderung." },
  { num: "02", week: "Woche 2", label: "Gespräche mit Kollegen leichter führen." },
  { num: "03", week: "Woche 3", label: "KI als zweiter Hebel · richtig genutzt." },
  { num: "04", week: "Woche 4", label: "Selbstvertrauen, das man spürt." },
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
      className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-hidden"
      data-testid="maria-way-section"
    >
      {/* Premium ambient dotted-glow background */}
      <DottedGlowBackground
        className="pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        gap={28}
        radius={1.2}
        opacity={0.55}
        color="rgba(200,255,0,0.32)"
        glowColor="rgba(200,255,0,0.85)"
        speedMin={0.25}
        speedMax={0.9}
        speedScale={0.8}
      />
      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8">
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
            {/* Premium frame · lime corner brackets · hover zoom · soft glow */}
            <div className="relative group">
              {/* Lime corner accents (top-left + bottom-right) */}
              <div className="absolute -top-3 -left-3 w-14 h-14 border-t-2 border-l-2 border-[#C8FF00] rounded-tl-2xl pointer-events-none z-20" />
              <div className="absolute -bottom-3 -right-3 w-14 h-14 border-b-2 border-r-2 border-[#C8FF00] rounded-br-2xl pointer-events-none z-20" />
              {/* Soft lime glow behind */}
              <div className="absolute -inset-2 bg-[#C8FF00]/[0.06] rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/40">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {/* Shimmer placeholder while loading */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] animate-pulse" aria-hidden />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=85&auto=format&fit=crop"
                    alt="Maria K. · Head of Engineering"
                    loading="lazy"
                    decoding="async"
                    className="relative w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    data-testid="maria-portrait-img"
                  />
                  {/* Dual-tone bottom-gradient · lime hint */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8FF00]/60 to-transparent" />

                  {/* Play overlay · premium pill button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl shadow-black/60 transition-transform duration-300 group-hover:scale-110">
                      <div className="ml-1 w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
                    </div>
                  </div>

                  {/* Caption pinned to bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="font-mono text-[10px] tracking-[0.22em] text-[#C8FF00] font-semibold uppercase mb-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                      Maria · Real Story
                    </div>
                    <div className="font-manrope font-bold text-white text-base leading-tight">Head of Engineering</div>
                    <div className="font-inter text-[11px] text-slate-300 mt-0.5">TecConsult AG · 30-Tage Resultat</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-5 px-2 relative">
                  {[
                    { v: "30", l: "Tage" },
                    { v: "50", l: "Credits" },
                    { v: "+180k €", l: "verhandelt" },
                  ].map((s, i) => (
                    <div key={`maria-stat-${s.l}`} className="text-center px-2" data-testid={`maria-stat-${i}`}>
                      <p className="font-manrope text-xl md:text-2xl font-extrabold text-white tracking-tight leading-none">{s.v}</p>
                      <p className="font-inter text-[10px] md:text-[11px] text-slate-400 mt-2 tracking-wide">{s.l}</p>
                    </div>
                  ))}
                </div>
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

        {/* 4-WEEK TIMELINE · Aceternity-Style (sticky-scroll, animated lime line) */}
        <div className="mb-20 -mx-4 md:-mx-8">
          <Timeline
            heading={<>Vier Wochen.<br /><span className="text-[#C8FF00]">Vier Hebel im Alltag.</span></>}
            subheading="Nicht Theorie. Nicht Meeting-Tricks. Echte Transformation in deinem Arbeitsalltag · mit Kollegen, im Kopf, in der Wirkung."
            data={[
              {
                title: "Woche 1",
                content: (
                  <div data-testid="maria-week-1">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">
                      Tag 1 → 7 · Klarheit im Kopf
                    </p>
                    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-5">
                      Den Lärm abstellen.<br />Den Hebel finden.
                    </p>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-5 max-w-[640px]">
                      Erste Woche: jeden Morgen 3 Minuten Sparring mit WladBot. Was ist heute wirklich wichtig? Wo fließt deine Energie hin · und wo sollte sie hinfließen? Plötzlich entscheidest du schneller. Mit weniger Selbstzweifeln.
                    </p>
                    <div className="rounded-xl border-l-2 border-[#C8FF00] bg-white/[0.02] pl-5 py-4 mb-6">
                      <p className="font-inter italic text-base md:text-lg text-white/85 leading-snug">
                        «Ab Tag 3 wusste ich morgens, was zählt. Und was Lärm war.»
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { v: "3 Min", l: "tägliche Routine" },
                        { v: "1", l: "Fokus pro Tag" },
                        { v: "0", l: "Mental-Klutter" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg bg-[#0d0d0d] border border-white/[0.06] p-4 text-center">
                          <p className="font-manrope text-xl md:text-2xl font-extrabold text-[#C8FF00] leading-none">{s.v}</p>
                          <p className="text-[11px] text-slate-500 mt-2">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                title: "Woche 2",
                content: (
                  <div data-testid="maria-week-2">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">
                      Tag 8 → 14 · Kommunikation mit Kollegen
                    </p>
                    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-5">
                      Die Gespräche, vor denen<br />du dich gedrückt hast.
                    </p>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-5 max-w-[640px]">
                      Es gibt dieses eine Gespräch, das du seit Wochen aufschiebst. Das schwierige Feedback. Der konstruktive Konflikt. Das «Nein» an die Kollegin. Du übst es 5 Minuten mit WladBot. Drei Varianten. Du gehst rein. Es läuft.
                    </p>
                    <div className="rounded-xl border-l-2 border-[#C8FF00] bg-white/[0.02] pl-5 py-4 mb-6">
                      <p className="font-inter italic text-base md:text-lg text-white/85 leading-snug">
                        «Mein Team merkt einen Unterschied. Ich auch.»
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { v: "3", l: "Gesprächs-Varianten" },
                        { v: "5 Min", l: "Vor-Sparring" },
                        { v: "1", l: "klare Entscheidung" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg bg-[#0d0d0d] border border-white/[0.06] p-4 text-center">
                          <p className="font-manrope text-xl md:text-2xl font-extrabold text-[#C8FF00] leading-none">{s.v}</p>
                          <p className="text-[11px] text-slate-500 mt-2">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                title: "Woche 3",
                content: (
                  <div data-testid="maria-week-3">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">
                      Tag 15 → 21 · KI richtig anwenden
                    </p>
                    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-5">
                      Nicht «mal kurz fragen».<br />Sondern <span className="text-[#C8FF00]">richtig denken lassen</span>.
                    </p>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-5 max-w-[640px]">
                      Die meisten nutzen KI wie eine Suchmaschine. Du lernst sie als Sparringspartner zu führen. Frameworks, Rollenspiele, Pre-Mortems, Decision-Trees. Du fragst nicht mehr «was meinst du?». Du sagst «zerleg das in 3 Optionen mit jeweils 2 Risiken». Anderes Level.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {["Frage stellen", "Rolle definieren", "Framework wählen", "Antwort prüfen", "Anwenden"].map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <div className="rounded-lg bg-[#0d0d0d] border border-[#C8FF00]/20 px-4 py-2 text-sm text-white font-medium">{s}</div>
                          {i < arr.length - 1 && <span className="text-[#C8FF00] font-extrabold">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                title: "Woche 4",
                content: (
                  <div data-testid="maria-week-4">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">
                      Tag 22 → 30 · Wirkung, die man spürt
                    </p>
                    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-5">
                      Andere merken es,<br />bevor du es selbst sagst.
                    </p>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-5 max-w-[640px]">
                      Nach 4 Wochen sitzt du anders in Meetings. Du sprichst weniger und triffst mehr. Du bittest weniger und entscheidest mehr. Kollegen fragen, ob du Coaching machst. Du sagst «nein, ich trainiere jeden Morgen 3 Minuten».
                    </p>
                    <div className="rounded-xl bg-gradient-to-br from-[#C8FF00]/[0.12] to-transparent border border-[#C8FF00]/30 p-6 md:p-8">
                      <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-3">Tag 31 · Was sich geändert hat</p>
                      <ul className="space-y-3">
                        {[
                          "Du entscheidest schneller · mit klarem Kopf.",
                          "Du führst schwierige Gespräche · ohne Bauchschmerzen.",
                          "Du nutzt KI als Hebel · nicht als Krücke.",
                          "Du wirkst · ohne dich anzustrengen.",
                        ].map((b, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/90">
                            <Check className="w-4 h-4 text-[#C8FF00] mt-1 shrink-0" strokeWidth={3} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* SPARRING WITH AI STACK · Skeleton-Card */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-6">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
              ↳ Was unter der Haube läuft
            </p>
            <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-[1.05] mb-6">
              Sparring mit den<br />
              <span className="text-[#C8FF00]">besten KI-Hebeln</span>.
            </h3>
            <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-6 max-w-[520px]">
              WladBot orchestriert mehrere KI-Modelle und Frameworks im Hintergrund. Du tippst eine Situation rein, WladBot wählt das richtige Modell, antwortet im Wlad-Stil.
            </p>
            <ul className="space-y-2.5">
              {[
                "Multi-Model: Claude, GPT, Gemini · WladBot wählt selbst.",
                "11 Frameworks aus Wlads Praxis (SEXIER, Harvard, EQ-Quadrant).",
                "Antworten im Wlad-Stil. Nicht generisch.",
                "Privacy: deine Sessions bleiben deine.",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/85" data-testid={`ai-bullet-${i}`}>
                  <div className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-6">
            <SkCard className="max-w-md md:ml-auto" data-testid="ai-stack-card">
              <CardSkeletonContainer>
                <AIStackSkeleton />
              </CardSkeletonContainer>
              <SkCardTitle>WladBot · der Stack hinter dem Sparring.</SkCardTitle>
              <SkCardDescription>
                Claude, GPT, Gemini und Wlads 11 Frameworks · orchestriert in einer Oberfläche. Du chattest. WladBot übersetzt.
              </SkCardDescription>
            </SkCard>
          </div>
        </div>


        {/* TRANSFORMATION ARROWS */}
        <div className="relative mb-20 rounded-3xl bg-gradient-to-br from-[#C8FF00]/[0.06] to-transparent border border-[#C8FF00]/15 p-8 md:p-14 text-center overflow-hidden">
          <DottedGlowBackground
            className="pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
            gap={20}
            radius={1.4}
            opacity={0.6}
            color="rgba(200,255,0,0.45)"
            glowColor="rgba(200,255,0,1)"
            speedMin={0.35}
            speedMax={1.2}
            speedScale={1}
          />
          <div className="relative z-10">
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
        </div>

        {/* 30-Tage-Check · 4 Phasen-Strip */}
        <div className="mb-20">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
            ↳ Dein 30-Tage-Check · 4 Phasen · 1 Routine
          </p>
          <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-tight mb-10">
            30 Tage. <span className="text-[#C8FF00]">Vier Hebel.</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {THIRTY_DAY_PLAN.map(({ num, week, label }, i) => {
              const isActive = i === 0;
              return (
                <div
                  key={num}
                  data-testid={`phase-card-${i + 1}`}
                  className={`relative rounded-2xl p-6 md:p-7 transition-all bg-[#0d0d0d] border ${
                    isActive ? "border-[#C8FF00]" : "border-white/[0.08] hover:border-[#C8FF00]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <p className={`font-mono text-[10px] tracking-[0.22em] uppercase font-bold ${
                      isActive ? "text-[#C8FF00]" : "text-slate-500"
                    }`}>{week}</p>
                    <p className={`font-manrope text-3xl md:text-4xl font-extrabold leading-none tracking-tight ${
                      isActive ? "text-[#C8FF00]" : "text-slate-700"
                    }`}>{num}</p>
                  </div>
                  <p className={`font-manrope font-bold text-base md:text-lg leading-snug tracking-tight ${
                    isActive ? "text-white" : "text-slate-300"
                  }`}>
                    {label}
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
            <div className="relative rounded-2xl border border-[#C8FF00]/30 bg-gradient-to-br from-[#C8FF00]/[0.08] to-transparent p-7 md:p-8 overflow-hidden">
              <DottedGlowBackground
                className="pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,black_10%,transparent_70%)]"
                gap={14}
                radius={1.1}
                opacity={0.5}
                color="rgba(200,255,0,0.55)"
                glowColor="rgba(200,255,0,1)"
                speedMin={0.4}
                speedMax={1.4}
              />
              <div className="relative z-10">
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
                  <img src="/wladbot-3.png" alt="WladBot" className="w-24 md:w-28 h-auto rounded-2xl shadow-2xl shadow-black/40 border border-white/[0.06]" />
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
      </div>
    </section>
  );
}

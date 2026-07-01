"use client";
/**
 * DiagnoseStepsSection · Aceternity "Features-Section" Bento-Grid port.
 *
 * 4 Diagnose-Schritte als asymmetrische 6-col Bento-Cards mit eigenem
 * Skeleton-Visual pro Card. Reines CSS-Mockup (kein cobe, kein extra image)
 * damit wir die "no duplicate image"-Regel halten.
 *
 *   ┌─────────────┬──────┐
 *   │  Schritt 01 │  02  │
 *   ├──────────┬──┴──────┤
 *   │    03    │   04    │
 *   └──────────┴─────────┘
 */
import React from "react";
import { motion } from "framer-motion";
import { FileText, Brain, Sparkles, TrendingUp, Play } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Skeleton 1 · Quiz-Preview Mock ──────────────────────────────
function SkeletonQuiz() {
  const options = ["Trifft voll zu", "Trifft eher zu", "Neutral", "Trifft eher nicht zu", "Trifft nicht zu"];
  return (
    <div className="relative h-full px-2 py-8">
      <div className="mx-auto h-full w-full rounded-xl bg-[#0d0d0d] border border-white/[0.06] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 mb-5">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#C8FF00] font-bold">FRAGE 14 / 30</span>
          <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "47%" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#C8FF00] to-[#A3CC00]"
            />
          </div>
        </div>
        <p className="font-manrope font-bold text-white text-lg leading-snug mb-5">
          „Wenn der CFO im Meeting widerspricht, bleibe ich ruhig und führe das Gespräch.&ldquo;
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <motion.div
              key={opt}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                i === 1
                  ? "border-[#C8FF00]/40 bg-[#C8FF00]/[0.06]"
                  : "border-white/[0.05] bg-white/[0.015]"
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 shrink-0",
                  i === 1 ? "border-[#C8FF00] bg-[#C8FF00]" : "border-white/[0.18]"
                )}
              />
              <span
                className={cn(
                  "font-inter text-xs",
                  i === 1 ? "text-white font-medium" : "text-slate-400"
                )}
              >
                {opt}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
    </div>
  );
}

// ─── Skeleton 2 · Score Tiles · tilted stack (no extra images) ──
function SkeletonScores() {
  const layers = [
    { label: "KI", value: 78, rot: -8 },
    { label: "Rhetorik", value: 64, rot: 6 },
    { label: "EQ", value: 82, rot: -3 },
  ];
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden py-8">
      <div className="flex items-center gap-2">
        {layers.map((l, i) => (
          <motion.div
            key={l.label}
            initial={{ y: 30, opacity: 0, rotate: 0 }}
            whileInView={{ y: 0, opacity: 1, rotate: l.rot }}
            whileHover={{ rotate: 0, scale: 1.08, zIndex: 50 }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative w-24 md:w-28 rounded-2xl bg-[#0d0d0d] border border-white/[0.08] p-4 shadow-2xl shadow-black/50"
          >
            <p className="font-mono text-[9px] tracking-[0.2em] text-[#C8FF00] font-bold mb-3 uppercase">
              {l.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="font-manrope font-extrabold text-3xl md:text-4xl text-white leading-none">
                {l.value}
              </span>
              <span className="font-manrope font-bold text-sm text-slate-500">%</span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${l.value}%` }}
                transition={{ duration: 1.1, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                viewport={{ once: true }}
                className="h-full rounded-full bg-[#C8FF00]"
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
    </div>
  );
}

// ─── Skeleton 3 · 30-Tage-Calendar mit Play overlay ─────────────
function SkeletonCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = 12;
  return (
    <div className="group relative h-full px-2 py-6">
      <div className="mx-auto h-full w-full rounded-xl bg-[#0d0d0d] border border-white/[0.06] p-5 transition-all duration-500 group-hover:border-[#C8FF00]/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] text-[#C8FF00] font-bold uppercase">30-Tage-Plan</p>
            <p className="font-manrope font-bold text-white text-sm mt-1">Tag {today} · von 30</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#C8FF00] flex items-center justify-center shadow-lg shadow-[#C8FF00]/30 transition-transform duration-300 group-hover:scale-110">
            <Play className="w-4 h-4 text-[#0a0a0a] ml-0.5" fill="#0a0a0a" />
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => (
            <motion.div
              key={d}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: d * 0.012, duration: 0.25 }}
              viewport={{ once: true }}
              className={cn(
                "aspect-square rounded text-[8px] font-mono font-bold flex items-center justify-center transition-colors",
                d < today && "bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30",
                d === today && "bg-[#C8FF00] text-[#0a0a0a] shadow-md shadow-[#C8FF00]/40",
                d > today && "bg-white/[0.03] text-slate-600 border border-white/[0.05]"
              )}
            >
              {d}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">Heute</span>
          <span className="font-inter text-[11px] text-white">„Lass den CFO ausreden. Antworte erst nach 2 Sekunden.&ldquo;</span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton 4 · ROI-Radial (CSS+SVG, no globe) ────────────────
function SkeletonROI() {
  const stats = [
    { v: "6.4h", l: "Zeit / Woche zurück" },
    { v: "+42 %", l: "Wirkung in Meetings" },
    { v: "30 T", l: "bis erstes Resultat" },
  ];
  return (
    <div className="relative h-full px-2 py-6 flex flex-col items-center justify-center">
      {/* Radial · stacked rings */}
      <div className="relative w-44 h-44 md:w-52 md:h-52">
        {[88, 64, 100].map((r, i) => {
          const size = 100 + i * 22;
          return (
            <svg
              key={size}
              className="absolute inset-0 m-auto -rotate-90"
              width={`${size}%`}
              height={`${size}%`}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#C8FF00"
                strokeWidth="3"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * r) / 100}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 289 }}
                whileInView={{ strokeDashoffset: 289 - (289 * r) / 100 }}
                transition={{ duration: 1.6, delay: 0.3 + i * 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                opacity={1 - i * 0.25}
              />
            </svg>
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[9px] tracking-[0.22em] text-[#C8FF00] font-bold uppercase mb-1">
            ROI
          </span>
          <span className="font-manrope font-extrabold text-3xl md:text-4xl text-white leading-none">+184 %</span>
          <span className="font-inter text-[10px] text-slate-500 mt-1">in 30 Tagen</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 w-full max-w-sm">
        {stats.map((s) => (
          <div key={s.l} className="text-center px-1">
            <p className="font-manrope font-bold text-base text-white leading-none">{s.v}</p>
            <p className="font-inter text-[9px] text-slate-500 mt-1 leading-tight">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card primitives ───────────────────────────────────────────
const FeatureCard = ({ children, className }) => (
  <div className={cn("relative overflow-hidden p-6 sm:p-8 min-h-[320px] lg:min-h-[420px]", className)}>
    {children}
  </div>
);

const FeatureTitle = ({ icon: Icon, children }) => (
  <div className="flex items-start gap-3 mb-2">
    <div className="w-9 h-9 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-[#C8FF00]" strokeWidth={2.2} />
    </div>
    <p
      className="font-manrope font-extrabold text-white"
      style={{ fontSize: "22px", lineHeight: 1.15, letterSpacing: "-0.025em" }}
    >
      {children}
    </p>
  </div>
);

const FeatureDescription = ({ children }) => (
  <p className="font-inter text-sm text-slate-400 max-w-sm leading-relaxed mb-2">{children}</p>
);

// ─── Section ───────────────────────────────────────────────────
const FEATURES = [
  {
    key: "f1",
    icon: FileText,
    title: "30 Fragen · 6 Führungsdimensionen.",
    description: "10 Minuten · ehrlich beantwortet · ohne Login. Du gibst kein Bauchgefühl ab — du gibst Daten ab.",
    skeleton: <SkeletonQuiz />,
    className: "col-span-1 lg:col-span-4 border-b lg:border-r border-white/[0.06]",
  },
  {
    key: "f2",
    icon: Brain,
    title: "Score in drei Ebenen.",
    description: "KI · Rhetorik · EQ. Eine Zahl pro Ebene. Sofort sichtbar, wo du führst — und wo du blutest.",
    skeleton: <SkeletonScores />,
    className: "col-span-1 lg:col-span-2 border-b border-white/[0.06]",
  },
  {
    key: "f3",
    icon: Sparkles,
    title: "Dein 30-Tage-Plan.",
    description: "Konkret · jeden Tag eine Aufgabe. Keine Theorie. Heute weisst du, was du heute Abend tust.",
    skeleton: <SkeletonCalendar />,
    className: "col-span-1 lg:col-span-3 lg:border-r border-white/[0.06]",
  },
  {
    key: "f4",
    icon: TrendingUp,
    title: "ROI-Prognose.",
    description: "Wie viel Zeit du sparst, wie viel Wirkung du gewinnst — in Stunden und Prozent, nicht in Floskeln.",
    skeleton: <SkeletonROI />,
    className: "col-span-1 lg:col-span-3",
  },
];

export default function DiagnoseStepsSection() {
  return (
    <section
      className="relative z-20 mx-auto max-w-7xl py-24 lg:py-32 px-4 md:px-8 border-t border-white/[0.04]"
      data-testid="diagnose-section"
    >
      <div className="text-center mb-12">
        <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
          ▸ 10 Minuten · Sofort-Klarheit
        </span>
        <h2
          className="font-manrope font-extrabold text-white mx-auto max-w-4xl"
          style={{ fontSize: "clamp(36px, 5.4vw, 72px)", lineHeight: 1.04, letterSpacing: "-0.045em" }}
        >
          <span className="block" data-testid="diagnose-headline-l1">Dein persönlicher</span>
          <span className="block text-[#C8FF00] mt-2" data-testid="diagnose-headline-l2">Leadership-Report.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl font-inter text-base md:text-lg text-slate-400 leading-relaxed">
          Die Leader OS Diagnose analysiert deine Führungskompetenzen anhand eines strukturierten Modells.{" "}
          <span className="text-white">Vier Outputs · ein klares Bild.</span>
        </p>
      </div>

      <div className="relative mt-12 grid grid-cols-1 lg:grid-cols-6 rounded-2xl xl:border border-white/[0.06] overflow-hidden" data-testid="diagnose-steps">
        {FEATURES.map((f) => (
          <FeatureCard key={f.key} className={f.className}>
            <FeatureTitle icon={f.icon}>{f.title}</FeatureTitle>
            <FeatureDescription>{f.description}</FeatureDescription>
            <div className="h-full w-full" data-testid={`diagnose-skeleton-${f.key}`}>
              {f.skeleton}
            </div>
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}

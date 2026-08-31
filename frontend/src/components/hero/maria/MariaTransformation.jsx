import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DottedGlowBackground } from "../../ui/dotted-glow-background";

const TRANSFORMATION = [
  "2 Minuten Training",
  "Mehr Klarheit",
  "Mehr Präsenz",
  "Bessere Entscheidungen",
  "Bessere Ergebnisse",
];

export const MariaTransformation = () => {
  const navigate = useNavigate();
  return (
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
  );
};

const THIRTY_DAY_PLAN = [
  { num: "01", week: "Woche 1", label: "Klarheit im Kopf · ohne Überforderung." },
  { num: "02", week: "Woche 2", label: "Gespräche mit Kollegen leichter führen." },
  { num: "03", week: "Woche 3", label: "KI als zweiter Hebel · richtig genutzt." },
  { num: "04", week: "Woche 4", label: "Selbstvertrauen, das man spürt." },
];

export const MariaPhases = () => (
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
);

import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { DottedGlowBackground } from "../../ui/dotted-glow-background";

const BULLETS = [
  "Meetings vorbereiten.",
  "Schwierige Gespräche trainieren.",
  "Feedback üben.",
  "Verhandlungen simulieren.",
  "Mehr Wirkung erzielen.",
];

export const LeaderOSIntro = () => {
  const navigate = useNavigate();
  return (
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
            <li key={b} className="flex items-center gap-3" data-testid={`leaderos-bullet-${i}`}>
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
                <img
                  src="/wladbot-3-nobg.png"
                  alt="WladBot"
                  className="w-28 md:w-32 h-auto anim-float"
                  style={{ filter: "drop-shadow(0 20px 25px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(200,255,0,0.15))" }}
                />
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
  );
};

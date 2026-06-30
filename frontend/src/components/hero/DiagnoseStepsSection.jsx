import { diagnoseSteps } from "./heroData";

/**
 * DiagnoseStepsSection — 4-step explainer for the diagnose flow.
 */
export default function DiagnoseStepsSection() {
  return (
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
          {diagnoseSteps.map((step) => (
            <div
              key={`step-${step.num}`}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all hover:border-[#C8FF00]/10"
            >
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
  );
}

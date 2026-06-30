import { X } from "lucide-react";
import { ScrollReveal } from "../../hooks/useScrollReveal";
import { problems } from "./heroData";

/**
 * ProblemSection — "Klingt vertraut?" two-card grid.
 */
export default function ProblemSection() {
  return (
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
                In <span className="italic font-semibold">zwei</span> wird&apos;s eng. In{" "}
                <span className="italic font-semibold">drei</span> selten.
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problems card */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 overflow-hidden group hover:border-white/[0.1] transition-all duration-500">
              <div className="absolute top-0 left-0 w-20 h-20 bg-red-500/[0.03] rounded-full blur-[40px]" />
              <div className="relative">
                <div className="font-inter text-[10px] tracking-[0.25em] text-red-400/50 uppercase mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-red-400/30" />
                  ▸ Klingt vertraut?
                </div>
                <div className="space-y-6">
                  {problems.map((problem) => (
                    <div key={problem} className="flex items-start gap-4 group/item">
                      <div className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-red-500/10 transition-colors">
                        <X className="w-3.5 h-3.5 text-red-400/70" />
                      </div>
                      <span className="font-inter text-[15px] text-slate-300 leading-relaxed">{problem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Consequences card */}
            <div className="relative rounded-2xl border border-[#C8FF00]/[0.12] bg-[#C8FF00]/[0.02] p-8 md:p-10 overflow-hidden group hover:border-[#C8FF00]/20 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF00]/[0.04] rounded-full blur-[60px]" />
              <div className="relative">
                <div className="font-inter text-[10px] tracking-[0.25em] text-[#C8FF00]/50 uppercase mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-[#C8FF00]/30" />
                  ▸ Das kostet dich
                </div>
                <div className="space-y-5">
                  {["Langsame Entscheidungen.", "Verpasste Chancen.", "Weniger Einfluss."].map((item) => (
                    <div key={item} className="font-manrope font-bold text-xl text-white/90 flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]/60 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[#C8FF00]/[0.08]">
                  <p className="font-inter text-sm text-slate-500 leading-relaxed">
                    Die Diagnose zeigt dir in <span className="text-white font-medium">10 Minuten</span>, welche Ebene du
                    vernachlässigst · ohne Bullshit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

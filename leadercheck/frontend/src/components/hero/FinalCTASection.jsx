import { ArrowRight } from "lucide-react";

/**
 * FinalCTASection — closing CTA "Top 1 % vs. 99 %".
 */
export default function FinalCTASection({ onCtaClick }) {
  return (
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
          Finde es heraus. <span className="text-white font-medium">Kostenlos. In 7 Minuten.</span>
        </p>
        <p className="font-inter text-sm text-[#C8FF00]/70 mb-10">
          + 50 Free Credits für deinen WLAD AI · Report als PDF · 30-Tage-Plan
        </p>
        <button
          data-testid="hero-cta-bottom"
          onClick={onCtaClick}
          className="btn-primary px-10 py-4 text-base font-semibold inline-flex items-center gap-3"
        >
          Jetzt Diagnose starten · Kostenlos
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

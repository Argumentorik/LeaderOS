import { FocusCards } from "../ui/focus-cards";
import { audiences } from "./heroData";

/**
 * AudiencesSection — "Für wen" four-persona FocusCards.
 */
export default function AudiencesSection() {
  return (
    <section className="py-24 border-t border-white/[0.04]" data-testid="for-whom-section">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
            ▸ Für wen
          </span>
          <h2 className="font-manrope font-extrabold text-white leading-[1.05] tracking-tight">
            <span className="block text-4xl md:text-6xl lg:text-7xl">Vier Personas.</span>
            <span className="block text-4xl md:text-6xl lg:text-7xl mt-2">
              <span className="text-[#C8FF00]">Ein Hebel.</span>
            </span>
          </h2>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-xl mx-auto mt-7 leading-relaxed">
            Egal wo du heute stehst · die Diagnose findet den nächsten Schritt für dich. Hover auf deine Persona.
          </p>
        </div>

        <FocusCards cards={audiences} />
      </div>
    </section>
  );
}

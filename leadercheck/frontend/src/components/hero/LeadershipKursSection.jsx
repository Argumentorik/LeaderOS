import { ArrowRight } from "lucide-react";
import { kursTopics } from "./heroData";

/**
 * LeadershipKursSection — Bonus-Modul-Teaser leading to /kurse.
 */
export default function LeadershipKursSection({ onKurseClick }) {
  return (
    <section className="py-24 border-t border-white/[0.04]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
          ▸ Bonus für Diagnose-Absolventen
        </span>
        <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
          <span className="block text-3xl md:text-5xl lg:text-6xl">
            Zugang zu <span className="italic font-semibold">ausgewählten</span> Modulen
          </span>
          <span className="block text-3xl md:text-5xl lg:text-6xl mt-2 text-[#C8FF00]">
            des Wlad Leadership Programms.
          </span>
        </h2>
        <p className="font-inter text-base text-slate-400 mt-6 mb-10 max-w-xl mx-auto leading-relaxed">
          Im Kurs lernst du:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {kursTopics.map((item) => (
            <div
              key={item.text}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all hover:border-[#C8FF00]/10"
            >
              <item.icon className="w-5 h-5 text-[#C8FF00] mx-auto mb-3" />
              <p className="font-inter text-sm text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 inline-block">
          <p className="font-inter text-xs text-slate-500">
            Die Inhalte verbinden <span className="text-slate-400 font-medium">Rhetorik</span>,{" "}
            <span className="text-slate-400 font-medium">Strategie</span> und{" "}
            <span className="text-slate-400 font-medium">KI im Alltag</span> in einem strukturierten System.
          </p>
        </div>
        <div className="mt-6">
          <button
            onClick={onKurseClick}
            className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2"
            data-testid="hero-kurse-cta"
          >
            Alle 6 Kurse ansehen
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

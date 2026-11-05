import { ArrowRight, Bot, Check, Download, Sparkles } from "lucide-react";
import { freeCreditsBullets } from "./heroData";

/**
 * FreeCreditsSection — 50 Free Credits bonus card.
 */
export default function FreeCreditsSection({ onCtaClick }) {
  return (
    <section className="py-20 border-t border-white/[0.04]" data-testid="free-credits-section">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="glass-card p-8 md:p-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block mb-5 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
                ▸ Gratis nach Completion
              </span>
              <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight mb-5">
                <span className="block text-2xl md:text-4xl">50 Free Credits für deinen</span>
                <span className="block text-2xl md:text-4xl mt-1 text-[#C8FF00] italic font-semibold">
                  WladBot &amp; KI-Coach.
                </span>
              </h2>
              <p className="font-inter text-sm text-slate-400 mb-6 leading-relaxed">
                Als Belohnung für deine Diagnose erhältst du{" "}
                <span className="text-white font-medium">50 kostenlose Credits</span> für den WladBot und alle KI-Tools
                innerhalb von Leader OS. Schwierige Gespräche durchspielen, Argumente strukturieren, Entscheidungen schärfen ·
                in Wlads Sprache.
              </p>
              <div className="space-y-3 mb-6">
                {freeCreditsBullets.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#C8FF00] shrink-0" />
                    <span className="font-inter text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  data-testid="hero-cta-credits"
                  onClick={onCtaClick}
                  className="btn-primary px-8 py-4 text-base font-semibold inline-flex items-center gap-2"
                >
                  Diagnose starten &amp; Credits sichern
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="glass-card-subtle p-5 hover-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">WladBot · 50 Credits</div>
                    <div className="font-inter text-xs text-slate-500">KI-Coach in Wlads Sprache</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full w-[65%] rounded-full bg-[#C8FF00]" />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-inter text-[10px] text-slate-600">50 Credits</span>
                  <span className="font-inter text-[10px] text-[#C8FF00]">Kostenlos</span>
                </div>
              </div>

              <div className="glass-card-subtle p-5 hover-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Download className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">Dein Report als PDF</div>
                    <div className="font-inter text-xs text-slate-500">Personalisiert · Sofort verfügbar</div>
                  </div>
                </div>
                <p className="font-inter text-xs text-slate-500">
                  Vollständige Analyse deiner 6 Führungsrollen mit individuellem 30-Tage-Lernplan.
                </p>
              </div>

              <div className="glass-card-subtle p-5 hover-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.06] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">0 EUR · Für immer</div>
                    <div className="font-inter text-xs text-slate-500">Keine Kreditkarte nötig</div>
                  </div>
                </div>
                <p className="font-inter text-xs text-slate-500">
                  Diagnose, Report und 50 Credits · komplett kostenlos. Versprochen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

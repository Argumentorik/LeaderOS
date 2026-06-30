/**
 * SocialProofSection — "Limitiert in 2026" — 3 stat cards + DAX-40 testimonial.
 */
export default function SocialProofSection() {
  return (
    <section className="py-24 border-t border-white/[0.04]" data-testid="scarcity-section">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
            ▸ Limitiert in 2026
          </span>
          <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight">
            <span className="block text-3xl md:text-5xl lg:text-6xl">
              Nur <span className="text-[#C8FF00]">1 % der Führungskräfte</span>
            </span>
            <span className="block text-2xl md:text-4xl lg:text-5xl mt-4 text-slate-400 font-bold">
              nutzen KI <span className="italic font-semibold text-white/95">wirklich</span> strategisch.
            </span>
          </h2>
          <p className="font-inter text-base text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Die anderen 99 % lesen darüber. <span className="text-white">Du könntest es heute noch ändern</span> · in 10
            Minuten weißt du genau, wo du stehst.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02] p-6 text-center">
            <div className="font-manrope font-extrabold text-3xl text-[#C8FF00] mb-2">2.847+</div>
            <div className="font-inter text-xs text-slate-500">Leader haben die Diagnose bereits gemacht</div>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
            <div className="font-manrope font-extrabold text-3xl text-white mb-2">94%</div>
            <div className="font-inter text-xs text-slate-500">sagen: &laquo;Hat mir die Augen geöffnet&raquo;</div>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
            <div className="font-manrope font-extrabold text-3xl text-white mb-2">10 Min</div>
            <div className="font-inter text-xs text-slate-500">für Klarheit, die andere in Monaten nicht bekommen</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 text-center">
          <p className="font-inter text-sm text-slate-400 italic leading-relaxed">
            &laquo;Ich dachte, ich wäre ein guter Kommunikator · bis Leader OS mir gezeigt hat, dass mein eigentlicher Hebel im
            strategischen EQ liegt. Das hat alles verändert.&raquo;
          </p>
          <p className="font-inter text-xs text-slate-600 mt-3">· Senior Manager, DAX 40 Unternehmen</p>
        </div>
      </div>
    </section>
  );
}

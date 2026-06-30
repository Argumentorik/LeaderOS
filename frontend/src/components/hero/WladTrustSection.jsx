import { wladStats } from "./heroData";

/**
 * WladTrustSection — Wlad portrait + credentials + 6 stats + media strip.
 */
export default function WladTrustSection() {
  return (
    <section className="py-20 md:py-28 border-t border-white/[0.04] relative overflow-hidden" data-testid="wlad-trust-landing">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 25% 30%, #C8FF00 0%, transparent 50%)" }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 mb-4 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04] font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] uppercase font-semibold">
            ▸ Hinter Leader · OS
          </span>
          <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-white leading-tight max-w-3xl mx-auto">
            Eine Methodik. <span className="text-gradient-lime">10 Jahre verdichtet.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 lg:gap-16 items-center">
          {/* Portrait */}
          <div className="relative mx-auto lg:mx-0 max-w-sm w-full">
            <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-[#C8FF00] rounded-tl-2xl pointer-events-none" />
            <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-[#C8FF00] rounded-br-2xl pointer-events-none" />

            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#C8FF00]/15 bg-gradient-to-br from-[#C8FF00]/[0.04] to-transparent shadow-2xl shadow-[#C8FF00]/[0.05]">
              <img
                src="/wlad-portrait.png"
                alt="Wladislaw Jachtchenko · Gründer Leader OS · 3× SPIEGEL-Bestseller-Autor"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling.style.display = "flex";
                }}
                data-testid="wlad-portrait-img"
              />
              <div
                className="absolute inset-0 hidden items-center justify-center flex-col gap-3 bg-gradient-to-br from-[#0f1410] to-[#0a0a0a]"
                data-testid="wlad-portrait-fallback"
              >
                <div className="w-32 h-32 rounded-full bg-[#C8FF00] flex items-center justify-center">
                  <span className="font-manrope font-extrabold text-6xl text-[#0a0a0a]">W</span>
                </div>
                <div className="text-center">
                  <div className="font-manrope font-bold text-white text-lg">Wladislaw</div>
                  <div className="font-manrope font-bold text-[#C8FF00] text-lg">Jachtchenko</div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 pt-16 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent">
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] font-semibold uppercase mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                  Gründer · Leader OS
                </div>
                <div className="font-manrope font-bold text-white text-lg leading-tight">Wladislaw Jachtchenko</div>
                <div className="font-inter text-xs text-slate-400 mt-1">Executive Coach · 3× SPIEGEL-Bestseller</div>
              </div>
            </div>

            <div className="absolute -right-4 top-8 hidden md:block px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#C8FF00]/30 shadow-2xl shadow-black/50 rotate-2">
              <div className="font-mono text-[9px] tracking-[0.18em] text-[#C8FF00] font-bold uppercase">3× SPIEGEL</div>
              <div className="font-manrope font-bold text-[11px] text-white">Bestseller</div>
            </div>
            <div className="absolute -left-4 bottom-20 hidden md:block px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#C8FF00]/30 shadow-2xl shadow-black/50 -rotate-2">
              <div className="font-mono text-[9px] tracking-[0.18em] text-[#C8FF00] font-bold uppercase">400.000+</div>
              <div className="font-manrope font-bold text-[11px] text-white">Klienten</div>
            </div>
          </div>

          {/* Trust content */}
          <div>
            <div className="mb-7 pl-6 border-l-2 border-[#C8FF00]">
              <p className="font-manrope font-medium text-lg md:text-xl text-white leading-snug mb-3">
                «Leadership ist nicht, was du sagst, sondern wie du in den schwierigen Momenten entscheidest. Genau dafür habe
                ich Leader · OS gebaut.»
              </p>
              <p className="font-inter text-xs text-slate-500">· Wlad Jachtchenko</p>
            </div>

            <p className="font-inter text-base text-slate-400 leading-relaxed mb-4">
              Alles, was Wlad in über 10 Jahren in Coachings, Frameworks und Büchern entwickelt hat · steckt heute in Leader
              OS. Nicht als Kurs-Bibliothek, sondern als tägliches System für deine schwierigsten Führungs-Entscheidungen.
            </p>
            <p className="font-inter text-sm text-slate-500 leading-relaxed mb-7">
              3× SPIEGEL-Bestseller-Autor · über 400.000 Klienten in Rhetorik, Verhandlung und KI ausgebildet · Top-Speaker
              auf über 500 Bühnen · regelmäßig bei ARD, ZDF, ntv, Welt, Wirtschaftswoche.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
              {wladStats.map(([num, label]) => (
                <div
                  key={label}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#C8FF00]/20 transition-colors"
                >
                  <div className="font-manrope font-extrabold text-xl md:text-2xl text-[#C8FF00] leading-none mb-1.5">
                    {num}
                  </div>
                  <div className="font-inter text-[11px] text-slate-500 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-white/[0.05]">
              <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase mb-3">▸ Als Autor zu Gast bei</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-manrope font-bold text-sm text-slate-400">
                <span>ARD</span><span className="text-slate-700">·</span>
                <span>ZDF</span><span className="text-slate-700">·</span>
                <span>NTV</span><span className="text-slate-700">·</span>
                <span>WELT</span><span className="text-slate-700">·</span>
                <span>WIRTSCHAFTSWOCHE</span><span className="text-slate-700">·</span>
                <span>HANDELSBLATT</span><span className="text-slate-700">·</span>
                <span>FAZ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

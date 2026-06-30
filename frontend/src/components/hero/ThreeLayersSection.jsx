import { layers } from "./heroData";

/**
 * ThreeLayersSection — ClickUp-style asymmetric layout for KI · Rhetorik · EQ.
 */
export default function ThreeLayersSection() {
  return (
    <section
      id="model"
      className="relative py-28 md:py-36 border-t border-white/[0.04] overflow-hidden"
      data-testid="three-layers-section"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="mb-16 md:mb-20 max-w-[920px]">
          <span className="inline-block mb-7 font-mono text-[11px] tracking-[0.22em] text-[#C8FF00] uppercase font-semibold">
            ▸ Drei Ebenen
          </span>
          <h2
            className="font-manrope font-extrabold text-white"
            style={{ fontSize: "clamp(40px, 6.2vw, 76px)", lineHeight: 1.04, letterSpacing: "-0.045em" }}
          >
            Top-Führungskräfte können<br />
            <span className="text-[#C8FF00]">alle drei gleichzeitig</span>.
          </h2>
          <p
            className="mt-8 text-slate-400 leading-relaxed max-w-[640px]"
            style={{ fontSize: "18px", letterSpacing: "-0.011em" }}
          >
            <span className="text-white">KI · Rhetorik · EQ.</span> Wer eine Ebene weglässt, verliert das Spiel · auch wenn er
            es nicht merkt. Hier ist, was Top-1 % heute trainieren.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6" data-testid="hero-layers">
          {layers.map((layer, i) => (
            <div
              key={layer.num}
              data-testid={`hero-layer-${i}`}
              className="group relative rounded-3xl bg-[#0d0d0d] border border-white/[0.06] p-7 md:p-9 transition-all duration-500 hover:border-[#C8FF00]/40 hover:bg-[#0f0f0f] overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-4 -right-2 font-manrope font-extrabold text-[#C8FF00]/[0.04] select-none pointer-events-none transition-opacity duration-500 group-hover:text-[#C8FF00]/[0.08]"
                style={{ fontSize: "180px", lineHeight: 1, letterSpacing: "-0.06em" }}
              >
                {layer.num}
              </div>

              <div className="relative flex items-center justify-between mb-8">
                <span className="font-mono text-[10px] tracking-[0.22em] text-[#C8FF00] uppercase font-bold">
                  Ebene {layer.num}
                </span>
                <div className="w-10 h-10 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center">
                  <layer.icon className="w-5 h-5 text-[#C8FF00]" strokeWidth={2.2} />
                </div>
              </div>

              <h3
                className="relative font-manrope font-extrabold text-white mb-3"
                style={{ fontSize: "44px", lineHeight: 1.05, letterSpacing: "-0.035em" }}
              >
                {layer.title}
              </h3>

              <p
                className="relative text-slate-400 leading-relaxed mb-7 max-w-[280px]"
                style={{ fontSize: "16px", letterSpacing: "-0.011em" }}
              >
                {layer.desc}
              </p>

              <div className="relative h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent mb-5" />

              <ul className="relative space-y-3">
                {layer.points.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0">
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M2.5 6L5 8.5L9.5 4"
                          stroke="#0a0a0a"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="text-white/90 font-medium"
                      style={{ fontSize: "15px", letterSpacing: "-0.011em" }}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-14 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 pt-8 border-t border-white/[0.04]">
          <span className="font-mono text-[10px] tracking-[0.22em] text-slate-500 uppercase font-bold shrink-0">
            ▸ Dein Score
          </span>
          <p className="text-slate-400 leading-relaxed" style={{ fontSize: "15px", letterSpacing: "-0.011em" }}>
            Die Diagnose misst dich auf allen drei Ebenen einzeln.{" "}
            <span className="text-white">10 Minuten · 30 Fragen · ein klares Profil.</span> So weißt du nach dem Test, wo du
            stärkst · und wo du nachschärfst.
          </p>
        </div>
      </div>
    </section>
  );
}

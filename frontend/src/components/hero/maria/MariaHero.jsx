import { useNavigate } from "react-router-dom";

const STATS = [
  { v: "30", l: "Tage" },
  { v: "50", l: "Credits" },
  { v: "+180k €", l: "verhandelt" },
];

export const MariaHero = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start mb-20">
      <div className="md:col-span-7" data-testid="maria-headline-block">
        <h2
          className="font-manrope font-extrabold text-white tracking-tight leading-[1.02]"
          data-testid="maria-headline"
        >
          <span className="block text-5xl md:text-7xl">Vor 30 Tagen</span>
          <span className="block text-5xl md:text-7xl mt-1">
            war Maria <span className="text-[#C8FF00]">unsichtbar</span>.
          </span>
        </h2>

        <div className="mt-10 space-y-5 max-w-[540px]">
          <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
            Sie war fachlich die Beste im Raum.
          </p>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
            Trotzdem hörten alle zu, sobald der CFO sprach.
          </p>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed">
            Sie wusste die Antworten. Aber niemand wartete auf ihre Meinung.
          </p>
        </div>

        <div className="mt-10 pl-5 border-l-2 border-[#C8FF00]">
          <p className="text-white text-base md:text-lg leading-relaxed">
            Dann loggte sie sich bei <span className="text-[#C8FF00] font-bold">Leader OS</span> ein.
          </p>
          <div className="mt-4 space-y-1">
            <p className="text-white/90 text-base md:text-lg font-semibold">30 Tage.</p>
            <p className="text-white/90 text-base md:text-lg font-semibold">50 Credits.</p>
            <p className="text-white/90 text-base md:text-lg font-semibold">Jeden Tag 10 Minuten Sparring mit WladBot.</p>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm text-slate-500 mb-3">Am Tag 31 fragte ihr Team:</p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#C8FF00] leading-tight tracking-tight">
            «Hast du heimlich ein<br />Executive Coaching gemacht?»
          </p>
          <p className="text-sm text-slate-500 mt-6 mb-1">Ihre Antwort:</p>
          <p className="text-xl md:text-2xl font-bold text-white leading-snug">
            «Nein. Ich habe einfach jeden Tag mit Wlad trainiert.»
          </p>
          <p className="text-xs text-slate-500 mt-5 tracking-wide">· Maria K. · Head of Engineering · TecConsult AG</p>
        </div>
      </div>

      <div className="md:col-span-5 md:sticky md:top-24">
        {/* Premium frame · lime corner brackets · hover zoom · soft glow */}
        <div className="relative group">
          <div className="absolute -top-3 -left-3 w-14 h-14 border-t-2 border-l-2 border-[#C8FF00] rounded-tl-2xl pointer-events-none z-20" />
          <div className="absolute -bottom-3 -right-3 w-14 h-14 border-b-2 border-r-2 border-[#C8FF00] rounded-br-2xl pointer-events-none z-20" />
          <div className="absolute -inset-2 bg-[#C8FF00]/[0.06] rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/40">
            <div className="relative aspect-[4/5] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] animate-pulse" aria-hidden />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=85&auto=format&fit=crop"
                alt="Maria K. · Head of Engineering"
                loading="lazy"
                decoding="async"
                className="relative w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                data-testid="maria-portrait-img"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8FF00]/60 to-transparent" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl shadow-black/60 transition-transform duration-300 group-hover:scale-110">
                  <div className="ml-1 w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="font-mono text-[10px] tracking-[0.22em] text-[#C8FF00] font-semibold uppercase mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                  Maria · Real Story
                </div>
                <div className="font-manrope font-bold text-white text-base leading-tight">Head of Engineering</div>
                <div className="font-inter text-[11px] text-slate-300 mt-0.5">TecConsult AG · 30-Tage Resultat</div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-5 px-2 relative">
              {STATS.map((s, i) => (
                <div key={`maria-stat-${s.l}`} className="text-center px-2" data-testid={`maria-stat-${i}`}>
                  <p className="font-manrope text-xl md:text-2xl font-extrabold text-white tracking-tight leading-none">{s.v}</p>
                  <p className="font-inter text-[10px] md:text-[11px] text-slate-400 mt-2 tracking-wide">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MariaBigNumbers = () => (
  <div className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
    {[
      { big: "30", sub: "Tage" },
      { big: "50", sub: "Credits" },
      { big: "+180k €", sub: "erfolgreich verhandelt" },
    ].map((s, i) => (
      <div
        key={s.sub}
        className="rounded-2xl bg-[#0d0d0d] border border-white/[0.06] p-8 text-center"
        data-testid={`maria-bignumber-${i}`}
      >
        <p className="font-manrope text-5xl md:text-6xl font-extrabold text-[#C8FF00] leading-none tracking-tight">
          {s.big}
        </p>
        <p className="font-inter text-sm text-slate-400 mt-3 tracking-wide">{s.sub}</p>
      </div>
    ))}
  </div>
);

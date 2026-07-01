import { useState } from "react";
import { ArrowRight } from "lucide-react";
import EncryptedText from "../ui/encrypted-text";
import { headlines } from "./heroData";

/**
 * HeroATF — Above-the-fold section.
 * Picks one of 5 A/B headline variants (sticky per session) and reveals it
 * via the EncryptedText scramble→decode effect.
 */
export default function HeroATF({ onCtaClick }) {
  const [headlineIdx] = useState(() => {
    const stored = sessionStorage.getItem("leaderos_ab");
    if (stored !== null) return parseInt(stored, 10);
    const idx = Math.floor(Math.random() * headlines.length);
    sessionStorage.setItem("leaderos_ab", idx);
    return idx;
  });
  const hl = headlines[headlineIdx];

  return (
    <section className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 pt-32 pb-24">
      {/* Design-system section label */}
      <div className="flex justify-center mb-10 opacity-0 anim-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]">
          <span className="font-mono text-[10px] tracking-[0.25em] text-[#C8FF00] font-bold">
            ▸ § 01 / 07 · DIAGNOSE · KOSTENLOS
          </span>
        </div>
      </div>

      {/* Main Headline · ClickUp-style tight tracking */}
      <h1
        className="font-manrope font-extrabold text-white mb-8 opacity-0 anim-fade-up delay-1 text-center"
        data-testid="hero-headline"
        style={{ fontSize: "clamp(40px, 7vw, 84px)", lineHeight: 1.03, letterSpacing: "-0.05em" }}
      >
        {hl.lines.map((line, i) => {
          const isAccent = line.startsWith("{") && line.endsWith("}");
          const text = isAccent ? line.slice(1, -1) : line;
          return (
            <span key={`hl-${headlineIdx}-${i}`}>
              {isAccent ? (
                <EncryptedText
                  text={text}
                  as="span"
                  className="text-gradient-lime"
                  trigger="mount"
                  duration={1400}
                  data-testid={`hero-headline-accent-${i}`}
                />
              ) : (
                <span data-testid={`hero-headline-line-${i}`}>{text}</span>
              )}
              {i < hl.lines.length - 1 && <br />}
            </span>
          );
        })}
      </h1>

      {/* Three Skills */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mb-10 opacity-0 anim-fade-up delay-2">
        <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">KI</span>
        <span className="font-mono text-xs text-slate-700">·</span>
        <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">Rhetorik</span>
        <span className="font-mono text-xs text-slate-700">·</span>
        <span className="badge-lime px-5 py-2.5 text-sm font-semibold tracking-wide">EQ</span>
      </div>

      {/* Subheadline */}
      <p
        className="font-inter text-slate-400 mb-10 max-w-3xl mx-auto opacity-0 anim-fade-up delay-3 text-center"
        data-testid="hero-subheadline"
        style={{ fontSize: "19px", lineHeight: 1.5, letterSpacing: "-0.018em" }}
      >
        <span className="text-white font-semibold">Zehn Minuten · 30 Fragen · ehrlich beantwortet.</span>{" "}
        Du bekommst sofort deinen Score in drei Ebenen plus konkreten 30-Tage-Plan.{" "}
        Kein Login. Kein Spam. <span className="text-[#C8FF00] font-semibold">Sofort umsetzbar.</span>
      </p>

      {/* Scarcity bar */}
      <div className="flex justify-center mb-8 opacity-0 anim-fade-up delay-3">
        <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/[0.08] bg-white/[0.02]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 font-medium uppercase">
            Sei Teil der Leader-OS Bewegung · <span className="text-[#C8FF00]">KI · Rhetorik · EQ</span> meistern
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="opacity-0 anim-fade-up delay-4 text-center">
        <button
          data-testid="hero-cta-primary"
          onClick={onCtaClick}
          className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-semibold mb-5"
        >
          Jetzt Diagnose starten · 10 Min
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="font-inter text-sm text-slate-600">
          Kostenlos · ohne Login · DSGVO · 100 % anonym
        </p>
      </div>
    </section>
  );
}

import ClientStoriesCarousel from "../shared/ClientStoriesCarousel";
import { DottedGlowBackground } from "../ui/dotted-glow-background";
import { MariaHero, MariaBigNumbers } from "./maria/MariaHero";
import { MariaTimeline } from "./maria/MariaTimeline";
import { MariaAIStack } from "./maria/MariaAIStack";
import { MariaTransformation, MariaPhases } from "./maria/MariaTransformation";
import { LeaderOSIntro } from "./maria/LeaderOSIntro";

export default function MariaWay() {
  return (
    <section
      className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-hidden"
      data-testid="maria-way-section"
    >
      {/* Premium ambient dotted-glow background */}
      <DottedGlowBackground
        className="pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        gap={28}
        radius={1.2}
        opacity={0.55}
        color="rgba(200,255,0,0.32)"
        glowColor="rgba(200,255,0,0.85)"
        speedMin={0.25}
        speedMax={0.9}
        speedScale={0.8}
      />
      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Eyebrow strip */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#C8FF00] flex items-center justify-center text-black font-extrabold text-sm">W</div>
            <span className="font-manrope text-sm font-bold text-white tracking-tight">Leader OS</span>
          </div>
          <span className="font-mono text-[10px] md:text-[11px] tracking-[0.22em] text-[#C8FF00] font-bold uppercase">
            Tag 5 · Eine Geschichte, die alles verändert
          </span>
        </div>

        <MariaHero />
        <MariaBigNumbers />
        <MariaTimeline />
        <MariaAIStack />
        <MariaTransformation />
        <MariaPhases />

        {/* CLIENT STORY CAROUSEL · Apple-Cards */}
        <ClientStoriesCarousel
          className="mb-20"
          eyebrow="↳ Sie haben es auch gemacht"
          headline={<>5 Stories. 5 Hebel.<br /><span className="text-[#C8FF00]">Ein Pattern.</span></>}
          subline="Tippe auf eine Karte. Lies, was passiert ist. Frage dich, was bei dir möglich wäre."
        />

        <LeaderOSIntro />
      </div>
    </section>
  );
}

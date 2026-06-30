import { Carousel, Card as AppleCard } from "../ui/apple-cards-carousel";
import EncryptedText from "../ui/encrypted-text";
import { platformFeatures } from "./heroData";

/**
 * AgentsCarouselSection — 6 KI-Agenten as Apple Cards Carousel with click-to-modal.
 */
export default function AgentsCarouselSection() {
  return (
    <section className="py-24 border-t border-white/[0.04]" data-testid="agents-section">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="mb-4 md:mb-6 max-w-[920px]">
          <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
            ▸ 6 KI-Agenten
          </span>
          <h2
            className="font-manrope font-extrabold text-white"
            style={{ fontSize: "clamp(34px, 5.4vw, 68px)", lineHeight: 1.04, letterSpacing: "-0.045em" }}
          >
            <EncryptedText
              text="Sechs spezialisierte Agenten."
              as="span"
              className="block"
              trigger="view"
              duration={1300}
              data-testid="agents-headline-line-1"
            />
            <EncryptedText
              text="Eine Mission · dein Aufstieg."
              as="span"
              className="block mt-2 text-[#C8FF00]"
              trigger="view"
              duration={1500}
              data-testid="agents-headline-line-2"
            />
          </h2>
          <p
            className="mt-7 text-slate-400 leading-relaxed max-w-[640px]"
            style={{ fontSize: "18px", letterSpacing: "-0.011em" }}
          >
            Jeder Agent ist auf einen Bereich deiner Führungsentwicklung spezialisiert.{" "}
            <span className="text-white">Klick eine Karte · sieh, was er für dich übernimmt.</span>
          </p>
        </div>

        <Carousel
          items={platformFeatures.map((agent, i) => (
            <AppleCard
              key={agent.id}
              index={i}
              layout
              card={{
                category: agent.category,
                title: agent.title,
                src: agent.src,
                content: (
                  <div className="space-y-7">
                    <p className="font-inter text-base md:text-lg text-slate-300 leading-relaxed">
                      {agent.desc}
                    </p>
                    <div className="space-y-3">
                      {agent.bullets.map((b) => (
                        <div key={b} className="flex items-start gap-3">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#C8FF00] shrink-0" />
                          <span className="font-inter text-sm md:text-base text-slate-300 leading-relaxed">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
                        <agent.icon className="w-4 h-4 text-[#C8FF00]" />
                      </div>
                      <p className="font-mono text-[11px] tracking-[0.2em] text-slate-500 uppercase">
                        Teil von Leader · OS
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          ))}
        />
      </div>
    </section>
  );
}

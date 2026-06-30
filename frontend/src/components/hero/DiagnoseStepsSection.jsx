import { Brain, FileText, Sparkles, TrendingUp } from "lucide-react";
import EncryptedText from "../ui/encrypted-text";
import { DraggableCardBody, DraggableCardContainer } from "../ui/draggable-card";

/**
 * DiagnoseStepsSection — re-designed with Aceternity DraggableCard.
 *
 * The 4 diagnose steps live as scattered, 3D-tilted cards that the user can
 * physically drag around. Each card has a big lime step-number watermark + an
 * icon-tile + the step content. The center holds the eyebrow + headline so the
 * cards visually orbit the value proposition.
 */
const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "30 Fragen · 6 Führungsdimensionen",
    sub: "10 Minuten · ehrlich · ohne Login.",
    className: "absolute top-0 left-0 md:top-2 md:left-2 -rotate-[7deg]",
  },
  {
    num: "02",
    icon: Brain,
    title: "Score in drei Ebenen",
    sub: "KI · Rhetorik · EQ — auf einen Blick.",
    className: "absolute top-4 right-0 md:top-0 md:right-2 rotate-[6deg]",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Dein 30-Tage-Plan",
    sub: "Konkret · jeden Tag eine Aufgabe.",
    className: "absolute bottom-0 left-0 md:bottom-2 md:left-2 rotate-[4deg]",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "ROI-Prognose",
    sub: "Zeit gespart · Wirkung gewonnen.",
    className: "absolute bottom-2 right-0 md:bottom-0 md:right-2 -rotate-[5deg]",
  },
];

function StepCard({ step }) {
  const Icon = step.icon;
  return (
    <DraggableCardBody className={step.className} data-testid={`diagnose-step-${step.num}`}>
      {/* Giant lime watermark number */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-2 font-manrope font-extrabold text-[#C8FF00]/[0.08] select-none"
        style={{ fontSize: "180px", lineHeight: 1, letterSpacing: "-0.06em" }}
      >
        {step.num}
      </div>

      <div className="relative flex items-center justify-between mb-8">
        <span className="font-mono text-[10px] tracking-[0.22em] text-[#C8FF00] uppercase font-bold">
          Schritt {step.num}
        </span>
        <div className="w-10 h-10 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#C8FF00]" strokeWidth={2.2} />
        </div>
      </div>

      <h3
        className="relative font-manrope font-extrabold text-white mb-3"
        style={{ fontSize: "26px", lineHeight: 1.1, letterSpacing: "-0.025em" }}
      >
        {step.title}
      </h3>
      <p
        className="relative text-slate-400 leading-relaxed"
        style={{ fontSize: "14px", letterSpacing: "-0.011em" }}
      >
        {step.sub}
      </p>

      {/* Bottom hint · only visible on idle, dims while dragging */}
      <div className="absolute bottom-5 left-7 right-7 flex items-center gap-2 pt-4 border-t border-white/[0.05]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
        <span className="font-mono text-[9px] tracking-[0.22em] text-slate-500 uppercase">
          Drag me · 3D
        </span>
      </div>
    </DraggableCardBody>
  );
}

export default function DiagnoseStepsSection() {
  return (
    <section className="relative py-28 md:py-36 border-t border-white/[0.04] overflow-hidden" data-testid="diagnose-section">
      {/* Soft lime glow behind the headline */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#C8FF00]/[0.04] rounded-full blur-[180px]" />
      </div>

      <DraggableCardContainer className="relative max-w-[1240px] mx-auto px-4 md:px-8">
        {/* Stage · scatter zone for the 4 cards (~720 px desktop) */}
        <div className="relative min-h-[680px] md:min-h-[760px]">
          {/* Centerpiece · eyebrow + display headline + subline */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4 z-0">
            <span className="inline-block mb-7 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
              ▸ 10 Minuten · Sofort-Klarheit
            </span>
            <h2
              className="font-manrope font-extrabold text-white max-w-3xl"
              style={{ fontSize: "clamp(40px, 6.4vw, 84px)", lineHeight: 1.02, letterSpacing: "-0.05em" }}
            >
              <EncryptedText
                text="Dein persönlicher"
                as="span"
                className="block"
                trigger="view"
                duration={1300}
                data-testid="diagnose-headline-l1"
              />
              <EncryptedText
                text="Leadership-Report."
                as="span"
                className="block text-[#C8FF00] mt-2"
                trigger="view"
                duration={1600}
                data-testid="diagnose-headline-l2"
              />
            </h2>
            <p
              className="mt-7 text-slate-400 leading-relaxed max-w-[520px]"
              style={{ fontSize: "17px", letterSpacing: "-0.011em" }}
            >
              <span className="text-white">Vier Schritte. Ein Ergebnis.</span> Greif die Karten an · zieh sie zur Seite ·
              sieh, was deine Diagnose dir liefert.
            </p>
          </div>

          {/* Scattered draggable step cards */}
          <div className="relative z-10" data-testid="diagnose-steps">
            {STEPS.map((step) => (
              <StepCard key={step.num} step={step} />
            ))}
          </div>
        </div>
      </DraggableCardContainer>
    </section>
  );
}

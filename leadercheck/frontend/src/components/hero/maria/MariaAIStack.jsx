import { Check } from "lucide-react";
import {
  Card as SkCard,
  CardTitle as SkCardTitle,
  CardDescription as SkCardDescription,
  CardSkeletonContainer,
  AIStackSkeleton,
} from "../../ui/skeleton-card";

const AI_BULLETS = [
  "Multi-Model: Claude, GPT, Gemini · WladBot wählt selbst.",
  "11 Frameworks aus Wlads Praxis (SEXIER, Harvard, EQ-Quadrant).",
  "Antworten im Wlad-Stil. Nicht generisch.",
  "Privacy: deine Sessions bleiben deine.",
];

export const MariaAIStack = () => (
  <div className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
    <div className="md:col-span-6">
      <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
        ↳ Was unter der Haube läuft
      </p>
      <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-[1.05] mb-6">
        Sparring mit den<br />
        <span className="text-[#C8FF00]">besten KI-Hebeln</span>.
      </h3>
      <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-6 max-w-[520px]">
        WladBot orchestriert mehrere KI-Modelle und Frameworks im Hintergrund. Du tippst eine Situation rein, WladBot wählt das richtige Modell, antwortet im Wlad-Stil.
      </p>
      <ul className="space-y-2.5">
        {AI_BULLETS.map((b, i) => (
          <li key={b} className="flex items-start gap-3 text-sm md:text-base text-white/85" data-testid={`ai-bullet-${i}`}>
            <div className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-black" strokeWidth={3} />
            </div>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="md:col-span-6">
      <SkCard className="max-w-md md:ml-auto" data-testid="ai-stack-card">
        <CardSkeletonContainer>
          <AIStackSkeleton />
        </CardSkeletonContainer>
        <SkCardTitle>WladBot · der Stack hinter dem Sparring.</SkCardTitle>
        <SkCardDescription>
          Claude, GPT, Gemini und Wlads 11 Frameworks · orchestriert in einer Oberfläche. Du chattest. WladBot übersetzt.
        </SkCardDescription>
      </SkCard>
    </div>
  </div>
);

import { Bot } from "lucide-react";
import { wladbotFeatures } from "./heroData";

/**
 * WladBotSection — WLAD AI chat preview with feature bullets.
 */
export default function WladBotSection() {
  return (
    <section className="py-24 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* WLAD AI Preview */}
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.08] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#C8FF00]" />
              </div>
              <div>
                <div className="font-manrope font-bold text-sm text-white">WLAD AI</div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                  <span className="font-inter text-xs text-slate-500">Online</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/[0.03] border border-white/[0.04] px-4 py-3 rounded-2xl rounded-bl-md">
                <p className="font-inter text-sm text-slate-300">
                  &laquo;Wie kann ich mich auf ein schwieriges Feedbackgespräch mit meinem Team vorbereiten?&raquo;
                </p>
              </div>
              <div className="bg-[#C8FF00] px-4 py-3 rounded-2xl rounded-br-md ml-8">
                <p className="font-inter text-sm text-[#0a0a0a] font-medium">
                  Lass uns das strukturiert angehen. Zunächst: Was ist der konkrete Anlass?
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block mb-6 font-mono text-[11px] tracking-[0.28em] text-[#C8FF00]/80 uppercase font-semibold">
              ▸ Der WLAD AI
            </span>
            <h2 className="font-manrope font-extrabold text-white leading-[1.15] tracking-tight mb-6">
              <span className="block text-3xl md:text-4xl lg:text-5xl">
                Dein <span className="italic font-semibold">persönlicher</span>
              </span>
              <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-[#C8FF00]">
                KI-Leadership-Coach.
              </span>
            </h2>
            <p className="font-inter text-sm text-slate-400 mb-6 leading-relaxed">Du kannst ihn nutzen für:</p>
            <div className="space-y-3 mb-8">
              {wladbotFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] shrink-0" />
                  <span className="font-inter text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
              <p className="font-inter text-xs text-slate-500">
                Kombiniert: <span className="text-slate-400">KI-Analyse</span> ·{" "}
                <span className="text-slate-400">Leadership-Modelle</span> ·{" "}
                <span className="text-slate-400">Rhetorik-Training</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

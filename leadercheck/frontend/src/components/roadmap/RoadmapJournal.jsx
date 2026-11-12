import { BookOpen, Bot, Check } from "lucide-react";
import { journalPrompts } from "./roadmapData";

export const RoadmapJournal = ({ entries, handleEntry, filledCount }) => (
  <div className="glass-card p-8 mb-14" data-testid="journal-section">
    <div className="flex items-center gap-3 mb-2">
      <BookOpen className="w-5 h-5 text-[#C8FF00]" />
      <h2 className="font-manrope font-bold text-xl text-white">Dein Leadership-Journal</h2>
    </div>
    <p className="font-inter text-sm text-slate-500 mb-6">
      Beantworte diese 6 Reflexionsfragen ehrlich. Das ist dein Startpunkt für die Transformation.
    </p>
    <div className="space-y-4">
      {journalPrompts.map((prompt, i) => (
        <div key={`journal-${i}`} data-testid={`journal-entry-${i}`}>
          <label className="font-inter text-sm text-slate-300 mb-2 block flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold" style={{ color: entries[i].trim() ? "#10B981" : "#64748B" }}>
              {entries[i].trim() ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            {prompt}
          </label>
          <textarea
            value={entries[i]}
            onChange={e => handleEntry(i, e.target.value)}
            placeholder="Schreib hier..."
            rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/20 focus:outline-none resize-none transition-colors"
          />
        </div>
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between">
      <span className="font-inter text-xs text-slate-500">{filledCount} / 6 beantwortet</span>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-white/[0.04]">
        <div className="h-full rounded-full bg-[#C8FF00] transition-all duration-500" style={{ width: `${(filledCount / 6) * 100}%` }} />
      </div>
    </div>
  </div>
);

export const WladBotMotivation = () => (
  <div className="glass-card p-6 mb-14 border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02]" data-testid="wladbot-motivation">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
        <Bot className="w-6 h-6 text-[#C8FF00]" />
      </div>
      <div>
        <div className="font-manrope font-bold text-white mb-1">WLAD AI</div>
        <p className="font-inter text-sm text-slate-300 leading-relaxed mb-3">
          Stark! Du hast dir die Zeit genommen und ehrlich reflektiert · das machen die wenigsten.
          Jetzt kommt der spannende Teil: Nimm dir die nächsten 30 Tage und arbeite die Kurse durch.
          Nicht perfekt, sondern konsequent. Jeden Tag ein kleiner Schritt. Die Transformation passiert nicht über Nacht · aber sie passiert, wenn du dranbleibst.
        </p>
        <p className="font-inter text-sm text-[#C8FF00]/80 font-medium">
          Bereit, den nächsten Schritt zu machen? Die Kurse und die Community warten auf dich.
        </p>
      </div>
    </div>
  </div>
);

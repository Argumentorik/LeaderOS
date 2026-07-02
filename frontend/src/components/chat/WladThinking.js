import { useEffect, useState } from 'react';
import { WladBotAvatar } from '../brand/WladBotAvatar';

const PHASES_DE = [
  'Wlad denkt nach…',
  'Analysiert deine Situation…',
  'Greift auf Wlads Frameworks zu…',
  'Formuliert die Antwort…',
];
const PHASES_EN = [
  'Wlad is thinking…',
  'Analyzing your situation…',
  'Consulting Wlad\u2019s frameworks…',
  'Crafting the reply…',
];

export const WladThinking = ({ de = true }) => {
  const phases = de ? PHASES_DE : PHASES_EN;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, phases.length - 1)), 2800);
    return () => clearInterval(t);
  }, [phases.length]);

  return (
    <div className="flex mb-4 items-start gap-2.5 animate-fade-in" data-testid="chat-typing-indicator">
      <WladBotAvatar size={28} live className="mt-1" />
      <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
        </span>
        <span
          key={idx}
          className="text-[12.5px] font-medium text-muted-foreground animate-fade-in wlad-thinking-shimmer"
        >
          {phases[idx]}
        </span>
      </div>
    </div>
  );
};

export default WladThinking;

import { useEffect, useRef, useState } from 'react';
import { WladBotAvatar } from '../brand/WladBotAvatar';

/**
 * WladGuide — WladBot personally walks the user through onboarding
 * (Iter 92.50, Fabulous-style). Live avatar + typewriter speech bubble.
 * The message reacts to previous answers → feels like a real coach.
 */
export const WladGuide = ({ message, size = 46 }) => {
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setTyped('');
    setDone(false);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) { setTyped(message); setDone(true); return; }
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 2;
      setTyped(message.slice(0, i));
      if (i >= message.length) {
        clearInterval(timerRef.current);
        setDone(true);
      }
    }, 18);
    return () => clearInterval(timerRef.current);
  }, [message]);

  return (
    <div className="flex items-start gap-3 max-w-lg mx-auto" data-testid="wlad-guide">
      <WladBotAvatar size={size} live />
      <div className="relative flex-1 mt-1.5">
        <div className="absolute -left-1.5 top-4 w-3 h-3 rotate-45 bg-white dark:bg-card border-l border-b border-black/[0.06] dark:border-white/[0.08]" />
        <div className="relative rounded-2xl rounded-tl-md bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.08] px-4 py-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#4A6200] dark:text-[#BFFF00] mb-1">WladBot 3.0</p>
          <p className="text-[13.5px] leading-relaxed text-foreground/90 min-h-[20px]" data-testid="wlad-guide-text">
            {typed}
            {!done && (
              <span
                className="inline-block w-[2px] h-[14px] bg-[#BFFF00] align-middle ml-0.5"
                style={{ animation: 'wladCaretBlink 0.8s step-end infinite' }}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

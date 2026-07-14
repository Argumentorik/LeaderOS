import { useEffect, useState } from 'react';
import { Mic, Send, Sparkles, Video, Check, Activity, Zap, TrendingUp } from 'lucide-react';

/**
 * ProductPreviewLoop — animated mini-UI mockup that cycles through 3 states
 * (Chat · Score · Video) to show "what's behind the login wall" without
 * requiring the user to sign up.
 *
 * Iter 92.44 (Mert · GODMODE): Stripe/Linear/Vercel signup-conversion pattern.
 * Each state holds ~4.5s, then fades into the next. 100% CSS animations,
 * no heavy libs.
 */
const STATE_DURATION = 4500;
const STATES = ['chat', 'score', 'video'];

const STATE_LABELS = {
  de: { chat: 'KI-Coach', score: 'Leader-Score', video: 'Video-Analyse' },
  en: { chat: 'AI Coach', score: 'Leader Score', video: 'Video Analysis' },
};

const ChatPreview = ({ de }) => (
  <div className="space-y-3 animate-fade-in">
    {/* User message */}
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-white/[0.08] px-3.5 py-2.5 border border-white/[0.06]">
        <p className="text-[11px] text-white/85 leading-snug">
          {de ? 'Wie überzeuge ich meinen CTO?' : 'How do I convince my CTO?'}
        </p>
      </div>
    </div>
    {/* WladBot reply with SEXIER framework callout */}
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-lg bg-[#BFFF00] flex items-center justify-center shrink-0 shadow-lg shadow-[#BFFF00]/30">
        <Sparkles size={13} className="text-[#0A0A0A]" />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] px-3.5 py-2.5 border border-white/[0.05]">
          <p className="text-[11px] text-white/75 leading-relaxed">
            {de
              ? 'Nutze SEXIER: Situation klar, Erwartung, Xcept-Frage…'
              : 'Use SEXIER: Situation clear, Expectation, Xcept-question…'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="px-1.5 py-0.5 rounded-md bg-[#BFFF00]/15 border border-[#BFFF00]/20">
              <span className="text-[9px] font-black tracking-wider uppercase text-[#BFFF00]">RAG · Wlad</span>
            </div>
            <span className="text-[9px] text-white/30 font-semibold">7 chunks</span>
          </div>
        </div>
        {/* Typing indicator for next msg */}
        <div className="flex gap-1 pl-3.5">
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '120ms' }} />
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
    </div>
  </div>
);

const ScorePreview = ({ de }) => {
  const [score, setScore] = useState(73);
  useEffect(() => {
    let raf;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(73 + eased * 19)); // 73 → 92
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const circ = 2 * Math.PI * 32;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex items-center gap-4 animate-fade-in">
      {/* Circular score */}
      <div className="relative">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
          <circle
            cx="40" cy="40" r="32"
            stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BFFF00" />
              <stop offset="100%" stopColor="#9ACC00" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{score}</span>
          <span className="text-[8px] uppercase tracking-widest font-bold text-white/40 mt-0.5">/ 100</span>
        </div>
      </div>
      {/* Metric pills */}
      <div className="flex-1 space-y-2">
        {[
          { icon: Activity, label: de ? 'Klarheit' : 'Clarity', val: 94 },
          { icon: Zap,      label: de ? 'Wirkung' : 'Impact',   val: 91 },
          { icon: TrendingUp, label: de ? 'Struktur' : 'Structure', val: 89 },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <m.icon size={11} className="text-[#BFFF00]/70 shrink-0" />
            <span className="text-[10.5px] font-semibold text-white/65 flex-1">{m.label}</span>
            <span className="text-[10.5px] font-black text-white/90">{m.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoPreview = ({ de }) => (
  <div className="space-y-2.5 animate-fade-in">
    {/* Video frame */}
    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 via-[#1A1A2E] to-black border border-white/[0.06]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=400&q=70')] bg-cover bg-center opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      {/* Recording badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/30 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-[8px] font-black tracking-widest text-rose-200">REC</span>
      </div>
      {/* Mic-level bars */}
      <div className="absolute bottom-2 left-2 right-2 flex items-end gap-0.5 h-5">
        {[3,5,8,4,9,6,7,5,8,4,6,9,5,7,4,8,5,3,6,4].map((h, i) => (
          <span
            key={`mic-bar-${i}`}
            className="flex-1 rounded-sm bg-[#BFFF00]/70"
            style={{ height: `${h * 11}%`, animation: 'micBar 0.9s ease-in-out infinite', animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
    {/* SEXIER analysis card */}
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-[#BFFF00] flex items-center justify-center">
            <Check size={9} className="text-[#0A0A0A]" strokeWidth={3.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-white/80">{de ? 'SEXIER-Analyse' : 'SEXIER Analysis'}</span>
        </div>
        <span className="text-[9px] font-bold text-white/35">2.4s</span>
      </div>
      <div className="flex gap-1">
        {['S','E','X','I','E','R'].map((letter, i) => (
          <div
            key={`sexier-${letter}-${i}`}
            className="flex-1 aspect-square rounded-md bg-[#BFFF00]/15 border border-[#BFFF00]/25 flex items-center justify-center text-[9px] font-black text-[#BFFF00]"
            style={{ animation: 'sexierPop 0.5s ease-out forwards', animationDelay: `${i * 80}ms`, opacity: 0 }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
    <style>{`
      @keyframes micBar { 0%,100% { transform: scaleY(0.6); } 50% { transform: scaleY(1.1); } }
      @keyframes sexierPop { from { opacity: 0; transform: translateY(6px) scale(0.9); } to { opacity: 1; transform: none; } }
    `}</style>
  </div>
);

const ICON_MAP = { chat: Send, score: Sparkles, video: Video };

export const ProductPreviewLoop = ({ de = true }) => {
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStateIdx((i) => (i + 1) % STATES.length), STATE_DURATION);
    return () => clearInterval(t);
  }, []);

  const currentState = STATES[stateIdx];
  const labels = STATE_LABELS[de ? 'de' : 'en'];

  return (
    <div
      className="mt-10 relative rounded-2xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-xl overflow-hidden"
      data-testid="product-preview-loop"
      style={{ boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      {/* Subtle lime glow at top */}
      <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-[#BFFF00]/[0.08] blur-2xl pointer-events-none" />

      {/* Header / tabs */}
      <div className="relative flex items-center gap-1 px-3.5 pt-3.5 pb-2 border-b border-white/[0.04]">
        {STATES.map((s) => {
          const Icon = ICON_MAP[s];
          const isActive = s === currentState;
          return (
            <button
              type="button"
              key={s}
              onClick={() => setStateIdx(STATES.indexOf(s))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-white/35 hover:text-white/60'
              }`}
              data-testid={`preview-tab-${s}`}
              aria-pressed={isActive}
            >
              <Icon size={10} />
              {labels[s]}
            </button>
          );
        })}
        {/* Live dot */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-300/80">LIVE</span>
        </div>
      </div>

      {/* Body — single state visible at once */}
      <div className="relative p-4 min-h-[180px]">
        {currentState === 'chat'  && <ChatPreview de={de} />}
        {currentState === 'score' && <ScorePreview de={de} />}
        {currentState === 'video' && <VideoPreview de={de} />}
      </div>

      {/* Footer microcaption */}
      <div className="px-4 pb-3 pt-1 flex items-center gap-2">
        <div className="flex-1 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
          <div
            key={stateIdx /* re-trigger anim on change */}
            className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9ACC00]"
            style={{ animation: `previewProgress ${STATE_DURATION}ms linear forwards` }}
          />
        </div>
        <span className="text-[8.5px] font-bold tracking-widest uppercase text-white/30">
          {stateIdx + 1}/{STATES.length}
        </span>
      </div>

      <style>{`
        @keyframes previewProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ProductPreviewLoop;

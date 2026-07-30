/**
 * StrategySkeleton — Premium loader that previews the SEXIER framework
 * WHILE the LLM is generating the strategy. Feels instant because the
 * user immediately sees the *structure* of the output, with subtle
 * shimmer animations on each section. No spinner, no dead-time.
 *
 * Sections mirror SEXIER: Statement · Evidence · eXample · Impact ·
 * Emotion · Rebuttal — Wlad's core argumentation framework.
 */
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

const SEXIER_SECTIONS = [
  { key: 'S', letter: 'S', title: 'Statement',  hint: 'Deine klare Position',        lines: 2 },
  { key: 'E', letter: 'E', title: 'Evidence',   hint: 'Belege & Zahlen',            lines: 3 },
  { key: 'X', letter: 'X', title: 'eXample',    hint: 'Konkretes Beispiel',         lines: 2 },
  { key: 'I', letter: 'I', title: 'Impact',     hint: 'Der Nutzen für den Gegenüber', lines: 2 },
  { key: 'E2', letter: 'E', title: 'Emotion',   hint: 'Der emotionale Anker',       lines: 2 },
  { key: 'R', letter: 'R', title: 'Rebuttal',   hint: 'Antwort auf Einwände',       lines: 3 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

export function StrategySkeleton() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
      data-testid="argumentation-strategy-skeleton"
    >
      {/* Header pill */}
      <motion.div variants={item} className="flex items-center justify-between p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 12, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </motion.div>
          <span className="text-[12px] font-black tracking-tight">Wlad schleift deine SEXIER-Strategie …</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground">
          <Zap size={10} className="text-[#BFFF00]" /> Live
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div variants={item} className="h-1 rounded-full bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#BFFF00] via-[#D4FF4D] to-[#BFFF00]"
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '35%', '68%', '82%', '92%'] }}
          transition={{ duration: 8, ease: [0.16, 1, 0.3, 1], times: [0, 0.15, 0.4, 0.7, 1] }}
          style={{ backgroundSize: '200% 100%' }}
        />
      </motion.div>

      {/* SEXIER sections */}
      <div className="space-y-2.5">
        {SEXIER_SECTIONS.map((s, i) => (
          <motion.div
            key={s.key}
            variants={item}
            className="relative p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] overflow-hidden"
          >
            {/* Shimmer overlay */}
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(191,255,0,0.14) 50%, transparent 70%)',
              }}
              animate={{ x: ['-120%', '120%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
            />

            <div className="relative flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 border border-[#BFFF00]/25 flex items-center justify-center shrink-0">
                <span className="text-[13px] font-black text-[#6B8A00] dark:text-[#BFFF00]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {s.letter}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-black tracking-tight">{s.title}</span>
                  <span className="text-[10px] text-muted-foreground/70">· {s.hint}</span>
                </div>
                {Array.from({ length: s.lines }).map((_, li) => (
                  <div
                    key={li}
                    className="h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.06] shimmer-line"
                    style={{ width: `${75 - li * 12 + (i % 2) * 8}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        variants={item}
        className="text-center text-[11px] text-muted-foreground/70 pt-1"
      >
        Wird auf deinen Kontext, Argumente und antizipierte Einwände zugeschnitten
      </motion.p>

      <style>{`
        .shimmer-line {
          background: linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(191,255,0,0.18) 50%, rgba(0,0,0,0.05) 100%);
          background-size: 200% 100%;
          animation: shimmerLine 1.6s linear infinite;
        }
        .dark .shimmer-line {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(191,255,0,0.18) 50%, rgba(255,255,255,0.05) 100%);
          background-size: 200% 100%;
        }
        @keyframes shimmerLine {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  );
}

export default StrategySkeleton;

/**
 * CoachingMemoryPanel — cross-session insight banner in the Prep-History
 * sheet. Turns raw history into a felt „the system knows me" moment:
 *
 *   „Du preparest häufig CFO-Situationen. Dein schwächster SEXIER-Block ist
 *    Emotion — nutze deine nächste Session gezielt dafür."
 *
 * Renders a compact 3-column stat row + a bold next-focus line so the user
 * sees the flywheel effect the moment they open History. Empty-safe:
 * shows a friendly „noch nicht genug Signal" state under 3 preps.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, ArrowRight, Sparkles, Shield } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

export function CoachingMemoryPanel({ onTagClick }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/simulations/coaching-memory');
        setData(res.data || null);
      } catch (err) {
        logger.warn('coaching-memory fetch', err);
        setData({ has_signal: false, total_preps: 0 });
      }
    })();
  }, []);

  if (!data) return null;

  const objections = data.recurring_objections || [];

  // Empty-state: too few preps for full stats — but if we already spotted a
  // recurring objection (2+ occurrences), surface it — that's actionable now.
  if (!data.has_signal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="mb-4 p-3.5 rounded-xl bg-gradient-to-br from-[#BFFF00]/5 to-transparent border border-black/[0.06] dark:border-white/[0.08]"
        data-testid="coaching-memory-empty"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/12 flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Coaching Memory</p>
            <p className="text-[12.5px] font-black tracking-tight mt-0.5">
              Wlad lernt gerade dein Muster
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {data.total_preps === 0
                ? 'Erstell deine erste SEXIER-Prep — ab der 3. Session zeigt Wlad dir wiederkehrende Themen und Schwächen.'
                : `Noch ${Math.max(0, 3 - data.total_preps)} Preps bis erste Muster sichtbar werden.`}
            </p>
          </div>
        </div>

        {objections.length > 0 && (
          <RecurringObjectionsSection
            objections={objections}
            variant="light"
            className="mt-3"
          />
        )}
      </motion.div>
    );
  }

  const trend = data.trend_30d || {};
  const delta = trend.delta_pct;
  const TrendIcon = delta === null ? null : (delta >= 0 ? TrendingUp : TrendingDown);
  const trendColor = delta === null ? 'text-muted-foreground' : (delta >= 0 ? 'text-emerald-500' : 'text-rose-500');
  const tagsTop = data.tags_top || [];
  const weak = (data.weak_sexier_dimensions || [])[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="mb-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0A0A0A] via-[#0A0A0A] to-[#1A2A0F] text-white p-4"
      data-testid="coaching-memory-panel"
    >
      {/* Ambient shine */}
      <motion.div
        aria-hidden
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(191,255,0,0.28) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 border border-[#BFFF00]/25 flex items-center justify-center">
            <Brain size={14} className="text-[#BFFF00]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-[#BFFF00]/80">
              Coaching Memory
            </p>
            <p className="text-[13px] font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Deine Muster · Wlad sieht mit
            </p>
          </div>
        </div>
        {TrendIcon && (
          <div className={`inline-flex items-center gap-1 text-[10px] font-black ${trendColor}`}>
            <TrendIcon size={12} strokeWidth={2.4} />
            {delta >= 0 ? '+' : ''}{delta}%
          </div>
        )}
      </div>

      {/* 3-column stat row */}
      <div className="relative mt-3.5 grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Preps gesamt</p>
          <p className="text-[18px] font-black leading-none mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{data.total_preps}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40">30 Tage</p>
          <p className="text-[18px] font-black leading-none mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{trend.last_30_days || 0}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Schwach: SEXIER</p>
          <p className="text-[12.5px] font-black leading-tight mt-1 text-[#BFFF00]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {weak?.dimension || '—'}
          </p>
        </div>
      </div>

      {/* Top-tags bar */}
      {tagsTop.length > 0 && (
        <div className="relative mt-3.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-1.5">Top-Themen</p>
          <div className="space-y-1.5">
            {tagsTop.slice(0, 3).map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onTagClick?.(t.label)}
                className="group w-full flex items-center gap-2 text-left"
                data-testid={`coaching-memory-tag-${t.label}`}
              >
                <span className="text-[11px] font-black w-16 shrink-0 truncate">{t.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#BFFF00] to-[#D4FF4D]"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.share_pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[10px] font-black tabular-nums text-white/60 group-hover:text-[#BFFF00] transition-colors w-9 text-right">
                  {t.count}×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next focus line — Wlad's coaching recommendation */}
      {data.next_focus && (
        <div className="relative mt-3.5 pt-3 border-t border-white/[0.06] flex items-start gap-2">
          <ArrowRight size={12} className="text-[#BFFF00] mt-0.5 shrink-0" strokeWidth={2.6} />
          <p className="text-[11.5px] text-white/85 leading-relaxed italic">
            {data.next_focus}
          </p>
        </div>
      )}

      {/* Recurring objections — surfaced only when 2+ preps share a formulation */}
      {objections.length > 0 && (
        <RecurringObjectionsSection objections={objections} variant="dark" className="relative mt-3.5" />
      )}
    </motion.div>
  );
}

// ── RecurringObjectionsSection ──────────────────────────────────────────────
// Highlights objection-lines the user has anticipated 2+ times across preps —
// these are the exact rebuttals Wlad recommends training in the next Voice-
// Sparring session. Rendered under both empty-state and full panel.
function RecurringObjectionsSection({ objections, variant = 'dark', className = '' }) {
  const isDark = variant === 'dark';
  return (
    <div
      className={`${className} pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06] dark:border-white/[0.06]'}`}
      data-testid="coaching-memory-recurring-objections"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Shield size={11} className={isDark ? 'text-[#FF9500]' : 'text-[#FF9500]'} strokeWidth={2.6} />
          <p className={`text-[9.5px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-white/50' : 'text-muted-foreground'}`}>
            Wiederkehrende Einwände
          </p>
        </div>
        <span className={`text-[9px] font-black ${isDark ? 'text-white/40' : 'text-muted-foreground/70'}`}>
          {objections.length} Muster
        </span>
      </div>
      <ul className="space-y-1">
        {objections.slice(0, 3).map((o, i) => (
          <motion.li
            key={o.text}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.28 }}
            className={`flex items-start gap-2 text-[11.5px] leading-snug ${isDark ? 'text-white/85' : 'text-foreground/85'}`}
          >
            <span
              className={`shrink-0 inline-flex items-center justify-center h-4 min-w-[22px] px-1 rounded text-[9px] font-black tabular-nums ${
                isDark ? 'bg-[#FF9500]/20 text-[#FF9500]' : 'bg-[#FF9500]/15 text-[#B45309]'
              }`}
            >
              {o.count}×
            </span>
            <span className="italic">&bdquo;{o.text}&ldquo;</span>
          </motion.li>
        ))}
      </ul>
      <p className={`text-[10px] mt-2 leading-relaxed ${isDark ? 'text-white/50' : 'text-muted-foreground/80'}`}>
        Trainier diese Einwände gezielt im nächsten Voice-Sparring — sie tauchen bei dir wiederholt auf.
      </p>
    </div>
  );
}

export default CoachingMemoryPanel;

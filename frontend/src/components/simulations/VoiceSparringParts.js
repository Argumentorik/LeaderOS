import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export const STATE_COPY = {
  picker:    { label: 'Wähle deinen Gegenüber', hint: 'Wlad passt seinen Ton in Echtzeit an' },
  idle:      { label: 'Bereit',                 hint: 'Tap Orb zum Starten' },
  listening: { label: 'Ich höre …',             hint: 'Sprich frei — ich schneide automatisch' },
  thinking:  { label: 'Sekunde …',              hint: 'Antwort wird geformt' },
  speaking:  { label: 'Antwort läuft',          hint: 'Fang einfach an zu sprechen — ich stoppe' },
  error:     { label: 'Verbindung weg',         hint: 'Tap um nochmal zu versuchen' },
};

export const DEFAULT_PERSONAS = [
  { key: 'cfo',      label: 'CFO / Finanz-Chef',  hint: 'Zahlen · ROI · kalt · misstrauisch' },
  { key: 'board',    label: 'Board / Vorstand',   hint: 'Strategisch · gemessen · staatsmännisch' },
  { key: 'customer', label: 'Verärgerter Kunde',  hint: 'Emotional · direkt · ungeduldig' },
  { key: 'boss',     label: 'Chef / Vorgesetzter', hint: 'Zeitknapp · pragmatisch · leicht skeptisch' },
  { key: 'team',     label: 'Team-Mitglied',      hint: 'Enttäuscht · verletzlich · sucht Warum' },
];


// ── Persona Picker ──────────────────────────────────────────────────────────
export function PersonaPicker({ personas, onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md text-center"
      data-testid="voice-sparring-picker"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/12 border border-[#BFFF00]/25 mb-4">
        <Sparkles size={11} className="text-[#BFFF00]" />
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">
          Wähle deinen Gegenüber
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Mit wem sparrst du?
      </h2>
      <p className="text-[12.5px] text-white/50 mt-2 leading-relaxed">
        Jede Rolle hat ihre eigene Stimme, Attitude und typische Einwände. Wlad passt sein Coaching auf dich an.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2.5">
        {personas.map((p, i) => (
          <motion.button
            key={p.key}
            type="button"
            onClick={() => onPick(p.key)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.28 }}
            className="group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#BFFF00]/50 hover:bg-[#BFFF00]/[0.06] transition-all active:scale-[0.98] text-left"
            data-testid={`sparring-persona-${p.key}`}
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-black leading-tight">{p.label}</div>
              <div className="text-[10.5px] text-white/45 mt-0.5">{p.hint}</div>
            </div>
            <ArrowRight size={14} className="text-white/25 group-hover:text-[#BFFF00] transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-white/25 mt-6 leading-relaxed">
        Du kannst nach dem Start zwischen Personas wechseln — beende einfach das Sparring und starte neu.
      </p>
    </motion.div>
  );
}

// ── Escalation Badge (subtle indicator that Wlad is escalating) ─────────────
const STAGE_META = {
  2: { label: 'Härter',  from: 'rgba(255,215,90,0.16)',  to: 'rgba(255,215,90,0.35)',  dot: '#FFD75A' },
  3: { label: 'Ruthless', from: 'rgba(255,138,90,0.16)', to: 'rgba(255,138,90,0.42)',  dot: '#FF8A5A' },
  4: { label: 'Boss-Mode', from: 'rgba(255,89,89,0.20)', to: 'rgba(255,89,89,0.55)',   dot: '#FF5959' },
};

export function EscalationBadge({ stage }) {
  const meta = STAGE_META[stage] || STAGE_META[2];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[10px] font-black uppercase tracking-[0.14em]"
      style={{
        background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)`,
        borderColor: meta.dot + '55',
        color: '#fff',
      }}
      data-testid={`escalation-badge-${stage}`}
      title={`Escalation Stufe ${stage} — Wlad wird härter, je länger du sparrst`}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      {meta.label}
    </motion.div>
  );
}

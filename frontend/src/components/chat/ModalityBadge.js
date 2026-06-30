import { Mic, Type, Video } from 'lucide-react';

/**
 * ModalityBadge — visual indicator showing which input modality the user
 * is currently using or has used for a given message.
 *
 * Iter 92.42 (Mert · Vibe-Security): "Lass uns klarstellen das wir immer
 * wissen ob gesprochen wird, oder text or video analyse."
 *
 * Modalities:
 *   - "text"   → 💬 keyboard input (default)
 *   - "speech" → 🎙 audio recording transcribed via Whisper
 *   - "video"  → 🎬 video clip transcribed + SEXIER-analyzed
 *
 * The label is opinionated (German, premium tone) to match the Apple/Tesla
 * aesthetic of the rest of the app.
 */
const CONFIG = {
  text:   { icon: Type,  label: 'Text',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', testid: 'modality-badge-text' },
  speech: { icon: Mic,   label: 'Speech', color: '#BFFF00', bg: 'rgba(191,255,0,0.15)',  testid: 'modality-badge-speech' },
  video:  { icon: Video, label: 'Video',  color: '#F472B6', bg: 'rgba(244,114,182,0.15)',testid: 'modality-badge-video' },
};

export const ModalityBadge = ({ modality = 'text', size = 'md', className = '' }) => {
  const cfg = CONFIG[modality] || CONFIG.text;
  const Icon = cfg.icon;
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'} tracking-[0.08em] uppercase ${className}`}
      style={{ background: cfg.bg, color: cfg.color }}
      title={`Eingabe-Modus: ${cfg.label}`}
      data-testid={cfg.testid}
    >
      <Icon size={sm ? 9 : 11} strokeWidth={2.4} />
      {cfg.label}
    </span>
  );
};

export default ModalityBadge;

import { Link } from 'react-router-dom';
import { ArrowRight, Activity, UserRound, Flame } from 'lucide-react';

const STEPS = {
  'start-1-willkommen': { to: '/leader-diagnose', icon: Activity, de: 'Leader-Diagnose starten', en: 'Start the Leader Diagnosis' },
  'start-3-kontext': { to: '/profile?edit=context', icon: UserRound, de: 'Kontext zu dir & deiner Rolle eintragen', en: 'Add context about you & your role' },
};
const MISSION_STEP = { to: '/challenge', icon: Flame, de: 'Zur 30-Tage-Challenge', en: 'Go to the 30-day challenge' };

export const nextStepFor = (clip) => (clip?.kind === 'mission' ? MISSION_STEP : STEPS[clip?.slug] || null);

/** „Nächster Schritt“ direkt unter dem Player – sichtbar auch während das Video läuft. */
export const GuideNextStep = ({ clip, de = true }) => {
  const step = nextStepFor(clip);
  if (!step) return null;
  const Icon = step.icon;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BFFF00]/30 bg-[#BFFF00]/[0.06] px-4 py-3" data-testid={`guide-next-step-${clip.slug}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Nächster Schritt' : 'Next step'}</p>
      <Link to={step.to} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0A0A0A] dark:bg-[#BFFF00] text-white dark:text-black text-[13px] font-bold hover:opacity-90 transition-opacity" data-testid="guide-next-step-btn">
        <Icon size={14} /> {de ? step.de : step.en} <ArrowRight size={14} />
      </Link>
    </div>
  );
};

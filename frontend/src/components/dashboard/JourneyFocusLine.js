import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import logger from '../../lib/logger';
import { swrGet } from '../../lib/swrCache';

const FOCUS_EN = { 'Boardroom-Rhetorik': 'Boardroom rhetoric', 'Strategisches EQ': 'Strategic EQ', 'KI-Kompetenz': 'AI competence' };

/** Eine Zeile „Dein Fokus“ aus der personalisierten Reise – für Challenge-/Missions-Seiten. */
export const JourneyFocusLine = ({ de = true, className = '' }) => {
  const [journey, setJourney] = useState(null);
  useEffect(() => { swrGet('/journey', setJourney, { onError: (e) => logger.warn('journey focus', e) }); }, []);
  if (!journey?.focus_label) return null;
  const label = de ? journey.focus_label : (FOCUS_EN[journey.focus_label] || journey.focus_label);
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/60 ${className}`} data-testid="journey-focus-line">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BFFF00]/10 text-[#BFFF00]"><Target size={10} /> {de ? 'Dein Fokus' : 'Your focus'}: {label}</span>
      <span>{journey.reason}</span>
    </p>
  );
};

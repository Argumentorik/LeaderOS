import { useEffect, useState } from 'react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from './GuideVideoPlayer';

/** Iter 145: Wlads Mission-Briefing für den aktiven Challenge-Tag (Tag 1-7). */
export const MissionGuideClip = ({ day, de = true }) => {
  const [clip, setClip] = useState(null);

  useEffect(() => {
    if (!day) return;
    api.get('/guide/clips', { params: { kind: 'mission' } })
      .then((res) => setClip((res.data?.clips || []).find((c) => c.ref === String(day) && c.video_url) || null))
      .catch((err) => logger.warn('mission clip failed', err));
  }, [day]);

  if (!clip) return null;
  return (
    <div className="mb-6 animate-fade-in" data-testid="mission-guide-clip">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a7a00] dark:text-[#BFFF00] mb-2">
        {de ? `Wlads Briefing · Tag ${day}` : `Wlad's briefing · Day ${day}`}
      </p>
      <GuideVideoPlayer clip={clip} de={de} compact />
    </div>
  );
};

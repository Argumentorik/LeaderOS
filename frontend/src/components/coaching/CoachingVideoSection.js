import { useEffect, useState } from 'react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from '../guide/GuideVideoPlayer';

/** Value-first Video von Wlad über Pakete, Prozess und Ergebnis (Kind `coaching`). Ohne Video: nichts. */
export const CoachingVideoSection = ({ de = true }) => {
  const [clip, setClip] = useState(null);

  useEffect(() => {
    api.get('/guide/clips', { params: { kind: 'coaching' } })
      .then((r) => setClip((r.data?.clips || []).find((c) => c.video_url) || null))
      .catch((e) => logger.warn('coaching clip failed', e));
  }, []);

  if (!clip) return null;
  return (
    <section className="animate-fade-in" data-testid="coaching-video-section">
      <div className="max-w-2xl mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Wlad erklärt' : 'Wlad explains'}</p>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{de ? 'Was du bekommst — und wie es wirkt' : 'What you get — and how it works'}</h2>
      </div>
      <div className="max-w-3xl">
        <GuideVideoPlayer clip={clip} de={de} />
      </div>
    </section>
  );
};

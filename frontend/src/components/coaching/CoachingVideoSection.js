import { useEffect, useState } from 'react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from '../guide/GuideVideoPlayer';

const FALLBACK_SLUGS = ['coaching-pakete', 'teaser-login', 'bp-playbooks'];

/**
 * Value-first Video über Pakete, Prozess und Ergebnis (Kind `coaching`).
 * Iter 180: Wenn der Coaching-Clip fehlt oder nicht freigegeben ist, greifen wir auf den
 * nächstbesten freigegebenen Clip zurück — vorher verschwand die Sektion still.
 */
export const CoachingVideoSection = ({ de = true }) => {
  const [clip, setClip] = useState(null);

  useEffect(() => {
    let alive = true;
    const playable = (c) => Boolean(c?.video_url || c?.vimeo_id);
    const load = async () => {
      try {
        const kinds = await Promise.all([
          api.get('/guide/clips', { params: { kind: 'coaching' } }),
          api.get('/guide/clips', { params: { kind: 'feature' } }),
          api.get('/guide/clips', { params: { kind: 'teaser' } }),
        ]);
        const all = kinds.flatMap((r) => r.data?.clips || []).filter(playable);
        const pick = FALLBACK_SLUGS.map((s) => all.find((c) => c.slug === s)).find(Boolean) || all[0] || null;
        if (alive) setClip(pick);
      } catch (e) {
        logger.warn('coaching clip failed', e);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  if (!clip) return null;
  return (
    <section className="animate-fade-in" data-testid="coaching-video-section">
      <div className="mb-5 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Wlad erklärt' : 'Wlad explains'}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{de ? 'Was du bekommst — und wie es wirkt' : 'What you get — and how it works'}</h2>
      </div>
      <div className="max-w-3xl">
        <GuideVideoPlayer clip={clip} de={de} />
      </div>
    </section>
  );
};

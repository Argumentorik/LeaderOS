import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from '../guide/GuideVideoPlayer';
import { VideoThumb } from '../shared/VideoThumb';

/**
 * Tages-Briefings (Tag 1–7) direkt in der 30-Tage-Challenge — dort, wo sie hingehören
 * (Iter 180, Nutzerwunsch: raus aus dem Video-Guide).
 */
export const ChallengeBriefings = ({ de = true, currentDay = 1 }) => {
  const [clips, setClips] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get('/guide/clips', { params: { kind: 'mission' } })
      .then((r) => setClips(r.data?.clips || []))
      .catch((e) => logger.warn('challenge briefings failed', e));
  }, []);

  const active = useMemo(
    () => clips.find((c) => c.slug === activeSlug) || null,
    [clips, activeSlug],
  );

  useEffect(() => {
    if (!active) { setDetail(null); return undefined; }
    let cancelled = false;
    api.get(`/guide/clips/${active.slug}`)
      .then((r) => { if (!cancelled) setDetail(r.data); })
      .catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [active]);

  if (!clips.length) return null;

  return (
    <section className="animate-fade-in" data-testid="challenge-briefings">
      <div className="mb-3 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">
          {de ? 'Briefings' : 'Briefings'}
        </p>
        <h2 className="mt-0.5 text-base font-bold md:text-lg">
          {de ? 'Wlads Tages-Briefings · Tag 1–7' : "Wlad's daily briefings · day 1–7"}
        </h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {de ? 'Ein Clip pro Tag: was heute dran ist und warum es wirkt.' : 'One clip per day: what is due today and why it works.'}
        </p>
      </div>

      {active && (
        <div className="mb-4 max-w-3xl" data-testid="challenge-briefing-player">
          <GuideVideoPlayer
            clip={detail?.slug === active.slug ? { ...active, ...detail } : { ...active, script: '' }}
            de={de}
            onSeen={(slug) => setClips((cs) => cs.map((c) => (c.slug === slug ? { ...c, seen: true } : c)))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {clips.map((c) => {
          const isToday = String(c.ref) === String(currentDay);
          return (
            <button
              key={c.slug} type="button" onClick={() => setActiveSlug(c.slug === activeSlug ? null : c.slug)}
              className={`group overflow-hidden rounded-xl border text-left transition-colors ${
                activeSlug === c.slug ? 'border-[#BFFF00]' : isToday
                  ? 'border-[#BFFF00]/50' : 'border-black/[0.07] hover:border-[#BFFF00]/60 dark:border-white/[0.08]'}`}
              data-testid={`challenge-briefing-tile-${c.ref}`}
            >
              <VideoThumb src={c.poster_url} title={c.title} kicker={`${de ? 'Tag' : 'Day'} ${c.ref}`}
                          duration={c.duration_seconds_video} seen={c.seen} />
              <div className="p-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]">
                  {de ? 'Tag' : 'Day'} {c.ref}{isToday && <span className="ml-1 text-muted-foreground">· {de ? 'heute' : 'today'}</span>}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] font-semibold leading-snug">{c.title}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ChallengeBriefings;

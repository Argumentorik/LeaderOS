import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from './GuideVideoPlayer';

/**
 * Iter 146: Wlads Mission-Briefing für den aktiven Challenge-Tag (Tag 1-7).
 * Beim ersten Aufruf öffnet sich der Clip automatisch (ohne Ton — Ton erst auf Klick),
 * danach bleibt ein kleines Play-Symbol im Kopf. „Nicht mehr automatisch zeigen" ist ein
 * Nutzer-Setting (guide_progress.mission_autoplay).
 */
export const MissionGuideClip = ({ day, de = true }) => {
  const [clip, setClip] = useState(null);
  const [autoplay, setAutoplay] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!day) return;
    api.get(`/guide/clips/mission/${day}`)
      .then((res) => {
        const c = res.data?.clip;
        const auto = res.data?.mission_autoplay !== false;
        setAutoplay(auto);
        if (c?.video_url) { setClip(c); if (auto && !c.seen) setOpen(true); } else setClip(null);
      })
      .catch((err) => logger.warn('mission clip failed', err));
  }, [day]);

  if (!clip) return null;

  const setPref = async (value) => {
    setAutoplay(value);
    try { await api.post('/guide/prefs', { mission_autoplay: value }); } catch (err) { logger.warn('guide prefs failed', err); }
  };
  const onSeen = () => setClip((c) => ({ ...c, seen: true }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mb-6 w-full flex items-center gap-3 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-card px-3 py-2.5 text-left hover:border-[#BFFF00]/60 transition-colors animate-fade-in"
        data-testid="mission-guide-clip"
      >
        <span className="h-9 w-9 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Play size={14} fill="currentColor" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a7a00] dark:text-[#BFFF00]">{de ? `Wlads Briefing · Tag ${day}` : `Wlad's briefing · Day ${day}`}</span>
          <span className="block text-[13px] font-semibold text-foreground truncate">{clip.title}{clip.duration_seconds_video ? ` · ${Math.round(clip.duration_seconds_video)} s` : ''}</span>
        </span>
        {clip.seen && <span className="text-[10px] font-semibold text-muted-foreground">{de ? 'gesehen' : 'watched'}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)} data-testid="mission-guide-modal">
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#BFFF00]">{de ? `Bevor du startest · Tag ${day}` : `Before you start · Day ${day}`}</p>
              <button type="button" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" aria-label={de ? 'Schließen' : 'Close'} data-testid="mission-guide-close"><X size={15} /></button>
            </div>
            <GuideVideoPlayer clip={clip} de={de} onSeen={onSeen} autoFocus />
            <label className="mt-3 flex items-center gap-2 text-[12px] text-white/70 cursor-pointer select-none">
              <input type="checkbox" checked={!autoplay} onChange={(e) => setPref(!e.target.checked)} className="accent-[#BFFF00]" data-testid="mission-guide-autoplay-toggle" />
              {de ? 'Briefings nicht mehr automatisch zeigen' : "Don't show briefings automatically"}
            </label>
          </div>
        </div>
      )}
    </>
  );
};

import { useEffect, useState } from 'react';
import { Play, Check, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from './GuideVideoPlayer';

const base = process.env.REACT_APP_BACKEND_URL;

/**
 * Iter 145: Wlads Guide auf dem Dashboard — die freigegebenen Onboarding-Clips
 * als Thumbnail-Reihe; ein Klick öffnet den Player darunter. Ohne freigegebene
 * Clips rendert die Komponente nichts.
 */
export const GuideClipsRow = ({ de = true }) => {
  const [clips, setClips] = useState([]);
  const [active, setActive] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api.get('/guide/clips', { params: { kind: 'onboarding' } })
      .then((res) => {
        const withVideo = (res.data?.clips || []).filter((c) => c.video_url);
        setClips(withVideo);
        setCollapsed(withVideo.length > 0 && withVideo.every((c) => c.seen));
      })
      .catch((err) => logger.warn('guide clips failed', err));
  }, []);

  if (!clips.length) return null;
  const seenCount = clips.filter((c) => c.seen).length;

  return (
    <section className="mb-8 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-card p-4" data-testid="guide-clips-row">
      <button type="button" onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 text-left" data-testid="guide-clips-toggle">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a7a00] dark:text-[#BFFF00]">{de ? 'Wlads Guide' : "Wlad's guide"}</p>
          <p className="text-sm font-bold text-foreground">{de ? 'So holst du in 5 Clips alles aus Leader-OS' : 'Get everything out of Leader-OS in 5 clips'}</p>
        </div>
        <span className="text-[11px] text-muted-foreground" data-testid="guide-clips-seen">{seenCount}/{clips.length}</span>
        {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
      </button>

      {!collapsed && (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {clips.map((c, i) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActive(active?.slug === c.slug ? null : c)}
                className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-300 hover:-translate-y-0.5 ${active?.slug === c.slug ? 'border-[#BFFF00] shadow-[0_0_0_3px_rgba(191,255,0,0.25)]' : 'border-black/[0.07] dark:border-white/[0.08]'}`}
                data-testid={`guide-clip-thumb-${c.slug}`}
              >
                <div className="aspect-video bg-black relative">
                  {c.poster_url && <img src={`${base}${c.poster_url}`} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-9 w-9 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Play size={14} fill="currentColor" /></span>
                  </span>
                  {c.seen && <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/70 text-[#BFFF00] flex items-center justify-center"><Check size={11} /></span>}
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">{i + 1} · {c.duration_seconds_video ? `${Math.round(c.duration_seconds_video)} s` : ''}</p>
                  <p className="text-[11.5px] font-semibold text-foreground leading-tight line-clamp-2">{c.title}</p>
                </div>
              </button>
            ))}
          </div>
          {active && (
            <div className="mt-4 max-w-3xl" data-testid="guide-clips-player">
              <GuideVideoPlayer clip={active} de={de} autoFocus onSeen={(slug) => setClips((cs) => cs.map((c) => (c.slug === slug ? { ...c, seen: true } : c)))} />
            </div>
          )}
        </>
      )}
    </section>
  );
};

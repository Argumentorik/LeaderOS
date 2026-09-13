import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Check, Clapperboard, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { GuideVideoPlayer } from '../components/guide/GuideVideoPlayer';
import { GuideNextStep } from '../components/guide/GuideNextStep';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { VideoThumb } from '../components/shared/VideoThumb';

const CACHE_KEY = 'wladbot_guide_clips_v2';

const fmt = (sec) => { const n = Math.round(sec || 0); return n >= 60 ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}` : `${n} s`; };

const ClipTile = ({ clip, index, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(clip)}
    className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${active ? 'border-[#BFFF00] shadow-[0_0_0_3px_rgba(191,255,0,0.25)]' : 'border-black/[0.07] dark:border-white/[0.08]'} bg-white dark:bg-card`}
    data-testid={`video-guide-tile-${clip.slug}`}
  >
    <div className="relative aspect-video bg-[#0A0A0A] overflow-hidden">
      <VideoThumb src={clip.poster_url} title={clip.title} kicker={clip.kind === 'mission' ? 'Mission' : 'Leader-OS'} showPlay={false} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-10 w-10 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-lg opacity-90 group-hover:scale-110 transition-transform"><Play size={15} fill="currentColor" /></span>
      </span>
      {clip.seen && <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 text-[#BFFF00] flex items-center justify-center" data-testid={`video-guide-seen-${clip.slug}`}><Check size={12} /></span>}
      <span className="absolute top-2 left-2 text-[9.5px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-black/60 text-white">{index}</span>
      {clip.duration_seconds_video && <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white" data-testid={`video-guide-duration-${clip.slug}`}>{fmt(clip.duration_seconds_video)}</span>}
    </div>
    <div className="p-3">
      <p className="text-[13px] font-semibold text-foreground leading-tight">{clip.title}</p>
    </div>
  </button>
);

const TileSkeleton = () => (
  <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card animate-pulse" data-testid="video-guide-skeleton">
    <div className="aspect-video bg-black/[0.06] dark:bg-white/[0.06]" />
    <div className="p-3 space-y-2"><div className="h-3 w-3/4 rounded bg-black/[0.08] dark:bg-white/[0.08]" /><div className="h-3 w-1/2 rounded bg-black/[0.06] dark:bg-white/[0.06]" /></div>
  </div>
);

export default function VideoGuidePage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [params, setParams] = useSearchParams();
  const [clips, setClips] = useState(() => { try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null') || []; } catch { return []; } });
  const [loaded, setLoaded] = useState(clips.length > 0);
  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);

  // Iter 166 Tempo: schlanke Liste (Titel, Dauer, Bild, gesehen), Wiederbesuch aus dem Zwischenspeicher, Skript erst für den aktiven Clip.
  useEffect(() => {
    api.get('/guide/clips', { params: { kind: 'all', lean: 1 } })
      .then((res) => {
        const list = (res.data?.clips || []).filter((c) => c.video_url && c.kind !== 'teaser');
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) { logger.warn('guide cache write skipped', e); }
        setClips(list);
        setLoaded(true);
      })
      .catch((err) => { logger.warn('video guide failed', err); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (!clips.length || active) return;
    const wanted = params.get('clip');
    setActive(clips.find((c) => c.slug === wanted) || clips.find((c) => !c.seen) || clips[0] || null);
  }, [clips, active, params]);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    api.get(`/guide/clips/${active.slug}`).then((r) => { if (!cancelled) setDetail(r.data); }).catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [active]);

  const onboarding = useMemo(() => clips.filter((c) => c.kind === 'onboarding'), [clips]);
  const missions = useMemo(() => clips.filter((c) => c.kind === 'mission'), [clips]);
  const seen = clips.filter((c) => c.seen).length;

  const select = (clip) => {
    setActive(clip);
    setParams({ clip: clip.slug }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const markSeen = (slug) => setClips((cs) => cs.map((c) => (c.slug === slug ? { ...c, seen: true } : c)));

  return (
    <DashboardLayout>
    <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen" data-testid="video-guide-page">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5a7a00] dark:text-[#BFFF00] flex items-center gap-1.5"><Clapperboard size={12} />{de ? 'Video-Guide' : 'Video guide'}</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{de ? 'Wlad erklärt dir Leader-OS' : 'Wlad explains Leader-OS'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{de ? 'Kurze Clips: wie du mit der KI arbeitest und was jede Mission von dir will.' : 'Short clips: how to work with the AI and what each mission asks of you.'}</p>
        </div>
        <div className="text-right" data-testid="video-guide-progress">
          <p className="text-2xl font-black text-foreground">{seen}<span className="text-muted-foreground text-base font-semibold">/{clips.length}</span></p>
          <p className="text-[11px] text-muted-foreground">{de ? 'gesehen' : 'watched'}</p>
        </div>
      </div>

      {active && (
        <div className="mb-10 max-w-4xl" data-testid="video-guide-player">
          <GuideVideoPlayer clip={detail?.slug === active.slug ? { ...active, ...detail } : { ...active, script: '' }} de={de} onSeen={markSeen} />
          <GuideNextStep clip={active} de={de} />
        </div>
      )}

      {!loaded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="video-guide-loading">{[0, 1, 2, 3, 4].map((i) => <TileSkeleton key={i} />)}</div>
      )}
      {loaded && !clips.length && <p className="text-sm text-muted-foreground" data-testid="video-guide-empty">{de ? 'Noch keine Clips freigegeben.' : 'No clips published yet.'}</p>}

      {onboarding.length > 0 && (
        <section className="mb-10" data-testid="video-guide-onboarding">
          <h2 className="text-base md:text-lg font-bold mb-3">{de ? 'Erststart-Serie' : 'Getting started'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {onboarding.map((c, i) => <ClipTile key={c.slug} clip={c} index={`${de ? 'Clip' : 'Clip'} ${i + 1}`} active={active?.slug === c.slug} onSelect={select} />)}
          </div>
        </section>
      )}

      {missions.length > 0 && (
        <section data-testid="video-guide-missions">
          <Link to="/challenge" className="group inline-flex items-center gap-2 mb-3 text-base md:text-lg font-bold hover:text-[#5a7a00] dark:hover:text-[#BFFF00] transition-colors" data-testid="video-guide-missions-title">
            {de ? '30-Tage-Challenge · Briefings Tag 1–7' : '30-day challenge · Briefings day 1–7'}
            <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {missions.map((c) => <ClipTile key={c.slug} clip={c} index={`${de ? 'Tag' : 'Day'} ${c.ref}`} active={active?.slug === c.slug} onSelect={select} />)}
          </div>
        </section>
      )}
    </div>
    </DashboardLayout>
  );
}

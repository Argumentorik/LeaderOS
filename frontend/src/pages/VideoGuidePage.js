import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Check, Clapperboard } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { GuideVideoPlayer } from '../components/guide/GuideVideoPlayer';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const base = process.env.REACT_APP_BACKEND_URL;

const ClipTile = ({ clip, index, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(clip)}
    className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 ${active ? 'border-[#BFFF00] shadow-[0_0_0_3px_rgba(191,255,0,0.25)]' : 'border-black/[0.07] dark:border-white/[0.08]'} bg-white dark:bg-card`}
    data-testid={`video-guide-tile-${clip.slug}`}
  >
    <div className="relative aspect-video bg-black">
      {clip.poster_url && <img src={`${base}${clip.poster_url}`} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-10 w-10 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Play size={15} fill="currentColor" /></span>
      </span>
      {clip.seen && <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 text-[#BFFF00] flex items-center justify-center" data-testid={`video-guide-seen-${clip.slug}`}><Check size={12} /></span>}
      {clip.duration_seconds_video && <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">{Math.round(clip.duration_seconds_video)} s</span>}
    </div>
    <div className="p-3">
      <p className="text-[10px] text-muted-foreground">{index}</p>
      <p className="text-[13px] font-semibold text-foreground leading-tight">{clip.title}</p>
    </div>
  </button>
);

export default function VideoGuidePage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [params, setParams] = useSearchParams();
  const [clips, setClips] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get('/guide/clips', { params: { kind: 'all' } })
      .then((res) => {
        const list = (res.data?.clips || []).filter((c) => c.video_url && c.kind !== 'teaser');
        setClips(list);
        const wanted = params.get('clip');
        setActive(list.find((c) => c.slug === wanted) || list.find((c) => !c.seen) || list[0] || null);
      })
      .catch((err) => logger.warn('video guide failed', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <GuideVideoPlayer clip={active} de={de} onSeen={markSeen} />
        </div>
      )}

      {!clips.length && <p className="text-sm text-muted-foreground" data-testid="video-guide-empty">{de ? 'Noch keine Clips freigegeben.' : 'No clips published yet.'}</p>}

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
          <h2 className="text-base md:text-lg font-bold mb-3">{de ? 'Mission-Briefings · 30-Tage Challenge' : 'Mission briefings · 30-day challenge'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {missions.map((c) => <ClipTile key={c.slug} clip={c} index={`${de ? 'Tag' : 'Day'} ${c.ref}`} active={active?.slug === c.slug} onSelect={select} />)}
          </div>
        </section>
      )}
    </div>
    </DashboardLayout>
  );
}

/**
 * FreeVideosMembersPage · /free-videos — the free video series inside the app.
 *
 * Registered users get the same 4-video series ("Führung beginnt hier") as a
 * gated in-app player: all videos unlocked, deep-linkable (?v=fv2 — used by
 * the registered-user drip emails), with a conversion CTA at the bottom.
 * The PUBLIC funnel page lives at /fuehrung-beginnt-hier (FreeVideosPage).
 *
 * Data: shared config in data/freeVideos.js (one source of truth).
 * Design: Athletic-Editorial DNA (DESIGN.md).
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PlayCircle, Lock, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { FREE_VIDEOS, embedSrc, isVideoReady } from '../data/freeVideos';

export default function FreeVideosMembersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const readyVideos = useMemo(() => FREE_VIDEOS.filter(isVideoReady), []);
  const firstReady = readyVideos[0] || FREE_VIDEOS[0];

  const requested = params.get('v');
  const initial =
    (requested && FREE_VIDEOS.find((v) => v.id === requested && isVideoReady(v))) ||
    firstReady;
  const [activeId, setActiveId] = useState(initial?.id);

  const active = FREE_VIDEOS.find((v) => v.id === activeId) || firstReady;
  const embedUrl = embedSrc(active);

  useEffect(() => {
    document.title = 'Führung beginnt hier · 4 Videos · LeaderOS';
  }, []);

  const select = (video) => {
    if (!isVideoReady(video)) return;
    setActiveId(video.id);
    setParams({ v: video.id }, { replace: true });
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.capture('free_video_played', { video_id: video.id, day: video.day, surface: 'app' });
      } catch { /* posthog never blocks UX */ }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl" data-testid="free-videos-page">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 font-mono">
            <PlayCircle size={14} className="text-[#BFFF00]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              ▸ FÜHRUNG BEGINNT HIER · 4 VIDEOS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Deine <span className="text-[#BFFF00]">4 kostenlosen</span> Videos
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl flex items-center gap-2">
            <Sparkles size={14} className="text-[#BFFF00] shrink-0" />
            Alle Videos sind sofort freigeschaltet. Jeden Tag erinnern wir dich per Mail an das nächste.
          </p>
        </div>

        {/* Player */}
        <div className="border-2 border-foreground bg-black shadow-[8px_8px_0_0_#BFFF00] overflow-hidden">
          <div className="relative w-full aspect-video bg-black">
            {embedUrl ? (
              <iframe
                key={active?.id}
                src={embedUrl}
                title={active?.title}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                data-testid="free-video-player"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-2">
                <Lock size={28} className="text-[#BFFF00]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">In Kürze verfügbar</span>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t-2 border-foreground/10">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#BFFF00] font-bold">
              ▸ TAG {active?.day} / {FREE_VIDEOS.length} · {active?.duration}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">{active?.title}</h2>
            {active?.hook && <p className="text-sm text-white/70 mt-2 leading-relaxed">{active.hook}</p>}
          </div>
        </div>

        {/* Playlist */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {FREE_VIDEOS.map((video) => {
            const ready = isVideoReady(video);
            const isActive = video.id === active?.id;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => select(video)}
                disabled={!ready}
                data-testid={`free-video-card-${video.id}`}
                className={`group text-left flex items-center gap-3 p-3 border-2 transition-all ${
                  isActive
                    ? 'border-foreground bg-[#BFFF00]/[0.08] shadow-[4px_4px_0_0_#BFFF00]'
                    : ready
                    ? 'border-foreground/15 hover:border-foreground hover:bg-foreground/[0.03]'
                    : 'border-foreground/10 opacity-55 cursor-not-allowed'
                }`}
              >
                <div
                  className={`shrink-0 w-11 h-11 flex items-center justify-center border-2 ${
                    isActive ? 'border-[#BFFF00] bg-[#BFFF00] text-black' : 'border-foreground/20 text-foreground/70'
                  }`}
                >
                  {ready ? <PlayCircle size={20} /> : <Lock size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                    TAG {video.day} · {ready ? video.duration : 'IN KÜRZE'}
                  </div>
                  <div className="text-sm font-bold text-foreground truncate">{video.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Conversion CTA */}
        <div className="mt-8 border-2 border-foreground bg-foreground text-background p-6 sm:p-8 shadow-[8px_8px_0_0_#BFFF00]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#BFFF00] font-bold mb-2">
            ▸ DEIN NÄCHSTER SCHRITT
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.05]">
            Bereit, das ganze System zu nutzen?
          </h3>
          <p className="text-sm sm:text-base text-background/70 mt-3 max-w-xl">
            Die Videos sind der Anfang. LeaderOS gibt dir WladBot 24/7, 11 Frameworks und deinen
            persönlichen Lernpfad — 14 Tage kostenlos.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 h-12 bg-[#BFFF00] text-black border-2 border-[#BFFF00] text-[12.5px] font-black uppercase tracking-[0.08em] hover:brightness-105 active:scale-[0.985] transition-all"
              data-testid="free-videos-to-dashboard"
            >
              <span className="w-6 h-6 rounded-full bg-black text-[#BFFF00] flex items-center justify-center text-base leading-none">+</span>
              Zum Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-path')}
              className="inline-flex items-center gap-2 px-6 h-12 bg-transparent text-background border-2 border-background/30 text-[12.5px] font-black uppercase tracking-[0.08em] hover:border-background transition-all"
            >
              Lernpfad ansehen
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

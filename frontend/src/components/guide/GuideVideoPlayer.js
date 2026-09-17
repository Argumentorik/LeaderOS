import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { InteractiveWladButton } from './InteractiveWladButton';
import { Play, FileText, ChevronDown, ChevronUp, Check, MessageCircle } from 'lucide-react';
import api from '../../lib/api';
import { useManagedMedia } from '../../hooks/useManagedMedia';
import logger from '../../lib/logger';

/**
 * Iter 142: Ein Guide-Clip. Kein Autoplay mit Ton, Untertitel/Skript immer
 * erreichbar, und wenn kein Video existiert (oder es nicht lädt), tritt
 * automatisch der Text an seine Stelle — es entsteht nie ein Loch.
 */
export const GuideVideoPlayer = ({ clip, de = true, onSeen, autoFocus = false, compact = false }) => {
  const [started, setStarted] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [videoBroken, setVideoBroken] = useState(false);
  const videoRef = useRef(null);
  const seenSentRef = useRef(false);
  // Iter 185: Ton stoppt beim Wegklicken, Sprach-Modus oder Seitenwechsel.
  useManagedMedia(videoRef, clip?.slug);

  useEffect(() => { setStarted(false); setVideoBroken(false); seenSentRef.current = false; }, [clip?.slug]);

  if (!clip) return null;

  const hasVideo = (Boolean(clip.video_url) || Boolean(clip.vimeo_id)) && !videoBroken;
  const isVimeo = clip.video_kind === 'vimeo' && Boolean(clip.vimeo_id);

  const markSeen = async () => {
    if (seenSentRef.current) return;
    seenSentRef.current = true;
    try { await api.post(`/guide/clips/${clip.slug}/seen`); onSeen?.(clip.slug); }
    catch (err) { logger.warn('guide seen failed', err); }
  };

  const start = () => {
    setStarted(true);
    const el = videoRef.current;
    if (el) { el.muted = false; el.play().catch(() => setVideoBroken(true)); }
  };

  return (
    <div className={`rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-card overflow-hidden ${compact ? '' : 'shadow-sm'}`}
         data-testid={`guide-clip-${clip.slug}`}>
      {hasVideo ? (
        isVimeo ? (
          <div className="bg-black aspect-video" data-testid={`guide-vimeo-${clip.slug}`}>
            <iframe
              src={`https://player.vimeo.com/video/${clip.vimeo_id}?badge=0&autopause=0&dnt=1&title=0&byline=0&portrait=0`}
              title={clip.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
              onLoad={markSeen}
            />
          </div>
        ) : (
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            src={`${process.env.REACT_APP_BACKEND_URL}${clip.video_url}`}
            poster={clip.poster_url ? `${process.env.REACT_APP_BACKEND_URL}${clip.poster_url}` : undefined}
            className="w-full h-full object-contain"
            playsInline
            controls={started}
            preload="metadata"
            onEnded={markSeen}
            onTimeUpdate={(e) => { if (e.currentTarget.currentTime > 5) markSeen(); }}
            onError={() => setVideoBroken(true)}
            data-testid={`guide-video-${clip.slug}`}
          />
          <button
            type="button"
            onClick={start}
            autoFocus={autoFocus}
            aria-hidden={started}
            tabIndex={started ? -1 : 0}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 transition-[opacity,background-color] duration-500 group ${
              started ? 'pointer-events-none opacity-0' : 'opacity-100 hover:bg-black/35'}`}
            data-testid={`guide-play-${clip.slug}`}
          >
            <span className="w-16 h-16 rounded-full bg-[#BFFF00] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Play size={26} className="text-black ml-1" fill="currentColor" />
            </span>
            <span className="text-[11px] font-bold text-white/90 tracking-wide">
              {de ? 'Mit Ton starten' : 'Play with sound'}
              {clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ''}
            </span>
          </button>
        </div>
        )
      ) : (
        <div className="px-5 pt-5" data-testid={`guide-text-fallback-${clip.slug}`}>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            <FileText size={11} /> {de ? 'Zum Lesen' : 'Read it'}
          </p>
          <p className="text-[13.5px] leading-relaxed select-text">{clip.script}</p>
        </div>
      )}

      <div className="px-5 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-black leading-snug">{clip.title}</p>
          {clip.seen && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0"
                  data-testid={`guide-seen-${clip.slug}`}>
              <Check size={11} /> {de ? 'gesehen' : 'seen'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {hasVideo && <button
                type="button"
                onClick={() => setScriptOpen(v => !v)}
                aria-expanded={scriptOpen}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4A6200] dark:text-[#BFFF00]"
                data-testid={`guide-script-toggle-${clip.slug}`}
              >
                {scriptOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {de ? 'Text mitlesen (20 Sekunden)' : 'Read the text instead'}
              </button>}
              <Link
                to={`/chat?prefill=${encodeURIComponent(de
                  ? `Ich habe gerade dein Video „${clip.title}“ gesehen. Erklär mir bitte kurz, wie ich das konkret in meinem Alltag umsetze — und stell mir eine Rückfrage zu meiner Situation.`
                  : `I just watched your video "${clip.title}". Explain briefly how I apply this in my day-to-day and ask me one question about my situation.`)}`}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-foreground/70 hover:text-foreground transition-colors"
                data-testid={`guide-ask-wlad-${clip.slug}`}
              >
                <MessageCircle size={12} /> {de ? 'Frag WladBot dazu' : 'Ask WladBot about this'}
              </Link>
              <InteractiveWladButton clip={clip} de={de} />
        </div>
        {hasVideo && scriptOpen && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap select-text pt-1"
                 data-testid={`guide-script-${clip.slug}`}>
                {clip.script}
              </p>
        )}
      </div>
    </div>
  );
};

export default GuideVideoPlayer;

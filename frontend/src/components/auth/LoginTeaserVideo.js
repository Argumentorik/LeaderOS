import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX, X, Maximize2, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const BASE = process.env.REACT_APP_BACKEND_URL;
const LEADERCHECK_URL = 'https://leadercheck.de';
const CARD_SECONDS = 4.5;  // Verabschiedungs-Karte am Ende -> CTAs einblenden

let cachedClip;
const fetchClip = () => (cachedClip ??= api.get('/guide/public/teaser').then((r) => r.data?.clip?.video_url ? r.data.clip : null).catch((e) => { logger.warn('teaser fetch failed', e); return null; }));

/* End-CTAs, sobald die Abschluss-Karte läuft */
const EndActions = ({ de, onStart }) => (
  <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-4 bg-gradient-to-t from-black/80 to-transparent" data-testid="login-teaser-end-actions">
    <a href={LEADERCHECK_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
       className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-black text-[12px] font-bold hover:bg-white/90" data-testid="login-teaser-cta-leadercheck">
      <ExternalLink size={13} />{de ? 'Leader-Check auf leadercheck.de' : 'Leader-Check on leadercheck.de'}
    </a>
    <button type="button" onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="inline-flex items-center h-9 px-4 rounded-full bg-[#BFFF00] text-black text-[12px] font-bold hover:bg-[#d4ff4d]" data-testid="login-teaser-cta-start">
      {de ? 'Kostenlos starten' : 'Start for free'}
    </button>
  </div>
);

/* Vollbild-Lightbox: Ton an, große Untertitel (eingebrannt), Escape/X schließt */
const Lightbox = ({ clip, de, onClose, onStart }) => {
  const ref = useRef(null);
  const [ending, setEnding] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-10" onClick={onClose} role="dialog" aria-modal="true" data-testid="login-teaser-lightbox">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label={de ? 'Schließen' : 'Close'} data-testid="login-teaser-lightbox-close"><X size={18} /></button>
      <div className="relative w-full max-w-[1280px] aspect-video rounded-2xl overflow-hidden shadow-[0_40px_120px_-30px_rgba(191,255,0,0.35)]" onClick={(e) => e.stopPropagation()}>
        <video ref={ref} src={`${BASE}${clip.video_url}`} autoPlay controls playsInline className="w-full h-full bg-black"
               onTimeUpdate={(e) => { const v = e.currentTarget; setEnding(v.duration > 0 && v.duration - v.currentTime <= CARD_SECONDS + 0.8); }}
               onEnded={() => setEnding(true)} data-testid="login-teaser-lightbox-video" />
        {ending && <EndActions de={de} onStart={() => { onClose(); onStart(); }} />}
      </div>
    </div>
  );
};

export const LoginTeaserVideo = ({ de = true, onAvailable, onStartRegister, compact = false }) => {
  const [clip, setClip] = useState(null);
  const [muted, setMuted] = useState(true);
  const [entered, setEntered] = useState(false);
  const [open, setOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchClip().then((c) => { if (alive && c) { setClip(c); onAvailable?.(true); setTimeout(() => setEntered(true), 60); } });
    return () => { alive = false; };
  }, [onAvailable]);

  const startRegister = useCallback(() => {
    onStartRegister?.();
    document.getElementById('login-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [onStartRegister]);

  if (!clip) return null;

  const openLightbox = () => { videoRef.current?.pause(); setOpen(true); };
  const closeLightbox = () => { setOpen(false); const v = videoRef.current; if (v) { v.muted = true; setMuted(true); v.play().catch(() => {}); } };
  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current; if (!v) return;
    if (muted) { v.muted = false; v.currentTime = 0; setMuted(false); v.play().catch(() => {}); }
    else { v.muted = true; setMuted(true); }
  };
  const minutes = `${Math.max(1, Math.round((clip.duration_seconds_video || 60) / 60))} Min`;

  return (
    <>
      <div className={`${compact ? 'w-full' : 'w-full max-w-[560px]'} transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${entered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} data-testid={compact ? "login-teaser-compact" : "login-teaser"}>
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.1] bg-black shadow-[0_28px_70px_-22px_rgba(191,255,0,0.4)] cursor-pointer group" onClick={openLightbox} data-testid="login-teaser-frame">
          <video ref={videoRef} src={`${BASE}${clip.video_url}`} poster={clip.poster_url ? `${BASE}${clip.poster_url}` : undefined}
                 autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover"
                 onTimeUpdate={(e) => { const v = e.currentTarget; setEnding(v.duration > 0 && v.duration - v.currentTime <= CARD_SECONDS + 0.8); }}
                 data-testid="login-teaser-video" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
          {!ending && (
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3">
              <span className="h-11 w-11 shrink-0 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-[0_0_0_6px_rgba(191,255,0,0.18)] group-hover:scale-105 transition-transform"><Play size={18} className="ml-0.5" fill="currentColor" /></span>
              <div className="min-w-0">
                <p className="text-white font-bold text-[13px] leading-tight" data-testid="login-teaser-title">{de ? `Warum Leader-OS – ${minutes}, mit Ton` : `Why Leader-OS – ${minutes}, with sound`}</p>
                <p className="text-white/60 text-[11px] leading-snug" data-testid="login-teaser-copy">{de ? 'Wlad persönlich · Klick für Vollbild' : 'Wlad in person · click for fullscreen'}</p>
              </div>
              <Maximize2 size={16} className="ml-auto text-white/70 shrink-0" />
            </div>
          )}
          {ending && <EndActions de={de} onStart={startRegister} />}
          <button type="button" onClick={toggleMute} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/80"
                  aria-label={muted ? (de ? 'Ton an' : 'Unmute') : (de ? 'Ton aus' : 'Mute')} data-testid="login-teaser-sound">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
      {open && <Lightbox clip={clip} de={de} onClose={closeLightbox} onStart={startRegister} />}
    </>
  );
};

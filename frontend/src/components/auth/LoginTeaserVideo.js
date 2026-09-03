import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

/**
 * Iter 144: Der freigegebene Wlad-Teaser läuft stumm in der Login-Hero-Spalte.
 * Klick auf das Lautsprecher-Icon schaltet den Ton ein. Ohne freigegebenen Teaser
 * rendert die Komponente nichts (der Aufrufer zeigt dann seinen Fallback).
 */
export const LoginTeaserVideo = ({ de = true, onAvailable }) => {
  const [clip, setClip] = useState(null);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get('/guide/public/teaser')
      .then((res) => { if (alive && res.data?.clip?.video_url) { setClip(res.data.clip); onAvailable?.(true); } })
      .catch((err) => logger.warn('teaser fetch failed', err));
    return () => { alive = false; };
  }, [onAvailable]);

  if (!clip) return null;

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    if (!el.muted) { el.currentTime = 0; el.play().catch(() => {}); }
  };

  return (
    <div className="flex items-end gap-5" data-testid="login-teaser">
      <div className="relative w-[196px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/[0.1] shadow-[0_24px_60px_-20px_rgba(191,255,0,0.35)] bg-black shrink-0">
        <video
          ref={videoRef}
          src={`${process.env.REACT_APP_BACKEND_URL}${clip.video_url}`}
          poster={clip.poster_url ? `${process.env.REACT_APP_BACKEND_URL}${clip.poster_url}` : undefined}
          autoPlay muted loop playsInline preload="auto"
          className="w-full h-full object-cover"
          data-testid="login-teaser-video"
        />
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label={muted ? (de ? 'Ton an' : 'Unmute') : (de ? 'Ton aus' : 'Mute')}
          data-testid="login-teaser-sound"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
      <div className="pb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#BFFF00]/80 font-bold">{de ? 'Dein Coach' : 'Your coach'}</p>
        <p className="text-[15px] font-semibold text-white/90 mt-1 leading-snug">{clip.title}</p>
        <p className="text-[11.5px] text-white/40 mt-1.5 leading-relaxed max-w-[220px]">
          {de ? 'Wlad begleitet dich in der App — im Chat, in Simulationen und in deinen Video-Missionen.' : 'Wlad guides you inside the app — in chat, simulations and your video missions.'}
        </p>
        <button type="button" onClick={toggleSound} className="mt-3 text-[11px] font-semibold text-[#BFFF00] hover:underline underline-offset-2" data-testid="login-teaser-sound-text">
          {muted ? (de ? 'Mit Ton abspielen' : 'Play with sound') : (de ? 'Ton aus' : 'Mute')}
        </button>
      </div>
    </div>
  );
};

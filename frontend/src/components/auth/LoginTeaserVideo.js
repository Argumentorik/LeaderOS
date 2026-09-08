import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const BASE = process.env.REACT_APP_BACKEND_URL;

/**
 * Iter 167: Wlad kommt mit Ton herein. Wir versuchen zuerst den Autoplay MIT Ton (klappt bei
 * Browsern, die die Seite kennen); blockt der Browser, läuft der Teaser stumm mit Untertiteln
 * und einem klaren „Mit Ton ansehen“. Ein Klick startet ihn von vorn – mit Ton, ohne Loop.
 */
export const LoginTeaserVideo = ({ de = true, onAvailable }) => {
  const [clip, setClip] = useState(null);
  const [muted, setMuted] = useState(true);
  const [entered, setEntered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get('/guide/public/teaser')
      .then((res) => { if (alive && res.data?.clip?.video_url) { setClip(res.data.clip); onAvailable?.(true); } })
      .catch((err) => logger.warn('teaser fetch failed', err));
    return () => { alive = false; };
  }, [onAvailable]);

  const tryAutoplayWithSound = useCallback((el) => {
    if (!el) return;
    el.muted = false;
    el.play().then(() => setMuted(false)).catch(() => {
      el.muted = true;
      setMuted(true);
      el.play().catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!clip) return undefined;
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, [clip]);

  if (!clip) return null;

  const playWithSound = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.loop = false;
    el.currentTime = 0;
    setMuted(false);
    el.play().catch(() => {});
  };

  const mute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.loop = true;
    setMuted(true);
    if (el.paused) el.play().catch(() => {});
  };

  const handleEnded = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.loop = true;
    setMuted(true);
    el.currentTime = 0;
    el.play().catch(() => {});
  };

  const title = clip.title;

  return (
    <div className="flex items-end gap-6" data-testid="login-teaser">
      <div
        className={`relative w-[216px] xl:w-[240px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/[0.1] shadow-[0_28px_70px_-22px_rgba(191,255,0,0.4)] bg-black shrink-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${entered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
        data-testid="login-teaser-frame"
      >
        <video
          ref={videoRef}
          src={`${BASE}${clip.video_url}`}
          poster={clip.poster_url ? `${BASE}${clip.poster_url}` : undefined}
          autoPlay muted loop playsInline preload="auto"
          onLoadedData={(e) => tryAutoplayWithSound(e.currentTarget)}
          onEnded={handleEnded}
          onClick={muted ? playWithSound : mute}
          className="w-full h-full object-cover cursor-pointer"
          data-testid="login-teaser-video"
        />
        {muted && (
          <button
            type="button"
            onClick={playWithSound}
            className="absolute inset-x-0 bottom-0 pb-4 pt-14 flex flex-col items-center gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white group"
            aria-label={de ? 'Mit Ton ansehen' : 'Watch with sound'}
            data-testid="login-teaser-play-sound"
          >
            <span className="h-11 w-11 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-[0_0_0_6px_rgba(191,255,0,0.18)] group-hover:scale-105 transition-transform">
              <Play size={18} className="ml-0.5" fill="currentColor" />
            </span>
            <span className="text-[11px] font-bold tracking-wide">{de ? 'Mit Ton ansehen' : 'Watch with sound'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={muted ? playWithSound : mute}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label={muted ? (de ? 'Ton an' : 'Unmute') : (de ? 'Ton aus' : 'Mute')}
          data-testid="login-teaser-sound"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
      <div className={`pb-2 transition-[opacity,transform] duration-700 delay-300 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#BFFF00]/80 font-bold">{de ? 'Wlad persönlich' : 'Wlad in person'}</p>
        <p className="text-[15px] font-semibold text-white/90 mt-1 leading-snug" data-testid="login-teaser-title">{title}</p>
        <p className="text-[11.5px] text-white/45 mt-1.5 leading-relaxed max-w-[230px]" data-testid="login-teaser-copy">
          {de
            ? 'Eine Minute, in der Wlad dir sagt, was Leader-OS jeden Tag für dich tut – und was es bewusst nicht ist.'
            : 'One minute in which Wlad tells you what Leader-OS does for you every day – and what it deliberately is not.'}
        </p>
        <button type="button" onClick={muted ? playWithSound : mute} className="mt-3 text-[11px] font-semibold text-[#BFFF00] hover:underline underline-offset-2" data-testid="login-teaser-sound-text">
          {muted ? (de ? 'Von Anfang an mit Ton abspielen' : 'Play from the start with sound') : (de ? 'Ton aus' : 'Mute')}
        </button>
      </div>
    </div>
  );
};

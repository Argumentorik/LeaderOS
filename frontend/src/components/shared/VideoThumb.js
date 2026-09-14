import { useState } from 'react';
import { Check, Play } from 'lucide-react';

const BASE = process.env.REACT_APP_BACKEND_URL;

const absolute = (src) => (!src ? null : /^https?:\/\//i.test(src) ? src : `${BASE}${src}`);

/**
 * Ein Vorschaubild für alle Video-Kacheln: festes 16:9, füllt ohne Verzerrung,
 * ruhiges Nachladen — und wenn kein Bild da ist, eine gestaltete Ersatzkachel
 * im Leader-OS-Look statt eines leeren Kastens.
 */
export const VideoThumb = ({
  src, title = '', kicker = '', duration = null, seen = false,
  showPlay = true, rounded = '', className = '', children,
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = failed ? null : absolute(src);
  const seconds = duration ? Math.round(duration) : null;

  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-[#0A0A0A] ${rounded} ${className}`} data-testid="video-thumb">
      {url ? (
        <img
          src={url} alt={title} loading="lazy" decoding="async"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
          className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end p-3" data-testid="video-thumb-fallback"
             style={{ background: 'radial-gradient(120% 100% at 85% 0%, rgba(191,255,0,0.16), transparent 60%), linear-gradient(160deg,#141414,#070707)' }}>
          <span className="absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-md bg-[#BFFF00] text-[11px] font-black text-black">W</span>
          <p className="text-[11.5px] font-black leading-tight text-white/90 line-clamp-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</p>
          {kicker && <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#BFFF00]/80">{kicker}</p>}
        </div>
      )}

      {showPlay && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BFFF00] text-black shadow-lg transition-transform group-hover:scale-110">
            <Play size={14} fill="currentColor" />
          </span>
        </span>
      )}
      {seconds ? (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums" data-testid="video-thumb-duration">
          {seconds} s
        </span>
      ) : null}
      {seen && (
        <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[#BFFF00]" data-testid="video-thumb-seen">
          <Check size={11} />
        </span>
      )}
      {children}
    </div>
  );
};

export default VideoThumb;

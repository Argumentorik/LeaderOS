/**
 * Universal video player · supports Vimeo, YouTube, MP4/WebM.
 *
 * Pass any video URL or video object with `vimeo_id`/`video_url`. Component
 * auto-detects the source type and renders the correct embed.
 *
 * Designed for the Leadership-Lessons / Video-Missionen flow: as soon as Mert
 * fills `vimeo_id` (or `vimeo_url`) on a learning_video row in MongoDB, the UI
 * picks it up automatically · no code change needed.
 *
 * Premium presentation:
 *  - 16:9 aspect ratio, rounded-2xl, subtle inner ring
 *  - Lazy iframe (loads only when actually displayed)
 *  - Privacy-friendly Vimeo `dnt=1` (do-not-track) param
 *  - Loading spinner while embed initializes
 */
import { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const VIMEO_ID_RE = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
const YOUTUBE_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;

const detectSource = (src) => {
  if (!src) return { type: 'none' };
  // Allow passing a full URL OR just a numeric Vimeo id
  if (/^\d+$/.test(String(src).trim())) {
    return { type: 'vimeo', id: String(src).trim() };
  }
  const url = String(src);
  const v = url.match(VIMEO_ID_RE);
  if (v) return { type: 'vimeo', id: v[1] };
  const y = url.match(YOUTUBE_ID_RE);
  if (y) return { type: 'youtube', id: y[1] };
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return { type: 'native', url };
  return { type: 'unknown', url };
};

export const VideoPlayer = ({
  src,                          // URL or Vimeo numeric ID
  vimeoId,                      // explicit Vimeo id (takes precedence over src)
  poster,                       // optional poster image for native MP4
  title = 'Video',
  autoplay = false,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false);

  const source = useMemo(() => {
    if (vimeoId) return { type: 'vimeo', id: String(vimeoId) };
    return detectSource(src);
  }, [src, vimeoId]);

  if (source.type === 'none' || source.type === 'unknown') {
    return (
      <div
        className={`aspect-video flex items-center justify-center bg-black/40 border border-white/[0.06] rounded-2xl ${className}`}
        data-testid="video-player-empty"
      >
        <div className="text-center px-6">
          <AlertCircle size={28} className="text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">Video wird bald verfügbar sein.</p>
          {source.url && (
            <p className="text-[10px] text-white/20 mt-1 break-all">{source.url}</p>
          )}
        </div>
      </div>
    );
  }

  const wrapper = `relative aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/[0.06] ${className}`;

  if (source.type === 'vimeo') {
    // Iter 92.22: Vimeo Embed mit allen Features (clipboard-write + web-share)
    // damit der Player auf leaderos.de ohne 403 läuft. dnt=1 = privacy mode,
    // badge=0 + autopause=0 matchen den canonical embed-code von Vimeo.
    const vimeoSrc = `https://player.vimeo.com/video/${source.id}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1&title=0&byline=0&portrait=0${autoplay ? '&autoplay=1' : ''}`;
    return (
      <div className={wrapper} data-testid="video-player-vimeo">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Loader2 className="w-7 h-7 animate-spin text-[#BFFF00]" />
          </div>
        )}
        <iframe
          src={vimeoSrc}
          title={title}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  if (source.type === 'youtube') {
    const ytSrc = `https://www.youtube-nocookie.com/embed/${source.id}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;
    return (
      <div className={wrapper} data-testid="video-player-youtube">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Loader2 className="w-7 h-7 animate-spin text-[#BFFF00]" />
          </div>
        )}
        <iframe
          src={ytSrc}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  // Native MP4/WebM
  return (
    <div className={wrapper} data-testid="video-player-native">
      <video
        src={source.url}
        poster={poster}
        controls
        preload="metadata"
        className="w-full h-full"
        autoPlay={autoplay}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;

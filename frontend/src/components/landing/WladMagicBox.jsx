import { useState } from 'react';
import { Play, ArrowUpRight } from 'lucide-react';

/**
 * WladMagicBox · the bundled "everything from Wlad, in one place" media hub.
 *
 * Two tabs:
 *   - Podcast · the real "Der Führungskräfte-Podcast" Spotify show, embedded
 *     so visitors can play episodes without leaving the page.
 *   - Videos  · his TEDx talks + keynotes as lightweight YouTube FACADES:
 *     we render only the thumbnail + play button on load and swap in the
 *     iframe on click, so the heavy YouTube player never touches first paint.
 *
 * Embed hosts are whitelisted in vercel.json CSP (frame-src open.spotify.com
 * + youtube-nocookie.com, img-src i.ytimg.com).
 */

const SPOTIFY_SHOW = '6bamnsX77F7WhmD3Zy50dB';

const VIDEOS = [
  { id: 'fb1DEBJ3DqQ', title: 'Die 10 Stufen des Zuhörens', tag: 'TEDx Freiburg' },
  { id: 'xl7O2t7L55E', title: 'Weiße vs. Dunkle Rhetorik', tag: 'TEDxYouth' },
  { id: 'sBnO_aqfjQw', title: 'Menschen überzeugen · ohne zu lügen', tag: 'Keynote' },
  { id: '-xnP0uH0tYo', title: 'Die Rhetorik der Top-Performer', tag: 'Vortrag' },
  { id: 'cpfXTDRfH_k', title: 'Best Persuasion Hacks', tag: 'Keynote · EN' },
  { id: '0F36RjNd2SY', title: 'Digitale Rhetorik', tag: 'Web-Keynote' },
];

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 h-10 font-mono text-[11px] font-bold uppercase tracking-[0.18em] border-2 transition-colors ${
      active
        ? 'bg-[#BFFF00] text-[#0A0A0A] border-[#BFFF00]'
        : 'bg-transparent text-white/70 border-white/20 hover:border-white/50'
    }`}
  >
    {children}
  </button>
);

const VideoFacade = ({ video, playing, onPlay }) => (
  <div className="relative w-full aspect-video overflow-hidden border-2 border-white/15 bg-black">
    {playing ? (
      <iframe
        title={video.title}
        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
        allow="accelerated-permissions; autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
    ) : (
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Video abspielen: ${video.title}`}
        className="group absolute inset-0 h-full w-full"
      >
        <img
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.75), rgba(10,10,10,0.1))' }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#BFFF00] text-[#0A0A0A] shadow-[0_10px_30px_-6px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110">
          <Play size={26} fill="currentColor" className="ml-0.5" />
        </span>
        <span className="absolute bottom-4 left-4 right-4 text-left">
          <span className="block font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-brand">
            ▸ {video.tag}
          </span>
          <span
            className="mt-1 block text-white leading-[1.1]"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(18px, 2.4vw, 26px)' }}
          >
            {video.title}
          </span>
        </span>
      </button>
    )}
  </div>
);

export const WladMagicBox = () => {
  const [tab, setTab] = useState('podcast');
  const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);
  const [playing, setPlaying] = useState(false);

  const selectVideo = (v) => {
    setActiveVideo(v);
    setPlaying(false);
  };

  return (
    <section
      id="wlad-magic-box"
      aria-label="Wlad Magic Box · Podcast, TEDx & Keynotes"
      className="relative isolate overflow-hidden bg-[#0A0A0A] text-white"
    >
      <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
              ▸ Wlad · Magic Box
            </p>
            <h2
              className="text-[30px] sm:text-[42px] md:text-[56px] leading-[1.0] tracking-[-0.03em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Alles von Wlad · an einem Ort<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[14.5px] leading-[1.6] text-white/65">
              Podcast, TEDx-Talks und Keynotes · direkt hier abspielbar. 450+
              Podcast-Folgen, 3× TEDx, 14 Mio. Views · gebündelt.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <TabButton active={tab === 'podcast'} onClick={() => setTab('podcast')}>Podcast</TabButton>
            <TabButton active={tab === 'videos'} onClick={() => setTab('videos')}>TEDx & Talks</TabButton>
          </div>
        </div>

        {tab === 'podcast' && (
          <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
            <div className="lg:col-span-8">
              <iframe
                title="Der Führungskräfte-Podcast mit Wlad Jachtchenko"
                src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW}?theme=0`}
                width="100%"
                height="420"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full border-2 border-white/15"
              />
            </div>
            <div className="lg:col-span-4">
              <div className="border-2 border-white/15 p-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand">
                  ▸ Der Führungskräfte-Podcast
                </p>
                <p className="mt-3 text-[14px] leading-[1.6] text-white/70">
                  Wöchentlich seit 2019 · über 450 Folgen zu Führung, Rhetorik und
                  KI im Alltag. Reinhören, während du hier bist.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  <a
                    href={`https://open.spotify.com/show/${SPOTIFY_SHOW}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:text-brand transition-colors"
                  >
                    Auf Spotify öffnen <ArrowUpRight size={14} />
                  </a>
                  <a
                    href="https://podcast.wladjachtchenko.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-brand transition-colors"
                  >
                    Alle Plattformen <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'videos' && (
          <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
            <div className="lg:col-span-8">
              <VideoFacade video={activeVideo} playing={playing} onPlay={() => setPlaying(true)} />
            </div>
            <div className="lg:col-span-4">
              <ul className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                {VIDEOS.map((v) => {
                  const isActive = v.id === activeVideo.id;
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => selectVideo(v)}
                        className={`group flex w-full items-center gap-3 border-2 p-2.5 text-left transition-colors ${
                          isActive ? 'border-brand bg-brand/[0.08]' : 'border-white/12 hover:border-white/40'
                        }`}
                      >
                        <span className="relative h-11 w-20 shrink-0 overflow-hidden bg-black">
                          <img
                            src={`https://i.ytimg.com/vi/${v.id}/default.jpg`}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-brand">
                            {v.tag}
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white/90">
                            {v.title}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <a
                href="https://www.youtube.com/c/ArgumentorikRhetorikPers%C3%B6nlichkeit"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:text-brand transition-colors"
              >
                Ganzer YouTube-Kanal <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WladMagicBox;

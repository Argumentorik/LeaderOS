import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, Lock, Play, X } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DottedGlowBackground } from '../components/shared/DottedGlowBackground';
import { applyPageMeta } from '../lib/pageMeta';
import { useTheme } from '../contexts/ThemeContext';
import { isValidEmail } from '../features/newsletter/lib/newsletterClient';
import { captureFreeVideoLead } from '../lib/leadCapture';
import { setFreeVideoOptIn } from '../data/freeVideos';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';
import { FREE_VIDEOS, embedSrc } from '../data/freeVideos';
import { PressMarquee } from '../components/landing/PressMarquee';

/**
 * FreeVideosPage · /gratis · the free-video lead-magnet funnel.
 *
 * Direct-response DNA (Hormozi value-stack · Sabri Suby "godfather offer" ·
 * Brunson soap-opera drip): a big value promise, a single email opt-in, then
 * the 4 videos UNLOCK inline (instant gratification) while the visitor is
 * also enrolled into the daily email series (campaign 'free-video-series' —
 * one video per day). One goal on the page: get the email.
 *
 * Unlock is remembered in localStorage so returning visitors keep access.
 * Always-dark VSL canvas (forces the dark theme on mount, restores on leave).
 */

const UNLOCK_KEY = 'lo_free_videos_unlocked';

const BENEFITS = [
  'Die 5 Rollen einer Führungskraft · sofort anwendbar',
  'Natürliche Autorität ohne Druck oder Manipulation',
  'Weniger arbeiten, mehr bewirken · dein Team zieht mit',
  'Dein 30-Tage-Fahrplan zur KI-nativen Führungskraft',
];

// „Bekannt aus" now renders via the shared chrome PressMarquee (canonical
// outlet set lives in components/landing/PressMarquee.js).

// Real, verifiable proof — numbers cross-checked against WladJachtchenkoPage.
const PROOF = [
  ['400 000+', 'Klienten weltweit seit 2007'],
  ['3×', 'SPIEGEL-Bestseller · 13 Bücher'],
  ['4,9 / 5', 'Trustpilot · 388 Bewertungen'],
  ['14 Mio', 'Views auf Podcast & YouTube'],
];

// The Monday every overloaded leader recognizes · agitation before solution.
// Each vignette maps onto one of the 4 videos (visibility, authority,
// micromanagement, KI-native) so the pain → cure line is airtight.
const PAIN = [
  ['07:40', 'Dein Postfach entscheidet über deinen Tag — nicht du. 40 Mails, 3 Eskalationen, 0 Minuten zum Denken.'],
  ['11:15', 'Im Meeting geht dein Vorschlag unter. Zehn Minuten später sagt ihn jemand lauter — und bekommt den Applaus.'],
  ['16:50', 'Du kontrollierst Aufgaben nach, die du längst abgegeben hattest. Delegieren, das keins ist.'],
  ['22:30', 'Und leise die Frage: Wer führt in drei Jahren — du, oder jemand, der KI-nativ arbeitet?'],
];

// Self-selection qualifier · raises intent, filters tire-kickers honestly.
const FOR_YOU = [
  'Du bist fachlich stark, wirst aber als Führungspersönlichkeit noch nicht gesehen',
  'Du führst ein Team oder Projekt — oder stehst kurz davor',
  'Du willst natürliche Autorität statt Druck oder Manipulation',
  'Du gibst 4 Tage lang je ein paar Minuten, wenn der Gegenwert stimmt',
];
const NOT_FOR_YOU = [
  'Du suchst einen Prompt-Katalog oder das nächste Tool-Tutorial',
  'Du willst delegieren statt selbst verstehen — „soll sich HR drum kümmern"',
  'Du erwartest, dass sich Führung ohne dein Zutun verändert',
];

// Recap of the full stack right before the final ask.
const STACK_RECAP = [
  'Alle 4 Videos — sofort freigeschaltet, kein Warten',
  '4 Tage · je ein Kern-Prinzip per Mail, direkt anwendbar',
  'Material aus Trainings mit 10.000 € Tagessatz',
  '0 € · keine Karte · 1-Klick-Abmeldung jederzeit',
];

const STEPS = [
  ['01', 'E-Mail eintragen', 'Ein Feld, ein Klick — keine Kreditkarte, kein Konto nötig.'],
  ['02', 'Sofort freischalten', 'Alle 4 Videos öffnen sich direkt hier auf der Seite.'],
  ['03', 'Täglich 1 Video', 'Ab morgen bekommst du jeden Tag eins ins Postfach — dranbleiben zahlt sich aus.'],
];

const FAQ = [
  ['Kostet das wirklich nichts?', 'Ja, komplett kostenlos. Keine Kreditkarte, kein Abo, keine versteckten Kosten. Wlad wird sonst für 10.000 € Tagessatz gebucht — diese 4 Videos sind ein echtes Geschenk, damit du siehst, wie er arbeitet.'],
  ['Für wen sind die Videos?', 'Für alle, die fachlich stark sind, aber als Führungspersönlichkeit endlich gesehen werden wollen — Teamleads, Projektmanager, Senior-Experten und alle, die es werden wollen. Auch für introvertierte, authentische Menschen, die ohne Manipulation führen.'],
  ['Bekomme ich jetzt Spam?', 'Nein. Du bekommst die 4 Videos plus gelegentlich echte Impulse. Ein Klick, und du bist wieder raus — jederzeit, in jeder Mail.'],
  ['Was passiert nach den 4 Videos?', 'Du kennst dann das Fundament von Wlads Methodik. Wenn du sie täglich mit WladBot drillen willst, kannst du LeaderOS 14 Tage kostenlos testen — musst du aber nicht.'],
  ['Wie viel Zeit brauche ich?', '8 bis 12 Minuten pro Video, eins pro Tag. Die Serie ist bewusst so gebaut, dass sie in einen vollen Führungskalender passt — ein Prinzip pro Tag statt Binge-Watching ohne Umsetzung.'],
  ['Ich habe keine KI-Vorkenntnisse. Ist das ein Problem?', 'Nein. Video 1 bis 3 sind reine Führungspraxis — Sichtbarkeit, Autorität, Delegation. Video 4 übersetzt das ins KI-Zeitalter, ohne dass du je ein Tool bedient haben musst.'],
  ['Ich führe seit Jahren. Lohnt sich das trotzdem?', 'Gerade dann. Die ersten drei Videos sind ein Systematik-Check für Dinge, die du intuitiv machst — und Video 4 gibt dir den KI-Fahrplan, den es vor zwei Jahren schlicht noch nicht gab.'],
  ['Was passiert mit meinen Daten?', 'Deine E-Mail wird für die Video-Serie genutzt, DSGVO-konform gespeichert und nicht weiterverkauft. Jede Mail hat einen 1-Klick-Abmeldelink — ein Klick, und du hörst nichts mehr von uns.'],
];

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'free-videos', ...props }); } catch {}
  }
};

const readUnlocked = () => {
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
};

/**
 * VideoTile · simplified poster card. No inline iframe anymore — clicking a
 * ready tile opens the cinema Lightbox (big, black, distraction-free). The
 * tile itself just needs a clear play affordance: lime play-disc on hover-
 * darkened poster + day/duration metadata.
 */
const VideoTile = ({ video, unlocked, onUnlockClick, onPlay }) => {
  const src = embedSrc(video);
  const canPlay = unlocked && src;

  return (
    <article className="group/card relative border-2 border-white/12 bg-white/[0.02] overflow-hidden flex flex-col transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_rgba(191,255,0,0.4)]">
      <div className="relative aspect-video bg-black overflow-hidden">
        <button
          type="button"
          onClick={canPlay ? () => onPlay(video) : (unlocked ? undefined : onUnlockClick)}
          className="group absolute inset-0 h-full w-full"
          aria-label={unlocked ? (src ? `Video ${video.day} abspielen` : 'Video folgt in Kürze') : 'Videos freischalten'}
        >
          {/* Branded poster thumbnail */}
          <img
            src={video.thumb}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${canPlay ? 'group-hover:scale-[1.03]' : ''}`}
          />
          {/* Unlocked + ready · lime play affordance (the "it works" signal) */}
          {canPlay && (
            <>
              <span aria-hidden className="absolute inset-0 bg-[#0A0A0A]/25 group-hover:bg-[#0A0A0A]/45 transition-colors" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand text-[#0A0A0A] shadow-[0_12px_36px_-8px_rgba(191,255,0,0.6)] transition-transform group-hover:scale-110">
                <Play size={24} strokeWidth={2.5} className="ml-0.5" fill="currentColor" />
              </span>
              <span className="absolute bottom-3 left-3 inline-flex items-center bg-[#0A0A0A]/80 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand">
                ▸ TAG {video.day} · {video.duration}
              </span>
            </>
          )}
          {/* Locked · chrome vault disc */}
          {!unlocked && (
            <>
              <span aria-hidden className="absolute inset-0 bg-[#0A0A0A]/60" />
              <span className="fv-chrome-disc absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-16 w-16 items-center justify-center text-[#0A0A0A] transition-transform group-hover:scale-110">
                <Lock size={22} strokeWidth={2.5} />
              </span>
              <span className="absolute bottom-4 left-4 right-4 text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/90">
                Mit E-Mail freischalten
              </span>
            </>
          )}
          {unlocked && !src && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-[#BFFF00] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A]">
              Bald verfügbar
            </span>
          )}
        </button>
      </div>
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3
          className="text-[18px] md:text-[20px] leading-[1.15] tracking-[-0.02em] text-white"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          {video.title}
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-[1.55] text-white/60 flex-1">{video.hook}</p>
      </div>
    </article>
  );
};

/**
 * VideoLightbox · cinema mode. Full-black overlay, BIB-code header, one big
 * 16:9 player, and a "Weiter"-rail to the next ready video (binge flow —
 * every finished video is one step closer to the trial CTA). Esc/backdrop
 * close. Simple by design: the video is the only bright thing on screen.
 */
const VideoLightbox = ({ video, onClose, onNext, nextVideo }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const src = embedSrc(video);
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#050505]/98 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Video ${video.day}: ${video.title}`}
      onClick={onClose}
      data-testid="video-lightbox"
    >
      {/* BIB header */}
      <div className="flex items-center justify-between px-4 md:px-8 h-14 border-b border-white/10 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand shrink-0">
            ▸ TAG {video.day} / {FREE_VIDEOS.length}
          </span>
          <span className="hidden sm:block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 truncate">
            {video.title} · {video.duration}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          data-testid="lightbox-close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center px-3 md:px-8 py-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-5xl aspect-video bg-black border border-white/15">
          <iframe
            title={video.title}
            src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Next rail · binge flow */}
      <div className="shrink-0 border-t border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hidden sm:block">
          ESC ZUM SCHLIESSEN
        </span>
        {nextVideo ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2.5 px-5 h-11 bg-brand text-[#0A0A0A] font-bold text-[11.5px] uppercase tracking-[0.1em] hover:bg-white transition-colors ml-auto"
            data-testid="lightbox-next"
          >
            Weiter · Tag {nextVideo.day}: {nextVideo.title.split(':')[0].split('·')[0].trim()} <ArrowUpRight size={14} />
          </button>
        ) : (
          <a
            href="https://leaderos.de/signup?trial=14"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 h-11 bg-brand text-[#0A0A0A] font-bold text-[11.5px] uppercase tracking-[0.1em] hover:bg-white transition-colors ml-auto"
          >
            Serie fertig · 14 Tage kostenlos weitermachen <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * OptInForm · the "vault" unlock card.
 *
 * Deliberately the loudest element on the page: a chrome/metallic frame with
 * a slow light-sheen sweep, a machined-metal lock emblem, and a glow-pulsing
 * lime CTA. The metal says "valuable & locked", the lime says "one action
 * opens it" — chrome is reserved for THIS moment so the eye lands here.
 */
const OptInForm = ({ onUnlocked, idSuffix = '' }) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const valid = isValidEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    track('free_videos_optin_submit');
    // Optimistic unlock · give the value immediately, enrol into the drip in
    // the background (double-opt-in email still goes out for the daily series).
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch { /* ignore */ }
    onUnlocked();
    // Durable capture: Mongo lead store + attribution + instant Video-1 email
    // + Day 2-4 drip (backend/routes/free_videos.py) — not just a newsletter tag.
    const res = await captureFreeVideoLead({ email, source: 'free-video-funnel' });
    setState(res.ok ? 'done' : 'error');
    track('free_videos_optin_result', { ok: res.ok });
  };

  return (
    <div className="fv-chrome-frame w-full" data-testid={`free-optin-card${idSuffix}`}>
      <span className="fv-sheen" aria-hidden />
      <div className="relative bg-[#0C0C0C] px-5 py-5 sm:px-7 sm:py-6">
        {/* Emblem row · machined-metal lock + chrome wordmark */}
        <div className="flex items-center gap-3.5 mb-5">
          <span className="fv-chrome-disc shrink-0 w-11 h-11 flex items-center justify-center text-[#0A0A0A]">
            <Lock size={17} strokeWidth={2.75} />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-brand">
              ▸ SOFORT-ZUGANG · KEIN KONTO NÖTIG
            </div>
            <div
              className="fv-chrome-text text-[17px] sm:text-[19px] leading-tight uppercase tracking-[0.02em] truncate"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Alle 4 Videos freischalten
            </div>
          </div>
        </div>

        <form onSubmit={submit} noValidate data-testid={`free-optin${idSuffix}`} className="w-full">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Deine beste E-Mail-Adresse"
              aria-label="E-Mail-Adresse"
              className="flex-1 h-14 px-5 bg-white/[0.06] border-2 border-white/25 focus:border-brand focus:bg-white/[0.09] outline-none text-white text-[15px] placeholder:text-white/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!valid || state === 'loading'}
              className="fv-cta-pulse h-14 px-7 bg-[#BFFF00] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {state === 'loading' ? 'Wird freigeschaltet…' : 'Jetzt 4 Videos gratis'}
              {state !== 'loading' && <ArrowUpRight size={16} />}
            </button>
          </div>
          <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            100 % kostenlos · sofort freigeschaltet · 1 Video pro Tag per Mail · jederzeit abbestellbar
          </p>
        </form>
      </div>
    </div>
  );
};

export default function FreeVideosPage() {
  useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [lightbox, setLightbox] = useState(null); // video object | null
  const videosRef = useRef(null);

  const readyVideos = FREE_VIDEOS.filter((v) => embedSrc(v));
  const openVideo = (video) => {
    setLightbox(video);
    track('free_video_play', { day: video.day, mode: 'lightbox' });
  };
  const nextAfter = (video) =>
    readyVideos.find((v) => v.day > (video?.day ?? 0)) || null;

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');
    // ?unlock=1 lets drip emails deep-link straight into the unlocked state
    // (the lead already opted in — don't make them re-enter their email).
    const fromEmail = new URLSearchParams(window.location.search).get('unlock') === '1';
    if (fromEmail) setFreeVideoOptIn('1');
    setUnlocked(fromEmail || readUnlocked());
    track('free_videos_view');

    const restoreMeta = applyPageMeta({
      title: 'Führung beginnt hier · 4 kostenlose Videos · Wlad Jachtchenko',
      description:
        'Führung beginnt hier: 4 kostenlose Videos von Europas führendem Leadership-Coach Wlad ' +
        'Jachtchenko · natürliche Autorität, weniger arbeiten, mehr bewirken. Ein Video pro Tag, direkt in dein Postfach.',
      url: 'https://leader-os.de/fuehrung-beginnt-hier',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    // AEO · structured data for answer engines & rich results.
    // FAQPage: the 8 objection-handling FAQs → Google FAQ rich result +
    // direct answers in AI Overview/Perplexity. VideoObject: one entry per
    // ready video → video rich results. Injected/removed with the page.
    const base = 'https://leader-os.de';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: FAQ.map(([q, a]) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        },
        ...FREE_VIDEOS.filter((v) => embedSrc(v)).map((v) => ({
          '@type': 'VideoObject',
          name: v.title,
          description: v.hook,
          thumbnailUrl: `${base}${v.thumb}`,
          uploadDate: '2026-07-01',
          duration: `PT${parseInt(v.duration, 10) || 10}M`,
          embedUrl: embedSrc(v),
          publisher: {
            '@type': 'Organization',
            name: 'LeaderOS',
            url: base,
          },
        })),
      ],
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-fbh-jsonld', '1');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      restoreMeta();
      script.remove();
      if (!wasDark) root.classList.remove('dark');
    };
  }, []);

  const unlock = () => {
    setUnlocked(true);
    requestAnimationFrame(() => videosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const scrollToOptIn = () => {
    document.getElementById('optin')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const stats = useMemo(() => [['400K+', 'Klienten'], ['3×', 'SPIEGEL'], ['14 Mio', 'Views'], ['4', 'Gratis-Videos']], []);

  return (
    <div
      className="relative overflow-hidden bg-background text-foreground min-h-[100dvh] antialiased"
      data-testid="free-videos-page"
      style={{
        backgroundImage:
          'radial-gradient(at 12% 6%, rgba(191,255,0,0.07) 0px, transparent 42%), ' +
          'radial-gradient(at 88% 24%, rgba(191,255,0,0.05) 0px, transparent 48%), ' +
          'radial-gradient(at 50% 102%, rgba(191,255,0,0.05) 0px, transparent 55%)',
      }}
    >
      {/* Fixed grain · filmic texture over the dark canvas so it reads premium
          next to the chrome system — non-interactive, soft-light, never dims. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.05] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '190px 190px',
        }}
      />
      {/* Chrome/metallic detail system · scoped fv- classes, CSS-only (no images).
          Chrome is reserved for the unlock moment: the opt-in card frame, the
          lock emblems, and one hero word — so the metal never becomes wallpaper. */}
      <style>{`
        .fv-chrome-text{background:linear-gradient(180deg,#ffffff 0%,#d9d9d9 26%,#8f8f8f 47%,#f2f4f4 52%,#7f7f7f 68%,#e9e9e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
        .fv-chrome-frame{position:relative;overflow:hidden;padding:2px;background:linear-gradient(135deg,#f0f0f0 0%,#7d7d7d 20%,#fafafa 38%,#5f5f5f 55%,#d9d9d9 72%,#8a8a8a 88%,#f0f0f0 100%);box-shadow:0 0 0 1px rgba(0,0,0,.65),0 18px 50px -18px rgba(191,255,0,.28);}
        .fv-chrome-disc{border-radius:9999px;background:conic-gradient(from 210deg,#f4f4f4,#8d8d8d 18%,#e6e6e6 34%,#6c6c6c 52%,#f0f0f0 68%,#9b9b9b 84%,#f4f4f4);box-shadow:inset 0 1px 2px rgba(255,255,255,.9),inset 0 -2px 4px rgba(0,0,0,.45),0 4px 14px rgba(0,0,0,.5);}
        .fv-sheen{position:absolute;top:-40%;bottom:-40%;width:38%;transform:skewX(-18deg) translateX(-220%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:fvSheen 4.5s ease-in-out infinite;pointer-events:none;z-index:1;}
        @keyframes fvSheen{0%,55%{transform:skewX(-18deg) translateX(-220%)}85%,100%{transform:skewX(-18deg) translateX(420%)}}
        .fv-cta-pulse{animation:fvPulse 2.6s ease-in-out infinite;}
        .fv-cta-pulse:hover,.fv-cta-pulse:disabled{animation:none;}
        @keyframes fvPulse{0%,100%{box-shadow:0 0 0 0 rgba(191,255,0,.4)}50%{box-shadow:0 0 26px 5px rgba(191,255,0,.22)}}
        @media (prefers-reduced-motion:reduce){.fv-sheen,.fv-cta-pulse{animation:none}}
        /* Scoped chrome takeover of the shared nav logo — ONLY on this page.
           The W tile goes machined-metal, the wordmark gets chrome text; the
           lime "·" dot survives via its own color. Rest of the app unaffected. */
        [data-testid="free-videos-page"] [data-testid="landing-nav"] a[aria-label="LeaderOS Startseite"] span[aria-hidden]:first-of-type{background:conic-gradient(from 210deg,#f4f4f4,#8d8d8d 18%,#e6e6e6 34%,#6c6c6c 52%,#f0f0f0 68%,#9b9b9b 84%,#f4f4f4) !important;box-shadow:inset 0 1px 2px rgba(255,255,255,.9),inset 0 -2px 4px rgba(0,0,0,.45),0 4px 16px -4px rgba(0,0,0,.6) !important;}
        [data-testid="free-videos-page"] [data-testid="landing-nav"] a[aria-label="LeaderOS Startseite"] > div > span{background:linear-gradient(180deg,#ffffff 0%,#d9d9d9 26%,#8f8f8f 47%,#f2f4f4 52%,#7f7f7f 68%,#e9e9e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
      `}</style>
      <LandingNav />

      <main id="main-content" className="relative z-10">
        {/* Hero · the opt-in */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <DottedGlowBackground gap={16} radius={1.8} color="rgba(255,255,255,0.18)" glowColor="rgba(191,255,0,0.6)" opacity={0.5} />
          </div>
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 pt-14 md:pt-20 pb-16 md:pb-20">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-6">
              ▸ Führung beginnt hier · 4 Videos · kostenlos
            </p>
            <h1
              className="text-[40px] sm:text-[64px] md:text-[88px] leading-[0.92] tracking-[-0.04em] text-foreground max-w-4xl"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Führung beginnt<br /><span className="fv-chrome-text">hier</span><span className="text-brand not-italic">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] sm:text-[19px] leading-[1.55] text-foreground/70">
              Kostenlos von <span className="text-foreground font-semibold">Wlad Jachtchenko</span> · Europas führendem
              Leadership-Coach (3× SPIEGEL-Bestseller). Trag deine E-Mail ein, schalte alle 4 Videos sofort frei — und
              bekomm danach jeden Tag eins direkt in dein Postfach.
            </p>

            <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-2xl">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14.5px] leading-[1.4] text-foreground/85">
                  <span className="mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center bg-[#BFFF00] text-[#0A0A0A]">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div id="optin" className="mt-10 max-w-2xl scroll-mt-24">
              <OptInForm onUnlocked={unlock} idSuffix="-hero" />
            </div>

            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
              {stats.map(([big, cap]) => (
                <div key={cap}>
                  <div className="text-[22px] md:text-[26px] leading-none text-foreground tabular-nums" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>{big}</div>
                  <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/45">{cap}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bekannt aus · chrome wordmark marquee (shared PressMarquee) */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-7 md:py-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Bekannt aus</p>
            <PressMarquee className="py-1" />
          </div>
        </section>

        {/* Pain · the Monday every overloaded leader recognizes (PAS: agitate
            before the 3-step relief below). Each vignette maps to one video. */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Kennst du diese Woche?</p>
            <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.02] tracking-[-0.03em] text-foreground mb-10" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
              Ein ganz normaler Montag<span className="text-brand not-italic">.</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {PAIN.map(([time, text]) => (
                <div key={time} className="border-2 border-foreground/15 p-5 md:p-6 flex gap-5">
                  <div className="shrink-0 font-mono text-[14px] font-bold text-foreground/35 tabular-nums pt-0.5">{time}</div>
                  <p className="text-[14.5px] leading-[1.55] text-foreground/75">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 max-w-3xl">
              <p className="text-[15px] md:text-[16px] leading-[1.6] text-foreground/70">
                Das Problem ist nicht dein Einsatz. Das Problem ist, dass dir Führung nie systematisch
                beigebracht wurde — du hast sie nebenbei gelernt, unter Druck, ohne Plan.
              </p>
              <p className="mt-3 text-[15px] md:text-[16px] leading-[1.6] text-foreground font-bold">
                Genau da setzen die 4 Videos an: ein Prinzip pro Tag, in Minuten anwendbar.
              </p>
              <button
                onClick={unlocked ? () => videosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : scrollToOptIn}
                className="mt-7 inline-flex items-center justify-center gap-2 h-13 px-7 py-3.5 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                {unlocked ? 'Zu deinen Videos' : 'Mit Video 1 anfangen'} <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* So funktioniert's · 3 steps (removes friction before the gate) */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-8">▸ So einfach geht's</p>
            <div className="grid md:grid-cols-3 gap-5 md:gap-6">
              {STEPS.map(([n, t, d]) => (
                <div key={n} className="border-2 border-foreground/15 p-6 md:p-7 bg-white/[0.015] transition-all duration-300 hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_28px_60px_-30px_rgba(191,255,0,0.35)]">
                  <div className="text-[34px] leading-none text-brand tabular-nums" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>{n}</div>
                  <h3 className="mt-4 text-[18px] md:text-[20px] leading-[1.15] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>{t}<span className="text-brand not-italic">.</span></h3>
                  <p className="mt-2.5 text-[14px] leading-[1.55] text-foreground/65">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The 4 videos · locked → unlocked */}
        <section ref={videosRef} id="videos" className="border-t-2 border-foreground/12 scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-24">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10 md:mb-12">
              <div>
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
                  ▸ Deine 4 Videos
                </p>
                <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[1.0] tracking-[-0.03em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                  {unlocked ? 'Freigeschaltet · viel Erfolg' : 'Ein Klick · alle vier offen'}<span className="text-brand not-italic">.</span>
                </h2>
              </div>
              {unlocked && (
                <div className="inline-flex items-center gap-2 border-2 border-brand/50 bg-brand/[0.06] px-4 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">
                  <Check size={14} strokeWidth={3} /> Zugang aktiv
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {FREE_VIDEOS.map((v) => (
                <VideoTile key={v.day} video={v} unlocked={unlocked} onUnlockClick={scrollToOptIn} onPlay={openVideo} />
              ))}
            </div>

            {!unlocked && (
              <div className="mt-10 text-center">
                <button
                  onClick={scrollToOptIn}
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
                >
                  Alle 4 Videos freischalten <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* WladBot 3.0 · the character who accompanies the series. His face
            + three coach-style tips in chat bubbles → "text him" CTA. Stacks
            cleanly on mobile (avatar on top, bubbles below). */}
        <section className="relative isolate overflow-hidden border-t-2 border-foreground/12">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
            <DottedGlowBackground gap={18} radius={1.6} color="rgba(255,255,255,0.14)" glowColor="rgba(191,255,0,0.45)" opacity={0.4} />
          </div>
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-24 grid md:grid-cols-12 gap-10 md:gap-12 items-center">
            <div className="md:col-span-4 flex md:block justify-center">
              <div className="relative w-[220px] sm:w-[260px] md:w-full max-w-[320px]">
                <span aria-hidden className="absolute inset-0 rounded-full bg-brand/20 blur-3xl" />
                <img
                  src={WLADBOT_AVATAR}
                  onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
                  alt="WladBot 3.0 · dein KI-Coach in LeaderOS"
                  loading="lazy"
                  decoding="async"
                  className="relative w-full aspect-square rounded-full object-cover object-[50%_14%] bg-[#0A0A0A] ring-2 ring-brand shadow-[0_40px_90px_-40px_rgba(191,255,0,0.5)]"
                />
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-[#0A0A0A]/90 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand whitespace-nowrap">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> WladBot 3.0 · online
                </span>
              </div>
            </div>
            <div className="md:col-span-8">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Dein Begleiter durch die Serie</p>
              <h2 className="text-[28px] sm:text-[38px] md:text-[48px] leading-[1.0] tracking-[-0.03em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                Das ist WladBot<span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-foreground/70">
                Trainiert auf Wlads kompletter Methodik — 13 Bücher, 15 Jahre Coaching. In LeaderOS
                begleitet er dich 24/7. Sein Rat zu den 4 Videos:
              </p>
              <div className="mt-6 space-y-3 max-w-2xl">
                {[
                  'Schau ein Video pro Tag — nicht alle vier am Stück. Ein Prinzip, das du morgen anwendest, schlägt vier, die du vergisst.',
                  'Nimm dir nach jedem Video 2 Minuten und schreib den einen Satz auf, den du diese Woche testest.',
                  'Und wenn du bei deinem echten Fall festhängst: schreib mir. Ich antworte in Wlads Methodik — in unter 30 Sekunden.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1 font-mono text-[10px] font-bold text-brand tabular-nums shrink-0">0{i + 1}</span>
                    <p className="border-2 border-foreground/15 bg-white/[0.02] px-4 py-3 text-[14px] leading-[1.55] text-foreground/85 rounded-tr-xl rounded-br-xl rounded-bl-xl">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href="https://leaderos.de/chat"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('free_videos_wladbot_cta')}
                className="mt-7 inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
              >
                Schreib WladBot <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* Reason-why · the honest "Warum kostenlos?" kills the where's-the-catch
            objection right after the visitor has seen the locked value. */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-20 grid md:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="md:col-span-5">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Die ehrliche Antwort</p>
              <h2 className="text-[30px] sm:text-[40px] md:text-[52px] leading-[0.98] tracking-[-0.035em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                Warum<br />kostenlos<span className="text-brand not-italic">?</span>
              </h2>
            </div>
            <div className="md:col-span-7 space-y-4 text-[15px] md:text-[16px] leading-[1.65] text-foreground/72">
              <p>
                Weil das die beste Werbung ist, die wir machen können. Statt dir zu <em>erzählen</em>,
                dass Wlads Methodik funktioniert, zeigen wir sie dir — an vier Prinzipien, die du sofort
                in deinem Alltag testen kannst.
              </p>
              <p>
                Unser Kalkül, offen ausgesprochen: Ein Teil der Zuschauer will danach mehr und testet{' '}
                <span className="text-foreground font-bold">LeaderOS 14 Tage kostenlos</span> — die
                Plattform, auf der genau diese Methodik als tägliches System läuft. Die meisten nehmen
                einfach die 4 Prinzipien mit und setzen sie um.
              </p>
              <p className="text-foreground font-bold">
                Beides ist für uns ein Gewinn. Und für dich ist es in jedem Fall einer.
              </p>
            </div>
          </div>
        </section>

        {/* Authority · Wlad */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-20 grid md:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="md:col-span-3">
              <div className="relative aspect-square w-full max-w-[220px] mx-auto md:mx-0 rounded-full overflow-hidden border-2 border-foreground/30">
                <img src={WLAD_AVATAR} onError={withFallback(WLAD_AVATAR_FALLBACKS)} alt="Wlad Jachtchenko" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-[50%_20%]" />
              </div>
            </div>
            <div className="md:col-span-9">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Von wem</p>
              <h2 className="text-[24px] sm:text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.03em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                Wlad Jachtchenko<span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-foreground/72 max-w-2xl">
                3× SPIEGEL-Bestseller-Autor, Europas führender Leadership-Coach. Von Allianz, BMW, ProSieben & Co.
                für 10.000 € Tagessatz gebucht — über 400.000 Klienten weltweit seit 2007. In diesen 4 Videos
                bekommst du das Fundament seiner Methodik — kostenlos.
              </p>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
                {PROOF.map(([big, cap]) => (
                  <div key={cap} className="border-t-2 border-foreground/20 pt-3">
                    <div className="text-[22px] md:text-[26px] leading-none text-foreground tabular-nums" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>{big}</div>
                    <div className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/50 leading-[1.4]">{cap}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Qualifier · for-you / not-for-you self-selection. Filtering honestly
            raises intent AND conversion — the visitor argues themselves in. */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Ehrliche Einordnung</p>
            <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.02] tracking-[-0.03em] text-foreground mb-10 max-w-3xl" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
              Für wen die Serie gebaut ist — und für wen nicht<span className="text-brand not-italic">.</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="border-2 border-brand/60 p-6 md:p-7">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand mb-5">▸ Für dich, wenn</p>
                <ul className="space-y-3.5">
                  {FOR_YOU.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-[14.5px] leading-[1.5] text-foreground/85">
                      <span className="mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center bg-[#BFFF00] text-[#0A0A0A]">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-2 border-foreground/15 p-6 md:p-7 bg-white/[0.015] transition-all duration-300 hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_28px_60px_-30px_rgba(191,255,0,0.35)]">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/45 mb-5">▸ Nicht für dich, wenn</p>
                <ul className="space-y-3.5">
                  {NOT_FOR_YOU.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-[14.5px] leading-[1.5] text-foreground/55">
                      <span className="mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center border-2 border-foreground/25 text-foreground/40">
                        <X size={12} strokeWidth={3} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 pt-5 border-t border-foreground/12 text-[13px] leading-[1.55] text-foreground/50">
                  Das ist keine Pose — es spart uns beiden Zeit. Wenn du dich links wiederfindest,
                  sind die nächsten 4 Tage gut investiert.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ · objection handling */}
        <section className="border-t-2 border-foreground/12">
          <div className="max-w-[860px] mx-auto px-5 md:px-10 py-16 md:py-24">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">▸ Kurz geklärt</p>
            <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.02] tracking-[-0.03em] text-foreground mb-8" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
              Bevor du startest<span className="text-brand not-italic">.</span>
            </h2>
            <dl className="border-t-2 border-foreground/15">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-5 border-b border-foreground/15">
                  <dt className="text-[16px] md:text-[18px] leading-[1.3] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{q}</dt>
                  <dd className="mt-2 text-[14px] leading-[1.6] text-foreground/68">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Desire-closer · future-pacing: the week AFTER the 4 videos.
            Only pre-unlock — its whole job is making the visitor want the
            unlock. Thumbnails as a locked, tilted mosaic = visual pull. */}
        {!unlocked && (
          <section className="relative isolate overflow-hidden border-t-2 border-foreground/12">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
              <DottedGlowBackground gap={18} radius={1.6} color="rgba(255,255,255,0.14)" glowColor="rgba(191,255,0,0.45)" opacity={0.4} />
            </div>
            <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-16 md:py-24 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-6">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
                  ▸ Deine Woche · nach den 4 Videos
                </p>
                <h2
                  className="text-[30px] sm:text-[40px] md:text-[52px] leading-[0.98] tracking-[-0.035em] text-foreground"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  Stell dir nächsten<br />Montag vor<span className="text-brand not-italic">.</span>
                </h2>
                <ul className="mt-8 space-y-4">
                  {[
                    ['MO · 08:50', 'Du eröffnest das Meeting anders — und diesmal gehört dir der Raum. Video 1 hat dir gezeigt, warum man dich übersehen hat.'],
                    ['DI · 14:30', 'Ein Senior widerspricht laut. Du bleibst ruhig und gewinnst — Autorität ist kein Lautstärke-Spiel (Video 2).'],
                    ['DO · 17:00', 'Du gehst pünktlich. Dein Team liefert trotzdem — weil Delegieren endlich Delegieren ist (Video 3).'],
                    ['FR · 11:00', 'Du skizzierst deinen 30-Tage-Plan zur KI-nativen Führungskraft (Video 4). Vorsprung, den man sieht.'],
                  ].map(([time, line]) => (
                    <li key={time} className="flex items-start gap-4">
                      <span className="mt-0.5 shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand tabular-nums">{time}</span>
                      <p className="text-[14.5px] leading-[1.55] text-foreground/78">{line}</p>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToOptIn}
                  className="mt-9 inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
                  data-testid="closer-unlock-cta"
                >
                  Diese Woche freischalten <ArrowUpRight size={16} />
                </button>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40">
                  Kostenlos · sofort · nur deine E-Mail
                </p>
              </div>
              {/* Locked thumbnail mosaic · tilted stack, lock badge */}
              <div className="lg:col-span-6">
                <div className="relative mx-auto max-w-[480px]">
                  {FREE_VIDEOS.map((v, i) => (
                    <div
                      key={v.day}
                      className={`${i === 0 ? 'relative' : 'absolute inset-x-0 top-0'} border-2 border-white/15 overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]`}
                      style={{
                        transform: `rotate(${(i - 1.5) * 2.4}deg) translateY(${i * 26}px)`,
                        zIndex: 10 - i,
                      }}
                    >
                      <img src={v.thumb} alt={v.title} loading="lazy" decoding="async" className="w-full aspect-video object-cover" />
                      <span aria-hidden className="absolute inset-0 bg-[#0A0A0A]/45" />
                    </div>
                  ))}
                  <button
                    onClick={scrollToOptIn}
                    aria-label="Videos freischalten"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#BFFF00] text-[#0A0A0A] shadow-[0_14px_40px_-8px_rgba(191,255,0,0.6)] transition-transform hover:scale-110"
                  >
                    <Lock size={24} />
                  </button>
                  {/* Spacer so the tilted stack's translateY doesn't clip */}
                  <div aria-hidden style={{ height: 3 * 26 }} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="relative isolate overflow-hidden border-t-2 border-foreground/12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <DottedGlowBackground gap={16} radius={1.8} color="rgba(255,255,255,0.2)" glowColor="rgba(191,255,0,0.65)" opacity={0.55} />
          </div>
          <div className="max-w-[820px] mx-auto px-5 md:px-10 py-20 md:py-24 text-center">
            <h2 className="text-[30px] sm:text-[44px] md:text-[56px] leading-[1.0] tracking-[-0.035em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
              {unlocked ? 'Bereit für den nächsten Schritt' : 'Deine ersten 4 Videos warten'}<span className="text-brand not-italic">{unlocked ? '?' : '.'}</span>
            </h2>
            {unlocked ? (
              <>
                <p className="mt-5 text-[15px] sm:text-[17px] leading-[1.55] text-foreground/70 max-w-xl mx-auto">
                  Willst du die komplette Methodik täglich mit WladBot drillen? Teste LeaderOS 14 Tage kostenlos.
                </p>
                <a
                  href="https://leaderos.de/signup?trial=14"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
                >
                  LeaderOS 14 Tage kostenlos <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <div className="mt-8 max-w-xl mx-auto text-left">
                {/* Stack recap · everything on the table before the final ask */}
                <ul className="mb-7 space-y-2.5">
                  {STACK_RECAP.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-[14.5px] leading-[1.5] text-foreground/80">
                      <span className="mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center bg-[#BFFF00] text-[#0A0A0A]">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
                <OptInForm onUnlocked={unlock} idSuffix="-final" />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Cinema lightbox · one big player, next-rail for binge flow */}
      {lightbox && (
        <VideoLightbox
          video={lightbox}
          nextVideo={nextAfter(lightbox)}
          onNext={() => openVideo(nextAfter(lightbox))}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Sticky mobile CTA · persistent opt-in until unlocked, chrome-framed */}
      {!unlocked && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/15 px-4 py-3">
          <div className="fv-chrome-frame">
            <span className="fv-sheen" aria-hidden />
            <button
              onClick={scrollToOptIn}
              className="relative w-full inline-flex items-center justify-center gap-2 h-12 bg-[#BFFF00] text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em]"
            >
              <Lock size={14} strokeWidth={2.75} /> 4 Videos gratis freischalten <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
}

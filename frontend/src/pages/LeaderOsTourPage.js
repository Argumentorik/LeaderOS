/**
 * /leaderos · Scroll-Tour durch die App (KI-Coach + Videokurse).
 *
 * Aufbau und alle Scroll-Timings (useTransform-Arrays) stammen 1:1 aus der
 * Orbit-Vorlage (motion/react ≙ framer-motion 12). Inhalte, Bilder und Video
 * sind LeaderOS-eigen; nur belegte Aussagen (WLAD_CANON.md, Produkt).
 *
 * Ablauf (scrollYProgress des 600vh-Containers):
 *   0–0.08   Ellipse öffnet sich über dem Hero-Video
 *   0.08–0.15  Headline, Claims, CTA
 *   0.15–0.25  Karussell zoomt auf: 6 App-Bausteine, Scroll dreht weiter
 *   0.85–0.95  Karussell schrumpft zurück, 0.90–0.98 Text kehrt zurück
 * Danach: 3 Schritte (Check → Webinar → 14 Tage) und Footer.
 */
import { useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import OrbitImages from '../components/brand/OrbitImages';
import { ThreeStepPath } from '../components/brand/ThreeStepPath';
import { applyPageMeta } from '../lib/pageMeta';
import { capture } from '../lib/analytics';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260728_015819_1b3ec855-d586-4018-96c8-8bf90cada037.mp4';
const TRIAL_URL = 'https://leaderos.de/signup?trial=14&utm_source=leader-os&utm_medium=landing&utm_campaign=leaderos-tour';
const LOGIN_URL = 'https://leaderos.de/login';
const CHECK_URL = 'https://leadercheck.de?utm_source=leader-os&utm_medium=landing&utm_campaign=leaderos-tour';
const LIME = '#BFFF00';
const SERIF = "'Instrument Serif', serif";
const SANS = "'Manrope', sans-serif";
// Weißer Halo: schwarze Schrift bleibt lesbar, wenn ein Orbit-Kreis darunter läuft.
const HALO = { textShadow: '0 0 10px #fff, 0 0 4px #fff, 0 0 1px #fff' };

// Sechs App-Bausteine auf der Bahn. Reihenfolge = Reihenfolge im Fokus.
const ORBIT = [
  { src: '/wlad/wlad-portrait-640.jpg', label: 'Videokurse mit Wlad', sub: 'Seine Methode, Lektion für Lektion' },
  { src: '/wlad/wladbot3.0.webp', label: 'KI-Coach WladBot', sub: 'Antwortet mit Wlads Frameworks, 24/7' },
  { src: '/journal/topics/feedback.webp', label: 'Simulationen', sub: 'Schwierige Gespräche proben' },
  { src: '/journal/topics/presence.webp', label: 'Video-Analyse', sub: 'Score, 3 Stärken, 3 Hebel' },
  { src: '/journal/topics/negotiation.webp', label: 'Leadership Challengers', sub: 'KI-Interviews im Stil der Besten' },
  { src: '/journal/topics/sprint.webp', label: '30-Tage-Challenge', sub: 'Jeden Tag ein Schritt' },
];

const track = (event, props = {}) => capture(`leaderos_tour_${event}`, props);

function OrbitCard({ src, label, sub, focus }) {
  return (
    <div className="relative w-full h-full" style={{ containerType: 'inline-size' }}>
      <img src={src} alt="" draggable={false} className="orbit-image" loading="lazy" />
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 text-center rounded-full"
        style={{ bottom: '9%', opacity: focus, background: 'rgba(10,10,10,0.82)', padding: '2.2cqw 5cqw', whiteSpace: 'nowrap' }}
      >
        <div style={{ fontFamily: SERIF, fontSize: '6.2cqw', lineHeight: 1.05, color: '#fff' }}>{label}</div>
        <div style={{ fontFamily: SANS, fontSize: '2.8cqw', color: LIME, marginTop: '0.6cqw', fontWeight: 600, letterSpacing: '0.02em' }}>{sub}</div>
      </motion.div>
    </div>
  );
}

export default function LeaderOsTourPage() {
  const containerRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600&display=swap';
    document.head.appendChild(font);
    const restoreMeta = applyPageMeta({
      title: 'LeaderOS · Wlads Methode als App: KI-Coach, Videokurse, Training',
      description:
        'LeaderOS ist Wlad Jachtchenkos Methode als App: Videokurse, KI-Coach WladBot, Simulationen, ' +
        'Video-Analyse und die 30-Tage-Challenge. 15 Minuten am Tag. 14 Tage kostenlos testen.',
      url: 'https://leader-os.de/leaderos',
      image: 'https://leader-os.de/og-wlad.jpg',
    });
    track('view');
    return () => {
      if (wasDark) root.classList.add('dark');
      document.head.removeChild(font);
      restoreMeta?.();
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const rx = useTransform(scrollYProgress, [0, 0.08, 1], ['0%', '55%', '55%']);
  const ry = useTransform(scrollYProgress, [0, 0.08, 1], ['0%', '55%', '55%']);
  const clipPath = useMotionTemplate`ellipse(${rx} ${ry} at 50% 50%)`;

  const textOpacity = useTransform(scrollYProgress, [0.03, 0.08, 0.15, 0.22, 0.90, 0.98, 1], [0, 1, 1, 0, 0, 1, 1]);
  const textBlurVal = useTransform(scrollYProgress, [0.03, 0.08, 0.15, 0.22, 0.90, 0.98, 1], [15, 0, 0, 15, 15, 0, 0]);
  const filterText = useMotionTemplate`blur(${textBlurVal}px)`;
  const yElement = useTransform(scrollYProgress, [0.03, 0.08, 0.15, 0.22, 0.90, 0.98, 1], [20, 0, 0, 20, 20, 0, 0]);

  const targetRadius = 650;

  const orbitItemSize = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [80, 520, 520, 80, 80]);
  const orbitRx = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [330, targetRadius, targetRadius, 330, 330]);
  const orbitRy = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [140, targetRadius, targetRadius, 140, 140]);
  const orbitRotation = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [-15, 0, 0, -15, -15]);
  const orbitTx = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [0, -targetRadius, -targetRadius, 0, 0]);
  const focusStrength = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [0, 1, 1, 0, 0]);

  const orbitProgress = useMotionValue(0);
  const prevScroll = useRef(0);

  useAnimationFrame((time, delta) => {
    const pos = scrollYProgress.get();
    const scrollDelta = pos - prevScroll.current;
    prevScroll.current = pos;

    let frameSpeed = 0;
    if (pos > 0.15 && pos < 0.85) {
      frameSpeed = scrollDelta * 200;
    } else if (!reduce) {
      frameSpeed = (delta / 1000) * 2.5;
    }
    orbitProgress.set(orbitProgress.get() + frameSpeed);
  });

  const items = ORBIT.map((o) => <OrbitCard key={o.label} {...o} focus={focusStrength} />);

  return (
    <div className="bg-white antialiased" style={{ fontFamily: SANS }}>
      <div ref={containerRef} className="relative w-full h-[600vh] bg-black">
        <div className="sticky top-0 w-full h-screen overflow-hidden text-white">
          <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover z-0" aria-hidden="true">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/10 z-0" />

          <div className="absolute z-10 w-[80vw]" style={{ left: '3vw', bottom: '3vw' }}>
            <div className="mb-2 ml-1 font-mono text-[11px] md:text-[13px] uppercase tracking-[0.3em] text-white/85">by Wlad Jachtchenko · KI-Coach + Videokurse</div>
            <svg viewBox="0 10 350 72" className="w-full h-auto drop-shadow-2xl overflow-visible" preserveAspectRatio="xMinYMax meet" role="img" aria-label="LeaderOS">
              <text x="-3" y="80" fontFamily={SERIF} fill={LIME} className="select-none">
                <tspan fontSize="90">LeaderOS</tspan>
              </text>
            </svg>
          </div>

          <motion.div
            className="absolute z-20 flex items-center justify-center overflow-hidden"
            style={{ clipPath, rotate: -15, width: '150vw', height: '150vh', left: '-25vw', top: '-25vh' }}
          >
            <div className="absolute inset-0 bg-white" />
            <div className="relative flex flex-col items-center justify-center" style={{ width: '100vw', height: '100vh', transform: 'rotate(15deg)' }}>
              <motion.div className="w-[90vw] max-w-[1200px] aspect-square relative z-0">
                <OrbitImages
                  items={items}
                  shape="ellipse"
                  direction="normal"
                  duration={40}
                  fill
                  showPath={false}
                  responsive
                  baseWidth={800}
                  progressOverride={orbitProgress}
                  radiusXOverride={orbitRx}
                  radiusYOverride={orbitRy}
                  itemSizeOverride={orbitItemSize}
                  rotationOverride={orbitRotation}
                  translateXOverride={orbitTx}
                  focusStrength={focusStrength}
                />
              </motion.div>
            </div>
          </motion.div>

          <div className="absolute inset-0 z-[60] pointer-events-none">
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <motion.div
                className="flex flex-col items-center whitespace-nowrap pointer-events-auto"
                style={{ filter: filterText, opacity: textOpacity, WebkitFontSmoothing: 'antialiased', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)', ...HALO }}
              >
                <h1 className="flex items-baseline text-black leading-none mb-1 font-normal">
                  <span className="text-[38px] md:text-[55px] italic tracking-tight" style={{ fontFamily: SERIF }}>F</span>
                  <span className="text-[38px] md:text-[55px] tracking-tight" style={{ fontFamily: SERIF }}>ühren wie die Besten</span>
                </h1>
                <span className="text-[22px] md:text-[36px] tracking-tight text-black mt-[-5px]">jeden Tag, 15 Minuten</span>
              </motion.div>
            </div>

            <motion.div
              className="hidden md:flex absolute top-32 right-[214px] flex-col items-start text-left pointer-events-auto cursor-text"
              style={{ y: yElement, filter: filterText, opacity: textOpacity, ...HALO }}
            >
              <span className="text-[40px] leading-none mb-3 text-black" style={{ fontFamily: SERIF }}>2026</span>
              <span className="text-[16px] uppercase tracking-widest text-black leading-[20px] text-left" style={{ fontFamily: SERIF }}>
                KI-Coach<br />+ Videokurse
              </span>
            </motion.div>

            <motion.div
              className="hidden md:flex absolute bottom-16 left-16 flex-col items-start text-black pointer-events-auto cursor-text"
              style={{ y: yElement, filter: filterText, opacity: textOpacity, ...HALO }}
            >
              <span className="text-[40px] leading-none mb-1 text-black" style={{ fontFamily: SERIF }}>11</span>
              <span className="text-[16px] uppercase tracking-widest text-black" style={{ fontFamily: SERIF }}>Frameworks</span>
            </motion.div>

            <div className="absolute bottom-10 md:bottom-16 right-[6vw] md:right-[10vw] flex flex-col items-start z-10 pointer-events-auto">
              <motion.p
                className="text-[14px] md:text-[16px] uppercase tracking-widest text-black leading-[20px] mb-6 text-left w-[240px] cursor-text"
                style={{ y: yElement, filter: filterText, opacity: textOpacity, fontFamily: SERIF, ...HALO }}
              >
                Wlads Methode als App: Videokurse, KI-Coach, Simulationen, Video-Analyse. 400.000+ Klienten seit 2007.
              </motion.p>
              <motion.div className="flex gap-0 pointer-events-auto items-center" style={{ y: yElement, filter: filterText, opacity: textOpacity }}>
                <a
                  href={TRIAL_URL}
                  onClick={() => track('cta_click', { where: 'hero' })}
                  className="bg-black hover:bg-black/90 transition-colors text-white rounded-[40px] px-8 py-3.5 tracking-[0.1em] uppercase text-[12px] md:text-[14px] z-10"
                  style={{ fontFamily: SERIF }}
                >
                  14 Tage kostenlos
                </a>
                <a
                  href={TRIAL_URL}
                  onClick={() => track('cta_click', { where: 'hero-arrow' })}
                  aria-label="14 Tage kostenlos testen"
                  className="bg-black hover:bg-black/90 transition-colors w-[46px] h-[46px] flex items-center justify-center rounded-[50%] -ml-2 z-0"
                  style={{ color: LIME }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </motion.div>
              <motion.a
                href={CHECK_URL}
                onClick={() => track('check_click', { where: 'hero' })}
                className="mt-3 text-[12px] text-black/70 underline underline-offset-4 hover:text-black"
                style={{ y: yElement, filter: filterText, opacity: textOpacity }}
              >
                Erst den Leader-Check machen (10 Min.) →
              </motion.a>
            </div>
          </div>

          <motion.header
            className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-start z-[100] pointer-events-none"
            style={{ opacity: textOpacity, filter: filterText }}
          >
            <a href="/" className="flex items-start text-black select-none leading-none pointer-events-auto" style={{ fontFamily: SERIF, WebkitFontSmoothing: 'antialiased' }}>
              <span style={{ fontSize: '40px' }}>LeaderOS</span>
              <span style={{ fontSize: '14px', marginLeft: '4px', marginTop: '4px', color: '#5A7700' }}>●</span>
            </a>
            <a
              href={LOGIN_URL}
              onClick={() => track('login_click')}
              className="group relative flex items-center justify-center w-[72px] h-[44px] hover:scale-105 transition-transform duration-300 cursor-pointer pointer-events-auto"
            >
              <div className="absolute inset-0 bg-black rounded-[50%]" style={{ transform: 'rotate(-15deg)' }} />
              <span className="relative z-10 text-white text-[12px] uppercase tracking-[0.12em]" style={{ fontFamily: SERIF }}>Login</span>
            </a>
          </motion.header>
        </div>
      </div>

      {/* Inhalt des Karussells auch als Text (Screenreader, Suchmaschinen) */}
      <ul className="sr-only">
        {ORBIT.map((o) => <li key={o.label}>{o.label}: {o.sub}</li>)}
      </ul>

      <ThreeStepPath
        tone="light"
        checkUrl={CHECK_URL}
        trialUrl={TRIAL_URL}
        title="So startest du mit LeaderOS."
        onTrack={(e, p) => track(e, p)}
      />
      <footer className="text-center pb-10 text-[12px] text-black/60">
        <a href="/impressum" className="hover:underline">Impressum</a> · <a href="/datenschutz" className="hover:underline">Datenschutz</a> · <a href="/" className="hover:underline">leader-os.de</a>
      </footer>
    </div>
  );
}

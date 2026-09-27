import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyPageMeta } from '../lib/pageMeta';
import { FrameworksActivation } from '../components/landing/FrameworksActivation';

/**
 * FrameworksPage · /frameworks · Vollbild-Hero mit acht Frameworks, darunter
 * die Zugangscode-Aktivierung.
 *
 * Hero-Mechanik 1:1 nach dem „Kollektiva"-Brief: gestapelte Vollbild-
 * Hintergründe mit 700-ms-Crossfade, statische H1 links, wechselnde
 * Beschreibung rechts (Remount + 500-ms-fadeIn), Avatar-Reihe mit
 * Punkt-Indikator, Meta-Footer mit Name · Rolle · statischer Zeile · Link.
 * Geist 300/400/500, weiß auf Bild, weiche Vignette, keine Karten, keine
 * Pills, kein Glow.
 *
 * Zwei bewusste Abweichungen im Hero, beide aus der Ehrlichkeitsregel
 * (docs/gtm/WEBINAR_FUNNEL.md):
 *
 *   1. Die acht „Personen" sind Wlads acht Kern-Frameworks — Name,
 *      Quelle (Buch/Keynote) und Definition wörtlich aus
 *      docs/gtm/WLAD_CANON.md. Wir haben keine freigegebenen
 *      Kundenstimmen, und erfundene Gesichter mit erfundenen Zitaten
 *      gehen nicht raus. Sobald echte Stimmen vorliegen, ist SLIDES das
 *      einzige, was sich ändert.
 *   2. Hintergründe sind unsere eigenen CloudFront-Clips (dieselben wie
 *      /social und der Webinar-Hero), nicht fremde Porträts. Die runden
 *      Avatare tragen deshalb Ziffern statt Fotos — mono BIB-Code,
 *      unsere Signatur aus frontend/DESIGN.md.
 *
 * Nur der aktive Clip spielt; die anderen sieben stehen pausiert mit
 * Poster, damit acht Videos kein Handy heißlaufen lassen.
 *
 * Darunter, außerhalb des Hero-Viewports: FrameworksActivation — vorher
 * endete die Seite im Hero, ohne eigenes Conversion-Ziel (nur ein Textlink
 * zum Webinar). Jetzt reserviert der Besuch einen persönlichen Zugangscode
 * und kann optional das Webinar dazu buchen.
 */

const CF = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
const POSTER = '/wlad/wlad-portrait.jpg';

const SLIDES = [
  {
    name: 'SEXIER-Modell', role: 'Aus „Weiße Rhetorik"',
    video: CF + 'hf_20260707_004833_4cc93fa3-27f5-4cec-b1b2-0b4fb073c13a.mp4',
    text: 'Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal. Sechs Schritte, jeder Pflicht für ein vollständiges Argument — inklusive der Widerlegung der Gegenargumente, bevor jemand sie ausspricht.',
  },
  {
    name: 'Feedbackformel', role: 'Wlads Kern-Framework',
    video: CF + 'hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
    text: 'Beobachtung + Wirkung + Wunsch. Nie „Du bist…", immer „Ich habe beobachtet, dass…". Das Skript für jedes schwierige Gespräch — drei Sätze, mehr braucht es nicht, mehr macht es kaputt.',
  },
  {
    name: 'Die 5 Rollen einer Führungskraft', role: 'Aus dem gleichnamigen Buch',
    video: CF + 'hf_20260407_080531_1fe9b14c-9396-4b78-9372-42f4ddbd74c7.mp4',
    text: 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser. Die meisten Führungsprobleme entstehen, weil jemand in der falschen Rolle antwortet — als Problemlöser auf eine Psychologen-Frage.',
  },
  {
    name: '10 Stufen des Zuhörens', role: 'Aus „Weiße Rhetorik"',
    video: CF + 'hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4',
    text: 'Von Stufe 1, nicht zuhören, bis Stufe 10, Stille als Zuhören. 80 % aller Führungskräfte bleiben auf Stufe 2 stehen: auf die eigene Antwort warten. Dazwischen liegen empathisches, strukturelles, systemisches und generatives Zuhören.',
  },
  {
    name: '3 Säulen der Überzeugung', role: 'Argumentorik',
    video: CF + 'hf_20260330_153826_e9005cf7-a1c7-4c7d-886f-fea22d644a9c.mp4',
    text: 'Logos ist die Logik. Ethos die Glaubwürdigkeit. Pathos die Emotion. Wer nur Logos bringt, hat recht — und überzeugt trotzdem niemanden.',
  },
  {
    name: '4-Farben-Modell', role: 'Wlads Methodik',
    video: CF + 'hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4',
    text: 'Rot will das Ergebnis. Gelb will die Beziehung. Grün will die Sicherheit. Blau will die Daten. Wer immer gleich argumentiert, überzeugt bestenfalls ein Viertel des Raums.',
  },
  {
    name: 'Dunkle Rhetorik', role: 'Aus „Dunkle Rhetorik"',
    video: CF + 'hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
    text: 'Strohmann, Ad Hominem, Whataboutism, Scheinargument, Sprachtrick — erkennen und kontern. Die Antwort ist immer dieselbe: hart in der Sache, weich zur Person.',
  },
  {
    name: 'Charisma-Code', role: 'Keynote-Thema',
    video: CF + 'hf_20260707_004919_5e1b7e08-d723-4ecb-8afe-d613d730984c.mp4',
    text: 'Präsenz · Wärme · Kompetenz. Drei Signale, die in Sekunden entscheiden, ob ein Raum jemandem folgt — und jedes davon ist trainierbar.',
  },
];

export default function FrameworksPage() {
  const [active, setActive] = useState(0);
  const videos = useRef([]);
  const slide = SLIDES[active];

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');
    const restoreMeta = applyPageMeta({
      title: 'Die Methodik · acht Frameworks von Wlad Jachtchenko · LeaderOS',
      description: 'SEXIER, Feedbackformel, die 5 Rollen, 10 Stufen des Zuhörens, 3 Säulen, 4 Farben, Dunkle Rhetorik, Charisma-Code — die Frameworks, mit denen LeaderOS Führung täglich trainierbar macht.',
      url: 'https://leader-os.de/frameworks',
      image: 'https://leader-os.de/og-wlad.jpg',
    });
    return () => { restoreMeta(); if (!wasDark) root.classList.remove('dark'); };
  }, []);

  // Nur der aktive Clip läuft. Fehler (Autoplay-Sperre, Netz) sind egal —
  // das Poster steht immer darunter.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    });
  }, [active]);

  return (
    <>
    <section className="relative h-screen w-full overflow-hidden font-geist text-white bg-[#0A0A0A]" data-testid="frameworks-hero">
      {/* Gestapelte Hintergründe · nur der aktive Index sichtbar */}
      {SLIDES.map((s, i) => (
        <video
          key={s.name}
          ref={(el) => { videos.current[i] = el; }}
          src={s.video}
          poster={POSTER}
          muted
          loop
          playsInline
          preload={i === active ? 'auto' : 'metadata'}
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${i === active ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}

      {/* Weiche Vignette */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/25" />

      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-6 pt-10 sm:px-10 sm:pb-8 sm:pt-14 lg:px-16">
        {/* Oben · statische H1 links, wechselnde Beschreibung rechts */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-16">
          {/* font-geist auch direkt auf der H1: index.css setzt h1–h6 global auf Outfit. */}
          <h1 className="font-geist max-w-xl text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
            LeaderOS ist die Methodik, mit der du jeden{' '}Tag führst
          </h1>
          <p
            key={slide.name}
            className="max-w-xs text-sm font-medium leading-relaxed text-white/80 animate-[kFadeIn_0.5s_ease] sm:text-base md:pt-2"
          >
            {slide.text}
          </p>
        </div>

        {/* Unten · Avatar-Reihe + Meta-Footer */}
        <div className="flex flex-col gap-8">
          <div className="flex items-end gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:overflow-visible sm:pb-0">
            {SLIDES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Zeige ${s.name}`}
                aria-pressed={i === active}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <span aria-hidden className={`h-1 w-1 rounded-full bg-white transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-0'}`} />
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-black/30 font-mono text-[11px] font-medium tracking-[0.12em] text-white backdrop-blur-sm sm:h-14 sm:w-14 sm:text-[13px]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 text-sm font-medium">
            <span key={slide.name} className="text-white animate-[kFadeIn_0.5s_ease]">{slide.name}</span>
            <span key={slide.role} className="hidden text-white/70 sm:inline">{slide.role}</span>
            <span className="hidden text-white/70 md:inline">Seit 2007 im Coaching · 400.000+ Klienten</span>
            <Link to="/webinar" className="underline underline-offset-4 transition-colors hover:text-white/70">
              Live-Webinar
            </Link>
          </div>
        </div>
      </div>
    </section>
    <FrameworksActivation />
    </>
  );
}

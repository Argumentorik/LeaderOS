import { useEffect, useState } from 'react';
import { WladMark } from '../brand/WladMark';

/**
 * CinematicHero · der Hero der Webinar-Seite (/webinar).
 *
 * Ein Bild, eine Zeile, ein Formular. Wlad als Vollbild-Video mit Ink-Scrim,
 * die Headline ins Bild gebrannt (Anton, Versalien, Lime-Punkt), darunter
 * alles, was eine Anzeige verspricht — Termin, Dauer, 0 € — und der Beleg
 * aus dem Kanon. Das ist die Athletic-Editorial-DNA aus frontend/DESIGN.md:
 * Fotografie spricht, das Chrome hält sich zurück.
 *
 * Zwei Layouts, ein Inhalt:
 *
 *   Desktop (≥ 900 px) · zwei Spalten. Links die Kopie, rechts das weiße
 *   Formular-Panel — das Formular steht im ersten Viewport, nicht darunter.
 *   Auf einer Lead-Seite ist das der größte einzelne Hebel.
 *
 *   Mobil (< 900 px) · ein Vollbild-Screen mit CTA in Daumenbreite, das
 *   Formular-Panel direkt darunter, eine Wischbewegung entfernt.
 *
 * Kein zweiter Screen, keine Geräterahmen: Wer die Headline dreimal liest,
 * hat noch nicht erfahren, wann das Webinar ist.
 *
 * Video liegt auf demselben CloudFront-Konto wie die übrigen Assets; bei
 * Ladefehler fällt die Fläche auf das Wlad-Porträt zurück. Animationen
 * respektieren prefers-reduced-motion über die .ze-Regel in index.css.
 * Inline-Styles, damit die Werte nachprüfbar bleiben; keine neue Abhängigkeit.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const HELV = 'Helvetica, "Helvetica Neue", Arial, sans-serif';
// Fallbacks bewusst schmal (Arial Narrow, Impact): während des Font-Swaps
// bleibt die Headline so dreizeilig statt kurz vierzeilig zu flackern.
const ANTON = "'Anton', 'Arial Narrow', Impact, 'Helvetica Neue', sans-serif";
const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';
const LIME = '#BFFF00';
const INK = '#0A0A0A';

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260707_004833_4cc93fa3-27f5-4cec-b1b2-0b4fb073c13a.mp4';
const POSTER = '/wlad/wlad-portrait.jpg';

const HEADLINE = [['Führe'], ['besser.'], ['Jeden Tag', '.']];
const SUB = 'Mit Wlad Jachtchenko: der Charisma-Code, das Leadership-Betriebssystem und ein echter Live-Case — mit deinen Fragen im Q&A.';
const FACTS = [['Termin', '15. OKT'], ['Dauer', '90 MIN'], ['Teilnahme', '0 €']];
const PROOF = '400.000+ Klienten · 3× SPIEGEL-Bestseller';

/** Inline-Kurzschreibweise für die Keyframes aus index.css (Name, Dauer, Delay). */
const ze = (name, dur, delay) => ({ animation: `${name} ${dur}s ${EASE} ${delay}s both` });

const useMedia = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

/** <video> mit Porträt-Fallback: Ladefehler → Bild, nie eine leere Fläche. */
const SafeVideo = ({ style }) => {
  const [failed, setFailed] = useState(false);
  const base = {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    filter: 'saturate(0.85) contrast(1.05)', ...style,
  };
  if (failed) return <img src={POSTER} alt="" aria-hidden style={base} />;
  return (
    <video
      src={VIDEO}
      poster={POSTER}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden
      onError={() => setFailed(true)}
      style={base}
    />
  );
};

/** Mono-BIB-Code · die typografische Metadaten-Marke aus DESIGN.md. */
const Bib = ({ children, style }) => (
  <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', ...style }}>
    {children}
  </span>
);

const Headline = ({ className, style, delay = 0.22 }) => (
  <h1
    className={className}
    style={{
      margin: 0, textTransform: 'uppercase', fontFamily: ANTON, fontWeight: 900, lineHeight: 0.9,
      letterSpacing: 0.5, color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.45)', ...style,
    }}
  >
    {HEADLINE.map(([line, dot], i) => (
      <span key={line} style={{ display: 'block', overflow: 'clip', overflowClipMargin: '0.14em' }}>
        <span className="ze" style={{ display: 'block', ...ze('zeRise', 0.9, delay + i * 0.11) }}>
          {line}{dot && <span style={{ color: LIME }}>{dot}</span>}
        </span>
      </span>
    ))}
  </h1>
);

const Facts = ({ valueSize, delay }) => (
  <div
    className="ze"
    style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, auto)', justifyContent: 'start', columnGap: 0,
      paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', ...ze('zeFadeUp', 0.85, delay),
    }}
  >
    {FACTS.map(([label, value], i) => (
      <div key={label} style={{ paddingRight: 22, paddingLeft: i ? 22 : 0, borderLeft: i ? '1px solid rgba(255,255,255,0.18)' : 0 }}>
        <Bib style={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>{label}</Bib>
        <div style={{ fontFamily: ANTON, fontSize: valueSize, lineHeight: 1.05, marginTop: 3, whiteSpace: 'nowrap', color: '#fff' }}>{value}</div>
      </div>
    ))}
  </div>
);

const Scrim = ({ background }) => (
  <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background }} />
);

/* ── Desktop · Kopie links, Formular rechts, beides im ersten Viewport ── */

const DesktopHero = ({ formSlot }) => (
  <div style={{ position: 'relative', overflow: 'hidden', background: INK, color: '#fff' }}>
    <SafeVideo style={{ objectPosition: '54% 14%' }} />
    <Scrim
      background={
        'linear-gradient(90deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.90) 30%, rgba(10,10,10,0.45) 52%, rgba(10,10,10,0.30) 72%, rgba(10,10,10,0.55) 100%), ' +
        'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.6) 14%, transparent 36%), ' +
        'linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, transparent 26%)'
      }
    />

    <div
      style={{
        // 96 px oben: der transparente Header der Seite liegt fixiert über
        // dem Hero (64 px) — die Kopie darf nicht darunter laufen.
        position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '96px 40px 64px',
        minHeight: 'min(100svh, 920px)',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 440px', columnGap: 'clamp(48px, 9vw, 160px)', alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <p className="ze" style={{ margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 10, ...ze('zeFadeUp', 0.8, 0.12) }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: LIME, boxShadow: '0 0 0 3px rgba(191,255,0,0.25)' }} />
          <Bib style={{ color: LIME, fontSize: 10.5 }}>Kostenloses Live-Webinar · Do 15. Oktober 2026 · 10:00 Uhr</Bib>
        </p>

        <Headline style={{ fontSize: 'clamp(72px, 8.4vw, 132px)', lineHeight: 0.88 }} />

        <p
          className="ze"
          style={{
            margin: '26px 0 0', maxWidth: 540, fontFamily: HELV, fontSize: 19, lineHeight: 1.5,
            color: 'rgba(255,255,255,0.86)', ...ze('zeFadeUp', 0.85, 0.6),
          }}
        >
          {SUB}
        </p>

        <div style={{ marginTop: 30, maxWidth: 520 }}>
          <Facts valueSize={34} delay={0.75} />
        </div>

        <p className="ze" style={{ margin: '22px 0 0', ...ze('zeFadeUp', 0.8, 0.95) }}>
          <Bib style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em' }}>{PROOF} · seit 2007</Bib>
        </p>
      </div>

      <div
        className="ze"
        data-testid="webinar-hero-panel"
        style={{
          background: '#fff', color: '#111111', borderRadius: 28, padding: '28px 30px 30px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
          ...ze('zeCardReveal', 1.0, 0.5),
        }}
      >
        {formSlot}
      </div>
    </div>
  </div>
);

/* ── Mobil · ein Screen, alles im ersten Viewport, Formular darunter ──── */

const MobileHero = ({ onCta }) => (
  <div
    data-testid="webinar-mobile-hero"
    style={{
      position: 'relative', overflow: 'hidden', background: INK, color: '#fff',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      // Header darüber ist ~64 px; der Hero füllt den Rest des ersten Viewports.
      minHeight: 'max(600px, calc(100svh - 64px))',
    }}
  >
    {/* Bild: Wlad, Gesicht im oberen Drittel, Kopie brennt unten ins Bild. */}
    <SafeVideo style={{ objectPosition: '50% 18%' }} />
    <Scrim
      background={
        'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.94) 24%, rgba(10,10,10,0.62) 46%, rgba(10,10,10,0.08) 70%, transparent 100%), ' +
        'linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, transparent 28%)'
      }
    />

    {/* Kopfzeile im Fluss, nicht absolut: auf 667-px-Displays wächst der
        Hero dann einfach, statt dass die Kopie in die Kopfzeile läuft. */}
    <div style={{ position: 'relative', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="ze" style={ze('zeBloom', 0.8, 0.1)}><WladMark size={26} /></div>
      <div className="ze" style={{ display: 'flex', alignItems: 'center', gap: 8, ...ze('zeFadeDown', 0.7, 0.2) }}>
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: LIME, boxShadow: '0 0 0 3px rgba(191,255,0,0.25)' }} />
        <Bib style={{ color: 'rgba(255,255,255,0.85)' }}>10:00 Uhr · Online</Bib>
      </div>
    </div>

    {/* Luft fürs Gesicht: 80–140 px Bild zwischen Kopfzeile und Kopie (.ze-mobile-air, index.css). */}
    <div aria-hidden className="ze-mobile-air" />

    <div style={{ position: 'relative', padding: '0 20px 20px' }}>
      <p className="ze" style={{ margin: '0 0 12px', ...ze('zeFadeUp', 0.8, 0.15) }}>
        <Bib style={{ color: LIME }}>Kostenlos · Live · Keine Aufzeichnung</Bib>
      </p>

      <Headline className="ze-mobile-h1" />

      <p
        className="ze"
        style={{
          margin: '12px 0 0', maxWidth: 360, fontFamily: HELV, fontSize: 15, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.84)', ...ze('zeFadeUp', 0.85, 0.6),
        }}
      >
        {SUB}
      </p>

      <div style={{ marginTop: 16 }}>
        <Facts valueSize={26} delay={0.75} />
      </div>

      <button
        type="button"
        onClick={onCta}
        className="ze"
        data-testid="webinar-hero-cta"
        style={{
          marginTop: 20, width: '100%', height: 58, border: 0, borderRadius: 999, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 0 24px',
          background: LIME, color: INK, boxShadow: '0 12px 32px rgba(191,255,0,0.28)',
          fontFamily: HELV, fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          ...ze('zePillPop', 0.75, 0.95),
        }}
      >
        <span>Platz sichern</span>
        <span style={{ width: 46, height: 46, borderRadius: 999, background: INK, display: 'grid', placeItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>

      <p className="ze" style={{ margin: '14px 0 0', textAlign: 'center', ...ze('zeFadeUp', 0.8, 1.1) }}>
        <Bib style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>{PROOF}</Bib>
      </p>
    </div>
  </div>
);

/* ── Export ────────────────────────────────────────────────────────────── */

export const CinematicHero = ({ onCta, formSlot }) => {
  const desktop = useMedia('(min-width: 900px)');

  if (desktop) {
    return (
      <section data-testid="webinar-cinematic-hero">
        <DesktopHero formSlot={formSlot} />
      </section>
    );
  }

  // Mobil: Ink-Canvas — Hero und weißes Formular-Panel sind die einzigen
  // zwei Flächen, nichts dazwischen lenkt ab.
  return (
    <section data-testid="webinar-cinematic-hero" style={{ background: INK }}>
      <MobileHero onCta={onCta} />
      <div style={{ padding: '16px 12px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '22px 18px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
          {formSlot}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;

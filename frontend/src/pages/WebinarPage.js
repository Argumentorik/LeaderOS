import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applyPageMeta } from '../lib/pageMeta';
import { isValidEmail } from '../features/newsletter/lib/newsletterClient';
import {
  WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback,
} from '../lib/brandAssets';
import { WladMark } from '../components/brand/WladMark';
import { BookShelf } from '../components/brand/BookShelf';
import { LogoWall } from '../components/brand/LogoWall';
import { trackMeta, metaEventId } from '../lib/metaPixel';
import { trackLinkedInLead } from '../lib/linkedinInsight';
import {
  AGENDA, FAQ, WEBINAR_CAMPAIGN, WEBINAR_DATE_COMPACT, WEBINAR_DATE_LABEL, WEBINAR_DATE_SHORT, WEBINAR_END, WEBINAR_HERO, WEBINAR_SEO,
  WEBINAR_START, WEBINAR_TIME_LABEL, WEBINAR_TS,
} from '../data/webinarEvent';

/**
 * WebinarPage · /webinar · die Conversion-Seite der Ads.
 *
 * 2026-10 Rebuild in der Athletic-Editorial-DNA (frontend/DESIGN.md):
 * Fotografie spricht, das Chrome hält sich zurück. Outfit-900-Kursiv-
 * Lockups mit Lime-Punkt, Hairlines statt Karten, Mono-BIB-Codes statt
 * Icons, Pill-CTAs, echte Fotos aus /journal/topics und das echte Wlad-
 * Porträt. Keine Glas-Fenster, kein Flip-Countdown, kein Mauslicht, keine
 * pulsierenden Buttons, keine Blur-Reveals.
 *
 * Das Formular steht auf jeder Breite im ersten Viewport: mobil direkt
 * unter der Headline im Hero, auf dem Desktop links neben Wlad.
 *
 * Lead-Erfassung mit Netz und doppeltem Boden (RegisterForm):
 *   1. POST /api/webinar/register (FastAPI auf Emergent) – schreibt den
 *      Lead, schickt Bestätigung + Erinnerungen, meldet an Meta CAPI.
 *   2. Antwortet das Backend nicht oder ohne die Route (404 solange der
 *      Emergent-Deploy hinterherhinkt), geht die Adresse an
 *      /api/newsletter/subscribe – die Supabase-Edge-Function, unabhängig
 *      vom Emergent-Backend – mit campaign=webinar-2026-11-26. Kein Lead
 *      geht verloren; die Danke-Seite verspricht in dem Fall keine
 *      Erinnerungs-Mails (?v=f).
 *
 * Honesty rules unverändert (docs/gtm/WEBINAR_FUNNEL.md, WLAD_CANON.md):
 * nur verifizierte Zahlen, keine erfundenen Zitate, keine Fake-Scarcity.
 * Termin, Agenda und FAQ kommen aus data/webinarEvent.js – derselben
 * Quelle wie das Build-Prerendering (scripts/prerender-landings.mjs).
 */

const LIME = '#BFFF00';

// Termin nur aus src/data/webinarEvent.js (eine Quelle für Seite, Prerender, Danke-Seite).
const DATE_LINE = `${WEBINAR_DATE_LABEL} · ${WEBINAR_TIME_LABEL} · Live · Online`;
const DATE_SHORT = WEBINAR_DATE_SHORT;

/** Inline-Kurzschreibweise für die Keyframes aus index.css (Name, Dauer, Delay). */
const ze = (name, dur, delay) => ({ animation: `${name} ${dur}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both` });

// Headline als fester Vier-Zeilen-Block (Nike-Lockup), spiegelt WEBINAR_HERO.
const HERO_LINES = ['Trainiere', 'Führung.', 'Nicht nur', 'Wissen'];
const HERO_SUB_SHORT = '90 Minuten live mit Wlad Jachtchenko: wie Führung täglich trainierbar wird.';
const HERO_SUB_LONG =
  'Du weißt, wie gute Führung geht. Du kommst nur nicht dazu. Wlad Jachtchenko zeigt in 90 Minuten live, wie du sie täglich trainierst.';

const FACTS = [['Termin', WEBINAR_DATE_COMPACT], ['Start', '10:00'], ['Dauer', '90 Min'], ['Teilnahme', '0 €']];

// Verifiziertes Set (docs/gtm/WEBINAR_FUNNEL.md). Keine weiteren Zahlen.
const PROOF = [
  ['400.000+', 'Klienten trainiert', null],
  ['20+', 'Länder', null],
  ['3×', 'SPIEGEL-Bestseller', null],
  ['4,9', 'Trustpilot · 388 Bewertungen', 'https://uk.trustpilot.com/review/argumentorik.com'],
  ['2007', 'im Coaching seit', null],
];

const REVIEWS = [
  ['Trustpilot', '4,9/5 · 388 Bewertungen', 'https://uk.trustpilot.com/review/argumentorik.com'],
  ['Greator', '4,7/5 · 995 Bewertungen', 'https://greator.com/coach/wlad-jachtchenko'],
];

const WEEK = [
  ['Mo', '„Diese Woche gebe ich endlich gutes Feedback."'],
  ['Di', 'Stress. Drei Meetings. Ein Konflikt. Feedback verschoben.'],
  ['Mi', 'Das schwierige Gespräch? „Nächste Woche wirklich."'],
  ['Do', 'Der Konflikt eskaliert. Jetzt ist es ein Krisengespräch.'],
  ['Fr', 'Vom letzten Seminar ist nichts mehr übrig außer den Folien.'],
];

const OLD_WAY = ['Seminar', 'Notizen', 'Alltag', 'Vergessen'];
const NEW_WAY = ['Täglich 15 Minuten', 'KI-Coach', 'Simulation', 'Feedback', 'Fortschritt'];

// Jedes Thema mit eigenem Bild: Journal-Fotografie, das Wlad-Porträt und
// der WladBot-Avatar. `pos` = object-position, `ink` = Avatar auf Ink.
const LEARN = [
  ['Schwierige Gespräche', 'Wie du Kritik äußerst, ohne Vertrauen zu verlieren: mit Skript statt Bauchgefühl.', '/journal/topics/feedback.webp', '50% 40%'],
  ['Der KI-Coach', 'Wie du mit WladBot jeden Tag 15 Minuten trainierst, an deinen echten Fällen.', 'wladbot', 'ink'],
  ['Simulationen', 'Führungssituationen durchspielen, bevor sie im echten Meeting passieren.', '/journal/topics/conflict.webp', '50% 35%'],
  ['Die 30-Tage-Challenge', 'Der Trainingsplan, der aus einem Vormittag Impuls eine tägliche Routine macht.', '/journal/topics/sprint.webp', '50% 50%'],
  ['Die Frameworks', 'Die Methoden aus der Arbeit mit 400.000+ Klienten, von SEXIER bis zur Feedbackformel.', '/journal/topics/listening.webp', '50% 30%'],
  ['Live-Q&A mit Wlad', 'Deine härteste Führungsfrage, ab 11:15 Uhr direkt von Wlad beantwortet.', 'wlad', '62% 12%'],
];

const STACK = [
  ['Live-Demonstration', 'Das komplette Leadership Operating System, live gezeigt. Kein Foliensatz.'],
  ['Der 30-Tage-Trainingsplan', 'Die Struktur der Challenge, mit der Führung zur täglichen Routine wird.'],
  ['Live-Q&A mit Wlad', 'Deine Fragen, live beantwortet. Ab 11:15 Uhr fester Teil der Agenda.'],
  ['Der kostenlose Leader-Check', 'Dein Führungsprofil in 10 Minuten: KI-Readiness, Rhetorik, EQ.'],
  ['Die 4-teilige Videoserie', '„Führung beginnt hier": schaltest du direkt nach der Anmeldung frei.'],
  ['Kalender + Erinnerungen', 'Kalender-Einladung per Mail, Erinnerung 24 Stunden und 1 Stunde vor dem Start.'],
];

const VIDEOS = [
  ['Warum die meisten Führungskräfte unsichtbar bleiben', '8 Min'],
  ['Natürliche Autorität, ohne lauter zu werden', '11 Min'],
  ['Weniger arbeiten, mehr bewirken', '9 Min'],
  ['Dein 30-Tage-Plan zur KI-nativen Führungskraft', '12 Min'],
];

const FRAMEWORKS = [
  ['SEXIER-Modell', 'Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal. Die sechsstufige Argumentations-Architektur für strittige Thesen.', '/journal/die-5-argumentations-levels-von-behauptung-bis-sexier'],
  ['Feedbackformel B·W·W', 'Beobachtung + Wirkung + Wunsch. Nie „Du bist…", immer „Ich habe beobachtet, dass…". Das Skript für jedes schwierige Gespräch.', '/journal/die-feedback-formel-bww'],
  ['10 Stufen des Zuhörens', 'Von Stufe 1 (nicht zuhören) bis Stufe 10 (Stille als Zuhören). Die meisten Führungskräfte hängen auf Stufe 2 fest: auf die eigene Antwort warten.', '/journal/die-10-stufen-des-zuhoerens-wlads-modell-erklaert'],
  ['Die 5 Rollen einer Führungskraft', 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser. Und warum die meisten eine der fünf systematisch weglassen.', '/journal/5-rollen-der-fuehrung-nach-wlad-jachtchenko'],
];

const LIVE_REASONS = [
  'Keine Aufzeichnung. Das Webinar ist bewusst live-only.',
  'Deine Fragen kommen dran, nicht die aus dem Skript.',
  'Ein echter Live-Case wird gemeinsam durchgearbeitet.',
  'Die Videoserie schaltest du als Teilnehmer direkt frei.',
];

/* ── Tracking + UTM ───────────────────────────────────────────────────── */

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'webinar', ...props }); } catch {}
  }
};

/** UTM-Parameter der Anzeige: beim ersten Aufruf aus der URL gemerkt, damit
 * sie auch nach Scrollen/Navigieren im SPA noch am Lead hängen. Landet in
 * `webinar_leads.utm` (routes/webinar.py), die Grundlage für CPL pro Ad. */
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
const UTM_STORE = 'lo_webinar_utm';
const captureUtm = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    const fresh = Object.fromEntries(UTM_KEYS.map((k) => [k, (q.get(`utm_${k}`) || '').slice(0, 120)]));
    if (Object.values(fresh).some(Boolean)) sessionStorage.setItem(UTM_STORE, JSON.stringify(fresh));
  } catch {}
};
const readUtm = () => {
  try { return JSON.parse(sessionStorage.getItem(UTM_STORE) || 'null'); } catch { return null; }
};

const daysLeft = () => Math.max(0, Math.ceil((WEBINAR_TS - Date.now()) / 86400000));
const daysLabel = (d) => (d === 0 ? 'Heute' : d === 1 ? 'Morgen' : `Noch ${d} Tage`);

/* ── Lead capture ─────────────────────────────────────────────────────── */

/** Primärweg: FastAPI (Mongo, Bestätigungsmail, Erinnerungen, Meta CAPI). */
const registerPrimary = async (payload) => {
  const res = await fetch('/api/webinar/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (res.status === 400 && data?.error === 'invalid_email') return 'invalid';
  return res.ok && data?.ok === true ? 'ok' : 'failed';
};

/** Fallback: Supabase-Edge-Function (vercel.json → newsletter-subscribe),
 * unabhängig vom Emergent-Backend. Speichert E-Mail, source und campaign;
 * der Lead ist damit identifizierbar, auch wenn die Webinar-Route fehlt. */
const registerFallback = async (email, referrer) => {
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'webinar-lp', campaign: WEBINAR_CAMPAIGN, referrer }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/** `inline`: Eingabe und Button nebeneinander ab 640 px. `onInk`: Variante
 * auf dunklem Grund (Hero, Schluss). `compact`: 44-px-Höhe für die Leiste. */
const RegisterForm = ({ idSuffix = '', inline = false, onInk = false, compact = false, label = 'Platz sichern' }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const valid = isValidEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    // Der Button ist nie ausgegraut: ein grauer CTA liest sich wie „geht
    // nicht". Ungültige Eingabe wird beim Absenden erklärt.
    if (!valid) { setState('invalid'); return; }
    setState('loading');
    track('webinar_register_submit', { form: idSuffix || 'default' });
    // Eine ID für Browser-Pixel UND Conversions API → Meta zählt den Lead einmal.
    const eventId = metaEventId();
    const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
    const trimmed = email.trim();

    let result;
    try {
      result = await registerPrimary({
        email: trimmed,
        source: 'webinar-lp',
        utm: readUtm(),
        meta_event_id: eventId,
        referrer,
        landing_path: typeof window !== 'undefined' ? window.location.pathname : null,
      });
    } catch {
      result = 'failed';
    }
    if (result === 'invalid') { setState('invalid'); return; }

    let via = 'api';
    if (result !== 'ok') {
      via = 'fallback';
      result = (await registerFallback(trimmed, referrer)) ? 'ok' : 'failed';
    }
    track('webinar_register_result', { ok: result === 'ok', via });

    if (result === 'ok') {
      trackMeta('Lead', { content_name: WEBINAR_CAMPAIGN, content_category: 'webinar' }, eventId);
      trackLinkedInLead();
      navigate(`/webinar/danke?email=${encodeURIComponent(trimmed)}${via === 'fallback' ? '&v=f' : ''}`);
      return;
    }
    setState('error');
  };

  const cls = ['wb-form', inline ? 'inline' : '', onInk ? 'onink' : '', compact ? 'compact' : ''].filter(Boolean).join(' ');

  return (
    <form onSubmit={submit} noValidate data-testid={`webinar-form${idSuffix}`} className={cls}>
      <div className="fields">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'invalid') setState('idle'); }}
          placeholder="Deine beste E-Mail-Adresse"
          aria-label="E-Mail-Adresse"
        />
        <button type="submit" disabled={state === 'loading'} className={`pill ${onInk ? 'lime' : 'ink'}`}>
          {state === 'loading' ? 'Wird reserviert …' : label}
          {state !== 'loading' && <span aria-hidden className="arrow">→</span>}
        </button>
      </div>
      {!compact && (
        <p className="note">
          <span className="short">Kostenlos · Live · Keine Aufzeichnung</span>
          <span className="long">Kostenlos · Live · Keine Aufzeichnung · Keine Kreditkarte</span>
          {state === 'invalid' && <span className="err" role="alert">Bitte eine gültige E-Mail-Adresse eingeben.</span>}
          {state === 'error' && <span className="err" role="alert">Das hat nicht geklappt. Bitte E-Mail prüfen und erneut senden.</span>}
        </p>
      )}
      {compact && state === 'invalid' && <p className="err" role="alert">Bitte eine gültige E-Mail-Adresse eingeben.</p>}
      {compact && state === 'error' && <p className="err" role="alert">Bitte E-Mail prüfen und erneut senden.</p>}
    </form>
  );
};

/* ── Bausteine ────────────────────────────────────────────────────────── */

const Dot = () => <span className="p">.</span>;

const Eyebrow = ({ children, light = false }) => (
  <p className={`eyebrow bib ${light ? 'light' : ''}`}>{children}</p>
);

/** Foto mit Mono-Bildunterschrift. Null Radius, null Schatten: das Foto ist die Karte. */
const Photo = ({ src, alt = '', pos = '50% 50%', tag, ratio, fallbacks, className = '' }) => (
  <figure className={`ph ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
    <img src={src} alt={alt} loading="lazy" decoding="async" style={{ objectPosition: pos }} onError={fallbacks ? withFallback(fallbacks) : undefined} />
    {tag && <figcaption className="bib tag">{tag}</figcaption>}
  </figure>
);

const Header = ({ onCta }) => {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`wb-head ${solid ? 'solid' : ''}`} data-testid="webinar-header">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="LeaderOS Startseite">
          <WladMark size={28} variant={solid ? 'solid' : 'outline'} />
          <span>Leader<span className="dot">·</span>OS</span>
        </Link>
        <div className="right">
          <span className="bib date">{DATE_SHORT}</span>
          <button type="button" onClick={onCta} className="pill ink cta">Platz sichern</button>
        </div>
      </div>
    </header>
  );
};

/** Leiste unten · erscheint, sobald das Hero-Formular aus dem Bild ist, und
 * verschwindet wieder, wenn das Schlussformular sichtbar wird. */
const StickyBar = ({ heroFormRef, finalRef, onCta }) => {
  const [heroOut, setHeroOut] = useState(false);
  const [finalIn, setFinalIn] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const a = heroFormRef.current;
    const b = finalRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.target === a) setHeroOut(!en.isIntersecting && en.boundingClientRect.top < 0);
        if (en.target === b) setFinalIn(en.isIntersecting);
      });
    }, { threshold: 0.05 });
    if (a) io.observe(a);
    if (b) io.observe(b);
    return () => io.disconnect();
  }, [heroFormRef, finalRef]);
  const on = heroOut && !finalIn;
  return (
    <div className={`wb-sticky ${on ? 'on' : ''}`} data-testid="webinar-sticky-cta" aria-hidden={!on}>
      <div className="wrap">
        <div className="txt">
          <p className="bib lime">Kostenloses Live-Webinar</p>
          <p className="bib mute">{DATE_SHORT}</p>
        </div>
        <div className="desk"><RegisterForm idSuffix="-sticky" inline compact /></div>
        <div className="mobile">
          <button type="button" onClick={onCta} className="pill ink full">Platz sichern · {WEBINAR_DATE_COMPACT}</button>
        </div>
      </div>
    </div>
  );
};

const Faq = () => {
  const [open, setOpen] = useState(0);
  return (
    <div className="wb-faq">
      {FAQ.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`q ${isOpen ? 'open' : ''}`}>
            <h3>
              <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`wb-faq-${i}`}>
                <span>{q}</span>
                <span aria-hidden className="x">+</span>
              </button>
            </h3>
            <div id={`wb-faq-${i}`} className="a" role="region">
              <div><p>{a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Seite ────────────────────────────────────────────────────────────── */

export default function WebinarPage() {
  const pageRef = useRef(null);
  const heroFormRef = useRef(null);
  const finalRef = useRef(null);
  const [days] = useState(daysLeft);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    captureUtm();
    track('webinar_view');
    trackMeta('ViewContent', { content_name: WEBINAR_CAMPAIGN, content_category: 'webinar' });

    const restoreMeta = applyPageMeta(WEBINAR_SEO);

    // Das Build-Prerendering (scripts/prerender-landings.mjs) liefert Event +
    // FAQPage bereits statisch im <head>. Nur bei reiner SPA-Navigation
    // (kein prerendertes Markup im Dokument) nachträglich injizieren, sonst
    // stünde jedes Schema doppelt.
    const prerendered = !!document.head.querySelector('script[type="application/ld+json"]')
      && document.head.innerHTML.includes('leader-os.de/webinar#event');
    if (prerendered) {
      return () => { restoreMeta(); if (wasDark) root.classList.add('dark'); };
    }

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Trainiere Führung. Nicht nur Wissen. · Das kostenlose LeaderOS Live-Webinar',
      startDate: WEBINAR_START,
      endDate: WEBINAR_END,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: 'https://leader-os.de/webinar' },
      image: ['https://leader-os.de/og-wlad.jpg'],
      description: 'Kostenloses Live-Webinar: das Leadership Operating System für Führungskräfte.',
      organizer: { '@type': 'Organization', name: 'LeaderOS', url: 'https://leader-os.de' },
      performer: { '@type': 'Person', name: 'Wlad Jachtchenko' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://leader-os.de/webinar', validFrom: '2026-07-04T00:00:00+02:00' },
    });
    document.head.appendChild(ld);

    const ldFaq = document.createElement('script');
    ldFaq.type = 'application/ld+json';
    ldFaq.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
    document.head.appendChild(ldFaq);

    return () => { restoreMeta(); ld.remove(); ldFaq.remove(); if (wasDark) root.classList.add('dark'); };
  }, []);

  // Ruhige Scroll-Reveals: einmal einblenden, kein Blur, kein Stagger-Glow.
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const els = Array.from(root.querySelectorAll('.rv'));
    if (typeof IntersectionObserver === 'undefined') { els.forEach((el) => el.classList.add('in')); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toFinal = () => {
    track('webinar_cta_click', { target: 'final' });
    finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={pageRef} className="wb" data-testid="webinar-page">
      <style>{CSS}</style>
      <Header onCta={toFinal} />

      <main id="main-content">
        {/* ── HERO · Wlad, Headline, Formular. Alles im ersten Viewport. ── */}
        <section className="wb-hero" data-testid="webinar-cinematic-hero">
          <img className="bg" src={WLAD_AVATAR} onError={withFallback(WLAD_AVATAR_FALLBACKS)} alt="" aria-hidden />
          <div className="scrim" aria-hidden />
          <div className="inner">
            <div className="air" aria-hidden />
            <p className="bib kicker ze" style={ze('zeFadeUp', 0.8, 0.1)}>
              <span className="led" aria-hidden />
              <span className="short">Live-Webinar · 26. Nov · 10 Uhr · 0 €</span>
              <span className="long">Kostenloses Live-Webinar · {DATE_LINE}</span>
            </p>
            <h1 className="disp" aria-label={`${WEBINAR_HERO.h1} ${WEBINAR_HERO.h1Accent}`}>
              {HERO_LINES.map((line, i) => (
                <span key={line} className="line" aria-hidden>
                  <span className="ze" style={ze('zeRise', 0.9, 0.18 + i * 0.1)}>{line}{i === HERO_LINES.length - 1 && <Dot />}</span>
                </span>
              ))}
            </h1>
            <p className="sub short ze" style={ze('zeFadeUp', 0.85, 0.55)}>{HERO_SUB_SHORT}</p>
            <p className="sub long ze" style={ze('zeFadeUp', 0.85, 0.55)}>{HERO_SUB_LONG}</p>
            <div ref={heroFormRef} className="formwrap ze" data-testid="webinar-form-block" style={ze('zeFadeUp', 0.85, 0.62)}>
              <RegisterForm idSuffix="-hero" inline onInk />
            </div>
            <div className="facts ze" style={ze('zeFadeUp', 0.85, 0.8)}>
              {FACTS.map(([k, v]) => (
                <div key={k}><span className="bib">{k}</span><b>{v}</b></div>
              ))}
              <div><span className="bib">Countdown</span><b>{daysLabel(days)}</b></div>
            </div>
          </div>
        </section>

        {/* ── BEWEIS · verifizierte Zahlen, Referenzen, Bewertungen ─────── */}
        <section className="wb-proof" aria-label="Belege">
          <div className="wrap">
            <ul className="nums">
              {PROOF.map(([v, l, href]) => (
                <li key={l} className="num rv">
                  <b>{v}<Dot /></b>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="bib">{l} ↗</a> : <span className="bib">{l}</span>}
                </li>
              ))}
            </ul>
          </div>
          <LogoWall tone="light" compact eyebrow="Führungskräfte dieser Unternehmen haben Wlads Trainings durchlaufen" />
          <div className="wrap">
            <p className="reviews">
              {REVIEWS.map(([name, meta, href]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="bib">
                  <b>{name}</b> {meta} ↗
                </a>
              ))}
            </p>
          </div>
        </section>

        {/* ── PROBLEM · die Woche, die jeder kennt ───────────────────────── */}
        <section className="sec wb-problem">
          <div className="wrap split">
            <Photo src="/journal/topics/solitude.webp" pos="50% 40%" tag="Fig. 01 · Der Alltag" className="rv" />
            <div>
              <Eyebrow>Das Problem</Eyebrow>
              <h2 className="disp h2 rv">Du weißt, wie Führung geht. Du kommst nur nicht dazu<Dot /></h2>
              <p className="lead rv">
                Feedback geben, Konflikte früh ansprechen, klar entscheiden: Du kennst die Theorie.
                Im Alltag passiert sie trotzdem selten, denn Wissen wird erst durch Training zu Verhalten.
                Die Woche unten kennst du vermutlich auswendig.
              </p>
              <ol className="rows week rv">
                {WEEK.map(([day, text], i) => (
                  <li key={day} className={`row ${i === WEEK.length - 1 ? 'punch' : ''}`}>
                    <span className="bib day">{day}</span>
                    <span className="txt">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="wb-band" aria-label="These">
          <div className="wrap"><p className="disp rv">Seminare verändern Wissen. Noch kein Verhalten<Dot /></p></div>
        </section>

        {/* ── NEUE MÖGLICHKEIT · alter Weg vs. Training ──────────────────── */}
        <section className="sec wb-way">
          <div className="wrap split rev">
            <Photo src="/journal/topics/sprint-b.webp" pos="50% 55%" tag="Fig. 02 · Training" className="rv" />
            <div>
              <Eyebrow>Die neue Möglichkeit</Eyebrow>
              <h2 className="disp h2 rv">Führung ist trainierbar. Wie Fitness<Dot /></h2>
              <p className="lead rv">
                Niemand wird fit von einem Vortrag über Fitness. Führung funktioniert genauso:
                kurze, tägliche Einheiten an deinem echten Fall, mit Feedback, das sofort kommt.
              </p>
              <div className="ways rv">
                <div className="old">
                  <p className="bib head">Der alte Weg</p>
                  <ol>{OLD_WAY.map((s, i) => <li key={s}><span className="bib">{String(i + 1).padStart(2, '0')}</span>{s}</li>)}</ol>
                </div>
                <div className="new">
                  <p className="bib head">Mit LeaderOS</p>
                  <ol>{NEW_WAY.map((s, i) => <li key={s}><span className="bib">{String(i + 1).padStart(2, '0')}</span>{s}</li>)}</ol>
                </div>
              </div>
              <p className="more rv">
                <a href="/kurse" target="_blank" rel="noopener" className="bib link">Alle Kurse in LeaderOS ↗</a>
              </p>
            </div>
          </div>
        </section>

        {/* ── INHALTE · sechs Themen, jedes mit Bild ─────────────────────── */}
        <section className="sec wb-learn">
          <div className="wrap">
            <div className="head">
              <Eyebrow>Inhalte · 90 Minuten live</Eyebrow>
              <h2 className="disp h2 rv">Das nimmst du mit<Dot /></h2>
            </div>
            <ul className="grid">
              {LEARN.map(([title, desc, img, pos], i) => (
                <li key={title} className="item rv">
                  {img === 'wladbot' ? (
                    <Photo src={WLADBOT_AVATAR} fallbacks={WLADBOT_AVATAR_FALLBACKS} alt="WladBot, der KI-Coach mit Wlads Methodik" className="ink" ratio="3 / 2" />
                  ) : img === 'wlad' ? (
                    <Photo src={WLAD_AVATAR} fallbacks={WLAD_AVATAR_FALLBACKS} alt="Wlad Jachtchenko" pos={pos} ratio="3 / 2" />
                  ) : (
                    <Photo src={img} pos={pos} ratio="3 / 2" />
                  )}
                  <p className="bib code">L·{String(i + 1).padStart(2, '0')}</p>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── ABLAUF · Minute für Minute ─────────────────────────────────── */}
        <section className="sec wb-agenda">
          <div className="wrap split rev">
            <Photo src="/journal/topics/stage.webp" pos="50% 50%" tag="Fig. 03 · Live" className="rv" />
            <div>
              <Eyebrow light>Ablauf · {DATE_SHORT}</Eyebrow>
              <h2 className="disp h2 rv">90 Minuten. Minute für Minute<Dot /></h2>
              <ol className="rows rv">
                {AGENDA.map(([time, title, desc]) => (
                  <li key={time} className="row">
                    <time>{time}</time>
                    <div><h3>{title}</h3><p>{desc}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── WERT · alles inklusive ─────────────────────────────────────── */}
        <section className="sec wb-stack">
          <div className="wrap">
            <div className="head">
              <Eyebrow>Was du bekommst</Eyebrow>
              <h2 className="disp h2 rv">Alles inklusive. Für 0 €<Dot /></h2>
              <p className="lead rv">Andere verlangen für weniger ein Ticket. Du bezahlst mit nichts außer deiner E-Mail-Adresse.</p>
            </div>
            <ol className="rows rv">
              {STACK.map(([title, desc], i) => (
                <li key={title} className="row">
                  <span className="bib code">V·{String(i + 1).padStart(2, '0')}</span>
                  <div><h3>{title}</h3><p>{desc}</p></div>
                  <span className="bib inc">Inklusive</span>
                </li>
              ))}
            </ol>
            <p className="cta rv">
              <button type="button" onClick={toFinal} className="pill ink">Kostenlosen Platz sichern <span aria-hidden className="arrow">→</span></button>
              <span className="bib mute">{DATE_LINE}</span>
            </p>
          </div>
        </section>

        {/* ── BONUS · die Videoserie ─────────────────────────────────────── */}
        <section className="sec wb-videos cloud">
          <div className="wrap split">
            <Photo src="/journal/topics/presence.webp" pos="50% 40%" tag="Fig. 04 · Präsenz" className="rv" />
            <div>
              <Eyebrow>Teilnehmer-Bonus</Eyebrow>
              <h2 className="disp h2 rv">Dazu: vier Videos von Wlad<Dot /></h2>
              <p className="lead rv">
                „Führung beginnt hier": ein Video pro Tag in dein Postfach. Als Teilnehmer schaltest du
                die Serie direkt nach der Anmeldung frei und gehst vorbereitet in den Termin.
              </p>
              <ol className="rows rv">
                {VIDEOS.map(([title, dur], i) => (
                  <li key={title} className="row">
                    <span className="bib code">{String(i + 1).padStart(2, '0')}</span>
                    <span className="txt strong">{title}</span>
                    <span className="bib dur">{dur}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── HOST · Wlad ────────────────────────────────────────────────── */}
        <section className="sec wb-host">
          <div className="wrap split">
            <Photo src={WLAD_AVATAR} fallbacks={WLAD_AVATAR_FALLBACKS} alt="Wlad Jachtchenko, Host des Webinars" pos="62% 15%" tag="Wlad Jachtchenko · Host" className="rv" />
            <div>
              <Eyebrow>Dein Host</Eyebrow>
              <h2 className="disp h2 rv">Wlad Jachtchenko<Dot /></h2>
              <div className="prose rv">
                <p>
                  Wlad Jachtchenko hat in München und an der Columbia University in New York studiert
                  (Master of Arts), ist Volljurist und war UNO-Assistent. Seit 2007 arbeitet er als
                  Speaker, Rhetorik-Trainer und Leadership-Coach: über 400.000 Klienten in mehr als
                  20 Ländern, drei SPIEGEL-Bestseller, Gründer der Argumentorik-Akademie.
                </p>
                <p>
                  Dabei fiel ihm auf: Das Problem seiner Klienten war fast nie fehlendes Wissen. Nach
                  jedem Seminar wussten alle, was zu tun ist. Sechs Wochen später war das Verhalten das
                  alte. Wissen wird gelehrt, Verhalten wird trainiert.
                </p>
                <p>
                  Genau dafür gibt es LeaderOS: seine Methodik als tägliches Trainingssystem, mit einem
                  KI-Coach, der auf seinen Büchern, Kursen und Vorträgen aufbaut. Im Webinar zeigt er
                  das System live und beantwortet deine Fragen persönlich.
                </p>
              </div>
              <p className="bib facts rv">Seit 2007 · 3× SPIEGEL-Bestseller · 400.000+ Klienten · Argumentorik-Akademie</p>
            </div>
          </div>
        </section>

        <section className="wb-band" aria-label="These">
          <div className="wrap"><p className="disp rv">Wissen wird gelehrt. Verhalten wird trainiert<Dot /></p></div>
        </section>

        {/* ── BÜCHERREGAL · die Bände als Beweis, ziehbar ────────────────── */}
        <BookShelf onTrack={(e, p) => track(`webinar_${e}`, p)} />

        {/* ── METHODIK · vier Frameworks, offen gelegt ───────────────────── */}
        <section className="sec wb-frameworks">
          <div className="wrap">
            <div className="head">
              <Eyebrow>Die Methodik dahinter</Eyebrow>
              <h2 className="disp h2 rv">Vier Frameworks. Offen gelegt<Dot /></h2>
              <p className="lead rv">
                Vier der Frameworks aus Wlads Büchern stehen hier offen, exakt so, wie sie im Webinar und
                in LeaderOS trainiert werden. Zum Nachlesen verlinkt; das Können kommt aus dem Drill.
              </p>
            </div>
            <ol className="rows rv">
              {FRAMEWORKS.map(([name, def, href], i) => (
                <li key={name} className="row">
                  <span className="bib code">F·{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{name}</h3>
                    <p>{def}</p>
                    <Link to={href} className="bib link">Im Journal lesen ↗</Link>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── WARUM LIVE ─────────────────────────────────────────────────── */}
        <section className="sec wb-live cloud">
          <div className="wrap split rev">
            <Photo src="/journal/topics/team-b.webp" pos="50% 40%" tag="Fig. 05 · Live-Case" className="rv" />
            <div>
              <Eyebrow>Warum live dabei sein</Eyebrow>
              <h2 className="disp h2 rv">Keine Aufzeichnung. Mit Absicht<Dot /></h2>
              <ol className="rows rv">
                {LIVE_REASONS.map((r, i) => (
                  <li key={r} className="row">
                    <span className="bib code">{String(i + 1).padStart(2, '0')}</span>
                    <span className="txt">{r}</span>
                  </li>
                ))}
              </ol>
              <p className="bib mute rv">Kein „Nur noch 18 Plätze"-Zähler. Was hier steht, stimmt.</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="sec wb-faqsec">
          <div className="wrap narrow">
            <Eyebrow>Häufige Fragen</Eyebrow>
            <h2 className="disp h2 rv">Kurz beantwortet<Dot /></h2>
            <div className="rv"><Faq /></div>
          </div>
        </section>

        {/* ── SCHLUSS · Anmeldung ────────────────────────────────────────── */}
        <section ref={finalRef} id="anmeldung" className="wb-final" data-testid="webinar-final">
          <img className="bg" src="/journal/topics/boardroom-b.webp" alt="" aria-hidden loading="lazy" />
          <div className="scrim" aria-hidden />
          <div className="wrap inner">
            <Eyebrow light>Anmeldung · {DATE_SHORT} · Live · {daysLabel(days)}</Eyebrow>
            <h2 className="disp h2 rv">Sichere dir deinen Platz<Dot /></h2>
            <p className="lead rv">
              90 Minuten live mit Wlad Jachtchenko. Kostenlos, mit Q&A, ohne Aufzeichnung.
            </p>
            <div className="formwrap rv"><RegisterForm idSuffix="-final" inline onInk label="Jetzt kostenlos anmelden" /></div>
          </div>
        </section>
      </main>

      <StickyBar heroFormRef={heroFormRef} finalRef={finalRef} onCta={toFinal} />

      {/* Squeeze-Footer · nur Pflichtlinks. Der volle Footer ist ein Ausgang
          auf einer Seite, deren einzige Aufgabe das Formular ist. */}
      <footer className="wb-foot" data-testid="webinar-footer">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="LeaderOS Startseite">
            <WladMark size={24} variant="outline" />
            <span>Leader<span className="dot">·</span>OS</span>
          </Link>
          <p className="bib">© 2026 LeaderOS · Wlad Jachtchenko · 400.000+ Klienten · 20+ Länder</p>
          <nav className="bib">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">AGB</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ── Styles · bewusst in der Datei, damit die Werte nachprüfbar bleiben ── */

const CSS = `
.wb{--ink:#0A0A0A;--cloud:#f5f5f5;--mute:#707072;--stone:#9e9ea0;--hair:#e5e5e5;--lime:${LIME};--limeInk:#5A7700;
  --disp:'Outfit','Inter',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace;
  background:#fff;color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}
.wb *,.wb *::before,.wb *::after{box-sizing:border-box}
.wb .wrap{max-width:1280px;margin:0 auto;padding:0 20px}
.wb .wrap.narrow{max-width:860px}
.wb .sec{padding:clamp(64px,9vw,128px) 0}
.wb .cloud{background:var(--cloud)}
.wb .disp{font-family:var(--disp);font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.045em;line-height:.9;margin:0;text-wrap:balance}
.wb .disp .p{color:var(--lime);font-style:normal}
.wb .h2{font-size:clamp(38px,6vw,86px)}
.wb .bib{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;line-height:1.6}
.wb .bib.lime{color:var(--limeInk)}
.wb .bib.mute{color:var(--mute)}
.wb .bib.link{color:var(--limeInk);text-decoration:none;display:inline-block;padding:6px 0}
.wb .bib.link:hover{color:var(--ink)}
.wb .eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 20px;color:var(--limeInk)}
.wb .eyebrow::before{content:'';flex:none;width:7px;height:7px;border-radius:999px;background:var(--lime);box-shadow:0 0 0 3px rgba(191,255,0,.22)}
.wb .eyebrow.light{color:var(--lime)}
.wb .lead{font-size:clamp(16px,1.3vw,19px);line-height:1.55;color:#39393b;max-width:640px;margin:22px 0 0}
.wb .head{max-width:820px;margin-bottom:clamp(32px,5vw,64px)}
.wb .prose{margin-top:24px;max-width:640px}
.wb .prose p{margin:0 0 16px;font-size:16.5px;line-height:1.65;color:#39393b}
.wb .facts.bib{margin-top:24px;color:var(--mute)}
.wb .more{margin:26px 0 0}

/* Reveal */
.wb .rv{opacity:0;transform:translateY(18px);transition:opacity .75s cubic-bezier(.2,.8,.2,1),transform .75s cubic-bezier(.2,.8,.2,1)}
.wb .rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.wb .rv{opacity:1;transform:none;transition:none}}

/* Pills */
.wb .pill{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:56px;padding:0 28px;border-radius:999px;border:0;cursor:pointer;
  font-family:var(--body);font-weight:700;font-size:14.5px;letter-spacing:.01em;text-decoration:none;white-space:nowrap;
  transition:background .25s,color .25s,transform .25s;-webkit-appearance:none}
.wb .pill .arrow{font-weight:400;transition:transform .25s}
.wb .pill:hover .arrow{transform:translateX(3px)}
.wb .pill:active{transform:scale(.97)}
.wb .pill.ink{background:var(--ink);color:#fff}
.wb .pill.ink:hover{background:var(--lime);color:var(--ink)}
.wb .pill.lime{background:var(--lime);color:var(--ink)}
.wb .pill.lime:hover{background:#fff}
.wb .pill.full{width:100%}
.wb .pill:disabled{cursor:wait;opacity:.7}

/* Formular */
.wb-form{width:100%}
.wb-form .fields{display:flex;flex-direction:column;gap:10px}
@media(min-width:640px){.wb-form.inline .fields{flex-direction:row}}
.wb-form input{flex:1 1 auto;width:100%;min-width:0;height:56px;padding:0 22px;border-radius:999px;border:1.5px solid rgba(10,10,10,.2);background:#fff;color:var(--ink);
  font-family:var(--body);font-size:15.5px;font-weight:500;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none}
.wb-form .fields .pill{flex:none}
.wb-form input::placeholder{color:var(--stone)}
.wb-form input:focus{border-color:var(--ink);box-shadow:0 0 0 4px rgba(191,255,0,.35)}
.wb-form.onink input{border-color:transparent}
.wb-form.onink input:focus{border-color:var(--lime);box-shadow:0 0 0 4px rgba(191,255,0,.28)}
.wb-form.compact input,.wb-form.compact .pill{height:46px}
.wb-form.compact .pill{padding:0 20px;font-size:13px}
.wb-form .note{margin:12px 0 0;font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);line-height:1.6}
.wb-form .note .long{display:none}
@media(min-width:640px){.wb-form .note .short{display:none}.wb-form .note .long{display:inline}}
.wb-form.onink .note{color:rgba(255,255,255,.62)}
.wb-form .err{display:block;margin-top:6px;font-family:var(--body);font-size:12.5px;font-weight:500;letter-spacing:0;text-transform:none;color:#d30005;line-height:1.4}
.wb-form.onink .err{color:#ffb4ad}
.wb-form.compact .err{margin:8px 0 0}

/* Header */
.wb-head{position:fixed;top:0;left:0;right:0;z-index:40;height:60px;display:flex;align-items:center;color:#fff;transition:background .3s,color .3s,box-shadow .3s}
.wb-head.solid{background:#fff;color:var(--ink);box-shadow:inset 0 -1px 0 var(--hair)}
.wb-head .wrap{display:flex;align-items:center;justify-content:space-between;width:100%}
.wb-head .brand{display:flex;align-items:center;gap:10px;font-family:var(--disp);font-weight:900;font-size:17px;letter-spacing:-.03em;text-decoration:none;color:inherit}
.wb-head .brand .dot{color:var(--lime)}
.wb-head.solid .brand .dot{color:var(--limeInk)}
.wb-head .right{display:flex;align-items:center;gap:18px}
.wb-head .date{display:none;color:inherit;opacity:.85}
@media(min-width:640px){.wb-head .date{display:inline}}
.wb-head .cta{display:none;height:40px;padding:0 18px;font-size:12.5px}
.wb-head.solid .cta{display:inline-flex}
@media(max-width:899px){.wb-head.solid .cta{display:none}}

/* Hero */
.wb-hero{position:relative;overflow:hidden;background:var(--ink);color:#fff;min-height:100svh;display:flex;flex-direction:column}
.wb-hero .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% 0%;filter:saturate(.9)}
.wb-hero .scrim{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(to top,#0A0A0A 0%,rgba(10,10,10,.97) 26%,rgba(10,10,10,.78) 44%,rgba(10,10,10,.25) 66%,rgba(10,10,10,.1) 82%,rgba(10,10,10,.45) 100%)}
.wb-hero .inner{position:relative;flex:1;display:flex;flex-direction:column;justify-content:flex-end;width:100%;padding:72px 20px 22px}
.wb-hero .air{flex:1;min-height:clamp(88px,17svh,240px)}
.wb-hero .kicker{display:flex;align-items:center;gap:10px;color:var(--lime);margin:0 0 14px}
.wb-hero .kicker .long{display:none}
@media(min-width:900px){.wb-hero .kicker .short{display:none}.wb-hero .kicker .long{display:inline}}
.wb-hero .led{flex:none;width:7px;height:7px;border-radius:999px;background:var(--lime);box-shadow:0 0 0 3px rgba(191,255,0,.25)}
.wb-hero h1{font-size:clamp(44px,12vw,68px);color:#fff;line-height:.88}
.wb-hero h1 .line{display:block;overflow:clip;overflow-clip-margin:.14em}
.wb-hero h1 .line>span{display:block}
.wb-hero .sub{margin:16px 0 0;max-width:560px;font-size:15.5px;line-height:1.5;color:rgba(255,255,255,.84)}
.wb-hero .sub.long{display:none}
.wb-hero .formwrap{margin-top:20px;max-width:640px;scroll-margin-top:80px}
.wb-hero .facts{display:none}
@media(min-width:900px){
  .wb-hero{min-height:min(100svh,960px)}
  .wb-hero .bg{object-position:0% 22%}
  .wb-hero .scrim{background:linear-gradient(90deg,rgba(10,10,10,.97) 0%,rgba(10,10,10,.92) 30%,rgba(10,10,10,.55) 52%,rgba(10,10,10,.12) 74%,rgba(10,10,10,.5) 100%),
    linear-gradient(to top,#0A0A0A 0%,rgba(10,10,10,.55) 16%,transparent 42%),linear-gradient(to bottom,rgba(10,10,10,.5) 0%,transparent 24%)}
  .wb-hero .inner{justify-content:center;max-width:1280px;margin:0 auto;padding:108px 40px 56px}
  .wb-hero .air{display:none}
  .wb-hero .kicker{margin-bottom:20px;font-size:11px}
  .wb-hero h1{font-size:clamp(72px,7.2vw,112px);max-width:900px}
  .wb-hero .sub.short{display:none}
  .wb-hero .sub.long{display:block;font-size:18px;max-width:640px;margin-top:24px}
  .wb-hero .formwrap{margin-top:28px;max-width:620px}
  .wb-hero .facts{display:flex;flex-wrap:wrap;gap:14px 0;margin-top:28px;max-width:760px;border-top:1px solid rgba(255,255,255,.18);padding-top:16px}
  .wb-hero .facts div{padding-right:24px;margin-right:24px;border-right:1px solid rgba(255,255,255,.18)}
  .wb-hero .facts div:last-child{border:0;margin:0;padding:0}
  .wb-hero .facts .bib{display:block;color:rgba(255,255,255,.6)}
  .wb-hero .facts b{display:block;font-family:var(--disp);font-weight:900;font-style:italic;font-size:28px;line-height:1;margin-top:6px;letter-spacing:-.03em;white-space:nowrap}
}

/* Beweis */
.wb-proof{border-bottom:1px solid var(--hair)}
.wb-proof .nums{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);column-gap:20px}
.wb-proof .num{padding:26px 0 22px;border-bottom:1px solid var(--hair)}
.wb-proof .num:last-child{grid-column:span 2}
.wb-proof .num b{display:block;font-family:var(--disp);font-weight:900;font-style:italic;letter-spacing:-.04em;font-size:clamp(36px,3.6vw,56px);line-height:1}
.wb-proof .num .bib{display:block;margin-top:10px;color:var(--mute);text-decoration:none}
.wb-proof .num a.bib:hover{color:var(--ink)}
@media(min-width:900px){.wb-proof .nums{grid-template-columns:repeat(5,1fr);column-gap:32px}.wb-proof .num{padding:34px 0 30px}.wb-proof .num:last-child{grid-column:auto}}
.wb-proof .reviews{display:flex;flex-wrap:wrap;gap:12px 32px;justify-content:center;margin:0;padding:8px 0 28px}
.wb-proof .reviews a{color:var(--mute);text-decoration:none}
.wb-proof .reviews a b{color:var(--ink)}
.wb-proof .reviews a:hover{color:var(--ink)}

/* Split-Layouts + Fotos */
.wb .split{display:grid;gap:36px}
@media(min-width:900px){.wb .split{grid-template-columns:5fr 7fr;gap:clamp(48px,6vw,96px);align-items:center}.wb .split.rev{grid-template-columns:7fr 5fr}.wb .split.rev>.ph{order:2}}
.wb .ph{position:relative;overflow:hidden;margin:0;background:var(--cloud);aspect-ratio:4/3}
@media(min-width:900px){.wb .split>.ph{aspect-ratio:4/5}}
.wb .ph img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.wb .ph:hover img{transform:scale(1.03)}
.wb .ph.ink{background:var(--ink)}
.wb .ph.ink img{object-fit:contain;padding:6%}
.wb .ph .tag{position:absolute;left:14px;bottom:14px;margin:0;padding:7px 11px;background:rgba(10,10,10,.78);color:#fff;letter-spacing:.16em}

/* Rows (Hairlines statt Karten) */
.wb .rows{list-style:none;margin:28px 0 0;padding:0;border-top:1px solid var(--hair)}
.wb .row{display:grid;grid-template-columns:52px 1fr;gap:12px 16px;padding:18px 0;border-bottom:1px solid var(--hair);align-items:baseline}
.wb .row .code{color:var(--limeInk)}
.wb .row h3{margin:0 0 4px;font-family:var(--body);font-weight:700;font-size:17.5px;line-height:1.3;letter-spacing:-.01em}
.wb .row p{margin:0;font-size:14.5px;line-height:1.55;color:var(--mute);max-width:640px}
.wb .row .txt{font-size:15.5px;line-height:1.5;color:#39393b}
.wb .row .txt.strong{font-weight:600;color:var(--ink)}
.wb .row .link{margin-top:6px}

/* Problem · Woche */
.wb-problem .week .day{color:var(--limeInk);padding-top:3px}
.wb-problem .week .punch{background:var(--ink);color:#fff;margin:0 -20px;padding:18px 20px;border-bottom-color:var(--ink)}
.wb-problem .week .punch .day{color:var(--lime)}
.wb-problem .week .punch .txt{color:#fff;font-weight:600}
@media(min-width:900px){.wb-problem .week .punch{margin:0;padding:18px 16px}}

/* Neue Möglichkeit */
.wb-way .ways{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:30px;border-top:1px solid var(--hair);padding-top:22px}
.wb-way .ways .head{margin:0 0 14px;color:var(--mute)}
.wb-way .ways .new .head{color:var(--limeInk)}
.wb-way .ways ol{list-style:none;margin:0;padding:0}
.wb-way .ways li{display:flex;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid var(--hair);font-size:15.5px;font-weight:600}
.wb-way .ways .old li{color:var(--stone);font-weight:500}
.wb-way .ways .old li .bib{color:var(--stone)}
.wb-way .ways .new li .bib{color:var(--limeInk)}
.wb-way .ways .old li:last-child{color:#d30005}

/* Inhalte */
.wb-learn .grid{list-style:none;margin:0;padding:0;display:grid;gap:32px 20px}
@media(min-width:640px){.wb-learn .grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.wb-learn .grid{grid-template-columns:repeat(3,1fr);gap:48px 28px}}
.wb-learn .item .code{margin:14px 0 6px;color:var(--limeInk)}
.wb-learn .item h3{margin:0 0 6px;font-family:var(--body);font-weight:700;font-size:19px;line-height:1.25;letter-spacing:-.01em}
.wb-learn .item p{margin:0;color:var(--mute);font-size:14.5px;line-height:1.55}
.wb-learn .item .code+h3{margin-top:0}

/* Ablauf (Ink) */
.wb-agenda{background:var(--ink);color:#fff}
.wb-agenda .rows{border-top-color:rgba(255,255,255,.16)}
.wb-agenda .row{grid-template-columns:92px 1fr;border-bottom-color:rgba(255,255,255,.16);padding:22px 0}
.wb-agenda .row time{font-family:var(--disp);font-weight:900;font-style:italic;font-size:30px;line-height:1;letter-spacing:-.03em;color:#fff}
.wb-agenda .row h3{color:#fff}
.wb-agenda .row p{color:rgba(255,255,255,.62)}
.wb-agenda .ph{background:#1a1a1a}

/* Wert */
.wb-stack .row{grid-template-columns:52px 1fr auto}
.wb-stack .row .inc{color:var(--limeInk);white-space:nowrap}
@media(max-width:639px){.wb-stack .row{grid-template-columns:52px 1fr}.wb-stack .row .inc{grid-column:2;margin-top:-4px}}
.wb-stack .cta{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;margin:36px 0 0}

/* Videos */
.wb-videos .row{grid-template-columns:40px 1fr auto}
.wb-videos .row .dur{color:var(--stone);white-space:nowrap}

/* Statement-Band */
.wb-band{background:var(--ink);color:#fff;padding:clamp(56px,8vw,112px) 0}
.wb-band .disp{font-size:clamp(34px,5.6vw,84px);max-width:1100px}

/* Warum live */
.wb-live .bib.mute{margin-top:22px}

/* FAQ */
.wb-faqsec .h2{margin-bottom:12px}
.wb-faq{border-top:1px solid var(--hair);margin-top:28px}
.wb-faq .q{border-bottom:1px solid var(--hair)}
.wb-faq h3{margin:0;font:inherit}
.wb-faq button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0;background:none;border:0;cursor:pointer;text-align:left;
  font-family:var(--body);font-weight:600;font-size:17px;line-height:1.3;color:var(--ink)}
.wb-faq .x{flex:none;width:32px;height:32px;border-radius:999px;border:1.5px solid var(--ink);display:grid;place-items:center;font-weight:400;font-size:20px;line-height:1;
  transition:transform .35s cubic-bezier(.2,.8,.2,1),background .25s,color .25s}
.wb-faq .q.open .x{transform:rotate(45deg);background:var(--ink);color:#fff}
.wb-faq .a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1)}
.wb-faq .q.open .a{grid-template-rows:1fr}
.wb-faq .a>div{overflow:hidden}
.wb-faq .a p{margin:0;padding:0 56px 22px 0;color:#39393b;font-size:15.5px;line-height:1.6}

/* Schluss */
.wb-final{position:relative;overflow:hidden;background:var(--ink);color:#fff;scroll-margin-top:60px}
.wb-final .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;opacity:.55;filter:saturate(.85)}
.wb-final .scrim{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,#0A0A0A 0%,rgba(10,10,10,.9) 36%,rgba(10,10,10,.6) 100%)}
.wb-final .inner{position:relative;padding:clamp(80px,12vw,160px) 20px}
.wb-final .h2{font-size:clamp(48px,8vw,120px);color:#fff}
.wb-final .lead{color:rgba(255,255,255,.78)}
.wb-final .formwrap{margin-top:36px;max-width:640px}

/* Sticky-Leiste */
.wb-sticky{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;box-shadow:inset 0 1px 0 var(--hair);transform:translateY(110%);visibility:hidden;
  transition:transform .45s cubic-bezier(.2,.8,.2,1),visibility 0s linear .45s}
.wb-sticky.on{transform:translateY(0);visibility:visible;transition-delay:0s}
.wb-sticky .wrap{display:flex;align-items:center;gap:16px;padding-top:10px;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
.wb-sticky .txt{display:none;flex:none}
.wb-sticky .txt p{margin:0}
@media(min-width:900px){.wb-sticky .txt{display:block}}
.wb-sticky .mobile{flex:1}
.wb-sticky .desk{display:none;flex:1}
@media(min-width:640px){.wb-sticky .mobile{display:none}.wb-sticky .desk{display:block}}

/* Footer */
.wb-foot{background:var(--ink);color:#fff;padding:32px 0 96px}
@media(min-width:640px){.wb-foot{padding-bottom:40px}}
.wb-foot .wrap{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
@media(min-width:900px){.wb-foot .wrap{flex-direction:row;justify-content:space-between;text-align:left}}
.wb-foot .brand{display:flex;align-items:center;gap:10px;font-family:var(--disp);font-weight:900;font-size:15px;letter-spacing:-.03em;text-decoration:none;color:#fff}
.wb-foot .brand .dot{color:var(--lime)}
.wb-foot p.bib{margin:0;color:rgba(255,255,255,.45)}
.wb-foot nav{display:flex;gap:18px}
.wb-foot nav a{color:rgba(255,255,255,.6);text-decoration:none;padding:8px 0}
.wb-foot nav a:hover{color:#fff}

/* Header-Kompensation: der fixierte Header liegt über dem Hero */
.wb-head{height:60px}
`;

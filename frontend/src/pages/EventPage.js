import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DottedGlowBackground } from '../components/shared/DottedGlowBackground';
import { applyPageMeta } from '../lib/pageMeta';
import { useTheme } from '../contexts/ThemeContext';
import { subscribe, isValidEmail } from '../features/newsletter/lib/newsletterClient';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';

/**
 * EventPage · /event · the free LIVE launch event for LeaderOS.
 *
 * A dated, high-conversion registration page (26.11.2026) built to onboard
 * cold traffic + the Masterclass alumni into a free live event, then into
 * the LeaderOS trial. Copy is lifted from Wlad's own event framing
 * (charisma, natürliche Autorität, weniger arbeiten / mehr verdienen).
 *
 * Design: always-dark premium canvas (we force the dark theme on mount and
 * restore on unmount) so LandingNav/Footer + tokens render cohesively, with
 * dotted-glow depth on the hero and the signup band. Signup posts to the
 * existing double-opt-in newsletter endpoint · same keyless same-origin path.
 */

// 26. November 2026, 10:00 Uhr Berlin (CEST, +02:00).
const EVENT_TS = new Date('2026-11-26T10:00:00+01:00').getTime();

const VALUE_PROPS = [
  {
    code: 'V·01',
    title: 'Menschenmagnet, der souverän führt.',
    body:
      'Charisma ist planbar · nicht Talent. Du lernst, natürliche Autorität ' +
      'aufzubauen und eine Ausstrahlung, der Menschen begeistert folgen · ' +
      'auch ohne offizielle Weisungsbefugnis.',
  },
  {
    code: 'V·02',
    title: 'Teams führen · ohne Druck oder Manipulation.',
    body:
      'Psychologisch klug kommunizieren, sodass dein Team von allein ' +
      'Verantwortung übernimmt, Deadlines hält und nicht bei jeder ' +
      'Kleinigkeit zurückfragt. Resultat: weniger arbeiten, mehr bewirken.',
  },
  {
    code: 'V·03',
    title: 'Vorgesetzte & Kollegen überzeugen.',
    body:
      'Platziere deine Ideen klar und wirksam · und mach aus Entscheidern ' +
      'Fans deiner Entscheidungen. So steigen deine Chancen auf Beförderung, ' +
      'mehr Verantwortung und mehr Gehalt erheblich.',
  },
];

const AGENDA = [
  {
    day: 'TAG 1 · DO 26.11.',
    title: 'Mindset & Identität als Führungspersönlichkeit.',
    points: [
      'Das Mindset der Top-1%-Führungskräfte · Klarheit, Verantwortung, Souveränität',
      'Emotionale Intelligenz meistern · Menschen lesen, jeden auf seine Art führen',
      'Charisma & magnetische Ausstrahlung aufbauen · Respekt ohne dich zu verstellen',
    ],
  },
  {
    day: 'TAG 2 · FR 30.10.',
    title: 'Die Tools & Techniken, um jede Situation zu meistern.',
    points: [
      'Zeitmangel bekämpfen · Prioritäten-Matrix & Energie-Management',
      'Konflikte, Verhandlungen & schwierige Gespräche souverän lösen',
      'Geheimnisse der Führungselite · die unsichtbaren Codes der Spitzen-Manager',
    ],
  },
];

const MEDIA = [
  'DER SPIEGEL', 'BUSINESS INSIDER', 'SÜDDEUTSCHE ZEITUNG',
  'RTL', 'ARD', 'PROSIEBEN', 'TEDX', 'GREATOR',
];

const FAQ = [
  {
    q: 'Für wen ist das Event geeignet?',
    a: 'Für alle, die fachlich stark sind, aber endlich als Führungspersönlichkeit ' +
       'wahrgenommen werden wollen · Teamleiter, Projektmanager, Senior-Experten und ' +
       'ambitionierte Fachkräfte. Besonders wertvoll für authentische Menschen, die ohne ' +
       'Manipulation führen möchten.',
  },
  {
    q: 'Ist das Event wirklich kostenlos?',
    a: 'Ja, 100 % kostenlos. Wlad wird von Konzernen normalerweise für 10.000 € Tagessatz ' +
       'gebucht · dieses Live-Event ist einmalig gratis, damit mehr Führungskräfte die ' +
       'Unterstützung bekommen, die sie verdienen.',
  },
  {
    q: 'Gibt es eine Aufzeichnung?',
    a: 'Nein. Das Event ist live an beiden Tagen von 10 – 16 Uhr online. Es gibt keine ' +
       'Aufzeichnung · deshalb lohnt es sich, live dabei zu sein.',
  },
  {
    q: 'Was hat das mit LeaderOS zu tun?',
    a: 'Das Event ist der Live-Auftakt zu LeaderOS · Wlads KI-Coaching-Plattform. Du ' +
       'erlebst die Methodik live und kannst sie danach täglich mit WladBot weitertrainieren ' +
       '· 14 Tage kostenlos, ohne Karte.',
  },
];

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, done: diff === 0 };
}

const CountdownTiles = ({ compact = false }) => {
  const { d, h, m, s } = useCountdown(EVENT_TS);
  const cells = [
    ['Tage', d], ['Std', h], ['Min', m], ['Sek', s],
  ];
  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-2.5 sm:gap-3'}`}>
      {cells.map(([label, val]) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center border-2 border-white/15 bg-white/[0.03] ${
            compact ? 'w-14 h-14' : 'w-[68px] h-[68px] sm:w-20 sm:h-20'
          }`}
        >
          <span
            className={`tabular-nums leading-none text-brand ${compact ? 'text-[20px]' : 'text-[26px] sm:text-[32px]'}`}
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            {String(val).padStart(2, '0')}
          </span>
          <span className="mt-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/45">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

const SignupForm = ({ idSuffix = '' }) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const valid = isValidEmail(email);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    const res = await subscribe({
      email,
      source: 'event-leader-in-you',
      campaign: 'launch-2026-11-26',
    });
    setState(res.ok ? 'done' : 'error');
  };

  if (state === 'done') {
    return (
      <div
        className="flex items-start gap-3 border-2 border-brand/50 bg-brand/[0.06] p-5"
        data-testid={`event-signup-success${idSuffix}`}
      >
        <span className="mt-0.5 inline-flex w-6 h-6 items-center justify-center bg-[#BFFF00] text-[#0A0A0A] shrink-0">
          <Check size={15} strokeWidth={3} />
        </span>
        <div>
          <p className="text-[15px] font-bold text-white">Fast geschafft · check deine Mails.</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-white/60">
            Wir haben dir einen Bestätigungs-Link geschickt. Ein Klick · und dein
            kostenloser Platz für den 26.11. ist reserviert.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate data-testid={`event-signup-form${idSuffix}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
          placeholder="Deine E-Mail-Adresse"
          aria-label="E-Mail-Adresse"
          className="w-full sm:flex-1 h-14 px-5 bg-white/[0.04] border-2 border-white/20 focus:border-brand outline-none text-white text-[15px] placeholder:text-white/35 transition-colors"
        />
        <button
          type="submit"
          disabled={!valid || state === 'loading'}
          className="h-14 px-7 bg-[#BFFF00] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {state === 'loading' ? 'Sichere Platz…' : 'Kostenlos anmelden'}
          {state !== 'loading' && <ArrowUpRight size={16} />}
        </button>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        100 % kostenlos · Double-Opt-In · kein Spam, jederzeit abbestellbar
        {state === 'error' && (
          <span className="block mt-1.5 tracking-normal normal-case text-[12px] text-red-400">
            Das hat nicht geklappt · bitte E-Mail prüfen und erneut senden.
          </span>
        )}
      </p>
    </form>
  );
};

export default function EventPage() {
  const themeCtx = useTheme();
  const scrollToSignup = useRef(null);

  // Force the premium dark canvas while on this page · restore on leave.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');

    const restoreMeta = applyPageMeta({
      title: 'LeaderOS LIVE · Das Leadership-Event mit Wlad Jachtchenko · 26.11.2026',
      description:
        'Kostenloses Live-Event am 29.–30.10.2026 mit Europas führendem Leadership-Coach ' +
        'Wlad Jachtchenko. In 2 Tagen zur charismatischen Führungspersönlichkeit · ' +
        'natürliche Autorität, weniger arbeiten, mehr bewirken. Jetzt gratis anmelden.',
      url: 'https://leader-os.de/event',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    // Event JSON-LD · rich result eligibility for the dated event.
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'LeaderOS LIVE · Das Leadership-Event mit Wlad Jachtchenko',
      startDate: '2026-11-26T10:00:00+01:00',
      endDate: '2026-10-30T16:00:00+01:00',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'VirtualLocation',
        url: 'https://leader-os.de/event',
      },
      image: ['https://leader-os.de/og-wlad.jpg'],
      description:
        'Kostenloses 2-Tage-Live-Event zur charismatischen Führung mit Wlad Jachtchenko.',
      organizer: { '@type': 'Organization', name: 'LeaderOS', url: 'https://leader-os.de' },
      performer: { '@type': 'Person', name: 'Wlad Jachtchenko' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: 'https://leader-os.de/event',
        validFrom: '2026-07-01T00:00:00+02:00',
      },
    });
    document.head.appendChild(ld);

    return () => {
      restoreMeta();
      ld.remove();
      if (!wasDark) root.classList.remove('dark');
    };
  }, []);

  const goSignup = () => {
    scrollToSignup.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dateLine = useMemo(() => 'DO 29. – FR 30. OKTOBER 2026 · ONLINE · 10 – 16 UHR', []);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased" data-testid="event-page">
      <LandingNav />

      <main id="main-content">
        {/* Hero · dated, dark, glow-depth */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <DottedGlowBackground
              gap={16}
              radius={1.8}
              color="rgba(255,255,255,0.18)"
              glowColor="rgba(191,255,0,0.6)"
              opacity={0.5}
            />
          </div>
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 pt-14 md:pt-20 pb-16 md:pb-24">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-6">
              ▸ Live-Event · 100 % kostenlos · keine Aufzeichnung
            </p>
            <h1
              className="text-[44px] sm:text-[72px] md:text-[104px] leading-[0.92] tracking-[-0.04em] text-foreground max-w-5xl"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Werde die Führungs&shy;kraft, der andere<br className="hidden md:block" /> begeistert
              folgen<span className="text-brand not-italic">.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] sm:text-[19px] leading-[1.55] text-foreground/70">
              In nur 2 Tagen zur charismatischen Führungspersönlichkeit · arbeite weniger
              Stunden, verdiene deutlich mehr und bring dein Team dazu, endlich mitzuziehen.
              Live mit <span className="text-foreground font-semibold">Wlad Jachtchenko</span> ·
              Europas führendem Leadership-Coach.
            </p>

            <div className="mt-9 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/55">
              {dateLine}
            </div>
            <div className="mt-5">
              <CountdownTiles />
            </div>

            <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                onClick={goSignup}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
              >
                Jetzt kostenlos anmelden <ArrowUpRight size={16} />
              </button>
              <span className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                Über 400 Führungskräfte bereits dabei
              </span>
            </div>
          </div>
        </section>

        {/* Bekannt aus */}
        <section className="border-y-2 border-foreground/12">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-6 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
            <p className="shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand">
              ▸ Bekannt aus
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 md:gap-x-9 gap-y-2.5">
              {MEDIA.map((m) => (
                <li key={m} className="font-mono text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em] text-foreground/70">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Value props */}
        <section className="max-w-[1180px] mx-auto px-5 md:px-10 pt-20 md:pt-28">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
            ▸ Was bringt dir das Event
          </p>
          <h2
            className="text-[30px] sm:text-[42px] md:text-[56px] leading-[1.0] tracking-[-0.03em] text-foreground max-w-4xl"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Führen wie die Top 1 %<span className="text-brand not-italic">.</span>
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5 md:gap-6">
            {VALUE_PROPS.map((v) => (
              <article key={v.code} className="border-2 border-foreground/25 p-6 md:p-7 flex flex-col hover:bg-foreground/[0.03] transition-colors">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-brand">
                  {v.code}
                </span>
                <h3
                  className="mt-4 text-[20px] md:text-[23px] leading-[1.12] tracking-[-0.02em] text-foreground"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {v.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.6] text-foreground/70 flex-1">{v.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Agenda */}
        <section className="max-w-[1180px] mx-auto px-5 md:px-10 pt-20 md:pt-28">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
            ▸ Das lernst du · 2 Tage, live
          </p>
          <h2
            className="text-[30px] sm:text-[42px] md:text-[56px] leading-[1.0] tracking-[-0.03em] text-foreground max-w-4xl"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Persönlichkeit trifft Technik<span className="text-brand not-italic">.</span>
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-5 md:gap-6">
            {AGENDA.map((day) => (
              <article key={day.day} className="border-2 border-foreground p-6 md:p-8 flex flex-col">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-brand">
                  {day.day}
                </span>
                <h3
                  className="mt-4 text-[22px] md:text-[27px] leading-[1.1] tracking-[-0.025em] text-foreground"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {day.title}
                </h3>
                <ul className="mt-6 space-y-3">
                  {day.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-[14px] leading-[1.5] text-foreground/78">
                      <span aria-hidden className="mt-[7px] w-1.5 h-1.5 bg-brand shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Host · Wlad */}
        <section className="max-w-[1180px] mx-auto px-5 md:px-10 pt-20 md:pt-28">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="md:col-span-4">
              <div className="relative aspect-[4/5] w-full max-w-[360px] mx-auto md:mx-0 border-2 border-foreground overflow-hidden">
                <img
                  src={WLAD_AVATAR}
                  onError={withFallback(WLAD_AVATAR_FALLBACKS)}
                  alt="Wlad Jachtchenko · Europas führender Leadership-Coach"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-[50%_20%]"
                />
              </div>
            </div>
            <div className="md:col-span-8">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
                ▸ Dein Gastgeber
              </p>
              <h2
                className="text-[28px] sm:text-[38px] md:text-[48px] leading-[1.02] tracking-[-0.03em] text-foreground"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Wlad Jachtchenko<span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.62] text-foreground/72">
                3-facher SPIEGEL-Bestseller-Autor und Europas führender Leadership-Coach ·
                von Konzernen wie Allianz, BMW, ProSieben, Trivago & Generali für 10.000 €
                Tagessatz gebucht. Über 10.000 Manager ausgebildet. Seine Mission:
                1 Million Menschen zu besseren Führungskräften machen.
              </p>
              <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['400K+', 'Kunden'],
                  ['3×', 'SPIEGEL-Bestseller'],
                  ['14 Mio', 'Views'],
                  ['10.000+', 'Manager gecoacht'],
                ].map(([big, cap]) => (
                  <div key={cap} className="border-t-2 border-foreground/20 pt-3">
                    <div
                      className="text-[22px] md:text-[26px] leading-none text-foreground tabular-nums"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                    >
                      {big}
                    </div>
                    <div className="mt-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-foreground/50">
                      {cap}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Signup band · the money moment */}
        <section ref={scrollToSignup} id="anmelden" className="relative isolate overflow-hidden mt-20 md:mt-28 border-y-2 border-foreground/15">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <DottedGlowBackground gap={16} radius={1.8} color="rgba(255,255,255,0.2)" glowColor="rgba(191,255,0,0.65)" opacity={0.55} />
          </div>
          <div className="max-w-[860px] mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-6">
              ▸ Sichere dir deinen Platz · 100 % kostenlos
            </p>
            <h2
              className="text-[32px] sm:text-[48px] md:text-[64px] leading-[0.98] tracking-[-0.035em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Bist du bereit zu führen<span className="text-brand not-italic">?</span>
            </h2>
            <p className="mt-5 text-[15px] sm:text-[17px] leading-[1.55] text-foreground/70 max-w-xl mx-auto">
              Melde dich jetzt an und starte am 26.11. deine Reise zu mehr Klarheit,
              Autorität und Respekt. Die Teilnahme ist komplett kostenlos.
            </p>
            <div className="mt-8 flex justify-center">
              <CountdownTiles />
            </div>
            <div className="mt-9 max-w-xl mx-auto text-left">
              <SignupForm idSuffix="-main" />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-[860px] mx-auto px-5 md:px-10 pt-20 md:pt-28 pb-8">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
            ▸ Häufige Fragen
          </p>
          <h2
            className="text-[28px] sm:text-[36px] md:text-[44px] leading-[1.02] tracking-[-0.03em] text-foreground mb-8"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Kurz geklärt<span className="text-brand not-italic">.</span>
          </h2>
          <dl className="border-t-2 border-foreground/15">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5 border-b border-foreground/15">
                <dt
                  className="text-[16px] md:text-[18px] leading-[1.3] text-foreground"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
                >
                  {item.q}
                </dt>
                <dd className="mt-2 text-[14px] leading-[1.6] text-foreground/68">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Final CTA line */}
        <section className="max-w-[1180px] mx-auto px-5 md:px-10 pb-24 text-center">
          <button
            onClick={goSignup}
            className="inline-flex items-center justify-center gap-2 h-14 px-9 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
          >
            Jetzt kostenlos anmelden <ArrowUpRight size={16} />
          </button>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-foreground/45">
            17. – 18. September 2026 · online · live · keine Aufzeichnung
          </p>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

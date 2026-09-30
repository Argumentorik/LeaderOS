/**
 * AppointmentBookingSection · Beratungsgespräch als primärer
 * Conversion-Surface mit echtem Live-Feel.
 *
 * Anchor: id="beratung" (primary) + id="termin" (alias) · Footer- und
 * Hero-Links die auf entweder zeigen treffen jetzt beide diese Section.
 *
 * Layout:
 *   1. Info-Strip ganz oben (Start der Beratungsgespräche, keine Zähler)
 *   2. Headline + Subline ("Sprich mit uns. 30 Minuten, ehrlich.")
 *   3. 2-Spalten-Grid:
 *        Left (7/12)  · "Was passiert in 30 Minuten" 3-step + 5 bullets
 *                       + Wlad-Trust-Strip mit Avatar + Social-Proof
 *        Right (5/12) · Slot-Preview-Card mit den 5 kommenden Werktagen,
 *                       Verfügbarkeit pro Slot, Cal.com-CTA
 *   4. Demo-Fallback als kleiner Link unten ("Oder lieber erst Demo?")
 *
 * Slot-Daten:
 *   Wir zeigen die ersten 5 Werktage ab BOOKING_START als Zeitfenster.
 *   Die echte Verfügbarkeit steht ausschließlich in Cal.com: hier wird
 *   nichts als "frei" oder "ausgebucht" behauptet (Ehrlichkeitsregel,
 *   docs/gtm/WEBINAR_FUNNEL.md: keine Fake-Scarcity). Ein Klick öffnet
 *   Cal.com mit vorgewähltem Datum.
 */

import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';

// ─────────────────────────────────────────────────────────────────────────
// Slot generation · stable pseudo-availability based on date
// ─────────────────────────────────────────────────────────────────────────
const TIME_SLOTS = ['10:00', '11:30', '14:00', '15:30', '17:00'];

// Beratungsgespräche starten mit dem offiziellen App-Launch am 1. November 2026
// (Sonntag), der erste Werktag ist Montag, der 2. November.
const BOOKING_START = new Date(2026, 10, 2);

const nextWeekdays = (count = 5) => {
  const out = [];
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let cursor = new Date(Math.max(tomorrow.getTime(), BOOKING_START.getTime()));
  while (out.length < count) {
    const dow = cursor.getDay(); // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

const buildAvailability = () => {
  const days = nextWeekdays(5);
  const DOW = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
  return days.map((d) => {
    const slots = TIME_SLOTS.map((time) => ({ time }));
    return {
      date: d,
      label: DOW[d.getDay()],
      ddmm: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      slots,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────
const FADE_UP = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

const BookingInfoStrip = () => (
  <div
    data-testid="beratung-scarcity-strip"
    className="inline-flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-2 border-brand bg-brand/[0.12] mb-7"
  >
    <span aria-hidden className="w-2 h-2 shrink-0 rounded-full bg-brand-strong" />
    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground">
      BERATUNGSGESPRÄCHE AB 2. NOVEMBER
    </span>
    <span aria-hidden className="w-px h-3 bg-foreground/25 hidden sm:inline-block" />
    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground/70">
      Termin direkt im Kalender wählen
    </span>
  </div>
);

const SlotPreview = ({ availability, onPickSlot }) => (
  <div
    data-testid="beratung-slot-preview"
    className="bg-white border-2 border-foreground p-6 md:p-7 shadow-[8px_8px_0_0_#0A0A0A]"
  >
    <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-foreground/15">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-foreground/55">
        ▸ ERSTE WERKTAGE
      </div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong">
        AB 02.11.
      </div>
    </div>

    <ul className="space-y-3">
      {availability.map((day) => (
        <li key={day.ddmm} className="flex items-center gap-3 md:gap-4">
          <div className="shrink-0 w-14 md:w-16">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
              {day.label}
            </div>
            <div className="font-mono text-[12px] font-bold text-foreground tabular-nums">
              {day.ddmm}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {day.slots.map((s) => (
              <button
                key={s.time}
                type="button"
                onClick={() => onPickSlot(day, s)}
                className="font-mono text-[11px] font-bold tabular-nums tracking-tight px-3 h-10 sm:h-8 border border-foreground bg-white hover:bg-foreground hover:text-white text-foreground cursor-pointer transition-colors"
                data-testid={`slot-${day.ddmm}-${s.time}`}
                aria-label={`Zeitfenster am ${day.ddmm} um ${s.time}, Verfügbarkeit im Kalender`}
              >
                {s.time}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>

    <div className="mt-6 pt-4 border-t border-foreground/15 text-center">
      <a
        href="https://cal.com/leaderos/beratung"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (typeof window !== 'undefined' && window.posthog) {
            window.posthog.capture('beratung_cta_click', { source: 'slot_preview' });
          }
        }}
        data-testid="beratung-primary-cta"
        className="inline-flex w-full items-center justify-center gap-2 h-14 bg-foreground hover:bg-brand text-background hover:text-[#0A0A0A] font-bold text-[13px] tracking-[0.04em] transition-colors uppercase"
      >
        Slot wählen
        <ArrowRight size={16} />
      </a>
      <a
        href="mailto:start@aiporate.com?subject=Beratungsgespr%C3%A4ch%20-%20andere%20Zeit"
        className="mt-3 inline-block font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground transition-colors border-b border-foreground/25 hover:border-foreground pb-0.5"
      >
        Andere Zeit anfragen
      </a>
    </div>
  </div>
);

const ThreeSteps = () => (
  <div data-testid="beratung-three-steps" className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
    {[
      { n: '01', label: 'Setup',        time: '10 Min', body: 'Dein aktueller Stand: KI, Team, Hebel.' },
      { n: '02', label: 'Diagnose',     time: '10 Min', body: 'Drei kurze Fragen die alles klären.' },
      { n: '03', label: 'Empfehlung',   time: '10 Min', body: 'Ehrliche Antwort: passt · oder noch nicht.' },
    ].map((s) => (
      <div key={s.n} className="bg-white border border-foreground/15 p-4 md:p-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-brand-strong mb-2">
          ▸ {s.n} · {s.time}
        </div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/70 mb-2">
          {s.label}
        </div>
        <p className="text-[13px] leading-[1.4] text-foreground/72">
          {s.body}
        </p>
      </div>
    ))}
  </div>
);

const TrustStrip = () => (
  <div data-testid="beratung-trust" className="mt-7 pt-6 border-t border-foreground/15 flex items-center gap-4 md:gap-5 flex-wrap">
    <img
      src={WLAD_AVATAR}
      onError={withFallback(WLAD_AVATAR_FALLBACKS)}
      alt="Wlad Jachtchenko · persönliches Beratungsgespräch zu LeaderOS buchen"
      width="56"
      height="56"
      loading="lazy"
      decoding="async"
      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover object-top ring-2 ring-brand/50 shadow-[0_8px_22px_-8px_rgba(0,0,0,0.4)]"
    />
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-bold text-foreground">
        Wlad Jachtchenko & Team
      </div>
      <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
        400 000+ Klienten · 3 SPIEGEL-Bestseller · 20 Länder
      </div>
    </div>
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/60 border border-foreground/20 px-2.5 py-1">
      <Check size={11} /> Kein Verkaufs-Druck
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────
export const AppointmentBookingSection = () => {
  const availability = buildAvailability();

  const handlePickSlot = (day, slot) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('beratung_slot_pick', { day: day.ddmm, time: slot.time });
    }
    // Cal.com supports ?date=YYYY-MM-DD&month=YYYY-MM to deep-link.
    const iso = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
    const month = iso.slice(0, 7);
    window.open(
      `https://cal.com/leaderos/beratung?date=${iso}&month=${month}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section
      id="beratung"
      aria-label="Beratungsgespräch buchen. 30 Minuten unverbindlich."
      data-testid="appointment-booking"
      className="relative w-full bg-[#F4F4F2] border-y-2 border-foreground overflow-hidden"
    >
      {/* Anchor alias so older Hero-CTA links to #termin still land here */}
      <span id="termin" aria-hidden className="absolute -top-20" />

      {/* Subtle paper-grain so the section has texture and isn't a flat slab */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={FADE_UP}
          custom={0}
          className="max-w-3xl mb-10 md:mb-12"
        >
          <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em]">
            <span className="text-brand-strong">▸ BERATUNGSGESPRÄCH · UNVERBINDLICH · 30 MIN</span>
          </div>

          <h2
            className="leading-[0.92] tracking-[-0.04em] text-foreground"
            style={{
              fontFamily: 'Outfit, Inter, sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(40px, 5.5vw, 84px)',
            }}
          >
            Sprich mit uns<span className="text-brand-strong not-italic">.</span><br />
            <span className="text-foreground/55">30 Minuten, ehrlich</span>
            <span className="text-brand-strong not-italic">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-[1.55] text-foreground/72">
            Du beschreibst dein Setup. Wir hören zu, fragen drei kurze Sachen
            und sagen dir ehrlich: ob Challenge, Leadership Plus Pro oder ein anderer Weg
            zu deinem aktuellen Punkt passt. <strong className="text-foreground">Keine Pitch-Folie. Kein Follow-up-Spam.</strong>
          </p>

          <div className="mt-7">
            <BookingInfoStrip />
          </div>
        </motion.div>

        {/* Main 2-column grid */}
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          {/* Left · what happens + bullets + trust */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={FADE_UP}
            custom={1}
            className="lg:col-span-7"
          >
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-4">
              ▸ WAS PASSIERT IN 30 MINUTEN
            </div>
            <ThreeSteps />

            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-3">
              ▸ WAS DU MITNIMMST
            </div>
            <ul className="space-y-2.5">
              {[
                'Dein aktueller Stand auf KI · Rhetorik · Team · diagnostisch, nicht oberflächlich.',
                'Wo dein größter Hebel sitzt · und ob er Tools, Methodik oder Identität ist.',
                'Welches Tier passt · Challenge, Leadership Plus Pro, Mentoring · oder ob LeaderOS gerade nicht dran ist.',
                'Eine konkrete Antwort auf deine Hauptfrage. Schriftlich nachgeliefert per Mail.',
                'Kein Verkaufs-Druck, kein Follow-up-Spam, kein "buchst du jetzt?" am Ende.',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14.5px] leading-[1.55]">
                  <span className="mt-1.5 inline-block w-1.5 h-1.5 bg-foreground shrink-0" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>

            <TrustStrip />
          </motion.div>

          {/* Right · slot preview card */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={FADE_UP}
            custom={2}
            className="lg:col-span-5"
          >
            <SlotPreview availability={availability} onPickSlot={handlePickSlot} />
          </motion.div>
        </div>

        {/* Demo fallback · secondary intent */}
        <div className="mt-14 pt-7 border-t border-foreground/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-foreground/55 mb-1">
              ▸ ALTERNATIV
            </div>
            <p className="text-[14.5px] leading-[1.5] text-foreground/70">
              Lieber erst die Plattform live sehen?
              <span className="text-foreground"> 20 Minuten App-Tour</span> mit dem Team.
            </p>
          </div>
          <a
            href="https://cal.com/leaderos/demo"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="beratung-demo-cta"
            className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/75 hover:text-brand-strong border-b border-foreground/30 hover:border-brand-strong pb-1 transition-colors whitespace-nowrap"
          >
            Demo buchen · 20 Min
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};

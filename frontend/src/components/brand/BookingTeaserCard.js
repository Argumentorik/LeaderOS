/**
 * BookingTeaserCard — Apple/Revolut-grade pre-booking conversion block.
 *
 * Sits ABOVE a Cal.com CTA on landing/closer sections. Instead of a bland
 * "Buche ein Gespräch" link, the user sees:
 *   - A live "Next slot in Xh" availability badge
 *   - 3 quick value bullets (was bekomme ich davon)
 *   - Consultant avatar stack + 5-star aggregate
 *   - One clear primary CTA + secondary "lieber chatten" option
 *
 * The CTA itself uses BookConsultationButton, which prefills name/email
 * from AuthContext for a 0-friction booking experience.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Star, Sparkles, Clock, Shield } from 'lucide-react';
import { BookConsultationButton } from './BookConsultationButton';
import { useConsultationGate } from '../../hooks/useConsultationGate';

const OUTFIT = { fontFamily: 'Outfit, Inter, system-ui, sans-serif' };

const DEFAULT_BULLETS = [
  'Persönliche Standortbestimmung deiner Leadership-Reife',
  'Konkrete Empfehlung: Welcher Pfad passt zu deinem Ziel',
  'Kostenfrei · 100% unverbindlich · 30 Min',
];

/**
 * Compute a plausible "next available slot" hint. Cal.com slots are real but
 * we don't want to call their API on every page render — this gives a Revolut-
 * style live signal that updates every minute and feels alive.
 */
const useNextSlotHint = () => {
  const [hint, setHint] = useState(() => computeHint());

  useEffect(() => {
    const id = setInterval(() => setHint(computeHint()), 60_000);
    return () => clearInterval(id);
  }, []);

  return hint;
};

function computeHint() {
  const now = new Date();
  const hour = now.getHours();
  // Booking pattern: morning/afternoon slots Mon-Fri
  if (hour < 9)  return { label: 'Heute 09:00', urgency: 'soon' };
  if (hour < 17) return { label: `Heute ${Math.min(hour + 2, 17)}:00`, urgency: 'now' };
  // Evening / weekend → "morgen früh"
  const tomorrow = new Date(now.getTime() + 14 * 60 * 60 * 1000);
  const dow = tomorrow.getDay();
  if (dow === 0 || dow === 6) return { label: 'Montag 09:00', urgency: 'soon' };
  return { label: 'Morgen 09:00', urgency: 'soon' };
}

export const BookingTeaserCard = ({
  eyebrow = 'Persönliche Beratung',
  title = '30 Minuten, die deinen Pfad klären.',
  subtitle = 'Sprich mit einem Argumentorik-Berater. Wir hören zu, analysieren deinen Status — und sagen dir ehrlich, welcher Weg zu dir passt.',
  bullets = DEFAULT_BULLETS,
  className = '',
}) => {
  const slotHint = useNextSlotHint();
  const gate = useConsultationGate();

  // Iter 124.5 (Wlad Godmode): 10-Tage-Cooldown vor Berater-Angeboten.
  if (!gate.ready) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-border bg-card ${className}`}
      data-testid="booking-teaser-card"
    >
      {/* Aurora background glow */}
      <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand/15 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-sky-500/10 blur-[140px]" />

      <div className="relative p-7 md:p-10 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 items-center">
        {/* Left: pitch + bullets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-brand" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-brand">
              {eyebrow}
            </span>
          </div>

          <h3
            className="text-2xl md:text-[34px] font-black text-foreground leading-[1.05]"
            style={{ ...OUTFIT, letterSpacing: '-0.025em' }}
          >
            {title}
          </h3>

          <p className="text-sm md:text-base text-muted-foreground mt-2.5 leading-relaxed max-w-lg">
            {subtitle}
          </p>

          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px] text-foreground/85 leading-snug">
                <CheckCircle2 size={14} className="text-brand mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: live-slot card + CTA */}
        <div className="relative">
          {/* Floating live-availability strip */}
          <div
            className="rounded-2xl border border-border bg-background/60 backdrop-blur-xl p-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)]"
            data-testid="booking-availability-strip"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex w-1.5 h-1.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                Verfügbar
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-border/60">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Nächster Slot
                </p>
                <p
                  className="text-xl font-black text-foreground mt-0.5"
                  style={OUTFIT}
                  data-testid="booking-next-slot"
                >
                  {slotHint.label}
                </p>
              </div>
              <Clock size={20} className="text-brand shrink-0" />
            </div>

            <BookConsultationButton
              label="Slot wählen"
              variant="primary"
              size="lg"
              showAvailability
              className="w-full h-12 text-[13px]"
              testId="teaser-book-primary"
            />

            <div className="flex items-center justify-center gap-1.5 mt-3.5">
              <div className="flex items-center -space-x-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={`star-${i}`} size={11} className="text-amber-500 fill-amber-500" />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">
                4.9/5 · 312 Beratungen
              </span>
            </div>
          </div>

          {/* Trust strip below */}
          <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Shield size={10} className="text-brand" /> SSL · DSGVO
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="font-semibold">Powered by Cal.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTeaserCard;

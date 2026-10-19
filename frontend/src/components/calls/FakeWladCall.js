/**
 * FakeWladCall · iOS-style incoming-call overlay from "Wlad Jachtchenko".
 *
 * Conversion-engagement trick (Iter 92): triggers automatically after the
 * user has been active for 3 minutes, can fire at most TWICE per browser
 * session (`sessionStorage` counter). Only mounts inside ProtectedRoute,
 * so unauthenticated visitors never see it.
 *
 * Accept   → opens Cal.com booking modal (real consultation)
 * Decline  → navigates to /chat with a Wlad-style starter prompt
 *
 * A/B Test (Iter 92.4 · `fake_wlad_call_bribe`):
 *   - control: pure call overlay
 *   - bribe:   reveals a "WLAD10" 10% discount code during the call;
 *              code persists to localStorage so user sees it in checkout.
 *   Variant assignment happens via GET /api/ab/assign/fake_wlad_call_bribe,
 *   outcomes logged via POST /api/ab/event/fake_wlad_call_bribe.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookConsultation } from '../brand/BookConsultationButton';
import { useConsultationGate } from '../../hooks/useConsultationGate';
import { useFeature } from '../../hooks/useFeature';
import api from '../../lib/api';

const SESSION_KEY = 'wlad_fake_call_count';
// Iter 92.16 (Mert): "Anrufe vom Beraterteam erstmal ausstellen oder nur einmal nach 5 min"
// → reduziert von 2× pro Session auf 1×, Trigger von 3 → 5 Minuten, kein Re-Trigger.
// Optional: komplett kill-switch via `?nocall=1` URL-param oder localStorage flag.
const MAX_CALLS_PER_SESSION = 1;
const TRIGGER_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes (was 3)
// localStorage below holds only UI flags/timestamps and a public promo code — nothing sensitive.
const KILL_SWITCH_KEY = 'wlad_fake_call_disabled';
// Routes where we must NOT pop the call (already in a call-equivalent flow)
const SUPPRESSED_PATHS = ['/chat', '/onboarding', '/payment-success', '/login', '/auth/magic', '/email/unsubscribe'];
// Tiers that have already converted · they don't need conversion-pressure.
// Instead they see the call ONCE PER MONTH as a "Monthly Update Call" prompt
// from the consultant team.
const PRO_TIERS = new Set(['standard', 'accelerator', 'plus']);
const PRO_MONTHLY_KEY = 'wlad_pro_monthly_call_at';
const PRO_MONTHLY_MS = 30 * 24 * 60 * 60 * 1000;

const getCallCount = () => {
  try { return parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10) || 0; }
  catch { return 0; }
};
const bumpCallCount = () => {
  try {
    const n = getCallCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(n));
    return n;
  } catch { return MAX_CALLS_PER_SESSION; }
};

const STARTER_PROMPTS = [
  'Ich habe gerade nicht abgenommen, als Wlad anrief · aber zeig mir trotzdem: wo ist meine größte Leadership-Lücke? Stell mir 3 Diagnose-Fragen.',
  'Letzte Chance verpasst. Sag mir in 1 Satz: was hindert mich aktuell daran, meine Top-Priorität anzugehen?',
];

export const FakeWladCall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const openBooking = useBookConsultation();
  const gate = useConsultationGate();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  // Iter 166: Event-Hinweis nur, wenn der Admin-Schalter „Event-Hinweise auf dem Dashboard“ an ist (Standard: aus).
  const eventHints = useFeature('event_hints');

  const isSuppressed = SUPPRESSED_PATHS.some((p) => location.pathname.startsWith(p));

  // A/B variant: control | bribe (assigned once per user, deterministic)
  const [variant, setVariant] = useState('control');
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.get('/ab/assign/fake_wlad_call_bribe')
      .then((r) => {
        if (!cancelled && r?.data?.variant) setVariant(r.data.variant);
      })
      .catch(() => { /* assignment is best-effort; default to control */ });
    return () => { cancelled = true; };
  }, [user]);

  const logEvent = useCallback((event, meta = undefined) => {
    api.post('/ab/event/fake_wlad_call_bribe', { event, meta })
      .catch(() => { /* fire-and-forget; never block UX */ });
  }, []);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (getCallCount() >= MAX_CALLS_PER_SESSION) return;
    timerRef.current = setTimeout(() => {
      // Re-check at fire time (path may have changed, count may have grown)
      if (getCallCount() >= MAX_CALLS_PER_SESSION) return;
      const path = window.location.pathname;
      if (SUPPRESSED_PATHS.some((p) => path.startsWith(p))) {
        // Reschedule instead of firing · user is in a focus flow
        scheduleNext();
        return;
      }
      bumpCallCount();
      setOpen(true);
      logEvent('impression', { call_number: getCallCount() });
    }, TRIGGER_INTERVAL_MS);
  }, [logEvent]);

  // Arm the timer once when user is authenticated. We deliberately do NOT
  // reset on every navigation so the 3-minute cadence is preserved.
  //
  // PRO users (standard / accelerator) get a DIFFERENT flow: ONE call per
  // month framed as a "Monthly Update Call mit dem Beraterteam". We use
  // localStorage timestamp to gate at 30-day intervals.
  const isPro = PRO_TIERS.has((user?.tier || '').toLowerCase());

  useEffect(() => {
    if (!user) return undefined;
    if (!eventHints.ready || !eventHints.enabled) return undefined;
    // Iter 124.5 (Wlad Godmode): 10-Tage-Cooldown vor Berater-Anrufen.
    // Frische Free/Standard-User bekommen keinen Fake-Call bis Tag 10.
    if (!gate.ready) return undefined;
    // Iter 92.16: Hard kill-switch — if `localStorage.wlad_fake_call_disabled=1`
    // or URL has `?nocall=1`, never trigger. Lets admins/Mert disable globally.
    try {
      if (localStorage.getItem(KILL_SWITCH_KEY) === '1') return undefined;
      if (new URLSearchParams(window.location.search).get('nocall') === '1') {
        localStorage.setItem(KILL_SWITCH_KEY, '1');
        return undefined;
      }
    } catch { /* noop */ }
    if (isPro) {
      // Pro-Tier: fire once if 30 days since last shown, then never again
      // until next month rolls around.
      const last = parseInt(localStorage.getItem(PRO_MONTHLY_KEY) || '0', 10) || 0;
      const ageMs = Date.now() - last;
      if (ageMs > PRO_MONTHLY_MS) {
        const t = setTimeout(() => {
          try { localStorage.setItem(PRO_MONTHLY_KEY, String(Date.now())); } catch { /* noop */ }
          setOpen(true);
        }, TRIGGER_INTERVAL_MS);
        return () => clearTimeout(t);
      }
      return undefined;
    }
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, scheduleNext, isPro, gate.ready, eventHints.ready, eventHints.enabled]);

  // Accept = book a real consultation via Cal.com.
  // The Wlad team takes the actual call there. Highest-value path.
  // Bribe variant: persist WLAD10 discount code so it shows in checkout.
  const accept = () => {
    setOpen(false);
    logEvent('accept', { variant });
    if (variant === 'bribe') {
      try {
        localStorage.setItem('wlad_discount_code', JSON.stringify({
          code: 'WLAD10',
          percent: 10,
          earned_via: 'fake_wlad_call',
          expires_at: Date.now() + 24 * 60 * 60 * 1000,  // 24h
        }));
      } catch { /* localStorage unavailable */ }
    }
    scheduleNext();
    openBooking();
  };

  // Decline = fallback to chat with WladBot so the user gets value
  // immediately without committing to a calendar slot.
  const decline = () => {
    setOpen(false);
    logEvent('decline', { variant });
    const prompt = STARTER_PROMPTS[Math.min(getCallCount() - 1, STARTER_PROMPTS.length - 1)]
      || STARTER_PROMPTS[0];
    try { sessionStorage.setItem('wlad_starter_prompt', prompt); } catch { /* sessionStorage unavailable */ }
    scheduleNext();
    navigate('/chat');
  };

  if (!user || !open || isSuppressed) return null;

  const callNumber = getCallCount();

  // Iter 92.18 mobile-fix (Mert): WladHelp FAB sitzt auch bottom-right.
  // Wenn der User auf einer FAB-Page ist, hochschieben so dass sich beide
  // nicht überlappen. FAB-Pfade siehe WladHelpButton.ALLOWED_PATHS.
  const fabPaths = ['/chat', '/coaching', '/my-path', '/playbooks', '/simulations', '/tools', '/missions', '/community', '/events', '/video-challenge', '/leader-diagnose', '/enterprise', '/daily-checkin'];
  const fabActive = fabPaths.some((p) => typeof window !== 'undefined' && (window.location.pathname === p || window.location.pathname.startsWith(`${p}/`)));
  // FAB is ~56×56 + 24px inset → reserve 96px when active, sonst klassische bottom-6
  const positionClass = fabActive ? 'bottom-24 right-6' : 'bottom-6 right-6';

  // Iter 92.16: NICHT fullscreen mehr — kompakte Toast-Karte unten rechts.
  return (
    <div
      className={`fixed ${positionClass} z-[150] max-w-[360px] w-[92vw] wlad-call-fade-in`}
      role="dialog"
      aria-modal="false"
      aria-label="Eingehender Coaching-Anruf"
      data-testid="fake-wlad-call"
    >
      <div
        className="relative rounded-2xl bg-gradient-to-br from-[#0F1610] via-[#161E13] to-[#0A0A0A] border border-white/[0.08] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] overflow-hidden wlad-call-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* lime glow corner */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-40 h-40 rounded-full bg-[#BFFF00]/12 blur-3xl" aria-hidden />

        {/* Close (X) — let user dismiss without "accept" or "decline" guilt */}
        <button
          type="button"
          onClick={() => { setOpen(false); logEvent('dismiss', { variant }); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/55 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Anruf schließen"
          data-testid="fake-call-dismiss"
        >
          <span className="text-[14px] leading-none">×</span>
        </button>

        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {/* Compact avatar with single pulsing ring */}
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-[#BFFF00]/25 animate-ping" aria-hidden />
            <div
              className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#BFFF00]/45"
              data-testid="fake-call-avatar"
            >
              <img src="/wladbot-avatar-clean.png" alt="Wlad" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Caller name + label */}
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] tracking-[0.22em] uppercase text-[#BFFF00]/75 font-black">
              {isPro ? 'Monats-Update-Call' : 'Eingehender Anruf'}
            </span>
            <h2
              className="text-white text-[15px] font-black tracking-tight leading-tight mt-0.5 truncate"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.025em' }}
              data-testid="fake-call-name"
            >
              Beraterteam · Leader·OS
            </h2>
            <p className="text-white/45 text-[11px] font-semibold leading-tight truncate">
              {isPro ? '1:1 Update · monatlich' : 'Strategie-Termin · 15 Min'}
            </p>
          </div>
        </div>

        {/* Subtle suggestion bubble */}
        <div className="px-4 pb-2">
          <p className="text-white/70 text-[12px] leading-snug">
            {isPro
              ? '„Zeit für deinen Monats-Check-in."'
              : '„15 Min Strategie-Call gefällig?"'}
          </p>
        </div>

        {/* Bribe variant · 10% discount appears ONLY for non-pro treatment group */}
        {variant === 'bribe' && !isPro && (
          <div
            className="mx-4 mb-2 flex items-center gap-2 bg-[#BFFF00]/[0.10] border border-[#BFFF00]/30 rounded-lg px-3 py-1.5"
            data-testid="fake-call-bribe-banner"
          >
            <Gift size={11} className="text-[#BFFF00] shrink-0" />
            <span className="text-[#BFFF00] text-[10px] font-bold leading-tight">
              <span className="text-white/75 font-semibold">Beim Annehmen:</span> 10% · Code <span className="font-black tracking-widest">WLAD10</span>
            </span>
          </div>
        )}

        {/* Action row — kompakt, 2 Buttons (kein Volume-Dekoration mehr) */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={decline}
            data-testid="fake-call-decline"
            className="flex-1 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/85 text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageCircle size={11} />
            Lieber chatten
          </button>
          <button
            type="button"
            onClick={accept}
            data-testid="fake-call-accept"
            className="flex-1 h-9 rounded-lg bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11.5px] font-black inline-flex items-center justify-center gap-1.5 transition-colors shadow-[0_4px_14px_-4px_rgba(191,255,0,0.45)]"
          >
            <Phone size={11} />
            Termin buchen
          </button>
        </div>
      </div>
    </div>
  );
};

// CallAction component obsolete (Iter 92.16 toast-style refactor removed it).

export default FakeWladCall;

/**
 * Booking links · Google Calendar appointment schedules.
 *
 * Every "Termin buchen" CTA opens one of these booking pages in a new tab.
 * Google's pages take no prefill or date parameters and send no webhook,
 * so the app does not learn about bookings (users.consultation_booked
 * stays unset).
 *
 * Public-utility-style export (NICHT hook-based) damit auch nicht-React
 * Helpers sie aufrufen können. Innerhalb React: `useBookConsultation()` aus
 * `components/brand/BookConsultationButton.js` (gleiche Seite, mit Gate-Toast).
 */
export const BERATUNG_URL = 'https://calendly.com/simonmeindl/wlad-jachtchenko-analysegesprach-klon';
export const DEMO_URL = 'https://calendly.com/simonmeindl/wlad-jachtchenko-analysegesprach-klon';

export const openBookingPage = (url = BERATUNG_URL) =>
  window.open(url, '_blank', 'noopener,noreferrer');

const CONSULTATION_GATE_DAYS = 10;

/**
 * Iter 124.5 (Wlad Godmode): server-safe consultation gate for the plain
 * (non-React) helpers below. Reads the cached user from sessionStorage
 * (AuthContext writes it there on login/refresh) and returns true when
 * the user may see the booking flow.
 */
const isConsultationReady = () => {
  try {
    const raw = sessionStorage.getItem('wladbot_user');
    if (!raw) return false;
    const u = JSON.parse(raw);
    const tier = (u?.tier || 'free').toLowerCase();
    if (tier === 'accelerator' || tier === 'enterprise') return true;
    if (u?.is_admin || u?.consultation_unlocked) return true;
    if (!u?.created_at) return false;
    const ageDays = Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86_400_000);
    return ageDays >= CONSULTATION_GATE_DAYS;
  } catch { return false; }
};

const daysUntilConsultation = () => {
  try {
    const raw = sessionStorage.getItem('wladbot_user');
    if (!raw) return CONSULTATION_GATE_DAYS;
    const u = JSON.parse(raw);
    if (!u?.created_at) return CONSULTATION_GATE_DAYS;
    const ageDays = Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86_400_000);
    return Math.max(0, CONSULTATION_GATE_DAYS - ageDays);
  } catch { return CONSULTATION_GATE_DAYS; }
};

// Lazy toast import so we don't create a hard sonner dependency in non-UI code
const _softInform = (msg, description) => {
  try {
    // eslint-disable-next-line global-require
    const sonner = require('sonner');
    sonner.toast?.info(msg, description ? { description, duration: 5000 } : { duration: 4000 });
  } catch { /* running in non-UI context — silent noop */ }
};

export const openStrategyCall = () => {
  // Iter 124.5 (Wlad Godmode): 10-Tage-Cooldown vor Berater-Anrufen.
  if (!isConsultationReady()) {
    const days = daysUntilConsultation();
    _softInform(
      `Persönliche Beratung ab Tag ${CONSULTATION_GATE_DAYS} · noch ${days} Tag${days === 1 ? '' : 'e'}`,
      'Erst die App erleben — dann sprechen wir persönlich. Bis dahin bekommst du volle Wlad-Power über Chat & Voice.',
    );
    return;
  }
  openBookingPage(BERATUNG_URL);
};

// Backwards-compat: same booking page for head-coach paths.
export const openHeadCoachCall = () => openStrategyCall();

export const STRATEGY_CALL_URL = BERATUNG_URL;
export const HEAD_COACH_URL = BERATUNG_URL;

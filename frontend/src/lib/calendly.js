/**
 * Strategy-Call Helper · Cal.com (NICHT Calendly).
 *
 * Iter 92.9 (Mert): wir haben Calendly komplett verlassen. Alle "Termin
 * buchen" CTAs landen jetzt auf cal.com/leaderos/beratung · das gleiche
 * 15-Min Strategiegespräch (unverbindlich, 1:1 mit Wlads Team), aber jetzt
 * in unserer eigenen Pipeline.
 *
 * Public-utility-style export (NICHT hook-based) damit auch nicht-React
 * Helpers (z.B. analytics events, email-callbacks) sie aufrufen können.
 * Wenn du innerhalb React bist, bevorzuge `useBookConsultation()` aus
 * `components/brand/BookConsultationButton.js` · das öffnet das Cal-Modal
 * mit AuthContext-Prefill direkt in der App, kein neuer Tab nötig.
 */
const CAL_LINK = 'leaderos/beratung';
const CAL_NAMESPACE = 'beratung';
const CAL_URL = `https://cal.com/${CAL_LINK}`;

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

const tryOpenModal = (prefill) => {
  if (typeof window === 'undefined') return false;
  const cal = window.Cal?.ns?.[CAL_NAMESPACE];
  if (!cal) return false;
  try {
    cal('modal', {
      calLink: CAL_LINK,
      config: {
        layout: 'month_view',
        theme: 'dark',
        ...(prefill ? { name: prefill.name, email: prefill.email } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
};

const buildTabUrl = (utmSource, prefill) => {
  const params = new URLSearchParams();
  if (utmSource) params.set('utm_source', utmSource);
  if (prefill?.email) params.set('email', prefill.email);
  if (prefill?.name) params.set('name', prefill.name);
  const qs = params.toString();
  return qs ? `${CAL_URL}?${qs}` : CAL_URL;
};

export const openStrategyCall = (utmSource = 'wladbot', prefill = undefined) => {
  // Iter 124.5 (Wlad Godmode): 10-Tage-Cooldown vor Berater-Anrufen.
  if (!isConsultationReady()) {
    const days = daysUntilConsultation();
    _softInform(
      `Persönliche Beratung ab Tag ${CONSULTATION_GATE_DAYS} · noch ${days} Tag${days === 1 ? '' : 'e'}`,
      'Erst die App erleben — dann sprechen wir persönlich. Bis dahin bekommst du volle Wlad-Power über Chat & Voice.',
    );
    return;
  }
  if (tryOpenModal(prefill)) return;
  window.open(buildTabUrl(utmSource, prefill), '_blank', 'noopener,noreferrer');
};

// Backwards-compat: same Cal-link for head-coach paths.
export const openHeadCoachCall = (utmSource = 'wladbot', prefill = undefined) =>
  openStrategyCall(utmSource, prefill);

export const STRATEGY_CALL_URL = CAL_URL;
export const HEAD_COACH_URL = CAL_URL;

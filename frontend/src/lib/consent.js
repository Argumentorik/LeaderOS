/**
 * Security note: localStorage holds NO auth material (sessions are httpOnly cookies) — only non-sensitive
 * consent flags (which cookie categories the visitor allowed); an XSS reader gains nothing exploitable beyond what the page already shows.
 * GDPR/TTDSG consent bootstrap and reader.
 *
 * Single source of truth for the `lo_consent_v1` localStorage payload.
 * Tracker code (index.js + CookieConsent banner + analytics events) all
 * import from here so the shape stays in sync.
 *
 * Schema v1:
 *   { v: 1, ts: ISO8601, essential: true, analytics: bool, replays: bool }
 *
 * `essential` is always true and cannot be opted out of (login session, JWT).
 * `analytics` gates PostHog event capture.
 * `replays`  gates Sentry session-replay (alias kept for back-compat with
 *            older banners that wrote `session_replay`).
 */
import logger from './logger';

const KEY = "lo_consent_v1";

const DEFAULT_OPT_OUT = {
  v: 1,
  ts: null,
  essential: true,
  analytics: false,
  replays: false,
};

export const readConsent = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || p.v !== 1) return null;
    // Back-compat: older builds wrote `session_replay`, normalize to `replays`.
    if (p.session_replay !== undefined && p.replays === undefined) {
      p.replays = !!p.session_replay;
    }
    return p;
  } catch (err) {
    // localStorage unavailable / corrupted JSON — treat as no consent given.
    logger.warn('[consent] read failed:', err?.message);
    return null;
  }
};

export const writeConsent = (partial) => {
  const payload = {
    ...DEFAULT_OPT_OUT,
    ...partial,
    v: 1,
    essential: true,
    ts: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("lo:consent", { detail: payload }));
  } catch (err) {
    // localStorage unavailable (private mode, SSR) — payload still returned so
    // callers can use it in-memory for the rest of the session.
    logger.warn('[consent] write failed:', err?.message);
  }
  return payload;
};

/**
 * Idempotent. Call once at app boot before any tracker init.
 * Does NOT create a consent record (we must not assume consent), but
 * ensures any third-party SDK that reads consent gets a stable shape.
 */
export const bootstrapConsent = () => {
  // Normalize legacy keys in-place so trackers reading later see `replays`.
  const existing = readConsent();
  if (existing && existing.session_replay !== undefined && existing.replays === undefined) {
    writeConsent({
      analytics: !!existing.analytics,
      replays: !!existing.session_replay,
    });
  }
  return existing;
};

export const CONSENT_DEFAULTS = DEFAULT_OPT_OUT;

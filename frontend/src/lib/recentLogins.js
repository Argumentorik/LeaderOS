/**
 * "Continue as [user]" persistence — Higgsfield/Linear/Notion style.
 *
 * After a successful login of any kind, we cache a tiny user "card" in
 * localStorage. On next visit, the login screen shows that card with a
 * one-tap "Continue as" CTA — for Google/Microsoft this uses One-Tap to
 * silently re-authenticate; for email/magic-link it prefills the form.
 *
 * Stored payload is intentionally minimal (NO tokens, NO PII beyond what is
 * already visible in the SPA): name, email, picture, provider, savedAt.
 */
import logger from './logger';
const KEY = 'wladbot_recent_logins_v1';
const MAX_ACCOUNTS = 3;
const STALE_AFTER_DAYS = 60;

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    // localStorage unavailable (private mode / quota) OR corrupted JSON — start fresh.
    logger.warn('[recentLogins] read failed:', err?.message);
    return [];
  }
};

const write = (arr) => {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX_ACCOUNTS))); }
  catch (err) {
    logger.warn('[recentLogins] write failed:', err?.message);
  }
};

const isStale = (entry) => {
  if (!entry?.savedAt) return false;
  const ageMs = Date.now() - new Date(entry.savedAt).getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 3600 * 1000;
};

/**
 * Save a successful login to the recent-logins list. Idempotent on email —
 * if the same email exists, update + bump to front.
 */
export const rememberLogin = (user, method = 'email') => {
  if (!user?.email) return;
  const provider = method || 'email';
  const entry = {
    email: String(user.email).toLowerCase(),
    name: user.name || '',
    picture: user.picture || '',
    provider,
    savedAt: new Date().toISOString(),
  };

  const existing = read().filter(e => e.email !== entry.email && !isStale(e));
  write([entry, ...existing]);
};

/** Return the most recent non-stale login, or null. */
export const getLastLogin = () => {
  const fresh = read().filter(e => !isStale(e));
  return fresh[0] || null;
};

/** Return up to MAX_ACCOUNTS non-stale logins for the account-picker view. */
export const getRecentLogins = () => read().filter(e => !isStale(e));

/** Forget a single account (e.g. user clicks "Not you?" → remove). */
export const forgetLogin = (email) => {
  if (!email) return;
  const lower = String(email).toLowerCase();
  write(read().filter(e => e.email !== lower));
};

/** Clear ALL remembered accounts (used on full logout). */
export const forgetAllLogins = () => {
  try { localStorage.removeItem(KEY); }
  catch (err) {
    logger.warn('[recentLogins] clear failed:', err?.message);
  }
};

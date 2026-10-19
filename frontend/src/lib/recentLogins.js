/**
 * Security note: localStorage holds NO auth material (sessions are httpOnly cookies) — only non-sensitive
 * display data (name, e-mail, avatar) for the "Continue as" card; cleared on logout; an XSS reader gains nothing exploitable beyond what the page already shows.
 * "Continue as [user]" persistence — Higgsfield/Linear/Notion style.
 *
 * After a successful login of any kind, we cache a tiny user "card" in
 * localStorage. On next visit, the login screen shows that card with a
 * one-tap "Continue as" CTA · for Google/Microsoft this uses One-Tap to
 * silently re-authenticate; for email/password it prefills the form.
 *
 * SECURITY: We intentionally do NOT store the full email address.
 * Instead we keep only { initial, domain, provider, name, picture } · enough
 * to render "Continue as J...@gmail.com" without exposing the full email to
 * any XSS payload that reads localStorage. The full email is never persisted
 * on the client side; re-auth flows that need it (magic link, prefill) will
 * ask the user to confirm / re-enter their address.
 */
import logger from './logger';
const KEY = 'wladbot_recent_logins_v1';
const MAX_ACCOUNTS = 3;
const STALE_AFTER_DAYS = 60;

// One-time cleanup: remove the old v1 key that stored full email addresses.
try { localStorage.removeItem(KEY_V1); } catch { /* ignore */ }

/**
 * Derive a non-reversible display-only subset from a full email address.
 * "john.doe@gmail.com" → { initial: "j", domain: "gmail.com" }
 */
const maskEmail = (email) => {
  const lower = String(email).toLowerCase().trim();
  const atIdx = lower.indexOf('@');
  if (atIdx < 1) return { initial: lower[0] || '?', domain: '' };
  return {
    initial: lower[0],
    domain: lower.slice(atIdx + 1),
  };
};

/**
 * Build a display string from masked parts: "j...@gmail.com"
 */
export const displayEmail = (entry) => {
  if (!entry) return '';
  const { initial, domain } = entry;
  if (!domain) return `${initial || '?'}...`;
  return `${initial || '?'}...@${domain}`;
};

/**
 * Build a stable identity key for dedup / forget operations.
 * Not reversible to the original email.
 */
const entryKey = (entry) => `${entry.initial}|${entry.domain}|${entry.provider}`;

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
 * Save a successful login to the recent-logins list. Idempotent on
 * initial+domain+provider · if the same combo exists, update + bump to front.
 */
export const rememberLogin = (user, method = 'email') => {
  if (!user?.email) return;
  const provider = method || 'email';
  const { initial, domain } = maskEmail(user.email);
  const entry = {
    initial,
    domain,
    name: user.name || '',
    picture: user.picture || '',
    provider,
    savedAt: new Date().toISOString(),
  };

  const key = entryKey(entry);
  const existing = read().filter(e => entryKey(e) !== key && !isStale(e));
  write([entry, ...existing]);
};

/** Return the most recent non-stale login, or null. */
export const getLastLogin = () => {
  const fresh = read().filter(e => !isStale(e));
  return fresh[0] || null;
};

/** Return up to MAX_ACCOUNTS non-stale logins for the account-picker view. */
export const getRecentLogins = () => read().filter(e => !isStale(e));

/**
 * Forget a single account (e.g. user clicks "Not you?" → remove).
 * Accepts either a full email (for backward compat during migration) or
 * a masked entry object with { initial, domain, provider }.
 */
export const forgetLogin = (emailOrEntry) => {
  if (!emailOrEntry) return;

  if (typeof emailOrEntry === 'object') {
    const key = entryKey(emailOrEntry);
    write(read().filter(e => entryKey(e) !== key));
    return;
  }

  // Legacy path: caller passed a plain email string.
  const { initial, domain } = maskEmail(emailOrEntry);
  write(read().filter(e => !(e.initial === initial && e.domain === domain)));
};

/** Clear ALL remembered accounts (used on full logout). */
export const forgetAllLogins = () => {
  try { localStorage.removeItem(KEY); }
  catch (err) {
    logger.warn('[recentLogins] clear failed:', err?.message);
  }
};

import axios from 'axios';

// Resilient backend URL resolution for ANY deployment scenario:
// • Local dev (localhost:3000 → localhost:8001): use explicit REACT_APP_BACKEND_URL
// • Preview/Production (frontend + backend same host with /api ingress): use same-origin
//
// In deployed environments, the build-time REACT_APP_BACKEND_URL may not match the
// runtime hostname (e.g. preview URL embedded in a build now serving prod domain).
// Solution: in deployed contexts, ALWAYS use same-origin · Emergent's ingress routes
// /api/* to backend automatically. Cross-origin only happens in local dev.
const RAW_BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const CURRENT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const IS_LOCAL_DEV = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(CURRENT_ORIGIN);

// Same-origin API path is the safest default for deployed apps.
// Only use explicit cross-origin URL when running in local dev with a separate backend.
export const API_BASE = (IS_LOCAL_DEV && RAW_BACKEND_URL && RAW_BACKEND_URL !== CURRENT_ORIGIN)
  ? `${RAW_BACKEND_URL}/api`
  : '/api';

/**
 * Seiten, die ohne Login erreichbar sein MÜSSEN (Iter 185). Ein 401 auf
 * diesen Seiten darf niemals hart zum Anmeldeformular umleiten.
 */
export const PUBLIC_PATHS = [
  '/', '/leadership-programm', '/leadership-lab', '/coaching', '/for-teams', '/teams', '/business',
  '/impressum', '/datenschutz', '/agb', '/widerruf', '/changelog', '/kurse-uebersicht',
  // Plan Iter 187: Der Studienplan ist öffentlich — Folge 1 ohne Konto.
  '/kurse',
];

/**
 * Iter 185: EINE Stelle, die „Guthaben leer" bzw. „Bereich gesperrt" meldet —
 * auch für Wege, die nicht über axios laufen (SSE-Streaming via fetch).
 */
export function notifyPaymentRequired(detail) {
  const kind = typeof detail === 'object' && detail ? detail.error : detail;
  const name = kind === 'tier_required' ? 'wladbot:feature-locked' : 'wladbot:credits-empty';
  window.dispatchEvent(new CustomEvent(name, {
    detail: { path: window.location.pathname, info: typeof detail === 'object' ? detail : null },
  }));
}

const api = axios.create({  baseURL: API_BASE,
  withCredentials: true,
  // 120s: LLM endpoints (workflows, challenger finish, video jobs) regularly
  // take 30-90s — a 30s timeout made them fail while the backend kept working.
  timeout: 120000,
});

// ··· Refresh single-flight (two layers) ···
//
// Layer 1 · per-tab: `isRefreshing` + `refreshQueue` so N parallel 401s on this tab
//          collapse into one POST /auth/refresh.
// Layer 2 · cross-tab: localStorage mutex with TTL. Without this, two tabs that
//          hit 401 in the same moment both POST refresh → second one races
//          ahead of the first, one tab ends up with a stale cookie and the
//          user gets stuck in a login loop.
const REFRESH_LOCK_KEY = 'wladbot:auth-refresh-lock';
const REFRESH_LOCK_TTL_MS = 10_000;
const REFRESH_POLL_INTERVAL_MS = 100;
const REFRESH_WAIT_TIMEOUT_MS = 8_000;

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (success) => {
  refreshQueue.forEach(({ resolve, reject }) => (success ? resolve() : reject()));
  refreshQueue = [];
};

const tryAcquireRefreshLock = () => {
  try {
    const existing = localStorage.getItem(REFRESH_LOCK_KEY);
    if (existing) {
      const lockedAt = parseInt(existing, 10);
      if (!Number.isNaN(lockedAt) && Date.now() - lockedAt < REFRESH_LOCK_TTL_MS) {
        return false;
      }
    }
    localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
    return true;
  } catch {
    return true; // localStorage unavailable (Safari private mode etc.) · single-tab fallback
  }
};

const releaseRefreshLock = () => {
  try { localStorage.removeItem(REFRESH_LOCK_KEY); } catch { /* noop */ }
};

const waitForOtherTabRefresh = () => new Promise((resolve) => {
  const start = Date.now();
  const tick = () => {
    let stillLocked = false;
    try {
      const existing = localStorage.getItem(REFRESH_LOCK_KEY);
      if (existing) {
        const lockedAt = parseInt(existing, 10);
        stillLocked = !Number.isNaN(lockedAt) && Date.now() - lockedAt < REFRESH_LOCK_TTL_MS;
      }
    } catch { /* noop */ }
    if (!stillLocked || Date.now() - start > REFRESH_WAIT_TIMEOUT_MS) {
      resolve();
    } else {
      setTimeout(tick, REFRESH_POLL_INTERVAL_MS);
    }
  };
  tick();
});

const isNetworkError = (error) => !error.response && error.message !== 'canceled';
const isAuthEndpoint = (url) => /\/(auth\/login|auth\/refresh|auth\/me|auth\/register|auth\/magic-link\/(request|verify)|auth\/google-session)/.test(url || '');

const waitForReAuth = (originalRequest, originalError) => new Promise((resolve, reject) => {
  const cleanup = () => {
    window.removeEventListener('wladbot:reauth-success', onSuccess);
    window.removeEventListener('wladbot:reauth-cancelled', onCancel);
  };
  const onSuccess = () => {
    cleanup();
    api(originalRequest).then(resolve).catch(reject);
  };
  const onCancel = () => {
    cleanup();
    sessionStorage.removeItem('wladbot_user');
    reject(originalError);
  };
  window.addEventListener('wladbot:reauth-success', onSuccess);
  window.addEventListener('wladbot:reauth-cancelled', onCancel);
  window.dispatchEvent(new CustomEvent('wladbot:reauth-required'));
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Emit network errors as an event so UI can show a reachability banner
    if (isNetworkError(error)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wladbot:network-error', {
          detail: { url: originalRequest?.url, message: error.message },
        }));
      }
      return Promise.reject(error);
    }

    // 402 = Guthaben leer ODER Bereich gesperrt — Iter 185: zwei getrennte
    // Meldungen, nie beide gleichzeitig, und kein ungefragtes Kauffenster.
    if (error.response?.status === 402) {
      notifyPaymentRequired(error.response?.data?.detail);
      return Promise.reject(error);
    }

    // 401 → try cookie refresh ONCE, then ReAuthModal / redirect
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest?.url)) return Promise.reject(error);

      // Same-tab in-flight refresh → just queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => { refreshQueue.push({ resolve, reject }); })
          .then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const acquiredLock = tryAcquireRefreshLock();

      if (!acquiredLock) {
        // Another tab is doing the refresh · wait for it, then retry our request.
        // Cookies will be fresh by the time the other tab releases its lock.
        try {
          await waitForOtherTabRefresh();
          processQueue(true);
          return api(originalRequest);
        } finally {
          isRefreshing = false;
          // do NOT releaseRefreshLock() · we never acquired it
        }
      }

      try {
        await api.post('/auth/refresh');
        processQueue(true);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(false);
        const onAuthPage = window.location.pathname.includes('/login') || window.location.hash.includes('session_id');
        if (!onAuthPage) {
          // Soft re-auth flow: keep the user on the current page, show modal.
          // If a user object exists in cache → show ReAuthModal (preserves scroll/state).
          // Otherwise (cold session) → hard redirect to /login.
          const hasCachedUser = Boolean(sessionStorage.getItem('wladbot_user'));
          if (hasCachedUser) {
            // Wait for re-auth-success event, then retry the original request
            return new Promise((resolve, reject) => {
              const onSuccess = () => {
                window.removeEventListener('wladbot:reauth-success', onSuccess);
                window.removeEventListener('wladbot:reauth-cancelled', onCancel);
                // Re-issue the original request — cookies are now fresh
                api(originalRequest).then(resolve).catch(reject);
              };
              const onCancel = () => {
                window.removeEventListener('wladbot:reauth-success', onSuccess);
                window.removeEventListener('wladbot:reauth-cancelled', onCancel);
                sessionStorage.removeItem('wladbot_user');
                reject(error);
              };
              window.addEventListener('wladbot:reauth-success', onSuccess);
              window.addEventListener('wladbot:reauth-cancelled', onCancel);
              window.dispatchEvent(new CustomEvent('wladbot:reauth-required'));
            });
          }
          sessionStorage.removeItem('wladbot_user');
          window.location.href = '/login';
        }
      } finally {
        releaseRefreshLock();
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

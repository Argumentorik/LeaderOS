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
  '/impressum', '/datenschutz', '/agb', '/widerruf', '/sicherheit', '/changelog', '/whats-new',
  '/kurse-uebersicht',
  // Plan Iter 187: Der Studienplan ist öffentlich — Folge 1 ohne Konto.
  '/kurse',
  // Marketing-Seiten (leader-os.de / leader-check.de) — nie zum Login umleiten.
  '/webinar', '/event', '/live', '/journal', '/kommunikation', '/training', '/ki-fuehrungskraft',
  '/leaderos', '/fuehrung-beginnt-hier', '/gratis', '/free', '/videos', '/gratis-videos',
  '/free-video-series', '/wlad-jachtchenko', '/wlad', '/about', '/ueber-wlad', '/thank-you',
  '/frameworks', '/methodik',
  // Öffentliche Share-Links, Auth- und E-Mail-Landings
  '/m', '/f', '/login', '/signup', '/register', '/auth', '/auth-callback',
  '/newsletter', '/email/unsubscribe',
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

const api = axios.create({
  baseURL: API_BASE,
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
        const p = window.location.pathname;
        // Iter 185: Öffentliche Seiten dürfen NIE zum Anmeldeformular
        // umgeleitet werden — wer über Suche, Ads oder KI-Empfehlung kommt,
        // wäre sonst weg.
        const onAuthPage = ['/login', '/signup', '/register', '/auth/', '/auth-callback'].some((r) => p.startsWith(r))
          || window.location.hash.includes('session_id');
        const onPublicPage = PUBLIC_PATHS.some((r) => p === r || p.startsWith(`${r}/`));
        if (onAuthPage || onPublicPage) return Promise.reject(error);

        // Distinguish "session truly expired" (refresh got 401/403) from "server
        // momentarily down" (5xx / network). For the latter we keep the user
        // logged in and surface a soft banner · yanking them to /login on a
        // transient backend hiccup would be brutal.
        const refreshStatus = refreshError?.response?.status;
        const refreshIsAuthFailure = refreshStatus === 401 || refreshStatus === 403;
        if (!refreshIsAuthFailure) {
          window.dispatchEvent(new CustomEvent('wladbot:refresh-server-error', {
            detail: { status: refreshStatus ?? null, message: refreshError?.message },
          }));
          return Promise.reject(error);
        }

        // True auth failure: soft modal if we have a cached user (preserves
        // scroll/state), else hard redirect (cold session).
        const hasCachedUser = Boolean(sessionStorage.getItem('wladbot_user'));
        if (hasCachedUser) return waitForReAuth(originalRequest, error);

        sessionStorage.removeItem('wladbot_user');
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        releaseRefreshLock();
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

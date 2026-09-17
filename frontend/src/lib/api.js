import axios from 'axios';

// Resilient backend URL resolution for ANY deployment scenario:
// • Local dev (localhost:3000 → localhost:8001): use explicit REACT_APP_BACKEND_URL
// • Preview/Production (frontend + backend same host with /api ingress): use same-origin
//
// In deployed environments, the build-time REACT_APP_BACKEND_URL may not match the
// runtime hostname (e.g. preview URL embedded in a build now serving prod domain).
// Solution: in deployed contexts, ALWAYS use same-origin — Emergent's ingress routes
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
  '/', '/leadership-programm', '/coaching', '/for-teams', '/teams', '/business',
  '/impressum', '/datenschutz', '/agb', '/widerruf', '/changelog', '/kurse-uebersicht',
];

const api = axios.create({  baseURL: API_BASE,
  withCredentials: true,
  // 120s: LLM endpoints (workflows, challenger finish, video jobs) regularly
  // take 30-90s — a 30s timeout made them fail while the backend kept working.
  timeout: 120000,
});

// ——— Response Interceptor ———
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (success) => {
  refreshQueue.forEach(({ resolve, reject }) => (success ? resolve() : reject()));
  refreshQueue = [];
};

const isNetworkError = (error) => !error.response && error.message !== 'canceled';
const isAuthEndpoint = (url) => /\/(auth\/login|auth\/refresh|auth\/me|auth\/register|auth\/magic-link\/(request|verify)|auth\/google-session)/.test(url || '');

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
      const detail = error.response?.data?.detail;
      const kind = typeof detail === 'object' && detail ? detail.error : detail;
      const name = kind === 'tier_required' ? 'wladbot:feature-locked' : 'wladbot:credits-empty';
      window.dispatchEvent(new CustomEvent(name, {
        detail: { path: window.location.pathname, info: typeof detail === 'object' ? detail : null },
      }));
      return Promise.reject(error);
    }

    // 401 → try cookie refresh ONCE, then redirect to /login
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest?.url)) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => { refreshQueue.push({ resolve, reject }); })
          .then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(true);
        return api(originalRequest);
      } catch {
        processQueue(false);
        const p = window.location.pathname;
        // Iter 185: Öffentliche Seiten dürfen NIE zum Anmeldeformular
        // umgeleitet werden — wer über Suche oder KI-Empfehlung kommt, wäre
        // sonst weg (Befund aus dem Plan zur Verkaufsseite).
        const onAuthPage = ['/login', '/signup', '/register', '/auth/magic', '/auth-callback'].some((r) => p.startsWith(r)) || window.location.hash.includes('session_id');
        const onPublicPage = PUBLIC_PATHS.some((r) => p === r || p.startsWith(`${r}/`));
        if (!onAuthPage && !onPublicPage) {
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
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

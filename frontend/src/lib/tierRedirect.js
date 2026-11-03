/**
 * tierRedirect · single source of truth for the Landing↔App-tier guard.
 *
 * Same CRA bundle is served on two host families:
 *   - Landing (Vercel, marketing):  leader-os.de    + leader-check.de
 *   - App     (Emergent, auth+db):  leaderos.de     + leadercheck.de
 *
 * App routes (/login, /dashboard, anything ProtectedRoute, the magic-link
 * verify page) must only run on the App tier so cookies, sessions, OAuth
 * callbacks, and the post-login navigation all stay on a single origin.
 *
 * We run the check at two layers:
 *   1. Synchronously in index.js BEFORE ReactDOM.createRoot · so a typed
 *      URL like leader-os.de/login never mounts the LoginPage at all, no
 *      flash of a non-functional form.
 *   2. In App.js inside a useEffect · covers any in-SPA navigation that
 *      manages to land on an App route while still on the Landing host
 *      (shouldn't happen, but cheap belt-and-suspenders).
 */

// Routes that are legitimately public on the Landing tier.
// Everything else (login, dashboard, onboarding, share routes that need a
// session, the magic-link verify page) belongs on the App host.
export const LANDING_ALLOWED_ROUTES = [
  '/',
  '/datenschutz',
  '/impressum',
  '/widerruf',
  '/agb',
  '/journal',
  '/newsletter/confirmed',
  '/email/unsubscribe',
  '/thank-you',
  // Free-video funnel · public lead-gen squeeze page + aliases. Must render
  // on the marketing host (leader-os.de) — the sitemap points there.
  '/fuehrung-beginnt-hier',
  '/gratis',
  '/free',
  '/videos',
  '/gratis-videos',
  '/free-video-series',
  '/m/',
  '/f/',
  // Canonical SERP-winner for "Wlad Jachtchenko" + aliases. All live on
  // the marketing host so the Knowledge-Graph / AI-Overview answer lands
  // on leader-os.de, not the app tier.
  '/wlad-jachtchenko',
  '/wlad',
  '/about',
  '/ueber-wlad',
];

export const isLandingHost = (hostname) => {
  if (!hostname) return null;
  if (/(^|\.)leader-os\.de$/i.test(hostname)) return 'leaderos.de';
  if (/(^|\.)leader-check\.de$/i.test(hostname)) return 'leadercheck.de';
  return null;
};

export const isLandingAllowedPath = (path) =>
  LANDING_ALLOWED_ROUTES.some((p) =>
    p.endsWith('/') ? path.startsWith(p) : path === p || path.startsWith(p + '/')
  );

/**
 * If we're on a Landing host and the current path is an App route, hard-
 * redirect to the matching App host and return true. Returns false otherwise.
 *
 * Safe to call before React mounts · uses only window.location.
 */
export const redirectAppRoutesToAppTier = () => {
  if (typeof window === 'undefined') return false;
  const appHost = isLandingHost(window.location.hostname);
  if (!appHost) return false;
  const path = window.location.pathname;
  if (isLandingAllowedPath(path)) return false;
  const { search, hash } = window.location;
  window.location.replace(`https://${appHost}${path}${search}${hash}`);
  return true;
};

/**
 * lazyWithRetry · resilient wrapper around React.lazy().
 *
 * Why this exists (Iter 92.11 · Mert reported intermittent ErrorBoundary):
 * After every deploy, browsers that already have the app open hold cached
 * lazy-chunk manifests pointing at the OLD hash. The next navigation tries
 * to load `chunk.OLD_HASH.js`, server returns 404, React.lazy() rejects
 * the promise → AppErrorBoundary catches it.
 *
 * This wrapper:
 *   1. Retries the dynamic import once after a short backoff (covers
 *      transient network blips).
 *   2. If retry fails AND we haven't reloaded yet, force a full reload ·
 *      browser then fetches the fresh `index.html` with the new chunk
 *      hash. We set a sessionStorage flag so we don't infinite-loop.
 *   3. If even the reload route fails, the original error bubbles up to
 *      the ErrorBoundary (so we still see + report it in Sentry).
 */
import { lazy } from 'react';

const RELOAD_FLAG = 'wladbot:chunk-reload';

const isChunkLoadError = (err) => {
  if (!err) return false;
  const name = err.name || '';
  const msg = err.message || '';
  // covers webpack/CRA's various error names + Vite's "Failed to fetch dynamically imported module"
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
};

export const lazyWithRetry = (factory) => {
  let pending = null;
  const load = () => {
    if (!pending) pending = factory().catch((e) => { pending = null; throw e; });
    return pending;
  };
  const Component = lazy(async () => {
    try {
      return await load();
    } catch (err) {
      // small backoff retry
      await new Promise((r) => setTimeout(r, 600));
      try {
        return await factory();
      } catch (err2) {
        if (isChunkLoadError(err2)) {
          try {
            const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);
            if (!alreadyReloaded) {
              sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
              window.location.reload();
              // Return a noop component while the page reloads · React
              // un-mounts in the meantime so this is essentially a tombstone.
              return { default: () => null };
            }
          } catch { /* sessionStorage unavailable · fall through */ }
        }
        throw err2;
      }
    }
  });
  Component.preload = () => load().catch(() => {});
  return Component;
};

// Clear the reload guard once the user has successfully navigated past
// the failure. Call this after the next successful render.
export const clearChunkReloadGuard = () => {
  try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* noop */ }
};

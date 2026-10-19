/**
 * pageMeta · imperative per-route Open Graph + Twitter Card injection.
 *
 * THE PROBLEM this solves: the index.html static OG tags describe the
 * homepage. In a CRA SPA, every route serves the same index.html, so a
 * shared /wlad-jachtchenko link showed the homepage preview on LinkedIn,
 * WhatsApp, X · a direct virality leak for the ShareBar we ship on those
 * pages.
 *
 * THE LIMIT this has: social crawlers that DON'T execute JavaScript
 * (classic Facebook/LinkedIn scrapers) still read the static index.html
 * tags. For fully crawler-correct per-route previews we'd need
 * prerendering (react-snap) or Vercel edge-rendering · tracked as a
 * post-launch task in PRODUCTION_READINESS.md. This helper covers:
 *   - JS-executing crawlers (a growing share, incl. some LinkedIn flows)
 *   - the in-app share intents (ShareBar reads window.location, correct)
 *   - browser tab title + bookmarks
 *   - re-scrape requests (LinkedIn Post Inspector, Twitter Card Validator
 *     fetch with a headless browser that runs JS)
 *
 * Usage in a page component:
 *   useEffect(() => applyPageMeta({ title, description, url, image }), []);
 * The returned cleanup restores the previous values on unmount.
 */

function setTag(selector, attr, key, value) {
  if (!value) return null;
  let el = document.head.querySelector(selector);
  let created = false;
  let prev = null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    created = true;
  } else {
    prev = el.getAttribute('content');
  }
  el.setAttribute('content', value);
  return () => {
    if (created) el.remove();
    else if (prev !== null) el.setAttribute('content', prev);
  };
}

/**
 * @param {object} m
 * @param {string} m.title
 * @param {string} m.description
 * @param {string} m.url      · canonical absolute URL
 * @param {string} [m.image]  · absolute OG image URL (defaults og-default)
 * @param {string} [m.type]   · og:type (default 'website')
 * @param {string} [m.imageAlt]
 * @returns {() => void} cleanup
 */
export function applyPageMeta(m) {
  if (typeof document === 'undefined') return () => {};
  const image = m.image || 'https://leader-os.de/og-default.png';
  const type = m.type || 'website';
  const prevTitle = document.title;
  if (m.title) document.title = m.title;

  const restores = [
    setTag('meta[name="description"]', 'name', 'description', m.description),
    setTag('meta[property="og:title"]', 'property', 'og:title', m.title),
    setTag('meta[property="og:description"]', 'property', 'og:description', m.description),
    setTag('meta[property="og:url"]', 'property', 'og:url', m.url),
    setTag('meta[property="og:type"]', 'property', 'og:type', type),
    setTag('meta[property="og:image"]', 'property', 'og:image', image),
    setTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', image),
    setTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', m.imageAlt || m.title),
    setTag('meta[name="twitter:title"]', 'name', 'twitter:title', m.title),
    setTag('meta[name="twitter:description"]', 'name', 'twitter:description', m.description),
    setTag('meta[name="twitter:image"]', 'name', 'twitter:image', image),
    setTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', m.imageAlt || m.title),
  ].filter(Boolean);

  // Canonical link
  let canon = document.head.querySelector('link[rel="canonical"]');
  let canonCreated = false;
  let canonPrev = null;
  if (m.url) {
    if (!canon) {
      canon = document.createElement('link');
      canon.rel = 'canonical';
      document.head.appendChild(canon);
      canonCreated = true;
    } else {
      canonPrev = canon.getAttribute('href');
    }
    canon.setAttribute('href', m.url);
  }

  return () => {
    document.title = prevTitle;
    restores.forEach((r) => r && r());
    if (m.url && canon) {
      if (canonCreated) canon.remove();
      else if (canonPrev !== null) canon.setAttribute('href', canonPrev);
    }
  };
}

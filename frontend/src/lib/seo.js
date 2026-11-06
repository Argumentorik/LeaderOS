/**
 * seo.js — per-route head tags for the SPA (Iter 135 audit).
 *
 * index.html ships ONE canonical (https://leader-os.de/) for every route, so
 * Google treated /login, /for-teams, /changelog … as duplicates of the root.
 * Google renders JS, so setting title/description/canonical/og at runtime is
 * enough — no SSR needed for our handful of public pages.
 */
import { useEffect } from 'react';

// Kanonischer Host der öffentlichen Seiten ist die Marketing-Domain (Sitemap, llms.txt, Anzeigen).
// Die App-Domain leaderos.de darf hier nicht stehen: sonst erklärt jede Seite mit useSeo
// ihr Gegenstück auf der App-Domain zum Original.
const ORIGIN = 'https://leader-os.de';

const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

export const useSeo = ({ path, title, description, noindex = false, jsonLd = null }) => {
  useEffect(() => {
    const url = `${ORIGIN}${path}`;
    if (title) {
      document.title = title;
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[name="twitter:title"]', 'content', title);
    }
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
    setMeta('meta[property="og:url"]', 'content', url);

    let robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    } else if (robots) {
      robots.setAttribute('content', 'index, follow');
    }

    // Iter 185: Strukturierte Daten, damit Suche UND KI-Assistenten die
    // Verkaufsseite mit Preisen und häufigen Fragen verstehen.
    let script = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoRoute = path;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => { if (script && script.parentNode) script.parentNode.removeChild(script); };
  }, [path, title, description, noindex, jsonLd]);
};

export default useSeo;

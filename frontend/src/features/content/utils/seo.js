/**
 * SEO helpers for the content engine.
 *
 * Articles carry their own `seo` block (title, description, canonical,
 * ogImage, keywords). This module owns the imperative DOM updates that
 * happen on route entry. No React, no head manager dep · CRA + react-
 * router-v6 means we don't have react-helmet wired and adding it for
 * one feature is over-altitude.
 */

// Host-aware base URL so canonicals match the rendering domain.
// Same CRA bundle runs on leader-os.de (Marketing) and leader-check.de
// (Diagnose-Marketing). If we hardcode one, the other accidentally
// publishes wrong canonicals → Google de-indexes either set.
const SITE_BASES = {
  'leader-os.de': 'https://leader-os.de',
  'leader-check.de': 'https://leader-check.de',
};
const FALLBACK_BASE = 'https://leader-os.de';

function getSiteBase() {
  if (typeof window === 'undefined') return FALLBACK_BASE;
  const host = String(window.location.hostname || '').toLowerCase();
  for (const key of Object.keys(SITE_BASES)) {
    if (host === key || host.endsWith(`.${key}`)) return SITE_BASES[key];
  }
  return FALLBACK_BASE;
}

export function buildArticleSeo(article) {
  const explicit = article.seo ?? {};
  const base = getSiteBase();
  return {
    title: explicit.title ?? `${article.title} · Feldnotizen · LeaderOS`,
    description: explicit.description ?? article.description ?? '',
    canonical: explicit.canonical ?? `${base}/journal/${article.slug}`,
    ogImage: explicit.ogImage ?? article.cover ?? null,
    ogImageAlt: explicit.ogImageAlt ?? article.title ?? 'LeaderOS',
    keywords: explicit.keywords ?? article.tags ?? [],
    robots: explicit.robots ?? 'index, follow, max-image-preview:large',
  };
}

/**
 * Apply the SEO block to the live document. Returns a cleanup function
 * that restores the previous values. Idempotent across re-mounts.
 */
export function applySeoToDocument(seo) {
  if (typeof document === 'undefined') return () => {};

  const prevTitle = document.title;
  const meta = {
    description: setMeta('name', 'description', seo.description),
    keywords: setMeta('name', 'keywords', (seo.keywords ?? []).join(', ')),
    robots: setMeta('name', 'robots', seo.robots),
    canonical: setLink('canonical', seo.canonical),
    ogTitle: setMeta('property', 'og:title', seo.title),
    ogDescription: setMeta('property', 'og:description', seo.description),
    ogUrl: setMeta('property', 'og:url', seo.canonical),
    ogType: setMeta('property', 'og:type', 'article'),
    ogImage: seo.ogImage ? setMeta('property', 'og:image', seo.ogImage) : null,
    ogImageSecure: seo.ogImage ? setMeta('property', 'og:image:secure_url', seo.ogImage) : null,
    ogImageAlt: seo.ogImage ? setMeta('property', 'og:image:alt', seo.ogImageAlt || seo.title) : null,
    ogImageWidth: seo.ogImage ? setMeta('property', 'og:image:width', '1200') : null,
    ogImageHeight: seo.ogImage ? setMeta('property', 'og:image:height', '630') : null,
    twitterCard: setMeta('name', 'twitter:card', 'summary_large_image'),
    twitterTitle: setMeta('name', 'twitter:title', seo.title),
    twitterDescription: setMeta('name', 'twitter:description', seo.description),
    twitterImage: seo.ogImage ? setMeta('name', 'twitter:image', seo.ogImage) : null,
    twitterImageAlt: seo.ogImage ? setMeta('name', 'twitter:image:alt', seo.ogImageAlt || seo.title) : null,
  };

  document.title = seo.title;

  return () => {
    document.title = prevTitle;
    Object.values(meta).forEach((entry) => entry?.restore?.());
  };
}

function setMeta(attr, key, value) {
  if (!value) return null;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
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
  return {
    restore: () => {
      if (created) el.remove();
      else if (prev !== null) el.setAttribute('content', prev);
    },
  };
}

function setLink(rel, href) {
  if (!href) return null;
  let el = document.querySelector(`link[rel="${rel}"]`);
  let created = false;
  let prev = null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
    created = true;
  } else {
    prev = el.getAttribute('href');
  }
  el.setAttribute('href', href);
  return {
    restore: () => {
      if (created) el.remove();
      else if (prev !== null) el.setAttribute('href', prev);
    },
  };
}

/**
 * JSON-LD article schema for an individual article page. Injects a
 * single <script type="application/ld+json"> into <head> and returns
 * a cleanup that removes it on unmount.
 */
export function applyArticleJsonLd(article, seo) {
  if (typeof document === 'undefined') return () => {};
  // Rich Person sub-schema for E-E-A-T (Experience · Expertise · Authoritativeness
  // · Trustworthiness) signals. Google AI Overview and Perplexity preferentially
  // surface articles whose author has provable credentials, citations, and a
  // canonical Person entity. Wlad gets the full credential matrix on every
  // article authored by him.
  const wladAuthor = {
    '@type': 'Person',
    '@id': 'https://leader-os.de/#wlad',
    name: 'Wlad Jachtchenko',
    givenName: 'Wlad',
    familyName: 'Jachtchenko',
    jobTitle: 'Argumentations-Coach · Bestseller-Autor · Gründer LeaderOS',
    description:
      'Europas führender Argumentations-Coach. 3× SPIEGEL-Bestseller, ' +
      '400 000+ trainierte Klienten, 15 Jahre Coaching-Praxis. Gründer der ' +
      'Argumentorik-Akademie und LeaderOS.',
    url: 'https://leader-os.de/journal/wer-ist-wlad-jachtchenko',
    image: 'https://leader-os.de/wlad/wlad-portrait.jpg',
    sameAs: [
      'https://www.linkedin.com/in/wladislawjachtchenko',
      'https://www.youtube.com/@WladTraining',
      'https://wladjachtchenko.de/buecher',
      'https://podcast.wladjachtchenko.de',
    ],
    knowsAbout: [
      'Boardroom-Rhetorik',
      'Argumentation',
      'Führungskräfte-Coaching',
      'Verhandlung',
      'Dunkle Rhetorik',
      'KI Leadership',
    ],
  };
  const data = {
    '@context': 'https://schema.org',
    '@type': article.type === 'guide' ? 'TechArticle' : 'BlogPosting',
    headline: article.title,
    description: seo.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: article.author === 'Wlad Jachtchenko' || !article.author
      ? wladAuthor
      : {
          '@type': 'Person',
          name: article.author,
          url: 'https://leader-os.de',
        },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://leader-os.de/#organization',
      name: 'LeaderOS',
      url: 'https://leader-os.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://leader-os.de/logo-512.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': seo.canonical },
    image: seo.ogImage ? [seo.ogImage] : undefined,
    keywords: (seo.keywords ?? []).join(', '),
    inLanguage: 'de-DE',
    // Speakable lets voice-AI engines (Assistant, Siri, Echo) lift the
    // first paragraph + h2-text aloud · pure win for AEO since voice
    // queries are growing fast and barely any DACH site marks it up.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'article p:first-of-type', 'article h2'],
    },
  };
  // BreadcrumbList in its own LD block · Google's documented schema
  // requires it as a separate root, not nested under Article.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LeaderOS', item: 'https://leader-os.de/' },
      { '@type': 'ListItem', position: 2, name: 'Feldnotizen', item: 'https://leader-os.de/journal' },
      { '@type': 'ListItem', position: 3, name: article.title.replace(/\.$/, ''), item: seo.canonical },
    ],
  };
  const elArticle = document.createElement('script');
  elArticle.type = 'application/ld+json';
  elArticle.textContent = JSON.stringify(data);
  elArticle.dataset.articleSlug = article.slug;
  document.head.appendChild(elArticle);
  const elCrumbs = document.createElement('script');
  elCrumbs.type = 'application/ld+json';
  elCrumbs.textContent = JSON.stringify(breadcrumbs);
  elCrumbs.dataset.crumbsSlug = article.slug;
  document.head.appendChild(elCrumbs);
  return () => {
    elArticle.remove();
    elCrumbs.remove();
  };
}

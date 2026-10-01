import { useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { LandingNav } from '../../../components/landing/LandingNav';
import { LandingFooter } from '../../../components/landing/LandingFooter';
import { useArticle, useRelatedArticles } from '../hooks/useArticle';
import { BlocksRenderer } from '../components/BlockRenderer';
import { ReadingProgress } from '../components/ReadingProgress';
import { RelatedArticles } from '../components/RelatedArticles';
import { NewsletterDrop } from '../components/NewsletterDrop';
import { ArticleCourseCta } from '../components/ArticleCourseCta';
import { ShareBar } from '../components/ShareBar';
import { ArticleLeftRail, extractHeadings } from '../components/ArticleLeftRail';
import { ArticleRightRail, ArticleMobileMiniApps } from '../components/ArticleRightRail';
import { WebinarTicketAd } from '../../../components/landing/WebinarTicketAd';
import { applySeoToDocument, applyArticleJsonLd, buildArticleSeo } from '../utils/seo';
import { localCoverPath } from '../utils/covers';

const TYPE_LABEL = {
  article: 'ARTICLE',
  guide: 'GUIDE',
  'field-note': 'FIELD NOTE',
  'case-study': 'CASE STUDY',
};

/**
 * ArticlePage · long-form reading shell with two sticky mini-app rails.
 *
 *   xl: [left-rail TOC + sticky CTA] · [article body] · [right-rail mini-apps]
 *   lg: [article body] · [right-rail mini-apps]
 *   md: [article body] · (mini-apps render inline above body via mobile fallback)
 *
 * Every route entry scrolls to the top (window.scrollTo) BEFORE first paint
 * so a deep-link from another article never lands mid-body. The hero image
 * uses the cover-resolver (per-article override or a deterministic Unsplash
 * pick by taxonomy) and sets the OG/Twitter image so social previews match.
 */
export default function ArticlePage() {
  const { slug } = useParams();
  const article = useArticle(slug);
  const related = useRelatedArticles(article, 2);
  const headings = useMemo(() => (article ? extractHeadings(article.body) : []), [article]);

  // Scroll-to-top BEFORE the next paint so a slug change never preserves
  // the previous article's scroll position. Runs on every slug update.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  // Inject ids onto h2 headings so the TOC anchor links land on them.
  // Done imperatively after BlocksRenderer renders, so we don't fork
  // BlockRenderer for one feature.
  useEffect(() => {
    if (!article) return;
    const articleEl = document.querySelector('[data-article-body]');
    if (!articleEl) return;
    const h2s = articleEl.querySelectorAll('h2');
    headings.forEach((h, i) => {
      const target = h2s[i];
      if (target && !target.id) target.id = h.id;
    });
  }, [article, headings, slug]);

  useEffect(() => {
    if (!article) return undefined;
    const seo = buildArticleSeo(article);
    // Backfill the OG image so social previews always have a real image:
    // explicit seo.ogImage → article.cover → bundled branded texture.
    // og:image must be absolute — derive the base from the canonical URL.
    // (Local assets, NOT the Unsplash fallback: images.unsplash.com isn't
    // in the prod CSP img-src, so CDN heroes render blocked on prod.)
    if (!seo.ogImage) {
      const base = (seo.canonical || '').replace(/\/journal\/.*$/, '');
      seo.ogImage = `${base}${localCoverPath(article)}`;
    }
    const restoreSeo = applySeoToDocument(seo);
    const removeJsonLd = applyArticleJsonLd(article, seo);
    return () => {
      restoreSeo();
      removeJsonLd();
    };
  }, [article]);

  if (!article) return <Navigate to="/journal" replace />;

  const date = new Date(article.publishedAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  // Hero cover: explicit article.cover, else the bundled branded texture.
  // Both are same-origin assets — always renderable, no CSP dependency.
  const heroCover = article.cover || localCoverPath(article);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased" data-testid={`article-${article.slug}`}>
      <ReadingProgress />
      <LandingNav />

      {/* HERO · full-bleed editorial cover. Builds visual identity before
          a single word of body copy. Halftone-screen on top to keep the
          editorial DNA · Title sits on a black gradient strip at the
          bottom so the headline reads clean even on busy photos. */}
      <header className="relative w-full overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[640px] bg-[#0A0A0A]">
          <img
            src={heroCover}
            alt={article.seo?.ogImageAlt || `${article.title.replace(/\.$/, '')} · LeaderOS Feldnotizen · Wlad Jachtchenko`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          {/* Bottom-half darkening gradient for headline legibility */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 35%, rgba(10,10,10,0) 100%)',
            }}
          />
          {/* Subtle halftone screen for editorial DNA */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-25"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1.4px)',
              backgroundSize: '4px 4px',
            }}
          />

          {/* Title block on the dark gradient bottom */}
          <div className="absolute inset-x-0 bottom-0 px-5 md:px-10 pb-8 md:pb-12">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-[0.22em] font-mono text-white/70">
                <Link to="/journal" className="hover:text-brand transition-colors">
                  ← Feldnotizen
                </Link>
                <span aria-hidden className="text-white/30">/</span>
                <span className="text-brand">{TYPE_LABEL[article.type] || 'ARTICLE'}</span>
                <span aria-hidden className="text-white/30">/</span>
                <span>{article.readingMinutes} MIN</span>
              </div>
              <h1
                className="text-[36px] sm:text-[56px] md:text-[72px] lg:text-[84px] leading-[0.95] tracking-[-0.035em] text-white max-w-5xl"
                style={{
                  fontFamily: 'Outfit, Inter, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                }}
              >
                {article.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-10 pt-10 md:pt-16 pb-16 md:pb-24">
        <div className="flex gap-10 xl:gap-14">
          {/* LEFT RAIL · TOC + sticky CTA (xl only) */}
          <ArticleLeftRail headings={headings} slug={article.slug} />

          {/* CENTER · article body */}
          <div className="flex-1 min-w-0 max-w-[760px] mx-auto">
            {/* Description + byline */}
            <div className="mb-10 md:mb-12">
              {article.description && (
                <p className="text-[18px] md:text-[22px] leading-[1.5] text-foreground/75 max-w-2xl">
                  {article.description}
                </p>
              )}
              <div className="mt-6 pt-4 border-t border-foreground/10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/55 font-mono">
                <span>{article.author ?? 'Wlad Jachtchenko'}</span>
                <span aria-hidden className="text-foreground/20">·</span>
                <span>{date}</span>
                {(article.tags ?? []).slice(0, 3).map((t) => (
                  <span key={t} className="text-foreground/45">· {t}</span>
                ))}
              </div>
            </div>

            {/* Mobile/tablet inline mini-apps · same modules as the right
                rail, but rendered above the body where they can't be
                pinned. They sit between the header and the body so the
                user can engage before reading on smaller screens. */}
            <ArticleMobileMiniApps article={article} />

            <article className="text-foreground" data-article-body>
              <BlocksRenderer
                blocks={article.body}
                articleSlug={article.slug}
                articleUrl={`https://leader-os.de/journal/${article.slug}`}
                articleTitle={article.title}
              />
            </article>

            <ArticleCourseCta article={article} placement="article-end" />

            <WebinarTicketAd placement="article-body" className="mt-14 md:mt-16" />

            <ShareBar
              url={`https://leader-os.de/journal/${article.slug}`}
              title={article.title.replace(/\.$/, '')}
              summary={article.description}
              slug={article.slug}
            />

            <NewsletterDrop articleSlug={article.slug} />

            <RelatedArticles articles={related} />
          </div>

          {/* RIGHT RAIL · mini-apps (lg+) */}
          <ArticleRightRail article={article} />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

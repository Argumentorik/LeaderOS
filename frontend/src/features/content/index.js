/**
 * Content feature · public barrel.
 *
 * Phase 3 of the content engine: registry-driven articles with one
 * renderer, two starter articles, route pair (/journal, /journal/:slug),
 * SEO + JSON-LD per article, in-article EmailCapture drop, reading-
 * progress rail, related articles. Newsletter (Phase 1) feeds into
 * the EmailCapture at the end of every article via source="article".
 */
export { default as JournalIndex } from './pages/JournalIndex';
export { default as ArticlePage } from './pages/ArticlePage';
export { getArticle, listArticles, listTags } from './data/registry';
export { readingTime } from './utils/readingTime';
export { buildArticleSeo, applySeoToDocument, applyArticleJsonLd } from './utils/seo';

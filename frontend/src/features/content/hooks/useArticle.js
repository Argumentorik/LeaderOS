import { useMemo } from 'react';
import { getArticle, listArticles } from '../data/registry';
import { readingTime } from '../utils/readingTime';

/**
 * useArticle · single-article reader for ArticlePage.
 *
 * Returns null for missing/unpublished slugs so the page can render a
 * 404 state without crashing.
 */
export function useArticle(slug) {
  return useMemo(() => {
    const article = getArticle(slug);
    if (!article) return null;
    return {
      ...article,
      readingMinutes: article.readingMinutes ?? readingTime(article.body),
    };
  }, [slug]);
}

export function useRelatedArticles(article, max = 3) {
  return useMemo(() => {
    if (!article) return [];
    if (article.related?.length) {
      return listArticles({ slugs: article.related, limit: max });
    }
    // Tag-based fallback: same tag, exclude self.
    const tag = article.tags?.[0];
    if (!tag) return [];
    return listArticles({ tag, limit: max + 1 }).filter((a) => a.slug !== article.slug).slice(0, max);
  }, [article, max]);
}

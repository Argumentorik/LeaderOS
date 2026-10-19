import { ArticleCard } from './ArticleCard';
import { topicThemeFor } from '../utils/topicCovers';

/**
 * RelatedArticles · „Weiter lesen" unter jedem Artikel.
 *
 * Jede Karte zeigt ein Foto passend zum Thema (utils/topicCovers.js), keine
 * WladBot-Sprechblasen. Teilen sich zwei Karten ein Thema, bekommt die zweite
 * die andere Bildvariante, damit nie zweimal dasselbe Foto nebeneinander steht.
 */
export const RelatedArticles = ({ articles }) => {
  if (!articles || articles.length === 0) return null;
  const seen = {};
  const variants = articles.map((a) => {
    if (a.cover) return undefined;
    const theme = topicThemeFor(a);
    seen[theme] = (seen[theme] || 0) + 1;
    return seen[theme] > 1 ? 'b' : 'a';
  });
  return (
    <section
      aria-label="Verwandte Artikel"
      data-testid="related-articles"
      className="mt-20 md:mt-28 pt-10 border-t border-foreground/15"
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 font-mono">
        ▸ Weiter lesen · {String(articles.length).padStart(2, '0')}
      </p>
      <h2
        className="mt-3 mb-8 md:mb-10 text-[34px] md:text-[48px] leading-[0.95] tracking-[-0.035em] text-foreground"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        Das könnte dich auch weiterbringen<span className="text-brand not-italic">.</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        {articles.map((a, i) => (
          <ArticleCard key={a.slug} article={a} coverVariant={variants[i]} />
        ))}
      </div>
    </section>
  );
};

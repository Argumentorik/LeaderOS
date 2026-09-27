import { Link } from 'react-router-dom';
import { readingTime } from '../utils/readingTime';
import { topicAlt, topicCover } from '../utils/topicCovers';

const TYPE_LABEL = {
  article: 'ARTICLE',
  guide: 'GUIDE',
  'field-note': 'FIELD NOTE',
  'case-study': 'CASE STUDY',
};

/**
 * ArticleCard · entry in the JournalIndex grid.
 *
 * Editorial specimen card with full-width cover image up top (eigenes
 * `cover` oder das themenpassende Foto aus utils/topicCovers.js), hairline
 * border on the body, lime accent on the type label. Hover lifts the whole
 * card · the cover gently zooms to suggest enterable depth.
 *
 * `coverVariant` ('a' | 'b') erzwingt eine Bildvariante, z. B. damit zwei
 * Karten desselben Themas nebeneinander nicht dasselbe Foto zeigen.
 */
export const ArticleCard = ({ article, coverVariant }) => {
  const minutes = article.readingMinutes ?? readingTime(article.body);
  const date = new Date(article.publishedAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const src = article.cover || topicCover(article, coverVariant);
  const alt = article.cover
    ? `${article.title.replace(/\.$/, '')} · LeaderOS Journal · Wlad Jachtchenko`
    : `${topicAlt(article)} · ${article.title.replace(/\.$/, '')}`;
  return (
    <article
      data-testid={`article-card-${article.slug}`}
      className="group relative border border-foreground/12 hover:border-foreground/40 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-22px_rgba(0,0,0,0.18)] bg-background"
    >
      {/* Cover · 16:10 editorial frame · subtle zoom on hover */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-foreground/5">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {/* Subtle bottom darkening so the type pill stays legible on any photo */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.45), rgba(10,10,10,0))' }}
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 bg-white/95 backdrop-blur-sm font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-foreground">
          ▸ {TYPE_LABEL[article.type] || 'ARTICLE'}
        </div>
        <div className="absolute bottom-3 right-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/90">
          {minutes} MIN
        </div>
      </div>

      <div className="p-6 md:p-7 flex flex-col flex-1">
        <h3
          className="text-[22px] md:text-[26px] leading-[1.05] tracking-[-0.025em] text-foreground"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          {article.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
        </h3>

        <p className="mt-3 text-[14px] leading-[1.5] text-foreground/65 flex-1">
          {article.description}
        </p>

        <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45 font-mono">
            {date}
          </span>
          <Link
            to={`/journal/${article.slug}`}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground hover:text-brand-strong transition-colors"
            aria-label={`Artikel lesen: ${article.title}`}
          >
            Lesen <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* Whole card hit-target for ease of click. */}
      <Link
        to={`/journal/${article.slug}`}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0"
      />
    </article>
  );
};

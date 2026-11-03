import { topicAlt, topicCover } from '../utils/topicCovers';

/**
 * ArticleCover · one decision point for every journal cover.
 *   Eigenes `cover` gewinnt, sonst das themenpassende Editorial-Foto aus
 *   utils/topicCovers.js. Beide mit der newsroom-halftone-Behandlung
 *   (grayscale + lime tint). `eyebrow` bleibt als Prop für bestehende
 *   Aufrufer, wird aber nicht mehr gerendert.
 */
export const ArticleCover = ({
  article,
  wrapClassName = '',
  imgClassName = 'absolute inset-0 w-full h-full object-cover',
  halftone = true,
  ink = false,
  eager = false,
}) => {
  const src = article?.cover || topicCover(article);
  const alt = article?.cover ? article.title : `${topicAlt(article)} · ${article?.title || ''}`;
  return (
    <div
      className={`relative ${halftone ? `newsroom-halftone ${ink ? 'newsroom-halftone--ink' : ''} ` : ''}${wrapClassName}`}
    >
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        {...(eager ? { fetchPriority: 'high' } : {})}
        decoding="async"
        className={imgClassName}
      />
    </div>
  );
};

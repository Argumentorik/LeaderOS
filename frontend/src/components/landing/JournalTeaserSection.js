import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { listArticles, listTags } from '../../features/content/data/registry';
import { topicCover, topicThemeFor } from '../../features/content/utils/topicCovers';

/**
 * JournalTeaserSection · "FELDNOTIZEN" — the journal front page.
 *
 * Identity: a premium digital broadsheet, deliberately NOT another
 * bordered-card grid. While the rest of the landing speaks in
 * border-2/hard-shadow blocks, this section speaks in newspaper
 * grammar: a masthead with a heavy top rule, hairline dividers,
 * an asymmetric front page — one dominant lead story, a 3-up
 * secondary tier with covers, and a text-only index rail like the
 * "In dieser Ausgabe" column of a printed paper.
 *
 * Covers: /journal/covers/cover-01.webp … cover-10.webp map
 * deterministically by rendered position (lead = 01, secondary
 * tier = 02–04). Index rail is text-only by design. Images are
 * lazy, sit in explicit aspect boxes (zero layout shift), render
 * grayscale by default and reveal color + a lime multiply wash on
 * hover — photography stays monochrome until you commit to it.
 *
 * Data: 100% from the content registry (listArticles/listTags).
 * No dummy strings. Read-time is derived from body word count.
 */

const COVERS = Array.from(
  { length: 10 },
  (_, i) => `/journal/covers/cover-${String(i + 1).padStart(2, '0')}.webp`
);
const coverFor = (position) => COVERS[position % COVERS.length];

/**
 * Every story gets a picture, always: the article's own `cover` wins, then
 * the topic-matched editorial photo (utils/topicCovers.js, same as the
 * article page and the journal cards), then the generic position cover.
 * Two stories sharing a topic get the other photo variant so the row never
 * shows the same image twice. `coverFor(position)` stays the <img> onError
 * fallback, so a missing file never leaves an empty box.
 */
const resolveCovers = (articles) => {
  const seen = {};
  return articles.map((a, i) => {
    if (a.cover) return a.cover;
    const theme = topicThemeFor(a);
    seen[theme] = (seen[theme] || 0) + 1;
    return topicCover(a, seen[theme] > 1 ? 'b' : 'a') || coverFor(i);
  });
};

const TYPE_LABELS = {
  'field-note': 'Feldnotiz',
  guide: 'Guide',
  article: 'Artikel',
  'case-study': 'Case Study',
};
const typeLabel = (article) => TYPE_LABELS[article.type] || 'Artikel';

const DISPLAY = { fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' };
const BALANCE = { textWrap: 'balance' };

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const readingMinutes = (article) => {
  // Rough estimate: words in body blocks at 220 wpm.
  const words = (article.body ?? []).reduce((sum, block) => {
    if (typeof block?.text === 'string') return sum + block.text.split(/\s+/).length;
    if (typeof block?.explanation === 'string') return sum + block.explanation.split(/\s+/).length;
    return sum;
  }, 0);
  if (!words) return 4;
  return Math.max(2, Math.round(words / 220));
};

const bib = (n) => String(n).padStart(2, '0');

/** Scroll reveal · blur/translate in, honors prefers-reduced-motion. */
const Reveal = ({ children, delay = 0, className }) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26, filter: 'blur(5px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

/** Cover in an explicit aspect box · grayscale until hover, lime multiply wash. */
const Cover = ({ src, alt, aspectClassName, fallback }) => (
  <div className={`relative overflow-hidden bg-foreground/[0.05] ${aspectClassName}`}>
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (fallback && e.currentTarget.src !== fallback && !e.currentTarget.dataset.fellBack) {
          e.currentTarget.dataset.fellBack = '1';
          e.currentTarget.src = fallback;
        }
      }}
      className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05] transition-[filter,transform] duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.02]"
    />
    {/* No colour wash on hover: the photo reveals its own colour, like a print. */}
  </div>
);

/** Mono metadata line: BIB · type · date · minutes (· author). */
const MetaLine = ({ article, number, withAuthor = false, className = '' }) => (
  <div
    className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 ${className}`}
  >
    <span className="text-brand-strong">{bib(number)}</span>
    <span>{typeLabel(article)}</span>
    <span className="opacity-30">·</span>
    <span>{formatDate(article.publishedAt)}</span>
    <span className="opacity-30">·</span>
    <span>{readingMinutes(article)} MIN</span>
    {withAuthor && (
      <>
        <span className="opacity-30">·</span>
        <span>{article.author || 'Wlad Jachtchenko'}</span>
      </>
    )}
  </div>
);

const LimeDotTitle = ({ title }) => (
  <>
    {title.replace(/\.$/, '')}
    <span className="text-brand not-italic">.</span>
  </>
);

/** The dominant lead story · cover-01, oversized display headline, standfirst. */
const LeadStory = ({ article, cover }) => (
  <Link
    to={`/journal/${article.slug}`}
    data-testid={`journal-lead-${article.slug}`}
    className="group block"
  >
    <Cover src={cover || coverFor(0)} fallback={coverFor(0)} alt={article.title} aspectClassName="aspect-[16/10]" />
    <div className="pt-7 md:pt-9">
      <MetaLine article={article} number={1} withAuthor className="mb-5" />
      <h3
        className="text-[clamp(30px,4vw,50px)] leading-[1.0] tracking-[-0.035em] text-foreground"
        style={{ ...DISPLAY, ...BALANCE }}
      >
        <LimeDotTitle title={article.title} />
      </h3>
      <p className="mt-5 max-w-[62ch] text-[15px] md:text-[16.5px] leading-[1.65] text-foreground/70">
        {article.description}
      </p>
      <div className="mt-7 inline-flex items-baseline gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-foreground transition-colors group-hover:text-brand-strong">
        Artikel lesen
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </div>
    </div>
  </Link>
);

/** Secondary tier story · covers 02–04, portrait crop, compact standfirst. */
const SecondStory = ({ article, position, cover }) => (
  <Link
    to={`/journal/${article.slug}`}
    data-testid={`journal-mini-${article.slug}`}
    className="group block"
  >
    <Cover src={cover || coverFor(position)} fallback={coverFor(position)} alt={article.title} aspectClassName="aspect-[4/3]" />
    <div className="pt-5">
      <MetaLine article={article} number={position + 1} className="mb-3" />
      <h4
        className="text-[clamp(19px,1.8vw,24px)] leading-[1.08] tracking-[-0.025em] text-foreground"
        style={{ ...DISPLAY, ...BALANCE }}
      >
        <LimeDotTitle title={article.title} />
      </h4>
      <p className="mt-3 text-[13.5px] leading-[1.55] text-foreground/65 line-clamp-2">
        {article.description}
      </p>
    </div>
  </Link>
);

/** Text-only index row · the "In dieser Ausgabe" rail. No images by design. */
const IndexRow = ({ article, number }) => (
  <Link
    to={`/journal/${article.slug}`}
    data-testid={`journal-index-${article.slug}`}
    className="group flex items-baseline gap-4 border-b border-foreground/10 py-5 first:pt-0 last:border-b-0"
  >
    <span className="shrink-0 font-mono text-[10px] font-bold tracking-[0.22em] text-brand-strong">
      {bib(number)}
    </span>
    <div className="min-w-0 flex-1">
      <h5
        className="text-[16px] leading-[1.15] tracking-[-0.02em] text-foreground transition-colors"
        style={{ ...DISPLAY, ...BALANCE }}
      >
        <LimeDotTitle title={article.title} />
      </h5>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-foreground/50">
        <span>{typeLabel(article)}</span>
        <span className="opacity-30">·</span>
        <span>{formatDate(article.publishedAt)}</span>
        <span className="opacity-30">·</span>
        <span>{readingMinutes(article)} MIN</span>
      </div>
    </div>
    <span
      aria-hidden="true"
      className="shrink-0 font-mono text-[12px] text-foreground/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-strong"
    >
      →
    </span>
  </Link>
);

export const JournalTeaserSection = () => {
  const articles = listArticles({ limit: 10 });
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const secondary = rest.slice(0, 3);
  const index = rest.slice(3, 9);
  // Lead + the three secondary stories resolve their covers together so the
  // variant de-duplication sees all four pictures that sit on screen at once.
  const covers = resolveCovers([lead, ...secondary]);
  const total = listArticles().length;
  const tags = listTags().slice(0, 8);

  return (
    <section
      id="journal"
      data-testid="journal-teaser-section"
      aria-label="Feldnotizen · das Journal von LeaderOS"
      className="bg-background"
    >
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-36">
        {/* ── Masthead · broadsheet top rule + edition line ── */}
        <Reveal>
          <div className="border-t-[3px] border-foreground pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55">
              <span>
                <span className="text-brand-strong">▸ FELDNOTIZEN</span>
                <span className="mx-3 opacity-30">·</span>
                LEADEROS JOURNAL
              </span>
              <span>
                {total} ARTIKEL
                <span className="mx-3 opacity-30">·</span>
                AUSGABE {formatDate(lead.publishedAt)}
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col justify-between gap-10 md:mt-16 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <Reveal delay={0.05}>
              <h2
                className="text-[clamp(42px,7vw,92px)] leading-[0.9] tracking-[-0.04em] text-foreground"
                style={{ ...DISPLAY, ...BALANCE }}
              >
                Aus dem Feld<span className="text-brand not-italic">.</span>
                <br />
                <span className="text-foreground/50">Nicht aus dem Bullshit-Bingo</span>
                <span className="text-brand not-italic">.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-8 max-w-2xl text-[15px] leading-[1.65] text-foreground/70 md:text-[16.5px]">
                Frameworks, Skripte und Field-Notes für KI-natives Führen · direkt
                aus der Arbeit mit Wlads Klienten. Kein Theorie-Bingo, kein
                Generisches. Jeder Artikel hat eine Methodik die du heute
                Nachmittag einsetzen kannst.
              </p>
              {/* Trust strip · real credentials, not vague "expert content" claims */}
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground/55">
                <span>▸ Von Wlad Jachtchenko</span>
                <span className="hidden opacity-30 sm:inline">·</span>
                <span>3× SPIEGEL-Bestseller · seit 2007</span>
                <span className="hidden opacity-30 sm:inline">·</span>
                <span>400.000+ trainierte Klienten</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.18} className="shrink-0">
            <Link
              to="/journal"
              data-testid="journal-cta-all"
              className="inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-full bg-foreground px-7 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-background transition-colors hover:bg-brand hover:text-foreground"
            >
              Alle {total} Artikel
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>

        {/* ── Front page · lead story (8 cols) + text index rail (4 cols) ── */}
        <div className="mt-16 grid grid-cols-1 gap-14 border-t border-foreground/15 pt-12 md:mt-24 md:pt-16 lg:grid-cols-12 lg:gap-0">
          <Reveal className="lg:col-span-8 lg:pr-14">
            <LeadStory article={lead} cover={covers[0]} />
          </Reveal>

          {index.length > 0 && (
            <Reveal delay={0.1} className="lg:col-span-4 lg:border-l lg:border-foreground/15 lg:pl-10">
              <div className="mb-6 flex items-baseline justify-between border-b border-foreground/15 pb-4 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/55">
                <span>
                  <span className="text-brand-strong">▸</span> IN DIESER AUSGABE
                </span>
              </div>
              <div>
                {index.map((article, i) => (
                  <IndexRow key={article.slug} article={article} number={i + 5} />
                ))}
              </div>
              <Link
                to="/journal"
                className="mt-8 inline-flex items-baseline gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 transition-colors hover:text-brand-strong"
              >
                ▸ {total - articles.length} weitere Artikel im Journal
              </Link>
            </Reveal>
          )}
        </div>

        {/* ── Secondary tier · 3 cover stories, 02–04 ── */}
        {secondary.length > 0 && (
          <div className="mt-16 border-t border-foreground/15 pt-12 md:mt-24 md:pt-16">
            <Reveal>
              <div className="mb-10 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/55">
                <span className="text-brand-strong">▸</span> WEITERE STORIES
              </div>
            </Reveal>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
              {secondary.map((article, i) => (
                <Reveal key={article.slug} delay={0.08 * i}>
                  <SecondStory article={article} position={i + 1} cover={covers[i + 1]} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ── Colophon strip · topic quick-nav from real registry tags ── */}
        <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-foreground/15 pt-8 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 md:mt-24">
          <span>
            <span className="text-brand-strong">▸</span> THEMEN
          </span>
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/journal?tag=${encodeURIComponent(tag)}`}
              className="transition-colors hover:text-brand-strong"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

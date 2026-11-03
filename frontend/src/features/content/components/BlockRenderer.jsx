/**
 * BlockRenderer · one renderer for the structured-block content schema.
 *
 * Renders { type, ... } blocks defined in the article body. Adding a
 * new block type means: add a case here, no other file changes.
 *
 * Block contract (current set):
 *   paragraph  { text }
 *   heading    { level: 2|3, text, id? }
 *   list       { style: 'bullet'|'numbered', items: string[] }
 *   quote      { text, attribution? }
 *   callout    { tone: 'lime'|'neutral', text }
 *   framework  { code, title, explanation }
 *   image      { src, alt, caption? }
 *
 * Future-friendly: unknown types render to an empty fragment instead
 * of throwing, so an older app version can still render newer content
 * gracefully (just with the new blocks invisible).
 */

const Paragraph = ({ block }) => (
  <p className="text-[16px] md:text-[18px] leading-[1.7] text-foreground/85 my-6">
    {block.text}
  </p>
);

const Heading = ({ block }) => {
  const Tag = block.level === 3 ? 'h3' : 'h2';
  const size = block.level === 3
    ? 'text-[22px] md:text-[26px]'
    : 'text-[28px] md:text-[36px]';
  return (
    <Tag
      id={block.id}
      className={`${size} leading-[1.1] tracking-[-0.025em] text-foreground mt-14 mb-4`}
      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
    >
      {block.text.replace(/\.$/, '')}
      <span className="text-brand not-italic">.</span>
    </Tag>
  );
};

const List = ({ block }) => {
  const Tag = block.style === 'numbered' ? 'ol' : 'ul';
  return (
    <Tag className={`${Tag === 'ol' ? 'list-decimal' : 'list-none'} my-6 space-y-2.5 max-w-[65ch]`}>
      {(block.items ?? []).map((item, i) => (
        <li
          key={i}
          className="relative pl-6 text-[15.5px] md:text-[17px] leading-[1.6] text-foreground/85"
        >
          {block.style !== 'numbered' && (
            <span aria-hidden className="absolute left-0 top-[0.7em] w-2 h-2 bg-brand" />
          )}
          {item}
        </li>
      ))}
    </Tag>
  );
};

const Quote = ({ block }) => (
  <blockquote className="my-10 border-l-2 border-brand pl-6 py-2">
    <p
      className="text-[22px] md:text-[28px] leading-[1.25] tracking-[-0.018em] text-foreground"
      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
    >
      „{block.text}"
    </p>
    {block.attribution && (
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono">
        ▸ {block.attribution}
      </p>
    )}
  </blockquote>
);

const Callout = ({ block }) => {
  const tone = block.tone === 'lime'
    ? 'border-brand bg-brand/[0.07] text-foreground'
    : 'border-foreground/15 bg-foreground/[0.03] text-foreground';
  return (
    <aside className={`my-8 border-l-2 ${tone} pl-5 pr-4 py-4`}>
      <p className="text-[15.5px] md:text-[16.5px] leading-[1.55]">
        {block.text}
      </p>
    </aside>
  );
};

const Framework = ({ block }) => (
  <section className="my-10 border-2 border-foreground p-5 md:p-7 relative">
    <div
      aria-hidden
      className="absolute top-0 right-0 bg-brand text-[#0A0A0A] px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em]"
    >
      Framework
    </div>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono mt-1">
      ▸ {block.code}
    </p>
    <h4
      className="mt-2 text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.025em] text-foreground"
      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
    >
      {block.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
    </h4>
    <p className="mt-3 text-[15px] md:text-[16px] leading-[1.6] text-foreground/75">
      {block.explanation}
    </p>
  </section>
);

const Image = ({ block }) => (
  <figure className="my-10">
    <img src={block.src} alt={block.alt || ''} className="w-full h-auto" loading="lazy" />
    {block.caption && (
      <figcaption className="mt-3 text-[12px] uppercase tracking-[0.18em] font-bold text-foreground/55 font-mono">
        ▸ {block.caption}
      </figcaption>
    )}
  </figure>
);

/**
 * faq { title?, items: [question, answer][] } · Antwort-Block am Artikelende.
 * Das Prerendering (scripts/prerender-articles.mjs) rendert denselben Block
 * statisch und hängt ein FAQPage-Schema an — Frage und Antwort müssen deshalb
 * wortgleich bleiben, keine Kürzung im UI.
 */
const Faq = ({ block }) => (
  <section className="my-12 border-t-2 border-foreground pt-6" aria-label={block.title || 'Häufige Fragen'}>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono">▸ FAQ</p>
    <h2
      className="mt-2 text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.025em] text-foreground"
      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
    >
      {(block.title || 'Häufige Fragen').replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
    </h2>
    <dl className="mt-4 divide-y divide-foreground/10">
      {(block.items ?? []).map(([q, a], i) => (
        <div key={i} className="py-5">
          <dt className="text-[18px] md:text-[20px] leading-[1.3] font-extrabold text-foreground">{q}</dt>
          <dd className="mt-2 text-[15.5px] md:text-[17px] leading-[1.65] text-foreground/85">{a}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const REGISTRY = {
  paragraph: Paragraph,
  heading: Heading,
  list: List,
  quote: Quote,
  callout: Callout,
  framework: Framework,
  image: Image,
  faq: Faq,
};

// Re-export the registry shape so BlocksRenderer's parent can compose
// articleSlug + articleUrl into the click-to-tweet block at render time.
export { Quote };

export const BlockRenderer = ({ block, articleSlug, articleUrl, articleTitle }) => {
  // Auto-promote: any explicit `click-to-tweet` block OR any `quote`
  // block where the parent passed share-context renders as a shareable
  // pull-quote · matches existing Quote visual but adds X/LinkedIn/copy
  // buttons. Articles authored before this feature still render plain
  // Quotes when articleSlug isn't supplied.
  if (block.type === 'click-to-tweet' || (block.type === 'quote' && block.shareable && articleSlug)) {
    const { ClickToTweet } = require('./ClickToTweet');
    return (
      <ClickToTweet
        text={block.text}
        attribution={block.attribution}
        articleSlug={articleSlug}
        articleUrl={articleUrl}
      />
    );
  }
  // Embedded problem-capture block (Growth-Loop Layer 2) · routes the
  // reader's situation through the Intent Schema Layer into WladBot.
  if (block.type === 'diagnostic') {
    const { InlineDiagnostic } = require('./InlineDiagnostic');
    return (
      <InlineDiagnostic
        block={block}
        articleSlug={articleSlug}
        articleTitle={articleTitle}
      />
    );
  }
  const Component = REGISTRY[block.type];
  if (!Component) return null;
  return <Component block={block} />;
};

export const BlocksRenderer = ({ blocks, articleSlug, articleUrl, articleTitle }) => (
  <>{blocks.map((b, i) => (
    <BlockRenderer
      key={i}
      block={b}
      articleSlug={articleSlug}
      articleUrl={articleUrl}
      articleTitle={articleTitle}
    />
  ))}</>
);

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Search, Newspaper, Compass, MessagesSquare, Bot, Wrench } from 'lucide-react';
import { LandingNav } from '../../../components/landing/LandingNav';
import { LandingFooter } from '../../../components/landing/LandingFooter';
import { listArticles } from '../data/registry';
import { groupByTaxonomy } from '../data/taxonomy';
import { applySeoToDocument } from '../utils/seo';
import { ArticleCover } from '../components/ArticleCover';
import { WladBotThumbnail } from '../components/WladBotThumbnail';
import { DottedGlowBackground } from '../../../components/shared/DottedGlowBackground';
import { NEWS_BUCKETS, NEWS_ITEMS } from '../data/newsfeed';
import { WebinarTicketAd } from '../../../components/landing/WebinarTicketAd';
import { CoursesLibrarySection } from '../../../components/landing/CoursesLibrarySection';

/**
 * JournalIndex · /journal · Newsroom-frontpage layout (godmode).
 *
 *   1. Masthead (two-tone serif logo + live ticker + side menu) ·
 *      Off-Crypto / The Players' Tribune lovechild
 *   2. Front-page lede grid: big halftone-lime feature image (left) +
 *      dated news column (center) + Hot Stories sidebar (right)
 *   3. "Aus Wlad's Welt" news strip · Podcast / Bücher / LeaderOS
 *      live-counter / Leadership-Summit · 4 quick-access tiles
 *   4. Funnel CTA breaks weaved in between category sections
 *   5. Per-category newspaper-style spreads (image + headlines)
 *
 * Everything funnels to either an article, the Diagnose-Test, or the
 * Beratungsgespräch. Newspaper texture + halftone images make it sticky.
 */

const formatNewsDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' }).toUpperCase();
};

const readingMinutes = (article) => {
  const words = (article.body ?? []).reduce((sum, block) => {
    if (typeof block?.text === 'string') return sum + block.text.split(/\s+/).length;
    if (typeof block?.explanation === 'string') return sum + block.explanation.split(/\s+/).length;
    return sum;
  }, 0);
  if (!words) return 4;
  return Math.max(2, Math.round(words / 220));
};

const authorOf = (a) => a.author?.name || a.author || 'Wlad Jachtchenko';

const serifItalic = {
  fontFamily: "'Instrument Serif', 'Outfit', Georgia, serif",
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: '-0.01em',
};

const condensed = {
  fontFamily: "'Outfit', 'Inter', sans-serif",
  fontWeight: 900,
  letterSpacing: '-0.02em',
};

// ─────────────────────────────────────────────────────────────────────────
// MASTHEAD · two-tone logo + live ticker + side menu
// ─────────────────────────────────────────────────────────────────────────
const TICKER = [
  { label: 'KLIENTEN', value: '400K+', tone: 'up' },
  { label: 'LÄNDER',   value: '20' },
  { label: 'BESTSELLER', value: '3 SPIEGEL' },
  { label: 'BÜCHER',   value: '8 LÄNDER' },
  { label: 'PODCAST',  value: '10M+',  tone: 'up' },
  { label: 'WLADBOT',  value: '24/7' },
];

const Masthead = ({ totalArticles }) => (
  <header
    aria-label="Feldnotizen Masthead"
    className="newsroom-paper border-b-[3px] border-foreground"
    data-testid="journal-masthead"
  >
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 pt-8 md:pt-10 pb-5">
      {/* Top row: logo + ticker + side menu */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Logo lockup · two-tone serif+sans  */}
        <Link to="/" className="col-span-12 md:col-span-5 flex items-baseline gap-0 group" data-testid="journal-logo">
          <span
            className="text-[56px] sm:text-[72px] md:text-[84px] lg:text-[96px] leading-[0.85] text-brand-strong"
            style={serifItalic}
          >
            Feld
          </span>
          <span
            className="text-[56px] sm:text-[72px] md:text-[84px] lg:text-[96px] leading-[0.85] text-foreground -ml-1"
            style={condensed}
          >
            NOTIZEN
          </span>
        </Link>

        {/* Ticker bar · newsroom data-stats */}
        <div className="col-span-12 md:col-span-5 grid grid-cols-3 md:grid-cols-3 gap-x-4 gap-y-3 pt-1 md:pt-2 md:pl-4 md:border-l border-foreground/15">
          {TICKER.slice(0, 6).map((t) => (
            <div key={t.label} className="leading-tight">
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-foreground/55">
                {t.label}
              </div>
              <div className="text-[15px] md:text-[16px] font-extrabold text-foreground flex items-center gap-1">
                {t.value}
                {t.tone === 'up' && <span className="text-brand-strong text-[11px]">▲</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Side menu (right column) */}
        <nav className="col-span-12 md:col-span-2 md:text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-foreground/55 mb-2">
            MENU
          </div>
          <ul className="space-y-1.5 text-[16px] md:text-[18px]" style={serifItalic}>
            <li><a href="#cat-ki-praxis" className="text-foreground hover:text-brand-strong transition-colors">Kategorien</a></li>
            <li><Link to="/" className="text-foreground hover:text-brand-strong transition-colors">Wissensbasis</Link></li>
            <li><Link to="/#beratung" className="text-foreground hover:text-brand-strong transition-colors">Beratung</Link></li>
            {/* The two conversion actions · highlighted lime so people act:
                the free Leader-Check diagnose, and signing in to LeaderOS. */}
            <li>
              <a href="https://leadercheck.de" target="_blank" rel="noopener noreferrer" className="text-brand-strong hover:text-foreground transition-colors" data-testid="journal-menu-diagnose">
                Diagnose
              </a>
            </li>
            <li>
              <a href="https://leaderos.de/login" target="_blank" rel="noopener noreferrer" className="text-brand-strong hover:text-foreground transition-colors" data-testid="journal-menu-anmelden">
                Bei LeaderOS anmelden
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Sub-masthead strap line */}
      <div className="mt-6 pt-3 border-t border-foreground/15 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-foreground/60">
        <span>▸ Wlad Jachtchenko · Das KI-Leadership-Magazin</span>
        <span className="text-foreground/45">{totalArticles} Artikel im Archiv</span>
        <span className="hidden md:inline">Ausgabe · {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────
// FRONT-PAGE LEDE · feature image (left, halftone lime) + dated headlines
// (center) + Hot Stories sidebar (right)
// ─────────────────────────────────────────────────────────────────────────
const FrontPageLede = ({ featureArticle, datedArticles, hotStories }) => {
  if (!featureArticle) return null;
  return (
    <section
      aria-label="Front-Page Lede"
      className="newsroom-paper"
      data-testid="journal-frontpage-lede"
    >
      <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-10 md:py-14">
        {/* Section eyebrow */}
        <div className="mb-5 flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.32em] text-brand-strong">
          <span>▸ FELD · LEAD-STORY</span>
        </div>

        <div className="grid grid-cols-12 gap-6 md:gap-10">
          {/* LEFT: Feature column · halftone-lime image + headline */}
          <article className="col-span-12 md:col-span-5">
            <Link
              to={`/journal/${featureArticle.slug}`}
              className="group block"
              data-testid="journal-feature"
            >
              <h2
                className="text-[34px] sm:text-[42px] md:text-[44px] lg:text-[52px] leading-[0.95] uppercase text-foreground mb-5"
                style={condensed}
              >
                {featureArticle.title.replace(/\.$/, '')}
              </h2>
              <ArticleCover
                article={featureArticle}
                eager
                eyebrow="FEATURE"
                wrapClassName="aspect-[4/5] md:aspect-[5/6] bg-foreground/10"
                imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1100ms] ease-out"
              />
              <div className="mt-4 flex items-center justify-between font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/65">
                <span>{authorOf(featureArticle)}</span>
                <span className="text-foreground/45">{readingMinutes(featureArticle)} MIN · ARTIKEL LESEN →</span>
              </div>
            </Link>
          </article>

          {/* MIDDLE: Dated news column */}
          <div className="col-span-12 md:col-span-4">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/60 mb-4 pb-3 border-b border-foreground/20">
              ▸ Aktuelle Notizen
            </div>
            <ul className="divide-y divide-foreground/10">
              {datedArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={`/journal/${a.slug}`}
                    data-testid={`journal-dated-${a.slug}`}
                    className="group block py-4 hover:bg-foreground/[0.04] -mx-3 px-3 transition-colors"
                  >
                    <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-brand-strong mb-1.5">
                      {formatNewsDate(a.publishedAt)}
                    </div>
                    <h3
                      className="text-[16px] md:text-[18px] uppercase text-foreground leading-[1.18] group-hover:text-brand-strong transition-colors"
                      style={{ ...condensed, letterSpacing: '-0.01em', fontWeight: 800 }}
                    >
                      {a.title.replace(/\.$/, '')}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: Hot Stories sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="mb-4 pb-3 border-b border-foreground/20 flex items-baseline gap-1">
              <span className="text-[26px] md:text-[30px] text-brand-strong" style={serifItalic}>Hot</span>
              <span className="text-[22px] md:text-[26px] text-foreground" style={condensed}>STORIES</span>
            </div>
            <div className="space-y-6">
              {hotStories.map((h) => (
                <Link
                  key={h.article.slug}
                  to={`/journal/${h.article.slug}`}
                  data-testid={`journal-hot-${h.article.slug}`}
                  className="group block"
                >
                  <ArticleCover
                    article={h.article}
                    ink={h.tone === 'ink'}
                    eyebrow="HOT"
                    wrapClassName="aspect-[4/3] bg-foreground/10"
                    imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
                  />
                  <div className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-foreground/60">
                    {h.label}
                  </div>
                  <h4
                    className="mt-1 text-[15px] md:text-[16px] uppercase text-foreground leading-[1.16] group-hover:text-brand-strong transition-colors"
                    style={{ ...condensed, fontWeight: 800, letterSpacing: '-0.01em' }}
                  >
                    {h.article.title.replace(/\.$/, '')}
                  </h4>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// AUS WLAD'S WELT · News-strip mit 4 quick-access tiles
// (Podcast · Bücher · LeaderOS · Leadership-Summit)
// ─────────────────────────────────────────────────────────────────────────
const FROM_WLAD = [
  {
    label: 'PODCAST',
    title: 'Wlad spricht · Folge der Woche.',
    description: 'KI x Führung. Neue Folge jeden Mittwoch. 10M+ Downloads in 20 Ländern.',
    cta: 'Podcast hören',
    to: 'https://podcast.wladjachtchenko.de',
    external: true,
    tone: 'lime',
  },
  {
    label: 'BÜCHER',
    title: '3 SPIEGEL-Bestseller in 8 Ländern.',
    description: 'Dunkle Rhetorik · Schwarze Rhetorik · KI-Leadership. Das gesammelte Wlad-System.',
    cta: 'Bücher entdecken',
    to: 'https://wladjachtchenko.de/buecher',
    external: true,
    tone: 'ink',
  },
  {
    label: 'WERDE TEIL',
    title: 'Alle Vorteile ab Tag 1.',
    description: 'Volle Plattform, WladBot 24/7, elf Frameworks. 14 Tage kostenlos · ohne Karte. Werde Teil von LeaderOS.',
    cta: 'Jetzt dabei sein',
    to: '/#beratung',
    external: false,
    tone: 'lime',
    highlight: true,
  },
  {
    label: 'SUMMIT',
    title: 'Leadership-Summit · Q4.',
    description: 'Wlad live + die LeaderOS-Community. Live-Drills, Q&A, Klein-Format.',
    cta: 'Auf Warteliste',
    to: '/#newsletter-footer',
    external: false,
    tone: 'ink',
  },
];

const FromWladStrip = () => (
  <section
    aria-label="Aus Wlad's Welt"
    className="relative overflow-hidden bg-[#0A0A0A] text-white"
    data-testid="journal-from-wlad"
  >
    <DottedGlowBackground
      className="[mask-image:radial-gradient(130%_120%_at_15%_30%,#000_45%,transparent_100%)]"
      gap={24}
      radius={1.3}
      color="rgba(191,255,0,0.26)"
      glowColor="rgba(191,255,0,0.9)"
      opacity={0.5}
      speedMin={0.18}
      speedMax={1}
    />
    <div className="relative z-10 max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-12 md:py-16">
      {/* Strip header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 pb-4 border-b border-white/15">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] md:text-[36px] text-brand" style={serifItalic}>Aus</span>
          <span className="text-[24px] md:text-[32px] text-white" style={condensed}>WLAD'S WELT</span>
        </div>
        <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.26em] text-white/55">
          ▸ Podcast · Bücher · LeaderOS · Summit
        </div>
      </div>

      {/* 4 quick-access tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {FROM_WLAD.map((tile) => {
          const Inner = (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.28em] ${tile.tone === 'lime' ? 'text-brand' : 'text-white/55'}`}>
                  ▸ {tile.label}
                </span>
                <ArrowUpRight size={14} className={tile.tone === 'lime' ? 'text-brand' : 'text-white/55'} />
              </div>
              <h3
                className="text-[20px] md:text-[22px] leading-[1.1] text-white mb-3"
                style={serifItalic}
              >
                {tile.title.replace(/\.$/, '')}
              </h3>
              <p className="text-[13px] leading-[1.5] text-white/65 mb-5">
                {tile.description}
              </p>
              <div className={`font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] ${tile.tone === 'lime' ? 'text-brand' : 'text-white/70'} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5`}>
                {tile.cta} <ArrowRight size={12} />
              </div>
              {tile.highlight && (
                <div className="absolute top-3 right-3 bg-brand text-black font-mono text-[9px] font-bold uppercase tracking-[0.22em] px-2 py-1">
                  ● LIVE
                </div>
              )}
            </>
          );
          const className = `group relative block border ${tile.highlight ? 'border-brand bg-brand/[0.04]' : 'border-white/15 bg-white/[0.02]'} hover:bg-white/[0.05] p-6 transition-colors min-h-[260px] flex flex-col justify-between`;
          return tile.external ? (
            <a key={tile.label} href={tile.to} target="_blank" rel="noopener noreferrer" className={className}>
              {Inner}
            </a>
          ) : (
            <Link key={tile.label} to={tile.to} className={className}>
              {Inner}
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────
// CATEGORY SECTION · newspaper-style spread
// ─────────────────────────────────────────────────────────────────────────
const SplitCard = ({ article, imageOnRight = true }) => {
  const text = (
    <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12 bg-white">
      <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.26em] text-brand-strong mb-3">
        {formatNewsDate(article.publishedAt)}
      </div>
      <h3
        className="text-[28px] sm:text-[34px] md:text-[42px] leading-[1.0] uppercase text-foreground"
        style={condensed}
      >
        {article.title.replace(/\.$/, '')}
      </h3>
      <p className="mt-4 text-[14.5px] md:text-[16px] leading-[1.55] text-foreground/70 line-clamp-3">
        {article.description}
      </p>
      <div className="mt-6 font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground/70 flex items-center gap-2">
        {authorOf(article)}
        <span className="opacity-40">·</span>
        <span>{readingMinutes(article)} MIN</span>
      </div>
    </div>
  );
  const photo = (
    <ArticleCover
      article={article}
      wrapClassName="aspect-[4/3] md:aspect-auto md:min-h-[360px]"
      imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[900ms] ease-out"
    />
  );
  return (
    <Link
      to={`/journal/${article.slug}`}
      data-testid={`journal-split-${article.slug}`}
      className="group block bg-white border border-foreground/15 hover:border-foreground hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.28)] transition-all duration-300"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        {imageOnRight ? (<>{text}{photo}</>) : (<>{photo}{text}</>)}
      </div>
    </Link>
  );
};

const MiniCard = ({ article }) => (
  <Link
    to={`/journal/${article.slug}`}
    data-testid={`journal-mini-${article.slug}`}
    className="group block bg-white border border-foreground/15 hover:border-foreground hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.28)] transition-all duration-300"
  >
    <ArticleCover
      article={article}
      wrapClassName="aspect-[4/3]"
      imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-out"
    />
    <div className="p-5 md:p-6">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-2">
        {formatNewsDate(article.publishedAt)}
      </div>
      <h4
        className="text-[18px] md:text-[20px] uppercase leading-[1.1] text-foreground group-hover:text-brand-strong transition-colors"
        style={{ ...condensed, fontWeight: 800 }}
      >
        {article.title.replace(/\.$/, '')}
      </h4>
      <p className="mt-2.5 text-[13px] leading-[1.5] text-foreground/65 line-clamp-2">
        {article.description}
      </p>
      <div className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/60">
        {authorOf(article)}
      </div>
    </div>
  </Link>
);

const CategorySection = ({ category, splitDirection = true }) => {
  if (!category.articles.length) return null;
  const [lead, ...rest] = category.articles;
  const minis = rest.slice(0, 3);

  return (
    <section
      id={`cat-${category.slug}`}
      data-testid={`category-${category.slug}`}
      aria-label={category.name}
      className="newsroom-paper"
    >
      <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 pt-14 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-[2px] border-foreground pb-3">
          <div className="flex flex-wrap items-baseline gap-x-3 min-w-0">
            <span className="text-[28px] md:text-[36px] text-brand-strong" style={serifItalic}>{category.name.split(' ')[0]}</span>
            {category.name.split(' ').slice(1).length > 0 && (
              <span className="text-[20px] md:text-[26px] text-foreground" style={condensed}>{category.name.split(' ').slice(1).join(' ').toUpperCase()}</span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground/60 whitespace-nowrap">
            <span>{category.funnelLabel}</span>
            <span className="opacity-30">·</span>
            <span>{category.articles.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14">
        <SplitCard article={lead} imageOnRight={splitDirection} />
      </div>

      {minis.length > 0 && (
        <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 pb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-5">
            {minis.map((a) => <MiniCard key={a.slug} article={a} />)}
          </div>
          {rest.length > minis.length && (
            <div className="mt-7 text-center">
              <Link
                to={`/journal?cat=${category.slug}`}
                className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-foreground/70 hover:text-brand-strong border-b border-foreground/30 hover:border-brand-strong pb-1 transition-colors"
              >
                Alle {rest.length} Artikel in {category.name}
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Funnel CTA blocks
// ─────────────────────────────────────────────────────────────────────────
const DiagnoseCTA = () => (
  <section
    aria-label="Leadership-Diagnose"
    className="relative overflow-hidden bg-[#0A0A0A] text-white"
    data-testid="journal-cta-diagnose"
  >
    <DottedGlowBackground
      className="[mask-image:radial-gradient(120%_120%_at_50%_40%,#000_55%,transparent_100%)]"
      gap={22}
      radius={1.4}
      color="rgba(191,255,0,0.32)"
      glowColor="rgba(191,255,0,0.95)"
      opacity={0.55}
      speedMin={0.2}
      speedMax={1.1}
    />
    <div className="relative z-10 max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-0 border border-white/15">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px]">
          <WladBotThumbnail title="Mach den kostenlosen Leader-Check" eyebrow="DIAGNOSE · 10 MIN" />
        </div>
        <div className="p-8 md:p-14 flex flex-col justify-center">
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5">
            ▸ Leadership-Diagnose · 10 Min · Kostenlos
          </div>
          <h3 className="text-[32px] md:text-[46px] leading-[1.02]" style={serifItalic}>
            Welcher KI-Leader bist du wirklich?
          </h3>
          <p className="mt-5 max-w-xl text-[15px] md:text-[17px] leading-[1.55] text-white/75">
            30 Fragen. 10 Minuten. Drei Dimensionen · KI, Rhetorik, EQ.
            Sofort dein Score plus konkreter Lernpfad, abgestimmt auf
            Wlads Methodik und deinen aktuellen Rollen-Übergang.
            Kein Login. Kein Spam.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/#archetyp" className="inline-flex items-center gap-3 px-6 py-3.5 bg-brand hover:bg-white text-black font-bold text-[13.5px] tracking-[0.02em] transition-colors">
              Diagnose-Test starten <ArrowRight size={16} />
            </Link>
            <Link to="/#beratung" className="inline-flex items-center gap-3 px-6 py-3.5 border border-white/30 hover:border-white text-white font-bold text-[13.5px] tracking-[0.02em] transition-colors">
              Direkt Beratungsgespräch
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ArchetypTeaserCTA = () => (
  <section aria-label="Archetyp-Teaser" className="bg-[#EFEDE5] border-y border-foreground/15" data-testid="journal-cta-archetyp">
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-12 md:py-16">
      <div className="grid md:grid-cols-12 gap-6 md:gap-12 items-end">
        <div className="md:col-span-7">
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-4">
            ▸ Zwischenstopp · Diagnose
          </div>
          <h3 className="text-[30px] md:text-[48px] leading-[1.02] text-foreground" style={serifItalic}>
            Bevor du weiterliest · kennst du deinen Archetyp?
          </h3>
        </div>
        <div className="md:col-span-5 md:text-right">
          <Link to="/#archetyp" className="inline-flex items-center gap-3 px-6 h-12 bg-foreground hover:bg-brand text-white hover:text-black font-bold text-[13px] tracking-[0.02em] transition-colors">
            Test starten <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const KlasseCTA = () => (
  <section aria-label="Dein nächster Schritt" className="bg-brand text-black" data-testid="journal-cta-klasse">
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-20 md:py-28">
      <div className="grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-8">
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-black/60 mb-5">
            ▸ Dein nächster Schritt · Staatlich anerkannte Führungskräfte-Ausbildung
          </div>
          <h3 className="text-[36px] md:text-[58px] leading-[1.0]" style={serifItalic}>
            In 6 Monaten kann sich alles verändern.
          </h3>
          <p className="mt-5 max-w-2xl text-[15px] md:text-[17px] leading-[1.55] text-black/75">
            Oder du machst es weiter wie bisher. Beides hat einen Preis.
            Selbstbewusst dein Team führen, souverän und schlagfertig in
            herausfordernden Situationen · ohne Selbstzweifel, Gedankenkarussell
            oder unnötige Überstunden. 400 000+ zufriedene Klienten in 20 Ländern.
          </p>
        </div>
        <div className="md:col-span-4 md:text-right flex md:block flex-col gap-3">
          <Link to="/#beratung" className="inline-flex items-center justify-center gap-3 px-6 h-14 bg-black hover:bg-foreground text-brand font-bold text-[14px] tracking-[0.02em] transition-colors">
            Beratungsgespräch buchen <ArrowRight size={18} />
          </Link>
          <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-black/55">
            ▸ Unverbindlich · 30 Min
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────
// NewsFeedStrip · kuratierte DACH-News (KI · Führung · Jobmarkt)
// 3 Buckets · 13 Items · wöchentliches Update
// ─────────────────────────────────────────────────────────────────────────
const NewsItemRow = ({ item }) => {
  const dateLabel = new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-3 border-b border-foreground/10 hover:bg-foreground/[0.025] -mx-3 px-3 transition-colors"
      data-testid={`news-item-${item.bucket}-${item.date}`}
    >
      <div className="flex items-center gap-3 mb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.22em]">
        <span className="text-brand-strong">{dateLabel.toUpperCase()}</span>
        <span className="text-foreground/35">·</span>
        <span className="text-foreground/55">{item.source}</span>
        <span className="text-foreground/35">·</span>
        <span className="text-foreground/65">{item.tag}</span>
      </div>
      <h4
        className="text-[14.5px] md:text-[15.5px] leading-[1.3] text-foreground group-hover:text-brand-strong transition-colors mb-1"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.012em' }}
      >
        {item.headline}
      </h4>
      <p className="text-[12.5px] leading-[1.5] text-foreground/65 line-clamp-2">{item.blurb}</p>
    </a>
  );
};

const NewsFeedStrip = () => (
  <section
    id="newsfeed"
    aria-label="DACH KI- und Führungs-News"
    className="newsroom-paper border-y border-foreground/15"
    data-testid="journal-newsfeed"
  >
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-14 md:py-18">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 pb-4 border-b-[2px] border-foreground">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] md:text-[36px] text-brand-strong" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>News</span>
          <span className="text-[22px] md:text-[28px] text-foreground" style={{ fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em' }}>FEED</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground/60">
          <Newspaper size={13} />
          <span>DACH · KI · FÜHRUNG · JOBMARKT</span>
          <span className="text-foreground/30">·</span>
          <span className="text-brand-strong">UPDATE WÖCHENTLICH</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-10">
        {NEWS_BUCKETS.map((bucket) => {
          const items = NEWS_ITEMS.filter((n) => n.bucket === bucket.code);
          return (
            <div key={bucket.code} data-testid={`news-bucket-${bucket.code}`}>
              <div className="mb-4 pb-3 border-b border-foreground/20">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-1">
                  ▸ {bucket.eyebrow}
                </div>
                <h3
                  className="text-[20px] md:text-[24px] leading-[1.05] text-foreground"
                  style={{ fontFamily: 'Outfit', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em' }}
                >
                  {bucket.label}<span className="text-brand-strong not-italic">.</span>
                </h3>
              </div>
              <div>
                {items.map((item) => <NewsItemRow key={item.headline} item={item} />)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between flex-wrap gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
        <span>▸ {NEWS_ITEMS.length} ITEMS · {NEWS_BUCKETS.length} BUCKETS</span>
        <span>Hand-picked von Wlad & Team · nicht algorithmisch</span>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────
// FreeToolsStrip · Lead-Magnet Mini-Tools die wirklich Wert liefern
// ─────────────────────────────────────────────────────────────────────────
const FREE_TOOLS = [
  {
    code: 'T·01',
    icon: Compass,
    title: 'Leadership-Diagnose',
    body: '10 Min · 30 Fragen · Score in 3 Dimensionen (KI · Rhetorik · EQ) plus konkreter Lernpfad.',
    cta: 'Diagnose starten',
    href: 'https://leadercheck.de',
    external: true,
    badge: 'KOSTENLOS',
  },
  {
    code: 'T·02',
    icon: MessagesSquare,
    title: 'Klartext-Newsletter',
    body: 'Wlads Notizen aus 400 000 Coachings. Eine kurze E-Mail alle paar Wochen. Frameworks, Skripte, Beobachtungen. Kein Spam.',
    cta: 'Newsletter abonnieren',
    href: '/#newsletter-footer',
    external: false,
    badge: 'WLAD INSIDE',
  },
  {
    code: 'T·03',
    icon: Bot,
    title: 'WladBot Public Demo',
    body: '5 freie Fragen an WladBot ohne Login. Stell ihm deine schwierigste Führungs-Frage der Woche.',
    cta: 'Probieren',
    href: 'https://leaderos.de/demo',
    external: true,
    badge: 'DEMO',
  },
  {
    code: 'T·04',
    icon: Wrench,
    title: '30-Tage-Plan-Template',
    body: 'PDF: Wlad-Methodik als 30-Tage-Plan-Vorlage. Mit Daily-Drill-Slot und Wochen-Reflexions-Block.',
    cta: 'PDF holen',
    href: '/#newsletter-footer',
    external: false,
    badge: 'GRATIS-PDF',
  },
];

const FreeToolsStrip = () => (
  <section
    id="free-tools"
    aria-label="Free Tools von LeaderOS"
    className="bg-[#0A0A0A] text-white"
    data-testid="journal-free-tools"
  >
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-14 md:py-18">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 pb-4 border-b border-white/15">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] md:text-[36px] text-brand" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>Free</span>
          <span className="text-[22px] md:text-[28px] text-white" style={{ fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em' }}>TOOLS</span>
        </div>
        <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/55">
          ▸ KEIN LOGIN · KEIN SPAM · DIREKT NUTZBAR
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {FREE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand">▸ {tool.code}</span>
                <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-black bg-brand px-2 py-1">{tool.badge}</span>
              </div>
              <Icon size={26} className="text-brand mb-4" strokeWidth={1.75} />
              <h3
                className="text-[18px] md:text-[20px] leading-[1.1] text-white mb-3"
                style={{ fontFamily: 'Outfit', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em' }}
              >
                {tool.title}<span className="text-brand not-italic">.</span>
              </h3>
              <p className="text-[13px] leading-[1.5] text-white/70 mb-5 flex-1">{tool.body}</p>
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-brand group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                {tool.cta} <ArrowRight size={12} />
              </div>
            </>
          );
          const className = 'group block border border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand transition-colors p-5 md:p-6 flex flex-col h-full';
          return tool.external ? (
            <a key={tool.code} href={tool.href} target="_blank" rel="noopener noreferrer" className={className} data-testid={`tool-${tool.code}`}>
              {inner}
            </a>
          ) : (
            <Link key={tool.code} to={tool.href} className={className} data-testid={`tool-${tool.code}`}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────
// Sticky category strip (sub-nav under masthead)
// ─────────────────────────────────────────────────────────────────────────
const CategoryStrip = ({ categories, search, setSearch }) => (
  <nav
    aria-label="Kategorie-Navigation"
    className="sticky top-20 z-20 newsroom-paper border-b border-foreground/15"
  >
    <div className="max-w-[1480px] mx-auto px-6 md:px-10 lg:px-14 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-foreground/50">
        ▸ Ressorts
      </span>
      {categories.map((c) => (
        <a
          key={c.code}
          href={`#cat-${c.slug}`}
          className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/75 hover:text-brand-strong transition-colors"
        >
          {c.name}
          <span className="ml-1.5 opacity-50">({c.articles.length})</span>
        </a>
      ))}
      <div className="ml-auto flex items-center gap-2 border border-foreground/20 px-3 h-9 bg-white/60">
        <Search size={13} className="text-foreground/55" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen…"
          className="bg-transparent outline-none text-[12px] font-semibold text-foreground placeholder:text-foreground/40 w-32 md:w-44"
          data-testid="journal-search"
        />
      </div>
    </div>
  </nav>
);

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────
export default function JournalIndex() {
  const [search, setSearch] = useState('');
  const articles = useMemo(() => listArticles(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [articles, search]);

  const categories = useMemo(() => groupByTaxonomy(filtered), [filtered]);

  // Front-page lede composition:
  //   feature      = newest article
  //   datedHeads   = next 6 newest (column of dated headlines)
  //   hotStories   = 2 picks with newsroom labels (MOVES / PEOPLE)
  const featureArticle = filtered[0] || null;
  const datedArticles  = filtered.slice(1, 7);
  const hotStories     = filtered.slice(7, 9).map((article, i) => ({
    article,
    label: i === 0 ? 'MOVES' : 'PEOPLE',
    tone: i === 0 ? 'lime' : 'ink',
  }));

  useEffect(() => {
    const restoreSeo = applySeoToDocument({
      title: 'Feldnotizen · Das KI-Leadership Magazin · Wlad Jachtchenko',
      description:
        'Newsroom für KI-natives Führen · Frameworks, Skripte, Field-Notes aus ' +
        'Wlad Jachtchenkos Arbeit mit 400 000+ Klienten. Podcast, Bücher, ' +
        'LeaderOS, Leadership-Summit.',
      canonical: 'https://leader-os.de/journal',
      keywords: ['KI Führung', 'Leadership Magazin', 'Wlad Jachtchenko', 'Schlagfertigkeit', 'Mitarbeiterführung', 'Beratungsgespräch', 'LeaderOS'],
      robots: 'index, follow, max-image-preview:large',
      ogImage: null,
    });

    // The magazine is a light editorial surface (cream newsroom paper). Lock
    // light mode while mounted so theme-dependent `text-foreground` never
    // renders light-on-cream (unreadable) for visitors whose OS/app is dark.
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) root.classList.remove('dark');

    return () => {
      restoreSeo();
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div className="newsroom-paper min-h-screen antialiased text-foreground" data-testid="journal-index">
      <LandingNav />

      <Masthead totalArticles={articles.length} />

      <FrontPageLede
        featureArticle={featureArticle}
        datedArticles={datedArticles}
        hotStories={hotStories}
      />

      <FromWladStrip />

      <NewsFeedStrip />

      <CategoryStrip categories={categories} search={search} setSearch={setSearch} />

      <main>
        {categories.map((cat, idx) => {
          const splitDir = idx % 2 === 0;
          return (
            <div key={cat.code}>
              <CategorySection category={cat} splitDirection={splitDir} />
              {cat.code === 'C-01' && <ArchetypTeaserCTA />}
              {cat.code === 'C-02' && <FreeToolsStrip />}
              {cat.code === 'C-03' && <DiagnoseCTA />}
              {cat.code === 'C-04' && <KlasseCTA />}
              {cat.code === 'C-05' && (
                <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
                  <WebinarTicketAd placement="journal-index" />
                </div>
              )}
            </div>
          );
        })}

        <CoursesLibrarySection placement="journal-index" />

        {filtered.length === 0 && (
          <section className="max-w-[1480px] mx-auto px-6 md:px-12 py-20">
            <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-foreground/55">
              ▸ Kein Treffer für "{search}". Versuch "KI", "Rhetorik", "Framework".
            </p>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

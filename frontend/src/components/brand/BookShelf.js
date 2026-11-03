import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { BOOKSHELF, coverSrc } from '../../data/wladBookshelf';

/**
 * BookShelf · horizontales Bücherregal für Wlads Bände.
 *
 * Ein Regalbrett, das nach links wegschiebt: Maus ziehen, Trackpad, Touch-
 * Wischen, Pfeiltasten (Track ist fokussierbar) oder die Pfeil-Buttons.
 * Bücher stehen leicht gedreht im Regal (rotateY) und richten sich beim
 * Hover auf; Buchrücken und Seitenschnitt sind CSS, keine extra Bilder.
 * Scroll-Snap pro Band, Fortschrittsbalken + Zähler oben rechts.
 *
 * Daten: src/data/wladBookshelf.js (Cover-Titel, Verlag, Jahr, ISBN).
 */

const INK = '#0A0A0A';
const LIME = '#BFFF00';
const DISPLAY = { fontFamily: 'Anton, Impact, "Arial Narrow", sans-serif', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '-0.005em' };
const HEAD = { fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 500, letterSpacing: '-0.02em' };
const BODY = { fontFamily: 'Inter, system-ui, sans-serif' };
const MONO = { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', letterSpacing: '0.14em', textTransform: 'uppercase' };
const ease = [0.25, 0.46, 0.45, 0.94];

// Linker Rand des ersten Bandes = linker Rand der Überschrift (max-width 1280,
// 20px Gutter); rechts läuft das Regal bis an den Viewport-Rand.
const GUTTER = 'max(20px, calc((100vw - 1280px) / 2 + 20px))';

const bookVariants = { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0, transition: { duration: 0.8, ease } } };

function Book({ book, index }) {
  return (
    <motion.li data-book variants={bookVariants} className="shrink-0 snap-start group" style={{ width: 'clamp(210px, 24vw, 290px)' }}>
      <div className="relative" style={{ perspective: 1400, height: 'clamp(315px, 36vw, 435px)' }}>
        <div
          className="absolute inset-x-0 bottom-0 transition-transform duration-500 ease-out [transform:rotateY(-16deg)] group-hover:[transform:rotateY(0deg)_translateY(-14px)]"
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              aspectRatio: '2 / 3', borderRadius: '2px 6px 6px 2px', background: '#1a1a1a',
              boxShadow: '18px 22px 40px rgba(0,0,0,0.55), 2px 2px 0 rgba(255,255,255,0.04)',
            }}
          >
            <img
              src={coverSrc(book.slug)}
              alt={`${book.title} – Buchcover`}
              loading="lazy" draggable={false}
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
            {/* Buchrücken: Falz + Glanz */}
            <span className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: '9%', background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.28) 18%, rgba(0,0,0,0.18) 32%, rgba(255,255,255,0.06) 60%, transparent 100%)' }} />
            {/* Lichtkante */}
            <span className="absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.18) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.25) 100%)' }} />
          </div>
          {/* Seitenschnitt rechts */}
          <span
            className="absolute top-[3px] bottom-[3px] pointer-events-none"
            style={{ right: -7, width: 8, borderRadius: '0 3px 3px 0', background: 'repeating-linear-gradient(90deg, #f3f1ea 0 1px, #d9d5c9 1px 2px)', transform: 'rotateY(60deg)', transformOrigin: 'left center' }}
          />
        </div>
      </div>

      <div className="relative z-[1] pt-7">
        <div className="flex flex-wrap items-center justify-between" style={{ gap: '8px 12px' }}>
          <span className="flex items-center" style={{ gap: 8 }}>
            <span className="text-[12px]" style={{ ...MONO, color: LIME, fontWeight: 700 }}>{String(index + 1).padStart(2, '0')}</span>
            {book.bestseller && (
              <span className="text-[9px] rounded-full" style={{ ...MONO, fontWeight: 700, padding: '4px 8px', background: LIME, color: INK }}>SPIEGEL-Bestseller</span>
            )}
          </span>
          <span className="text-[11px]" style={{ ...MONO, color: 'rgba(255,255,255,0.45)' }}>{book.publisher} · {book.year}</span>
        </div>
        <h3 className="mt-3 text-[18px] md:text-[20px] leading-[1.2] text-white" style={HEAD}>{book.title}</h3>
        <p className="mt-1.5 text-[14px] leading-[1.45]" style={{ ...BODY, color: 'rgba(255,255,255,0.6)' }}>
          {book.sub}{book.coAuthor ? ` · mit ${book.coAuthor}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap" style={{ gap: 6 }}>
          {book.inside.map((t) => (
            <span key={t} className="text-[11px] rounded-full" style={{ ...BODY, fontWeight: 600, padding: '5px 10px', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.16)' }}>{t}</span>
          ))}
        </div>
      </div>
    </motion.li>
  );
}

export function BookShelf({
  books = BOOKSHELF,
  eyebrow = 'Die Bibliothek',
  title = 'Bücher, aus denen die Methode kommt',
  intro = 'Die Frameworks in LeaderOS stehen zuerst in diesen Büchern: SEXIER, die 10 Stufen des Zuhörens, Körpersprache, Verhandlung. Der KI-Coach wendet sie so an, wie Wlad sie geschrieben hat.',
  moreHref = '/wlad-jachtchenko',
  moreEyebrow = 'Alle Bücher',
  moreTitle = 'Wlads komplette Bibliothek mit ISBN',
  moreExternal = false,
  onTrack,
}) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(1);
  const [edges, setEdges] = useState({ start: true, end: false });

  const step = useCallback(() => {
    const el = trackRef.current;
    const first = el?.querySelector('li[data-book]');
    if (!first) return 300;
    const gap = parseFloat(getComputedStyle(el.firstElementChild).columnGap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    setCurrent(el.scrollLeft > max - 8 ? books.length : Math.min(books.length, Math.round(el.scrollLeft / step()) + 1));
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
  }, [books.length, step]);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const scrollByBooks = (dir) => {
    trackRef.current?.scrollBy({ left: dir * step(), behavior: 'smooth' });
    onTrack?.('bookshelf_nav', { dir });
  };

  // Maus-Drag (Touch und Trackpad scrollen nativ). Während des Ziehens
  // ist Snap aus, beim Loslassen rastet das nächste Buch ein.
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = trackRef.current;
    drag.current = { active: true, moved: false, x: e.clientX, left: el.scrollLeft };
    el.style.scrollSnapType = 'none';
    el.style.cursor = 'grabbing';
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    trackRef.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const el = trackRef.current;
    el.style.cursor = '';
    const s = step();
    el.scrollTo({ left: Math.round(el.scrollLeft / s) * s, behavior: 'smooth' });
    setTimeout(() => { if (el) el.style.scrollSnapType = ''; }, 400);
    if (d.moved) onTrack?.('bookshelf_drag');
  };
  const onClickCapture = (e) => {
    if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
  };

  const navBtn = (dir, disabled, label) => (
    <button
      type="button" onClick={() => scrollByBooks(dir)} disabled={disabled} aria-label={label}
      className="flex items-center justify-center rounded-full transition-all disabled:opacity-25 disabled:cursor-default enabled:hover:scale-95"
      style={{ width: 52, height: 52, border: '1px solid rgba(255,255,255,0.22)', color: '#fff', background: disabled ? 'transparent' : 'rgba(255,255,255,0.06)' }}
    >
      {dir < 0 ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
    </button>
  );

  return (
    <section ref={sectionRef} aria-label="Bücherregal: Wlad Jachtchenkos Bücher" className="relative overflow-hidden" style={{ background: INK }}>
      <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(191,255,0,0.10), transparent 60%)' }} />

      <div className="relative mx-auto" style={{ maxWidth: 1280, padding: 'clamp(80px, 10vw, 130px) 20px 0' }}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between" style={{ gap: 28 }}>
          <div style={{ maxWidth: 820 }}>
            <motion.span
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease }}
              className="inline-block text-[11px]" style={{ ...MONO, color: LIME, fontWeight: 700 }}
            >
              ▸ {eyebrow} · {String(books.length).padStart(2, '0')} Bände
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease, delay: 0.05 }}
              className="mt-4 text-white text-[40px] sm:text-[60px] lg:text-[88px]" style={{ ...DISPLAY, lineHeight: 0.92 }}
            >
              {title}<span style={{ color: LIME }}>.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease, delay: 0.12 }}
              className="mt-5 text-[16px] md:text-[17px] leading-[1.6]" style={{ ...BODY, color: 'rgba(255,255,255,0.65)', maxWidth: 620 }}
            >
              {intro}
            </motion.p>
          </div>
          <div className="flex items-center" style={{ gap: 18 }}>
            <span className="text-[13px] tabular-nums" style={{ ...MONO, color: 'rgba(255,255,255,0.55)' }} aria-live="polite">
              <b style={{ color: '#fff' }}>{String(current).padStart(2, '0')}</b> / {String(books.length).padStart(2, '0')}
            </span>
            <div className="flex" style={{ gap: 10 }}>
              {navBtn(-1, edges.start, 'Vorheriges Buch')}
              {navBtn(1, edges.end, 'Nächstes Buch')}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        tabIndex={0}
        aria-label="Bücher, horizontal scrollbar"
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="relative mt-14 overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]/60"
        style={{ scrollPaddingInline: GUTTER, scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
      >
        <motion.ul
          className="relative inline-flex"
          style={{ columnGap: 'clamp(36px, 5vw, 72px)', paddingInline: GUTTER, paddingTop: 24 }}
          initial="hidden" animate={inView ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
        >
          {/* Regalbrett unter allen Bänden */}
          <li
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
              left: 0, right: 0, top: `calc(24px + clamp(315px, 36vw, 435px))`, height: 14,
              background: 'linear-gradient(180deg, #2a2a2a 0%, #151515 55%, #0d0d0d 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 18px 30px rgba(0,0,0,0.6)',
            }}
          />
          {books.map((b, i) => <Book key={b.slug} book={b} index={i} />)}
          <li className="shrink-0 snap-start flex items-center" style={{ width: 'clamp(200px, 20vw, 260px)', height: 'clamp(315px, 36vw, 435px)' }}>
            <a
              href={moreHref}
              {...(moreExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => onTrack?.('bookshelf_more')}
              className="group/more flex flex-col justify-between w-full h-[70%] rounded-[6px] transition-colors hover:bg-white/[0.06]"
              style={{ border: '1px dashed rgba(255,255,255,0.25)', padding: 22 }}
            >
              <span className="text-[11px]" style={{ ...MONO, color: LIME, fontWeight: 700 }}>{moreEyebrow}</span>
              <span className="text-[22px] leading-[1.15] text-white" style={HEAD}>{moreTitle}</span>
              <ArrowUpRight size={26} className="text-white transition-transform group-hover/more:translate-x-1 group-hover/more:-translate-y-1" />
            </a>
          </li>
        </motion.ul>
      </div>

      <div className="relative mx-auto" style={{ maxWidth: 1280, padding: '36px 20px clamp(80px, 10vw, 120px)' }}>
        <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.max(8, progress * 100)}%`, background: LIME }} />
        </div>
        <p className="mt-4 text-[11px]" style={{ ...MONO, color: 'rgba(255,255,255,0.4)' }}>Ziehen, wischen oder ← → · SPIEGEL-Bestseller-Autor Wlad Jachtchenko</p>
      </div>
    </section>
  );
}

export default BookShelf;

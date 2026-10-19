import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target } from 'lucide-react';

/**
 * ArticleLeftRail · sticky reading aide on the left of long-form articles.
 *
 * Two stacked modules:
 *   1. Auto-generated Table of Contents from h2 headings (scrollspy)
 *   2. Sticky mini-CTA card · "14 Tage kostenlos · keine Karte"
 *
 * The TOC is the killer feature: users on long reads always want to
 * skim what's coming. The mini-CTA stays in their peripheral vision
 * the whole way down so the conversion path never feels far.
 *
 * Desktop-only · on mobile/tablet the TOC is collapsed into a single
 * "Inhalt" details element rendered inline by the article page above
 * the body content (see ArticlePage.jsx mobile-fallback).
 */
export const ArticleLeftRail = ({ headings, slug }) => {
  const [activeId, setActiveId] = useState(headings?.[0]?.id || '');

  useEffect(() => {
    if (!headings || headings.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting heading as active
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting.length > 0) {
          setActiveId(intersecting[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: [0, 0.5, 1] },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings, slug]);

  return (
    <aside className="hidden xl:block w-[240px] shrink-0" aria-label="Inhalt + Aktion">
      <div className="sticky top-28 space-y-6">
        {headings && headings.length > 0 && (
          <nav data-testid="article-toc" className="border-l-2 border-foreground/10 pl-4">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-foreground/45 font-mono mb-3">
              ▸ INHALT
            </p>
            <ul className="space-y-2">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 90;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }}
                    className={`block text-[12px] leading-[1.4] transition-colors py-0.5 border-l-2 -ml-[18px] pl-3 ${
                      activeId === h.id
                        ? 'text-foreground border-brand font-semibold'
                        : 'text-foreground/55 border-transparent hover:text-foreground'
                    }`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Sticky mini-CTA · always visible while reading */}
        <div className="bg-foreground text-background p-5 relative overflow-hidden">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-brand mb-3">
            ▸ JETZT
          </div>
          <h4
            className="text-[20px] leading-[1.04] tracking-[-0.025em] mb-3"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            14 Tage<br/>kostenlos<span className="text-brand not-italic">.</span>
          </h4>
          <p className="text-[12px] leading-[1.5] text-background/85 mb-4">
            Volle Plattform. Kein Risiko. Jederzeit kündbar.
          </p>
          <a
            href="https://leaderos.de/signup?trial=14"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="article-left-rail-cta"
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-white text-[#0A0A0A] font-bold text-[11px] uppercase tracking-[0.14em] px-3 h-9 transition-colors"
          >
            Starten <ArrowRight size={13} />
          </a>
        </div>

        <div className="flex items-start gap-2 text-[10.5px] leading-[1.4] text-foreground/45 font-mono">
          <Sparkles size={11} className="mt-0.5 shrink-0 text-brand-strong" />
          <span>
            Wlad-Methodik · 11 Frameworks · 24/7 KI-Coach.
          </span>
        </div>

        <div className="flex items-start gap-2 text-[10.5px] leading-[1.4] text-foreground/45 font-mono">
          <Target size={11} className="mt-0.5 shrink-0 text-brand-strong" />
          <span>
            3× SPIEGEL-Bestseller. 400 000 Klienten.
          </span>
        </div>
      </div>
    </aside>
  );
};

/**
 * Extract h2 headings from an article body for the TOC.
 * Auto-assigns ids if missing.
 */
export function extractHeadings(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b.type === 'heading' && (b.level === 2 || !b.level))
    .map((b) => ({
      id: b.id || slugify(b.text),
      text: (b.text || '').replace(/\.$/, ''),
    }))
    .filter((h) => h.text);
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c))
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

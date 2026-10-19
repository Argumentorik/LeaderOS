import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FAQS, LANDING_FAQ_KICKER, LANDING_FAQ_TITLE } from '../../data/landingFaq';

/**
 * FAQSection · full-width answer block on the landing page.
 *
 * SEO/AEO rules baked in (docs/gtm/SEO_AEO_PLAYBOOK.md §3):
 *  - every answer is ALWAYS in the DOM (collapsed, not unmounted) so
 *    Google's renderer and answer engines read all of them, not just the
 *    open one;
 *  - questions are real <h3> headings under one <h2>, answer-first text;
 *  - FAQPage JSON-LD mirrors the visible text word for word;
 *  - internal links under the answers lead to the static answer pages
 *    (/kurse, /fragen) and the webinar, which crawlers can read without JS.
 *
 * Layout: full-bleed section, a 12-column grid on desktop with the title
 * pinned left and the questions filling the remaining width. Mobile stacks.
 */
const isStatic = (href) => href.startsWith('/fragen') || href.startsWith('/kurse');

const AnswerLink = ({ href, label }) =>
  isStatic(href) ? (
    // Static answer pages live outside the React router (public/<path>/index.html).
    <a href={href} className="text-brand font-bold hover:underline underline-offset-4">{label} →</a>
  ) : (
    <Link to={href} className="text-brand font-bold hover:underline underline-offset-4">{label} →</Link>
  );

const Item = ({ faq, isOpen, onToggle, index }) => {
  const panelId = `faq-a-${index + 1}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay: 0.03 * index, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-foreground/15"
      role="listitem"
    >
      <h3 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-start gap-4 md:gap-6 py-5 md:py-7 text-left group"
          aria-expanded={isOpen}
          aria-controls={panelId}
          data-testid={`faq-q-${index + 1}`}
        >
          <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/45 font-mono pt-1.5 shrink-0 w-9 md:w-12">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="flex-1 text-[18px] md:text-[24px] lg:text-[26px] leading-[1.2] tracking-[-0.015em] text-foreground"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700 }}
          >
            {faq.q}
          </span>
          <span
            className={`shrink-0 flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border transition-all ${
              isOpen
                ? 'bg-brand border-brand text-[#0A0A0A] rotate-45'
                : 'border-foreground/25 text-foreground group-hover:border-foreground/50'
            }`}
            aria-hidden
          >
            <span className="text-xl leading-none font-black">+</span>
          </span>
        </button>
      </h3>

      {/* Always rendered: crawlers read every answer; only the height animates. */}
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
        aria-hidden={!isOpen}
      >
        <div className="pl-9 md:pl-12 pr-2 md:pr-16 pb-6 md:pb-8 max-w-[72ch]">
          <p className="text-[15px] md:text-[17px] leading-[1.65] text-foreground/75">{faq.a}</p>
          {faq.links?.length ? (
            <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] md:text-[14px]">
              {faq.links.map(([href, label]) => (
                <AnswerLink key={href} href={href} label={label} />
              ))}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState(0);

  // FAQPage JSON-LD, word for word the visible text. Injected at mount,
  // removed on unmount so it never lingers on routes without FAQs.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://leader-os.de/#faq',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.surface = 'faq-section';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <section
      id="faq"
      className="relative w-full bg-background border-t border-foreground/10"
      aria-labelledby="faq-heading"
      data-testid="faq-section"
    >
      <div className="w-full px-5 md:px-10 xl:px-16 2xl:px-24 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Title column · pinned on desktop so the heading stays in view
              while the long list scrolls. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:sticky lg:top-28 self-start"
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
              ▸ {LANDING_FAQ_KICKER}
            </p>
            <h2
              id="faq-heading"
              className="text-[40px] sm:text-[56px] md:text-[64px] xl:text-[72px] leading-[0.92] tracking-[-0.04em] text-foreground"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              {LANDING_FAQ_TITLE.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] md:text-[16px] leading-[1.6] text-foreground/65">
              {FAQS.length} Antworten, antwort-zuerst geschrieben. Für die Frameworks selbst (SEXIER, Feedbackformel, 5 Rollen) gibt es eine eigene Seite.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] md:text-[14px]">
              <AnswerLink href="/fragen" label="Fragen & Frameworks" />
              <AnswerLink href="/kurse" label="Kurse & Zugang" />
            </p>
          </motion.div>

          <div className="lg:col-span-8" role="list">
            {FAQS.map((faq, i) => (
              <Item
                key={faq.q}
                faq={faq}
                index={i}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

import { EmailCapture } from '../../newsletter';

/**
 * NewsletterDrop · in-article EmailCapture placement.
 *
 * Lives at the end of every article so we attribute every signup to
 * the article that drove it (source="article", campaign=article.slug).
 * Light tone, framed band, deliberately not full-bleed so it reads as
 * a pause inside the article flow, not a footer.
 */
export const NewsletterDrop = ({ articleSlug }) => (
  <aside
    aria-label="Newsletter abonnieren"
    data-newsletter-zone
    className="mt-16 md:mt-20 bg-foreground/[0.04] border-y border-foreground/15 px-6 md:px-9 py-10 md:py-12"
  >
    <div className="max-w-2xl">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-3 font-mono">
        ▸ KLARTEXT ABONNIEREN
      </p>
      <h3
        className="text-[26px] md:text-[34px] leading-[1.05] tracking-[-0.025em] text-foreground mb-3"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        Eine Notiz alle paar Wochen<span className="text-brand not-italic">.</span>
      </h3>
      <p className="text-[14.5px] leading-[1.6] text-foreground/70 mb-5 max-w-xl">
        Wlads Notizen aus 400 000 Coachings. Kein Spam, jederzeit
        abbestellbar. Du gehörst zur Klasse die zuerst hört wenn etwas
        Neues kommt.
      </p>
      <EmailCapture
        source="article"
        campaign={articleSlug}
        tone="light"
        variant="stacked"
        compact
      />
    </div>
  </aside>
);

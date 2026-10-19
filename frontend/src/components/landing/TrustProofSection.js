import { useEffect } from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import { PressMarquee } from './PressMarquee';

/**
 * TrustProofSection · honest social-proof wall.
 *
 * INTEGRITY NOTE: LeaderOS launched in 2026 and has no product reviews
 * yet. We do NOT fabricate testimonials. Instead this section surfaces
 * Wlad Jachtchenko's REAL, externally-verifiable reputation · the
 * methodik behind LeaderOS · with outbound links so a sceptical
 * visitor can check every number at its source:
 *
 *   - Trustpilot 4.9 / 388 reviews · Argumentorik GmbH (Wlad Jachtchenko)
 *   - Greator 4.7 / 995 reviews · Wlad's coach profile
 *   - LinkedIn Learning · 250 000+ course participants
 *   - 400 000+ trainierte Klienten · 14 Mio Views · 13 Bücher
 *
 * Each platform stat links out to the source. The aggregate Review
 * schema below is attributed to the Argumentorik-Akademie (the entity
 * those reviews actually describe), not to the brand-new LeaderOS
 * product · so the structured data is truthful and penalty-safe.
 */

const REVIEW_PLATFORMS = [
  {
    name: 'Trustpilot',
    rating: '4.9',
    count: '388',
    sub: 'Argumentorik · Wlad Jachtchenko',
    href: 'https://uk.trustpilot.com/review/argumentorik.com',
  },
  {
    name: 'Greator',
    rating: '4.7',
    count: '995',
    sub: 'Coach-Profil Wlad Jachtchenko',
    href: 'https://greator.com/coach/wlad-jachtchenko',
  },
];

const HARD_NUMBERS = [
  { big: '400K+', label: 'Trainierte Klienten', sub: 'In über 20 Ländern' },
  { big: '250K+', label: 'LinkedIn-Learning', sub: 'Kurs-Teilnehmer' },
  { big: '14M',   label: 'Views', sub: 'Podcast + YouTube' },
  { big: '3×',    label: 'SPIEGEL-Bestseller', sub: '13 Bücher gesamt' },
];

// Aggregate Review schema · attributed to the entity the reviews
// actually describe (the academy / Wlad's body of work), NOT the
// new LeaderOS product. Truthful + penalty-safe.
const REVIEW_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': 'https://leader-os.de/#argumentorik-reviews',
  name: 'Argumentorik-Akademie · Wlad Jachtchenko',
  url: 'https://wlad-jachtchenko.com',
  founder: { '@id': 'https://leader-os.de/wlad-jachtchenko#person' },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '388',
    bestRating: '5',
    worstRating: '1',
    // The rating is sourced from Trustpilot · we cite it transparently.
    url: 'https://uk.trustpilot.com/review/argumentorik.com',
  },
};

export const TrustProofSection = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(REVIEW_JSON_LD);
    el.dataset.trustProof = 'leader-os';
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <section
      id="trust-proof"
      data-testid="trust-proof-section"
      aria-label="Vertrauen · echte Zahlen, extern prüfbar"
      className="relative w-full bg-[#0A0A0A] text-white border-y-2 border-black overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(191,255,0,0.07) 0%, transparent 65%)', filter: 'blur(50px)' }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
        {/* Header */}
        <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-end mb-12 md:mb-16">
          <div className="md:col-span-7 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand">
              <span>▸ VERTRAUEN · EXTERN PRÜFBAR</span>
            </div>
            <h2
              className="text-[32px] sm:text-[48px] md:text-[64px] leading-[0.96] tracking-[-0.035em]"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Andere versprechen.<br />
              <span className="text-white/55">Wlad belegt</span>
              <span className="text-brand not-italic">.</span>
            </h2>
          </div>
          <div className="md:col-span-5 md:pb-2 text-center md:text-left">
            <p className="text-[15px] md:text-[16.5px] leading-[1.6] text-white/72">
              LeaderOS ist neu · aber Wlads Methodik ist es nicht. Jede
              Zahl hier kannst du an der Quelle nachprüfen. Wir verlinken
              direkt dorthin.
            </p>
          </div>
        </div>

        {/* Review platforms · star cards with outbound links */}
        <div className="grid sm:grid-cols-2 gap-5 md:gap-6 mb-6 md:mb-8">
          {REVIEW_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`review-${p.name.toLowerCase()}`}
              className="group flex items-center justify-between gap-4 border-2 border-white/15 hover:border-brand bg-white/[0.03] hover:bg-white/[0.06] p-6 md:p-7 transition-colors"
            >
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={16} className="fill-brand text-brand" />
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-white leading-none"
                    style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '40px' }}
                  >
                    {p.rating}
                  </span>
                  <span className="text-[13px] font-mono uppercase tracking-[0.16em] text-white/55">
                    / 5 · {p.count} Reviews
                  </span>
                </div>
                <div className="mt-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {p.name} · {p.sub}
                </div>
              </div>
              <ArrowUpRight size={20} className="shrink-0 text-white/35 group-hover:text-brand group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>

        {/* Hard numbers strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {HARD_NUMBERS.map((n) => (
            <div key={n.label} className="border-2 border-white/12 bg-white/[0.02] p-5 md:p-6 text-center md:text-left">
              <div
                className="text-brand leading-none"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 44px)' }}
              >
                {n.big}
              </div>
              <div className="mt-2 text-[12.5px] font-bold text-white/85 leading-[1.2]">
                {n.label}
              </div>
              <div className="mt-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/45">
                {n.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Press strip · "Bekannt aus" — chrome wordmark marquee */}
        <div className="mt-12 md:mt-14 pt-8 border-t border-white/10">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-brand mb-5 text-center md:text-left">
            ▸ BEKANNT AUS
          </p>
          <PressMarquee className="py-2" />
        </div>
      </div>
    </section>
  );
};

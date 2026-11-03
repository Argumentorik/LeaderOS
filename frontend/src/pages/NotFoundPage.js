import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';

/**
 * NotFoundPage · branded 404 instead of the silent Navigate-to-/ catch-all.
 *
 * Why a real 404 matters:
 *   - Soft-redirect to / hides the broken-link signal from Google's crawler ·
 *     having a proper 404 (with status code we set via response header in
 *     vercel.json + the route still rendering) lets Search Console flag
 *     broken external backlinks so we can ask domain owners to fix them.
 *   - User UX: if a journalist deep-links to /wlad-jachtchenko-bio or
 *     /wlad-bio, the previous Navigate-to-/ landed them on the homepage with
 *     zero context. Now we surface "did you mean" suggestions.
 *   - Brand: every page on the site should feel intentional, including the
 *     unhappy path.
 *
 * SEO: noindex meta so crawler doesn't try to add the 404 URL to its index ·
 * Google explicitly recommends noindex on soft-404 surfaces.
 */
export default function NotFoundPage() {
  useEffect(() => {
    document.title = '404 · Seite nicht gefunden · LeaderOS';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased flex flex-col" data-testid="not-found">
      <LandingNav />

      <main className="flex-1 max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-32 w-full">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-5 font-mono">
              ▸ 404 · ROUTE NICHT GEFUNDEN
            </p>
            <h1
              className="text-[64px] sm:text-[96px] md:text-[144px] lg:text-[180px] leading-[0.86] tracking-[-0.04em] text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Nichts hier<span className="text-brand not-italic">.</span>
            </h1>
            <p className="mt-6 text-[16px] md:text-[18px] leading-[1.6] text-foreground/70 max-w-2xl">
              Diese URL gibt es nicht. Vielleicht ist sie umgezogen,
              vielleicht hatte sie nie eine Existenz. Wahrscheinlich
              wolltest du eine von diesen Seiten:
            </p>
          </div>

          <div className="md:col-span-5 md:pt-8">
            <ul className="border-t-2 border-foreground">
              {[
                { to: '/', label: 'LeaderOS Landing', sub: 'Plattform-Übersicht' },
                { to: '/wlad-jachtchenko', label: 'Wlad Jachtchenko', sub: 'Person · Bücher · Methodik' },
                { to: '/journal', label: 'Feldnotizen', sub: '96 Artikel · KI Leadership' },
                { to: '/journal/was-ist-eine-ki-native-fuehrungskraft', label: 'KI-nativ definiert', sub: 'Definition + 5 Merkmale' },
                { to: '/journal/leader-os-vs-chatgpt-claude-perplexity', label: 'Tool-Vergleich', sub: 'LeaderOS vs Mainstream-KI' },
              ].map((link) => (
                <li key={link.to} className="border-b border-foreground/15">
                  <Link
                    to={link.to}
                    className="group flex items-center justify-between gap-4 py-4 hover:bg-foreground/[0.03] transition-colors -mx-2 px-2"
                    data-testid={`404-suggestion-${link.to.replace(/\//g, '-')}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[14.5px] md:text-[15.5px] font-bold text-foreground leading-[1.3] truncate">
                        {link.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-foreground/55 truncate">
                        {link.sub}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-foreground/35 group-hover:text-brand-strong group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-5 bg-foreground/[0.03] border-l-2 border-brand-strong">
              <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-2">
                ▸ KAPUTTER LINK GEFUNDEN
              </p>
              <p className="text-[13px] leading-[1.5] text-foreground/70">
                Wenn dieser Link aus einer externen Quelle stammt · schreib uns
                kurz an{' '}
                <a
                  href="mailto:start@aiporate.com?subject=404%20auf%20leader-os.de"
                  className="font-bold text-foreground hover:text-brand-strong transition-colors underline decoration-brand/40 underline-offset-2"
                >
                  start@aiporate.com
                </a>
                . Wir fixen die Quelle.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

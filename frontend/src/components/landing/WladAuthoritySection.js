import { useEffect } from 'react';
import { Award, Mic, BookText, Users, Tv, GraduationCap } from 'lucide-react';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';

/**
 * WladAuthoritySection · die dedizierte Trust- und SEO-Authority-Sektion
 * für Wlad Jachtchenko.
 *
 * Vorher war Wlads Profil nur lose über die Hero, das Vimeo-Intro und
 * verstreute Testimonials erkennbar. Diese Section bündelt alles:
 *   - 6 harte Credentials (Bücher, Auftritte, Klienten, Awards)
 *   - JSON-LD Person + Author-Markup für AEO + Knowledge-Graph
 *   - Bewusst hohe natürliche Keyword-Dichte ("Wlad Jachtchenko")
 *   - Identity-Shift-Narrativ: Wlad ist nicht nur Coach, er ist der
 *     Beweis dass KI + Rhetorik + Methodik zu Wirkung wird
 *
 * Position auf der Landing: SLOT 03 (direkt nach SprintSpecimen, vor
 * dem ersten Intro-Video) · wer hier landet versteht in 8 Sekunden
 * WER hinter LeaderOS steht und warum das nicht der nächste KI-
 * Influencer ist.
 */

const CREDENTIALS = [
  {
    icon: BookText,
    bib: '01',
    headline: '3× SPIEGEL-Bestseller',
    body:
      '"Dunkle Rhetorik", "Schwarze Rhetorik", "Manipulationstechniken" · ' +
      'die meistverkauften Rhetorik-Sachbücher Deutschlands seit 2018.',
  },
  {
    icon: Users,
    bib: '02',
    headline: '400 000+ Klienten ausgebildet',
    body:
      'Vom Engineering-Lead über CEOs bis zu Vertriebsteams · Live-Workshops, ' +
      'Online-Akademie, persönliche Coachings über mehr als ein Jahrzehnt.',
  },
  {
    icon: GraduationCap,
    bib: '03',
    headline: 'Gründer Argumentorik-Akademie',
    body:
      'Größte Online-Akademie für Rhetorik & Verhandlung im DACH-Raum. ' +
      'Über 100 Online-Kurse, 50 Mio. Minuten Lernzeit ausgeliefert.',
  },
  {
    icon: Tv,
    bib: '04',
    headline: 'Funk, TV & Podcasts',
    body:
      'Regelmäßig in ARD, ZDF, ntv, Welt, Wirtschaftswoche, Handelsblatt · ' +
      'plus eigene Podcasts zu Rhetorik, KI und KI-natives Führen.',
  },
  {
    icon: Mic,
    bib: '05',
    headline: 'Top-Speaker auf 500+ Bühnen',
    body:
      'Hauptredner auf Konferenzen für Coca-Cola, Allianz, SAP, BMW, Bosch. ' +
      'Bewertungsdurchschnitt 4.9 / 5.0 über 500+ Engagements.',
  },
  {
    icon: Award,
    bib: '06',
    headline: '10+ Jahre Wissen verdichtet',
    body:
      'Alles aus Wlads Coachings, Frameworks und Büchern · plus vieles mehr ' +
      'aus über 10 Jahren Praxis · steckt heute in LeaderOS drin.',
  },
];

// JSON-LD Person markup: füllt den Google Knowledge Graph für "Wlad
// Jachtchenko" und stitched alle Marken (LeaderOS, Leadercheck,
// Argumentorik-Akademie) zu einer Identität zusammen. Wir injizieren
// ein einziges sauberes Script-Tag; bei Unmount wieder weg.
const useWladJsonLd = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'wlad-person-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Wlad Jachtchenko',
      alternateName: ['Wladislaw Jachtchenko', 'Wlad'],
      jobTitle: 'Founder, LeaderOS · Top-Speaker · 3× SPIEGEL-Bestseller-Autor',
      description:
        'Wlad Jachtchenko ist 3× SPIEGEL-Bestseller-Autor, Gründer der Argumentorik-Akademie und Erfinder von LeaderOS. Über 400 000 Klienten in Rhetorik, Verhandlung und KI-nativem Führen ausgebildet.',
      url: 'https://leader-os.de',
      image: 'https://leader-os.de/wlad-headshot.jpg',
      knowsAbout: [
        'KI-natives Führen',
        'Rhetorik',
        'Verhandlung',
        'Dunkle Rhetorik',
        'Argumentation',
        'KI-Prompt Engineering für Führungskräfte',
        'Leadership Development',
      ],
      sameAs: [
        'https://argumentorik-akademie.de',
        'https://leadercheck.de',
        'https://leaderos.de',
      ],
      worksFor: {
        '@type': 'Organization',
        name: 'LeaderOS',
        url: 'https://leader-os.de',
      },
      award: [
        '3× SPIEGEL-Bestseller-Autor (Dunkle Rhetorik, Schwarze Rhetorik, Manipulationstechniken)',
        'Top-Speaker 4.9/5.0 · über 500 Bühnen-Engagements',
      ],
    });
    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById('wlad-person-jsonld');
      if (existing) existing.parentNode?.removeChild(existing);
    };
  }, []);
};

export const WladAuthoritySection = () => {
  useWladJsonLd();

  return (
    <section
      id="wlad"
      data-testid="wlad-authority-section"
      aria-label="Wer ist Wlad Jachtchenko"
      className="border-y-2 border-black/[0.06] bg-[#0A0A0A] text-white relative overflow-hidden"
    >
      {/* Subtle lime ambient glow top-right */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(191,255,0,0.10) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
        {/* Top strip: eyebrow + name lockup */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start mb-14 md:mb-20">
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative inline-block">
              <img
                src={WLAD_AVATAR}
                onError={withFallback(WLAD_AVATAR_FALLBACKS)}
                alt="Wlad Jachtchenko · 3× SPIEGEL-Bestseller-Autor, Gründer LeaderOS und Argumentorik-Akademie"
                width="320"
                height="320"
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover object-top border-2 border-brand shadow-[0_0_0_4px_rgba(0,0,0,1),0_0_0_5px_rgba(191,255,0,0.4)]"
              />
              <div className="absolute -bottom-3 -right-3 bg-brand text-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
                ▸ GRÜNDER
              </div>
            </div>
          </div>

          <div className="md:col-span-8 lg:col-span-9">
            <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand">
              <span>▸ HINTER LEADER · OS</span>
              <span className="opacity-30">·</span>
              <span className="text-white/55">DER MENSCH · NICHT DAS LOGO</span>
            </div>

            <h2
              className="text-[44px] sm:text-[68px] md:text-[92px] leading-[0.9] tracking-[-0.045em]"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Wlad<br />
              <span className="text-white/55">Jachtchenko</span>
              <span className="text-brand not-italic">.</span>
            </h2>

            <p className="mt-7 max-w-2xl text-[17px] md:text-[19px] leading-[1.55] text-white/80">
              3× <strong className="text-white">SPIEGEL-Bestseller-Autor</strong>.
              Über <strong className="text-white">400 000 Klienten</strong> in
              Rhetorik, Verhandlung und KI ausgebildet. Gründer der
              <strong className="text-white"> Argumentorik-Akademie</strong>,
              Top-Speaker auf über 500 Bühnen, regelmäßiger Gast in ARD, ZDF,
              ntv, Welt und Wirtschaftswoche.
            </p>

            <p className="mt-5 max-w-2xl text-[15px] md:text-[16.5px] leading-[1.6] text-white/65">
              Alles was Wlad in über 10 Jahren in Coachings, Frameworks und
              Büchern entwickelt hat · und noch viel mehr · steckt heute in
              LeaderOS. Nicht als Kurs-Bibliothek, sondern als tägliches
              System.
            </p>
          </div>
        </div>

        {/* Credential-Grid: 3×2 auf Desktop, 1-col mobil */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {CREDENTIALS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.bib}
                data-testid={`wlad-credential-${c.bib}`}
                className="border-2 border-white/12 bg-white/[0.03] p-6 md:p-7 hover:border-brand/60 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand">
                    ▸ {c.bib}
                  </span>
                  <Icon size={22} strokeWidth={1.6} className="text-white/55" aria-hidden="true" />
                </div>
                <h3
                  className="text-[19px] md:text-[22px] leading-[1.15] tracking-[-0.02em] text-white"
                  style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900 }}
                >
                  {c.headline}
                </h3>
                <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.55] text-white/68">
                  {c.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer-Strip: Authority-Mentions als Quick-Trust */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">
          <span className="text-brand">▸ ALS AUTOR ZU GAST BEI</span>
          <span>ARD</span>
          <span className="opacity-30">·</span>
          <span>ZDF</span>
          <span className="opacity-30">·</span>
          <span>NTV</span>
          <span className="opacity-30">·</span>
          <span>WELT</span>
          <span className="opacity-30">·</span>
          <span>WIRTSCHAFTSWOCHE</span>
          <span className="opacity-30">·</span>
          <span>HANDELSBLATT</span>
          <span className="opacity-30">·</span>
          <span>FAZ</span>
        </div>
      </div>
    </section>
  );
};

import { Link } from 'react-router-dom';
import { Lock, ArrowUpRight } from 'lucide-react';
import { FREE_VIDEOS } from '../../data/freeVideos';

/**
 * FreeVideoTeaser · landing-page CTA block for the free 4-video funnel.
 *
 * The four videos double as four CTAs: each locked card links to /gratis
 * where the visitor opts in to unlock them + join the daily email series.
 * Top-of-funnel lead magnet, sits high on the landing.
 */
export const FreeVideoTeaser = () => (
  <section
    id="free-videos"
    aria-label="4 kostenlose Führungs-Videos"
    className="relative isolate overflow-hidden w-full bg-[#0A0A0A] text-white"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
        <div>
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
            ▸ Führung beginnt hier · 4 Videos · kostenlos
          </p>
          <h2
            className="text-[30px] sm:text-[44px] md:text-[58px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Führung beginnt hier<span className="text-brand not-italic">.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.6] text-white/65">
            4 kostenlose Videos von Wlad Jachtchenko · E-Mail eintragen, alle 4 sofort freischalten und
            danach jeden Tag eins ins Postfach.
          </p>
        </div>
        <Link
          to="/fuehrung-beginnt-hier"
          className="shrink-0 inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
        >
          Kostenlos freischalten <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {FREE_VIDEOS.map((v) => (
          <Link
            key={v.day}
            to="/fuehrung-beginnt-hier"
            className="group relative border-2 border-white/12 hover:border-brand/60 overflow-hidden bg-black transition-colors"
          >
            <span className="relative block aspect-video overflow-hidden">
              <img
                src={v.thumb}
                alt={v.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span aria-hidden className="absolute inset-0 bg-[#0A0A0A]/40 group-hover:bg-[#0A0A0A]/20 transition-colors" />
              <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 bg-[#0A0A0A]/75 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 group-hover:text-brand transition-colors">
                <Lock size={11} /> Freischalten
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default FreeVideoTeaser;

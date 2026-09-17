import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';

/**
 * WebinarTicketAd · boarding-pass-style promo card for the free live
 * webinar, meant to read as a self-contained "ad unit" that can be
 * dropped anywhere (landing page, journal sidebar, in-article) without
 * fighting the surrounding layout for attention.
 *
 * Desktop: horizontal ticket — stub (date/time) · content (title, host,
 * bullets) · QR + CTA, separated by a dashed perforation exactly like a
 * real boarding pass. Mobile: stacked card, QR mid, full-width CTA.
 *
 * The QR (frontend/public/qr/webinar.svg) encodes the real /webinar URL
 * with its own UTM tag (utm_source=qr) so scan-driven signups are
 * attributable separately from click-driven ones.
 */

const WEBINAR_URL = 'https://leader-os.de/webinar?utm_source=qr&utm_medium=onsite&utm_campaign=webinar-2026-10-15';

const BULLETS = [
  'Live: der Charisma-Code in Echtzeit demonstriert',
  'Das Leadership Operating System · WladBot, 11 Frameworks',
  'Offenes Q&A · bring deine härteste Führungsfrage mit',
];

const track = (placement) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture('webinar_ad_click', { placement, surface: 'leader-os' }); } catch {}
  }
};

export const WebinarTicketAd = ({ placement = 'unknown', className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    data-testid="webinar-ticket-ad"
    className={`relative bg-[#0A0A0A] border-2 border-foreground/15 overflow-hidden ${className}`}
  >
    <div className="absolute top-2 right-3 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/25">
      Anzeige
    </div>

    {/* ── Desktop · horizontal ticket ─────────────────────────────── */}
    <div className="hidden md:flex items-stretch">
      {/* Stub */}
      <div className="relative shrink-0 w-[200px] bg-gradient-to-br from-brand/25 via-brand/10 to-transparent px-6 py-7 flex flex-col justify-between">
        <div>
          <div className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white">
            Leader<span className="text-brand mx-0.5">·</span>OS
          </div>
          <div className="mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand mb-1.5">
            ▸ Live-Webinar
          </div>
          <div className="text-white text-[15px] font-bold leading-[1.3]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Do, 20. Aug 2026
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-white/50">10:00 Uhr · 90 Min</div>
        </div>
        <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">
          WBN-2026 · #001<br />Kostenlos
        </div>
        {/* Perforation notches */}
        <span aria-hidden className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background" />
      </div>

      {/* Perforated divider */}
      <div aria-hidden className="w-px border-l-2 border-dashed border-white/15 my-4" />

      {/* Content */}
      <div className="flex-1 min-w-0 px-7 py-7">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/40 mb-3">
          ▸ Live · Q&amp;A · Kostenlos
        </div>
        <h3
          className="text-white text-[24px] lg:text-[28px] leading-[1.05] tracking-[-0.02em]"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Führe besser. Jeden Tag<span className="text-brand not-italic">.</span>
        </h3>
        <p className="mt-2.5 text-[13px] leading-[1.5] text-white/55 max-w-md">
          Wie du mit dem Leadership Operating System jeden Tag besser führst — live gezeigt, mit offenem Q&amp;A.
        </p>
        <div className="mt-4 flex items-center gap-2.5">
          <img
            src={WLAD_AVATAR}
            onError={withFallback(WLAD_AVATAR_FALLBACKS)}
            alt="Wlad Jachtchenko"
            className="w-8 h-8 rounded-full object-cover object-top ring-1 ring-brand/50"
          />
          <div>
            <div className="text-white text-[12.5px] font-bold leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>Wlad Jachtchenko</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">3× SPIEGEL-Bestseller</div>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[11.5px] leading-[1.4] text-white/60">
              <span className="text-brand shrink-0 mt-0.5" aria-hidden>▸</span>{b}
            </li>
          ))}
        </ul>
      </div>

      {/* Perforated divider */}
      <div aria-hidden className="w-px border-l-2 border-dashed border-white/15 my-4" />

      {/* QR + CTA */}
      <div className="shrink-0 w-[190px] px-6 py-7 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-2.5">
          <img src="/qr/webinar.svg" alt="QR-Code zur Webinar-Anmeldung" width="96" height="96" className="w-24 h-24" />
        </div>
        <motion.a
          href={WEBINAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="webinar-ticket-cta"
          onClick={() => track(placement)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="mt-4 inline-flex items-center gap-1.5 h-11 px-5 bg-brand text-[#0A0A0A] font-black text-[11px] uppercase tracking-[0.1em] whitespace-nowrap"
        >
          Platz sichern <ArrowUpRight size={13} />
        </motion.a>
        <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">Scannen oder klicken</p>
      </div>
    </div>

    {/* ── Mobile · stacked card ────────────────────────────────────── */}
    <div className="md:hidden px-5 py-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white">
          Leader<span className="text-brand mx-0.5">·</span>OS
        </div>
        <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">WBN-2026 · #001</div>
      </div>
      <div className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand mb-2">
        ▸ Live-Webinar · Kostenlos
      </div>
      <h3
        className="text-white text-[26px] leading-[1.05] tracking-[-0.02em]"
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        Führe besser. Jeden Tag<span className="text-brand not-italic">.</span>
      </h3>
      <p className="mt-2 text-[13px] text-white/55">Do, 20. Aug 2026 · 10:00 Uhr · 90 Min · mit Wlad Jachtchenko</p>

      <div className="mt-5 flex items-center gap-4 border-t-2 border-dashed border-white/15 pt-5">
        <div className="bg-white p-2 shrink-0">
          <img src="/qr/webinar.svg" alt="QR-Code zur Webinar-Anmeldung" width="76" height="76" className="w-[76px] h-[76px]" />
        </div>
        <p className="text-[11px] leading-[1.5] text-white/50">Scanne den Code oder tippe den Button — Plätze sind begrenzt.</p>
      </div>

      <motion.a
        href={WEBINAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="webinar-ticket-cta-mobile"
        onClick={() => track(placement)}
        whileTap={{ scale: 0.97 }}
        className="mt-5 flex items-center justify-center gap-2 h-12 w-full bg-brand text-[#0A0A0A] font-black text-[12px] uppercase tracking-[0.12em]"
      >
        Platz sichern <ArrowUpRight size={14} />
      </motion.a>
    </div>
  </motion.div>
);

export default WebinarTicketAd;

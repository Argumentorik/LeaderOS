import { ArrowUpRight } from 'lucide-react';

/**
 * OfferProofSection · the "what you ACTUALLY get" proof for Leadership
 * Plus Pro. Sits directly under the PricingLadder: the tier card says the
 * price, this section makes the deliverables tangible — courses, access,
 * live formats, community, certificate — each in a machined-chrome frame
 * (the site's unlock/premium signal), plus an externally-verifiable trust
 * band so the claim never rests on our own words.
 *
 * Copy discipline: no personal-delivery promises ("mit Wlad") — the
 * product is the system: courses, WladBot, live formats, access.
 */

const DELIVERABLES = [
  ['K·01', 'KURSE', '11 Framework-Kurse', 'Alle elf Wlad-Frameworks als drillbare Kurse · Harvard-Verhandlung, BWW-Feedback, 5 Rollen, Dunkle-Rhetorik-Defensive u. a.'],
  ['K·02', 'KI-COACH', 'WladBot 24/7', 'Trainiert auf 13 Büchern und 15 Jahren Methodik · Text + Voice, Antwort in Sekunden, kennt deine Challenge-Historie.'],
  ['K·03', 'VIDEO', 'Lernvideo-Bibliothek', 'Tägliche Lernvideos plus die komplette Kurs-Bibliothek · strukturierte Pfade statt Playlist-Chaos.'],
  ['K·04', 'LIVE', 'Monatliche Live-Sessions', 'Geschlossene Live-Sessions im kleinen Kreis · echte Fälle, Q&A, ungeschnitten.'],
  ['K·05', 'DRILL', 'Drill-Channel', 'Theorie sofort am echten Fall: deine Situationen werden im Channel seziert und gedrillt.'],
  ['K·06', 'ZUGANG', '12 Monate Plattform', 'Voller Zugang zu allem · Simulationen, Playbooks, Video-Analyse, Workflows, Challenges.'],
  ['K·07', 'PEERS', 'LeaderOS Community', 'Führungskräfte auf demselben Weg · Austausch, Accountability, Challengers.'],
  ['K·08', 'PROOF', 'Zertifikat', 'Challenge-Abschluss mit persönlicher Startnummer · LinkedIn-ready.'],
];

// Externally verifiable only — every badge can be checked at the source.
const TRUST = [
  ['3×', 'SPIEGEL-Bestseller'],
  ['4,9/5', 'Trustpilot · 388 Reviews'],
  ['4,7/5', 'Greator · 995 Reviews'],
  ['3×', 'TEDx-Speaker'],
  ['400K+', 'Klienten weltweit'],
];

export const OfferProofSection = () => (
  <section
    id="offer-proof"
    aria-label="Leadership Plus Pro · was du bekommst"
    className="relative isolate overflow-hidden w-full bg-[#0A0A0A] text-white border-y-2 border-black"
  >
    {/* Scoped chrome recipes (mirrors the funnel's fv-chrome system) */}
    <style>{`
      .op-chrome-text{background:linear-gradient(180deg,#ffffff 0%,#d9d9d9 26%,#8f8f8f 47%,#f2f4f4 52%,#7f7f7f 68%,#e9e9e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .op-chrome-frame{position:relative;padding:2px;background:linear-gradient(135deg,#f0f0f0 0%,#7d7d7d 20%,#fafafa 38%,#5f5f5f 55%,#d9d9d9 72%,#8a8a8a 88%,#f0f0f0 100%);box-shadow:0 0 0 1px rgba(0,0,0,.65),0 22px 55px -24px rgba(191,255,0,.25);}
      .op-chrome-disc{border-radius:9999px;background:conic-gradient(from 210deg,#f4f4f4,#8d8d8d 18%,#e6e6e6 34%,#6c6c6c 52%,#f0f0f0 68%,#9b9b9b 84%,#f4f4f4);box-shadow:inset 0 1px 2px rgba(255,255,255,.9),inset 0 -2px 4px rgba(0,0,0,.45),0 4px 14px rgba(0,0,0,.5);}
    `}</style>

    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24">
      {/* Header */}
      <div className="max-w-3xl mb-12 md:mb-16">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
          ▸ Leadership Plus Pro · Was du wirklich bekommst
        </p>
        <h2
          className="text-[32px] sm:text-[46px] md:text-[60px] leading-[0.96] tracking-[-0.035em]"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Kein Kursvideo.<br />
          <span className="op-chrome-text">Ein komplettes System</span>
          <span className="text-brand not-italic">.</span>
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] leading-[1.6] text-white/65 max-w-2xl">
          Leadership Plus Pro ist das OS-Jahr: Kurse, KI-Coach, Live-Formate, Community
          und voller Plattform-Zugang — acht Bausteine, ein System. Hier ist jeder einzelne.
        </p>
      </div>

      {/* Deliverables · chrome-framed grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {DELIVERABLES.map(([code, tag, title, desc]) => (
          <div key={code} className="op-chrome-frame transition-transform duration-300 hover:-translate-y-1">
            <div className="relative h-full bg-[#0E0E0E] p-5 md:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span aria-hidden className="op-chrome-disc inline-flex h-9 w-9 items-center justify-center">
                  <span className="font-mono text-[9px] font-bold text-[#0A0A0A]">{code.slice(-2)}</span>
                </span>
                <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-brand">
                  ▸ {tag}
                </span>
              </div>
              <h3
                className="text-[18px] md:text-[19px] leading-[1.1] tracking-[-0.02em] text-white"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                {title}<span className="text-brand not-italic">.</span>
              </h3>
              <p className="mt-2 text-[12.5px] leading-[1.55] text-white/60 flex-1">{desc}</p>
              <span aria-hidden className="mt-4 block h-[2px] w-8 bg-brand/70" />
            </div>
          </div>
        ))}
      </div>

      {/* Trust band · externally verifiable badges */}
      <div className="mt-12 md:mt-16 border-2 border-white/12 bg-white/[0.02] px-5 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <p className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.26em] text-brand">
            ▸ Extern prüfbar
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4 flex-1">
            {TRUST.map(([big, cap]) => (
              <li key={cap} className="flex items-baseline gap-2">
                <span
                  className="op-chrome-text text-[20px] md:text-[24px] leading-none tabular-nums"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {big}
                </span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">
                  {cap}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA row */}
      <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <a
          href="https://leaderos.de/checkout?tier=plusplus"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors"
          data-testid="offer-proof-cta"
        >
          Leadership Plus Pro starten <ArrowUpRight size={16} />
        </a>
        <a
          href="https://leaderos.de/signup?trial=14"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/60 hover:text-brand transition-colors py-3 -my-3"
        >
          Oder erst 14 Tage kostenlos testen <ArrowUpRight size={13} />
        </a>
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        4 797 € einmalig · oder 3 × 1 599 € · kein Abo, keine automatische Verlängerung
      </p>
    </div>
  </section>
);

export default OfferProofSection;

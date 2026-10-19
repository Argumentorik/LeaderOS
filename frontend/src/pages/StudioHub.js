import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * StudioHub · Single-Page-Übersicht für alle Design-Surfaces.
 *
 * Erreichbar unter /studio. Listet:
 *   - /specimens · IG/LinkedIn Editorial-Posts
 *   - /ads       · Paid-Creatives Netflix-Bites-DNA
 *   - /system    · Live-Provider-Health
 *
 * Pro Surface: Worum-geht-es, welche Data-Datei, wie wird editiert,
 * direkter Link. Damit ist klar: "von hier" heißt von dieser Seite,
 * von Claude Code, von einem Git-Push · die einzige Wahrheit.
 */

const SURFACES = [
  {
    code: '01',
    title: 'Specimen-Studio',
    path: '/specimens',
    eyebrow: 'INSTAGRAM · LINKEDIN',
    body:
      'Editorial-Posts im Athletic-Specimen-Stil · 1080×1080 für ' +
      'Feed, 1080×1350 für vertikal. Outfit-Black-Italic-Headlines, ' +
      'Lime-Punkt, BIB-Code-Header. Caption-Body daneben mit Copy-Button.',
    file: 'frontend/src/data/contentSpecimens.js',
    count: '12 Posts',
    bib: 'BIB · CONTENT',
  },
  {
    code: '02',
    title: 'Ad-Studio',
    path: '/ads',
    eyebrow: 'META · STORIES · LINKEDIN',
    body:
      'Paid-Creatives in Netflix-Bites-DNA · voller Farbblock, ' +
      'full-bleed Portrait, Tracked-Uppercase-Headline. Drei Formate ' +
      '(1:1, 4:5, 9:16), sechs Brand-Paletten, Native-Size-Modal ' +
      'für Screenshots.',
    file: 'frontend/src/data/contentAds.js',
    count: '15 Ads',
    bib: 'BIB · PAID',
  },
  {
    code: '03',
    title: 'System-Health',
    path: '/system',
    eyebrow: 'BACKEND · PROVIDER-STATUS',
    body:
      'Live-Diagnostik: LLM, STT, Stripe, Storage, Supabase, Sentry. ' +
      'Zeigt pro Subsystem ob nativer Provider läuft (GO), Legacy-' +
      'Fallback (DEGRADED) oder keine Config (DOWN). Liest ' +
      '/api/monitoring/system, kein Auth nötig.',
    file: 'backend/lib/system_health.py',
    count: '6 Subsysteme',
    bib: 'BIB · OPS',
  },
];

const SurfaceCard = ({ s }) => (
  <Link
    to={s.path}
    className="group block border border-foreground/15 hover:border-foreground/45 transition-colors p-6 md:p-8 bg-background"
    data-testid={`studio-card-${s.code}`}
  >
    <div className="flex items-center justify-between mb-6 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono">
      <span>§ {s.code} · {s.eyebrow}</span>
      <span className="text-brand">{s.bib}</span>
    </div>

    <h2
      className="text-[36px] sm:text-[48px] md:text-[60px] leading-[0.95] tracking-[-0.035em] text-foreground"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
    >
      {s.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
    </h2>

    <p className="mt-6 max-w-xl text-[14px] md:text-[15px] leading-[1.55] text-foreground/70">
      {s.body}
    </p>

    <div className="mt-8 pt-5 border-t border-foreground/10 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-[0.16em] font-mono">
      <div>
        <span className="text-foreground/45 block mb-1">▸ DATEN</span>
        <code className="text-foreground/85 text-[10.5px] normal-case font-normal break-all">{s.file}</code>
      </div>
      <div className="text-right">
        <span className="text-foreground/45 block mb-1">▸ BESTAND</span>
        <span className="text-foreground">{s.count}</span>
      </div>
    </div>

    <div className="mt-6 inline-flex items-center gap-3 text-[11.5px] font-bold uppercase tracking-[0.18em] text-foreground/70 group-hover:text-foreground transition-colors">
      <span className="w-6 h-6 rounded-full bg-brand text-black inline-flex items-center justify-center text-sm font-black">+</span>
      Surface öffnen
    </div>
  </Link>
);

export default function StudioHub() {
  useEffect(() => {
    document.title = 'Studio · LeaderOS';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-foreground/10">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand text-black font-black"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              W
            </span>
            <div>
              <div
                className="text-[18px] font-black tracking-tight text-foreground"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}
              >
                Leader<span className="text-brand mx-0.5">·</span>OS
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45 font-mono leading-none mt-0.5">
                Studio · Design + Ops
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/55 hover:text-foreground font-mono transition-colors"
          >
            ← Landing
          </Link>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
          ▸ STUDIO · ALLE OBERFLÄCHEN VON HIER
        </p>
        <h1
          className="text-[56px] sm:text-[80px] md:text-[112px] leading-[0.9] tracking-[-0.04em] text-foreground max-w-4xl"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Eine Wahrheit<span className="text-brand not-italic">.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-[15px] md:text-[17px] leading-[1.6] text-foreground/70">
          Drei Studios. Drei Daten-Files. Ein Workflow: editiere die
          Datei, push, Vercel rebuilded in 90 Sek, du screenshotst und
          postest. Kein Figma-Hop, kein Hand-Off, kein Asset-Versand ·
          das Design lebt im Code.
        </p>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {SURFACES.map((s) => (
            <SurfaceCard key={s.code} s={s} />
          ))}
        </div>

        {/* Workflow */}
        <section className="mt-24 pt-12 border-t border-foreground/10">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
            ▸ WORKFLOW
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              ['01', 'EDIT', 'Frag Claude Code · oder edit das Daten-File direkt.'],
              ['02', 'PUSH', 'Commit + push auf den Production-Branch.'],
              ['03', 'BUILD', 'Vercel rebuilded in ~90 Sek, beide Domains ziehen mit.'],
              ['04', 'SHIP', 'Studio öffnen, Tile screenshoten, Caption kopieren, posten.'],
            ].map(([nr, label, body]) => (
              <li key={nr} className="border-t-2 border-foreground pt-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">§{nr}</div>
                <div
                  className="mt-1 text-[26px] leading-[1.05] tracking-[-0.02em]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                >
                  {label}<span className="text-brand">.</span>
                </div>
                <p className="mt-2 text-[13px] leading-[1.5] text-foreground/65">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * SystemHealth · Live-Provider-Status-Dashboard für /system.
 *
 * Liest /api/monitoring/system und rendert jeden Subsystem-Status als
 * Specimen-Card im editorial-DNA: Mono-Eyebrow, BIB-Code, Lime-Punkt,
 * Status-Pill in einer von drei Farben:
 *   GO       lime · native Provider läuft
 *   DEGRADED amber · Legacy-Pfad oder Fallback aktiv
 *   DOWN     rot · keine Konfiguration, Aufrufe failen
 *
 * Public, kein Auth-Gate · die Daten enthalten keine Keys, nur
 * Provider-Namen und einen Hinweistext.
 */

const STATUS_STYLE = {
  go:       { dot: 'bg-brand',         label: 'GO',       text: 'text-brand' },
  degraded: { dot: 'bg-amber-400',     label: 'DEGRADED', text: 'text-amber-400' },
  down:     { dot: 'bg-red-500',       label: 'DOWN',     text: 'text-red-400' },
};

const SUBSYSTEM_META = {
  llm:      { title: 'LLM · Chat',         eyebrow: 'WLADBOT · KERN' },
  stt:      { title: 'Speech-to-Text',     eyebrow: 'VOICE-MODE' },
  stripe:   { title: 'Stripe · Checkout',  eyebrow: 'PAYMENTS' },
  storage:  { title: 'Object Storage',     eyebrow: 'UPLOADS · AVATARE' },
  supabase: { title: 'Supabase · DB',      eyebrow: 'RAG + AUTH-MIRROR' },
  sentry:   { title: 'Sentry · Errors',    eyebrow: 'OBSERVABILITY' },
};

const SubsystemCard = ({ id, data }) => {
  const meta = SUBSYSTEM_META[id] || { title: id, eyebrow: id.toUpperCase() };
  const sty = STATUS_STYLE[data.status] || STATUS_STYLE.down;
  return (
    <div className="bg-white border border-black/10 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
        <span>
          ▸ {meta.eyebrow}
          {data.optional && <span className="ml-2 text-black/35">· OPTIONAL</span>}
        </span>
        <span className={`inline-flex items-center gap-2 ${sty.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
          {sty.label}
        </span>
      </div>

      <h3
        className="text-[24px] leading-[1.05] tracking-[-0.02em] text-black"
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
      >
        {meta.title.replace(/\.$/, '')}<span className="text-brand">.</span>
      </h3>

      <dl className="space-y-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-black/60 border-t border-black/10 pt-3">
        {data.provider && (
          <div className="flex justify-between"><dt>PROVIDER</dt><dd className="text-black">{data.provider}</dd></div>
        )}
        {data.backend && (
          <div className="flex justify-between"><dt>BACKEND</dt><dd className="text-black">{data.backend}</dd></div>
        )}
        {data.mode && (
          <div className="flex justify-between"><dt>MODE</dt><dd className="text-black">{data.mode}</dd></div>
        )}
        {data.model && (
          <div className="flex justify-between"><dt>MODEL</dt><dd className="text-black">{data.model}</dd></div>
        )}
        {data.bucket && (
          <div className="flex justify-between"><dt>BUCKET</dt><dd className="text-black">{data.bucket}</dd></div>
        )}
        {data.key_prefix && (
          <div className="flex justify-between"><dt>KEY</dt><dd className="text-black">{data.key_prefix}</dd></div>
        )}
      </dl>

      {data.note && (
        <p className="text-[12.5px] leading-[1.5] text-black/65">{data.note}</p>
      )}
    </div>
  );
};

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const reload = () => {
    setError(null);
    api.get('/monitoring/system')
      .then((res) => { setData(res.data); setLoadedAt(new Date()); })
      .catch((err) => setError(err?.message || 'Failed to load'));
  };

  useEffect(() => {
    document.title = 'System · LeaderOS Health';
    reload();
  }, []);

  const overall = data?.overall;
  const overallSty = overall ? STATUS_STYLE[overall] : null;

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-black">
      <header className="sticky top-0 z-20 bg-[#F5F5F2]/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black text-brand font-black"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              W
            </span>
            <div>
              <div
                className="text-[18px] font-black tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}
              >
                System<span className="text-brand mx-0.5">·</span>Health
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50 font-mono">
                Live-Provider-Status
              </div>
            </div>
          </div>
          <button
            onClick={reload}
            className="px-3 py-1.5 border border-black/20 text-[10.5px] font-bold uppercase tracking-[0.18em] hover:border-black/60 transition-colors font-mono"
          >
            ↻ Reload
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-12">
        {/* Overall */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-black/55 mb-3 font-mono">
              ▸ GESAMTSTATUS
              {loadedAt && (
                <span className="text-black/30 ml-3">
                  · {loadedAt.toLocaleTimeString('de-DE')}
                </span>
              )}
            </p>
            <h1
              className="text-[64px] md:text-[96px] leading-[0.9] tracking-[-0.04em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              {overall ? (
                <>
                  <span className={overallSty.text}>{overallSty.label}</span>
                  <span className="text-black">.</span>
                </>
              ) : error ? (
                <span className="text-red-500">ERROR.</span>
              ) : (
                <span className="text-black/30">…</span>
              )}
            </h1>
            {data?.counts && (
              <p className="mt-3 text-[12px] font-mono uppercase tracking-[0.18em] text-black/55">
                ▸ {data.counts.go} GO · {data.counts.degraded} DEGRADED · {data.counts.down} DOWN
              </p>
            )}
            {error && (
              <p className="mt-3 text-[13px] text-red-500">{error}</p>
            )}
          </div>
        </div>

        {/* Subsystems */}
        {data?.subsystems && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.subsystems).map(([id, sub]) => (
              <SubsystemCard key={id} id={id} data={sub} />
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-16 pt-8 border-t border-black/10 text-[13px] leading-[1.6] text-black/65 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 mb-3 font-mono">
            ▸ WAS DIE STATUS BEDEUTEN
          </p>
          <p><span className="text-brand font-bold">GO</span> · Nativer Provider konfiguriert, läuft auf eigenem Konto.</p>
          <p><span className="text-amber-500 font-bold">DEGRADED</span> · Läuft, aber auf Legacy-Pfad (z.B. Emergent-Wrapper). Funktional ok, Migration nicht abgeschlossen.</p>
          <p><span className="text-red-500 font-bold">DOWN</span> · Keine Konfiguration verfügbar. Endpoint würde 500en oder Voice-Mode bleibt deaktiviert.</p>

          <p className="mt-6 text-black/50">
            ENV-Vars werden in Vercel · Project Settings · Environment
            Variables gesetzt. Nach jedem Add/Edit muss der Backend-Container
            neu gerollt werden (Redeploy oder Vercel-Lambdas refreshen
            automatisch nach ~60 Sek).
          </p>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AdSpecimen } from '../components/ads/AdSpecimen';
import { AD_SERIES, AD_PALETTES, AD_CAMPAIGNS, AD_PLATFORMS, AD_VARIANTS } from '../data/contentAds';
import { GOOGLE_CAMPAIGNS, GOOGLE_EXTENSIONS, GOOGLE_LIMITS, googleAssetProblems } from '../data/googleAdsAssets';

/**
 * AdStudio · internal Paid-Ad-Studio bei /ads.
 *
 * Schwester-Seite zum Specimen-Studio: gleiches Workflow-Pattern
 * (Grid → Native-Size-Modal → Screenshot → Copy-Caption), aber für
 * die laute Netflix-Bites-DNA statt der editorial-stillen Specimens.
 *
 * Beweis-of-Concept dass das Design lebendig aus dem Codebase
 * gemanaged wird: Edit `frontend/src/data/contentAds.js` →
 * `git push` → Vercel rebuild → live unter /ads in ~90 Sek.
 * Kein Figma-Hop, kein Asset-Übergabe, eine Wahrheit.
 */

/** Zeichenzahl gegen ein Google-Limit · rot, sobald es reißt. */
const Count = ({ value, limit }) => (
  <span className={`ml-2 font-mono text-[10px] ${value.length > limit ? 'text-red-600 font-bold' : 'text-black/35'}`}>
    {value.length}/{limit}
  </span>
);

const AssetList = ({ label, items, limit }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-black/50">▸ {label} · {items.length}</span>
      <button
        onClick={() => navigator.clipboard?.writeText(items.join('\n'))}
        className="font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-black/55 hover:text-black"
      >
        Alle kopieren
      </button>
    </div>
    <ol className="space-y-1">
      {items.map((t) => (
        <li key={t} className="flex items-baseline justify-between gap-3 text-[13px] leading-[1.45] text-black/85 border-b border-black/[0.06] pb-1">
          <span>{t}</span><Count value={t} limit={limit} />
        </li>
      ))}
    </ol>
  </div>
);

/** Google Text-Assets · RSA, Demand Gen, Erweiterungen — mit Limits. */
const GoogleAssets = () => {
  const problems = googleAssetProblems();
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-12" data-testid="google-assets">
      <h1
        className="text-[44px] md:text-[64px] leading-[0.9] tracking-[-0.04em] mb-3"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        Google<span className="text-brand">.</span>
      </h1>
      <p className="text-[14px] font-mono uppercase tracking-[0.18em] text-black/55 mb-3">
        ▸ {GOOGLE_CAMPAIGNS.length} KAMPAGNEN · HEADLINES ≤ {GOOGLE_LIMITS.headline} · BESCHREIBUNGEN ≤ {GOOGLE_LIMITS.description} · KOPIEREN · IN GOOGLE ADS EINFÜGEN
      </p>
      <p className={`text-[13px] leading-[1.55] mb-10 max-w-2xl ${problems.length ? 'text-red-700' : 'text-black/65'}`}>
        {problems.length
          ? `${problems.length} Asset(s) über dem Limit: ${problems.join(' · ')}`
          : 'Alle Assets innerhalb der Google-Limits. Daten in frontend/src/data/googleAdsAssets.js — ändern, pushen, hier prüfen.'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {GOOGLE_CAMPAIGNS.map((c) => (
          <article key={c.id} className="bg-white border border-black/10 p-6 flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
                <span>{c.id}</span><span>{c.type}</span>
              </div>
              <p className="mt-2 text-[15px] font-bold text-black" style={{ fontFamily: 'Outfit, sans-serif' }}>{c.goal}</p>
              <p className="mt-1 text-[12.5px] leading-[1.5] text-black/65">{c.note}</p>
              <p className="mt-2 font-mono text-[10.5px] break-all text-black/60">
                {c.finalUrl}{c.paths ? ` · /${c.paths.join('/')}` : ''}
              </p>
            </div>
            {c.keywords && <AssetList label="Keywords (Phrase)" items={c.keywords} limit={80} />}
            {c.negatives && <AssetList label="Ausschluss" items={c.negatives} limit={80} />}
            {c.headlines && <AssetList label="Headlines" items={c.headlines} limit={GOOGLE_LIMITS.headline} />}
            {c.longHeadline && <AssetList label="Long Headline" items={[c.longHeadline]} limit={GOOGLE_LIMITS.longHeadline} />}
            {c.descriptions && <AssetList label="Beschreibungen" items={c.descriptions} limit={GOOGLE_LIMITS.description} />}
            {c.businessName && <AssetList label="Unternehmensname" items={[c.businessName]} limit={GOOGLE_LIMITS.businessName} />}
            {c.images && <AssetList label="Bild-Assets (Studio · Plattform google)" items={c.images} limit={80} />}
          </article>
        ))}

        <article className="bg-white border border-black/10 p-6 flex flex-col gap-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">ERWEITERUNGEN · KONTO-EBENE</div>
          <AssetList label="Sitelinks" items={GOOGLE_EXTENSIONS.sitelinks.map((s) => `${s.text} — ${s.desc1} / ${s.desc2} → ${s.url}`)} limit={200} />
          <AssetList label="Callouts" items={GOOGLE_EXTENSIONS.callouts} limit={GOOGLE_LIMITS.callout} />
          <AssetList label={`Snippets · ${GOOGLE_EXTENSIONS.snippets.header}`} items={GOOGLE_EXTENSIONS.snippets.values} limit={GOOGLE_LIMITS.snippet} />
        </article>
      </div>
    </main>
  );
};

export default function AdStudio() {
  const [format, setFormat] = useState('all');
  const [palette, setPalette] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [variant, setVariant] = useState('all');
  const [mode, setMode] = useState('bild');   // 'bild' | 'google'
  const [nativeId, setNativeId] = useState(null);

  useEffect(() => {
    document.title = 'Ad-Studio · LeaderOS Paid Creatives';
  }, []);

  const ads = AD_SERIES.filter((a) => {
    if (format !== 'all' && a.format !== format) return false;
    if (palette !== 'all' && a.palette !== palette) return false;
    if (campaign !== 'all' && (a.campaign || 'evergreen') !== campaign) return false;
    if (platform !== 'all' && a.platform !== platform) return false;
    if (variant !== 'all' && (a.variant || 'a') !== variant) return false;
    return true;
  });

  const chip = (active) =>
    `px-2.5 py-1.5 border transition-colors ${active ? 'bg-black text-white border-black' : 'border-black/20 text-black/60 hover:border-black/60 hover:text-black'}`;

  const nativeAd = nativeId ? AD_SERIES.find((a) => a.id === nativeId) : null;

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-black">
      {/* ── Top-Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#F5F5F2]/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
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
                Ad<span className="text-brand mx-0.5">·</span>Studio
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50 font-mono">
                Meta · Stories · Reels · TikTok
              </div>
            </div>
          </div>

          {/* Modus · Bild-Creatives oder Google Text-Assets */}
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] font-mono">
            <button onClick={() => setMode('bild')} className={chip(mode === 'bild')} data-testid="studio-mode-bild">Bild-Creatives</button>
            <button onClick={() => setMode('google')} className={chip(mode === 'google')} data-testid="studio-mode-google">Google Text-Assets</button>
          </div>

          {/* Filters */}
          {mode === 'bild' && (
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] font-mono">
            <span className="text-black/45 mr-1">▸ PLATTFORM</span>
            {['all', ...AD_PLATFORMS].map((k) => (
              <button key={k} onClick={() => setPlatform(k)} className={chip(platform === k)}>{k}</button>
            ))}
            <span className="text-black/45 mr-1 ml-2">▸ FORMAT</span>
            {['all', '1x1', '4x5', '9x16', '1.91x1'].map((k) => (
              <button
                key={k}
                onClick={() => setFormat(k)}
                className={`px-2.5 py-1.5 border transition-colors ${
                  format === k
                    ? 'bg-black text-white border-black'
                    : 'border-black/20 text-black/60 hover:border-black/60 hover:text-black'
                }`}
              >
                {k}
              </button>
            ))}
            <span className="text-black/45 mr-1 ml-2">▸ KAMPAGNE</span>
            {['all', ...AD_CAMPAIGNS].map((k) => (
              <button
                key={k}
                onClick={() => setCampaign(k)}
                className={`px-2.5 py-1.5 border transition-colors ${
                  campaign === k
                    ? 'bg-black text-white border-black'
                    : 'border-black/20 text-black/60 hover:border-black/60 hover:text-black'
                }`}
              >
                {k}
              </button>
            ))}
            <span className="text-black/45 mr-1 ml-2">▸ VARIANTE</span>
            {['all', ...AD_VARIANTS].map((k) => (
              <button key={k} onClick={() => setVariant(k)} className={chip(variant === k)}>{k}</button>
            ))}
            <span className="text-black/45 mr-1 ml-2">▸ PALETTE</span>
            {['all', ...Object.keys(AD_PALETTES)].map((k) => (
              <button
                key={k}
                onClick={() => setPalette(k)}
                className={`px-2.5 py-1.5 border transition-colors ${
                  palette === k
                    ? 'bg-black text-white border-black'
                    : 'border-black/20 text-black/60 hover:border-black/60 hover:text-black'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          )}
        </div>
      </header>

      {mode === 'google' && <GoogleAssets />}

      {mode === 'bild' && (

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <h1
          className="text-[44px] md:text-[64px] leading-[0.9] tracking-[-0.04em] mb-3"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          {ads.length} Ads.<span className="text-brand">.</span>
        </h1>
        <p className="text-[14px] font-mono uppercase tracking-[0.18em] text-black/55 mb-3">
          ▸ NATIVE GROSSE · TILE KLICKEN · SCREENSHOT · IN META / LINKEDIN ADS HOCHLADEN
        </p>
        <p className="text-[13px] leading-[1.55] text-black/65 mb-12 max-w-2xl">
          Daten leben in <code className="px-1 py-0.5 bg-black/[0.06]">frontend/src/data/contentAds.js</code>.
          Eine Änderung dort, ein <code className="px-1 py-0.5 bg-black/[0.06]">git push</code>,
          ein Vercel-Rebuild · alle Ads ziehen mit. Kein Figma-Hop, kein
          Asset-Versandt. Das Design wird vom Code gemanaged.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {ads.map((ad) => (
            <article
              key={ad.id}
              className="bg-white border border-black/10 p-5 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
                <span>
                  {ad.id} · {ad.format} · {ad.palette}
                </span>
                <button
                  onClick={() => setNativeId(ad.id)}
                  className="px-2.5 py-1 bg-black text-white hover:bg-black/80 transition-colors"
                >
                  Native ↗
                </button>
              </div>

              <div className="flex justify-center bg-[#F5F5F2] py-6 border border-black/[0.06]">
                <AdSpecimen ad={ad} scale={ad.format === '9x16' ? 0.22 : ad.format === '1.91x1' ? 0.29 : 0.32} />
              </div>

              <details className="border-t border-black/10 pt-3 group">
                <summary className="cursor-pointer text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/60 font-mono select-none">
                  ▸ AD-COPY · {ad.slug}
                </summary>
                <pre className="mt-3 text-[12.5px] leading-[1.55] whitespace-pre-wrap font-sans text-black/80 bg-[#FAFAF7] p-3 border border-black/[0.06]">
                  {ad.caption}
                </pre>
                {/* Meta-Felder · Headline ≤ 40, Beschreibung ≤ 30 Zeichen, URL mit UTM */}
                {(ad.headline || ad.url) && (
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px] leading-[1.5] text-black/75">
                    {ad.platform === 'linkedin' ? (
                      <>
                        {ad.liIntro && <><dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/45 pt-0.5">LI-Intro</dt><dd>{ad.liIntro} <span className="text-black/35">({ad.liIntro.length}/150)</span></dd></>}
                        {ad.liHeadline && <><dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/45 pt-0.5">LI-Headline</dt><dd>{ad.liHeadline} <span className="text-black/35">({ad.liHeadline.length}/70)</span></dd></>}
                      </>
                    ) : (
                      <>
                        {ad.headline && <><dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/45 pt-0.5">Headline</dt><dd>{ad.headline} <span className="text-black/35">({ad.headline.length}/40)</span></dd></>}
                        {ad.description && <><dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/45 pt-0.5">Beschr.</dt><dd>{ad.description} <span className="text-black/35">({ad.description.length}/30)</span></dd></>}
                      </>
                    )}
                    {ad.url && <><dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/45 pt-0.5">URL</dt><dd className="break-all font-mono text-[10.5px]">{ad.url}</dd></>}
                  </dl>
                )}
                <div className="mt-2 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigator.clipboard?.writeText(ad.caption)}
                    className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 hover:text-black font-mono"
                  >
                    ▸ Primärtext kopieren
                  </button>
                  {ad.url && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(ad.url)}
                      className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 hover:text-black font-mono"
                    >
                      ▸ URL kopieren
                    </button>
                  )}
                </div>
              </details>
            </article>
          ))}
        </div>
      </main>
      )}

      {/* ── Native-Size-Modal ──────────────────────────────────── */}
      {nativeAd && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-auto"
          onClick={() => setNativeId(null)}
        >
          <div className="min-h-full flex flex-col items-center justify-center py-12 px-6 gap-6">
            <div
              className="text-white text-[11px] font-bold uppercase tracking-[0.22em] font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              ▸ NATIVE 1080-PIXEL · SCREENSHOT DIESES TILES · KLICK AUSSEN ZUM SCHLIESSEN
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <AdSpecimen ad={nativeAd} scale={1} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

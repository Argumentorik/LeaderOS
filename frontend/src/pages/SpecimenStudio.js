import { useEffect, useState } from 'react';
import { PostSpecimen } from '../components/specimens/PostSpecimen';
import { POST_SERIES } from '../data/contentSpecimens';

/**
 * SpecimenStudio · internal content studio at /specimens.
 *
 * Shows every Instagram + LinkedIn post-specimen tile in the same
 * editorial DNA as the landing page, ready to screenshot at native
 * 1080×1080 (Instagram) or 1080×1350 (LinkedIn) size.
 *
 * Workflow: scroll → pick a tile → click "Native size" → screenshot
 * the tile that opens at full resolution. Drop into Buffer / Later /
 * Meta Composer.
 *
 * Caption-Body sits next to each tile so the copywriter can copy it
 * straight to clipboard. No CMS, no API · the data lives in
 * `contentSpecimens.js` and gets edited by hand for now.
 *
 * Not protected. URL is unguessable enough for a draft tool; if it
 * needs auth, wrap the route in <ProtectedRoute> in App.js.
 */
export default function SpecimenStudio() {
  const [filter, setFilter] = useState('all');
  const [nativeId, setNativeId] = useState(null);

  useEffect(() => {
    document.title = 'Specimen-Studio · LeaderOS Content';
  }, []);

  const posts = POST_SERIES.filter((p) =>
    filter === 'all' ? true : p.platform === filter
  );

  const nativePost = nativeId
    ? POST_SERIES.find((p) => p.id === nativeId)
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-black">
      {/* Studio Top-Bar */}
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
                Specimen<span className="text-brand mx-0.5">·</span>Studio
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50 font-mono">
                Instagram + LinkedIn · BIB · 0001
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] font-mono">
            {['all', 'instagram', 'linkedin'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 border transition-colors ${
                  filter === k
                    ? 'bg-black text-white border-black'
                    : 'border-black/20 text-black/60 hover:border-black/60 hover:text-black'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <h1
          className="text-[44px] md:text-[64px] leading-[0.9] tracking-[-0.04em] mb-3"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          {posts.length} Specimens.<span className="text-brand">.</span>
        </h1>
        <p className="text-[14px] font-mono uppercase tracking-[0.18em] text-black/55 mb-10">
          ▸ KLICK AUF EINE KACHEL → NATIVE 1080-AUFLÖSUNG → SCREENSHOT
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-black/10 p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
                <span>
                  ID · {post.id} &nbsp;·&nbsp; {post.platform.toUpperCase()} &nbsp;·&nbsp;{' '}
                  {post.format === 'square' ? '1080 × 1080' : '1080 × 1350'}
                </span>
                <button
                  onClick={() => setNativeId(post.id)}
                  className="px-3 py-1.5 bg-black text-white hover:bg-black/80 transition-colors"
                >
                  Native size ↗
                </button>
              </div>

              <div className="flex justify-center bg-[#F5F5F2] py-6 border border-black/[0.06]">
                <PostSpecimen post={post} scale={0.42} />
              </div>

              <details className="border-t border-black/10 pt-4 group">
                <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.22em] text-black/60 font-mono select-none">
                  ▸ Caption / Body · klick zum öffnen
                </summary>
                <pre className="mt-4 text-[13px] leading-[1.55] whitespace-pre-wrap font-sans text-black/85 bg-[#FAFAF7] p-4 border border-black/[0.06]">
                  {post.caption}
                </pre>
                <button
                  onClick={() => navigator.clipboard?.writeText(post.caption)}
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black/60 hover:text-black font-mono"
                >
                  ▸ In Zwischenablage kopieren
                </button>
              </details>
            </article>
          ))}
        </div>
      </main>

      {/* Native-Size Overlay · for clean screenshots */}
      {nativePost && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-auto"
          onClick={() => setNativeId(null)}
        >
          <div className="min-h-full flex flex-col items-center justify-center py-12 px-6 gap-6">
            <div
              className="text-white text-[11px] font-bold uppercase tracking-[0.22em] font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              ▸ NATIVE {nativePost.format === 'square' ? '1080 × 1080' : '1080 × 1350'} ·
              Screenshot dieses Tiles · Klick außerhalb zum Schließen
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <PostSpecimen post={nativePost} scale={1} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

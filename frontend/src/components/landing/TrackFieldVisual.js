/**
 * TrackFieldVisual · Animierte SVG-Szene "Wer Wlads System hat, führt vorneweg."
 *
 * Layout (oben → unten):
 *   1. Tribüne mit pixeligem Publikum (animiertes Twinkle)
 *   2. Stadion-Banner "LEADER · OS · STADIUM"
 *   3. 5 Bahnen mit Distanz-Markern (100M → 0M)
 *      4 Anzug-Träger noch am Anfang, leicht wankend (CSS shuffle)
 *      1 T-Shirt-Läufer durchbricht das Ziel-Band (Stride-Animation)
 *      → trägt WladMark-Emblem auf der Brust, das pulsiert/dreht
 *   4. Ziel-Band mit aufgedrucktem "LEADER · OS" Wordmark, zerrissen
 *      genau dort, wo die T-Shirt-Brust durchstößt
 *   5. Footer-Strips mit BIB-Codes
 *
 * Alle Animationen via inline CSS-Keyframes in <style>. respect für
 * prefers-reduced-motion eingebaut. Pure SVG · keine externen Assets.
 */

export const TrackFieldVisual = ({ className = '' }) => (
  <svg
    viewBox="0 0 900 360"
    aria-label="Wer Wlads System hat, durchbricht das Ziel-Band"
    className={`w-full h-auto ${className}`}
    role="img"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <style>{`
        @keyframes track-stride-a {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-1.5px); }
        }
        @keyframes track-stride-b {
          0%, 100% { transform: translateY(-1px); }
          50%      { transform: translateY(0.5px); }
        }
        @keyframes track-shuffle {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(0.4px, -0.6px); }
          75%      { transform: translate(-0.4px, 0); }
        }
        @keyframes track-aura {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%      { transform: scale(1.12); opacity: 0.78; }
        }
        @keyframes track-aura-outer {
          0%, 100% { transform: scale(1); opacity: 0.32; }
          50%      { transform: scale(1.18); opacity: 0.55; }
        }
        @keyframes track-speed {
          0%   { opacity: 1; transform: translateX(0); }
          70%  { opacity: 0.15; transform: translateX(-8px); }
          100% { opacity: 0; transform: translateX(-12px); }
        }
        @keyframes track-wmark {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          50%      { transform: rotate(6deg) scale(1.06); }
        }
        @keyframes track-tape-flutter {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-1px); }
        }
        @keyframes track-crowd {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.85; }
        }
        @keyframes track-pill-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1.2px); }
        }

        .track-stride-a { animation: track-stride-a 520ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-stride-b { animation: track-stride-b 520ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-shuffle  { animation: track-shuffle 1800ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-aura-i   { animation: track-aura 1700ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-aura-o   { animation: track-aura-outer 1700ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-speed-1  { animation: track-speed 800ms ease-out infinite; }
        .track-speed-2  { animation: track-speed 800ms ease-out 160ms infinite; }
        .track-speed-3  { animation: track-speed 800ms ease-out 320ms infinite; }
        .track-wmark    { animation: track-wmark 2400ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-tape     { animation: track-tape-flutter 2200ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-pill     { animation: track-pill-bob 2400ms ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .track-crowd-a  { animation: track-crowd 1900ms ease-in-out infinite; }
        .track-crowd-b  { animation: track-crowd 1900ms ease-in-out 480ms infinite; }
        .track-crowd-c  { animation: track-crowd 1900ms ease-in-out 960ms infinite; }

        @media (prefers-reduced-motion: reduce) {
          .track-stride-a, .track-stride-b, .track-shuffle, .track-aura-i, .track-aura-o,
          .track-speed-1, .track-speed-2, .track-speed-3, .track-wmark, .track-tape,
          .track-pill, .track-crowd-a, .track-crowd-b, .track-crowd-c {
            animation: none;
          }
        }
      `}</style>
    </defs>

    {/* Bahn-Hintergrund · kalter Beton-Asphalt */}
    <rect width="900" height="360" fill="#F5F5F2" />

    {/* ── TRIBÜNE oben · pixelige Publikums-Dots ── */}
    <g aria-hidden="true">
      <rect x="40" y="38" width="820" height="14" fill="#E8E6DE" />
      {Array.from({ length: 90 }).map((_, i) => {
        const x = 46 + i * 9;
        const y = 41 + (i % 3) * 3;
        const cls = i % 3 === 0 ? 'track-crowd-a' : i % 3 === 1 ? 'track-crowd-b' : 'track-crowd-c';
        const fill = i % 7 === 0 ? '#BFFF00' : i % 4 === 0 ? '#0A0A0A' : '#5B5B55';
        return <rect key={`crowd-${i}`} x={x} y={y} width="2.5" height="3" fill={fill} className={cls} />;
      })}
    </g>

    {/* ── STADION-BANNER ── */}
    <g transform="translate(40, 62)">
      <rect width="820" height="22" fill="#0A0A0A" />
      <rect width="6" height="22" fill="#BFFF00" />
      <text
        x="20"
        y="15"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="900"
        style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}
      >
        LEADER
      </text>
      {/* Lime mid-dot accent · matches Leader·OS wordmark in nav */}
      <circle cx="85" cy="11.5" r="2.2" fill="#BFFF00" />
      <text
        x="92"
        y="15"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="900"
        style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}
      >
        OS
      </text>
      <text
        x="140"
        y="15"
        fill="#FFFFFF"
        opacity="0.55"
        fontSize="9"
        fontWeight="700"
        style={{ fontFamily: 'monospace', letterSpacing: '0.28em' }}
      >
        STADIUM · LEADEROS
      </text>
      <text
        x="810"
        y="15"
        fill="#BFFF00"
        fontSize="10"
        fontWeight="900"
        textAnchor="end"
        style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}
      >
        100 METER · KI-NATIVE LEADERSHIP
      </text>
    </g>

    {/* Eyebrow links oben */}
    <text x="40" y="28" fill="#0A0A0A" fontSize="9" fontWeight="700" style={{ fontFamily: 'monospace', letterSpacing: '0.28em' }}>
      ▸ DAS RENNEN HAT ANGEFANGEN
    </text>
    <text x="860" y="28" fill="#0A0A0A" opacity="0.5" fontSize="9" fontWeight="700" textAnchor="end" style={{ fontFamily: 'monospace', letterSpacing: '0.22em' }}>
      BIB · 0001
    </text>

    {/* ── 5 BAHNEN ── */}
    {[110, 150, 190, 230, 270].map((y, i) => (
      <g key={`lane-${i}`}>
        <rect
          x="40"
          y={y - 18}
          width="820"
          height="36"
          fill={i === 4 ? '#D4493C' : '#C53A2E'}
          opacity={i === 4 ? 0.92 : 0.62}
        />
        <line x1="40" y1={y} x2="860" y2={y} stroke="#FFFFFF" strokeWidth="1" strokeDasharray="8 6" opacity="0.55" />
        <text
          x="870"
          y={y + 4}
          fill="#FFFFFF"
          opacity="0.7"
          fontSize="10"
          fontWeight="800"
          textAnchor="start"
          style={{ fontFamily: 'monospace', letterSpacing: '0.15em' }}
        >
          {String(i + 1).padStart(2, '0')}
        </text>
      </g>
    ))}

    {/* Distanz-Marker + Leader-Reise am unteren Rand.
        Jede Distanz = eine Stufe vom KI-Nutzer zum KI-Leader.
        Spiegelt die Wlad-Pfad-Sprache aus dem Journal:
          NUTZER → DRILL → SYSTEM → REFLEX → TEAM → LEADER */}
    <g aria-hidden="true">
      {/* Reise-Eyebrow links */}
      <text
        x="40"
        y="304"
        fill="#0A0A0A"
        opacity="0.55"
        fontSize="8"
        fontWeight="700"
        style={{ fontFamily: 'monospace', letterSpacing: '0.24em' }}
      >
        ▸ DER PFAD
      </text>

      {[
        { x: 100, m: '100M', stage: 'NUTZER' },
        { x: 240, m: '80M', stage: 'DRILL' },
        { x: 380, m: '60M', stage: 'SYSTEM' },
        { x: 520, m: '40M', stage: 'REFLEX' },
        { x: 660, m: '20M', stage: 'TEAM' },
        { x: 800, m: '0M', stage: 'LEADER', isFinish: true },
      ].map((m, i, all) => (
        <g key={m.m}>
          {/* vertikale Distanz-Linie */}
          <line x1={m.x} y1="92" x2={m.x} y2="288" stroke="#FFFFFF" strokeWidth="1" opacity="0.18" />

          {/* Pfad-Connector zur nächsten Stufe (subtile lime Strichkette) */}
          {i < all.length - 1 && (
            <line
              x1={m.x + 8}
              y1="318"
              x2={all[i + 1].x - 8}
              y2="318"
              stroke="#BFFF00"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              opacity={m.isFinish ? 0 : 0.55}
            />
          )}

          {/* Meter-Code */}
          <text
            x={m.x}
            y="304"
            fill="#0A0A0A"
            opacity="0.4"
            fontSize="8"
            fontWeight="700"
            textAnchor="middle"
            style={{ fontFamily: 'monospace', letterSpacing: '0.22em' }}
          >
            {m.m}
          </text>

          {/* Stage-Name · die eigentliche Reise */}
          {m.isFinish ? (
            <g>
              {/* Lime Kapsel hinter LEADER */}
              <rect x={m.x - 28} y="311" width="56" height="14" fill="#BFFF00" />
              <text
                x={m.x}
                y="321"
                fill="#0A0A0A"
                fontSize="10.5"
                fontWeight="900"
                textAnchor="middle"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}
              >
                LEADER
              </text>
            </g>
          ) : (
            <text
              x={m.x}
              y="321"
              fill="#0A0A0A"
              opacity="0.78"
              fontSize="9.5"
              fontWeight="900"
              textAnchor="middle"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.2em' }}
            >
              {m.stage}
            </text>
          )}
        </g>
      ))}
    </g>

    {/* Start-Linie */}
    <line x1="100" y1="92" x2="100" y2="288" stroke="#FFFFFF" strokeWidth="3" />
    <text x="100" y="84" fill="#0A0A0A" fontSize="9" fontWeight="900" textAnchor="middle" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}>
      START
    </text>

    {/* ── ZIEL-BAND mit aufgedrucktem LEADER·OS Wordmark ── */}
    <g className="track-tape">
      {/* Obere Hälfte des Bands (intakt) */}
      <rect x="796" y="92" width="8" height="174" fill="#0A0A0A" />
      <rect x="796" y="92" width="8" height="174" fill="url(#tapeStripe)" opacity="0.5" />
      {/* Lime Glow */}
      <rect x="800" y="92" width="2" height="174" fill="#BFFF00" opacity="0.8" />
    </g>
    {/* Ziel-Linie auf Boden · solid */}
    <line x1="800" y1="92" x2="800" y2="288" stroke="#FFFFFF" strokeWidth="3" opacity="0.9" />
    <text x="800" y="84" fill="#0A0A0A" fontSize="11" fontWeight="900" textAnchor="middle" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.22em' }}>
      ZIEL
    </text>

    {/* Bahn-5 Ziel-Band ZERRISSEN: Bruchstücke flattern weg */}
    <g aria-hidden="true">
      {/* linkes Fragment */}
      <polygon points="796,250 802,252 800,260 794,258" fill="#BFFF00" className="track-speed-1" />
      {/* rechtes Fragment */}
      <polygon points="804,248 812,246 814,256 806,254" fill="#0A0A0A" className="track-speed-2" />
      <polygon points="808,262 816,260 818,268 810,266" fill="#BFFF00" className="track-speed-3" />
    </g>

    {/* ── 4 ANZUG-TRÄGER auf Bahnen 1-4, weit hinten ── */}
    {[110, 150, 190, 230].map((y, i) => {
      const x = 168 + i * 22; // gestaffelt
      return (
        <g key={`suit-${i}`} className="track-shuffle" style={{ animationDelay: `${i * 220}ms` }}>
          <g transform={`translate(${x}, ${y - 16})`}>
            {/* Boden-Schatten */}
            <ellipse cx="9" cy="32" rx="8" ry="1.5" fill="#0A0A0A" opacity="0.18" />
            {/* Kopf + Haar */}
            <rect x="6" y="0" width="6" height="6" fill="#C4A382" />
            <rect x="6" y="0" width="6" height="2" fill={i === 1 ? '#5C3A1E' : i === 2 ? '#1F1610' : '#3A2418'} />
            {/* Anzug-Körper */}
            <rect x="4" y="6" width="10" height="14" fill="#1A1A1A" />
            {/* Lapels */}
            <rect x="4" y="6" width="2" height="6" fill="#2A2A2A" />
            <rect x="12" y="6" width="2" height="6" fill="#2A2A2A" />
            {/* Schlips (jeder eine andere Farbe · kein Klon) */}
            <rect x="8" y="8" width="2" height="6" fill={['#5B0E0E', '#0E2E5B', '#5B4A0E', '#0E5B2E'][i]} />
            {/* Aktentasche links */}
            {i % 2 === 0 && <rect x="0" y="12" width="4" height="5" fill="#3A2418" />}
            {/* Beine */}
            <rect x="5" y="20" width="3" height="8" fill="#1A1A1A" />
            <rect x="10" y="20" width="3" height="8" fill="#1A1A1A" />
            {/* Schuhe */}
            <rect x="5" y="28" width="3" height="2" fill="#000" />
            <rect x="10" y="28" width="3" height="2" fill="#000" />
          </g>
        </g>
      );
    })}

    {/* ── T-SHIRT LÄUFER auf Bahn 5 · durchbricht das Ziel-Band ── */}
    <g transform="translate(770, 252)">
      {/* Aura · zwei Schichten mit verschiedenen Phasen */}
      <ellipse cx="14" cy="14" rx="32" ry="28" fill="#BFFF00" className="track-aura-o" />
      <ellipse cx="14" cy="14" rx="22" ry="20" fill="#BFFF00" className="track-aura-i" />

      {/* Boden-Schatten */}
      <ellipse cx="14" cy="32" rx="12" ry="2" fill="#0A0A0A" opacity="0.25" />

      {/* Heavy speed-lines (animiert, ziehen nach hinten) */}
      <g>
        <line x1="-18" y1="6" x2="-2" y2="6" stroke="#BFFF00" strokeWidth="2.5" className="track-speed-1" />
        <line x1="-26" y1="11" x2="-4" y2="11" stroke="#BFFF00" strokeWidth="2.5" className="track-speed-2" />
        <line x1="-22" y1="16" x2="-2" y2="16" stroke="#BFFF00" strokeWidth="2.5" className="track-speed-3" />
        <line x1="-16" y1="21" x2="-3" y2="21" stroke="#0A0A0A" strokeWidth="1.8" opacity="0.55" className="track-speed-2" />
        <line x1="-12" y1="25" x2="-2" y2="25" stroke="#0A0A0A" strokeWidth="1.8" opacity="0.4" className="track-speed-3" />
      </g>

      {/* Kopf + Haar */}
      <rect x="10" y="0" width="8" height="7" fill="#F2C8A4" />
      <rect x="10" y="0" width="8" height="2" fill="#1F1610" />
      {/* Schweiß-Tropfen */}
      <circle cx="9" cy="4" r="0.9" fill="#BFFF00" opacity="0.9" />

      {/* T-Shirt weiß */}
      <rect x="6" y="7" width="16" height="13" fill="#FFFFFF" />
      {/* T-Shirt Schatten / Falte */}
      <rect x="6" y="18" width="16" height="2" fill="#0A0A0A" opacity="0.12" />

      {/* ★ WladMark Emblem auf Brust · pulsiert/dreht ★ */}
      {/* Outer <g> hält die statische Position, inner <g> bekommt die CSS-Animation
          (CSS transform-keyframes würden sonst das SVG transform-Attribut überschreiben) */}
      <g transform="translate(10, 9)">
        <g className="track-wmark">
          <rect x="-4" y="-4" width="8" height="8" fill="#BFFF00" />
          {/* W-Glyphe (Pixel-Abstraktion des WladMark) */}
          <path d="M-2.6 -2.2 L-1.6 2 L0 -0.6 L1.6 2 L2.6 -2.2" stroke="#0A0A0A" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Arme · pumpend (Lauf-Pose) */}
      <g className="track-stride-a">
        <rect x="2" y="9" width="3.5" height="7" fill="#F2C8A4" transform="rotate(-32 3.75 12.5)" />
      </g>
      <g className="track-stride-b">
        <rect x="22.5" y="7" width="3.5" height="7" fill="#F2C8A4" transform="rotate(42 24.25 10.5)" />
      </g>

      {/* Beine · Sprint-Pose */}
      <g className="track-stride-a">
        <rect x="8" y="20" width="3.5" height="10" fill="#1A4A5A" transform="rotate(22 9.75 25)" />
        <rect x="7" y="29" width="5" height="2" fill="#BFFF00" />
      </g>
      <g className="track-stride-b">
        <rect x="16" y="20" width="3.5" height="10" fill="#1A4A5A" transform="rotate(-34 17.75 25)" />
        <rect x="14" y="29" width="5" height="2" fill="#BFFF00" />
      </g>
    </g>

    {/* "MIT WLADBOT" Pill · sitzt oberhalb des Läufers, sauber freigestellt.
        Outer <g> hält die Position, inner <g> macht das Bob via CSS-keyframes
        (sonst überschreibt die CSS-transform-Animation das SVG-transform-Attribut).
        Pille ist absichtlich 112×26 (Text + 0.16em letter-spacing ≈ 86px,
        plus 5px Lime-Akzent + 12px Padding) damit das "M" nicht in den
        Akzent läuft. */}
    <g transform="translate(728, 200)">
      <g className="track-pill">
        <rect x="0" y="0" width="112" height="26" fill="#0A0A0A" />
        <rect x="0" y="0" width="5" height="26" fill="#BFFF00" />
        <text
          x="62"
          y="17"
          fill="#FFFFFF"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.16em' }}
        >
          MIT WLADBOT
        </text>
        {/* Pfeil zeigt nach unten auf den Läufer (Brust bei x≈790 absolut → 62 relativ) */}
        <polygon points="58,26 66,26 62,33" fill="#0A0A0A" />
      </g>
    </g>

    {/* Footer */}
    <text x="40" y="345" fill="#0A0A0A" fontSize="8" fontWeight="700" opacity="0.55" style={{ fontFamily: 'monospace', letterSpacing: '0.22em' }}>
      ▸ LEADER · OS · STADIUM
    </text>
    <text x="860" y="345" fill="#0A0A0A" fontSize="8" fontWeight="700" textAnchor="end" opacity="0.55" style={{ fontFamily: 'monospace', letterSpacing: '0.22em' }}>
      ERSTE GRUPPE · WLADBOT IM RENNEN
    </text>
  </svg>
);

export const TrackFieldSection = () => (
  <section
    className="bg-[#FAFAF7] border-y-2 border-black"
    aria-label="100 Meter KI-Native Leadership"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24 grid md:grid-cols-12 gap-10 items-center">
      <div className="md:col-span-5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4 font-mono">
          ▸ DAS RENNEN HAT ANGEFANGEN
        </p>
        <h2
          className="text-[44px] sm:text-[64px] md:text-[84px] leading-[0.92] tracking-[-0.04em] text-black"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Wer Wlads System hat,<br />
          <span className="text-black/55">führt vorneweg</span>
          <span className="text-brand">.</span>
        </h2>
        <p className="mt-7 max-w-md text-[15px] md:text-[16px] leading-[1.6] text-black/70">
          Während die anderen noch im Anzug am Start stehen,
          ist die Führungskraft mit System schon am Ziel. Kein
          Wunderwerk, sondern die richtigen Werkzeuge, das richtige
          Mindset, ein Coach der mitläuft.
        </p>
      </div>
      <div className="md:col-span-7 border-2 border-black bg-white p-3 md:p-5 shadow-[8px_8px_0_0_#000]">
        <TrackFieldVisual />
      </div>
    </div>
  </section>
);

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * MiniChallenge · Inline 5-Fragen-Mini-Game als Landing-Funnel.
 *
 * Game-Layout-DNA:
 *   - Riesige Frage-Nummer (01-05) als visueller Anker.
 *   - XP-Style Progress-Bar mit Lime-Fill, Schritt-Markierung.
 *   - Antworten als 2px-Border-Tiles, A/B/C als schwarze Quadrate.
 *   - Lime-Pulse beim Antworten, Score-Triple wächst sichtbar.
 *   - Final Reveal: 3 Score-Tiles (KI / Rhetorik / EQ) + 50 Free
 *     Credits Unlock-Animation + CTA zur vollen Diagnose.
 *
 * Komplett client-side, keine Backend-Call nötig. Score-Berechnung:
 * jede Antwort kommt mit (ki, rhet, eq) weights, summiert auf je
 * maximal 25 Punkte pro Dimension.
 */

const QUESTIONS = [
  {
    q: 'Was passiert, wenn KI dir morgens 3 Stunden Arbeit abnimmt?',
    options: [
      { label: 'Ich nutze die Zeit für strategische Themen.', w: { ki: 5, rhet: 2, eq: 3 } },
      { label: 'Ich fülle sie mit dem nächsten Meeting auf.',  w: { ki: 1, rhet: 3, eq: 2 } },
      { label: 'Ich frage mich erstmal was ich tun soll.',     w: { ki: 0, rhet: 1, eq: 4 } },
    ],
  },
  {
    q: 'Dein Team kommt mit einem Konflikt zu dir. Erster Impuls?',
    options: [
      { label: 'Ich höre zu bevor ich Lösung präsentiere.',     w: { ki: 1, rhet: 3, eq: 5 } },
      { label: 'Ich gebe eine klare Anweisung, schnell raus.',  w: { ki: 2, rhet: 5, eq: 1 } },
      { label: 'Ich frage was sie selbst denken sollten.',      w: { ki: 3, rhet: 4, eq: 4 } },
    ],
  },
  {
    q: 'In einer Verhandlung: dein größter Hebel?',
    options: [
      { label: 'Klare Argumentations-Struktur, keine Floskeln.', w: { ki: 2, rhet: 5, eq: 3 } },
      { label: 'Empathie und Beziehung zum Gegenüber.',          w: { ki: 1, rhet: 3, eq: 5 } },
      { label: 'Daten, Daten, Daten. Fakten überzeugen.',        w: { ki: 5, rhet: 2, eq: 1 } },
    ],
  },
  {
    q: 'Wie oft denkst du über KI als Werkzeug nach?',
    options: [
      { label: 'Täglich, gehört zu meinem Workflow.',            w: { ki: 5, rhet: 2, eq: 2 } },
      { label: 'Manchmal, wenn ich konkrete Aufgabe habe.',      w: { ki: 3, rhet: 2, eq: 3 } },
      { label: 'Wenig, ich bevorzuge bewährte Methoden.',        w: { ki: 1, rhet: 4, eq: 4 } },
    ],
  },
  {
    q: 'Wenn dich morgen jemand zu einer Firmenrede ruft: Gefühl?',
    options: [
      { label: 'Energie, ich liebe die Bühne.',                 w: { ki: 1, rhet: 5, eq: 4 } },
      { label: 'OK, ich bereite mich gründlich vor.',           w: { ki: 3, rhet: 4, eq: 3 } },
      { label: 'Nervös, gibt entspanntere Settings.',           w: { ki: 2, rhet: 2, eq: 5 } },
    ],
  },
];

const ProgressBar = ({ step, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 flex-1 transition-all duration-300 ${
          i < step
            ? 'bg-brand'
            : i === step
            ? 'bg-brand/50 animate-pulse'
            : 'bg-black/10'
        }`}
      />
    ))}
  </div>
);

const ScorePip = ({ label, value }) => (
  <div className="border-2 border-black p-3 text-center">
    <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
      {label}
    </div>
    <div
      className="text-black leading-[0.85] tracking-[-0.04em] mt-1"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(36px, 6vw, 56px)' }}
    >
      {value}
    </div>
  </div>
);

export const MiniChallenge = () => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ ki: 0, rhet: 0, eq: 0 });
  const [done, setDone] = useState(false);
  const [creditsRedeemed, setCreditsRedeemed] = useState(false);

  const trackPH = (event, props = {}) => {
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try { window.posthog.capture(event, { surface: 'leader-os', ...props }); } catch {}
    }
  };

  const redeemCredits = () => {
    if (creditsRedeemed) return;
    setCreditsRedeemed(true);
    trackPH('mini_challenge_credits_redeemed', { weakest: weakest?.key });
    // Redeeming the 50 credits sends the visitor into LeaderOS to claim
    // them on their account · short beat so the "EINGELÖST" state registers.
    setTimeout(() => {
      window.location.href = 'https://leaderos.de/login?bonus=welcome50';
    }, 900);
  };

  const choose = (opt) => {
    if (step === 0 && scores.ki === 0 && scores.rhet === 0 && scores.eq === 0) {
      trackPH('mini_challenge_started');
    }
    trackPH('mini_challenge_answered', { step: step + 1, total: QUESTIONS.length });
    setScores((s) => ({
      ki:   s.ki + opt.w.ki,
      rhet: s.rhet + opt.w.rhet,
      eq:   s.eq + opt.w.eq,
    }));
    setTimeout(() => {
      if (step + 1 === QUESTIONS.length) {
        setDone(true);
        // computed in render via norm(...) · recompute here for the event
        const ki = Math.min(100, Math.round(((scores.ki + opt.w.ki) / 25) * 100));
        const rhet = Math.min(100, Math.round(((scores.rhet + opt.w.rhet) / 25) * 100));
        const eq = Math.min(100, Math.round(((scores.eq + opt.w.eq) / 25) * 100));
        trackPH('mini_challenge_completed', { ki, rhet, eq });
      } else {
        setStep(step + 1);
      }
    }, 360);
  };

  // Max points per dimension across the 5 questions ≈ 25.
  // Normalize to a 0-100 score.
  const norm = (n) => Math.min(100, Math.round((n / 25) * 100));
  const ki = norm(scores.ki);
  const rhet = norm(scores.rhet);
  const eq = norm(scores.eq);

  // Determine focus area.
  const weakest = [
    { name: 'KI-Nutzung', val: ki, drill: 'KI-Routine' },
    { name: 'Rhetorik',   val: rhet, drill: '3 Säulen' },
    { name: 'EQ',         val: eq, drill: 'Feedback-Formel' },
  ].sort((a, b) => a.val - b.val)[0];

  return (
    <section
      id="mini-challenge"
      className="relative w-full bg-[#FAFAF7] border-y-2 border-black"
      aria-label="5-Fragen-Challenge"
    >
      <div className="max-w-[1080px] mx-auto px-5 md:px-10 py-16 md:py-24">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-3 font-mono">
              ▸ MINI-CHALLENGE · 60 SEKUNDEN
            </p>
            <h2
              className="text-[40px] sm:text-[60px] md:text-[88px] leading-[0.92] tracking-[-0.04em] text-black"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              5 Fragen.<br />
              <span className="text-black/55">Dein Profil</span>
              <span className="text-brand">.</span>
            </h2>
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
            ▸ XP · {scores.ki + scores.rhet + scores.eq} / 75
          </div>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/60 font-mono">
            <span>FRAGE {Math.min(step + 1, QUESTIONS.length)} / {QUESTIONS.length}</span>
            <span className="text-brand-strong">+5 XP PRO ANTWORT</span>
          </div>
          <ProgressBar step={done ? QUESTIONS.length : step} total={QUESTIONS.length} />
        </div>

        {/* Game body */}
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-baseline gap-4 mb-6">
                <span
                  className="text-brand leading-[0.8] tracking-[-0.04em]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(64px, 14vw, 112px)' }}
                >
                  {String(step + 1).padStart(2, '0')}
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono pb-3 leading-tight">
                  / 0{QUESTIONS.length}<br />FRAGE
                </span>
              </div>

              <div className="border-2 border-black bg-white p-6 md:p-8 space-y-5">
                <h3
                  className="text-[22px] md:text-[28px] leading-[1.2] tracking-[-0.015em] text-black"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
                >
                  {QUESTIONS[step].q}
                </h3>
                <div className="space-y-2.5">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => choose(opt)}
                      data-testid={`mini-q${step}-opt${i}`}
                      className="w-full p-4 text-left border-2 border-black/15 bg-white hover:border-black hover:bg-brand/15 transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 inline-flex items-center justify-center text-[13px] font-black bg-black/[0.06] text-black/55 group-hover:bg-black group-hover:text-brand transition-colors shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-[14.5px] leading-[1.4] font-medium text-black">
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Score-Reveal */}
              <div className="border-2 border-black bg-white p-6 md:p-8">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-strong font-mono mb-3">
                  ▸ DEIN PROFIL · 75 XP
                </div>
                <h3
                  className="leading-[0.88] tracking-[-0.04em] text-black"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(40px, 7vw, 76px)' }}
                >
                  Stärke: <span className="text-brand">{weakest.val < Math.max(ki, rhet, eq) ? (ki >= rhet && ki >= eq ? 'KI' : rhet >= eq ? 'Rhetorik' : 'EQ') : 'Ausgewogen'}</span><br />
                  <span className="text-black/55">Hebel: {weakest.name}</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 mt-7">
                  <ScorePip label="KI" value={ki} />
                  <ScorePip label="RHETORIK" value={rhet} />
                  <ScorePip label="EQ" value={eq} />
                </div>
                <p className="mt-7 text-[13.5px] leading-[1.55] text-black/70 max-w-xl">
                  Deine größte Lücke: <strong className="text-black">{weakest.name}</strong>.
                  Starte mit Wlads {weakest.drill}-Drill. Mach danach die volle 30-Fragen-Diagnose
                  für deine persönliche 30-Tage-Roadmap.
                </p>
              </div>

              {/* 50 Free Credits Reward Banner */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative border-2 border-black bg-brand p-6 md:p-8 shadow-[8px_8px_0_0_#000]"
              >
                <div className="absolute -top-3 -right-3 bg-black text-brand text-[10px] font-bold uppercase tracking-[0.22em] px-3 py-1 font-mono">
                  ▸ UNLOCKED
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-black font-mono mb-3">
                  ▸ BELOHNUNG · WLADBOT
                </div>
                <h3
                  className="leading-[0.88] tracking-[-0.04em] text-black"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(48px, 8vw, 88px)' }}
                >
                  50 FREE<br />CREDITS<span className="text-black not-italic">.</span>
                </h3>
                <p className="mt-5 text-[14.5px] leading-[1.5] text-black/85 max-w-md">
                  Genug für ~25 Sprachen-Sessions mit dem WladBot zu deinem Hebel-Thema,
                  oder ein voller 1:1-Drill mit der {weakest.drill}.
                </p>
                <button
                  onClick={redeemCredits}
                  disabled={creditsRedeemed}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-black text-brand text-[12px] font-bold uppercase tracking-[0.18em] hover:bg-black/85 disabled:opacity-60 transition-colors"
                >
                  {creditsRedeemed ? '✓ EINGELÖST · WEITER ZU LEADEROS…' : '▸ 50 CREDITS EINLÖSEN'}
                </button>
              </motion.div>

              {/* Next-Step CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://leadercheck.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-4 bg-black text-white text-[12.5px] font-bold uppercase tracking-[0.18em] hover:bg-black/85 text-center transition-colors shadow-[6px_6px_0_0_#BFFF00]"
                >
                  ▸ VOLLE DIAGNOSE · 30 FRAGEN
                </a>
                <button
                  onClick={() => { setStep(0); setScores({ki:0,rhet:0,eq:0}); setDone(false); setCreditsRedeemed(false); }}
                  className="px-6 py-4 border-2 border-black text-black text-[12.5px] font-bold uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
                >
                  ↻ NEU SPIELEN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

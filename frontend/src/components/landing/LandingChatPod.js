import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * LandingChatPod · editorial WladBot-Mini, eingebettet als Funnel.
 *
 * KEIN echter Chat-mit-LLM. Ein scripted Funnel im Specimen-Stil,
 * der den Besucher in 4–6 Mikro-Fragen qualifiziert und am Ende
 * eine Route empfiehlt: Diagnose · Demo · Beratung. Das macht ihn
 * ehrlich (kein Fake-AI-Theater), schnell (keine Latenz, keine
 * Token-Kosten) und konsistent (jeder Besucher kommt durch).
 *
 * Zwei Modi via `mode`-Prop (passend zum Landing-Host):
 *
 *   'lead'      · fires on leader-os.de (Vercel marketing landing).
 *                 Erkundet Rolle, größte Leadership-Baustelle,
 *                 Zeit-Horizont, Team-Größe. Berechnet FIT-Score
 *                 und schlägt vor: Diagnose (low fit) → leadercheck.de
 *                 · Demo (mid) → cal.com · Beratung (high) → cal.com.
 *
 *   'readiness' · fires on leader-check.de (Vercel marketing landing).
 *                 Erkundet KI-Nutzung, Argumentations-Sicherheit,
 *                 EQ-Reflex. READINESS-Score routet in die volle
 *                 30-Fragen-Diagnose auf leadercheck.de (Emergent app).
 *
 * DOMAIN-TOPOLOGY (canonical, see docs/app/DOMAIN_TOPOLOGY.md):
 *   leader-os.de + leader-check.de  = Vercel marketing landings (where this pod lives)
 *   leaderos.de  + leadercheck.de   = Emergent apps (where the actual funnel converts)
 *
 * Look-and-Feel:
 *   - Editorial Specimen-Pod: schwarze Canvas, Hairline-Borders,
 *     Mono BIB-Header, Outfit-Italic-Headline, Lime-Akzent.
 *   - Floating Launcher rechts unten · pulsierender Lime-Punkt +
 *     "▸ FRAG WLADBOT" Mono-Caption.
 *   - Drawer von rechts auf Desktop, Bottom-Sheet auf Mobile.
 *   - Tippen-Indikator: 3 Lime-Punkte mit Stagger.
 *   - Answer-Chips als Pills (kein Free-Text bis am Ende E-Mail).
 *
 * Lead-Capture: am Ende des Flows wird Email + ein Optionen-CTA
 * angezeigt. Email landet im selben /api/leader-check/intent
 * Endpoint wie die LeadCaptureModal (mit anderem `campaign`-Tag).
 */

const FLOWS = {
  lead: {
    bib: 'WLADBOT · MINI · LEAD',
    opener: 'Kurz: 4 Fragen. Dann sag ich dir, was dein nächster Schritt ist.',
    steps: [
      {
        q: 'Was ist deine aktuelle Rolle?',
        key: 'rolle',
        options: [
          { label: 'C-Level / Geschäftsführung', value: 'cxo', weight: 3 },
          { label: 'Team-Lead / Head of', value: 'lead', weight: 2 },
          { label: 'Senior IC ohne Team', value: 'ic', weight: 1 },
          { label: 'Gründer / Solo', value: 'founder', weight: 2 },
        ],
      },
      {
        q: 'Wo brennt es gerade am meisten?',
        key: 'pain',
        options: [
          { label: 'Schwierige 1:1s · Feedback', value: '1on1', weight: 2 },
          { label: 'Firmenreden · Stakeholder', value: 'town', weight: 3 },
          { label: 'Verhandlungen · Eskalationen', value: 'neg', weight: 3 },
          { label: 'KI-Hebel finden im Alltag', value: 'ki', weight: 2 },
        ],
      },
      {
        q: 'Wie schnell willst du das ändern?',
        key: 'speed',
        options: [
          { label: 'Diese Woche schon spürbar', value: 'now', weight: 3 },
          { label: 'In den nächsten 30 Tagen', value: '30d', weight: 2 },
          { label: 'Ich erkunde noch', value: 'soft', weight: 1 },
        ],
      },
      {
        q: 'Wie viele Menschen führst du direkt?',
        key: 'team',
        options: [
          { label: '0 (ich coache mich selbst)', value: '0', weight: 1 },
          { label: '1–3', value: '1-3', weight: 2 },
          { label: '4–10', value: '4-10', weight: 3 },
          { label: '> 10', value: '10+', weight: 3 },
        ],
      },
    ],
    routes: [
      // FIT-Score: Summe der weights, max 12.
      {
        min: 10,
        title: 'Persönliche Beratung.',
        body:
          'Bei deinem Setup macht es wenig Sinn, mit der Diagnose anzufangen · ' +
          'wir setzen direkt mit einer 30-Min-Beratung an deinem konkreten Fall an.',
        primary: { label: 'Beratung buchen · 30 Min', href: 'https://cal.com/leaderos/beratung' },
        secondary: { label: 'Lieber doch Demo · 20 Min', href: 'https://cal.com/leaderos/demo' },
      },
      {
        min: 7,
        title: 'Live-Demo.',
        body:
          'Du kennst deine Baustelle · schau dir LeaderOS am eigenen Use-Case an. ' +
          '20 Minuten, Live, mit dem Team.',
        primary: { label: 'Demo buchen · 20 Min', href: 'https://cal.com/leaderos/demo' },
        secondary: { label: 'Erst Diagnose machen', href: 'https://leadercheck.de' },
      },
      {
        min: 0,
        title: 'Start mit der Diagnose.',
        body:
          'Genau für deinen Punkt gemacht: 10 Minuten, 30 Fragen, sofort dein Score und ' +
          'eine konkrete Empfehlung. Kostenlos, ohne Kreditkarte.',
        primary: { label: 'Diagnose starten · 10 Min', href: 'https://leadercheck.de' },
        secondary: { label: 'Trotzdem Demo · 20 Min', href: 'https://cal.com/leaderos/demo' },
      },
    ],
  },
  readiness: {
    bib: 'WLADBOT · MINI · READINESS',
    opener: '4 schnelle Fragen · dann zeige ich dir wo du startest.',
    steps: [
      {
        q: 'Nutzt du KI heute schon in deinem Führungs-Alltag?',
        key: 'ki',
        options: [
          { label: 'Täglich · bewusst', value: 'daily', weight: 3 },
          { label: 'Manchmal · für Texte', value: 'some', weight: 2 },
          { label: 'Eher nein', value: 'no', weight: 1 },
        ],
      },
      {
        q: 'Wie sicher führst du schwierige Konversationen?',
        key: 'rhet',
        options: [
          { label: 'Sehr sicher · ich habe Skripte', value: 'high', weight: 3 },
          { label: 'Geht so · Bauch entscheidet', value: 'mid', weight: 2 },
          { label: 'Eher unsicher · vermeide oft', value: 'low', weight: 1 },
        ],
      },
      {
        q: 'Liest du Stimmungen im Raum bewusst?',
        key: 'eq',
        options: [
          { label: 'Ja · ich passe an', value: 'high', weight: 3 },
          { label: 'Manchmal · post-mortem', value: 'mid', weight: 2 },
          { label: 'Selten · ich pushe durch', value: 'low', weight: 1 },
        ],
      },
      {
        q: 'Hast du ein Framework für Feedback?',
        key: 'fw',
        options: [
          { label: 'Ja · ich nutze eines bewusst', value: 'yes', weight: 3 },
          { label: 'Ich improvisiere', value: 'imp', weight: 2 },
          { label: 'Ich schiebe Feedback raus', value: 'no', weight: 1 },
        ],
      },
    ],
    routes: [
      {
        min: 10,
        title: 'Bist schon weit.',
        body:
          'Du hast Basics drin. Die 30-Fragen-Diagnose zeigt dir die feinen ' +
          'Lücken · und LeaderOS schließt sie systematisch in 30 Tagen.',
        primary: { label: 'Volle Diagnose · 10 Min', href: 'https://leadercheck.de' },
        secondary: { label: 'Direkt Beratung · 30 Min', href: 'https://cal.com/leaderos/beratung' },
      },
      {
        min: 7,
        title: 'Solide Mitte.',
        body:
          'Du arbeitest schon bewusst · aber mit Lücken. Die volle Diagnose ' +
          'sagt dir genau, wo der Hebel am größten ist.',
        primary: { label: 'Volle Diagnose · 10 Min', href: 'https://leadercheck.de' },
        secondary: { label: 'LeaderOS ansehen', href: 'https://leaderos.de' },
      },
      {
        min: 0,
        title: 'Bester Zeitpunkt.',
        body:
          'Du fängst quasi bei Null an · das ist der beste Zeitpunkt, um ' +
          'sauber aufzubauen. Diagnose zeigt dir, womit du startest.',
        primary: { label: 'Volle Diagnose · 10 Min', href: 'https://leadercheck.de' },
        secondary: { label: 'LeaderOS ansehen', href: 'https://leaderos.de' },
      },
    ],
  },
};

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-2 px-3">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-brand"
        style={{
          animation: `chatpod-pulse 1.2s ${i * 0.15}s infinite ease-in-out`,
        }}
      />
    ))}
  </div>
);

const PodHeader = ({ bib, onClose }) => (
  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] text-[10.5px] font-black uppercase tracking-[0.22em] text-white font-mono shrink-0">
    <div className="flex items-center gap-3">
      <span className="relative inline-flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-75" />
        <span className="relative w-2 h-2 rounded-full bg-brand" />
      </span>
      <span>▸ {bib}</span>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Schließen"
      className="w-7 h-7 inline-flex items-center justify-center border border-white/15 hover:border-white/45 hover:text-white text-white/55 transition-colors"
    >
      ×
    </button>
  </div>
);

const BotBubble = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="max-w-[88%] mr-auto"
  >
    <div className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-brand font-mono mb-1.5">
      ▸ WLADBOT
    </div>
    <div className="px-4 py-3 border border-white/[0.12] bg-white/[0.02] text-[14px] leading-[1.5] text-white/90">
      {children}
    </div>
  </motion.div>
);

const UserBubble = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    className="max-w-[88%] ml-auto"
  >
    <div className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/50 font-mono mb-1.5 text-right">
      ▸ DU
    </div>
    <div className="px-4 py-3 bg-brand text-black text-[14px] leading-[1.5] font-medium">
      {children}
    </div>
  </motion.div>
);

const OptionChips = ({ options, onPick, disabled }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        disabled={disabled}
        onClick={() => onPick(o)}
        className="px-3 py-2 border border-white/15 text-[12.5px] text-white/85 hover:border-brand hover:text-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left leading-[1.3]"
      >
        {o.label}
      </button>
    ))}
  </div>
);

const scoreFor = (answers, flow) =>
  flow.steps.reduce((acc, step) => {
    const a = answers[step.key];
    const opt = step.options.find((o) => o.value === a);
    return acc + (opt?.weight || 0);
  }, 0);

const routeFor = (score, flow) =>
  flow.routes.find((r) => score >= r.min) || flow.routes[flow.routes.length - 1];

export const LandingChatPod = ({ mode = 'lead' }) => {
  const flow = FLOWS[mode] || FLOWS.lead;
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef(null);

  // Scroll bei jedem neuen Schritt nach unten.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [stepIdx, typing, showAnswer]);

  // Reset wenn der Pod geschlossen und wieder geöffnet wird.
  const reopen = () => {
    setOpen(true);
    if (showAnswer) {
      setStepIdx(0);
      setAnswers({});
      setShowAnswer(false);
      setEmail('');
      setSubmitted(false);
    }
  };

  const pick = (opt) => {
    const step = flow.steps[stepIdx];
    const next = { ...answers, [step.key]: opt.value };
    setAnswers(next);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (stepIdx + 1 < flow.steps.length) {
        setStepIdx(stepIdx + 1);
      } else {
        setShowAnswer(true);
      }
    }, 650);
  };

  const submitEmail = async (e) => {
    e?.preventDefault?.();
    if (!email.includes('@')) return;
    setSubmitted(true);
    try {
      await fetch('/api/leader-check/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'landing-chatpod',
          campaign: `pod-${mode}`,
          context: { mode, answers, score: scoreFor(answers, flow) },
        }),
        keepalive: true,
      });
    } catch {
      /* swallow · der CTA-Klick navigiert eh weiter */
    }
  };

  const score = scoreFor(answers, flow);
  const route = showAnswer ? routeFor(score, flow) : null;

  return (
    <>
      {/* CSS für die Pulse-Dots (keine Tailwind-Animation für diese genaue Kurve) */}
      <style>{`
        @keyframes chatpod-pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ─── Launcher (Floating, rechts unten) ─── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            onClick={reopen}
            data-testid="landing-chatpod-launcher"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 1 }}
            className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-40 group inline-flex items-center gap-3 bg-[#0A0A0A] text-white border border-white/15 hover:border-brand px-4 py-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] transition-colors"
          >
            <span className="relative inline-flex w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-70" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-brand" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.24em] font-mono text-left leading-tight">
              ▸ FRAG WLADBOT<br />
              <span className="text-white/80 tracking-[0.2em] font-bold">
                {mode === 'readiness' ? 'Readiness in 60 Sek.' : 'Was passt zu dir?'}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Pod (Right-Drawer / Bottom-Sheet) ─── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop nur Mobile */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              aria-hidden
            />
            <motion.aside
              key="pod"
              data-testid="landing-chatpod"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 bg-[#0A0A0A] text-white border border-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] flex flex-col
                         inset-x-3 bottom-3 max-h-[88vh]
                         md:inset-auto md:right-7 md:bottom-7 md:w-[420px] md:max-h-[78vh]"
            >
              <PodHeader bib={flow.bib} onClose={() => setOpen(false)} />

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
              >
                {/* Intro */}
                <BotBubble>
                  <p
                    className="text-[20px] leading-[1.05] tracking-[-0.02em] mb-2 text-white"
                    style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
                  >
                    Hi, ich bin WladBot<span className="text-brand">.</span>
                  </p>
                  <p className="text-white/75">{flow.opener}</p>
                </BotBubble>

                {/* Gespielte Schritte */}
                {flow.steps.slice(0, stepIdx + (showAnswer ? flow.steps.length : 1)).map((step, i) => {
                  const a = answers[step.key];
                  const opt = step.options.find((o) => o.value === a);
                  const isCurrent = !showAnswer && i === stepIdx;
                  return (
                    <div key={step.key} className="space-y-3">
                      <BotBubble>
                        <span className="text-white/45 mr-2">§0{i + 1}</span>
                        {step.q}
                      </BotBubble>
                      {opt && <UserBubble>{opt.label}</UserBubble>}
                      {isCurrent && !opt && (
                        <OptionChips
                          options={step.options}
                          onPick={pick}
                          disabled={typing}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Typing */}
                {typing && (
                  <div className="max-w-[40%] mr-auto border border-white/10 bg-white/[0.02]">
                    <TypingDots />
                  </div>
                )}

                {/* Antwort + Email */}
                {showAnswer && route && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="mt-6 pt-6 border-t border-white/[0.08] space-y-5"
                  >
                    <div className="flex items-center justify-between text-[9.5px] font-bold uppercase tracking-[0.22em] font-mono">
                      <span className="text-brand">
                        ▸ {mode === 'readiness' ? 'READINESS' : 'FIT'} · {score} / {flow.steps.length * 3}
                      </span>
                      <span className="text-white/40">Dein Match</span>
                    </div>
                    <h3
                      className="text-[28px] sm:text-[34px] leading-[1.02] tracking-[-0.03em] text-white"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                    >
                      {route.title.replace(/\.$/, '')}
                      <span className="text-brand not-italic">.</span>
                    </h3>
                    <p className="text-[14px] leading-[1.55] text-white/75">{route.body}</p>

                    {!submitted ? (
                      <form onSubmit={submitEmail} className="space-y-3">
                        <label className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/55 font-mono">
                          ▸ DEINE E-MAIL · OPTIONAL · WIR HALTEN DICH IM LOOP
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="du@deinedomain.de"
                            className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/15 text-[14px] text-white placeholder-white/35 focus:border-brand focus:outline-none transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={!email.includes('@')}
                            className="px-4 py-2.5 bg-brand text-black text-[11.5px] font-bold uppercase tracking-[0.18em] hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Senden
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-[12px] font-mono uppercase tracking-[0.18em] text-brand">
                        ▸ E-MAIL GESPEICHERT · DANKE
                      </div>
                    )}

                    <div className="space-y-2 pt-3">
                      <a
                        href={route.primary.href}
                        target={route.primary.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 px-4 py-3.5 bg-brand text-black hover:bg-brand/90 transition-colors"
                      >
                        <span className="text-[13px] font-bold uppercase tracking-[0.18em]">
                          {route.primary.label}
                        </span>
                        <span className="text-xl font-black leading-none group-hover:translate-x-0.5 transition-transform">+</span>
                      </a>
                      <a
                        href={route.secondary.href}
                        target={route.secondary.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 border border-white/15 text-[12px] font-bold uppercase tracking-[0.18em] text-white/75 hover:text-white hover:border-white/45 text-center transition-colors"
                      >
                        {route.secondary.label} ↗
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Foot-Strip */}
              <div className="px-5 py-2.5 border-t border-white/[0.08] flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-white/40 font-mono shrink-0">
                <span>POWERED BY WLAD-METHODIK</span>
                <span>ERSTE GRUPPE</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

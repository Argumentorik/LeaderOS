/**
 * DashboardFirstTour.js — First-time guided walk-through.
 *
 * Iter 131.3 (Wlad-Direktive · Godmode Onboarding):
 *   The dashboard is dense. New users (especially the incoming 400
 *   Masterclass clients) need someone to sit next to them and say
 *   "here, here, and this — this is what everything means."
 *
 *   This component is exactly that: a premium coach-mark walk-through
 *   that
 *     1. finds each nav / feature target via data-tour-id,
 *     2. highlights it with a spotlight ring + backdrop,
 *     3. pops a compact Wlad card (real photo, not the AI-slop Pixar
 *        avatar) with a short German description,
 *     4. speaks the same description in German through the browser's
 *        SpeechSynthesis API — no external TTS integration required,
 *        works offline, no cost per token.
 *
 *   State: shown ONCE per user via localStorage flag `leaderos_tour_v1`.
 *   User can dismiss at any point — will not re-show.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Volume2, VolumeX, Check } from 'lucide-react';
import { WLAD_AVATAR } from '../../lib/brand';
import { Button } from '../ui/button';

const STORAGE_KEY = 'leaderos_tour_v1_done';

// Ordered tour steps. Each step points at an element via `data-tour-id`.
// If the target is missing on this viewport (e.g. mobile sidebar), the
// step is skipped so we never spotlight nothing.
const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null, // centered modal, no spotlight
    kicker: 'Willkommen',
    title: 'Schön, dass du da bist.',
    body: 'Ich bin dein persönlicher Coach. In 60 Sekunden zeig ich dir jede Ecke von Leader-OS — damit du weißt, wo du dranbleibst, wenn dein Alltag ruft.',
    speak: 'Willkommen bei Leader OS. Ich bin dein persönlicher Coach und zeige dir jetzt jede Ecke der Plattform, damit du morgen früh sofort loslegen kannst.',
  },
  {
    id: 'dashboard',
    target: 'nav-dashboard',
    kicker: 'Dein Zuhause',
    title: 'Das Dashboard.',
    body: 'Hier siehst du täglich, wo du stehst: dein nächster Schritt, dein Fortschritt, dein Streak. Kein Chaos — nur das Wichtigste heute.',
    speak: 'Dein Dashboard. Hier siehst du täglich, wo du stehst und was heute dein nächster Schritt ist.',
  },
  {
    id: 'challenge',
    target: 'nav-challenge',
    kicker: 'Wachse in 30 Tagen',
    title: 'Die 30-Tage-Challenge.',
    body: 'Jeden Tag 10 Minuten. 30 Tage lang. Interaktive Fragen, konkrete Aufgaben, echtes Feedback. Das ist der schnellste Weg, KI-Leadership in deinen Alltag zu bringen.',
    speak: 'Deine 30 Tage Challenge. Zehn Minuten pro Tag, dreißig Tage lang. Der schnellste Weg, KI-Leadership zur Gewohnheit zu machen.',
  },
  {
    id: 'checkin',
    target: 'nav-checkin',
    kicker: 'Täglicher Check-in',
    title: 'Kurz reflektieren, klar bleiben.',
    body: 'Zwei Minuten pro Tag. Wie war dein Tag? Was hast du gelernt? So bleiben deine Fortschritte messbar — statt in Meetings zu versickern.',
    speak: 'Der tägliche Check-in. Zwei Minuten Reflexion, damit dein Wachstum sichtbar bleibt.',
  },
  {
    id: 'wladbot',
    target: 'nav-wladbot',
    kicker: 'Frag den Coach',
    title: 'WladBot — 24/7 Sparring.',
    body: 'Jede Antwort basiert auf Wlad Jachtchenkos Büchern, Vorträgen und Coaching-Praxis. Stell die Frage, die du sonst niemandem stellen würdest.',
    speak: 'WladBot. Frag mich alles — jede Antwort basiert auf Wlad Jachtchenkos Büchern und Coaching-Praxis.',
  },
  {
    id: 'simulations',
    target: 'nav-simulations',
    kicker: 'Bevor du in den Raum gehst',
    title: 'Argumentation-Prep.',
    body: 'Gehaltsverhandlung, Board-Pitch, schwieriges Feedback: In 4 Minuten baust du eine SEXIER-Strategie inklusive Einwandkatalog und PDF. Ein Klick, ein Plan.',
    speak: 'Die Argumentations-Vorbereitung. Bevor du in dein nächstes wichtiges Gespräch gehst, bauen wir dir hier eine komplette Strategie.',
    locked: (tier) => tier === 'free',
  },
  {
    id: 'video',
    target: 'nav-video',
    kicker: 'Sprich. Bekomm Feedback.',
    title: 'Video-Analyse.',
    body: 'Kamera an, sechzig Sekunden Rede, sofort Feedback nach Wlad Jachtchenkos Methodik: Sprache, Körper, Struktur. Wie im 1-zu-1-Coaching.',
    speak: 'Die Video Analyse. Kamera an, sechzig Sekunden reden, sofort Feedback zu Sprache, Körper und Struktur.',
  },
  {
    id: 'playbooks',
    target: 'nav-playbooks',
    kicker: 'Wenn du ein Playbook brauchst',
    title: 'Playbooks.',
    body: 'Kurze, gezielte Frameworks für konkrete Situationen: Konflikt entschärfen, Team führen, Meetings retten. Nachschlagen statt improvisieren.',
    speak: 'Die Playbooks. Kurze Frameworks für konkrete Führungssituationen zum Nachschlagen.',
    locked: (tier) => tier === 'free',
  },
  {
    id: 'progress',
    target: 'nav-progress',
    kicker: 'Sichtbar besser werden',
    title: 'Mein Fortschritt.',
    body: 'Was hast du gelernt? Wo bist du gewachsen? Deine Scores, dein Streak, deine Coaching-Memory an einem Ort. Kein Bauchgefühl — Zahlen.',
    speak: 'Mein Fortschritt. Deine Scores, dein Streak, deine Coaching Memory an einem Ort.',
  },
  {
    id: 'videos',
    target: 'nav-videos',
    kicker: 'Kurze Lernvideos',
    title: 'Lern-Videos.',
    body: 'Zwischen zehn und vierzig Minuten. Kein Fluff. Rhetorik, schwierige Gespräche, Leadership-Grundlagen — direkt von Wlad, direkt anwendbar.',
    speak: 'Die Lernvideos. Kurze, direkt anwendbare Lektionen zu Rhetorik und Leadership.',
    locked: (tier) => tier === 'free',
  },
  {
    id: 'diagnose',
    target: 'nav-diagnose',
    kicker: 'Kalibrierung',
    title: 'Kostenlose Leadership-Diagnose.',
    body: 'Zehn Minuten, sofortiger Report. Damit ich dein Coaching auf DEINE Stärken und Wachstumskanten anpasse. Wenn du es noch nicht hast: mach es zuerst.',
    speak: 'Die kostenlose Leadership Diagnose. Zehn Minuten, sofortiger Report, damit ich dein Coaching auf dich zuschneide.',
  },
  {
    id: 'done',
    target: null,
    kicker: 'Kalibriert',
    title: 'Das war\'s. Jetzt fangen wir an.',
    body: 'Wenn du eine Frage hast — ich bin oben rechts, immer da. Mein Vorschlag für die ersten sieben Tage: mach heute Tag eins der Challenge, morgen früh den Check-in, und wenn du Zeit hast: die kostenlose Diagnose. In dieser Reihenfolge. Los.',
    speak: 'Das war die Kurzführung. Ich bin oben rechts, immer da. Mein Vorschlag: heute Tag eins der Challenge, morgen früh der Check-in, dann die Diagnose. Los.',
  },
];

export const DashboardFirstTour = ({ userTier = 'free', force = false, onDone }) => {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rect, setRect] = useState(null);
  const utterRef = useRef(null);

  // Show once per user (unless `force` triggers a rerun from the profile menu).
  useEffect(() => {
    if (force) {
      setOpen(true);
      setStepIdx(0);
      return;
    }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay so the dashboard is fully painted first.
        const t = setTimeout(() => setOpen(true), 1000);
        return () => clearTimeout(t);
      }
    } catch { /* localStorage blocked → just skip the tour */ }
  }, [force]);

  // Filter out steps that are irrelevant (missing targets are ok — spotlight
  // gracefully becomes a centered card).
  const steps = useMemo(() => TOUR_STEPS, []);

  const current = steps[stepIdx];

  // Compute spotlight rect
  useEffect(() => {
    if (!open || !current?.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour-id="${current.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - 8,
      left: r.left - 8,
      width: r.width + 16,
      height: r.height + 16,
    });
    // Scroll target into view (softly)
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [open, current]);

  // Speak current step. Cancels previous utterance to avoid overlap.
  // Iter 131.4 (Wlad-Direktive · warmer voice): actively pick the best
  // available German voice — many browsers ship multiple, and picking the
  // wrong one gives that flat "GPS-voice" feel. We prefer known-good
  // premium voices ("Google Deutsch", "Anna", "Petra", "Markus") and fall
  // back gracefully. Rate 0.94 + pitch 0.95 makes it feel a touch slower
  // and lower — more like a coach, less like an announcer.
  const pickGermanVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const preferred = [
      /^Google Deutsch$/i,          // Chrome desktop — warmest natural voice
      /^Google.*German/i,
      /Anna.*de[-_]DE/i,            // macOS / iOS premium DE female
      /Petra.*de[-_]DE/i,           // macOS DE female
      /Markus.*de[-_]DE/i,          // macOS DE male
      /Yannick.*de[-_]DE/i,         // macOS DE male
      /Microsoft.*Katja.*de[-_]DE/i,// Windows premium DE female
      /Microsoft.*Stefan.*de[-_]DE/i,
      /de[-_]DE/i,                  // any de-DE
      /^de/i,                        // any German
    ];
    for (const rx of preferred) {
      const hit = voices.find(v => rx.test(v.name) || rx.test(v.lang));
      if (hit) return hit;
    }
    return null;
  };

  useEffect(() => {
    if (!open || muted || !current?.speak) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(current.speak);
      u.lang = 'de-DE';
      u.rate = 0.94;   // slightly slower — coach-like, not announcer
      u.pitch = 0.95;  // slightly lower — warmer, more grounded
      u.volume = 1.0;
      const speakWithVoice = () => {
        const v = pickGermanVoice();
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      };
      if ((window.speechSynthesis.getVoices() || []).length) speakWithVoice();
      else window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
      utterRef.current = u;
    } catch { /* voice not available → silent tour still works */ }
    return () => {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    };
  }, [open, stepIdx, muted, current]);

  const close = (persist = true) => {
    setOpen(false);
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    }
    if (onDone) onDone();
  };

  const next = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else close(true);
  };
  const prev = () => setStepIdx(Math.max(0, stepIdx - 1));

  if (!open) return null;

  // Compute card position — under spotlight if it fits, otherwise centered.
  const cardStyle = (() => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const cardW = 380;
    const cardH = 260;
    const gap = 16;
    // Prefer right side of the target
    let left = rect.left + rect.width + gap;
    let top = rect.top;
    if (left + cardW > vw - 12) {
      // Not enough space on right — place below target, aligned left
      left = Math.min(rect.left, vw - cardW - 12);
      top = rect.top + rect.height + gap;
    }
    if (top + cardH > vh - 12) top = Math.max(12, vh - cardH - 12);
    if (top < 12) top = 12;
    if (left < 12) left = 12;
    return { top, left };
  })();

  const isLocked = current?.locked && current.locked(userTier);

  return createPortal(
    <div className="fixed inset-0 z-[9999]" data-testid="dashboard-first-tour">
      {/* Backdrop — darkened, with spotlight cutout when applicable */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: rect
            ? `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent ${Math.max(rect.width, rect.height) * 0.7}px, rgba(0,0,0,0.72) ${Math.max(rect.width, rect.height) * 0.85}px)`
            : 'rgba(0,0,0,0.68)',
          backdropFilter: rect ? 'none' : 'blur(2px)',
        }}
        onClick={() => close(true)}
      />

      {/* Spotlight ring */}
      {rect && (
        <div
          className="absolute pointer-events-none rounded-2xl transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 3px #BFFF00, 0 0 40px 12px rgba(191,255,0,0.35)',
          }}
        />
      )}

      {/* Wlad card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="absolute w-[92vw] max-w-[380px] bg-[#0A0A0A] text-white rounded-2xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.6)] border border-[#BFFF00]/25 overflow-hidden animate-fade-in"
        style={cardStyle}
        data-testid={`tour-card-${current.id}`}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] shadow-lg shadow-[#BFFF00]/25">
              <img src={WLAD_AVATAR} alt="Wlad" className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0A0A0A] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] font-black tracking-[0.16em] uppercase text-[#BFFF00] mb-0.5">
              {current.kicker}
            </div>
            <h3 id="tour-title" className="text-[16px] font-black leading-tight tracking-tight">
              {current.title}
            </h3>
          </div>
          <button
            onClick={() => close(true)}
            className="text-white/40 hover:text-white transition-colors -m-1 p-1"
            aria-label="Tour beenden"
            data-testid="tour-close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-[13px] text-white/75 leading-relaxed">
            {current.body}
          </p>
          {isLocked && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-[11px] font-bold text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Für dich als Free-User noch gesperrt — mit Leader-OS Plus freigeschaltet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(m => !m)}
              className="text-white/45 hover:text-white transition-colors -m-1 p-1"
              aria-label={muted ? 'Ton an' : 'Ton aus'}
              data-testid="tour-toggle-voice"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <span className="text-[10px] text-white/45 tabular-nums font-bold">
              {stepIdx + 1} / {steps.length}
            </span>
            {/* Progress bar */}
            <div className="w-16 h-[3px] rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#BFFF00] transition-all duration-300"
                style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <Button
                onClick={prev}
                variant="ghost"
                className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/[0.05] text-[12px] font-bold"
                data-testid="tour-prev"
              >
                <ArrowLeft size={13} className="mr-1" /> Zurück
              </Button>
            )}
            <Button
              onClick={next}
              className="h-8 px-3 bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black text-[12px]"
              data-testid="tour-next"
            >
              {stepIdx === steps.length - 1 ? (
                <>Fertig <Check size={13} className="ml-1" strokeWidth={3} /></>
              ) : (
                <>Weiter <ArrowRight size={13} className="ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DashboardFirstTour;

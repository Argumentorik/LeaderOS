import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Mail, Check } from 'lucide-react';
import { capture } from '../../lib/analytics';

// ───────────────────────────────────────────────────────────────────
// Lead-capture pipeline · mirrors LeadCaptureModal.
//   1. PostHog identify + capture('archetype_quiz_lead_captured')  (always works, primary store)
//   2. POST /api/leader-check/intent                                (Emergent → Supabase, best-effort)
// Never throws · funnel UX always continues.
// ───────────────────────────────────────────────────────────────────
const persistLead = async ({ email, archetype, source }) => {
  const trimmed = (email || '').trim();
  if (!trimmed) return;

  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try {
      window.posthog.identify(trimmed.toLowerCase());
      window.posthog.capture('archetype_quiz_lead_captured', {
        email: trimmed,
        archetype,
        source,
        campaign: 'leader-os-launch',
        surface: 'leader-os',
      });
    } catch { /* never block UX */ }
  }

  try {
    await fetch('/api/leader-check/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        source,
        campaign: 'leader-os-launch',
        archetype,
      }),
      keepalive: true,
    });
  } catch { /* swallow */ }
};

// Cross-domain distinct-id passthrough so the leader-os → leadercheck
// funnel stitches in PostHog without relying on email_lower alone.
const buildCtaUrl = (base, { archetype }) => {
  const url = new URL(base);
  url.searchParams.set('utm_source', 'leader-os-quiz');
  url.searchParams.set('utm_medium', 'archetype-cta');
  url.searchParams.set('utm_campaign', 'leader-os-launch');
  if (archetype) url.searchParams.set('archetype', archetype);
  try {
    const ph = typeof window !== 'undefined' ? window.posthog : null;
    const did = ph?.get_distinct_id?.();
    if (did) url.searchParams.set('ph_did', did);
  } catch { /* posthog not ready */ }
  return url.toString();
};

/**
 * ArchetypeQuizSection · der "Funnel-Magnet" der Landing.
 *
 * Typeform-style. 5 schnelle Fragen, ein Klick = eine Antwort, autoadvance.
 * Am Ende ein KI-Leadership-Archetyp + CTA in die tiefe Diagnose auf
 * leadercheck.de. Sektion ist absichtlich groß (min-h-screen) damit Besucher
 * beim Scrollen hineinrutschen und nicht raus können bevor sie ihren
 * Archetyp gesehen haben.
 *
 * Funnel-Strategie:
 *   leader-os.de Quiz (60s, Archetyp)
 *      → leadercheck.de Diagnose (5min, 30 Fragen)
 *      → leaderos.de Plattform (Sprint + Coaching)
 */

// ───────────────────────────────────────────────────────────────────
// Archetype map · 4 KI-Leadership-Profile.
// Jede Antwort verteilt 1 Punkt auf einen Archetyp. Höchster Score gewinnt.
//
// Jeder Archetyp erzählt eine ganze Geschichte:
//   essence       · wer du jetzt bist (2-3 Sätze)
//   gap           · was dich aufhält (Lime-Akzent)
//   diagnose[3]   · was leadercheck.de dir konkret zeigt
//   platform[3]   · was LeaderOS dir konkret liefert
//
// Ziel: nach dem Quiz hat der User verstanden was BEIDE Produkte sind
// und warum sie für ihn relevant sind. Nicht generisch.
// ───────────────────────────────────────────────────────────────────
const ARCHETYPES = {
  operator: {
    code: 'OP',
    title: 'Der Operator.',
    roleLabel: 'Operator',
    essence:
      'Du nutzt KI jeden Tag. Prompts tippst du so schnell wie du denkst. ' +
      'Aber dein Tag ist immer noch reaktiv, nicht systemisch · du jagst ' +
      'die nächste Aufgabe statt dass das System für dich arbeitet.',
    gap:
      'Was dir fehlt ist nicht noch ein Tool. Es ist die Architektur, die ' +
      'aus deinen tausend KI-Reflexen eine klare Führungs-Routine macht.',
    diagnose: [
      { title: 'KI-Reflex-Score',     body: 'Misst wie tief KI bereits in deinen Alltag eingebaut ist · und wo dein System hakt.' },
      { title: 'Hebel-Mapping',       body: 'Zeigt welche 3 Routinen den größten Multiplikator-Effekt für dich haben würden.' },
      { title: '30-Tage-Challenge-Match', body: 'Sagt dir ob Challenge 0001 für deinen Reifegrad passt oder ob du erst Grundlagen brauchst.' },
    ],
    platform: [
      { title: 'Daily Check-in',          body: 'Strukturiertes 10-Minuten-Ritual jeden Morgen · KI macht deinen Tagesplan, du entscheidest.' },
      { title: 'WladBot als Sparring',    body: 'Dein persönlicher KI-Coach kennt deine Ziele, deine Themen, deinen Stil.' },
      { title: 'Challenge 0001 · 30 Tage',   body: 'Strukturierter Pfad vom Reflex-Nutzer zum System-Operator. Klare Tagesziele, klare Drills.' },
    ],
  },
  kreator: {
    code: 'KR',
    title: 'Der Kreator.',
    roleLabel: 'Kreator',
    essence:
      'Du sprichst klar. Du ziehst Aufmerksamkeit. Deine Stimme ist dein ' +
      'Hebel. Aber die KI hinter den Kulissen ist noch nicht deine zweite ' +
      'Stimme · sie klingt nach allen anderen.',
    gap:
      'Was du brauchst ist KI-Drill der zu DEINER Tonalität passt, nicht ' +
      'generische Prompts die jeden Creator gleich klingen lassen.',
    diagnose: [
      { title: 'Voice-DNA-Mapping',     body: 'Analysiert deinen Schreib- und Sprechstil und sagt wo deine echte Signatur sitzt.' },
      { title: 'Skill-Tiefen-Score',    body: 'Misst wo du vom 80%-Standard-Output abweichst · dein eigentlicher Wettbewerbsvorteil.' },
      { title: 'Drill-Empfehlung',      body: 'Zeigt welche 3 Mikro-Drills deine KI-Stimme genau dort vertiefen wo dein Style sitzt.' },
    ],
    platform: [
      { title: '15-Minuten Mikro-Drills', body: 'Tägliche, fokussierte Übungen die hängen bleiben · nicht Theorie, sondern Muskel.' },
      { title: 'WladBot lernt deine DNA', body: 'Je länger du auf der Plattform bist, desto mehr klingt KI nach dir, nicht nach Standard.' },
      { title: 'Kreator-Community',       body: 'Lerne mit anderen Creatorn und Solo-Foundern, die KI als Verstärker ihrer Stimme nutzen.' },
    ],
  },
  visionaer: {
    code: 'VI',
    title: 'Der Visionär.',
    roleLabel: 'Visionär',
    essence:
      'Du siehst Bilder vor dir die andere noch nicht sehen können. ' +
      'Strategie ist dein Wohnzimmer. Aber zwischen Vision und dem was ' +
      'Donnerstag-Abend wirklich erledigt ist klafft Tag für Tag eine Lücke.',
    gap:
      'Was dir fehlt ist nicht eine bessere Vision. Es ist das System ' +
      'das deine Vision konsistent in tägliches Tun übersetzt · ohne ' +
      'dass du jeden Morgen wieder von vorne anfängst.',
    diagnose: [
      { title: 'Vision-zu-Tag-Score',        body: 'Zeigt wo zwischen deinem Kopf und deinem Tag die meiste Energie verdunstet.' },
      { title: 'Konsistenz-Index',           body: 'Misst wie stabil deine Vision sich in tatsächlichem Output zeigt · über Wochen, nicht Tage.' },
      { title: 'Architektur-Standortbestimmung', body: 'Sagt dir ob du erst System brauchst oder bereit bist zu skalieren.' },
    ],
    platform: [
      { title: 'Visions-Playbooks',          body: 'Frameworks für Strategie-Sprints, Quartalsplanung, KI-Roadmaps die wirklich landen.' },
      { title: 'Wochen-Sprint-Rituale',      body: 'Strukturierte Rhythmen die deine Vision in tägliche Realität übersetzen · egal ob solo oder mit Team.' },
      { title: '1:1-Mentoring',          body: 'Persönliche Sparring-Calls für Strategen die ihre Architektur schärfen wollen.' },
    ],
  },
  leader: {
    code: 'LD',
    title: 'Die Leaderin · Der Leader.',
    roleLabel: 'Leader',
    essence:
      'Du führst schon vorausschauend · egal ob ein Team, ein Projekt, ' +
      'eine Audience oder dich selbst. Du wartest nicht auf Klarheit, ' +
      'du machst sie. Deine Entscheidungen sind nicht reaktiv. Was jetzt ' +
      'zählt ist nicht Aufholen · sondern Beschleunigen.',
    gap:
      'Was dich auf die nächste Stufe bringt ist nicht noch mehr Wissen. ' +
      'Es ist Austausch auf Augenhöhe · und ein System das deinen Tag ' +
      'schon kennt bevor du ihn anfängst.',
    diagnose: [
      { title: 'Wirkungs-Index',           body: 'Misst wie weit dein Output bereits andere prägt · Kollegen, Klienten, Markt, Umfeld.' },
      { title: 'Reife-Standortbestimmung', body: 'Zeigt klar in welcher der 5 Leader-Stufen du stehst und was der nächste Schritt ist.' },
      { title: 'Format-Empfehlung',        body: 'Sagt dir mit welchem Format (Challenge, Coaching, Peer-Community) du am schnellsten vorankommst.' },
    ],
    platform: [
      { title: 'Deine Peer-Community',       body: 'Lerne mit anderen Führungskräften die vorausgehen statt nachzulaufen · echter Austausch auf Augenhöhe.' },
      { title: 'Beschleunigte Challenge',     body: 'Strukturierter 30-Tage-Pfad für Erfahrene · direkt auf Wirkung, nicht Aufholen.' },
      { title: '1:1-Mentoring',     body: 'Persönliche Sparring-Calls auf Augenhöhe. Strategie, Beschleunigung, Vermächtnis.' },
    ],
  },
};

// ───────────────────────────────────────────────────────────────────
// Questions · jede Antwort hat einen Archetype-Tag.
// Reihenfolge bewusst: leicht → tief, damit Momentum hält.
// ───────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    bib: '01',
    q: 'Wie oft nutzt du KI für echte Entscheidungen?',
    sub: 'Nicht für Memes. Für Strategie, Kommunikation, Planung.',
    options: [
      { label: 'Täglich, ich denke mit KI', tag: 'operator' },
      { label: 'Wöchentlich, an Schlüsselstellen', tag: 'leader' },
      { label: 'Selten, eher zum Testen', tag: 'visionaer' },
      { label: 'Fast nie, ich kommuniziere lieber direkt', tag: 'kreator' },
    ],
  },
  {
    bib: '02',
    q: 'Was beschreibt deine Rolle am besten?',
    sub: 'Egal welcher Titel · was tust du wirklich am Tag.',
    options: [
      { label: 'Founder oder CEO · ich setze die Richtung', tag: 'visionaer' },
      { label: 'Manager oder Team-Lead · ich führe Menschen', tag: 'leader' },
      { label: 'Senior IC · ich liefere Substanz', tag: 'operator' },
      { label: 'Creator oder Solo · ich baue meine Audience', tag: 'kreator' },
    ],
  },
  {
    bib: '03',
    q: 'Wo liegt dein größter Hebel-Bereich?',
    sub: 'Wenn das eine Sache besser würde, hätte alles andere mehr Effekt.',
    options: [
      { label: 'Strategie und Klarheit', tag: 'visionaer' },
      { label: 'Skill-Tiefe in KI', tag: 'operator' },
      { label: 'Kommunikation und Wirkung', tag: 'kreator' },
      { label: 'Netzwerk und Sparring', tag: 'leader' },
    ],
  },
  {
    bib: '04',
    q: 'Was hält dich am meisten zurück?',
    sub: 'Sei ehrlich. Nur die ehrliche Antwort zählt.',
    options: [
      { label: 'Zeit · alles bleibt liegen', tag: 'operator' },
      { label: 'Methodik · ich weiß nicht wo anfangen', tag: 'kreator' },
      { label: 'Team · alleine geht es nicht weiter', tag: 'leader' },
      { label: 'Klarheit · zu viele Optionen', tag: 'visionaer' },
    ],
  },
  {
    bib: '05',
    q: 'Was würde dich in den nächsten 90 Tagen am meisten weiterbringen?',
    sub: 'Das wonach du heute hungrig bist.',
    options: [
      { label: 'Ein System das jeden Tag liefert', tag: 'operator' },
      { label: 'Drill und Methodik die hängen bleibt', tag: 'kreator' },
      { label: 'Architektur die mein Team trägt', tag: 'visionaer' },
      { label: 'Eine Community die mich pusht', tag: 'leader' },
    ],
  },
];

const TOTAL = QUESTIONS.length;

function scoreToArchetype(answers) {
  const counts = { operator: 0, kreator: 0, visionaer: 0, leader: 0 };
  for (const a of answers) counts[a] = (counts[a] || 0) + 1;
  let best = 'operator';
  let max = -1;
  for (const k of Object.keys(counts)) {
    if (counts[k] > max) {
      max = counts[k];
      best = k;
    }
  }
  return ARCHETYPES[best];
}

const FADE = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' } },
};

export const ArchetypeQuizSection = () => {
  const [step, setStep] = useState(0); // 0..TOTAL-1, then TOTAL = result
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState('');
  const completionFired = useRef(false);

  const isResult = step >= TOTAL;
  const archetype = useMemo(() => (isResult ? scoreToArchetype(answers) : null), [isResult, answers]);
  const progress = Math.min(step / TOTAL, 1);

  // Fire archetype_quiz_completed exactly once when the result first renders.
  // useEffect because we need to read the computed archetype, not the raw answers.
  useEffect(() => {
    if (!isResult || !archetype || completionFired.current) return;
    completionFired.current = true;
    capture('archetype_quiz_completed', {
      archetype: archetype.code,
      archetype_title: archetype.title,
      answers,
      surface: 'leader-os',
    });
  }, [isResult, archetype, answers]);

  const pickAnswer = (tag) => {
    const nextAnswers = [...answers, tag];
    // First answer = quiz_started; every answer = quiz_answered.
    if (answers.length === 0) {
      capture('archetype_quiz_started', { surface: 'leader-os' });
    }
    capture('archetype_quiz_answered', {
      step: step + 1,
      total: TOTAL,
      archetype_tag: tag,
      surface: 'leader-os',
    });
    setAnswers(nextAnswers);
    setStep(step + 1);
  };

  const restart = () => {
    capture('archetype_quiz_restarted', { surface: 'leader-os' });
    setAnswers([]);
    setStep(0);
    setEmail('');
    setLeadSent(false);
    setLeadError('');
    completionFired.current = false;
  };

  const submitLead = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setLeadError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setLeadError('');
    await persistLead({
      email: trimmed,
      archetype: archetype?.code,
      source: 'leader-os-archetype-quiz',
    });
    setLeadSent(true);
  };

  const handleCtaClick = (destination) => {
    capture('archetype_quiz_cta_clicked', {
      destination,
      archetype: archetype?.code,
      had_email: leadSent,
      surface: 'leader-os',
    });
  };

  return (
    <section
      id="archetyp"
      data-testid="archetype-quiz-section"
      aria-label="KI-Leadership Archetyp Quiz"
      className="relative border-y-2 border-black/[0.06] bg-background"
    >
      {/* Scarcity-strip + Eyebrow */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 pt-20 md:pt-28 pb-6">
        <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55">
          <span className="text-brand-strong">▸ SCHRITT 01 · ARCHETYP-TEASER</span>
          <span className="opacity-30">·</span>
          <span>60 SEKUNDEN · 5 FRAGEN</span>
          <span className="opacity-30 hidden md:inline">·</span>
          <span className="hidden md:inline text-foreground/40">FÜHRT ZUM ECHTEN CHECK AUF LEADERCHECK.DE</span>
        </div>
        <h2
          className="text-[40px] sm:text-[64px] md:text-[88px] leading-[0.92] tracking-[-0.04em]"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Welche Art von KI-Leader<br />
          <span className="text-foreground/55">bist du wirklich</span>
          <span className="text-brand not-italic">?</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-[1.6] text-foreground/70">
          Das ist der <strong className="text-foreground">60-Sekunden-Schnelltest</strong>.
          Fünf Fragen, ein Archetyp, ein konkreter Hinweis worauf du als nächstes
          schaust. Der vollständige Check · deine Opportunities, dein Lernpfad
          in KI, dein 30-Tage-Plan · wartet danach auf{' '}
          <span className="font-mono text-[15px] text-brand-strong font-bold">leadercheck.de</span>.
        </p>
      </div>

      {/* Quiz-Card */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 pb-24 md:pb-32">
        <div className="relative border-2 border-black bg-background overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-black/[0.06]">
            <motion.div
              className="h-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress * 100, isResult ? 100 : 4)}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="p-8 md:p-14 min-h-[480px] md:min-h-[560px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {!isResult ? (
                <motion.div
                  key={`q-${step}`}
                  variants={FADE}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-7 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
                    <span>FRAGE {QUESTIONS[step].bib} · {step + 1} / {TOTAL}</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>

                  <h3
                    className="text-[28px] sm:text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.03em] text-foreground"
                    style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                  >
                    {QUESTIONS[step].q.replace(/\?$/, '')}<span className="text-brand not-italic">?</span>
                  </h3>
                  <p className="mt-3 text-[14px] md:text-[15px] text-foreground/55 leading-relaxed max-w-xl">
                    {QUESTIONS[step].sub}
                  </p>

                  <div className="mt-8 grid sm:grid-cols-2 gap-3 md:gap-4">
                    {QUESTIONS[step].options.map((opt, i) => (
                      <motion.button
                        key={opt.label}
                        type="button"
                        onClick={() => pickAnswer(opt.tag)}
                        data-testid={`archetype-answer-${step}-${i}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        className="group relative text-left p-5 md:p-6 border-2 border-black bg-background hover:bg-brand/15 transition-colors"
                      >
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40 group-hover:text-foreground/60">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="block mt-2 text-[15px] md:text-[16.5px] font-semibold leading-[1.35] text-foreground">
                          {opt.label}
                        </span>
                        <ArrowRight
                          size={16}
                          className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-strong"
                        />
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                    <span>Wlad · 400 000 Coachings</span>
                    <span className="opacity-30">·</span>
                    <span className="hidden md:inline">Keine Email · Kein Login</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  variants={FADE}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-7 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
                    <span className="text-brand-strong">▸ DEIN ARCHETYP · {archetype.code}</span>
                    <button
                      type="button"
                      onClick={restart}
                      className="flex items-center gap-1.5 text-foreground/45 hover:text-foreground transition-colors"
                      data-testid="archetype-restart"
                    >
                      <RotateCcw size={11} /> NEU STARTEN
                    </button>
                  </div>

                  <h3
                    className="text-[40px] sm:text-[64px] md:text-[84px] leading-[0.92] tracking-[-0.04em] text-foreground"
                    style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                  >
                    {archetype.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
                  </h3>

                  {/* ── Essence: "Das bist du" ── */}
                  <p className="mt-7 max-w-3xl text-[18px] md:text-[22px] leading-[1.5] text-foreground/85">
                    {archetype.essence}
                  </p>

                  {/* ── Gap: "Hier sitzt dein Hebel" · Lime-akzentuiert ── */}
                  <div className="mt-7 max-w-3xl border-l-[3px] border-brand pl-5 py-2 bg-brand/5">
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-brand-strong">
                      ▸ HIER SITZT DEIN HEBEL
                    </span>
                    <p className="mt-2 text-[16px] md:text-[18px] text-foreground leading-[1.5] font-semibold">
                      {archetype.gap}
                    </p>
                  </div>

                  {/* ── SCHRITT 02 · LEADERCHECK · was die Diagnose dir zeigt ── */}
                  <div className="mt-10 max-w-3xl border-2 border-black bg-black text-white p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand">
                      <span>▸ SCHRITT 02</span>
                      <span className="opacity-40">·</span>
                      <span className="text-white/60">LEADERCHECK.DE · DIE DIAGNOSE</span>
                    </div>
                    <h4
                      className="text-[26px] md:text-[34px] leading-[1.05] tracking-[-0.03em]"
                      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                    >
                      Das war der Teaser.<br />
                      <span className="text-white/55">Jetzt der echte Check</span>
                      <span className="text-brand not-italic">.</span>
                    </h4>
                    <p className="mt-4 text-[14px] md:text-[15.5px] leading-[1.6] text-white/75 max-w-2xl">
                      5 Minuten · 30 Fragen · kostenlos · ohne Abo. Zugeschnitten auf
                      dein Profil als <strong className="text-white">{archetype.roleLabel}</strong>:
                    </p>
                    <ul className="mt-5 grid sm:grid-cols-3 gap-4 md:gap-5">
                      {archetype.diagnose.map((it, i) => (
                        <li key={it.title} className="border-l-2 border-brand/70 pl-4">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand">
                            {String(i + 1).padStart(2, '0')} · {it.title}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-[1.5] text-white/75">
                            {it.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ── SCHRITT 03 · LEADEROS · was die Plattform dir liefert ── */}
                  <div className="mt-6 max-w-3xl border-2 border-black bg-background text-foreground p-6 md:p-8 relative">
                    {/* Lime corner tag */}
                    <div className="absolute -top-[2px] left-6 bg-brand text-black px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
                      ▸ DANACH · LEADEROS
                    </div>
                    <div className="flex items-center gap-2 mb-4 mt-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55">
                      <span>SCHRITT 03</span>
                      <span className="opacity-40">·</span>
                      <span>DIE PLATTFORM · WO ES PASSIERT</span>
                    </div>
                    <h4
                      className="text-[26px] md:text-[34px] leading-[1.05] tracking-[-0.03em] text-foreground"
                      style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
                    >
                      Leader<span className="text-brand not-italic">·</span>OS<br />
                      <span className="text-foreground/55">für dich als {archetype.roleLabel}</span>
                      <span className="text-brand not-italic">.</span>
                    </h4>
                    <p className="mt-4 text-[14px] md:text-[15.5px] leading-[1.6] text-foreground/70 max-w-2xl">
                      Die Plattform die deine Diagnose in tägliche Routine übersetzt.
                      Was dich konkret erwartet wenn du nach dem Check rein gehst:
                    </p>
                    <ul className="mt-5 grid sm:grid-cols-3 gap-4 md:gap-5">
                      {archetype.platform.map((it, i) => (
                        <li key={it.title} className="border-l-2 border-foreground/30 pl-4">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-strong">
                            {String(i + 1).padStart(2, '0')} · {it.title}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-[1.5] text-foreground/75">
                            {it.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 pt-5 border-t border-foreground/12 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
                      <span>▸ DEIN LEADER-CHECK ENTSCHEIDET</span>
                      <span>▸ 14 TAGE KOSTENLOS TESTEN</span>
                      <span>▸ COACHING MIT WLAD</span>
                    </div>
                  </div>

                  {/* ── Optionale Email-Capture vor dem CTA ──
                      Sanfter Ask AFTER Value-Delivery. Wer einträgt landet sofort
                      als Lead in PostHog + /api/leader-check/intent. Wer skippt
                      kann trotzdem den Check starten · dort wird die E-Mail eh
                      noch erhoben. Doppelte Versicherung gegen Lead-Loss. */}
                  <div className="mt-8 max-w-2xl border-2 border-black bg-background p-5 md:p-6">
                    {leadSent ? (
                      <div
                        className="flex items-center gap-3 text-foreground"
                        data-testid="archetype-lead-sent"
                      >
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-brand text-black">
                          <Check size={16} strokeWidth={3} />
                        </span>
                        <div>
                          <div className="font-bold text-[14px] md:text-[15px]">
                            Notiert. Du kriegst dein Archetyp-Profil per Mail.
                          </div>
                          <div className="text-[12px] text-foreground/55 mt-0.5">
                            Jetzt direkt zum vollständigen Check für deinen Lernpfad.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={submitLead} className="flex flex-col gap-3" data-testid="archetype-lead-form">
                        <label className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-foreground/55 flex items-center gap-2">
                          <Mail size={11} /> OPTIONAL · ARCHETYP-PROFIL PER MAIL
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setLeadError(''); }}
                            placeholder="deine@email.de"
                            data-testid="archetype-lead-email"
                            className="flex-1 h-12 px-4 border-2 border-black bg-background text-foreground text-[15px] font-semibold focus:outline-none focus:bg-brand/10 placeholder:text-foreground/35"
                          />
                          <button
                            type="submit"
                            data-testid="archetype-lead-submit"
                            className="h-12 px-6 border-2 border-black bg-foreground hover:bg-brand text-background hover:text-black font-bold text-[13px] tracking-[0.02em] transition-colors whitespace-nowrap"
                          >
                            Profil senden
                          </button>
                        </div>
                        {leadError && (
                          <p className="text-[12px] text-red-500" data-testid="archetype-lead-error">{leadError}</p>
                        )}
                        <p className="text-[11.5px] text-foreground/45 leading-[1.45]">
                          Nur dein Archetyp-Profil + 1 Mail zum Lernpfad-Start.
                          Kein Newsletter-Spam, jederzeit abbestellbar.
                        </p>
                      </form>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <a
                      href={buildCtaUrl('https://leadercheck.de', { archetype: archetype.code })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleCtaClick('leadercheck.de')}
                      data-testid="archetype-cta-diagnose"
                      className="group inline-flex items-center gap-3 px-7 md:px-9 h-16 bg-brand hover:bg-brand-strong text-black font-bold text-[15px] md:text-[16px] tracking-[0.02em] transition-colors shadow-[6px_6px_0_0_#000]"
                    >
                      Vollständigen Check starten
                      <span className="font-mono text-[11px] font-bold opacity-70">→ LEADERCHECK.DE</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
                      5 MIN · 30 FRAGEN · KOSTENLOS · KEIN ABO
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coda · micro social-proof */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45">
          <span>▸ 3× SPIEGEL-BESTSELLER</span>
          <span>▸ 400 000 KUNDEN</span>
          <span>▸ LEADER-CHECK · 10 MIN · KOSTENLOS</span>
        </div>
      </div>
    </section>
  );
};

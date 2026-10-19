import { ArrowRight, Lock, Sparkles } from 'lucide-react';

/**
 * ClassesRoadmapSection · Bonus-Strecke: Was alles noch kommt.
 *
 * Diese Section sitzt NACH dem PlatformValueSection (das den primären
 * Sprint-Value verkauft). Hier zeigen wir dem User: "Du bekommst aber
 * nicht nur die Foundation · wer bei LeaderOS startet, hat Zugang zu
 * drei weiteren Stufen die noch kommen." Das macht das Angebot dichter
 * ohne das Hauptversprechen zu verwässern.
 *
 *   0001 Foundation       → bereits in PlatformValueSection erklärt,
 *                           hier nur als kurzer "wo du startest"-Anker
 *   0002 AI Agents Builder
 *   0003 Custom AI Setup
 *   0004 Revenue Skills
 *
 * Position auf der Landing: nach PlatformValueSection, vor TrackField.
 */

const FUTURE_CLASSES = [
  {
    code: '0002',
    name: 'AI Agents Builder',
    status: 'comingSoon',
    subtitle: 'Deine eigenen KI-Agenten bauen.',
    promise:
      'Schritt-für-Schritt: vom ersten Custom-GPT bis zu Multi-Agent-' +
      'Workflows die dir Arbeit abnehmen · ohne dass du Developer wirst.',
    outcome: 'Drei eigene Agenten am Ende der Stufe · produktiv im Einsatz.',
    pillars: ['Agent-Patterns', 'Tool-Use', 'Multi-Agent Workflows', 'Production-Ops'],
    seats: 'STARTET Q3 · WARTELISTE OFFEN',
  },
  {
    code: '0003',
    name: 'Custom AI Setup',
    status: 'comingSoon',
    subtitle: 'Dein persönliches KI-Studio.',
    promise:
      'Wir designen dein KI-Setup auf deinen tatsächlichen Job zu · ' +
      'Tools, Prompts, Wissens-Basen, Integrationen. Nicht generisch, ' +
      'nicht für 80 % · für DICH.',
    outcome: 'Dein KI-Studio läuft. Replizierbar. Skalierbar.',
    pillars: ['Tool-Stack-Audit', 'Custom Knowledge Base', 'Workflow-Design', 'Integration'],
    seats: 'STARTET Q4 · WARTELISTE OFFEN',
  },
  {
    code: '0004',
    name: 'Revenue Skills',
    status: 'planned',
    subtitle: 'KI für mehr Umsatz.',
    promise:
      'Konkrete KI-Skills für die Revenue-Side: Pricing, Verhandlung, ' +
      'Vertriebs-Sequenzen, Pitch-Generation, Closing-Drills mit KI als Sparring.',
    outcome: 'Mess­barer Umsatz-Impact auf deine Pipeline.',
    pillars: ['KI-Pricing', 'KI-Verhandlung', 'Pipeline-Sequences', 'Closing-Drills'],
    seats: '2027 · INTERESSE BEKUNDBAR',
  },
];

const StatusBadge = ({ status }) => {
  if (status === 'comingSoon') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/40 text-white/75 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
        COMING SOON
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/20 text-white/45 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
      <Lock size={9} /> 2027
    </span>
  );
};

const ClassCard = ({ klass }) => (
  <div
    data-testid={`class-${klass.code}`}
    className="relative border-2 border-white/15 bg-white/[0.03] text-white p-6 md:p-7 transition-colors hover:bg-white/[0.06]"
  >
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand">
          ▸ STUFE · {klass.code}
        </div>
        <h3
          className="mt-1.5 text-[24px] md:text-[28px] leading-[1.04] tracking-[-0.03em]"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          {klass.name}<span className="text-brand not-italic">.</span>
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-white/65">
          {klass.subtitle}
        </p>
      </div>
      <StatusBadge status={klass.status} />
    </div>

    <p className="text-[13.5px] md:text-[14.5px] leading-[1.55] text-white/70">
      {klass.promise}
    </p>

    <div className="mt-4 pt-3 border-t border-white/10">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] mb-2 text-brand/85">
        ▸ ERGEBNIS
      </div>
      <p className="text-[13px] font-semibold leading-[1.45] text-white/90">
        {klass.outcome}
      </p>
    </div>

    <ul className="mt-4 flex flex-wrap gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-white/55">
      {klass.pillars.map((p) => (
        <li key={p} className="px-2 py-1 border border-white/15">
          {p}
        </li>
      ))}
    </ul>

    <div className="mt-5 flex items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
      <span>{klass.seats}</span>
      <span className="inline-flex items-center gap-1.5 text-white/60">
        <Sparkles size={11} /> Lifetime-Zugang inklusive
      </span>
    </div>
  </div>
);

export const ClassesRoadmapSection = () => (
  <section
    id="klassen"
    data-testid="classes-roadmap-section"
    aria-label="Bonus · Was bei LeaderOS noch alles auf dich wartet"
    className="border-y-2 border-black/[0.06] bg-[#0A0A0A] text-white relative overflow-hidden"
  >
    {/* Subtle lime ambient · softer than before since this is a secondary section */}
    <div
      aria-hidden
      className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(191,255,0,0.08) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }}
    />

    <div className="relative max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
      {/* Bonus-framing header */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-end mb-12 md:mb-16">
        <div className="md:col-span-7">
          <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand">
            <span>▸ BONUS · ROADMAP</span>
            <span className="opacity-30">·</span>
            <span className="text-white/55">ALLES INKLUSIVE · AB TAG 1</span>
          </div>
          <h2
            className="text-[36px] sm:text-[52px] md:text-[68px] leading-[0.94] tracking-[-0.038em]"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Ein Platz<span className="text-brand not-italic">.</span><br />
            <span className="text-white/55">Vier Stufen</span>
            <span className="text-brand not-italic">.</span>
          </h2>
        </div>
        <div className="md:col-span-5 md:pb-3">
          <p className="text-[15px] md:text-[16.5px] leading-[1.6] text-white/75">
            Wer bei LeaderOS startet, bekommt automatisch
            <strong className="text-white"> Zugang zu allem was noch kommt</strong> ·
            AI Agents Builder, Custom AI Setup, Revenue Skills. Ein Pfad,
            vier Stufen · alle Vorteile ab Tag 1.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 bg-brand text-black font-mono text-[10.5px] font-bold uppercase tracking-[0.22em]">
            <Sparkles size={12} />
            MITGLIEDER · LIFETIME-ZUGANG
          </div>
        </div>
      </div>

      {/* 3-up bonus-classes grid */}
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {FUTURE_CLASSES.map((klass) => (
          <ClassCard key={klass.code} klass={klass} />
        ))}
      </div>

      {/* Soft anchor back to the Sprint CTA · no giant block this time, just a one-liner */}
      <div className="mt-12 md:mt-14 pt-7 border-t border-white/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <p className="text-[14px] md:text-[15.5px] leading-[1.5] text-white/70 max-w-2xl">
          Du startest mit der vollen LeaderOS-Plattform.
          Alles andere kommt automatisch dazu.
        </p>
        <a
          href="#pricing"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('pricing');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          data-testid="roadmap-cta"
          className="inline-flex items-center gap-2 px-5 h-12 bg-brand hover:bg-white text-black font-bold text-[12.5px] tracking-[0.04em] transition-colors whitespace-nowrap"
        >
          JETZT DABEI SEIN
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  </section>
);

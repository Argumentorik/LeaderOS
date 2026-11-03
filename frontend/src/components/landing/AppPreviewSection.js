import { motion } from 'framer-motion';
import { PlusCircleCTA } from './PlusCircleCTA';

/**
 * AppPreviewSection · "Was siehst du, wenn du drinnen bist?".
 *
 * Drei Specimen-Mockups die das Produkt-Innere zeigen: das
 * Dashboard (heutige Mission + Fortschritt), die Video-Mission
 * (Lektion + Drill) und der Context-Layer (was der Bot über dich
 * weiß und warum die Antwort dadurch persönlich wird).
 *
 * Echte Screenshots wären besser, sind aber noch nicht
 * launch-ready. Bis dahin rendern wir die Mockups typografisch
 * im selben Athletic-Editorial-Stil wie der Rest der Page ·
 * konsistenter Look ist wichtiger als Foto-Realismus.
 */

// ─── Mockup 1 · Dashboard "TAG 07" ──────────────────────────────
const DashboardMock = () => (
  <div className="aspect-[4/3] bg-white text-black border border-foreground/15 overflow-hidden flex flex-col">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/10 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-brand text-[9px] font-black">W</span>
        <span>LEADER·OS · DASHBOARD</span>
      </div>
      <span>TAG 07 / 30</span>
    </div>
    <div className="flex-1 p-5 grid grid-cols-12 gap-3">
      <div className="col-span-12">
        <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-foreground/45 mb-1">▸ HEUTE</div>
        <div
          className="text-[22px] sm:text-[24px] leading-[1.05] tracking-[-0.02em]"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
        >
          Feedback-Formel.<br />
          <span className="text-foreground/45">Drill 03.</span>
          <span className="text-brand">.</span>
        </div>
      </div>
      <div className="col-span-7 border-t border-foreground/10 pt-3 space-y-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/55">
        <div className="flex justify-between"><span>FRAMEWORK</span><span className="text-foreground">Feedback (3 Sätze)</span></div>
        <div className="flex justify-between"><span>DRILL</span><span className="text-foreground">Echte 1:1-Situation</span></div>
        <div className="flex justify-between"><span>DAUER</span><span className="text-foreground">12 MIN</span></div>
        <div className="flex justify-between"><span>STREAK</span><span className="text-brand">▸ 7 TAGE</span></div>
      </div>
      <div className="col-span-5 border-t border-foreground/10 pt-3 flex flex-col items-end justify-between">
        <div className="w-full h-1 bg-foreground/10">
          <div className="h-1 bg-brand" style={{ width: '23%' }} />
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-foreground/55">
          23 % VON DER CHALLENGE
        </div>
        <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
          <span className="w-5 h-5 rounded-full bg-brand inline-flex items-center justify-center font-black">+</span>
          Drill starten
        </div>
      </div>
    </div>
  </div>
);

// ─── Mockup 2 · Video-Mission "LEKTION 12" ─────────────────────
const VideoMissionMock = () => (
  <div className="aspect-[4/3] bg-[#0A0A0A] text-white border border-white/10 overflow-hidden flex flex-col">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-[9px] font-bold uppercase tracking-[0.22em] text-white/55 font-mono">
      <span>LEADER·OS · LERNVIDEOS</span>
      <span className="text-brand">LEKTION 12 / 91</span>
    </div>
    <div className="flex-1 grid grid-cols-12">
      <div className="col-span-7 relative bg-[url('https://picsum.photos/seed/leader-os-mission-wlad/640/480?grayscale')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-brand text-black flex items-center justify-center font-black text-2xl">▶</div>
        </div>
        <div className="absolute bottom-3 left-3 text-[9px] font-mono uppercase tracking-[0.18em] text-white/75">
          ▸ WLAD · 8 MIN
        </div>
      </div>
      <div className="col-span-5 p-4 flex flex-col gap-3">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-brand mb-1">▸ MISSION 12</div>
          <div
            className="text-[18px] leading-[1.1] tracking-[-0.02em]"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
          >
            Dunkle Rhetorik<br />
            <span className="text-white/55">erkennen</span>
            <span className="text-brand">.</span>
          </div>
        </div>
        <div className="space-y-1 text-[9px] font-mono uppercase tracking-[0.16em] text-white/55 mt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand text-black text-[8px] flex items-center justify-center font-black">✓</span>
            <span>Theorie · 4 Min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand text-black text-[8px] flex items-center justify-center font-black">✓</span>
            <span>Drill · 12 Min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/40" />
            <span className="text-white/40">Reflexion · offen</span>
          </div>
        </div>
        <div className="mt-auto text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
          LEADER · OS · INDIVIDUELL
        </div>
      </div>
    </div>
  </div>
);

// ─── Mockup 3 · Context-Layer "Was der Bot über dich weiß" ─────
const ContextLayerMock = () => (
  <div className="aspect-[4/3] bg-white text-black border border-foreground/15 overflow-hidden flex flex-col">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/10 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono">
      <span>WLADBOT · CONTEXT-LAYER</span>
      <span className="text-brand">PRIVAT · NUR DU</span>
    </div>
    <div className="flex-1 p-4 grid grid-cols-12 gap-3">
      <div className="col-span-12">
        <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-foreground/45 mb-1">▸ WAS WLADBOT ÜBER DICH WEISS</div>
        <div
          className="text-[16px] sm:text-[18px] leading-[1.1] tracking-[-0.02em]"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
        >
          Deine Schicht.<br />
          <span className="text-foreground/45">Dein Kontext.</span>
          <span className="text-brand">.</span>
        </div>
      </div>
      <ul className="col-span-12 space-y-1.5 border-t border-foreground/10 pt-2 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/65">
        <li className="grid grid-cols-12 gap-2">
          <span className="col-span-3 text-foreground/45">ROLLE</span>
          <span className="col-span-9 text-foreground">Head of Engineering · 7 Direct Reports</span>
        </li>
        <li className="grid grid-cols-12 gap-2">
          <span className="col-span-3 text-foreground/45">CHECK</span>
          <span className="col-span-9 text-foreground">KI 78 · Rhetorik 64 · EQ 81</span>
        </li>
        <li className="grid grid-cols-12 gap-2">
          <span className="col-span-3 text-foreground/45">FOKUS</span>
          <span className="col-span-9 text-foreground">Schwierige 1:1s · Feedback</span>
        </li>
        <li className="grid grid-cols-12 gap-2">
          <span className="col-span-3 text-foreground/45">DRILLS</span>
          <span className="col-span-9 text-foreground">06 abgeschlossen · letzte: SEXIER</span>
        </li>
        <li className="grid grid-cols-12 gap-2">
          <span className="col-span-3 text-foreground/45">TONE</span>
          <span className="col-span-9 text-foreground">Direkt · ruhig · Du-Form</span>
        </li>
      </ul>
      <div className="col-span-12 border-t border-foreground/10 pt-2 text-[9px] font-mono uppercase tracking-[0.18em] text-foreground/45 flex items-center justify-between">
        <span>▸ Jede Antwort nutzt diese Schicht</span>
        <span className="text-brand">EDIT ↗</span>
      </div>
    </div>
  </div>
);

const TILES = [
  {
    code: 'DASHBOARD',
    label: 'Deine Challenge, jeden Tag.',
    body: 'Eine Aufgabe pro Tag. Streak-Counter. Fortschritts-Balken. Kein Karussell-Overload. Du weißt was heute dran ist.',
    Mock: DashboardMock,
  },
  {
    code: 'MISSION',
    label: 'Lernvideo + Drill.',
    body: '91 Missionen, gebaut von Wlad. Theorie kurz, Drill konkret. Jede Mission endet mit einer Reflexions-Frage, die der Bot später aufgreift.',
    Mock: VideoMissionMock,
  },
  {
    code: 'CONTEXT',
    label: 'Der Coach, der dich kennt.',
    body: 'WladBot antwortet nicht generisch. Er kennt deinen Check-Score, deine Rolle, deine Drills, deinen Ton. Jede Antwort liegt auf dieser Schicht.',
    Mock: ContextLayerMock,
  },
];

export const AppPreviewSection = () => (
  <section
    id="app-preview"
    className="relative w-full bg-background overflow-hidden border-t border-foreground/10"
    aria-label="Wie sieht LeaderOS von innen aus?"
    data-testid="landing-app-preview"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-14 md:mb-20"
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
          ▸ INNEN-ANSICHT · SO SIEHT ES AUS WENN DU DRIN BIST
        </p>
        <h2
          className="text-[44px] sm:text-[64px] md:text-[88px] leading-[0.92] tracking-[-0.04em] text-foreground"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Kein Kurs.<br />
          <span className="text-foreground/55">Ein Trainingsplatz</span>
          <span className="text-brand not-italic">.</span>
        </h2>
        <p className="mt-8 max-w-2xl text-[15px] md:text-[17px] leading-[1.55] text-foreground/70">
          Drei Räume: das Dashboard, die Lernmissionen, der Context-
          Bereich. Jeder Raum bringt dich näher an die Führungskraft, die
          du werden willst. Nichts davon ist Show. Alles davon
          arbeitet täglich für dich.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-10">
        {TILES.map(({ code, label, body, Mock }, i) => (
          <motion.div
            key={code}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <Mock />
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-brand font-mono mb-2">
                ▸ {code}
              </p>
              <h3
                className="text-[22px] md:text-[26px] leading-[1.1] tracking-[-0.02em] text-foreground"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
              >
                {label.replace(/\.$/, '')}<span className="text-brand">.</span>
              </h3>
              <p className="mt-3 text-[14px] leading-[1.55] text-foreground/65">
                {body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 md:mt-20 pt-8 border-t border-foreground/10 flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
        <p className="max-w-xl text-[14px] leading-[1.55] text-foreground/65">
          Wenn du sehen willst wie das in deiner Realität aussieht,
          buch dir 20 Minuten mit dem Team. Live-Demo, deine Fragen,
          dein Use-Case.
        </p>
        <PlusCircleCTA
          href="https://cal.com/leaderos/demo"
          testId="app-preview-demo"
          halo={false}
        >
          Demo buchen · 20 Min
        </PlusCircleCTA>
      </div>
    </div>
  </section>
);

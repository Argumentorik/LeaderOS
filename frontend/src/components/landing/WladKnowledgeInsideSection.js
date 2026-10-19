import { BookText, Layers, MessagesSquare, Compass, Zap, Crown } from 'lucide-react';

/**
 * WladKnowledgeInsideSection · was steckt von Wlad in LeaderOS drin.
 *
 * Direkter Nachsatz zur WladAuthoritySection. Antwort auf die Frage
 * "okay, der Mann ist krass · aber was kommt davon bei MIR an?"
 *
 * Sechs konkrete Quellen die in der Plattform leben:
 *   - 3 SPIEGEL-Bestseller (Rhetorik-Frameworks)
 *   - 100+ Akademie-Kurse
 *   - 400 000 Coaching-Stunden (verdichtet als WladBot-Trainingsdaten)
 *   - 11 Leader-Frameworks
 *   - 30-Tage Sprint-Methodik
 *   - Lifetime-Lernpfad mit allen Vorteilen ab Tag 1
 *
 * Keine Theorie, keine Buchhülle · alles in tägliche Routinen, Drills,
 * Sprint-Etappen und WladBot-Sparring übersetzt.
 */

const SOURCES = [
  {
    icon: BookText,
    bib: 'IN · 01',
    title: 'Aus den 3 SPIEGEL-Bestsellern.',
    body:
      'Dunkle Rhetorik, Schwarze Rhetorik, Manipulationstechniken · die ' +
      'Methodik aus über 1 200 Seiten als sofort einsetzbare Drills.',
    artifact: 'Argumentations-Skripte · Schlagfertigkeits-Routinen · Anti-Manipulations-Drills',
  },
  {
    icon: Layers,
    bib: 'IN · 02',
    title: 'Aus 100+ Akademie-Kursen.',
    body:
      'Die meistgebuchten Inhalte der Argumentorik-Akademie · verdichtet ' +
      'in 15-Minuten-Mikro-Drills statt 8-Stunden-Video-Marathon.',
    artifact: 'Verhandlungs-Drills · Präsentations-Methodik · Konflikt-Skripte',
  },
  {
    icon: MessagesSquare,
    bib: 'IN · 03',
    title: 'Aus 400 000 Coachings.',
    body:
      'Was Wlad in 10+ Jahren live in 1:1-Sessions, Live-Workshops und ' +
      'Inhouse-Programmen gelernt hat · als Antwort-Logik im WladBot.',
    artifact: 'WladBot kennt deinen Kontext · antwortet in Wlads Sprache',
  },
  {
    icon: Compass,
    bib: 'IN · 04',
    title: 'Die 11 Leader-Frameworks.',
    body:
      'Die elf Methodiken die Wlad bei seinen Klienten am häufigsten ' +
      'einsetzt · eingebaut als Challenge-Lektionen mit konkreten Übungen.',
    artifact: 'B-W-W Feedback · Harvard Verhandlung · 5 Rollen · Schulz von Thun · …',
  },
  {
    icon: Zap,
    bib: 'IN · 05',
    title: 'Die 30-Tage Challenge-Methodik.',
    body:
      'Wlads Antwort auf "wie wird aus Wissen Können". Strukturierter Pfad ' +
      'mit täglichem Check-in, kleinen Drills und Wlads Wochen-Review.',
    artifact: 'Daily Check-in · Mikro-Drills · Wochen-Review · Streak-Mechanik',
  },
  {
    icon: Crown,
    bib: 'IN · 06',
    title: 'Plus: vieles was nie veröffentlicht wurde.',
    body:
      'Material aus Inhouse-Programmen, Vorstands-Coachings und privaten ' +
      'Sparrings · das bisher nur Klienten kannten. Jetzt für dich offen.',
    artifact: 'Vorstands-Skripte · Krisen-Kommunikation · Senior-Verhandlung',
  },
];

export const WladKnowledgeInsideSection = () => (
  <section
    id="wlad-in-leaderos"
    data-testid="wlad-knowledge-inside-section"
    aria-label="Was von Wlad in LeaderOS steckt"
    className="border-y-2 border-black/[0.06] bg-background"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
      {/* Eyebrow + Headline */}
      <div className="max-w-3xl mb-14 md:mb-20">
        <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55">
          <span className="text-brand-strong">▸ INSIDE LEADER · OS</span>
          <span className="opacity-30">·</span>
          <span>WAS VON WLAD DRIN IST</span>
        </div>

        <h2
          className="text-[40px] sm:text-[60px] md:text-[80px] leading-[0.92] tracking-[-0.04em] text-foreground"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Bücher, Coachings, Kurse<span className="text-brand not-italic">.</span><br />
          <span className="text-foreground/55">Alles drin. Plus viel mehr</span>
          <span className="text-brand not-italic">.</span>
        </h2>

        <p className="mt-7 text-[16px] md:text-[18px] leading-[1.6] text-foreground/70">
          Du musst nicht alle Bücher lesen, alle Kurse buchen oder Wlad
          persönlich engagieren um an sein Wissen zu kommen. Es ist alles
          schon hier · verdichtet, sortiert, in tägliche Routinen übersetzt.
          So nutzt du es jeden Tag, statt es in einem Bücherregal stehen
          zu lassen.
        </p>
      </div>

      {/* 3×2 Source-Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.bib}
              data-testid={`wlad-source-${s.bib.replace(/[^0-9]/g, '')}`}
              className="group border-2 border-black bg-background p-6 md:p-7 hover:bg-brand/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand-strong">
                  ▸ {s.bib}
                </span>
                <Icon
                  size={24}
                  strokeWidth={1.6}
                  className="text-foreground/70 group-hover:text-brand-strong transition-colors"
                  aria-hidden="true"
                />
              </div>
              <h3
                className="text-[22px] md:text-[26px] leading-[1.08] tracking-[-0.025em] text-foreground"
                style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                {s.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
              </h3>
              <p className="mt-3 text-[14px] md:text-[15px] leading-[1.55] text-foreground/70">
                {s.body}
              </p>
              <div className="mt-5 pt-4 border-t border-foreground/10">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 mb-1.5">
                  ▸ DRIN AS
                </div>
                <p className="text-[12.5px] leading-[1.5] text-foreground/65">
                  {s.artifact}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coda: die Versprechen-Strip */}
      <div className="mt-12 pt-8 border-t border-foreground/10 grid sm:grid-cols-3 gap-6 md:gap-10">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-2">
            ▸ KEIN BÜCHERREGAL
          </div>
          <p className="text-[13.5px] leading-[1.55] text-foreground/70">
            Wissen das du nicht anwendest, ist Wissen das du nicht hast. Hier
            wendest du es jeden Tag an.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-2">
            ▸ KEINE KURS-MÜDIGKEIT
          </div>
          <p className="text-[13.5px] leading-[1.55] text-foreground/70">
            15-Minuten-Drills statt 8-Stunden-Marathon. Was hängen bleibt ist
            das was du gemacht hast.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-2">
            ▸ KEINE WLAD-WARTELISTE
          </div>
          <p className="text-[13.5px] leading-[1.55] text-foreground/70">
            Wlad selbst ist nur 1× verfügbar. Sein Wissen ist es jetzt
            jederzeit · als System, als WladBot, ab Tag 1 für dich offen.
          </p>
        </div>
      </div>
    </div>
  </section>
);

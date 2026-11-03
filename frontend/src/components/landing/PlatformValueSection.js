import { ArrowRight, Bot, Layers, Target, Compass, Calendar, Users } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { DottedGlowBackground } from '../shared/DottedGlowBackground';

/**
 * PlatformValueSection · "Das bekommst du sofort von LeaderOS".
 *
 * Sitzt VOR der ClassesRoadmapSection. Verkauft zuerst die Plattform ·
 * konkrete Deliverables, nicht den Identity-Shift. Die Klassen-Roadmap
 * danach wird zum "und so geht's weiter"-Bonus.
 *
 * Sechs Plattform-Features mit BIB-Codes (P·01 bis P·06), jeweils mit
 * Icon, einer harten Headline und der ehrlichen Begründung, warum es
 * messbar etwas bringt. Wir wiederholen NICHT die Class-Bullets · die
 * Plattform ist das was du AB TAG 1 in der Hand hast.
 *
 * Closing-CTA-Strip bündelt die LeaderOS-Konditionen (30 Tage + 12 Monate)
 * + Preis + Button · damit der Übergang in den Sprint-Kauf einlippig ist.
 */

const FEATURES = [
  {
    bib: 'P·01',
    icon: Bot,
    title: 'WladBot · 24/7',
    headline: 'Dein KI-Sparring-Partner.',
    body:
      'Trainiert auf Wlads Methodik aus 400 000 Coachings. Verfügbar ' +
      'um 23 Uhr wenn du eine harte Antwort für morgen früh brauchst · ' +
      'oder vor jedem schwierigen Mitarbeitergespräch.',
    proof: 'IM SCHNITT 8 ANFRAGEN / KLIENT / WOCHE',
  },
  {
    bib: 'P·02',
    icon: Layers,
    title: '11 Frameworks',
    headline: 'Die kompletten Methoden.',
    body:
      'B·W·W, Harvard-Verhandlung, Schulz von Thun, ALPEN, 5-Rollen, ' +
      'Dunkle Rhetorik erkennen · die SPIEGEL-Bestseller-Frameworks als ' +
      'drillbare Library mit echten Fall-Skripten.',
    proof: '40+ STUNDEN VIDEO · 200+ SKRIPTE',
  },
  {
    bib: 'P·03',
    icon: Target,
    title: 'Daily Drills',
    headline: '15 Minuten am echten Fall.',
    body:
      'Kein Theorie-Bingo. Jeden Tag eine konkrete Übung an deiner ' +
      'aktuellen Situation · Mitarbeitergespräch, Firmenrede, Konflikt. ' +
      'Output-fokussiert, von Wlad kuratiert.',
    proof: '30 DRILLS IN DER CHALLENGE · 365 ÜBER 12 MONATE',
  },
  {
    bib: 'P·04',
    icon: Compass,
    title: 'Leadership-Diagnose',
    headline: 'Drei Dimensionen, 10 Min.',
    body:
      'KI · Rhetorik · EQ als Score plus konkretem Lernpfad. ' +
      'Quartalsweise wiederholbar damit du deinen Progress in Zahlen ' +
      'siehst, nicht in Bauchgefühl.',
    proof: 'QUARTALSWEISE · IMMER KOSTENLOS',
  },
  {
    bib: 'P·05',
    icon: Calendar,
    title: 'Live-Sessions',
    headline: 'Monatlich · 90 Minuten.',
    body:
      'Geschlossene Live-Session im kleinen Kreis. Deine Fälle, ' +
      'hands-on Drill, kein generischer Massen-Webinar-Modus. ' +
      'Aufzeichnung + Notes nachgeliefert.',
    proof: 'PLUS-PLUS · MITGLIEDER-ONLY',
  },
  {
    bib: 'P·06',
    icon: Users,
    title: 'Deine Peer-Community',
    headline: 'Lerne mit anderen Führungskräften.',
    body:
      'Eigener Slack-Channel mit anderen Führungskräften + Wlad. ' +
      'Peer-Sparring, Job-Board, Intros zwischen Klienten. ' +
      'Lifetime-Zugang, auch nach Challenge-Ende.',
    proof: 'PEER-COMMUNITY · LIFETIME',
  },
];

const FeatureCard = ({ feature }) => {
  const Icon = feature.icon;
  return (
    <SpotlightCard
      data-testid={`platform-feature-${feature.bib}`}
      className="group bg-white border-2 border-black h-full transition-all duration-200 hover:shadow-[8px_8px_0_0_#BFFF00] hover:-translate-y-1"
      innerClassName="p-6 md:p-7 flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-brand-strong">
          ▸ {feature.bib}
        </span>
        <Icon size={22} strokeWidth={2} className="text-black/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" />
      </div>

      <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/55 mb-2">
        {feature.title}
      </div>
      <h3
        className="text-[24px] md:text-[28px] leading-[1.02] tracking-[-0.025em] text-black mb-3.5"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {feature.headline.replace(/\.$/, '')}<span className="text-brand-strong not-italic">.</span>
      </h3>
      <p className="text-[13.5px] md:text-[14.5px] leading-[1.55] text-black/72 flex-1">
        {feature.body}
      </p>
      <div className="mt-5 pt-4 border-t border-black/12 font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-black/55">
        ▸ {feature.proof}
      </div>
    </SpotlightCard>
  );
};

export const PlatformValueSection = () => (
  <section
    id="platform"
    data-testid="platform-value-section"
    aria-label="Das bekommst du sofort von LeaderOS"
    className="relative w-full bg-[#F4F4F2] border-y-2 border-black overflow-hidden"
  >
    {/* Subtle paper-grain so the section has texture and isn't a flat slab */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-50 pointer-events-none"
      style={{
        backgroundImage:
          'radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    />

    <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
      {/* Header */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-end mb-12 md:mb-16">
        <div className="md:col-span-8">
          <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong">
            <span>▸ DIE PLATTFORM · LEADEROS</span>
            <span className="opacity-30">·</span>
            <span className="text-black/55">DAS BEKOMMST DU SOFORT</span>
          </div>
          <h2
            className="leading-[0.92] tracking-[-0.04em] text-black"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(40px, 5.5vw, 88px)',
            }}
          >
            LeaderOS ist die<br />
            <span className="text-black/55">Plattform für KI-natives Führen</span>
            <span className="text-brand-strong not-italic">.</span>
          </h2>
        </div>
        <div className="md:col-span-4 md:pb-4">
          <p className="text-[15px] md:text-[17px] leading-[1.55] text-black/72">
            Sechs Module die ab Tag 1 in deiner Tasche sind. Kein Drip-Feed,
            kein "freischalten in Monat 3" · alles sofort. 30 Tage intensiv
            mit Wlad, danach 12 Monate Plattform.
          </p>
        </div>
      </div>

      {/* 6-Feature-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {FEATURES.map((f) => <FeatureCard key={f.bib} feature={f} />)}
      </div>

      {/* Trial-CTA strip · 14 Tage kostenlos · die Sprint-Konvertierung
          läuft post-Signup im App-Email-Flow, nicht hier auf der Landing. */}
      <div className="relative overflow-hidden mt-14 md:mt-16 bg-black text-white border-2 border-black p-7 md:p-10">
        <DottedGlowBackground
          className="[mask-image:radial-gradient(130%_130%_at_80%_50%,#000_45%,transparent_100%)]"
          gap={24}
          radius={1.3}
          color="rgba(191,255,0,0.24)"
          glowColor="rgba(191,255,0,0.9)"
          opacity={0.5}
          speedMin={0.18}
          speedMax={1}
        />
        <div className="relative z-10 grid md:grid-cols-12 gap-6 md:gap-10 items-center text-center md:text-left">
          <div className="md:col-span-8">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-4">
              ▸ WERDE TEIL · START MIT DEM LEADER-CHECK
            </div>
            <h3
              className="text-[28px] md:text-[42px] leading-[1.02] tracking-[-0.03em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Vierzehn Tage
              <span className="text-white/55"> · </span>
              kostenlos testen
              <span className="text-brand not-italic">.</span>
            </h3>
            <p className="mt-4 text-[14.5px] md:text-[16px] leading-[1.6] text-white/75 max-w-2xl mx-auto md:mx-0">
              Volle Plattform · alle sechs Module · WladBot 24/7 · keine Karte
              nötig. Du loggst dich ein, du arbeitest mit dem System, du
              entscheidest. Erst wenn es für dich passt, geht es in die Challenge.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <div className="flex items-baseline justify-center md:justify-end gap-2 mb-5">
              <span
                className="text-brand leading-none"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: 'clamp(48px, 4vw, 72px)',
                }}
              >
                0 €
              </span>
              <span className="text-[12px] font-mono uppercase tracking-[0.18em] text-white/55">
                14 Tage
              </span>
            </div>
            <a
              href="https://leaderos.de/signup?trial=14"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="platform-charter-cta"
              className="inline-flex items-center justify-center gap-3 px-6 md:px-8 h-14 bg-brand hover:bg-white text-black font-bold text-[13.5px] md:text-[14px] tracking-[0.04em] transition-colors shadow-[6px_6px_0_0_#BFFF00] hover:shadow-[6px_6px_0_0_#fff]"
            >
              Jetzt 14 Tage testen
              <ArrowRight size={18} />
            </a>
            <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              ▸ Ohne Karte · jederzeit kündbar
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, MessagesSquare, Compass } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

/**
 * FreeToolsSection · Free-Tools-Discovery für Leader die mit KI starten wollen.
 *
 * Zweck: viraler Top-of-Funnel-Magnet. Jedes Tool ist ein eigenständiges
 * KI-Werkzeug das ohne Login funktioniert, gleichzeitig aber den User
 * sanft ins LeaderOS-Onboarding zieht.
 *
 * Drei der vier Tools verlinken auf bereits existierende Surfaces auf
 * der Landing (Anchor-Scroll), das vierte führt zur tiefen Diagnose
 * auf leadercheck.de. Spätere Tools (Decision-Matrix, Wochen-Planer,
 * Meeting-Sparring) bekommen eigene Routes unter /tools/*.
 *
 * Design: 2×2 Bento-Grid auf Desktop, 1-Spalte mobil. Jede Card hat
 * einen lime BIB-code, große italic-Headline, kurze Description,
 * "JETZT NUTZEN"-Pill. Hover hebt die Card minimal an (Nike-DNA).
 */

const TOOLS = [
  {
    bib: '01',
    icon: Compass,
    title: 'Archetyp-Test',
    subtitle: 'Welcher KI-Leader bist du?',
    body:
      '5 Fragen, 60 Sekunden, ein klarer Archetyp. Plus eine konkrete ' +
      'Indikation worauf du als nächstes schaust. Kein Login, kein Spam.',
    cta: 'Test starten',
    href: '#archetyp',
    isAnchor: true,
    badge: 'BELIEBT',
    badgeTone: 'lime',
  },
  {
    bib: '02',
    icon: Target,
    title: 'Mini-Challenge',
    subtitle: 'Standortbestimmung in 5 Fragen.',
    body:
      'Schnell-Check für KI, Rhetorik und EQ. Wo stehst du heute, wo ' +
      'sitzt dein Hebel, was wäre der nächste konkrete Drill für dich.',
    cta: 'Challenge starten',
    href: '#mini-challenge',
    isAnchor: true,
    badge: '60 SEK',
  },
  {
    bib: '03',
    icon: MessagesSquare,
    title: 'Vollständige Diagnose',
    subtitle: 'Dein KI-Lernpfad in 5 Minuten.',
    body:
      '30 Fragen, ein vollständiges Profil. Was sind deine KI-Opportunities, ' +
      'wo solltest du anfangen, welcher 30-Tage-Plan macht für dich Sinn.',
    cta: 'Diagnose öffnen',
    href: 'https://leadercheck.de',
    isAnchor: false,
    badge: 'KOSTENLOS',
    badgeTone: 'lime',
  },
  {
    bib: '04',
    icon: Sparkles,
    title: 'WladBot Lite',
    subtitle: 'Frag Wlad. Direkt aus der Landing.',
    body:
      'Ein erster Geschmack auf den persönlichen KI-Coach. Stell deine ' +
      'Frage zu Führung, KI-Routine oder Kommunikation · Antwort sofort.',
    cta: 'Chat öffnen',
    isCustomEvent: 'leader-os:open-chat',
    badge: 'NEU',
  },
];

const ToolCard = ({ tool, index }) => {
  const Icon = tool.icon;
  const isExternal = !tool.isAnchor && !tool.isCustomEvent && tool.href?.startsWith('http');
  const linkProps = tool.isCustomEvent
    ? {
        href: '#',
        role: 'button',
        onClick: (e) => {
          e.preventDefault();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(tool.isCustomEvent));
          }
        },
      }
    : isExternal
      ? { href: tool.href, target: '_blank', rel: 'noopener noreferrer' }
      : tool.isAnchor
        ? {
            href: tool.href,
            onClick: (e) => {
              e.preventDefault();
              const id = tool.href.replace(/^#/, '');
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
          }
        : { href: tool.href };
  const isLimeBadge = tool.badgeTone === 'lime';

  return (
    <SpotlightCard
      as="a"
      {...linkProps}
      data-testid={`free-tool-${tool.bib}`}
      className="group block border-2 border-black bg-background hover:bg-brand/5 hover:shadow-[8px_8px_0_0_#000] transition-all"
      innerClassName="p-7 md:p-9"
    >
      {tool.badge && (
        <span
          className={`absolute top-0 right-7 -translate-y-1/2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${
            isLimeBadge ? 'bg-brand text-black' : 'bg-foreground text-background'
          }`}
        >
          {tool.badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-4 mb-5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/55">
          ▸ TOOL · {tool.bib}
        </span>
        <Icon
          size={28}
          strokeWidth={1.5}
          className="text-foreground/70 group-hover:text-brand-strong transition-colors"
          aria-hidden="true"
        />
      </div>

      <h3
        className="text-[26px] md:text-[34px] leading-[1.05] tracking-[-0.03em] text-foreground"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {tool.title.replace(/\.$/, '')}<span className="text-brand not-italic">.</span>
      </h3>

      <p className="mt-2 text-[14px] md:text-[15px] font-semibold text-foreground/65 leading-snug">
        {tool.subtitle}
      </p>

      <p className="mt-5 text-[14px] md:text-[15px] leading-[1.55] text-foreground/70">
        {tool.body}
      </p>

      <div className="mt-7 inline-flex items-center gap-2 px-5 h-12 bg-foreground text-background group-hover:bg-brand group-hover:text-black font-bold text-[12px] tracking-[0.05em] uppercase transition-colors">
        {tool.cta}
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </SpotlightCard>
  );
};

export const FreeToolsSection = () => (
  <section
    id="free-tools"
    data-testid="free-tools-section"
    aria-label="Kostenlose KI-Tools für Leader"
    className="border-y-2 border-black/[0.06] bg-background"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
      {/* Eyebrow + Headline */}
      <div className="mb-12 md:mb-16 max-w-3xl">
        <div className="flex items-center gap-3 mb-5 font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55">
          <span className="text-brand-strong">▸ FREE TOOLS</span>
          <span className="opacity-30">·</span>
          <span>FÜR LEADER · OHNE LOGIN · SOFORT NUTZBAR</span>
        </div>
        <h2
          className="text-[40px] sm:text-[60px] md:text-[80px] leading-[0.92] tracking-[-0.04em] text-foreground"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Mit KI führen<span className="text-brand not-italic">.</span><br />
          <span className="text-foreground/55">Heute, nicht irgendwann</span>
          <span className="text-brand not-italic">.</span>
        </h2>
        <p className="mt-6 text-[16px] md:text-[18px] leading-[1.6] text-foreground/70">
          Vier kostenlose Werkzeuge die dich nicht nur testen · sie bringen dir
          direkt Wert. Mach den Archetyp-Check, finde deinen Hebel, frag den
          WladBot. Onboarding ohne Reibung. Wenn du tiefer willst, ist LeaderOS
          der nächste Schritt.
        </p>
      </div>

      {/* 2×2 Bento auf Desktop, 1-col mobil */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {TOOLS.map((tool, i) => (
          <ToolCard key={tool.bib} tool={tool} index={i} />
        ))}
      </div>

      {/* Coda: alle Tools sind kostenlos, kein Abo, kein Spam */}
      <div className="mt-10 pt-8 border-t border-foreground/10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
        <span>▸ ALLE TOOLS · 0 € · KEIN ABO</span>
        <span>▸ KEINE EMAIL ERFORDERLICH</span>
        <span>▸ DSGVO-KONFORM · EU-HOSTING</span>
        <Link to="/journal" className="hover:text-brand-strong transition-colors ml-auto py-3 -my-3">
          ▸ MEHR IM JOURNAL
        </Link>
      </div>
    </div>
  </section>
);

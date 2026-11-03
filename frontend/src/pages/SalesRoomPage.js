/**
 * SalesRoomPage · /sales-room — INTERNAL sales enablement room.
 *
 * The one screen a sales person keeps open during a call: the 30-second
 * pitch (copy-ready), the 7-step guided demo flow with deep links into the
 * live product, the verified strength numbers, discovery questions to ask
 * the prospect, an objection library, and the pricing cheat-sheet.
 *
 * Access: ProtectedRoute (login required), deliberately NOT in the sidebar —
 * share the URL internally. All numbers are the verified set (Wlad page /
 * PricingLadder) — nothing invented, so sales can quote everything safely.
 *
 * Design: Athletic-Editorial DNA — dark canvas, lime accent, mono BIB-codes.
 */
import { useEffect, useState } from 'react';
import { Copy, Check, ArrowUpRight, ChevronDown, MessageCircle } from 'lucide-react';
import { WladMark } from '../components/brand/WladMark';

// ── Copy-ready pitch (P-P-N) ─────────────────────────────────────────────────
const PITCH_30S = `Führungskräfte verlieren heute Stunden pro Woche an Reaktions-Modus — und alle reden über KI, aber niemand zeigt ihnen, was das für IHRE Führung konkret heißt.

LeaderOS ist das Betriebssystem dafür: Wlads komplette Methodik — 3× SPIEGEL-Bestseller, 400.000+ Klienten — als tägliches System. WladBot coacht 24/7 in Wlads Ton, 11 Frameworks, Video-Analyse, 30-Tage-Challenge mit Zertifikat.

Der Einstieg kostet nichts: 14 Tage voller Zugang, ohne Karte. Wollen Sie es einmal live sehen?`;

// ── Guided demo flow · what to SAY, what to SHOW ─────────────────────────────
const DEMO_FLOW = [
  {
    nr: '01', label: 'HOOK', title: 'Der kostenlose Einstieg',
    say: 'Bevor ich Ihnen die Plattform zeige: So kommen Ihre Führungskräfte rein — 4 kostenlose Videos, E-Mail genügt, kein Konto.',
    show: 'Funnel-Seite öffnen · Chrome-Vault + Videos zeigen',
    href: 'https://leader-os.de/fuehrung-beginnt-hier',
  },
  {
    nr: '02', label: 'DIAGNOSE', title: 'Der Leader-Check',
    say: 'Jede Reise startet mit Standortbestimmung: 10 Minuten, sofortiger Score. Das ist auch Ihr Rollout-Werkzeug — Sie sehen, wo Ihr Team steht.',
    show: 'Leader-Check kurz anreißen (nicht komplett durchklicken)',
    href: 'https://leadercheck.de',
  },
  {
    nr: '03', label: 'KERN', title: 'WladBot · der 24/7-Coach',
    say: 'Das Herzstück: WladBot antwortet in Wlads Methodik und Ton — trainiert auf über 2.200 Wlad-Lektionen. Fragen Sie ihn etwas aus Ihrem echten Alltag.',
    show: 'Chat öffnen · Prospect eine ECHTE Frage stellen lassen (stärkster Moment der Demo)',
    href: '/chat',
  },
  {
    nr: '04', label: 'DRILL', title: 'Simulationen',
    say: 'Wissen reicht nicht — hier wird trainiert: Gehaltsgespräch, Konflikt, Kündigung. Die KI spielt den schwierigen Gegenüber, so oft Sie wollen.',
    show: 'Eine Simulation anspielen · Eskalationsstufe zeigen',
    href: '/simulations',
  },
  {
    nr: '05', label: 'VIDEO', title: 'Video-Analyse',
    say: 'Für Auftritte: Video hochladen oder aufnehmen, die KI analysiert Rhetorik, Füllwörter, Struktur — dasselbe Feedback-Prinzip wie in Wlads Trainings.',
    show: 'Missions-Studio zeigen (Aufnahme-Flow, nicht live aufnehmen)',
    href: '/missions',
  },
  {
    nr: '06', label: 'SYSTEM', title: '30-Tage-Challenge & Lernpfad',
    say: 'Damit es kein Strohfeuer wird: täglicher Drill, 30 Tage, am Ende das Zertifikat 0001 — LinkedIn-ready. Das ist der Unterschied zwischen Tool und System.',
    show: 'Challenge/Lernpfad zeigen · Zertifikats-Story erzählen',
    href: '/challenge',
  },
  {
    nr: '07', label: 'CLOSE', title: 'Der risikofreie nächste Schritt',
    say: 'Mein Vorschlag: Ihre Führungskräfte testen 14 Tage kostenlos — ohne Karte. Danach sprechen wir über den Rollout, der zu Ihrer Größe passt.',
    show: 'Pricing-Leiter zeigen · Trial als Default, Enterprise als Ausbau',
    href: 'https://leader-os.de/#pricing',
  },
];

// ── Verified strength numbers · safe to quote ────────────────────────────────
const PROOF = [
  ['400K+', 'Klienten weltweit seit 2007'],
  ['3×', 'SPIEGEL-Bestseller · 13 Bücher'],
  ['14M', 'Views · Podcast + YouTube'],
  ['4.9/5', 'Trustpilot · 388 Bewertungen'],
  ['2.200+', 'Wlad-Lektionen im WladBot'],
  ['11', 'Frameworks · drillbar'],
  ['24/7', 'Coach-Verfügbarkeit'],
  ['3×', 'TEDx-Speaker'],
];

const CLIENT_NAMES = ['ALLIANZ', 'BMW', 'SIEMENS', 'LUFTHANSA', 'TELEKOM', 'VODAFONE', 'BOSCH', 'SKY', 'PRO7'];

// ── Discovery questions · what to ASK the prospect ──────────────────────────
const DISCOVERY = [
  ['Status', 'Wie entwickeln Sie Ihre Führungskräfte heute — und was davon würden Sie sofort abschaffen, wenn Sie könnten?'],
  ['Schmerz', 'Welches Führungsproblem kostet Sie gerade am meisten — Fluktuation, Konflikte, Entscheidungsstau?'],
  ['KI-Reife', 'Was haben Ihre Führungskräfte mit KI schon versucht — und woran ist es hängengeblieben?'],
  ['Messung', 'Woran würden Sie in 6 Monaten festmachen, dass sich Führung bei Ihnen verbessert hat?'],
  ['Budget-Frame', 'Was kostet Sie ein einziges eskaliertes Konfliktgespräch oder eine Fehlbesetzung — grob?'],
  ['Entscheidung', 'Wer außer Ihnen müsste ein Ja mittragen — und was wäre dessen wichtigste Frage?'],
  ['Timing', 'Was passiert, wenn Sie das Thema 12 Monate schieben?'],
];

// ── Objection library · grounded in the platform positioning ─────────────────
const OBJECTIONS = [
  {
    q: '„Das ist zu teuer."',
    a: 'Rahmen wechseln: Ein Wlad-Trainingstag kostet 10.000 € für EINEN Tag. Die Challenge kostet 997 € — einmalig, inklusive 12 Monaten Mitgliedschaft, pro Führungskraft. Und der Vergleichsmaßstab ist nicht der Preis, sondern eine einzige verhinderte Fehlbesetzung oder Eskalation. Dann: „Was kostet Sie Führungsschwäche pro Quartal?"',
  },
  {
    q: '„ChatGPT reicht uns doch."',
    a: 'ChatGPT ist ein leeres Werkzeug — brillant, aber ohne Methodik, ohne Gedächtnis für Ihre Führungssituation, ohne System. WladBot ist auf 2.200+ Lektionen einer erprobten Methodik trainiert, antwortet in einem konsistenten Coaching-Rahmen und ist eingebettet in Drills, Simulationen und die 30-Tage-Challenge. Der Unterschied ist derselbe wie zwischen einem Klavier und einem Klavierlehrer.',
  },
  {
    q: '„Unsere Leute haben keine Zeit."',
    a: 'Genau deshalb: Das System ist auf 10–15 Minuten pro Tag gebaut — ein Drill, eine Frage, eine Reflexion. Die Alternative sind 2-Tages-Seminare, aus denen nach 3 Wochen nichts übrig ist. Zeitmangel ist kein Einwand gegen LeaderOS, sondern das stärkste Argument dafür.',
  },
  {
    q: '„Was ist mit Datenschutz?"',
    a: 'DSGVO-konform, EU-Datenhaltung (Supabase eu-north-1, PostHog EU-Cloud), keine Weitergabe an Dritte, jede E-Mail mit 1-Klick-Abmeldung. Für Enterprise klären wir AVV und Anforderungen Ihrer IT im Detail — das Gespräch machen wir gern mit Ihrem Datenschutzbeauftragten zusammen.',
  },
  {
    q: '„Wir haben schon Coaching / eine Academy."',
    a: 'Perfekt — LeaderOS ersetzt das nicht, es schließt die Lücke DAZWISCHEN: die 29 Tage im Monat, an denen kein Coach verfügbar ist. Ihr Coaching setzt Impulse, LeaderOS macht daraus tägliche Praxis. Fragen Sie Ihre Coaches: Woran scheitert Transfer? An der Zeit zwischen den Sessions.',
  },
  {
    q: '„KI ist doch nur Hype."',
    a: 'Die Tools sind Hype, die Verschiebung nicht. Deshalb verkaufen wir kein Tool-Training, sondern Führungsmethodik — Wlads Frameworks funktionieren seit 15 Jahren, KI macht sie nur täglich verfügbar. Wer wartet, bis der Hype vorbei ist, trainiert gegen Teams, die es nicht getan haben.',
  },
  {
    q: '„Funktioniert das wirklich remote / im Alltag?"',
    a: 'Es funktioniert NUR im Alltag — das ist der Designkern. Browser, Handy, 24/7. Der beste Beweis ist die Demo: Lassen Sie den Prospect im Call selbst eine echte Frage an WladBot stellen. Diese 60 Sekunden schlagen jede Folie.',
  },
  {
    q: '„Ich muss das intern erst abstimmen."',
    a: 'Verständlich — machen wir es dem Entscheider leicht: 1) 14-Tage-Trial für 2–3 Führungskräfte als risikofreier Pilot, 2) unser Business-Case-Material zum Weiterleiten, 3) ein 30-Minuten-Termin mit allen Beteiligten. Welche der drei Optionen passt am besten?',
  },
];

// ── Pricing cheat-sheet · exact PricingLadder numbers ────────────────────────
const PRICING = [
  ['Trial', '0 €', '14 Tage · ohne Karte', 'Default-Einstieg für JEDEN Prospect'],
  ['Diagnose', '0 €', '10 Min · leadercheck.de', 'Vor-Termin-Hausaufgabe / Rollout-Messung'],
  ['Challenge', '997 €', '30 Tage + 12 Mon. Mitgliedschaft · einmalig', 'Einzelne Führungskraft · „Beliebt"'],
  ['Plus-Plus', '4.797 €', '12 Monate Enablement · oder 3 × 1.599 €', 'Ambitionierte Einzelkämpfer / kleine Teams'],
  ['Mentoring 6', '14.800 €', '6 Monate · 1:1-Mentoring', 'C-Level mit persönlichem Anspruch'],
  ['Mentoring 12', '24.600 €', '12 Monate · 1:1-Mentoring', 'Langfrist-Transformation Einzelperson'],
  ['Enterprise', 'ab 44.000 €', 'Team-Lizenz · Custom Track', 'Ab ~10 Führungskräften · Rollout + Reporting'],
];

const Section = ({ kicker, title, children, id }) => (
  <section id={id} className="border-t border-white/10">
    <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-14 md:py-16">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand mb-3">▸ {kicker}</p>
      <h2
        className="text-[26px] sm:text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.03em] text-white mb-8"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {title}<span className="text-brand not-italic">.</span>
      </h2>
      {children}
    </div>
  </section>
);

export default function SalesRoomPage() {
  const [copied, setCopied] = useState(false);
  const [openObjection, setOpenObjection] = useState(null);

  useEffect(() => {
    document.title = 'Sales Room · Intern · LeaderOS';
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => { if (!wasDark) root.classList.remove('dark'); };
  }, []);

  const copyPitch = async () => {
    try {
      await navigator.clipboard.writeText(PITCH_30S);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked → user selects manually */ }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased" data-testid="sales-room">
      {/* Internal header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-[1180px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <WladMark size={30} />
            <div className="leading-none min-w-0">
              <div className="font-black tracking-tight text-[17px]" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                Sales<span className="text-brand mx-0.5">·</span>Room
              </div>
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-white/45 mt-1">
                INTERN · NICHT ÖFFENTLICH TEILEN
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-4 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/55">
            {[['#pitch', 'Pitch'], ['#demo', 'Demo'], ['#discovery', 'Fragen'], ['#einwaende', 'Einwände'], ['#pricing', 'Preise']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-brand transition-colors">{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* PITCH · copy-ready */}
        <Section id="pitch" kicker="SCHRITT 0 · AUSWENDIG ODER ABLESEN" title="Der Pitch in 30 Sekunden">
          <div className="border-2 border-brand/50 bg-brand/[0.05] p-6 md:p-8 relative max-w-3xl">
            <button
              type="button"
              onClick={copyPitch}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 h-9 border border-white/25 hover:border-brand text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-brand transition-colors"
              data-testid="sales-copy-pitch"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Kopiert' : 'Kopieren'}
            </button>
            <p className="whitespace-pre-line text-[15px] md:text-[16.5px] leading-[1.7] text-white/85 pr-16">
              {PITCH_30S}
            </p>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Struktur: Problem → Progress/Beweis → Next Step · endet IMMER mit einer Frage.
          </p>
        </Section>

        {/* DEMO FLOW */}
        <Section id="demo" kicker="7 SCHRITTE · 15 MINUTEN" title="Der Demo-Flow">
          <div className="grid gap-3">
            {DEMO_FLOW.map((step) => (
              <div key={step.nr} className="border-2 border-white/12 hover:border-white/30 transition-colors p-5 md:p-6 grid md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3 flex items-start gap-4">
                  <span className="font-mono text-[24px] font-black text-brand tabular-nums leading-none">{step.nr}</span>
                  <div>
                    <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/45">{step.label}</div>
                    <div className="text-[16px] font-black tracking-tight leading-tight mt-0.5">{step.title}</div>
                  </div>
                </div>
                <div className="md:col-span-4">
                  <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-brand mb-1.5">▸ SAG</div>
                  <p className="text-[13.5px] leading-[1.55] text-white/75">{step.say}</p>
                </div>
                <div className="md:col-span-3">
                  <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-brand mb-1.5">▸ ZEIG</div>
                  <p className="text-[13.5px] leading-[1.55] text-white/60">{step.show}</p>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 h-10 bg-brand text-[#0A0A0A] text-[10.5px] font-black uppercase tracking-[0.08em] hover:brightness-105 transition-all"
                  >
                    Öffnen <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Goldene Regel: Schritt 03 nie überspringen — der Prospect muss WladBot SELBST etwas fragen.
          </p>
        </Section>

        {/* STRENGTH SHOWCASE */}
        <Section kicker="VERIFIZIERT · DARFST DU ZITIEREN" title="Die Stärken-Zahlen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-2 border-white/10">
            {PROOF.map(([big, small]) => (
              <div key={small} className="bg-[#0A0A0A] p-5 md:p-6">
                <div className="font-mono text-[24px] md:text-[30px] font-black text-brand tabular-nums leading-none">{big}</div>
                <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/45 mt-2 leading-relaxed">{small}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-white/40 w-full">▸ FÜHRUNGSKRÄFTE TRAINIERT BEI</span>
            {CLIENT_NAMES.map((n) => (
              <span key={n} className="font-mono text-[12px] font-bold tracking-[0.18em] text-white/55">{n}</span>
            ))}
          </div>
        </Section>

        {/* DISCOVERY QUESTIONS */}
        <Section id="discovery" kicker="WER FRAGT, FÜHRT" title="Die Discovery-Fragen">
          <div className="grid md:grid-cols-2 gap-3">
            {DISCOVERY.map(([tag, q]) => (
              <div key={tag} className="border border-white/12 p-5 flex gap-4 items-start">
                <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand border border-brand/40 px-2 py-1">{tag}</span>
                <p className="text-[14px] leading-[1.55] text-white/80">{q}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Reihenfolge egal · aber mindestens Schmerz + Messung + Entscheidung VOR dem Pricing.
          </p>
        </Section>

        {/* OBJECTION LIBRARY */}
        <Section id="einwaende" kicker="EINWAND = KAUFSIGNAL" title="Die Einwand-Bibliothek">
          <div className="grid gap-2 max-w-4xl">
            {OBJECTIONS.map((o, i) => {
              const open = openObjection === i;
              return (
                <div key={o.q} className={`border-2 transition-colors ${open ? 'border-brand/60 bg-brand/[0.04]' : 'border-white/12'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenObjection(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    data-testid={`objection-${i}`}
                  >
                    <span className="text-[15px] md:text-[16px] font-black tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>
                      {o.q}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-brand transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5">
                      <p className="text-[14px] leading-[1.65] text-white/75 border-t border-white/10 pt-4">{o.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* PRICING CHEAT-SHEET */}
        <Section id="pricing" kicker="EXAKTE ZAHLEN · KEIN RABATT OHNE FREIGABE" title="Der Preis-Spickzettel">
          <div className="overflow-x-auto border-2 border-white/12">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b-2 border-white/12 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                  <th className="px-4 py-3">Angebot</th>
                  <th className="px-4 py-3">Preis</th>
                  <th className="px-4 py-3">Umfang</th>
                  <th className="px-4 py-3">Für wen im Gespräch</th>
                </tr>
              </thead>
              <tbody>
                {PRICING.map(([name, price, scope, fit]) => (
                  <tr key={name} className="border-b border-white/8 hover:bg-white/[0.03]">
                    <td className="px-4 py-3.5 text-[14px] font-black" style={{ fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>{name}</td>
                    <td className="px-4 py-3.5 font-mono text-[14px] font-bold text-brand tabular-nums whitespace-nowrap">{price}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-white/65">{scope}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-white/75">{fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Anker-Reihenfolge im Gespräch: Wlad-Tagessatz (10.000 €) → Enterprise → dann wirkt die Challenge klein.
          </p>
        </Section>

        {/* LIVE Q&A · WladBot as co-pilot */}
        <section className="border-t border-white/10">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-14 md:py-16">
            <div className="border-2 border-brand bg-brand/[0.06] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-brand mb-2">▸ WENN DER PROSPECT ETWAS FRAGT, DAS HIER NICHT STEHT</p>
                <h3 className="text-[22px] md:text-[26px] font-black tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>
                  WladBot ist dein Co-Pilot im Call<span className="text-brand not-italic">.</span>
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-white/70 max-w-2xl">
                  Zweiten Tab offen halten. Fachfrage zur Methodik, zu einem Framework, zu einem Use-Case?
                  Live fragen — die Antwort kommt in Wlads Ton und ist gleichzeitig die beste Produkt-Demo.
                </p>
              </div>
              <a
                href="/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2.5 px-7 h-13 py-3.5 bg-brand text-[#0A0A0A] text-[12px] font-black uppercase tracking-[0.08em] hover:brightness-105 transition-all"
              >
                <MessageCircle size={17} /> Chat öffnen
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-8 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 flex flex-wrap justify-between gap-3">
          <span>▸ SALES ROOM · LEADEROS · INTERN</span>
          <span>ZAHLEN: VERIFIZIERTER SATZ · PREISE: PRICING-LADDER · STAND {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

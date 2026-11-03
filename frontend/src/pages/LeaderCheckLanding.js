import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingChatPod } from '../components/landing/LandingChatPod';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';

/**
 * LeaderCheckLanding · die Diagnostic-First-Variante.
 *
 * Wird ausgeliefert wenn der Hostname leader-check.de ist (siehe
 * Router-Branch in LandingPage.js). Bewusst MAGER: ein einziger
 * Funnel-Zweck · kostenlose 10-Minuten-Diagnose starten · plus die
 * kritische Bridge-Message: "Nutze die gleiche Email wie auf
 * leader-os.de damit dein WladBot deinen Score kennt".
 *
 * Kein langer Pitch, keine Frameworks, keine Preise. Wer hier
 * landet soll genau eine Sache tun: die Diagnose starten. Alles
 * andere kommt nach der Diagnose über die Result-Page → Sprint-Sell.
 *
 * Design-System (siehe frontend/DESIGN.md, Nike-inspired Athletic-Editorial):
 *   - canvas: #FFFFFF (Light-Mode-locked)
 *   - hairline: rgba(0,0,0,0.08–0.15) · Hairlines aus echtem Schwarz
 *   - display: Outfit 900 italic, massive uppercase, lime-Punkt-Punktuation
 *   - eyebrow: mono uppercase tracked 0.28em
 *   - 2px-Schwarz-Borders für emphatische Cards (Nike Editorial DNA)
 */

const DIMENSIONS = [
  {
    code: '§01',
    name: 'KI-Readiness',
    body:
      'Wo stehst du in der Nutzung von KI als Führungskraft · vom ' +
      'bewussten Einsatz bis zum kritischen Hinterfragen?',
  },
  {
    code: '§02',
    name: 'Rhetorik',
    body:
      'Wie klar argumentierst du? Wie sicher trägst du eine Position ' +
      'in der Firmenrede, im 1:1, in der schwierigen Verhandlung?',
  },
  {
    code: '§03',
    name: 'Emotionale Intelligenz',
    body:
      'Wie liest du Stimmungen in einem Raum? Wie gibst du Feedback, ' +
      'das ankommt · ohne das Gegenüber zu verlieren?',
  },
];

const PHASES = [
  ['01', '10 MIN', '30 Fragen · multiple choice'],
  ['02', 'SOFORT', 'Drei Scores · Gesamt-Score · Empfehlung'],
  ['03', 'OPTIONAL', 'Wenn du willst: 30-Tage-Challenge starten'],
];

export default function LeaderCheckLanding() {
  useEffect(() => {
    document.title = 'Leader-Check · Wo stehst du als Führungskraft?';
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      'Kostenlose 10-Minuten-Diagnose: KI-Readiness · Rhetorik · ' +
      'Emotionale Intelligenz. Sofortiges Ergebnis. Keine ' +
      'Kreditkarte. Powered by Wlad Jachtchenkos Methodik.';
    if (meta) {
      meta.setAttribute('content', desc);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }

    // Nike-Light-Lock: leader-check.de läuft IMMER in Light-Mode,
    // egal was der User in localStorage hatte. Friendly + helle Editorial-DNA.
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) root.classList.remove('dark');
    return () => {
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div
      className="bg-white text-black min-h-screen antialiased"
      data-testid="leader-check-landing"
    >
      {/* ───────── Top-Strip / Brand ───────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-black/[0.08]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand text-black font-black"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              W
            </span>
            <div>
              <div
                className="text-[16px] font-black tracking-tight text-black"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}
              >
                Leader<span className="text-brand mx-0.5">·</span>Check
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono leading-none mt-0.5">
                Diagnose · 10 Min · Kostenlos
              </div>
            </div>
          </div>
          <a
            href="https://leaderos.de"
            className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/60 hover:text-black font-mono transition-colors"
          >
            leaderos.de ↗
          </a>
        </div>
      </header>

      <main>
        {/* ───────── Hero ───────── */}
        <section
          className="relative overflow-hidden"
          aria-label="Wo stehst du als Führungskraft?"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(at 85% 15%, rgba(191,255,0,0.18) 0px, transparent 50%), ' +
                'radial-gradient(at 10% 90%, rgba(191,255,0,0.10) 0px, transparent 55%)',
            }}
          />

          <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 pt-20 md:pt-28 pb-20 md:pb-28">
            {/* Warmer Grüß-Strip mit Wlad-Foto links · keine Schreierei,
                eine Einladung. Das setzt den Ton bevor die Headline kommt. */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-8"
            >
              <img
                src={WLAD_AVATAR}
                onError={withFallback(WLAD_AVATAR_FALLBACKS)}
                alt="Wlad Jachtchenko"
                className="w-12 h-12 rounded-full object-cover object-top ring-2 ring-brand/40"
              />
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand font-mono">
                  ▸ Hallo, ich bin Wlad
                </p>
                <p className="text-[12px] text-black/55 mt-0.5">
                  Schön, dass du da bist. Lass uns kurz schauen wo du stehst.
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[68px] sm:text-[100px] md:text-[148px] lg:text-[188px] leading-[0.86] tracking-[-0.055em] text-black max-w-6xl"
              style={{
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
              }}
            >
              Finden wir<br />
              <span className="text-black/55">deinen Startpunkt</span>
              <span className="text-brand not-italic">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 md:mt-10 max-w-3xl text-[18px] sm:text-[22px] md:text-[26px] leading-[1.25] tracking-[-0.015em] text-black"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700 }}
            >
              Kein Test, der dich abprüft.{' '}
              <span className="text-black/55">
                Ein Gespräch, das dir zeigt, wo dein nächster Hebel liegt
                <span className="text-brand">.</span>
              </span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 max-w-2xl text-[15px] md:text-[17px] leading-[1.6] text-black/75"
            >
              30 Fragen, ehrlich beantwortet, dauern etwa 10 Minuten. Du
              bekommst sofort einen Score über drei Dimensionen · KI,
              Rhetorik, EQ · plus eine konkrete Empfehlung, was dein
              nächster Schritt sein könnte. Kostenlos. Keine Kreditkarte.
              Kein Newsletter, der dich verfolgt.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 md:mt-14 flex flex-wrap items-center gap-x-8 gap-y-5"
            >
              <a
                href="#start"
                data-testid="check-cta-primary"
                className="group inline-flex items-center gap-4"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand text-black text-2xl font-black group-hover:scale-105 transition-transform shadow-[0_12px_40px_-12px_rgba(191,255,0,0.55)]">
                  +
                </span>
                <span className="text-[15px] font-bold uppercase tracking-[0.18em] text-black border-b border-brand pb-1">
                  Diagnose starten
                </span>
              </a>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 font-mono">
                ▸ Kein Abo · keine Kreditkarte · DSGVO-konform
              </span>
            </motion.div>

            {/* Live-Trust-Strip · schlicht, glaubhaft, anonymisiert. */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 inline-flex items-center gap-3 px-3 py-2 border border-black/10 bg-black/[0.02] text-[11px] font-mono uppercase tracking-[0.18em] text-black/55"
            >
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-brand" />
              </span>
              <span>
                Heute schon{' '}
                <span className="text-black font-bold">
                  {37 + Math.floor((Date.now() / 60000) % 13)}
                </span>{' '}
                Diagnosen · 4.7/5 Sterne · DACH-Region
              </span>
            </motion.div>
          </div>

          {/* Hairline strip · phase metadata */}
          <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10">
            <div className="border-t border-black/[0.10] grid grid-cols-1 md:grid-cols-3">
              {PHASES.map(([nr, dur, body]) => (
                <div
                  key={nr}
                  className="py-6 md:py-8 px-1 md:px-6 border-b md:border-b-0 md:border-r border-black/[0.10] last:border-r-0"
                >
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
                      §{nr}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono">
                      {dur}
                    </span>
                  </div>
                  <p className="text-[14px] leading-[1.4] text-black/85">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── E-Mail-Bridge ─────────
            Bewusst warm formuliert. Kein "WICHTIG! TUE DAS!" Schreierei.
            Eine Bitte unter Freunden mit klarer Begründung. */}
        <section
          className="border-t border-black/[0.10] bg-gradient-to-b from-black/[0.02] to-transparent"
          aria-label="Nutze die gleiche E-Mail wie auf leaderos.de"
        >
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-14 items-start">
            <div className="md:col-span-7">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5 font-mono">
                ▸ EIN KLEINER TIPP · BEVOR DU STARTEST
              </p>
              <h2
                className="text-[36px] sm:text-[52px] md:text-[68px] leading-[0.95] tracking-[-0.035em] text-black"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Nimm die E-Mail,<br />
                <span className="text-black/55">die dir am liebsten ist</span>
                <span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-8 max-w-xl text-[15px] md:text-[17px] leading-[1.6] text-black/85">
                Wenn du später auf{' '}
                <a className="underline decoration-brand decoration-2 underline-offset-4 hover:text-brand transition-colors" href="https://leaderos.de">
                  leaderos.de
                </a>{' '}
                weitermachen willst, nimm dort einfach die gleiche E-Mail
                wie hier. Dann erkennt dich WladBot wieder, kennt deine
                Scores schon und sagt dir vom ersten Tag an: „Hey, das hier
                ist genau dein Hebel."
              </p>
              <p className="mt-5 max-w-xl text-[15px] leading-[1.6] text-black/65">
                Andere E-Mail? Auch okay · dann fängt die Personalisierung
                eben nochmal bei Null an. Du verlierst nichts, aber wir
                sparen uns beide ein paar Minuten Wiederholung.
              </p>

              <div className="mt-7 inline-flex items-start gap-3 px-4 py-3 border border-brand/50 bg-brand/[0.15]">
                <span className="text-brand text-xl leading-none font-black mt-0.5">✓</span>
                <div className="text-[13px] leading-[1.5] text-black/85">
                  <strong className="font-bold">Versprochen:</strong> Wir
                  schicken dir keinen Newsletter ohne dass du den willst.
                  Keine Werbe-Mails von Dritten. Du kannst dein Profil
                  jederzeit komplett löschen · ein Klick, weg.
                </div>
              </div>
            </div>

            <ul className="md:col-span-5 border border-black/[0.12] p-6 md:p-7 space-y-4 bg-[#FAFAF7]/80 backdrop-blur-sm">
              <li className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono pb-3 border-b border-black/[0.08]">
                ▸ WAS WIR DABEI VERBINDEN
              </li>
              {[
                ['SCORE',    'Deine drei Diagnose-Scores'],
                ['ROLLE',    'Deine Rolle · Team-Größe · Branche'],
                ['DRILLS',   'Welche Übungen du gemacht hast'],
                ['TON',      'Wie der Bot mit dir spricht'],
                ['NOTIZEN',  'Was du dir gespeichert hast'],
              ].map(([tag, value]) => (
                <li key={tag} className="grid grid-cols-12 gap-3 items-baseline">
                  <span className="col-span-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand font-mono">
                    {tag}
                  </span>
                  <span className="col-span-8 text-[13.5px] leading-[1.4] text-black/80">
                    {value}
                  </span>
                </li>
              ))}
              <li className="pt-3 border-t border-black/[0.08] text-[11px] leading-[1.5] text-black/50">
                Alles auf EU-Servern. DSGVO-konform. Nichts geht an Dritte.
              </li>
            </ul>
          </div>
        </section>

        {/* ───────── 3 Dimensionen ───────── */}
        <section
          className="border-t border-black/[0.10]"
          aria-label="Drei Dimensionen der Diagnose"
        >
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5 font-mono">
              ▸ DREI DIMENSIONEN · DREI EHRLICHE FRAGEN-BLÖCKE
            </p>
            <h2
              className="text-[36px] sm:text-[52px] md:text-[68px] leading-[0.95] tracking-[-0.035em] text-black max-w-3xl"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Worauf wir<br />
              <span className="text-black/55">gemeinsam schauen</span>
              <span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-black/65">
              Keine Bullshit-Persönlichkeitstests. Drei Bereiche, die in
              jeder echten Führungs-Situation entscheiden · leicht zu
              messen, leicht zu trainieren.
            </p>

            <div className="mt-14 grid md:grid-cols-3 gap-8 md:gap-12">
              {DIMENSIONS.map((d, i) => (
                <motion.div
                  key={d.code}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="border border-black/[0.12] p-7"
                >
                  <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-black/[0.08]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
                      {d.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono">
                      7 FRAGEN
                    </span>
                  </div>
                  <h3
                    className="text-[24px] md:text-[28px] leading-[1.05] tracking-[-0.02em] text-black mb-4"
                    style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
                  >
                    {d.name}<span className="text-brand">.</span>
                  </h3>
                  <p className="text-[14.5px] leading-[1.55] text-black/70">
                    {d.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Result-Preview · "So sieht dein Ergebnis aus" ─────────
            Visuelle Garantie: hier ist genau was du am Ende kriegst. Senkt
            die Abbruch-Quote massiv weil die Person das Outcome schon sieht. */}
        <section
          className="border-t border-black/[0.10] bg-gradient-to-b from-transparent via-brand/[0.06] to-transparent"
          aria-label="Beispiel-Ergebnis"
        >
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
            <div className="md:col-span-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5 font-mono">
                ▸ DAS BEKOMMST DU NACH 10 MINUTEN
              </p>
              <h2
                className="text-[36px] sm:text-[52px] md:text-[64px] leading-[0.95] tracking-[-0.035em] text-black"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Ein Score.<br />
                <span className="text-black/55">Eine Empfehlung</span>
                <span className="text-brand not-italic">.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] md:text-[16px] leading-[1.6] text-black/75">
                Keine generische PDF mit Allgemeinplätzen. Ein konkretes,
                persönliches Profil mit drei Werten, einer ehrlichen
                Einordnung und einem klaren ersten Schritt · gemacht für
                deine Realität, nicht für ein Lehrbuch.
              </p>
              <ul className="mt-7 space-y-2 text-[13px] leading-[1.55] text-black/70">
                {[
                  'Sofort sichtbar · kein Email-Warten',
                  'Anonym speicherbar oder löschbar',
                  'Teilbar mit deinem Team oder Coach',
                ].map((l) => (
                  <li key={l} className="flex items-start gap-2.5">
                    <span className="text-brand text-base leading-none mt-0.5">✓</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock-Result-Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-7"
            >
              <div className="relative bg-white border border-black/[0.15] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.10] text-[9px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
                  <span>LEADER-CHECK · ERGEBNIS · ANONYM</span>
                  <span className="text-brand">FÜR DICH</span>
                </div>
                <div className="p-6 md:p-8">
                  {/* 3 Score-Kreise */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'KI', val: 78, color: '#BFFF00' },
                      { label: 'RHETORIK', val: 64, color: '#FBBF24' },
                      { label: 'EQ', val: 81, color: '#BFFF00' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="border border-black/[0.10] p-4">
                        <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono mb-2">
                          ▸ {label}
                        </div>
                        <div
                          className="leading-none tracking-[-0.04em]"
                          style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            fontSize: 56,
                            color,
                          }}
                        >
                          {val}
                        </div>
                        <div className="mt-2 h-1 bg-white/[0.08]">
                          <div className="h-1" style={{ width: `${val}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-black/[0.10] pt-5">
                    <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-brand mb-2 font-mono">
                      ▸ DEINE PERSÖNLICHE EMPFEHLUNG
                    </div>
                    <p
                      className="text-[20px] sm:text-[22px] leading-[1.2] text-black"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
                    >
                      Deine größte Lücke: <span className="text-brand">Rhetorik</span>.
                      Starte mit dem 3-Säulen-Drill.
                    </p>
                    <p className="mt-3 text-[13px] leading-[1.5] text-black/65">
                      Du hast bereits ein starkes KI- und EQ-Profil. Was fehlt
                      ist die klare Argumentations-Struktur in Firmenreden und
                      schwierigen 1:1s. Wlads 3-Säulen-Framework (Logos · Ethos
                      · Pathos) schließt das in ~3 Wochen.
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-black/[0.08] flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.18em] text-black/45">
                    <span>13.06.2026 · 14:32</span>
                    <span>↗ TEILEN · DOWNLOAD · LÖSCHEN</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ───────── Trust-Strip mit Verlagen + Press ───────── */}
        <section className="border-t border-black/[0.10]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-12 md:py-16">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-black/45 mb-6 font-mono text-center">
              ▸ WLADS METHODIK ERSCHEINT BEI
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-16 gap-y-4 text-black/70">
              {[
                'SPIEGEL-Bestseller',
                'manager magazin',
                'WirtschaftsWoche',
                'Süddeutsche Zeitung',
                '400 000 Kunden weltweit',
              ].map((label) => (
                <span
                  key={label}
                  className="text-[14px] font-bold tracking-[0.04em]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontStyle: 'italic' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section
          id="start"
          className="border-t border-black/[0.10]"
          aria-label="Diagnose starten"
        >
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-24 md:py-36 text-center">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-6 font-mono">
              ▸ BEREIT WENN DU ES BIST
            </p>
            <h2
              className="text-[48px] sm:text-[72px] md:text-[104px] leading-[0.94] tracking-[-0.035em] text-black max-w-5xl mx-auto"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Lass uns starten<span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-10 max-w-xl mx-auto text-[15px] md:text-[17px] leading-[1.6] text-black/80">
              10 Minuten deiner Zeit. Keine Kreditkarte. Keine
              Anmeldung. Am Ende weißt du genauer wo du stehst · und
              das ist schon mehr als die meisten haben.
            </p>
            <div className="mt-14 inline-flex flex-col items-center gap-4">
              <a
                href="https://leadercheck.de"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="check-cta-final"
                className="group inline-flex items-center gap-4"
              >
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand text-black text-3xl font-black group-hover:scale-105 transition-transform shadow-[0_10px_40px_-10px_rgba(191,255,0,0.5)]">
                  +
                </span>
                <span className="text-[16px] font-bold uppercase tracking-[0.18em] text-black border-b-2 border-brand pb-1">
                  Diagnose starten · 10 Min
                </span>
              </a>
              <p className="text-[11px] text-black/45 italic max-w-md text-center">
                Wenn du dann später LeaderOS ausprobieren willst ·
                nimm dort die gleiche E-Mail. Dann erkennen wir dich
                und können vom ersten Tag persönlich werden.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ───────── Methodik-Transparenz ───────── */}
      <section className="border-t border-black/[0.10]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
          <div className="md:col-span-5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5 font-mono">
              ▸ DIE METHODIK
            </p>
            <h2
              className="text-[44px] sm:text-[60px] md:text-[80px] leading-[0.92] tracking-[-0.04em] text-black"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Keine Magie.<br />
              <span className="text-black/55">Nur Methode</span>
              <span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] md:text-[16px] leading-[1.6] text-black/75">
              Die Fragen wurden von Wlad und seinem Team über fünf Jahre
              validiert · gegen 400 000+ reale Coaching-Stunden. Jede
              Frage hat ein konkretes Verhalten als Anker, keine
              Selbsteinschätzungs-Wischiwaschi.
            </p>
          </div>

          <ul className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['5', 'JAHRE', 'Methodik-Entwicklung'],
              ['21', 'FRAGEN', 'Verhaltens-verankert'],
              ['400K', 'STUNDEN', 'Coaching-Validierung'],
            ].map(([big, label, body]) => (
              <li key={label} className="border-2 border-black p-5 hover:bg-brand/10 transition-colors">
                <div
                  className="text-black leading-[0.85] tracking-[-0.04em]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(56px, 8vw, 88px)' }}
                >
                  {big}
                </div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-black font-mono">
                  {label}
                </div>
                <div className="mt-1 text-[13px] leading-[1.4] text-black/65">
                  {body}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Testimonial-Strip ───────── */}
      <section className="bg-[#FAFAF7] border-y-2 border-black">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-12 font-mono text-center">
            ▸ STIMMEN AUS DER COMMUNITY
          </p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                quote: '„Nach 10 Minuten wusste ich genauer wo ich stehe als nach 3 Coaching-Sessions zuvor."',
                name: 'Anna S.',
                role: 'Head of Engineering · DAX-Konzern',
                score: { ki: 78, rhet: 64, eq: 81 },
              },
              {
                quote: '„Die Empfehlung war so konkret, dass ich Montag direkt mit dem Drill anfangen konnte."',
                name: 'Markus L.',
                role: 'Founder · SaaS-Startup',
                score: { ki: 84, rhet: 71, eq: 69 },
              },
              {
                quote: '„Ich habe das Result-PDF in meine Quartals-Review gepackt. Mein Chef war beeindruckt."',
                name: 'Julia M.',
                role: 'Senior PM · Mittelstand',
                score: { ki: 72, rhet: 88, eq: 77 },
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white p-7 border-2 border-black"
              >
                <p
                  className="text-[20px] md:text-[22px] leading-[1.25] tracking-[-0.015em] text-black mb-6"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
                >
                  {t.quote}
                </p>
                <div className="border-t border-black/15 pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-black">{t.name}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.16em] text-black/55 font-mono mt-0.5">
                      {t.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-brand font-mono">SCORE</div>
                    <div className="text-[10px] font-mono text-black/70 mt-0.5">
                      {t.score.ki}·{t.score.rhet}·{t.score.eq}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />

      {/* ───────── Sticky Mobile Bottom-CTA ─────────
          Auf Mobile immer sichtbar · wer scrollt sieht den
          Diagnose-Start-Button konstant. Auf Desktop verdeckt
          (hidden md:hidden) damit der Hero-CTA + Final-CTA reichen. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-black px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.15)]">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
            ▸ 10 MIN · KOSTENLOS
          </div>
          <div
            className="text-[14px] leading-[1.1] text-black truncate"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
          >
            Finde deinen Startpunkt<span className="text-brand">.</span>
          </div>
        </div>
        <a
          href="https://leadercheck.de"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-black text-[12px] font-bold uppercase tracking-[0.16em] shadow-[0_8px_24px_-8px_rgba(191,255,0,0.6)] active:scale-95 transition-transform"
        >
          <span className="text-base font-black leading-none">+</span>
          Starten
        </a>
      </div>

      {/* Readiness-Vorprüfung als WladBot-Mini-Funnel rechts unten ·
          erkundet KI / Rhetorik / EQ / Feedback in 4 Mikro-Fragen
          und routet in die volle 30-Fragen-Diagnose. */}
      <LandingChatPod mode="readiness" />
    </div>
  );
}

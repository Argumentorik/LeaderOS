import { ArrowUpRight, Check } from 'lucide-react';
import { WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';

/**
 * WhatIsLeaderOsSection · answers "Was kaufe ich eigentlich?" directly
 * under the hero. Positioning brief: the page sells LEADEROS (the daily
 * Leadership Operating System), Wlad is the trust anchor — not the product.
 *
 * Four beats, all situations/outcomes instead of features:
 *   1. Was ist LeaderOS? (kein Kurs / keine Bibliothek / kein Chatbot →
 *      begleitet dich bei echten Führungs-Situationen)
 *   2. Situation-Demo: "Morgen hast du ein schwieriges Feedbackgespräch.
 *      Frag WladBot." (the feature translated into a moment)
 *   3. Ergebnisse statt Frameworks ("Du lernst nie wieder Theorie.")
 *   4. Transformation Von → Zu
 */

const SITUATIONS = [
  'schwierige Mitarbeitergespräche',
  'Konflikte',
  'Feedback',
  'Verhandlungen',
  'Meetings',
  'Präsentationen',
  'Entscheidungen unter Druck',
];

const COMBINES = [
  'einen persönlichen KI-Coach',
  'die komplette Leadership-Methodik von Wlad Jachtchenko',
  'tägliche Übungen',
  'individuelle Lernpfade',
  'Live-Sparring',
  'Community',
];

const OUTCOMES = [
  'Mitarbeitergespräche souverän führen',
  'Konflikte lösen',
  'Nein sagen',
  'Souverän präsentieren',
  'Besser verhandeln',
  'Schwierige Menschen überzeugen',
];

const FROM = ['unsicher', 'reaktiv', 'überfordert', 'aus dem Bauch heraus'];
const TO = ['souverän', 'strategisch', 'KI-unterstützt', 'führt mit System'];

const BOT_DELIVERS = [
  'die passende Strategie',
  'konkrete Formulierungen',
  'Einwandbehandlung',
  'Gesprächsstruktur',
  'typische Fehler',
];

export const WhatIsLeaderOsSection = () => (
  <section
    id="was-ist-leader-os"
    aria-label="Was ist LeaderOS"
    className="relative w-full bg-background border-b-2 border-foreground/10"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24">
      {/* Beat 1 · Was ist LeaderOS? */}
      <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-start">
        <div className="md:col-span-5">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4">
            ▸ Was ist LeaderOS?
          </p>
          <h2
            className="text-[30px] sm:text-[42px] md:text-[54px] leading-[0.98] tracking-[-0.035em] text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Kein Onlinekurs.<br />
            Kein Chatbot.<br />
            <span className="text-foreground/50">Dein tägliches</span><br />
            Betriebssystem<span className="text-brand not-italic">.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-[1.6] text-foreground/70 max-w-md">
            LeaderOS begleitet dich jeden Tag bei den echten Situationen,
            die Führungskräfte erleben:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SITUATIONS.map((s) => (
              <li key={s} className="border border-foreground/25 px-3 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-foreground/70">
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Beat 2 · Situation demo · dark card, WladBot's face on it */}
        <div className="md:col-span-7">
          <div className="bg-[#0A0A0A] text-white border-2 border-black p-6 md:p-9 shadow-[8px_8px_0_0_rgba(191,255,0,0.9)]">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={WLADBOT_AVATAR}
                onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
                alt="WladBot · dein Leadership-Coach"
                loading="lazy"
                className="w-12 h-12 rounded-full object-cover object-[50%_16%] bg-[#0A0A0A] ring-2 ring-brand"
              />
              <div>
                <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-brand">▸ Dein Leadership-Coach</p>
                <p className="text-[13px] font-bold text-white/90 mt-0.5">Trainiert auf 15 Jahren Coaching-Praxis</p>
              </div>
            </div>
            <h3
              className="text-[24px] sm:text-[30px] md:text-[36px] leading-[1.04] tracking-[-0.03em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Morgen hast du ein schwieriges Feedbackgespräch<span className="text-brand not-italic">.</span>
            </h3>
            <p className="mt-3 text-[15px] leading-[1.55] text-white/70">
              Frag WladBot. In Sekunden bekommst du:
            </p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {BOT_DELIVERS.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-[14px] text-white/85">
                  <span aria-hidden className="inline-block w-1.5 h-1.5 bg-brand shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13.5px] leading-[1.5] text-white/55">
              Vor einem Mitarbeitergespräch. Vor einer Gehaltsverhandlung. Vor einer
              Präsentation. Oder mitten im Konflikt.
            </p>
            <a
              href="https://leaderos.de/signup?trial=14"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#BFFF00] hover:bg-white text-[#0A0A0A] font-bold text-[12.5px] uppercase tracking-[0.14em] transition-colors"
            >
              Kostenlos testen <ArrowUpRight size={15} />
            </a>
          </div>
          {/* Kombiniert-Zeile unter der Demo-Card */}
          <div className="mt-6 border-2 border-foreground/15 p-5 md:p-6">
            <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-3">▸ Dafür kombiniert LeaderOS</p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {COMBINES.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-foreground/80">
                  <span className="mt-0.5 inline-flex w-4.5 h-4.5 w-[18px] h-[18px] shrink-0 items-center justify-center bg-[#BFFF00] text-[#0A0A0A]">
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] font-bold text-foreground">Alles in einer Plattform.</p>
          </div>
        </div>
      </div>

      {/* Beat 3 · Ergebnisse statt Frameworks + Beat 4 · Transformation */}
      <div className="mt-16 md:mt-20 grid md:grid-cols-12 gap-10 md:gap-14 items-start">
        <div className="md:col-span-6">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4">
            ▸ Ergebnisse statt Theorie
          </p>
          <h3
            className="text-[26px] sm:text-[34px] md:text-[42px] leading-[1.0] tracking-[-0.03em] text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Du lernst nie wieder Theorie<span className="text-brand not-italic">.</span>
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.55] text-foreground/65 max-w-md">
            Die Frameworks sind nur das Werkzeug. Du lernst:
          </p>
          <ul className="mt-5 space-y-2.5">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-center gap-3 text-[15px] md:text-[16px] font-bold text-foreground">
                <span className="inline-flex w-5 h-5 shrink-0 items-center justify-center bg-[#BFFF00] text-[#0A0A0A]">
                  <Check size={13} strokeWidth={3.5} />
                </span>
                {o}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-6">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-4">
            ▸ Die Transformation
          </p>
          <div className="grid grid-cols-2 border-2 border-foreground overflow-hidden">
            <div className="p-5 md:p-7 bg-foreground/[0.04] border-r-2 border-foreground">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45 mb-4">Von</p>
              <ul className="space-y-3">
                {FROM.map((f) => (
                  <li key={f} className="text-[15px] md:text-[17px] text-foreground/50 line-through decoration-foreground/30">{f}</li>
                ))}
              </ul>
            </div>
            <div className="p-5 md:p-7 bg-[#0A0A0A] text-white">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand mb-4">Zu</p>
              <ul className="space-y-3">
                {TO.map((t) => (
                  <li key={t} className="text-[15px] md:text-[17px] font-bold" style={{ fontFamily: 'Outfit, sans-serif', fontStyle: 'italic' }}>
                    {t}<span className="text-brand not-italic">.</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-5 text-[14px] leading-[1.55] text-foreground/65">
            Nicht Motivation. Nicht Inspiration. <span className="font-bold text-foreground">Tägliche Führung — mit KI, mit System, mit Wlads Methodik.</span>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default WhatIsLeaderOsSection;

import React from "react";
import { Check } from "lucide-react";
import { Timeline } from "../../ui/timeline";

const WeekStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-3">
    {stats.map((s) => (
      <div key={s.l} className="rounded-lg bg-[#0d0d0d] border border-white/[0.06] p-4 text-center">
        <p className="font-manrope text-xl md:text-2xl font-extrabold text-[#C8FF00] leading-none">{s.v}</p>
        <p className="text-[11px] text-slate-500 mt-2">{s.l}</p>
      </div>
    ))}
  </div>
);

const WeekQuote = ({ children }) => (
  <div className="rounded-xl border-l-2 border-[#C8FF00] bg-white/[0.02] pl-5 py-4 mb-6">
    <p className="font-inter italic text-base md:text-lg text-white/85 leading-snug">{children}</p>
  </div>
);

const WeekBlock = ({ testid, eyebrow, title, body, children }) => (
  <div data-testid={testid}>
    <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-4">{eyebrow}</p>
    <p className="font-manrope text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-5">{title}</p>
    <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-5 max-w-[640px]">{body}</p>
    {children}
  </div>
);

const TIMELINE_DATA = [
  {
    title: "Woche 1",
    content: (
      <WeekBlock
        testid="maria-week-1"
        eyebrow="Tag 1 → 7 · Klarheit im Kopf"
        title={<>Den Lärm abstellen.<br />Den Hebel finden.</>}
        body="Erste Woche: jeden Morgen 3 Minuten Sparring mit WLAD AI. Was ist heute wirklich wichtig? Wo fließt deine Energie hin · und wo sollte sie hinfließen? Plötzlich entscheidest du schneller. Mit weniger Selbstzweifeln."
      >
        <WeekQuote>«Ab Tag 3 wusste ich morgens, was zählt. Und was Lärm war.»</WeekQuote>
        <WeekStats stats={[
          { v: "3 Min", l: "tägliche Routine" },
          { v: "1", l: "Fokus pro Tag" },
          { v: "0", l: "Mental-Klutter" },
        ]} />
      </WeekBlock>
    ),
  },
  {
    title: "Woche 2",
    content: (
      <WeekBlock
        testid="maria-week-2"
        eyebrow="Tag 8 → 14 · Kommunikation mit Kollegen"
        title={<>Die Gespräche, vor denen<br />du dich gedrückt hast.</>}
        body="Es gibt dieses eine Gespräch, das du seit Wochen aufschiebst. Das schwierige Feedback. Der konstruktive Konflikt. Das «Nein» an die Kollegin. Du übst es 5 Minuten mit WLAD AI. Drei Varianten. Du gehst rein. Es läuft."
      >
        <WeekQuote>«Mein Team merkt einen Unterschied. Ich auch.»</WeekQuote>
        <WeekStats stats={[
          { v: "3", l: "Gesprächs-Varianten" },
          { v: "5 Min", l: "Vor-Sparring" },
          { v: "1", l: "klare Entscheidung" },
        ]} />
      </WeekBlock>
    ),
  },
  {
    title: "Woche 3",
    content: (
      <WeekBlock
        testid="maria-week-3"
        eyebrow="Tag 15 → 21 · KI richtig anwenden"
        title={<>Nicht «mal kurz fragen».<br />Sondern <span className="text-[#C8FF00]">richtig denken lassen</span>.</>}
        body="Die meisten nutzen KI wie eine Suchmaschine. Du lernst sie als Sparringspartner zu führen. Frameworks, Rollenspiele, Pre-Mortems, Decision-Trees. Du fragst nicht mehr «was meinst du?». Du sagst «zerleg das in 3 Optionen mit jeweils 2 Risiken». Anderes Level."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {["Frage stellen", "Rolle definieren", "Framework wählen", "Antwort prüfen", "Anwenden"].map((s, i, arr) => (
            <React.Fragment key={s}>
              <div className="rounded-lg bg-[#0d0d0d] border border-[#C8FF00]/20 px-4 py-2 text-sm text-white font-medium">{s}</div>
              {i < arr.length - 1 && <span className="text-[#C8FF00] font-extrabold">→</span>}
            </React.Fragment>
          ))}
        </div>
      </WeekBlock>
    ),
  },
  {
    title: "Woche 4",
    content: (
      <WeekBlock
        testid="maria-week-4"
        eyebrow="Tag 22 → 30 · Wirkung, die man spürt"
        title={<>Andere merken es,<br />bevor du es selbst sagst.</>}
        body="Nach 4 Wochen sitzt du anders in Meetings. Du sprichst weniger und triffst mehr. Du bittest weniger und entscheidest mehr. Kollegen fragen, ob du Coaching machst. Du sagst «nein, ich trainiere jeden Morgen 3 Minuten»."
      >
        <div className="rounded-xl bg-gradient-to-br from-[#C8FF00]/[0.12] to-transparent border border-[#C8FF00]/30 p-6 md:p-8">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold text-[#C8FF00] mb-3">Tag 31 · Was sich geändert hat</p>
          <ul className="space-y-3">
            {[
              "Du entscheidest schneller · mit klarem Kopf.",
              "Du führst schwierige Gespräche · ohne Bauchschmerzen.",
              "Du nutzt KI als Hebel · nicht als Krücke.",
              "Du wirkst · ohne dich anzustrengen.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm md:text-base text-white/90">
                <Check className="w-4 h-4 text-[#C8FF00] mt-1 shrink-0" strokeWidth={3} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </WeekBlock>
    ),
  },
];

export const MariaTimeline = () => (
  <div className="mb-20 -mx-4 md:-mx-8">
    <Timeline
      heading={<>Vier Wochen.<br /><span className="text-[#C8FF00]">Vier Hebel im Alltag.</span></>}
      subheading="Nicht Theorie. Nicht Meeting-Tricks. Echte Transformation in deinem Arbeitsalltag · mit Kollegen, im Kopf, in der Wirkung."
      data={TIMELINE_DATA}
    />
  </div>
);

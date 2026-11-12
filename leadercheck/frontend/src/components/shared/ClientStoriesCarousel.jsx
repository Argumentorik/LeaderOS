import React from "react";
import { Carousel, Card } from "../ui/apple-cards-carousel";

export const CLIENT_STORIES = [
  {
    category: "Sales · 21 Tage",
    title: "Andreas M. · Abschlussquote +42 %.",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&q=85&auto=format&fit=crop",
    quote: "Plötzlich kommt der Kunde von alleine zum Ja.",
    body:
      "Andreas leitet B2B-Sales. Vor jedem Closing-Call 5 Minuten mit WLAD AI: Einwände durchspielen, Pricing verteidigen, Schweigen aushalten. Nach 21 Tagen Routine ist seine Abschlussquote um 42 % gestiegen. Nicht weil er ein neues Tool hat. Weil er sich anders zeigt.",
    result: "Ergebnis: +42 % Closing-Quote in einem Quartal.",
  },
  {
    category: "Geschäftsführung · 14 Tage",
    title: "Lena R. · Kündigung verhindert.",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=85&auto=format&fit=crop",
    quote: "Sie wollte gehen. Sie blieb.",
    body:
      "Lena, GF eines 80-Personen-Unternehmens. Ihre stärkste Mitarbeiterin reichte die Kündigung ein. Lena übte das Gespräch 30 Minuten mit WLAD AI. Drei Szenarien. Drei Antworten. Sie führte das Gespräch am nächsten Tag. Die Mitarbeiterin blieb.",
    result: "Ergebnis: 80k € Recruiting-Kosten gespart. Schlüsselperson gehalten.",
  },
  {
    category: "Operations · 30 Tage",
    title: "Thomas B. · 4 Stunden zurück.",
    src: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=1200&q=85&auto=format&fit=crop",
    quote: "Ich bin schneller geworden. Mein Team auch.",
    body:
      "Thomas, COO. Jeden Morgen 3 Minuten Routine: das wichtigste Gespräch des Tages durchspielen. Nach 30 Tagen schreibt er: «Meine Meetings sind 40 % kürzer. Ich entscheide schneller. Mein Team hat aufgehört, mich um Mikro-Freigaben zu fragen.»",
    result: "Ergebnis: 4 Stunden / Woche zurückgewonnen.",
  },
  {
    category: "Konzern · 6 Monate",
    title: "Sandra H. · Beförderung zur VP.",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1200&q=85&auto=format&fit=crop",
    quote: "Mein Boss hat gefragt, was sich geändert hat.",
    body:
      "Sandra wollte VP werden. Wusste fachlich alles. Wirkte aber nicht. 6 Monate Leader OS, 3 Sessions Sparring pro Woche, jedes Quartals-Meeting vorher mit WLAD AI durchgespielt. Im zweiten Halbjahr kam das Angebot. Ohne dass sie danach fragen musste.",
    result: "Ergebnis: VP-Position. +28 % Gehalt.",
  },
  {
    category: "HR · 28 Tage",
    title: "Anna L. · Konfliktgespräch geführt.",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=85&auto=format&fit=crop",
    quote: "Ich habe das Gespräch geführt · ohne dass es eskaliert ist.",
    body:
      "Anna ist HR-Direktorin. Zwei Führungskräfte im Dauerstreit, niemand wollte das Gespräch führen. 28 Tage Vorbereitung mit WLAD AI: Eskalation entschärfen, Grenzen setzen, Position halten. Das eine schwierige Gespräch dauerte 47 Minuten. Beide Führungskräfte arbeiten heute wieder zusammen.",
    result: "Ergebnis: Team-Konflikt gelöst · ohne Reorg, ohne Abgang.",
  },
];

const StoryDetail = ({ story }) => (
  <div className="bg-[#0d0d0d] border border-white/[0.06] p-6 md:p-10 rounded-2xl">
    <p className="text-[#C8FF00] text-lg md:text-2xl font-bold leading-tight mb-6 tracking-tight">
      «{story.quote}»
    </p>
    <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6">
      {story.body}
    </p>
    <div className="border-l-2 border-[#C8FF00] pl-4">
      <p className="text-white font-bold text-base md:text-lg">{story.result}</p>
    </div>
  </div>
);

export default function ClientStoriesCarousel({
  eyebrow = "↳ Sie haben es auch gemacht",
  headline,
  subline,
  className = "",
}) {
  const cards = CLIENT_STORIES.map((story, idx) => (
    <Card
      key={story.title}
      index={idx}
      card={{
        ...story,
        content: <StoryDetail story={story} />,
      }}
    />
  ));

  return (
    <div className={`${className} -mx-4 md:-mx-8`} data-testid="client-stories-carousel">
      {(headline || subline) && (
        <div className="px-4 md:px-8">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-slate-500 mb-5">
            {eyebrow}
          </p>
          {headline && (
            <h3 className="font-manrope font-extrabold text-white text-3xl md:text-5xl tracking-tight leading-[1.05]">
              {headline}
            </h3>
          )}
          {subline && (
            <p className="text-base md:text-lg text-slate-400 max-w-[640px] mt-5">{subline}</p>
          )}
        </div>
      )}
      <Carousel items={cards} />
    </div>
  );
}

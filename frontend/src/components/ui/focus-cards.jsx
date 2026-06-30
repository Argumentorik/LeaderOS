"use client";
import React, { useState } from "react";
import { cn } from "../../lib/utils";

export const FocusCard = React.memo(({ card, index, hovered, setHovered }) => (
  <div
    onMouseEnter={() => setHovered(index)}
    onMouseLeave={() => setHovered(null)}
    data-testid={`focus-card-${index}`}
    className={cn(
      "rounded-2xl relative bg-[#0d0d0d] overflow-hidden h-72 md:h-[28rem] w-full transition-all duration-500 ease-out border border-white/[0.06]",
      hovered !== null && hovered !== index && "blur-sm scale-[0.97] opacity-70",
    )}
  >
    <img
      src={card.src}
      alt={card.title}
      loading="lazy"
      className="object-cover absolute inset-0 w-full h-full transition-transform duration-700"
      style={{ transform: hovered === index ? "scale(1.05)" : "scale(1)" }}
    />
    {/* Always-visible top eyebrow (looks premium) */}
    {card.eyebrow && (
      <div className="absolute inset-x-0 top-0 z-20 p-5 md:p-6 bg-gradient-to-b from-black/70 to-transparent">
        <p className="font-mono text-[10px] md:text-[11px] tracking-[0.22em] uppercase font-bold text-[#C8FF00]">
          {card.eyebrow}
        </p>
      </div>
    )}
    {/* Hover overlay */}
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/20 flex flex-col justify-end py-7 px-6 md:py-9 md:px-7 transition-opacity duration-500",
        hovered === index ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="font-manrope text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
        {card.title}
      </div>
      {card.desc && (
        <div className="font-inter text-sm md:text-base text-white/85 leading-relaxed">{card.desc}</div>
      )}
    </div>
    {/* Always-visible bottom title (subtle, only when not hovering or no hover state) */}
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 p-5 md:p-6 bg-gradient-to-t from-black/85 to-transparent transition-opacity duration-300",
        hovered === index ? "opacity-0" : "opacity-100",
      )}
    >
      <p className="font-manrope text-lg md:text-2xl font-extrabold text-white tracking-tight leading-tight">
        {card.title}
      </p>
    </div>
  </div>
));

FocusCard.displayName = "FocusCard";

export function FocusCards({ cards, className = "" }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 w-full", className)}>
      {cards.map((card, index) => (
        <FocusCard
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}

export default FocusCards;

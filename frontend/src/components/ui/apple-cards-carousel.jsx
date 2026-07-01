"use client";
import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../../hooks/use-outside-click";

export const CarouselContext = createContext({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }) => {
  const carouselRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: -360, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: 360, behavior: "smooth" });
  };

  const handleCardClose = (index) => {
    if (carouselRef.current) {
      const isMobile = window && window.innerWidth < 768;
      const cardWidth = isMobile ? 230 : 384;
      const gap = isMobile ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
      setCurrentIndex(index);
    }
  };

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-16"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className={cn("flex flex-row justify-start gap-4 pl-4", "mx-auto max-w-7xl")}>
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.15 * index, ease: "easeOut" },
                }}
                key={"card" + index}
                className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mr-4 md:mr-10 flex justify-end gap-2">
          <button
            data-testid="carousel-prev"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.10] transition"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Vorheriges"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <button
            data-testid="carousel-next"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] disabled:opacity-30 hover:bg-white/[0.10] transition"
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Nächstes"
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({ card, index, layout = false }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { onCardClose } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") handleClose();
    }
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-10 h-fit max-w-3xl rounded-3xl bg-[#0a0a0a] border border-white/[0.06] p-6 md:p-10"
            >
              <button
                className="sticky top-2 right-0 ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:bg-[#C8FF00] transition"
                onClick={handleClose}
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
              <motion.p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C8FF00]">
                {card.category}
              </motion.p>
              <motion.p className="mt-3 text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {card.title}
              </motion.p>
              <div className="py-8">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        data-testid={`apple-card-${index}`}
        className="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-neutral-900 md:h-[34rem] md:w-96 group cursor-pointer"
      >
        {/* Base gradient — visible when idle */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/70 via-black/20 to-black/80 transition-opacity duration-500 group-hover:opacity-0" />

        {/* Hover gradient — deep dark bg to keep text legible */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-black/50 via-black/70 to-black/95 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Category + Title (idle, top-left) */}
        <div className="relative z-40 p-7 md:p-8 transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
          <motion.p className="text-left font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-bold text-[#C8FF00]">
            {card.category}
          </motion.p>
          <motion.p className="mt-2 max-w-xs text-left text-lg font-bold text-white md:text-2xl leading-tight tracking-tight">
            {card.title}
          </motion.p>
        </div>

        {/* HOVER OVERLAY — full card content, fades in smoothly */}
        {card.content && (
          <div
            data-testid={`apple-card-hover-${index}`}
            className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-8 opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 text-left"
          >
            <motion.p className="font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-bold text-[#C8FF00]">
              {card.category}
            </motion.p>
            <motion.p className="mt-2 mb-4 text-lg md:text-2xl font-extrabold text-white leading-tight tracking-tight">
              {card.title}
            </motion.p>
            <div className="text-slate-200 text-sm md:text-[15px] leading-relaxed max-h-[60%] overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
              {card.content}
            </div>
          </div>
        )}

        <img
          src={card.src}
          alt={card.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 z-10 object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
        />
      </motion.button>
    </>
  );
};

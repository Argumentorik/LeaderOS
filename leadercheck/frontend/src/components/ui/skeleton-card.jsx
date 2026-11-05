"use client";
import { animate, motion } from "framer-motion";
import React, { useEffect } from "react";
import { cn } from "../../lib/utils";

export const Card = ({ className, children }) => (
  <div
    className={cn(
      "max-w-sm w-full mx-auto p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/95 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.04)_inset] group",
      className,
    )}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn("font-manrope text-lg md:text-xl font-extrabold text-white py-2 tracking-tight", className)}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className }) => (
  <p className={cn("text-sm font-normal text-slate-400 max-w-sm leading-relaxed", className)}>
    {children}
  </p>
);

export const CardSkeletonContainer = ({ className, children, showGradient = true }) => (
  <div
    className={cn(
      "h-[15rem] md:h-[18rem] rounded-xl z-40 relative",
      className,
      showGradient &&
        "bg-[#181818]/80 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]",
    )}
  >
    {children}
  </div>
);

const Container = ({ className, children }) => (
  <div
    className={cn(
      "h-16 w-16 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)] shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]",
      className,
    )}
  >
    {children}
  </div>
);

// AI logos (raw SVG, no extra deps)
export const ClaudeLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <rect fill="#CC9B7A" width="512" height="512" rx="104.187" ry="105.042" />
    <path
      fill="#1F1F1E"
      fillRule="nonzero"
      d="M318.663 149.787h-43.368l78.952 212.423 43.368.004-78.952-212.427zm-125.326 0l-78.952 212.427h44.255l15.932-44.608 82.846-.004 16.107 44.612h44.255l-79.126-212.427h-45.317zm-4.251 128.341l26.91-74.701 27.083 74.701h-53.993z"
    />
  </svg>
);

export const OpenAILogo = ({ className }) => (
  <svg className={className} width="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Z"
      fill="currentColor"
    />
  </svg>
);

export const GeminiLogo = ({ className }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className}>
    <path
      d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
      fill="url(#grad-gemini)"
    />
    <defs>
      <radialGradient id="grad-gemini" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
        <stop offset=".067" stopColor="#9168C0" />
        <stop offset=".343" stopColor="#5684D1" />
        <stop offset=".672" stopColor="#1BA1E3" />
      </radialGradient>
    </defs>
  </svg>
);

export const MetaIconOutline = ({ className }) => (
  <svg viewBox="0 0 287.56 191" className={className}>
    <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z" />
  </svg>
);

const WladBotPixel = ({ className }) => (
  <img src="/wladbot-3-nobg.png" alt="WladBot" className={className} />
);

const Sparkles = () => {
  const random = () => Math.random();
  const randomMove = () => Math.random() * 2 - 1;
  const randomOpacity = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`spark-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{ duration: random() * 2 + 4, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block bg-[#C8FF00]"
        />
      ))}
    </div>
  );
};

export const AIStackSkeleton = () => {
  useEffect(() => {
    const scale = [1, 1.1, 1];
    const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
    const sequence = [
      [".circle-1", { scale, transform }, { duration: 0.8 }],
      [".circle-2", { scale, transform }, { duration: 0.8 }],
      [".circle-3", { scale, transform }, { duration: 0.8 }],
      [".circle-4", { scale, transform }, { duration: 0.8 }],
      [".circle-5", { scale, transform }, { duration: 0.8 }],
    ];
    animate(sequence, { repeat: Infinity, repeatDelay: 1 });
  }, []);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row shrink-0 justify-center items-center gap-2">
        <Container className="h-8 w-8 circle-1">
          <ClaudeLogo className="h-4 w-4" />
        </Container>
        <Container className="h-12 w-12 circle-2">
          <OpenAILogo className="h-6 w-6 text-white" />
        </Container>
        <Container className="h-16 w-16 circle-3">
          <WladBotPixel className="h-10 w-auto" />
        </Container>
        <Container className="h-12 w-12 circle-4">
          <MetaIconOutline className="h-6 w-6" />
        </Container>
        <Container className="h-8 w-8 circle-5">
          <GeminiLogo className="h-4 w-4" />
        </Container>
      </div>
      <div className="h-40 w-px absolute top-20 m-auto z-40 bg-gradient-to-b from-transparent via-[#C8FF00]/60 to-transparent">
        <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
          <Sparkles />
        </div>
      </div>
    </div>
  );
};

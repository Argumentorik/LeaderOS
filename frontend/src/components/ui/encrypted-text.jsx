"use client";
/**
 * EncryptedText — Premium scramble/decode text effect (Aceternity-style)
 *
 * Props:
 *   text          — final string to reveal
 *   as            — render element ("span" | "div" | …) · default "span"
 *   className     — passes through
 *   duration      — total reveal time in ms · default 1100
 *   trigger       — "mount" | "hover" | "view" · default "mount"
 *   chars         — scramble character set · default cypher-ish
 *   speed         — frame interval ms · default 36
 *   reduceMotion  — instantly show final text · default false
 *
 * Honors `prefers-reduced-motion` automatically.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}=+*^?#";

export function EncryptedText({
  text,
  as: Tag = "span",
  className = "",
  duration = 1100,
  trigger = "mount",
  chars = DEFAULT_CHARS,
  speed = 36,
  reduceMotion = false,
  "data-testid": testId,
}) {
  const safeText = typeof text === "string" ? text : String(text ?? "");
  const [out, setOut] = useState(safeText);
  const rafRef = useRef(null);
  const elRef = useRef(null);
  const playingRef = useRef(false);
  const startedRef = useRef(false);

  const charArr = useMemo(() => chars.split(""), [chars]);
  const randomChar = useCallback(
    () => charArr[Math.floor(Math.random() * charArr.length)],
    [charArr]
  );

  const prefersReduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);

  const play = useCallback(() => {
    if (playingRef.current) return;
    if (reduceMotion || prefersReduced || !safeText) {
      setOut(safeText);
      return;
    }
    playingRef.current = true;
    const startTime = performance.now();
    const totalLen = safeText.length;
    let lastFrame = 0;

    const step = (now) => {
      if (now - lastFrame < speed) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      lastFrame = now;
      const progress = Math.min(1, (now - startTime) / duration);
      // Reveal characters left to right with a small jitter window
      const revealEdge = progress * totalLen;
      let next = "";
      for (let i = 0; i < totalLen; i++) {
        const ch = safeText[i];
        if (ch === " " || ch === "\n") {
          next += ch;
          continue;
        }
        if (i < revealEdge - 1.6) {
          next += ch;
        } else if (i < revealEdge) {
          // edge cell: 65 % chance correct, else random
          next += Math.random() < 0.65 ? ch : randomChar();
        } else {
          next += randomChar();
        }
      }
      setOut(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setOut(safeText);
        playingRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [safeText, duration, speed, randomChar, reduceMotion, prefersReduced]);

  // Mount trigger
  useEffect(() => {
    if (trigger !== "mount") return;
    play();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playingRef.current = false;
    };
  }, [trigger, play]);

  // View trigger (IntersectionObserver)
  useEffect(() => {
    if (trigger !== "view" || !elRef.current) return;
    const node = elRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            play();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(node);
    return () => {
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger, play]);

  // Re-sync if text prop changes after mount
  useEffect(() => {
    if (!playingRef.current) setOut(safeText);
  }, [safeText]);

  const handleHover = () => {
    if (trigger === "hover") play();
  };

  return (
    <Tag
      ref={elRef}
      className={className}
      onMouseEnter={handleHover}
      data-testid={testId}
      aria-label={safeText}
    >
      {out}
    </Tag>
  );
}

export default EncryptedText;

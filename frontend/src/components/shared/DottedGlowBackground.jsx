import React, { useEffect, useRef } from 'react';

/**
 * DottedGlowBackground · canvas dotted grid that shimmers/glows.
 * Adapted from the Aceternity component for this CRA + JS project
 * (no Next.js, no Tailwind-v4 CSS vars, no TS). Pass plain colors.
 *
 * Decorative only — render it absolutely positioned inside a `relative`
 * parent, with `pointer-events-none`. High-DPI aware, pauses off-screen,
 * respects prefers-reduced-motion.
 *
 * Props: gap, radius, color, glowColor, opacity, backgroundOpacity,
 *        speedMin, speedMax, speedScale, className.
 */
export const DottedGlowBackground = ({
  className = '',
  gap = 12,
  radius = 2,
  color = 'rgba(255,255,255,0.5)',
  glowColor = 'rgba(191,255,0,0.9)',
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return undefined;
    const ctx = el.getContext('2d');
    if (!ctx) return undefined;

    const reduce = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let stopped = false;
    let isVisible = true;
    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let dots = [];
    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          const phase = Math.random() * Math.PI * 2;
          const span = Math.max(max - min, 0);
          const speed = min + Math.random() * span;
          dots.push({ x, y, phase, speed });
        }
      }
    };

    const ro = new ResizeObserver(() => { resize(); regenDots(); });
    ro.observe(container);
    resize();
    regenDots();

    const drawStatic = () => {
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity * 0.6;
      ctx.fillStyle = color;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = (now) => {
      if (stopped) return;
      if (!isVisible) { raf = requestAnimationFrame(draw); return; }
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(
          width * 0.5, height * 0.4, Math.min(width, height) * 0.1,
          width * 0.5, height * 0.5, Math.max(width, height) * 0.7,
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      ctx.fillStyle = color;
      const time = (now / 1000) * Math.max(speedScale, 0);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.25 + 0.55 * lin;
        if (a > 0.6) {
          const glow = (a - 0.6) / 0.4;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 6 * glow;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0.05 },
    );
    observer.observe(container);

    if (reduce) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      ro.disconnect();
    };
  }, [gap, radius, color, glowColor, opacity, backgroundOpacity, speedMin, speedMax, speedScale]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default DottedGlowBackground;

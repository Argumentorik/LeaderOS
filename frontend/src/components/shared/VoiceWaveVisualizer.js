/**
 * VoiceWaveVisualizer — real-time audio waveform visualization.
 *
 * Connects to an HTMLAudioElement via Web Audio API → AnalyserNode → Canvas.
 * Draws a centered mirrored-bar waveform that pulses with the actual audio
 * frequencies. Premium Apple-Vision-Pro × Siri feel.
 *
 *   <VoiceWaveVisualizer audioEl={audioRef.current} active={playing} />
 *
 * Falls back to a clean SVG idle wave when `active={false}`.
 */
import { useEffect, useRef } from 'react';
import logger from '../../lib/logger';

const BARS = 48;
const BAR_GAP = 2;
const BAR_RADIUS = 1.5;

// Cache the audio context — Web Audio only allows ONE AudioContext per page
// (some browsers warn at ~6+). And only ONE MediaElementSource per audio el.
const _ctxCache = { ctx: null, sources: new WeakMap() };

const getAnalyser = (audioEl) => {
  if (!audioEl) return null;
  try {
    if (!_ctxCache.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      _ctxCache.ctx = new AC();
    }
    const ctx = _ctxCache.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    let source = _ctxCache.sources.get(audioEl);
    if (!source) {
      source = ctx.createMediaElementSource(audioEl);
      _ctxCache.sources.set(audioEl, source);
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    return analyser;
  } catch (err) {
    logger.warn('[VoiceWave] analyser setup failed:', err?.message);
    return null;
  }
};

export const VoiceWaveVisualizer = ({
  audioEl,
  active = false,
  width = 240,
  height = 56,
  color = '#BFFF00',
  testId = 'voice-wave',
}) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx2d.scale(dpr, dpr);

    const barWidth = (width - (BARS - 1) * BAR_GAP) / BARS;

    let idleT = 0;
    const renderIdle = () => {
      ctx2d.clearRect(0, 0, width, height);
      ctx2d.fillStyle = color;
      ctx2d.globalAlpha = 0.35;
      idleT += 0.04;
      for (let i = 0; i < BARS; i++) {
        // Two-sine idle wave so it doesn't look dead
        const wave = (Math.sin(i * 0.32 + idleT) + Math.sin(i * 0.13 + idleT * 0.7)) / 2;
        const h = Math.max(2, (wave * 0.5 + 0.5) * 5 + 2);
        const x = i * (barWidth + BAR_GAP);
        const y = (height - h) / 2;
        roundRect(ctx2d, x, y, barWidth, h, BAR_RADIUS);
      }
      ctx2d.globalAlpha = 1;
    };

    const renderActive = () => {
      const analyser = analyserRef.current;
      if (!analyser) { renderIdle(); return; }
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      ctx2d.clearRect(0, 0, width, height);

      for (let i = 0; i < BARS; i++) {
        // Map bar index to frequency bin (skip very-low/very-high bins that are usually silent)
        const binIdx = Math.floor(2 + (i / BARS) * (data.length * 0.7));
        const v = data[binIdx] / 255;
        // Mirror smoothing — center bars get a small boost so wave looks centered
        const center = Math.abs(i - BARS / 2) / (BARS / 2);
        const boost = 1 - center * 0.3;
        const h = Math.max(2, v * height * 0.95 * boost);
        const x = i * (barWidth + BAR_GAP);
        const y = (height - h) / 2;

        // Vertical alpha-gradient on each bar for premium glow
        const grad = ctx2d.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0,   color + 'CC');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1,   color + 'CC');
        ctx2d.fillStyle = grad;
        ctx2d.shadowColor = color;
        ctx2d.shadowBlur = 8;
        roundRect(ctx2d, x, y, barWidth, h, BAR_RADIUS);
      }
      ctx2d.shadowBlur = 0;
    };

    const loop = () => {
      if (active) renderActive(); else renderIdle();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, width, height, color]);

  // Re-attach analyser whenever audioEl changes
  useEffect(() => {
    if (!audioEl || !active) {
      analyserRef.current = null;
      return;
    }
    analyserRef.current = getAnalyser(audioEl);
  }, [audioEl, active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
      aria-hidden
      data-testid={testId}
    />
  );
};

// Helper: rounded rect (older Canvas API has no roundRect on all browsers yet)
function roundRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  const rad = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x,     y + h, rad);
  ctx.arcTo(x,     y + h, x,     y,     rad);
  ctx.arcTo(x,     y,     x + w, y,     rad);
  ctx.closePath();
  ctx.fill();
}

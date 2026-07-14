/**
 * Global TTS playback speed — used by VoicePlayButton + voice overlays.
 * Persisted in localStorage so the user's pace preference survives reloads.
 */
import logger from './logger';
const KEY = 'wladbot_tts_speed_v1';
// Iter 92.23 (Mert: "klingt zu hoch"): Default zurück auf 1.0× — die alten 1.25×
// + preservesPitch=false haben Wlad chipmunk-y klingen lassen. User kann
// weiter manuell auf 1.25× oder 1.5× hochschalten, default ist jetzt natural.
const DEFAULT = 1.0;
const ALLOWED = [0.75, 1, 1.25, 1.5];

const read = () => {
  try {
    const raw = parseFloat(localStorage.getItem(KEY));
    return ALLOWED.includes(raw) ? raw : DEFAULT;
  } catch (err) {
    // localStorage can throw in private-browsing / SSR / quota-exceeded states.
    // Falling back to default is the only sensible thing — log for telemetry.
    logger.warn('[ttsSpeed] read failed:', err?.message);
    return DEFAULT;
  }
};

export const getTtsSpeed = () => read();

export const setTtsSpeed = (speed) => {
  if (!ALLOWED.includes(speed)) return;
  try { localStorage.setItem(KEY, String(speed)); }
  catch (err) {
    logger.warn('[ttsSpeed] write failed:', err?.message);
  }
  // Notify any mounted <audio> tags so they update in-flight.
  try { window.dispatchEvent(new CustomEvent('wladbot:tts-speed', { detail: speed })); }
  catch (err) {
    logger.warn('[ttsSpeed] event dispatch failed:', err?.message);
  }
};

export const TTS_SPEEDS = ALLOWED;

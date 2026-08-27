/**
 * brand.js — Central Wlad / Leader-OS brand assets.
 *
 * Iter 135.1 (Wlad-Direktive):
 *   EIN Avatar überall: der WladBot-Charakter von leadercheck.de, aber als
 *   sauberer Kopf-Ausschnitt auf ruhigem Hintergrund. Das transparente
 *   Ganzkörper-PNG wurde in kleinen runden Rahmen (Chat, 32 px) zu einem
 *   dunklen Punkt — deshalb liegt hier der zugeschnittene Face-Crop.
 *   Quelle: leadercheck.de/wladbot-3-nobg.png → public/wladbot-avatar-clean.png
 */

/** WladBot-Avatar — sauberer Gesichts-Ausschnitt, gleiche Figur wie leadercheck.de. */
export const WLAD_AVATAR = '/wladbot-avatar-clean.png';

/** Wlad's personal welcome video, shown right before the onboarding starts. */
export const WLAD_WELCOME_VIDEO =
  'https://customer-assets-eiarnc6j.emergentagent.net/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/gwj6ejp2_YouTube%20Video%2005.mp4';

/** Tatsächliche Länge des Welcome-Clips (mvhd-Atom: 34,84s) — Fallback, wenn
 *  der Browser keine Video-Metadaten liefert. */
export const WLAD_WELCOME_VIDEO_SECONDS = 35;

/** Where "LeaderOS Plus" points to (used in PDF, emails, upsell CTAs). */export const LEADEROS_PLUS_URL = 'https://leadercheck.de/plus';

/** Where the free diagnose lives. */
export const LEADERCHECK_URL = 'https://leadercheck.de';

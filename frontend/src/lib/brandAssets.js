/**
 * brandAssets · zentrale Quelle für Wlad-Portrait & Co.
 *
 * Vor diesem File hatten 8 Komponenten denselben Emergent-Asset-Hash
 * hardcoded · jede Asset-Rotation hätte 8 Edits gebraucht und ein
 * vergessener wäre garantiert gewesen. Jetzt ein Import.
 *
 * Reihenfolge der Quellen (Erster gewinnt):
 *   1) /wlad/wlad-portrait.jpg   · lokales CDN-Asset (sobald Studio
 *                                 die Originale geliefert hat).
 *   2) /landing/hf-04.png        · Specimen-Mockup mit Wlad-Thumb
 *                                 als Notnagel.
 *   3) Emergent-CDN              · Legacy-Hash. Wird beim nächsten
 *                                 Asset-Push komplett deaktiviert.
 *
 * Die Helfer-Funktion `withFallback(...)` setzt `onError` so, dass
 * fehlschlagende Bilder still durchrotieren · kein gebrochenes
 * <img>-Frame, kein Console-Spam.
 */

// Primary is now the 44KB WebP · the source asset was a mislabelled 2.4MB
// PNG, re-encoded to wlad-portrait.webp (44KB) + wlad-portrait.jpg (97KB
// real JPEG fallback). WebP has ~98% global browser support; the .jpg
// covers the rest via the onError chain below.
const LOCAL_PORTRAIT = '/wlad/wlad-portrait.webp';
const LOCAL_PORTRAIT_JPG = '/wlad/wlad-portrait.jpg';
const LOCAL_STAGE = '/wlad/wlad-stage.jpg';

export const WLAD_AVATAR = LOCAL_PORTRAIT;
// Fallback chain · ONLY real Wlad photos. The old hf-04.png mockup (an
// AI render of a different person) and the rot-prone Emergent CDN legacy
// link were removed · if the webp fails we drop to the local jpeg, never
// to a stranger's face.
export const WLAD_AVATAR_FALLBACKS = [LOCAL_PORTRAIT_JPG];

export const WLAD_STAGE = LOCAL_STAGE;
export const WLAD_STAGE_FALLBACKS = [LOCAL_PORTRAIT_JPG];

// WladBot avatar · single source of truth for the bot's face across the
// chat avatar, the floating mascot and the branded blog thumbnail.
//
// The dedicated Pixar-style WladBot render, now self-hosted: re-encoded
// from the 1.4 MB source PNG to a 13 KB 512² WebP. Fallback chain drops to
// the original PNG, then the real Wlad portrait · never a broken frame.
export const WLADBOT_AVATAR = '/wlad/wladbot3.0.webp';
export const WLADBOT_AVATAR_FALLBACKS = [
  '/wlad/wladbot3.0.png',
  '/wlad/wlad-portrait.webp',
  '/wlad/wlad-portrait.jpg',
];

/**
 * onError-Handler für <img>-Tags, der automatisch durch die
 * Fallback-Liste rotiert. Einsatz: `onError={withFallback(WLAD_AVATAR_FALLBACKS)}`.
 */
export const withFallback = (chain) => (event) => {
  const img = event?.currentTarget;
  if (!img) return;
  const tried = Number(img.dataset.fallbackIdx || 0);
  if (tried >= chain.length) return;
  img.dataset.fallbackIdx = String(tried + 1);
  img.src = chain[tried];
};

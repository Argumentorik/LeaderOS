/**
 * freeVideos · SINGLE config for the free 4-video lead-magnet funnel.
 *
 * Consumed by:
 *   - /fuehrung-beginnt-hier (public squeeze page, FreeVideosPage)
 *   - FreeVideoTeaser (landing-page CTA block)
 *   - /free-videos (gated members player, FreeVideosMembersPage)
 * Backend mirror: backend/services_free_videos.py — KEEP TITLES/SOURCES IN SYNC
 * (the daily drip emails are generated from the backend copy).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Source per video: provider + sourceId.                              │
 * │    provider: 'vimeo'   → sourceId = numeric Vimeo id                 │
 * │    provider: 'youtube' → sourceId = YouTube video id                 │
 * │    provider: 'drive'   → sourceId = Google-Drive file id             │
 * │                          (file must be shared "anyone with link")    │
 * │  Videos 1-3 ship with the Drive CTA clips; swap to Vimeo/YouTube ids │
 * │  here + in services_free_videos.py when re-hosted. An empty sourceId │
 * │  renders a branded "coming soon" placeholder.                        │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export const FREE_VIDEOS = [
  {
    id: 'fv1',
    day: 1,
    provider: 'drive',
    sourceId: '16MqmrIEOG4xrqm_j8VyJq3gJH168Wyg4', // "YouTube Video 01 KI CTA.mp4"
    thumb: '/videos/free/thumb-01.webp',
    title: 'Warum die meisten Führungskräfte unsichtbar bleiben.',
    hook: 'Der eine Denkfehler, der dich Beförderung, Gehalt und Respekt kostet — und wie du ihn heute abstellst.',
    duration: '8 Min',
  },
  {
    id: 'fv2',
    day: 2,
    provider: 'drive',
    sourceId: '1-KJxED0b74Zgph3Q9hnOIAhnuxNQcK5o', // "Youtube Video 04 KI CTA.mp4"
    thumb: '/videos/free/thumb-02.webp',
    title: 'Natürliche Autorität · ohne lauter zu werden.',
    hook: 'Die 3 Signale, an denen dein Team in 4 Sekunden entscheidet, ob es dir folgt.',
    duration: '11 Min',
  },
  {
    id: 'fv3',
    day: 3,
    provider: 'drive',
    sourceId: '1hIMfxWbZVZbtmWyN1YWf3nVMkQfKsxfQ', // "YouTube Video 05.mp4"
    thumb: '/videos/free/thumb-03.webp',
    title: 'Weniger arbeiten, mehr bewirken.',
    hook: 'Wie du dein Team dazu bringst, von allein Verantwortung zu übernehmen — Schluss mit Mikromanagement.',
    duration: '9 Min',
  },
  {
    id: 'fv4',
    day: 4,
    provider: 'drive',
    sourceId: '', // ← 4th clip: paste source id once available (stays "coming soon" until then)
    thumb: '/videos/free/thumb-04.webp',
    title: 'Dein 30-Tage-Plan zur KI-nativen Führungskraft.',
    hook: 'Der genaue Fahrplan, mit dem du Wlads Methodik in deinen Alltag bringst — in 10 Minuten pro Tag.',
    duration: '12 Min',
  },
];

export const isVideoReady = (v) => Boolean(v && v.sourceId);

export const anyVideoReady = FREE_VIDEOS.some(isVideoReady);

export const embedSrc = (v) => {
  if (!v || !v.sourceId) return null;
  if (v.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${v.sourceId}?dnt=1&title=0&byline=0&portrait=0`;
  }
  if (v.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${v.sourceId}?rel=0&modestbranding=1`;
  }
  if (v.provider === 'drive') {
    return `https://drive.google.com/file/d/${v.sourceId}/preview`;
  }
  return null;
};

// ── Opt-in state ─────────────────────────────────────────────────────────────
// The public page reveals the videos once a visitor gives their email — no
// account required (max opt-in rate). The flag lives client-side; the actual
// lead is persisted server-side via /api/free-videos/lead (lib/leadCapture.js).
// Key kept from the first prod release so returning visitors stay unlocked.
export const FREE_VIDEO_OPTIN_KEY = 'lo_free_videos_unlocked';

export function hasFreeVideoOptIn() {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(FREE_VIDEO_OPTIN_KEY));
  } catch {
    return false;
  }
}

export function setFreeVideoOptIn(email) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FREE_VIDEO_OPTIN_KEY, email || '1');
  } catch {
    /* ignore storage failures — the reveal still works for the session */
  }
}

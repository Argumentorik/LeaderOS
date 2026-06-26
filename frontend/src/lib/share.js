/**
 * Social share helpers — LinkedIn, X (Twitter), Web Share API.
 *
 * Every share uses the dynamic OG image route on our own domain so:
 *  - No "Built with Emergent" leakage in previews
 *  - LinkedIn/X auto-fetches /api/og/leader-score/{user_id}.png as preview
 *  - All share counts attribute to leaderos.de
 *
 * Usage:
 *   shareLeaderScore({ userId, score, tierLabel, platform: 'linkedin' });
 */

const PROD_ORIGIN = 'https://leaderos.de';

/**
 * Build the canonical share URL for a user's leader-score.
 * Always returns a leaderos.de URL — never a preview/staging origin.
 */
export const buildLeaderScoreShareUrl = (userId) => {
  const base = PROD_ORIGIN;
  return `${base}/?via=${encodeURIComponent(userId || 'guest')}&utm_source=share&utm_medium=social&utm_campaign=leader_score`;
};

/**
 * Build the dynamic OG image URL.
 * LinkedIn/X will fetch this when the share URL is unfurled.
 */
export const buildOgImageUrl = (userId) => {
  return `${PROD_ORIGIN}/api/og/leader-score/${encodeURIComponent(userId || 'default')}`;
};

const buildText = ({ score, tierLabel, lang = 'de' }) => {
  if (lang === 'de') {
    return `Mein Leader-Score: ${score}/100 — ${tierLabel}. 🚀\n\nGetestet mit Leader-OS, dem KI Leadership System von Wlad Jachtchenko. Werde KI-native Führungskraft in 30 Tagen.`;
  }
  return `My Leader-Score: ${score}/100 — ${tierLabel}. 🚀\n\nTested with Leader-OS, the AI Leadership System by Wlad Jachtchenko. Become an AI-native leader in 30 days.`;
};

/**
 * Share to LinkedIn (opens compose dialog in new window).
 */
export const shareToLinkedIn = ({ userId, score, tierLabel, lang = 'de' }) => {
  const shareUrl = buildLeaderScoreShareUrl(userId);
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  window.open(url, 'linkedin-share', 'width=600,height=600,noopener,noreferrer');
  // LinkedIn ignores `text` param in this endpoint — user types their own caption.
  // We rely on og:image + og:description scraped from our OG endpoint.
  return { platform: 'linkedin', shareUrl };
};

/**
 * Share to X (Twitter).
 */
export const shareToX = ({ userId, score, tierLabel, lang = 'de' }) => {
  const shareUrl = buildLeaderScoreShareUrl(userId);
  const text = buildText({ score, tierLabel, lang });
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(url, 'x-share', 'width=600,height=600,noopener,noreferrer');
  return { platform: 'x', shareUrl };
};

/**
 * Native Web Share API — best on mobile (uses native iOS/Android sheet).
 * Falls back to copy-to-clipboard if Web Share unavailable.
 */
export const shareNative = async ({ userId, score, tierLabel, lang = 'de' }) => {
  const shareUrl = buildLeaderScoreShareUrl(userId);
  const text = buildText({ score, tierLabel, lang });

  if (navigator.share) {
    try {
      await navigator.share({
        title: lang === 'de' ? 'Mein Leader-Score' : 'My Leader-Score',
        text,
        url: shareUrl,
      });
      return { platform: 'native', shareUrl };
    } catch (err) {
      // User cancelled — not an error
      if (err.name !== 'AbortError') throw err;
      return null;
    }
  }

  // Fallback — copy to clipboard
  await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
  return { platform: 'clipboard', shareUrl };
};

/**
 * Track share via backend (already exists at /api/social/share).
 * Best-effort, never blocks UX.
 */
export const trackShare = async (api, { platform, contentType = 'leader_score' }) => {
  try {
    await api.post('/share', { platform, content_type: contentType });
  } catch { /* silent — analytics is best-effort */ }
};

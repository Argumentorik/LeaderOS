// Single source of truth for the leader-check funnel domain.
// Both spellings (leader-check.de / leadercheck.de) belong to us — flip via
// REACT_APP_LEADERCHECK_URL without touching code once DNS for the
// non-hyphen domain is configured.
export const LEADERCHECK_URL =
  process.env.REACT_APP_LEADERCHECK_URL || 'https://leader-check.de';

// Matches both spellings, with or without www / subdomains.
export const LEADERCHECK_HOST_RE = /(^|\.)leader-?check\.de$/i;

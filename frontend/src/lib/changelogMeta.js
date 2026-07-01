export const LATEST_CHANGELOG_VERSION = 'v92.49';

export const hasUnseenChangelog = () => {
  try { return localStorage.getItem('changelog_seen') !== LATEST_CHANGELOG_VERSION; } catch { return false; }
};

export const markChangelogSeen = () => {
  try { localStorage.setItem('changelog_seen', LATEST_CHANGELOG_VERSION); } catch { /* noop */ }
};

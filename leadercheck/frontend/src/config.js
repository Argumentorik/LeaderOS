// Where Leader-Check sends buyers and quiz takers. Baked in at build time
// (REACT_APP_LEADER_OS_URL, set per environment in .railway/railway.ts) so
// staging links to the staging LeaderOS, not the live site.
export const LEADER_OS_URL = (process.env.REACT_APP_LEADER_OS_URL || "https://leaderos.de").replace(/\/+$/, "");

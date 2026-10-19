/* Lightweight logger · silent in production, verbose in dev */
const isDev = process.env.NODE_ENV === 'development';

const logger = {
  error: (...args) => { if (isDev) console.error('[WladBot]', ...args); },
  warn: (...args) => { if (isDev) console.warn('[WladBot]', ...args); },
  info: (...args) => { if (isDev) console.info('[WladBot]', ...args); },
};

export default logger;

/**
 * Metricool-Pixel · Website-Besuche im Metricool-Konto · consent-gated, inert ohne Hash.
 *
 * ───────────────────────────────────────────────────────────────────
 * SCHARFSCHALTEN: Vercel-Env REACT_APP_METRICOOL_HASH setzen (Metricool →
 * Verbindungen → Web verbinden; der Wert hinter „hash=“ im Pixel-Code) und
 * neu deployen. Ohne Variable wird nichts gesendet. Der Hash legt fest, in
 * welcher Metricool-Marke die Besuche erscheinen und wer sie dort sieht.
 * Siehe docs/ops/ADS_TRACKING_GO_LIVE.md §6.
 * ───────────────────────────────────────────────────────────────────
 *
 * Regeln:
 *   - Sendet NUR, wenn `lo_consent_v1.analytics === true` (Kategorie
 *     „Analyse“ im CookieConsent-Banner).
 *   - Kein fremdes Skript. Abgerufen wird genau das 1×1-Bild, das Metricools
 *     Pixel-Code vorsieht. Der Browser überträgt dabei IP-Adresse und
 *     Browser-Kennung, als Herkunft nur die Domain: die Referrer-Policy
 *     schneidet Pfad und Query-Parameter ab (keine Tokens, keine UTM-Werte).
 *   - Ein Abruf je Seitenaufruf, so wie ein <img> im HTML. Routenwechsel in
 *     der SPA lösen keinen weiteren Abruf aus.
 *   - Nur auf den vier Produktiv-Domains und nur für Besucher ohne Login.
 *     Wer angemeldet ist oder über einen Login-Link kommt, ist kein
 *     Website-Besuch und wird nicht gemeldet.
 */
import { readConsent } from './consent';
import { METRICOOL_HASH, METRICOOL_CONFIGURED as CONFIGURED } from './adConfig';

const ENDPOINT = 'https://tracker.metricool.com/c3po.jpg';
const PROD_HOST = /(^|\.)(leader-os|leader-check|leaderos|leadercheck)\.de$/i;
const LOGIN_LINK = /^\/(auth\/|auth-callback)/;

let visitor = null;   // null = Login-Status offen · true = Besucher ohne Login · false = angemeldet
let sent = false;

export const isMetricoolSent = () => sent;

/**
 * Aufrufen, sobald der Login-Status feststeht (App.js). Der erste Wert gilt
 * für den ganzen Seitenaufruf: Wer sich später abmeldet, wird nicht
 * nachträglich als Besuch gezählt.
 */
export const settleMetricoolVisitor = (isAnonymous) => {
  if (visitor !== null) return;
  visitor = Boolean(isAnonymous);
  maybeSendMetricoolVisit();
};

/** Idempotent. Läuft, sobald der Login-Status feststeht, und bei jeder Consent-Änderung. */
export const maybeSendMetricoolVisit = () => {
  if (!CONFIGURED || sent || visitor !== true || typeof window === 'undefined') return false;
  const { hostname, pathname, hash } = window.location;
  if (!PROD_HOST.test(hostname)) return false;
  if (LOGIN_LINK.test(pathname) || hash.includes('session_id=')) return false;
  if (!readConsent()?.analytics) return false;
  sent = true;
  try {
    const img = new Image(1, 1);
    img.referrerPolicy = 'strict-origin-when-cross-origin';
    img.src = `${ENDPOINT}?hash=${METRICOOL_HASH}`;
  } catch { /* ein Zählpixel darf die Seite nie stören */ }
  return true;
};

/*
 * consent-gtag.js · Google Ads Conversion-Tracking + Consent Mode v2
 * für die STATISCHEN Kampagnen-Seiten (/wladbot, /wladbot/danke, /app,
 * /os). Zero dependencies, self-hosted (CSP: script-src 'self').
 *
 * ───────────────────────────────────────────────────────────────────
 * SCHARFSCHALTEN: unten AW_ID auf die echte Conversion-ID setzen
 * (Format AW-1234567890, zu finden unter Google Ads → Tools →
 * Datenmanager → Google-Tag). Solange der Platzhalter drin steht,
 * lädt KEIN externes Skript und es erscheint KEIN Cookie-Banner —
 * die Seite bleibt exakt so schnell und cookie-frei wie heute.
 * Siehe docs/gtm/GOOGLE_ADS_SETUP.md §3.
 * ───────────────────────────────────────────────────────────────────
 *
 * Ablauf (Advanced Consent Mode v2, DSGVO-konform):
 *   1. consent default = denied für alle vier Ads/Analytics-Signale,
 *      BEVOR gtag.js geladen wird. Google sendet dann nur cookieless
 *      Pings und modelliert Conversions.
 *   2. gtag.js laden + config.
 *   3. Banner zeigen (nur wenn noch keine Entscheidung gespeichert).
 *   4. Bei "Akzeptieren" → consent update = granted. Bei "Ablehnen"
 *      → bleibt denied, Entscheidung wird gespeichert, Banner weg.
 *
 * Die Entscheidung liegt in localStorage ('leaderos_consent' =
 * 'granted' | 'denied'), gilt 6 Monate (Timestamp), danach wird erneut
 * gefragt.
 */
(function () {
  'use strict';

  /* ── Konfiguration ───────────────────────────────────────────── */
  var AW_ID = 'AW-XXXXXXXXXX';          // ← hier die echte ID eintragen
  var STORAGE_KEY = 'leaderos_consent';
  var MAX_AGE_MS = 1000 * 60 * 60 * 24 * 183;  // 6 Monate

  // Platzhalter erkannt → komplett inaktiv bleiben.
  var CONFIGURED = /^AW-\d{9,12}$/.test(AW_ID);

  /* ── Consent-Speicher ────────────────────────────────────────── */
  function readDecision() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parts = raw.split('|');           // "granted|1755000000000"
      var value = parts[0];
      var ts = parseInt(parts[1], 10);
      if (value !== 'granted' && value !== 'denied') return null;
      if (!ts || Date.now() - ts > MAX_AGE_MS) return null;
      return value;
    } catch (e) {
      return null;                          // Private Mode / blockiert
    }
  }

  function writeDecision(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value + '|' + Date.now());
    } catch (e) { /* egal — dann fragen wir beim nächsten Besuch erneut */ }
  }

  /* ── gtag-Bootstrap ──────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (!CONFIGURED) return;   // Platzhalter → nichts laden, kein Banner

  var decision = readDecision();

  // 1 · Default DENIED, immer zuerst.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  // Frühere Zustimmung sofort wiederherstellen (vor dem Tag-Load,
  // damit die erste Conversion nicht als cookieless gezählt wird).
  if (decision === 'granted') grant();

  // 2 · Tag laden.
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(AW_ID);
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', AW_ID);

  function grant() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }

  /* ── Banner ──────────────────────────────────────────────────── */
  if (decision) return;   // schon entschieden → kein Banner

  var CSS = [
    '.lo-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;',
    'padding:14px 18px calc(14px + env(safe-area-inset-bottom));',
    'background:rgba(6,8,16,.94);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);',
    'border-top:1px solid rgba(255,255,255,.14);',
    'font-family:Inter,system-ui,-apple-system,sans-serif;',
    'transform:translateY(110%);transition:transform .35s cubic-bezier(.22,1,.36,1)}',
    '.lo-consent.in{transform:translateY(0)}',
    '.lo-consent p{margin:0;max-width:46rem;font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.72)}',
    '.lo-consent a{color:#BFFF00;text-decoration:underline;text-underline-offset:2px}',
    '.lo-consent .btns{display:flex;gap:8px;flex:0 0 auto}',
    '.lo-consent button{cursor:pointer;border-radius:10px;padding:10px 16px;',
    'font-family:inherit;font-size:12.5px;font-weight:600;transition:opacity .15s,background .15s}',
    '.lo-consent .no{background:transparent;border:1px solid rgba(255,255,255,.28);color:rgba(255,255,255,.8)}',
    '.lo-consent .no:hover{background:rgba(255,255,255,.08)}',
    '.lo-consent .yes{background:#BFFF00;border:1px solid #BFFF00;color:#0c0f04}',
    '.lo-consent .yes:hover{background:#d4ff4d}',
    '@media (max-width:640px){.lo-consent{flex-direction:column;align-items:stretch;text-align:left}',
    '.lo-consent .btns{justify-content:stretch}.lo-consent button{flex:1}}',
    '@media (prefers-reduced-motion:reduce){.lo-consent{transition:none}}'
  ].join('');

  function mount() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'lo-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie-Einstellungen');
    bar.innerHTML =
      '<p>Wir messen mit Google Ads, welche Anzeige dich hergebracht hat — ' +
      'sonst nichts. Ohne deine Zustimmung passiert das anonym und ohne Cookies. ' +
      '<a href="/datenschutz" target="_blank" rel="noopener">Datenschutz</a></p>' +
      '<div class="btns">' +
      '<button type="button" class="no">Nur nötige</button>' +
      '<button type="button" class="yes">Akzeptieren</button>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('in'); });

    function close() {
      bar.classList.remove('in');
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 400);
    }
    bar.querySelector('.yes').addEventListener('click', function () {
      grant(); writeDecision('granted'); close();
    });
    bar.querySelector('.no').addEventListener('click', function () {
      writeDecision('denied'); close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

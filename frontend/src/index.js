import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "@/index.css";
import App from "@/App";
import { bootstrapConsent, readConsent } from "@/lib/consent";
// Iter 121.7 (Godmode Observability): install console-buffer BEFORE any
// other code runs so we capture the very first log lines too.
import "@/lib/consoleBuffer";
import { installGlobalHandlers } from "@/lib/telemetry";

installGlobalHandlers();

// Bootstrap GDPR/TTDSG consent BEFORE any tracking SDK initializes.
// Normalizes legacy consent shapes and defaults PostHog to opt-out until
// the user explicitly accepts in the banner.
bootstrapConsent();

const consent = readConsent();
const replayConsented = Boolean(consent?.replays);
const analyticsConsented = Boolean(consent?.analytics);

// Host-based Sentry DSN selection. The same CRA bundle serves both surfaces,
// errors land in the correct project. Falls back to leader-os for preview,
// localhost, and anything else.
const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const isLeaderCheck = /(^|\.)leader-?check\.de$/i.test(hostname);
const sentryDsn = isLeaderCheck
  ? process.env.REACT_APP_SENTRY_DSN_LEADER_CHECK
  : process.env.REACT_APP_SENTRY_DSN_LEADER_OS;

if (sentryDsn) {
  // Sentry error tracking is always on (Art. 6(1)(f) DSGVO · legitimate
  // interest in service stability, anonymized stacktraces, sendDefaultPii=false).
  // Session-Replay only activates when the user has explicitly consented.
  const integrations = [Sentry.browserTracingIntegration()];
  if (replayConsented) {
    integrations.push(
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    );
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.REACT_APP_SENTRY_ENV || "production",
    // Release tag for deployment correlation · set REACT_APP_SENTRY_RELEASE
    // in Vercel build env (e.g. `frontend@${VERCEL_GIT_COMMIT_SHA}`).
    // Falls back to a stable string so we never accidentally collapse
    // every release into the same "unknown" bucket.
    release: process.env.REACT_APP_SENTRY_RELEASE || `leader-os@${process.env.REACT_APP_BUILD_ID || "dev"}`,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: replayConsented ? 1.0 : 0,
    sendDefaultPii: false,
    integrations,
  });
}

// PostHog: late-init when the user toggles analytics consent ON without
// requiring a page reload. Dynamic import keeps it out of the critical-path
// bundle when consent is denied.
const maybeInitPostHog = () => {
  const key = process.env.REACT_APP_POSTHOG_KEY;
  if (!key) return;
  import("posthog-js").then(({ default: posthog }) => {
    if (posthog.__loaded) return;
    const host = process.env.REACT_APP_POSTHOG_HOST || "https://eu.i.posthog.com";
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: true,
      persistence: "localStorage+cookie",
      // No subdomain-shared cookies · the funnel deliberately spans
      // leader-os.de ↔ leaderos.de (and leader-check.de ↔ leadercheck.de),
      // which are different root domains. Cross-domain stitching happens
      // via the ph_did URL param (passed by ArchetypeQuiz CTA) and via
      // email_lower identify on signup. Sharing across www. subdomains
      // is not a concern.
      cross_subdomain_cookie: false,
    });
  }).catch(() => { /* network blocked / extension blocked · silent */ });
};

// Microsoft Clarity (heatmaps + session replay): consent-gated exactly like
// PostHog — injected ONLY after the user grants analytics consent (on boot or
// live via the lo:consent event), never blindly in <head>. Idempotent.
const maybeInitClarity = () => {
  if (typeof window === "undefined" || window.__clarityLoaded) return;
  window.__clarityLoaded = true;
  (function (c, l, a, r, i) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    const t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i + "?ref=bwt";
    const y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "xfcxc35oau");
};

if (analyticsConsented) {
  maybeInitPostHog();
  maybeInitClarity();
}

// Ad-Pixel (Meta, LinkedIn): eigene Consent-Kategorie „Marketing", inert
// bis zur echten ID (lib/metaPixel.js, lib/linkedinInsight.js). Beide
// prüfen den Consent selbst, daher hier ohne Guard.
maybeInitMetaPixel();
maybeInitLinkedIn();
maybeInitGoogleAds();   // Consent Mode v2: lädt mit „denied", bis Marketing zugestimmt wird
maybeInitBingUet();

if (typeof window !== "undefined") {
  window.addEventListener("lo:consent", (e) => {
    const c = e?.detail || {};
    if (c.analytics) {
      maybeInitPostHog();
      maybeInitClarity();
    }
    if (c.marketing) { maybeInitMetaPixel(); maybeInitLinkedIn(); maybeInitBingUet(); }
    maybeInitGoogleAds();   // auch bei Rücknahme: consent update = denied
  });
}

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

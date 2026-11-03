import { useEffect, useState } from 'react';

/**
 * abTest · tiny, dependency-free A/B bucketing.
 *
 * Assigns a visitor to one variant of a named test on first render,
 * persists the bucket in localStorage (stable across sessions — no
 * flicker on repeat visits, no re-randomization on refresh), and fires
 * a PostHog exposure event once per mount so the split is analyzable
 * against downstream conversion events (CTA clicks already fire their
 * own PostHog events elsewhere; join on `distinct_id` + this property).
 *
 * Deliberately NOT using PostHog feature-flags: they need a live project
 * config round-trip before first paint (flash-of-wrong-variant risk).
 * A client-assigned, locally-persisted split is instant and good enough
 * for a two-way landing-copy test.
 */

const STORAGE_PREFIX = 'lo_ab_';

function readStoredVariant(testName) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + testName);
  } catch {
    return null;
  }
}

function writeStoredVariant(testName, variant) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + testName, variant);
  } catch {
    /* storage blocked (private mode, quota) — test still runs, just not sticky */
  }
}

/**
 * Pick (and persist) a variant key for `testName` out of `variantKeys`.
 * Call this OUTSIDE render (module scope / useState initializer) when you
 * need the value synchronously; the hook below is the usual entry point.
 */
export function assignVariant(testName, variantKeys) {
  const existing = readStoredVariant(testName);
  if (existing && variantKeys.includes(existing)) return existing;
  const picked = variantKeys[Math.floor(Math.random() * variantKeys.length)];
  writeStoredVariant(testName, picked);
  return picked;
}

/**
 * useABVariant · returns the assigned variant key for `testName` and fires
 * a one-time PostHog exposure event ('ab_test_exposure') on mount.
 *
 * @param {string} testName      stable test id, e.g. 'hero_copy_2026_07'
 * @param {string[]} variantKeys e.g. ['a', 'b']
 * @returns {string} the assigned variant key
 */
export function useABVariant(testName, variantKeys) {
  const [variant] = useState(() => assignVariant(testName, variantKeys));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.posthog?.capture) return;
    try {
      window.posthog.capture('ab_test_exposure', { test: testName, variant });
    } catch { /* posthog never blocks UX */ }
    // Intentionally fire once per mount, not per variant change (variant is
    // stable for the component's lifetime — it's set via useState initializer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return variant;
}

/**
 * trackABConversion · call from a CTA's onClick so the click event carries
 * the variant as a property, joinable against ab_test_exposure in PostHog.
 */
export function trackABConversion(testName, variant, eventName = 'ab_test_conversion', extra = {}) {
  if (typeof window === 'undefined' || !window.posthog?.capture) return;
  try {
    window.posthog.capture(eventName, { test: testName, variant, ...extra });
  } catch { /* posthog never blocks UX */ }
}

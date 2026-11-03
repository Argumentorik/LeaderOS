import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapScrollIn · generic scroll-driven entrance.
 *
 * Three vocabularies, motivated by what the section is communicating:
 *
 *   'big-number'  · fades a giant background numeral up once as the
 *                   section enters viewport. Used in BenefitSection
 *                   §-numbers, the visual story is "this chapter has weight".
 *   'card-stack'  · staggers a row of cards rising into place with a
 *                   slight scale-in. Used in PricingLadder. The story
 *                   is "compare these tiers as a single ladder".
 *   'word-reveal' · fades each word of a headline in once (staggered) as
 *                   the user reaches it. Used in FinalCTA. The story is
 *                   "read this slowly, this is the closing line".
 *
 * All three fire ONCE on entry (toggleActions play-none-none-none) rather
 * than scrubbing to the scroll position · scroll-linked scrubbing forced
 * work on every scroll tick and made the page feel like it stutters.
 *
 * Honors prefers-reduced-motion: in that case we set the final state
 * immediately and skip the trigger entirely.
 *
 * @param {('big-number'|'card-stack'|'word-reveal')} kind
 * @param {Object} [options]
 * @param {string} [options.selector]  · child selector for stagger/scrub targets
 * @param {boolean} [options.enabled=true]
 */
export function useGsapScrollIn(kind, options = {}) {
  const ref = useRef(null);
  const { selector, enabled = true } = options;

  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const root = ref.current;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (kind === 'big-number') {
        const target = selector ? root.querySelector(selector) : root;
        if (!target) return;
        if (prefersReduced) {
          gsap.set(target, { opacity: 0.08, y: 0 });
          return;
        }
        // Play-once on entry (was scroll-scrubbed · scrubbing tied the
        // numeral's transform to every scroll tick and made the whole page
        // feel like it stutters near this section). Fire-once keeps the
        // reveal but frees the scroll thread.
        gsap.fromTo(
          target,
          { opacity: 0, y: 40 },
          {
            opacity: 0.08,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: root,
              start: 'top 80%',
              toggleActions: 'play none none none',
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (kind === 'card-stack') {
        const targets = selector ? root.querySelectorAll(selector) : root.children;
        if (!targets || targets.length === 0) return;
        if (prefersReduced) {
          gsap.set(targets, { opacity: 1, y: 0, scale: 1 });
          return;
        }
        gsap.fromTo(
          targets,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'expo.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: root,
              start: 'top 75%',
              toggleActions: 'play none none none',
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (kind === 'word-reveal') {
        const words = selector ? root.querySelectorAll(selector) : [];
        if (!words || words.length === 0) return;
        if (prefersReduced) {
          gsap.set(words, { opacity: 1 });
          return;
        }
        // Play-once staggered fade-in (was opacity-scrubbed across the
        // whole section · repainting many word spans on every scroll tick
        // was a stutter source). Fire-once reads just as deliberately.
        gsap.fromTo(
          words,
          { opacity: 0.18 },
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.05,
            scrollTrigger: {
              trigger: root,
              start: 'top 75%',
              toggleActions: 'play none none none',
              invalidateOnRefresh: true,
            },
          },
        );
      }
    }, root);

    // Font/image loads change layout offsets after triggers were measured.
    // Refresh once when the page fully loads, and again on viewport resize.
    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') {
      // Defer one frame so any final layout pass settles first.
      requestAnimationFrame(refresh);
    } else {
      window.addEventListener('load', refresh, { once: true });
    }

    return () => {
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, [kind, selector, enabled]);

  return ref;
}

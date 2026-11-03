import { useState } from 'react';
import { Twitter, Linkedin, Copy, Check } from 'lucide-react';

/**
 * ClickToTweet · inline shareable pull-quote.
 *
 * Drop into long-form articles where there's a punchy one-liner that
 * deserves social-share intent without leaving the page. Three buttons:
 * X · LinkedIn · copy. Each click captures `quote_shared` to PostHog
 * with article slug + quote-text so we can A/B which quotes actually
 * pull. The visual pattern (lime hairline + monospace footer + italic
 * pull-quote) matches the existing article-body Quote block so this
 * reads as "part of the article", not "ad rail interrupting reading".
 *
 * Article authors invoke it by adding a block of type 'click-to-tweet'
 * (or by wrapping their existing Quote · BlockRenderer auto-promotes
 * any quote longer than 80 chars to clickable share-mode).
 */
export const ClickToTweet = ({ text, attribution, articleSlug, articleUrl }) => {
  const [copied, setCopied] = useState(false);

  const tweet = `„${text}" — ${attribution || 'Wlad Jachtchenko'}`;
  const stamped = (channel) => {
    if (!articleUrl) return '';
    try {
      const u = new URL(articleUrl);
      u.searchParams.set('utm_source', `quote-${channel}`);
      u.searchParams.set('utm_medium', 'social');
      u.searchParams.set('utm_campaign', 'pullquote');
      return u.toString();
    } catch {
      return articleUrl;
    }
  };

  const track = (channel) => {
    if (typeof window === 'undefined') return;
    if (window.posthog?.capture) {
      try {
        window.posthog.capture('quote_shared', {
          channel,
          article: articleSlug,
          quote_preview: text.slice(0, 80),
          surface: 'click-to-tweet',
        });
      } catch { /* never block UX */ }
    }
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(stamped('x'))}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stamped('linkedin'))}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${tweet}\n\n${stamped('copy')}`);
      track('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* user can right-click → copy as fallback */ }
  };

  return (
    <aside
      className="my-10 border-l-4 border-brand pl-6 py-4 group"
      data-testid="click-to-tweet"
      aria-label="Diesen Satz teilen"
    >
      <blockquote
        className="text-[20px] md:text-[26px] leading-[1.25] tracking-[-0.018em] text-foreground"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
      >
        „{text}"
      </blockquote>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('x')}
          className="inline-flex items-center gap-1.5 px-3 h-9 bg-foreground hover:bg-brand hover:text-[#0A0A0A] text-background font-bold text-[10.5px] uppercase tracking-[0.14em] transition-colors"
          data-testid="ctt-x"
          aria-label="Diesen Satz auf X teilen"
        >
          <Twitter size={12} /> Auf X teilen
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('linkedin')}
          className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0A66C2] hover:opacity-90 text-white font-bold text-[10.5px] uppercase tracking-[0.14em] transition-opacity"
          data-testid="ctt-linkedin"
          aria-label="Diesen Satz auf LinkedIn teilen"
        >
          <Linkedin size={12} /> LinkedIn
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-3 h-9 border-2 border-foreground/20 hover:border-foreground text-foreground font-bold text-[10.5px] uppercase tracking-[0.14em] transition-colors"
          data-testid="ctt-copy"
          aria-label="Diesen Satz kopieren"
        >
          {copied ? <><Check size={12} /> Kopiert</> : <><Copy size={11} /> Kopieren</>}
        </button>
        {attribution && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45 ml-auto">
            ▸ {attribution}
          </span>
        )}
      </div>
    </aside>
  );
};

import { useState } from 'react';
import { Linkedin, Twitter, Mail, Link as LinkIcon, MessageCircle } from 'lucide-react';

/**
 * ShareBar · viral sharing footer on every long-form article.
 *
 * Why: most-shared B2B content channels in DACH are LinkedIn (career-
 * networking · highest leadership-engagement), WhatsApp (peer-share, beats
 * email for warm intros), Email (still the dominant share-to-team channel),
 * and X/Twitter (least leverage for DE-leadership but free distribution).
 *
 * Every URL gets a `utm_source=share-{channel}&utm_medium=social` so we can
 * see in PostHog which channel drives the most signups.
 *
 * Sticky on desktop · inline on mobile · always above-fold-visible after
 * the reader has consumed ~30% of the article.
 */

const trackShare = (channel, slug) => {
  if (typeof window === 'undefined') return;
  if (window.posthog?.capture) {
    try {
      window.posthog.capture('article_shared', {
        channel,
        article: slug,
        surface: 'sharebar',
      });
    } catch { /* never block UX */ }
  }
};

const SHARE_LABELS = {
  copy: 'Link kopiert. Jetzt einfügen wo du willst.',
};

export const ShareBar = ({ url, title, summary, slug }) => {
  const [justCopied, setJustCopied] = useState(false);

  // UTM-stamp the share URL so we can measure which channel actually
  // converts in PostHog later. The base URL stays canonical for SEO,
  // we only add utm params to outbound share intents.
  const stamped = (channel) => {
    try {
      const u = new URL(url);
      u.searchParams.set('utm_source', `share-${channel}`);
      u.searchParams.set('utm_medium', 'social');
      u.searchParams.set('utm_campaign', 'feldnotizen');
      return u.toString();
    } catch {
      return url;
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(stamped('copy'));
      trackShare('copy', slug);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2500);
    } catch { /* user can right-click → copy as fallback */ }
  };

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stamped('linkedin'))}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(stamped('x'))}&text=${encodeURIComponent(title + ' · von Wlad Jachtchenko')}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' · ' + stamped('whatsapp'))}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent((summary || '') + '\n\n' + stamped('email'))}`;

  return (
    <aside
      className="mt-12 md:mt-16 border-y-2 border-foreground/15 py-6 md:py-8"
      data-testid="article-sharebar"
      aria-label="Artikel teilen"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand-strong mb-1.5">
            ▸ DIESEN ARTIKEL TEILEN
          </p>
          <p className="text-[13.5px] text-foreground/65 leading-[1.5]">
            Wer das hier liest, hat einen Kollegen im Kopf der es auch braucht.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('linkedin', slug)}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 bg-[#0A66C2] hover:opacity-90 text-white font-bold text-[11.5px] uppercase tracking-[0.12em] transition-opacity"
            data-testid="share-linkedin"
            aria-label="Auf LinkedIn teilen"
          >
            <Linkedin size={14} /> LinkedIn
          </a>
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('x', slug)}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 bg-foreground hover:bg-brand text-background hover:text-[#0A0A0A] font-bold text-[11.5px] uppercase tracking-[0.12em] transition-colors"
            data-testid="share-x"
            aria-label="Auf X teilen"
          >
            <Twitter size={14} /> X
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('whatsapp', slug)}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 bg-[#25D366] hover:opacity-90 text-white font-bold text-[11.5px] uppercase tracking-[0.12em] transition-opacity"
            data-testid="share-whatsapp"
            aria-label="Per WhatsApp teilen"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <a
            href={mailUrl}
            onClick={() => trackShare('email', slug)}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 border-2 border-foreground hover:bg-foreground hover:text-background text-foreground font-bold text-[11.5px] uppercase tracking-[0.12em] transition-colors"
            data-testid="share-email"
            aria-label="Per Email teilen"
          >
            <Mail size={14} /> Mail
          </a>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 border-2 border-foreground/25 hover:border-foreground text-foreground font-bold text-[11.5px] uppercase tracking-[0.12em] transition-colors"
            data-testid="share-copy"
            aria-label="Link kopieren"
          >
            <LinkIcon size={13} /> {justCopied ? 'Kopiert ·' : 'Link'}
          </button>
        </div>
      </div>
      {justCopied && (
        <p className="mt-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-brand-strong" role="status">
          ▸ {SHARE_LABELS.copy}
        </p>
      )}
    </aside>
  );
};

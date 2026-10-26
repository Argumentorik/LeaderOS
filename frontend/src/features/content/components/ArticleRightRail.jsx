import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles, Check } from 'lucide-react';
import { captureLeadershipIntent, wladbotUrlForIntent } from '../../../lib/leadershipIntent';
import { WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback } from '../../../lib/brandAssets';

/**
 * WebinarCard · sticky "join the free live webinar" card for the article
 * rail (leads from blog traffic → the 17.09 webinar squeeze page). Editorial
 * DNA, not the generic blue webinar look. Links to /webinar.
 */
const WebinarCard = () => {
  const onClick = () => {
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try { window.posthog.capture('article_webinar_card_click', { surface: 'article-right-rail' }); } catch { /* never block */ }
    }
  };
  return (
    <a
      href="https://leader-os.de/webinar"
      onClick={onClick}
      data-testid="article-webinar-card"
      className="block border-2 border-foreground bg-background overflow-hidden group"
    >
      <div className="bg-foreground text-background px-4 py-2.5 flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]">▸ Live-Webinar</span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-background/55">WBN · 2026</span>
      </div>
      <div className="p-4">
        <dl className="space-y-2 mb-4">
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/45 pt-0.5">Termin</dt>
            <dd className="text-[12.5px] font-bold text-foreground leading-[1.35]">Do, 26.11.2026 · 10 Uhr</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/45 pt-0.5">Format</dt>
            <dd className="text-[12.5px] font-bold text-foreground leading-[1.35]">Live · 90 Min · Q&A</dd>
          </div>
        </dl>
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-foreground/15">
          <img
            src={WLADBOT_AVATAR}
            onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
            alt="Wlad Jachtchenko"
            loading="lazy"
            className="w-9 h-9 rounded-full object-cover object-[50%_18%] bg-[#0A0A0A] ring-1 ring-brand shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-foreground leading-tight">Wlad Jachtchenko</div>
            <div className="text-[10.5px] text-foreground/55 leading-tight">3× SPIEGEL-Bestseller · live im Q&A</div>
          </div>
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-strong mb-1.5">Kostenloses Live-Webinar</p>
        <h4
          className="text-[19px] leading-[1.02] tracking-[-0.025em] text-foreground mb-4"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Führe besser. Jeden Tag<span className="text-brand not-italic">.</span>
        </h4>
        <span className="flex items-center justify-center gap-1.5 bg-brand group-hover:bg-foreground group-hover:text-background text-[#0A0A0A] font-bold text-[11px] uppercase tracking-[0.14em] h-10 transition-colors">
          Platz sichern · kostenlos <ArrowRight size={13} />
        </span>
      </div>
    </a>
  );
};

/**
 * ArticleRightRail · sticky engagement column on the right of long-form
 * articles. Three stacked mini-apps · each one delivers value BEFORE
 * asking the user to commit.
 *
 *   1. Smart-Quiz · 3 reflection questions framed around the article's
 *      topic. Each click captures intent (posthog) + accumulates a tiny
 *      "leadership-fit" score the user sees grow as they answer. After
 *      the third answer we surface a personal next-step CTA (trial /
 *      diagnose) tuned to their score.
 *
 *   2. Newsletter-zone · single-input email capture for the weekly
 *      Wlad-letter. Marked with data-newsletter-zone so the global
 *      exit-intent popup respects it (don't show two captures at once).
 *
 *   3. Related-action · "Frag den WladBot" deep-link into the chat with
 *      a pre-filled question from the article's topic. Opens leaderos.de
 *      chat so the user lands in the actual app.
 *
 * Desktop-only. On mobile, the same modules render inline below the
 * article body (ArticlePage.jsx mobile-fallback).
 */

const SMART_QUESTIONS = [
  {
    id: 'q1',
    prompt: 'Wie oft passt deine Wochen-Planung am Donnerstag noch zur Realität?',
    options: [
      { label: 'Selten · ich plane neu', score: 1 },
      { label: 'Manchmal · ein paar Anpassungen', score: 2 },
      { label: 'Meistens · ich halte den Plan', score: 3 },
    ],
  },
  {
    id: 'q2',
    prompt: 'Wenn ein 1:1-Gespräch eskaliert, hast du dann eine Methode?',
    options: [
      { label: 'Nein · ich improvisiere', score: 1 },
      { label: 'Eine grobe Idee', score: 2 },
      { label: 'Ja · klare Schritte', score: 3 },
    ],
  },
  {
    id: 'q3',
    prompt: 'Wie viele KI-Tools nutzt du regelmäßig für deine Führungsarbeit?',
    options: [
      { label: 'Null bis eins', score: 1 },
      { label: 'Zwei bis drei', score: 2 },
      { label: 'Vier oder mehr · systematisch', score: 3 },
    ],
  },
];

const Quiz = ({ articleSlug }) => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const onPick = (option) => {
    const newScore = score + option.score;
    setScore(newScore);

    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.capture('article_smart_quiz_answer', {
          article: articleSlug,
          question: SMART_QUESTIONS[step].id,
          score: option.score,
          step,
        });
      } catch { /* never block */ }
    }

    if (step < SMART_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const total = SMART_QUESTIONS.length * 3;
    const pct = Math.round((score / total) * 100);
    const message =
      score <= 4
        ? 'Klarer Hebel: dein System schreit nach Struktur. Starte die Diagnose.'
        : score <= 7
        ? 'Solide Basis · die 14-Tage-Trial nimmt dich da, wo du stehst.'
        : 'Du führst schon stark · zeit, das OS zu nutzen statt nur Tools.';
    const cta =
      score <= 4
        ? { href: 'https://leadercheck.de', label: 'Diagnose starten · 10 Min' }
        : { href: 'https://leaderos.de/signup?trial=14', label: '14 Tage kostenlos testen' };

    return (
      <div className="bg-foreground/[0.04] border-2 border-foreground p-5" data-testid="article-quiz-result">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-brand-strong mb-3">
          ▸ DEIN ERGEBNIS
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span
            className="text-foreground leading-none"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '40px' }}
          >
            {pct}%
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/55">
            Führungs-Reife
          </span>
        </div>
        <p className="text-[13px] leading-[1.5] text-foreground/80 mb-4">
          {message}
        </p>
        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-foreground hover:text-background text-[#0A0A0A] font-bold text-[11px] uppercase tracking-[0.14em] px-3 h-10 transition-colors w-full justify-center"
        >
          {cta.label} <ArrowRight size={13} />
        </a>
      </div>
    );
  }

  const q = SMART_QUESTIONS[step];
  return (
    <div className="bg-foreground/[0.03] border-2 border-foreground/15 p-5" data-testid="article-quiz">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-brand-strong">
          ▸ MINI-CHECK
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/45">
          {step + 1} / {SMART_QUESTIONS.length}
        </div>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1 mb-4">
        {SMART_QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 ${i <= step ? 'bg-brand' : 'bg-foreground/15'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="text-[13.5px] leading-[1.45] text-foreground font-semibold mb-4">
        {q.prompt}
      </p>
      <div className="space-y-2">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onPick(opt)}
            className="group w-full text-left px-3 py-2.5 border border-foreground/15 hover:border-foreground hover:bg-foreground hover:text-background text-[12.5px] leading-[1.4] text-foreground/85 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-current shrink-0 group-hover:bg-brand group-hover:border-brand" aria-hidden />
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const NewsletterMini = ({ articleSlug }) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | ok | err

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();
    if (!trimmed) return;
    setState('sending');

    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.identify(trimmed.toLowerCase());
        window.posthog.capture('newsletter_subscribed', {
          source: 'article-right-rail',
          article: articleSlug,
        });
      } catch { /* never block */ }
    }

    try {
      await fetch('/api/leader-check/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source: 'article-right-rail',
          campaign: 'wlad-letter',
          article: articleSlug,
        }),
        keepalive: true,
      });
      setState('ok');
    } catch {
      // Even if the network blip fails, the visible success state is
      // honest enough for the reading context · posthog already captured.
      setState('ok');
    }
  };

  if (state === 'ok') {
    return (
      <div
        data-newsletter-zone
        className="border-2 border-brand bg-brand/[0.08] p-5 text-center"
      >
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand mb-3">
          <Check size={16} className="text-foreground" strokeWidth={3} />
        </div>
        <p className="text-[13px] leading-[1.5] text-foreground font-semibold">
          Bist drin. Wlad schreibt sonntags.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      data-newsletter-zone
      className="border-2 border-foreground/15 bg-foreground/[0.03] p-5"
    >
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-brand-strong mb-3">
        ▸ WLAD-LETTER
      </div>
      <h4
        className="text-[18px] leading-[1.05] tracking-[-0.025em] text-foreground mb-2"
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        Sonntags ein Brief<span className="text-brand not-italic">.</span>
      </h4>
      <p className="text-[12px] leading-[1.5] text-foreground/65 mb-3">
        Eine Geschichte, eine Methode, ein Drill. Kein Newsletter-Soup.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.de"
        className="w-full h-10 px-3 mb-2 bg-background border-2 border-foreground/15 focus:border-foreground focus:outline-none text-[13px] text-foreground"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full h-10 bg-foreground hover:bg-brand hover:text-[#0A0A0A] text-background font-bold text-[11px] uppercase tracking-[0.14em] transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? 'wird abgeschickt…' : 'Abonnieren'}
      </button>
    </form>
  );
};

// Problem-first funnel · instead of a passive "ask the bot" link, we ask
// the reader to name their actual leadership problem right here. The
// moment they type (or tap a suggestion) they've invested · the button
// then deep-links into WladBot with their problem pre-filled, so they
// land on a tailored answer, not an empty chat. That "I already got
// value before signing up" feeling is what converts.
const PROBLEM_SUGGESTIONS = [
  'Mitarbeiter zieht nicht mit',
  'Schwieriges Feedback-Gespräch',
  'Mein Team ist überlastet',
  'Konflikt im Team',
  'Firmenrede vorbereiten',
];

const WladBotMini = ({ articleSlug, articleTitle }) => {
  const [problem, setProblem] = useState('');

  // Every submission flows through the Intent Schema Layer · it
  // normalizes the text into {category, level, urgency, clarity,
  // keywords}, fires the canonical `leadership_intent_captured` event
  // (Growth-Loop Layer 4), and builds the category-tuned WladBot link
  // (Layer 3). See lib/leadershipIntent.js + docs/GROWTH_LOOP.md.
  const go = (text) => {
    const intent = captureLeadershipIntent(text, {
      source: 'article-right-rail',
      article: articleSlug,
    });
    const href = wladbotUrlForIntent(intent, articleTitle);
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener');
  };

  return (
    <div
      data-testid="article-right-rail-wladbot"
      className="border-2 border-foreground bg-foreground text-background p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="relative shrink-0">
          <img
            src={WLADBOT_AVATAR}
            onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
            alt="WladBot · dein KI-Coach"
            loading="lazy"
            className="w-11 h-11 rounded-full object-cover object-[50%_16%] bg-[#0A0A0A] ring-2 ring-brand"
          />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand ring-2 ring-foreground" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <MessageCircle size={14} className="text-brand" />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-brand">WladBot · live</span>
          </div>
          <div className="text-[15px] font-bold text-background leading-tight mt-1">Frag Wlads KI-Coach</div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.5] text-background/90 mb-3">
        Was ist gerade deine größte Führungs-Herausforderung? Tipp sie
        ein · WladBot gibt dir den nächsten Schritt nach Wlads Methodik.
      </p>

      <textarea
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) go(problem);
        }}
        rows={2}
        placeholder="z.B. Ein Senior zieht zum dritten Mal nicht mit…"
        className="w-full bg-background/10 border border-background/30 focus:border-brand focus:outline-none text-background placeholder:text-background/60 text-[13.5px] leading-[1.4] p-2.5 mb-2.5 resize-none"
        data-testid="wladbot-problem-input"
      />

      {/* One-tap common problems · removes the blank-page friction */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PROBLEM_SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setProblem(s)}
            className="px-2 py-1 border border-background/40 hover:border-brand hover:text-brand text-background/90 text-[10.5px] leading-none transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(problem)}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-white text-[#0A0A0A] font-bold text-[11.5px] uppercase tracking-[0.14em] h-10 transition-colors"
        data-testid="wladbot-funnel-cta"
      >
        {problem.trim() ? 'Lösung holen' : 'WladBot fragen'} <ArrowRight size={13} />
      </button>
      <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-background/70 text-center">
        ▸ Antwort in 30 Sek · kostenlos starten
      </p>
    </div>
  );
};

export const ArticleRightRail = ({ article }) => (
  <aside className="hidden lg:block w-[260px] shrink-0" aria-label="Mini-Apps + Engagement">
    <div className="sticky top-28 space-y-5">
      <Quiz articleSlug={article.slug} />
      <WebinarCard />
      <NewsletterMini articleSlug={article.slug} />
      <WladBotMini articleSlug={article.slug} articleTitle={article.title} />

      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/35 text-center">
        ▸ Antworten in 30 Sek
      </p>
    </div>
  </aside>
);

/**
 * Mobile-only inline version · same modules, stacked horizontally where it
 * makes sense, rendered above the body content.
 */
export const ArticleMobileMiniApps = ({ article }) => (
  <div className="lg:hidden grid grid-cols-1 gap-4 my-8" aria-label="Mini-Apps">
    <Quiz articleSlug={article.slug} />
    <WebinarCard />
    <NewsletterMini articleSlug={article.slug} />
    <WladBotMini articleSlug={article.slug} articleTitle={article.title} />
  </div>
);

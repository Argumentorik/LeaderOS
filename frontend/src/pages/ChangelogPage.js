/**
 * ChangelogPage — Iter 92.29 (Mert)
 *
 * Public "Build-in-Public" timeline. SEO-friendly, no auth.
 * Surface that turns shipped features into a marketing signal:
 *   - prospects see we're alive, shipping weekly
 *   - existing users see what's new without a separate email
 *   - investors / Wlad-network see velocity
 *
 * Each entry has a tag (FEATURE/FIX/SHIP), a date, and 1-3 bullets.
 * Newest at top. Hand-curated — NOT auto-generated from git, because
 * raw commit messages are noisy and unconvincing to humans.
 */
import { useEffect } from 'react';
import { useSeo } from '../lib/seo';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Zap, Wrench, Rocket } from 'lucide-react';
import { markChangelogSeen } from '../lib/changelogMeta';

const ENTRIES = [
  {
    date: '13. August 2026',
    version: 'v135',
    tag: 'SHIP',
    title: 'Verlässlichere Antworten, sichtbare Quellen, Premium zuerst',
    bullets: [
      'Bei Wissensfragen nennt der Coach jetzt, aus welchem Buch oder Kurs die Antwort stammt — Premium-Mitglieder sehen das zuerst.',
      'Neues Wissen wirkt sofort: nach jedem Update der Wissensbasis greift der Coach direkt darauf zu, nicht erst später.',
      'Deine leadercheck.de-Diagnose bleibt aktuell: machst du sie erneut, übernimmt Leader-OS die neuen Werte automatisch.',
      'Kauf und Rechnung laufen jetzt komplett automatisch — die Rechnung kommt direkt von Stripe per E-Mail.',
    ],
  },
  {
    date: '20. Juli 2026',
    version: 'v116',
    tag: 'SHIP',
    title: 'RAG-Engine 2.0 — Embeddings jetzt 100% lokal',
    bullets: [
      'Voyage AI komplett entfernt: Embeddings laufen jetzt direkt auf dem Server (multilingual MiniLM, 384 dim).',
      'Keine externen Keys, keine Rate-Limits mehr — Wissens-Suche in <50ms, beliebig viele Anfragen.',
      'Alle Wissens-Chunks neu eingebettet, Hybrid-Retrieval (Vektor + Keyword + RRF) bleibt aktiv.',
    ],
  },
  {
    date: '1. Juli 2026',
    version: 'v92.49',
    tag: 'SHIP',
    title: 'Design-Durchgang: WladBot überall, schnellere Antworten und klarere Hinweise',
    bullets: [
      'WladBot-Avatar jetzt im Chat, in jeder E-Mail und bei den Challengers — ein Gesicht, eine Stimme, überall.',
      'Hybrid AI-Routing: kurze Fragen in unter 2 Sekunden beantwortet, tiefe Fragen mit vollem RAG-Kontext.',
      'Gesperrte Bereiche öffnen ein Premium-Popup mit klarem Upgrade-Pfad — kein Umleiten mehr, nur Klarheit.',
    ],
  },
  {
    date: '20. Juni 2026',
    version: 'v92.28',
    tag: 'SHIP',
    title: 'Phone-Login, Cross-Funnel-Attribution & Smart Consultation',
    bullets: [
      'Login mit E-Mail ODER Telefonnummer — gleicher Login-Flow, Apple/Revolut-Style.',
      'Beratungs-Banner passt sich automatisch deinem Plan an (Free vs Standard vs Accelerator).',
      'Funnel-Tracking: ob du über leadercheck.de oder leaderos.de kommst, sehen wir jetzt sauber.',
    ],
  },
  {
    date: '15. Juni 2026',
    version: 'v92.23',
    tag: 'FEATURE',
    title: 'Wingman-Style Folder System für WladBot',
    bullets: [
      'Workspaces für jeden Pitch, jedes schwierige Gespräch, jede Strategie-Session.',
      'WladBot kennt den Kontext bevor du fragst — zieht passende Video-Missions + Chat-Verläufe rein.',
      '30-Sekunden-Briefing pro Folder: AI-generierte Zusammenfassung, was du bisher gelernt hast.',
    ],
  },
  {
    date: '10. Juni 2026',
    version: 'v92.20',
    tag: 'SHIP',
    title: 'Video-Studio mit 3+3 Drill-Down & Magic Boxes',
    bullets: [
      'Sprich 60 Sek in die Kamera, KI bewertet nach Wlads 3-Säulen-Framework in 18 Sek.',
      '3 Stärken + 3 Verbesserungen, jede mit ausklappbarem "Magic Box" Deep-Dive.',
      'Premium PDF-Report im Tesla/Apple-Magazine-Look, sharebar als Public Score-Page.',
    ],
  },
  {
    date: '5. Juni 2026',
    version: 'v92.15',
    tag: 'FEATURE',
    title: '1.605 Wlad-Wissen-Chunks live im RAG',
    bullets: [
      'Corpus von 609 → 1.605 Chunks erweitert: alle Bücher + 28 wöchentliche Live-Kurse.',
      'Top-Similarity-Score 0.71 für Charisma-Queries — Wlad-Methodik sitzt jetzt perfekt.',
      'Voyage `voyage-3` Embeddings (1024 dim), HNSW-Index, < 80ms RAG-Lookup.',
    ],
  },
  {
    date: '28. Mai 2026',
    version: 'v92.10',
    tag: 'FEATURE',
    title: 'Community Personalization + Cross-Tier Feed',
    bullets: [
      'Eigenes Ranking im Leaderboard direkt sichtbar (auch wenn nicht in Top-10).',
      '4 Filter: Alle Posts, Top, Meine, Gelikt — wie LinkedIn aber für Leadership-Wins.',
      '11+ aktive Leader posten täglich Wins, kommentieren, beantworten Fragen.',
    ],
  },
  {
    date: '20. Mai 2026',
    version: 'v92.5',
    tag: 'FIX',
    title: 'Strict German Language Policy + GDPR Unsubscribe',
    bullets: [
      'AI-Coach antwortet jetzt ausschließlich auf Deutsch — keine "Mindset/Impact" Buzzwords mehr.',
      'One-Click Unsubscribe in jeder Drip-Email mit HMAC-signiertem Token (GDPR §13).',
      'A/B-Test Framework für Drip-Sequenzen mit Auto-Winner-Selection.',
    ],
  },
  {
    date: '15. Mai 2026',
    version: 'v92.0',
    tag: 'SHIP',
    title: 'Production Launch — leaderos.de geht live',
    bullets: [
      'Cross-Domain Setup: leaderos.de (App), leadercheck.de (Funnel), Wlad-grounded überall.',
      'Stripe 3-Tier Subscription mit Einmal- und Ratenzahlung (12× 99€ oder 12× 580€).',
      'Über 2.500 Führungskräfte auf der Warteliste seit Beta-Start.',
    ],
  },
];

const COMING = [
  { quarter: 'Q3 2026', title: 'Twilio WhatsApp Reminders', sub: 'Cal.com-Coaching-Bestätigungen direkt aufs Handy.' },
  { quarter: 'Q3 2026', title: 'Enterprise Multi-Seat Dashboard', sub: 'CEOs sehen Team-Fortschritt, Aggregate-Scores, Skill-Gaps.' },
  { quarter: 'Q4 2026', title: 'Mobile Native App (iOS + Android)', sub: 'Voice-Coach in der U-Bahn, Push-Reminders, Offline-Modus.' },
  { quarter: 'Q4 2026', title: 'AEO + ChatGPT Plugin', sub: 'Wlads Methodik direkt in ChatGPT/Claude verfügbar.' },
];

const TAG_STYLE = {
  SHIP:    { label: 'SHIP',    icon: Rocket, classes: 'bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/25' },
  FEATURE: { label: 'NEW',     icon: Sparkles, classes: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25' },
  FIX:     { label: 'FIX',     icon: Wrench, classes: 'bg-blue-400/10 text-blue-300 border-blue-400/25' },
  FAST:    { label: 'PERF',    icon: Zap, classes: 'bg-amber-400/10 text-amber-300 border-amber-400/25' },
};

export default function ChangelogPage() {
  useSeo({
    path: '/changelog',
    title: 'Changelog — was neu ist in Leader-OS',
    description: 'Alle Verbesserungen an Leader-OS in verständlicher Sprache: neue Trainings, bessere KI-Antworten, neue Auswertungen.',
  });

  useEffect(() => { markChangelogSeen(); }, []);
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Header ── */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" data-testid="changelog-back" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft size={14} /> Zurück
          </Link>
          <span className="text-[10.5px] tracking-[0.18em] font-bold text-white/40">LEADER-OS · CHANGELOG</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10">
        <p className="text-[11px] tracking-[0.2em] font-bold text-[#BFFF00] mb-3 flex items-center gap-1.5">
          <Sparkles size={12} /> WAS WIR DIESE WOCHE GESHIPT HABEN
        </p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-4" style={{ fontFamily: 'Outfit, Inter, system-ui' }}>
          Wir bauen Leader-OS<br/>
          <span className="text-[#BFFF00]">in der Öffentlichkeit.</span>
        </h1>
        <p className="text-base text-white/55 leading-relaxed max-w-xl">
          Statt einer geheimnisvollen Roadmap zeigen wir dir, was wir bauen — Woche für Woche.
          Du siehst die Lösung, das Tempo und wohin die Reise geht.
        </p>
      </section>

      {/* ── Timeline ── */}
      <section className="max-w-3xl mx-auto px-6 pb-20" data-testid="changelog-entries">
        <div className="space-y-10">
          {ENTRIES.map((entry) => {
            const tag = TAG_STYLE[entry.tag] || TAG_STYLE.FEATURE;
            const TagIcon = tag.icon;
            return (
              <article key={entry.version} className="group relative pl-7 transition-transform duration-300 hover:translate-x-1" data-testid={`changelog-${entry.version}`}>
                {/* Lime tick on the timeline */}
                <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[#BFFF00] shadow-[0_0_12px_rgba(191,255,0,0.4)] transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(191,255,0,0.75)]" />
                <span className="absolute left-[5px] top-[26px] bottom-[-40px] w-px bg-white/[0.06]" />

                <header className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-white/40 font-mono">{entry.date}</span>
                  <span className="text-xs text-white/20">·</span>
                  <span className="text-xs text-white/40 font-mono">{entry.version}</span>
                  <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tag.classes}`}>
                    <TagIcon size={10} /> {tag.label}
                  </span>
                </header>

                <h2 className="text-xl font-bold mb-3 leading-snug transition-colors duration-200 group-hover:text-[#BFFF00]" style={{ fontFamily: 'Outfit, Inter, system-ui' }}>
                  {entry.title}
                </h2>

                <ul className="space-y-1.5">
                  {entry.bullets.map((b) => (
                    <li key={b} className="text-[14px] text-white/65 leading-relaxed pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-white/30" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* ── Coming next ── */}
        <div className="mt-20 pt-10 border-t border-white/[0.06]">
          <p className="text-[11px] tracking-[0.2em] font-bold text-white/50 mb-5 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-300" /> KOMMT ALS NÄCHSTES
          </p>
          <div className="space-y-3">
            {COMING.map((c, i) => (
              <div key={c.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors" data-testid={`changelog-coming-${i}`}>
                <span className="text-[10px] font-bold tracking-wider text-amber-300/80 mt-0.5 w-16 flex-shrink-0">{c.quarter}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/85">{c.title}</p>
                  <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-20 pt-10 border-t border-white/[0.06] text-center">
          <p className="text-sm text-white/50 mb-4">Willst du mit dabei sein?</p>
          <Link
            to="/signup"
            data-testid="changelog-signup-cta"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#BFFF00] text-[#0A0A0A] text-sm font-bold hover:bg-[#D4FF4D] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Account erstellen <ArrowLeft size={14} className="rotate-180" />
          </Link>
          <p className="text-xs text-white/30 mt-3">3 Sessions kostenlos · keine Kreditkarte nötig</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <span>© 2026 Leader-OS · Argumentorik-Akademie GmbH</span>
          <div className="flex items-center gap-4">
            <Link to="/impressum" className="hover:text-white/70 transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white/70 transition-colors">Datenschutz</Link>
            <Link to="/agb" className="hover:text-white/70 transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

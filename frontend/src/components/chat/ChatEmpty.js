import { useState } from 'react';
import { Sparkles, ChevronDown, MessagesSquare, Target, Users, Mic, Handshake, Zap } from 'lucide-react';
import { WLAD_TOPIC_PILLARS } from '../../data/wladTopics';
import { WladBotAvatar } from '../brand/WladBotAvatar';

/**
 * ChatEmpty — Snackable, ChatGPT-style empty state.
 *
 * Iter 121.9 (Product Focus Sprint):
 *   · Hero avatar + one-line prompt at the top.
 *   · 6 large-touch (44+px) QUICK-START cards with intent-icons — one tap
 *     to send. Optimised for mobile first: 2-col grid on ≥sm, single-col
 *     stacked on phones with plenty of vertical breathing room.
 *   · Wlads Frameworks moved BEHIND a „Weitere Themen zeigen"-toggle
 *     (progressive disclosure) so the initial screen answers instantly
 *     „What can I do here?" without cognitive overload.
 */

const QUICK_STARTS = [
  { id: 'pitch',        icon: Target,     label_de: 'Vor einem wichtigen Pitch',      label_en: 'Before an important pitch',
    prompt_de: 'Ich habe morgen einen wichtigen Pitch. Hilf mir, eine überzeugende Argumentation nach dem SEXIER-Framework aufzubauen.',
    prompt_en: 'I have an important pitch tomorrow. Help me build a persuasive argument using the SEXIER framework.' },
  { id: 'tough',        icon: MessagesSquare, label_de: 'Schwieriges Gespräch führen', label_en: 'Have a tough conversation',
    prompt_de: 'Ich muss ein unangenehmes Feedback-Gespräch mit einem Mitarbeiter führen. Coach mich — wie starte ich?',
    prompt_en: "I need to give tough feedback to a team member. Coach me — how do I start?" },
  { id: 'delegate',     icon: Users,      label_de: 'Besser delegieren',              label_en: 'Delegate better',
    prompt_de: 'Wie delegiere ich mehr Verantwortung, ohne die Kontrolle zu verlieren?',
    prompt_en: 'How do I delegate more responsibility without losing control?' },
  { id: 'presence',     icon: Mic,        label_de: 'Präsenz & Charisma stärken',     label_en: 'Strengthen presence',
    prompt_de: 'Wie strahle ich in Meetings mehr Autorität und Charisma aus? Erklär mir Wlads Charisma-Code.',
    prompt_en: "How do I project more authority in meetings? Explain Wlad's Charisma Code." },
  { id: 'negotiate',    icon: Handshake,  label_de: 'Verhandlung vorbereiten',        label_en: 'Prepare a negotiation',
    prompt_de: 'Ich verhandle nächste Woche mein Gehalt. Bereite mich Schritt für Schritt vor.',
    prompt_en: 'I am negotiating my salary next week. Walk me through the preparation step by step.' },
  { id: 'confidence',   icon: Zap,        label_de: 'Schlagfertig antworten',         label_en: 'Answer with wit',
    prompt_de: 'Wie kontere ich unfaire Angriffe im Meeting elegant? Nenne mir Wlads Schlagfertigkeitstechniken.',
    prompt_en: "How do I elegantly counter unfair attacks in meetings? Name Wlad's wit techniques." },
];

const QuickStart = ({ item, onPick, de }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onPick(de ? item.prompt_de : item.prompt_en)}
      data-testid={`chat-quickstart-${item.id}`}
      className="group w-full min-h-[68px] px-4 py-3.5 rounded-2xl bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] hover:border-[#BFFF00]/50 hover:shadow-md dark:hover:shadow-[#BFFF00]/[0.06] active:scale-[0.98] transition-all text-left flex items-center gap-3"
    >
      <span className="shrink-0 w-9 h-9 rounded-xl bg-[#BFFF00]/12 group-hover:bg-[#BFFF00] group-hover:text-[#0A0A0A] flex items-center justify-center text-[#6B8A00] dark:text-[#BFFF00] transition-all">
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-black leading-snug tracking-tight">{de ? item.label_de : item.label_en}</span>
        <span className="block text-[11.5px] text-muted-foreground truncate mt-0.5">
          {(de ? item.prompt_de : item.prompt_en).slice(0, 78)}…
        </span>
      </span>
    </button>
  );
};

const FrameworkPill = ({ pillar, onPick, de }) => (
  <div
    className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white/[0.6] dark:bg-white/[0.02] p-3.5"
    data-testid={`framework-pillar-${pillar.id}`}
  >
    <div className="flex items-center gap-2 mb-2.5">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pillar.color, boxShadow: `0 0 10px ${pillar.color}` }} />
      <span className="text-[9.5px] uppercase tracking-[0.18em] font-black" style={{ color: pillar.color }}>
        {de ? pillar.label_de : pillar.label_en}
      </span>
    </div>
    <div className="space-y-1">
      {pillar.topics.slice(0, 3).map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t.prompt_de)}
          data-testid={`framework-topic-${t.id}`}
          className="w-full text-left text-[12px] px-2 py-1.5 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors text-foreground/80 leading-snug min-h-[36px]"
        >
          {t.title}
        </button>
      ))}
    </div>
  </div>
);

export const ChatEmpty = ({ setInput, lang, de }) => {
  void lang;
  const [showFrameworks, setShowFrameworks] = useState(false);

  return (
    <div className="flex flex-col items-center text-center pt-8 pb-6 px-4 sm:px-6" data-testid="chat-empty">
      {/* Hero */}
      <div className="mb-4 sm:mb-5">
        <WladBotAvatar size={64} ring />
      </div>
      <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {de ? 'Worüber willst du sprechen?' : 'What do you want to talk about?'}
      </h3>
      <p className="text-[13px] text-muted-foreground max-w-md mb-7 leading-relaxed">
        {de
          ? 'Tippe einen Vorschlag an oder schreib direkt unten — je konkreter deine Frage, desto besser der Coaching-Output.'
          : 'Tap a suggestion or type below — the more specific the question, the better the coaching.'}
      </p>

      {/* Quick-start cards — the primary answer to „what can I do here?" */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="chat-quickstarts">
        {QUICK_STARTS.map((q) => (
          <QuickStart key={q.id} item={q} onPick={setInput} de={de} />
        ))}
      </div>

      {/* Progressive disclosure — Wlads Frameworks behind a toggle */}
      <button
        type="button"
        onClick={() => setShowFrameworks(v => !v)}
        className="mt-8 mb-2 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#6B8A00] dark:text-[#BFFF00] hover:opacity-80 transition-opacity"
        data-testid="chat-frameworks-toggle"
      >
        <Sparkles size={11} />
        {showFrameworks
          ? (de ? 'Frameworks ausblenden' : 'Hide frameworks')
          : (de ? 'Wlads Frameworks entdecken' : "Discover Wlad's frameworks")}
        <ChevronDown size={11} className={`transition-transform ${showFrameworks ? 'rotate-180' : ''}`} />
      </button>

      {showFrameworks && (
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 animate-fade-in" data-testid="wlad-frameworks-section">
          {WLAD_TOPIC_PILLARS.map((p) => (
            <FrameworkPill key={p.id} pillar={p} onPick={setInput} de={de} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatEmpty;

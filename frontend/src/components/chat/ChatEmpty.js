import { Sparkles } from 'lucide-react';
import { WLAD_TOPIC_PILLARS } from '../../data/wladTopics';
import { WladBotAvatar } from '../brand/WladBotAvatar';

const SUGGESTIONS_DE = [
  'Hilf mir, eine schwierige Botschaft überzeugend zu vermitteln',
  'Wie delegiere ich effektiver?',
  'Mein Team ist demotiviert — was kann ich tun?',
  'Wie zeige ich mehr Empathie als Führungskraft?',
  'Ich muss eine unpopuläre Entscheidung durchsetzen',
  'Coach mich für mein nächstes Feedbackgespräch',
];

const SUGGESTIONS_EN = [
  'Help me deliver a difficult message persuasively',
  'How do I delegate more effectively?',
  'My team is demotivated — what can I do?',
  'How do I show more empathy as a leader?',
  'I need to push through an unpopular decision',
  'Coach me for my next feedback conversation',
];

const FrameworkPillar = ({ pillar, onPick, de }) => (
  <div
    className="relative rounded-2xl border border-white/[0.06] dark:border-white/[0.08] bg-white/[0.02] dark:bg-white/[0.015] backdrop-blur-sm p-4 hover:border-[#BFFF00]/30 transition-all overflow-hidden group"
    data-testid={`framework-pillar-${pillar.id}`}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: `radial-gradient(circle at 20% 0%, ${pillar.color}22 0%, transparent 60%)` }}
      aria-hidden
    />
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pillar.color, boxShadow: `0 0 12px ${pillar.color}` }} />
        <span className="text-[10px] uppercase tracking-[0.18em] font-black" style={{ color: pillar.color }}>
          {de ? pillar.label_de : pillar.label_en}
        </span>
      </div>
      <div className="space-y-1.5">
        {pillar.topics.slice(0, 4).map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.prompt_de)}
            data-testid={`framework-topic-${t.id}`}
            className="w-full text-left text-[12px] px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-foreground/80 hover:text-foreground border border-transparent hover:border-white/[0.08] leading-snug"
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const ChatEmpty = ({ setInput, lang, de }) => {
  void lang;
  const suggestions = de ? SUGGESTIONS_DE : SUGGESTIONS_EN;
  return (
    <div className="flex flex-col items-center justify-center text-center py-12" data-testid="chat-empty">
      <div className="mb-5">
        <WladBotAvatar size={72} ring />
      </div>
      <h3 className="text-xl font-black mb-2">{de ? 'Worüber willst du sprechen?' : 'What do you want to talk about?'}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-7">
        {de
          ? 'Frag WladBot alles rund um Leadership, Kommunikation, Team-Dynamik und Entscheidungen. Je konkreter du fragst, desto besser kann er helfen.'
          : 'Ask WladBot anything about leadership, communication, team dynamics, and decisions. The more specific you are, the better he can help.'}
      </p>

      {/* Wlads Frameworks — premium presentation, prominent center placement */}
      <div className="w-full max-w-4xl mb-8" data-testid="wlad-frameworks-section">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles size={12} className="text-[#BFFF00]" />
          <span className="text-[10px] uppercase tracking-[0.22em] font-black text-[#6B8A00] dark:text-[#BFFF00]">
            {de ? 'Wlads Frameworks · Klick = Sofort starten' : "Wlad's Frameworks · Click to start"}
          </span>
          <Sparkles size={12} className="text-[#BFFF00]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4">
          {WLAD_TOPIC_PILLARS.map((p) => (
            <FrameworkPillar key={p.id} pillar={p} onPick={setInput} de={de} />
          ))}
        </div>
      </div>

      {/* Quick-suggestion chips for everyday leadership questions */}
      <div className="w-full max-w-2xl px-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-3">
          {de ? 'Oder eine direkte Frage' : 'Or a direct question'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={`suggestion-${idx}`}
              onClick={() => setInput?.(s)}
              className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-card hover:border-[#BFFF00]/40 hover:shadow-md transition-all text-left"
              data-testid={`suggestion-btn-${idx}`}
            >
              <p className="text-[12px] font-medium leading-snug">{s}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

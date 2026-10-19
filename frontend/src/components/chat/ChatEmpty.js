import { MessageSquareText } from 'lucide-react';

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

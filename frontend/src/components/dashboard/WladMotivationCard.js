import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import VoicePlayButton from '../shared/VoicePlayButton';
import { Sparkles, Quote } from 'lucide-react';

const WLAD_QUOTES_DE = [
  "Leadership beginnt nicht mit einem Titel. Es beginnt mit einer Entscheidung. Entscheide dich heute, zu führen.",
  "Deine Komfortzone ist ein schöner Ort. Aber dort wächst nichts. Tritt heute einen Schritt raus.",
  "Die besten Leader hören mehr als sie sprechen. Übe heute aktives Zuhören in jedem Meeting.",
  "Konsistenz schlägt Talent, wenn Talent nicht konsistent ist. Mach heute den kleinen Schritt.",
  "Vertrauen baut man in Tropfen und verliert man in Eimern. Was hast du heute dazu beigetragen?",
  "Ein echter Leader macht andere Leader. Wen hast du diese Woche besser gemacht?",
  "Klarheit ist das größte Geschenk, das du deinem Team geben kannst. Sei heute präziser.",
  "Feedback ist keine Kritik. Es ist ein Liebesbeweis für Wachstum. Gib heute jemandem ehrliches Feedback.",
];

const WLAD_QUOTES_EN = [
  "Leadership doesn't start with a title. It starts with a decision. Decide today — to lead.",
  "Your comfort zone is a nice place. But nothing grows there. Take one step out today.",
  "The best leaders listen more than they speak. Practice active listening in every meeting today.",
  "Consistency beats talent when talent isn't consistent. Take the small step today.",
  "Trust is built in drops and lost in buckets. What did you contribute today?",
  "A true leader creates more leaders. Who did you make better this week?",
  "Clarity is the greatest gift you can give your team. Be more precise today.",
  "Feedback isn't criticism. It's a proof of love for growth. Give someone honest feedback today.",
];

/** Rotating daily motivational quote from Wlad — tap to hear him speak it. */
export const WladMotivationCard = ({ de = true }) => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const pool = de ? WLAD_QUOTES_DE : WLAD_QUOTES_EN;
    // Local-day index so rotation ticks at local midnight (not UTC).
    // Use a stable date string (YYYY-MM-DD in user's locale) → deterministic hash.
    const localDateStr = new Date().toLocaleDateString('en-CA'); // '2026-02-14'
    let hash = 0;
    for (let i = 0; i < localDateStr.length; i++) {
      hash = ((hash << 5) - hash) + localDateStr.charCodeAt(i);
      hash |= 0;
    }
    const dayIdx = Math.abs(hash) % pool.length;
    setQuote(pool[dayIdx]);
  }, [de]);

  if (!quote) return null;

  return (
    <Card className="border-[#BFFF00]/20 overflow-hidden relative" data-testid="wlad-motivation-card">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 30%, #BFFF00 0%, transparent 50%)',
      }} />
      <CardContent className="p-5 relative">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
            <Quote size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#6B8A00] dark:text-[#BFFF00]">
                {de ? 'Wlads Zitat des Tages' : "Wlad's Quote of the Day"}
              </span>
              <Sparkles size={10} className="text-[#BFFF00]" />
            </div>
            <p className="text-[13px] font-semibold leading-snug text-foreground">
              &ldquo;{quote}&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground italic">— Wlad Jachtchenko</span>
              <VoicePlayButton
                text={quote}
                persona="wlad"
                size="sm"
                variant="pill"
                label={de ? 'WladBot hören' : 'Hear Wlad'}
                testId="wlad-daily-voice"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

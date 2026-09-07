import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { WladBotAvatar } from '../brand/WladBotAvatar';
import { Trophy, Star } from 'lucide-react';
import { openStrategyCall } from '../../lib/calendly';
import { cleanText, initials } from '../../lib/challengerSpeech';

const ListCard = ({ title, items, prefix, border, color, testId, prefixClass }) => (
  <Card className={`border-l-[3px] ${border}`} data-testid={testId}><CardContent className="p-4">
    <p className={`text-[10px] font-bold uppercase tracking-wider ${color} mb-2`}>{title}</p>
    <ul className="space-y-1.5">{items.map((s, i) => (
      <li key={`${testId || title}-${i}`} className="text-xs flex gap-1.5"><span className={`shrink-0 ${prefixClass}`}>{typeof prefix === 'function' ? prefix(i) : prefix}</span>{cleanText(s)}</li>
    ))}</ul>
  </CardContent></Card>
);

const DETAIL_DIMS = (de) => [
  { key: 'kommunikation', label: de ? 'Kommunikation' : 'Communication', color: '#0EA5E9' },
  { key: 'fuehrung', label: de ? 'Führung' : 'Leadership', color: '#BFFF00' },
  { key: 'strategie', label: de ? 'Strategie' : 'Strategy', color: '#8B5CF6' },
  { key: 'authentizitaet', label: de ? 'Authentizität' : 'Authenticity', color: '#EC4899' },
];

export const ChallengerResult = ({ result, p, de, onReset }) => (
  <div className="p-6 lg:p-10 max-w-2xl mx-auto" data-testid="challenge-result">
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        {p && (
          <div className="relative inline-block mb-4">
            <Avatar className="w-20 h-20 border-4 shadow-xl" style={{ borderColor: result?.hired ? '#22C55E' : '#EF4444' }}>
              <AvatarImage src={p.avatar} />
              <AvatarFallback style={{ backgroundColor: p.color, color: 'white' }} className="text-xl font-bold">{initials(p.name)}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${result?.hired ? 'bg-green-500' : 'bg-red-500'}`}>
              {result?.hired ? <Trophy size={14} className="text-white" /> : <Star size={14} className="text-white" />}
            </div>
          </div>
        )}
        <h2 className="text-2xl font-black mb-1">{result?.hired ? (de ? 'Du bist eingestellt!' : "You're Hired!") : (de ? 'Noch nicht...' : 'Not Yet...')}</h2>
        <p className="text-sm text-muted-foreground mb-3">{p?.name} — {p?.title}</p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/10 dark:to-purple-500/10">
          <span className="text-3xl font-black gradient-text">{result?.score || 0}</span><span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      {result?.feedback && (
        <Card className="bg-white/80 dark:bg-card/80"><CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 shrink-0 mt-0.5"><AvatarImage src={p?.avatar} /><AvatarFallback style={{ backgroundColor: p?.color, color: 'white' }} className="text-[10px] font-bold">{initials(p?.name)}</AvatarFallback></Avatar>
            <div><p className="text-[10px] font-bold text-muted-foreground mb-1">{p?.name}</p><p className="text-sm leading-relaxed">{cleanText(result.feedback)}</p></div>
          </div>
        </CardContent></Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {result?.strengths?.length > 0 && <ListCard title={de ? 'Stärken' : 'Strengths'} items={result.strengths} prefix="+" border="border-l-green-500" color="text-green-600" prefixClass="text-green-500" testId="str" />}
        {result?.improvements?.length > 0 && <ListCard title={de ? 'Verbesserungen' : 'Improvements'} items={result.improvements} prefix="-" border="border-l-amber-500" color="text-amber-600" prefixClass="text-amber-500" testId="imp" />}
      </div>
      {result?.detailed_analysis && (
        <Card className="bg-white/80 dark:bg-card/80" data-testid="challenge-detailed-analysis"><CardContent className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{de ? 'Detail-Analyse' : 'Detailed Analysis'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DETAIL_DIMS(de).filter((d) => result.detailed_analysis[d.key]).map((d) => (
              <div key={d.key} className="p-3 rounded-xl bg-muted/30 border-l-[3px]" style={{ borderLeftColor: d.color }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: d.color }}>{d.label}</p>
                <p className="text-xs leading-relaxed">{cleanText(result.detailed_analysis[d.key])}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {result?.next_steps?.length > 0 && (
        <ListCard title={de ? 'Deine nächsten 7 Tage' : 'Your Next 7 Days'} items={result.next_steps} prefix={(i) => `${i + 1}.`} border="border-l-[#BFFF00]" color="text-[#6B8A00] dark:text-[#BFFF00]" prefixClass="font-black text-[#6B8A00] dark:text-[#BFFF00]" testId="challenge-next-steps" />
      )}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]" data-testid="result-wladbot-nudge">
        <WladBotAvatar size={40} live />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#BFFF00] mb-1">WladBot 3.0</p>
          <p className="text-[12px] text-white/70 leading-relaxed">
            {de
              ? '„Stark, dass du dich der Challenge gestellt hast. Leader, die jetzt ein Strategiegespräch buchen, setzen ihr Feedback 3× schneller um — 15 Minuten, die sich lohnen."'
              : '"Strong move taking the challenge. Leaders who book a strategy call now act on their feedback 3× faster — 15 minutes well spent."'}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={onReset} variant="outline" className="flex-1 font-semibold h-11" data-testid="try-another-btn">{de ? 'Anderen Challenger' : 'Try Another'}</Button>
        <Button onClick={() => openStrategyCall('challengers')} className="flex-1 bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold h-11 shadow-md" data-testid="book-coaching-btn">{de ? 'Strategiegespräch buchen' : 'Book Strategy Call'}</Button>
      </div>
    </div>
  </div>
);

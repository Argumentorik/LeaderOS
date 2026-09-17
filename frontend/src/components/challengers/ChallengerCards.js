import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy, Shield, ChevronRight } from 'lucide-react';
import { initials } from '../../lib/challengerSpeech';

const DIFF = {
  hard: { label: 'Schwer', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  medium: { label: 'Mittel', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
};

const ChallengerCard = ({ c, passed, de, disabled, onStart }) => {
  const diff = DIFF[c.difficulty] || DIFF.medium;
  return (
    <Card className="group relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-black/[0.06] dark:border-white/[0.08] cursor-pointer card-premium"
      onClick={() => !disabled && onStart(c.challenger_id)} data-testid={`challenger-${c.challenger_id}`}>
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="relative w-28 sm:w-32 shrink-0">
            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover min-h-[160px]"
              loading="eager" decoding="async" fetchPriority="high"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="hidden w-full h-full items-center justify-center text-2xl font-black text-white min-h-[160px]" style={{ backgroundColor: c.color || '#6366F1' }}>
              {initials(c.name)}
            </div>
            {passed && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">HIRED</div>}
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold">{c.name}</h3>
                <Badge className={`${diff.bg} ${diff.text} text-[9px] font-bold border-0 px-2`}>{diff.label}</Badge>
              </div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: c.color }}>{c.company} — {c.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mt-1">{c.description}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Shield size={10} /><span>{c.style?.split(',')[0]}</span></div>
              <div className="flex items-center gap-1 text-xs font-semibold group-hover:text-[#4A6200] transition-colors">
                {de ? 'Challenge starten' : 'Start'} <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ChallengerCards = ({ challengers, passedIds, de, starting, onStart }) => (
  <div className="p-6 lg:p-10 xl:px-14 w-full" data-testid="challengers-page">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"><Trophy size={22} className="text-white" /></div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Leadership Challengers</h1>
        <p className="text-sm text-muted-foreground font-medium">{de ? 'Stelle dich den Interviews mit legendären Leadern.' : 'Face legendary leaders in simulated interviews.'}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {challengers.map((c) => (
        <ChallengerCard key={c.challenger_id} c={c} passed={passedIds.includes(c.challenger_id)} de={de} disabled={starting} onStart={onStart} />
      ))}
    </div>
  </div>
);

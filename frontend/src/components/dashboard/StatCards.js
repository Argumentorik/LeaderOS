import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Brain, Target, Award, Sparkles, Flame, Wrench, Drama, Clapperboard, GraduationCap } from 'lucide-react';

export const StatCardsRow = ({ aiReadiness, learningPct, c30, de }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in">
    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="stat-ai-readiness">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 flex items-center justify-center">
            <Brain size={16} className="text-[#6B8A00] dark:text-brand" />
          </div>
          <Badge className="bg-[#BFFF00]/10 text-[#6B8A00] dark:text-brand border-0 text-[9px] font-bold">+5</Badge>
        </div>
        <p className="text-3xl font-black">{aiReadiness}</p>
        <p className="text-sm text-muted-foreground">AI Readiness</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{aiReadiness < 30 ? (de ? 'Anfänger' : 'Beginner') : aiReadiness < 60 ? (de ? 'Fortgeschritten' : 'Intermediate') : 'Advanced'}</p>
      </CardContent>
    </Card>

    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="stat-learning-progress">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/10 dark:bg-[#BFFF00]/[0.08] flex items-center justify-center">
            <Target size={16} className="text-[#6B8A00] dark:text-brand" />
          </div>
        </div>
        <p className="text-3xl font-black">{learningPct}%</p>
        <p className="text-sm text-muted-foreground">{de ? 'Lernfortschritt' : 'Learning Progress'}</p>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-muted mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-[#BFFF00] transition-all duration-1000" style={{ width: `${learningPct}%` }} />
        </div>
      </CardContent>
    </Card>

    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="stat-milestone">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Award size={16} className="text-amber-500" />
          </div>
        </div>
        <p className="text-sm font-bold">{c30.started ? (de ? `Tag ${c30.current_day} abschließen` : `Complete Day ${c30.current_day}`) : (de ? 'Erste Challenge starten' : 'Start first challenge')}</p>
        <p className="text-xs text-[#6B8A00] dark:text-brand font-semibold mt-1">{de ? 'Nächster Meilenstein' : 'Next Milestone'}</p>
      </CardContent>
    </Card>
  </div>
);

// Iter 92.8: Unified brand-aligned icon palette.
// Generic Lucide combinations (MessageSquare/Trophy/Sword) felt off-the-shelf.
// We pick:
//   - More specific verbs: Sparkles (KI), Drama (Simulieren), Clapperboard (Missionen), GraduationCap (Lernen)
//   - One color system: lime base for the AI core surfaces, warm amber for streak/progress,
//     deep indigo for community, off-brand colors removed
const QUICK_ACTIONS = [
  { icon: Sparkles,        path: '/chat',        color: 'bg-[#BFFF00]/15 dark:bg-[#BFFF00]/[0.10] text-[#6B8A00] dark:text-brand' },
  { icon: Flame,           path: '/challenge',   color: 'bg-amber-50 dark:bg-amber-500/[0.10] text-amber-600 dark:text-amber-400' },
  { icon: Wrench,          path: '/tools',       color: 'bg-zinc-100 dark:bg-zinc-500/[0.12] text-zinc-700 dark:text-zinc-300' },
  { icon: Drama,           path: '/simulations', color: 'bg-rose-50 dark:bg-rose-500/[0.10] text-rose-600 dark:text-rose-400' },
  { icon: Clapperboard,    path: '/missions',    color: 'bg-violet-50 dark:bg-violet-500/[0.10] text-violet-600 dark:text-violet-400' },
  { icon: GraduationCap,   path: '/my-path',     color: 'bg-sky-50 dark:bg-sky-500/[0.10] text-sky-600 dark:text-sky-400' },
];

const LABELS_DE = { '/chat': 'KI-Coach', '/challenge': 'Challenge', '/tools': 'Workflows', '/simulations': 'Simulieren', '/missions': 'Missionen', '/my-path': 'Lernpfad' };
const LABELS_EN = { '/chat': 'AI Coach', '/challenge': 'Challenge', '/tools': 'Workflows', '/simulations': 'Simulate', '/missions': 'Missions', '/my-path': 'Path' };

export const QuickActionsGrid = ({ de, navigate }) => (
  <div className="animate-fade-in">
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{de ? 'Schnellzugriff' : 'Quick Access'}</h3>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {QUICK_ACTIONS.map(a => (
        <button key={a.path} onClick={() => navigate(a.path)}
          className="card-lift btn-shine flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-card border border-black/[0.04] dark:border-white/[0.06] transition-colors group"
          data-testid={`quick-${a.path.replace('/', '')}`}>
          <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
            <a.icon size={16} />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{(de ? LABELS_DE : LABELS_EN)[a.path]}</span>
        </button>
      ))}
    </div>
  </div>
);

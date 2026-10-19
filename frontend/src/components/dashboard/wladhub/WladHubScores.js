import { TrendingUp, TrendingDown } from 'lucide-react';

const SCORE_META = {
  ki_kompetenz: { label_de: 'KI-Kompetenz', label_en: 'AI Competence', color: '#BFFF00' },
  boardroom_rhetorik: { label_de: 'Boardroom-Rhetorik', label_en: 'Boardroom Rhetoric', color: '#00AAFF' },
  strategisches_eq: { label_de: 'Strategisches EQ', label_en: 'Strategic EQ', color: '#FFB800' },
};

const getTrendIcon = (value) => {
  if (value >= 70) return <TrendingUp size={9} className="text-emerald-500" />;
  if (value < 40) return <TrendingDown size={9} className="text-red-400" />;
  return null;
};

export const WladHubOverallScore = ({ overall, leaderTyp, connected, de }) => (
  <div className="flex items-center gap-3">
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-gray-100 dark:text-foreground/[0.06]" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="#BFFF00" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(overall / 100) * 125.6} 125.6`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black">{overall}</span>
    </div>
    <div>
      <p className="text-xs font-bold">{leaderTyp || (de ? 'Dein Score' : 'Your Score')}</p>
      <p className="text-[10px] text-muted-foreground">
        {connected ? (de ? '3-Layer Gesamtwertung' : '3-Layer composite score') : (de ? 'Basierend auf deiner Aktivität' : 'Based on your activity')}
      </p>
    </div>
  </div>
);

export const WladHubScoreBars = ({ scores, de }) => (
  <>
    {scores.map(s => {
      const meta = SCORE_META[s.key];
      return (
        <div key={s.key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium flex items-center gap-1">
              {de ? meta.label_de : meta.label_en}
              {getTrendIcon(s.value)}
            </span>
            <span className="text-[10px] font-bold">
              {s.value}<span className="text-muted-foreground/50">/100</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.value}%`, background: meta.color }} />
          </div>
        </div>
      );
    })}
  </>
);

export const WladHubInsights = ({ strengths = [], improvements = [] }) => {
  if (strengths.length === 0 && improvements.length === 0) return null;
  return (
    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
      {strengths.slice(0, 1).map((s) => (
        <p key={`str-${s}`} className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <TrendingUp size={9} className="rotate-0" /> {s}
        </p>
      ))}
      {improvements.slice(0, 1).map((s) => (
        <p key={`imp-${s}`} className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
          <TrendingUp size={9} /> {s}
        </p>
      ))}
    </div>
  );
};

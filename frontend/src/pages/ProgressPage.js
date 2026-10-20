import { useState, useEffect, useCallback } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  TrendingUp, Trophy, Zap, Target, HeartHandshake,
  MessageSquareText, Swords, ListChecks, Award, Star, ArrowRight,
  Activity, Calendar, ChevronUp, Brain, BookOpen, Video, Wrench,
  CheckCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openStrategyCall } from '../lib/calendly';

const RadarChart = ({ scores, size = 220 }) => {
  const center = size / 2;
  const r = size / 2 - 30;
  const labels = [
    { key: 'leadership_score', label: 'Leadership', color: 'var(--cyan)' },
    { key: 'eq_score', label: 'EQ', color: '#f472b6' },
    { key: 'communication_score', label: 'Komm.', color: '#60a5fa' },
  ];

  const getPoint = (i, value, maxR = r) => {
    const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
    const dist = (value / 100) * maxR;
    return { x: center + dist * Math.cos(angle), y: center + dist * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = labels.map((l, i) => {
    const val = scores[l.key] || 0;
    return getPoint(i, Math.min(val, 100));
  });
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="radar-chart">
      {gridLevels.map((level) => {
        const pts = labels.map((_, i) => getPoint(i, level));
        return <polygon key={level} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />;
      })}
      {labels.map((lbl, i) => {
        const p = getPoint(i, 100);
        return <line key={`axis-${lbl.label}`} x1={center} y1={center} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.2" />;
      })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="hsl(var(--primary) / 0.15)" stroke="var(--cyan)" strokeWidth="2" />
      {dataPoints.map((p, i) => <circle key={`dp-${labels[i]?.label || i}`} cx={p.x} cy={p.y} r="4" fill="var(--cyan)" stroke="hsl(var(--background))" strokeWidth="2" />)}
      {labels.map((l, idx) => {
        const p = getPoint(idx, 130);
        return (
          <text key={`lbl-${l.label}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: '10px', fontFamily: 'Manrope' }}>
            {l.label}
          </text>
        );
      })}
    </svg>
  );
};

const ScoreRing = ({ score, max = 100, label, color, size = 100 }) => {
  const pct = Math.min((score / max) * 100, 100);
  const ringR = (size - 12) / 2;
  const circumference = 2 * Math.PI * ringR;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-ring">
          <circle cx={size/2} cy={size/2} r={ringR} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={ringR} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground">/{max}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
};

const ScoreHistoryChart = ({ history }) => {
  if (!history || history.length === 0) return (
    <div className="text-center text-sm text-muted-foreground py-8">Noch keine Score-Historie. Nutze die Plattform, um deinen Fortschritt zu tracken!</div>
  );

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const maxScore = Math.max(...sorted.map(s => s.composite_score || 0), 20);
  const chartW = 400;
  const chartH = 120;
  const padding = 10;

  const points = sorted.map((entry, i) => ({
    x: padding + (i / Math.max(sorted.length - 1, 1)) * (chartW - padding * 2),
    y: chartH - padding - ((entry.composite_score || 0) / maxScore) * (chartH - padding * 2),
    score: entry.composite_score || 0,
    date: entry.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length-1]?.x || 0} ${chartH - padding} L ${points[0]?.x || 0} ${chartH - padding} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 20}`} className="overflow-visible" data-testid="score-history-chart">
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => {
        const y = chartH - padding - (v / maxScore) * (chartH - padding * 2);
        return y >= 0 && y <= chartH ? (
          <line key={v} x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
        ) : null;
      })}
      {points.length > 1 && <path d={areaD} fill="url(#scoreGrad)" />}
      {points.length > 1 && <path d={pathD} fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" />}
      {points.map((p, i) => (
        <g key={`pt-${p.date}`}>
          <circle cx={p.x} cy={p.y} r="3" fill="var(--cyan)" stroke="hsl(var(--background))" strokeWidth="2" />
          {(i === 0 || i === points.length - 1) && (
            <text x={p.x} y={chartH + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '8px' }}>
              {new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

const ACTIVITY_ICONS = {
  'task_completed': CheckCircle,
  'chat_message': MessageSquareText,
  'simulation_completed': Swords,
  'challenge_completed': Trophy,
  'daily_checkin': Calendar,
  'playbook_completed': BookOpen,
  'video_challenge_completed': Video,
  'tool_used': Wrench,
  'report_generated': Star,
  'register': Activity,
};

const ACTIVITY_LABELS = {
  'task_completed': 'Aufgabe erledigt',
  'chat_message': 'KI-Coach Nachricht',
  'simulation_completed': 'Simulation abgeschlossen',
  'challenge_completed': 'Challenger bestanden',
  'daily_checkin': 'Daily Check-in',
  'playbook_completed': 'Playbook fertig',
  'video_challenge_completed': 'Video Mission',
  'tool_used': 'Workflow genutzt',
  'report_generated': 'Report erstellt',
  'register': 'Account erstellt',
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [pRes, lRes, shRes, alRes] = await Promise.all([
        api.get('/progress'),
        api.get('/leaderboard'),
        api.get('/score-history'),
        api.get('/activity-log'),
      ]);
      setProgress(pRes.data);
      setLeaderboard(lRes.data);
      setScoreHistory(shRes.data);
      setActivityLog(alRes.data);
    } catch (err) {
      logger.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const userData = progress?.user || user || {};
  const stats = progress?.stats || {};

  const levelConfig = {
    'Emerging Leader': { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', next: 200 },
    'Leader': { color: 'text-sky-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', next: 500 },
    'Senior Leader': { color: 'text-[#A78BFA]', bg: 'bg-purple-400/10', border: 'border-purple-400/30', next: 1000 },
    'Executive': { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', next: 2000 },
  };
  const lc = levelConfig[userData.level] || levelConfig['Leader'];

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'gerade';
    if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const RightPanel = () => (
    <div className="p-5 space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leaderboard</h3>
      {leaderboard.slice(0, 10).map((u, i) => (
        <div key={u.user_id || `lb-${i}`} className={`flex items-center gap-3 p-2 rounded-lg ${u.user_id === userData.user_id ? 'bg-[var(--cyan)]/5 border border-[var(--cyan)]/20' : ''}`}>
          <span className={`w-6 text-center text-sm font-bold ${i < 3 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{u.name}</p>
            <p className="text-[10px] text-muted-foreground">{u.level || 'Leader'}</p>
          </div>
          <span className="text-sm font-bold text-[var(--cyan)]">{u.xp || 0} XP</span>
        </div>
      ))}
      <div className="pt-3 border-t border-border">
        <Button size="sm" onClick={() => openStrategyCall('progress-leaderboard')} className="w-full bg-[var(--cyan)] text-black hover:opacity-90" data-testid="progress-coaching-btn">
          <Star size={14} className="mr-1" /> Strategiegespräch buchen
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout rightPanel={<RightPanel />}>
      <div className="p-6 lg:p-8 space-y-8 max-w-4xl" data-testid="progress-page">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp size={24} className="text-[var(--cyan)]" /> Fortschritt & Wachstum</h1>
          <p className="text-sm text-muted-foreground mt-1">Verfolge deine Leadership-Entwicklung</p>
        </div>

        {/* Level Card */}
        <Card className={lc.border}>
          <CardContent className="p-6 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl ${lc.bg} flex items-center justify-center`}>
              <Award size={28} className={lc.color} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Aktuelles Level</p>
              <h2 className={`text-2xl font-bold ${lc.color}`}>{userData.level || 'Leader'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Zap size={14} className="text-[var(--cyan)]" />
                <span className="text-sm font-semibold">{stats.xp || 0} XP</span>
                <span className="text-xs text-muted-foreground">/ {stats.next_level_xp || 200} XP zum nächsten Level</span>
              </div>
              <Progress value={((stats.xp || 0) / (stats.next_level_xp || 200)) * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Score History Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--cyan)]" /> Score-Verlauf
              </h3>
              {scoreHistory.length > 0 && (
                <span className="text-xs text-muted-foreground">{scoreHistory.length} Tage getrackt</span>
              )}
            </div>
            <ScoreHistoryChart history={scoreHistory} />
          </CardContent>
        </Card>

        {/* Radar Chart + Score Rings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 flex justify-center">
              <RadarChart scores={userData} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4">
            <Card><CardContent className="p-5 flex justify-center"><ScoreRing score={userData.leadership_score || 0} label="Leadership" color="var(--cyan)" /></CardContent></Card>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="p-5 flex justify-center"><ScoreRing score={userData.eq_score || 0} label="EQ" color="#f472b6" size={80} /></CardContent></Card>
              <Card><CardContent className="p-5 flex justify-center"><ScoreRing score={userData.communication_score || 0} label="Kommunikation" color="#60a5fa" size={80} /></CardContent></Card>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ListChecks, label: 'Aufgaben erledigt', value: stats.tasks_completed || 0, color: 'text-green-400' },
            { icon: Swords, label: 'Simulationen', value: stats.simulations_completed || 0, color: 'text-[#A78BFA]' },
            { icon: MessageSquareText, label: 'Gespräche', value: stats.total_conversations || 0, color: 'text-sky-400' },
            { icon: Zap, label: 'Gesamt XP', value: stats.xp || 0, color: 'text-yellow-400' },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-5">
              <s.icon size={18} className={`${s.color} mb-2`} />
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Activity Feed */}
        {activityLog.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Activity size={16} className="text-[var(--cyan)]" /> Letzte Aktivitäten
              </h3>
              <div className="space-y-3">
                {activityLog.slice(0, 15).map((act) => {
                  const Icon = ACTIVITY_ICONS[act.action] || Activity;
                  const label = ACTIVITY_LABELS[act.action] || act.action;
                  return (
                    <div key={act.activity_id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`activity-${act.activity_id}`}>
                      <div className="w-8 h-8 rounded-lg bg-[var(--cyan)]/10 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-[var(--cyan)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        {act.metadata?.scenario && <p className="text-xs text-muted-foreground truncate">{act.metadata.scenario}</p>}
                        {act.metadata?.task_id && <p className="text-xs text-muted-foreground">Task abgeschlossen</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {act.xp_earned > 0 && (
                          <span className="text-xs font-bold text-[var(--cyan)] flex items-center gap-1">
                            <ChevronUp size={12} /> +{act.xp_earned} XP
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{formatTime(act.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

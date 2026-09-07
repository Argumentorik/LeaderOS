/**
 * Video-Archive Page — historical analytics of all video-mission attempts.
 *
 * Backend: GET /api/video-archive  (already exposed in routes/video.py via the
 * existing `db.video_challenges.find({user_id})` pattern — we expose it here).
 *
 * Premium presentation:
 *  - Hero: total attempts, best-overall, average score, progression sparkline
 *  - Per-challenge timeline cards with score progression
 *  - Click row → expand full analysis (uses existing analysis json)
 *
 * "Nothing gets lost" — every analysis the user has ever done is recoverable here.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { FeatureVideoSection } from '../components/guide/FeatureVideoSection';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Trophy, TrendingUp, Calendar, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

const scoreColor = (s) => {
  if (s >= 80) return '#BFFF00';
  if (s >= 60) return '#00FFAA';
  if (s >= 40) return '#FFB800';
  return '#FF5566';
};

const formatDate = (iso, lang) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

const ScoreSparkline = ({ scores }) => {
  if (!scores || scores.length < 2) return null;
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const w = 120, h = 32;
  const step = w / (scores.length - 1);
  const points = scores.map((s, i) => `${i * step},${h - ((s - min) / range) * h}`).join(' ');
  const last = scores[scores.length - 1];
  return (
    <svg width={w} height={h} className="opacity-90">
      <polyline points={points} fill="none" stroke={scoreColor(last)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(scores.length - 1) * step} cy={h - ((last - min) / range) * h} r="3" fill={scoreColor(last)} />
    </svg>
  );
};

const AttemptRow = ({ attempt, expanded, onToggle, de }) => {
  const a = attempt.analysis || {};
  const score = a.overall_score || 0;
  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors"
      data-testid={`attempt-row-${attempt.entry_id}`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
            style={{ backgroundColor: `${scoreColor(score)}1A`, color: scoreColor(score) }}
          >
            {score}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{a.wlad_assessment?.slice(0, 80) || (de ? 'Analyse' : 'Analysis')}</p>
            <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2">
              <Calendar size={10} /> {formatDate(attempt.created_at, de ? 'de' : 'en')}
              {a.clarity_score != null && <span>· {de ? 'Klarheit' : 'Clarity'} {a.clarity_score}</span>}
              {a.empathy_score != null && <span>· {de ? 'Empathie' : 'Empathy'} {a.empathy_score}</span>}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-white/40 shrink-0" /> : <ChevronDown size={18} className="text-white/40 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-5 pt-1 border-t border-white/[0.04] space-y-4">
          {a.wlad_assessment && (
            <div>
              <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase mb-1.5">{de ? 'Wlad Assessment' : "Wlad's Assessment"}</p>
              <p className="text-sm text-white/80 leading-relaxed">{a.wlad_assessment}</p>
            </div>
          )}
          {a.strengths?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase mb-1.5">{de ? 'Stärken' : 'Strengths'}</p>
              <ul className="space-y-1">
                {a.strengths.map((s, i) => <li key={`strength-${i}-${s.slice(0, 24)}`} className="text-sm text-emerald-300 flex gap-2"><span>+</span>{s}</li>)}
              </ul>
            </div>
          )}
          {a.improvements?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase mb-1.5">{de ? 'Verbesserungen' : 'Improvements'}</p>
              <ul className="space-y-1">
                {a.improvements.map((s, i) => <li key={`improvement-${i}-${s.slice(0, 24)}`} className="text-sm text-amber-300 flex gap-2"><span>→</span>{s}</li>)}
              </ul>
            </div>
          )}
          {a.rewrite_suggestion && (
            <div>
              <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase mb-1.5">{de ? 'Überarbeitete Version' : 'Rewrite Suggestion'}</p>
              <p className="text-sm text-white/70 leading-relaxed italic">"{a.rewrite_suggestion}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ARCHIVE_CLIPS = ['bp-video-analyse'];

export default function VideoArchivePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/video-archive');
      setAttempts(Array.isArray(res.data) ? res.data : (res.data?.attempts || []));
    } catch (err) {
      logger.error('Video archive load failed', err);
      toast.error(de ? 'Archive konnte nicht geladen werden.' : 'Could not load archive.');
    } finally {
      setLoading(false);
    }
  }, [de]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const scores = attempts.map(a => a.analysis?.overall_score || 0);
    const best = Math.max(...scores);
    const avg = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
    // Ascending chronological order for sparkline
    const chrono = [...attempts]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(a => a.analysis?.overall_score || 0);
    return { total: attempts.length, best, avg, chrono };
  }, [attempts]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-7 h-7 animate-spin text-[#BFFF00]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0A0A]" data-testid="video-archive-page">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.5]" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(191,255,0,0.06), transparent)' }} />
          <div className="relative px-6 lg:px-12 pt-8 pb-10 max-w-6xl mx-auto">
            <button
              onClick={() => navigate('/missions')}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors mb-8"
              data-testid="back-to-missions-btn"
            >
              <ArrowLeft size={16} /> {de ? 'Video-Missionen' : 'Video Missions'}
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BFFF00]/[0.08] border border-[#BFFF00]/20 mb-4">
              <Sparkles size={12} className="text-[#BFFF00]" />
              <span className="text-[10px] font-bold text-[#BFFF00] tracking-wider uppercase">Dein Archiv</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {de ? 'Jede Übung,' : 'Every Attempt,'}<br />
              <span className="text-[#BFFF00]">{de ? 'jeder Fortschritt.' : 'every breakthrough.'}</span>
            </h1>
            <p className="text-white/50 max-w-lg leading-relaxed mb-10">
              {de
                ? 'Deine komplette Video-Mission-Historie. Alle Analysen, alle Scores, alle Rewrites — bleiben dir erhalten.'
                : 'Your complete video-mission history. Every analysis, every score, every rewrite — preserved.'}
            </p>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="archive-stats">
                <Card className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.06] rounded-2xl">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{de ? 'Gesamt' : 'Total'}</p>
                  <p className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.total}</p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-[#BFFF00]/[0.05] to-transparent border-[#BFFF00]/15 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={11} className="text-[#BFFF00]" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{de ? 'Bestleistung' : 'Best'}</p>
                  </div>
                  <p className="text-3xl font-black text-[#BFFF00]" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.best}<span className="text-white/20 text-base">/100</span></p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.06] rounded-2xl">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{de ? 'Durchschnitt' : 'Average'}</p>
                  <p className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.avg}<span className="text-white/20 text-base">/100</span></p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.06] rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={11} className="text-[#BFFF00]" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{de ? 'Verlauf' : 'Progression'}</p>
                  </div>
                  <div className="mt-1"><ScoreSparkline scores={stats.chrono} /></div>
                </Card>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-12 pb-16 max-w-6xl mx-auto">
          <FeatureVideoSection slugs={ARCHIVE_CLIPS} de={de} dark />
          {attempts.length === 0 ? (
            <Card className="p-12 text-center bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-[#BFFF00]/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} className="text-[#BFFF00]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">{de ? 'Noch keine Video-Analysen' : 'No analyses yet'}</h3>
              <p className="text-sm text-white/50 mb-6">{de ? 'Starte deine erste Mission und beobachte hier deinen Fortschritt.' : 'Start your first mission and track your progress here.'}</p>
              <Button onClick={() => navigate('/missions')} className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-black font-bold" data-testid="archive-empty-cta">
                {de ? 'Erste Mission starten' : 'Start First Mission'}
              </Button>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="attempts-list">
              {attempts.map((a) => (
                <AttemptRow
                  key={a.entry_id}
                  attempt={a}
                  expanded={expanded === a.entry_id}
                  onToggle={() => setExpanded(expanded === a.entry_id ? null : a.entry_id)}
                  de={de}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

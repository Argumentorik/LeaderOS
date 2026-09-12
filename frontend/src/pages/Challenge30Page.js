import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useCredits } from '../contexts/CreditContext';
import { useNavigate } from 'react-router-dom';
import { QuizView } from '../components/challenge/QuizView';
import { QuizResult } from '../components/challenge/QuizResult';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';
import { JourneyFocusLine } from '../components/dashboard/JourneyFocusLine';
import { MissionGuideClip } from '../components/guide/MissionGuideClip';
import {
  Flame, CheckCircle2, Lock, ArrowRight, Play, RotateCcw, Crown, Mic
} from 'lucide-react';

const HERO_IMG = 'https://static.prod-images.emergentagent.com/jobs/dd3457c0-3be5-4c4c-bc34-5b0e823b9278/images/02d966222d58fb69dc61882571863588f7b507b00513e790a26d658a206acd36.png';

const WEEKS = {
  1: { title: 'Awareness & Foundation', sub: 'Dein Standort. Dein Startpunkt.', accent: '#BFFF00' },
  2: { title: 'Skill Building & Methoden', sub: 'Neue Werkzeuge. Erste Anwendung.', accent: '#00CC77' },
  3: { title: 'Integration & Praxis', sub: 'Theorie trifft Realität.', accent: '#FFB800' },
  4: { title: 'Strategic Dominance', sub: 'Dein neues Level. Dein System.', accent: '#FF4444' },
};

// ── Classname resolvers (extracted from nested ternaries for readability) ───
const getWeekTabClass = (weekLocked, isActive) => {
  if (weekLocked) return 'text-muted-foreground/40 cursor-not-allowed';
  if (isActive) return 'bg-white dark:bg-white/10 text-foreground shadow-sm';
  return 'text-muted-foreground hover:text-foreground';
};

const getDayCardClass = ({ done, isToday, unlocked }) => {
  if (done) return 'bg-emerald-50/50 dark:bg-emerald-500/[0.04] border-emerald-200/30 dark:border-emerald-500/10';
  if (isToday) return 'bg-white dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] shadow-sm';
  if (unlocked) return 'bg-white dark:bg-card border-black/[0.04] dark:border-white/[0.04] hover:shadow-sm cursor-pointer';
  return 'bg-gray-50/50 dark:bg-white/[0.01] border-black/[0.02] dark:border-white/[0.02] opacity-30';
};

const getDayBadgeClass = ({ done, isToday, unlocked }) => {
  if (done) return 'bg-emerald-500 text-white';
  if (isToday) return 'text-black dark:text-black';
  if (unlocked) return 'bg-gray-100 dark:bg-white/[0.06] text-foreground';
  return 'bg-gray-100/50 dark:bg-white/[0.02]';
};

const renderDayIcon = ({ done, unlocked, day }) => {
  if (done) return <CheckCircle2 size={16} />;
  if (unlocked) return day;
  return <Lock size={12} />;
};

const getCtaLabel = (isToday, de) => {
  if (isToday) return de ? 'Starten' : 'Start';
  return de ? 'Nachholen' : 'Catch up';
};

export default function Challenge30Page() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const navigate = useNavigate();
  const { isPremium } = useCredits();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [quizMode, setQuizMode] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try { const res = await api.get('/challenge30/status'); setData(res.data); } catch (err) { logger.error(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const startQuiz = async (day) => {
    try {
      const res = await api.get(`/challenge30/quiz/${day}`);
      setQuizMode(res.data); setCurrentQ(0); setAnswers({}); setQuizResult(null);
    } catch (err) { logger.error(err); }
  };

  const selectAnswer = (qIdx, aIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
    if (qIdx < (quizMode?.questions?.length || 10) - 1) setTimeout(() => setCurrentQ(qIdx + 1), 400);
  };

  const submitQuiz = async () => {
    if (!quizMode || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/challenge30/quiz/${quizMode.day}`, { answers });
      setQuizResult(res.data);
      if (res.data.passed) toast.success(`+${res.data.xp_earned} XP!`);
      load();
    } catch (err) { logger.error(err); } finally { setSubmitting(false); }
  };

  const startAction = async (day, path) => {
    try { await api.post(`/challenge30/complete/${day}`); toast.success('+XP!'); load(); } catch (err) { logger.error(err); }
    navigate(path);
  };

  if (loading) return <DashboardLayout><div className="p-10"><div className="max-w-3xl mx-auto space-y-3">{[1,2,3,4].map(i => <div key={`sk-${i}`} className="h-20 rounded-xl skeleton-pulse" />)}</div></div></DashboardLayout>;

  const challenges = data?.challenges || [];
  const completed = new Set(data?.completed_days || []);
  const currentDay = data?.current_day || 1;
  const totalXP = data?.total_xp_earned || 0;
  const quizScores = data?.quiz_scores || {};
  const progress = (completed.size / 30) * 100;
  const weekChallenges = challenges.filter(c => c.week === activeWeek);
  const weekAccent = WEEKS[activeWeek]?.accent || '#BFFF00';

  if (quizMode && !quizResult) {
    return <>
      <LoadingOverlay isOpen={submitting} flow="challenge" de={de} />
      <QuizView quizMode={quizMode} currentQ={currentQ} setCurrentQ={setCurrentQ} answers={answers} selectAnswer={selectAnswer} submitQuiz={submitQuiz} submitting={submitting} de={de} setQuizMode={setQuizMode} />
    </>;
  }
  if (quizMode && quizResult) {
    return <QuizResult quizResult={quizResult} setQuizResult={setQuizResult} setQuizMode={setQuizMode} setCurrentQ={setCurrentQ} setAnswers={setAnswers} de={de} />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-3xl mx-auto min-h-screen" data-testid="challenge30-page">

        {/* ── Hero Section ── */}
        <div className="relative rounded-2xl overflow-hidden mb-8 animate-fade-in" style={{ background: '#0A0A0A' }}>
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="relative p-8 sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: weekAccent }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: weekAccent }}>
                {de ? '30-Tage Programm' : '30-Day Program'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {de ? '30-Tage Leader' : '30-Day Leader'} <span style={{ color: weekAccent }}>Challenge</span>
            </h1>
            <p className="text-sm text-white/50 max-w-md">
              {de ? 'Jeden Tag 10 Fragen. 4 Wochen. Von Awareness zur strategischen Dominanz.' : '10 questions per day. 4 weeks. From awareness to strategic dominance.'}
            </p>
            <JourneyFocusLine de={de} className="mt-3 max-w-xl" />

            {/* Progress Bar inside hero */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: weekAccent }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-black text-white">{completed.size}</span>
                <span className="text-sm text-white/30">/30</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40">
              <span>{totalXP} XP {de ? 'gesammelt' : 'earned'}</span>
              <span>·</span>
              <span>{de ? `Tag ${currentDay} aktiv` : `Day ${currentDay} active`}</span>
            </div>
          </div>
        </div>

        <MissionGuideClip day={currentDay} de={de} />

        {/* ── Week Selector (Pill Tabs) ── */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-gray-100 dark:bg-white/[0.04] w-fit mb-6 animate-fade-in" data-testid="week-tabs">
          {[1, 2, 3, 4].map(w => {
            const weekLocked = !isPremium && w > 2;
            return (
              <button key={w} onClick={() => !weekLocked && setActiveWeek(w)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${getWeekTabClass(weekLocked, activeWeek === w)}`}
                data-testid={`week-tab-${w}`}>
                {weekLocked ? <Lock size={10} className="mr-0.5" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: WEEKS[w].accent }} />}
                <span className="font-bold">Woche 0{w}</span>
                <span className="hidden sm:inline">{WEEKS[w].title}</span>
                {weekLocked && <Badge className="text-[7px] font-bold bg-[#BFFF00]/10 text-[#6B8A00] dark:text-[#BFFF00] border-0 px-1.5 py-0 ml-1">PRO</Badge>}
              </button>
            );
          })}
        </div>

        {/* ── Free vs Paid Banner ── */}
        {!isPremium && activeWeek <= 2 && (
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white flex items-center gap-4 animate-fade-in" data-testid="upgrade-challenge-banner">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
              <Crown size={18} className="text-[#BFFF00]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{de ? 'Free Version: 14 Tage freigeschaltet' : 'Free: 14 days unlocked'}</p>
              <p className="text-[11px] text-white/40">{de ? 'Upgrade für alle 30 Tage, tiefere Fragen und personalisierte Auswertungen.' : 'Upgrade for all 30 days, deeper questions and personalized evaluations.'}</p>
            </div>
            <Button onClick={() => navigate('/coaching')} size="sm" className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold shrink-0 text-xs" data-testid="upgrade-challenge-btn">
              {de ? 'Upgraden' : 'Upgrade'} <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ── Week Subtitle ── */}
        <div className="flex items-center gap-3 mb-5 animate-fade-in">
          <div className="w-1 h-8 rounded-full" style={{ background: weekAccent }} />
          <div>
            <h2 className="text-base font-bold">{WEEKS[activeWeek].title}</h2>
            <p className="text-xs text-muted-foreground">{WEEKS[activeWeek].sub}</p>
          </div>
        </div>

        {/* ── Day Cards ── */}
        <div className="space-y-2 animate-fade-in">
          {weekChallenges.map(c => {
            const done = completed.has(c.day);
            const unlocked = c.day <= currentDay;
            const isToday = c.day === currentDay && !done;
            const score = quizScores[String(c.day)];
            const isQuiz = c.type === 'quiz';
            const canStart = unlocked && !done;

            return (
              <div key={c.day} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${getDayCardClass({ done, isToday, unlocked })}`} data-testid={`challenge-day-${c.day}`}>

                {/* Day Number */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${getDayBadgeClass({ done, isToday, unlocked })}`} style={isToday && !done ? { background: weekAccent } : {}}>
                  {renderDayIcon({ done, unlocked, day: c.day })}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate ${done ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                    {de ? c.title_de : c.title_en}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{c.agent}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{c.duration}</span>
                    {isQuiz && <Badge variant="outline" className="text-[8px] font-bold h-4 px-1.5 rounded-full">10 {de ? 'Fragen' : 'Q'}</Badge>}
                    {score !== undefined && <Badge className="text-[8px] font-bold h-4 px-1.5 rounded-full border-0" style={{ background: `${weekAccent}20`, color: weekAccent }}>{score}%</Badge>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground/60">+{c.xp}</span>
                  {canStart && isQuiz && (
                    <Button size="sm" onClick={() => startQuiz(c.day)}
                      className="font-bold text-[11px] h-8 px-4 rounded-full text-black"
                      style={{ background: isToday ? weekAccent : '#e5e5e5' }}
                      data-testid={`start-quiz-${c.day}`}>
                      <Play size={12} className="mr-1" />
                      {getCtaLabel(isToday, de)}
                    </Button>
                  )}
                  {canStart && !isQuiz && String(c.path || '').startsWith('/chat') && (
                    <Button size="sm" variant="outline" onClick={() => startAction(c.day, `${c.path}${c.path.includes('?') ? '&' : '?'}voice=1`)}
                      className="font-bold text-[11px] h-8 px-3 rounded-full" title={de ? 'Übung im Sprachmodus mit Wlad' : 'Practice by voice with Wlad'}
                      data-testid={`start-action-voice-${c.day}`}>
                      <Mic size={12} className="mr-1" />
                      {de ? 'Per Stimme' : 'By voice'}
                    </Button>
                  )}
                  {canStart && !isQuiz && (
                    <Button size="sm" onClick={() => startAction(c.day, c.path)}
                      className="font-bold text-[11px] h-8 px-4 rounded-full text-black"
                      style={{ background: isToday ? weekAccent : '#e5e5e5' }}
                      data-testid={`start-action-${c.day}`}>
                      <Play size={12} className="mr-1" />
                      {getCtaLabel(isToday, de)}
                    </Button>
                  )}
                  {done && (
                    <Button size="sm" variant="ghost" onClick={() => isQuiz && startQuiz(c.day)} className="text-[10px] h-7 font-semibold text-muted-foreground rounded-full">
                      <RotateCcw size={10} className="mr-1" />
                      {de ? 'Nochmal' : 'Retry'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Week Milestone ── */}
        <div className="mt-6 p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-white/[0.02] animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${weekAccent}20` }}>
              <CheckCircle2 size={10} style={{ color: weekAccent }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{de ? 'Meilenstein' : 'Milestone'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeWeek === 1 && (de ? 'Du weißt, wo du stehst — und wo die Hebel liegen.' : 'You know where you stand.')}
            {activeWeek === 2 && (de ? 'Du hast dein erstes Toolkit — und nutzt es bereits.' : 'You have your first toolkit.')}
            {activeWeek === 3 && (de ? 'Du wendest alles an — und dein Umfeld bemerkt den Unterschied.' : 'You apply everything.')}
            {activeWeek === 4 && (de ? 'Du bist nicht mehr derselbe Leader wie vor 30 Tagen.' : 'You are no longer the same leader.')}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

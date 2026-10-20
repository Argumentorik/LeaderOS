import { Fragment, useState, useEffect, useCallback } from 'react';
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
import { ChallengeBriefings } from '../components/challenge/ChallengeBriefings';
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
const getWeekCardClass = (weekLocked, isActive) => {
  if (weekLocked) return 'cursor-not-allowed border-black/[0.04] bg-black/[0.015] opacity-50 dark:border-white/[0.04] dark:bg-white/[0.01]';
  if (isActive) return 'border-black/[0.1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-white/15 dark:bg-white/[0.06]';
  return 'border-black/[0.05] bg-white/60 hover:-translate-y-0.5 hover:border-black/[0.12] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/15';
};

const getDayCardClass = ({ done, isToday, unlocked }) => {
  if (done) return 'bg-emerald-50/50 dark:bg-emerald-500/[0.04] border-emerald-200/30 dark:border-emerald-500/10';
  if (isToday) return 'bg-white dark:bg-white/[0.04] border-black/[0.1] dark:border-white/[0.12] shadow-[0_10px_34px_rgba(0,0,0,0.07)]';
  if (unlocked) return 'bg-white dark:bg-card border-black/[0.05] dark:border-white/[0.05] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer';
  return 'bg-gray-50/50 dark:bg-white/[0.01] border-black/[0.02] dark:border-white/[0.02] opacity-30';
};

const getDayBadgeClass = ({ done, isToday, unlocked }) => {
  if (done) return 'bg-emerald-500 text-white';
  if (isToday) return 'text-black dark:text-black';
  if (unlocked) return 'bg-black/[0.05] dark:bg-white/[0.07] text-foreground';
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

  if (loading) return <DashboardLayout><div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10"><div className="w-full space-y-3">{[1,2,3,4].map(i => <div key={`sk-${i}`} className="h-20 rounded-xl skeleton-pulse" />)}</div></div></DashboardLayout>;

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

  const weekMilestone = {
    1: de ? 'Du weißt, wo du stehst — und wo die Hebel liegen.' : 'You know where you stand.',
    2: de ? 'Du hast dein erstes Toolkit — und nutzt es bereits.' : 'You have your first toolkit.',
    3: de ? 'Du wendest alles an — und dein Umfeld bemerkt den Unterschied.' : 'You apply everything.',
    4: de ? 'Du bist nicht mehr derselbe Leader wie vor 30 Tagen.' : 'You are no longer the same leader.',
  }[activeWeek];

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-12 lg:py-10" data-testid="challenge30-page">
        <div className="w-full">

          {/* ── Hero: volle Breite, Zahlen rechts ── */}
          <div className="relative mb-8 overflow-hidden rounded-3xl animate-fade-in" style={{ background: '#0A0A0A' }}>
            <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.22]" />
            <div className="absolute inset-0" style={{ background: `radial-gradient(90% 120% at 85% 0%, ${weekAccent}22, transparent 60%), linear-gradient(100deg, rgba(10,10,10,0.96) 30%, rgba(10,10,10,0.55) 100%)` }} />
            <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-12">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: weekAccent }} />
                  <span className="text-[10.5px] font-black uppercase tracking-[0.22em]" style={{ color: weekAccent }}>
                    {de ? '30-Tage Programm' : '30-Day Program'} · {de ? 'Woche' : 'Week'} 0{activeWeek}
                  </span>
                </div>
                <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {de ? '30-Tage Leader' : '30-Day Leader'} <span style={{ color: weekAccent }}>Challenge</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
                  {de ? 'Jeden Tag eine Einheit. Vier Wochen. Von Awareness zur strategischen Dominanz — mit WladBot an deiner Seite.'
                      : 'One unit a day. Four weeks. From awareness to strategic dominance — with WladBot at your side.'}
                </p>
                <JourneyFocusLine de={de} className="mt-5 max-w-2xl" />
              </div>

              <div className="flex shrink-0 gap-3 lg:flex-col lg:items-end">
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm lg:w-[220px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{de ? 'Fortschritt' : 'Progress'}</p>
                  <p className="mt-1 text-4xl font-black leading-none text-white tabular-nums" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {completed.size}<span className="text-lg font-bold text-white/30">/30</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: weekAccent }} />
                  </div>
                </div>
                <div className="flex flex-1 gap-3 lg:w-[220px]">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">XP</p>
                    <p className="mt-1 text-2xl font-black leading-none text-white tabular-nums">{totalXP}</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{de ? 'Heute' : 'Today'}</p>
                    <p className="mt-1 text-2xl font-black leading-none text-white tabular-nums">{de ? `Tag ${currentDay}` : `Day ${currentDay}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Wochen-Wahl: volle Breite, vier gleich große Karten ── */}
          <div className="mb-7 grid grid-cols-2 gap-2.5 lg:grid-cols-4" data-testid="week-tabs">
            {[1, 2, 3, 4].map((w) => {
              const weekLocked = !isPremium && w > 2;
              const isActive = activeWeek === w;
              return (
                <button key={w} onClick={() => !weekLocked && setActiveWeek(w)} disabled={weekLocked}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${getWeekCardClass(weekLocked, isActive)}`}
                  data-testid={`week-tab-${w}`}>
                  <span className="absolute inset-x-0 top-0 h-[3px] transition-opacity" style={{ background: WEEKS[w].accent, opacity: isActive ? 1 : 0.25 }} />
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: WEEKS[w].accent }}>{de ? 'Woche' : 'Week'} 0{w}</span>
                    {weekLocked && <Lock size={10} className="text-muted-foreground" />}
                    {weekLocked && <Badge className="ml-auto border-0 bg-[#BFFF00]/10 px-1.5 py-0 text-[8px] font-bold text-[#6B8A00] dark:text-[#BFFF00]">PRO</Badge>}
                  </span>
                  <span className="mt-1.5 block text-[14px] font-bold leading-snug">{WEEKS[w].title}</span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{WEEKS[w].sub}</span>
                </button>
              );
            })}
          </div>

          {/* ── Zwei Spalten: Tage links, Kontext rechts (klebt mit) ── */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-9 w-1.5 rounded-full" style={{ background: weekAccent }} />
                <div>
                  <h2 className="text-lg font-black tracking-tight md:text-xl">{WEEKS[activeWeek].title}</h2>
                  <p className="text-[12.5px] text-muted-foreground">{WEEKS[activeWeek].sub}</p>
                </div>
                <span className="ml-auto text-[12px] font-bold text-muted-foreground tabular-nums">
                  {weekChallenges.filter((c) => completed.has(c.day)).length}/{weekChallenges.length} {de ? 'erledigt' : 'done'}
                </span>
              </div>

              <div className="space-y-2.5 animate-fade-in">
                {weekChallenges.map(c => {
                  const done = completed.has(c.day);
                  const unlocked = c.day <= currentDay;
                  const isToday = c.day === currentDay && !done;
                  const score = quizScores[String(c.day)];
                  const isQuiz = c.type === 'quiz';
                  const canStart = unlocked && !done;

                  return (
                    <Fragment key={c.day}>
                    <div className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${getDayCardClass({ done, isToday, unlocked })}`}
                         data-testid={`challenge-day-${c.day}`}>

                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-black ${getDayBadgeClass({ done, isToday, unlocked })}`}
                           style={isToday && !done ? { background: weekAccent } : {}}>
                        {renderDayIcon({ done, unlocked, day: c.day })}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-[15px] font-bold leading-snug ${done ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                          {de ? c.title_de : c.title_en}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted-foreground">
                          <span className="font-semibold">{c.agent}</span>
                          <span>·</span>
                          <span>{c.duration}</span>
                          {isQuiz && <Badge variant="outline" className="h-[18px] rounded-full px-2 text-[9px] font-bold">10 {de ? 'Fragen' : 'Q'}</Badge>}
                          {score !== undefined && (
                            <Badge className="h-[18px] rounded-full border-0 px-2 text-[9px] font-bold" style={{ background: `${weekAccent}20`, color: weekAccent }}>{score}%</Badge>
                          )}
                          {isToday && <span className="font-black" style={{ color: weekAccent }}>· {de ? 'heute dran' : 'due today'}</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] font-black text-muted-foreground/60 tabular-nums">+{c.xp} XP</span>
                        {canStart && isQuiz && (
                          <Button size="sm" onClick={() => startQuiz(c.day)}
                            className="h-9 rounded-full px-5 text-[12px] font-black text-black transition-transform hover:scale-[1.02]"
                            style={{ background: isToday ? weekAccent : '#e5e5e5' }}
                            data-testid={`start-quiz-${c.day}`}>
                            <Play size={12} className="mr-1" />
                            {getCtaLabel(isToday, de)}
                          </Button>
                        )}
                        {canStart && !isQuiz && String(c.path || '').startsWith('/chat') && (
                          <Button size="sm" variant="outline" onClick={() => startAction(c.day, `${c.path}${c.path.includes('?') ? '&' : '?'}voice=1`)}
                            className="h-9 rounded-full px-3.5 text-[12px] font-bold" title={de ? 'Übung im Sprachmodus mit WladBot' : 'Practice by voice with WladBot'}
                            data-testid={`start-action-voice-${c.day}`}>
                            <Mic size={12} className="mr-1" />
                            {de ? 'Per Stimme' : 'By voice'}
                          </Button>
                        )}
                        {canStart && !isQuiz && (
                          <Button size="sm" onClick={() => startAction(c.day, c.path)}
                            className="h-9 rounded-full px-5 text-[12px] font-black text-black transition-transform hover:scale-[1.02]"
                            style={{ background: isToday ? weekAccent : '#e5e5e5' }}
                            data-testid={`start-action-${c.day}`}>
                            <Play size={12} className="mr-1" />
                            {getCtaLabel(isToday, de)}
                          </Button>
                        )}
                        {done && (
                          <Button size="sm" variant="ghost" onClick={() => isQuiz && startQuiz(c.day)} className="h-8 rounded-full text-[11px] font-semibold text-muted-foreground">
                            <RotateCcw size={11} className="mr-1" />
                            {de ? 'Nochmal' : 'Retry'}
                          </Button>
                        )}
                      </div>
                    </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* ── Rechte Spalte: heutiges Briefing, Upgrade, Meilenstein ── */}
            <aside className="space-y-4 xl:sticky xl:top-6" data-testid="challenge-side-panel">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-card" data-testid="challenge-day-briefing">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {de ? `Briefing · Tag ${currentDay}` : `Briefing · day ${currentDay}`}
                </p>
                <MissionGuideClip day={currentDay} de={de} />
              </div>

              {!isPremium && (
                <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] p-5 text-white animate-fade-in" data-testid="upgrade-challenge-banner">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#BFFF00]/15">
                    <Crown size={18} className="text-[#BFFF00]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">{de ? '14 von 30 Tagen offen' : '14 of 30 days open'}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                      {de ? 'Woche 3 und 4 bringen die Gespräche, an denen Karrieren hängen — plus tiefere Fragen und persönliche Auswertung.'
                          : 'Weeks 3 and 4 bring the conversations careers hinge on — plus deeper questions and personal evaluation.'}
                    </p>
                    <Button onClick={() => navigate('/coaching')} size="sm"
                            className="mt-3 h-9 w-full rounded-full bg-[#BFFF00] text-[12px] font-black text-[#0A0A0A] hover:bg-[#D4FF4D]"
                            data-testid="upgrade-challenge-btn">
                      {de ? 'Alle 30 Tage freischalten' : 'Unlock all 30 days'} <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${weekAccent}20` }}>
                    <CheckCircle2 size={11} style={{ color: weekAccent }} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Meilenstein' : 'Milestone'}</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-foreground/80">{weekMilestone}</p>
              </div>
            </aside>
          </div>

          {/* Iter 180: Tages-Briefings Tag 1–7 leben hier (vorher im Video-Guide) */}
          <div className="mt-10">
            <ChallengeBriefings de={de} currentDay={currentDay} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

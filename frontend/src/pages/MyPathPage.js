import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { SmartConsultationBanner } from '../components/brand/SmartConsultationBanner';
import { UpcomingEventsCard } from '../components/dashboard/UpcomingEventsCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useReadableColor } from '../lib/levelColors';
import logger from '../lib/logger';
import {
  Sparkles, Lock, CheckCircle2, ArrowRight, Zap, Crown,
  Star, Shield, Eye, Trophy, Brain, Target, HeartHandshake,
  MessageSquareText, Video, Flame, Award, FileText, TrendingUp
} from 'lucide-react';

const LEVEL_ICONS = [Shield, HeartHandshake, MessageSquareText, Brain, Eye];

const LevelNode = ({ level, isLast, navigate }) => {
  const Icon = LEVEL_ICONS[level.index] || Zap;
  const locked = !level.is_unlocked && !level.is_current;

  return (
    <div className="relative flex gap-5" data-testid={`level-node-${level.index}`}>
      {!isLast && (
        <div className="absolute left-6 top-[72px] bottom-0 w-px" style={{
          background: level.is_unlocked ? `linear-gradient(to bottom, ${level.color}, ${level.color}30)` : 'hsl(var(--border))'
        }} />
      )}
      <div className="relative z-10 shrink-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          level.is_current ? 'shadow-xl scale-110' : level.is_unlocked ? 'shadow-md' : 'bg-muted/30 border border-border'
        }`} style={level.is_unlocked || level.is_current ? {
          background: `linear-gradient(135deg, ${level.color}, ${level.color}BB)`,
          boxShadow: level.is_current ? `0 8px 30px ${level.color}40` : undefined,
        } : {}}>
          {locked ? <Lock size={16} className="text-muted-foreground/40" /> : <Icon size={18} className="text-white" />}
        </div>
        {level.is_current && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#30D158] border-2 border-background animate-pulse" />}
      </div>

      <div className={`flex-1 pb-8 ${locked ? 'opacity-40' : ''}`}>
        <div className={`rounded-2xl border transition-all ${
          level.is_current ? 'border-transparent shadow-lg bg-gradient-to-br from-white to-gray-50/80 dark:from-card dark:to-card/80'
            : level.is_unlocked ? 'border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-card/50'
            : 'border-dashed border-border bg-muted/5'
        } p-5`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: level.is_unlocked ? level.color : undefined }}>
                Level {level.index + 1}
              </span>
              {level.is_current && <span className="text-[8px] font-bold bg-[#30D158]/15 text-[#30D158] px-2 py-0.5 rounded-full">AKTUELL</span>}
              {level.is_unlocked && !level.is_current && <CheckCircle2 size={12} style={{ color: level.color }} />}
            </div>
            {level.is_current && <span className="text-[10px] font-bold text-muted-foreground">{level.xp_progress}%</span>}
          </div>

          <h3 className={`text-lg font-black tracking-tight ${locked ? 'text-muted-foreground/50' : ''}`}>{level.level}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{level.subtitle}</p>

          {!locked && level.description && (
            <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed">{level.description}</p>
          )}

          {level.is_current && (
            <div className="mt-3">
              <Progress value={level.xp_progress} className="h-2" />
              <p className="text-[9px] text-muted-foreground mt-1">{level.min_xp} XP → {[200, 500, 1000, 2000, 99999][level.index]} XP</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {level.skills.map(skill => (
              <span key={skill} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${locked ? 'bg-muted/50 text-muted-foreground/30' : 'bg-black/[0.04] dark:bg-white/[0.06] text-foreground/70'}`}>{skill}</span>
            ))}
          </div>

          {level.is_unlocked && !level.is_current && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: level.color }}>
              <Award size={12} /> {level.certificate}
            </div>
          )}
          {level.is_current && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <FileText size={10} /> {level.certificate} · in Arbeit
            </div>
          )}
          {(locked || level.is_next) && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
              <Lock size={10} /> {level.unlock_requirement}
            </div>
          )}
          {level.is_current && (
            <button onClick={() => navigate('/challenge')} className="tap-target mt-2 flex items-center gap-1.5 py-2 text-[11px] font-bold transition-colors hover:opacity-80" style={{ color: level.color }}>
              Weiter trainieren <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MyPathPage() {
  const { ink } = useReadableColor();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPath = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/my-path'); setData(res.data); }
    catch (err) {
      logger.error('My Path error:', err);
      setData(null);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPath(); }, [loadPath]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-[#BFFF00] border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!data) return (
    <DashboardLayout>
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Pfad-Daten konnten nicht geladen werden.</p>
        <button onClick={loadPath} className="px-4 py-2 rounded-lg bg-[#BFFF00] text-[#0A0A0A] font-bold text-sm" data-testid="retry-mypath">
          Erneut versuchen
        </button>
      </div>
    </DashboardLayout>
  );

  const currentMeta = data.levels[data.current_index];

  return (
    <DashboardLayout rightPanel={
      <div className="p-5 space-y-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dein Profil</h3>
        <div className="p-4 rounded-xl bg-[#0A0A0A] text-white" data-testid="xp-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${currentMeta?.color || '#BFFF00'}, ${currentMeta?.color || '#BFFF00'}AA)` }}>
              {(() => { const I = LEVEL_ICONS[data.current_index]; return <I size={18} className="text-white" />; })()}
            </div>
            <div>
              <p className="text-sm font-bold">{data.current_level}</p>
              <p className="text-[10px] text-white/40">Level {data.current_index + 1} / 5</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#BFFF00]">{data.xp}</span>
            <span className="text-xs text-white/40">XP</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zertifikate</h3>
          {data.certificates?.map(cert => (
            <div key={cert.level} className={`flex items-center gap-2.5 p-3 rounded-xl ${cert.earned ? 'bg-[#BFFF00]/5 border border-[#BFFF00]/15' : 'bg-muted/20 border border-border'}`} data-testid={`cert-${cert.earned ? 'earned' : 'pending'}`}>
              <Award size={14} className={cert.earned ? 'text-[#5A7A00] dark:text-[#BFFF00]' : 'text-muted-foreground/30'} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold ${cert.earned ? '' : 'text-muted-foreground/50'}`}>{cert.title}</p>
                <p className="text-[8px] text-muted-foreground/50">{cert.level}</p>
              </div>
              {cert.earned ? <CheckCircle2 size={12} className="text-[#5A7A00] dark:text-[#BFFF00]" /> : <Lock size={10} className="text-muted-foreground/20" />}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statistiken</h3>
          {[
            { icon: Flame, label: 'Challenge-Tage', value: data.challenge_days, max: 30 },
            { icon: Video, label: 'Video-Missionen', value: data.video_missions, max: 16 },
            { icon: MessageSquareText, label: 'Coach-Sessions', value: data.chat_sessions, max: null },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <stat.icon size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold">{stat.label}</p>
                {stat.max && <Progress value={Math.min(100, (stat.value / stat.max) * 100)} className="h-1 mt-1" />}
              </div>
              <span className="text-sm font-black">{stat.value}{stat.max ? `/${stat.max}` : ''}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/challenge')} className="w-full p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/20 hover:border-[#BFFF00]/40 transition-all text-left" data-testid="mypath-cta-challenge">
          <p className="text-xs font-bold">Weiter trainieren</p>
          <p className="text-[9px] text-muted-foreground">30-Tage Challenge fortsetzen</p>
        </button>

        {/* Iter 92.9: bringt Donnerstag-Cohort Events direkt in den My-Path Right-Rail */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Nächste Events
          </h3>
          <UpcomingEventsCard locale="de" />
        </div>
      </div>
    }>
      <div className="p-6 lg:p-8 max-w-5xl" data-testid="my-path-page">
        <div className="mb-6" data-anim="mypath-header">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#BFFF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MY PATH</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Deine <span className="text-[#BFFF00]">Leadership</span> Journey
          </h1>
          <p className="text-base sm:text-lg text-white/50 mt-6 max-w-xl leading-relaxed font-light">
            Fünf Stufen der Führung. Jedes Level-Up bringt dir ein Zertifikat
            und neue Fähigkeiten · von Teamplayer bis Visionär.
          </p>
        </div>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList
            className="mb-10 lg:mb-12 bg-transparent border-b border-white/[0.06] rounded-none p-0 h-auto w-full justify-start gap-8"
            data-testid="mypath-tabs"
            data-anim="mypath-tabs"
          >
            <TabsTrigger
              value="progress"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
              data-testid="tab-progress"
            >
              <TrendingUp size={14} strokeWidth={1.5} /> Mein Fortschritt
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
              data-testid="tab-videos"
            >
              <PlayCircle size={14} /> Lernvideos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-0" data-testid="tab-content-progress">
            {currentMeta && (
              <div className="mb-12" data-anim="mypath-current-level">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="p-7 lg:p-8 flex items-center gap-6">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${currentMeta.color}14`,
                        border: `1px solid ${currentMeta.color}30`,
                      }}
                    >
                      {(() => { const I = LEVEL_ICONS[data.current_index]; return <I size={22} strokeWidth={1.5} style={{ color: currentMeta.color }} />; })()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: currentMeta.color }}>Aktuelles Level</p>
                      <h2 className="text-xl font-black">{data.current_level}</h2>
                      <p className="text-xs text-muted-foreground">{currentMeta.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black" style={{ color: currentMeta.color }}>{data.xp}</p>
                      <p className="text-[9px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                  {data.current_index < 4 && (
                    <div className="px-5 pb-4">
                      <Progress value={currentMeta.xp_progress || 0} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-muted-foreground">{currentMeta.min_xp} XP</span>
                        <span className="text-[9px] text-muted-foreground">{[200, 500, 1000, 2000, 99999][data.current_index]} XP</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="max-w-3xl">
              {data.levels.map((level, i) => (
                <div key={level.level} data-anim="mypath-node">
                  <LevelNode level={level} isLast={i === data.levels.length - 1} navigate={navigate} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center py-8 max-w-3xl" data-anim="mypath-trophy">
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${data.current_index === 4 ? 'bg-[#BFFF00]/10 border border-[#BFFF00]/20' : 'bg-muted/20 border border-border'}`}>
                <Trophy size={18} className={data.current_index === 4 ? 'text-[#BFFF00]' : 'text-muted-foreground/30'} />
                <span className={`text-sm font-bold ${data.current_index === 4 ? 'text-[#BFFF00]' : 'text-muted-foreground/40'}`}>
                  {data.current_index === 4 ? 'Visionär erreicht! Du gestaltest die Zukunft der Führung.' : 'Werde Visionär — entwickle deine Zukunftsperspektive'}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

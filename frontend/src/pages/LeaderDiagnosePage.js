/**
 * Leader-Diagnose Detail Page
 *
 * Premium in-app view of the user's leader-check.de diagnosis.
 * Replaces the previous behaviour where "Detailanalyse ansehen" opened
 * leader-check.de in a new tab — now everything stays inside the app.
 *
 * Data source: GET /api/wladhub/diagnosis  →  returns the full diagnosis doc
 * including overall score, 3-layer breakdown, leader-typ, strengths,
 * improvements, fuehrungsdimensionen, layer_scores, aktionsplan_30_tage,
 * roi_forecast.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Share2, RefreshCw, TrendingUp, Brain, Mic, Heart, Target, Sparkles, Award, ChevronRight, Loader2 } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { shareToLinkedIn, shareToX, shareNative } from '../lib/share';
import { toast } from 'sonner';

const LAYER_META = {
  ki_kompetenz: {
    label_de: 'KI-Kompetenz',
    label_en: 'AI Competence',
    desc_de: 'Wie souverän nutzt du KI als Hebel für deine Führungsentscheidungen?',
    desc_en: 'How confidently you use AI as a lever for leadership decisions',
    color: '#BFFF00',
    icon: Brain,
  },
  boardroom_rhetorik: {
    label_de: 'Boardroom-Rhetorik',
    label_en: 'Boardroom Rhetoric',
    desc_de: 'Klarheit, Überzeugungskraft und Wirkung in Vorstands- und Investoren-Settings.',
    desc_en: 'Clarity, persuasion, and presence in boardroom and investor settings',
    color: '#00AAFF',
    icon: Mic,
  },
  strategisches_eq: {
    label_de: 'Strategisches EQ',
    label_en: 'Strategic EQ',
    desc_de: 'Emotionale Intelligenz als strategische Waffe — nicht als Soft-Skill.',
    desc_en: 'Emotional intelligence as a strategic weapon — not a soft skill',
    color: '#FFB800',
    icon: Heart,
  },
};

// Premium dark gradient backgrounds per score range
const scoreGradient = (score) => {
  if (score >= 80) return 'linear-gradient(135deg, #BFFF00 0%, #7FE000 100%)';
  if (score >= 60) return 'linear-gradient(135deg, #00FFAA 0%, #00AAFF 100%)';
  if (score >= 40) return 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)';
  return 'linear-gradient(135deg, #FF5566 0%, #BB3344 100%)';
};

const RingScore = ({ score, size = 200, stroke = 14, label }) => {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#BFFF00' : score >= 60 ? '#00FFAA' : score >= 40 ? '#FFB800' : '#FF5566';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#grad-${label})`}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}>
          {score}
        </span>
        <span className="text-xs text-white/40 font-medium tracking-wide">/100</span>
      </div>
    </div>
  );
};

const LayerCard = ({ layerKey, score, de }) => {
  const meta = LAYER_META[layerKey];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div
      className="relative p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden group hover:border-white/15 transition-all"
      data-testid={`layer-card-${layerKey}`}
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-[0.04] blur-2xl" style={{ background: meta.color }} />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          <Icon size={18} />
        </div>
        <span className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {score}<span className="text-white/25 text-lg font-medium">/100</span>
        </span>
      </div>
      <h3 className="font-bold text-white mb-1.5">{de ? meta.label_de : meta.label_en}</h3>
      <p className="text-xs text-white/50 leading-relaxed mb-4">{de ? meta.desc_de : meta.desc_en}</p>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, background: meta.color, boxShadow: `0 0 12px ${meta.color}55` }}
        />
      </div>
    </div>
  );
};

const InsightChip = ({ children, variant = 'positive' }) => {
  const styles = variant === 'positive'
    ? 'bg-[#BFFF00]/[0.08] border-[#BFFF00]/20 text-[#D4FF4D]'
    : 'bg-amber-500/[0.06] border-amber-500/20 text-amber-300';
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm leading-relaxed ${styles}`}>
      {children}
    </div>
  );
};

const ActionItem = ({ idx, item }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-colors">
    <div className="w-7 h-7 shrink-0 rounded-full bg-[#BFFF00]/15 flex items-center justify-center text-[#BFFF00] text-xs font-bold mt-0.5">
      {idx + 1}
    </div>
    <p className="text-sm text-white/80 leading-relaxed flex-1">{typeof item === 'string' ? item : (item.action || item.title || JSON.stringify(item))}</p>
  </div>
);

export default function LeaderDiagnosePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [diag, layer3] = await Promise.all([
        api.get('/wladhub/diagnosis'),
        api.get('/wladhub/3layer'),
      ]);
      // 3layer always returns scores (derived if no diagnosis). Diagnosis returns
      // {connected: false} when nothing imported yet. Combine for the UI.
      setData({ ...diag.data, ...layer3.data, has_diagnosis: diag.data.connected });
    } catch (err) {
      logger.error('Leader-Diagnose load failed', err);
      toast.error(de ? 'Diagnose konnte nicht geladen werden.' : 'Could not load diagnosis.');
    } finally {
      setLoading(false);
    }
  }, [de]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/wladhub/sync', {});
      if (res.data.status === 'synced') {
        toast.success(de ? 'Neue Daten aus leader-check.de synchronisiert.' : 'Synced new data from leader-check.de.');
        await load();
      } else if (res.data.status === 'no_data') {
        toast.info(de ? 'Noch keine Diagnose auf leader-check.de gefunden.' : 'No diagnosis found yet on leader-check.de.');
      } else {
        toast.info(de ? 'Daten sind aktuell.' : 'Data is up to date.');
      }
    } catch (err) {
      logger.error('Sync failed', err);
      toast.error(de ? 'Synchronisation fehlgeschlagen.' : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleShare = async (platform) => {
    if (!data) return;
    const params = {
      userId: user?.user_id,
      score: data.overall_score,
      tierLabel: data.leader_typ || (de ? 'Leader' : 'Leader'),
      lang,
    };
    if (platform === 'linkedin') shareToLinkedIn(params);
    else if (platform === 'x') shareToX(params);
    else await shareNative(params);
    try { await api.post('/share', { platform, content_type: 'leader_diagnose' }); } catch (shareErr) { logger.warn('Share analytics failed (best-effort)', shareErr); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-7 h-7 animate-spin text-[#BFFF00]" />
        </div>
      </DashboardLayout>
    );
  }

  const overall = data?.overall_score || 0;
  const ki = data?.ki_kompetenz || 0;
  const rhet = data?.boardroom_rhetorik || 0;
  const eq = data?.strategisches_eq || 0;
  const leaderTyp = data?.leader_typ || (de ? 'Emerging Leader' : 'Emerging Leader');
  const strengths = data?.strengths || [];
  const improvements = data?.improvements || [];
  const actionPlan = data?.aktionsplan_30_tage || data?.action_plan || [];
  const roi = data?.roi_forecast;
  const fuehrung = data?.fuehrungsdimensionen || {};

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0A0A]" data-testid="leader-diagnose-page">
        {/* Hero gradient backdrop */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.5]" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(191,255,0,0.08), transparent)' }} />
          <div className="relative px-6 lg:px-12 pt-8 pb-10 max-w-6xl mx-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors mb-8"
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft size={16} /> {de ? 'Dashboard' : 'Dashboard'}
            </button>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BFFF00]/[0.08] border border-[#BFFF00]/20 mb-4">
                  <Sparkles size={12} className="text-[#BFFF00]" />
                  <span className="text-[10px] font-bold text-[#BFFF00] tracking-wider uppercase">Leader-Diagnose</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {de ? 'Deine Führungs-' : 'Your Leadership'}
                  <br />
                  <span className="text-[#BFFF00]">{de ? 'Diagnose' : 'Diagnosis'}</span>
                </h1>
                <p className="text-white/50 mt-4 max-w-lg leading-relaxed">
                  {de
                    ? 'Wo du heute stehst — basierend auf 3 Layern: KI-Kompetenz, Boardroom-Rhetorik und Strategisches EQ.'
                    : 'Where you stand today — across 3 dimensions: AI competence, boardroom rhetoric, and strategic EQ.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 self-center lg:self-auto">
                <RingScore score={overall} label="overall" />
                <span className="text-sm font-bold text-white">{leaderTyp}</span>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                variant="outline"
                className="border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-transparent"
                data-testid="sync-diagnose-btn"
              >
                <RefreshCw size={14} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? (de ? 'Sync...' : 'Syncing...') : (de ? 'Mit leader-check.de syncen' : 'Sync with leader-check.de')}
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                size="sm"
                variant="outline"
                className="border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-transparent"
                data-testid="share-linkedin-btn"
              >
                <Share2 size={14} className="mr-2" /> LinkedIn
              </Button>
              <Button
                onClick={() => handleShare('x')}
                size="sm"
                variant="outline"
                className="border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-transparent"
                data-testid="share-x-btn"
              >
                <Share2 size={14} className="mr-2" /> X
              </Button>
              <Button
                onClick={() => handleShare('native')}
                size="sm"
                variant="outline"
                className="border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-transparent lg:hidden"
                data-testid="share-native-btn"
              >
                <Share2 size={14} className="mr-2" /> {de ? 'Teilen' : 'Share'}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-12 pb-16 max-w-6xl mx-auto space-y-10">
          {/* 3-Layer breakdown */}
          <section data-testid="three-layer-section">
            <h2 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-4">{de ? '3-Layer Analyse' : '3-Layer Breakdown'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LayerCard layerKey="ki_kompetenz" score={ki} de={de} />
              <LayerCard layerKey="boardroom_rhetorik" score={rhet} de={de} />
              <LayerCard layerKey="strategisches_eq" score={eq} de={de} />
            </div>
          </section>

          {/* Strengths + improvements split */}
          {(strengths.length > 0 || improvements.length > 0) && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {strengths.length > 0 && (
                <div data-testid="strengths-section">
                  <h2 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-3 flex items-center gap-2">
                    <TrendingUp size={12} className="text-[#BFFF00]" /> {de ? 'Deine Stärken' : 'Your Strengths'}
                  </h2>
                  <div className="space-y-2">
                    {strengths.map((s, i) => (
                      <InsightChip key={`str-${i}`} variant="positive">{s}</InsightChip>
                    ))}
                  </div>
                </div>
              )}
              {improvements.length > 0 && (
                <div data-testid="improvements-section">
                  <h2 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-3 flex items-center gap-2">
                    <Target size={12} className="text-amber-400" /> {de ? 'Entwicklungsfelder' : 'Growth Areas'}
                  </h2>
                  <div className="space-y-2">
                    {improvements.map((s, i) => (
                      <InsightChip key={`imp-${i}`} variant="growth">{s}</InsightChip>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 30-Tage Aktionsplan */}
          {actionPlan.length > 0 && (
            <section data-testid="action-plan-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-white/40 tracking-wider uppercase">{de ? '30-Tage Aktionsplan' : '30-Day Action Plan'}</h2>
                <span className="text-[10px] text-white/30">{actionPlan.length} {de ? 'Schritte' : 'steps'}</span>
              </div>
              <div className="space-y-2">
                {actionPlan.slice(0, 10).map((item, i) => (
                  <ActionItem key={`act-${i}`} idx={i} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Führungsdimensionen — if present */}
          {Object.keys(fuehrung).length > 0 && (
            <section data-testid="fuehrungsdimensionen-section">
              <h2 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-4">{de ? 'Führungsdimensionen' : 'Leadership Dimensions'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(fuehrung).slice(0, 8).map(([dim, value]) => (
                  <div key={dim} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 truncate">{dim.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}<span className="text-white/25 text-sm font-medium">/100</span></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ROI forecast */}
          {roi && (
            <section data-testid="roi-section">
              <Card className="p-8 bg-gradient-to-br from-[#BFFF00]/[0.04] to-transparent border-[#BFFF00]/15 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
                    <Award size={22} className="text-[#BFFF00]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{de ? 'ROI-Forecast' : 'ROI Forecast'}</h2>
                    <p className="text-sm text-white/70 leading-relaxed">{roi}</p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* CTA → Video Missions */}
          <section data-testid="next-step-cta">
            <Card className="p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-white/10 rounded-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{de ? 'Bereit für den nächsten Schritt?' : 'Ready for the next step?'}</h2>
                  <p className="text-sm text-white/50">{de ? 'Trainiere deine Schwachstellen mit KI-bewerteten Video-Missionen.' : 'Train your weak spots with AI-rated video missions.'}</p>
                </div>
                <Button
                  onClick={() => navigate('/missions')}
                  className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-black font-bold"
                  data-testid="goto-missions-btn"
                >
                  {de ? 'Video-Missionen starten' : 'Start Missions'} <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Trophy, Target, ArrowLeft, ArrowRight, Star, Download,
  CheckCircle2, Lightbulb, TrendingUp, MessageSquareText, RotateCcw,
  Share2, Copy, Check, ChevronDown, ChevronUp, Sparkles, Play, Volume2,
  Mic, BarChart3, Wand2, Brain,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import logger from '../../lib/logger';
import VoicePlayButton from '../shared/VoicePlayButton';
import SmartText from '../shared/SmartText';
import { AddToFolderButton } from './AddToFolderButton';

// ── Reusable atoms ───────────────────────────────────────────────────────
const ScoreChip = ({ value, label, color, gradient }) => (
  <div className="bg-white/[0.04] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3 text-center">
    <p className="text-2xl font-black" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value || 0}</p>
    <div className="h-1 rounded-full bg-black/5 dark:bg-white/[0.05] mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`} style={{ width: `${value || 0}%` }} />
    </div>
    <p className="text-[9px] text-muted-foreground mt-1.5 uppercase tracking-wider font-bold">{label}</p>
  </div>
);

// "Magic Box" — animated collapsible section with deep-dive content
const MagicBox = ({ icon: Icon, title, accent = '#BFFF00', defaultOpen = false, children, testId }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${open
        ? 'border-[color:var(--mb-accent)] bg-white/60 dark:bg-white/[0.02] shadow-lg'
        : 'border-black/[0.06] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.01] hover:border-[color:var(--mb-accent)] hover:bg-white/60 dark:hover:bg-white/[0.02]'}`}
      style={{ '--mb-accent': `${accent}50` }}
      data-testid={testId}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform"
          style={{ background: `${accent}1A`, color: accent, transform: open ? 'rotate(0deg)' : 'rotate(-4deg)' }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black tracking-tight leading-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{open ? 'Klicke zum Schließen' : 'Klicke für tiefere Einblicke'}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground/60 shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground/60 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 animate-fade-in">{children}</div>}
    </div>
  );
};

export const AnalysisResults = ({
  analysis, activeChallenge, resetChallenge, handleDownloadReport,
  setShowUpsell, lang, isAccelerator = false, onReplay,
  videoUrl, // Iter 92.23.7 (Mert): video blob URL for replay
}) => {
  const de = lang === 'de';
  const navigate = useNavigate();
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  // Iter 92.23: Public Share-Link only offered if entry_id exists and score >= 50
  const canShare = Boolean(analysis?.entry_id) && (analysis?.overall_score || 0) >= 50;
  // Iter 92.23.7: don't leak blob URLs on unmount
  useEffect(() => () => { if (videoUrl?.startsWith('blob:')) try { URL.revokeObjectURL(videoUrl); } catch (_) {} }, [videoUrl]);

  const handleShare = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) { logger.warn('clipboard failed:', err?.message); }
      return;
    }
    setShareLoading(true);
    try {
      const res = await api.post('/missions/share', { entry_id: analysis.entry_id });
      const fullUrl = `${window.location.origin}${res.data.share_url}`;
      setShareUrl(fullUrl);
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (clipErr) { logger.warn('clipboard failed:', clipErr?.message); }
    } catch (err) {
      logger.error('Share link generation failed:', err);
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Share-Link konnte nicht erstellt werden' : 'Could not generate share link');
      } catch (toastErr) { logger.warn('toast unavailable:', toastErr?.message); }
    } finally {
      setShareLoading(false);
    }
  };

  const handleDeepChat = () => {
    const prefill = analysis.deep_feedback_prompt || (de
      ? `Ich habe gerade die Mission „${activeChallenge?.title}" gemacht und ${analysis.overall_score}/100 erreicht. Hilf mir gezielt an meinen 3 Verbesserungen zu arbeiten: ${(analysis.improvements || []).slice(0,3).join(' · ')}`
      : `I just completed the mission "${activeChallenge?.title}" and scored ${analysis.overall_score}/100. Help me work on my 3 improvements: ${(analysis.improvements || []).slice(0,3).join(' · ')}`);
    navigate(`/chat?prefill=${encodeURIComponent(prefill)}`);
  };

  return (
    <div className="space-y-5 animate-fade-in" data-testid="video-results">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={resetChallenge} className="font-semibold">
          <ArrowLeft size={16} className="mr-1" /> {de ? 'Zurück' : 'Back'}
        </Button>
        <div className="flex items-center gap-2">
          {videoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideo(v => !v)}
              className="font-semibold border-[#BFFF00]/30 hover:bg-[#BFFF00]/5"
              data-testid="toggle-video-replay-btn"
            >
              <Play size={13} className="mr-1.5" /> {showVideo ? (de ? 'Verstecken' : 'Hide') : (de ? 'Aufnahme abspielen' : 'Replay recording')}
            </Button>
          )}
          {analysis?.entry_id && (
            <AddToFolderButton entryId={analysis.entry_id} title={activeChallenge?.title} de={de} />
          )}
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] font-black px-3 py-1">
            {de ? 'MISSION ABGESCHLOSSEN' : 'MISSION COMPLETE'}
          </Badge>
        </div>
      </div>

      {/* Video Replay — premium framed player (Iter 92.23.7) */}
      {videoUrl && showVideo && (
        <div className="rounded-2xl overflow-hidden border-2 border-[#BFFF00]/30 bg-black shadow-xl shadow-[#BFFF00]/10 relative" data-testid="video-replay-frame">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/15 ring-1 ring-[#BFFF00]/40 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#BFFF00]">DEINE AUFNAHME</span>
          </div>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full max-h-[420px] bg-black"
            data-testid="video-replay-player"
          />
        </div>
      )}

      {/* Title block — compact */}
      <div className="text-center py-2">
        <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{activeChallenge?.title}</h2>
        <p className="text-[12px] text-muted-foreground mt-1">{de ? 'KI-Analyse nach Wlad Jachtchenko' : 'AI analysis by Wlad Jachtchenko'}</p>
      </div>

      {/* ────────────────────────────────────────────────────────
          PRIMARY: 3 Stärken + 3 Verbesserungen — TOP of screen
          (Iter 92.23.7 Mert: "video analyse output starts with the
          3 Dinge, die du verbessern kannst und 3 Dinge, die du gut
          gemacht hast")
      ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="strengths-improvements-primary">
        {analysis.strengths?.length > 0 && (
          <Card className="border-l-[3px] border-l-green-500 bg-gradient-to-br from-green-50/40 to-transparent dark:from-green-500/[0.04] dark:to-transparent border-black/[0.06] dark:border-white/[0.06]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 size={15} className="text-green-500" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-green-700 dark:text-green-300 leading-tight">{de ? '3 Dinge, die du gut gemacht hast' : '3 things you did well'}</h4>
                  <p className="text-[10px] text-muted-foreground">{de ? 'Deine Stärken — bau darauf auf' : 'Your strengths — build on these'}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {analysis.strengths.slice(0,3).map((s, sIdx) => (
                  <div key={`strength-${sIdx}`} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-green-500/10">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                      {sIdx + 1}
                    </span>
                    <p className="text-[13px] leading-relaxed flex-1 text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {analysis.improvements?.length > 0 && (
          <Card className="border-l-[3px] border-l-amber-500 bg-gradient-to-br from-amber-50/40 to-transparent dark:from-amber-500/[0.04] dark:to-transparent border-black/[0.06] dark:border-white/[0.06]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Target size={15} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-amber-700 dark:text-amber-300 leading-tight">{de ? '3 Dinge, die du verbessern kannst' : '3 things to improve'}</h4>
                  <p className="text-[10px] text-muted-foreground">{de ? 'Konkrete Übungen für deinen nächsten Versuch' : 'Concrete exercises for next time'}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {analysis.improvements.slice(0,3).map((s, iIdx) => (
                  <div key={`improve-${iIdx}`} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-amber-500/10">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                      {iIdx + 1}
                    </span>
                    <p className="text-[13px] leading-relaxed flex-1 text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wlad-Assessment Player — premium prominence right after 3+3 */}
      {analysis.wlad_assessment && (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F1A] to-[#1A1A2E] text-white relative" data-testid="wlad-assessment">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/10 ring-1 ring-[#BFFF00]/30 backdrop-blur-sm z-10">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#BFFF00] flex items-center justify-center">
              <span className="text-[7px] font-black text-black leading-none">W</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#BFFF00] leading-none">LEADER-OS</span>
          </div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-xl shadow-[#BFFF00]/30 ring-2 ring-[#BFFF00]/20" aria-label="LEADER-OS">
                  <span className="text-2xl font-black text-black leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>W</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0A0A0A] flex items-center justify-center ring-2 ring-[#BFFF00]">
                  <CheckCircle2 size={11} className="text-[#BFFF00]" strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <div>
                    <p className="text-[14px] font-black tracking-tight">Wlad Jachtchenko</p>
                    <p className="text-[10px] font-bold text-[#BFFF00]/80 uppercase tracking-widest">Persönliche Einschätzung · KI-Voice</p>
                  </div>
                  <VoicePlayButton
                    text={analysis.wlad_assessment}
                    persona="wlad"
                    size="sm"
                    variant="primary"
                    label={de ? 'Wlad anhören' : 'Listen to Wlad'}
                    testId="wlad-assessment-play"
                    showWave
                  />
                </div>
                <div className="text-white/90 mt-2 [&_*]:!text-white/90 [&_.text-foreground]:!text-white [&_strong]:!text-white">
                  <SmartText text={analysis.wlad_assessment} accent="#BFFF00" icon={Lightbulb} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Score Strip — was the hero, now a slim banner */}
      <Card className="bg-gradient-to-br from-white/80 to-white/60 dark:from-white/[0.03] dark:to-white/[0.01] border-black/[0.04] dark:border-white/[0.06]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={13} className="text-muted-foreground" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{de ? 'Deine Scores' : 'Your Scores'}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{de ? 'Gesamt' : 'Overall'}</p>
              <p className="text-3xl font-black leading-none" style={{
                color: analysis.overall_score >= 80 ? '#10B981' : analysis.overall_score >= 60 ? '#F59E0B' : '#EF4444',
                fontFamily: 'Outfit, sans-serif',
              }}>{analysis.overall_score || 0}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="video-scores">
            <ScoreChip value={analysis.clarity_score}    label={de ? 'Klarheit' : 'Clarity'}        color="#0EA5E9" gradient="from-sky-500 to-blue-500" />
            <ScoreChip value={analysis.confidence_score} label={de ? 'Selbstvertrauen' : 'Confidence'} color="#A855F7" gradient="from-violet-500 to-purple-500" />
            <ScoreChip value={analysis.empathy_score}    label={de ? 'Empathie' : 'Empathy'}       color="#EC4899" gradient="from-pink-500 to-rose-500" />
            <ScoreChip value={analysis.structure_score}  label={de ? 'Struktur' : 'Structure'}     color="#10B981" gradient="from-emerald-500 to-teal-500" />
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────
          MAGIC BOXES — collapsible drill-down for "more details"
          (Iter 92.23.7 Mert: "see more detailed infos in a nice way
          so it like open a magic box for more detailed information")
      ──────────────────────────────────────────────────────── */}
      <div className="space-y-3" data-testid="magic-boxes">
        <div className="flex items-center gap-2 mt-2 mb-1 px-1">
          <Sparkles size={12} className="text-[#BFFF00]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6B8A00] dark:text-[#BFFF00]">
            {de ? 'Tiefer eintauchen' : 'Dive deeper'}
          </span>
        </div>

        {analysis.sexier_scores && (
          <MagicBox icon={Brain} title={de ? 'Wlads SEXIER-Analyse' : "Wlad's SEXIER Analysis"} accent="#BFFF00" testId="magic-box-sexier">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {[
                { letter: 'S', label: 'Storytelling', desc: de ? 'Geschichte & Botschaft' : 'Story & message', score: analysis.sexier_scores.storytelling, color: '#F59E0B' },
                { letter: 'E', label: 'Emotion', desc: de ? 'Gefühle gezielt nutzen' : 'Using emotions', score: analysis.sexier_scores.emotion, color: '#EC4899' },
                { letter: 'X', label: 'Examples', desc: de ? 'Konkrete Beispiele' : 'Concrete examples', score: analysis.sexier_scores.examples, color: '#6366F1' },
                { letter: 'I', label: 'Interaktion', desc: de ? 'Publikum ansprechen' : 'Engaging the audience', score: analysis.sexier_scores.interaktion, color: '#0EA5E9' },
                { letter: 'E', label: 'Expression', desc: de ? 'Stimme, Tempo, Gestik' : 'Voice, pace, gestures', score: analysis.sexier_scores.expression, color: '#8B5CF6' },
                { letter: 'R', label: de ? 'Roter Faden' : 'Red Thread', desc: de ? 'Klare Struktur' : 'Clear structure', score: analysis.sexier_scores.roter_faden, color: '#10B981' },
              ].map((p, i) => (
                <div key={`${p.letter}-${i}`} className="rounded-xl p-4 bg-white/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center" data-testid={`sexier-tile-${i}`}>
                  <p className="text-[10px] font-black tracking-widest" style={{ color: p.color }}>{p.letter}</p>
                  <p className="text-3xl font-black" style={{ color: p.color, fontFamily: 'Outfit, sans-serif' }}>{p.score || 0}</p>
                  <p className="text-[11px] font-bold mt-1">{p.label}</p>
                  <p className="text-[9px] text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
            {analysis.framework_feedback?.sexier && (
              <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Wlads Bewertung' : "Wlad's verdict"}</p>
                <SmartText text={analysis.framework_feedback.sexier} accent="#BFFF00" icon={Lightbulb} />
              </div>
            )}
            {analysis.framework_feedback?.kommunikationsquadrant && (
              <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Kommunikationsquadrant' : 'Communication Quadrant'}</p>
                <SmartText text={analysis.framework_feedback.kommunikationsquadrant} accent="#10B981" icon={Target} />
              </div>
            )}
          </MagicBox>
        )}

        {/* Legacy fallback — entries analysed BEFORE the SEXIER switch */}
        {!analysis.sexier_scores && (analysis.logos_score || analysis.ethos_score || analysis.pathos_score) && (
          <MagicBox icon={Brain} title={de ? '3 Säulen der Überzeugung (Logos · Ethos · Pathos)' : '3 Pillars (Logos · Ethos · Pathos)'} accent="#BFFF00" testId="magic-box-pillars">
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Logos', desc: de ? 'Logik & Daten' : 'Logic & Data', score: analysis.logos_score, color: '#6366F1' },
                { label: 'Ethos', desc: de ? 'Glaubwürdigkeit' : 'Credibility', score: analysis.ethos_score, color: '#8B5CF6' },
                { label: 'Pathos', desc: de ? 'Emotion' : 'Emotion', score: analysis.pathos_score, color: '#A78BFA' },
              ].map((p) => (
                <div key={p.label} className="rounded-xl p-4 bg-white/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center">
                  <p className="text-3xl font-black" style={{ color: p.color, fontFamily: 'Outfit, sans-serif' }}>{p.score || 0}</p>
                  <p className="text-[11px] font-bold mt-1">{p.label}</p>
                  <p className="text-[9px] text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
            {analysis.framework_feedback?.drei_saeulen && (
              <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Wlads Bewertung' : "Wlad's verdict"}</p>
                <SmartText text={analysis.framework_feedback.drei_saeulen} accent="#BFFF00" icon={Lightbulb} />
              </div>
            )}
            {analysis.framework_feedback?.kommunikationsquadrant && (
              <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Kommunikationsquadrant' : 'Communication Quadrant'}</p>
                <SmartText text={analysis.framework_feedback.kommunikationsquadrant} accent="#10B981" icon={Target} />
              </div>
            )}
          </MagicBox>
        )}

        {analysis.speech_analysis && (
          <MagicBox icon={Mic} title={de ? 'Rede-Analyse (Füllwörter, Tempo, Phrasen)' : 'Speech Analysis (Fillers, Pace, Phrases)'} accent="#F59E0B" testId="magic-box-speech">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {analysis.speech_analysis.filler_count !== undefined && (
                <div className="text-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 border border-amber-500/10">
                  <p className="text-2xl font-black text-amber-500" style={{ fontFamily: 'Outfit, sans-serif' }}>{analysis.speech_analysis.filler_count}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Füllwörter' : 'Filler Words'}</p>
                </div>
              )}
              {analysis.speech_analysis.avg_sentence_length && (
                <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                  <p className="text-sm font-bold capitalize">{analysis.speech_analysis.avg_sentence_length}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Satzlänge' : 'Sentence Length'}</p>
                </div>
              )}
              {analysis.speech_analysis.speech_pace && (
                <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                  <p className="text-sm font-bold capitalize">{analysis.speech_analysis.speech_pace}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Tempo' : 'Pace'}</p>
                </div>
              )}
              {analysis.speech_analysis.key_phrases?.length > 0 && (
                <div className="text-center p-3 rounded-xl bg-green-50/50 dark:bg-green-500/10 border border-green-500/10">
                  <p className="text-2xl font-black text-green-500" style={{ fontFamily: 'Outfit, sans-serif' }}>{analysis.speech_analysis.key_phrases.length}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Starke Phrasen' : 'Strong Phrases'}</p>
                </div>
              )}
            </div>
            {analysis.speech_analysis.filler_words?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Erkannte Füllwörter' : 'Detected fillers'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.speech_analysis.filler_words.map((w, wIdx) => (
                    <span key={`filler-${w}-${wIdx}`} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">"{w}"</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.speech_analysis.key_phrases?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Deine stärksten Formulierungen' : 'Your strongest phrases'}</p>
                <ul className="space-y-1.5">
                  {analysis.speech_analysis.key_phrases.map((p, i) => (
                    <li key={`phrase-${i}`} className="text-[12px] italic text-foreground/80 pl-3 border-l-2 border-green-500/40">"{p}"</li>
                  ))}
                </ul>
              </div>
            )}
          </MagicBox>
        )}

        {analysis.rewrite_suggestion && (
          <MagicBox icon={Wand2} title={de ? 'Vorgeschlagene Überarbeitung (Wlad-Style)' : 'Suggested Rewrite (Wlad-Style)'} accent="#0EA5E9" testId="magic-box-rewrite">
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-sky-50/50 to-[#BFFF00]/[0.04] dark:from-sky-500/[0.05] dark:to-[#BFFF00]/[0.03] border border-sky-500/15 italic">
              <p className="text-[13px] leading-relaxed">"{analysis.rewrite_suggestion}"</p>
            </div>
          </MagicBox>
        )}

        {analysis.practice_exercises?.length > 0 && (
          <MagicBox icon={Lightbulb} title={de ? 'Übungen für morgen' : 'Practice for Tomorrow'} accent="#BFFF00" testId="magic-box-practice">
            <div className="space-y-2 mt-3">
              {analysis.practice_exercises.map((ex, exIdx) => (
                <div key={`ex-${exIdx}`} className="flex gap-3 p-3 rounded-xl bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/[0.04] border border-[#BFFF00]/20">
                  <span className="w-7 h-7 rounded-lg bg-[#BFFF00] text-[#0A0A0A] font-black text-[11px] flex items-center justify-center shrink-0">{exIdx + 1}</span>
                  <p className="text-[13px] leading-relaxed flex-1">{ex}</p>
                </div>
              ))}
            </div>
          </MagicBox>
        )}

        {analysis.transcript && (
          <MagicBox icon={MessageSquareText} title={de ? 'Dein Transkript' : 'Your Transcript'} accent="#94A3B8" testId="magic-box-transcript">
            <p className="text-[13px] italic text-muted-foreground leading-relaxed mt-3 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">"{analysis.transcript}"</p>
          </MagicBox>
        )}

        {analysis.improvement_vs_previous && analysis.improvement_vs_previous !== 'null' && (
          <MagicBox icon={TrendingUp} title={de ? 'Vergleich mit vorherigen Versuchen' : 'vs. Previous Attempts'} accent="#10B981" testId="magic-box-progress">
            <div className="mt-3"><SmartText text={analysis.improvement_vs_previous} accent="#10B981" icon={TrendingUp} /></div>
          </MagicBox>
        )}
      </div>

      {/* Deep-dive CTA — chat with WladBot */}
      <Card className="border-0 bg-gradient-to-r from-[#0A0A0A] via-[#1A1A2E] to-[#0A0A0A] text-white overflow-hidden shadow-xl shadow-black/20" data-testid="deep-feedback-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#BFFF00]/15 ring-1 ring-[#BFFF00]/30 flex items-center justify-center shrink-0">
              <MessageSquareText size={22} className="text-[#BFFF00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#BFFF00] mb-1">
                {de ? 'NÄCHSTER SCHRITT' : 'NEXT STEP'}
              </p>
              <p className="text-base sm:text-lg font-black leading-tight">
                {de ? 'Willst du noch tiefer gehendes Feedback im Chat?' : 'Want deeper feedback in the chat?'}
              </p>
              <p className="text-xs sm:text-[13px] text-white/60 leading-snug mt-1">
                {de
                  ? 'WladBot kennt deine Analyse und arbeitet konkret mit dir an deinen 3 Verbesserungen.'
                  : "WladBot has your full analysis and will work with you on your 3 improvements."}
              </p>
            </div>
            <Button
              onClick={handleDeepChat}
              data-testid="deep-feedback-chat-btn"
              className="bg-[#BFFF00] hover:bg-[#A8E600] text-black font-black shrink-0 h-11 px-5"
            >
              {de ? 'Im Chat öffnen' : 'Open in chat'} <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions — premium PDF + replay + share */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="analysis-actions">
        <Button variant="outline" onClick={handleDownloadReport} className="border-[#BFFF00]/30 hover:bg-[#BFFF00]/5 font-bold h-11" data-testid="download-mission-report-btn">
          <Download size={14} className="mr-2" /> {de ? 'Detailliertes PDF' : 'Detailed PDF'}
        </Button>
        <Button
          onClick={() => onReplay?.(activeChallenge)}
          className="bg-[#BFFF00] hover:bg-[#A8E600] text-black font-black h-11"
          data-testid="mission-replay-btn"
        >
          <RotateCcw size={14} className="mr-2" /> {de ? 'Mission wiederholen' : 'Replay mission'}
        </Button>
        {canShare && (
          <Button
            onClick={handleShare}
            disabled={shareLoading}
            variant="outline"
            className="border-black/10 dark:border-white/10 font-bold h-11"
            data-testid="share-mission-btn"
          >
            {copied ? <Check size={14} className="mr-2 text-green-500" /> : shareUrl ? <Copy size={14} className="mr-2" /> : <Share2 size={14} className="mr-2" />}
            {copied ? (de ? 'Kopiert!' : 'Copied!') : shareUrl ? (de ? 'Link kopieren' : 'Copy link') : (de ? 'Teilen' : 'Share')}
          </Button>
        )}
      </div>

      {/* Upsell — non-Accelerator only */}
      {!isAccelerator && (
        <div className="upsell-border">
          <div className="p-5 flex items-center gap-4" data-testid="mission-upsell-banner">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
              <Star size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">{de ? 'Perfektioniere deine Executive Presence' : 'Perfect your executive presence'}</p>
              <p className="text-[12px] text-muted-foreground">{de ? '1:1 Video-Coaching mit Wlads Expertenteam' : "1:1 video coaching with Wlad's Expert Team"}</p>
            </div>
            <Button onClick={() => setShowUpsell(true)} className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold shadow-sm shrink-0" data-testid="mission-upsell-btn">
              4.977 EUR <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

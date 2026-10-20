import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, ArrowRight, Star, Download, MessageSquareText, RotateCcw, Share2, Copy, Check, Play } from 'lucide-react';
import { useManagedMedia } from '../../hooks/useManagedMedia';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { AddToFolderButton } from './AddToFolderButton';
import { TheoryAnswerView } from './TheoryAnswerView';
import { StrengthsImprovements, WladAssessmentCard, ScoreStrip } from './AnalysisPrimaryCards';
import { AnalysisMagicBoxes } from './AnalysisMagicBoxes';

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
  useManagedMedia(videoRef);

  // Iter 92.23: Public Share-Link only offered if entry_id exists and score >= 50
  const canShare = Boolean(analysis?.entry_id) && (analysis?.overall_score || 0) >= 50;
  // Iter 92.23.7: don't leak blob URLs on unmount
  useEffect(() => () => { if (videoUrl?.startsWith('blob:')) try { URL.revokeObjectURL(videoUrl); } catch { /* ignore */ } }, [videoUrl]);

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

  if (analysis?.type === 'theory_answer') {
    return <TheoryAnswerView analysis={analysis} de={de} resetChallenge={resetChallenge} navigate={navigate} />;
  }

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

      <StrengthsImprovements analysis={analysis} de={de} />
      {analysis.wlad_assessment && <WladAssessmentCard analysis={analysis} de={de} />}
      <ScoreStrip analysis={analysis} de={de} />
      <AnalysisMagicBoxes analysis={analysis} de={de} />

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
              4.797 EUR <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

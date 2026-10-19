import { useState, useEffect } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { VoiceRecorder } from '../components/shared/VoiceRecorder';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import {
  PenLine, Send, Loader2, CheckCircle2,
  Lightbulb, Sparkles, TrendingUp, Mic
} from 'lucide-react';

export default function DailyCheckinPage() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const prompts = t('checkin.prompts') || [];
  const [activePrompt] = useState(Math.floor(Math.random() * Math.max(prompts.length, 1)));
  const [lastInputMode, setLastInputMode] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, historyRes] = await Promise.all([
          api.get('/daily-checkin/today'),
          api.get('/daily-checkin')
        ]);
        if (todayRes.data?.checkin_id) {
          setTodayCheckin(todayRes.data);
          setFeedback(todayRes.data.ai_feedback);
        }
        setHistory(historyRes.data || []);
      } catch (err) { logger.error('Failed to load check-in data:', err); } finally { setLoadingHistory(false); }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/daily-checkin', { content: input.trim(), checkin_type: lastInputMode || 'text' });
      setFeedback(res.data.feedback);
      setTodayCheckin(res.data);
      setInput('');
      setLastInputMode(null);
    } catch (err) { logger.error('Check-in failed:', err); }
    finally { setLoading(false); }
  };

  const handleVoiceResult = (text) => {
    setLastInputMode('voice');
    setInput(prev => prev ? prev + ' ' + text : text);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 xl:px-14 w-full space-y-6 bg-gradient-mesh min-h-screen" data-testid="daily-checkin-page">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center shadow-lg shadow-black/10">
              <PenLine size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('checkin.title')}</h1>
              <p className="text-sm text-muted-foreground font-medium">{t('checkin.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <Card className="border-sky-200/40 dark:border-blue-500/20 bg-gradient-to-r from-blue-50 to-[#BFFF00]/[0.04] dark:from-blue-500/5 dark:to-[#BFFF00]/[0.03] animate-fade-in" data-testid="checkin-feedback">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-[13px] font-bold text-green-600 dark:text-green-400">{t('checkin.todayComplete')}</span>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/60 dark:bg-background/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{t('checkin.aiFeedback')}</p>
                  <p className="text-sm leading-relaxed">{feedback.feedback}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 p-4 rounded-xl bg-white/60 dark:bg-background/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">
                      <Lightbulb size={10} className="inline mr-1" />{t('checkin.tipTomorrow')}
                    </p>
                    <p className="text-[13px]">{feedback.micro_tip}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/60 dark:bg-background/40 text-center min-w-[90px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{t('checkin.impact')}</p>
                    <p className="text-2xl font-black gradient-text">+{feedback.score_delta || 0}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-[#BFFF00]/[0.03] border border-sky-200/30 dark:border-blue-500/10">
                  <p className="text-[13px] font-medium"><Sparkles size={12} className="inline mr-1 text-sky-600" />{feedback.encouragement}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Immersive Loading Overlay */}
        <LoadingOverlay isOpen={loading} flow="checkin" de={lang === 'de'} />

        {/* Input */}
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-black/[0.04] dark:border-white/[0.06] animate-fade-in stagger-1" data-testid="checkin-input-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb size={14} className="text-amber-500 shrink-0" />
              <p className="text-[13px] italic">{Array.isArray(prompts) ? prompts[activePrompt % prompts.length] : ''}</p>
            </div>

            {/* Prominent Voice CTA */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-[#BFFF00]/[0.08] to-[#9ACC00]/[0.04] border border-[#BFFF00]/20 dark:border-[#BFFF00]/15" data-testid="checkin-voice-cta">
              <div className="w-11 h-11 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
                <Mic size={20} className="text-[#6B8A00] dark:text-[#BFFF00]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground">{lang === 'de' ? 'Sprich frei · unser KI-Agent hört zu' : 'Speak freely · our AI agent is listening'}</p>
                <p className="text-[11px] text-muted-foreground">{lang === 'de' ? 'Tippe den Mic-Button und reflektiere laut. Whisper transkribiert in Sekunden.' : 'Tap the mic button and reflect out loud. Whisper transcribes in seconds.'}</p>
              </div>
              <VoiceRecorder onTranscription={handleVoiceResult} disabled={loading} />
            </div>

            <Textarea
              value={input} onChange={(e) => { setInput(e.target.value); setLastInputMode('text'); }}
              placeholder={t('checkin.placeholder')}
              className="min-h-[130px] resize-none text-sm bg-gray-50 dark:bg-muted/30 border-black/[0.06] dark:border-white/[0.06] focus:border-[#BFFF00]/50 rounded-xl"
              data-testid="checkin-input"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">
                {input.trim() ? `${input.trim().split(/\s+/).length} ${lang === 'de' ? 'Wörter' : 'words'}` : (lang === 'de' ? 'Text oder Sprache' : 'Text or voice')}
              </span>
              <Button onClick={handleSubmit} disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] hover:from-blue-700 hover:to-violet-700 text-white font-bold shadow-lg shadow-black/10"
                data-testid="checkin-submit-btn">
                {loading ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> {t('checkin.analyzing')}</> : <><Send size={14} className="mr-1.5" /> {feedback ? t('checkin.update') : t('checkin.submit')}</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <div className="animate-fade-in stagger-2">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp size={13} /> {t('checkin.recent')}
            </h2>
            <div className="space-y-2">
              {history.slice(0, 7).map((item, i) => (
                <Card key={item.created_at || `hist-${i}`} className="bg-white/60 dark:bg-card/50 border-black/[0.04] dark:border-white/[0.06]" data-testid={`checkin-history-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-relaxed line-clamp-2">{item.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px] font-semibold">{item.ai_feedback?.category || 'growth'}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <span className="text-sm font-black gradient-text">+{item.ai_feedback?.score_delta || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

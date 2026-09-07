import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Lightbulb, MessageSquareText, RotateCcw } from 'lucide-react';
import VoicePlayButton from '../shared/VoicePlayButton';
import SmartText from '../shared/SmartText';
import { MagicBox } from './AnalysisAtoms';

/* Theory question detected — Wlad's answer instead of speech feedback */
export const TheoryAnswerView = ({ analysis, de, resetChallenge, navigate }) => (
    <div className="space-y-5 animate-fade-in" data-testid="theory-answer-view">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={resetChallenge} className="font-semibold">
          <ArrowLeft size={16} className="mr-1" /> {de ? 'Zurück' : 'Back'}
        </Button>
        <Badge className="bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-0 text-[10px] font-black uppercase tracking-wider">
          {de ? 'Wissens-Frage erkannt' : 'Theory question detected'}
        </Badge>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F1A] to-[#1A1A2E] text-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#BFFF00] mb-1">WladBot 3.0</p>
              <p className="text-[12px] text-white/50">
                {de
                  ? 'Das war eine Wissens-Frage — hier ist Wlads Antwort statt eines Rede-Feedbacks:'
                  : "That was a theory question — here's Wlad's answer instead of speech feedback:"}
              </p>
            </div>
            <VoicePlayButton
              text={(analysis.answer || '').slice(0, 790)}
              persona="wlad"
              variant="primary"
              size="md"
              label={de ? 'Antwort anhören' : 'Listen to answer'}
              testId="theory-answer-audio-btn"
            />
          </div>
          <div className="pt-2 border-t border-white/10">
            <SmartText text={analysis.answer} accent="#BFFF00" icon={Lightbulb} />
          </div>
        </CardContent>
      </Card>

      <MagicBox icon={MessageSquareText} title={de ? 'Deine Frage (Transkript)' : 'Your question (transcript)'} accent="#94A3B8" testId="theory-question-transcript">
        <p className="text-[13px] text-muted-foreground italic mt-2">"{analysis.question || analysis.transcript}"</p>
      </MagicBox>

      <div className="flex gap-3">
        <Button
          onClick={() => navigate(`/chat?prefill=${encodeURIComponent(analysis.question || '')}`)}
          variant="outline"
          className="flex-1 font-semibold h-11"
          data-testid="theory-deep-chat-btn"
        >
          <MessageSquareText size={14} className="mr-2" /> {de ? 'Im Chat vertiefen' : 'Deep-dive in chat'}
        </Button>
        <Button onClick={resetChallenge} className="flex-1 bg-[#BFFF00] text-[#0A0A0A] font-bold h-11" data-testid="theory-new-mission-btn">
          <RotateCcw size={14} className="mr-2" /> {de ? 'Neue Mission starten' : 'Start new mission'}
        </Button>
      </div>
  </div>
);

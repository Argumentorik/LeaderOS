import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, Loader2, FileText } from 'lucide-react';
import { WladBotAvatar } from '../shared/WladBotAvatar';
import { PlaybookReport } from './PlaybookReport';
import VoicePlayButton from '../shared/VoicePlayButton';

export const PlaybookChatMessage = ({
  msg, adviceReport, onGenerateReport, generatingReport,
  onDownloadPDF, generatingPDF, de,
}) => {
  if (msg.from === 'user') {
    return (
      <div className="flex gap-3 animate-fade-in justify-end">
        <div className="max-w-[80%] chat-bubble-user px-4 py-3">
          <p className="text-[13px] leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in items-start">
      <WladBotAvatar size={28} className="mt-0.5" />
      <div className="max-w-[80%] space-y-2">
        {msg.isStep && (
          <Badge className="bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10 text-[#4A6200] dark:text-[#BFFF00] border-0 text-[9px] font-bold mb-1">
            {de ? `Schritt ${msg.stepIdx + 1}` : `Step ${msg.stepIdx + 1}`}{msg.stepTitle ? `: ${msg.stepTitle}` : ''}
          </Badge>
        )}
        <div className="chat-bubble-bot px-4 py-3">
          <p className="text-[13px] leading-relaxed">{msg.text}</p>
        </div>
        {msg.text && !msg.isLoading && (
          <VoicePlayButton
            text={msg.text.slice(0, 790)}
            persona="wlad"
            size="xs"
            variant="ghost"
            label={de ? 'Anhören' : 'Listen'}
            testId="playbook-msg-audio-btn"
          />
        )}
        {msg.keyPoints?.length > 0 && (
          <div className="bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/5 rounded-xl px-4 py-3 border border-[#BFFF00]/20 dark:border-[#BFFF00]/10">
            <p className="text-[10px] font-bold text-[#4A6200] dark:text-[#BFFF00] uppercase tracking-wider mb-2">{de ? 'Kernpunkte' : 'Key Points'}</p>
            {msg.keyPoints.map((p, j) => (
              <div key={`kp-${j}-${p.slice(0,20)}`} className="flex items-start gap-2 text-[12px] mb-1">
                <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        )}
        {msg.isCompletion && !adviceReport && (
          <Button onClick={onGenerateReport} disabled={generatingReport}
            className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold shadow-lg shadow-[#BFFF00]/15 mt-2"
            data-testid="generate-report-btn">
            {generatingReport
              ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> {de ? 'Wird erstellt...' : 'Generating...'}</>
              : <><FileText size={14} className="mr-1.5" /> {de ? 'Report erstellen' : 'Generate Report'}</>}
          </Button>
        )}
        {msg.isReport && adviceReport && (
          <PlaybookReport adviceReport={adviceReport} onDownloadPDF={onDownloadPDF} generatingPDF={generatingPDF} de={de} />
        )}
        {msg.isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-1">
            <Loader2 size={12} className="animate-spin text-[#6B8A00] dark:text-[#BFFF00]" />
            <span>{de ? 'Analysiere dein Leadership-Profil...' : 'Analyzing your leadership profile...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

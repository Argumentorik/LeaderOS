import { Badge } from '../ui/badge';
import { Lightbulb, Target, ListChecks, CheckCircle2 } from 'lucide-react';
import SmartText from '../shared/SmartText';
import { ModalityBadge } from './ModalityBadge';

const UserMessage = ({ content, modality }) => (
  <div className="flex justify-end mb-4 animate-fade-in" data-testid="chat-user-message">
    <div className="flex flex-col items-end gap-1 max-w-[70%]">
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
        <p className="text-sm text-white whitespace-pre-wrap">{content}</p>
      </div>
      {/* Iter 92.42 (Vibe-Security): per-message modality badge so user
          always knows whether their input was registered as text/speech/video. */}
      {modality && modality !== 'text' && (
        <ModalityBadge modality={modality} size="sm" />
      )}
    </div>
  </div>
);

const PlainAssistantMessage = ({ content }) => (
  <div className="flex mb-4 animate-fade-in" data-testid="chat-ai-message">
    <div className="max-w-[80%] bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <SmartText text={content} variant="inline" accent="#BFFF00" icon={Lightbulb} />
    </div>
  </div>
);

export const ChatMessage = ({ msg, de }) => {
  if (msg.role === 'user') return <UserMessage content={msg.content} modality={msg.modality} />;

  let parsed = msg.parsed;
  if (!parsed && typeof msg.content === 'string') {
    try { parsed = JSON.parse(msg.content); } catch { parsed = null; }
  }
  if (!parsed) return <PlainAssistantMessage content={msg.content} />;

  return (
    <div className="flex mb-6 animate-fade-in" data-testid="chat-ai-message">
      <div className="max-w-[85%] space-y-2.5">
        {parsed.agent_used && (
          <Badge className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white text-[10px] font-semibold border-0">
            {parsed.agent_used}
          </Badge>
        )}
        {parsed.insight && (
          <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{de ? 'Leadership-Erkenntnis' : 'Leadership Insight'}</span>
            </div>
            <SmartText text={parsed.insight} variant="inline" accent="#F59E0B" icon={Lightbulb} />
          </div>
        )}
        {parsed.strategy && (
          <div className="bg-gradient-to-r from-blue-50 to-[#BFFF00]/[0.04] dark:from-blue-500/5 dark:to-[#BFFF00]/[0.03] border border-sky-200/30 dark:border-blue-500/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-sky-600" />
              <span className="text-[10px] font-bold text-sky-600/70 uppercase tracking-wider">{de ? 'Strategie' : 'Strategy'}</span>
            </div>
            <SmartText text={parsed.strategy} variant="inline" accent="#0EA5E9" icon={Target} />
          </div>
        )}
        {parsed.action_steps?.length > 0 && (
          <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks size={14} className="text-green-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{de ? 'Nächste Schritte' : 'Action Steps'}</span>
            </div>
            <ol className="text-sm space-y-1.5">
              {parsed.action_steps.map((s, i) => (
                <li key={`step-${s.slice(0, 15)}-${i}`} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {parsed.reflection && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200/30 dark:border-amber-500/10 rounded-2xl px-4 py-3">
            <p className="text-sm italic text-muted-foreground">{parsed.reflection}</p>
          </div>
        )}
        {parsed.tasks?.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 size={12} className="text-green-500" />
            <span className="text-[11px] text-muted-foreground font-medium">{parsed.tasks.length} {de ? 'Aufgabe(n) erstellt' : 'task(s) created'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

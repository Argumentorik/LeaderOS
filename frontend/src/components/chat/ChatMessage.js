import { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Lightbulb, Target, ListChecks, CheckCircle2, Plus, Loader2, CornerDownRight, Copy, Check, RefreshCw } from 'lucide-react';
import SmartText from '../shared/SmartText';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { FileText } from 'lucide-react';
import { ModalityBadge } from './ModalityBadge';
import { WladBotAvatar } from '../brand/WladBotAvatar';
import { unescapeText, deepUnescape } from '../../lib/textClean';

/* Iter 139: Antworten sahen klickbar aus, waren es aber nicht. Jetzt gibt es
   eine echte Aktion — Antwort kopieren, mit sichtbarer Bestätigung. */
const CopyMessageButton = ({ text, de }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const copy = async () => {
    const value = text || '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback für Browser/Kontexte ohne Clipboard-API (z. B. http)
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (err) { logger.warn('copy failed', err); }
  };
  return (
    <button
      type="button"
      onClick={copy}
      data-testid="chat-copy-btn"
      aria-label={de ? 'Antwort kopieren' : 'Copy answer'}
      className="tap-target inline-flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground hover:text-[#4A6200] dark:hover:text-[#BFFF00] transition-colors px-2 py-2 rounded-md"
    >
      {copied
        ? <><Check size={11} className="text-emerald-500" /> {de ? 'Kopiert' : 'Copied'}</>
        : <><Copy size={11} /> {de ? 'Kopieren' : 'Copy'}</>}
    </button>
  );
};

/* Iter 92.58: tasks are opt-in — WladBot suggests, the user clicks to accept. */
const TasksSuggestion = ({ tasks, sessionId, de }) => {
  const [state, setState] = useState('idle'); // idle | saving | done
  const accept = async () => {
    setState('saving');
    try {
      await api.post('/chat/tasks/accept', { tasks, session_id: sessionId || '' });
      setState('done');
    } catch (err) { logger.error('task accept failed:', err); setState('idle'); }
  };
  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 px-1" data-testid="chat-tasks-created">
        <CheckCircle2 size={12} className="text-green-500" />
        <span className="text-[11px] text-muted-foreground font-medium">{tasks.length} {de ? 'Aufgabe(n) erstellt' : 'task(s) created'}</span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-[#BFFF00]/25 bg-[#BFFF00]/[0.05] px-4 py-3" data-testid="chat-tasks-suggestion">
      <div className="flex items-center gap-2 mb-2">
        <ListChecks size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{de ? 'Vorschlag: Aufgaben' : 'Suggested tasks'}</span>
      </div>
      <ul className="space-y-1 mb-3">
        {tasks.slice(0, 3).map((t, i) => (
          <li key={`tsk-${i}`} className="text-[12.5px] font-medium flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-[#BFFF00] mt-2 shrink-0" />{t.title}
          </li>
        ))}
      </ul>
      <button
        onClick={accept}
        disabled={state === 'saving'}
        className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11.5px] font-bold transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
        data-testid="chat-tasks-accept-btn"
      >
        {state === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={3} />}
        {de ? 'Als Aufgaben übernehmen' : 'Add as tasks'}
      </button>
    </div>
  );
};

/* Iter 92.58 (Grok-style): clickable follow-up questions — one click deepens
   the conversation, WladBot has already "prepared" the direction. */
const FollowUpChips = ({ questions, onSuggest, de }) => (
  <div className="flex flex-wrap gap-2 pt-1" data-testid="chat-followup-chips">
    {questions.slice(0, 3).map((q, i) => (
      <button
        key={`fu-${i}`}
        onClick={() => onSuggest?.(q)}
        className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white/70 dark:bg-white/[0.04] text-[12px] font-semibold text-foreground/80 hover:border-[#BFFF00]/60 hover:bg-[#BFFF00]/[0.08] hover:text-foreground transition-all hover:-translate-y-0.5"
        data-testid={`chat-followup-${i}`}
      >
        <CornerDownRight size={11} className="text-[#6B8A00] dark:text-[#BFFF00] group-hover:translate-x-0.5 transition-transform" />
        {q}
      </button>
    ))}
  </div>
);

const UserMessage = ({ content, modality, pdf }) => (
  <div className="flex justify-end mb-4 animate-fade-in" data-testid="chat-user-message">
    <div className="flex flex-col items-end gap-1 max-w-[70%]">
      {/* Iter 137: das Dokument haengt sichtbar an der Nachricht — der User
          sieht, dass WladBot es wirklich gelesen hat. */}
      {pdf && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/25" data-testid="chat-message-attachment">
          <FileText size={13} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate max-w-[220px]">{pdf.filename}</p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {pdf.pages ? `${pdf.pages} Seiten gelesen` : 'gelesen'} · von WladBot ausgewertet
            </p>
          </div>
        </div>
      )}
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

const PlainAssistantMessage = ({ content, de }) => (
  <div className="flex mb-4 animate-fade-in items-start gap-2.5" data-testid="chat-ai-message">
    <WladBotAvatar size={28} className="mt-1" />
    <div className="max-w-[80%] space-y-1">
      <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm select-text">
        <SmartText text={content} variant="inline" accent="#BFFF00" />
      </div>
      <CopyMessageButton text={content} de={de} />
    </div>
  </div>
);

// Iter 137: Alt-Nachrichten (vor display_text) enthalten den Roh-Prompt —
// Dokument-Dump und [Kontext:…] werden fuer die Anzeige herausgefiltert.
const legacyClean = (content) => {
  if (typeof content !== 'string') return { text: content, pdf: null };
  let text = content;
  let pdf = null;
  const doc = text.match(/^\[Dokument: ([^·\]]+)(?:· [^\]]*)?\]\n---\n[\s\S]*?\n---\n\n/);
  if (doc) { pdf = { filename: doc[1].trim() }; text = text.slice(doc[0].length); }
  const img = text.match(/^\[Bild angehängt: ([^\]]+)\]\n\n/);
  if (img) { pdf = { filename: img[1].trim() }; text = text.slice(img[0].length); }
  text = text.replace(/^\[Kontext: [^\]]*\]\n\n/, '');
  return { text, pdf };
};

export const ChatMessage = ({ msg, de, onSuggest, sessionId, onRetry }) => {
  // Iter 141: Systemhinweis (KI kurz nicht erreichbar) — klar als Hinweis
  // erkennbar, nicht als Wlad-Antwort.
  if (msg.isNotice) {
    return (
      <div className="flex mb-4 animate-fade-in" data-testid="chat-notice">
        <div className="max-w-[80%] rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
          <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-200 select-text">{unescapeText(msg.content)}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-testid="chat-retry-btn"
              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11.5px] font-bold transition-all hover:scale-[1.02] active:scale-[0.97]"
            >
              <RefreshCw size={12} strokeWidth={3} />
              {de ? 'Erneut senden' : 'Resend'}
            </button>
          )}
        </div>
      </div>
    );
  }
  if (msg.role === 'user') {
    const legacy = msg.display_text ? null : legacyClean(msg.content);
    return (
      <UserMessage
        content={unescapeText(msg.display_text || legacy?.text || msg.content)}
        modality={msg.modality}
        pdf={msg.pdf || msg.attachment || legacy?.pdf}
      />
    );
  }

  let parsed = msg.parsed;
  if (!parsed && typeof msg.content === 'string') {
    try {
      let raw = JSON.parse(msg.content);
      // Iter 184: doppelt verpackte Antwort (JSON-String im JSON-String).
      if (typeof raw === 'string') raw = JSON.parse(raw);
      parsed = raw && typeof raw === 'object' ? raw : null;
    } catch { parsed = null; }
  }
  parsed = parsed ? deepUnescape(parsed) : null;
  if (!parsed) return <PlainAssistantMessage content={unescapeText(msg.content)} de={de} />;

  // Iter 96: normal conversational reply (ChatGPT/Grok style) — plain flowing text
  // + clickable follow-up chips that deepen the conversation step by step.
  if (parsed.text) {
    return (
      <div className="flex mb-4 animate-fade-in items-start gap-2.5" data-testid={msg.streaming ? 'chat-ai-message-streaming' : 'chat-ai-message'}>
        <WladBotAvatar size={28} className="mt-1" />
        <div className="max-w-[80%] space-y-2 min-w-0">
          <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm select-text">
            <SmartText text={parsed.text} variant="inline" accent="#BFFF00" />
            {msg.streaming && (
              <span className="inline-block w-[7px] h-[15px] ml-0.5 align-text-bottom bg-[#BFFF00] rounded-[2px] animate-pulse" data-testid="chat-stream-caret" />
            )}
          </div>
          {!msg.streaming && <CopyMessageButton text={parsed.text} de={de} />}
          {parsed.follow_up_questions?.length > 0 && onSuggest && (
            <FollowUpChips questions={parsed.follow_up_questions} onSuggest={onSuggest} de={de} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-6 animate-fade-in items-start gap-2.5" data-testid="chat-ai-message">
      <WladBotAvatar size={28} className="mt-1" />
      <div className="max-w-[85%] space-y-2.5 flex-1 min-w-0">
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
            <SmartText text={parsed.insight} variant="inline" accent="#F59E0B" />
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
          <TasksSuggestion tasks={parsed.tasks} sessionId={sessionId} de={de} />
        )}
        {parsed.follow_up_questions?.length > 0 && onSuggest && (
          <FollowUpChips questions={parsed.follow_up_questions} onSuggest={onSuggest} de={de} />
        )}
        <CopyMessageButton
          text={[parsed.insight, parsed.strategy, ...(parsed.action_steps || []).map((s, i) => `${i + 1}. ${s}`), parsed.reflection]
            .filter(Boolean).join('\n\n')}
          de={de}
        />
      </div>
    </div>
  );
};

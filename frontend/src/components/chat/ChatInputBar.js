import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { VoiceRecorder } from '../shared/VoiceRecorder';
import { Send, Loader2, Paperclip, FileText, X, Zap, Headphones, Target, HelpCircle } from 'lucide-react';
import { FeatureBriefing } from './FeatureBriefing';

const AttachedPreview = ({ attachedPdf, onRemove, de }) => (
  <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#BFFF00]/8 border border-[#BFFF00]/20" data-testid="pdf-attached">
    <FileText size={14} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold truncate">{attachedPdf.filename}</p>
      <p className="text-[9px] text-muted-foreground">
        {attachedPdf.type === 'pdf' && `${attachedPdf.pages_read}/${attachedPdf.pages} Seiten · ${(attachedPdf.chars / 1000).toFixed(1)}k Zeichen`}
        {attachedPdf.type === 'docx' && `Word · ${(attachedPdf.chars / 1000).toFixed(1)}k Zeichen`}
        {['txt','md','csv'].includes(attachedPdf.type) && `${attachedPdf.type.toUpperCase()} · ${(attachedPdf.chars / 1000).toFixed(1)}k Zeichen`}
        {attachedPdf.type === 'image' && `Bild · ${(attachedPdf.bytes / 1024).toFixed(0)} KB`}
        {' · '}{de ? 'wird mitgesendet' : 'will be sent'}
      </p>
    </div>
    <button onClick={onRemove} className="p-1 text-muted-foreground hover:text-rose-500 transition-colors shrink-0" data-testid="pdf-remove">
      <X size={12} />
    </button>
  </div>
);

export const ChatInputBar = ({
  input, setInput, loading, onSend, onVoice,
  attachedPdf, setAttachedPdf, uploadingPdf, onPdfUpload,
  isPremium, onOpenUpsell, onOpenAudioMode, de,
  coachMode, setCoachMode,
}) => (
  <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-3 sm:p-4 bg-white/80 dark:bg-card/80 backdrop-blur-xl">
    {/* Iter 121.2: Coach-Modus Briefing — nur beim ersten Aktivieren, dann per
        localStorage gemerkt. „Fokus-Modus" damit die Cohort sofort versteht,
        was hinter dem Target-Icon steckt. */}
    {coachMode && (
      <div className="max-w-4xl mx-auto mb-3">
        <FeatureBriefing
          storageKey="coach-mode-intro"
          testId="coach-mode-briefing"
          icon={Target}
          eyebrow={de ? 'COACH-MODUS · FOKUS-MODUS' : 'COACH MODE · FOCUS MODE'}
          title={de
            ? 'Wlad wechselt in den Coach-Modus — Strategie statt Small-Talk.'
            : 'Wlad switches to coach mode — strategy over small talk.'}
          bullets={de ? [
            'Strukturierte Antworten: Kontext → Strategie → 3 konkrete Schritte → nächster Move.',
            'Perfekt für: Vorstands-Pitch, schwieriges Gespräch, Verhandlung, Karriere-Move.',
            'Am Ende bekommst du direkt umsetzbare Tasks (nutze „Aufgaben aus dem Gespräch erstellen").',
          ] : [
            'Structured replies: context → strategy → 3 concrete steps → next move.',
            'Perfect for: board pitch, tough conversation, negotiation, career move.',
            'End of chat you can turn suggestions into actionable tasks.',
          ]}
        />
      </div>
    )}

    {attachedPdf && <AttachedPreview attachedPdf={attachedPdf} onRemove={() => setAttachedPdf(null)} de={de} />}
    <div className="flex items-end gap-1.5 sm:gap-3 max-w-4xl mx-auto">
      <VoiceRecorder onTranscription={onVoice} disabled={loading} />
      <button
        type="button"
        onClick={onOpenAudioMode}
        disabled={loading}
        data-testid="audio-mode-btn"
        title={de ? 'Audio-Modus (Hands-free Voice Chat)' : 'Audio Mode (Hands-free Voice Chat)'}
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#9FE000] text-[#0A0A0A] hover:shadow-lg hover:shadow-[#BFFF00]/30 transition-all shrink-0 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Headphones size={15} strokeWidth={2.5} />
      </button>
      <label
        className={`cursor-pointer flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#BFFF00]/10 hover:bg-[#BFFF00]/20 border border-[#BFFF00]/20 transition-colors shrink-0 ${(loading || uploadingPdf) ? 'opacity-50 pointer-events-none' : ''}`}
        data-testid="pdf-upload-btn"
        title={de ? 'Dokument anhängen (PDF, Word, TXT, Bild)' : 'Attach document (PDF, Word, TXT, image)'}
      >
        {uploadingPdf
          ? <Loader2 size={15} className="animate-spin text-[#6B8A00] dark:text-[#BFFF00]" />
          : <Paperclip size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />}
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/*"
          className="hidden"
          onChange={onPdfUpload}
        />
      </label>
      {setCoachMode && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCoachMode(!coachMode)}
            disabled={loading}
            data-testid="coach-mode-toggle"
            title={de
              ? (coachMode ? 'Coach-Modus aktiv: strukturierte Antworten mit Strategie & Schritten' : 'Coach-Modus (Fokus): strukturierte Antworten mit Strategie & Schritten')
              : (coachMode ? 'Coach mode on: structured replies with strategy & steps' : 'Coach mode (focus): structured replies with strategy & steps')}
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all ${coachMode
              ? 'bg-[#BFFF00] border-[#BFFF00] text-[#0A0A0A] shadow-lg shadow-[#BFFF00]/30'
              : 'bg-[#BFFF00]/10 hover:bg-[#BFFF00]/20 border-[#BFFF00]/20 text-[#6B8A00] dark:text-[#BFFF00]'} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Target size={15} strokeWidth={2.5} />
          </button>
          {/* Iter 121.2: „?"-Info-Dot — schmales Trigger für Briefing-Reset */}
          <button
            type="button"
            onClick={() => {
              try { localStorage.removeItem('leaderos:briefing-dismissed:coach-mode-intro'); } catch { /* private mode */ }
              // Trigger a page-level flash: toggling coachMode off→on is the
              // cleanest way to re-display the FeatureBriefing above the bar.
              if (!coachMode) setCoachMode(true);
              else { setCoachMode(false); setTimeout(() => setCoachMode(true), 60); }
            }}
            aria-label={de ? 'Was ist der Coach-Modus?' : 'What is coach mode?'}
            data-testid="coach-mode-help-btn"
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-card border border-black/10 dark:border-white/15 text-muted-foreground/70 hover:text-[#6B8A00] dark:hover:text-[#BFFF00] flex items-center justify-center transition-colors shadow-sm"
          >
            <HelpCircle size={9} strokeWidth={2.4} />
          </button>
        </div>
      )}
      <Textarea data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder={attachedPdf
          ? (de ? 'Was möchtest du zu dem PDF wissen?' : 'What do you want to know about the PDF?')
          : coachMode
            ? (de ? 'Coach-Modus: Wlad antwortet mit Strategie & Schritten…' : 'Coach mode: Wlad replies with strategy & steps…')
            : (de ? 'Frag WladBot alles über Leadership…' : 'Ask WladBot anything about leadership…')}
        className="flex-1 min-w-0 resize-none min-h-[46px] max-h-32 py-[13px] leading-5 bg-gray-50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.1] rounded-2xl px-4 focus-visible:ring-2 focus-visible:ring-[#BFFF00]/40 focus-visible:border-[#BFFF00]/50 transition-shadow" rows={1} />
      <Button data-testid="chat-send-btn" onClick={onSend} disabled={!input.trim() || loading}
        className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] px-4 shrink-0 rounded-2xl shadow-lg shadow-[#BFFF00]/25 transition-all hover:scale-[1.03] active:scale-[0.96]">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </Button>
    </div>

    {!isPremium && (
      <div className="flex items-center justify-center mt-2">
        <button onClick={onOpenUpsell} className="text-[10px] text-muted-foreground hover:text-[#BFFF00] transition-colors font-medium" data-testid="upsell-mini-btn">
          <Zap size={9} className="inline mr-0.5 text-[#BFFF00]" /> Premium ab €997
        </button>
      </div>
    )}
  </div>
);

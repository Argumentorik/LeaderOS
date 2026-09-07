import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { VoiceRecorder } from '../shared/VoiceRecorder';
import { Send, Loader2, ArrowLeft, Zap, Volume2, VolumeX } from 'lucide-react';
import { initials } from '../../lib/challengerSpeech';

const PersonaAvatar = ({ p, className }) => (
  <Avatar className={className} style={{ borderColor: p.color + '40' }}>
    <AvatarImage src={p.avatar} />
    <AvatarFallback style={{ backgroundColor: p.color, color: 'white' }} className="text-[10px] font-bold">{initials(p.name)}</AvatarFallback>
  </Avatar>
);

const ChatHeader = ({ p, de, ttsEnabled, onToggleTts, canEnd, loading, onEnd, onBack }) => (
  <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-white/80 dark:bg-card/80 backdrop-blur-xl sticky top-0 z-10">
    <Button size="icon" variant="ghost" onClick={onBack} className="shrink-0 w-8 h-8" data-testid="back-challengers-btn"><ArrowLeft size={18} /></Button>
    {p && (
      <>
        <div className="relative">
          <Avatar className="w-10 h-10 border-2 shadow-sm" style={{ borderColor: p.color }}>
            <AvatarImage src={p.avatar} />
            <AvatarFallback style={{ backgroundColor: p.color, color: 'white' }} className="font-bold text-xs">{initials(p.name)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{p.name}</p>
          <p className="text-[10px] font-medium truncate" style={{ color: p.color }}>{p.company} — {p.title}</p>
        </div>
        <button onClick={onToggleTts} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="tts-toggle">
          {ttsEnabled ? <Volume2 size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" /> : <VolumeX size={16} className="text-muted-foreground" />}
        </button>
        {canEnd && (
          <Button size="sm" onClick={onEnd} disabled={loading} className="h-8 px-3 bg-[#BFFF00] hover:bg-[#d4ff4d] text-[#0A0A0A] text-[11px] font-black shrink-0" data-testid="end-challenge-btn">
            {loading ? <><Loader2 size={12} className="animate-spin mr-1" />{de ? 'Wird ausgewertet…' : 'Scoring…'}</> : (de ? 'Beenden & Feedback' : 'End & Feedback')}
          </Button>
        )}
        <Badge variant="outline" className="text-[9px] font-bold border-amber-300 text-amber-600 shrink-0"><Zap size={8} className="mr-0.5" /> LIVE</Badge>
      </>
    )}
  </div>
);

/* Iter 92.54 · 11x.ai-style "camera on" meeting stage */
const MeetingStage = ({ p, de, loading, userName }) => (
  <div className="px-4 pt-3" data-testid="challenger-meeting-stage">
    <div className="relative max-w-2xl mx-auto h-44 sm:h-56 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
      style={{ background: `linear-gradient(135deg, #0A0A0A 30%, ${p.color}33 130%)` }}>
      <div aria-hidden className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <span aria-hidden className="absolute -inset-2 rounded-full"
            style={{ border: `2px solid ${p.color}`, opacity: loading ? 0.9 : 0.45, animation: loading ? 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' : 'none' }} />
          <img src={p.avatar} alt={p.name} className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl"
            style={{ border: `3px solid ${p.color}`, animation: 'wladBreath 4.5s ease-in-out infinite' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[9px] font-black tracking-[0.14em] text-white/80">LIVE MEETING</span>
      </div>
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/10">
        <p className="text-[12px] font-bold text-white leading-tight flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{p.name}</p>
        <p className="text-[9.5px] text-white/50">{p.company} · {loading ? (de ? 'denkt nach…' : 'thinking…') : (de ? 'im Gespräch' : 'in conversation')}</p>
      </div>
      <div className="absolute bottom-3 right-3 w-16 h-11 sm:w-20 sm:h-14 rounded-lg bg-[#141414] border border-white/15 shadow-lg flex items-center justify-center overflow-hidden" data-testid="meeting-self-tile">
        <span className="text-[13px] font-black text-[#BFFF00]">{(userName || 'Du').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
        <span className="absolute bottom-1 left-1.5 text-[7px] font-bold text-white/40 uppercase tracking-wider">{de ? 'Du' : 'You'}</span>
      </div>
    </div>
  </div>
);

const MessageList = ({ messages, p, loading, scrollRef }) => (
  <ScrollArea className="flex-1 px-4 py-4">
    <div className="max-w-2xl mx-auto space-y-4">
      {messages.map((msg, i) => (
        <div key={`ch-msg-${msg.role}-${i}`} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
          {msg.role === 'assistant' && p && <PersonaAvatar p={p} className="w-8 h-8 shrink-0 shadow-sm border" />}
          <div className={`max-w-[78%] ${msg.role === 'user'
            ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] rounded-2xl rounded-br-md shadow-md shadow-[#BFFF00]/15'
            : 'bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl rounded-bl-md shadow-sm'} px-4 py-3`}>
            {msg.role === 'assistant' && p && <p className="text-[10px] font-bold mb-1 opacity-60">{p.name}</p>}
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      ))}
      {loading && p && (
        <div className="flex items-end gap-2.5 animate-fade-in">
          <PersonaAvatar p={p} className="w-8 h-8 shrink-0 shadow-sm border" />
          <div className="bg-white dark:bg-card border border-black/[0.06] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  </ScrollArea>
);

export const ChallengerChat = ({ p, de, userName, messages, input, setInput, loading, ttsEnabled, onToggleTts, onSend, onVoice, onEnd, onBack, scrollRef }) => (
  <div className="flex flex-col h-[calc(100vh-2rem)]" data-testid="challenger-chat">
    <ChatHeader p={p} de={de} ttsEnabled={ttsEnabled} onToggleTts={onToggleTts} canEnd={messages.some((m) => m.role === 'user')} loading={loading} onEnd={onEnd} onBack={onBack} />
    {p && <MeetingStage p={p} de={de} loading={loading} userName={userName} />}
    <MessageList messages={messages} p={p} loading={loading} scrollRef={scrollRef} />
    <div className="border-t border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-xl">
      <div className="flex gap-2 p-3 max-w-2xl mx-auto items-end">
        <VoiceRecorder onTranscription={onVoice} disabled={loading} />
        <Textarea data-testid="challenger-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={de ? 'Deine Antwort — frei formulieren oder einsprechen...' : 'Your answer — type freely or speak...'}
          className="resize-none min-h-[44px] max-h-32 rounded-xl border-black/[0.08] bg-gray-50 dark:bg-muted/30 focus:bg-white dark:focus:bg-card transition-colors" rows={1} />
        <Button onClick={() => onSend()} disabled={!input.trim() || loading} size="icon"
          className="bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] shadow-md shadow-[#BFFF00]/15 shrink-0 w-10 h-10 rounded-xl" data-testid="challenger-send-btn">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  </div>
);

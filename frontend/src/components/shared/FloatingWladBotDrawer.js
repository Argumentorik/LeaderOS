/**
 * FloatingWladBotDrawer — always-on agent drawer (Iter 92.23.8).
 *
 * Mert's vision (Iter 92.23.7):
 *   "the agent who is then always next to you" — like Wingman / OpenClaw but
 *   for leaders.
 *
 * Behavior:
 *   - Floating Action Button (bottom-right) on every authenticated page.
 *   - Click opens a right-side drawer with a streamlined chat UI talking to
 *     the same /api/chat backend.
 *   - The drawer auto-picks the most-recently-active folder so the agent
 *     starts with the user's current context. Can be changed via dropdown.
 *   - Messages persist server-side as a regular chat session — user can later
 *     "open in full chat" to continue with the deep UI.
 *
 * Why this is global:
 *   - Mounted once in DashboardLayout so it travels with the user across pages.
 *   - Light-weight: no full chat history, no PDF uploads, no role selector —
 *     just quick Q&A with folder context. The deep chat lives at /chat.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Loader2, Folder, ChevronDown, Lightbulb, Target } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';
import api from '../../lib/api';
import logger from '../../lib/logger';
import SmartText from './SmartText';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { subscribeWladBotOpen, subscribeWladBotClose, subscribeWladBotPageContext, getLastPageContext } from '../../lib/wladbotBus';

// Hide the FAB on these routes — onboarding, auth, public, etc.
const HIDDEN_ROUTES = ['/login', '/signup', '/register', '/onboarding', '/m/', '/f/', '/leader-os/welcome', '/leader-os/diagnose', '/auth-callback', '/auth/magic', '/chat'];

const QUICK_PROMPTS_DE = [
  { label: 'Heute fokussieren', q: 'Was sollte ich heute als Priorität angehen, gegeben mein aktueller Kontext?' },
  { label: 'Gespräch vorbereiten', q: 'Hilf mir, ein wichtiges Gespräch vorzubereiten — was sind die 3 Schlüsselsätze?' },
  { label: 'Reflektieren', q: 'Lass uns kurz reflektieren: Was lief diese Woche gut, was kann ich morgen besser machen?' },
];
const QUICK_PROMPTS_EN = [
  { label: 'Focus today', q: 'What should I prioritize today, given my current context?' },
  { label: 'Prep a talk', q: 'Help me prep a critical conversation — what are the 3 key sentences?' },
  { label: 'Reflect', q: "Let's reflect briefly: what went well this week, what can I do better tomorrow?" },
];

export const FloatingWladBotDrawer = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  // Iter 92.23.11: page-context published by the current page. When non-null
  // it overrides the "most-recently-updated" default folder pre-selection.
  const [pageContext, setPageContext] = useState(() => getLastPageContext());
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]); // {role,content,parsed?}
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const folderPickRef = useRef(null);

  // Iter 92.23.9: external open events (e.g. "Briefing"-Button in FolderRail).
  // Subscribers can pass {folderId, briefingMessage} → drawer opens, sets
  // activeFolderId, and seeds the first assistant message with a server-
  // generated briefing so the user immediately sees "where they stand".
  useEffect(() => {
    const offOpen = subscribeWladBotOpen(({ folderId, briefingMessage } = {}) => {
      setOpen(true);
      if (folderId) {
        setActiveFolderId(folderId);
        // Reset transient state so the briefing reads as a clean conversation.
        setSessionId(null);
      }
      if (briefingMessage) {
        // Render as an assistant turn with an insight bubble so the SmartText
        // styling already in the drawer applies. We do NOT round-trip to LLM —
        // the message is the briefing the parent computed.
        setMessages([{ role: 'assistant', parsed: { insight: briefingMessage } }]);
      }
    });
    const offClose = subscribeWladBotClose(() => setOpen(false));
    return () => { offOpen(); offClose(); };
  }, []);

  // Don't render on hidden routes (and never for unauthenticated users).
  const isHidden = !user || HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  // Iter 92.23.11: keep page-context fresh — when the user navigates between
  // /missions, /chat, etc. the page publishes its active folder/entry/label.
  useEffect(() => {
    const off = subscribeWladBotPageContext((ctx) => setPageContext(ctx));
    return off;
  }, []);

  // Load folders the first time the drawer opens.
  useEffect(() => {
    if (!open || folders.length > 0) return undefined;
    let alive = true;
    api.get('/folders').then(res => {
      if (!alive) return;
      const fs = Array.isArray(res.data) ? res.data : [];
      setFolders(fs);
      // Iter 92.23.11: prefer page-context folder over generic "most recent".
      // This is the "FAB knows what you're working on" UX Mert asked for.
      if (!activeFolderId) {
        const ctxFolderId = pageContext?.folderId;
        if (ctxFolderId && fs.some(f => f.folder_id === ctxFolderId)) {
          setActiveFolderId(ctxFolderId);
        } else if (fs.length > 0) {
          setActiveFolderId(fs[0].folder_id);
        }
      }
    }).catch(err => logger.warn('drawer folders load failed:', err?.message));
    return () => { alive = false; };
  }, [open, folders.length, activeFolderId, pageContext]);

  // Close folder picker on outside-click
  useEffect(() => {
    if (!folderPickerOpen) return undefined;
    const onClick = (e) => { if (folderPickRef.current && !folderPickRef.current.contains(e.target)) setFolderPickerOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [folderPickerOpen]);

  useEffect(() => { if (open) scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  // Escape to close
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open]);

  if (isHidden) return null;

  const activeFolder = folders.find(f => f.folder_id === activeFolderId);
  const isContextSuggested = activeFolderId && pageContext?.folderId === activeFolderId;

  const send = async (overrideText, modality = 'text') => {
    const text = (overrideText || input).trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, modality }]);
    setSending(true);
    try {
      const body = { message: text, session_id: sessionId, modality };
      if (activeFolderId) body.folder_id = activeFolderId;
      const res = await api.post('/chat', body);
      if (!sessionId) setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: '', parsed: res.data.response, modality: res.data.modality || modality }]);
    } catch (err) {
      logger.error('drawer chat failed:', err);
      const noCredits = err?.response?.status === 402;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: noCredits
          ? (de ? 'Deine Free-Credits sind aufgebraucht. Hol dir das Leadership OS für unbegrenzte Chats mit Wlad. 🚀' : 'Your free credits are used up. Get the Leadership OS for unlimited chats with Wlad. 🚀')
          : (de ? 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' : 'An error occurred. Please try again.'),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const openInFullChat = () => {
    setOpen(false);
    const params = new URLSearchParams();
    if (activeFolderId) params.set('folder', activeFolderId);
    navigate(`/chat${params.toString() ? `?${params}` : ''}`);
  };

  const QUICK_PROMPTS = de ? QUICK_PROMPTS_DE : QUICK_PROMPTS_EN;

  return createPortal(
    <>
      {/* FAB — positioned ABOVE the WladHelp support button (which lives at bottom-6 right-6 z-[140]) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-[60] w-14 h-14 rounded-2xl bg-[#BFFF00] text-[#0A0A0A] shadow-2xl shadow-[#BFFF00]/30 ring-2 ring-white/10 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center group"
          data-testid="wladbot-fab"
          title={de ? 'WladBot fragen' : 'Ask WladBot'}
        >
          <Sparkles size={22} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-[#0A0A0A] animate-pulse" aria-hidden />
        </button>
      )}

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end" data-testid="wladbot-drawer">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="relative w-full sm:w-[440px] bg-[#0A0A0A] border-l border-white/[0.08] flex flex-col h-screen shadow-2xl animate-slide-right">
            {/* Header */}
            <header className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <WladBotAvatar size={36} live />
                  <div>
                    <p className="text-[13px] font-black text-white leading-tight">WladBot <span className="px-1 py-px rounded bg-[#BFFF00]/15 text-[#BFFF00] text-[8px] font-black tracking-wider align-middle">3.0</span></p>
                    <p className="text-[9px] text-white/40 uppercase tracking-[0.18em] font-bold">{de ? 'IMMER NEBEN DIR' : 'ALWAYS WITH YOU'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white p-1.5 rounded hover:bg-white/[0.06]"
                  data-testid="wladbot-drawer-close"
                  aria-label={de ? 'Schließen' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Folder picker — current context */}
              <div ref={folderPickRef} className="relative mt-3">
                <button
                  onClick={() => setFolderPickerOpen(o => !o)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors ${activeFolder ? '' : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white'}`}
                  style={activeFolder ? { background: `${activeFolder.color || '#BFFF00'}14`, borderColor: `${activeFolder.color || '#BFFF00'}40`, color: activeFolder.color || '#BFFF00' } : {}}
                  data-testid="wladbot-folder-picker-btn"
                >
                  <Folder size={11} />
                  <span className="flex-1 text-left truncate">
                    {activeFolder ? `${de ? 'Kontext' : 'Context'}: ${activeFolder.name}` : (de ? 'Kein Ordner-Kontext' : 'No folder context')}
                  </span>
                  {isContextSuggested && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#BFFF00] font-black tracking-wider" data-testid="wladbot-context-auto-pill">AUTO</span>
                  )}
                  <ChevronDown size={11} className="opacity-60" />
                </button>
                {isContextSuggested && pageContext?.entryTitle && (
                  <p className="text-[9px] text-white/30 px-1 pt-1.5 leading-tight" data-testid="wladbot-context-hint">
                    {de ? 'Automatisch gewaehlt fuer:' : 'Auto-picked for:'} <span className="text-white/50 italic">{pageContext.entryTitle}</span>
                  </p>
                )}
                {folderPickerOpen && (
                  <div className="absolute left-0 right-0 top-11 z-10 max-h-64 overflow-y-auto rounded-xl bg-[#0F0F1A] border border-white/[0.08] shadow-2xl py-1.5" data-testid="wladbot-folder-picker-pop">
                    <button
                      onClick={() => { setActiveFolderId(null); setFolderPickerOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-white/60 hover:bg-white/[0.04]"
                    >
                      {de ? 'Kein Kontext' : 'No context'}
                    </button>
                    {folders.length === 0 ? (
                      <p className="px-3 py-2 text-[10px] text-white/30">{de ? 'Noch keine Ordner. Erstelle einen im Studio.' : 'No folders yet. Create one in Studio.'}</p>
                    ) : folders.map(f => (
                      <button
                        key={f.folder_id}
                        onClick={() => { setActiveFolderId(f.folder_id); setFolderPickerOpen(false); setMessages([]); setSessionId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[11px] hover:bg-white/[0.04]"
                      >
                        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `${f.color || '#BFFF00'}26`, color: f.color || '#BFFF00' }}>
                          <Folder size={9} />
                        </div>
                        <span className="font-bold text-white truncate flex-1">{f.name}</span>
                        <span className="text-[9px] text-white/30 tabular-nums">{f.item_count || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 thin-scrollbar">
              {messages.length === 0 ? (
                <div className="space-y-4 py-6" data-testid="wladbot-drawer-empty">
                  <div className="text-center space-y-2">
                    <div className="inline-flex mb-1">
                      <WladBotAvatar size={60} live />
                    </div>
                    <p className="text-[13px] font-black text-white">{de ? `Was beschäftigt dich gerade${user?.name ? `, ${user.name.split(' ')[0]}` : ''}?` : "What's on your mind?"}</p>
                    <p className="text-[11px] text-white/40 leading-relaxed max-w-[280px] mx-auto">
                      {activeFolder
                        ? (de ? `Ich kenne deinen Kontext "${activeFolder.name}". Frag mich alles dazu.` : `I know your "${activeFolder.name}" context. Ask anything about it.`)
                        : (de ? 'Stell mir eine Leadership-Frage. Wähle oben einen Ordner für tieferen Kontext.' : 'Ask a leadership question. Pick a folder above for deeper context.')}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {QUICK_PROMPTS.map((p, idx) => (
                      <button
                        key={`qp-${idx}`}
                        onClick={() => send(p.q)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-[#BFFF00]/30 transition-colors group"
                        data-testid={`wladbot-quick-prompt-${idx}`}
                      >
                        <p className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
                          <Lightbulb size={10} className="text-[#BFFF00] group-hover:rotate-12 transition-transform" /> {p.label}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{p.q}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={`dm-${i}`} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
                    {m.role === 'user' ? (
                      <div className="max-w-[80%] bg-[#BFFF00] text-[#0A0A0A] rounded-2xl rounded-tr-sm px-3 py-2">
                        <p className="text-[12px] font-bold leading-snug whitespace-pre-wrap">{m.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[88%] space-y-2">
                        {m.parsed?.text && (
                          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <div className="[&_*]:!text-white/90"><SmartText text={m.parsed.text} variant="inline" accent="#BFFF00" /></div>
                          </div>
                        )}
                        {m.parsed?.insight && (
                          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Lightbulb size={10} className="text-amber-400" />
                              <span className="text-[8.5px] font-black text-white/40 uppercase tracking-wider">{de ? 'Insight' : 'Insight'}</span>
                            </div>
                            <div className="[&_*]:!text-white/90"><SmartText text={m.parsed.insight} variant="inline" accent="#F59E0B" /></div>
                          </div>
                        )}
                        {m.parsed?.strategy && (
                          <div className="bg-sky-500/[0.05] border border-sky-500/15 rounded-2xl px-3 py-2.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Target size={10} className="text-sky-400" />
                              <span className="text-[8.5px] font-black text-sky-400/70 uppercase tracking-wider">{de ? 'Strategie' : 'Strategy'}</span>
                            </div>
                            <div className="[&_*]:!text-white/90"><SmartText text={m.parsed.strategy} variant="inline" accent="#0EA5E9" /></div>
                          </div>
                        )}
                        {!m.parsed && m.content && (
                          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <p className="text-[12px] text-white/85 leading-snug">{m.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              {sending && (
                <div className="flex">
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3 py-2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] typing-dot" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={de ? 'Frag mich…' : 'Ask me…'}
                  rows={1}
                  className="flex-1 resize-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#BFFF00]/40 focus:bg-white/[0.06] transition-colors max-h-32"
                  data-testid="wladbot-drawer-input"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-[#BFFF00] text-[#0A0A0A] flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#A8E600] transition-colors"
                  data-testid="wladbot-drawer-send"
                  aria-label={de ? 'Senden' : 'Send'}
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={openInFullChat}
                  className="w-full mt-2 text-[10px] font-bold text-white/40 hover:text-[#BFFF00] py-1.5 rounded transition-colors"
                  data-testid="wladbot-open-full-chat"
                >
                  {de ? 'Im vollen Chat fortsetzen →' : 'Continue in full chat →'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>,
    document.body,
  );
};

export default FloatingWladBotDrawer;

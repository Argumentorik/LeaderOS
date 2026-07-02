import { useState } from 'react';
import { Plus, Trash2, Folder, History, PanelRightClose, PanelRightOpen, MessageSquare } from 'lucide-react';
import logger from '../../lib/logger';
import api from '../../lib/api';

const groupLabel = (iso, de) => {
  if (!iso) return de ? 'Älter' : 'Older';
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return de ? 'Heute' : 'Today';
  if (diffDays === 1) return de ? 'Gestern' : 'Yesterday';
  if (diffDays < 7) return de ? 'Letzte 7 Tage' : 'Last 7 days';
  return de ? 'Älter' : 'Older';
};

const GROUP_ORDER_DE = ['Heute', 'Gestern', 'Letzte 7 Tage', 'Älter'];
const GROUP_ORDER_EN = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

export const ChatHistoryPanel = ({
  sessions = [], folders = [], currentSession, activeFolder,
  onSelectSession, onSelectFolder, onNewChat, onDeleted, de = true,
}) => {
  const [open, setOpen] = useState(() => localStorage.getItem('wlad_chat_panel') !== 'closed');
  const [deleting, setDeleting] = useState(null);

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem('wlad_chat_panel', v ? 'closed' : 'open');
      return !v;
    });
  };

  const handleDelete = async (e, sid) => {
    e.stopPropagation();
    setDeleting(sid);
    try {
      await api.delete(`/chat/sessions/${sid}`);
      onDeleted?.(sid);
    } catch (err) { logger.error('delete session failed:', err); }
    finally { setDeleting(null); }
  };

  const visible = activeFolder
    ? sessions.filter((s) => s.folder_id === activeFolder.folder_id)
    : sessions;

  const groups = {};
  visible.forEach((s) => {
    const g = groupLabel(s.updated_at || s.created_at, de);
    (groups[g] = groups[g] || []).push(s);
  });
  const order = de ? GROUP_ORDER_DE : GROUP_ORDER_EN;

  if (!open) {
    return (
      <div className="hidden md:flex flex-col items-center border-l border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-card/70 backdrop-blur-xl w-12 py-4 shrink-0">
        <button
          onClick={toggle}
          data-testid="chat-history-open-btn"
          title={de ? 'Chat-Verlauf anzeigen' : 'Show chat history'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#BFFF00]/10 transition-colors"
        >
          <PanelRightOpen size={16} />
        </button>
        <History size={14} className="mt-3 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-col w-72 shrink-0 border-l border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-card/70 backdrop-blur-xl" data-testid="chat-history-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <History size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">{de ? 'Deine Chats' : 'Your chats'}</span>
        </div>
        <button
          onClick={toggle}
          data-testid="chat-history-close-btn"
          title={de ? 'Einklappen' : 'Collapse'}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-4 pb-3">
        <button
          onClick={onNewChat}
          data-testid="chat-history-new-btn"
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[12.5px] font-bold shadow-md shadow-[#BFFF00]/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={3} /> {de ? 'Neuer Chat' : 'New chat'}
        </button>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1.5">{de ? 'Ordner' : 'Folders'}</p>
          <div className="flex flex-wrap gap-1.5" data-testid="chat-history-folders">
            <button
              onClick={() => onSelectFolder?.(null)}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors ${!activeFolder
                ? 'bg-[#BFFF00]/15 border-[#BFFF00]/50 text-foreground'
                : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground hover:text-foreground'}`}
            >
              {de ? 'Alle' : 'All'}
            </button>
            {folders.map((f) => (
              <button
                key={f.folder_id}
                onClick={() => onSelectFolder?.(activeFolder?.folder_id === f.folder_id ? null : f)}
                data-testid={`chat-history-folder-${f.folder_id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors ${activeFolder?.folder_id === f.folder_id
                  ? 'text-foreground'
                  : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground hover:text-foreground'}`}
                style={activeFolder?.folder_id === f.folder_id
                  ? { background: `${f.color || '#BFFF00'}1f`, borderColor: `${f.color || '#BFFF00'}66` }
                  : undefined}
              >
                <Folder size={10} style={{ color: f.color || '#BFFF00' }} />
                <span className="max-w-[90px] truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions grouped by date */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4" data-testid="chat-history-list">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-10 text-center px-4">
            <MessageSquare size={20} className="text-muted-foreground/30" />
            <p className="text-[11.5px] text-muted-foreground/60 font-medium">
              {de ? 'Noch keine Chats — starte dein erstes Gespräch mit Wlad.' : 'No chats yet — start your first conversation with Wlad.'}
            </p>
          </div>
        )}
        {order.filter((g) => groups[g]?.length).map((g) => (
          <div key={g} className="mb-2">
            <p className="px-2 pt-2 pb-1 text-[9.5px] font-black uppercase tracking-[0.14em] text-muted-foreground/50">{g}</p>
            {groups[g].map((s) => {
              const active = s.session_id === currentSession;
              const folder = folders.find((f) => f.folder_id === s.folder_id);
              return (
                <button
                  key={s.session_id}
                  onClick={() => onSelectSession?.(s.session_id)}
                  data-testid={`chat-history-item-${s.session_id}`}
                  className={`group w-full text-left px-2.5 py-2 rounded-xl mb-0.5 flex items-center gap-2 transition-colors ${active
                    ? 'bg-[#BFFF00]/[0.12] border border-[#BFFF00]/30'
                    : 'border border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}
                >
                  {folder && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: folder.color || '#BFFF00' }} />}
                  <span className={`flex-1 min-w-0 truncate text-[12px] ${active ? 'font-bold' : 'font-medium text-foreground/75'}`}>
                    {s.title || (de ? 'Neues Gespräch' : 'New conversation')}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleDelete(e, s.session_id)}
                    data-testid={`chat-history-delete-${s.session_id}`}
                    title={de ? 'Chat löschen' : 'Delete chat'}
                    className={`shrink-0 w-6 h-6 rounded-md items-center justify-center text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 transition-colors ${deleting === s.session_id ? 'flex opacity-50' : 'hidden group-hover:flex'}`}
                  >
                    <Trash2 size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistoryPanel;

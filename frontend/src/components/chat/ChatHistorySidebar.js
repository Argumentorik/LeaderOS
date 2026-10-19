import { useEffect, useState } from 'react';
import api from '../../lib/api';
import logger from '../../lib/logger';

/**
 * ChatHistorySidebar · Liste vergangener WladBot-Gespräche.
 *
 * Wird im `rightPanel`-Slot der DashboardLayout angezeigt · sichtbar
 * ab Breakpoint `lg` (Desktop). Auf Mobile/Tablet bleibt die alte
 * Top-Bar-Logik (Neues-Gespräch-Button im ChatRolesHeader).
 *
 * Datenquelle: GET /chat/sessions (siehe backend/routes/chat.py).
 * Endpoint liefert die letzten 50 Sessions sortiert nach `updated_at`
 * desc inkl. `session_id`, `title`, `message_count`, `updated_at`.
 *
 * Die Komponente lädt selbst und ruft `onSelect(session_id)` auf ·
 * sie ist daher in jede Chat-Surface drop-in.
 */

const SHIPOS_LOCAL_TZ_FMT = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = (now - d) / 1000; // sec
  if (diff < 60) return 'jetzt';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}t`;
  // > 7 Tage: tag.monat
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const truncate = (s, n = 38) => {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
};

export const ChatHistorySidebar = ({
  currentSessionId,
  onSelect,
  onNew,
  refreshKey,
  de = true,
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    api
      .get('/chat/sessions')
      .then((res) => {
        if (!alive) return;
        setSessions(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        logger.error('ChatHistorySidebar load failed:', err);
        if (alive) setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // refreshKey wird vom Parent erhöht, wenn neue Session entsteht
    // oder eine Antwort gespeichert wurde · dann neu laden.
  }, [refreshKey]);

  const labelNew = de ? 'Neues Gespräch' : 'New conversation';
  const labelEmpty = de ? 'Noch keine Gespräche.' : 'No conversations yet.';
  const labelError = de ? 'Konnte nicht laden.' : 'Failed to load.';
  const labelTitleFallback = de ? 'Gespräch' : 'Conversation';

  return (
    <div
      className="flex flex-col h-full"
      data-testid="chat-history-sidebar"
      aria-label={de ? 'Chat-Historie' : 'Chat history'}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55 font-mono mb-3">
          ▸ Gespräche · {sessions.length}
        </div>
        <button
          type="button"
          onClick={onNew}
          data-testid="chat-history-new"
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand text-black hover:bg-brand/90 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors"
        >
          <span className="text-lg leading-none font-black">+</span>
          {labelNew}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-3 space-y-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded bg-foreground/[0.04] animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-3 text-[12px] text-foreground/60">
            {labelError}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="px-4 py-6 text-[12px] text-foreground/55 leading-[1.5]">
            {labelEmpty}
            <br />
            <span className="text-foreground/40">
              {de
                ? 'Stell dem WladBot deine erste Frage · sie taucht hier auf.'
                : 'Ask WladBot your first question · it shows up here.'}
            </span>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul className="divide-y divide-border/40">
            {sessions.map((s) => {
              const active = s.session_id === currentSessionId;
              const title = s.title?.trim() || labelTitleFallback;
              const count = s.message_count || 0;
              const when = SHIPOS_LOCAL_TZ_FMT(s.updated_at || s.created_at);
              return (
                <li key={s.session_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.session_id)}
                    data-testid={`chat-history-row-${s.session_id}`}
                    data-active={active ? 'true' : 'false'}
                    className={`w-full text-left px-4 py-3 group transition-colors ${
                      active
                        ? 'bg-brand/[0.10] border-l-2 border-brand'
                        : 'border-l-2 border-transparent hover:bg-foreground/[0.03]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`text-[13px] leading-[1.3] truncate ${
                          active ? 'text-foreground font-bold' : 'text-foreground/85 font-medium'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {truncate(title, 32)}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-foreground/45 shrink-0">
                        {when}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[9.5px] font-mono uppercase tracking-[0.16em] text-foreground/40">
                      <span>{count} {de ? 'Nachrichten' : 'messages'}</span>
                      {active && (
                        <span className="text-brand">▸ AKTIV</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer-Strip */}
      <div className="px-4 py-3 border-t border-border/40 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/45 font-mono">
        ▸ Letzte 50 · älteres im Folder-Archiv
      </div>
    </div>
  );
};

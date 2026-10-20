/**
 * FolderWorkspaceCards — premium folder grid for the Dashboard (Iter 92.23.11).
 *
 * Mert: "Folder-Workspace-Cards auf Dashboard: Mini-Stats +
 *        Quick-Briefing-Button pro Folder"
 *
 * Each card surfaces:
 *   - Folder name + accent color + item count
 *   - Context summary excerpt (first 90 chars) so the user remembers what this
 *     workspace is about at a glance
 *   - 2 actions: "Briefing" (sparkles → opens FAB drawer with 30s briefing)
 *     and "Öffnen" (navigates to Video Studio with folder pre-filtered)
 *
 * Empty state: when the user has zero folders we show a single CTA card that
 * deep-links to /missions where they can create one. Hidden completely if the
 * user is still loading (parent decides).
 */
import { useEffect, useState } from 'react';
import { Folder, Sparkles, ArrowRight, Loader2, Layers, Plus, Video, MessageSquareText } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { takeSlice } from '../../lib/dashboardBootstrap';
import logger from '../../lib/logger';
import { openWladBotDrawer } from '../../lib/wladbotBus';

const WorkspaceCard = ({ folder, onBriefing, onOpen, busyBriefing, de }) => {
  const accent = folder.color || '#BFFF00';
  return (
    <div
      className="group relative rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-card overflow-hidden hover:border-[color:var(--ws-accent)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ '--ws-accent': `${accent}66` }}
      data-testid={`workspace-card-${folder.folder_id}`}
    >
      {/* aurora dot */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" style={{ background: accent }} />

      <div className="relative p-4 space-y-3.5">
        <div className="flex items-start gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}22`, color: accent }}
          >
            <Folder size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black tracking-tight truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{folder.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Layers size={9} />
              <span>{folder.item_count || 0} {folder.item_count === 1 ? (de ? 'Eintrag' : 'item') : (de ? 'Einträge' : 'items')}</span>
            </p>
          </div>
        </div>

        {folder.context_summary && (
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 min-h-[28px]">
            {folder.context_summary}
          </p>
        )}
        {!folder.context_summary && (
          <p className="text-[11px] text-muted-foreground/40 italic min-h-[28px]">
            {de ? 'Keine Zusammenfassung hinterlegt.' : 'No summary set.'}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onBriefing(folder)}
            disabled={busyBriefing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#BFFF00] text-[#0A0A0A] text-[10.5px] font-black tracking-wide hover:bg-[#A8E600] disabled:opacity-40 transition-colors"
            data-testid={`workspace-briefing-${folder.folder_id}`}
          >
            {busyBriefing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {de ? 'Briefing' : 'Briefing'}
          </button>
          <button
            onClick={() => onOpen(folder)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-[10.5px] font-bold hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
            data-testid={`workspace-open-${folder.folder_id}`}
          >
            {de ? 'Öffnen' : 'Open'} <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyCreateCard = ({ navigate, de }) => (
  <div
    onClick={() => navigate('/missions')}
    className="group rounded-2xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-[#BFFF00]/40 hover:bg-[#BFFF00]/[0.04] transition-colors min-h-[160px]"
    data-testid="workspace-empty-cta"
  >
    <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
      <Plus size={18} className="text-[#BFFF00]" />
    </div>
    <p className="text-[12px] font-black">{de ? 'Ersten Workspace erstellen' : 'Create your first workspace'}</p>
    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[220px]">
      {de ? 'Bündele Video-Analysen + Chats nach echten Projekten.' : 'Bundle video analyses + chats by real projects.'}
    </p>
  </div>
);

export const FolderWorkspaceCards = ({ de = true }) => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState(null);
  const [busyBriefingId, setBusyBriefingId] = useState(null);

  useEffect(() => {
    let alive = true;
    const pre = takeSlice('folders');
    if (pre) { setFolders(Array.isArray(pre) ? pre : []); return () => { alive = false; }; }
    api.get('/folders').then((res) => {
      if (alive) setFolders(Array.isArray(res.data) ? res.data : []);
    }).catch((err) => {
      logger.warn('folders load failed:', err?.message);
      if (alive) setFolders([]);
    });
    return () => { alive = false; };
  }, []);

  const onBriefing = async (folder) => {
    if (busyBriefingId) return;
    setBusyBriefingId(folder.folder_id);
    try {
      const res = await api.post(`/folders/${folder.folder_id}/briefing`);
      const briefing = (res.data?.briefing || '').trim()
        || (de ? 'Noch keine Daten für ein Briefing.' : 'Not enough data for a briefing yet.');
      openWladBotDrawer({ folderId: folder.folder_id, briefingMessage: briefing });
    } catch (err) {
      logger.error('briefing failed:', err);
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Briefing konnte nicht erstellt werden' : 'Could not generate briefing');
      } catch (_) { /* safe-noop: sonner unavailable, primary error already logged */ }
    } finally { setBusyBriefingId(null); }
  };

  const onOpen = (folder) => {
    // Deep-link to the Video Studio. The studio will publish a page-context so
    // the FAB drawer remains in sync if the user later opens it.
    navigate(`/missions?folder=${folder.folder_id}`);
  };

  if (folders === null) {
    return (
      <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="workspace-section-loading">
        <CardContent className="p-5 flex items-center justify-center min-h-[140px]">
          <Loader2 size={18} className="animate-spin text-[#BFFF00]/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06] overflow-hidden" data-testid="workspace-section">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder size={13} className="text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {de ? 'Deine Workspaces' : 'Your Workspaces'}
            </h3>
          </div>
          <button
            onClick={() => navigate('/missions')}
            className="text-[10px] font-bold text-muted-foreground hover:text-[#BFFF00] flex items-center gap-1 transition-colors"
            data-testid="workspace-view-all-btn"
          >
            {de ? 'Alle ansehen' : 'View all'} <ArrowRight size={10} />
          </button>
        </div>

        {folders.length === 0 ? (
          <EmptyCreateCard navigate={navigate} de={de} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {folders.slice(0, 4).map((f) => (
              <WorkspaceCard
                key={f.folder_id}
                folder={f}
                onBriefing={onBriefing}
                onOpen={onOpen}
                busyBriefing={busyBriefingId === f.folder_id}
                de={de}
              />
            ))}
            {folders.length < 4 && (
              <div
                onClick={() => navigate('/missions')}
                className="group rounded-2xl border-2 border-dashed border-black/[0.06] dark:border-white/[0.06] p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:border-[#BFFF00]/40 hover:bg-[#BFFF00]/[0.03] transition-colors min-h-[160px]"
                data-testid="workspace-new-card"
              >
                <Plus size={16} className="text-muted-foreground/40 group-hover:text-[#BFFF00] transition-colors" />
                <p className="text-[10px] font-bold text-muted-foreground">{de ? 'Neuer Workspace' : 'New workspace'}</p>
              </div>
            )}
          </div>
        )}

        {/* Legend chips */}
        {folders.length > 0 && (
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-3 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><Video size={9} /> {de ? 'Missionen' : 'Missions'}</span>
            <span className="flex items-center gap-1"><MessageSquareText size={9} /> {de ? 'Chats' : 'Chats'}</span>
            <span className="ml-auto">{de ? '1 Klick — vollkontextiges Briefing.' : '1 click — fully-contextual briefing.'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FolderWorkspaceCards;

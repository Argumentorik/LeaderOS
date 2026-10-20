/**
 * FolderRail — slim collapsible folder strip for the Video Studio (Iter 92.23.7).
 *
 * Wingman / OpenClaw-inspired: a always-visible knowledge container that lets
 * the user group missions, chats, and notes around a real-world context
 * (e.g. "Boardroom Pitches 2026") and inject that context summary into the
 * conversation when the agent is invoked from inside the folder.
 *
 * Mert: "create folders. which also gives context and the knowledge is always
 *        used something like wingman.com but for leaders, like openclaw"
 *
 * Props:
 *   activeFolderId  string | null
 *   onPickFolder    (folder|null) => void   // null = "All"
 *   de              bool
 */
import { useEffect, useState } from 'react';
import { Folder, Plus, Pencil, Trash2, Check, X, Layers, Loader2, Sparkles, Share2, Copy } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { openWladBotDrawer } from '../../lib/wladbotBus';

const COLORS = ['#BFFF00', '#60A5FA', '#A78BFA', '#F472B6', '#FBBF24', '#4ADE80', '#F87171', '#94A3B8'];

const NewFolderInline = ({ onCancel, onCreated, de }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = name.trim();
    if (!n || saving) return;
    setSaving(true);
    try {
      const res = await api.post('/folders', { name: n, color, icon: 'folder' });
      onCreated(res.data);
    } catch (err) {
      logger.error('create folder failed:', err);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-2 rounded-lg bg-white/[0.05] space-y-2" data-testid="folder-new-inline">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        placeholder={de ? 'Ordnername…' : 'Folder name…'}
        maxLength={120}
        className="w-full px-2 py-1 text-[11.5px] bg-transparent text-white outline-none border-b border-[#BFFF00]/40"
        data-testid="folder-new-name-input"
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-4 h-4 rounded-full transition-all ${color === c ? 'ring-2 ring-white/60 scale-110' : ''}`}
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>
      <div className="flex gap-1.5 pt-1">
        <button onClick={save} disabled={saving || !name.trim()} className="flex-1 text-[10px] font-black px-2 py-1 rounded bg-[#BFFF00] text-[#0A0A0A] disabled:opacity-40" data-testid="folder-new-save-btn">
          {saving ? '…' : (de ? 'Erstellen' : 'Create')}
        </button>
        <button onClick={onCancel} className="text-[10px] font-black px-2 py-1 rounded bg-white/[0.06] text-white/60">
          {de ? 'Ab' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};

const FolderRow = ({ folder, isActive, onPick, onRename, onDelete, onBriefing, onShare, de }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.name);
  const [busyBriefing, setBusyBriefing] = useState(false);
  const [busyShare, setBusyShare] = useState(false);
  useEffect(() => { setDraft(folder.name); }, [folder.name]);

  if (editing) {
    return (
      <div className="px-2 py-1.5 rounded-lg bg-white/[0.06] flex items-center gap-1.5" data-testid={`folder-edit-${folder.folder_id}`}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRename(folder.folder_id, draft); setEditing(false); }
            if (e.key === 'Escape') { setDraft(folder.name); setEditing(false); }
          }}
          className="flex-1 min-w-0 bg-transparent text-[11.5px] text-white outline-none"
          maxLength={120}
        />
        <button onClick={() => { onRename(folder.folder_id, draft); setEditing(false); }} className="text-[#BFFF00] p-0.5"><Check size={11} /></button>
        <button onClick={() => { setDraft(folder.name); setEditing(false); }} className="text-white/40 p-0.5"><X size={11} /></button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onPick(folder)}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[#BFFF00]/15 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
      data-testid={`folder-row-${folder.folder_id}`}
    >
      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${folder.color || '#BFFF00'}26`, color: folder.color || '#BFFF00' }}>
        <Folder size={11} />
      </div>
      <span className="text-[11.5px] font-bold flex-1 truncate">{folder.name}</span>
      <span className="text-[9px] text-white/30 tabular-nums group-hover:hidden">{folder.item_count || 0}</span>
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        {/* Briefing CTA — Mert P1 Iter 92.23.9 */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (busyBriefing) return;
            setBusyBriefing(true);
            await onBriefing(folder);
            setBusyBriefing(false);
          }}
          className="text-white/40 hover:text-[#BFFF00] p-0.5 rounded hover:bg-white/10"
          data-testid="folder-briefing-btn"
          title={de ? '30-Sek-Briefing' : '30s Briefing'}
        >
          {busyBriefing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (busyShare) return;
            setBusyShare(true);
            await onShare(folder);
            setBusyShare(false);
          }}
          className="text-white/40 hover:text-sky-400 p-0.5 rounded hover:bg-white/10"
          data-testid="folder-share-btn"
          title={de ? 'Teilen' : 'Share'}
        >
          {busyShare ? <Loader2 size={11} className="animate-spin" /> : <Share2 size={11} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="text-white/40 hover:text-white p-0.5 rounded hover:bg-white/10"
          data-testid="folder-rename-btn"
          title={de ? 'Umbenennen' : 'Rename'}
        >
          <Pencil size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(de ? `Ordner „${folder.name}" löschen? Items bleiben erhalten.` : `Delete folder "${folder.name}"?`)) {
              onDelete(folder.folder_id);
            }
          }}
          className="text-white/40 hover:text-rose-400 p-0.5 rounded hover:bg-white/10"
          data-testid="folder-delete-btn"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
};

export const FolderRail = ({ activeFolderId, onPickFolder, de = true }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/folders');
      setFolders(Array.isArray(res.data) ? res.data : []);
    } catch (err) { logger.error('folders load failed:', err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onCreated = (f) => {
    setCreating(false);
    setFolders(prev => [{ ...f, item_count: 0 }, ...prev]);
  };

  const onRename = async (id, newName) => {
    const name = (newName || '').trim();
    if (!name) return;
    setFolders(prev => prev.map(f => f.folder_id === id ? { ...f, name } : f));
    try { await api.patch(`/folders/${id}`, { name }); }
    catch (err) { logger.error('rename failed:', err); load(); }
  };

  const onDelete = async (id) => {
    setFolders(prev => prev.filter(f => f.folder_id !== id));
    if (activeFolderId === id) onPickFolder(null);
    try { await api.delete(`/folders/${id}`); }
    catch (err) { logger.error('delete failed:', err); load(); }
  };

  const onBriefing = async (folder) => {
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
      } catch (_) { /* noop */ }
    }
  };

  const onShare = async (folder) => {
    try {
      const res = await api.post(`/folders/${folder.folder_id}/share`);
      const url = `${window.location.origin}${res.data.share_url}`;
      try {
        await navigator.clipboard.writeText(url);
        const { toast } = await import('sonner');
        toast.success(de ? `Share-Link in Zwischenablage: ${folder.name}` : `Share link copied: ${folder.name}`);
      } catch (_) {
        window.prompt(de ? 'Share-Link kopieren:' : 'Copy share link:', url);
      }
    } catch (err) {
      logger.error('share failed:', err);
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Share-Link fehlgeschlagen' : 'Share failed');
      } catch (_) { /* noop */ }
    }
  };

  return (
    <div className="px-3 pt-3 pb-2 border-b border-white/[0.04]" data-testid="folder-rail">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 flex items-center gap-1.5">
          <Layers size={9} /> {de ? 'Ordner' : 'Folders'}
        </span>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="text-white/40 hover:text-[#BFFF00] p-0.5 rounded hover:bg-white/10"
            data-testid="folder-create-btn"
            title={de ? 'Neuer Ordner' : 'New folder'}
          >
            <Plus size={11} />
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        <div
          onClick={() => onPickFolder(null)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${activeFolderId == null ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}
          data-testid="folder-row-all"
        >
          <Layers size={11} className="shrink-0" />
          <span className="text-[11.5px] font-bold flex-1">{de ? 'Alle Missionen' : 'All missions'}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={12} className="animate-spin text-white/30" />
          </div>
        ) : (
          folders.map(f => (
            <FolderRow
              key={f.folder_id}
              folder={f}
              isActive={activeFolderId === f.folder_id}
              onPick={onPickFolder}
              onRename={onRename}
              onDelete={onDelete}
              onBriefing={onBriefing}
              onShare={onShare}
              de={de}
            />
          ))
        )}
        {creating && <NewFolderInline onCancel={() => setCreating(false)} onCreated={onCreated} de={de} />}
      </div>
    </div>
  );
};

export default FolderRail;

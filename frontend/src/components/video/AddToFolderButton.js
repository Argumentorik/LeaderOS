/**
 * AddToFolderButton — premium folder-picker popover used on the Analysis page.
 *
 * Lets the user file the just-completed mission into a context folder so the
 * "Wlad-Agent" can reference the folder's summary later.
 *
 * Props:
 *   entryId   string  — video mission entry_id to link
 *   title     string  — display title (falls back to challenge title)
 *   de        bool
 */
import { useEffect, useRef, useState } from 'react';
import { Folder, FolderPlus, Check, Plus, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const COLORS = ['#BFFF00', '#60A5FA', '#A78BFA', '#F472B6', '#FBBF24', '#4ADE80'];

export const AddToFolderButton = ({ entryId, title = '', de = true }) => {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedFolderId, setAddedFolderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const popRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/folders');
      setFolders(Array.isArray(res.data) ? res.data : []);
    } catch (err) { logger.error('folders fetch failed:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (open && folders.length === 0) load();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click-outside dismiss
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const linkTo = async (folderId) => {
    if (!entryId) return;
    try {
      await api.post(`/folders/${folderId}/items`, {
        item_type: 'video_mission',
        source_id: entryId,
        title: (title || '').slice(0, 200),
      });
      setAddedFolderId(folderId);
      try {
        const { toast } = await import('sonner');
        toast.success(de ? 'Zu Ordner hinzugefügt' : 'Added to folder');
      } catch (_) { /* noop */ }
      setTimeout(() => setOpen(false), 600);
    } catch (err) { logger.error('add to folder failed:', err); }
  };

  const createAndLink = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await api.post('/folders', { name, color: newColor, icon: 'folder' });
      const folderId = res.data.folder_id;
      setFolders(prev => [{ ...res.data, item_count: 0 }, ...prev]);
      setCreating(false);
      setNewName('');
      await linkTo(folderId);
    } catch (err) { logger.error('create+link failed:', err); }
  };

  return (
    <div className="relative inline-flex" ref={popRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-card text-[12px] font-bold hover:border-[#BFFF00]/40 transition-colors h-11"
        data-testid="add-to-folder-btn"
      >
        <FolderPlus size={13} /> {de ? 'In Ordner' : 'To folder'}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0F0F1A] shadow-2xl overflow-hidden" data-testid="folder-picker-pop">
          <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
            <p className="text-[12px] font-black">{de ? 'In Ordner ablegen' : 'Save to folder'}</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5"><X size={12} /></button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 size={14} className="animate-spin text-[#BFFF00]" /></div>
            ) : (
              <>
                {folders.map(f => (
                  <button
                    key={f.folder_id}
                    onClick={() => linkTo(f.folder_id)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-left"
                    data-testid={`folder-picker-${f.folder_id}`}
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${f.color || '#BFFF00'}26`, color: f.color || '#BFFF00' }}>
                      <Folder size={12} />
                    </div>
                    <span className="text-[12px] font-bold flex-1 truncate">{f.name}</span>
                    {addedFolderId === f.folder_id ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{f.item_count || 0}</span>
                    )}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-5 px-4">{de ? 'Noch keine Ordner. Erstelle deinen ersten unten.' : 'No folders yet. Create your first below.'}</p>
                )}
              </>
            )}
          </div>
          <div className="border-t border-black/[0.04] dark:border-white/[0.04] px-3 py-3">
            {!creating ? (
              <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#6B8A00] dark:text-[#BFFF00] py-1.5 rounded-lg hover:bg-[#BFFF00]/5" data-testid="folder-picker-new-btn">
                <Plus size={11} /> {de ? 'Neuer Ordner' : 'New folder'}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createAndLink(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder={de ? 'z.B. Boardroom Pitches 2026' : 'e.g. Boardroom Pitches 2026'}
                  maxLength={120}
                  className="w-full px-2 py-1.5 text-[11.5px] rounded border border-black/10 dark:border-white/10 bg-transparent outline-none focus:border-[#BFFF00]/40"
                  data-testid="folder-picker-new-input"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-4 h-4 rounded-full ${newColor === c ? 'ring-2 ring-foreground/40 scale-110' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={createAndLink} disabled={!newName.trim()} className="flex-1 text-[10px] font-black px-2 py-1.5 rounded bg-[#BFFF00] text-[#0A0A0A] disabled:opacity-40" data-testid="folder-picker-create-confirm">
                    {de ? 'Erstellen & ablegen' : 'Create & save'}
                  </button>
                  <button onClick={() => setCreating(false)} className="text-[10px] font-black px-2 py-1.5 rounded bg-black/5 dark:bg-white/[0.06]">
                    {de ? 'Ab' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToFolderButton;

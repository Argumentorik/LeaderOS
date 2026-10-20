/**
 * VideoStudioSidebar — ChatGPT-style history sidebar for the Video Mission Studio.
 *
 * What it does:
 *   - Lists every past video-mission attempt grouped by day (Heute / Gestern / dates)
 *   - Top: search bar that filters by transcript snippet + custom title + challenge
 *   - Each row: score chip + title + timestamp + hover actions (rename, delete)
 *   - "New mission" button at top to start a fresh recording
 *   - Click row → replay that analysis (parent decides whether to load it as
 *     read-only or start a new recording on the same challenge)
 *
 * Props:
 *   entries (array)        Loaded video-archive entries
 *   activeEntryId          Currently-viewed entry (highlight)
 *   onPickEntry(entry)     Click on a history row
 *   onNewMission()         New mission CTA
 *   onRename(entryId, t)   Persist new custom_title (already PATCH'd by parent)
 *   onDelete(entryId)      Confirm + delete (parent calls API)
 *   de                     i18n flag
 *   challenges             list of {challenge_id, title} for label lookup
 */
import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Check, X, MessageSquareText, Loader2 } from 'lucide-react';
import { FolderRail } from './FolderRail';

const scoreColor = (s) => {
  if (s >= 80) return '#BFFF00';
  if (s >= 60) return '#4ADE80';
  if (s >= 40) return '#FBBF24';
  return '#F87171';
};

const labelFor = (entry, challenges, de) => {
  if (entry.custom_title) return entry.custom_title;
  const challenge = challenges.find(c => c.challenge_id === entry.challenge_id);
  if (challenge?.title) return challenge.title;
  const wlad = entry.analysis?.wlad_assessment;
  if (wlad) return wlad.slice(0, 70).trim() + (wlad.length > 70 ? '…' : '');
  return de ? 'Mission ohne Titel' : 'Untitled mission';
};

const groupByDay = (entries, de) => {
  const todayStr = new Date().toDateString();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toDateString();
  const groups = new Map();
  for (const e of entries) {
    const d = new Date(e.created_at);
    let key;
    if (d.toDateString() === todayStr) key = de ? 'Heute' : 'Today';
    else if (d.toDateString() === yestStr) key = de ? 'Gestern' : 'Yesterday';
    else key = d.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()];
};

const formatTime = (iso, de) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(de ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const HistoryRow = ({ entry, label, isActive, onPick, onRenameSubmit, onDelete, de }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const score = entry.analysis?.overall_score || 0;

  useEffect(() => { setDraft(label); }, [label]);

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/[0.06]" data-testid={`studio-row-edit-${entry.entry_id}`}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRenameSubmit(entry.entry_id, draft); setEditing(false); }
            if (e.key === 'Escape') { setDraft(label); setEditing(false); }
          }}
          className="flex-1 min-w-0 bg-transparent text-[12px] text-white outline-none border-b border-[#BFFF00]/40 py-0.5"
          maxLength={160}
        />
        <button onClick={() => { onRenameSubmit(entry.entry_id, draft); setEditing(false); }} className="text-[#BFFF00] hover:bg-white/10 rounded p-1" data-testid="studio-rename-confirm">
          <Check size={12} />
        </button>
        <button onClick={() => { setDraft(label); setEditing(false); }} className="text-white/40 hover:bg-white/10 rounded p-1">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-[#BFFF00]/15 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
      }`}
      onClick={() => onPick(entry)}
      data-testid={`studio-row-${entry.entry_id}`}
    >
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
        style={{ backgroundColor: `${scoreColor(score)}22`, color: scoreColor(score) }}
      >
        {score}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] leading-tight font-semibold truncate">{label}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{formatTime(entry.created_at, de)}</p>
      </div>
      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10"
          data-testid="studio-rename-btn"
          title={de ? 'Umbenennen' : 'Rename'}
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(de ? 'Diese Analyse wirklich löschen?' : 'Delete this analysis?')) {
              onDelete(entry.entry_id);
            }
          }}
          className="text-white/40 hover:text-rose-400 p-1 rounded hover:bg-white/10"
          data-testid="studio-delete-btn"
          title={de ? 'Löschen' : 'Delete'}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

export const VideoStudioSidebar = ({
  entries = [],
  challenges = [],
  activeEntryId,
  onPickEntry,
  onNewMission,
  onRename,
  onDelete,
  loading = false,
  activeFolderId = null,
  onPickFolder = () => {},
  de = true,
}) => {
  const [query, setQuery] = useState('');

  const folderFiltered = useMemo(() => {
    if (!activeFolderId) return entries;
    return entries.filter(e => e.folder_id === activeFolderId);
  }, [entries, activeFolderId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return folderFiltered;
    const q = query.toLowerCase();
    return folderFiltered.filter(e => {
      const label = labelFor(e, challenges, de).toLowerCase();
      const transcript = (e.analysis?.transcript || '').toLowerCase();
      const wlad = (e.analysis?.wlad_assessment || '').toLowerCase();
      return label.includes(q) || transcript.includes(q) || wlad.includes(q);
    });
  }, [folderFiltered, challenges, de, query]);

  const groups = useMemo(() => groupByDay(filtered, de), [filtered, de]);

  return (
    <aside
      className="w-full lg:w-72 lg:shrink-0 bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col h-screen lg:sticky lg:top-0"
      data-testid="video-studio-sidebar"
    >
      {/* Top: brand row + new mission CTA */}
      <div className="px-3 pt-4 pb-3 border-b border-white/[0.04] space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-sm shadow-[#BFFF00]/30">
            <MessageSquareText size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-white leading-tight">Video Studio</p>
            <p className="text-[9px] text-white/40 uppercase tracking-wider">{de ? 'Deine Missionen' : 'Your missions'}</p>
          </div>
        </div>
        <button
          onClick={onNewMission}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#0A0A0A] font-black text-[12px] transition-colors"
          data-testid="studio-new-mission-btn"
        >
          <Plus size={14} />
          <span>{de ? 'Neue Mission' : 'New mission'}</span>
        </button>
      </div>

      {/* Folder Rail — Wingman-style knowledge containers (Iter 92.23.7) */}
      <FolderRail activeFolderId={activeFolderId} onPickFolder={onPickFolder} de={de} />

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={de ? 'Suchen…' : 'Search…'}
            className="w-full pl-7 pr-2 py-1.5 text-[11.5px] bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder:text-white/30 outline-none focus:border-[#BFFF00]/40 focus:bg-white/[0.06] transition-colors"
            data-testid="studio-search-input"
          />
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 thin-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-[#BFFF00]/60" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center px-3 py-10">
            <p className="text-[11px] text-white/30 leading-relaxed">
              {query
                ? (de ? 'Keine Treffer für deine Suche.' : 'No matches.')
                : (de ? 'Noch keine Missionen. Starte oben deine erste!' : 'No missions yet. Start one above!')}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {groups.map(([day, items]) => (
              <div key={day}>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30 px-2 mb-1">{day}</p>
                <div className="space-y-0.5">
                  {items.map(entry => (
                    <HistoryRow
                      key={entry.entry_id}
                      entry={entry}
                      label={labelFor(entry, challenges, de)}
                      isActive={entry.entry_id === activeEntryId}
                      onPick={onPickEntry}
                      onRenameSubmit={onRename}
                      onDelete={onDelete}
                      de={de}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default VideoStudioSidebar;

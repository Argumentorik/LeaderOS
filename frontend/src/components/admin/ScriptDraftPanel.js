import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, Check, X } from 'lucide-react';
import api from '../../lib/api';

/* Iter 166: Skript-Entwurf (GODMODE-Neufassung) — Vorschau, umformulieren, freigeben. Ohne Freigabe kein Render. */
export const ScriptDraftPanel = ({ clip, onChanged }) => {
  const [draft, setDraft] = useState(clip.script_draft || '');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  if (!clip.script_draft) return null;
  const words = draft.trim().split(/\s+/).filter(Boolean).length;
  const run = async (name, fn) => {
    setBusy(name); setErr('');
    try { await fn(); onChanged?.(); } catch (e) { setErr(e?.response?.data?.detail || `${name} fehlgeschlagen`); } finally { setBusy(''); }
  };
  const save = () => run('save', () => api.put(`/guide/admin/clips/${clip.slug}/script-draft`, { script: draft }));
  const approve = () => run('approve', async () => { await api.put(`/guide/admin/clips/${clip.slug}/script-draft`, { script: draft }); await api.post(`/guide/admin/clips/${clip.slug}/script-draft/approve`); });
  const discard = () => run('discard', () => api.delete(`/guide/admin/clips/${clip.slug}/script-draft`));
  return (
    <div className="rounded-xl border border-[#BFFF00]/40 bg-[#BFFF00]/[0.06] p-3 space-y-2" data-testid={`guide-script-draft-${clip.slug}`}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-black uppercase tracking-[0.14em] text-[#4A6200] dark:text-[#BFFF00]">Neues Skript · Freigabe ausstehend</span>
        <span className="text-muted-foreground">{words} Wörter · ruhige Einstellung (Loft, halbnah, ein Take)</span>
      </div>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="text-sm bg-background border-border" data-testid={`guide-script-draft-text-${clip.slug}`} />
      <p className="text-[10.5px] text-muted-foreground">Der alte Clip bleibt online, bis der neue gerendert und freigegeben ist. Rendern ist erst nach Freigabe möglich.</p>
      {err && <p className="text-[11px] text-rose-500" data-testid={`guide-script-draft-error-${clip.slug}`}>{err}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={approve} disabled={!!busy} className="h-8 text-[11px] font-bold bg-[#BFFF00] text-black hover:bg-[#D4FF4D]" data-testid={`guide-script-draft-approve-${clip.slug}`}>
          {busy === 'approve' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Check size={12} className="mr-1" />} Skript freigeben
        </Button>
        <Button size="sm" variant="outline" onClick={save} disabled={!!busy} className="h-8 text-[11px]" data-testid={`guide-script-draft-save-${clip.slug}`}>Entwurf speichern</Button>
        <Button size="sm" variant="ghost" onClick={discard} disabled={!!busy} className="h-8 text-[11px] text-muted-foreground" data-testid={`guide-script-draft-discard-${clip.slug}`}><X size={12} className="mr-1" /> Verwerfen</Button>
      </div>
    </div>
  );
};

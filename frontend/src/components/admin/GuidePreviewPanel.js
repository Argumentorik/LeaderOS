import { Check, Trash2, Loader2, Film } from 'lucide-react';
import { Button } from '../ui/button';

/** Vorschau-Film (Neu-Zusammensetzung/Reparatur): ansehen, übernehmen oder verwerfen — das Live-Video bleibt bis dahin online. */
export const GuidePreviewPanel = ({ clip, base, busy, onStage, onApprove, onDiscard }) => {
  const running = clip.status === 'render_preview_running';
  return (
    <div className="rounded-xl border border-[#BFFF00]/30 bg-[#BFFF00]/[0.05] p-3 space-y-2" data-testid={`guide-preview-${clip.slug}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#4A6200] dark:text-[#BFFF00] flex items-center gap-1"><Film size={11} /> Vorschau-Film</p>
        <span className="text-[10px] text-muted-foreground">Live-Video bleibt online, bis du übernimmst · Neu-Zusammensetzen aus vorhandenen Takes kostet 0 $</span>
        <Button size="sm" variant="outline" disabled={!!busy || running} onClick={() => onStage('render-preview')} className="h-7 text-[11px] ml-auto" data-testid={`guide-preview-render-${clip.slug}`}>
          {running ? <Loader2 size={12} className="animate-spin mr-1" /> : <Film size={12} className="mr-1" />}Als Vorschau rendern
        </Button>
      </div>
      {clip.preview_url && (
        <>
          <video controls preload="metadata" src={`${base}${clip.preview_url}`} className="w-full rounded-lg bg-black max-h-64" data-testid={`guide-preview-video-${clip.slug}`} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              Vorschau {clip.preview_duration_seconds_video ? `${clip.preview_duration_seconds_video} s` : ''}{clip.duration_seconds_video ? ` · Live ${clip.duration_seconds_video} s` : ''}
            </span>
            <Button size="sm" disabled={!!busy} onClick={onApprove} className="h-7 text-[11px] ml-auto bg-[#BFFF00] text-black hover:bg-[#D4FF4D]" data-testid={`guide-preview-approve-${clip.slug}`}>
              <Check size={12} className="mr-1" />Übernehmen (wird Live)
            </Button>
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={onDiscard} className="h-7 text-[11px] text-rose-500" data-testid={`guide-preview-discard-${clip.slug}`}>
              <Trash2 size={12} className="mr-1" />Verwerfen
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

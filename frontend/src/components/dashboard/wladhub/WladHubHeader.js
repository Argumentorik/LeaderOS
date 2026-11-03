import { Badge } from '../../ui/badge';
import { CheckCircle2, Zap, RefreshCw, Loader2, ChevronRight } from 'lucide-react';

export const WladHubHeader = ({ connected, isComputed, syncing, onSync, de }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-md bg-[#BFFF00]/15 flex items-center justify-center">
        {connected
          ? <CheckCircle2 size={10} className="text-[#6B8A00] dark:text-brand" />
          : <Zap size={10} className="text-[#6B8A00] dark:text-brand" />}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {connected ? 'Leader-Diagnose' : (de ? 'Leadership Profil' : 'Leadership Profile')}
      </span>
      {isComputed && (
        <Badge className="text-[7px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 px-1.5 py-0">
          {de ? 'Vorläufig' : 'Estimated'}
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-1.5">
      {connected && (
        <button onClick={onSync} disabled={syncing} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="wladhub-resync-btn">
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        </button>
      )}
      {connected && (
        <a href="/leader-diagnose" className="text-[10px] font-semibold" style={{ color: '#BFFF00' }} data-testid="wladhub-open-detail">
          {de ? 'Öffnen' : 'Open'} <ChevronRight size={10} className="inline" />
        </a>
      )}
    </div>
  </div>
);

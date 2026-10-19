import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Zap, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { LEADERCHECK_URL } from '../../../lib/domains';

export const WladHubEmptyState = ({ de, onSync, syncing }) => (
  <Card className="border-black/[0.04] dark:border-white/[0.06] overflow-hidden animate-fade-in" data-testid="wladhub-card-empty">
    <div className="bg-gradient-to-r from-[#0A0A0A] to-[#111] p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#BFFF00]/15 flex items-center justify-center">
          <Zap size={14} className="text-[#BFFF00]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">Leader-Diagnose</span>
      </div>
      <p className="text-xs font-semibold mb-1">{de ? 'Wo stehst du als Leader?' : 'Where do you stand as a leader?'}</p>
      <p className="text-[10px] text-white/35 mb-3">
        {de ? 'Starte die kostenlose 3-Minuten-Diagnose und erhalte deinen persönlichen Leadership-Score.' : 'Start the free 3-minute diagnosis and get your personal leadership score.'}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => window.open(LEADERCHECK_URL, '_blank', 'noopener,noreferrer')}
          className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold text-[10px] h-7 flex-1" data-testid="wladhub-start-btn">
          {de ? 'Jetzt Diagnose starten' : 'Start Diagnosis Now'} <ExternalLink size={10} className="ml-1" />
        </Button>
        <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}
          className="border-white/15 text-white hover:bg-white/10 text-[10px] h-7" data-testid="wladhub-sync-btn">
          {syncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
        </Button>
      </div>
    </div>
  </Card>
);

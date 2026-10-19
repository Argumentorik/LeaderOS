import { Button } from '../../ui/button';
import { ExternalLink, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { LEADERCHECK_URL } from '../../../lib/domains';

export const WladHubUpgradeCta = ({ de, onSync, syncing }) => (
  <div className="p-3 rounded-xl bg-gradient-to-r from-[#0A0A0A] to-[#111] text-foreground">
    <p className="text-[10px] font-semibold mb-1">{de ? 'Genauere Ergebnisse erhalten' : 'Get more accurate results'}</p>
    <p className="text-[9px] text-muted-foreground/80 mb-2">
      {de ? 'Die WladHub-Diagnose gibt dir ein professionelles 3-Layer Leadership-Profil in 3 Minuten.' : 'The WladHub diagnosis gives you a professional 3-layer leadership profile in 3 minutes.'}
    </p>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => window.open(LEADERCHECK_URL, '_blank', 'noopener,noreferrer')}
        className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold text-[9px] h-6 flex-1" data-testid="wladhub-upgrade-btn">
        {de ? 'Kostenlose Diagnose' : 'Free Diagnosis'} <ExternalLink size={9} className="ml-1" />
      </Button>
      <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}
        className="border-border text-foreground hover:bg-foreground/10 text-[9px] h-6" data-testid="wladhub-sync-computed-btn">
        {syncing ? <Loader2 size={9} className="animate-spin" /> : <RefreshCw size={9} />}
      </Button>
    </div>
  </div>
);

export const WladHubDeepDiveBtn = ({ de, onNavigate }) => (
  <Button size="sm" variant="outline" onClick={() => onNavigate('/leader-diagnose')}
    className="w-full text-[10px] font-semibold h-7 border-dashed" data-testid="wladhub-deep-dive">
    {de ? 'Detailanalyse ansehen' : 'View detailed analysis'} <ArrowRight size={10} className="ml-1" />
  </Button>
);

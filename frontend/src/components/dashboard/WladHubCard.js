import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';
import { WladHubEmptyState } from './wladhub/WladHubEmptyState';
import { WladHubHeader } from './wladhub/WladHubHeader';
import { WladHubOverallScore, WladHubScoreBars, WladHubInsights } from './wladhub/WladHubScores';
import { WladHubUpgradeCta, WladHubDeepDiveBtn } from './wladhub/WladHubUpgradeCta';

export const WladHubDiagnosisCard = ({ wladhubScores, de, onNavigate }) => {
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDiagnosis = useCallback(async () => {
    try {
      const res = await api.get('/wladhub/3layer');
      setData(res.data);
    } catch (err) { logger.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDiagnosis(); }, [loadDiagnosis]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/wladhub/sync', { sync_scores: true, sync_action_plan: true });
      const status = res.data.status;
      if (status === 'synced') {
        toast.success(de ? 'WladHub-Daten synchronisiert!' : 'WladHub data synced!');
        loadDiagnosis();
      } else if (status === 'no_data') {
        toast.info(de ? 'Starte zuerst die Diagnose auf leadercheck.de' : 'Start the diagnosis on leadercheck.de first');
      } else {
        toast.success(de ? 'Daten sind aktuell' : 'Data is up to date');
      }
    } catch (err) { toast.error('Sync failed'); }
    finally { setSyncing(false); }
  };

  if (loading) {
    return (
      <Card className="border-black/[0.04] dark:border-white/[0.06] animate-fade-in">
        <CardContent className="p-4"><div className="h-24 skeleton-pulse rounded-xl" /></CardContent>
      </Card>
    );
  }

  const connected = data?.connected;
  const isComputed = data?.source === 'leaderos_computed';
  const overall = data?.overall_score || 0;
  const hasScores = overall > 0;

  if (!hasScores) {
    return <WladHubEmptyState de={de} onSync={handleSync} syncing={syncing} />;
  }

  const scores = [
    { key: 'ki_kompetenz', value: data?.ki_kompetenz || wladhubScores?.ki_kompetenz || 0 },
    { key: 'boardroom_rhetorik', value: data?.boardroom_rhetorik || wladhubScores?.boardroom_rhetorik || 0 },
    { key: 'strategisches_eq', value: data?.strategisches_eq || wladhubScores?.strategisches_eq || 0 },
  ];

  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06] animate-fade-in" data-testid="wladhub-card">
      <CardContent className="p-4 space-y-3">
        <WladHubHeader connected={connected} isComputed={isComputed} syncing={syncing} onSync={handleSync} de={de} />
        <WladHubOverallScore overall={overall} leaderTyp={data?.leader_typ} connected={connected} de={de} />
        <WladHubScoreBars scores={scores} de={de} />
        <WladHubInsights strengths={data?.strengths} improvements={data?.improvements} />
        {isComputed && <WladHubUpgradeCta de={de} onSync={handleSync} syncing={syncing} />}
        {connected && <WladHubDeepDiveBtn de={de} onNavigate={onNavigate} />}
      </CardContent>
    </Card>
  );
};

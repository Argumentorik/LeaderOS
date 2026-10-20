/**
 * FeatureRolloutPanel — Premium-first releases (Iter 135).
 *
 * off → premium → all. Premium users see a new improvement first, promotion to
 * everyone is one click, no deployment.
 */
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Rocket, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

const STAGE_LABELS = {
  de: { off: 'Aus', premium: 'Nur Premium', all: 'Alle' },
  en: { off: 'Off', premium: 'Premium only', all: 'Everyone' },
};

export const FeatureRolloutPanel = ({ de = true }) => {
  const [features, setFeatures] = useState([]);
  const [busy, setBusy] = useState('');
  const labels = de ? STAGE_LABELS.de : STAGE_LABELS.en;

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/features');
      setFeatures(res.data.features || []);
    } catch (err) {
      logger.warn('feature rollout load failed', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStage = async (key, stage) => {
    setBusy(key);
    try {
      await api.put(`/admin/features/${key}`, { stage });
      setFeatures((prev) => prev.map((f) => (f.feature_key === key ? { ...f, stage } : f)));
      toast.success(`${labels[stage]}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Fehler');
    } finally { setBusy(''); }
  };

  return (
    <Card data-testid="feature-rollout-panel">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Rocket size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <h3 className="text-sm font-black">{de ? 'Premium zuerst · Rollout' : 'Premium first · rollout'}</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {de
            ? 'Neue Verbesserungen starten bei „Nur Premium". Wenn sie sich im echten Einsatz bewährt haben, ein Klick auf „Alle". Kein Deployment nötig.'
            : 'New improvements start as "Premium only". Once proven in real use, one click to "Everyone". No deployment needed.'}
        </p>

        <div className="space-y-2">
          {features.map((f) => (
            <div key={f.feature_key} className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3" data-testid={`feature-row-${f.feature_key}`}>
              <p className="text-xs font-bold">{f.label}</p>
              <p className="text-[10.5px] text-muted-foreground mb-2">{f.description}</p>
              <div className="flex gap-1.5">
                {['off', 'premium', 'all'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStage(f.feature_key, s)}
                    disabled={busy === f.feature_key}
                    data-testid={`feature-${f.feature_key}-${s}`}
                    className={`px-3 h-8 rounded-lg text-[11px] font-bold transition-colors ${
                      f.stage === s
                        ? 'bg-[#BFFF00] text-[#0A0A0A]'
                        : 'border border-black/[0.08] dark:border-white/[0.1] text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {busy === f.feature_key && f.stage !== s
                      ? <Loader2 size={11} className="animate-spin" />
                      : labels[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {features.length === 0 && (
            <p className="text-[11px] text-muted-foreground">{de ? 'Keine Features registriert.' : 'No features registered.'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureRolloutPanel;

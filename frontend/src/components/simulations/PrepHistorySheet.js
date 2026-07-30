/**
 * PrepHistorySheet — sliding panel showing the last 5 SEXIER-strategies
 * the user has generated. Clicking a row re-hydrates the strategy into
 * the modal.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

const formatWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'vor wenigen Minuten';
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `vor ${diffD}d`;
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
};

export function PrepHistorySheet({ onClose, onOpen }) {
  const [items, setItems] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/simulations/argumentation-prep/history');
        setItems(res.data || []);
      } catch (err) {
        logger.error('history load', err);
        setItems([]);
      }
    })();
  }, []);

  const open = async (id) => {
    setLoadingId(id);
    try {
      const res = await api.get(`/simulations/argumentation-prep/history/${id}`);
      onOpen(res.data);
    } catch (err) {
      logger.error('history open', err);
      toast.error('Konnte diese Prep nicht laden.');
    } finally {
      setLoadingId(null);
    }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/simulations/argumentation-prep/history/${id}`);
      setItems((cur) => (cur || []).filter((x) => x.strategy_id !== id));
      toast.success('Prep gelöscht');
    } catch (err) {
      logger.error('history delete', err);
      toast.error('Löschen fehlgeschlagen.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-lg flex flex-col"
      data-testid="prep-history-sheet"
    >
      <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 flex items-center justify-center">
            <Clock size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground">Prep-History</p>
            <h3 className="text-[15px] font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Deine letzten Strategien</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          data-testid="prep-history-close"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {items === null ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-[12px]">
            <Loader2 size={14} className="animate-spin mr-2" /> Lade History …
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock size={24} className="mx-auto mb-3 opacity-40" />
            <p className="text-[13px] font-semibold">Noch keine Preps gespeichert</p>
            <p className="text-[11px] mt-1 opacity-70">Sobald du eine SEXIER-Strategie erstellst, findest du sie hier.</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="prep-history-list">
            {items.map((item) => (
              <li key={item.strategy_id}>
                <button
                  type="button"
                  onClick={() => open(item.strategy_id)}
                  disabled={loadingId === item.strategy_id}
                  className="group w-full flex items-center gap-3 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] hover:border-[#BFFF00]/50 hover:bg-[#BFFF00]/[0.04] transition-all text-left"
                  data-testid={`prep-history-item-${item.strategy_id}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#BFFF00]/12 border border-[#BFFF00]/25 flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-black text-[#6B8A00] dark:text-[#BFFF00]" style={{ fontFamily: 'Outfit, sans-serif' }}>Σ</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-black leading-tight truncate">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <p className="text-[10.5px] text-muted-foreground">{formatWhen(item.created_at)}</p>
                      {(item.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center h-4 px-1.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-[#BFFF00]/12 text-[#6B8A00] dark:text-[#BFFF00] border border-[#BFFF00]/25"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {loadingId === item.strategy_id ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground shrink-0" />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => remove(item.strategy_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                        data-testid={`prep-history-delete-${item.strategy_id}`}
                        aria-label="Löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-[#6B8A00] dark:group-hover:text-[#BFFF00] transition-colors shrink-0" />
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export default PrepHistorySheet;

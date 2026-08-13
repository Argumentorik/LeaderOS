/**
 * RagControlCenter — one-stop RAG management for the founder (Iter 113).
 * Status (live chunk count), Re-Ingest with progress polling, Golden-Check.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Database, RefreshCw, ShieldCheck, CheckCircle2, XCircle, Loader2, Zap, Library } from 'lucide-react';
import { KnowledgeSources } from './KnowledgeSources';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

export const RagControlCenter = ({ de = true }) => {
  const [status, setStatus] = useState(null);
  const [zipUrl, setZipUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [golden, setGolden] = useState(null);
  const [goldenRunning, setGoldenRunning] = useState(false);
  const [coverage, setCoverage] = useState(null);
  const [coverageRunning, setCoverageRunning] = useState(false);
  const pollRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/rag/local-status');
      setStatus(res.data);
      const running = res.data?.last_job?.status === 'running';
      setIngesting(running);
      return running;
    } catch (err) {
      logger.warn('RAG status failed', err);
      return false;
    }
  }, []);

  useEffect(() => { loadStatus(); return () => clearInterval(pollRef.current); }, [loadStatus]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (ingesting) pollRef.current = setInterval(loadStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, [ingesting, loadStatus]);

  const startIngest = async () => {
    if (!window.confirm(de ? 'Re-Ingest starten? Bestehende Chunks werden neu aufgebaut (~15-20 Min).' : 'Start re-ingest? Existing chunks will be rebuilt (~15-20 min).')) return;
    try {
      const body = zipUrl.trim() ? { zip_url: zipUrl.trim() } : {};
      await api.post('/admin/rag/reingest', body);
      toast.success(de ? 'Re-Ingest gestartet — läuft im Hintergrund' : 'Re-ingest started — running in background');
      setIngesting(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Re-Ingest fehlgeschlagen');
    }
  };

  const runGolden = async () => {
    setGoldenRunning(true);
    setGolden(null);
    try {
      const res = await api.get('/admin/rag/golden-check');
      setGolden(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Golden-Check fehlgeschlagen');
    } finally {
      setGoldenRunning(false);
    }
  };

  const runCoverage = async () => {
    setCoverageRunning(true);
    setCoverage(null);
    try {
      const body = zipUrl.trim() ? { params: { zip_url: zipUrl.trim() } } : {};
      const res = await api.get('/admin/rag/coverage', body);
      setCoverage(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? 'Vollständigkeits-Check fehlgeschlagen' : 'Coverage check failed'));
    } finally {
      setCoverageRunning(false);
    }
  };

  const job = status?.last_job;

  return (
    <Card className="border-[#BFFF00]/20" data-testid="rag-control-center">
      <CardContent className="p-5 space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/25 flex items-center justify-center">
              <Database size={17} className="text-[#6B8A00] dark:text-[#BFFF00]" />
            </div>
            <div>
              <p className="text-sm font-black" data-testid="rag-chunk-count">
                {status ? `${(status.chunks || 0).toLocaleString('de-DE')} Chunks` : '…'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {job ? `${de ? 'Letzter Ingest' : 'Last ingest'}: ${job.status}${job.started_at ? ` · ${new Date(job.started_at).toLocaleString('de-DE')}` : ''}` : (de ? 'Wlads Wissensbasis (MongoDB Vector Store)' : "Wlad's knowledge base")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadStatus} className="h-9 text-xs gap-1.5" data-testid="rag-refresh-btn">
              <RefreshCw size={13} /> {de ? 'Aktualisieren' : 'Refresh'}
            </Button>
            <Button size="sm" onClick={runCoverage} disabled={coverageRunning} className="h-9 text-xs gap-1.5 bg-[#0A0A0A] text-white hover:bg-[#222]" data-testid="rag-coverage-btn">
              {coverageRunning ? <Loader2 size={13} className="animate-spin" /> : <Library size={13} className="text-[#BFFF00]" />}
              {de ? 'Ist alles drin? (Bücher-Check)' : 'Is everything in? (library check)'}
            </Button>
            <Button size="sm" onClick={runGolden} disabled={goldenRunning} className="h-9 text-xs gap-1.5 bg-[#0A0A0A] text-white hover:bg-[#222]" data-testid="rag-golden-btn">
              {goldenRunning ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} className="text-[#BFFF00]" />}
              {de ? 'Golden-Check (21 Fragen)' : 'Golden check (21 questions)'}
            </Button>
          </div>
        </div>

        {/* Ingest row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={zipUrl}
            onChange={(e) => setZipUrl(e.target.value)}
            placeholder={de ? 'Optional: eigene ZIP-URL (leer = Standard-Wissenspaket)' : 'Optional: custom ZIP URL (empty = default knowledge pack)'}
            className="flex-1 min-w-[220px] h-9 text-xs"
            data-testid="rag-zip-input"
          />
          <Button size="sm" onClick={startIngest} disabled={ingesting} className="h-9 text-xs gap-1.5 bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold" data-testid="rag-reingest-btn">
            {ingesting ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {ingesting ? (de ? 'Ingest läuft…' : 'Ingest running…') : (de ? 'Wissen neu einlesen' : 'Re-ingest knowledge')}
          </Button>
        </div>
        {ingesting && (
          <p className="text-[10px] text-muted-foreground" data-testid="rag-ingest-hint">
            {de ? 'Läuft im Hintergrund (~3–5 Min, lokales Embedding-Modell). Chunk-Zahl aktualisiert sich automatisch alle 5 Sek.' : 'Running in background (~3–5 min, local embedding model). Chunk count auto-refreshes every 5s.'}
          </p>
        )}
        {job?.status === 'failed' && (
          <p className="text-[10px] text-rose-500 font-semibold" data-testid="rag-ingest-error">
            {de ? 'Letzter Ingest fehlgeschlagen' : 'Last ingest failed'}{job.error ? `: ${String(job.error).slice(0, 160)}` : ''}
          </p>
        )}

        {/* Zero-Touch note (Iter 119) */}
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5" data-testid="rag-autoingest-note">
          <ShieldCheck size={11} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />
          {de
            ? 'Godmode aktiv: Nach jedem Deploy prüft das System die Wissensbasis automatisch und liest sie bei Bedarf selbst neu ein — kein manueller Schritt nötig.'
            : 'Godmode active: after every deploy the system verifies the knowledge base and self-heals automatically — no manual steps.'}
        </p>

        {/* Editable knowledge corpus (Iter 119 · Enterprise) */}
        <KnowledgeSources de={de} onChanged={loadStatus} />

        {/* Corpus completeness — "is Wlad's whole library really in there?" */}
        {coverage && (
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3 space-y-2" data-testid="rag-coverage-results">
            <p className={`text-xs font-black ${coverage.complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`} data-testid="rag-coverage-headline">
              {coverage.complete
                ? (de ? 'Vollständig' : 'Complete')
                : (de ? 'Lücken gefunden' : 'Gaps found')} · {coverage.ingested_files}/{coverage.expected_files} {de ? 'Dateien' : 'files'} · {(coverage.total_chunks || 0).toLocaleString('de-DE')} Chunks
            </p>
            {(coverage.missing || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">{de ? 'Fehlt in der Wissensbasis' : 'Missing from knowledge base'}</p>
                {coverage.missing.map((m) => (
                  <div key={m.source_file} className="flex items-start gap-2 text-[11px] text-rose-500">
                    <XCircle size={13} className="shrink-0 mt-0.5" /> <span>{m.display_title || m.source_file}</span>
                  </div>
                ))}
              </div>
            )}
            {(coverage.thin || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{de ? 'Auffällig wenig Inhalt' : 'Suspiciously little content'}</p>
                {coverage.thin.map((t) => (
                  <p key={t.source_file} className="text-[11px] text-amber-600">{t.source_file} <span className="opacity-70">({t.chunks} Chunks)</span></p>
                ))}
              </div>
            )}
            {coverage.complete && (
              <p className="text-[10px] text-muted-foreground">
                {de
                  ? 'Jede Datei aus Wlads Quell-Bibliothek ist eingelesen und mit Chunks im Vector Store vertreten.'
                  : "Every file from Wlad's source library is ingested and represented in the vector store."}
              </p>
            )}
          </div>
        )}

        {/* Golden results */}
        {golden && (
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3 space-y-1.5" data-testid="rag-golden-results">
            <p className={`text-xs font-black ${golden.status === 'PASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {golden.status} · {golden.passed} {de ? 'bestanden' : 'passed'} · {(golden.chunks_in_store || 0).toLocaleString('de-DE')} Chunks
            </p>
            {(golden.results || []).map((r) => (
              <div key={r.question} className="flex items-start gap-2 text-[11px]">
                {r.pass
                  ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />}
                <span className={r.pass ? 'text-muted-foreground' : 'text-rose-500 font-semibold'}>{r.question} <span className="opacity-60">({r.chunks} Chunks)</span></span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

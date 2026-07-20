/**
 * RAG Debug Studio — admin-only diagnostic tool for the WladBot knowledge base.
 *
 * Lets the operator (Mert) feed any user-style query through the same local
 * embedding → Mongo vector pipeline that powers WladBot chat, and see:
 *   - top-N chunks + similarity scores
 *   - which courses / sections / themes / layers are hit
 *   - coverage warnings (zero hits, low relevance)
 *
 * Plus a corpus-overview tab showing the full 609-chunk breakdown by course
 * → identify where source material is thin and where it's strong.
 *
 * Premium presentation:
 *   - similarity bars (lime for ≥0.6, amber for 0.4-0.6, red for <0.4)
 *   - coverage chips, expandable chunk previews
 *   - sample-query "preset" buttons for fast testing
 */
import { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Sparkles, AlertTriangle, Loader2, BarChart3, BookOpen, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const SAMPLE_QUERIES = [
  'Wie gebe ich konstruktives Feedback ohne zu demotivieren?',
  'Was sind die wichtigsten Prinzipien für Boardroom-Rhetorik?',
  'Wie verhandle ich erfolgreich Gehalt mit meinem Vorgesetzten?',
  'Wie führe ich ein schwieriges Konflikt-Gespräch?',
  'Wie überzeuge ich einen skeptischen Investor in 2 Minuten?',
  'Was ist das KAIROS-Prinzip?',
];

const simColor = (s) => {
  if (s >= 0.6) return '#BFFF00';
  if (s >= 0.4) return '#FFB800';
  return '#FF5566';
};

const SimilarityBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-black tabular-nums" style={{ color: simColor(score), fontFamily: 'Outfit, sans-serif' }}>
        {score.toFixed(3)}
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: simColor(score) }}
        />
      </div>
    </div>
  );
};

const ChunkRow = ({ chunk, expanded, onToggle }) => {
  const m = chunk.metadata || {};
  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-black/[0.02] dark:bg-white/[0.02] transition-colors"
        data-testid={`rag-chunk-${chunk.id}`}
      >
        <SimilarityBar score={chunk.similarity} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m.course && m.course !== 'unknown' && (
            <span className="text-[10px] font-semibold text-[#6B8A00] dark:text-[#BFFF00] bg-[#BFFF00]/[0.08] border border-[#BFFF00]/20 px-2 py-0.5 rounded-full">
              {m.course}
            </span>
          )}
          {m.layer && m.layer !== 'unknown' && (
            <span className="text-[10px] text-foreground/50 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-full">L{m.layer}</span>
          )}
          {(m.themes || []).slice(0, 3).map(t => (
            <span key={t} className="text-[10px] text-muted-foreground bg-black/[0.02] dark:bg-white/[0.02] px-2 py-0.5 rounded-full">{t}</span>
          ))}
          <div className="ml-auto">
            {expanded ? <ChevronUp size={14} className="text-foreground/40" /> : <ChevronDown size={14} className="text-foreground/40" />}
          </div>
        </div>
        {m.section && m.section !== 'unknown' && (
          <p className="text-[11px] text-foreground/50 mt-2 truncate">{m.section}</p>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-black/[0.06] dark:border-white/[0.04]">
          <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">{chunk.content}</pre>
        </div>
      )}
    </div>
  );
};

const CoverageChip = ({ label, count, total }) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.04]">
      <span className="text-xs text-foreground/80 truncate flex-1 pr-2">{label}</span>
      <span className="text-xs font-bold text-[#6B8A00] dark:text-[#BFFF00] tabular-nums shrink-0">{count}</span>
      <span className="text-[10px] text-foreground/40 tabular-nums shrink-0 ml-2">{pct}%</span>
    </div>
  );
};

export const RagDebugStudio = () => {
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [corpusStats, setCorpusStats] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null);

  const loadCorpusStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/rag-corpus-stats');
      setCorpusStats(res.data);
    } catch (e) {
      logger.warn('rag-corpus-stats failed', e);
    }
  }, []);

  useEffect(() => { loadCorpusStats(); }, [loadCorpusStats]);

  const runEnrich = async (dryRun = true) => {
    setEnriching(true);
    setEnrichResult(null);
    try {
      const res = await api.post('/admin/rag-enrich-metadata', { dry_run: dryRun, limit: 2000 });
      setEnrichResult(res.data);
      if (!dryRun) loadCorpusStats();
    } catch (err) {
      logger.error('rag-enrich-metadata failed', err);
      setEnrichResult({ error: err?.response?.data?.detail || 'Enrichment failed' });
    } finally {
      setEnriching(false);
    }
  };

  const runQuery = async (q) => {
    const text = (q || query).trim();
    if (text.length < 3) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/admin/rag-debug', { query: text, match_count: 10, match_threshold: 0.0 });
      setResult(res.data);
    } catch (err) {
      logger.error('rag-debug failed', err);
      setError(err?.response?.data?.detail || 'RAG-Debug fehlgeschlagen');
    } finally {
      setRunning(false);
    }
  };

  const totalChunks = result?.coverage?.chunks_returned || 0;

  return (
    <div className="space-y-6" data-testid="rag-debug-studio">
      {/* Corpus overview */}
      {corpusStats && (
        <Card className="p-5 bg-gradient-to-br from-[#BFFF00]/[0.05] to-transparent border-[#BFFF00]/15">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center">
                <BookOpen size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">WladBot Knowledge Corpus</h3>
                <p className="text-[11px] text-muted-foreground">{corpusStats.total_chunks} Chunks · {corpusStats.unique_courses} Kurse · {corpusStats.unique_themes} Themen</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runEnrich(true)}
                disabled={enriching}
                className="border-white/15 text-foreground/80 hover:text-foreground text-[11px]"
                data-testid="rag-enrich-dryrun-btn"
              >
                {enriching ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                <span className="ml-1.5">Dry-Run</span>
              </Button>
              <Button
                size="sm"
                onClick={() => runEnrich(false)}
                disabled={enriching}
                className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-black font-bold text-[11px]"
                data-testid="rag-enrich-apply-btn"
              >
                {enriching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span className="ml-1.5">Apply Backfill</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(corpusStats.courses).slice(0, 8).map(([c, n]) => (
              <CoverageChip key={c} label={c} count={n} total={corpusStats.total_chunks} />
            ))}
          </div>

          {enrichResult && (
            <div className="mt-4 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.1] dark:border-white/[0.08] text-[11px] text-foreground/80" data-testid="rag-enrich-result">
              {enrichResult.error ? (
                <span className="text-red-400">{enrichResult.error}</span>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B8A00] dark:text-[#BFFF00]">
                      {enrichResult.dry_run ? 'Dry-Run' : 'Applied'}
                    </span>
                    <span>· {enrichResult.enriched_total} enriched · {enrichResult.already_labeled} canonical · {enrichResult.skipped_no_match} no match</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(enrichResult.enriched_by_course || {}).map(([c, n]) => (
                      <span key={c} className="px-2 py-0.5 rounded-full bg-[#BFFF00]/[0.08] border border-[#BFFF00]/15 text-[10px] text-[#6B8A00] dark:text-[#BFFF00] font-semibold">
                        {c} · {n}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Query input */}
      <Card className="p-5 bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
            <Sparkles size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">RAG Query Debugger</h3>
            <p className="text-[11px] text-muted-foreground">Teste welche Chunks WladBot für eine bestimmte Frage retrievt.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="z.B. Wie führe ich ein schwieriges Konfliktgespräch?"
            onKeyDown={(e) => e.key === 'Enter' && !running && runQuery()}
            className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.06] text-foreground placeholder-white/30"
            data-testid="rag-query-input"
          />
          <Button
            onClick={() => runQuery()}
            disabled={running || query.length < 3}
            className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-black font-bold"
            data-testid="rag-query-run-btn"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span className="ml-2">Debug</span>
          </Button>
        </div>

        {/* Sample queries */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); runQuery(q); }}
              disabled={running}
              className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] hover:border-[#BFFF00]/40 text-foreground/70 hover:text-foreground transition-colors disabled:opacity-40"
              data-testid="rag-sample-query"
            >
              {q.slice(0, 50)}{q.length > 50 ? '...' : ''}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-sm text-red-400">{error}</div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Coverage summary */}
          <Card className="p-5 bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.06]" data-testid="rag-coverage-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-foreground/50 uppercase tracking-wider mb-1">Top Score</p>
                <p className="text-2xl font-black" style={{ color: simColor(result.coverage.top_score), fontFamily: 'Outfit, sans-serif' }}>
                  {result.coverage.top_score?.toFixed(3) || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-foreground/50 uppercase tracking-wider mb-1">Avg Score</p>
                <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {result.coverage.avg_score?.toFixed(3) || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-foreground/50 uppercase tracking-wider mb-1">Chunks</p>
                <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{totalChunks}</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground/50 uppercase tracking-wider mb-1">Model</p>
                <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{result.model}</p>
                <p className="text-[10px] text-foreground/40">{result.embedding_dim}-dim</p>
              </div>
            </div>

            {result.warnings?.length > 0 && (
              <div className="space-y-2 mb-4">
                {result.warnings.map((w, i) => (
                  <div key={`warning-${i}-${String(w).slice(0, 24)}`} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-200 leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Course breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BarChart3 size={11} /> Kurse getroffen
                </p>
                <div className="space-y-1.5">
                  {Object.entries(result.coverage.courses).slice(0, 5).map(([c, n]) => (
                    <CoverageChip key={c} label={c} count={n} total={totalChunks} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2">Top Themen</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(result.coverage.themes).slice(0, 12).map(([t, n]) => (
                    <span key={t} className="text-[10px] text-foreground/70 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.04] px-2 py-1 rounded-full">
                      {t} <span className="text-foreground/40">×{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Chunks list */}
          <div className="space-y-2" data-testid="rag-chunks-list">
            {result.chunks.map((c, idx) => (
              <ChunkRow
                key={c.id || idx}
                chunk={c}
                expanded={expanded === c.id}
                onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RagDebugStudio;

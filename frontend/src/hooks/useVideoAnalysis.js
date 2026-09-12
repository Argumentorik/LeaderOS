import { useState, useCallback, useRef } from 'react';
import api from '../lib/api';
import logger from '../lib/logger';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 120;

// Async analyze-job submission + polling (extracted from VideoChallengePage).
export function useVideoAnalysis({ blobRef, ratingConfig, de, onComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [phase, setPhase] = useState({ stage: 'idle', pct: 0 });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const submitVideo = useCallback(async (activeChallenge) => {
    if (!blobRef.current || !activeChallenge) return;
    setAnalyzing(true);
    setPhase({ stage: 'upload', pct: 0 });
    try {
      const formData = new FormData();
      formData.append('file', blobRef.current, 'challenge.webm');
      const params = new URLSearchParams();
      params.set('rating_mode', ratingConfig.mode);
      params.set('rating_level', ratingConfig.level);
      if (ratingConfig.focus?.length) params.set('rating_focus', ratingConfig.focus.join(','));
      params.set('rating_audience', ratingConfig.audience);

      let analysisResult = null;
      try {
        const startRes = await api.post(
          `/video-challenges/${activeChallenge.challenge_id}/analyze-async?${params.toString()}`,
          formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => { if (e.total) setPhase({ stage: 'upload', pct: Math.round((e.loaded / e.total) * 100) }); },
          }
        );
        const jobId = startRes.data?.job_id;
        if (!jobId) throw new Error('no_job_id');
        setPhase({ stage: 'queued', pct: 100 });
        let consecutivePollErrors = 0;
        for (let i = 0; i < MAX_POLLS; i += 1) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          let job;
          try {
            const pollRes = await api.get(`/video-challenges/jobs/${jobId}`);
            job = pollRes.data;
            consecutivePollErrors = 0;
          } catch (pollErr) {
            consecutivePollErrors += 1;
            logger.warn(`poll attempt ${i + 1} failed (${consecutivePollErrors}/5):`, pollErr?.message);
            if (consecutivePollErrors >= 5) throw pollErr;
            continue;
          }
          if (!job || !job.status) continue;
          if (job.status !== 'complete' && job.status !== 'error') setPhase({ stage: job.status, pct: 100 });
          if (job.status === 'complete') { analysisResult = job.analysis; break; }
          if (job.status === 'error') {
            const err = new Error(job.error_detail || 'Analyse fehlgeschlagen');
            err.response = { data: { detail: job.error_detail || 'Analyse fehlgeschlagen' }, status: job.error_code || 500 };
            throw err;
          }
        }
        if (!analysisResult) throw new Error('Zeitüberschreitung — bitte Aufnahme erneut hochladen');
      } catch (asyncErr) {
        if (asyncErr?.response?.status === 404) {
          logger.warn('async endpoint missing, falling back to sync /analyze');
          const res = await api.post(
            `/video-challenges/${activeChallenge.challenge_id}/analyze?${params.toString()}`,
            formData, { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          analysisResult = res.data;
        } else {
          throw asyncErr;
        }
      }

      onCompleteRef.current?.(analysisResult);
    } catch (err) {
      logger.error('Analysis failed:', err);
      const detail = err?.response?.data?.detail || err?.message || (de
        ? 'Analyse konnte nicht abgeschlossen werden. Bitte erneut aufnehmen.'
        : 'Analysis could not be completed. Please record again.');
      try {
        const { toast } = await import('sonner');
        toast.error(detail, { duration: 6000 });
      } catch (toastErr) { logger.warn('toast unavailable:', toastErr?.message); }
    } finally {
      setAnalyzing(false);
      setPhase({ stage: 'idle', pct: 0 });
    }
  }, [blobRef, ratingConfig, de]);

  return { analyzing, submitVideo, phase };
}

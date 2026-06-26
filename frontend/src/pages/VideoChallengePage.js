import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useTier } from '../contexts/TierContext';
import { AnalysisResults } from '../components/video/AnalysisResults';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { TierLockOverlay } from '../components/shared/TierLockOverlay';
import { ChallengeList } from '../components/video/ChallengeList';
import { RecordingStudio } from '../components/video/RecordingStudio';
import { VideoUpsellModal } from '../components/video/VideoUpsellModal';
import { VideoStudioSidebar } from '../components/video/VideoStudioSidebar';
import { SmartConsultationBanner } from '../components/brand/SmartConsultationBanner';
import api from '../lib/api';
import { downloadHTMLReport } from '../lib/reportGenerator';
import { setWladBotPageContext, clearWladBotPageContext } from '../lib/wladbotBus';

const DEFAULT_RATING = { mode: 'hard', level: 'fortgeschritten', focus: [], audience: 'allgemein' };

export default function VideoChallengePage() {
  const { lang } = useLanguage();
  const tierCtx = useTier();
  const isAccelerator = tierCtx.hasFeature('video_analysis');
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [ratingConfig, setRatingConfig] = useState(DEFAULT_RATING);
  const [trial, setTrial] = useState(null);
  // Studio: history list + active entry id
  const [archive, setArchive] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const blobRef = useRef(null);
  const submitVideoRef = useRef(null);  // Iter 92.22: ref so MediaRecorder.onstop can auto-submit
  // Iter 92.23.7 (Mert): keep the recorded video around for replay on the Analysis page
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  const de = lang === 'de';
  const canAccess = isAccelerator || Boolean(trial?.active);

  const saveGlobalPrefs = useCallback(async (newConfig) => {
    setRatingConfig(newConfig);
    try { await api.put('/auth/profile', { rating_preferences: newConfig }); }
    catch (err) { logger.error('Failed to save rating preferences:', err); }
  }, []);

  const loadArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const res = await api.get('/video-archive');
      setArchive(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      logger.error('Failed to load video archive:', err);
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  const loadChallenges = useCallback(async () => {
    try {
      const [challengeRes, prefsRes, trialRes] = await Promise.all([
        api.get('/video-challenges'),
        api.get('/rating-preferences').catch(() => ({ data: {} })),
        api.get('/user/video-trial-status').catch(() => ({ data: null })),
      ]);
      setChallenges(challengeRes.data);
      setTrial(trialRes.data);
      const prefs = prefsRes.data;
      if (prefs && (prefs.mode || prefs.level)) {
        setRatingConfig(prev => ({
          ...prev,
          mode: prefs.mode || prev.mode,
          level: prefs.level || prev.level,
          focus: prefs.focus || prev.focus,
          audience: prefs.audience || prev.audience,
        }));
      }
    } catch (err) { logger.error('Failed to load challenges:', err); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      blobRef.current = new Blob(chunksRef.current, { type: 'video/webm' });
      // Iter 92.23.7: build an object URL so the Analysis page can replay the recording.
      // We revoke any previous URL first to avoid leaks across multiple attempts.
      setRecordedVideoUrl((prev) => {
        if (prev?.startsWith('blob:')) { try { URL.revokeObjectURL(prev); } catch (_) { /* safe-noop: URL already revoked */ } }
        return URL.createObjectURL(blobRef.current);
      });
      setRecorded(true);
      // Iter 92.22 (Mert): Auto-Submit nach Stop. User soll nicht erst auf
      // "Submit" klicken — die Analyse läuft direkt los.
      setTimeout(() => { submitVideoRef.current?.(); }, 250);
    };
    mr.start();
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, [stream]);

  useEffect(() => { loadChallenges(); loadArchive(); }, [loadChallenges, loadArchive]);

  // Iter 92.23.11: deep-link from Dashboard Workspaces — /missions?folder=fld_xxx
  // pre-selects the folder filter in the studio sidebar.
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam && folderParam !== activeFolderId) {
      setActiveFolderId(folderParam);
    }
  }, [searchParams, activeFolderId]);
  useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);
  useEffect(() => {
    if (recording && timer >= (activeChallenge?.time_limit || 180)) stopRecording();
  }, [timer, recording, activeChallenge, stopRecording]);

  // Iter 92.23.11: publish page-context so the FAB drawer can pre-select the
  // user's currently-active folder / entry / page without the user picking it.
  useEffect(() => {
    const activeEntry = archive.find(e => e.entry_id === activeEntryId);
    // Prefer the folder explicitly chosen via the rail; fall back to the
    // folder of the active entry (so opening a historic mission auto-suggests
    // its parent folder).
    const resolvedFolderId = activeFolderId || activeEntry?.folder_id || null;
    setWladBotPageContext({
      folderId: resolvedFolderId,
      entryId: activeEntryId || null,
      entryTitle: activeEntry?.custom_title || activeChallenge?.title || null,
      pageLabel: de ? 'Video Studio' : 'Video Studio',
    });
    return () => clearWladBotPageContext();
  }, [activeFolderId, activeEntryId, archive, activeChallenge, de]);

  const startChallenge = async (challenge) => {
    setActiveChallenge(challenge);
    setAnalysis(null); setRecorded(false); setTimer(0);
    setActiveEntryId(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.muted = true; }
    } catch (err) {
      logger.error('Camera access denied:', err);
      const msg = de
        ? 'Kamera-Zugriff verweigert. Bitte in deinen Browser-Einstellungen erlauben und neu laden.'
        : 'Camera access denied. Please allow it in browser settings and reload.';
      try { (await import('sonner')).toast.error(msg); }
      catch (toastErr) { logger.warn('toast unavailable:', toastErr?.message); }
    }
  };

  const submitVideo = async () => {
    if (!blobRef.current || !activeChallenge) return;
    setAnalyzing(true);
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
          formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const jobId = startRes.data?.job_id;
        if (!jobId) throw new Error('no_job_id');
        const POLL_INTERVAL_MS = 2500;
        const MAX_POLLS = 120;
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
            logger.warn(`poll attempt ${i+1} failed (${consecutivePollErrors}/5):`, pollErr?.message);
            if (consecutivePollErrors >= 5) throw pollErr;
            continue;
          }
          if (!job || !job.status) continue;
          if (job.status === 'complete') {
            analysisResult = job.analysis;
            break;
          }
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

      setAnalysis(analysisResult);
      setActiveEntryId(analysisResult?.entry_id || null);
      if (analysisResult?._trial) setTrial(analysisResult._trial);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
      // Refresh the sidebar so the new mission appears immediately.
      loadArchive();
    } catch (err) {
      logger.error('Analysis failed:', err);
      const detail = err?.response?.data?.detail || err?.message || (de
        ? 'Analyse konnte nicht abgeschlossen werden. Bitte erneut aufnehmen.'
        : 'Analysis could not be completed. Please record again.');
      try {
        const { toast } = await import('sonner');
        toast.error(detail, { duration: 6000 });
      } catch (toastErr) { logger.warn('toast unavailable:', toastErr?.message); }
    }
    finally { setAnalyzing(false); }
  };
  submitVideoRef.current = submitVideo;

  const resetChallenge = () => {
    setActiveChallenge(null); setAnalysis(null); setRecorded(false);
    setRecording(false); setTimer(0); setActiveEntryId(null);
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  };

  const handleDownloadReport = () => {
    if (!analysis || !activeChallenge) return;
    downloadHTMLReport({
      title: `Mission: ${activeChallenge.title}`,
      subtitle: activeChallenge.description,
      analysis, challenge: activeChallenge,
      scores: [
        { label: 'Gesamt',       value: analysis.overall_score || 0,    color: '#F59E0B' },
        { label: 'Klarheit',     value: analysis.clarity_score || 0,    color: '#2563EB' },
        { label: 'Souveränität', value: analysis.confidence_score || 0, color: '#7C3AED' },
        { label: 'Empathie',     value: analysis.empathy_score || 0,    color: '#EC4899' },
        { label: 'Struktur',     value: analysis.structure_score || 0,  color: '#10B981' },
      ],
      sections: [
        ...(analysis.wlad_assessment ? [{ title: 'Wlads persönliches Feedback', content: analysis.wlad_assessment, type: 'info' }] : []),
        ...(analysis.transcript ? [{ title: 'Dein Transkript', content: `"${analysis.transcript}"` }] : []),
        ...(analysis.strengths?.length ? [{ title: 'Deine Stärken', content: analysis.strengths, type: 'success' }] : []),
        ...(analysis.improvements?.length ? [{ title: 'Verbesserungspotenzial', content: analysis.improvements, type: 'warning' }] : []),
      ],
    });
  };

  // Studio sidebar handlers — pick a historical entry → load its analysis read-only.
  const handlePickEntry = (entry) => {
    if (recording) return; // don't yank the user out of a live recording
    const challenge = challenges.find(c => c.challenge_id === entry.challenge_id) || {
      title: entry.custom_title || 'Mission',
      description: '',
    };
    setActiveChallenge(challenge);
    // Inject entry_id so the AnalysisResults page can show the "Add to folder"
    // and "Share" CTAs for historical entries too (Iter 92.23.7).
    setAnalysis(entry.analysis ? { ...entry.analysis, entry_id: entry.entry_id } : null);
    setActiveEntryId(entry.entry_id);
    setRecorded(false);
    setRecording(false);
    // History entries don't have a local blob → no replay button on those.
    if (recordedVideoUrl?.startsWith('blob:')) {
      try { URL.revokeObjectURL(recordedVideoUrl); } catch (_) { /* safe-noop: URL already revoked */ }
    }
    setRecordedVideoUrl(null);
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  };

  const handleNewMission = () => {
    resetChallenge();
  };

  const handleRenameEntry = async (entryId, newTitle) => {
    const title = (newTitle || '').trim();
    if (!title) return;
    // Optimistic update for snappy UX
    setArchive(prev => prev.map(e => e.entry_id === entryId ? { ...e, custom_title: title } : e));
    try {
      await api.patch(`/video-archive/${entryId}`, { title });
    } catch (err) {
      logger.error('Rename failed:', err);
      loadArchive();
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Umbenennen fehlgeschlagen' : 'Rename failed');
      } catch (_) { /* safe-noop: sonner failed to import — primary error already logged above */ }
    }
  };

  const handleDeleteEntry = async (entryId) => {
    // Optimistic remove
    setArchive(prev => prev.filter(e => e.entry_id !== entryId));
    if (activeEntryId === entryId) {
      setAnalysis(null); setActiveEntryId(null);
    }
    try {
      await api.delete(`/video-archive/${entryId}`);
    } catch (err) {
      logger.error('Delete failed:', err);
      loadArchive();
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Löschen fehlgeschlagen' : 'Delete failed');
      } catch (_) { /* safe-noop: sonner failed to import — primary error already logged above */ }
    }
  };

  return (
    <DashboardLayout>
      {!canAccess && !tierCtx.loading && <TierLockOverlay feature="video_analysis" requiredTier="accelerator" de={de} />}
      <LoadingOverlay isOpen={analyzing} flow="video" de={de} />
      {/* Iter 92.34 (Mert Go-Live §B): Video Studio Sidebar nach RECHTS. Reverse
          row order on desktop so the studio (mission list/history) sits far right
          and the main player+analysis takes the prime left/center reading slot. */}
      <div className="flex flex-col lg:flex-row-reverse min-h-screen" data-testid="video-studio-shell">
        <VideoStudioSidebar
          entries={archive}
          challenges={challenges}
          activeEntryId={activeEntryId}
          loading={archiveLoading}
          onPickEntry={handlePickEntry}
          onNewMission={handleNewMission}
          onRename={handleRenameEntry}
          onDelete={handleDeleteEntry}
          activeFolderId={activeFolderId}
          onPickFolder={(f) => setActiveFolderId(f?.folder_id || null)}
          de={de}
        />

        <div className="flex-1 min-w-0 p-6 lg:p-10 max-w-4xl mx-auto bg-gradient-mesh" data-testid="video-challenge-page">
          {showUpsell && <VideoUpsellModal onClose={() => setShowUpsell(false)} lang={lang} />}
          {/* Iter 92.28: slim Beratungs-Bar above the studio — non-intrusive but always one tap away */}
          <div className="mb-5">
            <SmartConsultationBanner placement="missions-top" compact />
          </div>

          {/* Trial banner — visible for Free/Standard users with active trial */}
          {!isAccelerator && trial?.eligible && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 flex items-center gap-3 ${trial.active ? 'bg-[#BFFF00]/10 border-[#BFFF00]/30' : 'bg-rose-500/5 border-rose-500/20'}`} data-testid="video-trial-banner">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${trial.active ? 'bg-[#BFFF00] text-[#0A0A0A]' : 'bg-rose-500/15 text-rose-500'}`}>
                <span className="text-[13px] font-black">{trial.remaining}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold leading-tight" data-testid="video-trial-headline">
                  {trial.active
                    ? (de
                        ? `Du hast ${trial.remaining} von ${trial.total} kostenlosen Video-Analysen übrig`
                        : `${trial.remaining} of ${trial.total} free video analyses remaining`)
                    : (de
                        ? 'Dein gratis Video-Analyse-Kontingent ist aufgebraucht'
                        : 'Your free video analysis quota is used up')
                  }
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {trial.active
                    ? (de
                        ? `Probier-Phase läuft noch ${trial.days_left} Tage — danach exklusiv im Leadership OS PLUS.`
                        : `Trial ends in ${trial.days_left} days — then PLUS exclusive.`)
                    : (de
                        ? 'Upgrade auf Leadership OS PLUS für unbegrenzte Analysen.'
                        : 'Upgrade to Leadership OS PLUS for unlimited analyses.')
                  }
                </p>
              </div>
            </div>
          )}

          {!activeChallenge && !analysis && (
            <ChallengeList
              challenges={challenges}
              ratingConfig={ratingConfig}
              onSaveRatingConfig={saveGlobalPrefs}
              onStartChallenge={startChallenge}
              lang={lang}
            />
          )}

          {activeChallenge && !analysis && (
            <RecordingStudio
              activeChallenge={activeChallenge}
              recording={recording} recorded={recorded} analyzing={analyzing}
              timer={timer} videoRef={videoRef}
              ratingConfig={ratingConfig} onSaveRatingConfig={saveGlobalPrefs}
              onCancel={resetChallenge}
              onStartRecording={startRecording} onStopRecording={stopRecording}
              onReset={() => { setRecorded(false); setTimer(0); }}
              onSubmit={submitVideo}
              lang={lang}
            />
          )}

          {analysis && (
            <AnalysisResults
              analysis={analysis}
              activeChallenge={activeChallenge}
              resetChallenge={resetChallenge}
              handleDownloadReport={handleDownloadReport}
              setShowUpsell={setShowUpsell}
              lang={lang}
              isAccelerator={isAccelerator}
              videoUrl={recordedVideoUrl}
              onReplay={(challenge) => {
                setAnalysis(null);
                setRecorded(false);
                setRecording(false);
                setTimer(0);
                setActiveEntryId(null);
                blobRef.current = null;
                if (recordedVideoUrl?.startsWith('blob:')) {
                  try { URL.revokeObjectURL(recordedVideoUrl); } catch (_) { /* safe-noop: URL already revoked */ }
                }
                setRecordedVideoUrl(null);
                if (challenge) startChallenge(challenge);
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

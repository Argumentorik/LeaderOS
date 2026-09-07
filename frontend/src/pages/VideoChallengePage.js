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
import { VideoTrialBanner } from '../components/video/VideoTrialBanner';
import { FeatureVideoSection } from '../components/guide/FeatureVideoSection';
import { SmartConsultationBanner } from '../components/brand/SmartConsultationBanner';
import api from '../lib/api';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis';
import { downloadHTMLReport } from '../lib/reportGenerator';
import { setWladBotPageContext, clearWladBotPageContext } from '../lib/wladbotBus';

const DEFAULT_RATING = { mode: 'hard', level: 'fortgeschritten', focus: [], audience: 'allgemein' };

const STUDIO_CLIPS = ['bp-missionen', 'bp-video-analyse'];

export default function VideoChallengePage() {
  const { lang } = useLanguage();
  const tierCtx = useTier();
  const isAccelerator = tierCtx.hasFeature('video_analysis');
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [ratingConfig, setRatingConfig] = useState(DEFAULT_RATING);
  const [trial, setTrial] = useState(null);
  const [archive, setArchive] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [searchParams] = useSearchParams();
  const submitRef = useRef(null); // MediaRecorder.onstop → auto-submit

  const de = lang === 'de';
  const canAccess = isAccelerator || Boolean(trial?.active);

  const recorder = useVideoRecorder({
    onRecordingComplete: () => submitRef.current?.(),
  });
  const {
    recording, recorded, timer, recordedVideoUrl, videoRef, blobRef,
    startRecording, stopRecording, acquireStream, releaseStream,
    clearRecordedVideo, resetRecorder, setRecorded, setTimer,
  } = recorder;

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

  const handleAnalysisComplete = useCallback((analysisResult) => {
    setAnalysis(analysisResult);
    setActiveEntryId(analysisResult?.entry_id || null);
    if (analysisResult?._trial) setTrial(analysisResult._trial);
    releaseStream();
    loadArchive();
  }, [releaseStream, loadArchive]);

  const { analyzing, submitVideo } = useVideoAnalysis({
    blobRef, ratingConfig, de,
    onComplete: handleAnalysisComplete,
  });
  submitRef.current = () => submitVideo(activeChallenge);

  const saveGlobalPrefs = useCallback(async (newConfig) => {
    setRatingConfig(newConfig);
    try { await api.put('/auth/profile', { rating_preferences: newConfig }); }
    catch (err) { logger.error('Failed to save rating preferences:', err); }
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

  useEffect(() => { loadChallenges(); loadArchive(); }, [loadChallenges, loadArchive]);

  // Deep-link from Dashboard Workspaces — /missions?folder=fld_xxx
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam && folderParam !== activeFolderId) {
      setActiveFolderId(folderParam);
    }
  }, [searchParams, activeFolderId]);

  useEffect(() => {
    if (recording && timer >= (activeChallenge?.time_limit || 180)) stopRecording();
  }, [timer, recording, activeChallenge, stopRecording]);

  // Publish page-context so the WladBot FAB drawer pre-selects folder/entry.
  useEffect(() => {
    const activeEntry = archive.find(e => e.entry_id === activeEntryId);
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
    setAnalysis(null);
    resetRecorder();
    setActiveEntryId(null);
    try {
      await acquireStream();
    } catch (err) {
      logger.error('Camera access denied:', err);
      const msg = de
        ? 'Kamera-Zugriff verweigert. Bitte in deinen Browser-Einstellungen erlauben und neu laden.'
        : 'Camera access denied. Please allow it in browser settings and reload.';
      try { (await import('sonner')).toast.error(msg); }
      catch (toastErr) { logger.warn('toast unavailable:', toastErr?.message); }
    }
  };

  const resetChallenge = () => {
    setActiveChallenge(null);
    setAnalysis(null);
    resetRecorder();
    setActiveEntryId(null);
    releaseStream();
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

  // Studio sidebar — pick a historical entry → load its analysis read-only.
  const handlePickEntry = (entry) => {
    if (recording) return; // don't yank the user out of a live recording
    const challenge = challenges.find(c => c.challenge_id === entry.challenge_id) || {
      title: entry.custom_title || 'Mission',
      description: '',
    };
    setActiveChallenge(challenge);
    setAnalysis(entry.analysis ? { ...entry.analysis, entry_id: entry.entry_id } : null);
    setActiveEntryId(entry.entry_id);
    setRecorded(false);
    clearRecordedVideo(); // history entries have no local blob → no replay
    releaseStream();
  };

  const handleRenameEntry = async (entryId, newTitle) => {
    const title = (newTitle || '').trim();
    if (!title) return;
    setArchive(prev => prev.map(e => e.entry_id === entryId ? { ...e, custom_title: title } : e));
    try {
      await api.patch(`/video-archive/${entryId}`, { title });
    } catch (err) {
      logger.error('Rename failed:', err);
      loadArchive();
      try {
        const { toast } = await import('sonner');
        toast.error(de ? 'Umbenennen fehlgeschlagen' : 'Rename failed');
      } catch (toastErr) { logger.warn('Toast unavailable after rename failure', toastErr); }
    }
  };

  const handleDeleteEntry = async (entryId) => {
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
      } catch (toastErr) { logger.warn('Toast unavailable after delete failure', toastErr); }
    }
  };

  return (
    <DashboardLayout>
      {!canAccess && !tierCtx.loading && <TierLockOverlay feature="video_analysis" requiredTier="accelerator" de={de} />}
      <LoadingOverlay isOpen={analyzing} flow="video" de={de} />
      <div className="flex flex-col lg:flex-row-reverse min-h-screen" data-testid="video-studio-shell">
        <VideoStudioSidebar
          entries={archive}
          challenges={challenges}
          activeEntryId={activeEntryId}
          loading={archiveLoading}
          onPickEntry={handlePickEntry}
          onNewMission={resetChallenge}
          onRename={handleRenameEntry}
          onDelete={handleDeleteEntry}
          activeFolderId={activeFolderId}
          onPickFolder={(f) => setActiveFolderId(f?.folder_id || null)}
          de={de}
        />

        <div className="flex-1 min-w-0 p-6 lg:p-10 max-w-4xl mx-auto bg-gradient-mesh" data-testid="video-challenge-page">
          {showUpsell && <VideoUpsellModal onClose={() => setShowUpsell(false)} lang={lang} />}
          <div className="mb-5">
            <SmartConsultationBanner placement="missions-top" compact />
          </div>

          {!isAccelerator && trial?.eligible && <VideoTrialBanner trial={trial} de={de} />}

          {!activeChallenge && !analysis && <FeatureVideoSection slugs={STUDIO_CLIPS} de={de} />}

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
              onSubmit={() => submitVideo(activeChallenge)}
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
                resetRecorder();
                setActiveEntryId(null);
                clearRecordedVideo();
                if (challenge) startChallenge(challenge);
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

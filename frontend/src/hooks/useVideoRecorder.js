import { useState, useRef, useCallback, useEffect } from 'react';
import logger from '../lib/logger';

// Encapsulates camera stream + MediaRecorder + timer + recorded blob handling
// (extracted from VideoChallengePage as part of the componentization refactor).
export function useVideoRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const blobRef = useRef(null);
  const onCompleteRef = useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;

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
      setRecordedVideoUrl((prev) => {
        if (prev?.startsWith('blob:')) { try { URL.revokeObjectURL(prev); } catch (_) { /* safe-noop */ } }
        return URL.createObjectURL(blobRef.current);
      });
      setRecorded(true);
      // Auto-submit shortly after stop — user shouldn't need a second click.
      setTimeout(() => { onCompleteRef.current?.(); }, 250);
    };
    mr.start();
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, [stream]);

  const acquireStream = useCallback(async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(s);
    if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.muted = true; }
    return s;
  }, []);

  const releaseStream = useCallback(() => {
    setStream((s) => {
      if (s) s.getTracks().forEach(t => t.stop());
      return null;
    });
  }, []);

  const clearRecordedVideo = useCallback(() => {
    blobRef.current = null;
    setRecordedVideoUrl((prev) => {
      if (prev?.startsWith('blob:')) { try { URL.revokeObjectURL(prev); } catch (_) { /* safe-noop */ } }
      return null;
    });
  }, []);

  const resetRecorder = useCallback(() => {
    setRecorded(false);
    setRecording(false);
    setTimer(0);
    clearInterval(timerRef.current);
  }, []);

  // Release camera on unmount
  useEffect(() => () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }, [stream]);

  return {
    recording, recorded, timer, stream, recordedVideoUrl,
    videoRef, blobRef,
    startRecording, stopRecording, acquireStream, releaseStream,
    clearRecordedVideo, resetRecorder, setRecorded, setTimer,
    logCameraError: (err) => logger.error('Camera access denied:', err),
  };
}

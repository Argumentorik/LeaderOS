import api from './api';

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

/**
 * Video in Stücken hochladen (init → chunk … → complete).
 * Große Dateien laufen so am Proxy-Limit vorbei; Fortschritt und Phase kommen per Callback.
 * Jedes Stück nennt seine Position (X-Chunk-Offset) — ein Wiederholungsversuch landet
 * dadurch an derselben Stelle statt doppelt am Dateiende.
 */
export const uploadVideoInChunks = async ({ file, target, targetId, onProgress, shouldAbort }) => {
  const init = await api.post('/media/upload/init', {
    target, target_id: targetId, filename: file.name, size: file.size, content_type: file.type || '',
  });
  const { upload_id: uploadId, chunk_size: chunkSize } = init.data;

  const sendChunk = async (blob, offset) => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await api.post(`/media/upload/${uploadId}/chunk`, blob, {
          headers: { 'Content-Type': 'application/octet-stream', 'X-Chunk-Offset': String(offset) },
        });
      } catch (e) {
        lastErr = e;
        const status = e?.response?.status;
        if (status && !RETRYABLE_STATUS.has(status)) throw e;   // echter Serverfehler → nicht blind wiederholen
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
    throw lastErr;
  };

  try {
    for (let start = 0; start < file.size; start += chunkSize) {
      if (shouldAbort?.()) throw new Error('cancelled');
      const blob = file.slice(start, Math.min(start + chunkSize, file.size));
      const res = await sendChunk(blob, start);
      const sent = res?.data?.received ?? start + blob.size;
      onProgress?.({ phase: 'uploading', percent: Math.round((sent / file.size) * 100) });
    }
    onProgress?.({ phase: 'processing', percent: 100 });
    const done = await api.post(`/media/upload/${uploadId}/complete`);
    onProgress?.({ phase: 'done', percent: 100 });
    return done.data;
  } catch (err) {
    api.delete(`/media/upload/${uploadId}`).catch(() => {});
    throw err;
  }
};

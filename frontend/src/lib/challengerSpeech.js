import { registerAudio, stopAllAudio } from './audioBus';

/* Strip markdown bold from AI text */
export const cleanText = (t) => (t || '').replace(/\*\*/g, '').replace(/\*/g, '');

/* Browser TTS fallback (used if ElevenLabs fails) */
export const browserSpeak = (text, lang = 'de') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanText(text));
  u.lang = lang === 'de' ? 'de-DE' : 'en-US';
  u.rate = 0.95;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
};

export const stopSpeaking = () => {
  // Central bus kills SpeechSynthesis AND every registered <audio> element at once.
  stopAllAudio('challenger-page');
};

/* ElevenLabs persona TTS — falls back to browser synthesis if API fails */
export const speakPersona = async (text, persona, api, lang = 'de') => {
  stopSpeaking();
  const clean = cleanText(text).slice(0, 800);
  if (!clean || !persona) return;
  try {
    const res = await api.post('/voice/tts', { text: clean, persona });
    const audio = new Audio(res.data.audio_url);
    registerAudio(audio);
    await audio.play();
  } catch {
    browserSpeak(clean, lang);
  }
};

export const initials = (name) => (name || '').split(' ').map((n) => n[0]).join('');

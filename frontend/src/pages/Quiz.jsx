import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestionsForRole, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight, Check, Mic, Square, Play, RotateCcw, Loader2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [userRole, setUserRole] = useState('selbststaendige');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const user = localStorage.getItem("emergent_user");
    if (!user) {
      navigate("/diagnose");
      return;
    }
    
    const userData = JSON.parse(user);
    const role = userData.role || 'selbststaendige';
    setUserRole(role);
    
    // Get role-specific questions
    const roleQuestions = getQuestionsForRole(role);
    setQuestions(roleQuestions);
  }, [navigate]);

  const question = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;
  const isVoiceQuestion = question?.isVoice || false;

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscript("");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Mikrofon-Zugriff nicht möglich. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await fetch(`${API}/api/voice/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscript("Transkription fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
  };

  const submitVoiceAnswer = () => {
    if (!transcript) return;

    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        question_id: question.id,
        category: question.category,
        layer: question.layer,
        score: 3, // Default score for voice answers
        voice_transcript: transcript
      }
    }));

    // Move to next question
    if (current < questions.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => c + 1);
        resetRecording();
        setAnimating(false);
      }, 300);
    }
  };

  const handleSelect = (option) => {
    if (animating || selected !== null || isVoiceQuestion) return;
    setSelected(option.id);

    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [question.id]: { 
          question_id: question.id,
          category: question.category, 
          layer: question.layer,
          score: option.score
        }
      }));

      if (current < questions.length - 1) {
        setAnimating(true);
        setTimeout(() => {
          setCurrent(c => c + 1);
          setSelected(null);
          setAnimating(false);
        }, 300);
      } else {
        setSelected(null);
      }
    }, 400);
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setSelected(null);
      resetRecording();
    }
  };

  const handleSubmit = () => {
    const answersArray = Object.values(answers);
    const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
    navigate("/analyzing", { state: { answers: answersArray, session_id: user.session_id || user.user_id } });
  };

  if (!question) return null;

  const catColor = CATEGORY_COLORS[question.category] || "#3B82F6";
  const answeredCount = Object.keys(answers).length;
  const canProceed = isVoiceQuestion ? !!transcript : !!answers[question.id];

  return (
    <div className="min-h-screen bg-[#030303] pt-20 px-4 pb-12" data-testid="quiz-page">
      {/* Progress Bar - Fixed */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#030303]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-inter text-xs text-slate-500">
            Frage {current + 1} von {questions.length}
          </span>
          <div className="flex items-center gap-2">
            {isVoiceQuestion && (
              <span className="badge-amber px-2 py-0.5 text-xs flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Sprachfrage
              </span>
            )}
            <span 
              className="badge-blue px-3 py-1 text-xs" 
              style={{ borderColor: `${catColor}30`, background: `${catColor}10`, color: catColor }}
            >
              {CATEGORIES[question.category]}
            </span>
          </div>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div 
        className="max-w-2xl mx-auto pt-16"
        style={{ 
          opacity: animating ? 0 : 1, 
          transform: animating ? 'translateX(-20px)' : 'translateX(0)',
          transition: "all 0.3s ease" 
        }}
      >
        {/* Scenario */}
        <div className="glass-card-subtle p-5 mb-6" data-testid="question-scenario">
          <span className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-2 block">
            Szenario
          </span>
          <p className="font-inter text-slate-300 leading-relaxed">
            {question.scenario}
          </p>
        </div>

        {/* Question */}
        <h2 className="font-manrope font-bold text-xl md:text-2xl text-white mb-8" data-testid="question-text">
          {question.question}
        </h2>

        {/* Voice Recording UI */}
        {isVoiceQuestion ? (
          <div className="glass-card p-6 mb-10" data-testid="voice-recording">
            <div className="text-center">
              {/* Recording button */}
              {!audioUrl && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                    isRecording 
                      ? "bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                      : "bg-gradient-to-br from-amber-500 to-orange-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                  }`}
                  data-testid="record-button"
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              )}

              {isRecording && (
                <p className="font-inter text-red-400 animate-pulse mb-4">
                  Aufnahme läuft...
                </p>
              )}

              {!isRecording && !audioUrl && (
                <p className="font-inter text-slate-500 text-sm">
                  Klicke zum Aufnehmen (30-90 Sekunden empfohlen)
                </p>
              )}

              {/* Playback and transcription */}
              {audioUrl && (
                <div className="space-y-4">
                  <audio src={audioUrl} controls className="w-full" />
                  
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={resetRecording}
                      className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Neu aufnehmen
                    </button>
                    
                    {!transcript && (
                      <button
                        onClick={transcribeAudio}
                        disabled={isTranscribing}
                        className="btn-amber px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Wird transkribiert...
                          </>
                        ) : (
                          "Transkribieren"
                        )}
                      </button>
                    )}
                  </div>

                  {/* Transcript display */}
                  {transcript && (
                    <div className="mt-4 p-4 glass-card-subtle rounded-xl text-left">
                      <p className="font-inter text-xs text-slate-500 mb-2">Deine Antwort:</p>
                      <p className="font-inter text-slate-300 leading-relaxed">{transcript}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Multiple Choice Options */
          <div className="space-y-3 mb-10" data-testid="question-options">
            {question.options.map((option) => {
              const isSelected = selected === option.id;
              const wasAnswered = answers[question.id]?.id === option.id;
              const isActive = isSelected || wasAnswered;

              return (
                <button
                  key={option.id}
                  data-testid={`option-${option.id}`}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${
                    isActive
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`font-manrope font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 text-slate-500 border border-white/10"
                    }`}
                  >
                    {isActive ? <Check className="w-4 h-4" /> : option.id.toUpperCase()}
                  </span>
                  <span className={`font-inter text-sm leading-relaxed pt-1 ${
                    isActive ? "text-white" : "text-slate-300"
                  }`}>
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            data-testid="quiz-prev"
            onClick={handlePrev}
            disabled={current === 0}
            className="flex items-center gap-2 font-inter text-sm text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-full px-4 py-2 hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <div className="flex items-center gap-3">
            <span className="font-inter text-xs text-slate-600">
              {answeredCount} / {questions.length} beantwortet
            </span>
          </div>

          {/* Voice question submit button */}
          {isVoiceQuestion && transcript && (
            <button
              onClick={current === questions.length - 1 ? handleSubmit : submitVoiceAnswer}
              className="btn-amber px-6 py-3 font-medium flex items-center gap-2"
              data-testid="voice-submit"
            >
              {current === questions.length - 1 ? "Diagnose abschließen" : "Weiter"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Regular question navigation */}
          {!isVoiceQuestion && current === questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-submit"
              onClick={handleSubmit}
              className="btn-amber px-6 py-3 font-medium flex items-center gap-2"
            >
              Diagnose abschließen
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {!isVoiceQuestion && current < questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-next"
              onClick={() => {
                setCurrent(c => c + 1);
                setSelected(null);
              }}
              className="flex items-center gap-2 font-inter text-sm text-slate-400 hover:text-white transition-colors rounded-full px-4 py-2 hover:bg-white/5"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

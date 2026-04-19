import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestionsForRole, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight, Check, Bot, Send, Sparkles, ArrowRight } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function WladBotChat({ onContinue }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, ich bin der WladBot! Glückwunsch – du hast gerade alle 30 Fragen durchgezogen. Respekt. Bevor ich deinen Report erstelle, wollte ich kurz mit dir sprechen. Was ist gerade deine größte Leadership-Herausforderung?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const bottomRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/coach/chat`, {
        session_id: user.session_id || "demo",
        message: `[Vor-Report Gespräch] Der Nutzer hat gerade 30 Diagnose-Fragen beantwortet. Sei nahbar, empathisch und wie ein erfahrener Freund (Wlad). Antworte kurz (2-3 Sätze) und persönlich auf: ${text}`,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res.data.response }]);
      setExchangeCount(c => c + 1);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Danke fürs Teilen. Lass uns jetzt deinen Report anschauen – ich bin gespannt!" }]);
      setExchangeCount(c => c + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="wladbot-q30">
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/15 flex items-center justify-center mx-auto mb-5">
            <Bot className="w-10 h-10 text-[#C8FF00]" />
          </div>
          <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-2">
            WladBot möchte dich kennenlernen
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF00] animate-pulse" />
            <span className="font-inter text-sm text-slate-400">Wlad ist online</span>
          </div>
          <p className="font-inter text-sm text-slate-500 max-w-md mx-auto">
            Ein kurzes Gespräch, bevor dein personalisierter Report erstellt wird. Optional, aber wertvoll.
          </p>
        </div>

        {/* Chat */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 mb-6" style={{ maxHeight: "380px", overflowY: "auto" }}>
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-[#C8FF00]/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#C8FF00]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 font-inter text-sm leading-relaxed rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[#C8FF00]/10 text-white border border-[#C8FF00]/15 rounded-tr-md"
                    : "bg-white/[0.04] text-slate-200 border border-white/[0.06] rounded-tl-md"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C8FF00]/[0.08] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#C8FF00]" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] px-5 py-3.5 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#C8FF00] analyzing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 mb-8">
          <input
            data-testid="wladbot-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Schreib Wlad etwas..."
            disabled={loading}
            className="flex-1 h-14 px-5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/30 focus:outline-none transition-colors"
          />
          <button
            data-testid="wladbot-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-14 h-14 rounded-xl bg-[#C8FF00] flex items-center justify-center hover:bg-[#d4ff33] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Continue */}
        <button
          data-testid="wladbot-continue"
          onClick={onContinue}
          className="w-full py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-base flex items-center justify-center gap-3 hover:bg-[#d4ff33] transition-all shadow-lg shadow-[#C8FF00]/15"
        >
          <Sparkles className="w-5 h-5" />
          Deinen 30-Tage-Plan aktivieren
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="font-inter text-xs text-slate-600 text-center mt-4">
          Du kannst auch direkt fortfahren – das Gespräch ist optional
        </p>
      </div>
    </div>
  );
}

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [showWladBot, setShowWladBot] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("emergent_user");
    if (!stored) { navigate("/diagnose"); return; }
    const userData = JSON.parse(stored);
    const role = userData.role || 'selbststaendige';
    setQuestions(getQuestionsForRole(role));
  }, [navigate]);

  const question = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  const handleSelect = (option) => {
    if (animating || selected !== null) return;
    setSelected(option.id);
    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [question.id]: { question_id: question.id, category: question.category, layer: question.layer, score: option.score }
      }));
      if (current < questions.length - 1) {
        setAnimating(true);
        setTimeout(() => { setCurrent(c => c + 1); setSelected(null); setAnimating(false); }, 300);
      } else {
        setTimeout(() => { setSelected(null); setShowWladBot(true); }, 300);
      }
    }, 400);
  };

  const handleSubmit = () => {
    const answersArray = Object.values(answers);
    const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
    navigate("/analyzing", { state: { answers: answersArray, session_id: user.session_id || user.user_id } });
  };

  if (!question) return null;
  const catColor = CATEGORY_COLORS[question.category] || "#F59E0B";
  const answeredCount = Object.keys(answers).length;

  if (showWladBot) {
    return <WladBotChat onContinue={handleSubmit} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 pb-12" data-testid="quiz-page">
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-inter text-xs text-slate-500">Frage {current + 1} von {questions.length}</span>
          <span className="badge-blue px-3 py-1 text-xs" style={{ borderColor: `${catColor}30`, background: `${catColor}10`, color: catColor }}>
            {CATEGORIES[question.category]}
          </span>
        </div>
        <div className="h-1 bg-white/[0.04]">
          <div className="h-full bg-[#C8FF00] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-16" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateX(-20px)' : 'translateX(0)', transition: "all 0.3s ease" }}>
        <div className="glass-card-subtle p-5 mb-6" data-testid="question-scenario">
          <span className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-2 block">Szenario</span>
          <p className="font-inter text-slate-300 leading-relaxed">{question.scenario}</p>
        </div>
        <h2 className="font-manrope font-bold text-xl md:text-2xl text-white mb-8" data-testid="question-text">{question.question}</h2>
        <div className="space-y-3 mb-10" data-testid="question-options">
          {question.options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button key={option.id} data-testid={`option-${option.id}`} onClick={() => handleSelect(option)} disabled={selected !== null}
                className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${isSelected ? "border-[#C8FF00]/40 bg-[#C8FF00]/[0.06]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                <span className={`font-manrope font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#C8FF00] text-[#0a0a0a]" : "bg-white/[0.04] text-slate-500 border border-white/[0.08]"}`}>
                  {isSelected ? <Check className="w-4 h-4" /> : option.id.toUpperCase()}
                </span>
                <span className={`font-inter text-sm leading-relaxed pt-1 ${isSelected ? "text-white" : "text-slate-300"}`}>{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button data-testid="quiz-prev" onClick={() => { if (current > 0) { setCurrent(c => c - 1); setSelected(null); } }} disabled={current === 0}
            className="flex items-center gap-2 font-inter text-sm text-slate-500 hover:text-white transition-colors disabled:opacity-30 rounded-full px-4 py-2 hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" /> Zurück
          </button>
          <span className="font-inter text-xs text-slate-600">{answeredCount} / {questions.length} beantwortet</span>
          {current < questions.length - 1 && answers[question.id] !== undefined && (
            <button data-testid="quiz-next" onClick={() => { setCurrent(c => c + 1); setSelected(null); }}
              className="flex items-center gap-2 font-inter text-sm text-slate-400 hover:text-white transition-colors rounded-full px-4 py-2 hover:bg-white/5">
              Weiter <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
